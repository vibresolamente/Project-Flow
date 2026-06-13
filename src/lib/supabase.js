import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL    || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Synchronous check of cached offline mode to prevent WebSocket spin-up on boot
const isCachedOffline = localStorage.getItem('pf_supabase_offline') === 'true';

export const isDbConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  !isCachedOffline;

// Robust fetch wrapper that retries transient failures (e.g. network drops, HTTP/2 stream refusals, or rate limits)
const retryFetch = async (url, options) => {
  const maxRetries = 3;
  const initialDelay = 150;
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, options);
      // Retry for transient server/rate-limit status codes (429, 502, 503, 504)
      if (
        (response.status === 429 || 
         response.status === 502 || 
         response.status === 503 || 
         response.status === 504) && 
        attempt < maxRetries
      ) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 50;
        console.warn(`[Supabase Fetch] Status ${response.status}. Retrying in ${Math.round(delay)}ms (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 50;
        console.warn(`[Supabase Fetch] Connection failure or stream refused. Retrying in ${Math.round(delay)}ms (Attempt ${attempt}/${maxRetries})...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

export const supabase = isDbConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: retryFetch,
      },
      realtime: {
        params: {
          eventsPerSecond: 40,
        },
        config: {
          broadcast: { self: true, ack: false },
        }
      }
    })
  : null;

export const isCloudOffline = isCachedOffline;

// Asynchronous background reachability verification
if (supabaseUrl && !supabaseUrl.includes('YOUR_PROJECT_ID')) {
  setTimeout(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // Check rest/v1 endpoint (gives 401 instead of 404, or we can just fetch with anon key to be silent)
    fetch(`${supabaseUrl}/rest/v1/pf_users?select=id&limit=1`, { 
      method: 'GET', 
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: controller.signal 
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (res.status >= 200 && res.status < 500) {
          if (localStorage.getItem('pf_supabase_offline') === 'true') {
            localStorage.removeItem('pf_supabase_offline');
            console.log('[DB] Supabase resolved. Reconnecting cloud nodes...');
            window.location.reload();
          }
        } else {
          throw new Error('Unreachable status');
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        if (localStorage.getItem('pf_supabase_offline') !== 'true') {
          localStorage.setItem('pf_supabase_offline', 'true');
          console.warn('[DB] Supabase domain is unreachable. Activating local security sandbox.');
          window.location.reload();
        }
      });
  }, 1000);
}
