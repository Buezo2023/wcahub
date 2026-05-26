// ─── RecibosSection — Recibos de pagos confirmados ──────────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const P="#155266",PD="#e8f3f6",G="#059669",A="#d97706";

export function RecibosSection({ showToast }) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const {data}=await supabase.from("payments")
      .select("id,amount,method,reference_code,bank,period_start,period_end,confirmed_at,created_at,student:students(id,profile:profiles(full_name,email)),enrollment:enrollments(program_id)")
      .eq("status","confirmed")
      .order("confirmed_at",{ascending:false}).limit(100);
    if(data) setPayments(data);
    setLoading(false);
  }

  function printReceipt(p){
    const w=window.open("","_blank");
    const fecha=new Date(p.confirmed_at||p.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"long",year:"numeric"});
    const period=p.period_start?new Date(p.period_start).toLocaleDateString("es-HN",{month:"long",year:"numeric"}):"—";
    w.document.write(`<!DOCTYPE html><html><head><title>Recibo WCA</title>
    <style>body{font-family:'DM Sans',sans-serif;padding:40px;max-width:500px;margin:0 auto;color:#0f172a}
    .logo{color:#155266;font-size:22px;font-weight:800}.gold{color:#ffbb23}
    .big{font-size:36px;font-weight:800;color:#155266;margin:20px 0 4px}
    .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:14px}
    .label{color:#64748b}.badge{background:#ecfdf5;color:#059669;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
    .footer{margin-top:30px;font-size:11px;color:#94a3b8;text-align:center}
    @media print{button{display:none}}</style></head><body>
    <div class="logo">WCA <span class="gold">Academy</span></div>
    <div style="font-size:12px;color:#94a3b8;margin-top:4px">Recibo de pago oficial</div>
    <div class="big">$${Number(p.amount).toFixed(2)}</div>
    <span class="badge">✓ Confirmado</span>
    <div style="margin:24px 0">
      <div class="row"><span class="label">Estudiante</span><span><b>${p.student?.profile?.full_name||"—"}</b></span></div>
      <div class="row"><span class="label">Programa</span><span>${(p.enrollment?.program_id||"—").toUpperCase()}</span></div>
      <div class="row"><span class="label">Período</span><span>${period}</span></div>
      <div class="row"><span class="label">Método</span><span>${p.method||"—"}</span></div>
      <div class="row"><span class="label">Referencia</span><span>${p.reference_code||"—"}</span></div>
      ${p.bank?`<div class="row"><span class="label">Banco</span><span>${p.bank}</span></div>`:""}
      <div class="row"><span class="label">Fecha de confirmación</span><span>${fecha}</span></div>
    </div>
    <div class="footer">WCA Academy · wcahub.vercel.app · info@worldconnectacademy.com<br>Este documento es el comprobante oficial de tu pago.</div>
    <button onclick="window.print()" style="margin-top:20px;padding:10px 24px;background:#155266;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer">↓ Imprimir / Guardar PDF</button>
    </body></html>`);
    w.document.close();
  }

  const filtered=search?payments.filter(p=>(p.student?.profile?.full_name||"").toLowerCase().includes(search.toLowerCase())||(p.reference_code||"").toLowerCase().includes(search.toLowerCase())):payments;

  return(
    <div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o referencia..."
        style={{width:"100%",padding:"9px 13px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",marginBottom:16}}/>
      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :filtered.length===0?<EmptyState icon="🧾" title="Sin recibos" subtitle="Los recibos aparecen cuando se confirman pagos."/>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
        {filtered.map(p=>{
          const fecha=new Date(p.confirmed_at||p.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short",year:"numeric"});
          const period=p.period_start?new Date(p.period_start).toLocaleDateString("es-HN",{month:"short",year:"numeric"}):null;
          return(
            <div key={p.id} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>{p.student?.profile?.full_name||"—"}</div>
                  <div style={{fontSize:11,color:"var(--text-secondary)"}}>{fecha}{period?` · ${period}`:""}</div>
                </div>
                <div style={{fontSize:20,fontWeight:800,color:P}}>${p.amount}</div>
              </div>
              <div style={{fontSize:11,color:"var(--text-secondary)",marginBottom:10}}>{p.method} · {p.reference_code||"—"}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClickCapture={e=>{e.stopPropagation();printReceipt(p);}} style={{flex:1,fontSize:12,padding:"7px",background:PD,color:P,border:"none",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>🖨 Ver recibo</button>
                <button onClick={()=>{navigator.clipboard?.writeText(p.student?.profile?.email||"");showToast("Email copiado");}} style={{flex:1,fontSize:12,padding:"7px",background:"var(--bg-surface-subtle)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",fontFamily:"inherit"}}>✉ Reenviar</button>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
