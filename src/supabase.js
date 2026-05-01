import { createClient } from '@supabase/supabase-js';

// Athena uses a known Supabase project. The URL and anon key are public
// client-side values by design — security comes from RLS on the tables.
// Hardcoded so the app cannot be broken by misconfigured Netlify env vars.
const SUPABASE_URL  = 'https://opgtvboxdvlcrbizdech.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ3R2Ym94ZHZsY3JiaXpkZWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODY3OTUsImV4cCI6MjA5MDk2Mjc5NX0.yNTip0xH9_BNU3fmwqtiz0IFn2XeJ3kSz_Zg7ALRAN0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
