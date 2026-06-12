import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL    || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Synchronous check of cached offline mode to prevent WebSocket spin-up on boot
const isCachedOffline = localStorage.getItem('pf_supabase_offline') === 'true';

export const isDbConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  !isCachedOffline;

export const supabase = isDbConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
