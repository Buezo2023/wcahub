import { useState, useEffect } from "react";

export function ConnectionGuard() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!offline) return null;

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100000,
      background:"#dc2626", color:"#fff", padding:"8px 16px",
      fontSize:12, fontWeight:600, textAlign:"center",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    }}>
      <span style={{ fontSize:16 }}>⚡</span>
      Sin conexión a internet — los cambios no se guardarán hasta que vuelvas a conectarte
    </div>
  );
}
