// ─── VencidosSection — Pagos vencidos para SuperAdmin ───────────
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

const P="#155266",R="#dc2626",RD="#fef2f2",G="#059669",GD="#ecfdf5",A="#d97706";

export function VencidosSection({ showToast }) {
  const [overdue,  setOverdue]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{load();},[]);

  async function load(){
    setLoading(true);
    const today = new Date().toISOString().slice(0,10);
    const {data:od}=await supabase.from("enrollments")
      .select("id,next_payment_date,price_locked,student:students(id,profile:profiles(full_name,phone,email)),groups(level)")
      .eq("status","active").lt("next_payment_date",today).not("next_payment_date","is",null).limit(50);
    const {data:sus}=await supabase.from("enrollments")
      .select("id,next_payment_date,price_locked,suspended_at,student:students(id,profile:profiles(full_name,phone,email)),groups(level)")
      .eq("status","suspended").limit(20);
    const all=[...(od||[]),...(sus||[])];
    const unique=all.filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i);
    setOverdue(unique.map(e=>{
      const due=new Date(e.next_payment_date||e.suspended_at||new Date());
      const days=Math.max(0,Math.floor((new Date()-due)/(1000*60*60*24)));
      return{id:e.id,name:e.student?.profile?.full_name||"—",phone:e.student?.profile?.phone||"",email:e.student?.profile?.email||"",level:e.groups?.level||"—",days,amount:e.price_locked||95};
    }).sort((a,b)=>b.days-a.days));
    setLoading(false);
  }

  async function runReminder(item){
    try{
      const {data:{session}}=await supabase.auth.getSession();
      await fetch("/api/emails/reminders",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},body:JSON.stringify({studentIds:[item.id],daysOverdue:item.days})});
      showToast(`✓ Recordatorio enviado a ${item.name}`);
    }catch(e){showToast("Error: "+e.message,R);}
  }

  async function triggerCycle(){
    try{
      const res=await fetch("/api/jobs/daily-billing",{headers:{"x-cron-secret":"manual-trigger"}});
      const json=await res.json().catch(()=>({}));
      showToast(`Ciclo ejecutado: ${json.results?.autoSuspended?.count||0} suspendidos`);
      await load();
    }catch(e){showToast("Error: "+e.message,R);}
  }

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <div style={{background:RD,border:`1px solid ${R}30`,borderRadius:10,padding:"8px 14px",fontSize:13,color:R,display:"flex",gap:8,flex:1}}>
          <i className="ti ti-alert-circle" style={{fontSize:14,flexShrink:0,marginTop:1}}/>
          {overdue.length} estudiante{overdue.length!==1?"s":""} con pago vencido · el sistema auto-suspende a los 15 días
        </div>
        <button onClickCapture={e=>{e.stopPropagation();triggerCycle();}} style={{padding:"8px 14px",background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:9,fontSize:12,cursor:"pointer",fontFamily:"inherit",color:"var(--text-secondary)",fontWeight:600}}>
          ▶ Ejecutar ciclo ahora
        </button>
      </div>

      {loading?<div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando...</div>
      :overdue.length===0?(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:48,marginBottom:12}}>✅</div>
          <div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)"}}>Sin pagos vencidos</div>
          <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:4}}>Todos los estudiantes están al día</div>
        </div>
      ):<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {overdue.map((o,i)=>(
          <div key={i} style={{background:"var(--bg-surface)",border:`1px solid ${o.days>=15?R:`${A}60`}`,borderRadius:12,padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{o.name}</div>
                <div style={{fontSize:12,color:"var(--text-secondary)"}}>{o.level} · <span style={{color:o.days>=15?R:A,fontWeight:600}}>Vencido hace {o.days} días</span></div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:20,fontWeight:800,color:o.days>=15?R:A}}>${o.amount}</div>
                <div style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:o.days>=15?RD:"#fffbeb",color:o.days>=15?R:A,fontWeight:700,marginTop:4}}>
                  {o.days>=15?"⛔ Suspender":"⚠ Vencido"}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClickCapture={e=>{e.stopPropagation();runReminder(o);}} style={{flex:1,fontSize:12,padding:"6px",background:P,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✉ Recordatorio</button>
              {o.phone&&<a href={`https://wa.me/${o.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hola ${o.name}, tu pago de $${o.amount} lleva ${o.days} días vencido en WCA Academy.`)}`} target="_blank" rel="noopener noreferrer" style={{flex:1,fontSize:12,padding:"6px",background:GD,color:G,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,textAlign:"center",textDecoration:"none"}}>💬 WhatsApp</a>}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
