import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szlkgxsutvduqfabxqch.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any; // Fallback to null if key is missing
