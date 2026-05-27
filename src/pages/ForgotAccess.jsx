// ─── WCA Hub — Recuperar acceso vía magic link ─────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js"; // kept for future auth use

const P = "#155266", Y = "#ffbb23", G = "#059669", R = "#dc2626", RD = "#fef2f2", GD = "#ecfdf5";

export default function ForgotAccess() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMagicLink() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email inválido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (res.status === 429) {
        setError("Demasiados intentos. Esperá 15 minutos antes de intentar de nuevo.");
        return;
      }
      // Always show success — server never reveals if email exists
      setSent(true);
    } catch (_) {
      setError("Error de red. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"24px 16px 48px", display:"flex", alignItems:"center" }}>
      <div style={{ maxWidth:440, margin:"0 auto", width:"100%" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div onClick={() => navigate("/")} style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:18, cursor:"pointer" }}>
            <div style={{ width:42, height:42, borderRadius:11, background:P, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:19, fontWeight:900, color:Y }}>W</span>
            </div>
            <span style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>WCA Academy</span>
          </div>
        </div>

        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:20, padding:"32px 28px", boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
          {sent ? (
            <div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", background:GD, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <i className="ti ti-mail-check" style={{ fontSize:30, color:G }} aria-hidden="true"/>
              </div>
              <h2 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>Revisá tu email</h2>
              <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.7, marginBottom:24 }}>
                Si <strong style={{ color:"var(--text-primary)" }}>{email}</strong> está registrado, te enviamos un enlace mágico.
                Hacé clic en el enlace del email para entrar — no necesitás contraseña.
              </p>
              <div style={{ background:`${P}08`, border:`1px solid ${P}25`, borderRadius:10, padding:"12px 16px", fontSize:12, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:20, textAlign:"left" }}>
                <i className="ti ti-info-circle" style={{ marginRight:6, color:P }} aria-hidden="true"/>
                El enlace expira en 1 hora. Si no llega en unos minutos, revisá spam o intentá de nuevo.
              </div>
              <button onClick={() => navigate("/")} style={btn(P)}>Volver al inicio</button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>Recuperar acceso</h2>
              <p style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7, marginBottom:24 }}>
                Te enviamos un enlace mágico al email registrado. Hacé clic y entrás sin necesidad de contraseña.
              </p>

              <label style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:6 }}>Tu email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && !loading && sendMagicLink()}
                placeholder="vos@email.com"
                disabled={loading}
                style={{ width:"100%", padding:"12px 14px", border:`1px solid ${error ? R : "var(--border)"}`, borderRadius:9, fontSize:14, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit", marginBottom:14 }}
              />

              {error && (
                <div style={{ background:RD, border:`1px solid ${R}40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:R, marginBottom:14 }}>
                  {error}
                </div>
              )}

              <button onClick={sendMagicLink} disabled={loading || !email} style={btn(P, loading || !email)}>
                {loading ? "Enviando enlace..." : "Enviar enlace de acceso →"}
              </button>

              <div style={{ textAlign:"center", marginTop:18, fontSize:12, color:"var(--text-tertiary)" }}>
                ¿Te acordás cómo entrar?{" "}
                <span onClick={() => navigate("/")} style={{ color:P, fontWeight:600, cursor:"pointer" }}>
                  Volver al inicio
                </span>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:18, fontSize:11, color:"var(--text-tertiary)", lineHeight:1.7 }}>
          🔒 Tu información está protegida con cifrado SSL.<br/>
          Si seguís sin poder acceder, escribí a <a href="mailto:hola@wcahub.com" style={{ color:P, textDecoration:"none" }}>hola@wcahub.com</a>
        </div>
      </div>
    </div>
  );
}

function btn(bg, disabled = false) {
  return {
    width: "100%",
    padding: "13px",
    background: disabled ? "var(--bg-surface-subtle)" : bg,
    color: disabled ? "var(--text-tertiary)" : "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    transition: "opacity .2s",
  };
}
