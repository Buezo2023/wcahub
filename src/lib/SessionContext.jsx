// SessionContext — shared user session across the app
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase.js";
import { setUnauthorizedHandler } from "./api.js";

const SessionCtx = createContext({
  profile: null, session: null,
  loading: true, profileLoading: false, profileError: null,
  signOut: () => {}, refreshProfile: () => {},
});

export function SessionProvider({ children }) {
  const [profile,        setProfile]        = useState(null);
  const [session,        setSession]        = useState(null);
  const [loading,        setLoading]        = useState(true);   // initial auth check
  const [profileLoading, setProfileLoading] = useState(false);  // profile query
  const [profileError,   setProfileError]   = useState(null);   // non-fatal profile error

  // ── loadProfile: fetches profile for a given userId ───────────
  // NEVER signOut on failure — only sets profileError so UI can offer retry
  const lastFocusRefreshAt = useRef(0);

  // options.silent = true → background refresh, never blocks UI, keeps existing profile on error
  const loadProfile = useCallback(async (userId, options = {}) => {
    if (!userId) return;
    const { silent = false } = options;

    if (!silent) {
      setProfileLoading(true);
      setProfileError(null);
    }

    let timer;
    const timeoutMs = silent ? 6000 : 8000;
    const timeoutPromise = new Promise((_, rej) =>
      (timer = setTimeout(() => rej(new Error("timeout")), timeoutMs))
    );

    try {
      const { data, error } = await Promise.race([
        supabase.from("profiles")
          .select("id, full_name, email, role, active, onboarding_done")
          .eq("id", userId)
          .maybeSingle(),
        timeoutPromise,
      ]);
      clearTimeout(timer);

      if (error) {
        console.error("[SessionContext] profile query failed:", error.message);
        if (!silent) {
          setProfile(null);
          setProfileError(error.message || "No pudimos cargar tu perfil.");
        }
        // silent: keep existing profile, just warn
        return;
      }
      if (!data) {
        if (!silent) {
          setProfile(null);
          setProfileError("Tu cuenta existe, pero no encontramos tu perfil institucional.");
        }
        return;
      }
      setProfile(data);
      if (!silent) setProfileError(null);
    } catch(e) {
      clearTimeout(timer);
      const isTimeout = e?.message === "timeout";
      console.warn(`[SessionContext] loadProfile ${isTimeout ? "timeout" : "error"}${silent ? " (silent)" : ""}:`, e?.message);
      if (!silent) {
        setProfile(null);
        setProfileError(isTimeout ? "La verificación tardó demasiado. Intentá de nuevo." : (e?.message || "Error inesperado."));
      }
      // silent: keep existing profile on any error
    } finally {
      if (!silent) setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    // Safety timeout — if Supabase auth hangs entirely, don't block forever
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      setProfileLoading(false);
      console.warn("[SessionContext] safety timeout — forced loading=false after 8s");
    }, 8000);

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      clearTimeout(safetyTimer);
      setSession(s);
      if (s?.user?.id) {
        await loadProfile(s.user.id);
      }
      setLoading(false);
    }).catch(e => {
      clearTimeout(safetyTimer);
      console.error("[SessionContext] getSession failed:", e);
      setLoading(false);
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      try {
        if (event === "SIGNED_OUT" || !s) {
          setSession(null);
          setProfile(null);
          setProfileError(null);
          return;
        }
        setSession(s);
        if (s?.user?.id) {
          // AUTH-01: if profile already loaded (TOKEN_REFRESHED, re-login), refresh silently
          // Only block UI for first login when profile is null
          const currentProfile = profile; // capture via closure
          await loadProfile(s.user.id, { silent: Boolean(currentProfile) });
        }
      } catch(e) {
        console.error("[SessionContext] onAuthStateChange error:", e);
      }
    });

    // Wire 401 handler — only for real API 401, not profile query errors
    setUnauthorizedHandler(async () => {
      // COBROS-01.3: no hard reload — let PrivateRoute handle the redirect softly
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      setProfileError(null);
      // PrivateRoute will detect session=null and navigate to "/" via React Router
    });

    // Refresh profile when tab regains focus — catches role changes by admin
    async function onFocus() {
      // Guard: skip if refreshed < 10s ago (prevents multiple calls on rapid tab switching)
      const now = Date.now();
      if (now - lastFocusRefreshAt.current < 10000) return;
      lastFocusRefreshAt.current = now;
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        // silent:true — background refresh, never blocks UI, keeps existing profile on error
        if (s?.user?.id) await loadProfile(s.user.id, { silent: true });
      } catch(e) {
        console.warn("[SessionContext] focus refresh failed:", e?.message);
      }
    }
    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [loadProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    try { localStorage.removeItem("wca_pending_progress"); } catch(e) {}
    setProfile(null);
    setSession(null);
    setProfileError(null);
  };

  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    if (s?.user?.id) await loadProfile(s.user.id);
  }, [loadProfile]);

  return (
    <SessionCtx.Provider value={{
      profile, session, loading,
      profileLoading, profileError,
      signOut, refreshProfile,
    }}>
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);
