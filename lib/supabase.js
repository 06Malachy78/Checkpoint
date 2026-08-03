'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Export a single, pre-initialized instance of the Supabase client
// Configured with localStorage for persistent session storage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    // Handle password-recovery callbacks explicitly in the reset page rather than
    // auto-processing them in the shared client during app startup.
    detectSessionInUrl: false,
  },
});