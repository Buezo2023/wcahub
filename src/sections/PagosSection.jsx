// ─── PagosSection — para SuperAdmin ────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { api } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { exportCSV } from "../lib/exportCSV.js";

const P="#155266",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706",AD="#fffbeb";

export function PagosSection({ showToast, initialTab }) {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState(initialTab==="register"?"pending":"pending");
  const [regModal, setRegModal] = useState(false);
  const [form,     setForm]     = useState({studentId:"",enrollmentId:"",amount:95,method:"transfer",bank:"",referenceCode:"",notes:""});
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");

  useEffect(()=>{load();},[]);

  async function load() {
    setLoading(true);
    try {
      const {data:pays} = await supabase.from("payments")
        .select("id,amount,method,status,reference_code,bank,created_at,confirmed_at,period_start,proof_url,student:students(id,profile:profiles(full_name,email)),enrollment:enrollments(program_id)")
        .order("created_at",{ascending:false}).limit(100);
      if (pays) setPayments(pays);
      const {data:sts} = await supabase.from("students")
        .select("id,level,profile:profiles(full_name,email),enrollments(id,program_id,status,price_locked)").limit(200);
      if (sts) setStudents(sts.filter(s=>s.enrollments?.some(e=>e.status==="active")));
    } finally { setLoading(false); }
  }

  const pending  = useMemo(()=>payments.filter(p=>p.status==="pending"),[payments]);
  const confirmed= useMemo(()=>payments.filter(p=>p.status==="confirmed"),[payments]);
  const filtered = useMemo(()=>{
    const base = tab==="pending"?pending:tab==="confirmed"?confirmed:payments;
    if (!search) return base;
    const s=search.toLowerCase();
    return base.filter(p=>(p.student?.profile?.full_name||"").toLowerCase().includes(s)||(p.reference_code||"").toLowerCase().includes(s));
  },[tab,pending,confirmed,payments,search]);

  async function confirm(id) {
    try {
      await api.patch("/api/payments",{paymentId:id,action:"confirm"});
      showToast("✓ Pago confirmado — email enviado al estudiante");
      await load();
    } catch(e) { showToast("Error: "+(e.message||""), R); }
  }

  async function reject(id) {
    try {
      await api.patch("/api/payments",{paymentId:id,action:"reject",reason:"Rechazado por admin"});
      showToast("Pago rechazado");
      await load();
    } catch(e) { showToast("Error: "+(e.message||""), R); }
  }

  async function register() {
    if (!form.studentId||!form.amount) { showToast("Estudiante y monto requeridos", R); return; }
    setSaving(true);
    try {
      await api.post("/api/payments",{...form,autoConfirm:false});
      showToast("✓ Pago registrado — pendiente de confirmación");
      setRegModal(false);
      setForm({studentId:"",enrollmentId:"",amount:95,method:"transfer",bank:"",referenceCode:"",notes:""});
      await load();
    } catch(e){showToast("Error: "+(e.message||"Error de red"),R);}
    finally{setSaving(false);}
  }

  const statusColor = s=>s==="confirmed"?[GD,G]:s==="pending"?[AD,A]:[RD,R];
  const statusLabel = s=>({confirmed:"✓ Confirmado",pending:"⏳ Pendiente",failed:"✗ Rechazado"}[s]||s);

  return (
    <div>
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:16}}>
        {[
          {label:"Pendientes",value:pending.length,color:A,icon:"ti-clock"},
          {label:"Confirmados",value:confirmed.length,color:G,icon:"ti-check"},
          {label:"Total cobrado",value:`$${confirmed.reduce((s,p)=>s+(p.amount||0),0).toLocaleString()}`,color:P,icon:"ti-coin"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:36,height:36,borderRadius:8,background:`${s.color}14`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <i className={`ti ${s.icon}`} style={{fontSize:16,color:s.color}}/>
            </div>
            <div><div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:11,color:"var(--text-secondary)"}}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:4}}>
          {[["pending","Pendientes"],["confirmed","Confirmados"],["all","Todos"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"7px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:tab===id?P:"var(--bg-surface-subtle)",color:tab===id?"#fff":"var(--text-secondary)"}}>
              {label}{id==="pending"&&pending.length>0?` (${pending.length})`:""}
            </button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar pago..."
          style={{flex:1,minWidth:140,padding:"7px 11px",border:"1px solid var(--border)",borderRadius:8,fontSize:12,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
        <button onClick={()=>exportCSV(filtered.map(p=>({Estudiante:p.student?.profile?.full_name||"—",Monto:`$${p.amount}`,Método:p.method,Estado:p.status,Referencia:p.reference_code||"—",Fecha:new Date(p.created_at).toLocaleDateString("es-HN")})),`pagos-${new Date().toISOString().slice(0,10)}.csv`)}
          style={{padding:"7px 12px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>
          <i className="ti ti-download"/>
        </button>
        <button onClickCapture={e=>{e.stopPropagation();setRegModal(true);}}
          style={{padding:"7px 16px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
          <i className="ti ti-plus" style={{fontSize:13}}/> Registrar pago
        </button>
      </div>

      {/* List */}
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        {loading ? <div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
        : filtered.length===0 ? <EmptyState icon="💳" title="Sin pagos" subtitle="Aquí aparecen los pagos pendientes de confirmar."/>
        : <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"var(--bg-surface-subtle)"}}>
              {["Estudiante","Monto","Método","Estado","Fecha","Acciones"].map(h=>(
                <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(p=>{
                const [bg,color]=statusColor(p.status);
                return (
                  <tr key={p.id} onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}
              style={{borderTop:"1px solid var(--border-tertiary)",transition:"background .1s"}}>
                    <td style={{padding:"10px 12px"}}>
                      <div style={{fontWeight:600,color:"var(--text-primary)"}}>{p.student?.profile?.full_name||"—"}</div>
                      <div style={{fontSize:11,color:"var(--text-secondary)"}}>{p.enrollment?.program_id?.toUpperCase()||"—"}</div>
                    </td>
                    <td style={{padding:"10px 12px",fontWeight:700,color:"var(--text-primary)"}}>${p.amount}</td>
                    <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-secondary)",textTransform:"capitalize"}}>{p.method}</td>
                    <td style={{padding:"10px 12px"}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:bg,color,fontWeight:600}}>{statusLabel(p.status)}</span></td>
                    <td style={{padding:"10px 12px",fontSize:11,color:"var(--text-secondary)"}}>{new Date(p.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short"})}</td>
                    <td style={{padding:"10px 12px"}}>
                      {p.status==="pending"&&<div style={{display:"flex",gap:4}}>
                        <button onClickCapture={e=>{e.stopPropagation();confirm(p.id);}} style={{fontSize:11,padding:"4px 10px",background:GD,color:G,border:`1px solid ${G}40`,borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✓ Confirmar</button>
                        <button onClickCapture={e=>{e.stopPropagation();reject(p.id);}} style={{fontSize:11,padding:"4px 10px",background:RD,color:R,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✗</button>
                      </div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>}
      </div>

      {/* Register modal */}
      {regModal&&(
        <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setRegModal(false);}}>
          <div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,width:"min(420px, calc(100vw - 32px))",border:"1px solid var(--border)",boxShadow:"0 20px 60px rgba(0,0,0,.15)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:18}}>Registrar pago</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Estudiante *</div>
              <select value={form.studentId} onChange={e=>{
                const s=students.find(x=>x.id===e.target.value);
                const en=s?.enrollments?.find(x=>x.status==="active");
                // Auto-fill locked price (respects scholarship=$0 and B2B discount)
                const autoPrice = en?.price_locked || 95;
                setForm(p=>({...p,studentId:e.target.value,enrollmentId:en?.id||"",amount:autoPrice}));
              }} style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                <option value="">Seleccionar estudiante...</option>
                {students.map(s=><option key={s.id} value={s.id}>{s.student_code ? `[${s.student_code}] ` : ""}{s.profile?.full_name} — {s.profile?.email}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[["Monto (USD) *","amount","number","95"],["Banco/Cuenta","bank","text","BAC Honduras"]].map(([l,k,t,ph])=>(
                <div key={k}>
                  <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>{l}</div>
                  <input type={t} value={form[k]} placeholder={ph} onChange={e=>setForm(p=>({...p,[k]:t==="number"?+e.target.value:e.target.value}))}
                    style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Método</div>
              <select value={form.method} onChange={e=>setForm(p=>({...p,method:e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}>
                {[["transfer","Transferencia bancaria"],["cash","Efectivo"],["stripe","Stripe / Tarjeta"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text-secondary)",marginBottom:5}}>Referencia / Notas</div>
              <input value={form.notes} placeholder="Número de transacción o notas" onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                style={{width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface-subtle)",color:"var(--text-primary)",fontFamily:"inherit"}}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setRegModal(false)} style={{flex:1,padding:"10px",background:"var(--bg-surface-subtle)",border:"1px solid var(--border)",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)"}}>Cancelar</button>
              <button onClickCapture={e=>{e.stopPropagation();register();}} style={{flex:2,padding:"10px",background:P,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",opacity:saving?.6:1}}>
                {saving?"Guardando...":"Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
