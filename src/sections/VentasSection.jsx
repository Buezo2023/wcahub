// ─── VentasSection — CRM completo sincronizado para SuperAdmin ───
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706";

const STAGES=[
  {id:"nuevo",    label:"Nuevo",     color:"#64748b",bg:"#f1f5f9"},
  {id:"contactado",label:"Contactado",color:P,       bg:PD},
  {id:"test",     label:"Test",      color:"#7c3aed",bg:"#ede9fe"},
  {id:"propuesta",label:"Propuesta", color:A,        bg:"#fffbeb"},
  {id:"convertido",label:"Convertido",color:G,       bg:GD},
  {id:"perdido",  label:"Perdido",   color:R,        bg:RD},
];

function StageTag({stage}){
  const s=STAGES.find(x=>x.id===stage)||STAGES[0];
  return <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:s.bg,color:s.color,fontWeight:700,whiteSpace:"nowrap"}}>{s.label}</span>;
}

export function VentasSection({ showToast }) {
  const [leads,  setLeads]  = useState([]);
  const [tasks,  setTasks]  = useState([]);
  const [staff,  setStaff]  = useState([]); // asesores
  const [tab,    setTab]    = useState("overview");
  const [loading,setLoading]= useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const [leadsRes, tasksRes, staffRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at",{ascending:false}).limit(300),
      supabase.from("crm_tasks").select("id,title,due_date,done,priority,lead_id,assigned_to,leads(full_name),profiles(full_name)").order("due_date").limit(100),
      supabase.from("staff").select("id,profile:profiles(id,full_name,email)").limit(50),
    ]);
    if(leadsRes.data)  setLeads(leadsRes.data);
    if(tasksRes.data)  setTasks(tasksRes.data);
    if(staffRes.data)  setStaff(staffRes.data);
    setLoading(false);
  }

  async function changeStage(id,stage){
    const {error}=await supabase.from("leads").update({stage,updated_at:new Date().toISOString()}).eq("id",id);
    if(error){showToast("Error: "+error.message,R);return;}
    setLeads(ls=>ls.map(l=>l.id===id?{...l,stage}:l));
  }

  async function toggleTask(id,done){
    await supabase.from("crm_tasks").update({done:!done,done_at:!done?new Date().toISOString():null}).eq("id",id);
    setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!done}:t));
  }

  // Funnel metrics
  const funnel = useMemo(()=>({
    total:    leads.length,
    active:   leads.filter(l=>!["convertido","perdido"].includes(l.stage)).length,
    conv:     leads.filter(l=>l.stage==="convertido").length,
    lost:     leads.filter(l=>l.stage==="perdido").length,
    convRate: leads.length>0 ? Math.round((leads.filter(l=>l.stage==="convertido").length/leads.length)*100) : 0,
    byStage:  STAGES.map(s=>({...s, count: leads.filter(l=>l.stage===s.id).length})),
    bySource: leads.reduce((acc,l)=>{ const src=l.source||"Directo"; acc[src]=(acc[src]||0)+1; return acc; },{}),
  }),[leads]);

  const filtered = useMemo(()=>{
    let res = leads;
    if(filterStage!=="all") res=res.filter(l=>l.stage===filterStage);
    if(search) res=res.filter(l=>(l.full_name||"").toLowerCase().includes(search.toLowerCase())||(l.email||"").toLowerCase().includes(search.toLowerCase()));
    return res;
  },[leads,filterStage,search]);

  const pendingTasks = tasks.filter(t=>!t.done);
  const overdueTasks = pendingTasks.filter(t=>t.due_date&&new Date(t.due_date)<new Date());

  const TABS=[["overview","Resumen"],["leads","Todos los leads"],["tasks","Tareas"],["pipeline","Pipeline"]];

  return(
    <div>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:tab===id?P:"var(--bg-surface-subtle)",color:tab===id?"#fff":"var(--text-secondary)"}}>
            {label}
            {id==="tasks"&&pendingTasks.length>0&&<span style={{marginLeft:5,background:overdueTasks.length>0?R:A,color:"#fff",borderRadius:8,fontSize:11,padding:"1px 5px"}}>{pendingTasks.length}</span>}
          </button>
        ))}
        <button onClick={()=>exportCSV(leads.map(l=>({Nombre:l.full_name,Email:l.email,Teléfono:l.phone||"—",Stage:l.stage,Fuente:l.source||"—",Score:l.test_score||0,Interés:l.level_interest||l.program_interest||"—",Fecha:new Date(l.created_at).toLocaleDateString("es-HN")})),`leads-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{marginLeft:"auto",padding:"7px 14px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>
          <i className="ti ti-download"/> CSV
        </button>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando datos de ventas...</div>:<>

      {/* OVERVIEW */}
      {tab==="overview"&&(
        <div>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:20}}>
            {[
              {l:"Total leads",    v:funnel.total,    c:P,  i:"ti-users"},
              {l:"Activos",        v:funnel.active,   c:A,  i:"ti-activity"},
              {l:"Convertidos",    v:funnel.conv,     c:G,  i:"ti-trophy"},
              {l:"Tasa conversión",v:`${funnel.convRate}%`, c:G, i:"ti-chart-bar"},
              {l:"Tareas pendientes",v:pendingTasks.length, c:overdueTasks.length>0?R:A, i:"ti-checklist"},
            ].map((k,i)=>(
              <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8}}>
                <i className={`ti ${k.i}`} style={{fontSize:20,color:k.c}}/>
                <div><div style={{fontSize:20,fontWeight:800,color:"var(--text-primary)",lineHeight:1}}>{k.v}</div>
                  <div style={{fontSize:11,color:"var(--text-secondary)"}}>{k.l}</div></div>
              </div>
            ))}
          </div>

          {/* Funnel stages */}
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:18,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:16}}>Funnel de conversión</div>
            {funnel.byStage.map((s,i)=>{
              const pct=funnel.total>0?Math.round((s.count/funnel.total)*100):0;
              return(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:90,fontSize:11,fontWeight:600,color:s.color,flexShrink:0}}>{s.label}</div>
                  <div style={{flex:1,height:8,background:"var(--bg-surface-subtle)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:s.color,borderRadius:4,transition:"width .5s"}}/>
                  </div>
                  <div style={{width:40,textAlign:"right",fontSize:12,fontWeight:700,color:"var(--text-secondary)"}}>{s.count}</div>
                  <div style={{width:35,textAlign:"right",fontSize:11,color:"var(--text-tertiary)"}}>{pct}%</div>
                </div>
              );
            })}
          </div>

          {/* Sources */}
          <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:18}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:16}}>Fuentes de leads</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {Object.entries(funnel.bySource).sort((a,b)=>b[1]-a[1]).map(([src,count])=>(
                <div key={src} style={{background:PD,border:`1px solid ${P}20`,borderRadius:8,padding:"6px 12px",fontSize:12}}>
                  <span style={{fontWeight:700,color:P}}>{count}</span>
                  <span style={{color:"var(--text-secondary)",marginLeft:5}}>{src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ALL LEADS */}
      {tab==="leads"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..."
              style={{flex:1,minWidth:160,padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
            <select value={filterStage} onChange={e=>setFilterStage(e.target.value)}
              style={{padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}>
              <option value="all">Todos los stages</option>
              {STAGES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {filtered.length===0
            ?<EmptyState icon="💼" title="Sin leads" subtitle="No hay leads con esos filtros."/>
            :<div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{background:"var(--bg-surface-subtle)"}}>
                    {["Nombre","Email","Stage","Test","Fuente","Interés","Fecha"].map(h=>(
                      <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.map(l=>(
                      <tr key={l.id} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}
              style={{borderTop:"1px solid var(--border-tertiary)",transition:"background .1s"}}>
                        <td style={{padding:"8px 12px",fontWeight:600,color:"var(--text-primary)"}}>{l.full_name}</td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"var(--text-secondary)"}}>{l.email||"—"}</td>
                        <td style={{padding:"8px 12px"}}><StageTag stage={l.stage}/></td>
                        <td style={{padding:"8px 12px",fontSize:12,color:l.test_score>=70?"#059669":l.test_score>0?"#d97706":"var(--text-tertiary)",fontWeight:l.test_score>0?600:400}}>
                          {l.test_score>0?`${l.test_score}%`:"—"}
                        </td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"var(--text-secondary)"}}>{l.source||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"var(--text-secondary)"}}>{l.level_interest||l.program_interest||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"var(--text-secondary)",whiteSpace:"nowrap"}}>
                          {new Date(l.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short"})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      )}

      {/* TASKS */}
      {tab==="tasks"&&(
        <div>
          {overdueTasks.length>0&&(
            <div style={{background:RD,border:`1px solid ${R}30`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:R,fontWeight:600}}>
              ⚠ {overdueTasks.length} tarea{overdueTasks.length!==1?"s":""} vencida{overdueTasks.length!==1?"s":""}
            </div>
          )}
          {tasks.length===0
            ?<EmptyState icon="✓" title="Sin tareas" subtitle="No hay tareas de CRM registradas."/>
            :<div style={{display:"flex",flexDirection:"column",gap:7}}>
              {tasks.map(t=>{
                const isOverdue=!t.done&&t.due_date&&new Date(t.due_date)<new Date();
                return(
                  <div key={t.id} style={{background:"var(--bg-surface)",border:`1px solid ${isOverdue?R:"var(--border)"}`,borderRadius:11,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,opacity:t.done?.6:1}}>
                    <input type="checkbox" checked={!!t.done} onChange={()=>toggleTask(t.id,t.done)}
                      style={{width:16,height:16,flexShrink:0,cursor:"pointer"}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text-primary)",textDecoration:t.done?"line-through":"none"}}>{t.title}</div>
                      <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>
                        {t.leads?.full_name&&<span style={{marginRight:8}}>👤 {t.leads.full_name}</span>}
                        {t.profiles?.full_name&&<span style={{marginRight:8}}>Asesor: {t.profiles.full_name}</span>}
                        {t.due_date&&<span style={{color:isOverdue?R:"var(--text-tertiary)"}}>
                          {isOverdue?"⚠ ":"📅 "}{new Date(t.due_date).toLocaleDateString("es-HN",{day:"2-digit",month:"short"})}
                        </span>}
                      </div>
                    </div>
                    {t.priority&&<span style={{fontSize:11,padding:"2px 7px",borderRadius:8,background:t.priority==="high"?RD:AD,color:t.priority==="high"?R:A,fontWeight:700}}>{t.priority==="high"?"Alta":"Media"}</span>}
                  </div>
                );
              })}
            </div>
          }
        </div>
      )}

      {/* PIPELINE Kanban */}
      {tab==="pipeline"&&(
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8}}>
          {STAGES.map(stage=>{
            const stagLeads=leads.filter(l=>l.stage===stage.id);
            return(
              <div key={stage.id} style={{minWidth:180,flexShrink:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"6px 10px",background:stage.bg,borderRadius:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:stage.color}}>{stage.label}</span>
                  <span style={{fontSize:11,background:"rgba(0,0,0,.1)",padding:"1px 6px",borderRadius:8,color:stage.color,fontWeight:700}}>{stagLeads.length}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {stagLeads.map(lead=>(
                    <div key={lead.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 11px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--text-primary)",marginBottom:2}}>{lead.full_name}</div>
                      <div style={{fontSize:11,color:"var(--text-secondary)"}}>{lead.source||"—"}</div>
                      {lead.test_score>0&&<div style={{fontSize:11,marginTop:3,color:lead.test_score>=70?G:A,fontWeight:600}}>Test: {lead.test_score}%</div>}
                      {stage.id!=="convertido"&&stage.id!=="perdido"&&(
                        <div style={{display:"flex",gap:3,marginTop:6}}>
                          {STAGES.filter(s=>s.id!==stage.id&&s.id!=="convertido").slice(0,2).map(s=>(
                            <button key={s.id} onClick={()=>changeStage(lead.id,s.id)}
                              style={{flex:1,fontSize:11,padding:"2px 4px",borderRadius:6,border:`1px solid ${s.color}`,background:s.bg,color:s.color,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {stagLeads.length===0&&<div style={{fontSize:11,color:"var(--text-tertiary)",textAlign:"center",padding:"12px 0"}}>—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
}
