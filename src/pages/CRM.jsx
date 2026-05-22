import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ─── Brand ───────────────────────────────────────────────────────
const P  = "#155266";
const PH = "#0f3d4d";
const PD = "#e8f3f6";
const Y  = "#ffbb23";
const YD = "#fff8e6";
const G  = "#059669";
const GD = "#ecfdf5";
const R  = "#dc2626";
const RD = "#fef2f2";
const A  = "#d97706";
const AD = "#fffbeb";
const PURPLE = "#7c3aed";

// ─── Stage config ────────────────────────────────────────────────
const STAGES = [
  { id:"nuevo",      label:"Nuevo",        icon:"✨", color:"#64748b", light:"#f1f5f9", count:1 },
  { id:"contactado", label:"Contactado",   icon:"💬", color:P,         light:PD,        count:1 },
  { id:"test",       label:"Test enviado", icon:"📋", color:PURPLE,    light:"#ede9fe",  count:1 },
  { id:"propuesta",  label:"Propuesta",    icon:"📄", color:A,         light:AD,         count:1 },
  { id:"convertido", label:"Convertido",   icon:"🎉", color:G,         light:GD,         count:1 },
  { id:"perdido",    label:"Perdido",      icon:"❌", color:R,         light:RD,         count:1 },
];

// ─── Data ─────────────────────────────────────────────────────────
const LEADS_INIT = [
  { id:1, name:"Carlos Mendoza",   email:"carlos.m@gmail.com",     phone:"+504 9812-3344",  country:"🇭🇳 Honduras",  source:"Instagram",   stage:"propuesta",  score:87, level:"A2",   program:"Inglés + VA",  date:"Hace 2 h",       tags:["Becas"],       notes:"Muy interesado en el programa de VA. Trabaja como freelancer. Prefiere horario nocturno.", lastMsg:"Perfecto, ¿cuándo puedo inscribirme?",         activity:[{type:"msg", text:"Respondió WhatsApp — interés confirmado",         time:"Hace 2 h"  },{type:"test",text:"Completó Placement Test — Nivel A2",time:"Hace 5 h"},{type:"call",text:"Primer contacto por WhatsApp",time:"Ayer"},{type:"lead",text:"Lead desde Instagram",time:"Ayer"}]},
  { id:2, name:"Ana Sofía Reyes",  email:"ana.reyes@outlook.com",  phone:"+57 310 987 6543", country:"🇨🇴 Colombia", source:"Referido",    stage:"test",       score:72, level:null,   program:"Inglés",       date:"Hace 4 h",       tags:[],              notes:"La refirió María López (estudiante activa). Espera resultado del placement test.",          lastMsg:"Gracias, ya hice el test.",                    activity:[{type:"test",text:"Link del Placement Test enviado",                  time:"Hace 4 h"  },{type:"msg",text:"Contactada por WhatsApp",time:"Ayer"},{type:"lead",text:"Lead por referido de María López",time:"Hace 2 días"}]},
  { id:3, name:"Diego Fuentes",    email:"diego.fuentes@proton.me",phone:"+52 55 1234 5678", country:"🇲🇽 México",   source:"Google Ads",  stage:"contactado", score:45, level:null,   program:null,           date:"Hace 1 día",     tags:["Seguimiento"], notes:"Contestó el primer mensaje pero no ha respondido desde ayer.",                             lastMsg:"Hola, me interesa saber más.",                 activity:[{type:"msg", text:"Envié información del programa, sin respuesta",    time:"Ayer"      },{type:"msg",text:"Primer contacto — respondió con interés",time:"Hace 1 día"},{type:"lead",text:"Lead desde Google Ads",time:"Hace 2 días"}]},
  { id:4, name:"Valentina Cruz",   email:"val.cruz@gmail.com",     phone:"+54 11 5555 7777", country:"🇦🇷 Argentina",source:"WhatsApp",    stage:"nuevo",      score:60, level:null,   program:"Inglés",       date:"Hace 3 h",       tags:["Urgente"],     notes:"Escribió directo al WhatsApp de WCA. Quiere empezar lo antes posible.",                    lastMsg:"Quiero inscribirme ya, ¿cómo es el proceso?",  activity:[{type:"lead",text:"Lead entró por WhatsApp directo",                  time:"Hace 3 h"  }]},
  { id:5, name:"Rodrigo Paredes",  email:"rparedes@empresa.hn",    phone:"+504 9944-2211",   country:"🇭🇳 Honduras",  source:"LinkedIn",    stage:"convertido", score:98, level:"B1",   program:"Inglés",       date:"Hace 2 días",    tags:["B2B"],         notes:"Empresa paga el curso. Quiere también inscribir a 2 compañeros.",                          lastMsg:"Listo, ya hice el pago. ¡Gracias!",            activity:[{type:"conv",text:"¡Convertido! Matrícula B1 activada",                time:"Hace 2 días"},{type:"msg",text:"Confirmó pago por transferencia",time:"Hace 3 días"},{type:"test",text:"Nivel B1 detectado",time:"Hace 4 días"},{type:"lead",text:"Lead desde LinkedIn",time:"Hace 5 días"}]},
  { id:6, name:"Lucia Moreno",     email:"lucimoreno@gmail.com",   phone:"+34 612 345 678",  country:"🇪🇸 España",   source:"Instagram",   stage:"perdido",    score:20, level:"B2",   program:null,           date:"Hace 1 semana",  tags:[],              notes:"No contestó 3 seguimientos. Zona horaria difícil (madrugada HN).",                        lastMsg:"Gracias pero no puedo ahora.",                 activity:[{type:"lost",text:"Marcado como perdido — sin respuesta",             time:"Hace 1 sem"},{type:"msg",text:"3er intento sin respuesta",time:"Hace 8 días"},{type:"test",text:"Nivel B2 detectado",time:"Hace 9 días"}]},
  { id:7, name:"Mariana Silva",    email:"mariana.silva@gmail.com",phone:"+55 11 9999-0000", country:"🇧🇷 Brasil",   source:"Instagram",   stage:"nuevo",      score:55, level:null,   program:"VA General",   date:"Hace 1 h",       tags:[],              notes:"Interesada en VA. Habla portugués e inglés básico.",                                       lastMsg:"Vi sus anuncios en Instagram, quiero más info.", activity:[{type:"lead",text:"Lead desde Instagram",                             time:"Hace 1 h"  }]},
];

const TASKS_INIT = [
  { id:1, lead:"Carlos Mendoza", text:"Enviar link de inscripción y horarios",    due:"Hoy, 3:00 PM",      priority:"high",   done:false },
  { id:2, lead:"Diego Fuentes",  text:"Segundo seguimiento por WhatsApp",         due:"Hoy, 5:00 PM",      priority:"medium", done:false },
  { id:3, lead:"Ana Sofía Reyes",text:"Revisar resultado del placement test",     due:"Mañana, 10:00 AM",  priority:"high",   done:false },
  { id:4, lead:"Valentina Cruz", text:"Primer contacto — responder WhatsApp",     due:"Urgente",           priority:"high",   done:false },
  { id:5, lead:"Mariana Silva",  text:"Enviar info programas en español",         due:"Hoy, 6:00 PM",      priority:"medium", done:false },
];

const SOURCE_DATA = [
  { label:"Instagram",  pct:38, count:14, color:"#db2777" },
  { label:"Referidos",  pct:25, count:9,  color:G         },
  { label:"Google Ads", pct:18, count:7,  color:"#2563eb" },
  { label:"WhatsApp",   pct:12, count:4,  color:"#16a34a" },
  { label:"LinkedIn",   pct:7,  count:3,  color:P         },
];

const SCORE_COLOR = s => s>=80?G : s>=50?A : R;
const SCORE_BG    = s => s>=80?GD : s>=50?AD : RD;
const SCORE_LABEL = s => s>=80?"Caliente 🔥" : s>=50?"Tibio 🌡" : "Frío ❄️";
const ACT_ICON    = t => ({msg:"💬",test:"📋",call:"📞",lead:"✨",conv:"🎉",lost:"❌"})[t]||"•";
const TAG_COLORS  = {
  "Becas":       [PD,P],
  "Seguimiento": [AD,A],
  "Urgente":     [RD,R],
  "B2B":         ["#ede9fe",PURPLE],
};

const NAV = [
  { id:"pipeline",  icon:"ti-layout-kanban",  label:"Pipeline"      },
  { id:"leads",     icon:"ti-users",          label:"Todos los leads"},
  { id:"tasks",     icon:"ti-checkbox",       label:"Mis tareas"    },
  { id:"metrics",   icon:"ti-chart-bar",      label:"Métricas"      },
];

// ─── UI helpers ───────────────────────────────────────────────────
function Badge({ text, bg, color, size=11 }) {
  return <span style={{ fontSize:size, padding:"3px 10px", borderRadius:20, background:bg, color, fontWeight:600, whiteSpace:"nowrap" }}>{text}</span>;
}
function StageChip({ stage }) {
  const s = STAGES.find(x=>x.id===stage);
  if (!s) return null;
  return <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, background:s.light, color:s.color, fontWeight:600 }}>{s.icon} {s.label}</span>;
}
function ScoreRing({ score, size=40 }) {
  const r = size/2-4, circ = 2*Math.PI*r, dash = (score/100)*circ;
  const c = SCORE_COLOR(score);
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={3}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:c }}>{score}</div>
    </div>
  );
}
function Avatar({ name, color, size=36 }) {
  const initials = name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color+"20", border:`1.5px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:700, color, flexShrink:0 }}>
      {initials}
    </div>
  );
}
function MiniBar({ pct, color, h=5 }) {
  return (
    <div style={{ flex:1, height:h, background:"#f1f5f9", borderRadius:h/2, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:h/2, transition:"width .8s ease" }}/>
    </div>
  );
}

// ─── Lead card for pipeline ───────────────────────────────────────
function PipelineCard({ lead, stageColor, onClick, selected }) {
  return (
    <div onClick={onClick} style={{
      background:selected?"#fff7ed":"#ffffff",
      border:`1px solid ${selected?Y:"#e2e8f0"}`,
      borderLeft:`3px solid ${stageColor}`,
      borderRadius:10, padding:"12px 14px", cursor:"pointer",
      boxShadow:selected?"0 4px 14px rgba(255,187,35,.2)":"0 1px 4px rgba(0,0,0,.05)",
      transition:"all .15s", marginBottom:8,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ display:"flex", gap:9, alignItems:"center", flex:1, minWidth:0 }}>
          <Avatar name={lead.name} color={stageColor} size={32}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#0f172a", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lead.name}</div>
            <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>{lead.country}</div>
          </div>
        </div>
        <ScoreRing score={lead.score} size={34}/>
      </div>
      {lead.program && <div style={{ fontSize:11, color:P, fontWeight:500, marginBottom:6 }}>📚 {lead.program}</div>}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, color:"#94a3b8" }}>{lead.source}</span>
        <span style={{ color:"#cbd5e1", fontSize:10 }}>·</span>
        <span style={{ fontSize:10, color:"#94a3b8" }}>{lead.date}</span>
        {lead.tags.map(t => {
          const [bg,col] = TAG_COLORS[t]||[PD,P];
          return <span key={t} style={{ fontSize:9, padding:"1px 7px", borderRadius:20, background:bg, color:col, fontWeight:600, marginLeft:"auto" }}>{t}</span>;
        })}
      </div>
      {lead.lastMsg && (
        <div style={{ marginTop:8, fontSize:11, color:"#475569", background:"#f8fafc", borderRadius:7, padding:"6px 9px", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          💬 "{lead.lastMsg}"
        </div>
      )}
    </div>
  );
}

// ─── Lead detail panel ────────────────────────────────────────────
function LeadPanel({ lead, onClose, onStageChange, onConvert, onLost }) {
  const [noteText, setNoteText] = useState("");
  const [msgText, setMsgText] = useState("");
  const [showSent, setShowSent] = useState(false);
  const s = STAGES.find(x=>x.id===lead.stage);

  function sendMsg() {
    if (!msgText.trim()) return;
    setShowSent(true);
    setMsgText("");
    setTimeout(() => setShowSent(false), 2500);
  }

  return (
    <div style={{ width:380, background:"#ffffff", borderLeft:"1px solid #e2e8f0", display:"flex", flexDirection:"column", height:"100%", flexShrink:0, overflowY:"auto" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 16px", borderBottom:"1px solid #f1f5f9", background:s?.light||"#f8fafc" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
          <StageChip stage={lead.stage}/>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#94a3b8", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Avatar name={lead.name} color={s?.color||P} size={48}/>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>{lead.name}</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{lead.country} · {lead.source}</div>
          </div>
          <ScoreRing score={lead.score} size={44}/>
        </div>
        <div style={{ marginTop:10, fontSize:11, color:SCORE_COLOR(lead.score), fontWeight:600 }}>
          {SCORE_LABEL(lead.score)}
        </div>
      </div>

      {/* Contact info */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[["📧",lead.email],["📱",lead.phone],["📚",lead.program||"Sin programa"],["🎯",lead.level?`Nivel ${lead.level}`:"Sin test"]].map(([icon,val],i)=>(
            <div key={i} style={{ display:"flex", gap:7, alignItems:"center", background:"#f8fafc", borderRadius:8, padding:"8px 10px" }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={{ fontSize:11, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #f1f5f9", display:"flex", gap:7, flexWrap:"wrap" }}>
        <button onClick={()=>{const stages=STAGES.map(s=>s.id);const i=stages.indexOf(lead.stage);if(i<stages.length-2)onStageChange(stages[i+1]);}} style={{ flex:1, padding:"8px 10px", background:P, color:"#fff", border:"none", borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Avanzar etapa →
        </button>
        {lead.stage!=="convertido" && <button onClick={onConvert} style={{ flex:1, padding:"8px 10px", background:GD, color:G, border:`1px solid ${G}40`, borderRadius:9, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>🎉 Convertir</button>}
        <button style={{ padding:"8px 12px", background:"#ecfdf5", color:"#16a34a", border:"none", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          <i className="ti ti-brand-whatsapp" style={{ fontSize:14 }} aria-hidden="true"/>
        </button>
        <button onClick={()=>setView("pipeline")} style={{ padding:"8px 12px", background:"#f1f5f9", color:"#64748b", border:"none", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          <i className="ti ti-send" style={{ fontSize:14 }} aria-hidden="true"/>
        </button>
      </div>

      {/* Change stage dropdown */}
      <div style={{ padding:"10px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>Cambiar etapa</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {STAGES.map(stage=>(
            <button key={stage.id} onClick={()=>onStageChange(stage.id)} style={{ fontSize:10, padding:"4px 10px", borderRadius:20, border:`1px solid ${lead.stage===stage.id?stage.color:"#e2e8f0"}`, background:lead.stage===stage.id?stage.light:"transparent", color:lead.stage===stage.id?stage.color:"#64748b", cursor:"pointer", fontFamily:"inherit", fontWeight:lead.stage===stage.id?700:400 }}>
              {stage.icon} {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Send message */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:7 }}>Enviar mensaje</div>
        <div style={{ display:"flex", gap:7 }}>
          <input aria-label="Mensaje" value={msgText} onChange={e=>setMsgText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribe un mensaje..." style={{ flex:1, padding:"8px 11px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:12, fontFamily:"inherit", color:"#0f172a", background:"#f8fafc", outline:"none" }}/>
          <button onClick={sendMsg} style={{ padding:"8px 14px", background:P, color:"#fff", border:"none", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>→</button>
        </div>
        {showSent && <div style={{ marginTop:7, fontSize:11, color:G, fontWeight:600 }}>✓ Mensaje enviado por WhatsApp</div>}
      </div>

      {/* Notes */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>Nota interna</div>
        <div style={{ fontSize:12, color:"#475569", background:"#f8fafc", borderRadius:8, padding:"9px 11px", lineHeight:1.65, marginBottom:7 }}>{lead.notes}</div>
        <div style={{ display:"flex", gap:7 }}>
          <input aria-label="Nota" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Agregar nota..." style={{ flex:1, padding:"7px 10px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, fontFamily:"inherit", color:"#0f172a", background:"#f8fafc", outline:"none" }}/>
          <button onClick={()=>setNoteText("")} style={{ padding:"7px 12px", background:PD, color:P, border:"none", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>+</button>
        </div>
      </div>

      {/* Activity timeline */}
      <div style={{ padding:"14px 20px", flex:1 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:.8, marginBottom:12 }}>Actividad</div>
        {lead.activity.map((a,i)=>(
          <div key={i} style={{ display:"flex", gap:10, paddingBottom:12, position:"relative" }}>
            {i<lead.activity.length-1 && <div style={{ position:"absolute", left:11, top:22, bottom:0, width:1.5, background:"#f1f5f9" }}/>}
            <div style={{ width:22, height:22, borderRadius:"50%", background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0, zIndex:1 }}>{ACT_ICON(a.type)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"#475569", lineHeight:1.5 }}>{a.text}</div>
              <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── New Lead Modal ───────────────────────────────────────────────
function NewLeadModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:"", email:"", phone:"", country:"", source:"Instagram", program:"", stage:"nuevo", score:50 });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid = form.name && form.email;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"#ffffff", borderRadius:20, padding:28, width:480, maxWidth:"100%", boxShadow:"0 24px 60px rgba(0,0,0,.2)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Nuevo lead</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#94a3b8" }}>✕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["Nombre completo","name","text","María Rodríguez"],["Email","email","email","maria@gmail.com"],["Teléfono","phone","tel","+504 9900-0000"],["País","country","text","🇭🇳 Honduras"]].map(([label,key,type,ph])=>(
            <div key={key} style={{ gridColumn:key==="name"?"1/-1":undefined }}>
              <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={{ width:"100%", padding:"10px 13px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"#f8fafc", outline:"none" }}
                onFocus={e=>{e.target.style.borderColor=P;}} onBlur={e=>{e.target.style.borderColor="#e2e8f0";}}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Canal de origen</label>
            <select value={form.source} onChange={e=>set("source",e.target.value)} style={{ width:"100%", padding:"10px 13px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"#f8fafc" }}>
              {["Instagram","Referido","Google Ads","WhatsApp","LinkedIn","Orgánico"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Programa de interés</label>
            <select value={form.program} onChange={e=>set("program",e.target.value)} style={{ width:"100%", padding:"10px 13px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"#f8fafc" }}>
              <option value="">Sin definir</option>
              {["Inglés","VA General","Inglés + VA","VA · Marketing Digital","VA · Legal Assistant","VA · Cuidador Remoto"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontSize:11, color:"#64748b", display:"block", marginBottom:5, fontWeight:500 }}>Nota inicial</label>
            <textarea placeholder="Cómo llegó, qué busca, detalles relevantes..." rows={3} style={{ width:"100%", padding:"10px 13px", border:"1px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"#0f172a", background:"#f8fafc", resize:"vertical", outline:"none" }}
              onFocus={e=>{e.target.style.borderColor=P;}} onBlur={e=>{e.target.style.borderColor="#e2e8f0";}}/>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", background:"#f1f5f9", color:"#64748b", border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={()=>{ if(valid){ onSave({...form,id:Date.now(),score:50,tags:[],activity:[{type:"lead",text:`Lead creado manualmente · ${form.source}`,time:"Ahora"}],date:"Ahora",lastMsg:""}); onClose(); }}} style={{ flex:2, padding:"11px", background:valid?P:"#e2e8f0", color:valid?"#fff":"#94a3b8", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:valid?"pointer":"not-allowed", fontFamily:"inherit" }}>
            Crear lead
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function CRM() {
  const navigate = useNavigate();
  const [view, setView]         = useState("pipeline");
  const [leads, setLeads]       = useState(LEADS_INIT);
  const [tasks, setTasks]       = useState(TASKS_INIT);
  const [selLead, setSelLead]   = useState(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [search, setSearch]     = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [toast, setToast]       = useState(null);

  function showToast(msg, color=G) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function updateLeadStage(id, stage) {
    setLeads(ls => ls.map(l => l.id===id ? {...l,stage} : l));
    const s = STAGES.find(x=>x.id===stage);
    showToast(`${s?.icon} Lead movido a ${s?.label}`);
    if (selLead?.id===id) setSelLead(l => ({...l,stage}));
  }

  function convertLead(id) {
    setLeads(ls => ls.map(l => l.id===id ? {...l,stage:"convertido",score:98} : l));
    showToast("🎉 ¡Lead convertido! Se creó la matrícula.", G);
    if (selLead?.id===id) setSelLead(l => ({...l,stage:"convertido",score:98}));
  }

  const filteredLeads = leads.filter(l => {
    const ms = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    const mst = filterStage==="all" || l.stage===filterStage;
    return ms && mst;
  });

  const totalLeads     = leads.length;
  const converted      = leads.filter(l=>l.stage==="convertido").length;
  const convRate       = Math.round((converted/totalLeads)*100);
  const avgScore       = Math.round(leads.reduce((a,l)=>a+l.score,0)/leads.length);
  const pendingTasks   = tasks.filter(t=>!t.done).length;

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#f8fafc", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width:196, background:PH, display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0, minHeight:"100vh", position:"sticky", top:0 }}>
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>
          <div style={{ fontSize:9, color:Y, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>WCA Academy</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>CRM Ventas</div>
        </div>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{setView(n.id);setSelLead(null);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 18px", border:"none", background:view===n.id?"rgba(255,255,255,.12)":"transparent", color:view===n.id?"#fff":"rgba(255,255,255,.45)", fontSize:12, cursor:"pointer", textAlign:"left", borderLeft:`2px solid ${view===n.id?Y:"transparent"}`, transition:"all .15s", fontFamily:"inherit", fontWeight:view===n.id?600:400, width:"100%" }}>
            <i className={"ti "+n.icon} style={{ fontSize:14, width:18, textAlign:"center" }} aria-hidden="true"/>
            {n.label}
            {n.id==="tasks" && pendingTasks>0 && <span style={{ marginLeft:"auto", fontSize:9, background:R, color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pendingTasks}</span>}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:"14px 18px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:Y, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:PH }}>VN</div>
            <div><div style={{ fontSize:11, color:"#fff", fontWeight:600 }}>Asesor WCA</div><div style={{ fontSize:9, color:"rgba(255,255,255,.35)" }}>Ventas</div></div>
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

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:60, background:"#ffffff", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Search */}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:10, padding:"7px 13px", width:240 }}>
              <i className="ti ti-search" style={{ fontSize:14, color:"#94a3b8" }} aria-hidden="true"/>
              <input aria-label="Buscar lead" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..." style={{ border:"none", outline:"none", fontSize:13, background:"transparent", color:"#0f172a", flex:1, fontFamily:"inherit" }}/>
            </div>
            {view==="pipeline"||view==="leads" ? (
              <select value={filterStage} onChange={e=>setFilterStage(e.target.value)} style={{ padding:"7px 12px", border:"1px solid #e2e8f0", borderRadius:10, fontSize:12, background:"#f8fafc", fontFamily:"inherit", color:"#475569" }}>
                <option value="all">Todas las etapas</option>
                {STAGES.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            ) : null}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setShowNewLead(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", background:P, color:"#fff", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:`0 2px 8px ${P}30` }}>
              <i className="ti ti-plus" style={{ fontSize:15 }} aria-hidden="true"/> Nuevo lead
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ background:"#ffffff", borderBottom:"1px solid #e2e8f0", padding:"0 24px", display:"flex", gap:0 }}>
          {[
            { label:"Total leads", value:totalLeads, color:P,     icon:"ti-users"        },
            { label:"Convertidos", value:converted,  color:G,     icon:"ti-check-circle" },
            { label:"Conversión",  value:`${convRate}%`, color:A, icon:"ti-trending-up"  },
            { label:"Score avg",   value:avgScore,   color:PURPLE,icon:"ti-flame"        },
            { label:"Tareas hoy",  value:pendingTasks,color:R,    icon:"ti-checkbox"     },
          ].map((k,i)=>(
            <div key={i} style={{ flex:1, padding:"12px 16px", borderRight:i<4?"1px solid #f1f5f9":"none", display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ width:32, height:32, borderRadius:8, background:`${k.color}12`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <i className={"ti "+k.icon} style={{ fontSize:15, color:k.color }} aria-hidden="true"/>
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:"#0f172a", lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          <div style={{ flex:1, overflowY:"auto", padding:selLead?0:20, overflow:selLead?"hidden":undefined, display:selLead?"flex":undefined }}>

            {/* ── PIPELINE ── */}
            {view==="pipeline" && !selLead && (
              <div style={{ display:"flex", gap:14, minWidth:"min-content", padding:20 }}>
                {STAGES.map(stage=>{
                  const stageLeads = filteredLeads.filter(l=>l.stage===stage.id);
                  return (
                    <div key={stage.id} style={{ width:220, flexShrink:0 }}>
                      {/* Column header */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"8px 12px", background:"#ffffff", borderRadius:10, border:"1px solid #e2e8f0", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:stage.color }}/>
                        <span style={{ fontSize:12, fontWeight:700, color:"#0f172a", flex:1 }}>{stage.label}</span>
                        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:stage.light, color:stage.color, fontWeight:700 }}>{stageLeads.length}</span>
                      </div>
                      {/* Cards */}
                      <div>
                        {stageLeads.length===0 && (
                          <div style={{ padding:"24px 12px", textAlign:"center", background:"#ffffff", borderRadius:10, border:"1px dashed #e2e8f0", color:"#cbd5e1", fontSize:12 }}>
                            Sin leads
                          </div>
                        )}
                        {stageLeads.map(lead=>(
                          <PipelineCard key={lead.id} lead={lead} stageColor={stage.color}
                            selected={selLead?.id===lead.id}
                            onClick={()=>setSelLead(lead)}/>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pipeline + panel side by side */}
            {view==="pipeline" && selLead && (
              <>
                <div style={{ flex:1, overflowX:"auto", overflowY:"auto", padding:20 }}>
                  <div style={{ display:"flex", gap:14, minWidth:"min-content" }}>
                    {STAGES.map(stage=>{
                      const stageLeads = filteredLeads.filter(l=>l.stage===stage.id);
                      return (
                        <div key={stage.id} style={{ width:200, flexShrink:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10, padding:"7px 10px", background:"#fff", borderRadius:9, border:"1px solid #e2e8f0" }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:stage.color }}/>
                            <span style={{ fontSize:11, fontWeight:700, color:"#0f172a", flex:1 }}>{stage.label}</span>
                            <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:stage.light, color:stage.color, fontWeight:700 }}>{stageLeads.length}</span>
                          </div>
                          {stageLeads.map(lead=>(
                            <PipelineCard key={lead.id} lead={lead} stageColor={stage.color}
                              selected={selLead?.id===lead.id}
                              onClick={()=>setSelLead(lead)}/>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <LeadPanel lead={selLead} onClose={()=>setSelLead(null)}
                  onStageChange={s=>updateLeadStage(selLead.id,s)}
                  onConvert={()=>convertLead(selLead.id)}/>
              </>
            )}

            {/* ── TODOS LOS LEADS ── */}
            {view==="leads" && (
              <div>
                <div style={{ background:"#ffffff", borderRadius:14, border:"1px solid #e2e8f0", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"#f8fafc" }}>
                        {["Lead","Etapa","Score","Programa","Canal","Última actividad",""].map(h=>(
                          <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((l,i)=>(
                        <tr key={l.id} onClick={()=>{setSelLead(l);setView("pipeline");}} style={{ borderTop:"1px solid #f1f5f9", cursor:"pointer", transition:"background .1s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"14px 16px" }}>
                            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                              <Avatar name={l.name} color={STAGES.find(s=>s.id===l.stage)?.color||P} size={34}/>
                              <div>
                                <div style={{ fontWeight:600, color:"#0f172a" }}>{l.name}</div>
                                <div style={{ fontSize:11, color:"#94a3b8" }}>{l.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"14px 16px" }}><StageChip stage={l.stage}/></td>
                          <td style={{ padding:"14px 16px" }}><ScoreRing score={l.score} size={36}/></td>
                          <td style={{ padding:"14px 16px", color:"#475569" }}>{l.program||"—"}</td>
                          <td style={{ padding:"14px 16px" }}>
                            <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:"#f1f5f9", color:"#475569" }}>{l.source}</span>
                          </td>
                          <td style={{ padding:"14px 16px", color:"#94a3b8", fontSize:12 }}>{l.date}</td>
                          <td style={{ padding:"14px 16px" }}>
                            <button style={{ fontSize:11, padding:"5px 12px", background:PD, color:P, border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Ver →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAREAS ── */}
            {view==="tasks" && (
              <div style={{ maxWidth:680 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#0f172a" }}>{pendingTasks} tareas pendientes hoy</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {tasks.map((t,i)=>(
                    <div key={t.id} style={{ display:"flex", gap:12, alignItems:"center", background:"#ffffff", border:`1px solid ${t.done?"#e2e8f0":t.priority==="high"?`${R}30`:"#e2e8f0"}`, borderRadius:12, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,.04)", opacity:t.done?.5:1 }}>
                      <input type="checkbox" checked={t.done} onChange={()=>setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{ width:18, height:18, cursor:"pointer", accentColor:P, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:500, color:t.done?"#94a3b8":"#0f172a", textDecoration:t.done?"line-through":"none" }}>{t.text}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:3 }}>Lead: <strong style={{ color:"#475569" }}>{t.lead}</strong> · {t.due}</div>
                      </div>
                      {!t.done && t.priority==="high" && <span style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:RD, color:R, fontWeight:600 }}>Urgente</span>}
                      {!t.done && t.priority==="medium" && <span style={{ fontSize:10, padding:"3px 9px", borderRadius:20, background:AD, color:A, fontWeight:600 }}>Normal</span>}
                      <button onClick={()=>setTasks(ts=>ts.filter(x=>x.id!==t.id))} style={{ fontSize:12, padding:"5px 10px", background:"#f1f5f9", color:"#94a3b8", border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                    </div>
                  ))}
                  {pendingTasks===0 && (
                    <div style={{ textAlign:"center", padding:"40px 20px", background:"#ffffff", borderRadius:14, border:"1px solid #e2e8f0" }}>
                      <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
                      <div style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>¡Todo al día!</div>
                      <div style={{ fontSize:13, color:"#94a3b8" }}>No tenés tareas pendientes para hoy.</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── MÉTRICAS ── */}
            {view==="metrics" && (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  {/* Funnel */}
                  <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Funnel de conversión</div>
                    {STAGES.filter(s=>s.id!=="perdido").map(stage=>{
                      const count = leads.filter(l=>l.stage===stage.id).length;
                      return (
                        <div key={stage.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                          <div style={{ fontSize:12, width:100, flexShrink:0, color:"#475569" }}>{stage.icon} {stage.label}</div>
                          <MiniBar pct={(count/totalLeads)*100} color={stage.color}/>
                          <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", width:24, textAlign:"right" }}>{count}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sources */}
                  <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Canales de adquisición</div>
                    {SOURCE_DATA.map(s=>(
                      <div key={s.label} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                        <div style={{ fontSize:12, width:90, flexShrink:0, color:"#475569" }}>{s.label}</div>
                        <MiniBar pct={s.pct} color={s.color}/>
                        <div style={{ fontSize:11, color:"#94a3b8", width:50, textAlign:"right" }}>{s.pct}% ({s.count})</div>
                      </div>
                    ))}
                    <div style={{ marginTop:14, background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:9, padding:"8px 12px", fontSize:11, color:"#065f46" }}>
                      💡 Los referidos convierten al <strong>42%</strong> — el canal más eficiente de WCA
                    </div>
                  </div>

                  {/* Score distribution */}
                  <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Distribución de scores</div>
                    <div style={{ display:"flex", gap:10 }}>
                      {[{label:"Calientes 🔥",min:80,color:G},{label:"Tibios 🌡",min:50,color:A},{label:"Fríos ❄️",min:0,color:R}].map(({label,min,color},i,arr)=>{
                        const max = arr[i-1]?.min||101;
                        const cnt = leads.filter(l=>l.score>=min&&l.score<max).length;
                        return (
                          <div key={label} style={{ flex:1, textAlign:"center", background:`${color}10`, borderRadius:10, padding:"14px 10px", border:`1px solid ${color}20` }}>
                            <div style={{ fontSize:26, fontWeight:800, color }}>{cnt}</div>
                            <div style={{ fontSize:11, color:"#64748b", marginTop:4, lineHeight:1.4 }}>{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Programs */}
                  <div style={{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Interés por programa</div>
                    {["Inglés","VA General","Inglés + VA","VA · Marketing Digital"].map(prog=>{
                      const cnt = leads.filter(l=>l.program===prog).length;
                      return (
                        <div key={prog} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                          <div style={{ fontSize:12, flex:1, color:"#475569" }}>{prog}</div>
                          <MiniBar pct={(cnt/totalLeads)*100} color={P}/>
                          <div style={{ fontSize:12, fontWeight:600, color:"#0f172a", width:16 }}>{cnt}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── NEW LEAD MODAL ── */}
      {showNewLead && (
        <NewLeadModal
          onSave={lead => { setLeads(ls=>[lead,...ls]); showToast("✨ Lead creado correctamente"); }}
          onClose={() => setShowNewLead(false)}/>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:90, background:toast.color, color:"#fff", padding:"11px 18px", borderRadius:11, fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 6px 20px rgba(0,0,0,.2)", display:"flex", gap:8, alignItems:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif", animation:"slideIn .3s ease" }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}`}</style>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
