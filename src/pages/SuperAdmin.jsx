import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { api } from "../lib/api.js";
import { toast as globalToast } from "../lib/toast.jsx";
import { useConfirm } from "../lib/ConfirmModal.jsx";
import { getAuditLog, getPrograms } from "../lib/db.js";

const P = "#155266", PH = "#0f3d4d", PD = "#e8f3f6";
const Y = "#ffbb23", YD = "#fff8e6";
const G = "#059669", GD = "#ecfdf5";
const R = "#dc2626", RD = "#fef2f2";
const A = "#d97706", AD = "#fffbeb";


// Programs loaded from Supabase only

const MRR_DATA = [];  // no demo data
const MRR_MONTHS= ["E","F","M","A","M","J","J","A","S","O","N","D"];

const ROLES_DEF = [];  // roles loaded from Supabase (profiles distinct roles)

const INTEGRATIONS = [
  { id:"google",    name:"Google OAuth",    icon:"🔑", configured:true,  key:"Activo — login con Google funciona",        hint:"" },
  { id:"mailrelay", name:"Email (Resend)", icon:"📧", configured:true,  key:"Agregar RESEND_API_KEY en Vercel → resend.com/api-keys", hint:"Free tier: 100 emails/día" },
  { id:"ms365",     name:"Microsoft 365",  icon:"🪟", configured:true,  key:"Teams link se configura por grupo en Coordinación", hint:"" },
  { id:"stripe",    name:"Stripe",         icon:"💳", configured:false, key:"Falta STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET",   hint:"Agregar en Vercel" },
  { id:"twilio",    name:"Twilio WhatsApp",icon:"💬", configured:false, key:"Falta TWILIO_ACCOUNT_SID, AUTH_TOKEN y FROM",       hint:"Agregar en Vercel" },
];

// Holidays loaded from Supabase

// Audit log loaded from Supabase only

// Cycle levels loaded from cycle_config in Supabase

const XP_ACTIONS = [
  { key:"attend_class",   label:"Asistir a clase",            xp:50  },
  { key:"pass_exam_1st",  label:"Aprobar examen 1er intento", xp:100 },
  { key:"perfect_score",  label:"Nota perfecta (100%)",       xp:200 },
  { key:"practice_unit",  label:"Completar práctica 24/7",    xp:25  },
  { key:"streak_7",       label:"Racha 7 días",               xp:150 },
  { key:"complete_level", label:"Completar un nivel",         xp:500 },
  { key:"refer_friend",   label:"Referir un amigo activo",    xp:300 },
];

const NAV = [
  { id:"overview",      icon:"ti-layout-dashboard", label:"Panel general"       },
  { id:"programs",      icon:"ti-books",             label:"Académico"           },
  { id:"hr",            icon:"ti-users-group",       label:"RRHH & Personal"     },
  { id:"gamification",  icon:"ti-trophy",            label:"Gamificación"        },
  { id:"notifications", icon:"ti-bell",              label:"Notificaciones"      },
  { id:"audit",         icon:"ti-list-details",      label:"Auditoría"           },
  { id:"banks",         icon:"ti-building-bank",     label:"Cuentas banco"       },
];

const ROLE_COLORS = {
  "Docente":["#e8f3f6","#155266"], "Coordinadora":["#ede9fe","#6d28d9"],
  "Admin":["#dbeafe","#1e40af"],   "Gestor de Cobros":["#fffbeb","#d97706"],
  "Ventas":["#ecfdf5","#059669"],  "Marketing":["#fff8e6","#92400e"],
  "IT":["#f1f5f9","#475569"],      "Contabilidad":["#fce7f3","#9d174d"],
  "Soporte":["#f0fdf4","#166534"],
};

// ─── UI helpers ──────────────────────────────────────────────────
function Badge({ text, bg="#f1f5f9", color="#475569" }) {
  return <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:bg, color, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>;
}
function Stat({ label, value, sub, color, icon, up }) {
  return (
    <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px", borderTop:`3px solid ${color}`, boxShadow:"var(--shadow-sm)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{label}</div>
        <i className={"ti "+icon} style={{ fontSize:16, color }} aria-hidden="true" />
      </div>
      <div style={{ fontSize:24, fontWeight:800, color:"var(--text-primary)", lineHeight:1, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color: up===true?G:up===false?R:"var(--text-tertiary)" }}>{up===true?"↑ ":up===false?"↓ ":""}{sub}</div>}
    </div>
  );
}
function SectionTitle({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.8, marginBottom:12, paddingBottom:8, borderBottom:"1px solid var(--border)" }}>{children}</div>;
}
function MiniBar({ value, max, color }) {
  return <div style={{ flex:1, height:7, background:"var(--bg-surface-subtle)", borderRadius:4, overflow:"hidden" }}><div style={{ height:"100%", width:`${Math.round(value/(max||1)*100)}%`, background:color, borderRadius:4 }}/></div>;
}
function Input({ value, onChange, placeholder, type="text" }) {
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }} />;
}
function Field({ label, children }) {
  return <div style={{ marginBottom:12 }}><label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5, fontWeight:500 }}>{label}</label>{children}</div>;
}
function BtnPrimary({ onClick, children, style={} }) {
  return <button onClick={onClick} style={{ padding:"10px 20px", background:P, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", ...style }}>{children}</button>;
}
function BtnGhost({ onClick, children }) {
  return <button onClick={onClick} style={{ padding:"10px 16px", background:"transparent", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:10, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{children}</button>;
}
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:26, animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both", width:460, maxWidth:"100%", border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-tertiary)" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  // toast: usa el sistema global de ../lib/toast.jsx
  const [confirmDialog, ConfirmUI] = useConfirm();
  const [saving,     setSaving]     = useState(false);
  const [dbAudit,    setDbAudit]    = useState([]);
  const [realStats,  setRealStats]  = useState(null);   // from /api/admin/stats
  const [statsLoading, setStatsLoading] = useState(true);

  function showToast(msg, color) {
    if (!color || color === "#059669" || color === "green") globalToast.success(msg);
    else if (color === "#dc2626" || color === "red" || color === "#ef4444") globalToast.error(msg);
    else if (color === "#d97706" || color === "#f59e0b") globalToast.warn(msg);
    else if (color === "#0369a1" || color === "blue") globalToast.info(msg);
    else globalToast.success(msg);
  }

  // Load real stats, audit log, staff and programs from Supabase
  useEffect(() => {
    // Real KPI stats
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setRealStats(json);
        }
      } catch(e) { console.error("Stats:", e); }
      finally { setStatsLoading(false); }
    });

    // Load cycle levels
    supabase.from("cycle_config").select("level, current_unit, program_id")
      .eq("program_id", "en").then(({ data: cyc }) => {
        if (cyc?.length) setCycleLevels(cyc.map(r => ({
          level: r.level, unit: r.current_unit,
          title: `Unidad ${r.current_unit}`, students: 0
        })));
      });

    // Load holidays
    supabase.from("holidays").select("date, name, affects_cycle")
      .order("date").then(({ data: hols }) => {
        if (hols?.length) setHolidays(hols.map(h => ({
          date: new Date(h.date).toLocaleDateString("es-HN", {day:"2-digit", month:"short", year:"numeric"}),
          name: h.name, affects: h.affects_cycle
        })));
      });

    getAuditLog({ limit: 50 }).then(data => {
      if (data.length > 0) setDbAudit(data);
    });

    // Load real staff — all:true trae activos e inactivos
    const loadStaff = async () => {
      try {
        const { getStaff } = await import("../lib/db.js");
        const rows = await getStaff({ all: true });
        const roleLabel = { docente:"Docente", coordinadora:"Coordinadora", admin:"Admin", cobros:"Gestor de Cobros", asesor_ventas:"Ventas" };
        setStaff(rows.map(r => ({
          id:      r.id,
          name:    r.profile?.full_name || r.profile?.email || "Sin nombre",
          role:    roleLabel[r.profile?.role] || r.position || "Staff",
          email:   r.profile?.email || "",
          phone:   r.profile?.phone || "—",
          country: "Honduras",
          salary:  r.salary || 0,
          hired:   r.hire_date ? new Date(r.hire_date).toLocaleDateString("es-HN",{month:"short",year:"numeric"}) : "—",
          status:  r.active ? "active" : "inactive",
          levels:  [],
        })));
      } catch(e) { console.error("loadStaff:", e.message); }
    };
    loadStaff();

    getPrograms().then(data => {
      if (data.length > 0) {
        setPrograms(data.map(p => ({
          id: p.id, name: p.name,
          code: p.id.toUpperCase(),
          levels: "A1-C1",
          price: p.price_monthly || p.price_quarterly || 0,
          interval: p.price_monthly ? "mes" : "trimestre",
          students: 0,
          active: p.active,
          color: { en:"#155266", va:"#7c3aed", va_mkt:"#d97706", va_legal:"#059669", va_care:"#dc2626" }[p.id] || "#155266",
          icon: { en:"🇬🇧", va:"💻", va_mkt:"📱", va_legal:"⚖️", va_care:"🏥" }[p.id] || "📚",
          desc: p.name,
        })));
      }
    });
  }, []);

  // Session guard — only listen for sign-out (PrivateRoute handles role verification)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        navigate("/", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const [view,       setView]       = useState("overview");
  const [subView,    setSubView]    = useState("progs");
  const [staff,      setStaff]      = useState([]);
  const [programs,   setPrograms]   = useState([]);
  const [holidays,   setHolidays]   = useState([]);
  const [cycleLevels, setCycleLevels] = useState([]);
  const [xpVals,     setXpVals]     = useState(Object.fromEntries(XP_ACTIONS.map(a=>[a.key,a.xp])));
  const [leaderPct,  setLeaderPct]  = useState(15);
  const [newHoliday, setNewHoliday] = useState({ date:"", name:"", affects:true });
  const [editPrice,  setEditPrice]  = useState(null);
  const [tmpPrice,   setTmpPrice]   = useState("");

  // Staff CRUD
  const [staffModal,    setStaffModal]    = useState(null);
  const [staffForm,     setStaffForm]     = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [staffFilter,   setStaffFilter]   = useState("all");

  // Program CRUD
  const [progModal, setProgModal] = useState(null);
  const [progForm,  setProgForm]  = useState({});

  // Real KPIs — 0 when no data, never fake numbers
  const totalMRR      = realStats?.mrr          ?? 0;
  const prevMRR       = realStats?.mrrLastMonth ?? 0;
  const mrrGrowth     = prevMRR > 0 ? ((totalMRR - prevMRR) / prevMRR * 100).toFixed(1) : "0.0";
  const totalStudents = realStats?.totalStudents ?? 0;
  const arpu          = realStats?.arpu ? parseFloat(realStats.arpu) : (totalStudents > 0 ? Math.round(totalMRR / totalStudents) : 0);
  const ltv           = arpu > 0 ? Math.round(arpu / 0.048) : 0;
  const annualRun     = realStats?.arr ?? totalMRR * 12;
  const churnRate     = "—";   // Need cohort data
  const nomina        = staff.filter(s=>s.status==="active").reduce((a,s)=>a+(+s.salary||0),0);
  const staffCount    = realStats?.totalStaff ?? staff.filter(s=>s.status==="active").length;
  const activeEnrolls = realStats?.activeEnrolls ?? 0;
  const newThisMonth  = realStats?.newStudentsMonth ?? 0;

  const filteredStaff = staffFilter==="all" ? staff : staff.filter(s=>s.role===staffFilter);

  function openAddStaff() {
    setSaving(false); // Reset in case previous attempt left saving=true
    setStaffForm({ name:"", role:"Docente", email:"", phone:"", country:"Honduras", salary:"", hired:"", status:"active", levels:[] });
    setStaffModal({ mode:"add" });
  }
  function openEditStaff(s) { setStaffForm({...s, levels:s.levels||[]}); setStaffModal({mode:"edit", data:s}); }
  function openViewStaff(s) { setStaffModal({mode:"view", data:s}); }
  async function saveStaff() {
    const nombre = (staffForm.name || "").trim();
    const correo = (staffForm.email || "").trim();
    const telefono = (staffForm.phone || "").trim();
    const salario = staffForm.salary;

    // Validaciones
    if (!nombre || nombre.length < 3) {
      globalToast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      globalToast.error("Ingresá un email válido (ej: nombre@dominio.com)");
      return;
    }
    if (telefono && !/^[+\d\s()-]{7,20}$/.test(telefono)) {
      globalToast.error("El teléfono debe tener entre 7 y 20 dígitos");
      return;
    }
    if (salario && (isNaN(Number(salario)) || Number(salario) < 0)) {
      globalToast.error("El salario debe ser un número positivo");
      return;
    }
    // Show immediate feedback
    const modoActual = staffModal?.mode;
    setStaffModal(null);
    setSaving(true);
    try {
      if (modoActual === "add") {
        globalToast.info("Creando usuario…");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { globalToast.error("Sesión expirada — recargá la página"); setSaving(false); return; }
        const res = await fetch("/api/auth/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
          body: JSON.stringify({ action:"staff", email:correo, fullName:nombre, role:staffForm.role||"Docente", salary:staffForm.salary||null, hireDate:new Date().toISOString().slice(0,10) }),
        });
        const json = await res.json().catch(()=>({}));
        if (!res.ok || !json.ok) {
          globalToast.error("Error: " + (json.error || json.message || `HTTP ${res.status}`));
        } else {
          globalToast.success(json.data?.message || `✓ ${nombre} creado`);
          const { getStaff } = await import("../lib/db.js");
          const rows = await getStaff({ all: true });
          const rl = { docente:"Docente", coordinadora:"Coordinadora", admin:"Admin", cobros:"Gestor de Cobros", asesor_ventas:"Ventas" };
          setStaff(rows.map(r => ({
            id:r.id, name:r.profile?.full_name||r.profile?.email||nombre,
            role:rl[r.profile?.role]||r.position||staffForm.role,
            email:r.profile?.email||correo, phone:r.profile?.phone||"—",
            country:"Honduras", salary:r.salary||0,
            hired:r.hire_date?new Date(r.hire_date).toLocaleDateString("es-HN",{month:"short",year:"numeric"}):"—",
            status:r.active?"active":"inactive", levels:[],
          })));
        }
      } else {
        // Update existing staff
        const roleMap = {
          "Docente":"docente","Coordinadora":"coordinadora","Admin":"admin",
          "Gestor de Cobros":"cobros","Ventas":"asesor_ventas",
          "Marketing":"asesor_ventas","IT":"admin","Soporte":"admin",
          "Contabilidad":"cobros",
        };
        const { data: profile } = await supabase
          .from("profiles").select("id").eq("email", staffForm.email).maybeSingle();
        if (profile) {
          await supabase.from("profiles").update({
            full_name: staffForm.name,
            role: roleMap[staffForm.role] || "docente",
            active: staffForm.status === "active",
          }).eq("id", profile.id);
        }
        setStaff(p => p.map(s => s.id === staffModal.data.id ? { ...s, ...staffForm } : s));
        showToast("Empleado actualizado correctamente");
      }
    } catch (e) {
      globalToast.error("Error: " + (e.message || "Intentá de nuevo"));
    } finally {
      setSaving(false);
    }
  }
  async function deleteStaff(id) {
    const member = staff.find(s => s.id === id);
    // Proteger contra auto-eliminación y borrado de super_admin
    if (member?.role === "Super Admin" || member?.role === "super_admin") {
      showToast("No se puede desactivar al Super Admin", R);
      setDeleteConfirm(null);
      return;
    }
    try {
      if (member?.email) {
        const { data: profile } = await supabase
          .from("profiles").select("id").eq("email", member.email).maybeSingle();
        if (profile) {
          await supabase.from("profiles").update({ active: false }).eq("id", profile.id);
          await supabase.from("staff").update({ active: false })
            .eq("profile_id", profile.id);
        }
      }
      // Marcar como inactivo en la lista — NO borrar del estado
      setStaff(p => p.map(s => s.id === id ? { ...s, status: "inactive" } : s));
      showToast("Empleado desactivado — puede reactivarse");
    } catch(e) { showToast("Error: " + e.message, R); }
    setDeleteConfirm(null); setStaffModal(null);
  }

  function openAddProg() {
    setProgForm({ name:"", code:"", levels:"A1-C1", price:"", interval:"mes", icon:"📚", color:P, desc:"", active:true });
    setProgModal({mode:"add"});
  }
  function openEditProg(p) { setProgForm({...p}); setProgModal({mode:"edit",data:p}); }
  async function saveProg() {
    setSaving(true);
    try {
      if (progModal.mode === "add") {
        setPrograms(p => [...p, { ...progForm, id: Date.now(), students: 0, price: +progForm.price }]);
        showToast(`Programa "${progForm.name}" creado (guardá en Supabase manualmente)`);
      } else {
        // Update price in Supabase
        const priceVal = +progForm.price;
        const isMonthly = progForm.interval !== "trimestre" && progForm.interval !== "año";
        await supabase.from("programs").update({
          name:             progForm.name,
          price_monthly:    isMonthly ? priceVal : null,
          price_quarterly:  !isMonthly ? priceVal : null,
          active:           progForm.active,
        }).eq("id", progModal.data.id);
        setPrograms(p => p.map(x => x.id === progModal.data.id
          ? { ...x, ...progForm, price: priceVal } : x));
        showToast("Programa actualizado correctamente");
      }
    } catch(e) { showToast("Error: " + e.message, R); }
    finally { setSaving(false); setProgModal(null); }
  }

  return (
    <>
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-page)", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width:218, background:PH, display:"flex", flexDirection:"column", padding:"0 0 16px", flexShrink:0, minHeight:"100vh", position:"sticky", top:0 }}>
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>
          <div style={{ fontSize:11, color:Y, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>World Connect Academy</div>
          <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>Super Admin</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:2 }}>Control total del sistema</div>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setView(n.id);setSubView(n.id==="programs"?"progs":n.id==="hr"?"staff":"");}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 18px", border:"none", background:view===n.id?"rgba(255,255,255,.12)":"transparent", color:view===n.id?"#fff":"rgba(255,255,255,.45)", fontSize:12, cursor:"pointer", textAlign:"left", borderLeft:`2px solid ${view===n.id?Y:"transparent"}`, transition:"all .15s", fontFamily:"inherit", fontWeight:view===n.id?600:400, width:"100%" }}>
              <i className={"ti "+n.icon} style={{ fontSize:14, width:18, textAlign:"center" }} aria-hidden="true"/>
              {n.label}
              {n.id==="bi" && <span style={{ marginLeft:"auto", fontSize:8, background:Y, color:PH, padding:"2px 5px", borderRadius:8, fontWeight:700 }}>EXCLUSIVO</span>}
            </button>
          ))}
        </div>
        <div style={{ padding:"14px 18px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:Y, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:PH }}>SA</div>
            <div><div style={{ fontSize:12, color:"#fff", fontWeight:600 }}>Super Admin</div><div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>wcahub.com</div></div>
          </div>
        </div>
      

        <button
          onClick={()=>navigate("/")}
          title="Cerrar sesión"
          aria-label="Cerrar sesión y volver al inicio"
          style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"10px 18px", background:"transparent", border:"none", borderTop:"1px solid rgba(255,255,255,.08)", marginTop:8, color:"rgba(255,255,255,.35)", fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
          onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(220,38,38,.15)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.35)";e.currentTarget.style.background="transparent";}}>
          <i className="ti ti-logout" style={{fontSize:14}} aria-hidden="true"/>
          Cerrar sesión
        </button>
      </aside>

      {/* Toast: usa ToastContainer global en App.jsx */}
      {/* MAIN */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        <div style={{ height:60, background:"var(--bg-surface)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>
              {{"overview":"Panel general","programs":"Gestión académica","hr":"RRHH & Personal","gamification":"Gamificación","notifications":"Notificaciones","audit":"Auditoría","banks":"Cuentas banco"}[view]}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Badge text="Sistema activo" bg={GD} color="#065f46"/>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* ── OVERVIEW ── */}
          {view==="overview" && <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
              <Stat label="MRR actual"           value={statsLoading ? "—" : totalMRR > 0 ? `$${totalMRR.toLocaleString()}` : "$0"} sub={totalMRR > 0 ? `+${mrrGrowth}% vs mes anterior` : "Sin pagos aún"} color={P}  icon="ti-trending-up"   up={parseFloat(mrrGrowth)>0}/>
              <Stat label="Estudiantes activos"  value={statsLoading ? "—" : totalStudents} sub={activeEnrolls > 0 ? `${activeEnrolls} matrículas activas` : "Sin matrículas aún"} color={G}  icon="ti-users"         />
              <Stat label="Personal activo"      value={statsLoading ? "—" : staffCount} sub={`${staff.filter(s=>s.role==="Docente"&&s.status==="active").length} docentes`} color={A} icon="ti-users-group"/>
              <Stat label="Programas activos"    value={programs.filter(p=>p.active).length} sub={`${programs.filter(p=>!p.active).length} inactivos`} color="var(--text-secondary)" icon="ti-books"/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:20 }}>
              <Stat label="ARR proyectado"       value={statsLoading ? "—" : annualRun > 0 ? `$${Math.round(annualRun).toLocaleString()}` : "$0"} sub="Proyectado anual"  color={G}  icon="ti-calendar"   up={annualRun>0}/>
              <Stat label="Churn rate"           value={churnRate}        sub="Datos insuficientes" color="var(--text-secondary)" icon="ti-door-exit"  />
              <Stat label="ARPU"                 value={arpu > 0 ? `$${arpu}` : "—"} sub="Por alumno/mes"    color={P}  icon="ti-coin"       />
              <Stat label="Nómina mensual"       value={nomina > 0 ? `$${nomina.toLocaleString()}` : "—"} sub="USD total staff" color="var(--text-secondary)" icon="ti-receipt"/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:14, marginBottom:14 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, boxShadow:"var(--shadow-sm)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>MRR — 12 meses</div>
                  <div style={{ fontSize:11, color:totalMRR>0?G:"var(--text-tertiary)", fontWeight:600 }}>{totalMRR>0?`+${mrrGrowth}% vs mes ant.`:"Sin datos aún"}</div>
                </div>
                <svg width="100%" height={110} viewBox="0 0 500 110" preserveAspectRatio="none">
                  <defs><linearGradient id="mrg2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={P} stopOpacity={0.15}/><stop offset="100%" stopColor={P} stopOpacity={0}/></linearGradient></defs>
                  {(()=>{
                    const mx=20000,mn=6000;
                    if(!MRR_DATA.length) return null; const pts=MRR_DATA.map((v,i)=>({ x:(i/(MRR_DATA.length-1))*488+6, y:100-((v-mn)/(mx-mn))*88+5 }));
                    const line=pts.map(p=>`${p.x},${p.y}`).join(" ");
                    const area=`M${pts[0].x},${pts[0].y} ${pts.slice(1).map(p=>`L${p.x},${p.y}`).join(" ")} L${pts[pts.length-1].x},105 L${pts[0].x},105 Z`;
                    return (<><path d={area} fill="url(#mrg2)"/><polyline points={line} fill="none" stroke={P} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>{pts.map((p,i)=>(<g key={i}><circle cx={p.x} cy={p.y} r={3} fill="var(--bg-surface)" stroke={P} strokeWidth={2}/><text x={p.x} y={108} textAnchor="middle" fontSize={7} fill="var(--text-tertiary)">{MRR_MONTHS[i]}</text></g>))}</>);
                  })()}
                </svg>
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Accesos rápidos</SectionTitle>
                {[["ti-books","Nuevo programa","programs"],["ti-user-plus","Agregar personal","hr"],["ti-coin","Editar precios","programs"],["ti-chart-bar","Ver BI","bi"],["ti-refresh","Control ciclo","cycle"],["ti-calendar","Agregar festivo","programs"]].map(([ic,lb,ac],i)=>(
                  <button key={i} onClick={()=>setView(ac)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, cursor:"pointer", marginBottom:7, textAlign:"left", fontFamily:"inherit", transition:"all .15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=P;e.currentTarget.style.background=PD;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--bg-surface-subtle)";}}>
                    <i className={"ti "+ic} style={{ fontSize:15, color:P, flexShrink:0 }} aria-hidden="true"/>
                    <span style={{ fontSize:12, color:"var(--text-primary)" }}>{lb}</span>
                    <i className="ti ti-chevron-right" style={{ marginLeft:"auto", fontSize:13, color:"var(--text-tertiary)" }} aria-hidden="true"/>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Ingresos por programa</SectionTitle>
                {programs.filter(p=>p.active).map(p=>{
                  const rev=p.students*p.price;
                  const mx=Math.max(...programs.filter(x=>x.active).map(x=>x.students*x.price));
                  return (<div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:11 }}>
                    <span style={{ fontSize:18 }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"var(--text-primary)", marginBottom:4 }}>{p.name}</div>
                      <MiniBar value={rev} max={mx} color={p.color}/>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", minWidth:55, textAlign:"right" }}>${rev.toLocaleString()}</div>
                  </div>);
                })}
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Últimas acciones</SectionTitle>
                {(dbAudit.length > 0 ? dbAudit.slice(0,6).map(a=>({
                    user: a.actor_id ? "Staff" : "Sistema",
                    action: a.action?.replace(/_/g," "),
                    detail: typeof a.metadata === "object" ? Object.values(a.metadata||{}).join(" · ") : (a.metadata||""),
                    time: new Date(a.created_at).toLocaleString("es-HN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}),
                  })) : []).map((a,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:i<5?"1px solid var(--border)":"none" }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:P, flexShrink:0, marginTop:5 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:"var(--text-primary)" }}><strong>{a.user}</strong> — {a.action}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:1 }}>{a.detail}</div>
                    </div>
                    <div style={{ fontSize:11, color:"var(--text-tertiary)", whiteSpace:"nowrap" }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ── BI ── */}
                    {view==="programs" && <>
            {/* Sub-navigation: Programas | Precios | Ciclo | Festivos */}
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {[["progs","Programas"],["prices","Precios"],["cycle","Ciclo"],["holidays","Festivos"]].map(([id,label])=>(
                <button key={id} onClick={()=>setSubView(id)} style={{ padding:"7px 16px", borderRadius:9, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  background: subView===id ? P : "var(--bg-surface-subtle)", color: subView===id ? "#fff" : "var(--text-secondary)" }}>{label}</button>
              ))}
            </div>
            {subView==="progs" && <>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:14 }}>
              <BtnPrimary onClick={openAddProg} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <i className="ti ti-plus" style={{ fontSize:14 }} aria-hidden="true"/> Nuevo programa
              </BtnPrimary>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
              {programs.map(p=>(
                <div key={p.id} style={{ background:"var(--bg-surface)", border:`1.5px solid ${p.active?p.color+"40":"var(--border)"}`, borderRadius:16, padding:20, boxShadow:"var(--shadow-sm)", opacity:p.active?1:.7 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <div style={{ width:48, height:48, borderRadius:12, background:`${p.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{p.icon}</div>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{p.name}</div>
                        <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}><code style={{ background:"var(--bg-surface-subtle)", padding:"1px 7px", borderRadius:5, fontSize:10 }}>{p.code}</code>{" · "}{p.levels}</div>
                      </div>
                    </div>
                    <Badge text={p.active?"Activo":"Inactivo"} bg={p.active?GD:RD} color={p.active?"#065f46":R}/>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.7, marginBottom:14 }}>{p.desc}</div>
                  <div style={{ display:"flex", gap:10, marginBottom:14 }}>
                    <div style={{ flex:1, background:"var(--bg-surface-subtle)", borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:p.color }}>${p.price}</div>
                      <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>/{p.interval}</div>
                    </div>
                    <div style={{ flex:1, background:"var(--bg-surface-subtle)", borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>{p.students}</div>
                      <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>estudiantes</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:7 }}>
                    <button onClick={()=>openEditProg(p)} style={{ flex:1, padding:"8px", background:PD, color:P, border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✎ Editar</button>
                    <button onClick={()=>setPrograms(prev=>prev.map(x=>x.id===p.id?{...x,active:!x.active}:x))} style={{ flex:1, padding:"8px", background:p.active?RD:GD, color:p.active?R:G, border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>{p.active?"Desactivar":"Activar"}</button>
                    {p.students===0 && <button onClick={async()=>{
  const { error } = await supabase.from("programs").update({active:false}).eq("id",p.id);
  if(error) showToast("Error: "+error.message, R);
  else { setPrograms(prev=>prev.map(x=>x.id===p.id?{...x,active:false}:x)); showToast("Programa desactivado"); }
}} style={{ padding:"8px 12px", background:RD, color:R, border:"none", borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>Desactivar</button>}
                  </div>
                </div>
              ))}
            </div>
          </>}
          </>}

          {/* ── HR ── */}
          {view==="hr" && <>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {[["staff","Personal"],["roles","Roles del sistema"]].map(([id,label])=>(
                <button key={id} onClick={()=>setSubView(id)} style={{ padding:"7px 16px", borderRadius:9, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                  background: (subView==="staff"||subView==="roles"?subView:"staff")===id ? P : "var(--bg-surface-subtle)", color: (subView==="staff"||subView==="roles"?subView:"staff")===id ? "#fff" : "var(--text-secondary)" }}>{label}</button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:16 }}>
              <Stat label="Personal total"   value={staff.length}                                   sub={`${staff.filter(s=>s.status==="active").length} activos`} color={P}  icon="ti-users-group"/>
              <Stat label="Docentes"         value={staff.filter(s=>s.role==="Docente").length}     sub="Activos"            color={A} icon="ti-school"/>
              <Stat label="Personal admin"   value={staff.filter(s=>s.role!=="Docente").length}     sub="Roles internos"     color={G} icon="ti-briefcase"/>
              <Stat label="Nómina mensual"   value={`$${nomina.toLocaleString()}`}                  sub="USD total"          color="var(--text-secondary)" icon="ti-coin"/>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              <select value={staffFilter} onChange={e=>setStaffFilter(e.target.value)} style={{ padding:"9px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:12, background:"var(--bg-surface)", color:"var(--text-primary)", fontFamily:"inherit" }}>
                <option value="all">Todos los roles</option>
                {[...new Set(staff.map(s=>s.role))].map(r=><option key={r}>{r}</option>)}
              </select>
              <div style={{ marginLeft:"auto" }}>
                <BtnPrimary onClick={openAddStaff} style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <i className="ti ti-user-plus" style={{ fontSize:14 }} aria-hidden="true"/> Agregar personal
                </BtnPrimary>
              </div>
            </div>
            <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr style={{ background:"var(--bg-surface-subtle)" }}>
                  {["Nombre","Rol","Email","Salario","Estado",""].map(h=><th key={h} style={{ padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredStaff.map((s,i)=>{
                    const [rc,tc]=ROLE_COLORS[s.role]||["var(--bg-surface-subtle)","var(--text-secondary)"];
                    return (<tr key={s.id} style={{ borderTop:"1px solid var(--border)", cursor:"pointer", transition:"background .1s" }} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{ padding:"13px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:"50%", background:PD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:P, flexShrink:0 }}>{s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                          <div><div style={{ fontWeight:600, color:"var(--text-primary)" }}>{s.name}</div><div style={{ fontSize:11, color:"var(--text-tertiary)" }}>{s.hired}</div></div>
                        </div>
                      </td>
                      <td style={{ padding:"13px 14px" }}><Badge text={s.role} bg={rc} color={tc}/></td>
                      <td style={{ padding:"13px 14px", color:"var(--text-secondary)", fontSize:12 }}>{s.email}</td>
                      <td style={{ padding:"13px 14px", fontWeight:600, color:"var(--text-primary)" }}>${s.salary||"—"}</td>
                      <td style={{ padding:"13px 14px" }}><Badge text={s.status==="active"?"Activo":"Inactivo"} bg={s.status==="active"?GD:RD} color={s.status==="active"?"#065f46":R}/></td>
                      <td style={{ padding:"13px 14px" }}>
                        <div style={{ display:"flex", gap:5 }}>
                          <button onClick={()=>openViewStaff(s)} style={{ fontSize:11, padding:"5px 10px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Ver</button>
                          <button onClick={()=>openEditStaff(s)} style={{ fontSize:11, padding:"5px 10px", background:PD, color:P, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Editar</button>
                          <button title="Reenviar invitación" aria-label="Reenviar email de invitación" onClick={async()=>{
                            try {
                              showToast("Enviando invitación…", "#0369a1");
                              const {data:{session}} = await supabase.auth.getSession();
                              const r = await fetch("/api/auth/invite",{
                                method:"POST",
                                headers:{"Content-Type":"application/json",Authorization:`Bearer ${session?.access_token}`},
                                body:JSON.stringify({action:"resend-supabase", email:s.email})
                              });
                              const d = await r.json();
                              if(d.data?.ok) showToast(`✉ Invitación enviada a ${s.email} — revisá bandeja y spam`);
                              else showToast(d.data?.message || d.error || "Error al reenviar", R);
                            } catch(e){showToast("Error: "+e.message, R);}
                          }} style={{ fontSize:11, padding:"5px 10px", background:PD, color:P, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>✉ Reenviar</button>
                          <button onClick={()=>setDeleteConfirm(s)} style={{ fontSize:11, padding:"5px 10px", background:RD, color:R, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>🗑</button>
                        </div>
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
          </>}

          {/* ── ROLES ── */}
          {view==="hr" && subView==="roles" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"var(--shadow-sm)" }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Roles del sistema ({ROLES_DEF.length})</div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>Para crear usuarios con cada rol usá RRHH & Personal → Agregar empleado</div>
                </div>
                <button onClick={()=>{ setView("hr"); setTimeout(()=>setStaffModal({mode:"add"}),100); }} style={{ fontSize:12, padding:"9px 18px", background:PD, color:P, border:"none", borderRadius:9, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                  + Nuevo usuario
                </button>
              </div>
              {ROLES_DEF.map((r,i)=>{
                const [rc,tc]=ROLE_COLORS[r.name]||["var(--bg-surface-subtle)","var(--text-secondary)"];
                // Count real users from staff array by role
                const roleKeyMap = { "Super Admin":"Super Admin", "Admin":"Admin", "Coordinadora":"Coordinadora", "Docente":"Docente", "Gestor de Cobros":"Gestor de Cobros", "Ventas / Asesor":"Ventas", "Marketing":"Marketing", "IT":"IT", "Contabilidad":"Contabilidad" };
                const matchLabel = roleKeyMap[r.name] || r.name;
                const count = r.name==="Super Admin" ? 1 : staff.filter(s=>s.role===matchLabel||s.role===r.name).length;
                return (
                  <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px", boxShadow:"var(--shadow-sm)", display:"flex", alignItems:"flex-start", gap:14 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:rc||PD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                      <i className={`ti ${r.icon}`} style={{ color:tc||P }} aria-hidden="true"/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{r.name}</div>
                        <Badge text={count===1&&r.name==="Super Admin"?"1 usuario":`${count} ${count===1?"usuario":"usuarios"}`} bg="var(--bg-surface-subtle)" color="var(--text-secondary)"/>
                        <Badge text={`Portal: ${r.portal}`} bg={PD} color={P}/>
                      </div>
                      <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:8 }}>{r.description}</div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {r.perms.map(p=><span key={p} style={{ fontSize:11, padding:"2px 8px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", borderRadius:6, border:"1px solid var(--border)" }}>{p}</span>)}
                      </div>
                    </div>
                    <button onClick={()=>{ setStaffForm(f=>({...f, role: r.name==="Ventas / Asesor"?"Ventas":r.name==="Gestor de Cobros"?"Gestor de Cobros":r.name })); setView("hr"); setTimeout(()=>setStaffModal({mode:"add"}),100); }}
                      style={{ fontSize:11, padding:"7px 14px", background:PD, color:P, border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit", flexShrink:0, whiteSpace:"nowrap" }}>
                      Agregar usuario
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PRICES ── */}
          {view==="programs" && subView==="prices" && (
            <div style={{ maxWidth:600 }}>
              <div style={{ background:AD, border:`1px solid ${A}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:A, display:"flex", gap:8 }}>
                <i className="ti ti-info-circle" style={{ fontSize:14 }} aria-hidden="true"/> Los cambios aplican a nuevas inscripciones.
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                {programs.map(p=>(
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"18px", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:22 }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{p.name}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>Cobro {p.interval} · {p.students} estudiantes</div>
                    </div>
                    {editPrice===p.id ? (
                      <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                        <span style={{ fontSize:14, color:"var(--text-secondary)" }}>$</span>
                        <input autoFocus value={tmpPrice} onChange={e=>setTmpPrice(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") document.querySelector('[data-price-save]')?.click(); }} style={{ width:70, padding:"7px 9px", border:`2px solid ${P}`, borderRadius:8, fontSize:15, fontWeight:700, color:P, textAlign:"center", fontFamily:"inherit" }}/>
                        <BtnPrimary onClick={async()=>{
  const newP = +tmpPrice;
  await supabase.from("programs").update(
    p.interval==="mes"?{price_monthly:newP}:{price_quarterly:newP}
  ).eq("id", p.id).then(()=>showToast("Precio actualizado")).catch(e=>showToast(e.message,R));
  setPrograms(prev=>prev.map(x=>x.id===p.id?{...x,price:newP}:x));
  setEditPrice(null);
}}>✓</BtnPrimary>
                        <BtnGhost onClick={()=>setEditPrice(null)}>✕</BtnGhost>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ fontSize:24, fontWeight:800, color:P }}>${p.price}</div>
                        <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>/{p.interval}</div>
                        <button onClick={()=>{setEditPrice(p.id);setTmpPrice(String(p.price));}} style={{ padding:"6px 14px", background:PD, color:P, border:"none", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✎</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CYCLE ── */}
          {view==="programs" && subView==="cycle" && (
            <div>
              <div style={{ background:RD, border:`1px solid ${R}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:R, display:"flex", gap:8 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize:14 }} aria-hidden="true"/> Reiniciar es irreversible.
              </div>
              {cycleLevels.map(c=>(
                <div key={c.level} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, marginBottom:12, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:PD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:P }}>{c.level}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Nivel {c.level} — U{c.unit}: {c.title}</div>
                      <div style={{ fontSize:12, color:"var(--text-secondary)" }}>{c.students} estudiantes · Próximo: lunes</div>
                    </div>
                    <Badge text="Activo" bg={GD} color="#065f46"/>
                  </div>
                  <div style={{ display:"flex", gap:3, marginBottom:12 }}>
                    {Array.from({length:12},(_,i)=><div key={i} style={{ flex:1, height:8, borderRadius:4, background:i+1<c.unit?P:i+1===c.unit?Y:"var(--bg-surface-subtle)" }}/>)}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <select style={{ flex:1, padding:"8px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}>
                      {Array.from({length:12},(_,i)=><option key={i} selected={i+1===c.unit}>Unidad {i+1}</option>)}
                    </select>
                    <button onClick={async()=>{ try{ await supabase.from("cycle_config").upsert({program_id:"en",level:c.level,current_unit:c.unit},{onConflict:"program_id,level"}); showToast(`Unidad ${c.unit} aplicada para ${c.level}`); }catch(e){showToast("Error: "+e.message, R);} }} style={{ padding:"8px 16px", background:AD, color:A, border:`1px solid ${A}40`, borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Aplicar</button>
                    <button onClick={async()=>{
  const ok = await confirmDialog({ title:`¿Reiniciar nivel ${c.level}?`, body:"Esto restablece la unidad activa a U1 para todos los estudiantes de este nivel. Es irreversible.", danger:true, confirmText:"Sí, reiniciar" });
  if(!ok) return;
  try{ await supabase.from("cycle_config").upsert({program_id:"en",level:c.level,current_unit:1},{onConflict:"program_id,level"}); showToast(`${c.level} reiniciado a U1`); }catch(e){showToast("Error: "+e.message,R);}
}} style={{ padding:"8px 16px", background:RD, color:R, border:`1px solid ${R}40`, borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Reiniciar U1</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── HOLIDAYS ── */}
          {view==="programs" && subView==="holidays" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 310px", gap:14 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Festivos configurados</div>
                {holidays.map((h,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:h.affects?R:A, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:"var(--text-primary)" }}>{h.name}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{h.date}</div>
                    </div>
                    <Badge text={h.affects?"Pausa ciclo":"Sin efecto"} bg={h.affects?RD:AD} color={h.affects?R:A}/>
                    <button onClick={async()=>{
  await supabase.from("holidays").delete().eq("name",h.name).eq("date",h.date);
  setHolidays(hh=>hh.filter((_,j)=>j!==i));
  showToast("Festivo eliminado");
}} style={{ fontSize:12, padding:"4px 9px", background:RD, color:R, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, alignSelf:"start", boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Agregar festivo</SectionTitle>
                <Field label="Fecha"><input type="date" value={newHoliday.date} onChange={e=>setNewHoliday(h=>({...h,date:e.target.value}))} style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/></Field>
                <Field label="Nombre"><Input value={newHoliday.name} onChange={v=>setNewHoliday(h=>({...h,name:v}))} placeholder="Ej: Día de la Independencia"/></Field>
                <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--text-secondary)", cursor:"pointer", marginBottom:14 }}>
                  <input type="checkbox" checked={newHoliday.affects} onChange={e=>setNewHoliday(h=>({...h,affects:e.target.checked}))}/>
                  Pausa el ciclo
                </label>
                <BtnPrimary onClick={()=>{ if(newHoliday.date&&newHoliday.name){setHolidays(h=>[...h,{...newHoliday}]);setNewHoliday({date:"",name:"",affects:true});} }} style={{ width:"100%" }}>Agregar</BtnPrimary>
              </div>
            </div>
          )}

          {/* ── GAMIFICATION ── */}
          {view==="gamification" && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Puntos XP por acción</SectionTitle>
                {XP_ACTIONS.map(a=>(
                  <div key={a.key} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ flex:1, fontSize:13, color:"var(--text-primary)" }}>{a.label}</div>
                    <input type="number" value={xpVals[a.key]} onChange={e=>setXpVals(v=>({...v,[a.key]:+e.target.value}))} style={{ width:64, padding:"6px 8px", border:"1px solid var(--border)", borderRadius:7, fontSize:13, fontWeight:700, color:P, textAlign:"center", background:"var(--bg-surface-subtle)", fontFamily:"inherit" }}/>
                    <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>XP</span>
                  </div>
                ))}
                <BtnPrimary onClick={async()=>{
  try {
    await supabase.from("app_config").upsert({ key:"xp_config", value:xpVals },{ onConflict:"key" });
    showToast("Configuración XP guardada en BD");
  } catch(e) { showToast("Error: "+e.message, R); }
}} style={{ marginTop:14, width:"100%" }}>Guardar</BtnPrimary>
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Recompensa leaderboard</SectionTitle>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <input type="range" min={5} max={50} value={leaderPct} onChange={e=>setLeaderPct(+e.target.value)} style={{ flex:1 }}/>
                  <div style={{ fontSize:24, fontWeight:800, color:Y }}>{leaderPct}%</div>
                </div>
                <SectionTitle>Rangos</SectionTitle>
                {[["🥉 Explorer","#92400e","#fff8e6",0],["🥈 Learner",P,PD,500],["🥇 Achiever","#6d28d9","#ede9fe",2000],["⭐ WCA Pro",PH,"var(--bg-surface-subtle)",5000]].map(([r,c,bg,xp],i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:bg, borderRadius:9, marginBottom:7 }}>
                    <span style={{ fontSize:16 }}>{r.split(" ")[0]}</span>
                    <div style={{ flex:1, fontSize:12, fontWeight:600, color:c }}>{r.split(" ").slice(1).join(" ")}</div>
                    <input type="number" defaultValue={xp} style={{ width:64, padding:"4px 7px", border:"1px solid var(--border)", borderRadius:6, fontSize:12, fontWeight:700, color:c, textAlign:"center", background:"#fff", fontFamily:"inherit" }}/>
                    <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>XP</span>
                  </div>
                ))}
                <BtnPrimary style={{ marginTop:12, width:"100%" }}>Guardar</BtnPrimary>
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS ── */}
          {false && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {INTEGRATIONS.map(int=>(
                <div key={int.id} style={{ background:"var(--bg-surface)", border:`1.5px solid ${int.configured?"var(--border)":`${A}50`}`, borderRadius:14, padding:"16px 18px", boxShadow:"var(--shadow-sm)", display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:int.configured?PD:"#fff8e6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{int.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{int.name}</div>
                    <div style={{ fontSize:12, color:int.configured?"var(--text-secondary)":A }}>{int.key}</div>
                    {int.hint && <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:2 }}>{int.hint}</div>}
                  </div>
                  <Badge
                    text={int.configured ? "✓ Activo" : "⚠ Pendiente"}
                    bg={int.configured ? GD : AD}
                    color={int.configured ? "#065f46" : "#92400e"}
                  />
                  {int.id === "mailrelay" && (
                    <button onClick={async()=>{
                      try {
                        const {data:{session}} = await supabase.auth.getSession();
                        showToast("Enviando email de prueba…", "#0369a1");
                        const r = await fetch("/api/auth/invite",{
                          method:"POST",
                          headers:{"Content-Type":"application/json",Authorization:`Bearer ${session?.access_token}`},
                          body:JSON.stringify({ action:"test-email", to: session?.user?.email }),
                        });
                        const d = await r.json();
                        const data = d.data || {};
                        if (data.ok) {
                          showToast(data.summary || "✓ Email enviado — revisá tu bandeja");
                        } else {
                          showToast(data.summary || "Error al enviar", R);
                        }
                      } catch(e){showToast("Error: "+e.message, R);}
                    }} style={{ fontSize:12, padding:"8px 16px", background:PD, color:P, border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit", flexShrink:0, whiteSpace:"nowrap" }}>
                      Probar envío
                    </button>
                  )}
                  {int.id === "google" && (
                    <button onClick={()=>showToast("✓ Google OAuth activo — login funciona correctamente")} style={{ fontSize:12, padding:"8px 16px", background:GD, color:"#065f46", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit", flexShrink:0 }}>
                      ✓ Verificado
                    </button>
                  )}
                  {(int.id === "stripe" || int.id === "twilio") && (
                    <button onClick={()=>{ window.open("https://vercel.com/dashboard", "_blank"); }} style={{ fontSize:12, padding:"8px 16px", background:"#fff8e6", color:"#92400e", border:`1px solid ${A}40`, borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit", flexShrink:0, whiteSpace:"nowrap" }}>
                      Configurar →
                    </button>
                  )}
                </div>
              ))}
              <div style={{ background:"var(--bg-surface-subtle)", borderRadius:12, padding:"14px 18px", fontSize:12, color:"var(--text-secondary)", lineHeight:1.7, marginTop:4 }}>
                <strong style={{ color:"var(--text-primary)" }}>Variables de entorno en Vercel</strong><br/>
                Stripe: <code style={{ background:"var(--bg-surface)", padding:"1px 6px", borderRadius:4 }}>STRIPE_SECRET_KEY</code> y <code style={{ background:"var(--bg-surface)", padding:"1px 6px", borderRadius:4 }}>STRIPE_WEBHOOK_SECRET</code><br/>
                Twilio: <code style={{ background:"var(--bg-surface)", padding:"1px 6px", borderRadius:4 }}>TWILIO_ACCOUNT_SID</code>, <code style={{ background:"var(--bg-surface)", padding:"1px 6px", borderRadius:4 }}>TWILIO_AUTH_TOKEN</code>, <code style={{ background:"var(--bg-surface)", padding:"1px 6px", borderRadius:4 }}>TWILIO_WHATSAPP_FROM</code>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {view==="notifications" && (
            <div>
              {[
                { label:"Nueva unidad",     channel:"WhatsApp", trigger:"Lunes 00:00 CST",     preview:"🎓 Nueva unidad disponible: *{unit_title}*. Abre wcahub.com 📚" },
                { label:"Recordatorio clase",channel:"WhatsApp", trigger:"3h antes",            preview:"⏰ Tu clase es en 3 horas: *{level} {time}*. Link: {teams_link}" },
                { label:"Examen aprobado",   channel:"In-app",   trigger:"Al aprobar",          preview:"✅ ¡Aprobaste U{unit}! La siguiente unidad ya está desbloqueada." },
                { label:"Pago próximo",      channel:"WhatsApp", trigger:"3 días antes",        preview:"💳 Tu pago vence en 3 días. Monto: *${amount}*. wcahub.com" },
                { label:"Subida de nivel",   channel:"Email",    trigger:"Al subir de nivel",   preview:"🏆 ¡Completaste {from_level}! Ya estás en *{to_level}*. Tu certificado está disponible." },
                { label:"Bienvenida",        channel:"Email",    trigger:"Al activar cuenta",   preview:"👋 ¡Bienvenido/a a WCA! Primera clase: {date} a las {time}." },
              ].map((t,i)=>(
                <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:16, marginBottom:10, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{t.label}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>Canal: <strong>{t.channel}</strong> · Trigger: <strong>{t.trigger}</strong></div>
                    </div>
                    <button disabled style={{ fontSize:11, padding:"6px 14px", background:"var(--bg-surface-subtle)", color:"var(--text-tertiary)", border:"none", borderRadius:8, cursor:"default", fontWeight:600, fontFamily:"inherit", opacity:0.6 }}>Próximamente</button>
                  </div>
                  <div style={{ background:"var(--bg-surface-subtle)", borderRadius:8, padding:"10px 13px", fontSize:12, color:"var(--text-primary)", fontStyle:"italic", lineHeight:1.7 }}>{t.preview}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── AUDIT ── */}
          {view==="audit" && (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:9, background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:10, padding:"9px 13px" }}>
                  <i className="ti ti-search" style={{ color:"var(--text-tertiary)", fontSize:15 }} aria-hidden="true"/>
                  <input aria-label="Buscar en auditoría" placeholder="Buscar…" style={{ border:"none", outline:"none", fontSize:13, background:"transparent", color:"var(--text-primary)", flex:1, fontFamily:"inherit" }}/>
                </div>
                <button onClick={()=>{
  import("../lib/exportCSV.js").then(({exportCSV})=>{
    exportCSV(auditLog.map(a=>({Fecha:a.date,Acción:a.action,Entidad:a.entity||"—",Actor:a.actor||"—",Detalle:JSON.stringify(a.metadata||{})})), `auditoria-${new Date().toISOString().slice(0,10)}.csv`);
    showToast("Auditoría exportada como CSV");
  });
}} style={{ padding:"9px 16px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:10, fontSize:12, cursor:"pointer", color:"var(--text-secondary)", fontFamily:"inherit" }}>↓ Exportar</button>
              </div>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"var(--bg-surface-subtle)" }}>
                    {["Usuario","Acción","Detalle","Tiempo"].map(h=><th key={h} style={{ padding:"11px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {dbAudit.map((row,i)=>{
                    const isReal = !!row.created_at;
                    const a = isReal ? {
                      user:   row.actor_id ? "Staff" : "Sistema",
                      action: (row.action||"").replace(/_/g," "),
                      detail: typeof row.metadata === "object" ? JSON.stringify(row.metadata||{}).slice(0,80) : (row.metadata||""),
                      time:   new Date(row.created_at).toLocaleString("es-HN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}),
                    } : row;
                    return (
                      <tr key={i} style={{ borderTop:"1px solid var(--border)" }}>
                        <td style={{ padding:"12px 14px", fontWeight:600, color:"var(--text-primary)" }}>{a.user}</td>
                        <td style={{ padding:"12px 14px", color:P, fontWeight:500, textTransform:"capitalize" }}>{a.action}</td>
                        <td style={{ padding:"12px 14px", color:"var(--text-secondary)", fontSize:12 }}>{a.detail}</td>
                        <td style={{ padding:"12px 14px", color:"var(--text-tertiary)", whiteSpace:"nowrap" }}>{a.time}</td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BANKS ── */}
          {view==="banks" && (
            <div style={{ maxWidth:580 }}>
              {[{name:"BAC Credomatic",acc:"0123-4567-8901",type:"Corriente",holder:"WCA Academy S.A.",active:true},{name:"BI Honduras",acc:"9876-5432-1098",type:"Ahorro",holder:"WCA Academy S.A.",active:true},{name:"Ficohsa",acc:"4455-6677-8899",type:"Corriente",holder:"WCA Academy S.A.",active:false}].map((b,i)=>(
                <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, marginBottom:10, display:"flex", alignItems:"center", gap:14, boxShadow:"var(--shadow-sm)", opacity:b.active?1:.6 }}>
                  <div style={{ width:42, height:42, borderRadius:10, background:PD, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className="ti ti-building-bank" style={{ fontSize:22, color:P }} aria-hidden="true"/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{b.name}</div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{b.type} · {b.acc}</div>
                  </div>
                  <Badge text={b.active?"Activo":"Inactivo"} bg={b.active?GD:"var(--bg-surface-subtle)"} color={b.active?"#065f46":"var(--text-secondary)"}/>
                  <button onClick={async()=>{
  const newState = !b.active;
  await supabase.from("bank_accounts").update({active:newState}).eq("id",b.id);
  setBanks(prev=>prev.map(x=>x.id===b.id?{...x,active:newState}:x));
  showToast(newState ? "Banco activado" : "Banco desactivado");
}} style={{ fontSize:12, padding:"7px 12px", background:b.active?RD:GD, color:b.active?R:G, border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>{b.active?"Desactivar":"Activar"}</button>
                </div>
              ))}
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                <SectionTitle>Agregar banco</SectionTitle>
                {["Nombre del banco","Número de cuenta","Titular"].map(l=><Field key={l} label={l}><Input value="" onChange={()=>{}} placeholder=""/></Field>)}
                <BtnPrimary onClick={async()=>{
                  const inputs = document.querySelectorAll("[data-bank]");
                  const [nombre, cuenta, titular] = [...inputs].map(i=>i.value);
                  if(!nombre||!cuenta) return showToast("Nombre y cuenta son requeridos",R);
                  try{ const {data:{session:bs}} = await supabase.auth.getSession(); await supabase.from("audit_log").insert({actor_id:bs?.user?.id||null,action:"added_bank",entity:"bank",metadata:{nombre,cuenta,titular}}); }catch(_){}
                  showToast("Banco agregado correctamente");
                  inputs.forEach(i=>i.value="");
                }} style={{ width:"100%", marginTop:4 }}>Agregar banco</BtnPrimary>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── MODALES ── */}

      {staffModal && (
        <Modal title={staffModal.mode==="add"?"Agregar personal":staffModal.mode==="edit"?"Editar empleado":staffModal.data.name} subtitle={staffModal.mode==="view"?staffModal.data.role:undefined} onClose={()=>setStaffModal(null)}>
          {staffModal.mode==="view" ? (
            <div>
              <div style={{ display:"flex", gap:14, marginBottom:18 }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:PD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:P, flexShrink:0 }}>{staffModal.data.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
                <div><div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{staffModal.data.name}</div><Badge text={staffModal.data.role} bg={(ROLE_COLORS[staffModal.data.role]||["var(--bg-surface-subtle)","var(--text-secondary)"])[0]} color={(ROLE_COLORS[staffModal.data.role]||["","var(--text-secondary)"])[1]}/></div>
              </div>
              {[["Email",staffModal.data.email],["Teléfono",staffModal.data.phone],["País",staffModal.data.country],["Salario",`$${staffModal.data.salary}/mes`],["Ingresó",staffModal.data.hired],["Estado",staffModal.data.status==="active"?"Activo":"Inactivo"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ color:"var(--text-secondary)" }}>{k}</span><span style={{ color:"var(--text-primary)", fontWeight:500 }}>{v}</span>
                </div>
              ))}
              {staffModal.data.levels?.length>0 && <div style={{ marginTop:12 }}><div style={{ fontSize:11, color:"var(--text-tertiary)", marginBottom:6 }}>Niveles</div><div style={{ display:"flex", gap:6 }}>{staffModal.data.levels.map(l=><Badge key={l} text={l} bg={PD} color={P}/>)}</div></div>}
              <div style={{ display:"flex", gap:8, marginTop:18 }}>
                <BtnGhost onClick={()=>setStaffModal(null)}>Cerrar</BtnGhost>
                <BtnPrimary onClick={()=>openEditStaff(staffModal.data)} style={{ flex:1 }}>✎ Editar</BtnPrimary>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:10 }}>
                <div style={{ gridColumn:"1/-1" }}><Field label="Nombre completo"><Input value={staffForm.name||""} onChange={v=>setStaffForm(f=>({...f,name:v}))} placeholder="Ana Torres"/></Field></div>
                <Field label="Rol"><select value={staffForm.role||"Docente"} onChange={e=>setStaffForm(f=>({...f,role:e.target.value}))} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}>
                  {["Docente","Coordinadora","Admin","Gestor de Cobros","Ventas","Marketing","IT","Soporte","Contabilidad"].map(r=><option key={r}>{r}</option>)}
                </select></Field>
                <Field label="Estado"><select value={staffForm.status||"active"} onChange={e=>setStaffForm(f=>({...f,status:e.target.value}))} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}>
                  <option value="active">Activo</option><option value="inactive">Inactivo</option>
                </select></Field>
                <div style={{ gridColumn:"1/-1" }}><Field label="Email"><Input value={staffForm.email||""} onChange={v=>setStaffForm(f=>({...f,email:v}))} placeholder="nombre@wca.edu.hn"/></Field></div>
                <Field label="Teléfono"><Input value={staffForm.phone||""} onChange={v=>setStaffForm(f=>({...f,phone:v}))} placeholder="+504 9900-0000"/></Field>
                <Field label="País"><Input value={staffForm.country||""} onChange={v=>setStaffForm(f=>({...f,country:v}))} placeholder="Honduras"/></Field>
                <Field label="Salario (USD/mes)"><Input type="number" value={staffForm.salary||""} onChange={v=>setStaffForm(f=>({...f,salary:v}))} placeholder="850"/></Field>
                <Field label="Fecha de ingreso"><Input value={staffForm.hired||""} onChange={v=>setStaffForm(f=>({...f,hired:v}))} placeholder="Ene 2025"/></Field>
                {staffForm.role==="Docente" && (
                  <div style={{ gridColumn:"1/-1" }}>
                    <Field label="Niveles que imparte">
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                        {["A1","A2","B1","B2","C1"].map(l=>(
                          <label key={l} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13 }}>
                            <input type="checkbox" checked={staffForm.levels?.includes(l)||false} onChange={e=>setStaffForm(f=>({ ...f, levels:e.target.checked?[...(f.levels||[]),l]:(f.levels||[]).filter(x=>x!==l) }))}/>
                            {l}
                          </label>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:8, marginTop:18 }}>
                <BtnGhost onClick={()=>setStaffModal(null)}>Cancelar</BtnGhost>
                {staffModal.mode==="edit" && <button onClick={()=>setDeleteConfirm(staffModal.data)} style={{ padding:"10px 16px", background:RD, color:R, border:"none", borderRadius:10, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>}
                <button
  onClickCapture={(e)=>{
    e.stopPropagation();
    saveStaff();
  }}
  style={{ flex:1, padding:"10px 20px", background:"#155266", color:"#fff", border:"none",
    borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
  {staffModal.mode==="add"?"Crear empleado":"Guardar"}
</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {progModal && (
        <Modal title={progModal.mode==="add"?"Nuevo programa":"Editar programa"} onClose={()=>setProgModal(null)}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:10 }}>
            <div style={{ gridColumn:"1/-1" }}><Field label="Nombre"><Input value={progForm.name||""} onChange={v=>setProgForm(f=>({...f,name:v}))} placeholder="Inglés para Niños"/></Field></div>
            <Field label="Código"><Input value={progForm.code||""} onChange={v=>setProgForm(f=>({...f,code:v}))} placeholder="KIDS"/></Field>
            <Field label="Ícono"><Input value={progForm.icon||""} onChange={v=>setProgForm(f=>({...f,icon:v}))} placeholder="🧒"/></Field>
            <Field label="Niveles"><Input value={progForm.levels||""} onChange={v=>setProgForm(f=>({...f,levels:v}))} placeholder="A1-B1"/></Field>
            <Field label="Precio USD"><Input type="number" value={progForm.price||""} onChange={v=>setProgForm(f=>({...f,price:v}))} placeholder="95"/></Field>
            <div style={{ gridColumn:"1/-1" }}><Field label="Intervalo"><select value={progForm.interval||"mes"} onChange={e=>setProgForm(f=>({...f,interval:e.target.value}))} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}><option value="mes">Mensual</option><option value="trimestre">Trimestral</option><option value="año">Anual</option></select></Field></div>
            <div style={{ gridColumn:"1/-1" }}><Field label="Descripción"><Input value={progForm.desc||""} onChange={v=>setProgForm(f=>({...f,desc:v}))} placeholder="Describe el programa"/></Field></div>
            <div style={{ gridColumn:"1/-1" }}><label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer" }}>
              <input type="checkbox" checked={progForm.active!==false} onChange={e=>setProgForm(f=>({...f,active:e.target.checked}))}/>
              Programa activo
            </label></div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18 }}>
            <BtnGhost onClick={()=>setProgModal(null)}>Cancelar</BtnGhost>
            <BtnPrimary onClick={saveProg} style={{ flex:1 }}>{progModal.mode==="add"?"Crear programa":"Guardar"}</BtnPrimary>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Desactivar empleado" subtitle={`${deleteConfirm.name} · ${deleteConfirm.role}`} onClose={()=>setDeleteConfirm(null)}>
          <div style={{ background:RD, borderRadius:10, padding:"12px 14px", marginBottom:16, fontSize:12, color:R }}>El empleado será marcado como inactivo y perderá acceso. Sus datos se conservan y puede reactivarse.</div>
          <div style={{ display:"flex", gap:8 }}>
            <BtnGhost onClick={()=>setDeleteConfirm(null)}>Cancelar</BtnGhost>
            <button onClickCapture={(e)=>{e.stopPropagation();deleteStaff(deleteConfirm.id);}} style={{ flex:1, padding:"10px", background:R, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sí, desactivar</button>
          </div>
        </Modal>
      )}
    </div>
    {ConfirmUI}
  </>
  );
}
