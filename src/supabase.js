import { createClient } from '@supabase/supabase-js';

// Anon keys are designed to be public client-side; security comes from
// Row Level Security policies on the tables. Hardcoded fallback ensures
// the app works even if env vars are missing or misconfigured.
const FALLBACK_URL  = 'https://opgtvboxdvlcrbizdech.supabase.co';
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ3R2Ym94ZHZsY3JiaXpkZWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODY3OTUsImV4cCI6MjA5MDk2Mjc5NX0.yNTip0xH9_BNU3fmwqtiz0IFn2XeJ3kSz_Zg7ALRAN0';

const envUrl  = import.meta.env.VITE_SUPABASE_URL;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use env values only if both are set AND non-trivial. Otherwise fall back
// to the project-correct values so the app stays functional.
const useEnv = envUrl && envAnon && envUrl.includes('.supabase.co') && envAnon.startsWith('eyJ');

export const supabase = createClient(
  useEnv ? envUrl  : FALLBACK_URL,
  useEnv ? envAnon : FALLBACK_ANON
);
