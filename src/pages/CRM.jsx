import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLeads, createLead, updateLeadStage, createTask, toggleTask } from "../lib/db.js";
import { toast as globalToast } from "../lib/toast.jsx";
import { MobileLayout, useMobile } from "../lib/MobileLayout.jsx";
import { SuperAdminBar } from "../lib/SuperAdminBar.jsx";
import { supabase } from "../lib/supabase.js";
import { EmptyState } from "../lib/EmptyState.jsx";

// ─── Brand ───────────────────────────────────────────────────────
const P  = "#155266";          // brand primary — fixed (logo color)
const PH = "#0f3d4d";          // brand dark
const PD = "var(--wca-primary-dim, #e8f3f6)";
const Y  = "#ffbb23";          // brand accent — fixed
const YD = "var(--amber-dim, #fffbeb)";
const G  = "var(--color-success, #059669)";
const GD = "var(--green-dim, #ecfdf5)";
const R  = "var(--color-danger, #dc2626)";
const RD = "var(--red-dim, #fef2f2)";
const A  = "#d97706";
const AD = "var(--amber-dim, #fffbeb)";
// Dark mode aware backgrounds — use CSS vars throughout
const BG   = "var(--bg-page)";
const SURF  = "var(--bg-surface)";
const BORD  = "var(--border)";
const TXT   = "var(--text-primary)";
const TXTS  = "var(--text-secondary)";
const PURPLE = "#7c3aed";

// ─── Stage config ────────────────────────────────────────────────
const STAGES = [
  { id:"nuevo",      label:"Nuevo",        icon:"✨", color:"var(--text-secondary)", light:"#f1f5f9", count:1 },
  { id:"contactado", label:"Contactado",   icon:"💬", color:P,         light:PD,        count:1 },
  { id:"test",       label:"Test enviado", icon:"📋", color:PURPLE,    light:"#ede9fe",  count:1 },
  { id:"propuesta",  label:"Propuesta",    icon:"📄", color:A,         light:AD,         count:1 },
  { id:"convertido", label:"Convertido",   icon:"🎉", color:G,         light:GD,         count:1 },
  { id:"perdido",    label:"Perdido",      icon:"❌", color:R,         light:RD,         count:1 },
];

// ─── Data ─────────────────────────────────────────────────────────
// LEADS_INIT removed — loaded from Supabase

// TASKS_INIT removed — loaded from Supabase

// SOURCE_DATA: computed from real leads

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
  return <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20, background:s.light, color:s.color, fontWeight:600 }}>{s.icon} {s.label}</span>;
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
    <div style={{ flex:1, height:h, background:"var(--bg-surface-subtle)", borderRadius:h/2, overflow:"hidden" }}>
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
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{lead.name}</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:1 }}>{lead.country}</div>
          </div>
        </div>
        <ScoreRing score={lead.score} size={34}/>
      </div>
      {lead.program && <div style={{ fontSize:11, color:P, fontWeight:500, marginBottom:6 }}>📚 {lead.program}</div>}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>{lead.source}</span>
        <span style={{ color:"#cbd5e1", fontSize:10 }}>·</span>
        <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>{lead.date}</span>
        {lead.tags.map(t => {
          const [bg,col] = TAG_COLORS[t]||[PD,P];
          return <span key={t} style={{ fontSize:11, padding:"1px 7px", borderRadius:20, background:bg, color:col, fontWeight:600, marginLeft:"auto" }}>{t}</span>;
        })}
      </div>
      {lead.lastMsg && (
        <div style={{ marginTop:8, fontSize:11, color:"var(--text-secondary)", background:"var(--bg-page)", borderRadius:7, padding:"6px 9px", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          💬 "{lead.lastMsg}"
        </div>
      )}
    </div>
  );
}

// ─── Lead detail panel ────────────────────────────────────────────
function LeadPanel({ lead, onClose, onStageChange, onConvert, onLost }) {
  if (!lead) return null;
  const [noteText, setNoteText] = useState("");
  const isMobile = useMobile();
  const [sideOpen, setSideOpen] = useState(false);
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
    <div style={{ width:"min(380px,100vw - 32px)", background:"var(--bg-surface)", borderLeft:"1px solid #e2e8f0", display:"flex", flexDirection:"column", height:"100%", flexShrink:0, overflowY:"auto" }}>
      {/* Header */}
      <div style={{ padding:"18px 20px 16px", borderBottom:"1px solid #f1f5f9", background:s?.light||"#f8fafc" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
          <StageChip stage={lead.stage}/>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:18, cursor:"pointer", color:"var(--text-tertiary)", lineHeight:1 }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Avatar name={lead.name} color={s?.color||P} size={48}/>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{lead.name}</div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>{lead.country} · {lead.source}</div>
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
            <div key={i} style={{ display:"flex", gap:7, alignItems:"center", background:"var(--bg-page)", borderRadius:8, padding:"8px 10px" }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={{ fontSize:11, color:"var(--text-secondary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{val}</span>
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
        <button onClick={()=>setView("pipeline")} style={{ padding:"8px 12px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"none", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          <i className="ti ti-send" style={{ fontSize:14 }} aria-hidden="true"/>
        </button>
      </div>

      {/* Change stage dropdown */}
      <div style={{ padding:"10px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, color:"var(--text-tertiary)", marginBottom:6 }}>Cambiar etapa</div>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {STAGES.map(stage=>(
            <button key={stage.id} onClick={()=>onStageChange(stage.id)} style={{ fontSize:11, padding:"4px 10px", borderRadius:20, border:`1px solid ${lead.stage===stage.id?stage.color:"#e2e8f0"}`, background:lead.stage===stage.id?stage.light:"transparent", color:lead.stage===stage.id?stage.color:"var(--text-secondary)", cursor:"pointer", fontFamily:"inherit", fontWeight:lead.stage===stage.id?700:400 }}>
              {stage.icon} {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Send message */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, color:"var(--text-tertiary)", marginBottom:7 }}>Enviar mensaje</div>
        <div style={{ display:"flex", gap:7 }}>
          <input aria-label="Mensaje" value={msgText} onChange={e=>setMsgText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="Escribe un mensaje..." style={{ flex:1, padding:"8px 11px", border:"1px solid var(--border)", borderRadius:9, fontSize:12, fontFamily:"inherit", color:"var(--text-primary)", background:"var(--bg-page)", outline:"none" }}/>
          <button onClick={sendMsg} style={{ padding:"8px 14px", background:P, color:"#fff", border:"none", borderRadius:9, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>→</button>
        </div>
        {showSent && <div style={{ marginTop:7, fontSize:11, color:G, fontWeight:600 }}>✓ Mensaje enviado por WhatsApp</div>}
      </div>

      {/* Notes */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #f1f5f9" }}>
        <div style={{ fontSize:11, color:"var(--text-tertiary)", marginBottom:6 }}>Nota interna</div>
        <div style={{ fontSize:12, color:"var(--text-secondary)", background:"var(--bg-page)", borderRadius:8, padding:"9px 11px", lineHeight:1.65, marginBottom:7 }}>{lead.notes}</div>
        <div style={{ display:"flex", gap:7 }}>
          <input aria-label="Nota" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Agregar nota..." style={{ flex:1, padding:"7px 10px", border:"1px solid var(--border)", borderRadius:8, fontSize:12, fontFamily:"inherit", color:"var(--text-primary)", background:"var(--bg-page)", outline:"none" }}/>
          <button onClick={()=>setNoteText("")} style={{ padding:"7px 12px", background:PD, color:P, border:"none", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>+</button>
        </div>
      </div>

      {/* Activity timeline */}
      <div style={{ padding:"14px 20px", flex:1 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.8, marginBottom:12 }}>Actividad</div>
        {lead.activity.map((a,i)=>(
          <div key={i} style={{ display:"flex", gap:10, paddingBottom:12, position:"relative" }}>
            {i<lead.activity.length-1 && <div style={{ position:"absolute", left:11, top:22, bottom:0, width:1.5, background:"var(--bg-surface-subtle)" }}/>}
            <div style={{ width:22, height:22, borderRadius:"50%", background:"var(--bg-surface-subtle)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0, zIndex:1 }}>{ACT_ICON(a.type)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 }}>{a.text}</div>
              <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:2 }}>{a.time}</div>
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
      <div style={{ background:"var(--bg-surface)", borderRadius:20, padding:28, width:480, maxWidth:"100%", boxShadow:"0 24px 60px rgba(0,0,0,.2)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0, marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>Nuevo lead</div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-tertiary)" }}>✕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[["Nombre completo","name","text","María Rodríguez"],["Email","email","email","maria@gmail.com"],["Teléfono","phone","tel","+504 9900-0000"],["País","country","text","🇭🇳 Honduras"]].map(([label,key,type,ph])=>(
            <div key={key} style={{ gridColumn:key==="name"?"1/-1":undefined }}>
              <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5, fontWeight:500 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"var(--text-primary)", background:"var(--bg-page)", outline:"none" }}
                onFocus={e=>{e.target.style.borderColor=P;}} onBlur={e=>{e.target.style.borderColor="#e2e8f0";}}/>
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5, fontWeight:500 }}>Canal de origen</label>
            <select value={form.source} onChange={e=>set("source",e.target.value)} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"var(--text-primary)", background:"var(--bg-page)" }}>
              {["Instagram","Referido","Google Ads","WhatsApp","LinkedIn","Orgánico"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5, fontWeight:500 }}>Programa de interés</label>
            <select value={form.program} onChange={e=>set("program",e.target.value)} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"var(--text-primary)", background:"var(--bg-page)" }}>
              <option value="">Sin definir</option>
              {["Inglés","VA General","Inglés + VA","VA · Marketing Digital","VA · Legal Assistant","VA · Cuidador Remoto"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <label style={{ fontSize:11, color:"var(--text-secondary)", display:"block", marginBottom:5, fontWeight:500 }}>Nota inicial</label>
            <textarea id="crm-new-lead-note" placeholder="Cómo llegó, qué busca, detalles relevantes..." rows={3} style={{ width:"100%", padding:"10px 13px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, fontFamily:"inherit", color:"var(--text-primary)", background:"var(--bg-page)", resize:"vertical", outline:"none" }}
              onFocus={e=>{e.target.style.borderColor=P;}} onBlur={e=>{e.target.style.borderColor="#e2e8f0";}}/>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button onClick={onClose} style={{ flex:1, padding:"11px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"none", borderRadius:10, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={async()=>{
            if(!valid) return;
            const note = document.querySelector("#crm-new-lead-note")?.value || "";
            try {
              const saved = await createLead({
                name:    form.name,
                email:   form.email,
                phone:   form.phone || null,
                country: form.country || null,
                source:  form.source,
                program: form.program || null,
                notes:   note || null,
              });
              onSave({
                ...(saved || {}),
                id:       saved?.id || Date.now(),
                name:     form.name,
                email:    form.email,
                phone:    form.phone,
                country:  form.country,
                source:   form.source,
                program:  form.program,
                stage:    "nuevo",
                score:    50,
                tags:     [],
                date:     "Ahora",
                lastMsg:  "",
                notes:    note,
                activity: [{type:"lead",text:`Lead creado manualmente · ${form.source}`,time:"Ahora"}],
              });
              onClose();
            } catch(err) {
              showToast("Error al guardar: " + err.message, R);
            }
          }} style={{ flex:2, padding:"11px", background:valid?P:"#e2e8f0", color:valid?"#fff":"#94a3b8", border:"none", borderRadius:10, fontSize:13, fontWeight:700, cursor:valid?"pointer":"not-allowed", fontFamily:"inherit" }}>
            Crear lead
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── PLACEMENT TEST QUESTIONS ────────────────────────────────────
const PT_QUESTIONS = [
  // A1 — absoluto principiante
  { id:1, level:"A1", q:"What is your name?", opts:["My name is María","I am have María","Name I María","Have name María"], ans:0 },
  { id:2, level:"A1", q:"___ is she? She is my sister.", opts:["Who","What","Where","How"], ans:0 },
  { id:3, level:"A1", q:"They ___ students.", opts:["are","is","am","be"], ans:0 },
  // A2 — básico
  { id:4, level:"A2", q:"I ___ to the store yesterday.", opts:["went","go","goes","going"], ans:0 },
  { id:5, level:"A2", q:"She has lived here ___ five years.", opts:["for","since","during","from"], ans:0 },
  { id:6, level:"A2", q:"___ you ever been to Mexico?", opts:["Have","Has","Had","Did"], ans:0 },
  // B1 — intermedio
  { id:7, level:"B1", q:"If I ___ you, I would apologize.", opts:["were","was","am","be"], ans:0 },
  { id:8, level:"B1", q:"The report ___ by the team last week.", opts:["was written","is written","wrote","writes"], ans:0 },
  { id:9, level:"B1", q:"By the time she arrived, we ___ waiting for two hours.", opts:["had been","have been","were","was"], ans:0 },
  // B2 — intermedio alto
  { id:10, level:"B2", q:"___ he study harder, he might pass the exam.", opts:["Should","Would","Could","Shall"], ans:0 },
  { id:11, level:"B2", q:"The phenomenon, ___ was first observed in 1985, remains poorly understood.", opts:["which","that","what","who"], ans:0 },
  { id:12, level:"B2", q:"She insisted that he ___ the documents immediately.", opts:["sign","signed","signs","signing"], ans:0 },
];

const PT_LEVEL_MAP = score => {
  if (score <= 2)  return { level:"A1", label:"Principiante",     color:"#059669" };
  if (score <= 5)  return { level:"A2", label:"Básico",           color:"#0e7490" };
  if (score <= 8)  return { level:"B1", label:"Intermedio",       color:"#7c3aed" };
  if (score <= 10) return { level:"B2", label:"Intermedio alto",  color:"#d97706" };
  return               { level:"C1", label:"Avanzado",            color:"#dc2626" };
};

function PlacementTestModal({ lead, onClose, onSave }) {
  const [phase,    setPhase]    = useState("intro");   // intro | test | result
  const [answers,  setAnswers]  = useState({});
  const [result,   setResult]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const answered  = Object.keys(answers).length;
  const total     = PT_QUESTIONS.length;
  const allDone   = answered === total;
  const pct       = Math.round((answered / total) * 100);

  async function submitTest() {
    const correct = PT_QUESTIONS.filter((q,i) => answers[i] === q.ans).length;
    const res = PT_LEVEL_MAP(correct);
    setResult({ correct, score: Math.round((correct/total)*100), ...res });
    setPhase("result");
    setSaving(true);
    try {
      if (lead?.id && typeof lead.id === "string" && lead.id.length > 10) {
        const { supabase } = await import("../lib/supabase.js");
        await supabase.from("leads").update({
          test_score:       Math.round((correct/total)*100),
          level_interest:   res.level,
          stage:            "test",
        }).eq("id", lead.id);
      }
      onSave?.({ score: Math.round((correct/total)*100), level: res.level });
    } catch(e) { console.error("PT save:", e); }
    finally { setSaving(false); }
  }

  const P = "#155266";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"var(--bg-surface)", borderRadius:20, padding:28, width:520, maxWidth:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,.2)" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:isMobile?"wrap":"nowrap", gap:isMobile?8:0, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>Placement Test</div>
            {lead && <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:2 }}>Lead: {lead.name}</div>}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"var(--text-tertiary)" }}>✕</button>
        </div>

        {/* INTRO */}
        {phase === "intro" && (
          <div>
            <div style={{ background:"#f0f9ff", borderRadius:12, padding:16, marginBottom:20, fontSize:13, color:"#0369a1", lineHeight:1.7 }}>
              <strong>12 preguntas</strong> de gramática y vocabulario en inglés.<br/>
              El sistema detecta el nivel automáticamente: A1, A2, B1, B2 o C1.<br/>
              Tiempo estimado: <strong>5–8 minutos</strong>.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:8, marginBottom:20 }}>
              {[["📝","12 preguntas","A1 → C1"],["⏱","Sin límite de tiempo","A tu ritmo"],["🎯","Resultado inmediato","Nivel sugerido"]].map(([ic,t,s],i)=>(
                <div key={i} style={{ background:"var(--bg-page)", borderRadius:10, padding:12, textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{t}</div>
                  <div style={{ fontSize:11, color:"var(--text-secondary)" }}>{s}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setPhase("test")} style={{ width:"100%", padding:"13px", background:P, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Comenzar test
            </button>
          </div>
        )}

        {/* TEST */}
        {phase === "test" && (
          <div>
            {/* Progress bar */}
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-secondary)", marginBottom:6 }}>
              <span>{answered}/{total} respondidas</span>
              <span>{pct}%</span>
            </div>
            <div style={{ height:5, background:"var(--border)", borderRadius:4, marginBottom:20, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${pct}%`, background:P, borderRadius:4, transition:"width .3s" }}/>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {PT_QUESTIONS.map((q,qi)=>(
                <div key={q.id} style={{ border:`1.5px solid ${answers[qi]!==undefined?"#155266":"#e2e8f0"}`, borderRadius:12, padding:16 }}>
                  <div style={{ fontSize:12, color:"var(--text-tertiary)", fontWeight:600, marginBottom:4 }}>Pregunta {qi+1} · {q.level}</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:12 }}>{q.q}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                    {q.opts.map((opt,oi)=>{
                      const sel = answers[qi]===oi;
                      return (
                        <button key={oi} onClick={()=>setAnswers(a=>({...a,[qi]:oi}))}
                          style={{ padding:"9px 12px", background:sel?"#e8f3f6":"#f8fafc", border:`1.5px solid ${sel?"#155266":"#e2e8f0"}`, borderRadius:8, fontSize:13, cursor:"pointer", textAlign:"left", color:sel?"#155266":"#475569", fontWeight:sel?600:400, fontFamily:"inherit", transition:"all .15s" }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button disabled={!allDone} onClick={submitTest}
              style={{ width:"100%", marginTop:20, padding:"13px", background:allDone?P:"#e2e8f0", color:allDone?"#fff":"#94a3b8", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:allDone?"pointer":"not-allowed" }}>
              {allDone ? "Ver resultado" : `Respondé las ${total-answered} restantes`}
            </button>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && result && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:8 }}>🎯</div>
            <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:4 }}>Nivel detectado</div>
            <div style={{ fontSize:40, fontWeight:800, color:result.color, marginBottom:4 }}>{result.level}</div>
            <div style={{ fontSize:18, fontWeight:600, color:"var(--text-primary)", marginBottom:16 }}>{result.label}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, maxWidth:280, margin:"0 auto 20px" }}>
              <div style={{ background:"var(--bg-page)", borderRadius:10, padding:12 }}>
                <div style={{ fontSize:22, fontWeight:800, color:P }}>{result.correct}/{total}</div>
                <div style={{ fontSize:11, color:"var(--text-secondary)" }}>correctas</div>
              </div>
              <div style={{ background:"var(--bg-page)", borderRadius:10, padding:12 }}>
                <div style={{ fontSize:22, fontWeight:800, color:result.color }}>{result.score}%</div>
                <div style={{ fontSize:11, color:"var(--text-secondary)" }}>puntaje</div>
              </div>
            </div>
            <div style={{ background:"#ecfdf5", border:"1px solid #d1fae5", borderRadius:10, padding:12, marginBottom:16, fontSize:13, color:"#065f46" }}>
              {saving ? "Guardando resultado…" : "✓ Resultado guardado en el perfil del lead"}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={onClose} style={{ flex:1, padding:"11px", background:"var(--bg-surface-subtle)", color:"var(--text-secondary)", border:"none", borderRadius:10, fontSize:13, cursor:"pointer" }}>Cerrar</button>
              <button onClick={()=>{ onClose(); }} style={{ flex:2, padding:"11px", background:P, color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" }}>
                Continuar con el lead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function CRM() {
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

  // Load real leads and tasks from Supabase
  useEffect(() => {
    getLeads().then(rows => {
      if (rows.length > 0) {
        setLeads(rows.map(r => ({
          id:       r.id,
          name:     r.full_name,
          email:    r.email,
          phone:    r.phone || "",
          country:  r.country || "🌎",
          source:   r.source || "Orgánico",
          stage:    r.stage || "nuevo",
          score:    r.test_score || 50,
          level:    r.level_interest || null,
          program:  r.program_interest || "Inglés",
          date:     new Date(r.created_at).toLocaleDateString("es-HN", { day:"2-digit", month:"short" }),
          tags:     [],
          notes:    r.notes || "",
          lastMsg:  "",
          activity: [{ type:"lead", text:`Lead registrado · ${r.source||"Orgánico"}`, time: new Date(r.created_at).toLocaleDateString("es-HN") }],
        })));
      }
    }).catch(console.error);

    supabase.from("crm_tasks")
      .select("id, title, due_date, done, priority, leads(full_name)")
      .order("due_date", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          setTasks(data.map(t => ({
            id:       t.id,
            text:     t.title,
            lead:     t.leads?.full_name || "—",
            due:      t.due_date ? new Date(t.due_date).toLocaleDateString("es-HN",{day:"2-digit",month:"short"}) : "Sin fecha",
            done:     t.done || false,
            priority: t.priority || "medium",
          })));
        }
      }).catch(console.error);
  }, []);

  const [view, setView]         = useState("pipeline");
  const [leads, setLeads]       = useState([]);   // loaded from Supabase
  const [tasks, setTasks]       = useState([]);   // loaded from Supabase
  const [selLead, setSelLead]   = useState(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [search, setSearch]     = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [toast, setToast]       = useState(null);
  const [ptLead,  setPtLead]    = useState(null); // placement test active lead

  function showToast(msg, color=G) {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  async function updateLeadStage(id, stage) {
    setLeads(ls => ls.map(l => l.id===id ? {...l,stage} : l));
    const s = STAGES.find(x=>x.id===stage);
    showToast(`${s?.icon} Lead movido a ${s?.label}`);
    if (selLead?.id===id) setSelLead(l => ({...l,stage}));
    // Persist if real ID (UUID)
    if (typeof id === "string" && id.length > 10) {
      import("../lib/db.js").then(({ updateLeadStage: persist }) =>
        persist(id, stage).catch(console.error)
      );
    }
  }

  async function convertLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    showToast("Creando estudiante…", "#0369a1");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { showToast("Sesión expirada", R); return; }

      let res, json;
      try {
        res = await fetch("/api/auth/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
          body: JSON.stringify({ action:"student", email:lead.email, fullName:lead.name, phone:lead.phone||null, level:lead.level||"A1", programId:lead.program||"en" }),
        });
        json = await res.json().catch(() => ({}));
      } catch(netErr) {
        showToast("Error de red — verificá tu conexión", R);
        return;
      }

      if (!res.ok || !json.ok) {
        showToast("Error: " + (json.error || json.message || "No se pudo crear"), R);
        return;
      }

      // 3. Update lead stage in DB
      await updateLeadStage(id, "convertido").catch(() => {});

      // 4. Update local state
      setLeads(ls => ls.map(l => l.id === id ? { ...l, stage: "convertido" } : l));
      if (selLead?.id === id) setSelLead(l => ({ ...l, stage: "convertido" }));

      showToast(`🎉 ${lead.name} matriculado — invitación enviada a ${lead.email}`, G);

    } catch (e) {
      showToast("Error: " + e.message, R);
    }
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
    <>
    <div style={{ display:"flex",flexDirection:isMobile?"column":"row", minHeight:"100vh", background:"var(--bg-page)", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width:isMobile?260:196, background:PH, position:isMobile?"fixed":"sticky", top:0, left:0, bottom:0, zIndex:isMobile?9990:1, transform:isMobile?(sideOpen?"translateX(0)":"translateX(-100%)"):"none", transition:"transform .25s ease", overflowY:"auto", display:"flex", flexDirection:"column", padding:"0 0 14px", flexShrink:0, minHeight:"100vh", position:"sticky", top:0 }}>
        <div style={{ padding:"22px 18px 18px", borderBottom:"1px solid rgba(255,255,255,.08)", marginBottom:8 }}>
          <div style={{ fontSize:11, color:Y, fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>WCA Academy</div>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>CRM Ventas</div>
        </div>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{setView(n.id);setSelLead(null);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 18px", border:"none", background:view===n.id?"rgba(255,255,255,.12)":"transparent", color:view===n.id?"#fff":"rgba(255,255,255,.45)", fontSize:12, cursor:"pointer", textAlign:"left", borderLeft:`2px solid ${view===n.id?Y:"transparent"}`, transition:"all .15s", fontFamily:"inherit", fontWeight:view===n.id?600:400, width:"100%" }}>
            <i className={"ti "+n.icon} style={{ fontSize:14, width:18, textAlign:"center" }} aria-hidden="true"/>
            {n.label}
            {n.id==="tasks" && pendingTasks>0 && <span style={{ marginLeft:"auto", fontSize:11, background:R, color:"#fff", borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pendingTasks}</span>}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:"14px 18px 0", borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:Y, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:PH }}>VN</div>
            <div><div style={{ fontSize:11, color:"#fff", fontWeight:600 }}>Asesor WCA</div><div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>Ventas</div></div>
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
      <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:60, background:"var(--bg-surface)", borderBottom:"1px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* Search */}
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"var(--bg-page)", border:"1px solid var(--border)", borderRadius:10, padding:"7px 13px", width:240 }}>
              <i className="ti ti-search" style={{ fontSize:14, color:"var(--text-tertiary)" }} aria-hidden="true"/>
              <input aria-label="Buscar lead" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar lead..." style={{ border:"none", outline:"none", fontSize:13, background:"transparent", color:"var(--text-primary)", flex:1, fontFamily:"inherit" }}/>
            </div>
            {view==="pipeline"||view==="leads" ? (
              <select value={filterStage} onChange={e=>setFilterStage(e.target.value)} style={{ padding:"7px 12px", border:"1px solid var(--border)", borderRadius:10, fontSize:12, background:"var(--bg-page)", fontFamily:"inherit", color:"var(--text-secondary)" }}>
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
        <div style={{ background:"var(--bg-surface)", borderBottom:"1px solid #e2e8f0", padding:"0 24px", display:"flex", gap:0 }}>
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
                <div style={{ fontSize:18, fontWeight:800, color:"var(--text-primary)", lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:2 }}>{k.label}</div>
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
                    <div key={stage.id} style={{ width:isMobile?180:220, flexShrink:0 }}>
                      {/* Column header */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"8px 12px", background:"var(--bg-surface)", borderRadius:10, border:"1px solid var(--border)", boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:stage.color }}/>
                        <span style={{ fontSize:12, fontWeight:700, color:"var(--text-primary)", flex:1 }}>{stage.label}</span>
                        <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:stage.light, color:stage.color, fontWeight:700 }}>{stageLeads.length}</span>
                      </div>
                      {/* Cards */}
                      <div>
                        {stageLeads.length===0 && (
                          <div style={{ padding:"24px 12px", textAlign:"center", background:"var(--bg-surface)", borderRadius:10, border:"1px dashed #e2e8f0", color:"#cbd5e1", fontSize:12 }}>
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
                        <div key={stage.id} style={{ width:isMobile?260:200, flexShrink:0 , zIndex:isMobile?9990:1, transform:isMobile?(sideOpen?"translateX(0)":"translateX(-100%)"):"none", transition:"transform .25s ease", maxWidth:isMobile?"80vw":"none" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10, padding:"7px 10px", background:"var(--bg-surface)", borderRadius:9, border:"1px solid var(--border)" }}>
                            <div style={{ width:7, height:7, borderRadius:"50%", background:stage.color }}/>
                            <span style={{ fontSize:11, fontWeight:700, color:"var(--text-primary)", flex:1 }}>{stage.label}</span>
                            <span style={{ fontSize:11, padding:"2px 7px", borderRadius:20, background:stage.light, color:stage.color, fontWeight:700 }}>{stageLeads.length}</span>
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
                <div style={{ background:"var(--bg-surface)", borderRadius:14, border:"1px solid var(--border)", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}><table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"var(--bg-page)" }}>
                        {["Lead","Etapa","Score","Programa","Canal","Última actividad",""].map(h=>(
                          <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-tertiary)", letterSpacing:.5, textTransform:"uppercase" }}>{h}</th>
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
                                <div style={{ fontWeight:600, color:"var(--text-primary)" }}>{l.name}</div>
                                <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>{l.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"14px 16px" }}><StageChip stage={l.stage}/></td>
                          <td style={{ padding:"14px 16px" }}><ScoreRing score={l.score} size={36}/></td>
                          <td style={{ padding:"14px 16px", color:"var(--text-secondary)" }}>{l.program||"—"}</td>
                          <td style={{ padding:"14px 16px" }}>
                            <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:"var(--bg-surface-subtle)", color:"var(--text-secondary)" }}>{l.source}</span>
                          </td>
                          <td style={{ padding:"14px 16px", color:"var(--text-tertiary)", fontSize:12 }}>{l.date}</td>
                          <td style={{ padding:"14px 16px" }}>
                            <button style={{ fontSize:11, padding:"5px 12px", background:PD, color:P, border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Ver →</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </div>
              </div>
            )}

            {/* ── TAREAS ── */}
            {view==="tasks" && (
              <div style={{ maxWidth:680 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{pendingTasks} tareas pendientes hoy</div>
                  <button onClick={async()=>{
                    const titulo = window.prompt("Título de la tarea:");
                    if(!titulo?.trim()) return;
                    const leadName = window.prompt("Lead relacionado (nombre o email):");
                    const due = window.prompt("Fecha límite (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
                    try {
                      const saved = await createTask({ title:titulo.trim(), due_date:due||null, priority:"medium", done:false });
                      setTasks(ts => [{
                        id: saved.id, text: titulo.trim(),
                        lead: leadName || "—",
                        due: due ? new Date(due).toLocaleDateString("es-HN",{day:"2-digit",month:"short"}) : "Sin fecha",
                        done: false, priority: "medium"
                      }, ...ts]);
                      showToast("✓ Tarea creada");
                    } catch(e) { showToast("Error: "+e.message, R); }
                  }} style={{ fontSize:12, padding:"7px 14px", background:P, color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>+ Nueva tarea</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {tasks.map((t,i)=>(
                    <div key={t.id} style={{ display:"flex", gap:12, alignItems:"center", background:"var(--bg-surface)", border:`1px solid ${t.done?"#e2e8f0":t.priority==="high"?`${R}30`:"#e2e8f0"}`, borderRadius:12, padding:"14px 18px", boxShadow:"0 1px 4px rgba(0,0,0,.04)", opacity:t.done?.5:1 }}>
                      <input type="checkbox" checked={t.done} onChange={async()=>{
  setTasks(ts=>ts.map(x=>x.id===t.id?{...x,done:!x.done}:x));
  if(t.id && typeof t.id === "string" && t.id.length > 10) {
    try { await toggleTask(t.id); } catch(e) { console.error(e); }
  }
}} style={{ width:18, height:18, cursor:"pointer", accentColor:P, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:500, color:t.done?"#94a3b8":"#0f172a", textDecoration:t.done?"line-through":"none" }}>{t.text}</div>
                        <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:3 }}>Lead: <strong style={{ color:"var(--text-secondary)" }}>{t.lead}</strong> · {t.due}</div>
                      </div>
                      {!t.done && t.priority==="high" && <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:RD, color:R, fontWeight:600 }}>Urgente</span>}
                      {!t.done && t.priority==="medium" && <span style={{ fontSize:11, padding:"3px 9px", borderRadius:20, background:AD, color:A, fontWeight:600 }}>Normal</span>}
                      <button onClick={async()=>{
  setTasks(ts=>ts.filter(x=>x.id!==t.id));
}} style={{ fontSize:12, padding:"5px 10px", background:"var(--bg-surface-subtle)", color:"var(--text-tertiary)", border:"none", borderRadius:7, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
                    </div>
                  ))}
                  {pendingTasks===0 && (
                    <div style={{ textAlign:"center", padding:"40px 20px", background:"var(--bg-surface)", borderRadius:14, border:"1px solid var(--border)" }}>
                      <div style={{ fontSize:isMobile?22:32, marginBottom:10 }}>✅</div>
                      <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>¡Todo al día!</div>
                      <div style={{ fontSize:13, color:"var(--text-tertiary)" }}>No tenés tareas pendientes para hoy.</div>
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
                  <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>Funnel de conversión</div>
                    {STAGES.filter(s=>s.id!=="perdido").map(stage=>{
                      const count = leads.filter(l=>l.stage===stage.id).length;
                      return (
                        <div key={stage.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                          <div style={{ fontSize:12, width:100, flexShrink:0, color:"var(--text-secondary)" }}>{stage.icon} {stage.label}</div>
                          <MiniBar pct={(count/totalLeads)*100} color={stage.color}/>
                          <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", width:24, textAlign:"right" }}>{count}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sources */}
                  <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>Canales de adquisición</div>
                    {(leads.reduce((acc,l)=>{const src=l.source||"Otro";acc[src]=(acc[src]||0)+1;return acc;},{}))&&Object.entries(leads.reduce((acc,l)=>{const src=l.source||"Otro";acc[src]=(acc[src]||0)+1;return acc;},{})).map(([src,count],i)=>(
                      <div key={s.label} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                        <div style={{ fontSize:12, width:90, flexShrink:0, color:"var(--text-secondary)" }}>{s.label}</div>
                        <MiniBar pct={s.pct} color={s.color}/>
                        <div style={{ fontSize:11, color:"var(--text-tertiary)", width:50, textAlign:"right" }}>{s.pct}% ({s.count})</div>
                      </div>
                    ))}
                    <div style={{ marginTop:14, background:"#ecfdf5", border:"1px solid #6ee7b7", borderRadius:9, padding:"8px 12px", fontSize:11, color:"#065f46" }}>
                      💡 Los referidos convierten al <strong>42%</strong> — el canal más eficiente de WCA
                    </div>
                  </div>

                  {/* Score distribution */}
                  <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>Distribución de scores</div>
                    <div style={{ display:"flex", gap:10 }}>
                      {[{label:"Calientes 🔥",min:80,color:G},{label:"Tibios 🌡",min:50,color:A},{label:"Fríos ❄️",min:0,color:R}].map(({label,min,color},i,arr)=>{
                        const max = arr[i-1]?.min||101;
                        const cnt = leads.filter(l=>l.score>=min&&l.score<max).length;
                        return (
                          <div key={label} style={{ flex:1, textAlign:"center", background:`${color}10`, borderRadius:10, padding:"14px 10px", border:`1px solid ${color}20` }}>
                            <div style={{ fontSize:26, fontWeight:800, color }}>{cnt}</div>
                            <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:4, lineHeight:1.4 }}>{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Programs */}
                  <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>Interés por programa</div>
                    {["Inglés","VA General","Inglés + VA","VA · Marketing Digital"].map(prog=>{
                      const cnt = leads.filter(l=>l.program===prog).length;
                      return (
                        <div key={prog} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                          <div style={{ fontSize:12, flex:1, color:"var(--text-secondary)" }}>{prog}</div>
                          <MiniBar pct={(cnt/totalLeads)*100} color={P}/>
                          <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)", width:16 }}>{cnt}</div>
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
      {isMobile && <button onClick={()=>setSideOpen(o=>!o)} style={{position:"fixed",bottom:20,right:20,zIndex:9988,width:50,height:50,borderRadius:"50%",background:P,color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(0,0,0,.25)",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sideOpen?"\u2715":"\u2630"}</button>}
    </div>
    {ptLead && (
      <PlacementTestModal
        lead={ptLead}
        onClose={()=>setPtLead(null)}
        onSave={({score,level})=>{
          setLeads(ls=>ls.map(l=>l.id===ptLead.id?{...l,score,level,stage:"test"}:l));
          if(selLead?.id===ptLead.id) setSelLead(l=>({...l,score,level,stage:"test"}));
          showToast(`✓ Nivel ${level} detectado — ${score}% de aciertos`);
        }}
      />
    )}
    </>
  );
}
