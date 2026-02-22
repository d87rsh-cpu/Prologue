import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasConfig = supabaseUrl && supabaseKey;

function createStub() {
  const msg = 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env (see .env.example).';
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
      signUp: () => Promise.reject(new Error(msg)),
      signInWithPassword: () => Promise.reject(new Error(msg)),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.reject(new Error(msg)) }) }), insert: () => Promise.reject(new Error(msg)) }),
  };
}

export const isSupabaseConfigured = !!hasConfig;
export const supabase = hasConfig ? createClient(supabaseUrl, supabaseKey) : createStub();
