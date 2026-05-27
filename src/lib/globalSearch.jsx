import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase.js";

const ROLE_ROUTES = {
  estudiante: "/portal", docente: "/docente", admin: "/admin",
  super_admin: "/super", asesor_ventas: "/crm", cobros: "/cobros",
  coordinadora: "/coordinacion",
};

export function useGlobalSearch() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const timer     = useRef(null);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const term = q.trim().toLowerCase();
      // Detect if searching by student code (WCA- prefix)
      const isCodeSearch = term.toUpperCase().startsWith("WCA-");
      const [{ data: profiles }, { data: leads }, { data: studentCodes }] = await Promise.all([
        supabase.from("profiles")
          .select("id, full_name, email, role, avatar_url")
          .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
          .limit(isCodeSearch ? 0 : 6),
        supabase.from("leads")
          .select("id, full_name, email, stage, source")
          .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
          .limit(isCodeSearch ? 0 : 4),
        supabase.from("students")
          .select("id, student_code, profile:profiles(id, full_name, email, role, avatar_url)")
          .ilike("student_code", `%${term.toUpperCase()}%`)
          .limit(6),
      ]);

      const codeResults = (studentCodes || []).filter(s => s.profile).map(s => ({
        id:       s.profile.id,
        label:    s.profile.full_name || s.profile.email,
        sub:      s.student_code,
        type:     "person",
        role:     s.profile.role,
        avatar:   s.profile.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(),
        route:    ROLE_ROUTES[s.profile.role] || "/admin",
        icon:     "👨‍🎓",
        studentCode: s.student_code,
      }));

      const profileResults = (profiles || []).map(p => ({
        id:       p.id,
        label:    p.full_name || p.email,
        sub:      p.email,
        type:     "person",
        role:     p.role,
        avatar:   p.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(),
        route:    ROLE_ROUTES[p.role] || "/admin",
        icon:     p.role === "estudiante" ? "👨‍🎓" : p.role === "docente" ? "👩‍🏫" : "👤",
      }));

      const leadResults = (leads || []).map(l => ({
        id:     l.id,
        label:  l.full_name || l.email,
        sub:    `Lead · ${l.stage || "nuevo"} · ${l.source || ""}`,
        type:   "lead",
        route:  "/crm",
        icon:   "💼",
      }));

      setResults([...codeResults, ...profileResults.filter(p => !codeResults.some(cr => cr.id === p.id)), ...leadResults]);
    } catch(e) { console.error("Global search:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer.current);
  }, [query, search]);

  const go = useCallback((result) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(result.route);
  }, [navigate]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  return { open, setOpen, query, setQuery, results, loading, go, close };
}

// ─── GlobalSearchModal — render this once in App.jsx ─────────────
export function GlobalSearchModal({ search: s }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (s.open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [s.open]);

  if (!s.open) return null;

  return (
    <div onClick={e=>{ if(e.target===e.currentTarget) s.close(); }}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:50,
               display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"80px 16px 16px" }}>
      <div style={{ background:"var(--bg-surface)", borderRadius:16, width:"100%", maxWidth:560,
                    border:"1px solid var(--border)", boxShadow:"0 24px 60px rgba(0,0,0,.25)",
                    overflow:"hidden", animation:"popIn .18s cubic-bezier(.34,1.56,.64,1) both",
                    fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
        {/* Search input */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
                      borderBottom:"1px solid var(--border)" }}>
          <i className="ti ti-search" style={{ fontSize:18, color:"var(--text-tertiary)", flexShrink:0 }} aria-hidden="true"/>
          <input ref={inputRef} value={s.query} onChange={e=>s.setQuery(e.target.value)}
            placeholder="Buscar por nombre, email o código WCA-…"
            style={{ flex:1, border:"none", outline:"none", fontSize:15, background:"transparent",
                     color:"var(--text-primary)", fontFamily:"inherit" }}
            aria-label="Búsqueda global"/>
          {s.loading && <div style={{ width:16, height:16, border:"2px solid var(--border)",
            borderTopColor:"#155266", borderRadius:"50%", animation:"spin .7s linear infinite" }}/>}
          <kbd style={{ fontSize:11, padding:"2px 7px", background:"var(--bg-surface-subtle)",
                        border:"1px solid var(--border)", borderRadius:5, color:"var(--text-tertiary)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:380, overflowY:"auto" }}>
          {s.results.length === 0 && s.query.trim() && !s.loading && (
            <div style={{ padding:"24px 18px", textAlign:"center", fontSize:13, color:"var(--text-secondary)" }}>
              Sin resultados para "{s.query}"
            </div>
          )}
          {s.results.length === 0 && !s.query.trim() && (
            <div style={{ padding:"20px 18px" }}>
              <div style={{ fontSize:11, color:"var(--text-tertiary)", textTransform:"uppercase",
                            letterSpacing:.6, marginBottom:10, fontWeight:600 }}>Accesos rápidos</div>
              {[["/portal","👨‍🎓","Portal Estudiante"],["/admin","⚙️","Dashboard Admin"],
                 ["/crm","💼","CRM Ventas"],["/cobros","💳","Gestor de Cobros"]].map(([r,ic,lb])=>(
                <button key={r} onClick={()=>s.go({route:r})}
                  style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"8px 12px",
                           background:"transparent", border:"none", borderRadius:8, cursor:"pointer",
                           textAlign:"left", fontFamily:"inherit", color:"var(--text-primary)",
                           fontSize:13, transition:"background .1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:18 }}>{ic}</span>{lb}
                </button>
              ))}
            </div>
          )}
          {s.results.length > 0 && (
            <div style={{ padding:8 }}>
              {["person","lead"].map(type => {
                const group = s.results.filter(r=>r.type===type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <div style={{ fontSize:11, color:"var(--text-tertiary)", textTransform:"uppercase",
                                  letterSpacing:.6, padding:"8px 10px 4px", fontWeight:600 }}>
                      {type === "person" ? "Personas" : "Leads CRM"}
                    </div>
                    {group.map(r => (
                      <button key={r.id} onClick={()=>s.go(r)}
                        style={{ display:"flex", alignItems:"center", gap:12, width:"100%",
                                 padding:"9px 10px", background:"transparent", border:"none",
                                 borderRadius:8, cursor:"pointer", textAlign:"left",
                                 fontFamily:"inherit", transition:"background .1s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{ width:34, height:34, borderRadius:"50%", background:"#e8f3f6",
                                      display:"flex", alignItems:"center", justifyContent:"center",
                                      fontSize:12, fontWeight:700, color:"#155266", flexShrink:0 }}>
                          {r.avatar || r.icon}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)",
                                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                              {r.label}
                            </span>
                            {r.studentCode&&<span style={{fontSize:10,fontFamily:"monospace",fontWeight:700,color:"#155266",background:"#e8f3f6",padding:"1px 6px",borderRadius:4,flexShrink:0}}>{r.studentCode}</span>}
                          </div>
                          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:1 }}>{r.sub !== r.studentCode ? r.sub : r.label === r.sub ? "" : r.sub}</div>
                        </div>
                        <i className="ti ti-arrow-right" style={{ fontSize:14, color:"var(--text-tertiary)", flexShrink:0 }} aria-hidden="true"/>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"8px 18px", borderTop:"1px solid var(--border)",
                      fontSize:11, color:"var(--text-tertiary)", display:"flex", gap:16 }}>
          <span>↑↓ navegar</span>
          <span>↵ ir</span>
          <span>ESC cerrar</span>
          <span style={{ marginLeft:"auto" }}>⌘K para abrir en cualquier portal</span>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes popIn{0%{opacity:0;transform:scale(.94)}60%{transform:scale(1.01)}100%{opacity:1;transform:none}}`}</style>
    </div>
  );
}
