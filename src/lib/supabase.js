import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('⚠️ Supabase env vars not set — running in demo mode');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder',
);

// ─── Auth helpers ──────────────────────────────────────────────────
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signInWithMicrosoft() {
  return supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'email profile openid',
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

