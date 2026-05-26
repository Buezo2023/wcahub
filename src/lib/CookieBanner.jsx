// ─── CookieBanner — GDPR/LGPD compliant consent banner ──────────
// Shown once per browser. Stores consent in localStorage (wca_cookie_consent).
// Only functional cookies (Supabase auth session) are required.
// Analytics/marketing cookies are optional — currently none used.

import { useState, useEffect } from "react";

const CONSENT_KEY = "wca_cookie_consent";
const CONSENT_VERSION = "1"; // bump when policy changes

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      // Show if no consent stored, or stored version is outdated
      if (!stored || stored.version !== CONSENT_VERSION) {
        // Small delay so it doesn't flash on first paint
        const t = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch(e) {
      setVisible(true);
    }
  }, []);

  function accept(all = true) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version:     CONSENT_VERSION,
        date:        new Date().toISOString(),
        functional:  true,   // always required
        analytics:   all,    // Google Analytics (if added later)
        marketing:   false,  // never used
      }));
    } catch(e) {}
    setVisible(false);
  }

  function reject() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        version:    CONSENT_VERSION,
        date:       new Date().toISOString(),
        functional: true,  // can't reject these (session auth)
        analytics:  false,
        marketing:  false,
      }));
    } catch(e) {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      zIndex: 99999,
      background: "#0f172a",
      borderTop: "1px solid rgba(255,255,255,.12)",
      padding: "16px 20px",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      boxShadow: "0 -4px 32px rgba(0,0,0,.3)",
      animation: "slideUpBanner .3s cubic-bezier(.16,1,.3,1)",
    }}>
      <style>{`@keyframes slideUpBanner{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}`}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              🍪 Cookies y privacidad
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", lineHeight: 1.6 }}>
              Usamos cookies esenciales para mantener tu sesión activa y hacer funcionar la plataforma.
              {" "}No vendemos ni compartimos tu información.{" "}
              <button
                onClick={() => setShowDetails(v => !v)}
                style={{ background: "none", border: "none", color: "#ffbb23", fontSize: 12, cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}>
                {showDetails ? "Ocultar detalles" : "Ver detalles"}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button onClick={reject}
              style={{ padding: "8px 16px", background: "transparent", border: "1px solid rgba(255,255,255,.25)", borderRadius: 8, color: "rgba(255,255,255,.7)", fontSize: 12, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Solo esenciales
            </button>
            <button onClick={() => accept(true)}
              style={{ padding: "8px 20px", background: "#155266", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              Aceptar todas
            </button>
          </div>
        </div>

        {/* Details panel */}
        {showDetails && (
          <div style={{ marginTop: 12, padding: "12px 14px", background: "rgba(255,255,255,.06)", borderRadius: 10, fontSize: 12, color: "rgba(255,255,255,.75)", lineHeight: 1.7 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
              {[
                {
                  name: "Cookies esenciales",
                  required: true,
                  desc: "Sesión de autenticación (Supabase Auth), tema de la interfaz (claro/oscuro), progreso offline del LMS.",
                  examples: "sb-access-token, wca-theme, wca_pending_progress",
                },
                {
                  name: "Cookies analíticas",
                  required: false,
                  desc: "Actualmente no utilizamos cookies analíticas. Si se implementan en el futuro, se pedirá consentimiento de nuevo.",
                  examples: "Ninguna actualmente",
                },
                {
                  name: "Cookies de marketing",
                  required: false,
                  desc: "No utilizamos cookies de marketing, publicidad ni seguimiento de terceros.",
                  examples: "Ninguna",
                },
              ].map(cat => (
                <div key={cat.name} style={{ background: "rgba(255,255,255,.05)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#fff" }}>{cat.name}</span>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 9, background: cat.required ? "#155266" : "rgba(255,255,255,.1)", color: cat.required ? "#7dd3fc" : "rgba(255,255,255,.5)", fontWeight: 600 }}>
                      {cat.required ? "Requeridas" : "Opcionales"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 4 }}>{cat.desc}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>Ejemplos: {cat.examples}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,.5)" }}>
              Para más información consultá nuestra{" "}
              <a href="/privacidad" style={{ color: "#ffbb23", textDecoration: "underline" }}>Política de privacidad</a>
              {" "}y{" "}
              <a href="/terminos" style={{ color: "#ffbb23", textDecoration: "underline" }}>Términos de uso</a>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check consent status
export function useCookieConsent() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    return {
      given:      !!stored,
      functional: stored?.functional !== false,
      analytics:  stored?.analytics === true,
      marketing:  false,
    };
  } catch(e) {
    return { given: false, functional: true, analytics: false, marketing: false };
  }
}
