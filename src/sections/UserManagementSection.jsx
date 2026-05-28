// ─── UserManagementSection — Control completo de usuarios ────────
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase.js";
import { api } from "../lib/api.js";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706",AD="#fffbeb";

const ROLES = [
  { id:"estudiante",    label:"Estudiante",    color:"#7c3aed", bg:"#ede9fe" },
  { id:"docente",       label:"Docente",       color:A,         bg:AD        },
  { id:"coordinadora",  label:"Coordinadora",  color:G,         bg:GD        },
  { id:"admin",         label:"Admin",         color:P,         bg:PD        },
  { id:"super_admin",   label:"Super Admin",   color:"#1e3a5f", bg:"#dbeafe" },
  { id:"cobros",        label:"Cobros",        color:"#0891b2", bg:"#e0f2fe" },
  { id:"asesor_ventas", label:"Ventas",        color:G,         bg:"#dcfce7" },
  { id:"directivo",     label:"Directivo",     color:"#6d28d9", bg:"#ede9fe" },
];

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.id === role) || { label: role, color:"#64748b", bg:"#f1f5f9" };
  return <span style={{ fontSize:11, padding:"2px 9px", borderRadius:10, background:r.bg, color:r.color, fontWeight:700, whiteSpace:"nowrap" }}>{r.label}</span>;
}

export function UserManagementSection({ showToast }) {
  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [roleFilter,   setRoleFilter]   = useState("all");
  const [editModal,    setEditModal]    = useState(null);   // { user }
  const [conflictModal,setConflictModal]= useState(null);   // { user }
  const [saving,       setSaving]       = useState(false);
  const [editForm,     setEditForm]     = useState({});

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id, full_name, email, phone, role, active, created_at, total_xp,
        students(id, level, scholarship,
          enrollments(id, program_id, status, group_id)
        ),
        staff(id, position, department, active,
          teacher_groups(groups(id, schedule, level))
        )
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) { showToast("Error: " + error.message, R); setLoading(false); return; }
    // Supabase returns one-to-one relations as object, not array — normalize to arrays
    const normalized = (data || []).map(p => ({
      ...p,
      students: Array.isArray(p.students) ? p.students : (p.students ? [p.students] : []),
      staff:    Array.isArray(p.staff)    ? p.staff    : (p.staff    ? [p.staff]    : []),
    }));
    setUsers(normalized);
    setLoading(false);
  }

  // Detect conflicts
  const conflicts = useMemo(() => users.filter(p => {
    const hasActiveStudent = p.students?.some(s => s.enrollments?.some(e => e.status === "active"));
    const hasActiveStaff   = p.staff?.some(s => s.active !== false);
    const isStaffRole    = ["docente","coordinadora","admin","cobros","asesor_ventas","directivo"].includes(p.role);
    const isStudentRole  = p.role === "estudiante";
    return (hasActiveStaff && isStudentRole) || (hasActiveStudent && isStaffRole);
  }), [users]);

  const filtered = useMemo(() => {
    let res = users;
    if (roleFilter !== "all") res = res.filter(u => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(u => (u.full_name||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q));
    }
    return res;
  }, [users, roleFilter, search]);

  const kpis = useMemo(() => ({
    total:     users.length,
    active:    users.filter(u => u.active !== false).length,
    byRole:    ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.id).length })),
    conflicts: conflicts.length,
  }), [users, conflicts]);

  function openEdit(user) {
    setEditForm({ role: user.role, active: user.active !== false, full_name: user.full_name });
    setEditModal({ user });
  }

  // ── Save role/active change via API ──────────────────────────────
  async function saveEdit() {
    if (!editModal) return;
    setSaving(true);
    try {
      // Role change goes through the API (audit log + validation)
      if (editForm.role !== editModal.user.role) {
        await api.post("/api/auth", {
          action: "change-role",
          userId: editModal.user.id,
          role:   editForm.role,
        });
      }
      // Active toggle via direct Supabase (non-sensitive field, covered by RLS)
      if (editForm.active !== (editModal.user.active !== false) || editForm.full_name !== editModal.user.full_name) {
        const { error } = await supabase.from("profiles")
          .update({ active: editForm.active, full_name: editForm.full_name })
          .eq("id", editModal.user.id);
        if (error) throw error;
      }
      setUsers(us => us.map(u =>
        u.id === editModal.user.id
          ? { ...u, role: editForm.role, active: editForm.active, full_name: editForm.full_name }
          : u
      ));
      setEditModal(null);
      showToast(`✓ Usuario actualizado — rol: ${editForm.role}`);
    } catch(e) {
      showToast("Error: " + e.message, R);
    } finally { setSaving(false); }
  }

  // ── Resolve conflict via API ─────────────────────────────────────
  async function resolveConflict(user, resolution) {
    setSaving(true);
    try {
      const data = await api.post("/api/auth", {
        action: "resolve-conflict",
        userId: user.id,
        resolution,
      });
      showToast(`✓ ${data.message}`);
      setConflictModal(null);
      await load();
    } catch(e) {
      showToast("Error: " + e.message, R);
    } finally { setSaving(false); }
  }

  async function toggleActive(user) {
    const newActive = !(user.active !== false);
    const { error } = await supabase.from("profiles").update({ active: newActive }).eq("id", user.id);
    if (error) { showToast("Error: " + error.message, R); return; }
    setUsers(us => us.map(u => u.id === user.id ? { ...u, active: newActive } : u));
    showToast(newActive ? `✓ ${user.full_name} activado` : `${user.full_name} desactivado`);
  }

  const exportUsers = () => exportCSV(
    filtered.map(u => ({
      Nombre:     u.full_name || "—",
      Email:      u.email || "—",
      Rol:        u.role,
      Activo:     u.active !== false ? "Sí" : "No",
      Matrículas: u.students?.[0]?.enrollments?.filter(e=>e.status==="active").length || 0,
      Staff:      u.staff?.filter(s=>s.active!==false).map(s=>s.position).join(", ") || "—",
      XP:         u.total_xp || 0,
      Registro:   new Date(u.created_at).toLocaleDateString("es-HN"),
    })),
    `usuarios-${new Date().toISOString().slice(0,10)}.csv`
  );

  const PROG = { en:"Inglés", va:"VA", va_mkt:"VA·Mkt", va_legal:"VA·Legal", va_care:"VA·Care" };

  return (
    <div>

      {/* ── Conflict banner ── */}
      {conflicts.length > 0 && (
        <div style={{ background:RD, border:`1.5px solid ${R}40`, borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <span style={{ fontSize:16 }}>⚠️</span>
            <strong style={{ fontSize:13, color:R }}>{conflicts.length} usuario{conflicts.length>1?"s":""} con doble registro</strong>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {conflicts.map(u => {
              const activeEnrolls = u.students?.flatMap(s=>s.enrollments||[]).filter(e=>e.status==="active") || [];
              const activeStaff   = u.staff?.filter(s=>s.active!==false) || [];
              return (
                <div key={u.id} style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", fontSize:12 }}>
                  <strong style={{ color:"var(--text-primary)" }}>{u.full_name}</strong>
                  <span style={{ color:"var(--text-secondary)" }}>{u.email}</span>
                  <span style={{ color:A }}>
                    rol: <strong>{u.role}</strong>
                    {activeEnrolls.length>0 && ` · ${activeEnrolls.length} matrícula(s) activa(s)`}
                    {activeStaff.length>0 && ` · staff: ${activeStaff.map(s=>s.position).join(", ")}`}
                  </span>
                  <button onClick={() => setConflictModal({ user: u })}
                    style={{ fontSize:11, padding:"2px 10px", background:R, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                    Resolver →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))", gap:8, marginBottom:14 }}>
        {[
          { l:"Total",      v:kpis.total,     c:P },
          { l:"Activos",    v:kpis.active,    c:G },
          { l:"Conflictos", v:kpis.conflicts, c:kpis.conflicts>0?R:G },
          ...kpis.byRole.filter(r=>r.count>0).slice(0,5).map(r=>({ l:r.label, v:r.count, c:r.color })),
        ].map((k,i) => (
          <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
            <div style={{ fontSize:18, fontWeight:800, color:k.c, lineHeight:1 }}>{k.v}</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          style={{ flex:1, minWidth:180, padding:"8px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}
          style={{ padding:"8px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:12, background:"var(--bg-surface)", color:"var(--text-primary)", fontFamily:"inherit" }}>
          <option value="all">Todos los roles</option>
          {ROLES.map(r=><option key={r.id} value={r.id}>{r.label} ({users.filter(u=>u.role===r.id).length})</option>)}
        </select>
        <button onClick={exportUsers}
          style={{ padding:"8px 14px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>
          ↓ CSV
        </button>
      </div>

      {/* ── Table ── */}
      {loading
        ? <div style={{ padding:32, textAlign:"center", fontSize:12, color:"var(--text-secondary)" }}>Cargando usuarios...</div>
        : (
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ background:"var(--bg-surface-subtle)" }}>
                    {["Nombre","Email","Rol","Registros","Estado","Acciones"].map(h=>(
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const activeEnrolls = u.students?.flatMap(s=>s.enrollments||[]).filter(e=>e.status==="active") || [];
                    const activeStaff   = u.staff?.filter(s=>s.active!==false) || [];
                    const isConflict    = conflicts.some(c=>c.id===u.id);
                    return (
                      <tr key={u.id}
                        onMouseEnter={e=>{ if(!isConflict) e.currentTarget.style.background="var(--bg-surface-subtle)"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background=isConflict?"#fff5f5":""; }}
                        style={{ borderTop:"1px solid var(--border-tertiary)", background:isConflict?"#fff5f5":"transparent", transition:"background .1s" }}>

                        <td style={{ padding:"8px 12px", fontWeight:600, color:"var(--text-primary)" }}>
                          {isConflict && <span title="Doble registro" style={{ marginRight:5 }}>⚠️</span>}
                          {u.full_name || "—"}
                        </td>

                        <td style={{ padding:"8px 12px", fontSize:11, color:"var(--text-secondary)" }}>{u.email||"—"}</td>

                        <td style={{ padding:"8px 12px" }}><RoleBadge role={u.role}/></td>

                        {/* Records column — shows what the user has in students + staff tables */}
                        <td style={{ padding:"8px 12px" }}>
                          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                            {activeEnrolls.length > 0 && (
                              <span style={{ fontSize:11, padding:"1px 7px", borderRadius:8, background:"#ede9fe", color:"#7c3aed", fontWeight:600, width:"fit-content" }}>
                                🎓 {activeEnrolls.map(e=>PROG[e.program_id]||e.program_id).join(", ")}
                              </span>
                            )}
                            {activeStaff.length > 0 && (
                              <span style={{ fontSize:11, padding:"1px 7px", borderRadius:8, background:AD, color:A, fontWeight:600, width:"fit-content" }}>
                                👩‍🏫 {activeStaff.map(s=>s.position).join(", ")}
                              </span>
                            )}
                            {activeEnrolls.length === 0 && activeStaff.length === 0 && (
                              <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>—</span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding:"8px 12px" }}>
                          <span style={{ fontSize:11, padding:"2px 7px", borderRadius:9,
                            background: u.active!==false ? GD : "var(--bg-surface-subtle)",
                            color: u.active!==false ? G : "var(--text-tertiary)", fontWeight:600 }}>
                            {u.active!==false ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td style={{ padding:"8px 12px" }}>
                          <div style={{ display:"flex", gap:5 }}>
                            {isConflict ? (
                              <button onClick={()=>setConflictModal({ user: u })}
                                style={{ padding:"4px 10px", background:RD, color:R, border:`1px solid ${R}40`, borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                                ⚠ Resolver
                              </button>
                            ) : (
                              <button onClick={()=>openEdit(u)}
                                style={{ padding:"4px 10px", background:PD, color:P, border:"none", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                                ✎ Editar
                              </button>
                            )}
                            <button onClick={()=>toggleActive(u)}
                              style={{ padding:"4px 8px", background:u.active!==false?RD:GD, color:u.active!==false?R:G, border:"none", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                              {u.active!==false?"Desact.":"Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding:"8px 14px", fontSize:11, color:"var(--text-tertiary)", borderTop:"1px solid var(--border-tertiary)" }}>
              {filtered.length} usuario{filtered.length!==1?"s":""} {roleFilter!=="all"?`con rol ${roleFilter}`:"en total"}
            </div>
          </div>
        )
      }

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Resolver conflicto (caso Daniel)                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {conflictModal && (() => {
        const u = conflictModal.user;
        const activeEnrolls = u.students?.flatMap(s=>s.enrollments||[]).filter(e=>e.status==="active") || [];
        const allEnrolls    = u.students?.flatMap(s=>s.enrollments||[]) || [];
        const activeStaff   = u.staff?.filter(s=>s.active!==false) || [];
        const staffGroups   = activeStaff.flatMap(s=>s.teacher_groups||[]).map(tg=>tg.groups).filter(Boolean);
        return (
          <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
            onClick={e=>{ if(e.target===e.currentTarget) setConflictModal(null); }}>
            <div style={{ background:"var(--bg-surface)", borderRadius:20, padding:28, width:"min(500px,100vw - 32px)", border:"1px solid var(--border)", boxShadow:"0 24px 64px rgba(0,0,0,.18)", maxHeight:"90vh", overflowY:"auto" }}>

              {/* Header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)" }}>Resolver conflicto de rol</div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:3 }}>{u.email}</div>
                </div>
                <button onClick={()=>setConflictModal(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-tertiary)", lineHeight:1 }}>✕</button>
              </div>

              {/* Situation summary */}
              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:A, marginBottom:8 }}>⚠ Situación actual de {u.full_name}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ background:"var(--bg-surface)", borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#7c3aed", marginBottom:6 }}>🎓 COMO ESTUDIANTE</div>
                    {allEnrolls.length > 0 ? allEnrolls.map(e => (
                      <div key={e.id} style={{ fontSize:11, marginBottom:3, display:"flex", justifyContent:"space-between" }}>
                        <span style={{ color:"var(--text-primary)" }}>{PROG[e.program_id]||e.program_id}</span>
                        <span style={{ color: e.status==="active"?"#059669":"#94a3b8", fontWeight:600 }}>{e.status}</span>
                      </div>
                    )) : <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>Sin matrículas</div>}
                  </div>
                  <div style={{ background:"var(--bg-surface)", borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:A, marginBottom:6 }}>👩‍🏫 COMO DOCENTE</div>
                    {activeStaff.length > 0 ? (
                      <>
                        {activeStaff.map(s=>(
                          <div key={s.id} style={{ fontSize:11, color:"var(--text-primary)", marginBottom:3 }}>{s.position} · {s.department}</div>
                        ))}
                        {staffGroups.length > 0 && (
                          <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:4 }}>
                            Grupos: {staffGroups.map(g=>`${g.level} ${g.schedule}`).join(" · ")}
                          </div>
                        )}
                      </>
                    ) : <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>Sin registro de staff</div>}
                  </div>
                </div>
                <div style={{ fontSize:11, color:"#92400e", marginTop:10 }}>
                  Rol actual en el sistema: <strong>{u.role}</strong> — esto determina a qué portal puede acceder.
                </div>
              </div>

              {/* Resolution options */}
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>
                Elegí cómo resolver:
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>

                {/* Option A: Keep as staff */}
                <div style={{ border:`2px solid ${A}`, borderRadius:12, padding:"14px 16px", cursor: saving?"not-allowed":"pointer", opacity: saving?.6:1 }}
                  onClick={!saving ? ()=>resolveConflict(u,"keep-staff") : undefined}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:A }}>👩‍🏫 Mantener como Docente</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:4, lineHeight:1.6 }}>
                        • Rol → <strong>docente</strong> (accede a portal de docente)<br/>
                        {activeEnrolls.length > 0
                          ? `• Suspende ${activeEnrolls.length} matrícula(s) activa(s) como estudiante`
                          : "• Sin matrículas activas que suspender"}
                        <br/>• Mantiene todos sus grupos y datos de staff
                      </div>
                    </div>
                    <div style={{ fontSize:22, marginLeft:12 }}>→</div>
                  </div>
                </div>

                {/* Option B: Keep as student */}
                <div style={{ border:`2px solid #7c3aed`, borderRadius:12, padding:"14px 16px", cursor: saving?"not-allowed":"pointer", opacity: saving?.6:1 }}
                  onClick={!saving ? ()=>resolveConflict(u,"keep-student") : undefined}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#7c3aed" }}>🎓 Mantener como Estudiante</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:4, lineHeight:1.6 }}>
                        • Rol → <strong>estudiante</strong> (accede a portal de estudiante)<br/>
                        {activeEnrolls.length > 0
                          ? `• Conserva ${activeEnrolls.length} matrícula(s) activa(s)`
                          : "• Sin matrículas activas"}
                        <br/>
                        {activeStaff.length > 0
                          ? `• Desactiva ${activeStaff.length} registro(s) de staff`
                          : "• Sin cambios en staff"}
                      </div>
                    </div>
                    <div style={{ fontSize:22, marginLeft:12 }}>→</div>
                  </div>
                </div>

                {/* Option C: Separate accounts */}
                <div style={{ border:"1px solid var(--border)", borderRadius:12, padding:"12px 16px", background:"var(--bg-surface-subtle)" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-secondary)" }}>📧 Crear cuentas separadas</div>
                  <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:4, lineHeight:1.6 }}>
                    Si esta persona necesita ser docente Y estudiante simultáneamente,
                    registrá un segundo email para uno de los roles. Cada portal requiere una cuenta distinta.
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", justifyContent:"center" }}>
                <button onClick={()=>setConflictModal(null)}
                  style={{ padding:"9px 24px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>
                  Cancelar
                </button>
              </div>
              {saving && <div style={{ textAlign:"center", fontSize:12, color:"var(--text-secondary)", marginTop:12 }}>Aplicando resolución...</div>}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Editar usuario (para no conflictos)                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {editModal && (
        <div style={{ position:"fixed", inset:0, zIndex:50, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setEditModal(null); }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:24, width:"min(420px,100vw - 32px)", border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>Editar usuario</div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:18 }}>{editModal.user.email}</div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", marginBottom:5 }}>Nombre</div>
              <input value={editForm.full_name||""} onChange={e=>setEditForm(f=>({...f,full_name:e.target.value}))}
                style={{ width:"100%", padding:"8px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", marginBottom:5 }}>Rol del sistema</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {ROLES.map(r=>(
                  <button key={r.id} onClick={()=>setEditForm(f=>({...f,role:r.id}))}
                    style={{ padding:"8px 10px", borderRadius:8, border:`2px solid ${editForm.role===r.id?r.color:"var(--border)"}`,
                      background:editForm.role===r.id?r.bg:"var(--bg-surface-subtle)",
                      color:editForm.role===r.id?r.color:"var(--text-secondary)",
                      fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {editModal.user.role !== editForm.role && (
              <div style={{ background:AD, border:`1px solid ${A}40`, borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:11, color:A }}>
                Cambiando rol: <strong>{editModal.user.role}</strong> → <strong>{editForm.role}</strong>
                {editModal.user.students?.some(s=>s.enrollments?.some(e=>e.status==="active")) && editForm.role !== "estudiante" && (
                  <div style={{ marginTop:4 }}>
                    ⚠ Tiene matrículas activas. Si solo querés cambiar el portal, considera resolver como conflicto en su lugar.
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13 }}>
                <input type="checkbox" checked={editForm.active} onChange={e=>setEditForm(f=>({...f,active:e.target.checked}))}/>
                <span>Cuenta activa</span>
              </label>
            </div>

            {editForm.role !== editModal.user.role && (
              <div style={{ fontSize:11, color:"var(--text-secondary)", background:"var(--bg-surface-subtle)", borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                💡 El cambio de rol toma efecto la próxima vez que el usuario cierre sesión y vuelva a ingresar.
              </div>
            )}

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setEditModal(null)}
                style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ flex:2, padding:"10px", background:P, color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity:saving?.6:1 }}>
                {saving?"Guardando...":"Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
