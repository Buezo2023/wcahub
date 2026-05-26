import { useState, useMemo, useEffect} from "react";
import { api } from "../lib/api.js";
import { useNavigate } from 'react-router-dom';
import { toast } from "../lib/toast.jsx";
import { MobileLayout, useMobile } from "../lib/MobileLayout.jsx";
import { SuperAdminBar } from "../lib/SuperAdminBar.jsx";
import { supabase } from "../lib/supabase.js";
import { notify, Notifs } from "../lib/notify.js";

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
// PENDING_TRANSFERS removed — using real Supabase data

// PAYMENT_HISTORY removed — using real Supabase data

// realOverdue removed — using real Supabase data

// AUDIT_LOG removed — usar datos reales de Supabase
// AUDIT_LOG_UNUSED removed — using real Supabase data

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
  const navigate = useNavigate();

  // Session guard — only listen for sign-out (PrivateRoute handles role verification)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT" || (!s && event !== "INITIAL_SESSION")) {
        navigate("/", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const [view, setView]             = useState("home");
  const isMobile = useMobile();
  const [sideOpen, setSideOpen] = useState(false);
  const [selTransfer, setSelTransfer] = useState(null);
  const [confirmed, setConfirmed]   = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [registerForm, setRegForm]  = useState({ student:"", amount:"", method:"Efectivo", bank:"", note:"", code:"" });
  const [regSuccess, setRegSuccess] = useState(false);
  const [anulaModal, setAnulaModal] = useState(null);
  const [anulaNote, setAnulaNote]   = useState("");
  const [searchHist, setSearchHist] = useState("");
  const [proofModal, setProofModal] = useState(null);

  // Real data from Supabase
  const [realPending,  setRealPending]  = useState([]);
  const [realHistory,  setRealHistory]  = useState([]);
  const [realOverdue,  setRealOverdue]  = useState([]);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [dataError,    setDataError]    = useState(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setDataLoading(true);
        // Load pending comprobantes (status='pending')
        const { data: pends } = await supabase
          .from("payments")
          .select("id, amount, method, status, receipt_url, created_at, students(id, profiles(full_name, email, phone)), enrollments(program_id)")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(50);

        if (pends?.length) {
          setRealPending(pends.map(p => ({
            id:       p.id,
            _dbId:    p.id,
            student:  p.students?.profiles?.full_name || p.students?.profiles?.email || "Estudiante",
            level:    "—",
            program:  { en:"Inglés", va:"VA", va_mkt:"VA·Mkt" }[p.enrollments?.program_id] || "—",
            amount:   Number(p.amount),
            code:     p.id.slice(0,8).toUpperCase(),
            method:   p.method || "Transferencia",
            bank:     "—",
            date:     new Date(p.created_at).toLocaleString("es-HN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }),
            proof:    !!p.receipt_url,
            proofUrl: p.receipt_url,
            urgent:   false,
            studentId: p.students?.id,
            contact:   p.students?.profiles?.phone || "",
          })));
        }

        // Load confirmed/history
        const { data: hist } = await supabase
          .from("payments")
          .select("id, amount, method, status, created_at, stripe_id, students(profiles(full_name, email))")
          .in("status", ["confirmed", "refunded", "failed"])
          .order("created_at", { ascending: false })
          .limit(100);

        if (hist?.length) {
          setRealHistory(hist.map(p => ({
            id:        p.id,
            student:   p.students?.profiles?.full_name || p.students?.profiles?.email || "—",
            amount:    Number(p.amount),
            method:    p.method || "Transferencia",
            status:    p.status,
            date:      new Date(p.created_at).toLocaleString("es-HN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }),
            code:      p.stripe_id || p.id.slice(0,8).toUpperCase(),
            action_by: p.method === "stripe" ? "Sistema" : "Gestor",
            note:      "",
          })));
        }

        // Real overdue detection: active enrollments where next_payment_date < today
        const today = new Date().toISOString().slice(0, 10);
        const { data: overdueEnrolls } = await supabase
          .from("enrollments")
          .select("id, next_payment_date, price_locked, students(id, profiles(full_name, phone)), groups(level)")
          .eq("status", "active")
          .lt("next_payment_date", today)
          .not("next_payment_date", "is", null)
          .limit(50);

        // Also include manually suspended (older method)
        const { data: susp } = await supabase
          .from("enrollments")
          .select("id, next_payment_date, price_locked, students(id, profiles(full_name, phone)), groups(level)")
          .eq("status", "suspended")
          .limit(20);

        const allOverdue = [...(overdueEnrolls || []), ...(susp || [])];
        // Deduplicate by id
        const unique = allOverdue.filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i);

        if (unique.length) {
          setRealOverdue(unique.map(e => {
            const dueDate = e.next_payment_date ? new Date(e.next_payment_date) : new Date();
            const daysLate = Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)));
            return {
              id:          e.id,
              student:     e.students?.profiles?.full_name || "—",
              level:       e.groups?.level || "—",
              days:        daysLate,
              amount:      e.price_locked || 95,
              contact:     e.students?.profiles?.phone || "",
              dueDate:     e.next_payment_date,
              lastContact: "Sin datos",
            };
          }));
        }
      } catch(e) {
        setDataError("Error cargando datos: " + e.message);
      } finally {
        setDataLoading(false);
      }
    }
    loadPayments();
  }, []);

  // Merge: prefer real data, fallback to demo
  const displayPending = realPending;
  const displayHistory = realHistory;

  const pending = displayPending.filter(t => !confirmed.includes(t.id));
  const filteredHist = useMemo(() => displayHistory.filter(p =>
    !searchHist || (p.student||"").toLowerCase().includes(searchHist.toLowerCase()) || (p.code||"").toLowerCase().includes(searchHist.toLowerCase())
  ), [searchHist, displayHistory]);

  async function confirmTransfer(id) {
    setConfirmed(c => [...c, id]);
    setSelTransfer(null);
    // Find the transfer to get student info
    const transfer = [...(pending||[]), ...(transfers||[])].find(t => t.id === id);
    if (transfer?._dbPaymentId) {
      // Update payment status in Supabase
      await supabase.from("payments")
        .update({ status: "confirmed" })
        .eq("id", transfer._dbPaymentId)
        .catch(console.error);
    }
    // Find student profile to notify
    if (transfer?.studentId || transfer?.student) {
      const name = transfer.student || "";
      const { data: prof } = await supabase.from("profiles")
        .select("id").ilike("full_name", `%${name.split(" ")[0]}%`).limit(1);
      if (prof?.[0]) {
        const n = Notifs.paymentConfirmed(transfer.amount || "—");
        await notify(prof[0].id, n.type, n.title, n.body, n.link).catch(() => {});
      }
    }
  }

  const methodColor = m => m==="Stripe"?[B.primaryDim,B.primary]:m==="Transferencia"?[B.amberDim,"#92400e"]:[B.greenDim,"#065f46"];
  const statusColor = s => s==="confirmed"?[B.greenDim,"#065f46"]:s==="refunded"?[B.primaryDim,B.primary]:s==="failed"?[B.redDim,B.red]:[B.amberDim,"#92400e"];
  const statusLabel = s => ({confirmed:"✓ Confirmado",refunded:"↩ Reembolsado",failed:"✗ Fallido",pending:"⏳ Pendiente"}[s]);

  return (
    <div style={{ display:"flex", flexDirection:isMobile?"column":"row", minHeight:"100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif", position:"relative" }}>
      <SuperAdminBar />

      {/* SIDEBAR */}
      <aside style={{ width:isMobile?260:196, background:B.primary, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0, zIndex:isMobile?9990:1, transform:isMobile?(sideOpen?"translateX(0)":"translateX(-100%)"):"none", transition:"transform .25s ease", maxWidth:isMobile?"80vw":"none" }}>
        <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:8 }}>
          <div style={{display:"flex",alignItems:"center",gap:11}}>
              <svg viewBox="0 0 32 32" style={{width:34,height:34,flexShrink:0}}><rect width="32" height="32" rx="8" fill="#ffbb23"/><text x="16" y="23" fontFamily="sans-serif" fontSize="18" fontWeight="800" fill="#155266" textAnchor="middle">W</text></svg>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>WCA <span style={{color:"#ffbb23"}}>Hub</span></div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>Gestor de Cobros</div>
              </div>
            </div>
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
            {item.id==="overdue" && realOverdue.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:11, background:B.red, color:"var(--bg-surface)", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{realOverdue.length}</span>
            )}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:"12px 16px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:B.secondary }}>GC</div>
            <div><div style={{ fontSize:12, color:"var(--bg-surface)", fontWeight:600 }}>Gestor WCA</div><div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Cobros</div></div>
          </div>
        </div>
      

        <button
          onClick={()=>navigate("/")}
          title="Cerrar sesión"
          aria-label="Cerrar sesión y volver al inicio"
          style={{ width:"100%", display:"flex", alignItems:"center", gap:9, padding:"10px 18px", background:"transparent", border:"none", borderTop:"1px solid rgba(255,255,255,.08)", marginTop:8, color:"rgba(255,255,255,.35)", fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
          onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.background="rgba(220,38,38,.15)";}}
          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.35)";e.currentTarget.style.background="transparent";}}>
          <i className="ti ti-logout" style={{fontSize:14}} aria-hidden="true"/>
          Cerrar sesión
        </button>
      </aside>
      {isMobile && sideOpen && <div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,zIndex:9989,background:"rgba(0,0,0,.4)"}}/>}


      {/* MAIN */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ height:52, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:B.text }}>
            {{ home:"Resumen del día", pending:"Transferencias pendientes", register:"Registrar pago", history:"Historial de cobros", overdue:"Pagos vencidos", receipts:"Recibos", audit:"Mi auditoría" }[view]}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {pending.length > 0 && <div style={{ fontSize:12, background:B.amberDim, color:"#92400e", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⏳ {pending.length} por confirmar</div>}
            {realOverdue.length > 0 && <div style={{ fontSize:12, background:B.redDim, color:B.red, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>⚠ {realOverdue.length} vencidos</div>}
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:18 }}>

          {/* HOME */}
          {view==="home" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                <Stat label="Cobrado hoy" value="$360" sub="3 pagos" color={B.green} icon="ti-trending-up" />
                <Stat label="Por confirmar" value={pending.length} sub="Transferencias" color={B.amber} icon="ti-clock" />
                <Stat label="Vencidos" value={realOverdue.length} sub="+30 días" color={B.red} icon="ti-alert-circle" />
                <Stat label="Cobrado (mes)" value={`$${realHistory.filter(p=>p.status==="confirmed").reduce((s,p)=>s+(p.amount||0),0).toLocaleString()}`} sub={`${realHistory.filter(p=>p.status==="confirmed").length} pagos`} color={B.primary} icon="ti-coin" />
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
                    <div style={{ fontSize:isMobile?22:32, marginBottom:8 }}>🎉</div>
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
                <button onClick={()=>{
                  const rows = filteredHist;
                  const headers = ["Estudiante","Monto","Método","Código","Estado","Fecha"];
                  const csv = [headers, ...rows.map(r=>[r.student,r.amount,r.method,r.code,r.status,r.date])]
                    .map(row=>row.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
                  const blob = new Blob([csv], {type:"text/csv"});
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `cobros-${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                }} style={{ padding:"7px 14px", background:B.white, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", color:B.textSec, fontFamily:"inherit" }}>↓ Excel</button>
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

          {/* realOverdue */}
          {view==="overdue" && (
            <div>
              <div style={{ background:B.redDim, border:`1px solid ${B.red}40`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:B.red, display:"flex", gap:8 }}>
                <i className="ti ti-alert-circle" style={{ fontSize:14, flexShrink:0, marginTop:1 }} aria-hidden="true" />
                Estudiantes con pago vencido más de 30 días. Sus cuentas están suspendidas. Contáctalos para gestionar la regularización.
              </div>
              {realOverdue.map((o,i) => (
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
                    <button onClick={async()=>{
                      const phone = (o.contact||"").replace(/[\s\-()]/g,"");
                      // Try API first (Twilio), fallback to wa.me
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const res = await fetch("/api/whatsapp/send", {
                          method: "POST",
                          headers: { "Content-Type":"application/json", Authorization:`Bearer ${session?.access_token}` },
                          body: JSON.stringify({
                            to: phone,
                            templateId: "paymentOverdue",
                            templateData: [o.student, o.amount, o.days],
                          }),
                        });
                        const data = await res.json();
                        if (data.data?.skipped || !res.ok) throw new Error("API not available");
                        toast.success("✓ WhatsApp enviado via Twilio");
                      } catch {
                        // Fallback to wa.me direct link
                        const msg = encodeURIComponent(`Hola ${o.student}, tu pago de \$${o.amount} lleva ${o.days} días vencido en WCA Academy. ¿Podemos ayudarte a regularizarlo? 🙏`);
                        window.open(`https://wa.me/${phone.replace(/^\+/,"")}?text=${msg}`, "_blank");
                      }
                    }} style={{ flex:1, fontSize:12, padding:"8px", background:"#ecfdf5", color:"#059669", border:"1px solid #059669", borderRadius:8, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                      <i className="ti ti-brand-whatsapp" style={{ fontSize:13, verticalAlign:-1, marginRight:4 }} aria-hidden="true" />
                      Contactar por WhatsApp
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
                {displayHistory.filter(p=>p.status==="confirmed").slice(0,10).map((p,i) => (
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
                {([]).map((a,i) => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"11px 14px", borderBottom:i<0?`1px solid ${B.borderLight}`:"none" }}>
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

          {/* ── PRECIOS ── */}
          {view==="precios" && (
            <div>
              <div style={{ background:"var(--bg-surface-subtle)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--text-secondary)", display:"flex", gap:8 }}>
                <i className="ti ti-info-circle" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true"/>
                Visualización y edición de precios de programas. Los cambios requieren aprobación del Admin.
              </div>
              <div style={{ maxWidth:580 }}>
                {[
                  { icon:"🇬🇧", name:"Inglés completo",      price:95,  interval:"mes",       color:"#155266" },
                  { icon:"💻",  name:"Asistente Virtual",    price:75,  interval:"mes",       color:"#7c3aed" },
                  { icon:"⚡",  name:"Inglés + VA",           price:170, interval:"mes",       color:"#0f3d4d" },
                  { icon:"🎓",  name:"Beca Inglés",           price:50,  interval:"trimestre", color:"#059669" },
                  { icon:"📱",  name:"VA · Marketing Digital",price:95, interval:"3 meses",  color:"#db2777" },
                  { icon:"⚖️",  name:"VA · Legal Assistant",  price:95, interval:"3 meses",  color:"#0e7490" },
                  { icon:"🏥",  name:"VA · Cuidador Remoto",  price:95, interval:"3 meses",  color:"#059669" },
                ].map((p,i,arr) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:i===0?"14px 14px 0 0":i===arr.length-1?"0 0 14px 14px":"0", borderTop:i>0?"none":"1px solid var(--border)", boxShadow:i===0?"var(--shadow-sm)":"none" }}>
                    <span style={{ fontSize:20 }}>{p.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{p.name}</div>
                      <div style={{ fontSize:11, color:"var(--text-secondary)" }}>/{p.interval}</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:800, color:p.color }}>${p.price}</div>
                    <span style={{ fontSize:11, padding:"3px 9px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", borderRadius:20 }}>Solo lectura</span>
                  </div>
                ))}
                <div style={{ marginTop:12, fontSize:12, color:"var(--text-tertiary)", textAlign:"center" }}>
                  Para modificar precios contactá al Admin o Super Admin.
                </div>
              </div>
            </div>
          )}

        </div>
      </main>


      {/* MODAL: Rechazar transferencia */}
      {rejectModal && (
        <div role="dialog" aria-modal="true" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setRejectModal(null); }}>
          <div style={{ background:B.white, borderRadius:16, padding:24, width:"min(380px,100vw - 32px)", border:`1px solid ${B.border}`, animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0, marginBottom:4 }}>
              <div style={{ fontSize:15, fontWeight:700, color:B.text }}>Rechazar transferencia</div>
              <button onClick={()=>setRejectModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:B.textSec, fontSize:18 }} aria-label="Cerrar">✕</button>
            </div>
            <div style={{ fontSize:13, color:B.textSec, marginBottom:14 }}>
              {rejectModal.student} · ${rejectModal.amount} · {rejectModal.code}
            </div>
            <div style={{ background:B.redDim, border:`1px solid ${B.red}40`, borderRadius:9, padding:"9px 12px", marginBottom:14, fontSize:12, color:B.red }}>
              El comprobante no es válido o el monto no corresponde. Se notificará al estudiante.
            </div>
            <label style={{ fontSize:13, color:B.textSec, display:"block", marginBottom:5 }}>Motivo del rechazo (obligatorio)</label>
            <input
              aria-label="Motivo del rechazo"
              value={anulaNote}
              onChange={e=>setAnulaNote(e.target.value)}
              placeholder="Ej: Comprobante ilegible, monto incorrecto..."
              style={{ width:"100%", padding:"9px 12px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:13, background:B.bg, fontFamily:"inherit", marginBottom:14, color:B.text }}
            />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ setRejectModal(null); setAnulaNote(""); }} style={{ flex:1, padding:"9px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:B.textSec }}>Cancelar</button>
              <button
                onClick={()=>{ if(anulaNote){ setConfirmed(c=>[...c,rejectModal.id]); setRejectModal(null); setAnulaNote(""); } }}
                style={{ flex:1, padding:"9px", background:anulaNote?B.red:B.border, color:anulaNote?"var(--bg-surface)":B.textSec, border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:anulaNote?"pointer":"not-allowed", fontFamily:"inherit" }}>
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ver comprobante */}
      {proofModal && (
        <div role="dialog" aria-modal="true" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}>
          <div style={{ background:B.white, borderRadius:16, padding:24, width:"min(380px,100vw - 32px)", border:`1px solid ${B.border}` }}>
            <div style={{ fontSize:15, fontWeight:700, color:B.text, marginBottom:4 }}>Comprobante de transferencia</div>
            <div style={{ fontSize:13, color:B.textSec, marginBottom:14 }}>{proofModal.student} · ${proofModal.amount} · {proofModal.code}</div>
            {proofModal?.proofUrl ? (
              <div style={{ marginBottom:14 }}>
                <img src={proofModal.proofUrl} alt="Comprobante de pago"
                  style={{ width:"100%", maxHeight:320, objectFit:"contain", borderRadius:10, border:`1px solid ${B.border}` }}
                  onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
                />
                <div style={{ display:"none", background:B.bg, borderRadius:10, height:80, alignItems:"center", justifyContent:"center", color:B.textSec, fontSize:12 }}>
                  No se pudo cargar la imagen
                </div>
                <div style={{ display:"flex", gap:8, marginTop:8 }}>
                  <a href={proofModal.proofUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, padding:"4px 10px", background:B.primaryDim, color:B.primary, borderRadius:6, textDecoration:"none", fontWeight:600 }}>
                    ↗ Abrir original
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ background:B.bg, borderRadius:10, height:120, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, border:`1px solid ${B.border}` }}>
                <div style={{ textAlign:"center", color:B.textSec }}>
                  <i className="ti ti-file-off" style={{ fontSize:isMobile?20:28, display:"block", marginBottom:6 }} aria-hidden="true" />
                  <div style={{ fontSize:12 }}>Sin comprobante adjunto</div>
                  <div style={{ fontSize:11, color:B.textSec, marginTop:2 }}>El estudiante no subió imagen</div>
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setProofModal(null)} style={{ flex:1, padding:"9px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:9, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cerrar</button>
              <button onClick={() => { confirmTransfer(proofModal.id); setProofModal(null); }} style={{ flex:2, padding:"9px", background:B.green, color:"var(--bg-surface)", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓ Confirmar pago</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Anular pago */}
      {anulaModal && (
        <div role="dialog" aria-modal="true" style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, borderRadius:16 }}>
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
      {isMobile && <button onClick={()=>setSideOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:9988,width:50,height:50,borderRadius:"50%",background:B.primary,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.25)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sideOpen?"\u2715":"\u2630"}</button>}
    </div>
  );
}
