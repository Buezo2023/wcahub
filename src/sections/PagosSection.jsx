// ─── PagosSection — Cobros & Pagos (SuperAdmin / Cobros) ────────
import { useState, useEffect, useMemo } from "react";
import { api } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";
import { exportCSV } from "../lib/exportCSV.js";

const PX="#155266",PD="#e8f3f6",G="#059669",GD="#ecfdf5",R="#dc2626",RD="#fef2f2",A="#d97706",AD="#fffbeb";

const PROG = { en:"Inglés", va:"Asistente Virtual", va_mkt:"VA · Mkt", va_legal:"VA · Legal", va_care:"VA · Care" };

export function PagosSection({ showToast, initialTab }) {
  const [payments,     setPayments]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState(initialTab || "pending");
  const [search,       setSearch]       = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting,    setRejecting]    = useState(false);
  const [proofUrl,     setProofUrl]     = useState(null);

  const TABS = [
    { id:"pending",   label:"Pendientes" },
    { id:"failed",    label:"Rechazados" },
    { id:"confirmed", label:"Confirmados"},
    { id:"all",       label:"Todos"      },
  ];

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("payments")
        .select("id,amount,currency,method,status,reference_code,bank,created_at,confirmed_at,proof_url,notes,student:students(id,student_code,profile:profiles(full_name,email)),enrollment:enrollments(program_id)")
        .order("created_at", { ascending:false })
        .limit(300);
      if (error) throw error;
      setPayments(data || []);
    } catch(e) {
      showToast?.("Error al cargar pagos: " + e.message, R);
    } finally { setLoading(false); }
  }

  const filtered = useMemo(()=>{
    const base = tab==="all" ? payments : payments.filter(p=>p.status===tab);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(p=>
      p.student?.profile?.full_name?.toLowerCase().includes(q) ||
      p.student?.profile?.email?.toLowerCase().includes(q) ||
      p.reference_code?.toLowerCase().includes(q)
    );
  },[tab,payments,search]);

  async function confirmPayment(id) {
    try {
      const res = await api.patch("/api/payments", { paymentId:id, action:"confirm" });
      const warn = res?.data?.warning || res?.warning;
      if (warn) showToast?.("Pago aprobado. \u26a0 " + warn, A);
      else showToast?.("\u2713 Pago aprobado y matr\u00edcula activada.");
      await load();
    } catch(e) { showToast?.("Error al aprobar: " + (e.message||"Error"), R); }
  }

  async function submitReject() {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await api.patch("/api/payments", { paymentId:rejectTarget.id, action:"reject", reason:rejectReason||"Rechazado por cobros" });
      showToast?.("Pago rechazado. El estudiante podr\u00e1 subir un nuevo comprobante.");
      setRejectTarget(null); setRejectReason("");
      await load();
    } catch(e) { showToast?.("Error al rechazar: " + (e.message||"Error"), R); }
    finally { setRejecting(false); }
  }

  const statusColor = s=>s==="confirmed"?[GD,G]:s==="pending"?[AD,A]:[RD,R];
  const statusLabel = s=>({confirmed:"\u2713 Confirmado",pending:"\u23f3 Pendiente",failed:"\u2717 Rechazado"}[s]||s);
  const pendingCount = payments.filter(p=>p.status==="pending").length;

  return (
    <div style={{padding:24,maxWidth:1100,margin:"0 auto"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:"var(--text-primary)"}}>Cobros &amp; Pagos</div>
          <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:2}}>Verific\u00e1 comprobantes, aprobá o rechazá pagos de transferencia.</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={load} style={{padding:"8px 16px",background:"var(--bg-surface)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>🔄 Refrescar</button>
          <button onClick={()=>exportCSV(filtered.map(p=>({Nombre:p.student?.profile?.full_name||"",Email:p.student?.profile?.email||"",Programa:PROG[p.enrollment?.program_id]||p.enrollment?.program_id||"",Monto:p.amount,Moneda:p.currency||"USD",Método:p.method,Banco:p.bank||"",Referencia:p.reference_code||"",Estado:p.status,Fecha:p.created_at})),"pagos")} style={{padding:"8px 16px",background:PX,color:"#fff",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>↓ CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Pendientes",value:pendingCount,color:A,bg:AD,icon:"⏳"},
          {label:"Con comprobante",value:payments.filter(p=>p.status==="pending"&&p.proof_url).length,color:G,bg:GD,icon:"📎"},
          {label:"Confirmados (mes)",value:payments.filter(p=>p.status==="confirmed"&&p.created_at?.startsWith(new Date().toISOString().slice(0,7))).length,color:G,bg:GD,icon:"✅"},
          {label:"Total cobrado (mes)",value:`$${payments.filter(p=>p.status==="confirmed"&&p.created_at?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,p)=>s+Number(p.amount||0),0).toFixed(0)}`,color:PX,bg:PD,icon:"💰"},
        ].map(k=>(
          <div key={k.label} style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{k.icon}</div>
            <div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.value}</div>
            <div style={{fontSize:11,color:"var(--text-secondary)",fontWeight:600}}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Tabs */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre, email o referencia..."
          style={{flex:1,minWidth:200,padding:"8px 12px",border:"1px solid var(--border)",borderRadius:8,fontSize:13,background:"var(--bg-surface)",color:"var(--text-primary)",fontFamily:"inherit",outline:"none"}} />
        <div style={{display:"flex",gap:4}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"7px 14px",background:tab===t.id?PX:"var(--bg-surface)",color:tab===t.id?"#fff":"var(--text-secondary)",border:tab===t.id?"none":"1px solid var(--border)",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
              {t.label}{t.id==="pending"&&pendingCount>0?` (${pendingCount})`:""}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{background:"var(--bg-surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
        {loading
          ? <div style={{padding:32,textAlign:"center",color:"var(--text-secondary)",fontSize:13}}>Cargando pagos...</div>
          : filtered.length===0
            ? <EmptyState icon="💳" title="Sin pagos" subtitle={`No hay pagos ${tab==="pending"?"pendientes":tab==="failed"?"rechazados":tab==="confirmed"?"confirmados":""} en este momento.`}/>
            : <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"var(--bg-surface-subtle)"}}>
                      {["Estudiante","Programa","Monto","Método","Referencia","Comprobante","Estado","Fecha","Acciones"].map(h=>(
                        <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,fontWeight:700,color:"var(--text-tertiary)",textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p=>{
                      const [bg,color]=statusColor(p.status);
                      return (
                        <tr key={p.id}
                          onMouseEnter={e=>e.currentTarget.style.background="var(--bg-surface-subtle)"}
                          onMouseLeave={e=>e.currentTarget.style.background=""}
                          style={{borderTop:"1px solid var(--border-tertiary)",transition:"background .1s"}}>
                          <td style={{padding:"10px 12px"}}>
                            <div style={{fontWeight:600,color:"var(--text-primary)",whiteSpace:"nowrap"}}>{p.student?.profile?.full_name||"—"}</div>
                            <div style={{fontSize:11,color:"var(--text-secondary)"}}>{p.student?.profile?.email||""}</div>
                          </td>
                          <td style={{padding:"10px 12px",fontSize:12,color:"var(--text-secondary)"}}>{PROG[p.enrollment?.program_id]||p.enrollment?.program_id?.toUpperCase()||"—"}</td>
                          <td style={{padding:"10px 12px",fontWeight:700,color:"var(--text-primary)",whiteSpace:"nowrap"}}>${Number(p.amount||0).toFixed(2)} <span style={{fontSize:10,color:"var(--text-tertiary)"}}>{p.currency||"USD"}</span></td>
                          <td style={{padding:"10px 12px",fontSize:12}}>
                            <div style={{textTransform:"capitalize",color:"var(--text-primary)"}}>{p.method}</div>
                            {p.bank&&<div style={{fontSize:11,color:"var(--text-secondary)"}}>{p.bank}</div>}
                          </td>
                          <td style={{padding:"10px 12px"}}>
                            {p.reference_code
                              ? <span style={{fontSize:11,fontFamily:"monospace",background:PD,color:PX,padding:"2px 7px",borderRadius:5,fontWeight:700}}>{p.reference_code}</span>
                              : <span style={{color:"var(--text-tertiary)",fontSize:11}}>—</span>}
                          </td>
                          <td style={{padding:"10px 12px"}}>
                            {p.proof_url
                              ? <button onClick={()=>setProofUrl(p.proof_url)}
                                  style={{fontSize:11,padding:"4px 10px",background:PD,color:PX,border:`1px solid ${PX}40`,borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:600,whiteSpace:"nowrap"}}>
                                  📎 Ver comprobante
                                </button>
                              : <span style={{fontSize:11,color:"var(--text-tertiary)"}}>Sin comprobante</span>}
                          </td>
                          <td style={{padding:"10px 12px"}}>
                            <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:bg,color,fontWeight:600}}>{statusLabel(p.status)}</span>
                            {p.status==="failed"&&p.notes&&<div style={{fontSize:10,color:"var(--text-secondary)",marginTop:2,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={p.notes}>{p.notes}</div>}
                          </td>
                          <td style={{padding:"10px 12px",fontSize:11,color:"var(--text-secondary)",whiteSpace:"nowrap"}}>{new Date(p.created_at).toLocaleDateString("es-HN",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                          <td style={{padding:"10px 12px"}}>
                            {(p.status==="pending"||p.status==="failed")&&(
                              <div style={{display:"flex",gap:4}}>
                                <button onClick={()=>confirmPayment(p.id)}
                                  style={{fontSize:11,padding:"5px 10px",background:GD,color:G,border:`1px solid ${G}40`,borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:700,whiteSpace:"nowrap"}}>
                                  ✓ Aprobar pago
                                </button>
                                <button onClick={()=>{setRejectTarget({id:p.id});setRejectReason("");}}
                                  style={{fontSize:11,padding:"5px 10px",background:RD,color:R,border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
                                  ✗ Rechazar
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
        }
      </div>

      {/* Reject modal */}
      {rejectTarget&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>{if(!rejecting){setRejectTarget(null);setRejectReason("");}}}> 
          <div style={{background:"var(--bg-surface)",borderRadius:16,padding:28,maxWidth:420,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:12}}>Rechazar pago</div>
            <div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:16}}>Indicá el motivo. El estudiante podrá subir un nuevo comprobante.</div>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
              placeholder="Ej: El monto transferido no corresponde / La imagen no es legible..."
              rows={3} style={{width:"100%",padding:10,border:"1px solid var(--border)",borderRadius:8,fontSize:13,fontFamily:"inherit",background:"var(--bg-surface)",color:"var(--text-primary)",resize:"vertical",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button onClick={submitReject} disabled={rejecting}
                style={{flex:1,padding:"10px 0",background:rejecting?"var(--bg-surface-subtle)":R,color:rejecting?"var(--text-secondary)":"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:rejecting?"not-allowed":"pointer",fontFamily:"inherit"}}>
                {rejecting?"Rechazando...":"Rechazar pago"}
              </button>
              <button onClick={()=>{setRejectTarget(null);setRejectReason("");}} disabled={rejecting}
                style={{padding:"10px 18px",background:"var(--bg-surface-subtle)",color:"var(--text-secondary)",border:"1px solid var(--border)",borderRadius:10,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof viewer */}
      {proofUrl&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setProofUrl(null)}>
          <div style={{maxWidth:"90vw",maxHeight:"90vh",position:"relative"}} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setProofUrl(null)}
              style={{position:"absolute",top:-12,right:-12,width:32,height:32,borderRadius:"50%",background:"#fff",border:"none",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)",zIndex:1}}>✕</button>
            {proofUrl.match(/\.pdf$/i)
              ? <iframe src={proofUrl} style={{width:"80vw",height:"80vh",border:"none",borderRadius:12}} title="Comprobante PDF"/>
              : <img src={proofUrl} alt="Comprobante" style={{maxWidth:"80vw",maxHeight:"80vh",borderRadius:12,objectFit:"contain"}}/>}
            <div style={{textAlign:"center",marginTop:8}}>
              <a href={proofUrl} target="_blank" rel="noopener noreferrer"
                style={{fontSize:12,color:"#fff",background:PX,padding:"6px 14px",borderRadius:8,textDecoration:"none",fontWeight:600}}>Abrir en nueva pestaña ↗</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
