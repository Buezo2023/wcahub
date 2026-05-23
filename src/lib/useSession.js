// ─── useSession — auth guard + session refresh ────────────────────
// Usage: const { session, profile, loading } = useSession()
// Automatically redirects to / if session expires

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase.js";

export function useSession() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (!s) {
        navigate("/", { replace: true });
        return;
      }
      // Load profile
      supabase
        .from("profiles")
        .select("id, role, full_name, email, avatar_url, active, onboarding_done")
        .eq("id", s.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!mounted) return;
          setProfile(data);
          setLoading(false);
        });
    });

    // Listen for auth changes (token refresh, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        setSession(null);
        setProfile(null);
        navigate("/", { replace: true });
      } else if (event === "TOKEN_REFRESHED") {
        setSession(s);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { session, profile, loading };
}
