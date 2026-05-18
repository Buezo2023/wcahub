import { useState, useMemo } from "react";

const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"var(--wca-primary-dim)",
  secondary:"#ffbb23", secondaryDim:"var(--amber-dim)", accent:"#fab82c",
  bg:"var(--bg-page)", white:"var(--bg-surface)", text:"var(--text-primary)", textSec:"var(--text-secondary)",
  border:"var(--border)", borderLight:"var(--wca-primary-dim)",
  green:"#059669", greenDim:"var(--green-dim)",
  red:"#dc2626", redDim:"var(--red-dim)",
  amber:"#ffbb23", amberDim:"var(--amber-dim)",
};

// ─── DATA ─────────────────────────────────────────────────────────
const PENDING_TRANSFERS = [
  { id:1, student:"María López",    level:"B1", program:"Inglés",    amount:95,  code:"WCA-B1-0821", method:"Transferencia", bank:"BAC Credomatic", date:"Hace 1h",    proof:true,  urgent:false },
  { id:2, student:"Carlos Torres",  level:"A1", program:"Inglés+VA", amount:170, code:"WCA-A1-4492", method:"Transferencia", bank:"BI Honduras",    date:"Hace 4h",    proof:true,  urgent:false },
  { id:3, student:"Ana Sofía Vega", level:"A2", program:"Inglés",    amount:95,  code:"WCA-A2-3301", method:"Transferencia", bank:"BAC Credomatic", date:"Hace 1 día", proof:false, urgent:true },
];

const PAYMENT_HISTORY = [
  { id:1,  student:"Isabel Navarro",  amount:95,  method:"Stripe",       status:"confirmed", date:"Hoy 09:14",    code:"pi_3Qx1••••",    action_by:"Sistema",   note:"" },
  { id:2,  student:"Rodrigo Paredes", amount:170, method:"Transferencia", status:"confirmed", date:"Hoy 08:55",    code:"WCA-B2-8820",    action_by:"Gestor",    note:"Comprobante verificado en BAC" },
  { id:3,  student:"Sofía Ramos",     amount:95,  method:"Stripe",       status:"confirmed", date:"Ayer 18:30",   code:"pi_3Qw9••••",    action_by:"Sistema",   note:"" },
  { id:4,  student:"Diego Fuentes",   amount:95,  method:"Efectivo",     status:"confirmed", date:"Ayer 11:20",   code:"WCA-B2-7741",    action_by:"Gestor",    note:"Pagó en sede SPS" },
  { id:5,  student:"Valentina Cruz",  amount:50,  method:"Transferencia", status:"confirmed", date:"Hace 2 días",  code:"WCA-BCK-2210",   action_by:"Gestor",    note:"Beca trimestral" },
  { id:6,  student:"Luis Morales",    amount:95,  method:"Stripe",       status:"refunded",  date:"Hace 3 días",  code:"re_3Qv8••••",    action_by:"Gestor",    note:"Reembolso dentro de 7 días" },
  { id:7,  student:"Pedro Jiménez",   amount:95,  method:"Transferencia", status:"failed",    date:"Hace 4 días",  code:"WCA-A2-6634",    action_by:"—",         note:"Sin respuesta del estudiante" },
];

const OVERDUE = [
  { student:"Luis Morales",  level:"A1", days:38, amount:95,  contact:"+504 9912-3344", lastContact:"Hace 5 días" },
  { student:"Marcos Silva",  level:"B2", days:31, amount:95,  contact:"+55 11 9999-0000", lastContact:"Hace 8 días" },
];

const AUDIT_LOG = [
  { action:"Confirmó pago",    student:"Rodrigo Paredes", amount:"$170", time:"Hoy 08:55",   note:"Comprobante BAC verificado" },
  { action:"Registró efectivo",student:"Diego Fuentes",   amount:"$95",  time:"Ayer 11:20",  note:"Pagó en sede" },
  { action:"Anuló pago",       student:"Luis Morales",    amount:"$95",  time:"Hace 3 días", note:"Reembolso solicitado en 7 días" },
  { action:"Emitió recibo",    student:"Sofía Ramos",     amount:"$95",  time:"Ayer 18:30",  note:"Recibo #2024-089" },
  { action:"Marcó vencido",    student:"Marcos Silva",    amount:"$95",  time:"Hace 4 días", note:"Sin respuesta después de 3 intentos" },
];

const NAV = [
  { id:"home",      icon:"ti-layout-dashboard", label:"Inicio"        },
  { id:"pending",   icon:"ti-clock",             label:"Pendientes"    },
  { id:"register",  icon:"ti-cash",              label:"Registrar pago"},
  { id:"history",   icon:"ti-history",           label:"Historial"     },
  { id:"overdue",   icon:"ti-alert-triangle",    label:"Vencidos"      },
  { id:"receipts",  icon:"ti-receipt",           label:"Recibos"       },
  { id:"audit",     icon:"ti-list-details",      label:"Mi auditoría"  },
];

function Badge({ text, bg, color }) {
  return <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:bg, color, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>;
}
function Stat({ label, value, sub, color, icon }) {
  return (
    <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"13px 15px", borderTop:`3px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <div style={{ fontSize:12, color:B.textSec }}>{label}</div>
        <i className={`ti ${icon}`} style={{ fontSize:16, color }} aria-hidden="true" />
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:B.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:B.textSec, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

export default function GestorCobros() {
  const [view, setView]             = useState("home");
  const [selTransfer, setSelTransfer] = useState(null);
  const [confirmed, setConfirmed]   = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [registerForm, setRegForm]  = useState({ student:"", amount:"", method:"Efectivo", bank:"", note:"", code:"" });
  const [regSuccess, setRegSuccess] = useState(false);
  const [anulaModal, setAnulaModal] = useState(null);
  const [anulaNote, setAnulaNote]   = useState("");
  const [searchHist, setSearchHist] = useState("");
  const [proofModal, setProofModal] = useState(null);

  const pending = PENDING_TRANSFERS.filter(t => !confirmed.includes(t.id));
  const filteredHist = useMemo(() => PAYMENT_HISTORY.filter(p =>
    !searchHist || p.student.toLowerCase().includes(searchHist.toLowerCase()) || p.code.toLowerCase().includes(searchHist.toLowerCase())
  ), [searchHist]);

  function confirmTransfer(id) {
    setConfirmed(c => [...c, id]);
    setSelTransfer(null);
  }

  const methodColor = m => m==="Stripe"?[B.primaryDim,B.primary]:m==="Transferencia"?[B.amberDim,"#92400e"]:[B.greenDim,"#065f46"];
  const statusColor = s => s==="confirmed"?[B.greenDim,"#065f46"]:s==="refunded"?[B.primaryDim,B.primary]:s==="failed"?[B.redDim,B.red]:[B.amberDim,"#92400e"];
  const statusLabel = s => ({confirmed:"✓ Confirmado",refunded:"↩ Reembolsado",failed:"✗ Fallido",pending:"⏳ Pendiente"}[s]);

  return (
    <div style={{ display:"flex", minHeight: "100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif", position:"relative" }}>

      {/* SIDEBAR */}
      <aside style={{ width:196, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"var(--bg-surface)" }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginTop:2, letterSpacing:1, textTransform:"uppercase" }}>Gestor de Cobros</div>
        </div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSelTransfer(null); }} style={{
            display:"flex", alignItems:"center", gap:9, padding:"11px 18px", border:"none",
            background: view===item.id ? "rgba(255,255,255,.12)" : "transparent",
            color: view===item.id ? "var(--bg-surface)" : "rgba(255,255,255,.5)",
            fontSize:13, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===item.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===item.id ? 600 : 400,
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:15, width:16 }} aria-hidden="true" />
            {item.label}
            {item.id==="pending" && pending.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.secondary, color:B.dark, borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pending.length}</span>
            )}
            {item.id==="overdue" && OVERDUE.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.red, color:"var(--bg-surface)", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{OVERDUE.length}</span>
            )}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:"12px 16px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:B.secondary }}>GC</div>
            <div><div style={{ fontSize:12, color:"var(--bg-surface)", fontWeight:600 }}>Gestor WCA</div><div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Cobros</div></div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ height:52, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text }}>
            {{ home:"Resumen del día", pending:"Transferencias pendientes", register:"Registrar pago", history:"Historial de cobros", overdue:"Pagos vencidos", receipts:"Recibos", audit:"Mi auditoría" }[view]}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {pending.length > 0 && <div style={{ fontSize:12, background:B.amberDim, color:"#92400e", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⏳ {pending.length} por confirmar</div>}
            {OVERDUE.length > 0 && <div style={{ fontSize:12, background:B.redDim, color:B.red, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⚠ {OVERDUE.length} vencidos</div>}
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>

          {/* HOME */}
          {view==="home" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                <Stat label="Cobrado hoy" value="$360" sub="3 pagos" color={B.green} icon="ti-trending-up" />
                <Stat label="Por confirmar" value={pending.length} sub="Transferencias" color={B.amber} icon="ti-clock" />
                <Stat label="Vencidos" value={OVERDUE.length} sub="+30 días" color={B.red} icon="ti-alert-circle" />
                <Stat label="Cobrado (mes)" value="$18,420" sub="↑ 8% vs anterior" color={B.primary} icon="ti-coin" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:10 }}>Transferencias pendientes hoy</div>
                  {pending.length === 0 && <div style={{ fontSize:13, color:B.textSec, textAlign:"center", padding:"16px 0" }}>✓ Todo confirmado</div>}
                  {pending.map(t => (
                    <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:t.urgent?B.redDim:B.amberDim, borderRadius:9, marginBottom:7, border:`1px solid ${t.urgent?B.red:B.amber}40` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{t.student}</div>
                        <div style={{ fontSize:11, color:B.textSec }}>
                          ${t.amount} · {t.code} · {t.date}
                          {t.urgent && <span style={{ marginLeft:6, color:B.red, fontWeight:600 }}>SIN COMPROBANTE</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:5 }}>
                        {t.proof && <button onClick={() => setProofModal(t)} style={{ fontSize:11, padding:"4px 8px", background:B.white, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Ver</button>}
                        <button onClick={() => confirmTransfer(t.id)} style={{ fontSize:11, padding:"4px 9px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:5, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>✓ OK</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:10 }}>Últimas acciones</div>
                  {AUDIT_LOG.slice(0,5).map((a,i) => (
                    <div key={i} style={{ display:"flex", gap:9, padding:"7px 0", borderTop:i>0?`1px solid ${B.borderLight}`:"none" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:a.action.includes("Anuló")?B.red:a.action.includes("Marcó")?B.amber:B.green, flexShrink:0, marginTop:5 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, color:B.text }}><strong>{a.action}</strong> — {a.student}</div>
                        <div style={{ fontSize:11, color:B.textSec }}>{a.amount} · {a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PENDING TRANSFERS */}
          {view==="pending" && (
            <div style={{ display:"flex", gap:12, height:"100%" }}>
              <div style={{ flex:1, overflow:"auto" }}>
                {pending.length === 0 && (
                  <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:40, textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                    <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Todo confirmado</div>
                    <div style={{ fontSize:13, color:B.textSec }}>No hay transferencias pendientes en este momento.</div>
                  </div>
                )}
                {pending.map(t => (
                  <div key={t.id} onClick={() => setSelTransfer(selTransfer?.id===t.id?null:t)}
                    style={{ background:B.white, border:`1px solid ${selTransfer?.id===t.id?B.primary:t.urgent?B.red:B.border}`, borderRadius:12, padding:14, marginBottom:10, cursor:"pointer", transition:"border-color .15s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{t.student}</div>
                        <div style={{ fontSize:12, color:B.textSec, marginTop:2 }}>{t.level} · {t.program} · {t.date}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:18, fontWeight:800, color:B.primary }}>${t.amount}</div>
                        {t.urgent && <Badge text="Sin comprobante" bg={B.redDim} color={B.red} />}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                      <Badge text={t.bank} bg={B.bg} color={B.textSec} />
                      <Badge text={t.code} bg={B.primaryDim} color={B.primary} />
                      <Badge text={t.proof?"Comprobante subido":"Sin comprobante"} bg={t.proof?B.greenDim:B.redDim} color={t.proof?"#065f46":B.red} />
                    </div>
                    <div style={{ display:"flex", gap:7 }}>
                      {t.proof && <button onClick={e=>{e.stopPropagation();setProofModal(t);}} style={{ flex:1, fontSize:12, padding:"7px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>Ver comprobante</button>}
                      <button onClick={e=>{e.stopPropagation();setRejectModal(t);}} style={{ flex:1, fontSize:12, padding:"7px", background:B.redDim, color:B.red, border:`1px solid ${B.red}40`, borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>✗ Rechazar</button>
                      <button onClick={e=>{e.stopPropagation();confirmTransfer(t.id);}} style={{ flex:2, fontSize:12, padding:"7px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>✓ Confirmar pago</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REGISTER PAYMENT */}
          {view==="register" && (
            <div style={{ maxWidth:520 }}>
              {regSuccess ? (
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:32, textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700, color:B.text, marginBottom:6 }}>Pago registrado</div>
                  <div style={{ fontSize:13, color:B.textSec, marginBottom:20 }}>El acceso del estudiante ha sido activado y el recibo fue generado automáticamente.</div>
                  <button onClick={() => { setRegSuccess(false); setRegForm({ student:"", amount:"", method:"Efectivo", bank:"", note:"", code:"" }); }} style={{ padding:"9px 20px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Registrar otro pago</button>
                </div>
              ) : (
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:16 }}>Registrar pago manual</div>
                  {[
                    { label:"Nombre del estudiante", key:"student", ph:"María Rodríguez", type:"text" },
                    { label:"Monto (USD)", key:"amount", ph:"95", type:"number" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom:12 }}>
                      <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>{f.label}</label>
                      <input type={f.type} value={registerForm[f.key]} onChange={e=>setRegForm(r=>({...r,[f.key]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", padding:"9px 12px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit", color:B.text }} />
                    </div>
                  ))}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Método</label>
                      <select value={registerForm.method} onChange={e=>setRegForm(r=>({...r,method:e.target.value}))} style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                        <option>Efectivo</option><option>Transferencia</option><option>Tarjeta</option>
                      </select>
                    </div>
                    {registerForm.method === "Transferencia" && (
                      <div>
                        <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Banco</label>
                        <select value={registerForm.bank} onChange={e=>setRegForm(r=>({...r,bank:e.target.value}))} style={{ width:"100%", padding:"9px 10px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit" }}>
                          <option>BAC Credomatic</option><option>BI Honduras</option><option>Ficohsa</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:4 }}>Nota interna (visible en auditoría)</label>
                    <input value={registerForm.note} onChange={e=>setRegForm(r=>({...r,note:e.target.value}))} placeholder="Ej: Pagó en sede, entregó comprobante físico..." style={{ width:"100%", padding:"9px 12px", border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, background:B.bg, fontFamily:"inherit", color:B.text }} />
                  </div>
                  <div style={{ background:B.primaryDim, borderRadius:9, padding:"9px 12px", fontSize:13, color:B.primary, marginBottom:14, display:"flex", gap:6 }}>
                    <i className="ti ti-info-circle" style={{ fontSize:13, flexShrink:0 }} aria-hidden="true" />
                    Al confirmar se activará el acceso del estudiante y se generará el recibo automáticamente.
                  </div>
                  <button onClick={() => registerForm.student && registerForm.amount && setRegSuccess(true)} style={{ width:"100%", padding:"11px", background: registerForm.student&&registerForm.amount?B.primary:B.border, color: registerForm.student&&registerForm.amount?"var(--bg-surface)":B.textSec, border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor: registerForm.student&&registerForm.amount?"pointer":"not-allowed", fontFamily:"inherit" }}>
                    Registrar y activar cuenta
                  </button>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {view==="history" && (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:B.white, border:`1px solid ${B.border}`, borderRadius:9, padding:"7px 12px" }}>
                  <i className="ti ti-search" style={{ color:B.textSec, fontSize:15 }} aria-hidden="true" />
                  <input value={searchHist} onChange={e=>setSearchHist(e.target.value)} placeholder="Buscar por estudiante o código..." style={{ border:"none", outline:"none", fontSize:13, background:"transparent", flex:1, fontFamily:"inherit", color:B.text }} />
                </div>
                <button style={{ padding:"7px 14px", background:B.white, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", color:B.textSec, fontFamily:"inherit" }}>↓ Excel</button>
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:B.bg }}>
                      {["Estudiante","Monto","Método","Código","Acción por","Estado",""].map(h=>(
                        <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHist.map((p,i) => {
                      const [sBg,sCol] = statusColor(p.status);
                      const [mBg,mCol] = methodColor(p.method);
                      return (
                        <tr key={p.id} style={{ borderTop:`1px solid ${B.borderLight}` }}>
                          <td style={{ padding:"10px 10px" }}>
                            <div style={{ fontWeight:600, color:B.text }}>{p.student}</div>
                            <div style={{ fontSize:11, color:B.textSec }}>{p.date}</div>
                          </td>
                          <td style={{ padding:"10px 10px", fontWeight:700, color:B.text }}>${p.amount}</td>
                          <td style={{ padding:"10px 10px" }}><Badge text={p.method} bg={mBg} color={mCol} /></td>
                          <td style={{ padding:"10px 10px" }}><code style={{ fontSize:11, background:B.bg, padding:"2px 6px", borderRadius:4, color:B.textSec }}>{p.code}</code></td>
                          <td style={{ padding:"10px 10px", color:B.textSec }}>{p.action_by}</td>
                          <td style={{ padding:"10px 10px" }}><Badge text={statusLabel(p.status)} bg={sBg} color={sCol} /></td>
                          <td style={{ padding:"10px 10px" }}>
                            {(p.status==="confirmed" && p.action_by==="Gestor") && (
                              <button onClick={() => setAnulaModal(p)} style={{ fontSize:11, padding:"3px 8px", background:B.redDim, color:B.red, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Anular</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OVERDUE */}
          {view==="overdue" && (
            <div>
              <div style={{ background:B.redDim, border:`1px solid ${B.red}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:B.red, display:"flex", gap:8 }}>
                <i className="ti ti-alert-circle" style={{ fontSize:14, flexShrink:0, marginTop:1 }} aria-hidden="true" />
                Estudiantes con pago vencido más de 30 días. Sus cuentas están suspendidas. Contáctalos para gestionar la regularización.
              </div>
              {OVERDUE.map((o,i) => (
                <div key={i} style={{ background:B.white, border:`1px solid ${B.red}40`, borderRadius:12, padding:16, marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:700, color:B.text }}>{o.student}</div>
                      <div style={{ fontSize:13, color:B.textSec }}>{o.level} · <span style={{ color:B.red, fontWeight:600 }}>Vencido hace {o.days} días</span></div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:20, fontWeight:800, color:B.red }}>${o.amount}</div>
                      <Badge text="Suspendido" bg={B.redDim} color={B.red} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:7 }}>
                    <button style={{ flex:1, fontSize:12, padding:"8px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:8, cursor:"pointer", fontFamily:"inherit" }}>
                      <i className="ti ti-brand-whatsapp" style={{ fontSize:13, verticalAlign:-1, marginRight:4 }} aria-hidden="true" />
                      WhatsApp: {o.contact}
                    </button>
                    <button onClick={() => setView("register")} style={{ flex:1, fontSize:12, padding:"8px", background:B.primary, color:"var(--bg-surface)", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
                      Registrar pago
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RECEIPTS */}
          {view==="receipts" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {PAYMENT_HISTORY.filter(p=>p.status==="confirmed").map((p,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{p.student}</div>
                        <div style={{ fontSize:12, color:B.textSec }}>{p.date} · {p.method}</div>
                      </div>
                      <div style={{ fontSize:18, fontWeight:800, color:B.primary }}>${p.amount}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ flex:1, fontSize:12, padding:"6px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>↓ PDF</button>
                      <button style={{ flex:1, fontSize:12, padding:"6px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Reenviar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT */}
          {view==="audit" && (
            <div>
              <div style={{ background:B.primaryDim, border:`1px solid ${B.border}`, borderRadius:10, padding:"9px 14px", marginBottom:12, fontSize:13, color:B.primary, display:"flex", gap:8 }}>
                <i className="ti ti-shield-check" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true" />
                Este es el log de tus propias acciones. Es inmutable y visible para Contabilidad.
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
                {AUDIT_LOG.map((a,i) => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"11px 14px", borderBottom:i<AUDIT_LOG.length-1?`1px solid ${B.borderLight}`:"none" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:a.action.includes("Anuló")||a.action.includes("Marcó")?B.red:B.green, flexShrink:0, marginTop:5 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, color:B.text }}><strong>{a.action}</strong> — {a.student} · <span style={{ fontWeight:700, color:B.primary }}>{a.amount}</span></div>
                      <div style={{ fontSize:12, color:B.textSec, marginTop:2 }}>{a.note}</div>
                    </div>
                    <div style={{ fontSize:12, color:B.textSec, whiteSpace:"nowrap" }}>{a.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Ver comprobante */}
      {proofModal && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}>
          <div style={{ background:B.white, borderRadius:16, padding:24, width:380, border:`1px solid ${B.border}` }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Comprobante de transferencia</div>
            <div style={{ fontSize:13, color:B.textSec, marginBottom:14 }}>{proofModal.student} · ${proofModal.amount} · {proofModal.code}</div>
            <div style={{ background:B.bg, borderRadius:10, height:160, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, border:`1px solid ${B.border}` }}>
              <div style={{ textAlign:"center", color:B.textSec }}>
                <i className="ti ti-file-description" style={{ fontSize:36, display:"block", marginBottom:8 }} aria-hidden="true" />
                <div style={{ fontSize:13 }}>Imagen del comprobante</div>
                <div style={{ fontSize:12 }}>Banco: {proofModal.bank}</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setProofModal(null)} style={{ flex:1, padding:"9px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cerrar</button>
              <button onClick={() => { confirmTransfer(proofModal.id); setProofModal(null); }} style={{ flex:2, padding:"9px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓ Confirmar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Anular pago */}
      {anulaModal && (
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}>
          <div style={{ background:B.white, borderRadius:16, padding:24, width:380 }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Anular pago</div>
            <div style={{ fontSize:13, color:B.textSec, marginBottom:14 }}>{anulaModal.student} · ${anulaModal.amount} — esta acción queda en el log de auditoría.</div>
            <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:5 }}>Motivo de la anulación (obligatorio)</label>
            <input value={anulaNote} onChange={e=>setAnulaNote(e.target.value)} placeholder="Ej: Error en el monto, reembolso solicitado..." style={{ width:"100%", padding:"9px 12px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit", marginBottom:14 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setAnulaModal(null); setAnulaNote(""); }} style={{ flex:1, padding:"9px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:B.textSec }}>Cancelar</button>
              <button onClick={() => { setAnulaModal(null); setAnulaNote(""); }} style={{ flex:1, padding:"9px", background:anulaNote?B.red:B.border, color:anulaNote?"var(--bg-surface)":B.textSec, border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:anulaNote?"pointer":"not-allowed", fontFamily:"inherit" }}>Anular pago</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
