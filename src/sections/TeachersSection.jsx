// ─── TeachersSection — Docentes para SuperAdmin ─────────────────
import { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { toast } from "../lib/toast.jsx";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { validateEmail, validateName, validatePhone } from "../lib/validators.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706";

export function TeachersSection({ showToast }) {
  const [teachers, setTeachers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // {mode:'add'|'view', data?}
  const [form,     setForm]     = useState({name:"",email:"",phone:"",levels:[],salary:""});
  const [saving,   setSaving]   = useState(false);

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from("staff")
      .select("id,salary,hire_date,active,profile:profiles(id,full_name,email,phone),teacher_groups(groups(id,level,schedule))")
      .eq("active",true).order("id");
    if(data) setTeachers(data.map(t=>({
      id:t.id, name:t.profile?.full_name||"—", email:t.profile?.email||"—",
      phone:t.profile?.phone||"—", salary:t.salary||0, hired:t.hire_date||"—",
      profileId:t.profile?.id,
      groups:t.teacher_groups?.map(tg=>`${tg.groups?.level} · ${tg.groups?.schedule}`)||[],
    })));
    setLoading(false);
  }

  async function addTeacher(){
    if(!form.name||!form.email){showToast("Nombre y email requeridos",R);return;}
    setSaving(true);
    try{
      await api.post("/api/auth",{action:"staff",email:form.email,fullName:form.name,role:"Docente",phone:form.phone||null,salary:form.salary||null});
      showToast("✓ Docente invitado — recibirá email para acceder");
      setModal(null);
      setForm({name:"",email:"",phone:"",levels:[],salary:""});
      await load();
    }catch(e){showToast("Error: "+(e.message||"Error de red"),R);}
    finally{setSaving(false);}
  }

  async function deactivate(t){
    const{error:t1}=await supabase.from("staff").update({active:false}).eq("id",t.id);
    const{error:t2}=await supabase.from("profiles").update({active:false}).eq("id",t.profileId);
    if(t1||t2){toast.error("Error al desactivar docente");return;}
    showToast("Docente desactivado");
    setModal(null);
    await load();
  }

  return(
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClick={()=>setModal({mode:"add"})} style={{padding:"8px 16px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
          <i className="ti ti-user-plus" style={{fontSize:14}}/> Agregar docente
        </button>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :teachers.length===0?<EmptyState icon="👩‍🏫" title="Sin docentes" subtitle="Invitá al primer docente con el botón arriba." actionLabel="+ Agregar docente" onAction={()=>setModal({mode:"add"})}/>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {teachers.map(t=>(
          <div key={t.id} onClick={()=>setModal({mode:"view",data:t})} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,cursor:"pointer"}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:PD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:P,flexShrink:0}}>
                {t.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</div>
                <div style={{fontSize:11,color:"var(--text-secondary)"}}>{t.email}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:8}}>
              {t.groups.length>0?t.groups.slice(0,2).join(" · ")+(t.groups.length>2?` +${t.groups.length-2}`:""):"Sin grupos asignados"}
            </div>
            {t.salary>0&&<div style={{fontSize:11,color:G,fontWeight:600}}>${t.salary}/mes</div>}
          </div>
        ))}
      </div>}

      {modal&&(
        <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,width:"min(420px, calc(100vw - 32px))",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)",maxHeight:"90vh",overflowY:"auto"}}>
            {modal.mode==="add"?(
              <>
                <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>Agregar docente</div>
                {[["Nombre completo *","name","text"],["Email *","email","email"],["Teléfono","phone","tel"],["Salario mensual (USD)","salary","number"]].map(([l,k,t])=>(
                  <div key={k} style={{marginBottom:12}}>
                    <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>{l}</div>
                    <input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                      style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:18}}>
                  <button onClick={()=>setModal(null)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
                  <button onClick={()=>addTeacher()} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                    {saving?"Invitando...":"Invitar docente"}
                  </button>
                </div>
              </>
            ):(
              <>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{modal.data?.name}</div>
                  <button onClick={()=>setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:"var(--text-tertiary)"}}>✕</button>
                </div>
                {[["Email",modal.data?.email],["Teléfono",modal.data?.phone||"—"],["Salario",modal.data?.salary>0?`$${modal.data.salary}/mes`:"—"],["Grupos",modal.data?.groups?.join(", ")||"Sin grupos"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                    <span style={{color:"var(--text-secondary)"}}>{k}</span>
                    <span style={{fontWeight:500,color:"var(--text-primary)",textAlign:"right",maxWidth:"60%"}}>{v}</span>
                  </div>
                ))}
                <button onClick={()=>deactivate(modal.data)} style={{width:"100%",marginTop:16,padding:"9px",background:RD,color:R,border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                  Desactivar docente
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
