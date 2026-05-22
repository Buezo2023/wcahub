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
        // 1. Get session from URL hash (Supabase sets it after OAuth)
        const { data: { session }, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!session) {
          // Try exchanging the code in the URL
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) throw exchangeError;
          if (!data.session) throw new Error("No se pudo iniciar sesión.");
        }

        setStatus("Cargando tu perfil…");

        // 2. Get user profile with role
        const userId = session?.user?.id ||
          (await supabase.auth.getUser()).data.user?.id;

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name, active")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;

        if (!profile.active) {
          setError("Tu cuenta está suspendida. Contactá a WCA Academy.");
          return;
        }

        setStatus(`Bienvenido${profile.full_name ? ", " + profile.full_name.split(" ")[0] : ""}!`);

        // 3. Redirect to the correct portal based on role
        const route = ROLE_ROUTES[profile.role] || "/portal";
        setTimeout(() => navigate(route, { replace: true }), 800);

      } catch (err) {
        console.error("Auth error:", err);
        setError(err.message || "Error al iniciar sesión. Intentá de nuevo.");
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f3d4d",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "40px 48px",
        textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,.25)",
        maxWidth: 380,
        width: "90%",
      }}>
        {/* WCA Logo */}
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "#155266",
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
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "12px 16px", marginBottom: 20,
              fontSize: 13, color: "#dc2626", lineHeight: 1.5,
            }}>
              {error}
            </div>
            <button
              onClick={() => navigate("/", { replace: true })}
              style={{
                width: "100%", padding: "11px",
                background: "#155266", color: "#fff",
                border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Volver al inicio
            </button>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div style={{
              width: 36, height: 36,
              border: "3px solid #e2e8f0",
              borderTop: "3px solid #155266",
              borderRadius: "50%",
              animation: "spin .8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontSize: 14, color: "#64748b" }}>{status}</div>
          </>
        )}
      </div>
    </div>
  );
}
