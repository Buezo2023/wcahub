// api.js — centralized fetch helper
// Handles: auth token injection, 401 redirect, error parsing
import { supabase } from "./supabase.js";

let _onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  _onUnauthorized = fn;
}

export async function api(path, options = {}) {
  // Get fresh token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    _onUnauthorized?.();
    throw new Error("No session");
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  // 401 = token expired or invalid → sign out and redirect
  if (res.status === 401) {
    await supabase.auth.signOut();
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
