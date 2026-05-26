// ─── B2BSection — Empresas B2B para SuperAdmin ──────────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706";
const PROGRAMS=[
  {id:"en",   name:"Inglés Completo",        price:95},
  {id:"va",   name:"Asistente Virtual",      price:95},
  {id:"va_mkt",  name:"VA · Marketing Digital", price:110},
  {id:"va_legal",name:"VA · Legal Assistant",   price:110},
  {id:"va_care", name:"VA · Cuidador Remoto",   price:110},
];

function Kpi({label,value,color,icon}){
  return(
    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8}}>
      <i className={`ti ${icon}`} style={{fontSize:22,color}}/>
      <div><div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",lineHeight:1}}>{value}</div>
        <div style={{fontSize:11,color:"var(--text-secondary)"}}>{label}</div></div>
    </div>
  );
}

const EMPTY_FORM = {name:"",contact_name:"",contact_email:"",contact_phone:"",seats_paid:1,discount_pct:0,program_id:"en",notes:""};

export function B2BSection({ showToast }) {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);  // null | {mode:'add'|'edit', data?}
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data,error}=await supabase.from("b2b_companies")
      .select("*").eq("active",true).order("name");
    if(error) showToast("Error cargando empresas: "+error.message,R);
    else setCompanies(data||[]);
    setLoading(false);
  }

  function openAdd(){
    setForm(EMPTY_FORM);
    setModal({mode:"add"});
  }
  function openEdit(c){
    setForm({
      name:          c.name||"",
      contact_name:  c.contact_name||"",
      contact_email: c.contact_email||"",
      contact_phone: c.contact_phone||"",
      seats_paid:    c.seats_paid||1,
      discount_pct:  c.discount_pct||0,
      program_id:    c.program_id||"en",
      notes:         c.notes||"",
    });
    setModal({mode:"edit",data:c});
  }

  async function save(){
    if(!form.name.trim()||!form.contact_email.trim()){
      showToast("Nombre y email de contacto son requeridos",R);
      return;
    }
    setSaving(true);
    try{
      const prog = PROGRAMS.find(p=>p.id===form.program_id)||PROGRAMS[0];
      const payload = {
        name:          form.name.trim(),
        contact_name:  form.contact_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        seats_paid:    Number(form.seats_paid)||1,
        discount_pct:  Number(form.discount_pct)||0,
        program_id:    form.program_id,
        program_name:  prog.name,
        notes:         form.notes.trim(),
        active:        true,
      };

      let error;
      if(modal?.mode==="edit"&&modal.data?.id){
        ({error} = await supabase.from("b2b_companies").update(payload).eq("id",modal.data.id));
      } else {
        ({error} = await supabase.from("b2b_companies").insert(payload));
      }

      if(error) throw error;
      showToast(modal?.mode==="edit"?"✓ Empresa actualizada":"✓ Empresa B2B creada");
      setModal(null);
      await load();
    }catch(e){
      showToast("Error: "+e.message,R);
    }finally{
      setSaving(false);
    }
  }

  async function deactivate(id){
    const {error}=await supabase.from("b2b_companies").update({active:false}).eq("id",id);
    if(error){showToast("Error: "+error.message,R);return;}
    showToast("Empresa desactivada");
    setModal(null);
    await load();
  }

  const monthly = (c)=>{
    const prog = PROGRAMS.find(p=>p.id===c.program_id)||{price:95};
    return Math.round((c.seats_paid||1)*prog.price*(1-((c.discount_pct||0)/100)));
  };
  const totalRevenue = companies.reduce((a,c)=>a+monthly(c),0);
  const totalSeats   = companies.reduce((a,c)=>a+(c.seats_paid||0),0);

  return(
    <div>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:16}}>
        <Kpi label="Empresas activas" value={companies.length} color={P} icon="ti-building"/>
        <Kpi label="Cupos B2B"        value={totalSeats}       color={G} icon="ti-users"/>
        <Kpi label="Ingresos/mes"     value={`$${totalRevenue.toLocaleString()}`} color={A} icon="ti-coin"/>
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>exportCSV(companies.map(c=>({
          Empresa:c.name, Contacto:c.contact_name, Email:c.contact_email,
          Programa:c.program_name||c.program_id, Cupos:c.seats_paid,
          Descuento:`${c.discount_pct||0}%`, Factura:`$${monthly(c)}/mes`
        })),`b2b-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{padding:"7px 14px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>
          <i className="ti ti-download"/> CSV
        </button>
        <button onClickCapture={e=>{e.stopPropagation();openAdd();}}
          style={{padding:"8px 16px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          + Nueva empresa
        </button>
      </div>

      {/* List */}
      {loading
        ?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
        :companies.length===0
          ?<EmptyState icon="🏢" title="Sin empresas B2B" subtitle="Agregá la primera empresa con el botón arriba."/>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {companies.map(c=>(
              <div key={c.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{c.name}</div>
                    <div style={{fontSize:12,color:"var(--text-secondary)"}}>{c.contact_name} · {c.contact_email}</div>
                    <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:PD,color:P,fontWeight:600}}>
                        {c.program_name||c.program_id?.toUpperCase()||"—"}
                      </span>
                      {(c.discount_pct||0)>0&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"#fffbeb",color:A,fontWeight:600}}>
                        {c.discount_pct}% desc.
                      </span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                    <div style={{fontSize:18,fontWeight:800,color:P}}>${monthly(c)}/mes</div>
                    <div style={{fontSize:11,color:"var(--text-secondary)"}}>{c.seats_paid} cupos</div>
                  </div>
                </div>
                {c.notes&&<div style={{fontSize:11,color:"var(--text-secondary)",background:"var(--bg-surface-subtle)",borderRadius:8,padding:"6px 10px",marginBottom:8}}>{c.notes}</div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClickCapture={e=>{e.stopPropagation();openEdit(c);}}
                    style={{flex:1,fontSize:12,padding:"6px",background:PD,color:P,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✎ Editar</button>
                  <button onClick={()=>exportCSV([{Empresa:c.name,Programa:c.program_name,Cupos:c.seats_paid,Factura:`$${monthly(c)}`}],`factura-${c.name}.csv`)}
                    style={{flex:1,fontSize:12,padding:"6px",background:"var(--bg-surface-subtle)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",fontFamily:"inherit"}}>↓ Factura</button>
                </div>
              </div>
            ))}
          </div>
      }

      {/* Modal */}
      {modal&&(
        <div style={{position:"fixed",inset:0,zIndex:"var(--z-modal)",background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,width:"min(460px,100vw - 32px)",maxWidth:"100%",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>
              {modal.mode==="edit"?"Editar empresa B2B":"Nueva empresa B2B"}
            </div>

            {/* Programa — prominente al inicio */}
            <div style={{marginBottom:12,background:PD,border:`1px solid ${P}30`,borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontSize:11,fontWeight:700,color:P,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Programa al que se matricula el equipo</div>
              <select value={form.program_id} onChange={e=>setForm(f=>({...f,program_id:e.target.value}))}
                style={{width:"100%",padding:"8px 12px",border:`1px solid ${P}40`,borderRadius:8,fontSize:13,fontWeight:600,background:"white",color:P,fontFamily:"inherit"}}>
                {PROGRAMS.map(p=><option key={p.id} value={p.id}>{p.name} — ${p.price}/cupo/mes</option>)}
              </select>
            </div>

            {[
              ["Nombre empresa *","name","text","World Corp HN"],
              ["Nombre contacto","contact_name","text","Ana García"],
              ["Email contacto *","contact_email","email","ana@worldcorp.com"],
              ["Teléfono","contact_phone","tel","+504 9999-9999"],
            ].map(([l,k,t,ph])=>(
              <div key={k} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>{l}</div>
                <input type={t} value={form[k]||""} placeholder={ph} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            ))}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Cupos pagados</div>
                <input type="number" min="1" value={form.seats_paid} onChange={e=>setForm(f=>({...f,seats_paid:Math.max(1,+e.target.value)}))}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Descuento (%)</div>
                <input type="number" min="0" max="100" value={form.discount_pct} onChange={e=>setForm(f=>({...f,discount_pct:Math.min(100,Math.max(0,+e.target.value))}))}
                  style={{width:"100%",padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            </div>

            {/* Price preview */}
            {(()=>{
              const prog=PROGRAMS.find(p=>p.id===form.program_id)||{price:95};
              const mo=Math.round((form.seats_paid||1)*prog.price*(1-((form.discount_pct||0)/100)));
              return<div style={{background:GD,border:`1px solid ${G}40`,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:13,color:G,fontWeight:700}}>
                Factura estimada: ${mo}/mes · {form.seats_paid} cupos · {form.program_id?.toUpperCase()}
              </div>;
            })()}

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>Notas</div>
              <textarea value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2}
                style={{width:"100%",padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit",resize:"none"}}/>
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              {modal.mode==="edit"&&modal.data?.id&&(
                <button onClickCapture={e=>{e.stopPropagation();deactivate(modal.data.id);}}
                  style={{padding:"10px 14px",background:R,color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Eliminar</button>
              )}
              <button onClickCapture={e=>{e.stopPropagation();save();}} disabled={saving}
                style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                {saving?"Guardando...":"Guardar empresa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
