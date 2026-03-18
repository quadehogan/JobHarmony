import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('[db] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — DB persistence disabled');
}

export const supabase: SupabaseClient = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : createClient('http://localhost:54321', 'placeholder');
