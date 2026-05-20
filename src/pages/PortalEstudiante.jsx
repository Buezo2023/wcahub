import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LEVELS, UNITS, SKILLS_BY_LEVEL } from "../data/englishContent.js";

const P="#155266",PH="#0f3d4d",PD="#e8f3f6";
const Y="#ffbb23",YD="#fff8e6";
const G="#059669",GD="#ecfdf5";
const R="#dc2626",RD="#fef2f2";
const A="#d97706",AD="#fffbeb";

// ─── PROGRAMS CATALOG ────────────────────────────────────────────
const ALL_PROGRAMS = [
  {
    id:"en", code:"EN", name:"Inglés Completo", shortName:"Inglés",
    icon:"🇬🇧", color:P, colorLight:PD, price:95, interval:"mes",
    desc:"Marco CEFR A1–C1 con metodología Wide Angle Oxford. Clases en vivo 3x por semana + práctica 24/7.",
    levels:"A1 · A2 · B1 · B2 · C1", units:12, prereq:null,
    skills:["Listening","Reading","Speaking","Pronunciation","Writing","Vocabulary","Grammar","English For Real"],
    badge:"Inglés", tag:null,
  },
  {
    id:"va", code:"VA", name:"Asistente Virtual General", shortName:"VA General",
    icon:"💻", color:"#7c3aed", colorLight:"#ede9fe", price:75, interval:"mes",
    desc:"Formación completa como Asistente Virtual bilingüe. Herramientas digitales, comunicación profesional y gestión remota.",
    levels:"Módulos 1–4", units:12, prereq:null,
    skills:["Comunicación escrita","Herramientas digitales","Gestión de tareas","Inglés profesional","Atención al cliente","Productividad remota"],
    badge:"VA General", tag:"Más popular",
  },
  {
    id:"va_mkt", code:"VA-MKT", name:"VA · Marketing Digital", shortName:"Marketing Digital",
    icon:"📱", color:"#db2777", colorLight:"#fce7f3", price:95, interval:"3 meses",
    desc:"Especialización en marketing digital: redes sociales, copywriting, email marketing y analítica web.",
    levels:"12 unidades · 3 meses", units:12, prereq:"va",
    skills:["Social Media","Copywriting","Email Marketing","SEO básico","Analítica","Diseño Canva"],
    badge:"Especialización", tag:"Nuevo",
  },
  {
    id:"va_legal", code:"VA-LGL", name:"VA · Legal Assistant", shortName:"Legal Assistant",
    icon:"⚖️", color:"#0e7490", colorLight:"#cffafe", price:95, interval:"3 meses",
    desc:"Asistencia legal remota: manejo de documentos, investigación jurídica, comunicación con clientes y agenda legal.",
    levels:"12 unidades · 3 meses", units:12, prereq:"va",
    skills:["Documentos legales","Investigación jurídica","Agenda legal","Inglés legal","Confidencialidad","CRM Legal"],
    badge:"Especialización", tag:null,
  },
  {
    id:"va_care", code:"VA-CRE", name:"VA · Cuidador Remoto", shortName:"Cuidador Remoto",
    icon:"🏥", color:"#059669", colorLight:"#ecfdf5", price:95, interval:"3 meses",
    desc:"Asistencia remota para pacientes y familias: coordinación de citas, comunicación con médicos, manejo de registros.",
    levels:"12 unidades · 3 meses", units:12, prereq:"va",
    skills:["Terminología médica","Coordinación de citas","Registros médicos","Inglés clínico","Empatía virtual","HIPAA básico"],
    badge:"Especialización", tag:null,
  },
];

// ─── THIS STUDENT'S ENROLLMENTS ──────────────────────────────────
// María está inscrita en Inglés (activo, B1) + VA General (activo, U6)
// VA completado → puede hacer especializaciones
const ENROLLMENTS = {
  en: {
    active:true, level:"B1", unit:9, unitTitle:"Future",
    examScore:85, streak:8, xp:3540,
    completedUnits:8, cycleProgress:Math.round(8/12*100),
    nextClass:"Lunes 16 Jun · 6:00 PM", teacher:"Ana Torres",
    teamsLink:"#",
  },
  va: {
    active:true, level:"VA General", unit:6, unitTitle:"Gestión de proyectos",
    examScore:91, streak:5, xp:1820,
    completedUnits:5, cycleProgress:Math.round(5/12*100),
    nextClass:"Martes 17 Jun · 7:00 PM", teacher:"Laura Mendoza",
    teamsLink:"#",
  },
};

const COMPLETED_PREREQS = { va:true }; // VA General completado → puede hacer especializaciones

// ─── UNITS per program ────────────────────────────────────────────
// PROGRAM_UNITS uses imported UNITS data
const PROGRAM_UNITS = {
  en: Object.fromEntries(["A1","A2","B1","B2","C1"].map(l => [l, UNITS[l]])),
  va:[
    {n:1,t:"Introducción al VA"},{n:2,t:"Comunicación escrita"},{n:3,t:"Herramientas digitales"},
    {n:4,t:"Inglés profesional"},{n:5,t:"Gestión de clientes"},{n:6,t:"Gestión de proyectos"},
    {n:7,t:"Email & Calendar"},{n:8,t:"Reuniones virtuales"},{n:9,t:"Reportes & Datos"},
    {n:10,t:"Redes sociales básico"},{n:11,t:"Inglés avanzado VA"},{n:12,t:"Proyecto final"},
  ],
  va_mkt:[
    {n:1,t:"Fundamentos marketing"},{n:2,t:"Social Media strategy"},{n:3,t:"Copywriting"},
    {n:4,t:"Email marketing"},{n:5,t:"SEO básico"},{n:6,t:"Publicidad digital"},
    {n:7,t:"Contenido visual"},{n:8,t:"Analítica web"},{n:9,t:"Community management"},
    {n:10,t:"Campañas integrales"},{n:11,t:"Inglés marketing"},{n:12,t:"Portafolio final"},
  ],
};

const SKILLS = {
  en:[{name:"Listening",total:48,done:32,score:89,color:"#6b21a8"},{name:"Reading",total:23,done:17,score:85,color:"#4d7c0f"},{name:"Speaking",total:12,done:8,score:82,color:"#be185d"},{name:"Pronunciation",total:12,done:8,score:78,color:"#c2410c"},{name:"English For Real",total:36,done:24,score:91,color:"#0e7490"},{name:"Writing",total:12,done:8,score:80,color:"#b91c1c"},{name:"Vocabulary",total:53,done:36,score:87,color:"#166534"},{name:"Grammar",total:60,done:40,score:84,color:"#1e40af"}],
  va:[{name:"Comunicación",total:24,done:14,score:92,color:"#7c3aed"},{name:"Herramientas",total:18,done:10,score:88,color:"#0e7490"},{name:"Inglés profesional",total:20,done:12,score:85,color:"#166534"},{name:"Productividad",total:16,done:9,score:90,color:"#c2410c"},{name:"Clientes",total:14,done:7,score:87,color:"#be185d"},{name:"Proyectos",total:12,done:5,score:83,color:"#1e40af"}],
};

const PROG_PROGRESS = (id)=>{
  const en = ENROLLMENTS[id];
  if(!en) return {};
  const p = {};
  for(let i=1;i<=12;i++){
    if(i<en.unit) p[i]={actsDone:20,testDone:3,score:85+Math.floor(Math.random()*10)};
    else if(i===en.unit) p[i]={actsDone:Math.floor(en.unit*0.6),testDone:0,score:0};
    else p[i]={actsDone:0,testDone:0,score:0};
  }
  return p;
};

const NAV=[
  {id:"inicio",  icon:"ti-layout-dashboard",label:"Inicio"},
  {id:"practica",icon:"ti-device-laptop",   label:"Práctica 24/7"},
  {id:"clases",  icon:"ti-video",           label:"Clases en vivo"},
  {id:"examen",  icon:"ti-writing",         label:"Examen"},
  {id:"progreso",icon:"ti-certificate",     label:"Mi progreso"},
  {id:"pagos",   icon:"ti-credit-card",     label:"Pagos"},
];

// ─── UI helpers ───────────────────────────────────────────────────
function Ring({pct,size=36,stroke=3,color=Y,bg="#e5e7eb"}){
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, dash=(pct/100)*circ;
  return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
      strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
      transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray 1s ease"}}/>
  </svg>);
}
function Badge({text,bg="#f1f5f9",color="#475569"}){
  return <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:bg,color,fontWeight:600,whiteSpace:"nowrap"}}>{text}</span>;
}
function ProgTag({prog}){
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:prog.colorLight,border:`1px solid ${prog.color}30`}}>
      <span style={{fontSize:12}}>{prog.icon}</span>
      <span style={{fontSize:11,fontWeight:600,color:prog.color}}>{prog.shortName}</span>
    </div>
  );
}

// ─── Program selector pill ────────────────────────────────────────
function ProgramPill({prog,active,onClick}){
  return(
    <button onClick={onClick} style={{
      display:"flex",alignItems:"center",gap:7,padding:"8px 16px",
      background:active?prog.color:"var(--bg-surface)",
      color:active?"#fff":"var(--text-secondary)",
      border:`1.5px solid ${active?prog.color:"var(--border)"}`,
      borderRadius:30,fontSize:12,fontWeight:active?700:400,
      cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
    }}>
      <span style={{fontSize:14}}>{prog.icon}</span>
      {prog.shortName}
    </button>
  );
}

// ─── Skill card ───────────────────────────────────────────────────
function SkillCard({skill}){
  const pct=Math.round((skill.done/skill.total)*100);
  return(
    <div style={{background:skill.color,borderRadius:12,padding:"14px 12px",position:"relative",overflow:"hidden"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:6}}>{skill.name}</div>
      <div style={{fontSize:10,color:"rgba(255,255,255,.65)",marginBottom:1}}>Scores</div>
      <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:10}}>{skill.score}%</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.65)",marginBottom:1}}>Activities done</div>
          <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{skill.done}/{skill.total}</div>
        </div>
        <Ring pct={pct} size={40} stroke={3} color="rgba(255,255,255,.9)" bg="rgba(255,255,255,.25)"/>
      </div>
    </div>
  );
}

// ─── Unit row (Online Practice style) ────────────────────────────
function UnitRow({unit,prog,isActive,isDone,isLocked,color}){
  const [expanded, setExpanded] = useState(false);
  // unit may come from UNITS (rich) or legacy {n,t} format
  const isRich = unit && unit.grammar;
  const actsPct=unit.acts>0?Math.round((prog.actsDone/unit.acts)*100):0;
  const testPct=prog.testDone>0?Math.round((prog.testDone/3)*100):0;
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:16,padding:"13px 18px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:10,marginBottom:5,cursor:isLocked?"not-allowed":"pointer",opacity:isLocked?.45:1,boxShadow:"var(--shadow-sm)",transition:"all .15s"}}
        onMouseEnter={e=>{if(!isLocked)e.currentTarget.style.borderColor=color;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:isDone?G:isActive?Y:"#d4b483",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{unit.n}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:isActive?700:500,color:isLocked?"var(--text-tertiary)":"var(--text-primary)"}}>
            Unit {unit.n} — {title}
            {isActive&&<span style={{marginLeft:8,fontSize:10,background:Y,color:PH,padding:"2px 8px",borderRadius:20,fontWeight:700}}>ACTIVA</span>}
            {isLocked&&<span style={{marginLeft:6,fontSize:10,color:"var(--text-tertiary)"}}>🔒</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,minWidth:130,justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"var(--text-secondary)"}}>{prog.actsDone}/{unit.acts}</div>
            <div style={{fontSize:10,color:"var(--text-tertiary)"}}>Activities done</div>
          </div>
          <Ring pct={actsPct} size={34} stroke={3} color={isDone?G:isActive?Y:"#d1d5db"}/>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:isDone?G:prog.score>0?A:"var(--text-tertiary)",minWidth:38,textAlign:"right"}}>
          {prog.score>0?`${prog.score}%`:"0%"}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:16,padding:"10px 18px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:10,marginBottom:10,cursor:isLocked?"not-allowed":"pointer",opacity:isLocked||(!isDone&&!isActive)?.35:1,boxShadow:"var(--shadow-sm)"}}
        onMouseEnter={e=>{if(!isLocked)e.currentTarget.style.borderColor=color;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:isDone?G:isActive?Y:"#d4b483",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{unit.n}</div>
        <div style={{flex:1,fontSize:13,color:isLocked||(!isDone&&!isActive)?"var(--text-tertiary)":"var(--text-primary)"}}>
          Unit {unit.n} Test
          {isDone&&prog.testDone===3&&<span style={{marginLeft:8,fontSize:10,background:GD,color:G,padding:"2px 8px",borderRadius:20,fontWeight:700}}>✓</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,minWidth:130,justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"var(--text-secondary)"}}>{prog.testDone}/3</div>
            <div style={{fontSize:10,color:"var(--text-tertiary)"}}>Activities done</div>
          </div>
          <Ring pct={testPct} size={34} stroke={3} color={prog.testDone===3?G:color}/>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:prog.testDone>0?G:"var(--text-tertiary)",minWidth:38,textAlign:"right"}}>
          {prog.testDone>0?`${Math.round((prog.testDone/3)*100)}%`:"0%"}
        </div>
      </div>
    </div>
  );
}

// ─── Upsell banner ───────────────────────────────────────────────
function UpsellBanner({prog,canEnroll,onEnroll}){
  return(
    <div style={{background:"var(--bg-surface)",border:`1.5px solid ${prog.color}30`,borderRadius:16,padding:20,display:"flex",gap:16,alignItems:"flex-start",boxShadow:"var(--shadow-sm)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,right:0,width:100,height:100,background:`${prog.color}08`,borderRadius:"0 16px 0 100%"}}/>
      <div style={{width:52,height:52,borderRadius:14,background:prog.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{prog.icon}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{prog.name}</div>
          {prog.tag&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:prog.color,color:"#fff",fontWeight:700}}>{prog.tag}</span>}
        </div>
        <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:10}}>{prog.desc}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {prog.skills.slice(0,4).map(s=><span key={s} style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:prog.colorLight,color:prog.color,fontWeight:500}}>{s}</span>)}
          {prog.skills.length>4&&<span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:"var(--bg-surface-subtle)",color:"var(--text-tertiary)"}}>+{prog.skills.length-4} más</span>}
        </div>
        {prog.prereq&&!canEnroll&&(
          <div style={{fontSize:11,color:A,background:AD,padding:"6px 12px",borderRadius:8,marginBottom:10,display:"flex",gap:6}}>
            <i className="ti ti-lock" style={{fontSize:12}} aria-hidden="true"/>
            Requiere completar <strong>VA General</strong> primero
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><span style={{fontSize:22,fontWeight:800,color:prog.color}}>${prog.price}</span><span style={{fontSize:12,color:"var(--text-secondary)"}}>/{prog.interval}</span></div>
          <button onClick={onEnroll} disabled={!!prog.prereq&&!canEnroll} style={{padding:"9px 20px",background:prog.prereq&&!canEnroll?"var(--bg-surface-subtle)":prog.color,color:prog.prereq&&!canEnroll?"var(--text-tertiary)":"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:prog.prereq&&!canEnroll?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .15s"}}>
            {prog.prereq&&!canEnroll?"Bloqueado 🔒":"Inscribirse →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function PortalEstudiante(){
  const navigate = useNavigate();
  const [view,       setView]       = useState("inicio");
  const [activeProg, setActiveProg] = useState("en"); // current program in practice/exam
  const [enrolled,   setEnrolled]   = useState(Object.keys(ENROLLMENTS));
  const [showEnrollSuccess, setEnrollSuccess] = useState(null);

  const enrolledProgs = ALL_PROGRAMS.filter(p=>enrolled.includes(p.id));
  const unenrolledProgs = ALL_PROGRAMS.filter(p=>!enrolled.includes(p.id));
  const prog = ALL_PROGRAMS.find(p=>p.id===activeProg) || enrolledProgs[0];
  const enrollment = ENROLLMENTS[activeProg] || ENROLLMENTS[enrolled[0]];
  const skills = activeProg === "en"
    ? (SKILLS_BY_LEVEL[currentLevel] || SKILLS_BY_LEVEL["B1"] || [])
    : (SKILLS[activeProg] || SKILLS[enrolled[0]] || []);
  // For the English program, use the student's current level to get units
  const currentLevel = enrollment?.level || "B1";
  const unitSource = activeProg === "en"
    ? (UNITS[currentLevel] || UNITS["B1"] || [])
    : (PROGRAM_UNITS[activeProg] || []);
  const units = unitSource;
  const progress = PROG_PROGRESS(activeProg);
  const totalActs = (skills||[]).reduce((a,s)=>a+s.total,0);
  const totalDone = (skills||[]).reduce((a,s)=>a+(s.done||0),0);
  const avgScore  = skills.length>0?Math.round(skills.reduce((a,s)=>a+(s.score||0),0)/skills.length):0;

  function handleEnroll(progId){
    setEnrolled(e=>[...e,progId]);
    setEnrollSuccess(progId);
    setTimeout(()=>setEnrollSuccess(null),4000);
  }

  return(
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg-page)",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>

      {/* SIDEBAR */}
      <aside style={{width:200,background:P,display:"flex",flexDirection:"column",padding:"0 0 16px",flexShrink:0,minHeight:"100vh",position:"sticky",top:0}}>
        <div style={{padding:"22px 18px 18px",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:8}}>
          <div style={{fontSize:17,fontWeight:800,color:"#fff"}}>WCA <span style={{color:Y}}>Hub</span></div>
          <div style={{fontSize:9,color:"rgba(255,255,255,.35)",marginTop:2,textTransform:"uppercase",letterSpacing:1}}>Portal del estudiante</div>
        </div>

        {/* Enrolled programs in sidebar */}
        <div style={{padding:"8px 12px",marginBottom:4}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Mis programas</div>
          {enrolledProgs.map(p=>(
            <button key={p.id} onClick={()=>{setActiveProg(p.id);setView("practica");}} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"8px 9px",border:"none",background:activeProg===p.id?"rgba(255,255,255,.15)":"rgba(255,255,255,.05)",color:activeProg===p.id?"#fff":"rgba(255,255,255,.55)",borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontSize:11,marginBottom:4,textAlign:"left",fontWeight:activeProg===p.id?600:400,borderLeft:`2px solid ${activeProg===p.id?Y:"transparent"}`,transition:"all .15s"}}>
              <span style={{fontSize:14}}>{p.icon}</span>
              <span style={{flex:1}}>{p.shortName}</span>
              {activeProg===p.id&&<div style={{width:6,height:6,borderRadius:"50%",background:Y,flexShrink:0}}/>}
            </button>
          ))}
        </div>

        <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"4px 12px 8px"}}/>

        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",border:"none",background:view===n.id?"rgba(255,255,255,.12)":"transparent",color:view===n.id?"#fff":"rgba(255,255,255,.45)",fontSize:12,cursor:"pointer",textAlign:"left",borderLeft:`2px solid ${view===n.id?Y:"transparent"}`,transition:"all .15s",fontFamily:"inherit",fontWeight:view===n.id?600:400,width:"100%"}}>
            <i className={"ti "+n.icon} style={{fontSize:14,width:18,textAlign:"center"}} aria-hidden="true"/>
            {n.label}
          </button>
        ))}

        <div style={{marginTop:"auto",padding:"14px 18px 0",borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:Y,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:PH}}>MR</div>
            <div><div style={{fontSize:12,color:"#fff",fontWeight:600}}>María Rodríguez</div><div style={{fontSize:10,color:"rgba(255,255,255,.35)"}}>{enrolled.length} programa{enrolled.length!==1?"s":""} activo{enrolled.length!==1?"s":""}</div></div>
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
      <main style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        {/* Topbar */}
        <div style={{height:60,background:"var(--bg-surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>
            {{"inicio":"Inicio","practica":"Práctica 24/7","clases":"Clases en vivo","examen":"Examen","progreso":"Mi progreso","pagos":"Pagos"}[view]}
          </div>
          <div style={{display:"flex",gap:8}}>
            {enrolledProgs.map(p=><ProgTag key={p.id} prog={p}/>)}
          </div>
        </div>

        {/* Enroll success toast */}
        {showEnrollSuccess&&(
          <div style={{position:"fixed",top:20,right:90,background:G,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9998,boxShadow:"0 8px 24px rgba(5,150,105,.3)",display:"flex",alignItems:"center",gap:8,animation:"slideIn .3s ease"}}>
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}`}</style>
            <i className="ti ti-check" style={{fontSize:16}} aria-hidden="true"/>
            ¡Inscripción confirmada en {ALL_PROGRAMS.find(p=>p.id===showEnrollSuccess)?.name}!
          </div>
        )}

        <div style={{flex:1,overflowY:"auto"}}>

          {/* ── INICIO ── */}
          {view==="inicio"&&(
            <div style={{padding:24}}>

              {/* Welcome */}
              <div style={{background:`linear-gradient(135deg,${P},${PH})`,borderRadius:16,padding:"22px 28px",marginBottom:20,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-30,top:-30,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
                <div style={{fontSize:11,color:"rgba(255,255,255,.5)",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Bienvenida de vuelta</div>
                <div style={{fontSize:24,fontWeight:800,color:"#fff",marginBottom:6}}>¡Hola, María! 👋</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.7)",lineHeight:1.6,marginBottom:16}}>
                  Estás inscrita en <strong style={{color:Y}}>{enrolled.length} programas</strong>. Selecciona uno para continuar practicando.
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {enrolledProgs.map(p=>(
                    <button key={p.id} onClick={()=>{setActiveProg(p.id);setView("practica");}} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.25)",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.25)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.15)";}}>
                      <span style={{fontSize:16}}>{p.icon}</span> {p.shortName} →
                    </button>
                  ))}
                </div>
              </div>

              {/* Active programs dashboard */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>📚 Mis programas activos</div>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(enrolledProgs.length,3)},1fr)`,gap:12}}>
                  {enrolledProgs.map(p=>{
                    const en=ENROLLMENTS[p.id];
                    if(!en) return null;
                    return(
                      <div key={p.id} onClick={()=>{setActiveProg(p.id);setView("practica");}} style={{background:"var(--bg-surface)",border:`1.5px solid ${p.color}40`,borderRadius:16,padding:18,cursor:"pointer",boxShadow:"var(--shadow-sm)",transition:"all .2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 6px 20px ${p.color}25`;e.currentTarget.style.transform="translateY(-2px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--shadow-sm)";e.currentTarget.style.transform="none";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <div style={{width:42,height:42,borderRadius:11,background:p.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.icon}</div>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{p.shortName}</div>
                              <div style={{fontSize:11,color:"var(--text-secondary)"}}>U{en.unit}: {en.unitTitle}</div>
                            </div>
                          </div>
                          <Ring pct={en.cycleProgress} size={44} stroke={4} color={p.color} bg={p.colorLight}/>
                        </div>
                        <div style={{display:"flex",gap:3,marginBottom:8}}>
                          {Array.from({length:12},(_,i)=>(
                            <div key={i} style={{flex:1,height:5,borderRadius:3,background:i+1<en.unit?p.color:i+1===en.unit?Y:"var(--bg-surface-subtle)"}}/>
                          ))}
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-secondary)"}}>
                          <span>U{en.unit}/12 · {en.cycleProgress}% completado</span>
                          <span style={{color:p.color,fontWeight:600}}>Continuar →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upsell banners — programas no inscritos */}
              {unenrolledProgs.length>0&&(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <div style={{flex:1,height:1,background:"var(--border)"}}/>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",padding:"0 10px",whiteSpace:"nowrap"}}>🚀 Amplía tu perfil profesional</div>
                    <div style={{flex:1,height:1,background:"var(--border)"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
                    {unenrolledProgs.map(p=>(
                      <UpsellBanner key={p.id} prog={p}
                        canEnroll={!p.prereq||COMPLETED_PREREQS[p.prereq]||enrolled.includes(p.prereq)}
                        onEnroll={()=>handleEnroll(p.id)}/>
                    ))}
                  </div>
                </div>
              )}

              {/* All enrolled → show completion message */}
              {unenrolledProgs.length===0&&(
                <div style={{background:GD,border:`1px solid ${G}40`,borderRadius:14,padding:20,textAlign:"center"}}>
                  <div style={{fontSize:32,marginBottom:8}}>🏆</div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>¡Estás inscrita en todos los programas!</div>
                  <div style={{fontSize:13,color:"var(--text-secondary)"}}>Sigue practicando para completar cada uno.</div>
                </div>
              )}
            </div>
          )}

          {/* ── PRÁCTICA 24/7 ── */}
          {view==="practica"&&(
            <div>
              {/* Program selector */}
              <div style={{padding:"16px 24px",background:"var(--bg-surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:12,color:"var(--text-secondary)",marginRight:4}}>Programa:</div>
                {enrolledProgs.map(p=><ProgramPill key={p.id} prog={p} active={activeProg===p.id} onClick={()=>setActiveProg(p.id)}/>)}
              </div>

              {/* Wide Angle / Program header bar */}
              <div style={{background:prog?.color||Y,padding:"14px 24px",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:40,height:40,borderRadius:8,background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{prog?.icon}</div>
                <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{prog?.name}</div>
                {enrollment&&<div style={{marginLeft:"auto",fontSize:12,color:"rgba(255,255,255,.7)"}}>U{enrollment.unit}/12 · {enrollment.cycleProgress}% completado</div>}
              </div>

              {/* Overall Scores */}
              <div style={{background:"var(--bg-surface)",borderBottom:"1px solid var(--border)",padding:"20px 24px 24px"}}>
                <div style={{textAlign:"center",marginBottom:18}}>
                  <div style={{width:46,height:46,background:"var(--bg-surface-subtle)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px"}}>
                    <i className="ti ti-chart-bar" style={{fontSize:22,color:"var(--text-primary)"}} aria-hidden="true"/>
                  </div>
                  <div style={{fontSize:17,fontWeight:700,color:"var(--text-primary)"}}>Overall scores</div>
                  <div style={{height:1,background:"var(--border)",marginTop:12}}/>
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:48,marginBottom:22}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div>
                      <div style={{fontSize:20,fontWeight:800,color:"var(--text-primary)"}}><span style={{color:prog?.color||P}}>{totalDone}</span>/{totalActs}</div>
                      <div style={{fontSize:12,color:"var(--text-secondary)"}}>Activities done</div>
                    </div>
                    <Ring pct={totalActs>0?Math.round(totalDone/totalActs*100):0} size={44} stroke={4} color={prog?.color||P}/>
                  </div>
                  <div style={{borderLeft:"1px solid var(--border)",paddingLeft:48}}>
                    <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:3}}>Scores</div>
                    <div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)"}}>{avgScore}%</div>
                  </div>
                  <div style={{borderLeft:"1px solid var(--border)",paddingLeft:48,display:"flex",alignItems:"center",gap:10}}>
                    <i className="ti ti-clock" style={{fontSize:20,color:"var(--text-secondary)"}} aria-hidden="true"/>
                    <div>
                      <div style={{fontSize:11,color:"var(--text-secondary)"}}>Time on activities</div>
                      <div style={{fontSize:18,fontWeight:700,color:"var(--text-primary)"}}>{activeProg==="en"?347:156}<span style={{fontSize:12,fontWeight:400}}>mins</span></div>
                    </div>
                  </div>
                </div>
                {/* Skill cards */}
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(skills.length,4)},1fr)`,gap:10}}>
                  {skills.map(s=><SkillCard key={s.name} skill={s}/>)}
                </div>
              </div>

              {/* Units list */}
              <div style={{padding:"18px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,paddingBottom:12,borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--text-secondary)",flex:1,textAlign:"center"}}>Online Practice</div>
                  <div style={{display:"flex",gap:8}}>
                    {[["Submit","Time off"],["Show","Last attempt"],["Scores","%"]].map(([pre,val],i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",fontSize:12}}>
                        <span style={{color:"var(--text-secondary)"}}>{pre}</span>
                        <strong style={{color:"var(--text-primary)"}}>{val}</strong>
                        <i className="ti ti-chevron-down" style={{fontSize:11,color:"var(--text-tertiary)"}} aria-hidden="true"/>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{paddingBottom:24}}>
                  {units.map(unit=>{
                    const en2=enrollment;
                    const prog2=progress[unit.n]||{actsDone:0,testDone:0,score:0};
                    const isDone=unit.n<(en2?.unit||1)&&prog2.actsDone>0;
                    const isActive=unit.n===(en2?.unit||1);
                    const isLocked=unit.n>(en2?.unit||1);
                    return(
                      <UnitRow key={unit.n}
                        unit={{
                          ...unit,
                          title: unit.title || unit.t || "",
                          acts: unit.activities || (unit.n===en2?.unit?prog2.actsDone+13:20)
                        }}
                        prog={prog2}
                        isActive={isActive} isDone={isDone} isLocked={isLocked}
                        color={prog?.color||P}/>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── CLASES ── */}
          {view==="clases"&&(
            <div style={{padding:24}}>
              {/* Program selector */}
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {enrolledProgs.map(p=><ProgramPill key={p.id} prog={p} active={activeProg===p.id} onClick={()=>setActiveProg(p.id)}/>)}
              </div>
              <div style={{background:`linear-gradient(135deg,${prog?.color||P},${PH})`,borderRadius:16,padding:24,marginBottom:20,color:"#fff"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginBottom:4}}>Próxima clase en vivo · {prog?.shortName}</div>
                <div style={{fontSize:22,fontWeight:800,marginBottom:4}}>{enrollment?.nextClass}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:18}}>Docente: {enrollment?.teacher} · U{enrollment?.unit}: {enrollment?.unitTitle}</div>
                <a href={enrollment?.teamsLink} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 22px",background:Y,color:PH,borderRadius:10,textDecoration:"none",fontSize:13,fontWeight:700}}>
                  <i className="ti ti-video" style={{fontSize:15}} aria-hidden="true"/> Unirme en Microsoft Teams
                </a>
              </div>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
                <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>Grabaciones disponibles</div>
                {[{t:`U${(enrollment?.unit||1)-1}: Clase anterior`,d:"Hace 3 días",ok:true},{t:`U${(enrollment?.unit||1)-1}: Repaso`,d:"Hace 5 días",ok:true},{t:`U${(enrollment?.unit||2)-2}: Clase`,d:"Hace 10 días",ok:false}].map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 18px",borderBottom:"1px solid var(--border)",opacity:r.ok?1:.4}}>
                    <div style={{width:40,height:40,borderRadius:9,background:r.ok?prog?.colorLight||PD:"var(--bg-surface-subtle)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <i className="ti ti-video" style={{fontSize:18,color:r.ok?prog?.color||P:"var(--text-tertiary)"}} aria-hidden="true"/>
                    </div>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"var(--text-primary)"}}>{r.t}</div><div style={{fontSize:11,color:"var(--text-secondary)"}}>{r.d}</div></div>
                    {r.ok?<button style={{fontSize:12,padding:"7px 14px",background:prog?.color||P,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>▶ Ver</button>:<span style={{fontSize:11,color:"var(--text-tertiary)"}}>Expirada</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EXAMEN ── */}
          {view==="examen"&&(
            <div style={{padding:24}}>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {enrolledProgs.map(p=><ProgramPill key={p.id} prog={p} active={activeProg===p.id} onClick={()=>setActiveProg(p.id)}/>)}
              </div>
              <div style={{background:"var(--bg-surface)",border:`1.5px solid ${prog?.color||P}40`,borderRadius:16,padding:24,marginBottom:14,boxShadow:"var(--shadow-sm)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:11,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>Examen · {prog?.shortName}</div>
                    <div style={{fontSize:20,fontWeight:800,color:"var(--text-primary)"}}>U{enrollment?.unit}: {enrollment?.unitTitle}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:28,fontWeight:800,color:G}}>{enrollment?.examScore}%</div>
                    <div style={{fontSize:11,color:"var(--text-secondary)"}}>último intento</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
                  {[["Intentos usados","1/3",A],["Para aprobar","≥ 70%",G],["Temporizador","30 min",prog?.color||P]].map(([l,v,c],i)=>(
                    <div key={i} style={{background:"var(--bg-surface-subtle)",borderRadius:9,padding:"10px 12px"}}>
                      <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:3}}>{l}</div>
                      <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:GD,border:`1px solid ${G}40`,borderRadius:9,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#065f46",display:"flex",gap:7}}>
                  <i className="ti ti-check" style={{fontSize:13}} aria-hidden="true"/>
                  ¡Aprobaste con {enrollment?.examScore}%! Podés intentar mejorar tu puntaje.
                </div>
                <button style={{width:"100%",padding:"13px",background:prog?.color||P,color:"#fff",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Hacer examen — Intento 2/3
                </button>
              </div>
            </div>
          )}

          {/* ── PROGRESO ── */}
          {view==="progreso"&&(
            <div style={{padding:24}}>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${enrolledProgs.length},1fr)`,gap:12,marginBottom:16}}>
                {enrolledProgs.map(p=>{
                  const en2=ENROLLMENTS[p.id];
                  if(!en2) return null;
                  return(
                    <div key={p.id} style={{background:"var(--bg-surface)",border:`1.5px solid ${p.color}40`,borderRadius:14,padding:18,boxShadow:"var(--shadow-sm)"}}>
                      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
                        <div style={{width:42,height:42,borderRadius:11,background:p.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.icon}</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{p.shortName}</div>
                          <div style={{fontSize:11,color:"var(--text-secondary)"}}>{en2.completedUnits}/12 unidades</div>
                        </div>
                        <Ring pct={en2.cycleProgress} size={44} stroke={4} color={p.color} bg={p.colorLight}/>
                      </div>
                      <div style={{display:"flex",gap:3,marginBottom:10}}>
                        {Array.from({length:12},(_,i)=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i+1<en2.unit?p.color:i+1===en2.unit?Y:"var(--bg-surface-subtle)"}}/>)}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div style={{background:"var(--bg-surface-subtle)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:p.color}}>{en2.xp.toLocaleString()}</div>
                          <div style={{fontSize:10,color:"var(--text-tertiary)"}}>XP</div>
                        </div>
                        <div style={{background:"var(--bg-surface-subtle)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:G}}>{en2.examScore}%</div>
                          <div style={{fontSize:10,color:"var(--text-tertiary)"}}>Promedio</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prereq map */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,padding:20,marginBottom:14,boxShadow:"var(--shadow-sm)"}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:16}}>🗺 Ruta de certificaciones WCA</div>
                <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
                  {ALL_PROGRAMS.map((p,i)=>{
                    const isEnrolled=enrolled.includes(p.id);
                    const isCompleted=false;
                    return(
                      <div key={p.id} style={{display:"flex",alignItems:"center"}}>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"0 6px"}}>
                          <div style={{width:50,height:50,borderRadius:"50%",background:isEnrolled?p.color:p.colorLight,border:`2.5px solid ${isEnrolled?p.color:"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                            {p.icon}
                          </div>
                          <div style={{fontSize:10,fontWeight:600,color:isEnrolled?p.color:"var(--text-tertiary)",textAlign:"center",maxWidth:72,lineHeight:1.3}}>{p.shortName}</div>
                          <div style={{fontSize:9,padding:"2px 7px",borderRadius:20,background:isEnrolled?p.colorLight:"var(--bg-surface-subtle)",color:isEnrolled?p.color:"var(--text-tertiary)",fontWeight:600}}>{isEnrolled?"Activo":"Disponible"}</div>
                        </div>
                        {i<ALL_PROGRAMS.length-1&&<div style={{width:24,height:2,background:isEnrolled?"var(--border)":"var(--border)",flexShrink:0}}/>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── PAGOS ── */}
          {view==="pagos"&&(
            <div style={{padding:24,maxWidth:650}}>
              {enrolledProgs.map(p=>{
                const prog2=ALL_PROGRAMS.find(x=>x.id===p.id);
                return(
                  <div key={p.id} style={{background:"var(--bg-surface)",border:`1px solid ${p.color}30`,borderRadius:14,padding:18,marginBottom:12,boxShadow:"var(--shadow-sm)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <span style={{fontSize:22}}>{p.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{p.name}</div>
                        <div style={{fontSize:11,color:"var(--text-secondary)"}}>Mensual · Próxima renovación: 16 Jul</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:22,fontWeight:800,color:p.color}}>${prog2?.price}</div>
                        <div style={{fontSize:10,color:"var(--text-tertiary)"}}>/{prog2?.interval}</div>
                      </div>
                      <div style={{fontSize:10,padding:"3px 10px",background:GD,color:G,borderRadius:20,fontWeight:600}}>Activa</div>
                    </div>
                  </div>
                );
              })}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
                <div style={{padding:"13px 18px",borderBottom:"1px solid var(--border)",fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>Historial de pagos</div>
                {[["16 Jun","Inglés","$95","Stripe ···4242"],["16 Jun","VA General","$75","Stripe ···4242"],["16 May","Inglés","$95","Stripe ···4242"],["16 May","VA General","$75","Transferencia BAC"]].map(([d,prog3,a,m],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 18px",borderBottom:"1px solid var(--border)"}}>
                    <div style={{flex:1}}><div style={{fontSize:13,color:"var(--text-primary)",fontWeight:500}}>{d} · {prog3}</div><div style={{fontSize:11,color:"var(--text-secondary)"}}>{m}</div></div>
                    <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{a}</div>
                    <div style={{fontSize:10,padding:"3px 9px",background:GD,color:G,borderRadius:20,fontWeight:600}}>✓</div>
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
