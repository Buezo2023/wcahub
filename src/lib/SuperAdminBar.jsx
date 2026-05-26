// SuperAdminBar — shows at top of every portal when user is super_admin
// Lets them navigate back to /super from any portal
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase.js";

export function SuperAdminBar() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: p } = await supabase.from("profiles")
        .select("role").eq("id", session.user.id).maybeSingle();
      if (p?.role === "super_admin") setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <div style={{
      background: "#0f3d4d",
      borderBottom: "1px solid rgba(255,255,255,.1)",
      padding: "7px 20px",
      display: "flex", alignItems: "center", gap: 12,
      fontSize: 12, color: "rgba(255,255,255,.7)",
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      flexShrink: 0, zIndex:10,
    }}>
      <svg viewBox="0 0 32 32" style={{ width:20, height:20, flexShrink:0 }}>
        <rect width="32" height="32" rx="6" fill="#ffbb23"/>
        <text x="16" y="22" fontFamily="sans-serif" fontSize="16" fontWeight="800" fill="#155266" textAnchor="middle">W</text>
      </svg>
      <span style={{ color:"rgba(255,255,255,.5)" }}>Estás viendo como</span>
      <span style={{ fontWeight:700, color:"#fff" }}>Super Admin</span>
      <button onClick={() => navigate("/super")} style={{
        marginLeft: "auto", padding: "4px 14px",
        background: "rgba(255,255,255,.12)",
        border: "1px solid rgba(255,255,255,.2)",
        borderRadius: 7, color: "#fff", fontSize: 11,
        cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
      }}>← Volver a Super Admin</button>
    </div>
  );
}
