// SessionContext — shared user session across the app
import { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const loadProfile = useCallback(async (userId) => {
    if (!userId) return;
    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data, error } = await supabase.from("profiles")
        .select("id, full_name, email, role, active, onboarding_done")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[SessionContext] profile query failed:", error.message);
        setProfile(null);
        setProfileError(error.message || "No pudimos cargar tu perfil.");
        return; // NOT signOut — session stays intact
      }
      if (!data) {
        setProfile(null);
        setProfileError("Tu cuenta existe, pero no encontramos tu perfil institucional.");
        return;
      }
      setProfile(data);
      setProfileError(null);
    } catch(e) {
      console.error("[SessionContext] loadProfile exception:", e);
      setProfile(null);
      setProfileError(e?.message || "Error inesperado al cargar el perfil.");
    } finally {
      setProfileLoading(false);
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
          await loadProfile(s.user.id);
        }
      } catch(e) {
        console.error("[SessionContext] onAuthStateChange error:", e);
      }
    });

    // Wire 401 handler — only for real API 401, not profile query errors
    setUnauthorizedHandler(async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      window.location.href = "/";
    });

    // Refresh profile when tab regains focus — catches role changes by admin
    async function onFocus() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s?.user?.id) await loadProfile(s.user.id);
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
