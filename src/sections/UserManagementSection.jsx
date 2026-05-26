// ─── UserManagementSection — Control completo de usuarios ────────
// Reemplaza el manejo inline de staff en SuperAdmin.
// Un usuario = una fila, con su rol real, estado y acciones.
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase.js";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706";

const ROLES = [
  { id:"estudiante",    label:"Estudiante",    color:"#7c3aed", bg:"#ede9fe" },
  { id:"docente",       label:"Docente",       color:A,         bg:"#fffbeb" },
  { id:"coordinadora",  label:"Coordinadora",  color:G,         bg:GD       },
  { id:"admin",         label:"Admin",         color:P,         bg:PD       },
  { id:"super_admin",   label:"Super Admin",   color:"#1e3a5f", bg:"#dbeafe" },
  { id:"cobros",        label:"Cobros",        color:"#0891b2", bg:"#e0f2fe" },
  { id:"asesor_ventas", label:"Ventas",        color:"#059669", bg:"#dcfce7" },
  { id:"directivo",     label:"Directivo",     color:"#6d28d9", bg:"#ede9fe" },
];

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.id === role) || { label: role, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span style={{ fontSize:11, padding:"2px 9px", borderRadius:10, background:r.bg, color:r.color, fontWeight:700, whiteSpace:"nowrap" }}>
      {r.label}
    </span>
  );
}

export function UserManagementSection({ showToast }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editModal, setEditModal]   = useState(null); // { user }
  const [saving,    setSaving]      = useState(false);
  const [editForm,  setEditForm]    = useState({});
  const [conflict,  setConflict]    = useState([]); // users with conflicting records

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    // Load ALL profiles with their student and staff records
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id, full_name, email, phone, role, active, created_at, total_xp,
        students(id, level, scholarship,
          enrollments(id, program_id, status)
        ),
        staff(id, position, department, active)
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) { showToast("Error: " + error.message, R); setLoading(false); return; }

    const profiles = data || [];

    // Detect conflicts: users whose role doesn't match their records
    const conflicts = profiles.filter(p => {
      const hasStudent = p.students?.length > 0;
      const hasStaff   = p.staff?.length > 0;
      const isStaffRole = ["docente","coordinadora","admin","cobros","asesor_ventas","directivo"].includes(p.role);
      const isStudentRole = p.role === "estudiante";
      // Conflict: has staff record but role=estudiante, OR has student record but role=docente
      return (hasStaff && isStudentRole) || (hasStudent && isStaffRole && p.students[0]?.enrollments?.some(e => e.status === "active"));
    });

    setUsers(profiles);
    setConflict(conflicts);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let res = users;
    if (roleFilter !== "all") res = res.filter(u => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(u =>
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    }
    return res;
  }, [users, roleFilter, search]);

  // KPIs
  const kpis = useMemo(() => ({
    total:      users.length,
    active:     users.filter(u => u.active !== false).length,
    byRole:     ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.id).length })),
    conflicts:  conflict.length,
  }), [users, conflict]);

  function openEdit(user) {
    setEditForm({ role: user.role, active: user.active !== false, full_name: user.full_name });
    setEditModal({ user });
  }

  async function saveEdit() {
    if (!editModal) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({
          role:      editForm.role,
          active:    editForm.active,
          full_name: editForm.full_name,
        })
        .eq("id", editModal.user.id);

      if (error) throw error;

      // Log the change
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from("audit_log").insert({
        actor_id:  session?.user?.id,
        action:    "user_role_updated",
        entity:    "profile",
        entity_id: editModal.user.id,
        metadata:  {
          old_role:  editModal.user.role,
          new_role:  editForm.role,
          email:     editModal.user.email,
        },
      }).catch(() => {});

      setUsers(us => us.map(u =>
        u.id === editModal.user.id
          ? { ...u, role: editForm.role, active: editForm.active, full_name: editForm.full_name }
          : u
      ));
      setConflict(prev => prev.filter(c => c.id !== editModal.user.id));
      setEditModal(null);
      showToast(`✓ Usuario actualizado — rol: ${editForm.role}`);
    } catch(e) {
      showToast("Error: " + e.message, R);
    } finally {
      setSaving(false);
    }
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
      Nombre:    u.full_name || "—",
      Email:     u.email || "—",
      Rol:       u.role,
      Activo:    u.active !== false ? "Sí" : "No",
      Matrículas:u.students?.[0]?.enrollments?.filter(e=>e.status==="active").length || 0,
      XP:        u.total_xp || 0,
      Registro:  new Date(u.created_at).toLocaleDateString("es-HN"),
    })),
    `usuarios-${new Date().toISOString().slice(0,10)}.csv`
  );

  return (
    <div>
      {/* Conflict alert */}
      {conflict.length > 0 && (
        <div style={{ background: RD, border: `1px solid ${R}40`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: R }}>
          <strong>⚠ {conflict.length} usuario{conflict.length > 1 ? "s" : ""} con rol conflictivo</strong>
          <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.7 }}>
            {conflict.map(u => (
              <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span>{u.full_name} ({u.email})</span>
                <span>— rol: <strong>{u.role}</strong></span>
                <button onClick={() => openEdit(u)}
                  style={{ fontSize:11, padding: "1px 8px", background: P, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                  Corregir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginBottom: 14 }}>
        {[
          { l: "Total", v: kpis.total, c: P },
          { l: "Activos", v: kpis.active, c: G },
          { l: "Conflictos", v: kpis.conflicts, c: kpis.conflicts > 0 ? R : G },
          ...kpis.byRole.filter(r => r.count > 0).slice(0, 5).map(r => ({ l: r.label, v: r.count, c: r.color })),
        ].map((k, i) => (
          <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.c, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize:11, color: "var(--text-secondary)", marginTop: 2 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filters + toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13, background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "inherit" }}/>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 9, fontSize: 12, background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "inherit" }}>
          <option value="all">Todos los roles</option>
          {ROLES.map(r => <option key={r.id} value={r.id}>{r.label} ({users.filter(u=>u.role===r.id).length})</option>)}
        </select>
        <button onClick={exportUsers}
          style={{ padding: "8px 14px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", color: "var(--text-secondary)" }}>
          ↓ CSV
        </button>
      </div>

      {/* User table */}
      {loading
        ? <div style={{ padding: 32, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>Cargando usuarios...</div>
        : (
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "var(--bg-surface-subtle)" }}>
                    {["Nombre", "Email", "Rol", "Matrículas", "XP", "Estado", "Acciones"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize:11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const activeEnrolls = u.students?.[0]?.enrollments?.filter(e => e.status === "active") || [];
                    const isConflict = conflict.some(c => c.id === u.id);
                    return (
                      <tr key={u.id}
                        onMouseEnter={e=>{ if(!isConflict) e.currentTarget.style.background="var(--bg-surface-subtle)"; }}
                        onMouseLeave={e=>{ e.currentTarget.style.background=isConflict?"#fff5f5":""; }}
                        style={{ borderTop: "1px solid var(--border-tertiary)", background: isConflict ? "#fff5f5" : "transparent", transition:"background .1s" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                          {isConflict && <i className="ti ti-alert-triangle" title="Rol conflictivo" style={{color:"var(--amber)",marginRight:5,fontSize:14}} aria-label="Rol conflictivo"/>}
                          {u.full_name || "—"}
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-secondary)" }}>{u.email || "—"}</td>
                        <td style={{ padding: "8px 12px" }}><RoleBadge role={u.role} /></td>
                        <td style={{ padding: "8px 12px", fontSize: 12, color: activeEnrolls.length > 0 ? G : "var(--text-tertiary)", fontWeight: activeEnrolls.length > 0 ? 600 : 400 }}>
                          {activeEnrolls.length > 0 ? activeEnrolls.map(e => e.program_id).join(", ") : "—"}
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: 11, color: A }}>
                          {u.total_xp ? `⚡${u.total_xp}` : "—"}
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ fontSize:11, padding: "2px 7px", borderRadius: 9, background: u.active !== false ? GD : "var(--bg-surface-subtle)", color: u.active !== false ? G : "var(--text-tertiary)", fontWeight: 600 }}>
                            {u.active !== false ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => openEdit(u)}
                              style={{ padding: "4px 10px", background: PD, color: P, border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                              ✎ Rol
                            </button>
                            <button onClick={() => toggleActive(u)}
                              style={{ padding: "4px 8px", background: u.active !== false ? RD : GD, color: u.active !== false ? R : G, border: "none", borderRadius: 6, fontSize:11, cursor: "pointer", fontFamily: "inherit" }}>
                              {u.active !== false ? "Desact." : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "8px 14px", fontSize: 11, color: "var(--text-tertiary)", borderTop: "1px solid var(--border-tertiary)" }}>
              {filtered.length} usuario{filtered.length !== 1 ? "s" : ""} {roleFilter !== "all" ? `con rol ${roleFilter}` : "en total"}
            </div>
          </div>
        )
      }

      {/* Edit modal */}
      {editModal && (
        <div style={{ position: "fixed", inset: 0, zIndex:"var(--z-modal)", background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setEditModal(null); }}>
          <div style={{ background: "var(--bg-surface)", borderRadius: 18, padding: 24, width: "min(420px,100vw - 32px)", border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Editar usuario</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 18 }}>{editModal.user.email}</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Nombre</div>
              <input value={editForm.full_name || ""} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13, background: "var(--bg-surface-subtle)", color: "var(--text-primary)", fontFamily: "inherit" }}/>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 5 }}>Rol del sistema</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {ROLES.map(r => (
                  <button key={r.id} onClick={() => setEditForm(f => ({ ...f, role: r.id }))}
                    style={{ padding: "8px 10px", borderRadius: 8, border: `2px solid ${editForm.role === r.id ? r.color : "var(--border)"}`, background: editForm.role === r.id ? r.bg : "var(--bg-surface-subtle)", color: editForm.role === r.id ? r.color : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Warning if role change could cause conflicts */}
            {editModal.user.role !== editForm.role && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 11, color: A }}>
                Cambiando rol de <strong>{editModal.user.role}</strong> → <strong>{editForm.role}</strong>
                {editModal.user.students?.length > 0 && editForm.role !== "estudiante" && (
                  <div style={{ marginTop: 4 }}>⚠ Este usuario tiene {editModal.user.students[0]?.enrollments?.filter(e=>e.status==="active").length || 0} matrícula(s) activa(s). Considera mantener acceso al portal de estudiante.</div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={editForm.active} onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))}/>
                <span>Cuenta activa</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: "10px", background: "var(--bg-surface-subtle)", border: "1px solid var(--border)", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "var(--text-secondary)" }}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving}
                style={{ flex: 2, padding: "10px", background: P, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: saving ? .6 : 1 }}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
