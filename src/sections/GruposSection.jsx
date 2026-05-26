// ─── GruposSection — para SuperAdmin ────────────────────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const P="#155266",G="#059669",GD="#ecfdf5",R="#dc2626",A="#d97706";

export function GruposSection({ showToast }) {
  const [groups,   setGroups]   = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form,     setForm]     = useState({program_id:"en",level:"A1",schedule:"6:00 PM – 7:30 PM",days:"Lun · Mié · Vie",capacity:20});
  const [saving,   setSaving]   = useState(false);
  const [editTeams,setEditTeams]= useState(null);
  const [teamsUrl, setTeamsUrl] = useState("");

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data:grps}=await supabase.from("groups")
      .select("id,level,schedule,days,capacity,active_unit,program_id,teams_link,active,teacher_groups(teacher:staff(id,profile:profiles(full_name))),enrollments(id,status)").order("level");
    if(grps) setGroups(grps);
    const {data:st}=await supabase.from("staff").select("id,profile:profiles(full_name)").eq("active",true);
    if(st) setStaff(st);
    setLoading(false);
  }

  async function addGroup(){
    if(!form.schedule){showToast("Horario requerido",R);return;}
    setSaving(true);
    try{
      const {error}=await supabase.from("groups").insert({...form,active:true,active_unit:1});
      if(error) throw error;
      showToast("✓ Grupo creado");
      setAddModal(false);
      setForm({program_id:"en",level:"A1",schedule:"6:00 PM – 7:30 PM",days:"Lun · Mié · Vie",capacity:20});
      await load();
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setSaving(false);}
  }

  async function saveTeams(g){
    const {error}=await supabase.from("groups").update({teams_link:teamsUrl}).eq("id",g.id);
    if(error){showToast("Error: "+error.message,R);return;}
    showToast("✓ Link de Teams guardado");
    setGroups(gs=>gs.map(x=>x.id===g.id?{...x,teams_link:teamsUrl}:x));
    setEditTeams(null);
  }

  async function assignTeacher(groupId,staffId){
    if(!staffId) return;
    const {error}=await supabase.from("teacher_groups").upsert({teacher_id:staffId,group_id:groupId},{onConflict:"teacher_id,group_id"});
    if(error){showToast("Error: "+error.message,R);return;}
    showToast("✓ Docente asignado");
    await load();
  }

  async function toggleGroup(id,active){
    await supabase.from("groups").update({active:!active}).eq("id",id);
    showToast(!active?"Grupo activado":"Grupo desactivado");
    await load();
  }

  const LEVELS=["A1","A2","B1","B2","C1"];
  const PROGRAMS=[["en","Inglés"],["va","VA General"],["va_mkt","VA Mkt"],["va_legal","VA Legal"],["va_care","VA Care"]];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <button onClickCapture={e=>{e.stopPropagation();setAddModal(true);}} style={{padding:"9px 18px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
          <i className="ti ti-plus" style={{fontSize:14}}/> Nuevo grupo
        </button>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :groups.length===0?<EmptyState icon="👥" title="Sin grupos" subtitle="Creá el primer grupo de clases." actionLabel="+ Nuevo grupo" onAction={()=>setAddModal(true)}/>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {groups.map(g=>{
          const enrolled=g.enrollments?.filter(e=>e.status==="active").length||0;
          const teacher=g.teacher_groups?.[0]?.teacher?.profile?.full_name||null;
          const pct=Math.round((enrolled/(g.capacity||25))*100);
          const barColor=pct>=90?R:pct>=70?A:G;
          return(
            <div key={g.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,padding:16,opacity:g.active?1:0.6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{g.level} · {g.schedule}</div>
                  <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{g.days} · U{g.active_unit}</div>
                </div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:g.active?GD:"var(--bg-surface-subtle)",color:g.active?G:"var(--text-tertiary)",fontWeight:600}}>
                  {g.active?"Activo":"Inactivo"}
                </span>
              </div>

              {/* Capacity bar */}
              <div style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-secondary)",marginBottom:4}}>
                  <span>Capacidad</span>
                  <span style={{fontWeight:600,color:barColor}}>{enrolled}/{g.capacity}</span>
                </div>
                <div style={{height:6,borderRadius:3,background:"var(--bg-surface-subtle)",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:barColor}}/>
                </div>
              </div>

              {/* Teacher */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:4}}>Docente</div>
                <select defaultValue={g.teacher_groups?.[0]?.teacher?.id||""} onChange={e=>assignTeacher(g.id,e.target.value)}
                  style={{width:"100%",padding:"7px 10px",border:"1px solid var(--border)",borderRadius:8,fontSize:12,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                  <option value="">Sin asignar</option>
                  {staff.map(s=><option key={s.id} value={s.id}>{s.profile?.full_name}</option>)}
                </select>
              </div>

              {/* Teams link */}
              {editTeams===g.id?(
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  <input value={teamsUrl} onChange={e=>setTeamsUrl(e.target.value)} placeholder="https://teams.microsoft.com/..."
                    style={{flex:1,padding:"6px 10px",border:"1px solid var(--border)",borderRadius:7,fontSize:11,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                  <button onClickCapture={e=>{e.stopPropagation();saveTeams(g);}} style={{padding:"6px 12px",background:P,color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>setEditTeams(null)} style={{padding:"6px 10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                </div>
              ):(
                <div style={{display:"flex",gap:6,marginBottom:4}}>
                  {g.teams_link?(
                    <a href={g.teams_link} target="_blank" rel="noopener noreferrer"
                      style={{flex:1,fontSize:11,padding:"6px 10px",background:"#dbeafe",color:"#1d4ed8",borderRadius:7,textDecoration:"none",fontWeight:600,textAlign:"center"}}>▷ Abrir Teams</a>
                  ):(
                    <div style={{flex:1,fontSize:11,color:"var(--text-tertiary)",padding:"6px 0"}}>Sin link de Teams</div>
                  )}
                  <button onClick={()=>{setEditTeams(g.id);setTeamsUrl(g.teams_link||"");}} style={{padding:"6px 10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✎</button>
                </div>
              )}
              <button onClick={()=>toggleGroup(g.id,g.active)} style={{width:"100%",padding:"6px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>
                {g.active?"Desactivar grupo":"Activar grupo"}
              </button>
            </div>
          );
        })}
      </div>}

      {/* Add group modal */}
      {addModal&&(
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setAddModal(false);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:18,padding:24,width:"min(420px, calc(100vw - 32px))",maxWidth:"100%",width:"100%",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>Nuevo grupo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              {[["Programa","program_id","select",PROGRAMS],["Nivel","level","select",LEVELS.map(l=>[l,l])]].map(([l,k,t,opts])=>(
                <div key={k}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>{l}</div>
                  <select value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                    style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                    {opts.map(([v,n])=><option key={v} value={v}>{n}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {[["Horario *","schedule","text","6:00 PM – 7:30 PM"],["Días","days","text","Lun · Mié · Vie"]].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>{l}</div>
                <input type={t} value={form[k]} placeholder={ph} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Capacidad</div>
              <input type="number" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:+e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddModal(false)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClickCapture={e=>{e.stopPropagation();addGroup();}} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                {saving?"Creando...":"Crear grupo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
