import { useState, useEffect } from "react";

// ─── Brand ───────────────────────────────────────────────────────
const P = "#155266", PH = "#0f3d4d", PD = "#e8f3f6";
const Y = "#ffbb23", YD = "#fff8e6";
const G = "#059669", GD = "#ecfdf5";
const R = "#dc2626", RD = "#fef2f2";
const A = "#d97706", AD = "#fffbeb";

// ─── Student data ────────────────────────────────────────────────
const STUDENT = {
  name:"María", lastName:"Rodríguez", level:"B1", levelName:"Intermedio",
  levelFull:"Wide Angle Level 3 — B1", group:"B1 · 6:00–7:00 PM",
  teacher:"Ana Torres", unit:9, unitTitle:"Future", nextClass:"Lunes 16 Jun · 6:00 PM",
  teamsLink:"#", daysUntilClass:3, xp:3540, rank:"Achiever", streak:8,
  examScore:85, examAttempts:1,
};

// ─── Units for B1 (Wide Angle Level 3) ──────────────────────────
const UNITS = [
  { n:1,  title:"Identity",       acts:21, testActs:3 },
  { n:2,  title:"Relationships",  acts:20, testActs:3 },
  { n:3,  title:"Responsibilities",acts:22,testActs:3 },
  { n:4,  title:"Extremes",       acts:21, testActs:3 },
  { n:5,  title:"Creativity",     acts:21, testActs:3 },
  { n:6,  title:"Places",         acts:22, testActs:3 },
  { n:7,  title:"People",         acts:20, testActs:3 },
  { n:8,  title:"Stories",        acts:21, testActs:3 },
  { n:9,  title:"Future",         acts:20, testActs:3 },
  { n:10, title:"Performance",    acts:20, testActs:3 },
  { n:11, title:"Experiences",    acts:20, testActs:3 },
  { n:12, title:"Change",         acts:20, testActs:3 },
];

// Simulated progress: units 1-8 done, 9 active, 10-12 locked
const PROGRESS = {
  1:{actsDone:21,testDone:3,score:92},  2:{actsDone:20,testDone:3,score:88},
  3:{actsDone:22,testDone:3,score:91},  4:{actsDone:21,testDone:3,score:85},
  5:{actsDone:21,testDone:3,score:87},  6:{actsDone:22,testDone:3,score:90},
  7:{actsDone:20,testDone:3,score:83},  8:{actsDone:21,testDone:3,score:86},
  9:{actsDone:7, testDone:0,score:0},   10:{actsDone:0,testDone:0,score:0},
  11:{actsDone:0,testDone:0,score:0},   12:{actsDone:0,testDone:0,score:0},
};

// ─── Skills data ─────────────────────────────────────────────────
const SKILLS = [
  { name:"Listening",        total:48, done:32, score:89, color:"#6b21a8" },
  { name:"Reading",          total:23, done:17, score:85, color:"#4d7c0f" },
  { name:"Speaking",         total:12, done:8,  score:82, color:"#be185d" },
  { name:"Pronunciation",    total:12, done:8,  score:78, color:"#c2410c" },
  { name:"English For Real", total:36, done:24, score:91, color:"#0e7490" },
  { name:"Writing",          total:12, done:8,  score:80, color:"#b91c1c" },
  { name:"Vocabulary",       total:53, done:36, score:87, color:"#166534" },
  { name:"Grammar",          total:60, done:40, score:84, color:"#1e40af" },
];

const totalActs = SKILLS.reduce((a,s)=>a+s.total,0);
const totalDone = SKILLS.reduce((a,s)=>a+s.done,0);
const avgScore  = Math.round(SKILLS.reduce((a,s)=>a+s.score,0)/SKILLS.length);

// ─── Navigation ───────────────────────────────────────────────────
const NAV = [
  { id:"inicio",    icon:"ti-layout-dashboard", label:"Inicio"       },
  { id:"practica",  icon:"ti-device-laptop",    label:"Práctica 24/7"},
  { id:"clases",    icon:"ti-video",            label:"Clases en vivo"},
  { id:"examen",    icon:"ti-writing",          label:"Examen"        },
  { id:"progreso",  icon:"ti-certificate",      label:"Mi progreso"   },
  { id:"pagos",     icon:"ti-credit-card",      label:"Pagos"         },
];

// ─── Circular Progress Ring ──────────────────────────────────────
function Ring({ pct, size=36, stroke=3, color=Y, bg="#e5e7eb", children }) {
  const r = (size-stroke*2)/2;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition:"stroke-dasharray 1s ease" }}/>
      {children && <foreignObject x={0} y={0} width={size} height={size}><div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", fontSize:9, fontWeight:700, color }}>{children}</div></foreignObject>}
    </svg>
  );
}

// ─── Unit number badge (Oxford style — amber circle) ─────────────
function UnitBadge({ n, isActive, isDone }) {
  const bg = isDone ? G : isActive ? Y : "#d4b483";
  return (
    <div style={{ width:34, height:34, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff", flexShrink:0, transition:"background .3s" }}>
      {n}
    </div>
  );
}

// ─── Unit row (Online Practice style) ────────────────────────────
function UnitRow({ unit, prog, isActive, isDone, isLocked, onClick }) {
  const actsPct = unit.acts > 0 ? Math.round((prog.actsDone/unit.acts)*100) : 0;
  const testPct = unit.testActs > 0 ? Math.round((prog.testDone/unit.testActs)*100) : 0;

  return (
    <div>
      {/* Unit activities row */}
      <div onClick={!isLocked ? onClick : undefined} style={{
        display:"flex", alignItems:"center", gap:16, padding:"14px 20px",
        background:"var(--bg-surface)", border:"1px solid var(--border)",
        borderRadius:10, marginBottom:6, cursor:isLocked?"not-allowed":"pointer",
        opacity:isLocked?.5:1, transition:"all .15s", boxShadow:"var(--shadow-sm)",
      }}
      onMouseEnter={e=>{ if(!isLocked) e.currentTarget.style.borderColor=Y; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; }}>
        <UnitBadge n={unit.n} isActive={isActive} isDone={isDone}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:isActive?700:500, color:isLocked?"var(--text-tertiary)":"var(--text-primary)" }}>
            Unit {unit.n} {unit.title}
            {isActive && <span style={{ marginLeft:8, fontSize:10, background:Y, color:PH, padding:"2px 8px", borderRadius:20, fontWeight:700 }}>ACTIVA</span>}
            {isLocked && <span style={{ marginLeft:8, fontSize:10, background:"var(--bg-surface-subtle)", color:"var(--text-tertiary)", padding:"2px 8px", borderRadius:20 }}>🔒 Bloqueada</span>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:140, justifyContent:"flex-end" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, color:"var(--text-secondary)" }}>{prog.actsDone}/{unit.acts}</div>
            <div style={{ fontSize:10, color:"var(--text-tertiary)" }}>Activities done</div>
          </div>
          <Ring pct={actsPct} size={36} stroke={3} color={isDone?G:isActive?Y:"#d1d5db"}/>
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:isDone?G:isActive&&actsPct>0?A:"var(--text-tertiary)", minWidth:42, textAlign:"right" }}>
          {prog.score>0?`${prog.score}%`:"0%"}
        </div>
      </div>

      {/* Unit test row */}
      <div style={{
        display:"flex", alignItems:"center", gap:16, padding:"12px 20px",
        background:"var(--bg-surface)", border:"1px solid var(--border)",
        borderRadius:10, marginBottom:12, cursor:isLocked||(!isDone&&!isActive)?"not-allowed":"pointer",
        opacity:isLocked||(!isDone&&!isActive)?.4:1, boxShadow:"var(--shadow-sm)",
        transition:"all .15s",
      }}
      onMouseEnter={e=>{ if(!isLocked) e.currentTarget.style.borderColor=P; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor="var(--border)"; }}>
        <UnitBadge n={unit.n} isActive={isActive} isDone={isDone}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:500, color:isLocked||(!isDone&&!isActive)?"var(--text-tertiary)":"var(--text-primary)" }}>
            Unit {unit.n} Test
            {isDone && prog.testDone===unit.testActs && <span style={{ marginLeft:8, fontSize:10, background:GD, color:G, padding:"2px 8px", borderRadius:20, fontWeight:700 }}>✓ Completo</span>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:140, justifyContent:"flex-end" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, color:"var(--text-secondary)" }}>{prog.testDone}/{unit.testActs}</div>
            <div style={{ fontSize:10, color:"var(--text-tertiary)" }}>Activities done</div>
          </div>
          <Ring pct={testPct} size={36} stroke={3} color={prog.testDone===unit.testActs?G:P}/>
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:prog.testDone>0?G:"var(--text-tertiary)", minWidth:42, textAlign:"right" }}>
          {prog.testDone>0?`${Math.round((prog.testDone/unit.testActs)*100)}%`:"0%"}
        </div>
      </div>
    </div>
  );
}

// ─── Skill card (Oxford Overall Scores style) ────────────────────
function SkillCard({ skill }) {
  const pct = Math.round((skill.done/skill.total)*100);
  return (
    <div style={{ background:skill.color, borderRadius:12, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
      <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:8 }}>{skill.name}</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", marginBottom:2 }}>Scores</div>
      <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:12 }}>{skill.score}%</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", marginBottom:2 }}>Activities done</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{skill.done}/{skill.total}</div>
        </div>
        <Ring pct={pct} size={44} stroke={4} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.3)"/>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────
export default function PortalEstudiante() {
  const [view,        setView]       = useState("inicio");
  const [selUnit,     setSelUnit]    = useState(null);
  const [showScores,  setShowScores] = useState("last");
  const [filterSubmit,setFilterSubmit]=useState("time_off");

  const activeUnit = STUDENT.unit;
  const timeMins   = 347; // demo time on activities

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg-page)", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width:200, background:P, display:"flex", flexDirection:"column", padding:"0 0 16px", flexShrink:0, minHeight:"100vh", position:"sticky", top:0 }}>
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>
          <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>WCA <span style={{ color:Y }}>Hub</span></div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", marginTop:2, textTransform:"uppercase", letterSpacing:1 }}>Portal del estudiante</div>
        </div>

        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 18px", border:"none", background:view===n.id?"rgba(255,255,255,.12)":"transparent", color:view===n.id?"#fff":"rgba(255,255,255,.45)", fontSize:12, cursor:"pointer", textAlign:"left", borderLeft:`2px solid ${view===n.id?Y:"transparent"}`, transition:"all .15s", fontFamily:"inherit", fontWeight:view===n.id?600:400, width:"100%" }}>
            <i className={"ti "+n.icon} style={{ fontSize:14, width:18, textAlign:"center" }} aria-hidden="true"/>
            {n.label}
          </button>
        ))}

        {/* Student card */}
        <div style={{ marginTop:"auto", padding:"14px 18px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:Y, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:PH }}>MR</div>
            <div><div style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{STUDENT.name} {STUDENT.lastName}</div><div style={{ fontSize:10, color:"rgba(255,255,255,.35)" }}>Inglés {STUDENT.level}</div></div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        {/* Topbar */}
        <div style={{ height:60, background:"var(--bg-surface)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>
              {{"inicio":"Inicio","practica":"Práctica 24/7 — Online Practice","clases":"Clases en vivo","examen":"Examen","progreso":"Mi progreso","pagos":"Pagos"}[view]}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ fontSize:11, background:YD, color:A, border:`1px solid ${Y}40`, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>U{STUDENT.unit} activa</div>
            <div style={{ fontSize:11, background:GD, color:"#065f46", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>Próxima clase: {["L","M","X","J","V","S","D"][(new Date()).getDay()]}</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>

          {/* ── INICIO ── */}
          {view==="inicio" && (
            <div style={{ padding:24 }}>
              {/* Welcome card */}
              <div style={{ background:`linear-gradient(135deg,${P},${PH})`, borderRadius:16, padding:"22px 28px", marginBottom:20, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", right:-30, top:-30, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.05)" }}/>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>Bienvenida de vuelta</div>
                <div style={{ fontSize:24, fontWeight:800, color:"#fff", marginBottom:6 }}>¡Hola, {STUDENT.name}! 👋</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginBottom:18, lineHeight:1.6 }}>
                  Tu próxima clase en vivo es el <span style={{ color:Y, fontWeight:600 }}>lunes a las 6:00 PM</span> con {STUDENT.teacher}.<br/>
                  Tienes la Unidad {STUDENT.unit} activa y lista para practicar.
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setView("practica")} style={{ padding:"9px 20px", background:Y, color:PH, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Ir a practicar →</button>
                  <button onClick={()=>setView("examen")} style={{ padding:"9px 18px", background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.2)", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Ir al examen</button>
                </div>
                {/* Progress ring */}
                <div style={{ position:"absolute", right:28, top:"50%", transform:"translateY(-50%)", textAlign:"center" }}>
                  <Ring pct={Math.round((STUDENT.unit-1)/12*100)} size={72} stroke={5} color={Y} bg="rgba(255,255,255,.2)">
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:14, fontWeight:800, color:Y }}>{Math.round((STUDENT.unit-1)/12*100)}%</div></div>
                  </Ring>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:4 }}>ciclo {STUDENT.level}</div>
                </div>
              </div>

              {/* KPI row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { label:"Unidades completadas", value:`${STUDENT.unit-1}/12`, sub:"este ciclo",     color:P, icon:"ti-check" },
                  { label:"Promedio de exámenes",  value:`${STUDENT.examScore}%`, sub:"últimas 8 unidades", color:G, icon:"ti-writing" },
                  { label:"Racha actual",          value:`${STUDENT.streak} sem`, sub:"sin faltar",    color:Y, icon:"ti-flame" },
                  { label:"Próximo nivel",         value:"B2",                    sub:"al aprobar U12", color:"#7c3aed", icon:"ti-arrow-up" },
                ].map((k,i)=>(
                  <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 18px", borderTop:`3px solid ${k.color}`, boxShadow:"var(--shadow-sm)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{k.label}</div>
                      <i className={"ti "+k.icon} style={{ fontSize:15, color:k.color }} aria-hidden="true"/>
                    </div>
                    <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", lineHeight:1 }}>{k.value}</div>
                    <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:4 }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:14 }}>
                {/* Unidad activa */}
                <div style={{ background:"var(--bg-surface)", border:`1.5px solid ${Y}60`, borderRadius:14, padding:20, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ fontSize:11, color:"var(--text-tertiary)", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Unidad activa — U{STUDENT.unit}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>{STUDENT.unitTitle}</div>
                  <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.6, marginBottom:18 }}>
                    Practica el contenido de esta unidad antes de la clase y refuerza con los ejercicios de listening, vocabulary y grammar.
                  </div>
                  {/* Unit progress bar */}
                  <div style={{ display:"flex", gap:3, marginBottom:12 }}>
                    {Array.from({length:12},(_,i)=>(
                      <div key={i} style={{ flex:1, height:6, borderRadius:3, background:i+1<activeUnit?G:i+1===activeUnit?Y:"var(--bg-surface-subtle)", transition:"background .3s" }}/>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setView("practica")} style={{ flex:1, padding:"10px", background:P, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Ir a practicar</button>
                    <button onClick={()=>setView("examen")} style={{ flex:1, padding:"10px", background:"var(--bg-surface-subtle)", color:"var(--text-primary)", border:"1px solid var(--border)", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Ir al examen</button>
                  </div>
                </div>

                {/* Próximas clases */}
                <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:14 }}>Próximas clases en vivo</div>
                  {[
                    { day:"LUN", date:16, time:"6:00–7:00 PM", unit:`U${STUDENT.unit}: Future`,       next:true  },
                    { day:"MIÉ", date:18, time:"6:00–7:00 PM", unit:`U${STUDENT.unit}: Repaso`,       next:false },
                    { day:"VIE", date:20, time:"6:00–7:00 PM", unit:`U${STUDENT.unit}: Cierre`,       next:false },
                  ].map((c,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:i<2?"1px solid var(--border)":"none" }}>
                      <div style={{ width:44, height:44, borderRadius:10, background:c.next?P:"var(--bg-surface-subtle)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <div style={{ fontSize:8, color:c.next?"rgba(255,255,255,.6)":"var(--text-tertiary)", fontWeight:600 }}>{c.day}</div>
                        <div style={{ fontSize:17, fontWeight:800, color:c.next?"#fff":"var(--text-primary)" }}>{c.date}</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:c.next?600:400, color:"var(--text-primary)" }}>{c.time}</div>
                        <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{c.unit}</div>
                      </div>
                      {c.next && <a href={STUDENT.teamsLink} style={{ fontSize:11, padding:"5px 10px", background:P, color:"#fff", borderRadius:8, textDecoration:"none", fontWeight:600 }}>Unirme</a>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PRÁCTICA 24/7 — ONLINE PRACTICE ── */}
          {view==="practica" && (
            <div>
              {/* Wide Angle level header (amber bar like Oxford) */}
              <div style={{ background:Y, padding:"14px 24px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:8, background:"rgba(255,255,255,.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📖</div>
                <div style={{ fontSize:16, fontWeight:700, color:PH }}>{STUDENT.levelFull}</div>
              </div>

              {/* Overall Scores section */}
              <div style={{ background:"var(--bg-surface)", borderBottom:"1px solid var(--border)", padding:"20px 24px 24px" }}>
                <div style={{ textAlign:"center", marginBottom:20 }}>
                  <div style={{ width:48, height:48, background:"var(--bg-surface-subtle)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px" }}>
                    <i className="ti ti-chart-bar" style={{ fontSize:24, color:"var(--text-primary)" }} aria-hidden="true"/>
                  </div>
                  <div style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>Overall scores</div>
                  <div style={{ height:1, background:"var(--border)", marginTop:14 }}/>
                </div>

                {/* Global stats */}
                <div style={{ display:"flex", justifyContent:"center", gap:48, marginBottom:24 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <div>
                      <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)" }}><span style={{ color:P }}>{totalDone}</span>/{totalActs}</div>
                      <div style={{ fontSize:12, color:"var(--text-secondary)" }}>Activities done</div>
                    </div>
                    <Ring pct={Math.round(totalDone/totalActs*100)} size={44} stroke={4} color={P}/>
                  </div>
                  <div style={{ borderLeft:"1px solid var(--border)", paddingLeft:48 }}>
                    <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:4 }}>Scores</div>
                    <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>{avgScore}%</div>
                  </div>
                  <div style={{ borderLeft:"1px solid var(--border)", paddingLeft:48, display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:32, height:32, background:"var(--bg-surface-subtle)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className="ti ti-clock" style={{ fontSize:16, color:"var(--text-secondary)" }} aria-hidden="true"/>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>Time on activities</div>
                      <div style={{ fontSize:18, fontWeight:700, color:"var(--text-primary)" }}>{timeMins}<span style={{ fontSize:12, fontWeight:400 }}>mins</span></div>
                    </div>
                  </div>
                </div>

                {/* Skill cards grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:4 }}>
                  {SKILLS.slice(0,5).map(s=><SkillCard key={s.name} skill={s}/>)}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr) 2fr", gap:10 }}>
                  {SKILLS.slice(5).map(s=><SkillCard key={s.name} skill={s}/>)}
                  <div/>
                </div>
              </div>

              {/* Online Practice list header */}
              <div style={{ padding:"18px 24px 0" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, paddingBottom:14, borderBottom:"1px solid var(--border)" }}>
                  <div style={{ fontSize:15, fontWeight:600, color:"var(--text-secondary)", textAlign:"center", flex:1 }}>Online Practice</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {/* Filter dropdowns like Oxford */}
                    {[["Submit","Time off","ti-clock"],["Show","Last attempt","ti-eye"],["Scores","%","ti-chart-pie"]].map(([pre,val,ic],i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer", fontSize:12 }}>
                        <span style={{ color:"var(--text-secondary)" }}>{pre}</span>
                        <strong style={{ color:"var(--text-primary)" }}>{val}</strong>
                        <i className="ti ti-chevron-down" style={{ fontSize:11, color:"var(--text-tertiary)" }} aria-hidden="true"/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Units list */}
                <div style={{ paddingBottom:24 }}>
                  {UNITS.map(unit=>{
                    const prog  = PROGRESS[unit.n] || {actsDone:0,testDone:0,score:0};
                    const isDone = prog.actsDone===unit.acts && prog.testDone===unit.testActs;
                    const isActive = unit.n === activeUnit;
                    const isLocked = unit.n > activeUnit;
                    return (
                      <UnitRow key={unit.n} unit={unit} prog={prog}
                        isActive={isActive} isDone={isDone} isLocked={isLocked}
                        onClick={()=>setSelUnit(selUnit===unit.n?null:unit.n)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── CLASES EN VIVO ── */}
          {view==="clases" && (
            <div style={{ padding:24 }}>
              <div style={{ background:`linear-gradient(135deg,${P},${PH})`, borderRadius:16, padding:24, marginBottom:20, color:"#fff" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginBottom:4 }}>Próxima clase en vivo</div>
                <div style={{ fontSize:22, fontWeight:800, marginBottom:4 }}>Lunes 16 Jun · 6:00 PM</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.7)", marginBottom:18 }}>Docente: {STUDENT.teacher} · U{STUDENT.unit}: {STUDENT.unitTitle}</div>
                <a href={STUDENT.teamsLink} style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px", background:Y, color:PH, borderRadius:10, textDecoration:"none", fontSize:13, fontWeight:700 }}>
                  <i className="ti ti-video" style={{ fontSize:15 }} aria-hidden="true"/> Unirme en Microsoft Teams
                </a>
              </div>

              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Grabaciones disponibles</div>
                {[
                  { title:`U${STUDENT.unit-1}: ${UNITS[activeUnit-2]?.title||"Prev"}`, date:"Vie 13 Jun · 6:00 PM", available:true  },
                  { title:`U${STUDENT.unit-1}: Repaso`,                                date:"Mié 11 Jun · 6:00 PM", available:true  },
                  { title:`U${STUDENT.unit-2}: ${UNITS[activeUnit-3]?.title||""}`,     date:"Vie 6 Jun · 6:00 PM",  available:false },
                ].map((r,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 20px", borderBottom:"1px solid var(--border)", opacity:r.available?1:.4 }}>
                    <div style={{ width:40, height:40, borderRadius:9, background:r.available?PD:"var(--bg-surface-subtle)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className="ti ti-video" style={{ fontSize:18, color:r.available?P:"var(--text-tertiary)" }} aria-hidden="true"/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500, color:"var(--text-primary)" }}>{r.title}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{r.date}</div>
                    </div>
                    {r.available
                      ? <button style={{ fontSize:12, padding:"7px 14px", background:P, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>▶ Ver</button>
                      : <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>Expirada</span>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, padding:"10px 14px", background:YD, border:`1px solid ${Y}40`, borderRadius:9, fontSize:12, color:A, display:"flex", gap:7 }}>
                <i className="ti ti-info-circle" style={{ fontSize:13 }} aria-hidden="true"/>
                Las grabaciones están disponibles por <strong>7 días</strong> después de cada clase.
              </div>
            </div>
          )}

          {/* ── EXAMEN ── */}
          {view==="examen" && (
            <div style={{ padding:24, maxWidth:680 }}>
              <div style={{ background:"var(--bg-surface)", border:`1.5px solid ${Y}50`, borderRadius:16, padding:24, marginBottom:16, boxShadow:"var(--shadow-sm)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>Examen de unidad activa</div>
                    <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>U{STUDENT.unit}: {STUDENT.unitTitle}</div>
                    <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4 }}>Nivel {STUDENT.level} · Programa Inglés completo</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:28, fontWeight:800, color:G }}>{STUDENT.examScore}%</div>
                    <div style={{ fontSize:11, color:"var(--text-secondary)" }}>último intento</div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
                  {[["Intentos usados",`${STUDENT.examAttempts}/3`,A],["Para aprobar","≥ 70%",G],["Temporizador","30 min",P]].map(([l,v,c],i)=>(
                    <div key={i} style={{ background:"var(--bg-surface-subtle)", borderRadius:9, padding:"10px 12px" }}>
                      <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:GD, border:`1px solid ${G}40`, borderRadius:9, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#065f46", display:"flex", gap:7 }}>
                  <i className="ti ti-check" style={{ fontSize:13 }} aria-hidden="true"/>
                  ¡Aprobaste con {STUDENT.examScore}%! La U{STUDENT.unit+1} está desbloqueada. Podés intentar mejorar tu puntaje.
                </div>
                <button style={{ width:"100%", padding:"13px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Hacer examen — Intento {STUDENT.examAttempts+1}/3
                </button>
              </div>

              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"13px 18px", borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:700, color:"var(--text-primary)" }}>Historial de intentos</div>
                {[{n:1,score:STUDENT.examScore,date:"Hace 3 días",passed:true}].map((h,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 18px" }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:GD, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:G }}>#{h.n}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:"var(--text-primary)" }}>Intento {h.n}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{h.date}</div>
                    </div>
                    <div style={{ fontSize:20, fontWeight:800, color:G }}>{h.score}%</div>
                    <div style={{ fontSize:10, padding:"3px 10px", background:GD, color:G, borderRadius:20, fontWeight:600 }}>✓ Aprobado</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MI PROGRESO ── */}
          {view==="progreso" && (
            <div style={{ padding:24 }}>
              {/* Level journey */}
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, marginBottom:16, boxShadow:"var(--shadow-sm)" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>Tu camino A1 → C1</div>
                <div style={{ display:"flex", alignItems:"center", gap:0 }}>
                  {[["A1","Básico",true,true],["A2","Elemental",true,true],["B1","Intermedio",true,false],["B2","Avanzado",false,false],["C1","Superior",false,false]].map(([l,n,done,passed],i)=>(
                    <div key={l} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
                      {i<4 && <div style={{ position:"absolute", left:"50%", top:19, right:"-50%", height:3, background:done&&passed?G:done?Y:"var(--bg-surface-subtle)", zIndex:0 }}/>}
                      <div style={{ width:40, height:40, borderRadius:"50%", background:done&&passed?G:done?P:"var(--bg-surface-subtle)", border:`3px solid ${done&&passed?G:done?Y:"var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1, fontSize:12, fontWeight:700, color:done?"#fff":"var(--text-tertiary)" }}>
                        {done&&passed?"✓":l}
                      </div>
                      <div style={{ fontSize:11, fontWeight:600, color:done?"var(--text-primary)":"var(--text-tertiary)", marginTop:6 }}>{l}</div>
                      <div style={{ fontSize:9, color:"var(--text-tertiary)" }}>{n}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* XP + badges */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:14 }}>XP & Rango</div>
                  <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:12 }}>
                    <div style={{ fontSize:36, fontWeight:800, color:Y }}>{STUDENT.xp.toLocaleString()}</div>
                    <div>
                      <div style={{ fontSize:12, color:"var(--text-secondary)" }}>XP total</div>
                      <div style={{ fontSize:11, padding:"3px 10px", background:PD, color:P, borderRadius:20, fontWeight:600, marginTop:3 }}>🥇 {STUDENT.rank}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--text-tertiary)", marginBottom:4 }}>
                    <span>Achiever</span><span>WCA Pro (5000 XP)</span>
                  </div>
                  <div style={{ height:8, background:"var(--bg-surface-subtle)", borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(STUDENT.xp/5000)*100}%`, background:`linear-gradient(90deg,${P},${Y})`, borderRadius:4 }}/>
                  </div>
                  <div style={{ fontSize:10, color:"var(--text-tertiary)", marginTop:4 }}>{5000-STUDENT.xp} XP para WCA Pro</div>
                </div>

                <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18, boxShadow:"var(--shadow-sm)" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:14 }}>Badges</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {[["🎯","Racha 8sem"],["📖","8 unidades"],["💯","Nota perfecta"],["⚡","Quick learner"],["🎓","Nivel A2"],["🎓","Nivel B1"]].map(([e,l],i)=>(
                      <div key={i} style={{ textAlign:"center", padding:"8px 10px", background:"var(--bg-surface-subtle)", borderRadius:9, border:"1px solid var(--border)" }}>
                        <div style={{ fontSize:20 }}>{e}</div>
                        <div style={{ fontSize:9, color:"var(--text-secondary)", marginTop:3, lineHeight:1.3 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Certificate */}
              <div style={{ background:`linear-gradient(135deg,${GD},#f0fdf4)`, border:`1.5px solid ${G}40`, borderRadius:14, padding:20, display:"flex", gap:16, alignItems:"center", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ fontSize:40 }}>🎓</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>Certificado A2 — Completado</div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)" }}>CEFR nivel A2 · Emitido Jun 2025 · Verificable con QR</div>
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  <button style={{ padding:"8px 16px", background:G, color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>↓ Descargar</button>
                  <button style={{ padding:"8px 12px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>LinkedIn</button>
                </div>
              </div>
            </div>
          )}

          {/* ── PAGOS ── */}
          {view==="pagos" && (
            <div style={{ padding:24, maxWidth:600 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, marginBottom:14, boxShadow:"var(--shadow-sm)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Suscripción activa</div>
                    <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>Inglés completo · Mensual</div>
                  </div>
                  <div style={{ fontSize:11, padding:"3px 10px", background:GD, color:"#065f46", borderRadius:20, fontWeight:600, height:"fit-content" }}>Activa</div>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <div style={{ flex:1, background:"var(--bg-surface-subtle)", borderRadius:9, padding:"10px 12px" }}>
                    <div style={{ fontSize:24, fontWeight:800, color:P }}>$95</div>
                    <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>por mes</div>
                  </div>
                  <div style={{ flex:1, background:"var(--bg-surface-subtle)", borderRadius:9, padding:"10px 12px" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>16 Jul</div>
                    <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>próxima renovación</div>
                  </div>
                </div>
              </div>

              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"13px 18px", borderBottom:"1px solid var(--border)", fontSize:12, fontWeight:700, color:"var(--text-primary)" }}>Historial de pagos</div>
                {[["16 Jun 2025","$95","Stripe ···4242"],["16 May 2025","$95","Stripe ···4242"],["16 Abr 2025","$95","Transferencia BAC"]].map(([d,a,m],i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 18px", borderBottom:"1px solid var(--border)" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:"var(--text-primary)", fontWeight:500 }}>{d}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{m}</div>
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{a}</div>
                    <div style={{ fontSize:10, padding:"3px 9px", background:GD, color:G, borderRadius:20, fontWeight:600 }}>✓</div>
                    <button style={{ fontSize:11, padding:"5px 10px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"1px solid var(--border)", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Recibo</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
