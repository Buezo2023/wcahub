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
    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) {
        const { data } = await supabase.from("profiles")
          .select("id, full_name, email, role, active, total_xp, xp_level, onboarding_done")
          .eq("id", s.user.id)
          .maybeSingle();
        setProfile(data);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s?.user?.id && event !== "SIGNED_OUT") {
        const { data } = await supabase.from("profiles")
          .select("id, full_name, email, role, active, total_xp, xp_level, onboarding_done")
          .eq("id", s.user.id)
          .maybeSingle();
        setProfile(data);
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

    return () => subscription.unsubscribe();
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
      .select("id, full_name, email, role, active, total_xp, xp_level, onboarding_done")
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
