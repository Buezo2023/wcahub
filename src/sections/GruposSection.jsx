// ─── GruposSection — para SuperAdmin ────────────────────────────
import { useState, useEffect } from "react";
import { toast } from "../lib/toast.jsx";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const P="#155266",G="#059669",GD="#ecfdf5",R="#dc2626",A="#d97706";

export function GruposSection({ showToast }) {
  const [groups,   setGroups]   = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form,     setForm]     = useState({program_id:"en",level:"A1",schedule:"6:00 PM – 7:30 PM",days:"Lun · Mié · Vie",days_arr:["mon","wed","fri"],capacity:20});
  const [saving,   setSaving]   = useState(false);
  const [editTeams,setEditTeams]= useState(null);
  const [teamsUrl, setTeamsUrl] = useState("");
  const [editUtc,  setEditUtc]  = useState(null);  // group id
  const [utcForm,  setUtcForm]  = useState({ schedule_utc:"", schedule_end_utc:"" });

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data:grps}=await supabase.from("groups")
      .select("id,level,schedule,schedule_utc,schedule_end_utc,days,capacity,active_unit,program_id,teams_link,active,teacher_groups(teacher:staff(id,profile:profiles(full_name))),enrollments(id,status)").order("level");
    if(grps) setGroups(grps);
    const {data:st}=await supabase.from("staff").select("id,profile:profiles(full_name)").eq("active",true);
    if(st) setStaff(st);
    setLoading(false);
  }

  async function addGroup(){
    if(!form.schedule){showToast("Horario requerido",R);return;}
    setSaving(true);
    try{
      // Check for duplicate schedule + same days
      const {data:existing}=await supabase.from("groups")
        .select("id,level,schedule")
        .eq("active",true)
        .eq("schedule",form.schedule)
        .eq("days",form.days);
      if(existing?.length){
        const names=existing.map(g=>`${g.level} (${g.schedule})`).join(", ");
        const go=window.confirm(`Ya existe un grupo activo con ese horario y días:\n${names}\n\n¿Crear de todas formas?`);
        if(!go){setSaving(false);return;}
      }
      const {error}=await supabase.from("groups").insert({...form,days_arr:form.days_arr||[],active:true,active_unit:1,schedule_utc:form.schedule_utc||null,schedule_end_utc:form.schedule_end_utc||null,schedule_timezone:"America/Tegucigalpa"});
      if(error) throw error;
      showToast("✓ Grupo creado");
      setAddModal(false);
      setForm({program_id:"en",level:"A1",schedule:"6:00 PM – 7:30 PM",days:"Lun · Mié · Vie",days_arr:["mon","wed","fri"],capacity:20});
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

  async function saveUtc(g){
    const {error}=await supabase.from("groups").update({
      schedule_utc:     utcForm.schedule_utc     || null,
      schedule_end_utc: utcForm.schedule_end_utc || null,
      schedule_timezone:"America/Tegucigalpa",
    }).eq("id",g.id);
    if(error){showToast("Error: "+error.message,R);return;}
    showToast("✓ Horario UTC guardado — recordatorios activados");
    setGroups(gs=>gs.map(x=>x.id===g.id?{...x,...utcForm}:x));
    setEditUtc(null);
  }

  async function assignTeacher(groupId,staffId){
    if(!staffId){
      // "Sin asignar" selected → remove ALL teachers from this group
      const {error}=await supabase.from("teacher_groups").delete().eq("group_id",groupId);
      if(error){showToast("Error: "+error.message,R);return;}
      showToast("Docente removido del grupo");
      await load();
      return;
    }
    // Remove existing teachers first, then assign the new one
    await supabase.from("teacher_groups").delete().eq("group_id",groupId);
    const {error}=await supabase.from("teacher_groups").insert({teacher_id:staffId,group_id:groupId});
    if(error){showToast("Error: "+error.message,R);return;}
    showToast("✓ Docente asignado");
    await load();
  }

  async function toggleGroup(id,active){
    const {error:grpErr}=await supabase.from("groups").update({active:!active}).eq("id",id);
    if(grpErr){toast.error("Error al cambiar estado del grupo");return;}
    showToast(!active?"Grupo activado":"Grupo desactivado");
    await load();
  }

  async function advanceUnit(id, currentUnit){
    const next = (currentUnit||1) + 1;
    if(next > 12){ showToast("El grupo ya está en la unidad máxima (12)","#d97706"); return; }
    const {error}=await supabase.from("groups").update({active_unit:next}).eq("id",id);
    if(error){ showToast("Error: "+error.message,R); return; }
    showToast(`✓ Grupo avanzado a Unidad ${next}`);
    setGroups(gs=>gs.map(x=>x.id===id?{...x,active_unit:next}:x));
  }

  const LEVELS=["A1","A2","B1","B2","C1"];
  const PROGRAMS=[["en","Inglés"],["va","VA General"],["va_mkt","VA Mkt"],["va_legal","VA Legal"],["va_care","VA Care"]];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClickCapture={e=>{e.stopPropagation();setAddModal(true);}} style={{padding:"8px 16px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
          <i className="ti ti-plus" style={{fontSize:14}} aria-hidden="true"/> Nuevo grupo
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
            <div key={g.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,opacity:g.active?1:0.6}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{g.level} · {g.schedule}</div>
                  <div style={{fontSize:11,color:"var(--text-secondary)",marginTop:2}}>{g.days} · U{g.active_unit}</div>
                </div>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:g.active?GD:"var(--bg-surface-subtle)",color:g.active?G:"var(--text-tertiary)",fontWeight:600}}>
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
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input value={teamsUrl} onChange={e=>setTeamsUrl(e.target.value)} placeholder="https://teams.microsoft.com/... o zoom.us/..."
                    style={{flex:1,padding:"6px 10px",border:"1px solid var(--border)",borderRadius:7,fontSize:11,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                  <button onClickCapture={e=>{e.stopPropagation();saveTeams(g);}} style={{padding:"6px 12px",background:P,color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>setEditTeams(null)} style={{padding:"6px 10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                </div>
              ):(
                <div style={{display:"flex",gap:8,marginBottom:4}}>
                  {g.teams_link?(()=>{
                    const url=g.teams_link||"";
                    const isZoom=url.includes("zoom.us");
                    const isMeet=url.includes("meet.google");
                    const label=isZoom?"Abrir Zoom":isMeet?"Abrir Meet":"Abrir clase virtual";
                    const bg=isZoom?"#e8f0ff":isMeet?"#e6f4ea":"#dbeafe";
                    const clr=isZoom?"#3b5bdb":isMeet?"#137333":"#1d4ed8";
                    return <a href={url} target="_blank" rel="noopener noreferrer"
                      style={{flex:1,fontSize:11,padding:"6px 10px",background:bg,color:clr,borderRadius:7,textDecoration:"none",fontWeight:600,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                      <i className={`ti ${isZoom?"ti-video":isMeet?"ti-brand-google":"ti-brand-teams"}`} style={{fontSize:13}} aria-hidden="true"/>
                      {label}
                    </a>;
                  })():(
                    <div style={{flex:1,fontSize:11,color:"var(--text-tertiary)",padding:"6px 0"}}>Sin link de clase virtual</div>
                  )}
                  <button onClick={()=>{setEditTeams(g.id);setTeamsUrl(g.teams_link||"");}} style={{padding:"6px 10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:7,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✎</button>
                </div>
              )}
              {/* UTC Schedule editor */}
              {editUtc===g.id ? (
                <div style={{marginBottom:8,background:"var(--bg-surface-subtle)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:6}}>🕐 Horario UTC (Honduras = UTC−6)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:6}}>
                    <div>
                      <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:3}}>Inicio UTC</div>
                      <input type="time" value={utcForm.schedule_utc}
                        onChange={e=>setUtcForm(f=>({...f,schedule_utc:e.target.value}))}
                        style={{width:"100%",padding:"6px 8px",border:"1px solid var(--border)",borderRadius:6,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:"var(--text-tertiary)",marginBottom:3}}>Fin UTC</div>
                      <input type="time" value={utcForm.schedule_end_utc}
                        onChange={e=>setUtcForm(f=>({...f,schedule_end_utc:e.target.value}))}
                        style={{width:"100%",padding:"6px 8px",border:"1px solid var(--border)",borderRadius:6,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                    </div>
                  </div>
                  <div style={{fontSize:10,color:"#155266",marginBottom:8}}>
                    Ej: 6:00 PM HN = 00:00 UTC · 7:00 AM HN = 13:00 UTC
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>saveUtc(g)} style={{flex:2,padding:"5px",background:"#155266",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>✓ Guardar</button>
                    <button onClick={()=>setEditUtc(null)} style={{flex:1,padding:"5px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                  </div>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{fontSize:11,color:g.schedule_utc?"var(--text-secondary)":"#dc2626",flex:1}}>
                    {g.schedule_utc
                      ? `🕐 UTC: ${g.schedule_utc?.slice(0,5)}${g.schedule_end_utc?"–"+g.schedule_end_utc.slice(0,5):""}`
                      : "⚠ Sin horario UTC — recordatorios inactivos"}
                  </span>
                  <button onClick={()=>{setEditUtc(g.id);setUtcForm({schedule_utc:g.schedule_utc?.slice(0,5)||"",schedule_end_utc:g.schedule_end_utc?.slice(0,5)||""}); }}
                    style={{padding:"3px 9px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:6,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>✎</button>
                </div>
              )}
              {g.active && (
                <div style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"var(--text-secondary)",flex:1}}>Unidad activa: <strong>{g.active_unit||1}</strong>/12</span>
                  <button onClick={()=>advanceUnit(g.id,g.active_unit)}
                    style={{padding:"5px 12px",background:P,color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                    <i className="ti ti-arrow-right" style={{fontSize:12}} aria-hidden="true"/>U{(g.active_unit||1)+1}
                  </button>
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
        <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setAddModal(false);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,width:"min(420px, calc(100vw - 32px))",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>Nuevo grupo</div>
            {/* Programa + Nivel (Nivel solo para programas de idiomas) */}
            <div style={{display:"grid",gridTemplateColumns:form.program_id==="en"?"1fr 1fr":"1fr",gap:8,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Programa</div>
                <select value={form.program_id}
                  onChange={e=>setForm(p=>({...p,program_id:e.target.value,
                    // Clear level when switching to non-language program
                    level: ["en"].includes(e.target.value) ? (p.level||"A1") : null
                  }))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                  {PROGRAMS.map(([v,n])=><option key={v} value={v}>{n}</option>)}
                </select>
              </div>
              {form.program_id==="en" && (
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Nivel CEFR</div>
                  <select value={form.level||"A1"} onChange={e=>setForm(p=>({...p,level:e.target.value}))}
                    style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                    {LEVELS.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Horario (texto) *</div>
              <input type="text" value={form.schedule} placeholder="6:00 PM – 7:30 PM" onChange={e=>setForm(p=>({...p,schedule:e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              <div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:4}}>Texto visible en el admin</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>🕐 Inicio (UTC)</div>
                <input type="time" value={form.schedule_utc||""} onChange={e=>setForm(p=>({...p,schedule_utc:e.target.value}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>🕐 Fin (UTC)</div>
                <input type="time" value={form.schedule_end_utc||""} onChange={e=>setForm(p=>({...p,schedule_end_utc:e.target.value}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            </div>
            <div style={{background:"#e8f3f6",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#155266",marginBottom:12}}>
              💡 Honduras = UTC−6. Si la clase es a las 6:00 PM HN, ingresá 00:00 UTC. Si es a las 7:00 AM HN → 13:00 UTC.
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:6}}>Días</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["mon","Lun"],["tue","Mar"],["wed","Mié"],["thu","Jue"],["fri","Vie"],["sat","Sáb"]].map(([k,l])=>{
                  const selected=(form.days_arr||[]).includes(k);
                  return(
                    <button key={k} type="button"
                      onClick={()=>setForm(p=>{
                        const arr=p.days_arr||[];
                        const next=arr.includes(k)?arr.filter(d=>d!==k):[...arr,k];
                        const labels={mon:"Lun",tue:"Mar",wed:"Mié",thu:"Jue",fri:"Vie",sat:"Sáb"};
                        const days=["mon","tue","wed","thu","fri","sat"].filter(d=>next.includes(d)).map(d=>labels[d]).join(" · ");
                        return {...p,days_arr:next,days:days||"Sin días"};
                      })}
                      style={{padding:"6px 12px",borderRadius:7,border:`1px solid ${selected?"#155266":"var(--border)"}`,
                        background:selected?"#e8f3f6":"var(--bg-surface-subtle)",
                        color:selected?"#155266":"var(--text-secondary)",fontSize:12,fontWeight:selected?600:400,
                        cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                      {l}
                    </button>
                  );
                })}
              </div>
              {(form.days_arr||[]).length===0 && <div style={{fontSize:11,color:"#dc2626",marginTop:4}}>Seleccioná al menos un día</div>}
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Capacidad</div>
              <input type="number" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:+e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              <div style={{fontSize:11,color:"var(--text-tertiary)",marginTop:4}}>Máx. de estudiantes por grupo. Ej: 15</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddModal(false)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClickCapture={e=>{e.stopPropagation();addGroup();}} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                {saving?"Creando...":"Crear grupo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
