// SessionContext — shared user session across the app
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { setUnauthorizedHandler } from "./api.js";

const SessionCtx = createContext({ profile: null, session: null, loading: true, signOut: () => {} });

export function SessionProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout — if Supabase hangs, don't leave users stuck on "Verificando acceso"
    const safetyTimer = setTimeout(() => {
      setLoading(false);
      console.warn("[SessionContext] safety timeout — forced loading=false after 8s");
    }, 8000);

    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      clearTimeout(safetyTimer);
      setSession(s);
      if (s?.user?.id) {
        try {
          const { data } = await supabase.from("profiles")
            .select("id, full_name, email, role, active, onboarding_done")
            .eq("id", s.user.id)
            .maybeSingle();
          setProfile(data);
        } catch(e) {
          console.error("[SessionContext] profile load failed:", e);
        }
      }
      setLoading(false);
    }).catch(e => {
      clearTimeout(safetyTimer);
      console.error("[SessionContext] session load failed:", e);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s?.user?.id && event !== "SIGNED_OUT") {
        try {
          const { data } = await supabase.from("profiles")
            .select("id, full_name, email, role, active, onboarding_done")
            .eq("id", s.user.id)
            .maybeSingle();
          setProfile(data);
        } catch(e) {
          console.error("[SessionContext] auth change profile load failed:", e);
        }
      } else {
        setProfile(null);
      }
    });

    // Wire 401 handler to sign out
    setUnauthorizedHandler(async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setSession(null);
      window.location.href = "/";
    });

    // Refresh profile when tab regains focus — catches role changes made by admin
    async function onFocus() {
      const { data: { session: s } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (!s?.user?.id) return;
      const { data } = await supabase.from("profiles")
        .select("id, full_name, email, role, active, onboarding_done")
        .eq("id", s.user.id).maybeSingle().catch(() => ({ data: null }));
      if (data) setProfile(data);
    }
    window.addEventListener("focus", onFocus);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear app-specific localStorage keys on logout
    try {
      localStorage.removeItem('wca_pending_progress');
      // Keep wca-theme (user preference, not sensitive)
    } catch(e) {}
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase.from("profiles")
      .select("id, full_name, email, role, active, onboarding_done")
      .eq("id", session.user.id)
      .maybeSingle();
    setProfile(data);
  };

  return (
    <SessionCtx.Provider value={{ profile, session, loading, signOut, refreshProfile }}>
      {children}
    </SessionCtx.Provider>
  );
}

export const useSession = () => useContext(SessionCtx);
