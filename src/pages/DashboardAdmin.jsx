import { useState, useMemo } from "react";

// ─── BRAND ───────────────────────────────────────────────────────────────────
const B = {
  primary:   "#155266", primaryHov: "#0f3d4d", primaryDim: "var(--wca-primary-dim)",
  secondary: "#ffbb23", secondaryDim: "var(--amber-dim)",
  accent:    "#fab82c",
  dark:      "#0f3d4d",
  bg:        "var(--bg-page)", white: "var(--bg-surface)",
  text:      "var(--text-primary)", textSec: "var(--text-secondary)",
  border:    "var(--border)", borderLight: "var(--wca-primary-dim)",
  green: "#059669", greenDim: "var(--green-dim)",
  red:   "#dc2626", redDim: "var(--red-dim)",
  amber: "#ffbb23", amberDim: "var(--amber-dim)",
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const STUDENTS = [
  { id:1,  name:"María López",     email:"m.lopez@wca.edu.hn",    country:"🇭🇳", level:"B1", group:"B1·6PM", program:"Inglés",     type:"regular",     state:"active",    payment:"Al día",   attendance:92, score:84, enrolled:"Mar 2025" },
  { id:2,  name:"Carlos Torres",   email:"c.torres@wca.edu.hn",   country:"🇭🇳", level:"A1", group:"A1·6PM", program:"Inglés+VA",  type:"regular",     state:"active",    payment:"Al día",   attendance:78, score:71, enrolled:"Abr 2025" },
  { id:3,  name:"Ana Mejía",       email:"a.mejia@wca.edu.hn",    country:"🇨🇴", level:"A1", group:"A1·8PM", program:"Inglés",     type:"regular",     state:"active",    payment:"Al día",   attendance:96, score:91, enrolled:"Feb 2025" },
  { id:4,  name:"Luis Morales",    email:"l.morales@wca.edu.hn",  country:"🇭🇳", level:"A1", group:"A1·6PM", program:"VA",         type:"regular",     state:"suspended", payment:"Vencido",  attendance:45, score:62, enrolled:"Ene 2025" },
  { id:5,  name:"Sofía Ramos",     email:"s.ramos@wca.edu.hn",    country:"🇦🇷", level:"B1", group:"B1·8PM", program:"Inglés",     type:"regular",     state:"active",    payment:"Al día",   attendance:88, score:79, enrolled:"May 2025" },
  { id:6,  name:"Pedro Jiménez",   email:"p.jimenez@wca.edu.hn",  country:"🇲🇽", level:"A2", group:"A2·7PM", program:"Inglés",     type:"scholarship", state:"active",    payment:"Beca",     attendance:67, score:68, enrolled:"Mar 2025" },
  { id:7,  name:"Valentina Cruz",  email:"v.cruz@wca.edu.hn",     country:"🇨🇴", level:"A1", group:"A1·8PM", program:"Inglés+VA",  type:"regular",     state:"active",    payment:"Al día",   attendance:91, score:88, enrolled:"Jun 2025" },
  { id:8,  name:"Diego Fuentes",   email:"d.fuentes@wca.edu.hn",  country:"🇲🇽", level:"B2", group:"B2·6PM", program:"Inglés",     type:"b2b",         state:"active",    payment:"B2B",      attendance:55, score:59, enrolled:"Abr 2025" },
  { id:9,  name:"Camila Herrera",  email:"c.herrera@wca.edu.hn",  country:"🇨🇱", level:"A2", group:"A2·9PM", program:"Inglés",     type:"regular",     state:"active",    payment:"Al día",   attendance:85, score:77, enrolled:"May 2025" },
  { id:10, name:"Jorge Ramírez",   email:"j.ramirez@wca.edu.hn",  country:"🇭🇳", level:"A1", group:"A1·7PM", program:"VA",         type:"scholarship", state:"active",    payment:"Beca",     attendance:73, score:70, enrolled:"Feb 2025" },
  { id:11, name:"Isabel Navarro",  email:"i.navarro@wca.edu.hn",  country:"🇪🇸", level:"C1", group:"C1·6PM", program:"Inglés",     type:"regular",     state:"active",    payment:"Al día",   attendance:98, score:95, enrolled:"Ene 2025" },
  { id:12, name:"Marcos Silva",    email:"m.silva@wca.edu.hn",    country:"🇧🇷", level:"B2", group:"B2·8PM", program:"Inglés",     type:"regular",     state:"suspended", payment:"Vencido",  attendance:40, score:55, enrolled:"Mar 2025" },
];

const GROUPS = [
  { id:1, level:"A1", time:"6:00–7:00 PM", days:"L·M·V", teacher:"José R.", students:22, capacity:25, unit:9, teamsSet:true  },
  { id:2, level:"A1", time:"7:00–8:00 PM", days:"L·M·V", teacher:"José R.", students:18, capacity:25, unit:9, teamsSet:true  },
  { id:3, level:"A1", time:"8:00–9:00 PM", days:"L·M·V", teacher:"José R.", students:15, capacity:25, unit:9, teamsSet:true  },
  { id:4, level:"A2", time:"7:00–8:00 PM", days:"L·M·V", teacher:"María P.", students:20, capacity:25, unit:6, teamsSet:true  },
  { id:5, level:"A2", time:"9:00–10:00 PM",days:"L·M·V", teacher:"Luis G.", students:12, capacity:25, unit:6, teamsSet:false },
  { id:6, level:"B1", time:"6:00–7:00 PM", days:"L·M·V", teacher:"Ana T.",  students:19, capacity:25, unit:9, teamsSet:true  },
  { id:7, level:"B1", time:"8:00–9:00 PM", days:"L·M·V", teacher:"Ana T.",  students:14, capacity:25, unit:9, teamsSet:true  },
  { id:8, level:"B2", time:"6:00–7:00 PM", days:"L·M·V", teacher:"Carlos M.",students:8, capacity:20, unit:4, teamsSet:true  },
  { id:9, level:"C1", time:"6:00–7:00 PM", days:"L·M·V", teacher:"Sofía E.",students:6,  capacity:15, unit:7, teamsSet:true  },
];

const PAYMENTS_PENDING = [
  { id:1, student:"María López",   amount:"$95",  method:"Transferencia", date:"Hace 2h",    code:"WCA-B1-0821" },
  { id:2, student:"Diego Fuentes", amount:"$170", method:"Transferencia", date:"Hace 5h",    code:"WCA-B2-4492" },
  { id:3, student:"Ana Mejía",     amount:"$95",  method:"Transferencia", date:"Hace 1 día", code:"WCA-A1-3301" },
];

const ALERTS = [
  { type:"red",   icon:"ti-alert-circle",  text:"2 estudiantes con pago vencido +30 días", action:"Ver estudiantes" },
  { type:"amber", icon:"ti-clock",         text:"3 transferencias pendientes de confirmar", action:"Ver pagos" },
  { type:"amber", icon:"ti-user-exclamation", text:"1 grupo sin link de Teams configurado — A2·9PM", action:"Configurar" },
  { type:"blue",  icon:"ti-trending-up",   text:"12 nuevas matrículas este mes (+18% vs anterior)", action:null },
];

const CYCLE_STATUS = [
  { level:"A1", unit:9,  title:"Comforts",    groups:3, students:55 },
  { level:"A2", unit:6,  title:"Places",      groups:2, students:32 },
  { level:"B1", unit:9,  title:"Images",      groups:2, students:33 },
  { level:"B2", unit:4,  title:"Processes",   groups:1, students:8  },
  { level:"C1", unit:7,  title:"Unit 7",      groups:1, students:6  },
];

const NAV = [
  { id:"home",        icon:"ti-layout-dashboard", label:"Inicio"         },
  { id:"students",    icon:"ti-users",             label:"Estudiantes"    },
  { id:"groups",      icon:"ti-grid-dots",         label:"Grupos"         },
  { id:"enrollments", icon:"ti-user-plus",         label:"Matrículas"     },
  { id:"payments",    icon:"ti-credit-card",       label:"Pagos"          },
  { id:"cycle",       icon:"ti-refresh",           label:"Ciclo"          },
  { id:"reports",     icon:"ti-chart-bar",         label:"Reportes"       },
  { id:"b2b",         icon:"ti-building",          label:"Empresas B2B"   },
];

const stateColor = s => s==="active"?[B.greenDim,"#065f46"]:s==="suspended"?[B.redDim,B.red]:[B.secondaryDim,"#92400e"];
const typeColor  = t => t==="scholarship"?[B.primaryDim,B.primary]:t==="b2b"?[B.secondaryDim,"#92400e"]:[B.bg,B.textSec];
const scoreCol   = s => s>=80?B.green:s>=70?B.amber:B.red;

function Badge({ text, bg, color }) {
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:bg, color, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>;
}
function Stat({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 16px", borderTop:`3px solid ${color||B.primary}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ fontSize:12, color:B.textSec }}>{label}</div>
        {icon && <i className={`ti ${icon}`} style={{ fontSize:16, color:color||B.primary }} aria-hidden="true" />}
      </div>
      <div style={{ fontSize:24, fontWeight:700, color:B.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:B.textSec, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [view, setView] = useState("home");
  const [actionModal, setActionModal] = useState(null); // {type, student, group}
  const [actionNote, setActionNote] = useState("");
  const [actionDone, setActionDone] = useState(null);
  const [students, setStudents] = useState([
    {id:1, name:"María López",    level:"B1", group:"B1·6PM", status:"active",   type:"regular"},
    {id:2, name:"Carlos Torres",  level:"A1", group:"A1·6PM", status:"active",   type:"regular"},
    {id:3, name:"Ana Mejía",      level:"A1", group:"A1·8PM", status:"active",   type:"regular"},
    {id:4, name:"Luis Morales",   level:"A1", group:"A1·6PM", status:"suspended",type:"regular"},
    {id:5, name:"Pedro Jiménez",  level:"A2", group:"A2·7PM", status:"active",   type:"scholarship"},
    {id:6, name:"Isabel Navarro", level:"C1", group:"C1·6PM", status:"active",   type:"regular"},
  ]);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selStudent, setSelStudent] = useState(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [teamsModal, setTeamsModal] = useState(null);
  const [teamsLink, setTeamsLink] = useState("");

  const filtered = useMemo(() => STUDENTS.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const mst = filterState === "all" || s.state === filterState;
    const ml = filterLevel === "all" || s.level === filterLevel;
    return ms && mst && ml;
  }), [search, filterState, filterLevel]);

  const suspended = STUDENTS.filter(s => s.state === "suspended");
  const active    = STUDENTS.filter(s => s.state === "active");

  return (
    <div style={{ display:"flex", minHeight: "100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:200, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 16px", flexShrink:0 }}>
        <div style={{ padding:"20px 18px 18px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:10 }}>
          <div style={{ fontSize:17, fontWeight:800, color:"var(--bg-surface)", letterSpacing:-0.5 }}>
            WCA <span style={{ color:B.secondary }}>Hub</span>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2, letterSpacing:1, textTransform:"uppercase" }}>Panel Admin</div>
        </div>

        {NAV.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSelStudent(null); }} style={{
            display:"flex", alignItems:"center", gap:10, padding:"11px 20px",
            border:"none", background: view===item.id ? "rgba(255,255,255,.12)" : "transparent",
            color: view===item.id ? "var(--bg-surface)" : "rgba(255,255,255,.5)",
            fontSize:13, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===item.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===item.id ? 600 : 400,
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:16, width:18, textAlign:"center" }} aria-hidden="true" />
            {item.label}
            {item.id==="payments" && PAYMENTS_PENDING.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.secondary, color:B.primary, borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{PAYMENTS_PENDING.length}</span>
            )}
          </button>
        ))}

        <div style={{ marginTop:"auto", padding:"14px 18px 0", borderTop:"1px solid rgba(255,255,255,.1)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:B.secondary }}>AD</div>
            <div>
              <div style={{ fontSize:13, color:"var(--bg-surface)", fontWeight:600 }}>Admin WCA</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Administrador</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <div style={{ height:54, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:B.text }}>
            {{ home:"Resumen general", students:"Estudiantes", groups:"Grupos y horarios", enrollments:"Nueva matrícula", payments:"Pagos operativos", cycle:"Estado del ciclo", reports:"Reportes", b2b:"Empresas B2B" }[view]}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {suspended.length > 0 && <div style={{ fontSize:12, background:B.redDim, color:B.red, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⚠ {suspended.length} suspendidos</div>}
            <div style={{ fontSize:12, background:B.primaryDim, color:B.primary, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{active.length} activos hoy</div>
            {view === "students" && (
              <button onClick={() => setEnrollModal(true)} style={{ padding:"6px 14px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-user-plus" style={{ fontSize:14 }} aria-hidden="true" /> Nuevo estudiante
              </button>
            )}
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:20 }}>

          {/* ── HOME ── */}
          {view === "home" && (
            <div>
              {/* Alerts */}
              {ALERTS.map((a, i) => (
                <div key={i} style={{ background: a.type==="red"?B.redDim:a.type==="amber"?B.amberDim:B.primaryDim, border:`1px solid ${a.type==="red"?B.red:a.type==="amber"?B.amber:B.border}`, borderRadius:10, padding:"9px 14px", marginBottom:7, display:"flex", alignItems:"center", gap:10 }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize:16, color:a.type==="red"?B.red:a.type==="amber"?"#92400e":B.primary, flexShrink:0 }} aria-hidden="true" />
                  <div style={{ flex:1, fontSize:13, color:B.text }}>{a.text}</div>
                  {a.action && <button onClick={() => setView(a.action==="Ver estudiantes"?"students":a.action==="Ver pagos"?"payments":"groups")} style={{ fontSize:12, padding:"4px 10px", background:B.white, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", color:B.primary, fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap" }}>{a.action} →</button>}
                </div>
              ))}

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, margin:"16px 0" }}>
                <Stat label="Estudiantes activos" value={active.length} sub="Este mes" color={B.primary} icon="ti-users" />
                <Stat label="Ingresos (junio)" value="$18,420" sub="↑ 8% vs mayo" color={B.secondary} icon="ti-coin" />
                <Stat label="Pagos pendientes" value={PAYMENTS_PENDING.length} sub="Transferencias" color={B.amber} icon="ti-clock" />
                <Stat label="Grupos activos" value={GROUPS.length} sub="5 niveles" color={B.green} icon="ti-grid-dots" />
              </div>

              {/* Two columns */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

                {/* Cycle status */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    Estado del ciclo — esta semana
                    <button onClick={() => setView("cycle")} style={{ fontSize:11, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Ver todo</button>
                  </div>
                  {CYCLE_STATUS.map(c => (
                    <div key={c.level} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderTop:`1px solid ${B.borderLight}` }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:B.primary, flexShrink:0 }}>{c.level}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>U{c.unit} — {c.title}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{c.students} estudiantes · {c.groups} grupos</div>
                      </div>
                      <div style={{ height:4, width:50, background:B.bg, borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(c.unit/12)*100}%`, background:B.primary, borderRadius:2 }} />
                      </div>
                      <div style={{ fontSize:12, color:B.textSec, width:22, textAlign:"right" }}>{c.unit}/12</div>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Actividad reciente</div>
                  {[
                    { icon:"ti-user-plus", color:B.green,   text:"Valentina Cruz matriculada — A1 · 8PM",          time:"Hace 3h" },
                    { icon:"ti-credit-card", color:B.primary, text:"Pago confirmado: Diego Fuentes — $170",           time:"Hace 5h" },
                    { icon:"ti-certificate", color:B.secondary, text:"Certificado B1 generado — Isabel Navarro",       time:"Ayer" },
                    { icon:"ti-refresh",   color:B.amber,  text:"Ciclo avanzó a U9 — niveles A1 y B1",              time:"Lun 9 Jun" },
                    { icon:"ti-user-off",  color:B.red,    text:"Marcos Silva suspendido por falta de pago",         time:"Hace 3 días" },
                  ].map((a, i) => (
                    <div key={i} style={{ display:"flex", gap:10, padding:"7px 0", borderTop: i>0?`1px solid ${B.borderLight}`:"none" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <i className={`ti ${a.icon}`} style={{ fontSize:15, color:a.color }} aria-hidden="true" />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:B.text }}>{a.text}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pending transfers */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                    Transferencias pendientes
                    <Badge text={`${PAYMENTS_PENDING.length} pendientes`} bg={B.amberDim} color="#92400e" />
                  </div>
                  {PAYMENTS_PENDING.map(p => (
                    <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:B.amberDim, borderRadius:8, marginBottom:7, border:`1px solid ${B.amber}40` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{p.student}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{p.amount} · Código: {p.code} · {p.date}</div>
                      </div>
                      <button onClick={() => setView("payments")} style={{ fontSize:12, padding:"4px 10px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Confirmar</button>
                    </div>
                  ))}
                </div>

                {/* Suspended students */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                    Estudiantes suspendidos
                    <Badge text={`${suspended.length} suspendidos`} bg={B.redDim} color={B.red} />
                  </div>
                  {suspended.map(s => (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:B.redDim, borderRadius:8, marginBottom:7, border:`1px solid ${B.red}40` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{s.name}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:1 }}>{s.level} · {s.attendance}% asistencia</div>
                      </div>
                      <button onClick={() => { setView("students"); setSelStudent(s); }} style={{ fontSize:12, padding:"4px 10px", background:B.white, color:B.red, border:`1px solid ${B.red}`, borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Ver</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS ── */}
          {view === "students" && (
            <div style={{ display:"flex", gap:14, height:"100%" }}>
              <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                {/* Filters */}
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:B.white, border:`1px solid ${B.border}`, borderRadius:9, padding:"7px 12px" }}>
                    <i className="ti ti-search" style={{ color:B.textSec, fontSize:15 }} aria-hidden="true" />
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o email..." style={{ border:"none", outline:"none", fontSize:13, background:"transparent", color:B.text, flex:1, fontFamily:"inherit" }} />
                  </div>
                  <select value={filterState} onChange={e=>setFilterState(e.target.value)} style={{ padding:"7px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.white, color:B.text, fontFamily:"inherit" }}>
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="suspended">Suspendidos</option>
                  </select>
                  <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} style={{ padding:"7px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.white, color:B.text, fontFamily:"inherit" }}>
                    <option value="all">Todos los niveles</option>
                    {["A1","A2","B1","B2","C1"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* Table */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden", flex:1, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead style={{ position:"sticky", top:0, zIndex:1 }}>
                      <tr style={{ background:B.bg, borderBottom:`1px solid ${B.border}` }}>
                        {["Estudiante","País","Nivel · Grupo","Programa","Tipo","Pago","Estado","Asist.",""].map(h => (
                          <th key={h} style={{ padding:"9px 10px", textAlign:"left", fontSize:11, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, i) => {
                        const [stateBg, stateCol] = stateColor(s.state);
                        const [typeBg, typeCol] = typeColor(s.type);
                        return (
                          <tr key={s.id} onClick={() => setSelStudent(selStudent?.id===s.id?null:s)} style={{ borderTop:`1px solid ${B.borderLight}`, cursor:"pointer", background: selStudent?.id===s.id ? B.primaryDim : "transparent", transition:"background .1s" }}>
                            <td style={{ padding:"10px 10px" }}>
                              <div style={{ fontWeight:600, color:B.text }}>{s.name}</div>
                              <div style={{ fontSize:11, color:B.textSec, marginTop:1 }}>{s.email}</div>
                            </td>
                            <td style={{ padding:"10px 10px", fontSize:14 }}>{s.country}</td>
                            <td style={{ padding:"10px 10px" }}>
                              <div style={{ fontWeight:500, color:B.text }}>{s.level}</div>
                              <div style={{ fontSize:11, color:B.textSec }}>{s.group}</div>
                            </td>
                            <td style={{ padding:"10px 10px", color:B.textSec }}>{s.program}</td>
                            <td style={{ padding:"10px 10px" }}><Badge text={s.type==="scholarship"?"Beca":s.type==="b2b"?"B2B":"Regular"} bg={typeBg} color={typeCol} /></td>
                            <td style={{ padding:"10px 10px" }}><span style={{ fontSize:12, fontWeight:600, color: s.payment==="Al día"?B.green:s.payment==="Vencido"?B.red:B.textSec }}>{s.payment}</span></td>
                            <td style={{ padding:"10px 10px" }}><Badge text={s.state==="active"?"Activo":"Suspendido"} bg={stateBg} color={stateCol} /></td>
                            <td style={{ padding:"10px 10px" }}><span style={{ color: s.attendance>=80?B.green:s.attendance>=60?B.amber:B.red, fontWeight:600 }}>{s.attendance}%</span></td>
                            <td style={{ padding:"10px 10px" }}>
                              <button onClick={e=>{e.stopPropagation();setSelStudent(s);}} style={{ fontSize:11, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Ver →</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Student detail panel */}
              {selStudent && (
                <div style={{ width:280, background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, flexShrink:0, overflow:"auto" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{selStudent.name}</div>
                    <button onClick={() => setSelStudent(null)} style={{ background:"none", border:"none", cursor:"pointer", color:B.textSec, fontSize:16 }}>✕</button>
                  </div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
                    <Badge text={selStudent.level} bg={B.primaryDim} color={B.primary} />
                    <Badge text={selStudent.state==="active"?"Activo":"Suspendido"} bg={stateColor(selStudent.state)[0]} color={stateColor(selStudent.state)[1]} />
                    <Badge text={selStudent.type} bg={typeColor(selStudent.type)[0]} color={typeColor(selStudent.type)[1]} />
                  </div>
                  {[
                    ["Email", selStudent.email],
                    ["País", selStudent.country],
                    ["Grupo", selStudent.group],
                    ["Programa", selStudent.program],
                    ["Pago", selStudent.payment],
                    ["Inscrito", selStudent.enrolled],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"6px 0", borderBottom:`1px solid ${B.borderLight}` }}>
                      <span style={{ color:B.textSec }}>{k}</span>
                      <span style={{ color:B.text, fontWeight:500 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:12, color:B.textSec, marginBottom:4 }}>Rendimiento</div>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <div style={{ flex:1, textAlign:"center", background:B.bg, borderRadius:8, padding:"8px 6px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:scoreCol(selStudent.score) }}>{selStudent.score}%</div>
                        <div style={{ fontSize:11, color:B.textSec }}>Promedio</div>
                      </div>
                      <div style={{ flex:1, textAlign:"center", background:B.bg, borderRadius:8, padding:"8px 6px" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:selStudent.attendance>=80?B.green:B.amber }}>{selStudent.attendance}%</div>
                        <div style={{ fontSize:11, color:B.textSec }}>Asistencia</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
                    {selStudent.state === "suspended" && (
                      <button style={{ padding:"8px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓ Reactivar cuenta</button>
                    )}
                    <button style={{ padding:"8px", background:B.primaryDim, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cambiar grupo/horario</button>
                    {selStudent.type === "scholarship" && (
                      <button style={{ padding:"8px", background:B.secondaryDim, color:"#92400e", border:`1px solid ${B.amber}40`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Upgrade a plan completo</button>
                    )}
                    <button style={{ padding:"8px", background:B.redDim, color:B.red, border:`1px solid ${B.red}40`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Suspender cuenta</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GROUPS ── */}
          {view === "groups" && (
            <div>
              {GROUPS.filter(g=>!g.teamsSet).length > 0 && (
                <div style={{ background:B.redDim, border:`1px solid ${B.red}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"center" }}>
                  <i className="ti ti-alert-circle" style={{ color:B.red, fontSize:16, flexShrink:0 }} aria-hidden="true" />
                  <div style={{ flex:1, fontSize:13, color:B.text }}>
                    <strong>{GROUPS.filter(g=>!g.teamsSet).length} grupo(s)</strong> sin link de Teams configurado. Los estudiantes no pueden unirse a clase.
                  </div>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {GROUPS.map(g => (
                  <div key={g.id} style={{ background:B.white, border:`1px solid ${g.teamsSet?B.border:B.red}`, borderRadius:12, padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:B.primary }}>{g.level}</div>
                        <div style={{ fontSize:13, fontWeight:500, color:B.text }}>{g.time}</div>
                        <div style={{ fontSize:12, color:B.textSec }}>{g.days} · {g.teacher}</div>
                      </div>
                      <Badge text={g.teamsSet?"Teams ✓":"Sin link"} bg={g.teamsSet?B.greenDim:B.redDim} color={g.teamsSet?"#065f46":B.red} />
                    </div>
                    <div style={{ height:4, background:B.bg, borderRadius:2, overflow:"hidden", marginBottom:6 }}>
                      <div style={{ height:"100%", width:`${(g.students/g.capacity)*100}%`, background:g.students/g.capacity>0.9?B.red:g.students/g.capacity>0.7?B.amber:B.green, borderRadius:2 }} />
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:B.textSec, marginBottom:10 }}>
                      <span>{g.students}/{g.capacity} cupos</span>
                      <span>U{g.unit} activa</span>
                    </div>
                    {!g.teamsSet && (
                      <button onClick={() => setTeamsModal(g)} style={{ width:"100%", padding:"7px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Configurar link Teams</button>
                    )}
                    {g.teamsSet && (
                      <button style={{ width:"100%", padding:"7px", background:B.primaryDim, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Ver estudiantes del grupo</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {view === "payments" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                <Stat label="Cobrado (junio)" value="$18,420" sub="↑ 8% vs mayo" color={B.green} icon="ti-trending-up" />
                <Stat label="Transferencias pendientes" value={PAYMENTS_PENDING.length} sub="Requieren confirmación" color={B.amber} icon="ti-clock" />
                <Stat label="Vencidos +30 días" value="2" sub="Acción urgente" color={B.red} icon="ti-alert-circle" />
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Transferencias por confirmar</div>
                {PAYMENTS_PENDING.map(p => (
                  <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 12px", background:B.amberDim, borderRadius:10, marginBottom:8, border:`1px solid ${B.amber}40` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{p.student}</div>
                      <div style={{ fontSize:12, color:B.textSec, marginTop:2 }}>Código: <strong>{p.code}</strong> · {p.amount} · {p.date}</div>
                    </div>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.white, color:B.primary, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", fontWeight:500, fontFamily:"inherit" }}>Ver comprobante</button>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>✓ Confirmar</button>
                  </div>
                ))}
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Historial reciente</div>
                {STUDENTS.slice(0,6).map((s,i) => (
                  <div key={s.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderTop:i>0?`1px solid ${B.borderLight}`:"none" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:B.text }}>{s.name}</div>
                      <div style={{ fontSize:12, color:B.textSec }}>{s.program} · Mensual</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:B.text }}>$95</div>
                    <Badge text={s.payment==="Al día"?"Pagado":s.payment} bg={s.payment==="Al día"?B.greenDim:B.redDim} color={s.payment==="Al día"?"#065f46":B.red} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CYCLE ── */}
          {view === "cycle" && (
            <div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Estado del ciclo continuo — todos los niveles</div>
                {CYCLE_STATUS.map(c => (
                  <div key={c.level} style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${B.borderLight}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:B.primary }}>{c.level}</div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:B.text }}>U{c.unit} — {c.title}</div>
                          <div style={{ fontSize:12, color:B.textSec }}>{c.students} estudiantes · {c.groups} grupos activos</div>
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, color:B.primary, fontWeight:600 }}>U{c.unit} / 12</div>
                        <div style={{ fontSize:11, color:B.textSec }}>Próximo avance: lunes</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:3 }}>
                      {Array.from({length:12},(_,i)=>(
                        <div key={i} style={{ flex:1, height:6, borderRadius:3, background: i+1<c.unit?B.green:i+1===c.unit?B.secondary:B.bg, transition:"background .3s" }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:B.secondaryDim, border:`1px solid ${B.amber}40`, borderRadius:12, padding:14, display:"flex", gap:12, alignItems:"center" }}>
                <i className="ti ti-calendar" style={{ fontSize:18, color:"#92400e", flexShrink:0 }} aria-hidden="true" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:B.text }}>Próximo feriado: 15 Sep — Independencia de Honduras</div>
                  <div style={{ fontSize:12, color:B.textSec, marginTop:2 }}>El ciclo se pausará automáticamente ese lunes. Configurado en Super Admin.</div>
                </div>
                <button style={{ fontSize:12, padding:"5px 12px", background:B.white, color:B.primary, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit", whiteSpace:"nowrap" }}>Ver calendario</button>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {view === "reports" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {[
                  { title:"Reporte de asistencia por grupo", desc:"Asistencia % semanal y mensual por docente y horario", icon:"ti-calendar-check", color:B.primary },
                  { title:"Progreso académico por nivel",    desc:"Promedio de notas, tasa de aprobación y deserción", icon:"ti-chart-bar",       color:B.green },
                  { title:"Reporte de ingresos operativos",  desc:"Cobros, pendientes y vencidos del mes",             icon:"ti-coin",            color:B.secondary },
                  { title:"Estudiantes en riesgo",           desc:"Baja asistencia, intentos fallidos, inactividad",   icon:"ti-alert-triangle",  color:B.red },
                  { title:"Reporte de ciclo y unidades",     desc:"Estado de contenido por nivel y docente",           icon:"ti-refresh",         color:B.amber },
                  { title:"Reporte de becas",                desc:"Becados activos, asistencia y datos de financiación",icon:"ti-certificate",     color:B.primary },
                ].map((r,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14, display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <i className={`ti ${r.icon}`} style={{ fontSize:20, color:r.color }} aria-hidden="true" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:B.text, marginBottom:3 }}>{r.title}</div>
                      <div style={{ fontSize:12, color:B.textSec, lineHeight:1.5, marginBottom:8 }}>{r.desc}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button style={{ fontSize:11, padding:"3px 10px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Ver reporte</button>
                        <button style={{ fontSize:11, padding:"3px 10px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>↓ Exportar Excel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── B2B ── */}
          {view === "b2b" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                <Stat label="Empresas activas" value="2" sub="3 empleados matriculados" color={B.primary} icon="ti-building" />
                <Stat label="Ingresos B2B (mes)" value="$510" sub="3 empleados" color={B.secondary} icon="ti-coin" />
                <Stat label="Próxima factura" value="1 Jul" sub="$510 · 2 empresas" color={B.green} icon="ti-receipt" />
              </div>
              {[
                { name:"TechCorp Honduras", contact:"Rodrigo Paredes", employees:2, plan:"Inglés B2", amount:"$190/mes", status:"active" },
                { name:"Freelancers MX",    contact:"Diego Fuentes",   employees:1, plan:"Inglés B2", amount:"$95/mes",  status:"active" },
              ].map((co, i) => (
                <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:B.text }}>{co.name}</div>
                      <div style={{ fontSize:13, color:B.textSec }}>Contacto: {co.contact} · {co.employees} empleado{co.employees>1?"s":""}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:B.primary }}>{co.amount}</div>
                      <Badge text="Activa" bg={B.greenDim} color="#065f46" />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Ver empleados</button>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Generar factura</button>
                    <button style={{ fontSize:12, padding:"5px 12px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Reportes progreso</button>
                  </div>
                </div>
              ))}
              <button style={{ width:"100%", padding:"11px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>+ Crear cuenta empresa</button>
            </div>
          )}

          {/* ── ENROLLMENTS ── */}
          {view === "enrollments" && (
            <div style={{ maxWidth:560 }}>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:20 }}>
                <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:16 }}>Nueva matrícula manual</div>
                {[
                  {label:"Nombre completo", ph:"María Rodríguez", type:"text"},
                  {label:"Email", ph:"m.rodriguez@correo.com", type:"email"},
                  {label:"Teléfono / WhatsApp", ph:"+504 9999-0000", type:"tel"},
                  {label:"País", ph:"Honduras", type:"text"},
                ].map(f => (
                  <div key={f.label} style={{ marginBottom:12 }}>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} style={{ width:"100%", padding:"8px 12px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, color:B.text, background:B.bg, fontFamily:"inherit" }} />
                  </div>
                ))}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Programa</label>
                    <select style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                      <option>Inglés</option><option>VA</option><option>Inglés + VA</option><option>Beca Inglés</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Nivel de ingreso</label>
                    <select style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                      {["A1","A2","B1","B2","C1"].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Horario</label>
                    <select style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                      <option>6:00–7:00 PM</option><option>7:00–8:00 PM</option><option>8:00–9:00 PM</option><option>9:00–10:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Forma de pago</label>
                    <select style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                      <option>Transferencia</option><option>Efectivo</option><option>Tarjeta (Stripe)</option>
                    </select>
                  </div>
                </div>
                <div style={{ background:B.primaryDim, borderRadius:8, padding:"10px 12px", fontSize:13, color:B.primary, marginBottom:16, display:"flex", gap:6 }}>
                  <i className="ti ti-info-circle" style={{ fontSize:14, flexShrink:0, marginTop:1 }} aria-hidden="true" />
                  El sistema asignará automáticamente la unidad activa del ciclo para el nivel seleccionado.
                </div>
                <button style={{ width:"100%", padding:"11px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Crear matrícula</button>
              </div>
            </div>
          )}


          {/* ── PRECIOS DE ESPECIALIZACIONES ── */}
          {view==="precios" && (
            <div>
              <div style={{ background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--text-secondary)", display:"flex", gap:8 }}>
                <i className="ti ti-info-circle" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true"/>
                Podés editar los precios de los programas. Los cambios aplican a nuevas inscripciones. Estudiantes activos conservan su precio actual.
              </div>
              <AdminPrices />
            </div>
          )}

        </div>
      </main>

      {/* Action toast */}
      {actionDone && (
        <div style={{ position:"fixed", top:20, right:90, background:"#059669", color:"#fff", padding:"11px 18px", borderRadius:11, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 6px 20px rgba(5,150,105,.3)", display:"flex", gap:8, animation:"fadeIn .3s" }}>
          <i className="ti ti-check" style={{ fontSize:15 }} aria-hidden="true"/>
          {actionDone}
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setActionModal(null); }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:26, width:420, border:"1px solid var(--border)", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>
              {{reactivate:"Reactivar cuenta",suspend:"Suspender cuenta",upgrade:"Upgrade a Plan Completo",changeGroup:"Cambiar de grupo"}[actionModal.type]}
            </div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:14 }}>{actionModal.student?.name} · {actionModal.student?.level}</div>

            {actionModal.type==="suspend" && (
              <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#dc2626" }}>
                El estudiante perderá acceso inmediatamente. Su progreso se conserva.
              </div>
            )}
            {actionModal.type==="reactivate" && (
              <div style={{ background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#059669" }}>
                El estudiante recuperará acceso a su portal de inmediato.
              </div>
            )}
            {actionModal.type==="upgrade" && (
              <div style={{ background:"#fff8e6", border:"1px solid #ffbb23", borderRadius:9, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#d97706" }}>
                Se habilitarán todos los niveles hasta C1 y se generará una nueva suscripción de $95/mes.
              </div>
            )}
            {actionModal.type==="changeGroup" && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Nuevo grupo</label>
                <select style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", fontFamily:"inherit", color:"var(--text-primary)" }}>
                  {["A1 · 6:00 PM","A1 · 7:00 PM","A1 · 8:00 PM","A2 · 7:00 PM","B1 · 6:00 PM"].map(g=><option key={g}>{g}</option>)}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Nota interna (opcional)</label>
              <input value={actionNote} onChange={e=>setActionNote(e.target.value)} placeholder="Motivo o comentario..." style={{ width:"100%", padding:"10px 12px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit", marginBottom:16 }}/>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ setActionModal(null); setActionNote(""); }} style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>Cancelar</button>
              <button onClick={()=>{
                const msgs = {reactivate:"Cuenta reactivada correctamente",suspend:"Cuenta suspendida",upgrade:"Upgrade completado",changeGroup:"Grupo actualizado"};
                setActionDone(msgs[actionModal.type]);
                setActionModal(null); setActionNote("");
                setTimeout(()=>setActionDone(null), 3000);
              }} style={{ flex:2, padding:"10px", background:actionModal.type==="suspend"?"#dc2626":"#155266", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
  );
}