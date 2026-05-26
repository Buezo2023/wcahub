import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout, useMobile } from "../lib/MobileLayout.jsx";
import { supabase } from "../lib/supabase.js";
import { LMSPlayer } from "../components/lms/LMSPlayer.jsx";
import { notifySelf, Notifs } from "../lib/notify.js";
import { api } from "../lib/api.js";
import { toast } from "../lib/toast.jsx";
import { generateCertificate } from "../lib/certificate.js";
import { StudentReport } from "../lib/StudentReport.jsx";
import { useNotifications } from "../lib/useNotifications.js";
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
    icon:"💻", color:"#7c3aed", colorLight:"#ede9fe", price:95, interval:"mes",
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

// ─── ENROLLMENTS ────────────────────────────────────────────────
// Loaded from Supabase after auth — see loadStudentData()
const COMPLETED_PREREQS = {}; // computed from realEnrollments after load

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
  en:[{name:"Listening",total:48,done:0,score:0,color:"#6b21a8"},{name:"Reading",total:23,done:0,score:0,color:"#4d7c0f"},{name:"Speaking",total:12,done:0,score:0,color:"#be185d"},{name:"Pronunciation",total:12,done:0,score:0,color:"#c2410c"},{name:"English For Real",total:36,done:0,score:0,color:"#0e7490"},{name:"Writing",total:12,done:0,score:0,color:"#b91c1c"},{name:"Vocabulary",total:53,done:0,score:0,color:"#166534"},{name:"Grammar",total:60,done:0,score:0,color:"#1e40af"}],
  va:[{name:"Comunicación",total:24,done:0,score:0,color:"#7c3aed"},{name:"Herramientas",total:18,done:0,score:0,color:"#0e7490"},{name:"Inglés profesional",total:20,done:0,score:0,color:"#166534"},{name:"Productividad",total:16,done:0,score:0,color:"#c2410c"},{name:"Clientes",total:14,done:0,score:0,color:"#be185d"},{name:"Proyectos",total:12,done:0,score:0,color:"#1e40af"}],
};

const PROG_PROGRESS = (id, realEnrollments = {})=>{
  // Returns zeros for all units — real progress loads from student_progress table in Supabase
  // Units completed are tracked via ExamModule component which writes to student_progress
  const en = realEnrollments[id] || {};
  if(!en) return {};
  const p = {};
  for(let i=1;i<=12;i++){
    // Only mark previous units as "done" based on current_unit from Supabase (no fake scores)
    if(i<(en.unit||1)) p[i]={actsDone:20,testDone:3,score:0}; // done but score loads from DB
    else if(i===(en.unit||1)) p[i]={actsDone:0,testDone:0,score:0}; // current unit — in progress
    else p[i]={actsDone:0,testDone:0,score:0}; // future unit — locked
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
  {id:"reporte", icon:"ti-file-analytics",   label:"Mi reporte"},
  {id:"perfil",  icon:"ti-user-circle",     label:"Mi perfil"},
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
      <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginBottom:1}}>Scores</div>
      <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:10}}>{skill.score}%</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginBottom:1}}>Activities done</div>
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
            {isActive&&<span style={{marginLeft:8,fontSize:11,background:Y,color:PH,padding:"2px 8px",borderRadius:20,fontWeight:700}}>ACTIVA</span>}
            {isLocked&&<span style={{marginLeft:6,fontSize:11,color:"var(--text-tertiary)"}}>🔒</span>}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,minWidth:130,justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"var(--text-secondary)"}}>{prog.actsDone}/{unit.acts}</div>
            <div style={{fontSize:11,color:"var(--text-tertiary)"}}>Activities done</div>
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
          {isDone&&prog.testDone===3&&<span style={{marginLeft:8,fontSize:11,background:GD,color:G,padding:"2px 8px",borderRadius:20,fontWeight:700}}>✓</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:7,minWidth:130,justifyContent:"flex-end"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:"var(--text-secondary)"}}>{prog.testDone}/3</div>
            <div style={{fontSize:11,color:"var(--text-tertiary)"}}>Activities done</div>
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
      <div style={{width:52,height:52,borderRadius:12,background:prog.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{prog.icon}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{prog.name}</div>
          {prog.tag&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:prog.color,color:"#fff",fontWeight:700}}>{prog.tag}</span>}
        </div>
        <div style={{fontSize:12,color:"var(--text-secondary)",lineHeight:1.6,marginBottom:10}}>{prog.desc}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {prog.skills.slice(0,4).map(s=><span key={s} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:prog.colorLight,color:prog.color,fontWeight:500}}>{s}</span>)}
          {prog.skills.length>4&&<span style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:"var(--bg-surface-subtle)",color:"var(--text-tertiary)"}}>+{prog.skills.length-4} más</span>}
        </div>
        {prog.prereq&&!canEnroll&&(
          <div style={{fontSize:11,color:A,background:AD,padding:"6px 12px",borderRadius:8,marginBottom:10,display:"flex",gap:8}}>
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
// ─── EXAM QUESTIONS (seed by unit, reused for all programs) ─────
function generateQuestions(unit, progId) {
  const enQ = {
    1:[{q:"What is 'Good morning' in English?",opts:["Good morning","Good night","Good afternoon","Hello"],ans:0},{q:"How do you say '¿Cómo estás?' in English?",opts:["How are you?","Where are you?","Who are you?","What are you?"],ans:0},{q:"'The book is on the table' — what is on the table?",opts:["The book","The chair","The table","The pen"],ans:0},{q:"Complete: 'My name ___ María'",opts:["is","are","am","be"],ans:0},{q:"How many days are in a week?",opts:["Seven","Five","Six","Eight"],ans:0}],
    2:[{q:"'She ___ a teacher' — correct verb?",opts:["is","are","am","be"],ans:0},{q:"What is the plural of 'child'?",opts:["Children","Childs","Childes","Child"],ans:0},{q:"'I go to school every day' — tense?",opts:["Simple present","Simple past","Future","Present continuous"],ans:0},{q:"Which is correct?",opts:["He doesn't like coffee","He don't like coffee","He not like coffee","He no like coffee"],ans:0},{q:"'Yesterday I ___ to the store'",opts:["went","go","goes","going"],ans:0}],
    default:[{q:"Which sentence is correct?",opts:["I am studying English","I studying English","I are studying English","I is studying English"],ans:0},{q:"Complete: 'By next year I ___ English for two years'",opts:["will have studied","will study","am studying","have studied"],ans:0},{q:"What does 'although' mean?",opts:["A pesar de que","Por lo tanto","Sin embargo","Además"],ans:0},{q:"'The report ___ by the team last week'",opts:["was written","is written","wrote","writes"],ans:0},{q:"Which is more formal?",opts:["I would like to inquire","I want to ask","Can I ask?","Tell me about"],ans:0}],
  };
  const vaQ = [{q:"What is a Virtual Assistant?",opts:["A remote professional who provides support","A computer program","An office assistant","A translator"],ans:0},{q:"Which tool is commonly used for task management?",opts:["Trello","Instagram","Excel only","WhatsApp"],ans:0},{q:"'Asynchronous communication' means:",opts:["Not in real-time","Face to face","By phone","In the same timezone"],ans:0},{q:"What is a good practice when sending professional emails?",opts:["Use a clear subject line","Write in caps","Skip greetings","Use emojis always"],ans:0},{q:"Time management as a VA means:",opts:["Prioritizing tasks efficiently","Working 24 hours","Ignoring deadlines","Only working on urgent tasks"],ans:0}];
  const base = progId === "en" ? (enQ[unit] || enQ.default) : vaQ;
  // Randomize question order and option positions per attempt
  const shuffled = [...base].sort(() => Math.random() - 0.5).map(q => {
    // Create indexed options to track correct answer
    const indexed = q.opts.map((opt, i) => ({ opt, isCorrect: i === q.ans }));
    const shuffledOpts = [...indexed].sort(() => Math.random() - 0.5);
    return {
      q: q.q,
      opts: shuffledOpts.map(o => o.opt),
      ans: shuffledOpts.findIndex(o => o.isCorrect),
    };
  });
  return shuffled;
}

// ─── EXAM MODULE COMPONENT ────────────────────────────────────────
function ExamModule({ prog, enrollment, enrolledProgs, activeProg, setActiveProg, supabase }) {
  const P = prog?.color || "#155266";
  const G = "#059669", GD = "#ecfdf5";
  const R = "#dc2626", RD = "#fef2f2";
  const Y = "#ffbb23", A = "#d97706";

  const [phase, setPhase] = useState("intro"); // intro | taking | result
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min in seconds
  const [attempts, setAttempts] = useState(enrollment?.examScore ? 1 : 0);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const unit = enrollment?.unit || 1;
  const questions = generateQuestions(unit, activeProg);
  const MAX_ATTEMPTS = 3;

  // Timer countdown
  useEffect(() => {
    if (phase !== "taking") return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timerColor = timeLeft < 300 ? R : timeLeft < 600 ? A : G;

  async function handleSubmit() {
    const correct = questions.filter((q, i) => answers[i] === q.ans).length;
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setPhase("result");
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: student } = await supabase.from("students").select("id")
          .eq("profile_id", session.user.id).maybeSingle();
        if (student?.id) {
          await supabase.from("enrollments")
            .update({ exam_score: pct })
            .eq("student_id", student.id)
            .eq("program_id", activeProg);
          await supabase.from("student_progress").upsert({
            student_id:   student.id,
            program_id:   activeProg,
            unit:         unit,
            exam_score:   pct,
            passed:       pct >= 70,
            updated_at:   new Date().toISOString(),
          }, { onConflict: "student_id,program_id,unit" });
          if (pct >= 70) {
            // ★ ADVANCE to next unit
            const nextUnit = unit + 1;
            const isComplete = nextUnit > 12;
            await supabase.from("enrollments")
              .update({
                current_unit: isComplete ? 12 : nextUnit,
                exam_score: pct,
                ...(isComplete ? { status: "completed", completed_at: new Date().toISOString() } : {}),
              })
              .eq("student_id", student.id)
              .eq("program_id", activeProg);

            await supabase.from("audit_log").insert({
              action: isComplete ? "program_completed" : "exam_passed",
              entity: "enrollment",
              metadata: { program: activeProg, unit, score: pct, nextUnit: isComplete ? "DONE" : nextUnit },
            }).catch(() => {});

            // ★ Generate certificate if completed all 12 units
            if (isComplete) {
              try {
                const { data: { session: certSess } } = await supabase.auth.getSession();
                const profile = certSess?.user?.user_metadata;
                const certData = {
                  studentName: profile?.full_name || "Estudiante",
                  programName: prog?.name || activeProg,
                  level: enrollment?.level || "—",
                  date: new Date().toLocaleDateString("es-HN", { day:"2-digit", month:"long", year:"numeric" }),
                  score: pct,
                };
                await supabase.from("certificates").insert({
                  student_id: student.id,
                  program_id: activeProg,
                  data: certData,
                  issued_at: new Date().toISOString(),
                });
                const n2 = { type:"success", title:"🎓 ¡Programa completado!", body:`Completaste las 12 unidades de ${prog?.shortName}. Tu certificado está disponible.`, link:"/portal" };
                await notifySelf(n2.type, n2.title, n2.body, n2.link).catch(() => {});
              } catch(certErr) { console.error("Certificate:", certErr); }
            } else {
              const n = Notifs.examPassed("nivel siguiente", unit, pct);
              await notifySelf(n.type, n.title, n.body, n.link).catch(() => {});
            }
          } else {
            const n = Notifs.examFailed(unit, pct, MAX_ATTEMPTS - (attempts + 1));
            await notifySelf(n.type, n.title, n.body, n.link).catch(() => {});
          }
        }
      }
      setConfirmed(true);
      setAttempts(a => a + 1);
    } catch(e) { console.error("Exam save:", e); }
    finally { setSaving(false); }
  }

  const passed = score >= 70;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;

  if (phase === "intro") return (
    <div style={{ padding:24 }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {enrolledProgs.map(p => (
          <button key={p.id} onClick={() => setActiveProg(p.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", background:activeProg===p.id?p.color:"var(--bg-surface)", color:activeProg===p.id?"#fff":"var(--text-secondary)", border:`1.5px solid ${activeProg===p.id?p.color:"var(--border)"}`, borderRadius:30, fontSize:12, fontWeight:activeProg===p.id?700:400, cursor:"pointer", fontFamily:"inherit" }}>
            <span style={{ fontSize:14 }}>{p.icon}</span>{p.shortName}
          </button>
        ))}
      </div>
      <div style={{ background:"var(--bg-surface)", border:`1.5px solid ${P}40`, borderRadius:16, padding:28, maxWidth:540 }}>
        <div style={{ fontSize:11, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>Examen · {prog?.shortName}</div>
        <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>Unidad {unit}</div>
        {enrollment?.examScore > 0 && (
          <div style={{ fontSize:14, color:enrollment.examScore>=70?G:R, fontWeight:600, marginBottom:12 }}>
            Último intento: {enrollment.examScore}% {enrollment.examScore>=70?"✓ Aprobado":"✗ No aprobado"}
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:20 }}>
          {[["Preguntas", questions.length,"var(--text-primary)"],["Para aprobar","≥ 70%",G],["Tiempo límite","30 min",P]].map(([l,v,c],i) => (
            <div key={i} style={{ background:"var(--bg-surface-subtle)", borderRadius:8, padding:"12px 14px" }}>
              <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:3 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"var(--bg-surface-subtle)", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:12, color:"var(--text-secondary)", lineHeight:1.7 }}>
          Una vez iniciado el temporizador no se puede pausar. Respondé todas las preguntas antes de enviar.
          {attempts >= MAX_ATTEMPTS && <span style={{ color:R, display:"block", marginTop:4 }}>⚠ Agotaste tus {MAX_ATTEMPTS} intentos. Contactá a tu coordinadora para solicitar uno extra.</span>}
        </div>
        <button
          disabled={attempts >= MAX_ATTEMPTS}
          onClick={() => { setAnswers({}); setTimeLeft(30*60); setPhase("taking"); }}
          style={{ width:"100%", padding:"14px", background:attempts>=MAX_ATTEMPTS?"var(--bg-surface-subtle)":P, color:attempts>=MAX_ATTEMPTS?"var(--text-tertiary)":"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:attempts>=MAX_ATTEMPTS?"not-allowed":"pointer", fontFamily:"inherit" }}>
          {attempts === 0 ? "Comenzar examen" : `Reintentar — Intento ${attempts+1}/${MAX_ATTEMPTS}`}
        </button>
      </div>
    </div>
  );

  if (phase === "taking") return (
    <div style={{ padding:24, maxWidth:620 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"nowrap", gap:0, marginBottom:20, background:"var(--bg-surface)", border:`1px solid ${P}30`, borderRadius:12, padding:"12px 18px" }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>Examen U{unit} · {prog?.shortName}</div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontSize:12, color:"var(--text-secondary)" }}>{answered}/{questions.length} respondidas</div>
          <div style={{ fontSize:16, fontWeight:800, color:timerColor, fontVariantNumeric:"tabular-nums" }}>⏱ {formatTime(timeLeft)}</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {questions.map((q, qi) => (
          <div key={qi} style={{ background:"var(--bg-surface)", border:`1.5px solid ${answers[qi]!==undefined?P+"60":"var(--border)"}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:14 }}>
              <span style={{ color:P, marginRight:8, fontWeight:800 }}>{qi+1}.</span>{q.q}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {q.opts.map((opt, oi) => {
                const selected = answers[qi] === oi;
                return (
                  <button key={oi} onClick={() => setAnswers(a => ({...a,[qi]:oi}))}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", background:selected?`${P}12`:"var(--bg-surface-subtle)", border:`1.5px solid ${selected?P:"var(--border)"}`, borderRadius:8, cursor:"pointer", textAlign:"left", fontFamily:"inherit", fontSize:13, color:selected?P:"var(--text-primary)", fontWeight:selected?600:400, transition:"all .15s" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selected?P:"var(--border)"}`, background:selected?P:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {selected && <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }}/>}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button
        disabled={!allAnswered || saving}
        onClick={handleSubmit}
        style={{ width:"100%", marginTop:20, padding:"14px", background:allAnswered?P:"var(--bg-surface-subtle)", color:allAnswered?"#fff":"var(--text-tertiary)", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:allAnswered?"pointer":"not-allowed", fontFamily:"inherit" }}>
        {saving ? "Guardando…" : allAnswered ? "Enviar examen" : `Respondé las ${questions.length-answered} restantes`}
      </button>
    </div>
  );

  if (phase === "result") return (
    <div style={{ padding:24, maxWidth:500 }}>
      <div style={{ background:"var(--bg-surface)", border:`2px solid ${passed?G:R}`, borderRadius:20, padding:32, textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:56, marginBottom:8 }}>{passed?"🏆":"📚"}</div>
        <div style={{ fontSize:15, fontWeight:600, color:"var(--text-secondary)", marginBottom:4 }}>{passed?"¡Aprobaste!":"Casi — seguí practicando"}</div>
        <div style={{ fontSize:52, fontWeight:800, color:passed?G:R, lineHeight:1 }}>{score}%</div>
        <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:6 }}>Unidad {unit} · {prog?.shortName}</div>
        {saving && <div style={{ fontSize:12, color:"var(--text-tertiary)", marginTop:8 }}>Guardando resultado…</div>}
        {confirmed && <div style={{ fontSize:12, color:G, marginTop:8 }}>✓ Resultado guardado en tu historial</div>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
        {[["Correctas",`${questions.filter((_,i)=>answers[i]===questions[i].ans).length}/${questions.length}`,passed?G:R],["Porcentaje",`${score}%`,passed?G:R],["Resultado",passed?"Aprobado":"Reprobado",passed?G:R],["Intentos usados",`${attempts}/${MAX_ATTEMPTS}`,A]].map(([l,v,c],i)=>(
          <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>
      {passed && <div style={{ background:GD, border:`1px solid ${G}40`, borderRadius:10, padding:"12px 14px", fontSize:13, color:"#065f46", marginBottom:12 }}>✓ Tu coordinadora será notificada para coordinar el avance a la siguiente unidad.</div>}
      {!passed && attempts < MAX_ATTEMPTS && <div style={{ background:RD, border:`1px solid ${R}40`, borderRadius:10, padding:"12px 14px", fontSize:13, color:R, marginBottom:12 }}>Necesitás ≥70% para aprobar. Podés reintentar {MAX_ATTEMPTS-attempts} vez más.</div>}
      <button onClick={() => setPhase("intro")} style={{ width:"100%", padding:"13px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        {passed ? "Ver mi progreso" : attempts < MAX_ATTEMPTS ? "Intentar de nuevo" : "Volver al examen"}
      </button>
    </div>
  );

  return null;
}

export default function PortalEstudiante(){
  const navigate = useNavigate();
  const [user, setUser] = useState({ name:"", email:"", avatar:null });
  const [view,       setView]       = useState("inicio");
  const [activeProg, setActiveProg] = useState(null) // set after enrollments load; // current program in practice/exam
  const isMobile = useMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const [enrolled,   setEnrolled]   = useState([]); // populated from realEnrollments after load

  useEffect(() => {
    // Auth state listener — handles token expiry
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/", { replace: true }); return; }
      const uid = session.user.id;
      // Load profile
      supabase.from("profiles").select("full_name, email, avatar_url, phone, preferred_name")
        .eq("id", uid).single()
        .then(({ data }) => {
          if (data) {
            setUser({
              name:   data.preferred_name || data.full_name?.split(" ")[0] || data.email?.split("@")[0] || "Estudiante",
              email:  data.email || session.user.email || "",
              avatar: data.avatar_url || null,
            });
            setProfileForm({
              full_name:      data.full_name || "",
              phone:          data.phone || "",
              preferred_name: data.preferred_name || "",
            });
          }
        });
      // Load enrollments + group + student_progress
      supabase.from("students").select("id, level")
        .eq("profile_id", uid).maybeSingle()
        .then(async ({ data: student }) => {
          if (!student) return;
          const { data: enrolls } = await supabase
            .from("enrollments")
            .select("program_id, current_unit, exam_score, status, group_id, groups(teams_link, schedule, days, level, teacher_groups(staff(profiles(full_name))))")
            .eq("student_id", student.id)
            .eq("status", "active");
          if (enrolls?.length) {
            const patch = {};
            enrolls.forEach(e => {
              const grp = e.groups;
              const teacherName = grp?.teacher_groups?.[0]?.staff?.profiles?.full_name || null;
              const link = grp?.teams_link || null;
              const schedule = grp?.schedule ? `${grp.days || "L·M·V"} · ${grp.schedule}` : null;
              patch[e.program_id] = {
                unit: e.current_unit || 1,
                examScore: e.exam_score || 0,
                teamsLink: link || "#",
                nextClass: schedule || "Consulta con tu coordinadora",
                teacher: teacherName || "Docente asignado",
              };
            });
            setRealEnrollments(patch);
            setEnrolled(enrolls.map(e => e.program_id));
          }
          // Load real student_progress (exam history per unit)
          const { data: progress } = await supabase
            .from("student_progress")
            .select("program_id, unit, exam_score, passed, updated_at")
            .eq("student_id", student.id)
            .order("unit", { ascending: true });
          if (progress?.length) {
            const byProg = {};
            progress.forEach(p => {
              if (!byProg[p.program_id]) byProg[p.program_id] = {};
              byProg[p.program_id][p.unit] = { score: p.exam_score, passed: p.passed };
            });
            setRealProgress(byProg);
            setProgressHistory(prog || []);
          }
          // Load payment history
          const { data: pays } = await supabase
            .from("payments")
            .select("amount, created_at, method, status, programs(name)")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
            .limit(10);
          if (pays?.length) setRealPayments(pays);

          // Load certificates
          const { data: certs } = await supabase
            .from('certificates')
            .select('id,program_id,level,issued_at')
            .eq('student_id', student.id)
            .order('issued_at', { ascending: false });
          setMyCertificates(certs || []);
        });
    });
  }, [navigate]);
  const [showEnrollSuccess, setEnrollSuccess] = useState(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [realEnrollments,  setRealEnrollments] = useState({});
  const [realPayments,     setRealPayments]    = useState([]);
  const [uploadState,      setUploadState]     = useState({ loading:false, done:false, error:null });
  const [realProgress,     setRealProgress]     = useState({}); // {programId: {unit: {score, passed}}}
  const [profileForm,      setProfileForm]     = useState({ full_name:"", phone:"", preferred_name:"" });
  const [profileSaving,    setProfileSaving]   = useState(false);
  const [profileSaved,     setProfileSaved]    = useState(false);
  const [myCertificates,   setMyCertificates]  = useState([]);
  const [progressHistory,  setProgressHistory] = useState([]);

  const enrolledProgs = ALL_PROGRAMS.filter(p=>enrolled.includes(p.id));
  const unenrolledProgs = ALL_PROGRAMS.filter(p=>!enrolled.includes(p.id));
  const prog = ALL_PROGRAMS.find(p=>p.id===activeProg) || enrolledProgs[0];
  const _baseEnroll = realEnrollments[activeProg] || realEnrollments[enrolled[0]] || {};
  const _realPatch  = realEnrollments[activeProg] || realEnrollments[enrolled[0]] || {};
  const enrollment  = { ..._baseEnroll, ..._realPatch };
  const currentLevel = enrollment?.level || "B1";
  const units = activeProg === "en"
    ? (UNITS[currentLevel] || UNITS["B1"] || [])
    : (PROGRAM_UNITS[activeProg] || []);
  const skills = activeProg === "en"
    ? (SKILLS_BY_LEVEL[currentLevel] || SKILLS_BY_LEVEL["B1"] || [])
    : (SKILLS[activeProg] || SKILLS[enrolled[0]] || []);
  const progress = PROG_PROGRESS(activeProg, realEnrollments);
  const totalActs = (skills||[]).reduce((a,s)=>a+s.total,0);
  const totalDone = (skills||[]).reduce((a,s)=>a+(s.done||0),0);
  const avgScore  = skills.length>0?Math.round(skills.reduce((a,s)=>a+(s.score||0),0)/skills.length):0;

  function handleEnroll(progId){
    setEnrolled(e=>[...e,progId]);
    setEnrollSuccess(progId);
    setTimeout(()=>setEnrollSuccess(null),4000);
  }

  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",minHeight:"100vh",background:"var(--bg-page)",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <style dangerouslySetInnerHTML={{__html:"@media(max-width:400px){.wca-sidebar{display:none!important}.wca-mobile-only{display:flex!important}}@media(min-width:401px){.wca-mobile-only{display:none!important}}"}}/>

      {/* SIDEBAR */}
      <aside style={{width:isMobile?260:200,background:P,display:"flex",flexDirection:"column",padding:"0 0 16px",flexShrink:0,minHeight:"100vh",position:isMobile?"fixed":"sticky",top:0,left:0,bottom:0,zIndex:isMobile?9990:1,transform:isMobile?(sideOpen?"translateX(0)":"translateX(-100%)"):"none",transition:"transform .25s ease",overflowY:"auto",maxWidth:isMobile?"80vw":"none"}}>
        <div style={{padding:"22px 18px 18px",borderBottom:"1px solid rgba(255,255,255,.08)",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
              <svg viewBox="0 0 32 32" style={{width:34,height:34,flexShrink:0}}><rect width="32" height="32" rx="8" fill="#ffbb23"/><text x="16" y="23" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#155266" textAnchor="middle">W</text></svg>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>WCA <span style={{color:"#ffbb23"}}>Hub</span></div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>Portal del estudiante</div>
              </div>
            </div>
        </div>

        {/* Enrolled programs in sidebar */}
        <div style={{padding:"8px 12px",marginBottom:4}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Mis programas</div>
          {enrolledProgs.map(p=>(
            <button key={p.id} onClick={()=>{setActiveProg(p.id);setView("practica");}} style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"8px 9px",border:"none",background:activeProg===p.id?"rgba(255,255,255,.15)":"rgba(255,255,255,.05)",color:activeProg===p.id?"#fff":"rgba(255,255,255,.55)",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:11,marginBottom:4,textAlign:"left",fontWeight:activeProg===p.id?600:400,borderLeft:`2px solid ${activeProg===p.id?Y:"transparent"}`,transition:"all .15s"}}>
              <span style={{fontSize:14}}>{p.icon}</span>
              <span style={{flex:1}}>{p.shortName}</span>
              {activeProg===p.id&&<div style={{width:6,height:6,borderRadius:"50%",background:Y,flexShrink:0}}/>}
            </button>
          ))}
        </div>

        <div style={{height:1,background:"rgba(255,255,255,.08)",margin:"4px 12px 8px"}}/>

        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setView(n.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",border:"none",background:view===n.id?"rgba(255,255,255,.12)":"transparent",color:view===n.id?"#fff":"rgba(255,255,255,.45)",fontSize:12,cursor:"pointer",textAlign:"left",borderLeft:`2px solid ${view===n.id?Y:"transparent"}`,transition:"all .15s",fontFamily:"inherit",fontWeight:view===n.id?600:400,width:"100%"}}>
            <i className={"ti "+n.icon} style={{fontSize:14,width:18,textAlign:"center"}} aria-hidden="true"/>
            {n.label}
          </button>
        ))}

        <div style={{marginTop:"auto",padding:"14px 18px 0",borderTop:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:Y,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:PH}}>MR</div>
            <div><div style={{fontSize:12,color:"#fff",fontWeight:600}}>María Rodríguez</div><div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>{enrolled.length} programa{enrolled.length!==1?"s":""} activo{enrolled.length!==1?"s":""}</div></div>
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
      {isMobile && sideOpen && <div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,zIndex:40,background:"rgba(0,0,0,.4)"}}/>}


      {/* MAIN */}
      <main style={{flex:1,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
        {/* Topbar */}
        <div style={{height:60,background:"var(--bg-surface)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",flexShrink:0,boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>
            {{"inicio":"Inicio","practica":"Práctica 24/7","clases":"Clases en vivo","examen":"Examen","progreso":"Mi progreso","pagos":"Pagos","perfil":"Mi perfil"}[view]}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",position:"relative"}}>
            <button onClick={()=>setShowNotifs(s=>!s)} aria-label="Notificaciones"
              style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,color:"var(--text-secondary)",fontSize:20,display:"flex"}}>
              <i className="ti ti-bell" aria-hidden="true"/>
              {unread > 0 && (
                <span style={{position:"absolute",top:0,right:0,width:16,height:16,borderRadius:"50%",background:"#dc2626",color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{unread > 9?"9+":unread}</span>
              )}
            </button>
            {showNotifs && (
              <div style={{position:"absolute",top:44,right:0,width:isMobile?"90vw":320,background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.15)",zIndex:30,overflow:"hidden"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>Notificaciones</div>
                  {unread > 0 && <button onClick={markAllRead} style={{fontSize:11,color:P,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Marcar leídas</button>}
                </div>
                <div style={{maxHeight:320,overflowY:"auto"}}>
                  {notifications.length === 0 ? (
                    <div style={{padding:"24px 16px",textAlign:"center",fontSize:13,color:"var(--text-secondary)"}}>
                      <div style={{fontSize:isMobile?20:28,marginBottom:8}}>🔔</div>No hay notificaciones
                    </div>
                  ) : notifications.map(n=>(
                    <div key={n.id} onClick={()=>markRead(n.id)}
                      style={{display:"flex",gap:8,padding:"11px 16px",borderBottom:"1px solid var(--border)",background:n.read?"transparent":`${P}08`,cursor:"pointer"}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:n.read?"var(--border)":P,flexShrink:0,marginTop:5}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:n.read?400:600,color:"var(--text-primary)"}}>{n.title}</div>
                        {n.body&&<div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2,lineHeight:1.5}}>{n.body}</div>}
                        <div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:3}}>{new Date(n.created_at).toLocaleString("es-HN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {enrolledProgs.map(p=><ProgTag key={p.id} prog={p}/>)}
          </div>
        </div>

        {/* Enroll success toast */}
        {showEnrollSuccess&&(
          <div style={{position:"fixed",top:20,right:90,background:G,color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:50,boxShadow:"0 8px 24px rgba(5,150,105,.3)",display:"flex",alignItems:"center",gap:8,animation:"slideIn .3s ease"}}>
            <style dangerouslySetInnerHTML={{__html:"@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}"}}></style>
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
                <div style={{fontSize:24,fontWeight:800,color:"#fff",marginBottom:6}}>{`¡Hola, ${user.name || "Estudiante"}! 👋`}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,.7)",lineHeight:1.6,marginBottom:16}}>
                  Estás inscrita en <strong style={{color:Y}}>{enrolled.length} programas</strong>. Selecciona uno para continuar practicando.
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {enrolledProgs.map(p=>(
                    <button key={p.id} onClick={()=>{setActiveProg(p.id);setView("practica");}} style={{display:"flex",alignItems:"center",gap:7,padding:isMobile?"6px 10px":"8px 16px",background:"rgba(255,255,255,.15)",color:"#fff",border:"1px solid rgba(255,255,255,.25)",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
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
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(enrolledProgs.length,2)},minmax(0,1fr))`,gap:12}}>
                  {enrolledProgs.map(p=>{
                    const en = realEnrollments[p.id] || realEnrollments[p.id];
                    if(!enrolled.includes(p.id)) return null;
                    const unit = en?.unit || 1;
                    const cyclePct = Math.round(((unit-1)/12)*100);
                    const nextClassStr = en?.nextClass || (en?.teamsLink ? "Clase en vivo disponible" : "Consulta tu horario");
                    return(
                      <div key={p.id} onClick={()=>{setActiveProg(p.id);setView("practica");}} style={{background:"var(--bg-surface)",border:`1.5px solid ${p.color}40`,borderRadius:16,padding:18,cursor:"pointer",boxShadow:"var(--shadow-sm)",transition:"all .2s"}}
                        onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 6px 20px ${p.color}25`;e.currentTarget.style.transform="translateY(-2px)";}}
                        onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--shadow-sm)";e.currentTarget.style.transform="none";}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                          <div style={{display:"flex",gap:8,alignItems:"center"}}>
                            <div style={{width:42,height:42,borderRadius:11,background:p.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.icon}</div>
                            <div>
                              <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{p.shortName}</div>
                              <div style={{fontSize:11,color:"var(--text-secondary)"}}>U{unit} · {nextClassStr}</div>
                            </div>
                          </div>
                          <Ring pct={cyclePct} size={44} stroke={4} color={p.color} bg={p.colorLight}/>
                        </div>
                        <div style={{display:"flex",gap:3,marginBottom:8}}>
                          {Array.from({length:12},(_,i)=>(
                            <div key={i} style={{flex:1,height:5,borderRadius:3,background:i+1<unit?p.color:i+1===unit?Y:"var(--bg-surface-subtle)"}}/>
                          ))}
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-secondary)"}}>
                          <span>U{unit}/12 · {cyclePct}% completado</span>
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
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <div style={{flex:1,height:1,background:"var(--border)"}}/>
                    <div style={{fontSize:12,fontWeight:600,color:"var(--text-secondary)",padding:"0 10px",whiteSpace:"nowrap"}}>🚀 Amplía tu perfil profesional</div>
                    <div style={{flex:1,height:1,background:"var(--border)"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
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
                <div style={{background:GD,border:`1px solid ${G}40`,borderRadius:12,padding:20,textAlign:"center"}}>
                  <div style={{fontSize:isMobile?22:32,marginBottom:8}}>🏆</div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>¡Estás inscrita en todos los programas!</div>
                  <div style={{fontSize:13,color:"var(--text-secondary)"}}>Sigue practicando para completar cada uno.</div>
                </div>
              )}
            </div>
          )}

          {/* ── PRÁCTICA 24/7 ── */}
          {view==="practica"&&(
            <div style={{height:"calc(100vh - 120px)"}}>
              {enrolledProgs.length === 0 ? (
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,padding:24}}>
                  <div style={{fontSize:48}}>📚</div>
                  <div style={{fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>Sin programa activo</div>
                  <div style={{fontSize:13,color:"var(--text-secondary)",textAlign:"center"}}>
                    Contactá a tu coordinador para que active tu matrícula.
                  </div>
                </div>
              ) : (
                <LMSPlayer
                  programId={activeProg}
                  profileId={user?.id}
                  enrollment={enrollment}
                  isMobile={isMobile}
                />
              )}
            </div>
          )}

          view==="examen"&&(
            <ExamModule
              prog={prog}
              enrollment={enrollment}
              enrolledProgs={enrolledProgs}
              activeProg={activeProg}
              setActiveProg={setActiveProg}
              supabase={supabase}
            />
          )}

          {/* ── PROGRESO ── */}
          {view==="progreso"&&(
            <div style={{padding:24}}>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(enrolledProgs.length,2)},minmax(0,1fr))`,gap:12,marginBottom:16}}>
                {enrolledProgs.map(p=>{
                  const en2     = realEnrollments[p.id] || realEnrollments[p.id] || {};
                  const prog2   = realProgress[p.id] || {};
                  const realUnit = en2.unit || 1;
                  const passedUnits = Object.values(prog2).filter(u=>u.passed).length;
                  const hasProg = Object.keys(prog2).length > 0;
                  const avgScore = hasProg
                    ? Math.round(Object.values(prog2).reduce((a,u)=>a+(u.score||0),0)/Object.keys(prog2).length)
                    : (en2.examScore || 0);
                  const cyclePct = Math.round(((realUnit-1)/12)*100);
                  if (!enrolled.includes(p.id)) return null;
                  return(
                    <div key={p.id} style={{background:"var(--bg-surface)",border:`1.5px solid ${p.color}40`,borderRadius:12,padding:18,boxShadow:"var(--shadow-sm)"}}>
                      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:16}}>
                        <div style={{width:42,height:42,borderRadius:11,background:p.colorLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.icon}</div>
                        <div>
                          <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{p.shortName}</div>
                          <div style={{fontSize:11,color:"var(--text-secondary)"}}>{passedUnits||0}/12 unidades aprobadas</div>
                        </div>
                        <Ring pct={cyclePct} size={44} stroke={4} color={p.color} bg={p.colorLight}/>
                      </div>
                      <div style={{display:"flex",gap:3,marginBottom:10}}>
                        {Array.from({length:12},(_,i)=>{
                          const ud=prog2[i+1];
                          return <div key={i} style={{flex:1,height:6,borderRadius:3,
                            background:ud?.passed?p.color:i+1===realUnit?Y:"var(--bg-surface-subtle)"
                          }}/>;
                        })}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        <div style={{background:"var(--bg-surface-subtle)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:p.color}}>U{realUnit}</div>
                          <div style={{fontSize:11,color:"var(--text-tertiary)"}}>Unidad actual</div>
                        </div>
                        <div style={{background:"var(--bg-surface-subtle)",borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:800,color:avgScore>=70?G:A}}>{avgScore}%</div>
                          <div style={{fontSize:11,color:"var(--text-tertiary)"}}>Promedio exámenes</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prereq map */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:20,marginBottom:16,boxShadow:"var(--shadow-sm)"}}>
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
                          <div style={{fontSize:11,fontWeight:600,color:isEnrolled?p.color:"var(--text-tertiary)",textAlign:"center",maxWidth:72,lineHeight:1.3}}>{p.shortName}</div>
                          <div style={{fontSize:11,padding:"2px 7px",borderRadius:20,background:isEnrolled?p.colorLight:"var(--bg-surface-subtle)",color:isEnrolled?p.color:"var(--text-tertiary)",fontWeight:600}}>{isEnrolled?"Activo":"Disponible"}</div>
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
                  <div key={p.id} style={{background:"var(--bg-surface)",border:`1px solid ${p.color}30`,borderRadius:12,padding:18,marginBottom:12,boxShadow:"var(--shadow-sm)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <span style={{fontSize:22}}>{p.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{p.name}</div>
                        {(()=>{
                          const enData = realEnrollments[p.id] || {};
                          const nextDate = enData.nextPaymentDate;
                          if (!nextDate) return <div style={{fontSize:11,color:"var(--text-secondary)"}}>Pago mensual</div>;
                          const daysUntil = Math.ceil((new Date(nextDate) - new Date()) / (1000*60*60*24));
                          const isOverdue = daysUntil < 0;
                          const isSoon   = daysUntil >= 0 && daysUntil <= 5;
                          const dateStr  = new Date(nextDate).toLocaleDateString("es-HN",{day:"2-digit",month:"short"});
                          const color    = isOverdue ? R : isSoon ? A : G;
                          const label    = isOverdue
                            ? `Vencido hace ${Math.abs(daysUntil)} días`
                            : daysUntil === 0 ? "Vence hoy"
                            : isSoon    ? `Vence en ${daysUntil} días (${dateStr})`
                            : `Próximo pago: ${dateStr}`;
                          return <div style={{fontSize:11,color,fontWeight:isOverdue||isSoon?700:400}}>{label}</div>;
                        })()}
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:isMobile?17:22,fontWeight:800,color:p.color}}>${prog2?.price}</div>
                        <div style={{fontSize:11,color:"var(--text-tertiary)"}}>/{prog2?.interval}</div>
                      </div>
                      {(()=>{
                        const enData = realEnrollments[p.id] || {};
                        const nextDate = enData.nextPaymentDate;
                        const daysUntil = nextDate ? Math.ceil((new Date(nextDate) - new Date()) / (1000*60*60*24)) : 999;
                        const isOverdue = daysUntil < 0;
                        const isSoon    = daysUntil >= 0 && daysUntil <= 5;
                        return <div style={{fontSize:11,padding:"3px 10px",background:isOverdue?RD:isSoon?AD:GD,color:isOverdue?R:isSoon?A:G,borderRadius:20,fontWeight:600}}>
                          {isOverdue?"Pago vencido":isSoon?"Pago pronto":"Al día"}
                        </div>;
                      })()}
                    </div>
                    <button onClick={async()=>{
                      try{
                        toast.info("Pagos en línea próximamente — por ahora coordiná con tu asesor");
                        return;
                        const res = await fetch("/api/stripe/checkout", {
                          method:"POST",
                          headers:{"Content-Type":"application/json", Authorization:`Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`},
                          body:JSON.stringify({programId:p.id, studentEmail:user.email, studentName:user.name}),
                        });
                        const data = await res.json();
                        if(data.data?.url) window.open(data.data.url, "_blank");
                        else toast.error("Error al iniciar pago: " + (data.error||"Stripe no configurado"));
                      }catch(e){ toast.error("Error: "+e.message); }
                    }} style={{width:"100%",padding:"9px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:10}}>
                      💳 Pagar con Stripe
                    </button>
                  </div>
                );
              })}
              {/* Upload proof for pending payments */}
              {realPayments.filter(p=>p.status==="pending").map(p=>(
                <div key={p.id} style={{background:AD,border:`1px solid ${A}40`,borderRadius:12,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:A}}>⏳ Pago pendiente de confirmación</div>
                    <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>${Number(p.amount).toFixed(2)} · {new Date(p.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"long"})}</div>
                  </div>
                  {p.proof_url
                    ? <div style={{fontSize:11,color:G,fontWeight:600}}>✓ Comprobante enviado</div>
                    : <label style={{fontSize:12,padding:"6px 14px",background:A,color:"#fff",borderRadius:8,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>
                        📎 Subir comprobante
                        <input type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={async e=>{
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const ext = file.name.split(".").pop();
                            const path = `proofs/${p.id}.${ext}`;
                            const { error: upErr } = await supabase.storage.from("proofs").upload(path, file, {upsert:true});
                            if (upErr) throw upErr;
                            const { data: urlData } = supabase.storage.from("proofs").getPublicUrl(path);
                            const {data:{session}} = await supabase.auth.getSession();
                            await fetch("/api/payments/record",{method:"PATCH",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},body:JSON.stringify({paymentId:p.id,proofUrl:urlData.publicUrl})});
                            toast.success("✓ Comprobante enviado — cobros lo revisará en breve");
                            setRealPayments(ps=>ps.map(x=>x.id===p.id?{...x,proof_url:urlData.publicUrl}:x));
                          } catch(err){ toast.error("Error al subir: "+err.message); }
                        }}/>
                      </label>
                  }
                </div>
              ))}

              {/* Payment history by month */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
                <div style={{padding:"13px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>Historial de pagos</div>
                  <div style={{fontSize:11,color:"var(--text-secondary)"}}>{realPayments.filter(p=>p.status==="confirmed").length} pagos confirmados</div>
                </div>
                {realPayments.length > 0 ? realPayments.map((p,i)=>{
                  const fecha = new Date(p.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short",year:"numeric"});
                  const prog3 = p.programs?.name || "Programa";
                  const statusColor = p.status==="confirmed"?G:p.status==="pending"?A:R;
                  const statusBg    = p.status==="confirmed"?GD:p.status==="pending"?AD:RD;
                  const statusText  = p.status==="confirmed"?"✓ Confirmado":p.status==="pending"?"Pendiente":"Rechazado";
                  return(
                  <div key={p.id||i} style={{display:"flex",alignItems:"center",gap:16,padding:"12px 18px",borderBottom:"1px solid var(--border)"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:statusBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                      {p.status==="confirmed"?"✓":p.status==="pending"?"⏳":"✗"}
                    </div>
                    <div style={{flex:1}}><div style={{fontSize:13,color:"var(--text-primary)",fontWeight:500}}>{fecha}</div><div style={{fontSize:11,color:"var(--text-secondary)"}}>{p.method||"Transferencia"} · {p.reference_code||"—"}</div></div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>${Number(p.amount).toFixed(2)}</div>
                      <div style={{fontSize:11,padding:"2px 7px",background:statusBg,color:statusColor,borderRadius:12,fontWeight:600,marginTop:2}}>{statusText}</div>
                    </div>
                  </div>);
                }) : (
                  <div style={{padding:"18px",fontSize:12,color:"var(--text-secondary)",textAlign:"center"}}>
                    No hay pagos registrados aún.
                  </div>
                )}
              </div>
              {/* ── Subida de comprobante ── */}
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:18,marginTop:12,boxShadow:"var(--shadow-sm)"}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>Subir comprobante de pago</div>
                <div style={{fontSize:12,color:"var(--text-secondary)",marginBottom:16}}>Si pagaste por transferencia bancaria, sube la foto o captura del comprobante para que el equipo lo confirme.</div>
                {uploadState.done ? (
                  <div style={{background:GD,borderRadius:10,padding:"12px 14px",fontSize:13,color:"#065f46",fontWeight:600}}>✓ Comprobante enviado correctamente. Te confirmamos en 24h.</div>
                ) : (
                  <div>
                    <label style={{display:"block",cursor:"pointer"}}>
                      <input type="file" accept="image/*,.pdf" style={{display:"none"}}
                        onChange={async(e)=>{
                          const file = e.target.files?.[0];
                          if(!file) return;
                          setUploadState({loading:true,done:false,error:null});
                          try{
                            const { data:{ session } } = await supabase.auth.getSession();
                            const uid = session?.user?.id;
                            const ext = file.name.split(".").pop();
                            const path = `proofs/${uid}/${Date.now()}.${ext}`;
                            const { error } = await supabase.storage
                              .from("proofs")
                              .upload(path, file, { upsert:true });
                            if(error) throw error;
                            const { data:{ publicUrl } } = supabase.storage.from("proofs").getPublicUrl(path);
                            // Record payment pending confirmation
                            if(uid){
                              const { data:st } = await supabase.from("students").select("id").eq("profile_id",uid).maybeSingle();
                              if(st) await supabase.from("payments").insert({
                                student_id:st.id,
                                amount:0,
                                method:"Transferencia bancaria",
                                status:"pending",
                                receipt_url:publicUrl,
                              });
                            }
                            setUploadState({loading:false,done:true,error:null});
                            // Notify student that comprobante was received
                            await notifySelf("payment", "Comprobante recibido", "Revisaremos tu pago en las próximas 24 horas.", "/portal").catch(()=>{});
                          }catch(err){
                            setUploadState({loading:false,done:false,error:err.message||"Error al subir"});
                          }
                        }}
                      />
                      <div style={{border:`2px dashed ${uploadState.error?R:"var(--border)"}`,borderRadius:12,padding:"20px",textAlign:"center",cursor:"pointer",background:"var(--bg-surface-subtle)",transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=P}
                        onMouseLeave={e=>e.currentTarget.style.borderColor=uploadState.error?R:"var(--border)"}>
                        {uploadState.loading ? (
                          <div style={{fontSize:13,color:"var(--text-secondary)"}}>Subiendo...</div>
                        ) : (
                          <>
                            <i className="ti ti-upload" style={{fontSize:isMobile?20:28,color:"var(--text-tertiary)",display:"block",marginBottom:8}} aria-hidden="true"/>
                            <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",marginBottom:2}}>Haz clic para seleccionar el comprobante</div>
                            <div style={{fontSize:11,color:"var(--text-secondary)"}}>JPG, PNG o PDF · Máx. 5 MB</div>
                          </>
                        )}
                      </div>
                    </label>
                    {uploadState.error && <div style={{fontSize:12,color:R,marginTop:8}}>⚠ {uploadState.error}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PERFIL ── */}
          {view==="reporte"&&(
            <div style={{padding:"24px 28px"}}>
              <div style={{fontSize:isMobile?17:22,fontWeight:800,color:"var(--text-primary)",marginBottom:4}}>Mi reporte académico</div>
              <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:24}}>Ficha completa con tu progreso, habilidades y certificados</div>

              {/* Preview card */}
              <div style={{background:"var(--bg-surface)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",marginBottom:20,boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
                <div style={{background:`linear-gradient(135deg,#0f3d4d,#155266)`,padding:"24px 28px",color:"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <svg viewBox="0 0 32 32" style={{width:36,height:36}}><rect width="32" height="32" rx="8" fill="#ffbb23"/><text x="16" y="23" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#0f3d4d" textAnchor="middle">W</text></svg>
                    <div><div style={{fontSize:14,fontWeight:800}}>WCA <span style={{color:"#ffbb23"}}>Academy</span></div><div style={{fontSize:11,color:"rgba(255,255,255,.5)",letterSpacing:1,textTransform:"uppercase"}}>Reporte del estudiante</div></div>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.3}}>{user?.name||"Estudiante"}</div>
                  <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                    {enrolledProgs.map(p=>(
                      <span key={p.id} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,.12)",fontWeight:600}}>{p.shortName}</span>
                    ))}
                  </div>
                </div>
                <div style={{padding:"20px 28px",display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:16}}>
                  {[
                    {label:"Programas activos", value:enrolledProgs.length, icon:"📚"},
                    {label:"Certificados", value:myCertificates.length, icon:"🏆"},
                    {label:"Exámenes rendidos", value:progressHistory.filter(p=>p.exam_score>0).length, icon:"📝"},
                    {label:"Unidad actual", value:`U${_baseEnroll.unit||1}/12`, icon:"🎯"},
                  ].map((s,i)=>(
                    <div key={i} style={{textAlign:"center",padding:12,background:"var(--bg-surface-subtle)",borderRadius:12}}>
                      <div style={{fontSize:24}}>{s.icon}</div>
                      <div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",lineHeight:1.2}}>{s.value}</div>
                      <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button onClickCapture={(e)=>{e.stopPropagation();setShowReport(true);}} style={{
                display:"flex",alignItems:"center",gap:8,padding:"14px 28px",
                background:"#ffbb23",color:"#0f3d4d",border:"none",borderRadius:12,
                fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                boxShadow:"0 4px 20px rgba(255,187,35,.4)",
              }}>
                <i className="ti ti-file-analytics" style={{fontSize:18}} aria-hidden="true"/>
                Ver reporte completo y descargar PDF
              </button>
              <p style={{fontSize:12,color:"var(--text-secondary)",marginTop:8}}>
                El reporte incluye gráfico de habilidades, historial de exámenes, certificados y métricas de rendimiento.
              </p>
            </div>
          )}

          {view==="perfil"&&(
            <div style={{padding:24,maxWidth:500}}>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:16,padding:24,marginBottom:16,boxShadow:"var(--shadow-sm)"}}>
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
                  <div style={{width:64,height:64,borderRadius:"50%",background:PD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:P,flexShrink:0}}>
                    {user.avatar
                      ? <img src={user.avatar} alt="" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}}/>
                      : (user.name||"E").slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:"var(--text-primary)"}}>{user.name}</div>
                    <div style={{fontSize:12,color:"var(--text-secondary)"}}>{user.email}</div>
                  </div>
                </div>
                {[
                  {label:"Nombre completo", key:"full_name",      placeholder:"María Rodríguez", type:"text"},
                  {label:"Nombre preferido", key:"preferred_name", placeholder:"María (como quieres que te llamen)", type:"text"},
                  {label:"Teléfono / WhatsApp", key:"phone",      placeholder:"+504 9900-0000", type:"tel"},
                ].map(f=>(
                  <div key={f.key} style={{marginBottom:12}}>
                    <label style={{fontSize:11,color:"var(--text-secondary)",display:"block",marginBottom:4,fontWeight:500}}>{f.label}</label>
                    <input
                      type={f.type}
                      value={profileForm[f.key]||""}
                      onChange={e=>setProfileForm(p=>({...p,[f.key]:e.target.value}))}
                      placeholder={f.placeholder}
                      style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}
                    />
                  </div>
                ))}
                {profileSaved && <div style={{background:GD,borderRadius:8,padding:"8px 12px",fontSize:12,color:"#065f46",fontWeight:600,marginBottom:12}}>✓ Perfil actualizado correctamente</div>}
                <button
                  disabled={profileSaving}
                  onClick={async()=>{
                    setProfileSaving(true);
                    try{
                      const {data:{session}} = await supabase.auth.getSession();
                      if(!session) return;
                      await supabase.from("profiles").update({
                        full_name:      profileForm.full_name||undefined,
                        phone:          profileForm.phone||undefined,
                        preferred_name: profileForm.preferred_name||undefined,
                      }).eq("id",session.user.id);
                      setUser(u=>({...u,name:profileForm.preferred_name||profileForm.full_name?.split(" ")[0]||u.name}));
                      setProfileSaved(true);
                      setTimeout(()=>setProfileSaved(false),4000);
                    }catch(e){ toast.error("Error: "+e.message); }
                    finally{setProfileSaving(false);}
                  }}
                  style={{width:"100%",padding:"11px",background:profileSaving?"var(--bg-surface-subtle)":P,color:profileSaving?"var(--text-secondary)":"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:profileSaving?"not-allowed":"pointer",fontFamily:"inherit"}}>
                  {profileSaving?"Guardando…":"Guardar cambios"}
                </button>
              </div>
              <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:18,boxShadow:"var(--shadow-sm)"}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:12}}>Mis certificados</div>
                {enrolledProgs.map(p=>{
                  const en2 = realEnrollments[p.id]||{};
                  const pct = Math.round(((en2.unit||1)-1)/12*100);
                  const complete = pct >= 100;
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                      <span style={{fontSize:22}}>{p.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)"}}>{p.name}</div>
                        <div style={{height:5,background:"var(--bg-surface-subtle)",borderRadius:4,marginTop:5}}>
                          <div style={{height:"100%",width:`${pct}%`,background:p.color,borderRadius:4,transition:"width 1s"}}/>
                        </div>
                        <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:3}}>{pct}% completado</div>
                      </div>
                      {complete
                        ? <button onClick={()=>generateCertificate({
  name:    user.name || "Estudiante WCA",
  level:   realEnrollments[p.id]?.level || "B1",
  program: p.name,
  date:    new Date().toLocaleDateString("es-HN",{day:"2-digit",month:"long",year:"numeric"}),
})} style={{fontSize:11,padding:"6px 12px",background:GD,color:G,border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>⬇ Descargar</button>
                        : <span style={{fontSize:11,color:"var(--text-tertiary)"}}>En progreso</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
      {isMobile && <button onClick={()=>setSideOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:40,width:50,height:50,borderRadius:"50%",background:P,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.25)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sideOpen?"\u2715":"\u2630"}</button>}
      {showReport && (
        <StudentReport
          student={user}
          enrollments={enrolledProgs.map(p=>({...p,...(realEnrollments[p.id]||{})}))}
          certificates={myCertificates}
          progressHistory={progressHistory}
          skills={SKILLS[activeProg]||SKILLS.en}
          onClose={()=>setShowReport(false)}
        />
      )}
    </div>
  );
}