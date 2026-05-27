// ─── WCA Hub — Wizard de autoinscripción pública ─────────────────
// Ruta: /registro
// 5 pasos: Programa → Nivel/Test → Horario → Datos → Pago
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { detectTimezone, TIMEZONES, getTimezonesByRegion } from "../lib/timezone.js";

const P = "#155266", PD = "#e8f3f6", Y = "#ffbb23", YD = "#fff8e6";
const G = "#059669", GD = "#ecfdf5", R = "#dc2626", RD = "#fef2f2", A = "#d97706";

// ── Program visual config (UI only — data comes from Supabase) ────
const PROG_UI = {
  en:       { icon:"🇬🇧", color:P,         tag:null },
  va:       { icon:"💻",  color:"#7c3aed",  tag:"Más popular" },
  va_mkt:   { icon:"📱",  color:"#db2777",  tag:"Especialización" },
  va_legal: { icon:"⚖️",  color:"#0e7490",  tag:"Especialización" },
  va_care:  { icon:"🏥",  color:"#059669",  tag:"Especialización" },
};

const LEVELS = [
  { id:"A1", label:"A1 · Principiante", desc:"Comienzo desde cero" },
  { id:"A2", label:"A2 · Básico",       desc:"Conozco palabras básicas" },
  { id:"B1", label:"B1 · Intermedio",   desc:"Me comunico con esfuerzo" },
  { id:"B2", label:"B2 · Intermedio alto", desc:"Converso con fluidez" },
  { id:"C1", label:"C1 · Avanzado",     desc:"Domino el idioma" },
];

// Placement test questions
const QUESTIONS = [
  { q:"What is your name?", opts:["I am have María","My name is María","Name I María","Have name María"], ans:1 },
  { q:"___ is she? She is my sister.", opts:["What","Where","Who","How"], ans:2 },
  { q:"They ___ students.", opts:["is","am","be","are"], ans:3 },
  { q:"I ___ to the store yesterday.", opts:["go","goes","went","going"], ans:2 },
  { q:"She has lived here ___ five years.", opts:["since","during","from","for"], ans:3 },
  { q:"___ you ever been to Mexico?", opts:["Has","Had","Did","Have"], ans:3 },
  { q:"If I ___ you, I would apologize.", opts:["was","am","be","were"], ans:3 },
  { q:"The report ___ by the team last week.", opts:["is written","wrote","writes","was written"], ans:3 },
  { q:"By the time she arrived, we ___ waiting for two hours.", opts:["have been","were","was","had been"], ans:3 },
  { q:"___ he study harder, he might pass.", opts:["Would","Could","Shall","Should"], ans:3 },
];
const levelFromScore = s => {
  if (s <= 1) return "A1"; if (s <= 3) return "A2";
  if (s <= 6) return "B1"; if (s <= 8) return "B2"; return "C1";
};

// ── Step indicator ────────────────────────────────────────────────
const STEP_LABELS = ["Programa","Nivel","Horario","Datos","Pago"];

function Steps({ current, total }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:32 }}>
      {Array.from({length:total},(_,i)=>{
        const n = i+1, done = n < current, active = n === current;
        return (
          <div key={n} style={{ display:"flex", alignItems:"center", flex: i < total-1 ? 1 : "none" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0 }}>
              <div style={{
                width:34, height:34, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:700,
                background: done ? G : active ? P : "var(--bg-surface-subtle)",
                color: done || active ? "#fff" : "var(--text-tertiary)",
                border: `2px solid ${done ? G : active ? P : "var(--border)"}`,
                transition:"all .3s",
              }}>
                {done ? "✓" : n}
              </div>
              <div style={{ fontSize:9, color: active ? P : done ? G : "var(--text-tertiary)",
                fontWeight: active ? 700 : 500, whiteSpace:"nowrap", letterSpacing:".3px" }}>
                {STEP_LABELS[i]}
              </div>
            </div>
            {i < total-1 && (
              <div style={{ flex:1, height:2, background: done ? G : "var(--border)", margin:"0 8px 18px", transition:"background .3s" }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    programId: null, level: null, groupId: null,
    name: "", email: "", phone: "", country: "", timezone: detectTimezone(),
    paymentMethod: null,
  });
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Load programs dynamically from Supabase
  useEffect(() => {
    supabase.from("programs")
      .select("id, name, description, price_monthly, price_quarterly, active, prereq_program_id")
      .eq("active", true)
      .order("id")
      .then(({ data: progs, error }) => {
        if (error || !progs?.length) {
          // Fallback to basic programs if table doesn't exist yet
          setPrograms([
            { id:"en",      name:"Inglés Completo",       price_monthly:95, description:"CEFR A1–C1, clases en vivo 3x/semana + plataforma 24/7", prereq_program_id:null },
            { id:"va",      name:"Asistente Virtual",     price_monthly:95, description:"VA bilingüe: herramientas digitales, gestión remota, inglés profesional", prereq_program_id:null },
            { id:"va_mkt",  name:"VA · Marketing Digital",price_monthly:95, description:"Redes sociales, copywriting, email marketing.", prereq_program_id:"va" },
            { id:"va_legal",name:"VA · Legal Assistant",  price_monthly:95, description:"Documentos legales, inglés jurídico.", prereq_program_id:"va" },
            { id:"va_care", name:"VA · Cuidador Remoto",  price_monthly:95, description:"Terminología médica, coordinación de citas.", prereq_program_id:"va" },
          ]);
        } else {
          setPrograms(progs);
        }
        setLoadingPrograms(false);
      })
      .catch(() => {
        setPrograms([
          { id:"en", name:"Inglés Completo", price_monthly:95, description:"CEFR A1–C1, clases en vivo 3x/semana + plataforma 24/7", prereq_program_id:null },
          { id:"va", name:"Asistente Virtual", price_monthly:95, description:"VA bilingüe: herramientas digitales, gestión remota.", prereq_program_id:null },
        ]);
        setLoadingPrograms(false);
      });
  }, []);
  const [answers, setAnswers] = useState({});
  const [testDone, setTestDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transferResult, setTransferResult] = useState(null);

  const _progBase = programs.find(p => p.id === data.programId);
  const ui = PROG_UI[data.programId] || PROG_UI.en;
  const prog = _progBase ? { ..._progBase,
    icon:     ui.icon,
    color:    ui.color,
    tag:      ui.tag,
    price:    _progBase.price_monthly || 95,
    interval: _progBase.prereq_program_id ? "3 meses" : "mes",
    desc:     _progBase.description || "",
    prereq:   _progBase.prereq_program_id,
  } : null;
  const isIngles = data.programId === "en";
  const TOTAL_STEPS = 5;

  // Show canceled notice
  useEffect(() => {
    if (searchParams.get("canceled")) setError("El pago fue cancelado. Podés intentarlo de nuevo.");
  }, [searchParams]);

  // Load groups when program + level are set
  useEffect(() => {
    if (!data.programId || (!data.level && isIngles)) return;
    setLoadingGroups(true);
    supabase.from("groups")
      .select("id, level, schedule, schedule_utc, schedule_end_utc, schedule_timezone, days, days_arr, capacity, program_id, active_unit, enrollments(id, status)")
      .eq("program_id", data.programId)
      .eq("active", true)
      .then(({ data: grps, error }) => {
        if (error) { console.error("Groups load error:", error.message); setGroups([]); setLoadingGroups(false); return; }
        const available = (grps || [])
          .filter(g => isIngles ? g.level === data.level : true)
          .map(g => ({
            ...g,
            enrolled: g.enrollments?.filter(e => e.status === "active").length || 0,
          }))
          .filter(g => g.enrolled < (g.capacity || 25));
        setGroups(available);
        setLoadingGroups(false);
      })
      .catch(() => { setGroups([]); setLoadingGroups(false); });
  }, [data.programId, data.level, isIngles]);

  // ── Step 1: Program ─────────────────────────────────────────────
  function StepProgram() {
    return (
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>¿Qué querés estudiar?</h2>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>Elegí el programa que mejor se adapta a tus objetivos.</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {loadingPrograms ? (
            <div style={{ padding:32, textAlign:"center", color:"var(--text-secondary)", fontSize:13 }}>Cargando programas...</div>
          ) : programs.map(p => {
            const ui = PROG_UI[p.id] || PROG_UI.en;
            const pDisplay = {...p, icon:ui.icon, color:ui.color, tag:ui.tag, price:p.price_monthly||95, interval:p.prereq_program_id?"3 meses":"mes", desc:p.description||""};
            return (
            <button key={pDisplay.id} onClick={() => { setData(d => ({...d, programId:pDisplay.id, level:pDisplay.id==="en"?null:"A1"})); setStep(2); }}
              style={{ display:"flex", alignItems:"flex-start", gap:16, padding:"16px 20px",
                background: data.programId===pDisplay.id ? pDisplay.color+"15" : "var(--bg-surface)",
                border:`2px solid ${data.programId===pDisplay.id ? pDisplay.color : "var(--border)"}`,
                borderRadius:14, cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                transition:"all .2s",
              }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=pDisplay.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=data.programId===pDisplay.id?pDisplay.color:"var(--border)"}>
              <div style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{pDisplay.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{pDisplay.name}</span>
                  {pDisplay.tag && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:10, background:pDisplay.color+"20", color:pDisplay.color, fontWeight:700 }}>{pDisplay.tag}</span>}
                </div>
                <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:6, lineHeight:1.5 }}>{pDisplay.desc}</div>
                <div style={{ fontSize:13, fontWeight:700, color:pDisplay.color }}>${pDisplay.price} USD/{pDisplay.interval}</div>
              </div>
            </button>
          );
          })}
        </div>
      </div>
    );
  }

  // ── Step 2: Level / Placement Test ─────────────────────────────
  function StepLevel() {
    if (!isIngles) {
      return (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>Perfecto</h2>
          <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>El programa de {prog?.name} no requiere test de nivel. Empezás desde el módulo 1.</p>
          <div style={{ background:GD, border:`1px solid ${G}40`, borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
            <div style={{ fontSize:14, fontWeight:700, color:G }}>✓ Módulo 1 — Introducción</div>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>Ingresás directamente al módulo de inicio del programa.</div>
          </div>
          <button onClick={() => { setData(d=>({...d, level:"A1"})); setStep(3); }}
            style={btnStyle(P)}>
            Continuar →
          </button>
          <button onClick={() => setStep(1)} style={{...btnStyle("transparent"), color:"var(--text-secondary)", border:"1px solid var(--border)", marginTop:8}}>
            ← Cambiar programa
          </button>
        </div>
      );
    }
    if (!testDone) {
      return (
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>Test de nivel</h2>
          <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:8 }}>10 preguntas · ~4 minutos. Detectamos tu nivel CEFR.</p>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24 }}>
            <div style={{ fontSize:11, color:"var(--text-tertiary)" }}>{Object.keys(answers).length}/{QUESTIONS.length} respondidas</div>
            <div style={{ flex:1, height:4, background:"var(--border)", borderRadius:2 }}>
              <div style={{ height:"100%", background:P, borderRadius:2, width:`${(Object.keys(answers).length/QUESTIONS.length)*100}%`, transition:"width .3s" }}/>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {QUESTIONS.map((q,i) => (
              <div key={i} style={{ background:"var(--bg-surface)", border:`1px solid ${answers[i]!==undefined ? P+"40" : "var(--border)"}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", marginBottom:10 }}>{i+1}. {q.q}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {q.opts.map((opt,j) => (
                    <button key={j} onClick={() => setAnswers(a => ({...a,[i]:j}))}
                      style={{ padding:"8px 12px", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                        border:`1.5px solid ${answers[i]===j ? P : "var(--border)"}`,
                        background:answers[i]===j ? PD : "var(--bg-surface-subtle)",
                        color:answers[i]===j ? P : "var(--text-primary)", fontWeight:answers[i]===j?600:400,
                        transition:"all .15s",
                      }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {Object.keys(answers).length === QUESTIONS.length && (
            <button onClick={() => {
              const correct = QUESTIONS.filter((q,i) => answers[i] === q.ans).length;
              const lv = levelFromScore(correct);
              setData(d => ({...d, level:lv}));
              setTestDone(true);
            }} style={{...btnStyle(G), marginTop:20}}>
              Ver mi resultado →
            </button>
          )}
          <button onClick={() => setStep(1)} style={{...btnStyle("transparent"), color:"var(--text-secondary)", border:"1px solid var(--border)", marginTop:8}}>
            ← Cambiar programa
          </button>
        </div>
      );
    }
    // Test result
    const lv = LEVELS.find(l => l.id === data.level);
    return (
      <div>
        <div style={{ textAlign:"center", padding:"20px 0 28px" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🎯</div>
          <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:6 }}>Tu nivel detectado</div>
          <div style={{ fontSize:36, fontWeight:900, color:P, marginBottom:6 }}>{data.level}</div>
          <div style={{ fontSize:16, fontWeight:600, color:"var(--text-primary)", marginBottom:8 }}>{lv?.label}</div>
          <div style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:24 }}>{lv?.desc}</div>
        </div>
        <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:12, fontWeight:600 }}>¿No se corresponde con tu nivel real? Elegí manualmente:</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 }}>
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => setData(d=>({...d, level:l.id}))}
              style={{ padding:"10px 12px", borderRadius:9, border:`2px solid ${data.level===l.id?P:"var(--border)"}`,
                background:data.level===l.id?PD:"var(--bg-surface-subtle)",
                color:data.level===l.id?P:"var(--text-secondary)",
                fontSize:12, fontWeight:data.level===l.id?700:400, cursor:"pointer", fontFamily:"inherit",
                textAlign:"left", transition:"all .15s",
              }}>
              <div style={{ fontWeight:700 }}>{l.id}</div>
              <div style={{ fontSize:10, marginTop:2 }}>{l.desc}</div>
            </button>
          ))}
        </div>
        <button onClick={() => setStep(3)} style={btnStyle(P)}>Continuar con {data.level} →</button>
        <button onClick={() => { setStep(1); setTestDone(false); setAnswers({}); }} style={{...btnStyle("transparent"), color:"var(--text-secondary)", border:"1px solid var(--border)", marginTop:8}}>
          ← Cambiar programa
        </button>
      </div>
    );
  }

  // ── Step 3: Schedule ─────────────────────────────────────────────
  function StepSchedule() {
    return (
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>Elegí tu horario</h2>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>
          Grupos activos con cupos disponibles.
          {data.timezone !== 'America/Tegucigalpa' && (
            <span style={{ color:A, fontWeight:600 }}> Horarios en tu zona ({TIMEZONES.find(t=>t.value===data.timezone)?.label?.split(" ")[0] || data.timezone}).</span>
          )}
        </p>
        {loadingGroups ? (
          <div style={{ padding:40, textAlign:"center" }}>
            <div style={{ width:28, height:28, border:"3px solid var(--border)", borderTopColor:P,
              borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 12px" }}/>
            <div style={{ fontSize:13, color:"var(--text-secondary)" }}>Buscando grupos disponibles...</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : groups.length === 0 ? (
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:12, padding:24, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📅</div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)", marginBottom:6 }}>Sin grupos con cupos disponibles</div>
            <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>
              Todos los grupos de nivel {data.level} están completos en este momento.<br/>
              Podés inscribirte en lista de espera y te avisamos cuando haya cupo.
            </div>
            <button onClick={() => { setData(d=>({...d, groupId:null})); setStep(4); }}
              style={{...btnStyle(P), marginTop:20, fontSize:13}}>
              Continuar sin grupo asignado →
            </button>
            <div style={{ fontSize:11, color:"var(--text-tertiary)", textAlign:"center", marginTop:8 }}>
              Tu coordinadora te asignará un grupo con cupo disponible
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            {groups.map(g => {
              const spotsLeft = (g.capacity || 25) - g.enrolled;
              const almostFull = spotsLeft <= 5;
              return (
                <button key={g.id} onClick={() => { setData(d=>({...d, groupId:g.id})); setStep(4); }}
                  style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"14px 18px", background: data.groupId===g.id ? PD : "var(--bg-surface)",
                    border:`2px solid ${data.groupId===g.id ? P : "var(--border)"}`,
                    borderRadius:12, cursor:"pointer", fontFamily:"inherit", transition:"all .2s",
                  }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=P}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=data.groupId===g.id?P:"var(--border)"}>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>
                      {g.days || "L·M·V"} · {g.schedule}
                    </div>
                    <div style={{ fontSize:11, color:"var(--text-secondary)" }}>
                      Nivel {g.level || data.level} · Grupo
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color: almostFull ? R : G }}>
                      {spotsLeft} cupos
                    </div>
                    <div style={{ fontSize:10, color:"var(--text-tertiary)", marginTop:2 }}>{g.enrolled}/{g.capacity||25} inscriptos</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button onClick={() => setStep(2)} style={{...btnStyle("transparent"), color:"var(--text-secondary)", border:"1px solid var(--border)", flex:1}}>
            ← Volver
          </button>
          <button onClick={() => { setData(d=>({...d, groupId:null})); setStep(4); }}
            style={{...btnStyle("transparent"), color:"var(--text-tertiary)", border:"1px solid var(--border)", flex:1, fontSize:12}}>
            Saltar (asignar después)
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Personal info ────────────────────────────────────────
  function StepInfo() {
    const COUNTRIES = ["Honduras","Guatemala","El Salvador","Nicaragua","Costa Rica","Panamá","México","Colombia","Perú","Argentina","Venezuela","Chile","Brasil","Ecuador","Bolivia","Paraguay","Uruguay","Rep. Dominicana","Cuba","Puerto Rico","España","Estados Unidos","Canadá","Otro"];
    return (
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>Tus datos</h2>
        <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>Tu información de contacto y zona horaria.</p>
        {[
          { label:"Nombre completo *", key:"name",    type:"text",  placeholder:"María Rodríguez" },
          { label:"Email *",           key:"email",   type:"email", placeholder:"maria@email.com" },
          { label:"WhatsApp / Teléfono", key:"phone", type:"tel",   placeholder:"+504 9900-0000" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>{f.label}</label>
            <input type={f.type} value={data[f.key]} placeholder={f.placeholder}
              onChange={e => setData(d => ({...d,[f.key]:e.target.value}))}
              style={{ width:"100%", padding:"11px 14px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}/>
          </div>
        ))}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>País</label>
            <select value={data.country} onChange={e=>setData(d=>({...d,country:e.target.value}))}
              style={{ width:"100%", padding:"11px 14px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}>
              <option value="">Seleccioná...</option>
              {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:5 }}>🌍 Zona horaria</label>
            <select value={data.timezone} onChange={e=>setData(d=>({...d,timezone:e.target.value}))}
              style={{ width:"100%", padding:"11px 14px", border:"1px solid var(--border)", borderRadius:9, fontSize:13, background:"var(--bg-surface-subtle)", color:"var(--text-primary)", fontFamily:"inherit" }}>
              {Object.entries(getTimezonesByRegion()).map(([region, tzList]) => (
                <optgroup key={region} label={region}>
                  {tzList.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        {error && <div style={{ background:RD, border:`1px solid ${R}40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:R, marginBottom:14 }}>{error}</div>}
        <button onClick={() => {
            if (!data.name.trim() || !data.email.trim()) { setError("Nombre y email son requeridos"); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setError("Email inválido"); return; }
            setError(""); setStep(5);
          }} style={btnStyle(P)}>
          Continuar →
        </button>
        <button onClick={() => setStep(3)} style={{...btnStyle("transparent"), color:"var(--text-secondary)", border:"1px solid var(--border)", marginTop:8}}>
          ← Volver
        </button>
      </div>
    );
  }

  // ── Step 5: Payment ──────────────────────────────────────────────
  function StepPayment() {
    if (transferResult) {
      return (
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🏦</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:8 }}>Instrucciones de pago</h2>
          <p style={{ fontSize:14, color:"var(--text-secondary)", marginBottom:24 }}>
            Enviamos los datos a <strong>{transferResult.email}</strong>.
          </p>
          <div style={{ background:PD, border:`2px solid ${P}`, borderRadius:12, padding:"16px 20px", marginBottom:20, textAlign:"left" }}>
            <div style={{ fontSize:11, color:P, fontWeight:700, textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>Tu código de referencia</div>
            <div style={{ fontSize:26, fontWeight:900, color:P, fontFamily:"monospace", letterSpacing:2 }}>{transferResult.referenceCode}</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:6 }}>Incluí este código en la descripción de la transferencia</div>
          </div>
          {(transferResult.bankAccounts||[]).map((b,i) => (
            <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px", marginBottom:10, textAlign:"left" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{b.nombre}</div>
              <div style={{ fontSize:12, color:"var(--text-secondary)", marginTop:4 }}>{b.banco} · <strong>{b.cuenta}</strong></div>
              {b.titular && <div style={{ fontSize:11, color:"var(--text-tertiary)", marginTop:2 }}>Titular: {b.titular}</div>}
            </div>
          ))}
          <div style={{ background:YD, border:`1px solid ${Y}`, borderRadius:10, padding:"12px 16px", fontSize:13, color:"#92400e", marginTop:12, textAlign:"left" }}>
            ⏱ Tu cuenta se activa en máximo 24 horas hábiles luego de confirmar el pago.
          </div>
        </div>
      );
    }

    // Summary card
    return (
      <div>
        <h2 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:6 }}>Resumen y pago</h2>
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:"16px 20px", marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>Tu inscripción</div>
          {[
            ["Programa",  prog?.name],
            ["Nivel",     data.level || "Módulo 1"],
            ["Nombre",    data.name],
            ["Email",     data.email],
            ["País",      data.country || "—"],
          ].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"6px 0", borderBottom:"1px solid var(--border-tertiary)" }}>
              <span style={{ color:"var(--text-secondary)" }}>{k}</span>
              <span style={{ fontWeight:600, color:"var(--text-primary)" }}>{v}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, padding:"12px 0 0", fontWeight:800 }}>
            <span style={{ color:"var(--text-primary)" }}>Total mensual</span>
            <span style={{ color:P }}>$95 USD</span>
          </div>
        </div>

        {error && <div style={{ background:RD, border:`1px solid ${R}40`, borderRadius:8, padding:"10px 14px", fontSize:12, color:R, marginBottom:14 }}>{error}</div>}

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {/* Stripe */}
          <button disabled={saving} onClick={async () => {
            setSaving(true); setError("");
            try {
              const res = await fetch("/api/register", {
                method:"POST", headers:{"Content-Type":"application/json"},
                body: JSON.stringify({...data, paymentMethod:"stripe"}),
              });
              const json = await res.json();
              if (!res.ok) { setError(json.error || "Error al procesar"); return; }
              window.location.href = json.data.checkoutUrl;
            } catch(e) { setError("Error de red. Intentá de nuevo."); }
            finally { setSaving(false); }
          }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"15px",
            background: saving ? "var(--bg-surface-subtle)" : P, color: saving?"var(--text-secondary)":"#fff",
            border:"none", borderRadius:12, fontSize:15, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:"inherit",
            transition:"all .2s" }}>
            {saving ? "Procesando..." : "💳 Pagar con tarjeta — $95/mes"}
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ flex:1, height:1, background:"var(--border)" }}/><span style={{ fontSize:11, color:"var(--text-tertiary)" }}>o</span><div style={{ flex:1, height:1, background:"var(--border)" }}/>
          </div>

          {/* Transfer */}
          <button disabled={saving} onClick={async () => {
            setSaving(true); setError("");
            try {
              const res = await fetch("/api/register", {
                method:"POST", headers:{"Content-Type":"application/json"},
                body: JSON.stringify({...data, paymentMethod:"transfer"}),
              });
              const json = await res.json();
              if (!res.ok) { setError(json.error || "Error al procesar"); return; }
              setTransferResult(json.data);
            } catch(e) { setError("Error de red. Intentá de nuevo."); }
            finally { setSaving(false); }
          }} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"14px",
            background:"var(--bg-surface)", color:"var(--text-primary)",
            border:"1.5px solid var(--border)", borderRadius:12, fontSize:14, fontWeight:600,
            cursor:saving?"not-allowed":"pointer", fontFamily:"inherit" }}>
            🏦 Pagar por transferencia bancaria
          </button>
        </div>

        <div style={{ fontSize:11, color:"var(--text-tertiary)", textAlign:"center", marginTop:14, lineHeight:1.6 }}>
          🔒 Sin permanencia. Cancelá cuando quieras.<br/>
          Tus datos están protegidos con cifrado SSL.
        </div>

        <button onClick={() => setStep(4)} style={{...btnStyle("transparent"), color:"var(--text-secondary)", border:"1px solid var(--border)", marginTop:12}}>
          ← Volver
        </button>
      </div>
    );
  }

  // ── Step titles ──────────────────────────────────────────────────
  const RD_VAR = "#fef2f2";
  const btnStyle = (bg) => ({
    width:"100%", padding:"13px", background:bg, color:bg===P?"#fff":bg===G?"#fff":bg===A?"#fff":"inherit",
    border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer",
    fontFamily:"inherit", transition:"opacity .2s",
  });

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-page)", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"24px 16px 48px" }}>
      <div style={{ maxWidth:520, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:16, cursor:"pointer" }} onClick={() => navigate("/")}>
            <div style={{ width:36, height:36, borderRadius:9, background:P, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:17, fontWeight:900, color:Y }}>W</span>
            </div>
            <span style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>WCA Academy</span>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", marginBottom:4 }}>Inscripción</div>
          <div style={{ fontSize:13, color:"var(--text-secondary)" }}>Sin tarjeta requerida en el primer paso</div>
        </div>

        {/* Steps */}
        {!transferResult && <Steps current={step} total={TOTAL_STEPS} />}

        {/* Selected program banner (steps 2-5) */}
        {step > 1 && prog && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
            background:`${prog.color}10`, border:`1px solid ${prog.color}30`,
            borderRadius:12, marginBottom:12 }}>
            <span style={{ fontSize:20 }}>{prog.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:prog.color }}>{prog.name}</div>
              <div style={{ fontSize:11, color:"var(--text-secondary)" }}>${prog.price} USD/{prog.interval}</div>
            </div>
            {step < 5 && (
              <button onClick={() => { setStep(1); setTestDone(false); setAnswers({}); }}
                style={{ fontSize:11, color:prog.color, background:"none", border:`1px solid ${prog.color}40`,
                  borderRadius:7, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                Cambiar
              </button>
            )}
          </div>
        )}

        {/* Step content */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:20, padding:"28px 28px 32px", boxShadow:"0 4px 24px rgba(0,0,0,.06)" }}>
          {step === 1 && <StepProgram />}
          {step === 2 && <StepLevel />}
          {step === 3 && <StepSchedule />}
          {step === 4 && <StepInfo />}
          {step === 5 && <StepPayment />}
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"var(--text-tertiary)" }}>
          ¿Ya tenés cuenta? <span onClick={() => navigate("/")} style={{ color:P, fontWeight:600, cursor:"pointer" }}>Iniciá sesión →</span>
        </div>
      </div>
    </div>
  );
}
