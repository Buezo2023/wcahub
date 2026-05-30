// api.js — centralized fetch helper
// Handles: auth token injection, 401 delegation, error parsing
// AUTH-01: api.js NEVER calls supabase.auth.signOut() directly.
//          Only delegates to _onUnauthorized — SessionContext owns the signOut.
import { supabase } from "./supabase.js";

let _onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  _onUnauthorized = fn;
}

// AUTH-01: retry with backoff before treating missing token as logout.
// Supabase may still be refreshing the JWT when we first check.
async function getAccessTokenSafe() {
  let { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return session.access_token;

  // Wait briefly for in-flight JWT refresh
  await new Promise(r => setTimeout(r, 250));
  const retry = await supabase.auth.getSession();
  return retry.data?.session?.access_token ?? null;
}

export async function api(path, options = {}) {
  const token = await getAccessTokenSafe();

  if (!token) {
    // COBROS-01.2: token absent may be a transient state (cold start, JWT refresh in flight).
    // Do NOT call _onUnauthorized here — let caller show a recoverable error instead.
    throw new Error("No pudimos verificar tu sesión. Reintentá en unos segundos.");
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  // AUTH-01: 401 → delegate to _onUnauthorized (SessionContext handles signOut).
  // Never call supabase.auth.signOut() here — avoids double signOut.
  if (res.status === 401) {
    _onUnauthorized?.();
    throw new Error("Sesión expirada. Por favor ingresá de nuevo.");
  }

  // Parse JSON safely
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Error ${res.status}`);
  }

  return data;
}

// Convenience methods
api.get  = (path, opts = {}) => api(path, { ...opts, method: "GET" });
api.post = (path, body, opts = {}) => api(path, { ...opts, method: "POST", body: JSON.stringify(body) });
api.patch= (path, body, opts = {}) => api(path, { ...opts, method: "PATCH", body: JSON.stringify(body) });
