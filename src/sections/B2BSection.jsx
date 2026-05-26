// ─── B2BSection — Empresas B2B para SuperAdmin ──────────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",A="#d97706";

export function B2BSection({ showToast }) {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [form,      setForm]      = useState({name:"",contact_name:"",contact_email:"",contact_phone:"",seats_paid:1,discount_pct:0,notes:""});
  const [saving,    setSaving]    = useState(false);

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from("b2b_companies")
      .select("*").eq("active",true).order("name");
    if(data) setCompanies(data);
    setLoading(false);
  }

  async function save(){
    if(!form.name||!form.contact_email){showToast("Nombre y email de contacto requeridos",R);return;}
    setSaving(true);
    try{
      const {error}=modal?.data
        ? await supabase.from("b2b_companies").update(form).eq("id",modal.data.id)
        : await supabase.from("b2b_companies").insert({...form,active:true});
      if(error) throw error;
      showToast(modal?.data?"✓ Empresa actualizada":"✓ Empresa B2B creada");
      setModal(null);
      setForm({name:"",contact_name:"",contact_email:"",contact_phone:"",seats_paid:1,discount_pct:0,notes:""});
      await load();
    }catch(e){showToast("Error: "+e.message,R);}
    finally{setSaving(false);}
  }

  async function deactivate(id){
    await supabase.from("b2b_companies").update({active:false}).eq("id",id);
    showToast("Empresa desactivada");
    setModal(null);
    await load();
  }

  const totalRevenue = companies.reduce((a,c)=>a+Math.round((c.seats_paid||1)*95*(1-((c.discount_pct||0)/100))),0);
  const totalSeats   = companies.reduce((a,c)=>a+(c.seats_paid||0),0);

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        {[
          {l:"Empresas activas",v:companies.length,c:P,i:"ti-building"},
          {l:"Cupos B2B",v:totalSeats,c:G,i:"ti-users"},
          {l:"Ingresos B2B/mes",v:`$${totalRevenue.toLocaleString()}`,c:A,i:"ti-coin"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
            <i className={`ti ${s.i}`} style={{fontSize:22,color:s.c}}/>
            <div><div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",lineHeight:1}}>{s.v}</div><div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.l}</div></div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <button onClick={()=>exportCSV(companies.map(c=>({Empresa:c.name,Contacto:c.contact_name,Email:c.contact_email,Cupos:c.seats_paid,Descuento:`${c.discount_pct||0}%`,Factura:`$${Math.round((c.seats_paid||1)*95*(1-(c.discount_pct||0)/100))}/mes`})),`b2b-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{padding:"7px 14px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>
          <i className="ti ti-download"/> CSV
        </button>
        <button onClickCapture={e=>{e.stopPropagation();setForm({name:"",contact_name:"",contact_email:"",contact_phone:"",seats_paid:1,discount_pct:0,notes:""});setModal({mode:"add"});}} style={{padding:"9px 18px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
          + Nueva empresa
        </button>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :companies.length===0?<EmptyState icon="🏢" title="Sin empresas B2B" subtitle="Agregá la primera empresa con el botón arriba."/>
      :<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {companies.map(c=>{
          const monthly=Math.round((c.seats_paid||1)*95*(1-((c.discount_pct||0)/100)));
          return(
            <div key={c.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>{c.name}</div>
                  <div style={{fontSize:12,color:"var(--text-secondary)"}}>{c.contact_name} · {c.contact_email}</div>
                  {c.discount_pct>0&&<div style={{fontSize:11,color:A,marginTop:2}}>✓ Descuento B2B: {c.discount_pct}%</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:800,color:P}}>${monthly}/mes</div>
                  <div style={{fontSize:11,color:"var(--text-secondary)"}}>{c.seats_paid} cupos</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClickCapture={e=>{e.stopPropagation();setForm({...c});setModal({mode:"edit",data:c});}} style={{flex:1,fontSize:12,padding:"6px",background:PD,color:P,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✎ Editar</button>
                <button onClick={()=>exportCSV([{Empresa:c.name,Contacto:c.contact_name,Email:c.contact_email,Cupos:c.seats_paid,Factura:`$${monthly}`}],`factura-${c.name}-${new Date().toISOString().slice(0,7)}.csv`)} style={{flex:1,fontSize:12,padding:"6px",background:"var(--bg-surface-subtle)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:7,cursor:"pointer",fontFamily:"inherit"}}>↓ Factura</button>
              </div>
            </div>
          );
        })}
      </div>}

      {modal&&(
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setModal(null);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:18,padding:24,width:440,maxWidth:"100%",width:"100%",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>{modal.mode==="edit"?"Editar empresa":"Nueva empresa B2B"}</div>
            {[["Nombre empresa *","name","text"],["Nombre contacto","contact_name","text"],["Email contacto *","contact_email","email"],["Teléfono","contact_phone","tel"]].map(([l,k,t])=>(
              <div key={k} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>{l}</div>
                <input type={t} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              {[["Cupos pagados","seats_paid","number"],["Descuento (%)","discount_pct","number"]].map(([l,k,t])=>(
                <div key={k}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:4}}>{l}</div>
                  <input type={t} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:+e.target.value}))}
                    style={{width:"100%",padding:"9px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            {form.seats_paid>0&&<div style={{fontSize:12,color:G,fontWeight:600,marginBottom:12}}>Factura estimada: ${Math.round((form.seats_paid||1)*95*(1-((form.discount_pct||0)/100)))}/mes</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setModal(null)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              {modal.data&&<button onClickCapture={e=>{e.stopPropagation();deactivate(modal.data.id);}} style={{padding:"10px 14px",background:R,color:"#fff",border:"none",borderRadius:9,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Eliminar</button>}
              <button onClickCapture={e=>{e.stopPropagation();save();}} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                {saving?"Guardando...":"Guardar empresa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
