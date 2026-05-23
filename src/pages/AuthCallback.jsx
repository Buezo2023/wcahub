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
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams  = new URLSearchParams(window.location.hash.slice(1));
        const code        = queryParams.get("code");
        const errorDesc   = queryParams.get("error_description") || hashParams.get("error_description");

        if (errorDesc) throw new Error(errorDesc);

        if (code) {
          const { error: ex } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (ex) throw ex;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) throw new Error("No se pudo iniciar sesión. Intentá de nuevo.");

        setStatus("Cargando tu perfil…");

        const userId = session.user.id;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, active, onboarding_done")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;

        if (!profile.active) {
          setError("Tu cuenta está suspendida. Contactá a WCA Academy en info@worldconnectacademy.com");
          return;
        }

        const firstName = profile.full_name?.split(" ")[0] || "";
        setStatus(firstName ? `¡Bienvenido, ${firstName}!` : "¡Bienvenido!");

        // New student who hasn't done onboarding yet → send to onboarding
        if (profile.role === "estudiante" && !profile.onboarding_done) {
          setTimeout(() => navigate("/onboarding", { replace: true }), 600);
          return;
        }

        // Existing user → send to their portal
        const route = ROLE_ROUTES[profile.role] || "/portal";
        setTimeout(() => navigate(route, { replace: true }), 600);

      } catch (err) {
        console.error("Auth error:", err);
        setError(err.message || "Error al iniciar sesión. Intentá de nuevo.");
      }
    }

    handleCallback();
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
          </>
        )}
      </div>
    </div>
  );
}
