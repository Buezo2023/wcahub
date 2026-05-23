import { useState, useMemo, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { supabase } from "../lib/supabase.js";

const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"var(--wca-primary-dim)",
  secondary:"#ffbb23", secondaryDim:"var(--amber-dim)", accent:"#fab82c",
  bg:"var(--bg-page)", white:"var(--bg-surface)", text:"var(--text-primary)", textSec:"var(--text-secondary)",
  border:"var(--border)", borderLight:"var(--wca-primary-dim)",
  green:"#059669", greenDim:"var(--green-dim)",
  red:"#dc2626", redDim:"var(--red-dim)",
  amber:"#ffbb23", amberDim:"var(--amber-dim)",
  teal:"#0d7490", tealDim:"#cffafe",
};

// ─── DATA ──────────────────────────────────────────────────────────
const TEACHERS = [
  { id:1, name:"José Rodríguez",  groups:["A1·6PM","A1·7PM","A1·8PM"], levels:["A1"],      hours:9,  attendance:97, rating:4.8 },
  { id:2, name:"Ana Torres",      groups:["B1·6PM","B1·8PM"],           levels:["B1"],      hours:6,  attendance:95, rating:4.9 },
  { id:3, name:"María Paredes",   groups:["A2·7PM"],                    levels:["A2"],      hours:3,  attendance:92, rating:4.6 },
  { id:4, name:"Luis Gutiérrez",  groups:["A2·9PM"],                    levels:["A2"],      hours:3,  attendance:88, rating:4.4 },
  { id:5, name:"Carlos Medina",   groups:["B2·6PM"],                    levels:["B2"],      hours:3,  attendance:93, rating:4.7 },
  { id:6, name:"Sofía Estrada",   groups:["C1·6PM"],                    levels:["C1"],      hours:3,  attendance:100,rating:4.9 },
];

const GROUPS = [
  { id:1,  level:"A1", time:"6:00 PM",  teacher:1, students:22, cap:25, unit:9,  active:true  },
  { id:2,  level:"A1", time:"7:00 PM",  teacher:1, students:18, cap:25, unit:9,  active:true  },
  { id:3,  level:"A1", time:"8:00 PM",  teacher:1, students:15, cap:25, unit:9,  active:true  },
  { id:4,  level:"A2", time:"7:00 PM",  teacher:3, students:20, cap:25, unit:6,  active:true  },
  { id:5,  level:"A2", time:"9:00 PM",  teacher:4, students:12, cap:25, unit:6,  active:true  },
  { id:6,  level:"B1", time:"6:00 PM",  teacher:2, students:19, cap:25, unit:9,  active:true  },
  { id:7,  level:"B1", time:"8:00 PM",  teacher:2, students:14, cap:25, unit:9,  active:true  },
  { id:8,  level:"B2", time:"6:00 PM",  teacher:5, students:8,  cap:20, unit:4,  active:true  },
  { id:9,  level:"C1", time:"6:00 PM",  teacher:6, students:6,  cap:15, unit:7,  active:true  },
];

const STUDENTS = [
  { id:1,  name:"María López",    level:"B1", group:6,  type:"regular",     attendance:92, score:84, state:"active",    scholarship:false },
  { id:2,  name:"Carlos Torres",  level:"A1", group:1,  type:"regular",     attendance:78, score:71, state:"active",    scholarship:false },
  { id:3,  name:"Ana Mejía",      level:"A1", group:3,  type:"regular",     attendance:96, score:91, state:"active",    scholarship:false },
  { id:4,  name:"Luis Morales",   level:"A1", group:1,  type:"regular",     attendance:45, score:62, state:"suspended", scholarship:false },
  { id:5,  name:"Pedro Jiménez",  level:"A2", group:4,  type:"scholarship", attendance:67, score:68, state:"active",    scholarship:true  },
  { id:6,  name:"Jorge Ramírez",  level:"A1", group:2,  type:"scholarship", attendance:73, score:70, state:"active",    scholarship:true  },
  { id:7,  name:"Isabel Navarro", level:"C1", group:9,  type:"regular",     attendance:98, score:95, state:"active",    scholarship:false },
  { id:8,  name:"Diego Fuentes",  level:"B2", group:8,  type:"b2b",         attendance:55, score:59, state:"active",    scholarship:false },
  { id:9,  name:"Valentina Cruz", level:"A1", group:3,  type:"regular",     attendance:91, score:88, state:"active",    scholarship:false },
  { id:10, name:"Marcos Silva",   level:"B2", group:8,  type:"regular",     attendance:40, score:55, state:"suspended", scholarship:false },
];

const SCHOLARSHIPS = [
  { id:1, name:"Pedro Jiménez",  level:"A2", progress:"6/12 unidades completadas", attendance:67, start:"Ene 2025", program:"A1→B1", eligible:true  },
  { id:2, name:"Jorge Ramírez",  level:"A1", progress:"9/12 unidades completadas", attendance:73, start:"Feb 2025", program:"A1→B1", eligible:false },
];

const AT_RISK = STUDENTS.filter(s => s.attendance < 70 || s.score < 65);

const NAV = [
  { id:"home",       icon:"ti-layout-dashboard", label:"Inicio"           },
  { id:"groups",     icon:"ti-grid-dots",         label:"Grupos"           },
  { id:"teachers",   icon:"ti-users",             label:"Docentes"         },
  { id:"students",   icon:"ti-school",            label:"Estudiantes"      },
  { id:"atRisk",     icon:"ti-alert-triangle",    label:"En riesgo"        },
  { id:"schedule",   icon:"ti-calendar",          label:"Crear horario"    },
  { id:"scholarships",icon:"ti-certificate",      label:"Becas"            },
  { id:"reports",    icon:"ti-chart-bar",         label:"Reportes"         },
];

const levelColor = l => ({ A1:B.primary, A2:B.dark, B1:B.teal, B2:"#6d28d9", C1:B.green }[l]||B.primary);
const levelBg    = l => ({ A1:B.primaryDim, A2:"#dde6e9", B1:B.tealDim, B2:"#ede9fe", C1:B.greenDim }[l]||B.primaryDim);
const scoreCol   = s => s>=80?B.green:s>=70?B.amber:B.red;
const attCol     = a => a>=80?B.green:a>=60?B.amber:B.red;

function Badge({ text, bg, color }) {
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:bg, color, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>;
}
function Stat({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"13px 15px", borderTop:`3px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ fontSize:12, color:B.textSec }}>{label}</div>
        <i className={`ti ${icon}`} style={{ fontSize:16, color }} aria-hidden="true" />
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:B.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:B.textSec, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function CoordAcademica() {
  const navigate = useNavigate();

  // Session guard — redirect on expiry
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        navigate("/", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const [view, setView]               = useState("home");
  const [selGroup, setSelGroup]       = useState(null);
  const [selTeacher, setSelTeacher]   = useState(null);
  const [selStudent, setSelStudent]   = useState(null);
  const [upgradeModal, setUpgradeModal] = useState(null);

  // Teacher CRUD state
  const [teacherModal, setTeacherModal] = useState(null); // {mode:'add'|'edit'|'view', data?}
  const [teacherForm, setTeacherForm]   = useState({});
  const [teachers, setTeachers]         = useState(TEACHERS);
  const [deleteTeacher, setDeleteTeacher] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [newGroup, setNewGroup]       = useState({ level:"A1", time:"", days:"L·M·V", teacher:1, cap:25 });
  const [schedCreated, setSchedCreated] = useState(false);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterType, setFilterType]   = useState("all");
  const [search, setSearch]           = useState("");

  const filteredStudents = useMemo(() => STUDENTS.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const ml = filterLevel==="all" || s.level===filterLevel;
    const mt = filterType==="all" || s.type===filterType;
    return ms && ml && mt;
  }), [search, filterLevel, filterType]);

  const teacherName = id => teachers.find(t=>t.id===id)?.name || "Sin asignar";
  const groupLabel  = id => { const g=GROUPS.find(g=>g.id===id); return g?`${g.level} · ${g.time}`:"—"; };
  const totalStudents = GROUPS.reduce((a,g)=>a+g.students,0);
  const avgAttendance = Math.round(STUDENTS.reduce((a,s)=>a+s.attendance,0)/STUDENTS.length);

  return (
    <div style={{ display:"flex", minHeight: "100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif", position:"relative" }}>

      {/* SIDEBAR */}
      {ToastEl}
      <aside style={{ width:196, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"var(--bg-surface)" }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2, letterSpacing:1, textTransform:"uppercase" }}>Coordinación Académica</div>
        </div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSelGroup(null); setSelTeacher(null); setSelStudent(null); }} style={{
            display:"flex", alignItems:"center", gap:9, padding:"11px 18px", border:"none",
            background: view===item.id ? "rgba(255,255,255,.12)" : "transparent",
            color: view===item.id ? "var(--bg-surface)" : "rgba(255,255,255,.5)",
            fontSize:13, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===item.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===item.id ? 600 : 400,
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:15, width:16 }} aria-hidden="true" />
            {item.label}
            {item.id==="atRisk" && AT_RISK.length>0 && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.red, color:"var(--bg-surface)", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{AT_RISK.length}</span>
            )}
            {item.id==="scholarships" && SCHOLARSHIPS.some(s=>s.eligible) && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.secondary, color:B.dark, borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>!</span>
            )}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:"12px 16px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:B.secondary }}>CA</div>
            <div><div style={{ fontSize:12, color:"var(--bg-surface)", fontWeight:600 }}>Coordinadora WCA</div><div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Académica</div></div>
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

      {/* MAIN */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ height:52, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text }}>
            {{ home:"Vista general académica", groups:"Grupos y horarios", teachers:"Docentes", students:"Estudiantes", atRisk:"Estudiantes en riesgo", schedule:"Crear nuevo horario", scholarships:"Programa de becas", reports:"Reportes académicos" }[view]}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {AT_RISK.length>0 && <div style={{ fontSize:12, background:B.redDim, color:B.red, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⚠ {AT_RISK.length} en riesgo</div>}
            <div style={{ fontSize:12, background:B.primaryDim, color:B.primary, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{GROUPS.length} grupos activos</div>
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>

          {/* HOME */}
          {view==="home" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                <Stat label="Estudiantes activos" value={totalStudents} sub={`${GROUPS.length} grupos · 5 niveles`} color={B.primary} icon="ti-users" />
                <Stat label="Docentes activos" value={teachers.length} sub="6 horarios cubiertos" color={B.teal} icon="ti-school" />
                <Stat label="Asistencia promedio" value={`${avgAttendance}%`} sub="Todos los grupos" color={avgAttendance>=80?B.green:B.amber} icon="ti-calendar-check" />
                <Stat label="En riesgo académico" value={AT_RISK.length} sub="Requieren seguimiento" color={AT_RISK.length>0?B.red:B.green} icon="ti-alert-triangle" />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {/* Group overview */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                    Ocupación por grupo
                    <button onClick={()=>setView("groups")} style={{ fontSize:11, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Ver todos</button>
                  </div>
                  {GROUPS.map(g => (
                    <div key={g.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                      <div style={{ width:32, height:20, borderRadius:4, background:levelBg(g.level), display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:levelColor(g.level), flexShrink:0 }}>{g.level}</div>
                      <div style={{ fontSize:12, color:B.textSec, width:50, flexShrink:0 }}>{g.time}</div>
                      <div style={{ flex:1, height:5, background:B.bg, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${(g.students/g.cap)*100}%`, background: g.students/g.cap>0.9?B.red:g.students/g.cap>0.7?B.amber:B.green, borderRadius:3 }} />
                      </div>
                      <div style={{ fontSize:12, color:B.textSec, width:32, textAlign:"right" }}>{g.students}/{g.cap}</div>
                    </div>
                  ))}
                </div>

                {/* At-risk students */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
                    Requieren atención inmediata
                    <button onClick={()=>setView("atRisk")} style={{ fontSize:11, padding:"3px 8px", background:B.redDim, color:B.red, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Ver todos</button>
                  </div>
                  {AT_RISK.slice(0,4).map(s => (
                    <div key={s.id} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 10px", background:B.redDim, borderRadius:9, marginBottom:7, border:`1px solid ${B.red}30` }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:B.redDim, border:`1.5px solid ${B.red}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:B.red, flexShrink:0 }}>
                        {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{s.name}</div>
                        <div style={{ fontSize:11, color:B.textSec }}>
                          {s.attendance<70?`Asistencia: ${s.attendance}%`:""}{s.attendance<70&&s.score<65?" · ":""}{s.score<65?`Promedio: ${s.score}%`:""}
                        </div>
                      </div>
                      <Badge text={s.level} bg={levelBg(s.level)} color={levelColor(s.level)} />
                    </div>
                  ))}
                </div>

                {/* Docentes */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Docentes esta semana</div>
                  {TEACHERS.map(t => (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:`1px solid ${B.borderLight}` }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:B.primary, flexShrink:0 }}>
                        {t.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{t.name}</div>
                        <div style={{ fontSize:11, color:B.textSec }}>{t.groups.join(" · ")}</div>
                      </div>
                      <div style={{ display:"flex", gap:5 }}>
                        <Badge text={`${t.attendance}% asist.`} bg={attCol(t.attendance)===B.green?B.greenDim:B.amberDim} color={attCol(t.attendance)===B.green?"#065f46":"#92400e"} />
                        <Badge text={`★ ${t.rating}`} bg={B.secondaryDim} color="#92400e" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Becas upgrade */}
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:12 }}>Becados que pueden hacer upgrade</div>
                  {SCHOLARSHIPS.filter(s=>s.eligible).map(s => (
                    <div key={s.id} style={{ background:B.secondaryDim, border:`1px solid ${B.amber}40`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:3 }}>{s.name}</div>
                      <div style={{ fontSize:12, color:B.textSec, marginBottom:8 }}>{s.level} · {s.progress} · Asistencia: {s.attendance}%</div>
                      <button onClick={() => setUpgradeModal(s)} style={{ width:"100%", padding:"7px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        Hacer upgrade → Plan completo
                      </button>
                    </div>
                  ))}
                  {!SCHOLARSHIPS.some(s=>s.eligible) && <div style={{ fontSize:13, color:B.textSec, textAlign:"center", padding:"16px 0" }}>No hay becados elegibles este mes</div>}
                </div>
              </div>
            </div>
          )}

          {/* GROUPS */}
          {view==="groups" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {GROUPS.map(g => {
                  const teacher = TEACHERS.find(t=>t.id===g.teacher);
                  const pct = Math.round((g.students/g.cap)*100);
                  return (
                    <div key={g.id} onClick={() => setSelGroup(selGroup?.id===g.id?null:g)} style={{ background:B.white, border:`1.5px solid ${selGroup?.id===g.id?B.primary:B.border}`, borderRadius:12, padding:14, cursor:"pointer", transition:"border-color .15s" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div>
                          <div style={{ fontSize:16, fontWeight:800, color:levelColor(g.level) }}>{g.level}</div>
                          <div style={{ fontSize:13, fontWeight:500, color:B.text }}>{g.time}</div>
                          <div style={{ fontSize:12, color:B.textSec }}>L·M·V · {teacher?.name}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:13, color:pct>90?B.red:pct>70?B.amber:B.green, fontWeight:700 }}>{g.students}/{g.cap}</div>
                          <div style={{ fontSize:11, color:B.textSec }}>cupos</div>
                        </div>
                      </div>
                      <div style={{ height:5, background:B.bg, borderRadius:3, overflow:"hidden", marginBottom:8 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:pct>90?B.red:pct>70?B.amber:B.green, borderRadius:3 }} />
                      </div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        <Badge text={`U${g.unit}/12 activa`} bg={B.primaryDim} color={B.primary} />
                        <Badge text={pct>=100?"Lleno":pct>=80?"Casi lleno":"Con cupo"} bg={pct>=100?B.redDim:pct>=80?B.amberDim:B.greenDim} color={pct>=100?B.red:pct>=80?"#92400e":"#065f46"} />
                      </div>
                      {selGroup?.id===g.id && (
                        <div style={{ marginTop:12, borderTop:`1px solid ${B.borderLight}`, paddingTop:10, display:"flex", gap:6 }}>
                          <button onClick={e=>{e.stopPropagation();setTransferModal(g);}} style={{ flex:1, fontSize:12, padding:"7px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Mover estudiante</button>
                          <button onClick={()=>setSelStudent(null)} style={{ flex:1, fontSize:12, padding:"7px", background:B.secondaryDim, color:"#92400e", border:`1px solid ${B.amber}30`, borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Ver lista</button>
                          <button onClick={()=>setView("teachers")} style={{ flex:1, fontSize:12, padding:"7px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Cambiar docente</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Add group card */}
                <button onClick={() => setView("schedule")} style={{ background:"transparent", border:`2px dashed ${B.border}`, borderRadius:12, padding:14, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, minHeight:130, fontFamily:"inherit" }}>
                  <i className="ti ti-plus" style={{ fontSize:24, color:B.textSec }} aria-hidden="true" />
                  <span style={{ fontSize:13, color:B.textSec, fontWeight:500 }}>Nuevo grupo</span>
                </button>
              </div>
            </div>
          )}

          {/* TEACHERS */}
          {view==="teachers" && (
            <div>
              {selTeacher ? (
                <div>
                  <button onClick={()=>setSelTeacher(null)} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:B.primary, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", marginBottom:14 }}>
                    <i className="ti ti-arrow-left" style={{ fontSize:14 }} aria-hidden="true" /> Volver a docentes
                  </button>
                  <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:20, marginBottom:12 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                      <div style={{ width:56, height:56, borderRadius:"50%", background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:B.primary }}>
                        {selTeacher.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize:16, fontWeight:700, color:B.text }}>{selTeacher.name}</div>
                        <div style={{ fontSize:13, color:B.textSec }}>Docente · Niveles: {selTeacher.levels.join(", ")}</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
                      {[
                        { label:"Grupos a cargo", value:selTeacher.groups.length, color:B.primary },
                        { label:"Asistencia", value:`${selTeacher.attendance}%`, color:attCol(selTeacher.attendance) },
                        { label:"Calificación", value:`★ ${selTeacher.rating}`, color:B.amber },
                      ].map((m,i) => (
                        <div key={i} style={{ background:B.bg, borderRadius:9, padding:"10px 12px", textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:800, color:m.color }}>{m.value}</div>
                          <div style={{ fontSize:11, color:B.textSec, marginTop:2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:B.textSec, textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Grupos asignados</div>
                    {GROUPS.filter(g=>g.teacher===selTeacher.id).map(g => (
                      <div key={g.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:B.bg, borderRadius:8, marginBottom:6 }}>
                        <Badge text={g.level} bg={levelBg(g.level)} color={levelColor(g.level)} />
                        <span style={{ fontSize:13, color:B.text, flex:1 }}>{g.time} · {g.students} estudiantes</span>
                        <span style={{ fontSize:12, color:B.textSec }}>U{g.unit}/12</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      <button onClick={()=>setSelTeacher(null)} style={{ padding:"9px 16px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Volver</button>
                      <button onClick={()=>{ setTeacherForm({...selTeacher,levels:[...selTeacher.levels]}); setTeacherModal({mode:'edit',data:selTeacher}); }} style={{ flex:1, padding:"9px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✎ Editar</button>
                      <button onClick={()=>setDeleteTeacher(selTeacher)} style={{ padding:"9px 14px", background:B.redDim, color:B.red, border:"none", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>🗑 Eliminar</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {teachers.map(t => (
                    <div key={t.id} onClick={() => setSelTeacher(t)} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14, cursor:"pointer", transition:"border-color .15s" }}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=B.primary}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=B.border}>
                      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
                        <div style={{ width:42, height:42, borderRadius:"50%", background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:B.primary, flexShrink:0 }}>
                          {t.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{t.name}</div>
                          <div style={{ fontSize:12, color:B.textSec }}>{t.groups.length} grupos · {t.levels.join(", ")}</div>
                        </div>
                        <Badge text={`★ ${t.rating}`} bg={B.secondaryDim} color="#92400e" />
                      </div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {t.groups.map(g => <Badge key={g} text={g} bg={B.bg} color={B.textSec} />)}
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:B.textSec, marginTop:10, marginBottom:10 }}>
                        <span>Asistencia: <strong style={{ color:attCol(t.attendance) }}>{t.attendance}%</strong></span>
                        <span>{t.hours}h semanales</span>
                      </div>
                      <div style={{ display:"flex", gap:6 }} onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{setTeacherModal({mode:'view',data:t});}} style={{ flex:1, fontSize:11, padding:"6px 8px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Ver ficha</button>
                        <button onClick={()=>{ setTeacherForm({...t,levels:[...t.levels]}); setTeacherModal({mode:'edit',data:t}); }} style={{ flex:1, fontSize:11, padding:"6px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Editar</button>
                        <button onClick={()=>setDeleteTeacher(t)} style={{ fontSize:11, padding:"6px 10px", background:B.redDim, color:B.red, border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>🗑</button>
                      </div>
                    </div>
                  ))}
                  {/* Add teacher card */}
                  <div onClick={()=>{ setTeacherForm({name:"",email:"",phone:"",country:"Honduras",salary:"",levels:[],groups:[],attendance:100,rating:5.0,hours:3}); setTeacherModal({mode:'add'}); }} style={{ background:"transparent", border:`2px dashed ${B.border}`, borderRadius:12, padding:14, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, minHeight:130 }}>
                    <i className="ti ti-user-plus" style={{ fontSize:24, color:B.textSec }} aria-hidden="true" />
                    <span style={{ fontSize:13, color:B.textSec, fontWeight:500 }}>Agregar docente</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STUDENTS */}
          {view==="students" && (
            <div style={{ display:"flex", gap:12, height:"100%" }}>
              <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:B.white, border:`1px solid ${B.border}`, borderRadius:9, padding:"7px 12px" }}>
                    <i className="ti ti-search" style={{ color:B.textSec, fontSize:14 }} aria-hidden="true" />
                    <input aria-label="Buscar estudiante" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar estudiante..." style={{ border:"none", outline:"none", fontSize:13, background:"transparent", flex:1, fontFamily:"inherit", color:B.text }} />
                  </div>
                  <select aria-label="Filtrar por nivel" value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} style={{ padding:"7px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.white, fontFamily:"inherit" }}>
                    <option value="all">Todos los niveles</option>
                    {["A1","A2","B1","B2","C1"].map(l=><option key={l}>{l}</option>)}
                  </select>
                  <select aria-label="Filtrar por tipo" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:"7px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.white, fontFamily:"inherit" }}>
                    <option value="all">Todos los tipos</option>
                    <option value="regular">Regular</option>
                    <option value="scholarship">Beca</option>
                    <option value="b2b">B2B</option>
                  </select>
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden", flex:1, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead style={{ position:"sticky", top:0 }}>
                      <tr style={{ background:B.bg }}>
                        {["Estudiante","Nivel","Grupo","Tipo","Asistencia","Promedio","Estado",""].map(h=>(
                          <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s,i) => (
                        <tr key={s.id} onClick={() => setSelStudent(selStudent?.id===s.id?null:s)} style={{ borderTop:`1px solid ${B.borderLight}`, cursor:"pointer", background:selStudent?.id===s.id?B.primaryDim:"transparent" }}>
                          <td style={{ padding:"10px 10px" }}><div style={{ fontWeight:600, color:B.text }}>{s.name}</div></td>
                          <td style={{ padding:"10px 10px" }}><Badge text={s.level} bg={levelBg(s.level)} color={levelColor(s.level)} /></td>
                          <td style={{ padding:"10px 10px", fontSize:12, color:B.textSec }}>{groupLabel(s.group)}</td>
                          <td style={{ padding:"10px 10px" }}>
                            <Badge text={s.type==="scholarship"?"Beca":s.type==="b2b"?"B2B":"Regular"} bg={s.type==="scholarship"?B.secondaryDim:s.type==="b2b"?B.primaryDim:B.bg} color={s.type==="scholarship"?"#92400e":s.type==="b2b"?B.primary:B.textSec} />
                          </td>
                          <td style={{ padding:"10px 10px" }}><span style={{ color:attCol(s.attendance), fontWeight:600 }}>{s.attendance}%</span></td>
                          <td style={{ padding:"10px 10px" }}><span style={{ color:scoreCol(s.score), fontWeight:600 }}>{s.score}%</span></td>
                          <td style={{ padding:"10px 10px" }}>
                            <Badge text={s.state==="active"?"Activo":"Suspendido"} bg={s.state==="active"?B.greenDim:B.redDim} color={s.state==="active"?"#065f46":B.red} />
                          </td>
                          <td style={{ padding:"10px 10px" }}>
                            <button onClick={e=>{e.stopPropagation();setSelStudent(s);}} style={{ fontSize:11, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Ver →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {selStudent && (
                <div style={{ width:250, background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14, flexShrink:0, overflow:"auto" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:B.text }}>{selStudent.name}</div>
                    <button onClick={()=>setSelStudent(null)} style={{ background:"none", border:"none", cursor:"pointer", color:B.textSec, fontSize:15 }}>✕</button>
                  </div>
                  <div style={{ display:"flex", gap:5, marginBottom:12, flexWrap:"wrap" }}>
                    <Badge text={selStudent.level} bg={levelBg(selStudent.level)} color={levelColor(selStudent.level)} />
                    <Badge text={selStudent.state==="active"?"Activo":"Suspendido"} bg={selStudent.state==="active"?B.greenDim:B.redDim} color={selStudent.state==="active"?"#065f46":B.red} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                    <div style={{ background:B.bg, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:attCol(selStudent.attendance) }}>{selStudent.attendance}%</div>
                      <div style={{ fontSize:11, color:B.textSec }}>Asistencia</div>
                    </div>
                    <div style={{ background:B.bg, borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:scoreCol(selStudent.score) }}>{selStudent.score}%</div>
                      <div style={{ fontSize:11, color:B.textSec }}>Promedio</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <button onClick={() => { setTransferModal(GROUPS.find(g=>g.id===selStudent.group)); }} style={{ padding:"8px", background:B.primaryDim, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cambiar de grupo</button>
                    {selStudent.scholarship && <button onClick={()=>setUpgradeModal({...SCHOLARSHIPS.find(s=>s.name===selStudent.name)||SCHOLARSHIPS[0]})} style={{ padding:"8px", background:B.secondaryDim, color:"#92400e", border:`1px solid ${B.amber}30`, borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Upgrade → Plan completo</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AT RISK */}
          {view==="atRisk" && (
            <div>
              <div style={{ background:B.redDim, border:`1px solid ${B.red}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:B.red, display:"flex", gap:8 }}>
                <i className="ti ti-alert-circle" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true" />
                Estudiantes con asistencia menor al 70% o promedio menor al 65%. Contacta a sus docentes y coordina un plan de apoyo.
              </div>
              {AT_RISK.map(s => (
                <div key={s.id} style={{ background:B.white, border:`1px solid ${B.red}30`, borderRadius:12, padding:14, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:40, height:40, borderRadius:"50%", background:B.redDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:B.red, flexShrink:0 }}>
                        {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{s.name}</div>
                        <div style={{ fontSize:12, color:B.textSec }}>{groupLabel(s.group)} · {s.type==="scholarship"?"Becado":"Regular"}</div>
                      </div>
                    </div>
                    <Badge text={s.level} bg={levelBg(s.level)} color={levelColor(s.level)} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                    <div style={{ background: s.attendance<70?B.redDim:B.greenDim, borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:attCol(s.attendance) }}>{s.attendance}%</div>
                      <div style={{ fontSize:11, color:B.textSec }}>Asistencia {s.attendance<70?"⚠ Bajo mínimo":""}</div>
                    </div>
                    <div style={{ background: s.score<65?B.redDim:B.greenDim, borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:16, fontWeight:800, color:scoreCol(s.score) }}>{s.score}%</div>
                      <div style={{ fontSize:11, color:B.textSec }}>Promedio {s.score<65?"⚠ Bajo mínimo":""}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:7 }}>
                    <button style={{ flex:1, fontSize:12, padding:"7px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Notificar docente</button>
                    <button style={{ flex:1, fontSize:12, padding:"7px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Contactar estudiante</button>
                    <button onClick={()=>setTransferModal(GROUPS.find(g=>g.id===s.group))} style={{ flex:1, fontSize:12, padding:"7px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Cambiar grupo</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SCHEDULE */}
          {view==="schedule" && (
            <div style={{ maxWidth:500 }}>
              {schedCreated ? (
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:32, textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700, color:B.text, marginBottom:6 }}>Grupo creado</div>
                  <div style={{ fontSize:13, color:B.textSec, marginBottom:20 }}>El nuevo grupo ya aparece en la lista. El docente asignado recibirá una notificación.</div>
                  <button onClick={()=>setSchedCreated(false)} style={{ padding:"9px 20px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Crear otro grupo</button>
                </div>
              ) : (
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:16 }}>Nuevo grupo / horario</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                    <div>
                      <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Nivel</label>
                      <select value={newGroup.level} onChange={e=>setNewGroup(g=>({...g,level:e.target.value}))} style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                        {["A1","A2","B1","B2","C1"].map(l=><option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Horario</label>
                      <input value={newGroup.time} onChange={e=>setNewGroup(g=>({...g,time:e.target.value}))} placeholder="Ej: 7:00–8:00 PM" style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }} />
                    </div>
                    <div>
                      <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Días</label>
                      <select style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                        <option>L·M·V</option><option>M·J</option><option>L·V</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Cupo máximo</label>
                      <input type="number" value={newGroup.cap} onChange={e=>setNewGroup(g=>({...g,cap:+e.target.value}))} style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Docente asignado</label>
                    <select value={newGroup.teacher} onChange={e=>setNewGroup(g=>({...g,teacher:+e.target.value}))} style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                      {teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div style={{ background:B.primaryDim, borderRadius:9, padding:"9px 12px", fontSize:13, color:B.primary, marginBottom:14, display:"flex", gap:6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize:13, flexShrink:0 }} aria-hidden="true" />
                    El grupo se creará en la unidad activa del ciclo para el nivel {newGroup.level}. El Admin deberá configurar el link de Teams.
                  </div>
                  <button onClick={()=>newGroup.time&&setSchedCreated(true)} style={{ width:"100%", padding:"11px", background:newGroup.time?B.primary:B.border, color:newGroup.time?"var(--bg-surface)":B.textSec, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:newGroup.time?"pointer":"not-allowed", fontFamily:"inherit" }}>
                    Crear grupo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCHOLARSHIPS */}
          {view==="scholarships" && (
            <div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {SCHOLARSHIPS.map(s => (
                  <div key={s.id} style={{ background:B.white, border:`1px solid ${s.eligible?B.amber:B.border}`, borderRadius:12, padding:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:15, fontWeight:700, color:B.text }}>{s.name}</div>
                        <div style={{ fontSize:13, color:B.textSec }}>{s.level} · {s.program} · Ingresó: {s.start}</div>
                      </div>
                      <Badge text={s.eligible?"Elegible para upgrade":"Sin cumplir criterios"} bg={s.eligible?B.secondaryDim:B.bg} color={s.eligible?"#92400e":B.textSec} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                      {[
                        { label:"Progreso", value:s.progress, color:B.primary },
                        { label:"Asistencia", value:`${s.attendance}%`, color:attCol(s.attendance) },
                        { label:"Criterio", value:s.attendance>=70?"✓ Cumple":"✗ No cumple", color:s.attendance>=70?B.green:B.red },
                      ].map((m,i) => (
                        <div key={i} style={{ background:B.bg, borderRadius:8, padding:"8px 10px" }}>
                          <div style={{ fontSize:13, fontWeight:700, color:m.color }}>{m.value}</div>
                          <div style={{ fontSize:11, color:B.textSec, marginTop:2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    {s.eligible && (
                      <button onClick={()=>setUpgradeModal(s)} style={{ width:"100%", padding:"9px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                        Hacer upgrade a Plan Completo ($95/mes)
                      </button>
                    )}
                    {!s.eligible && <div style={{ fontSize:13, color:B.textSec, textAlign:"center", padding:"6px 0" }}>Necesita ≥70% de asistencia para ser elegible.</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {view==="reports" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { icon:"ti-calendar-check", title:"Asistencia por grupo",      desc:"% semanal y mensual por docente y horario",   color:B.primary },
                { icon:"ti-chart-line",     title:"Progreso por nivel",         desc:"Tasa de aprobación, deserción y velocidad",   color:B.teal },
                { icon:"ti-certificate",    title:"Estudiantes en ruta a graduación", desc:"Quiénes están cerca de completar su nivel", color:B.green },
                { icon:"ti-school",         title:"Rendimiento de docentes",    desc:"Asistencia, calificación y grupos activos",   color:B.amber },
                { icon:"ti-users-group",    title:"Distribución de estudiantes",desc:"Por nivel, tipo y horario",                   color:B.dark },
                { icon:"ti-alert-triangle", title:"Riesgo académico",           desc:"Baja asistencia, bajo rendimiento, inactivos", color:B.red },
              ].map((r,i) => (
                <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14, display:"flex", gap:12, alignItems:"flex-start", cursor:"pointer" }}>
                  <div style={{ width:38, height:38, borderRadius:9, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <i className={`ti ${r.icon}`} style={{ fontSize:18, color:r.color }} aria-hidden="true" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:B.text, marginBottom:3 }}>{r.title}</div>
                    <div style={{ fontSize:12, color:B.textSec, marginBottom:8 }}>{r.desc}</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ fontSize:11, padding:"3px 10px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Ver reporte</button>
                      <button style={{ fontSize:11, padding:"3px 10px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>↓ Exportar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Upgrade beca */}
      {upgradeModal && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}>
          <div style={{ background:B.white, borderRadius:16, padding:24, width:380, border:`1px solid ${B.border}` }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Upgrade a Plan Completo</div>
            <div style={{ fontSize:13, color:B.textSec, marginBottom:14 }}>{upgradeModal.name} · Beca {upgradeModal.program}</div>
            <div style={{ background:B.secondaryDim, borderRadius:10, padding:12, marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#92400e", marginBottom:6 }}>¿Qué cambia?</div>
              {["Acceso 24/7 a plataforma completa","Todos los niveles hasta C1","Exámenes digitales incluidos","Cobro mensual de $95/mes desde hoy","El progreso actual se conserva"].map((item,i) => (
                <div key={i} style={{ fontSize:12, color:"#92400e", display:"flex", gap:6, marginBottom:4 }}>
                  <i className="ti ti-check" style={{ fontSize:13, color:B.green, flexShrink:0 }} aria-hidden="true" />{item}
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setUpgradeModal(null)} style={{ flex:1, padding:"9px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:B.textSec }}>Cancelar</button>
              <button onClick={()=>setUpgradeModal(null)} style={{ flex:2, padding:"9px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓ Confirmar upgrade</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Teacher CRUD ── */}
      {teacherModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setTeacherModal(null); }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:18, padding:26, animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both", width:460, maxWidth:"100%", border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{teacherModal.mode==="add"?"Agregar docente":teacherModal.mode==="edit"?"Editar docente":teacherModal.data.name}</div>
                {teacherModal.mode==="view"&&<div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>Ficha del empleado</div>}
              </div>
              <button onClick={()=>setTeacherModal(null)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-tertiary)" }}>✕</button>
            </div>

            {teacherModal.mode==="view" ? (
              <div>
                <div style={{ display:"flex", gap:14, marginBottom:18, alignItems:"center" }}>
                  <div style={{ width:56, height:56, borderRadius:"50%", background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:700, color:B.primary, flexShrink:0 }}>
                    {teacherModal.data.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{teacherModal.data.name}</div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)" }}>Docente · Niveles: {teacherModal.data.levels.join(", ")}</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                  {[{l:"Asistencia",v:`${teacherModal.data.attendance}%`,c:attCol(teacherModal.data.attendance)},{l:"Calificación",v:`★ ${teacherModal.data.rating}`,c:B.amber},{l:"Horas/sem.",v:`${teacherModal.data.hours}h`,c:B.primary}].map((m,i)=>(
                    <div key={i} style={{ background:"var(--bg-surface-subtle)", borderRadius:8, padding:"8px 10px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:m.c }}>{m.v}</div>
                      <div style={{ fontSize:10, color:"var(--text-secondary)", marginTop:2 }}>{m.l}</div>
                    </div>
                  ))}
                </div>
                {[["Email",teacherModal.data.email||"—"],["Teléfono",teacherModal.data.phone||"—"],["País",teacherModal.data.country||"—"],["Salario",teacherModal.data.salary?`$${teacherModal.data.salary}/mes`:"—"],["Grupos",teacherModal.data.groups.join(" · ")||"Sin grupos"]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ color:"var(--text-secondary)" }}>{k}</span>
                    <span style={{ color:"var(--text-primary)", fontWeight:500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:"flex", gap:8, marginTop:16 }}>
                  <button onClick={()=>setTeacherModal(null)} style={{ padding:"10px 16px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>Cerrar</button>
                  <button onClick={()=>{ setTeacherForm({...teacherModal.data,levels:[...teacherModal.data.levels]}); setTeacherModal({mode:'edit',data:teacherModal.data}); }} style={{ flex:1, padding:"10px", background:B.primary, color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✎ Editar</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Nombre completo</label>
                    <input value={teacherForm.name||""} onChange={e=>setTeacherForm(f=>({...f,name:e.target.value}))} placeholder="Ana Torres" style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Email corporativo</label>
                    <input value={teacherForm.email||""} onChange={e=>setTeacherForm(f=>({...f,email:e.target.value}))} placeholder="nombre@wca.edu.hn" style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Teléfono</label>
                    <input value={teacherForm.phone||""} onChange={e=>setTeacherForm(f=>({...f,phone:e.target.value}))} placeholder="+504 9900-0000" style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>País</label>
                    <input value={teacherForm.country||""} onChange={e=>setTeacherForm(f=>({...f,country:e.target.value}))} placeholder="Honduras" style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Salario (USD/mes)</label>
                    <input type="number" value={teacherForm.salary||""} onChange={e=>setTeacherForm(f=>({...f,salary:e.target.value}))} placeholder="850" style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>Horas semanales</label>
                    <input type="number" value={teacherForm.hours||""} onChange={e=>setTeacherForm(f=>({...f,hours:+e.target.value}))} placeholder="3" style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
                  </div>
                  <div style={{ gridColumn:"1/-1" }}>
                    <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:8 }}>Niveles que imparte</label>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {["A1","A2","B1","B2","C1"].map(l=>(
                        <label key={l} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13 }}>
                          <input type="checkbox" checked={teacherForm.levels?.includes(l)||false} onChange={e=>setTeacherForm(f=>({ ...f, levels:e.target.checked?[...(f.levels||[]),l]:(f.levels||[]).filter(x=>x!==l) }))}/>
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:18 }}>
                  <button onClick={()=>setTeacherModal(null)} style={{ padding:"10px 16px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>Cancelar</button>
                  {teacherModal.mode==="edit"&&<button onClick={()=>setDeleteTeacher(teacherModal.data)} style={{ padding:"10px 16px", background:B.redDim, color:B.red, border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>}
                  <button onClick={()=>{
                    if(teacherModal.mode==="add") setTeachers(t=>[...t,{...teacherForm,id:Date.now(),rating:5.0,groups:[]}]);
                    else setTeachers(t=>t.map(x=>x.id===teacherModal.data.id?{...x,...teacherForm}:x));
                    setTeacherModal(null);
                  }} style={{ flex:1, padding:"10px", background:B.primary, color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                    {teacherModal.mode==="add"?"Agregar docente":"Guardar cambios"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Delete teacher confirm ── */}
      {deleteTeacher && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setDeleteTeacher(null); }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:16, padding:24, width:380, border:"1px solid var(--border)", boxShadow:"var(--shadow-lg)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>Eliminar docente</div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:14 }}>{deleteTeacher.name} · {deleteTeacher.levels.join(", ")}</div>
            <div style={{ background:B.redDim, borderRadius:9, padding:"10px 14px", marginBottom:16, fontSize:12, color:B.red }}>
              Esta acción es permanente. El docente perderá acceso y sus grupos quedarán sin asignar.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setDeleteTeacher(null)} style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>Cancelar</button>
              <button onClick={()=>{ setTeachers(t=>t.filter(x=>x.id!==deleteTeacher.id)); setDeleteTeacher(null); setTeacherModal(null); if(selTeacher?.id===deleteTeacher.id) setSelTeacher(null); }} style={{ flex:1, padding:"10px", background:B.red, color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Transfer student */}
      {transferModal && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}>
          <div style={{ background:B.white, borderRadius:16, padding:24, width:380 }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Mover estudiante a otro grupo</div>
            <div style={{ fontSize:13, color:B.textSec, marginBottom:14 }}>Grupo actual: {transferModal.level} · {transferModal.time}</div>
            <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:5 }}>Estudiante</label>
            <select style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit", marginBottom:10 }}>
              {STUDENTS.filter(s=>s.group===transferModal.id).map(s=><option key={s.id}>{s.name}</option>)}
            </select>
            <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:5 }}>Nuevo grupo</label>
            <select style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit", marginBottom:14 }}>
              {GROUPS.filter(g=>g.id!==transferModal.id&&g.level===transferModal.level&&g.students<g.cap).map(g=>(
                <option key={g.id}>{g.level} · {g.time} ({g.cap-g.students} cupos)</option>
              ))}
            </select>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setTransferModal(null)} style={{ flex:1, padding:"9px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:B.textSec }}>Cancelar</button>
              <button onClick={()=>setTransferModal(null)} style={{ flex:2, padding:"9px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Mover estudiante</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
