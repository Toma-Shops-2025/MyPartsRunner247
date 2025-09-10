import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzynutgjvlwccpubbkwg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sbp_0dceb9343b41e6f7c7eb5992511f6b838e4fc51a';

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };