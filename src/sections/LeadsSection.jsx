// ─── LeadsSection — CRM para SuperAdmin ─────────────────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706";

const STAGES=[
  {id:"nuevo",label:"Nuevo",color:"#64748b",bg:"#f1f5f9"},
  {id:"contactado",label:"Contactado",color:P,bg:PD},
  {id:"test",label:"Test enviado",color:"#7c3aed",bg:"#ede9fe"},
  {id:"propuesta",label:"Propuesta",color:A,bg:"#fffbeb"},
  {id:"convertido",label:"Convertido",color:G,bg:GD},
  {id:"perdido",label:"Perdido",color:R,bg:RD},
];

export function LeadsSection({ showToast }) {
  const [leads,  setLeads]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [sel,    setSel]    = useState(null);
  const [addModal,setAddModal]=useState(false);
  const [form,   setForm]   = useState({full_name:"",email:"",phone:"",source:"",notes:""});
  const [saving, setSaving] = useState(false);
  const [view,   setView]   = useState("pipeline");

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from("leads").select("*").order("created_at",{ascending:false}).limit(200);
    if(data) setLeads(data);
    setLoading(false);
  }

  async function changeStage(id,stage){
    await supabase.from("leads").update({stage,updated_at:new Date().toISOString()}).eq("id",id);
    setLeads(ls=>ls.map(l=>l.id===id?{...l,stage}:l));
    if(sel?.id===id) setSel(l=>({...l,stage}));
  }

  async function addLead(){
    if(!form.full_name||!form.email){showToast("Nombre y email requeridos",R);return;}
    setSaving(true);
    try{
      const {error}=await supabase.from("leads").insert({...form,stage:"nuevo"});
      if(error) throw error;
      showToast("✓ Lead agregado");
      setAddModal(false);
      setForm({full_name:"",email:"",phone:"",source:"",notes:""});
      await load();
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setSaving(false);}
  }

  async function convertLead(lead){
    if(!lead) return;
    showToast("Creando estudiante...");
    try{
      const {data:{session}}=await supabase.auth.getSession();
      const res=await fetch("/api/auth/invite",{method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
        body:JSON.stringify({action:"student",email:lead.email,fullName:lead.full_name,phone:lead.phone||null,level:lead.level_interest||"A1",programId:"en"})});
      const json=await res.json().catch(()=>({}));
      if(!res.ok||!json.ok){showToast("Error: "+(json.error||json.message),R);return;}
      await changeStage(lead.id,"convertido");
      showToast(`🎉 ${lead.full_name} matriculado — invitación enviada`);
      setSel(null);
    }catch(e){showToast("Error de red",R);}
  }

  const byStage = (sid)=>leads.filter(l=>l.stage===sid);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:14}}>
        {[
          {label:"Total leads",value:leads.length,color:P},
          {label:"Activos",value:leads.filter(l=>!["convertido","perdido"].includes(l.stage)).length,color:A},
          {label:"Convertidos",value:leads.filter(l=>l.stage==="convertido").length,color:G},
          {label:"Perdidos",value:leads.filter(l=>l.stage==="perdido").length,color:R},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:s.color}}>{s.value}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4}}>
          {[["pipeline","Pipeline"],["list","Lista"]].map(([id,l])=>(
            <button key={id} onClick={()=>setView(id)} style={{padding:"7px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:view===id?P:"var(--bg-surface-subtle)",color:view===id?"#fff":"var(--text-secondary)"}}>{l}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto"}}>
          <button onClickCapture={e=>{e.stopPropagation();setAddModal(true);}} style={{padding:"7px 16px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            <i className="ti ti-plus" style={{fontSize:13}}/> Nuevo lead
          </button>
        </div>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :leads.length===0?<EmptyState icon="💼" title="Sin leads" subtitle="Los leads del placement test aparecen aquí automáticamente." actionLabel="+ Nuevo lead" onAction={()=>setAddModal(true)}/>
      :view==="pipeline"?(
        <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8}}>
          {STAGES.map(stage=>{
            const stagLeads=byStage(stage.id);
            return(
              <div key={stage.id} style={{minWidth:180,flexShrink:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"6px 10px",background:stage.bg,borderRadius:8}}>
                  <span style={{fontSize:11,fontWeight:700,color:stage.color}}>{stage.label}</span>
                  <span style={{fontSize:10,background:"rgba(0,0,0,.1)",padding:"1px 6px",borderRadius:9,color:stage.color,fontWeight:700}}>{stagLeads.length}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {stagLeads.map(lead=>(
                    <div key={lead.id} onClick={()=>setSel(sel?.id===lead.id?null:lead)}
                      style={{background:"var(--bg-surface)",border:`1px solid ${sel?.id===lead.id?stage.color:"var(--border)"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                      <div style={{fontSize:12,fontWeight:600,color:"var(--text-primary)"}}>{lead.full_name}</div>
                      <div style={{fontSize:10,color:"var(--text-secondary)",marginTop:2}}>{lead.email}</div>
                      {lead.test_score>0&&<div style={{fontSize:10,marginTop:4,color:lead.test_score>=70?"#059669":"#d97706",fontWeight:600}}>Test: {lead.test_score}%</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ):(
        <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"var(--bg-surface-subtle)"}}>
                {["Nombre","Email","Stage","Test","Fuente",""].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {leads.map(l=>{
                  const st=STAGES.find(s=>s.id===l.stage)||STAGES[0];
                  return(
                    <tr key={l.id} onClick={()=>setSel(sel?.id===l.id?null:l)} style={{borderTop:"1px solid var(--border-tertiary)",cursor:"pointer",background:sel?.id===l.id?"var(--bg-surface-subtle)":"transparent"}}>
                      <td style={{padding:"10px 12px",fontWeight:600,color:"var(--text-primary)"}}>{l.full_name}</td>
                      <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-secondary)"}}>{l.email}</td>
                      <td style={{padding:"10px 12px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:st.bg,color:st.color,fontWeight:600}}>{st.label}</span></td>
                      <td style={{padding:"10px 12px",fontSize:12,color:l.test_score>=70?"#059669":l.test_score>0?"#d97706":"var(--text-tertiary)",fontWeight:l.test_score>0?600:400}}>{l.test_score>0?`${l.test_score}%`:"—"}</td>
                      <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-secondary)"}}>{l.source||"—"}</td>
                      <td style={{padding:"10px 12px"}}><i className="ti ti-chevron-right" style={{color:"var(--text-tertiary)",fontSize:14}}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead detail panel */}
      {sel&&(
        <div style={{position:"fixed",top:80,right:20,zIndex:9500,width:280,background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:14,padding:16,boxShadow:"0 8px 32px rgba(0,0,0,.15)",maxHeight:"80vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:14,color:"var(--text-primary)"}}>{sel.full_name}</div>
            <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--text-tertiary)"}}>✕</button>
          </div>
          {[["Email",sel.email||"—"],["Teléfono",sel.phone||"—"],["Fuente",sel.source||"—"],["Nivel detectado",sel.level_interest||"—"],["Test score",sel.test_score>0?`${sel.test_score}%`:"—"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid var(--border-tertiary)"}}>
              <span style={{color:"var(--text-secondary)"}}>{k}</span>
              <span style={{fontWeight:500,color:"var(--text-primary)"}}>{v}</span>
            </div>
          ))}
          {sel.notes&&<div style={{marginTop:10,fontSize:11,color:"var(--text-secondary)",background:"var(--bg-surface-subtle)",borderRadius:8,padding:"8px 10px"}}>{sel.notes}</div>}
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:2}}>Mover a stage:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {STAGES.filter(s=>s.id!==sel.stage&&s.id!=="convertido").map(s=>(
                <button key={s.id} onClick={()=>changeStage(sel.id,s.id)} style={{fontSize:10,padding:"3px 8px",borderRadius:8,border:`1px solid ${s.color}`,background:s.bg,color:s.color,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{s.label}</button>
              ))}
            </div>
            {sel.stage!=="convertido"&&sel.stage!=="perdido"&&(
              <button onClickCapture={e=>{e.stopPropagation();convertLead(sel);}} style={{marginTop:4,padding:"8px",background:GD,color:G,border:`1px solid ${G}40`,borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                🎉 Convertir y matricular
              </button>
            )}
            <button onClickCapture={e=>{e.stopPropagation();changeStage(sel.id,"perdido");setSel(null);}} style={{padding:"8px",background:RD,color:R,border:"none",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              Marcar como perdido
            </button>
          </div>
        </div>
      )}

      {/* Add lead modal */}
      {addModal&&(
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setAddModal(false);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:18,padding:24,width:400,maxWidth:"100%",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>Nuevo lead</div>
            {[["Nombre *","full_name","text"],["Email *","email","email"],["Teléfono","phone","tel"],["Fuente","source","text"]].map(([l,k,t])=>(
              <div key={k} style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>{l}</div>
                <input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Notas</div>
              <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:9,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",resize:"none"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setAddModal(false)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClickCapture={e=>{e.stopPropagation();addLead();}} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                {saving?"Guardando...":"Agregar lead"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
