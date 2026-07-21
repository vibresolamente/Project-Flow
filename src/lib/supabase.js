import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from localStorage override or Vite environment variables
export const getSupabaseCredentials = () => {
  const localUrl = localStorage.getItem('pf_supabase_url');
  const localKey = localStorage.getItem('pf_supabase_anon_key');

  const url = (localUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const isConfigured =
    Boolean(url && key) &&
    !url.includes('YOUR_PROJECT_ID') &&
    !url.includes('YOUR_SUPABASE');

  return { url, key, isConfigured };
};

const { url: initialUrl, key: initialKey, isConfigured: initialIsConfigured } = getSupabaseCredentials();

export let isDbConfigured = initialIsConfigured;

// Robust fetch wrapper that retries transient server errors smoothly
const retryFetch = async (url, options) => {
  const maxRetries = 2;
  const initialDelay = 150;
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, options);
      if (
        (response.status === 429 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504) &&
        attempt < maxRetries
      ) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (attempt < maxRetries) {
        attempt++;
        const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 50;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      console.warn('[Supabase Fetch] Connection attempt failed:', error.message);
      throw error;
    }
  }
};

export const createSupabaseInstance = (targetUrl, targetKey) => {
  if (!targetUrl || !targetKey || targetUrl.includes('YOUR_PROJECT_ID')) {
    return null;
  }
  try {
    return createClient(targetUrl, targetKey, {
      global: {
        fetch: retryFetch,
      },
      realtime: {
        params: {
          eventsPerSecond: 40,
        },
        config: {
          broadcast: { self: true, ack: false },
        },
      },
    });
  } catch (err) {
    console.error('[Supabase Init Error]', err);
    return null;
  }
};

export let supabase = createSupabaseInstance(initialUrl, initialKey);

// Utility function to save credentials dynamically and re-initialize client
export const saveSupabaseCredentials = (newUrl, newKey) => {
  if (newUrl) localStorage.setItem('pf_supabase_url', newUrl.trim());
  if (newKey) localStorage.setItem('pf_supabase_anon_key', newKey.trim());
  
  const { url, key, isConfigured } = getSupabaseCredentials();
  isDbConfigured = isConfigured;
  supabase = createSupabaseInstance(url, key);
  return isConfigured;
};

// Utility function to clear stored credentials
export const clearSupabaseCredentials = () => {
  localStorage.removeItem('pf_supabase_url');
  localStorage.removeItem('pf_supabase_anon_key');
  const { url, key, isConfigured } = getSupabaseCredentials();
  isDbConfigured = isConfigured;
  supabase = createSupabaseInstance(url, key);
};

// Asynchronous background reachability & latency check
export const checkSupabaseHealth = async (customUrl, customKey) => {
  const targetUrl = customUrl || getSupabaseCredentials().url;
  const targetKey = customKey || getSupabaseCredentials().key;

  if (!targetUrl || !targetKey || targetUrl.includes('YOUR_PROJECT_ID')) {
    return { connected: false, latencyMs: 0, statusText: 'Credentials missing' };
  }

  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${targetUrl}/rest/v1/pf_users?select=id&limit=1`, {
      method: 'GET',
      headers: {
        apikey: targetKey,
        Authorization: `Bearer ${targetKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (res.ok || res.status === 200 || res.status === 206) {
      return { connected: true, latencyMs, statusText: 'Cloud Active' };
    } else if (res.status === 401 || res.status === 403) {
      return { connected: false, latencyMs, statusText: 'Invalid API Key / Unauthorized' };
    } else if (res.status === 404) {
      return { connected: false, latencyMs, statusText: 'Schema/Table Missing (Run SQL Script)' };
    } else {
      return { connected: false, latencyMs, statusText: `HTTP ${res.status}` };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    return { connected: false, latencyMs: 0, statusText: 'Network / Unreachable' };
  }
};

export const isCloudOffline = !isDbConfigured;
