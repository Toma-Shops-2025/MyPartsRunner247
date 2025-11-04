import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzynutgjvlwccpubbkwg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sbp_0dceb9343b41e6f7c7eb5992511f6b838e4fc51a';

// Create Supabase client with localStorage persistence (default)
// Sessions will persist across browser/app closures
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true, // Explicitly enable session persistence
    detectSessionInUrl: true
  }
});

export { supabase };