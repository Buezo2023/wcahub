import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const ROLE_ROUTES = {
  estudiante:    "/portal",
  docente:       "/docente",
  admin:         "/admin",
  super_admin:   "/super",
  asesor_ventas: "/crm",
  cobros:        "/cobros",
  coordinadora:  "/coordinacion",
  directivo:     "/bi",
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verificando tu cuenta…");
  const [error,  setError]  = useState(null);

  useEffect(() => {
    // Safety timeout — if nothing happens in 15s, show error
    const timeout = setTimeout(() => {
      setError("El proceso tardó demasiado. Intentá de nuevo.");
    }, 15000);

    async function handleCallback() {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams  = new URLSearchParams(window.location.hash.slice(1));
        const code        = queryParams.get("code");
        const errorParam  = queryParams.get("error_description")
                         || hashParams.get("error_description")
                         || queryParams.get("error");

        if (errorParam) throw new Error(decodeURIComponent(errorParam));

        // Exchange code for session (PKCE flow)
        if (code) {
          const { error: ex } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (ex) throw new Error("No se pudo verificar la sesión. Intentá de nuevo.");
        }

        // Get session — wait a moment for it to settle
        await new Promise(r => setTimeout(r, 300));
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error("Error de sesión. Por favor intentá de nuevo.");
        if (!session)     throw new Error("No se encontró sesión activa. Cerrá esta pestaña e intentá desde la landing.");

        setStatus("Cargando tu perfil…");

        // Fetch profile — handle missing onboarding_done column gracefully
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, active, onboarding_done")
          .eq("id", session.user.id)
          .maybeSingle(); // maybeSingle returns null instead of error if no row

        // If profile doesn't exist yet (trigger may have failed), create it
        if (!profile && !profileError) {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id:        session.user.id,
              email:     session.user.email,
              full_name: session.user.user_metadata?.full_name
                      || session.user.user_metadata?.name
                      || session.user.email?.split("@")[0],
              role:      "estudiante",
              active:    true,
              onboarding_done: false,
            })
            .select("role, full_name, active, onboarding_done")
            .maybeSingle();

          if (newProfile) {
            // Log emergency profile creation so admin can review
            supabase.from("audit_log").insert({
              actor_id: session.user.id,
              action: "emergency_profile_created",
              entity: "profile",
              entity_id: session.user.id,
              metadata: {
                email: session.user.email,
                note: "Trigger on_auth_user_created may have failed — profile auto-created in AuthCallback",
              },
            }).catch(() => {});
            clearTimeout(timeout);
            return navigate("/onboarding", { replace: true });
          }
          throw new Error("No se pudo crear tu perfil. Contactá a soporte.");
        }

        if (profileError) {
          // Profile error — always fallback to estudiante portal, never trust OAuth metadata for roles
          clearTimeout(timeout);
          return navigate("/portal", { replace: true });
        }

        if (profile && !profile.active) {
          clearTimeout(timeout);
          setError("Tu cuenta está suspendida. Contactá a World Connect Academy: info@worldconnectacademy.com");
          return;
        }

        const firstName = profile?.full_name?.split(" ")[0] || "";
        setStatus(firstName ? `¡Bienvenido, ${firstName}!` : "¡Bienvenido!");

        clearTimeout(timeout);

        // New student → check for pending enrollments from self-registration
        if (profile?.role === "estudiante" && !profile?.onboarding_done) {
          // If they came from self-registration, they may have a pending enrollment
          // The Stripe webhook activates it, but if they logged in via transfer flow
          // we redirect to portal where they'll see "pending activation" state
          setStatus("¡Ya estás dentro! Preparando tu portal…");
          setTimeout(() => navigate("/onboarding", { replace: true }), 600);
          return;
        }

        // Everyone else → their portal
        const route = ROLE_ROUTES[profile?.role] || "/portal";
        setTimeout(() => navigate(route, { replace: true }), 500);

      } catch (err) {
        clearTimeout(timeout);
        setError(err.message || "Ocurrió un error inesperado. Por favor intentá de nuevo.");
      }
    }

    handleCallback();
    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0f3d4d",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 48px",
        textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,.25)",
        maxWidth: 380, width: "90%",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: "#155266",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#ffbb23" }}>W</span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
          WCA Hub
        </div>

        {error ? (
          <>
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, fontSize: 13,
              color: "#dc2626", lineHeight: 1.5,
            }}>
              {error}
            </div>
            <button
              onClick={() => navigate("/", { replace: true })}
              style={{
                width: "100%", padding: "11px", background: "#155266",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Volver al inicio
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 36, height: 36, border: "3px solid #e2e8f0",
              borderTop: "3px solid #155266", borderRadius: "50%",
              animation: "spin .8s linear infinite", margin: "0 auto 16px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: "#64748b" }}>{status}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
              Esto puede tardar unos segundos…
            </div>
          </>
        )}
      </div>
    </div>
  );
}
