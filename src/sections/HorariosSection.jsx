// ─── HorariosSection — Vista de horarios semanales ──────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

const P="#155266",PD="#e8f3f6",G="#059669",A="#d97706";
const DAYS_ES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL = {"Lun":"Lunes","Mar":"Martes","Mié":"Miércoles","Jue":"Jueves","Vie":"Viernes","Sáb":"Sábado","Dom":"Domingo"};

export function HorariosSection() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("week"); // week | list

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from("groups")
      .select("id,level,schedule,days,capacity,active_unit,program_id,teams_link,active,teacher_groups(teacher:staff(profile:profiles(full_name))),enrollments(id,status)")
      .eq("active",true).order("level");
    if(data) setGroups(data);
    setLoading(false);
  }

  // Parse which days each group meets
  const groupsByDay = (day) => groups.filter(g=>(g.days||"").includes(day));
  const enrolled = (g) => g.enrollments?.filter(e=>e.status==="active").length||0;
  const teacher = (g) => g.teacher_groups?.[0]?.teacher?.profile?.full_name||"Sin asignar";

  const progColor = {en:P,va:"#7c3aed",va_mkt:"#db2777",va_legal:"#0e7490",va_care:G};

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["week","Vista semanal"],["list","Lista completa"]].map(([id,l])=>(
          <button key={id} onClick={()=>setViewMode(id)} style={{padding:"7px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:viewMode===id?P:"var(--bg-surface-subtle)",color:viewMode===id?"#fff":"var(--text-secondary)"}}>
            {l}
          </button>
        ))}
        <div style={{marginLeft:"auto",fontSize:12,color:"var(--text-secondary)",display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:10,height:10,borderRadius:"50%",background:G,display:"inline-block"}}/>Al día
          <span style={{width:10,height:10,borderRadius:"50%",background:A,display:"inline-block",marginLeft:8}}/>Lleno
        </div>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :viewMode==="week"?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
          {DAYS_ES.map(day=>{
            const dayGroups=groupsByDay(day);
            if(!dayGroups.length) return null;
            return(
              <div key={day}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--text-secondary)",textTransform:"uppercase",letterSpacing:.8,marginBottom:8,padding:"4px 8px",background:"var(--bg-surface-subtle)",borderRadius:6}}>
                  {DAY_FULL[day]}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {dayGroups.map(g=>{
                    const pct=(enrolled(g)/(g.capacity||25))*100;
                    const color=progColor[g.program_id]||P;
                    return(
                      <div key={g.id} style={{background:"var(--bg-surface)",border:`1px solid ${color}30`,borderRadius:10,padding:"10px 11px",borderLeft:`3px solid ${color}`}}>
                        <div style={{fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>{g.level}</div>
                        <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{g.schedule?.split("–")[0]?.trim()}</div>
                        <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{teacher(g)}</div>
                        <div style={{marginTop:5,height:3,borderRadius:2,background:"var(--bg-surface-subtle)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:pct>=90?A:color,borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:2}}>{enrolled(g)}/{g.capacity} cupos</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ):(
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"var(--bg-surface-subtle)"}}>
                {["Nivel","Horario","Días","Docente","Cupos","Teams","Programa"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {groups.map(g=>{
                  const pct=(enrolled(g)/(g.capacity||25))*100;
                  const color=progColor[g.program_id]||P;
                  return(
                    <tr key={g.id} style={{borderTop:"1px solid var(--border-tertiary)"}}>
                      <td style={{padding:"10px 12px"}}>
                        <span style={{fontWeight:700,color:color}}>{g.level}</span>
                        <div style={{fontSize:11,color:"var(--text-tertiary)"}}>U{g.active_unit}</div>
                      </td>
                      <td style={{padding:"10px 12px",fontSize:12,whiteSpace:"nowrap"}}>{g.schedule}</td>
                      <td style={{padding:"10px 12px",fontSize:11,color:"var(--text-secondary)"}}>{g.days}</td>
                      <td style={{padding:"10px 12px",fontSize:12}}>{teacher(g)}</td>
                      <td style={{padding:"10px 12px"}}>
                        <div style={{fontSize:12,fontWeight:600,color:pct>=90?A:"var(--text-primary)"}}>{enrolled(g)}/{g.capacity}</div>
                        <div style={{width:50,height:4,borderRadius:2,background:"var(--bg-surface-subtle)",marginTop:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:pct>=90?A:G,borderRadius:2}}/>
                        </div>
                      </td>
                      <td style={{padding:"10px 12px"}}>
                        {g.teams_link
                          ?<a href={g.teams_link} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#1d4ed8",fontWeight:600,textDecoration:"none"}}>▷ Abrir</a>
                          :<span style={{fontSize:11,color:"var(--text-tertiary)"}}>—</span>}
                      </td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:`${color}15`,color,fontWeight:600}}>{g.program_id?.toUpperCase()}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
