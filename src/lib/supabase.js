import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL    || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Flags whether Supabase is properly configured
export const isDbConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) &&
  !supabaseUrl.includes('YOUR_PROJECT_ID');

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
