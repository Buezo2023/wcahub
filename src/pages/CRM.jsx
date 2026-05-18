import { useState } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const STAGES = [
  { id: "nuevo",      label: "Nuevo",          color: "var(--text-secondary)", bg: "var(--text-primary)" },
  { id: "contactado", label: "Contactado",      color: "#155266", bg: "var(--wca-primary-dim)" },
  { id: "test",       label: "Test enviado",    color: "#155266", bg: "var(--wca-primary-dim)" },
  { id: "propuesta",  label: "Propuesta",       color: "#92400e", bg: "var(--amber-dim)" },
  { id: "convertido", label: "Convertido",      color: "#059669", bg: "var(--green-dim)" },
  { id: "perdido",    label: "Perdido",         color: "#dc2626", bg: "var(--red-dim)" },
];

const LEADS = [
  { id: 1, name: "Carlos Mendoza", email: "carlos.m@gmail.com", phone: "+504 9812-3344", country: "🇭🇳 Honduras", source: "Instagram", stage: "propuesta", score: 87, level: "A2", program: "Inglés + VA", date: "Hace 2 h", tags: ["Becas"], notes: "Muy interesado en el programa de VA. Trabaja como freelancer. Prefiere horario nocturno.", lastMsg: "Perfecto, ¿cuándo puedo inscribirme?", activity: [{ type: "msg", text: "Respondió WhatsApp — interés confirmado", time: "Hace 2 h" }, { type: "test", text: "Completó Placement Test — Nivel A2 (8/20)", time: "Hace 5 h" }, { type: "call", text: "Primer contacto realizado por WhatsApp", time: "Ayer" }, { type: "lead", text: "Lead ingresó desde Instagram", time: "Ayer" }] },
  { id: 2, name: "Ana Sofía Reyes", email: "ana.reyes@outlook.com", phone: "+57 310 987 6543", country: "🇨🇴 Colombia", source: "Referido", stage: "test", score: 72, level: null, program: "Inglés", date: "Hace 4 h", tags: [], notes: "La refirió María López (estudiante activa). Espera resultado del placement test.", lastMsg: "Gracias, ya hice el test.", activity: [{ type: "test", text: "Link del Placement Test enviado", time: "Hace 4 h" }, { type: "msg", text: "Contactada por WhatsApp, buen rapport", time: "Ayer" }, { type: "lead", text: "Lead ingresó por referido de María López", time: "Hace 2 días" }] },
  { id: 3, name: "Diego Fuentes", email: "diego.fuentes@proton.me", phone: "+52 55 1234 5678", country: "🇲🇽 México", source: "Google Ads", stage: "contactado", score: 45, level: null, program: null, date: "Hace 1 día", tags: ["Seguimiento"], notes: "Contestó el primer mensaje pero no ha respondido desde ayer.", lastMsg: "Hola, me interesa saber más.", activity: [{ type: "msg", text: "Envié información del programa, sin respuesta", time: "Ayer" }, { type: "msg", text: "Primer contacto — respondió con interés", time: "Hace 1 día" }, { type: "lead", text: "Lead desde Google Ads", time: "Hace 2 días" }] },
  { id: 4, name: "Valentina Cruz", email: "val.cruz@gmail.com", phone: "+54 11 5555 7777", country: "🇦🇷 Argentina", source: "WhatsApp directo", stage: "nuevo", score: 60, level: null, program: "Inglés", date: "Hace 3 h", tags: ["Urgente"], notes: "Escribió directo al WhatsApp de WCA. Quiere empezar lo antes posible.", lastMsg: "Quiero inscribirme ya, ¿cómo es el proceso?", activity: [{ type: "lead", text: "Lead entró por WhatsApp directo", time: "Hace 3 h" }] },
  { id: 5, name: "Rodrigo Paredes", email: "rparedes@empresa.hn", phone: "+504 9944-2211", country: "🇭🇳 Honduras", source: "LinkedIn", stage: "convertido", score: 98, level: "B1", program: "Inglés", date: "Hace 2 días", tags: ["B2B"], notes: "Empresa paga el curso. Quiere también inscribir a 2 compañeros de trabajo.", lastMsg: "Listo, ya hice el pago. ¡Gracias!", activity: [{ type: "conv", text: "¡Convertido! Matrícula B1 activada", time: "Hace 2 días" }, { type: "msg", text: "Confirmó pago por transferencia", time: "Hace 3 días" }, { type: "test", text: "Nivel B1 detectado (14/20)", time: "Hace 4 días" }, { type: "lead", text: "Lead desde LinkedIn", time: "Hace 5 días" }] },
  { id: 6, name: "Lucia Moreno", email: "lucimoreno@gmail.com", phone: "+34 612 345 678", country: "🇪🇸 España", source: "Instagram", stage: "perdido", score: 20, level: "B2", program: null, date: "Hace 1 semana", tags: [], notes: "No contestó 3 seguimientos. Zona horaria difícil (madrugada HN).", lastMsg: "Gracias pero no puedo ahora.", activity: [{ type: "lost", text: "Marcado como perdido — sin respuesta", time: "Hace 1 semana" }, { type: "msg", text: "3er intento de contacto sin respuesta", time: "Hace 8 días" }, { type: "test", text: "Nivel B2 detectado (12/20)", time: "Hace 9 días" }] },
];

const TASKS = [
  { id: 1, lead: "Carlos Mendoza", text: "Enviar link de inscripción y horarios disponibles", due: "Hoy, 3:00 PM", priority: "high" },
  { id: 2, lead: "Diego Fuentes", text: "Segundo seguimiento por WhatsApp", due: "Hoy, 5:00 PM", priority: "medium" },
  { id: 3, lead: "Ana Sofía Reyes", text: "Revisar resultado del placement test y presentar oferta", due: "Mañana, 10:00 AM", priority: "high" },
  { id: 4, lead: "Valentina Cruz", text: "Primer contacto — responder WhatsApp de inmediato", due: "Urgente", priority: "high" },
];

const SOURCE_DATA = [
  { label: "Instagram", pct: 38, count: 14 },
  { label: "Referidos", pct: 25, count: 9 },
  { label: "Google Ads", pct: 18, count: 7 },
  { label: "WhatsApp", pct: 12, count: 4 },
  { label: "LinkedIn", pct: 7, count: 3 },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const stageOf = id => STAGES.find(s => s.id === id);
const scoreColor = s => s >= 80 ? "#059669" : s >= 50 ? "#ffbb23" : "#dc2626";
const scoreBg   = s => s >= 80 ? "var(--green-dim)" : s >= 50 ? "var(--amber-dim)" : "var(--red-dim)";
const actIcon = t => ({ msg:"💬", test:"📋", call:"📞", lead:"✨", conv:"🎉", lost:"❌" })[t] || "•";

const TAG_COLOR = { "Becas": ["var(--wca-primary-dim)","#155266"], "Seguimiento": ["var(--amber-dim)","#92400e"], "Urgente": ["var(--red-dim)","#dc2626"], "B2B": ["var(--wca-primary-dim)","#155266"] };

// ─── COMPONENTS ──────────────────────────────────────────────────────────────
function Tag({ label }) {
  const [bg, col] = TAG_COLOR[label] || ["var(--text-primary)","var(--text-secondary)"];
  return <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, background: bg, color: col, fontWeight: 600, letterSpacing: 0.3 }}>{label}</span>;
}

function ScoreBadge({ score }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap: 5 }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: scoreBg(score), display:"flex", alignItems:"center", justifyContent:"center", fontSize: 13, fontWeight: 700, color: scoreColor(score), flexShrink: 0 }}>{score}</div>
      <div style={{ width: 48, height: 4, background: "var(--border)", borderRadius: 2, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${score}%`, background: scoreColor(score), borderRadius: 2 }} />
      </div>
    </div>
  );
}

function LeadCard({ lead, onClick, selected }) {
  const stage = stageOf(lead.stage);
  return (
    <div onClick={onClick} style={{
      background: selected ? "var(--text-primary)" : "var(--bg-surface)",
      border: `1px solid ${selected ? "#0f3d4d" : "var(--border)"}`,
      borderRadius: 12, padding: "12px 14px", cursor: "pointer",
      transition: "all .15s", marginBottom: 11
    }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom: 11 }}>
        <div style={{ display:"flex", alignItems:"center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius:"50%", background: stage.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize: 13, fontWeight: 700, color: stage.color, flexShrink:0 }}>
            {lead.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: selected ? "var(--text-primary)" : "var(--text-primary)", lineHeight: 1.2 }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: selected ? "var(--text-secondary)" : "var(--text-secondary)", marginTop: 2 }}>{lead.country} · {lead.source}</div>
          </div>
        </div>
        <ScoreBadge score={lead.score} />
      </div>
      <div style={{ fontSize: 12, color: selected ? "var(--text-secondary)" : "var(--text-secondary)", marginBottom: 9, fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>"{lead.lastMsg}"</div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", gap: 4, flexWrap:"wrap" }}>
          <span style={{ fontSize: 11, padding:"2px 8px", borderRadius:20, background: stage.bg, color: stage.color, fontWeight:600 }}>{stage.label}</span>
          {lead.tags.map(t => <Tag key={t} label={t} />)}
        </div>
        <div style={{ fontSize: 11, color: selected ? "var(--text-secondary)" : "var(--text-secondary)" }}>{lead.date}</div>
      </div>
    </div>
  );
}

function LeadDetail({ lead, onClose }) {
  const [tab, setTab] = useState("info");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState(lead.notes);
  const [sentTest, setSentTest] = useState(false);
  const stage = stageOf(lead.stage);

  const tabs = [{ id:"info", label:"Info" }, { id:"activity", label:"Actividad" }, { id:"notas", label:"Notas" }];

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid #d1dde3", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background: stage.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color: stage.color }}>
              {lead.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{lead.name}</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:2 }}>{lead.country} · {lead.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"var(--text-primary)", border:"none", borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:15, color:"var(--text-secondary)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        {/* Stage pills */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          {STAGES.map(s => (
            <span key={s.id} style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background: s.id === lead.stage ? s.color : s.bg, color: s.id === lead.stage ? "var(--bg-surface)" : s.color, fontWeight:600, cursor:"pointer", transition:"all .15s" }}>{s.label}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid #d1dde3", flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"9px 4px", border:"none", background:"transparent", fontSize:13, fontWeight:500, color: tab===t.id ? "var(--text-primary)" : "var(--text-secondary)", borderBottom: tab===t.id ? "2px solid #1f2933" : "2px solid transparent", cursor:"pointer", transition:"all .15s" }}>{t.label}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, overflow:"auto", padding:"14px 18px" }}>

        {tab === "info" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
              {[
                ["📱 Teléfono", lead.phone],
                ["📧 Email", lead.email],
                ["🌍 País", lead.country],
                ["🔗 Fuente", lead.source],
                ["📋 Nivel detectado", lead.level || "Sin test aún"],
                ["📚 Programa de interés", lead.program || "Por definir"],
              ].map(([label, val]) => (
                <div key={label} style={{ background:"var(--text-primary)", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontSize:11, color:"var(--text-secondary)", marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:13, color:"var(--text-primary)", fontWeight:500 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Score */}
            <div style={{ background:"var(--text-primary)", borderRadius:10, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:8, fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>Lead Score</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontSize:24, fontWeight:800, color: scoreColor(lead.score) }}>{lead.score}</div>
                <div style={{ flex:1, height:8, background:"var(--border)", borderRadius:4, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${lead.score}%`, background: scoreColor(lead.score), borderRadius:4, transition:"width .6s" }} />
                </div>
              </div>
              <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:6 }}>
                {lead.score >= 80 ? "🔥 Alta probabilidad de conversión" : lead.score >= 50 ? "⚡ Potencial medio — requiere seguimiento" : "❄️ Lead frío — monitorear"}
              </div>
            </div>

            {/* Actions */}
            <div style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600, letterSpacing:.5, textTransform:"uppercase", marginBottom:8 }}>Acciones rápidas</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {!lead.level && !sentTest && (
                <button onClick={() => setSentTest(true)} style={{ padding:"9px 14px", background:"#155266", color:"var(--bg-surface)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left", transition:"opacity .15s" }}>
                  📋 Enviar Placement Test
                </button>
              )}
              {sentTest && (
                <div style={{ padding:"9px 14px", background:"var(--wca-primary-dim)", borderRadius:10, fontSize:13, color:"#155266", fontWeight:500 }}>✓ Link enviado — esperando resultado</div>
              )}
              {lead.level && (
                <div style={{ padding:"9px 14px", background:"var(--green-dim)", borderRadius:10, fontSize:13, color:"#059669", fontWeight:500 }}>✓ Nivel detectado: {lead.level} — listo para propuesta</div>
              )}
              <button style={{ padding:"9px 14px", background:"var(--text-primary)", color:"var(--bg-surface)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                💬 Enviar mensaje WhatsApp
              </button>
              {lead.stage === "propuesta" && (
                <button style={{ padding:"9px 14px", background:"#059669", color:"var(--bg-surface)", border:"none", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                  🎉 Marcar como convertido
                </button>
              )}
              <button style={{ padding:"9px 14px", background:"transparent", color:"#dc2626", border:"1px solid #fecaca", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                ❌ Marcar como perdido
              </button>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div style={{ display:"flex", flexDirection:"column", gap:0, position:"relative" }}>
            <div style={{ position:"absolute", left:11, top:16, bottom:0, width:1.5, background:"var(--border)" }} />
            {lead.activity.map((a, i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", position:"relative", zIndex:1 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:"var(--text-primary)", border:"1.5px solid #d1dde3", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{actIcon(a.type)}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:"var(--text-primary)", lineHeight:1.5 }}>{a.text}</div>
                  <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "notas" && (
          <div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600, letterSpacing:.5, textTransform:"uppercase", marginBottom:8 }}>Notas del asesor</div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              style={{ width:"100%", minHeight:120, border:"1px solid #d1dde3", borderRadius:10, padding:"10px 12px", fontSize:13, color:"var(--text-primary)", lineHeight:1.7, background:"var(--text-primary)", resize:"vertical", fontFamily:"inherit" }}
              placeholder="Añade notas sobre este lead..." />
            <button style={{ marginTop:8, padding:"8px 16px", background:"var(--text-primary)", color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>Guardar nota</button>

            <div style={{ fontSize:12, color:"var(--text-secondary)", fontWeight:600, letterSpacing:.5, textTransform:"uppercase", margin:"16px 0 8px" }}>Agregar recordatorio</div>
            <div style={{ display:"flex", gap:8 }}>
              <input type="text" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ej: Llamar mañana a las 10am" style={{ flex:1, padding:"8px 10px", border:"1px solid #d1dde3", borderRadius:8, fontSize:13, background:"var(--text-primary)", fontFamily:"inherit" }} />
              <button onClick={()=>setMsg("")} style={{ padding:"8px 14px", background:"#155266", color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>+ Tarea</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function WCACRM() {
  const [view, setView] = useState("pipeline");
  const [selected, setSelected] = useState(LEADS[0]);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [tasks, setTasks] = useState(TASKS);

  const filtered = LEADS.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === "all" || l.stage === filterStage;
    return matchSearch && matchStage;
  });

  const byStage = id => filtered.filter(l => l.stage === id);
  const convRate = Math.round((LEADS.filter(l => l.stage === "convertido").length / LEADS.length) * 100);

  return (
    <div style={{ display:"flex", minHeight: "100vh", background:"var(--text-primary)", overflow:"hidden", border:"1px solid #d1dde3", fontFamily:"'DM Sans','Outfit','Segoe UI',sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width:200, background:"var(--text-primary)", display:"flex", flexDirection:"column", padding:"18px 0", flexShrink:0 }}>
        <div style={{ padding:"0 18px 16px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>
          <div style={{ fontSize:16, fontWeight:800, color:"var(--text-primary)", letterSpacing:-0.5 }}>WCA <span style={{ color:"#155266" }}>CRM</span></div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:2, letterSpacing:1, textTransform:"uppercase" }}>Ventas · Enrollment</div>
        </div>

        {[
          { id:"pipeline", icon:"⬡", label:"Pipeline" },
          { id:"lista",    icon:"≡", label:"Todos los leads" },
          { id:"tareas",   icon:"✓", label:"Mis tareas" },
          { id:"metricas", icon:"↗", label:"Métricas" },
        ].map(item => (
          <button key={item.id} onClick={() => setView(item.id)} style={{
            display:"flex", alignItems:"center", gap:9, padding:"11px 20px", border:"none", background: view===item.id ? "rgba(124,58,237,.2)" : "transparent",
            color: view===item.id ? "#155266" : "rgba(255,255,255,.4)", fontSize:13, cursor:"pointer", textAlign:"left",
            borderLeft: view===item.id ? "2px solid #155266" : "2px solid transparent", transition:"all .15s", fontFamily:"inherit"
          }}>
            <span style={{ fontSize:15 }}>{item.icon}</span>{item.label}
          </button>
        ))}

        <div style={{ marginTop:"auto", padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--wca-primary-dim)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#155266" }}>VN</div>
            <div>
              <div style={{ fontSize:13, color:"var(--text-primary)", fontWeight:500 }}>Asesor WCA</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>Ventas</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <div style={{ padding:"0 20px", height:52, background:"var(--bg-surface)", borderBottom:"1px solid #d1dde3", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>
            {{ pipeline:"Pipeline de ventas", lista:"Todos los leads", tareas:"Mis tareas", metricas:"Métricas de conversión" }[view]}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:12, background:"var(--wca-primary-dim)", color:"#155266", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{LEADS.filter(l=>l.stage!=="convertido"&&l.stage!=="perdido").length} activos</div>
            <div style={{ fontSize:12, background:"var(--green-dim)", color:"#059669", padding:"3px 10px", borderRadius:20, fontWeight:600 }}>{convRate}% conv.</div>
            <button style={{ padding:"6px 14px", background:"var(--text-primary)", color:"var(--bg-surface)", border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>+ Nuevo lead</button>
          </div>
        </div>

        {/* ── PIPELINE ── */}
        {view === "pipeline" && (
          <div style={{ flex:1, overflow:"hidden", display:"flex", gap:0 }}>
            <div style={{ flex:1, overflow:"auto", padding:"16px 18px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(180px,1fr))", gap:10, minWidth:560 }}>
                {STAGES.filter(s => s.id !== "perdido").map(stage => (
                  <div key={stage.id} style={{ background:"var(--text-primary)", borderRadius:12, padding:"12px 12px 6px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background: stage.color }} />
                        <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{stage.label}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color: stage.color, background: stage.bg, padding:"1px 8px", borderRadius:20 }}>{byStage(stage.id).length}</span>
                    </div>
                    {byStage(stage.id).length === 0 && (
                      <div style={{ textAlign:"center", padding:"20px 0", fontSize:12, color:"var(--border-strong)" }}>Sin leads</div>
                    )}
                    {byStage(stage.id).map(lead => (
                      <LeadCard key={lead.id} lead={lead} selected={selected?.id === lead.id} onClick={() => setSelected(lead)} />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Lead detail panel */}
            {selected && (
              <div style={{ width:320, background:"var(--bg-surface)", borderLeft:"1px solid #d1dde3", flexShrink:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                <LeadDetail lead={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        )}

        {/* ── LISTA ── */}
        {view === "lista" && (
          <div style={{ flex:1, overflow:"hidden", display:"flex" }}>
            <div style={{ flex:1, overflow:"auto", padding:"16px 18px" }}>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..." style={{ flex:1, padding:"8px 12px", border:"1px solid #d1dde3", borderRadius:10, fontSize:13, background:"var(--text-primary)", fontFamily:"inherit" }} />
                <select value={filterStage} onChange={e=>setFilterStage(e.target.value)} style={{ padding:"8px 10px", border:"1px solid #d1dde3", borderRadius:10, fontSize:13, background:"var(--text-primary)", fontFamily:"inherit" }}>
                  <option value="all">Todos</option>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={{ background:"var(--bg-surface)", borderRadius:12, border:"1px solid #d1dde3", overflow:"hidden" }}>
                <table style={{ width:"100%", fontSize:13, borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:"var(--text-primary)" }}>
                      {["Lead","País","Fuente","Programa","Nivel","Score","Etapa",""].map(h => (
                        <th key={h} style={{ padding:"9px 10px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-secondary)", letterSpacing:.5, textTransform:"uppercase", borderBottom:"1px solid #d1dde3" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((l,i) => {
                      const st = stageOf(l.stage);
                      return (
                        <tr key={l.id} onClick={() => { setSelected(l); }} style={{ borderBottom:"1px solid #1f2933", cursor:"pointer", background: selected?.id===l.id ? "var(--text-primary)" : "transparent", transition:"background .1s" }}>
                          <td style={{ padding:"9px 10px" }}>
                            <div style={{ fontWeight:600, color:"var(--text-primary)" }}>{l.name}</div>
                            <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{l.email}</div>
                          </td>
                          <td style={{ padding:"9px 10px", color:"var(--text-secondary)" }}>{l.country}</td>
                          <td style={{ padding:"9px 10px", color:"var(--text-secondary)" }}>{l.source}</td>
                          <td style={{ padding:"9px 10px", color:"var(--text-secondary)" }}>{l.program || "—"}</td>
                          <td style={{ padding:"9px 10px" }}>{l.level ? <span style={{ background:"var(--wca-primary-dim)", color:"#155266", padding:"2px 8px", borderRadius:20, fontWeight:600, fontSize:11 }}>{l.level}</span> : <span style={{ color:"var(--border-strong)" }}>—</span>}</td>
                          <td style={{ padding:"9px 10px" }}>
                            <span style={{ fontSize:13, fontWeight:700, color: scoreColor(l.score) }}>{l.score}</span>
                          </td>
                          <td style={{ padding:"9px 10px" }}>
                            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background: st.bg, color: st.color, fontWeight:600 }}>{st.label}</span>
                          </td>
                          <td style={{ padding:"9px 10px" }}>
                            <button onClick={e=>{e.stopPropagation();setSelected(l);}} style={{ fontSize:11, padding:"3px 9px", background:"var(--text-primary)", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit", color:"var(--text-secondary)" }}>Ver →</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {selected && (
              <div style={{ width:300, background:"var(--bg-surface)", borderLeft:"1px solid #d1dde3", flexShrink:0, overflow:"hidden", display:"flex", flexDirection:"column" }}>
                <LeadDetail lead={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        )}

        {/* ── TAREAS ── */}
        {view === "tareas" && (
          <div style={{ flex:1, overflow:"auto", padding:"18px 20px" }}>
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              {[["🔥","Alta",tasks.filter(t=>t.priority==="high").length,"var(--red-dim)","#dc2626"],["⚡","Media",tasks.filter(t=>t.priority==="medium").length,"var(--amber-dim)","#92400e"],["✓","Completadas",0,"var(--green-dim)","#059669"]].map(([icon,label,n,bg,col]) => (
                <div key={label} style={{ flex:1, background:"var(--bg-surface)", border:"1px solid #d1dde3", borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:18 }}>{icon}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:col, marginTop:4 }}>{n}</div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"var(--bg-surface)", borderRadius:12, border:"1px solid #d1dde3", padding:"14px 16px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--text-secondary)", letterSpacing:.5, textTransform:"uppercase", marginBottom:12 }}>Pendientes hoy</div>
              {tasks.map((t, i) => (
                <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0", borderTop: i > 0 ? "1px solid #1f2933" : "none" }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background: t.priority==="high" ? "#dc2626" : "#92400e", flexShrink:0, marginTop:4 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:"var(--text-primary)", marginBottom:2 }}>{t.text}</div>
                    <div style={{ fontSize:12, color:"var(--text-secondary)" }}>Lead: <strong>{t.lead}</strong> · {t.due}</div>
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} style={{ fontSize:12, padding:"4px 10px", background:"var(--green-dim)", color:"#059669", border:"none", borderRadius:6, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>✓ Hecho</button>
                    <button style={{ fontSize:12, padding:"4px 10px", background:"var(--text-primary)", color:"var(--text-secondary)", border:"none", borderRadius:6, cursor:"pointer", fontFamily:"inherit" }}>Posponer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MÉTRICAS ── */}
        {view === "metricas" && (
          <div style={{ flex:1, overflow:"auto", padding:"18px 20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              {[
                ["Total leads","37","este mes",null],
                ["Convertidos","9",`${convRate}% conv.`,"#059669"],
                ["En pipeline","22","activos",null],
                ["Tasa promedio","4.2d","a conversión",null],
              ].map(([label,val,sub,col]) => (
                <div key={label} style={{ background:"var(--bg-surface)", border:"1px solid #d1dde3", borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:6 }}>{label}</div>
                  <div style={{ fontSize:22, fontWeight:800, color: col||"var(--text-primary)", lineHeight:1 }}>{val}</div>
                  <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div style={{ background:"var(--bg-surface)", border:"1px solid #d1dde3", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>Leads por etapa</div>
                {STAGES.map(s => {
                  const n = LEADS.filter(l => l.stage === s.id).length;
                  const pct = Math.round((n / LEADS.length) * 100);
                  return (
                    <div key={s.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                      <span style={{ fontSize:12, color:"var(--text-secondary)", width:80 }}>{s.label}</span>
                      <div style={{ flex:1, height:5, background:"var(--text-primary)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background: s.color, borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color: s.color, width:16, textAlign:"right" }}>{n}</span>
                    </div>
                  );
                })}
              </div>

              <div style={{ background:"var(--bg-surface)", border:"1px solid #d1dde3", borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:12 }}>Fuentes de leads</div>
                {SOURCE_DATA.map(s => (
                  <div key={s.label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                    <span style={{ fontSize:12, color:"var(--text-secondary)", width:70 }}>{s.label}</span>
                    <div style={{ flex:1, height:5, background:"var(--text-primary)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${s.pct}%`, background:"#155266", borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:"#155266", width:24, textAlign:"right" }}>{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
