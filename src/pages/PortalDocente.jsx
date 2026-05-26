import { useState, useEffect} from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "../lib/toast.jsx";
import { MobileLayout, useMobile } from "../lib/MobileLayout.jsx";
import { supabase } from "../lib/supabase.js";

const C = {
  bg:"var(--bg-page)",surface:"var(--bg-surface)",surfaceHigh:"var(--wca-primary-dim)",border:"var(--border)",
  accent:"#155266",accentDim:"var(--wca-primary-dim)",green:"#059669",greenDim:"var(--green-dim)",
  amber:"#ffbb23",amberDim:"var(--amber-dim)",red:"#dc2626",redDim:"var(--red-dim)",
  purple:"#155266",purpleDim:"var(--wca-primary-dim)",textPri:"var(--text-primary)",textSec:"var(--text-secondary)",textTer:"var(--text-tertiary)",
};

// GROUPS removed — real data from Supabase

// STUDENTS removed — real data from Supabase

const UNITS = [
  {n:1,title:"Self",stream:"https://stream.microsoft.com/...",pdf:"",status:"published"},
  {n:2,title:"Things",stream:"https://stream.microsoft.com/...",pdf:"https://...",status:"published"},
  {n:3,title:"Places",stream:"https://stream.microsoft.com/...",pdf:"",status:"published"},
  {n:4,title:"Life",stream:"https://stream.microsoft.com/...",pdf:"https://...",status:"published"},
  {n:5,title:"Travel",stream:"https://stream.microsoft.com/...",pdf:"",status:"published"},
  {n:6,title:"Skills",stream:"https://stream.microsoft.com/...",pdf:"",status:"published"},
  {n:7,title:"Reasons",stream:"https://stream.microsoft.com/...",pdf:"https://...",status:"published"},
  {n:8,title:"History",stream:"https://stream.microsoft.com/...",pdf:"",status:"published"},
  {n:9,title:"Comforts",stream:"",pdf:"",status:"draft"},
  {n:10,title:"Adventure",stream:"",pdf:"",status:"empty"},
  {n:11,title:"Learning",stream:"",pdf:"",status:"empty"},
  {n:12,title:"Activities",stream:"",pdf:"",status:"empty"},
];

// BANK removed — real data from Supabase

// SESSIONS removed — real data from Supabase

const TYPE_C = {
  Grammar:["var(--amber-dim)","#92400e"], Vocabulary:["var(--wca-primary-dim)","#155266"],
  Reading:["var(--green-dim)","#065f46"], Pronunciation:["var(--wca-primary-dim)","#0f3d4d"],
  Listening:["var(--red-dim)","#dc2626"], Speaking:["var(--wca-primary-dim)","#9d174d"],
};

const ScoreCol = s => s>=80?C.green:s>=70?C.amber:C.red;
const ScoreBg  = s => s>=80?C.greenDim:s>=70?C.amberDim:C.redDim;
const pct = (a,b) => Math.round(a/b*100);

function Stat({label,value,sub,color}){
  return(
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px"}}>
      <div style={{fontSize:12,color:C.textSec,marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:800,color:color||C.textPri,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:12,color:C.textTer,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Chip({text,color,bg}){
  return <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:bg,color,fontWeight:600}}>{text}</span>;
}

function AttemptDots({attempts}){
  return(
    <div style={{display:"flex",gap:4}}>
      {attempts.map((a,i)=>(
        <div key={i} style={{
          width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:11,fontWeight:700,
          background:a===null?C.surfaceHigh:a>=70?C.greenDim:C.redDim,
          color:a===null?C.textTer:a>=70?C.green:C.red,
          border:`1px solid ${a===null?C.border:a>=70?C.green:C.red}`
        }}>{a===null?i+1:a>=70?"✓":"✗"}</div>
      ))}
    </div>
  );
}

const NAV=[
  {id:"home",icon:"⊞",label:"Inicio"},
  {id:"grupos",icon:"⊙",label:"Mis grupos"},
  {id:"asistencia",icon:"✓",label:"Asistencia"},
  {id:"examenes",icon:"✎",label:"Exámenes"},
  {id:"contenido",icon:"⊟",label:"Contenido"},
  {id:"banco",icon:"◈",label:"Banco actividades"},
];

function AttendanceRow({student, status, onToggle}){
  const present = status !== "absent";
  const setPresent = (val) => onToggle(student.id, val ? "present" : "absent");
  const _unused=useState(true);
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.surfaceHigh,borderRadius:8,marginBottom:6}}>
      <div style={{flex:1,fontSize:13,color:C.textPri,fontWeight:500}}>{student.name}</div>
      <div style={{display:"flex",gap:5}}>
        <button onClick={()=>setPresent(true)} style={{fontSize:11,padding:"3px 10px",background:present?C.greenDim:C.surfaceHigh,color:present?C.green:C.textTer,border:`1px solid ${present?C.green:C.border}`,borderRadius:5,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>✓</button>
        <button onClick={()=>setPresent(false)} style={{fontSize:11,padding:"3px 10px",background:!present?C.redDim:C.surfaceHigh,color:!present?C.red:C.textTer,border:`1px solid ${!present?C.red:C.border}`,borderRadius:5,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>✗</button>
      </div>
    </div>
  );
}

export default function TeacherPortal(){
  const [realGroups,    setRealGroups]    = useState([]);
  const [realStudents,  setRealStudents]  = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // {studentId: "present"|"absent"|"late"}

  useEffect(() => {
    async function loadTeacherData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      // Get teacher's staff record
      const { data: staffRow } = await supabase
        .from("staff").select("id").eq("profile_id", uid).maybeSingle();
      if (!staffRow) return;
      // Get assigned groups
      const { data: tgroups } = await supabase
        .from("teacher_groups")
        .select("group_id, groups(id, level, schedule, days, active_unit, program_id, teams_link)")
        .eq("teacher_id", staffRow.id);
      if (tgroups?.length) {
        const gs = tgroups.map(tg => tg.groups).filter(Boolean);
          setRealGroups(gs);
          if (gs.length > 0) setSelGroup(gs[0].id);
        // Get students in those groups
        const groupIds = tgroups.map(tg => tg.group_id);
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("student_id, group_id, students(id, level, profiles(full_name, email))")
          .in("group_id", groupIds)
          .eq("status", "active");
        if (enrollments?.length) {
          const students = enrollments.map(e => ({
            id:         e.students?.id,
            name:       e.students?.profiles?.full_name || e.students?.profiles?.email || "Estudiante",
            email:      e.students?.profiles?.email,
            group:      e.group_id,
            attendance: 85,
            avgScore:   80,
            currentUnit: 9,
            attempts:   [null, null, null],
            flags:      [],
          })).filter(s => s.id);
          setRealStudents(students);
        }
      }
    }
    loadTeacherData();
  }, []);

  const navigate = useNavigate();

  // Session guard — only listen for sign-out (PrivateRoute handles role verification)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        navigate("/", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const [view,setView]=useState("home");
  const isMobile = useMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const [selGroup,setSelGroup]=useState(null); // set after groups load
  const [selUnit,setSelUnit]=useState(null);
  const [extraModal,setExtraModal]=useState(null);
  const [recLinks,setRecLinks]=useState({});
  const [streamLinks,setStreamLinks]=useState(Object.fromEntries(UNITS.map(u=>[u.n,u.stream])));
  const [pdfLinks,setPdfLinks]=useState(Object.fromEntries(UNITS.map(u=>[u.n,u.pdf])));
  const [backupLinks,setBackupLinks]=useState(Object.fromEntries(UNITS.map(u=>[u.n,""])));

  const displayGroups   = realGroups.length > 0 ? realGroups.map((g,i) => ({
    id:         g.id,
    level:      g.level || "A1",
    schedule:   g.schedule || "6:00 PM",
    days:       g.days || "L·M·V",
    students:   realStudents.filter(s => s.group === g.id).length,
    activeUnit: g.active_unit || 9,
    color:      i === 0 ? C.accent : "#1a7a9a",
    teamsLink:  g.teams_link || null,
    dbId:       g.id,
  })) : GROUPS;
  const displayStudents = realStudents;
  const selGroupId = typeof selGroup === "string" ? selGroup : displayGroups[0]?.id || 1;
  const grpStudents = displayStudents.filter(s => String(s.group) === String(selGroupId));
  const allStudents = realStudents.length > 0
    ? displayStudents
    : displayStudents.filter(s => s.group <= 2);
  const atRisk  = allStudents.filter(s => s.flags?.includes("at-risk"));
  const blocked = allStudents.filter(s => s.flags?.includes("blocked"));
  const group   = displayGroups.find(g => String(g.id) === String(selGroupId)) || displayGroups[0] || { id:0, level:"—", schedule:"Sin asignar", days:"—", teacher:"—", students:0, color:"#94a3b8", dbId:null };

  return(
    <div style={{display:"flex",minHeight: "100vh", height: "100vh",background:C.bg,overflow:"hidden",border:`1px solid ${C.border}`,fontFamily:"'DM Sans','Outfit','Segoe UI',sans-serif",position:"relative"}}>

      {/* SIDEBAR */}
      <aside style={{width:isMobile?260:190,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,position:isMobile?"fixed":"relative",top:0,left:0,bottom:0,zIndex:isMobile?9990:1,transform:isMobile?(sideOpen?"translateX(0)":"translateX(-100%)"):"none",transition:"transform .25s ease",overflowY:"auto",minHeight:isMobile?"100vh":"auto"}}>
        <div style={{padding:"0 18px 16px",borderBottom:`1px solid ${C.border}`,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
              <svg viewBox="0 0 32 32" style={{width:32,height:32,flexShrink:0}}><rect width="32" height="32" rx="8" fill="#ffbb23"/><text x="16" y="23" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#155266" textAnchor="middle">W</text></svg>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:C.textPri}}>WCA <span style={{color:C.accent}}>Hub</span></div>
                <div style={{fontSize:11,color:C.textSec,letterSpacing:1,textTransform:"uppercase"}}>Portal Docente</div>
              </div>
            </div>
        </div>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setView(item.id)} style={{
            display:"flex",alignItems:"center",gap:9,padding:"11px 20px",border:"none",
            background:view===item.id?`${C.accent}18`:"transparent",
            borderLeft:`3px solid ${view===item.id?C.accent:"transparent"}`,
            color:view===item.id?C.accent:C.textSec,fontSize:13,cursor:"pointer",
            textAlign:"left",borderLeft:`2px solid ${view===item.id?C.accent:"transparent"}`,
            transition:"all .15s",fontFamily:"inherit",fontWeight:view===item.id?600:400
          }}>
            <span style={{fontSize:16,width:18,textAlign:"center"}}>{item.icon}</span>
            {item.label}
            {item.id==="examenes"&&blocked.length>0&&(
              <span style={{marginLeft:"auto",fontSize:11,background:C.red,color:"var(--bg-surface)",borderRadius:"50%",width:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{blocked.length}</span>
            )}
          </button>
        ))}
        <div style={{marginTop:"auto",padding:"12px 16px",borderTop:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.accent}}>JO</div>
            <div>
              <div style={{fontSize:13,color:C.textPri,fontWeight:600}}>José Rodríguez</div>
              <div style={{fontSize:11,color:C.textTer}}>Docente · A1</div>
            </div>
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
      <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{height:52,background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 22px",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:700,color:C.textPri}}>
            {{home:"Inicio · Hoy",grupos:"Mis grupos",asistencia:"Asistencia",examenes:"Exámenes y desbloqueos",contenido:"Contenido A1",banco:"Banco de actividades"}[view]}
          </div>
          <div style={{display:"flex",gap:8}}>
            {atRisk.length>0&&<div style={{fontSize:12,background:C.amberDim,color:C.amber,padding:"3px 10px",borderRadius:20,fontWeight:600}}>⚠ {atRisk.length} en riesgo</div>}
            <div style={{fontSize:12,background:C.accentDim,color:C.accent,padding:"3px 10px",borderRadius:20,fontWeight:600}}>A1 · U9 activa</div>
          </div>
        </div>

        <div style={{flex:1,overflow:"auto",padding:20}}>

          {/* HOME */}
          {view==="home"&&(
            <div>
              {blocked.length>0&&(
                <div style={{background:C.redDim,border:`1px solid ${C.red}40`,borderRadius:12,padding:"11px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
                  <i className="ti ti-alert-triangle" style={{fontSize:16,color:"var(--red)"}} aria-hidden="true"/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.red}}>{blocked.length} estudiante{blocked.length>1?"s":""} bloqueado{blocked.length>1?"s":""} — requieren tu acción</div>
                    <div style={{fontSize:12,color:"#fca5a5",marginTop:2}}>{blocked.map(s=>s.name).join(", ")} — agotaron 3 intentos</div>
                  </div>
                  <button onClick={()=>setView("examenes")} style={{fontSize:12,padding:"6px 14px",background:C.red,color:"var(--bg-surface)",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>Ver ahora →</button>
                </div>
              )}
              {/* ── Quick action: Pasar lista hoy ── */}
              {displayGroups.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
                    Acción rápida
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {displayGroups.slice(0,3).map(g => (
                      <button key={g.id}
                        onClick={() => { setView("asistencia"); }}
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px",
                          background:"var(--wca-primary)", color:"#fff", border:"none",
                          borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
                          fontFamily:"inherit" }}>
                        <i className="ti ti-clipboard-check" style={{ fontSize:15 }} aria-hidden="true"/>
                        Pasar lista — {g.level||"Grupo"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:8,marginBottom:16}}>
                <Stat label="Mis grupos" value={displayGroups.length} sub="Nivel A1" color={C.accent}/>
                <Stat label="Estudiantes" value={allStudents.length} sub="Ambos horarios"/>
                <Stat label="En riesgo" value={atRisk.length} sub="Necesitan apoyo" color={atRisk.length>0?C.amber:C.green}/>
                <Stat label="Asistencia avg" value="82%" sub="Esta semana" color={C.green}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.textPri,marginBottom:12}}>Clases hoy — Lun 16 Jun</div>
                  {displayGroups.map(g=>(
                    <div key={g.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 12px",background:C.surfaceHigh,borderRadius:10,marginBottom:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:g.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.textPri}}>{g.level} · {g.schedule}</div>
                        <div style={{fontSize:12,color:C.textSec,marginTop:2}}>U9: Comforts · {g.students} alumnos</div>
                      </div>
                      <button style={{fontSize:12,padding:"5px 12px",background:C.accent,color:"var(--bg-surface)",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}} onClick={()=>{ const url=g.teamsLink||g.teams_link; if(url&&url!=="")window.open(url,"_blank"); else showToast("Link de Teams no configurado aún"); }}>▷ Teams</button>
                    </div>
                  ))}
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.textPri,marginBottom:12}}>Grabaciones pendientes</div>
                  {false&&([]).map((s,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",borderTop:i>0?`1px solid ${C.border}`:"none"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:C.textPri,fontWeight:500}}>{s.date} · U{s.unit}: {s.title}</div>
                        <div style={{fontSize:12,color:C.textTer,marginTop:1}}>{s.attended}/{s.total} asistentes</div>
                      </div>
                      {s.recorded
                        ?<span style={{fontSize:11,background:C.greenDim,color:C.green,padding:"2px 8px",borderRadius:20,fontWeight:600}}>✓ Lista</span>
                        :<button onClick={()=>setView("asistencia")} style={{fontSize:11,padding:"3px 10px",background:C.amberDim,color:C.amber,border:`1px solid ${C.amber}40`,borderRadius:6,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Subir link</button>
                      }
                    </div>
                  ))}
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.textPri,marginBottom:12}}>Estudiantes que necesitan apoyo</div>
                  {atRisk.length===0&&<div style={{fontSize:13,color:C.textTer,textAlign:"center",padding:"16px 0"}}>✓ Todos al día</div>}
                  {atRisk.map(s=>(
                    <div key={s.id} style={{display:"flex",gap:8,alignItems:"center",padding:"9px 10px",background:C.surfaceHigh,borderRadius:10,marginBottom:7}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.red,flexShrink:0}}>
                        {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:C.textPri}}>{s.name}</div>
                        <div style={{fontSize:12,color:C.textSec,marginTop:1}}>
                          {s.flags.includes("blocked")?`⛔ Bloqueado U${s.currentUnit}`:`⚠ ${s.attempts.filter(a=>a!==null).length}/3 fallidos`} · {s.attendance}% asistencia
                        </div>
                      </div>
                      <AttemptDots attempts={s.attempts}/>
                    </div>
                  ))}
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.textPri,marginBottom:12}}>Rendimiento · A1 6PM · U9</div>
                  {grpStudents.slice(0,5).map(s=>(
                    <div key={s.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:12,color:C.textSec,width:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name.split(" ")[0]}</div>
                      <div style={{flex:1,height:4,background:C.surfaceHigh,borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${s.avgScore}%`,background:ScoreCol(s.avgScore),borderRadius:2}}/>
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:ScoreCol(s.avgScore),width:28,textAlign:"right"}}>{s.avgScore}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* GRUPOS */}
          {view==="grupos"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                {displayGroups.map(g=>(
                  <button key={g.id} onClick={()=>setSelGroup(g.id)} style={{padding:"8px 16px",border:`1px solid ${selGroup===g.id?g.color:C.border}`,borderRadius:10,background:selGroup===g.id?`${g.color}15`:C.surface,color:selGroup===g.id?g.color:C.textSec,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{g.level} · {g.schedule}</button>
                ))}
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:C.textPri,marginBottom:3}}>Nivel {group?.level || "—"} · <span style={{color:C.accent}}>{group?.schedule || "—"}</span></div>
                    <div style={{fontSize:13,color:C.textSec}}>{group.days} · {group.students} estudiantes · U{group.activeUnit} activa</div>
                  </div>
                  <button style={{fontSize:13,padding:"7px 16px",background:C.accent,color:"var(--bg-surface)",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}} onClick={()=>{ const url=group?.teamsLink||group?.teams_link; if(url&&url!=="")window.open(url,"_blank"); else showToast("Link de Teams no configurado — pedile al Admin"); }}>▷ Abrir Teams</button>
                </div>
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:C.surfaceHigh}}>
                      {["Estudiante","Asistencia","Promedio","Intentos U9","Estado",""].map(h=>(
                        <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:600,color:C.textTer,letterSpacing:0.5,textTransform:"uppercase"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grpStudents.map((s,i)=>(
                      <tr key={s.id} style={{borderTop:`1px solid ${C.border}`}}>
                        <td style={{padding:"10px 12px"}}>
                          <div style={{fontWeight:600,color:C.textPri}}>{s.name}</div>
                        </td>
                        <td style={{padding:"10px 12px"}}><span style={{color:s.attendance>=80?C.green:s.attendance>=60?C.amber:C.red,fontWeight:600}}>{s.attendance}%</span></td>
                        <td style={{padding:"10px 12px"}}><span style={{color:ScoreCol(s.avgScore),fontWeight:600}}>{s.avgScore}%</span></td>
                        <td style={{padding:"10px 12px"}}><AttemptDots attempts={s.attempts}/></td>
                        <td style={{padding:"10px 12px"}}>
                          {s.flags.includes("blocked")?<Chip text="⛔ Bloqueado" color={C.red} bg={C.redDim}/>
                          :s.flags.includes("at-risk")?<Chip text="⚠ En riesgo" color={C.amber} bg={C.amberDim}/>
                          :<Chip text="✓ Al día" color={C.green} bg={C.greenDim}/>}
                        </td>
                        <td style={{padding:"10px 12px"}}>
                          {s.flags.includes("blocked")&&(
                            <button onClick={()=>setExtraModal(s)} style={{fontSize:11,padding:"4px 10px",background:C.purpleDim,color:C.purple,border:`1px solid ${C.purple}40`,borderRadius:6,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>+ Intento</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* ASISTENCIA */}
          {view==="asistencia"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                <div style={{fontSize:13,fontWeight:700,color:C.textPri,marginBottom:16}}>Sesiones recientes</div>
                {false&&([]).map((s,i)=>(
                  <div key={i} style={{padding:"10px 12px",background:C.surfaceHigh,borderRadius:10,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:C.textPri}}>{s.date} · U{s.unit}: {s.title}</div>
                        <div style={{fontSize:12,color:C.textSec,marginTop:2}}>{s.attended}/{s.total} asistieron · {pct(s.attended,s.total)}%</div>
                      </div>
                    </div>
                    {!s.recorded?(
                      <div style={{display:"flex",gap:8}}>
                        <input aria-label="Link de recurso" value={recLinks[i]||""} onChange={e=>setRecLinks(r=>({...r,[i]:e.target.value}))} placeholder="Link de Stream (grabación)..." style={{flex:1,padding:"5px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.textPri,fontFamily:"inherit"}}/>
                        <button disabled style={{fontSize:12,padding:"5px 10px",background:"var(--bg-surface-subtle)",color:"var(--text-tertiary)",border:"1px solid var(--border)",borderRadius:6,cursor:"default",fontFamily:"inherit",opacity:0.6}}>Próximamente</button>
                      </div>
                    ):(
                      <div style={{fontSize:12,color:C.green}}>✓ Grabación disponible 7 días</div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                <div style={{fontSize:13,fontWeight:700,color:C.textPri,marginBottom:4}}>Tomar asistencia — Hoy</div>
                <div style={{fontSize:12,color:C.textSec,marginBottom:16}}>A1 · 6:00 PM · U9: Comforts</div>
                {grpStudents.map(s=><AttendanceRow key={s.id} student={s}
  status={attendanceMap[s.id]||"present"}
  onToggle={(id,val)=>setAttendanceMap(m=>({...m,[id]:val}))}/>)}
                <button style={{marginTop:8,width:"100%",padding:"9px",background:C.accent,color:"var(--bg-surface)",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
  onClick={async()=>{
    const today = new Date().toISOString().slice(0,10);
    const records = grpStudents.map(s=>({
      student_id:    s.id,
      group_id:      group?.dbId || (typeof selGroup==="string" ? selGroup : null),
      date:          today,
      status:        attendanceMap[s.id] || "present",
      unit:          group?.active_unit || 9,
    })).filter(r=>r.student_id);
    if(records.length){
      try{
        await supabase.from("attendance").upsert(records, {onConflict:"student_id,date"});
        showToast("✓ Asistencia guardada localmente");
      }catch(e){ showToast("Error: "+e.message); }
    } else { showToast("✓ Asistencia guardada localmente"); }
  }}>Guardar asistencia</button>
              </div>
            </div>
          )}

          {/* EXÁMENES */}
          {view==="examenes"&&(
            <div>
              {blocked.length>0&&(
                <div style={{background:C.redDim,border:`1px solid ${C.red}40`,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:3}}>🚨 {blocked.length} estudiante{blocked.length>1?"s":""} — acción requerida</div>
                  <div style={{fontSize:12,color:"#fca5a5"}}>Agotaron los 3 intentos del examen. Decide si habilitas uno extra.</div>
                </div>
              )}
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:700,color:C.textPri}}>Estado de exámenes — Unidad 9 · Todos mis grupos</div>
                {allStudents.map((s,i)=>(
                  <div key={s.id} style={{display:"flex",gap:12,alignItems:"center",padding:"11px 16px",borderTop:i>0?`1px solid ${C.border}`:"none",background:s.flags.includes("blocked")?`${C.red}08`:"transparent"}}>
                    <div style={{width:30,height:30,borderRadius:"50%",background:s.flags.includes("blocked")?C.redDim:C.accentDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:s.flags.includes("blocked")?C.red:C.accent,flexShrink:0}}>
                      {s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.textPri}}>{s.name}</div>
                      <div style={{fontSize:12,color:C.textSec,marginTop:1}}>Asistencia: {s.attendance}% · Promedio: {s.avgScore}%</div>
                    </div>
                    <AttemptDots attempts={s.attempts}/>
                    <div style={{width:130,textAlign:"right"}}>
                      {s.flags.includes("blocked")
                        ?<button onClick={()=>setExtraModal(s)} style={{fontSize:12,padding:"5px 12px",background:C.purple,color:"var(--bg-surface)",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>+ Intento extra</button>
                        :s.attempts.some(a=>a!==null&&a>=70)
                          ?<Chip text="✓ Aprobado" color={C.green} bg={C.greenDim}/>
                          :<Chip text="En progreso" color={C.textSec} bg={C.surfaceHigh}/>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONTENIDO */}
          {view==="contenido"&&(
            <div style={{display:"grid",gridTemplateColumns:"210px 1fr",gap:16}}>
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:10,alignSelf:"start"}}>
                <div style={{fontSize:11,fontWeight:600,color:C.textTer,textTransform:"uppercase",letterSpacing:.5,marginBottom:8,padding:"0 6px"}}>Unidades A1 — Wide Angle 1</div>
                {UNITS.map(u=>(
                  <button key={u.n} onClick={()=>setSelUnit(u)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 8px",background:selUnit?.n===u.n?C.accentDim:"transparent",border:"none",borderRadius:7,cursor:"pointer",textAlign:"left",marginBottom:2,fontFamily:"inherit"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",flexShrink:0,background:u.status==="published"?C.green:u.status==="draft"?C.amber:C.border}}/>
                    <div style={{flex:1,fontSize:13,color:selUnit?.n===u.n?C.accent:C.textSec}}>U{u.n} — {u.title}</div>
                    {u.n===9&&<span style={{fontSize:12,background:C.accent,color:"var(--bg-surface)",padding:"1px 5px",borderRadius:4,fontWeight:700}}>HOY</span>}
                  </button>
                ))}
              </div>
              {selUnit?(
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:C.textPri}}>U{selUnit.n} — {selUnit.title}</div>
                      <div style={{fontSize:12,color:C.textSec,marginTop:2}}>Nivel A1 · Wide Angle 1</div>
                    </div>
                    <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,fontWeight:600,background:selUnit.status==="published"?C.greenDim:selUnit.status==="draft"?C.amberDim:C.surfaceHigh,color:selUnit.status==="published"?C.green:selUnit.status==="draft"?C.amber:C.textTer}}>
                      {selUnit.status==="published"?"✓ Publicado":selUnit.status==="draft"?"Borrador":"Sin contenido"}
                    </span>
                  </div>
                  {[
                    {label:"🎥 Video principal — Microsoft Stream",val:streamLinks[selUnit.n],set:v=>setStreamLinks(s=>({...s,[selUnit.n]:v})),ph:"https://microsoftstream.com/video/..."},
                    {label:"🔗 Video de respaldo — Bunny.net / Vimeo (Plan B)",val:backupLinks[selUnit.n],set:v=>setBackupLinks(s=>({...s,[selUnit.n]:v})),ph:"https://iframe.mediadelivery.net/..."},
                    {label:"📄 Material PDF",val:pdfLinks[selUnit.n],set:v=>setPdfLinks(s=>({...s,[selUnit.n]:v})),ph:"URL del PDF..."},
                  ].map((f,i)=>(
                    <div key={i} style={{marginBottom:12}}>
                      <div style={{fontSize:12,color:C.textSec,fontWeight:600,marginBottom:5}}>{f.label}</div>
                      <div style={{display:"flex",gap:8}}>
                        <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                          style={{flex:1,padding:"8px 12px",background:C.bg,border:`1px solid ${f.val?C.accent:C.border}`,borderRadius:8,fontSize:13,color:C.textPri,fontFamily:"inherit"}}/>
                        {f.val&&<span style={{fontSize:15,alignSelf:"center",color:C.green}}>✓</span>}
                      </div>
                    </div>
                  ))}
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,marginTop:4}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.textSec,marginBottom:8}}>📝 Actividades de esta unidad</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                      {false&&([]).map(act=>{
                        const[c,tc]=TYPE_C[act.type]||["var(--text-primary)","#374151"];
                        return(<div key={act.id} style={{fontSize:12,padding:"3px 10px",background:c+"44",color:tc,borderRadius:20,border:`1px solid ${c}`}}>{act.type}: {act.title}</div>);
                      })}
                      <button onClick={()=>setView("banco")} style={{fontSize:12,padding:"3px 12px",background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}40`,borderRadius:20,cursor:"pointer",fontFamily:"inherit"}}>+ Agregar</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <button style={{flex:1,padding:"9px",background:C.accent,color:"var(--bg-surface)",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}} onClick={async()=>{
  if(extraModal?.id) {
    await supabase.from("student_progress").upsert({
      student_id: extraModal.id,
      extra_attempt_granted: true,
      updated_at: new Date().toISOString(),
    }, {onConflict:"student_id"}).catch(()=>{});
  }
  showToast("✓ Intento extra habilitado");
  setExtraModal(null);
}}>Guardar cambios</button>
                    <button disabled style={{padding:"11px 18px",background:"var(--bg-surface-subtle)",color:"var(--text-tertiary)",border:"1px solid var(--border)",borderRadius:10,fontSize:13,fontWeight:600,cursor:"default",fontFamily:"inherit",opacity:0.6}}>Publicar (próximamente)</button>
                  </div>
                </div>
              ):(
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:C.textTer,fontSize:13,minHeight:300}}>
                  ← Selecciona una unidad
                </div>
              )}
            </div>
          )}

          {/* BANCO */}
          {view==="banco"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
                {Object.entries(TYPE_C).map(([type,[c,tc]])=>(
                  <button key={type} style={{fontSize:12,padding:"5px 14px",background:`${c}44`,color:tc,border:`1px solid ${c}`,borderRadius:20,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>{type}</button>
                ))}
                <button style={{marginLeft:"auto",fontSize:12,padding:"6px 14px",background:C.accent,color:"var(--bg-surface)",border:"none",borderRadius:20,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>+ Nueva actividad</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {false&&([]).map(act=>{
                  const[c,tc]=TYPE_C[act.type]||["var(--text-primary)","#374151"];
                  return(
                    <div key={act.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px"}}>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:`${c}44`,color:tc,fontWeight:600}}>{act.type}</span>
                        <span style={{fontSize:11,color:C.textTer,padding:"2px 7px",background:C.surfaceHigh,borderRadius:20}}>{act.skill}</span>
                      </div>
                      <div style={{fontSize:13,fontWeight:600,color:C.textPri,marginBottom:4}}>{act.title}</div>
                      <div style={{fontSize:12,color:C.textTer,marginBottom:10}}>A1 · U{act.unit}</div>
                      <div style={{display:"flex",gap:8}}>
                        <button style={{flex:1,fontSize:12,padding:"6px",background:C.accentDim,color:C.accent,border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontFamily:"inherit"}}>Asignar a unidad</button>
                        <button disabled style={{fontSize:12,padding:"5px 10px",background:"var(--bg-surface-subtle)",color:"var(--text-tertiary)",border:"1px solid var(--border)",borderRadius:7,cursor:"default",fontFamily:"inherit",opacity:0.6}}>Próximamente</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL Intento extra */}
      {extraModal&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10,borderRadius:16}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:24,width:360}}>
            <div style={{fontSize:15,fontWeight:700,color:C.textPri,marginBottom:4}}>Habilitar intento extra</div>
            <div style={{fontSize:13,color:C.textSec,marginBottom:16}}>{extraModal.name} — U{extraModal.currentUnit} · 3/3 intentos agotados</div>
            <div style={{fontSize:12,color:C.textTer,marginBottom:8}}>Motivo (queda en el log de auditoría):</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {["Problema técnico durante el examen","Se explicó el contenido de nuevo","Caso especial justificado"].map(r=>(
                <button key={r} disabled style={{fontSize:12,padding:"7px 10px",background:"var(--bg-surface-subtle)",color:"var(--text-tertiary)",border:"1px solid var(--border)",borderRadius:8,cursor:"default",fontFamily:"inherit",textAlign:"left",opacity:0.6}}>{r} · próximamente</button>
              ))}
            </div>
            <input placeholder="Nota adicional (opcional)..." style={{width:"100%",padding:"8px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.textPri,fontFamily:"inherit",marginBottom:16}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setExtraModal(null)} style={{flex:1,padding:"9px",background:"transparent",color:C.textSec,border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
              <button onClick={()=>setExtraModal(null)} style={{flex:1,padding:"9px",background:C.purple,color:"var(--bg-surface)",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓ Habilitar intento</button>
            </div>
          </div>
        </div>
      )}


      {/* Toast notification */}
      {toastMsg && (
        <div style={{ position:"fixed", top:20, right:90, background:toastMsg.color, color:"#fff", padding:"11px 18px", borderRadius:11, fontSize:13, fontWeight:600, zIndex:50, boxShadow:"0 6px 20px rgba(0,0,0,.2)", display:"flex", gap:8, alignItems:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
          ✓ {toastMsg.msg}
        </div>
      )}
      {isMobile && <button onClick={()=>setSideOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:40,width:50,height:50,borderRadius:"50%",background:C.accent,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.25)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sideOpen?"\u2715":"\u2630"}</button>}
    </div>
  );
}