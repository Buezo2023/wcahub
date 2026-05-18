import { useState } from "react";

const B = {
  primary:"#155266", primaryHov:"#0f3d4d", primaryDim:"#e8f3f6",
  secondary:"#ffbb23", secondaryDim:"#fff4d2", accent:"#fab82c",
  dark:"#0f3d4d", bg:"#f5f7fa", white:"#ffffff",
  text:"#1f2933", textSec:"#6b7280", border:"#d1dde3", borderLight:"#e8f3f6",
  green:"#059669", greenDim:"#d1fae5", red:"#dc2626", redDim:"#fee2e2",
  amber:"#ffbb23", amberDim:"#fff4d2",
};

const NAV = [
  { id:"overview",      icon:"ti-layout-dashboard", label:"Sistema"         },
  { id:"prices",        icon:"ti-coin",              label:"Precios"         },
  { id:"roles",         icon:"ti-shield-lock",       label:"Roles"          },
  { id:"cycle",         icon:"ti-refresh",           label:"Ciclo"          },
  { id:"holidays",      icon:"ti-calendar",          label:"Festivos"       },
  { id:"gamification",  icon:"ti-trophy",            label:"Gamificación"   },
  { id:"integrations",  icon:"ti-plug",              label:"Integraciones"  },
  { id:"notifications", icon:"ti-bell",              label:"Notificaciones" },
  { id:"audit",         icon:"ti-list-details",      label:"Auditoría"      },
  { id:"banks",         icon:"ti-building-bank",     label:"Cuentas banco"  },
];

const INITIAL_PRICES = {
  ingles:   { label:"Inglés completo",   interval:"mensual",    price:95  },
  va:       { label:"Asistente Virtual", interval:"mensual",    price:75  },
  combo:    { label:"Inglés + VA",       interval:"mensual",    price:170 },
  beca:     { label:"Beca inglés",       interval:"trimestral", price:50  },
};

const XP_ACTIONS = [
  { key:"attend_class",    label:"Asistir a clase en vivo",           xp:50  },
  { key:"pass_exam_1st",   label:"Aprobar examen al 1er intento",     xp:100 },
  { key:"perfect_score",   label:"Nota perfecta en examen (100%)",    xp:200 },
  { key:"practice_unit",   label:"Completar práctica 24/7",           xp:25  },
  { key:"streak_7",        label:"Racha de 7 días activo",            xp:150 },
  { key:"no_absence_month",label:"0 faltas en el mes",                xp:250 },
  { key:"complete_level",  label:"Completar un nivel (U12 aprobada)", xp:500 },
  { key:"refer_friend",    label:"Referir un amigo activo",           xp:300 },
];

const RANKS = [
  { rank:"Explorer",  icon:"🥉", minXp:0,    color:"#92400e", bg:B.amberDim },
  { rank:"Learner",   icon:"🥈", minXp:500,  color:B.primary, bg:B.primaryDim },
  { rank:"Achiever",  icon:"🥇", minXp:2000, color:"#3c3489", bg:"#eeedfe" },
  { rank:"WCA Pro",   icon:"⭐", minXp:5000, color:B.dark,    bg:B.bg },
];

const INTEGRATIONS = [
  { id:"stripe",    name:"Stripe",           status:"connected", key:"sk_live_••••••••1234", icon:"ti-credit-card",    color:B.green },
  { id:"ms365",     name:"Microsoft 365",    status:"connected", key:"tenant: wca.edu.hn",   icon:"ti-brand-windows",  color:B.green },
  { id:"teams",     name:"Microsoft Teams",  status:"connected", key:"Integrado con M365",   icon:"ti-video",          color:B.green },
  { id:"twilio",    name:"Twilio WhatsApp",  status:"connected", key:"AC••••••••••••••ef92",  icon:"ti-brand-whatsapp", color:B.green },
  { id:"bunny",     name:"Bunny.net (Plan B)",status:"pending",  key:"Sin configurar",       icon:"ti-video",          color:B.amber },
  { id:"sendgrid",  name:"SendGrid Email",   status:"connected", key:"SG.••••••••••••zx81",  icon:"ti-mail",           color:B.green },
  { id:"analytics", name:"Google Analytics", status:"pending",   key:"Sin configurar",       icon:"ti-chart-bar",      color:B.amber },
];

const AUDIT_LOG = [
  { user:"Admin WCA",    action:"Precio modificado",     detail:"Inglés: $95 → $100",           time:"Hace 2h",    color:B.amber  },
  { user:"IT WCA",       action:"Integración conectada", detail:"Twilio WhatsApp API",           time:"Hace 5h",    color:B.green  },
  { user:"Gestor Cobros",action:"Pago confirmado",       detail:"WCA-B1-0821 · María López",     time:"Hace 6h",    color:B.primary},
  { user:"Admin WCA",    action:"Rol asignado",          detail:"Ana Mejía → Coordinadora",      time:"Ayer",       color:B.primary},
  { user:"Sistema",      action:"Ciclo avanzado",        detail:"Todos los niveles → U9",        time:"Lun 9 Jun",  color:B.textSec},
  { user:"Super Admin",  action:"Festivo creado",        detail:"15 Sep — Día Independencia HN", time:"Hace 3 días",color:B.amber  },
  { user:"IT WCA",       action:"Backup completado",     detail:"BD + assets · 2.3 GB",          time:"Hace 4 días",color:B.green  },
  { user:"Sistema",      action:"Certificado emitido",   detail:"Isabel Navarro — Nivel B1",     time:"Hace 5 días",color:B.green  },
];

const BANKS = [
  { name:"BAC Credomatic", account:"0123-4567-8901", type:"Corriente", holder:"WCA Academy S.A.", active:true },
  { name:"BI Honduras",    account:"9876-5432-1098", type:"Ahorro",    holder:"WCA Academy S.A.", active:true },
  { name:"Ficohsa",        account:"4455-6677-8899", type:"Corriente", holder:"WCA Academy S.A.", active:false },
];

const NOTIF_TEMPLATES = [
  { key:"new_unit",     channel:"WhatsApp", trigger:"Lunes 00:00 CST", preview:"🎓 Nueva unidad disponible: *{unit_title}*. Abre tu portal en wcahub.com 📚" },
  { key:"class_remind", channel:"WhatsApp", trigger:"3h antes de clase", preview:"⏰ Tu clase es en 3 horas: *{level} {time}*. Link Teams: {teams_link}" },
  { key:"exam_passed",  channel:"In-app",   trigger:"Al aprobar examen", preview:"✅ ¡Aprobaste U{unit}! La siguiente unidad ya está desbloqueada." },
  { key:"payment_due",  channel:"WhatsApp", trigger:"3 días antes vencim.", preview:"💳 Tu pago vence en 3 días. Monto: *${amount}*. Paga en wcahub.com" },
  { key:"level_up",     channel:"Email",    trigger:"Al subir de nivel", preview:"🏆 ¡Felicidades! Completaste {from_level} y ahora estás en *{to_level}*. Tu certificado está disponible." },
  { key:"welcome",      channel:"Email",    trigger:"Al activar cuenta", preview:"👋 ¡Bienvenido/a a WCA! Tu cuenta está activa. Tu primera clase es el {first_class_date} a las {first_class_time}." },
];

const CYCLE_LEVELS = [
  { level:"A1", unit:9,  title:"Comforts",  started:"6 Ene 2025",  students:55, status:"active" },
  { level:"A2", unit:6,  title:"Places",    started:"6 Ene 2025",  students:32, status:"active" },
  { level:"B1", unit:9,  title:"Images",    started:"6 Ene 2025",  students:33, status:"active" },
  { level:"B2", unit:4,  title:"Processes", started:"6 Ene 2025",  students:8,  status:"active" },
  { level:"C1", unit:7,  title:"Unit 7",    started:"6 Ene 2025",  students:6,  status:"active" },
];

const HOLIDAYS = [
  { date:"15 Sep 2025", name:"Independencia de Honduras", affects:true  },
  { date:"3 Oct 2025",  name:"Día del Soldado Hondureño", affects:false },
  { date:"12 Oct 2025", name:"Día de la Raza",            affects:true  },
  { date:"25 Dic 2025", name:"Navidad",                   affects:true  },
  { date:"1 Ene 2026",  name:"Año Nuevo",                 affects:true  },
];

const ROLES_LIST = [
  { name:"Super Admin",      users:1, perms:["Todo el sistema","Sin restricciones"] },
  { name:"Admin",            users:3, perms:["Estudiantes","Grupos","Matrículas","Pagos operativos"] },
  { name:"Docente",          users:8, perms:["Sus grupos","Asistencia","Exámenes","Contenido"] },
  { name:"Contabilidad",     users:2, perms:["Reportes financieros","Audit log","Exportaciones"] },
  { name:"Gestor de cobros", users:3, perms:["Pagos","Recibos","Estado de cuenta"] },
  { name:"Coord. académica", users:2, perms:["Grupos","Horarios","Becas upgrade"] },
  { name:"Ventas",           users:4, perms:["CRM","Leads","Placement Test","Trial"] },
  { name:"Marketing",        users:2, perms:["Métricas","Cupones","UTM"] },
  { name:"Soporte",          users:2, perms:["Perfil estudiante","Reset contraseña"] },
  { name:"IT",               users:2, perms:["Configuración","Integraciones","Backups"] },
  { name:"Estudiante",       users:134, perms:["Su portal","Su contenido","Sus pagos"] },
];

function Badge({ text, bg, color }) {
  return <span style={{ fontSize:9, padding:"2px 8px", borderRadius:20, background:bg, color, fontWeight:600 }}>{text}</span>;
}
function Pill({ text, color }) {
  return <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, background:`${color}18`, color, fontWeight:600, border:`0.5px solid ${color}40` }}>{text}</span>;
}
function SectionTitle({ children }) {
  return <div style={{ fontSize:10, fontWeight:600, color:B.textSec, textTransform:"uppercase", letterSpacing:.8, marginBottom:10, paddingBottom:8, borderBottom:`1px solid ${B.borderLight}` }}>{children}</div>;
}

export default function SuperAdmin() {
  const [view, setView]           = useState("overview");
  const [prices, setPrices]       = useState(INITIAL_PRICES);
  const [editing, setEditing]     = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [xpValues, setXpValues]   = useState(Object.fromEntries(XP_ACTIONS.map(a=>[a.key,a.xp])));
  const [leaderReward, setLeaderReward] = useState(15);
  const [holidays, setHolidays]   = useState(HOLIDAYS);
  const [newHoliday, setNewHoliday] = useState({ date:"", name:"", affects:true });

  function savePrice(key) {
    const n = parseFloat(tempPrice);
    if (!isNaN(n) && n > 0) setPrices(p => ({ ...p, [key]: { ...p[key], price: n } }));
    setEditing(null);
  }

  return (
    <div style={{ display:"flex", minHeight: "100vh", height: "100vh", background:B.bg,  overflow:"hidden",  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width:196, background:B.dark, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0 }}>
        <div style={{ padding:"18px 16px 16px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>
          <div style={{ fontSize:10, color:B.secondary, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>World Connect Academy</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Super Admin</div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", marginTop:2 }}>Control total del sistema</div>
        </div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{
            display:"flex", alignItems:"center", gap:9, padding:"8px 16px",
            border:"none", background: view===item.id ? "rgba(255,187,35,.15)" : "transparent",
            color: view===item.id ? B.secondary : "rgba(255,255,255,.45)",
            fontSize:11, cursor:"pointer", textAlign:"left",
            borderLeft:`2px solid ${view===item.id ? B.secondary : "transparent"}`,
            transition:"all .15s", fontFamily:"inherit", fontWeight: view===item.id ? 600 : 400,
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize:14, width:16, textAlign:"center" }} aria-hidden="true" />
            {item.label}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:"12px 16px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:B.secondary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:B.dark }}>SA</div>
            <div>
              <div style={{ fontSize:11, color:"#fff", fontWeight:600 }}>Super Admin</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.3)" }}>wcahub.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <div style={{ height:52, background:B.white, borderBottom:`1px solid ${B.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 22px", flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:B.text }}>
            {{ overview:"Estado del sistema", prices:"Gestión de precios", roles:"Roles y permisos", cycle:"Control del ciclo", holidays:"Calendario de festivos", gamification:"Configuración de gamificación", integrations:"Integraciones", notifications:"Plantillas de notificaciones", audit:"Log de auditoría", banks:"Cuentas bancarias" }[view]}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Pill text="wcahub.com · Activo" color={B.green} />
            <Pill text="Versión 1.0" color={B.primary} />
          </div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:20 }}>

          {/* ── OVERVIEW ── */}
          {view === "overview" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
                {[
                  { label:"Estudiantes activos", val:"134",    icon:"ti-users",          color:B.primary },
                  { label:"Ingresos anuales",     val:"$94.3k", icon:"ti-coin",           color:B.secondary },
                  { label:"Uptime plataforma",    val:"99.8%",  icon:"ti-server",         color:B.green },
                  { label:"Integraciones activas",val:"5/7",    icon:"ti-plug",           color:B.amber },
                ].map((s,i) => (
                  <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:"14px 16px", borderTop:`3px solid ${s.color}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, color:B.textSec }}>{s.label}</div>
                      <i className={`ti ${s.icon}`} style={{ fontSize:16, color:s.color }} aria-hidden="true" />
                    </div>
                    <div style={{ fontSize:24, fontWeight:700, color:B.text }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <SectionTitle>Acceso rápido</SectionTitle>
                  {[
                    { icon:"ti-coin",         label:"Cambiar precio de un plan",      action:"prices" },
                    { icon:"ti-refresh",      label:"Reiniciar ciclo de un nivel",    action:"cycle" },
                    { icon:"ti-calendar",     label:"Agregar festivo al calendario",  action:"holidays" },
                    { icon:"ti-plug",         label:"Ver estado de integraciones",    action:"integrations" },
                    { icon:"ti-shield-lock",  label:"Gestionar roles del equipo",     action:"roles" },
                    { icon:"ti-list-details", label:"Consultar log de auditoría",     action:"audit" },
                  ].map((a,i) => (
                    <button key={i} onClick={() => setView(a.action)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:8, cursor:"pointer", marginBottom:6, textAlign:"left", fontFamily:"inherit" }}>
                      <i className={`ti ${a.icon}`} style={{ fontSize:14, color:B.primary, flexShrink:0 }} aria-hidden="true" />
                      <span style={{ fontSize:11, color:B.text }}>{a.label}</span>
                      <i className="ti ti-chevron-right" style={{ marginLeft:"auto", fontSize:12, color:B.textSec }} aria-hidden="true" />
                    </button>
                  ))}
                </div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <SectionTitle>Últimas acciones del sistema</SectionTitle>
                  {AUDIT_LOG.slice(0,6).map((a,i) => (
                    <div key={i} style={{ display:"flex", gap:9, padding:"7px 0", borderBottom: i<5?`1px solid ${B.borderLight}`:"none" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:a.color, flexShrink:0, marginTop:5 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:B.text }}><strong>{a.user}</strong> — {a.action}</div>
                        <div style={{ fontSize:10, color:B.textSec, marginTop:1 }}>{a.detail}</div>
                      </div>
                      <div style={{ fontSize:9, color:B.textSec, whiteSpace:"nowrap" }}>{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PRICES ── */}
          {view === "prices" && (
            <div style={{ maxWidth:600 }}>
              <div style={{ background:B.amberDim, border:`1px solid ${B.amber}40`, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:11, color:"#92400e", display:"flex", gap:8 }}>
                <i className="ti ti-info-circle" style={{ fontSize:13, flexShrink:0, marginTop:1 }} aria-hidden="true" />
                Un cambio de precio solo aplica a nuevas inscripciones y renovaciones. Los estudiantes activos conservan su precio actual hasta notificación.
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${B.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text }}>Planes y precios</div>
                  <Badge text="Cambios en tiempo real" bg={B.greenDim} color="#065f46" />
                </div>
                {Object.entries(prices).map(([key, plan]) => (
                  <div key={key} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px", borderBottom:`1px solid ${B.borderLight}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{plan.label}</div>
                      <div style={{ fontSize:10, color:B.textSec, marginTop:2 }}>Cobro {plan.interval} · Stripe Subscriptions</div>
                    </div>
                    {editing === key ? (
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <span style={{ fontSize:13, color:B.textSec }}>$</span>
                        <input autoFocus value={tempPrice} onChange={e=>setTempPrice(e.target.value)} onKeyDown={e=>e.key==="Enter"&&savePrice(key)} style={{ width:72, padding:"6px 8px", border:`2px solid ${B.primary}`, borderRadius:7, fontSize:14, fontWeight:700, color:B.primary, textAlign:"center", fontFamily:"inherit" }} />
                        <button onClick={() => savePrice(key)} style={{ padding:"6px 12px", background:B.primary, color:"#fff", border:"none", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✓</button>
                        <button onClick={() => setEditing(null)} style={{ padding:"6px 10px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:7, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ fontSize:22, fontWeight:800, color:B.primary }}>${plan.price}</div>
                        <div style={{ fontSize:10, color:B.textSec }}>/{plan.interval==="trimestral"?"trim":"mes"}</div>
                        <button onClick={() => { setEditing(key); setTempPrice(String(plan.price)); }} style={{ padding:"5px 12px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>✎ Editar</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginTop:12 }}>
                <SectionTitle>Cupones activos</SectionTitle>
                {[
                  { code:"WCA20", disc:"20%", uses:"48/100", expires:"30 Jun 2025" },
                  { code:"BIENVENIDO",  disc:"$15", uses:"12/50",  expires:"31 Dic 2025" },
                ].map((c,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<1?`1px solid ${B.borderLight}`:"none" }}>
                    <code style={{ background:B.bg, padding:"4px 10px", borderRadius:6, fontSize:12, fontWeight:700, color:B.primary, border:`1px solid ${B.border}` }}>{c.code}</code>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:11, color:B.text }}>Descuento: <strong>{c.disc}</strong> · Usos: {c.uses}</div>
                      <div style={{ fontSize:10, color:B.textSec }}>Vence: {c.expires}</div>
                    </div>
                    <button style={{ fontSize:10, padding:"4px 10px", background:B.redDim, color:B.red, border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Desactivar</button>
                  </div>
                ))}
                <button style={{ marginTop:10, width:"100%", padding:"8px", background:B.primaryDim, color:B.primary, border:`1px solid ${B.border}`, borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ Crear cupón</button>
              </div>
            </div>
          )}

          {/* ── ROLES ── */}
          {view === "roles" && (
            <div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ padding:"12px 16px", borderBottom:`1px solid ${B.border}`, display:"flex", justifyContent:"space-between" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:B.text }}>Roles del sistema ({ROLES_LIST.length})</div>
                  <button style={{ fontSize:10, padding:"4px 12px", background:B.primary, color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>+ Nuevo rol</button>
                </div>
                {ROLES_LIST.map((r,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 16px", borderBottom:`1px solid ${B.borderLight}` }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:B.primary, flexShrink:0 }}>
                      {r.name.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:B.text }}>{r.name}</div>
                        <Badge text={`${r.users} usuario${r.users!==1?"s":""}`} bg={B.bg} color={B.textSec} />
                      </div>
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {r.perms.map(p => <Badge key={p} text={p} bg={B.primaryDim} color={B.primary} />)}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                      <button style={{ fontSize:9, padding:"3px 8px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Editar</button>
                      {r.name !== "Super Admin" && r.name !== "Estudiante" && (
                        <button style={{ fontSize:9, padding:"3px 8px", background:B.redDim, color:B.red, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>Eliminar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CYCLE ── */}
          {view === "cycle" && (
            <div>
              <div style={{ background:B.primaryDim, border:`1px solid ${B.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:11, color:B.primary, display:"flex", gap:8 }}>
                <i className="ti ti-alert-triangle" style={{ fontSize:13, flexShrink:0 }} aria-hidden="true" />
                Reiniciar un ciclo es una operación irreversible. Solo hacerlo si hay un error real en el reloj del sistema.
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {CYCLE_LEVELS.map(c => (
                  <div key={c.level} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
                      <div style={{ width:48, height:48, borderRadius:12, background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:B.primary }}>{c.level}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:B.text }}>Nivel {c.level} — Ciclo activo</div>
                        <div style={{ fontSize:11, color:B.textSec }}>U{c.unit}: {c.title} · {c.students} estudiantes · Iniciado: {c.started}</div>
                      </div>
                      <Pill text="Activo" color={B.green} />
                    </div>
                    <div style={{ display:"flex", gap:3, marginBottom:12 }}>
                      {Array.from({length:12},(_,i)=>(
                        <div key={i} style={{ flex:1, height:8, borderRadius:4, background: i+1<c.unit?B.primary:i+1===c.unit?B.secondary:B.bg, transition:"background .3s" }} />
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, color:B.textSec, marginBottom:4 }}>Mover a unidad específica</div>
                        <select style={{ padding:"6px 10px", border:`1px solid ${B.border}`, borderRadius:7, fontSize:11, background:B.bg, fontFamily:"inherit" }}>
                          {Array.from({length:12},(_,i) => <option key={i} selected={i+1===c.unit}>Unidad {i+1}</option>)}
                        </select>
                      </div>
                      <div style={{ display:"flex", gap:6, alignSelf:"flex-end" }}>
                        <button style={{ padding:"7px 14px", background:B.secondaryDim, color:"#92400e", border:`1px solid ${B.amber}40`, borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Aplicar cambio</button>
                        <button style={{ padding:"7px 14px", background:B.redDim, color:B.red, border:`1px solid ${B.red}40`, borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Reiniciar → U1</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HOLIDAYS ── */}
          {view === "holidays" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:14 }}>
              <div>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"12px 16px", borderBottom:`1px solid ${B.border}`, fontSize:12, fontWeight:700, color:B.text }}>Festivos configurados 2025–2026</div>
                  {holidays.map((h,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 16px", borderBottom:`1px solid ${B.borderLight}` }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:h.affects?B.red:B.amber, flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:500, color:B.text }}>{h.name}</div>
                        <div style={{ fontSize:10, color:B.textSec }}>{h.date}</div>
                      </div>
                      <Badge text={h.affects?"Pausa ciclo":"Sin efecto"} bg={h.affects?B.redDim:B.amberDim} color={h.affects?B.red:"#92400e"} />
                      <button onClick={() => setHolidays(hh => hh.filter((_,j)=>j!==i))} style={{ fontSize:9, padding:"3px 8px", background:B.redDim, color:B.red, border:"none", borderRadius:5, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, alignSelf:"start" }}>
                <SectionTitle>Agregar festivo</SectionTitle>
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:B.textSec, display:"block", marginBottom:4 }}>Fecha</label>
                  <input type="date" value={newHoliday.date} onChange={e=>setNewHoliday(h=>({...h,date:e.target.value}))} style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:11, background:B.bg, fontFamily:"inherit" }} />
                </div>
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:B.textSec, display:"block", marginBottom:4 }}>Nombre del festivo</label>
                  <input value={newHoliday.name} onChange={e=>setNewHoliday(h=>({...h,name:e.target.value}))} placeholder="Ej: Día de la Independencia" style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:11, background:B.bg, fontFamily:"inherit" }} />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, color:B.textSec, display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                    <input type="checkbox" checked={newHoliday.affects} onChange={e=>setNewHoliday(h=>({...h,affects:e.target.checked}))} />
                    Pausa el ciclo este día
                  </label>
                  <div style={{ fontSize:10, color:B.textSec, marginTop:4 }}>Si está activo, el reloj del ciclo no avanzará ese lunes.</div>
                </div>
                <button onClick={() => { if(newHoliday.date&&newHoliday.name){setHolidays(h=>[...h,{...newHoliday}]);setNewHoliday({date:"",name:"",affects:true})} }} style={{ width:"100%", padding:"9px", background:B.primary, color:"#fff", border:"none", borderRadius:9, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Agregar festivo</button>
              </div>
            </div>
          )}

          {/* ── GAMIFICATION ── */}
          {view === "gamification" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                  <SectionTitle>Puntos XP por acción — editar valor</SectionTitle>
                  {XP_ACTIONS.map(a => (
                    <div key={a.key} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${B.borderLight}` }}>
                      <div style={{ flex:1, fontSize:11, color:B.text }}>{a.label}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <input type="number" value={xpValues[a.key]} onChange={e=>setXpValues(v=>({...v,[a.key]:parseInt(e.target.value)||0}))} style={{ width:60, padding:"4px 6px", border:`1px solid ${B.border}`, borderRadius:6, fontSize:11, fontWeight:700, color:B.primary, textAlign:"center", background:B.bg, fontFamily:"inherit" }} />
                        <span style={{ fontSize:10, color:B.textSec }}>XP</span>
                      </div>
                    </div>
                  ))}
                  <button style={{ marginTop:10, width:"100%", padding:"8px", background:B.primary, color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Guardar cambios</button>
                </div>
                <div>
                  <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16, marginBottom:12 }}>
                    <SectionTitle>Rangos (XP mínimo para cada rango)</SectionTitle>
                    {RANKS.map(r => (
                      <div key={r.rank} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 10px", background:r.bg, borderRadius:8, marginBottom:6, border:`0.5px solid ${r.color}30` }}>
                        <span style={{ fontSize:18 }}>{r.icon}</span>
                        <div style={{ flex:1, fontSize:12, fontWeight:600, color:r.color }}>{r.rank}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <input type="number" defaultValue={r.minXp} style={{ width:64, padding:"4px 6px", border:`1px solid ${B.border}`, borderRadius:6, fontSize:11, fontWeight:700, color:r.color, textAlign:"center", background:"#fff", fontFamily:"inherit" }} />
                          <span style={{ fontSize:10, color:B.textSec }}>XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                    <SectionTitle>Recompensa del leaderboard mensual</SectionTitle>
                    <div style={{ fontSize:11, color:B.textSec, marginBottom:10, lineHeight:1.6 }}>El top 3 del mes recibe un descuento en su próxima mensualidad. Define el porcentaje:</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <input type="range" min={5} max={50} value={leaderReward} onChange={e=>setLeaderReward(+e.target.value)} style={{ flex:1 }} />
                      <div style={{ fontSize:20, fontWeight:800, color:B.secondary, minWidth:44, textAlign:"right" }}>{leaderReward}%</div>
                    </div>
                    <div style={{ fontSize:10, color:B.textSec, marginTop:6 }}>Descuento aplicado automáticamente el 1° del mes siguiente.</div>
                    <button style={{ marginTop:12, width:"100%", padding:"8px", background:B.primary, color:"#fff", border:"none", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Guardar configuración</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── INTEGRATIONS ── */}
          {view === "integrations" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {INTEGRATIONS.map(int => (
                <div key={int.id} style={{ background:B.white, border:`1px solid ${int.status==="connected"?B.border:B.amber}`, borderRadius:12, padding:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:B.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <i className={`ti ${int.icon}`} style={{ fontSize:20, color:int.status==="connected"?B.primary:B.amber }} aria-hidden="true" />
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{int.name}</div>
                        <div style={{ fontSize:10, color:B.textSec, marginTop:1 }}>{int.key}</div>
                      </div>
                    </div>
                    <Badge text={int.status==="connected"?"✓ Conectado":"⚠ Pendiente"} bg={int.status==="connected"?B.greenDim:B.amberDim} color={int.status==="connected"?"#065f46":"#92400e"} />
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button style={{ flex:1, fontSize:10, padding:"6px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>{int.status==="connected"?"Reconfigurar":"Conectar"}</button>
                    {int.status==="connected" && <button style={{ fontSize:10, padding:"6px 10px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>Probar</button>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {view === "notifications" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {NOTIF_TEMPLATES.map((t,i) => (
                <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:B.text }}>{t.key.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}</div>
                      <div style={{ fontSize:10, color:B.textSec, marginTop:2, display:"flex", gap:8 }}>
                        <span>Canal: <strong>{t.channel}</strong></span>
                        <span>·</span>
                        <span>Disparo: <strong>{t.trigger}</strong></span>
                      </div>
                    </div>
                    <button style={{ fontSize:10, padding:"5px 12px", background:B.primaryDim, color:B.primary, border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>Editar plantilla</button>
                  </div>
                  <div style={{ background:B.bg, borderRadius:8, padding:"9px 12px", fontSize:11, color:B.text, fontStyle:"italic", lineHeight:1.6 }}>
                    {t.preview}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── AUDIT ── */}
          {view === "audit" && (
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:B.white, border:`1px solid ${B.border}`, borderRadius:9, padding:"7px 12px" }}>
                  <i className="ti ti-search" style={{ color:B.textSec, fontSize:14 }} aria-hidden="true" />
                  <input placeholder="Buscar en el log..." style={{ border:"none", outline:"none", fontSize:12, background:"transparent", color:B.text, flex:1, fontFamily:"inherit" }} />
                </div>
                <button style={{ padding:"7px 14px", background:B.white, border:`1px solid ${B.border}`, borderRadius:9, fontSize:11, cursor:"pointer", color:B.textSec, fontFamily:"inherit" }}>↓ Exportar log</button>
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                  <thead>
                    <tr style={{ background:B.bg }}>
                      {["Usuario","Acción","Detalle","Tiempo"].map(h => (
                        <th key={h} style={{ padding:"9px 12px", textAlign:"left", fontSize:9, fontWeight:600, color:B.textSec, letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AUDIT_LOG.map((a,i) => (
                      <tr key={i} style={{ borderTop:`1px solid ${B.borderLight}` }}>
                        <td style={{ padding:"10px 12px" }}><span style={{ fontWeight:600, color:B.text }}>{a.user}</span></td>
                        <td style={{ padding:"10px 12px" }}><span style={{ color:a.color, fontWeight:500 }}>{a.action}</span></td>
                        <td style={{ padding:"10px 12px", color:B.textSec }}>{a.detail}</td>
                        <td style={{ padding:"10px 12px", color:B.textSec, whiteSpace:"nowrap" }}>{a.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BANKS ── */}
          {view === "banks" && (
            <div style={{ maxWidth:600 }}>
              <div style={{ background:B.primaryDim, border:`1px solid ${B.border}`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:11, color:B.primary, display:"flex", gap:8 }}>
                <i className="ti ti-shield-lock" style={{ fontSize:13, flexShrink:0 }} aria-hidden="true" />
                Los datos bancarios son administrados por Contabilidad. El Super Admin puede agregar o desactivar bancos.
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, overflow:"hidden", marginBottom:12 }}>
                {BANKS.map((b,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom:`1px solid ${B.borderLight}`, background:!b.active?"#fafafa":"transparent" }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <i className="ti ti-building-bank" style={{ fontSize:20, color:B.primary }} aria-hidden="true" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:b.active?B.text:B.textSec }}>{b.name}</div>
                      <div style={{ fontSize:10, color:B.textSec, marginTop:2 }}>{b.type} · {b.account} · {b.holder}</div>
                    </div>
                    <Badge text={b.active?"Activo":"Inactivo"} bg={b.active?B.greenDim:B.bg} color={b.active?"#065f46":B.textSec} />
                    <button style={{ fontSize:10, padding:"5px 10px", background:b.active?B.redDim:B.greenDim, color:b.active?B.red:"#065f46", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>{b.active?"Desactivar":"Activar"}</button>
                  </div>
                ))}
              </div>
              <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:12, padding:16 }}>
                <SectionTitle>Agregar banco</SectionTitle>
                {[
                  { label:"Nombre del banco", ph:"Banco de Occidente" },
                  { label:"Número de cuenta", ph:"0000-0000-0000" },
                  { label:"Titular de la cuenta", ph:"WCA Academy S.A." },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, color:B.textSec, display:"block", marginBottom:4 }}>{f.label}</label>
                    <input placeholder={f.ph} style={{ width:"100%", padding:"8px 12px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:11, background:B.bg, fontFamily:"inherit" }} />
                  </div>
                ))}
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11, color:B.textSec, display:"block", marginBottom:4 }}>Tipo de cuenta</label>
                  <select style={{ width:"100%", padding:"8px 10px", border:`1px solid ${B.border}`, borderRadius:8, fontSize:11, background:B.bg, fontFamily:"inherit" }}>
                    <option>Corriente</option><option>Ahorro</option>
                  </select>
                </div>
                <button style={{ width:"100%", padding:"9px", background:B.primary, color:"#fff", border:"none", borderRadius:9, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Agregar banco</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
