import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"#e8f3f6",
  secondary:"#ffbb23", secondaryDim:"#fff4d2", accent:"#fab82c",
  bg:"#f5f7fa", white:"#ffffff", text:"#1f2933", textSec:"#6b7280",
  border:"#d1dde3", green:"#059669", greenDim:"#d1fae5",
  red:"#dc2626", redDim:"#fee2e2",
};

const STEPS = [
  { id:"welcome",   label:"Bienvenida"    },
  { id:"program",   label:"Tu programa"   },
  { id:"placement", label:"Nivelación"    },
  { id:"how",       label:"Cómo funciona" },
  { id:"nextsteps", label:"Próximos pasos"},
  { id:"ready",     label:"¡Listo!"       },
];

// ─── UTILS ───────────────────────────────────────────────────────
function useTypewriter(text, speed = 32, start = true) {
  const [d, setD] = useState("");
  useEffect(() => {
    if (!start) return;
    setD(""); let i = 0;
    const t = setInterval(() => { setD(text.slice(0, ++i)); if (i >= text.length) clearInterval(t); }, speed);
    return () => clearInterval(t);
  }, [text, start]);
  return d;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────
function PrimaryBtn({ children, onClick, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"13px 32px", background: disabled ? "#94a3b8" : B.primary,
      color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700,
      cursor: disabled ? "not-allowed" : "pointer", fontFamily:"inherit",
      transition:"background .15s", ...style,
    }}
    onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.background=B.dark; }}
    onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.background=B.primary; }}>
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"10px 20px", background:"transparent", color:B.textSec, border:`1px solid ${B.border}`, borderRadius:10, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
      {children}
    </button>
  );
}

function StepDots({ current, total, onGoTo }) {
  return (
    <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
      {Array.from({length:total},(_,i) => (
        <button key={i} onClick={() => i < current && onGoTo(i)} style={{
          width: i===current ? 20 : 8, height:8, borderRadius:4,
          background: i===current ? B.primary : i<current ? B.secondary : B.border,
          border:"none", cursor: i<current?"pointer":"default",
          transition:"all .3s", padding:0,
        }} />
      ))}
    </div>
  );
}

function FadeSlide({ children }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{ opacity:v?1:0, transform:v?"translateY(0)":"translateY(12px)", transition:"all .35s ease", height:"100%" }}>
      {children}
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({length:24}, (_,i) => ({
    x: 10+(i*4)%85, delay:(i*.09).toFixed(2),
    color:[B.secondary,B.primary,B.accent,B.green,"#a78bfa","#f87171"][i%6],
    size:5+(i%3)*3, drift:((i%7)-3)*12,
  }));
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      <style>{`@keyframes fall{from{transform:translateY(-20px) rotate(0);opacity:1}to{transform:translateY(120%) rotate(var(--d));opacity:0}}`}</style>
      {pieces.map((p,i) => (
        <div key={i} style={{ position:"absolute", left:`${p.x}%`, top:0, width:p.size, height:p.size, borderRadius:i%3===0?0:"50%", background:p.color, animation:`fall 1.8s ${p.delay}s ease-in forwards`, ["--d"]:`${p.drift}deg` }}/>
      ))}
    </div>
  );
}

// ─── STEP 0 — Bienvenida (sin datos de nivel/programa) ───────────
function StepWelcome({ name, onNext }) {
  const greeting = useTypewriter(`¡Bienvenido${name ? ", " + name : ""}!`, 42);
  return (
    <div style={{ textAlign:"center", padding:"32px 24px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:B.primary, letterSpacing:1, marginBottom:28 }}>
          WCA <span style={{ color:B.secondary }}>HUB</span>
        </div>

        {/* Avatar */}
        <div style={{ position:"relative", width:88, height:88, margin:"0 auto 20px" }}>
          <div style={{ width:88, height:88, borderRadius:"50%", background:`linear-gradient(135deg, ${B.primary}, ${B.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, fontWeight:800, color:"#fff" }}>
            {name ? name[0].toUpperCase() : "🎓"}
          </div>
          <div style={{ position:"absolute", bottom:2, right:2, width:22, height:22, borderRadius:"50%", background:B.green, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${B.white}` }}>
            <i className="ti ti-check" style={{ fontSize:11, color:"#fff" }} aria-hidden="true" />
          </div>
        </div>

        <h1 style={{ fontSize:30, fontWeight:800, color:B.text, marginBottom:10, minHeight:40, letterSpacing:-0.5 }}>{greeting}</h1>
        <p style={{ fontSize:14, color:B.textSec, lineHeight:1.75, maxWidth:340, margin:"0 auto 20px" }}>
          Tu cuenta en World Connect Academy está lista.<br/>
          En los próximos <strong style={{ color:B.primary }}>2 minutos</strong> te guiamos para elegir tu programa y conocer cómo funciona WCA.
        </p>

        <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
          {[
            { icon:"ti-school", text:"Academia VA bilingüe", color:B.primary, bg:B.primaryDim },
            { icon:"ti-world",  text:"20+ países",           color:B.green,   bg:B.greenDim  },
            { icon:"ti-clock",  text:"~2 minutos",           color:"#7c3aed", bg:"#ede9fe"   },
          ].map((b,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:b.bg, borderRadius:20, border:`1px solid ${b.color}20` }}>
              <i className={`ti ${b.icon}`} style={{ fontSize:12, color:b.color }} aria-hidden="true" />
              <span style={{ fontSize:11, fontWeight:600, color:b.color }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <PrimaryBtn onClick={onNext} style={{ width:"100%", padding:"14px" }}>
          Comenzar →
        </PrimaryBtn>
        <div style={{ fontSize:11, color:B.textSec, marginTop:10 }}>Podés saltar el tour en cualquier momento</div>
      </div>
    </div>
  );
}

// ─── STEP 1 — Elegir programa ─────────────────────────────────────
function StepProgram({ selectedProgram, onSelect, onNext, onPrev }) {
  const PROGRAMS = [
    {
      id:"en", icon:"🇬🇧", title:"Inglés Completo",
      sub:"Marco CEFR A1 → C1", price:"$95/mes",
      desc:"Clases en vivo 3x por semana + práctica digital 24/7. Incluye examen de placement para detectar tu nivel.",
      color:B.primary, bg:B.primaryDim,
    },
    {
      id:"va", icon:"💻", title:"Asistente Virtual",
      sub:"Formación VA bilingüe", price:"$75/mes",
      desc:"Aprende a trabajar remotamente para clientes en EE.UU. Herramientas, comunicación y habilidades digitales.",
      color:"#7c3aed", bg:"#ede9fe",
    },
    {
      id:"en_va", icon:"⚡", title:"Inglés + VA",
      sub:"Programa combinado", price:"$170/mes",
      desc:"La combinación más completa. Inglés CEFR + formación VA en paralelo. Progreso independiente en cada programa.",
      color:B.dark, bg:"#e8f3f6",
    },
  ];

  return (
    <div style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Paso 1 de 2</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:B.text, marginBottom:4, letterSpacing:-0.5 }}>¿Qué querés estudiar?</h2>
        <p style={{ fontSize:12, color:B.textSec, marginBottom:18, lineHeight:1.6 }}>
          Elegí el programa que más se adapta a tus metas. Podés cambiar después hablando con tu coordinadora.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {PROGRAMS.map(p => (
            <button key={p.id} onClick={() => onSelect(p.id)}
              style={{
                display:"flex", gap:14, alignItems:"flex-start", padding:"14px 16px",
                background: selectedProgram===p.id ? p.bg : B.white,
                border:`2px solid ${selectedProgram===p.id ? p.color : B.border}`,
                borderRadius:14, cursor:"pointer", textAlign:"left", fontFamily:"inherit",
                transition:"all .18s",
              }}>
              <div style={{ fontSize:28, flexShrink:0, marginTop:2 }}>{p.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:selectedProgram===p.id ? p.color : B.text }}>{p.title}</div>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:selectedProgram===p.id?p.color:"#f1f5f9", color:selectedProgram===p.id?"#fff":B.textSec, fontWeight:600 }}>{p.price}</span>
                </div>
                <div style={{ fontSize:11, color:B.textSec, marginBottom:4, fontWeight:500 }}>{p.sub}</div>
                <div style={{ fontSize:11, color:B.textSec, lineHeight:1.6 }}>{p.desc}</div>
              </div>
              <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selectedProgram===p.id?p.color:B.border}`, background:selectedProgram===p.id?p.color:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {selectedProgram===p.id && <i className="ti ti-check" style={{ fontSize:11, color:"#fff" }} aria-hidden="true" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} disabled={!selectedProgram} style={{ flex:1 }}>
          {selectedProgram ? "Continuar →" : "Elegí un programa"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── STEP 2 — Placement test / nivelación ─────────────────────────
function StepPlacement({ program, selectedLevel, onSelect, onNext, onPrev }) {
  const [mode, setMode] = useState(null); // "test" | "coordinator"

  const LEVELS = [
    { id:"A1", label:"A1 · Principiante", desc:"No tengo conocimiento previo de inglés" },
    { id:"A2", label:"A2 · Básico",       desc:"Entiendo frases simples y me comunico básico" },
    { id:"B1", label:"B1 · Intermedio",   desc:"Me desenvuelvo en conversaciones cotidianas" },
    { id:"B2", label:"B2 · Avanzado",     desc:"Hablo con soltura en la mayoría de situaciones" },
    { id:"C1", label:"C1 · Avanzado+",    desc:"Me comunico con fluidez y precisión" },
  ];

  // For VA program, no placement test needed
  if (program === "va") {
    return (
      <div style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Paso 2 de 2</div>
          <h2 style={{ fontSize:22, fontWeight:800, color:B.text, marginBottom:8, letterSpacing:-0.5 }}>Programa VA — sin nivelación</h2>
          <p style={{ fontSize:13, color:B.textSec, lineHeight:1.7, marginBottom:20 }}>
            El programa de Asistente Virtual no requiere un examen de nivelación. Todos los estudiantes inician desde el Módulo 1.
          </p>
          <div style={{ background:B.primaryDim, borderRadius:12, padding:16 }}>
            {[
              "Módulo 1: Introducción al trabajo remoto",
              "Módulo 2: Herramientas digitales esenciales",
              "Módulo 3: Comunicación con clientes",
              "Módulo 4: Gestión de proyectos y productividad",
            ].map((m,i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:i<3?`1px solid ${B.border}`:"none" }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:B.primary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:12, color:B.text }}>{m}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
          <PrimaryBtn onClick={onNext} style={{ flex:1 }}>Continuar →</PrimaryBtn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Paso 2 de 2</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:B.text, marginBottom:4, letterSpacing:-0.5 }}>¿Cuál es tu nivel de inglés?</h2>
        <p style={{ fontSize:12, color:B.textSec, marginBottom:16, lineHeight:1.6 }}>
          Seleccioná el nivel que mejor describe tu inglés actual. Tu coordinadora académica lo confirmará antes de asignarte un grupo.
        </p>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {LEVELS.map(l => (
            <button key={l.id} onClick={() => onSelect(l.id)}
              style={{
                display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                background: selectedLevel===l.id ? B.primaryDim : B.white,
                border:`1.5px solid ${selectedLevel===l.id ? B.primary : B.border}`,
                borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit",
                transition:"all .15s",
              }}>
              <div style={{ width:36, height:36, borderRadius:10, background:selectedLevel===l.id?B.primary:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:selectedLevel===l.id?"#fff":B.textSec, flexShrink:0, transition:"all .15s" }}>
                {l.id}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:selectedLevel===l.id?B.primary:B.text }}>{l.label}</div>
                <div style={{ fontSize:11, color:B.textSec, marginTop:2 }}>{l.desc}</div>
              </div>
              {selectedLevel===l.id && <i className="ti ti-check" style={{ fontSize:16, color:B.primary }} aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", background:B.secondaryDim, borderRadius:10, marginTop:12, border:`1px solid ${B.accent}30` }}>
          <i className="ti ti-bulb" style={{ fontSize:14, color:"#92400e", flexShrink:0, marginTop:1 }} aria-hidden="true" />
          <div style={{ fontSize:11, color:"#92400e", lineHeight:1.6 }}>
            <strong>¿No sabés cuál elegir?</strong> Seleccioná A1 si tenés dudas. Tu coordinadora hará una evaluación rápida antes de asignarte el grupo definitivo.
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} disabled={!selectedLevel} style={{ flex:1 }}>
          {selectedLevel ? "Continuar →" : "Elegí tu nivel"}
        </PrimaryBtn>
      </div>
    </div>
  );
}

// ─── STEP 3 — Cómo funciona ───────────────────────────────────────
function StepHow({ onNext, onPrev }) {
  const [active, setActive] = useState(0);
  const HOW = [
    { icon:"ti-video",          bg:B.primary, title:"Clase en vivo",         tag:"3x por semana",    desc:"Lunes, miércoles y viernes tu docente imparte la clase en Microsoft Teams. Todos los estudiantes del mismo nivel ven la misma unidad esa semana." },
    { icon:"ti-device-laptop",  bg:B.dark,    title:"Práctica 24/7",         tag:"Sin restricción",  desc:"Después de clase accedés a videos, ejercicios y actividades en la plataforma. A cualquier hora, desde cualquier dispositivo." },
    { icon:"ti-writing",        bg:"#7c3aed", title:"Examen de unidad",      tag:"≥70% para aprobar",desc:"Tenés hasta 3 intentos para aprobar con 70% o más. Al aprobar, la siguiente unidad se desbloquea automáticamente." },
    { icon:"ti-certificate",    bg:B.green,   title:"Certificación por nivel",tag:"A1 → C1",          desc:"Al completar los 5 niveles CEFR obtenés tu certificado WCA Academy avalado internacionalmente." },
  ];
  return (
    <div style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Cómo funciona</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:B.text, marginBottom:20, letterSpacing:-0.5 }}>El ciclo semanal de WCA</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {HOW.map((h,i) => (
            <div key={i} onClick={() => setActive(i)} style={{ display:"flex", gap:14, padding:"12px 0", cursor:"pointer", position:"relative" }}>
              {i < HOW.length-1 && <div style={{ position:"absolute", left:18, top:44, bottom:0, width:2, background:i===active?B.primary:B.border, transition:"background .3s" }}/>}
              <div style={{ width:36, height:36, borderRadius:"50%", background:i===active?h.bg:"#f1f5f9", border:`2px solid ${i===active?h.bg:B.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .25s", zIndex:1 }}>
                <i className={`ti ${h.icon}`} style={{ fontSize:16, color:i===active?"#fff":B.textSec, transition:"color .25s" }} aria-hidden="true" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:i===active?B.text:B.textSec }}>{h.title}</div>
                  {i===active && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:B.secondaryDim, color:"#92400e", fontWeight:600 }}>{h.tag}</span>}
                </div>
                {i===active && <div style={{ fontSize:12, color:B.textSec, lineHeight:1.7 }}>{h.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} style={{ flex:1 }}>Continuar →</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── STEP 4 — Próximos pasos (qué pasa DESPUÉS del onboarding) ────
function StepNextSteps({ program, level, onNext, onPrev }) {
  const programNames = { en:"Inglés Completo", va:"Asistente Virtual", en_va:"Inglés + VA" };
  const progName = programNames[program] || "tu programa";

  const steps = program === "va" ? [
    { icon:"ti-user-check",   color:"#7c3aed", title:"Coordinadora te contacta",  desc:"En las próximas 24-48 horas, tu coordinadora académica te escribe por WhatsApp para confirmar tu matrícula." },
    { icon:"ti-calendar",     color:B.primary, title:"Asignación de grupo",        desc:"Se te asigna un grupo con horario fijo: Lunes, Miércoles y Viernes. Recibirás el link de Microsoft Teams." },
    { icon:"ti-credit-card",  color:B.green,   title:"Primer pago",                desc:"Tu coordinadora te indica cómo realizar el primer pago para activar el acceso completo." },
    { icon:"ti-rocket",       color:B.secondary==="#ffbb23"?"#92400e":B.dark, title:"Primera clase", desc:"¡Listo! Accedés a tu primera clase en vivo y a toda la plataforma." },
  ] : [
    { icon:"ti-user-check",   color:B.primary, title:"Coordinadora te contacta",   desc:"En las próximas 24-48 horas, tu coordinadora académica te escribe por WhatsApp para confirmar tu nivel y responder preguntas." },
    { icon:"ti-clipboard-check", color:"#7c3aed", title:"Confirmación de nivel",   desc:`Tu selección de nivel (${level || "por confirmar"}) será validada. Si es necesario, harán una evaluación rápida de 5 minutos.` },
    { icon:"ti-calendar",     color:B.green,   title:"Asignación de grupo y horario", desc:"Se te asigna un grupo con horario fijo. Recibirás el link de Microsoft Teams para unirte a las clases." },
    { icon:"ti-credit-card",  color:B.accent==="#fab82c"?"#92400e":B.dark, title:"Primer pago", desc:"Tu coordinadora te indica cómo realizar el primer pago para activar el acceso completo a la plataforma." },
  ];

  return (
    <div style={{ padding:"24px 20px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>¿Qué sigue?</div>
        <h2 style={{ fontSize:22, fontWeight:800, color:B.text, marginBottom:4, letterSpacing:-0.5 }}>Tus próximos pasos</h2>
        <p style={{ fontSize:12, color:B.textSec, marginBottom:20, lineHeight:1.6 }}>
          Registraste tu interés en <strong style={{ color:B.primary }}>{progName}</strong>. Esto es lo que pasa a continuación:
        </p>

        <div style={{ position:"relative" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display:"flex", gap:14, marginBottom:16, position:"relative" }}>
              {i < steps.length-1 && (
                <div style={{ position:"absolute", left:19, top:40, bottom:-16, width:2, background:B.border }} />
              )}
              <div style={{ width:40, height:40, borderRadius:"50%", background:`${s.color}15`, border:`2px solid ${s.color}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:16, color:s.color }} aria-hidden="true" />
              </div>
              <div style={{ flex:1, paddingTop:4 }}>
                <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:3 }}>{s.title}</div>
                <div style={{ fontSize:12, color:B.textSec, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"10px 12px", background:B.greenDim, borderRadius:10, border:`1px solid ${B.green}30`, marginTop:4 }}>
          <i className="ti ti-phone" style={{ fontSize:14, color:B.green, flexShrink:0, marginTop:1 }} aria-hidden="true" />
          <div style={{ fontSize:11, color:"#065f46", lineHeight:1.6 }}>
            <strong>¿Tenés preguntas?</strong> Escribinos por WhatsApp o al email <strong>info@worldconnectacademy.com</strong> — respondemos en menos de 24 horas.
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} style={{ flex:1 }}>Continuar →</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── STEP 5 — ¡Listo! (sin datos hardcodeados de nivel/horario) ───
function StepReady({ name, program, level, onFinish, saving }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);
  const programNames = { en:"Inglés Completo", va:"Asistente Virtual", en_va:"Inglés + VA" };
  const progName = programNames[program] || "WCA Academy";

  return (
    <div style={{ padding:"28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", textAlign:"center", position:"relative", overflow:"hidden" }}>
      {show && <Confetti />}
      <style>{`@keyframes pop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>
      <div>
        <div style={{ fontSize:52, marginBottom:12, animation:"pop .5s ease" }}>🎉</div>
        <h2 style={{ fontSize:26, fontWeight:800, color:B.text, marginBottom:8, letterSpacing:-0.5 }}>
          ¡Ya estás dentro, {name || "bienvenido"}!
        </h2>
        <p style={{ fontSize:13, color:B.textSec, lineHeight:1.75, marginBottom:24 }}>
          Tu perfil está creado. Tu coordinadora te contactará en las próximas <strong style={{ color:B.primary }}>24-48 horas</strong> para confirmar tu matrícula en <strong style={{ color:B.primary }}>{progName}</strong>.
        </p>

        <div style={{ background:B.bg, borderRadius:12, padding:16, textAlign:"left" }}>
          {[
            { text:"Perfil creado en WCA Hub",                done:true  },
            { text:`Programa elegido: ${progName}`,            done:true  },
            { text:level && program !== "va" ? `Nivel indicado: ${level} (pendiente confirmación)` : "Nivel: Módulo 1 (todos los VA empiezan aquí)", done:true  },
            { text:"Coordinadora notificada — te contactará pronto", done:true  },
            { text:"Asignación de grupo y horario",            done:false },
            { text:"Primer pago y activación completa",        done:false },
          ].map((item,i,arr) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:i<arr.length-1?`1px solid ${B.border}`:"none" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:item.done?B.green:"transparent", border:`1.5px solid ${item.done?B.green:B.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {item.done
                  ? <i className="ti ti-check" style={{ fontSize:11, color:"#fff" }} aria-hidden="true" />
                  : <i className="ti ti-clock" style={{ fontSize:11, color:B.border }} aria-hidden="true" />
                }
              </div>
              <span style={{ fontSize:12, color:item.done?B.text:B.textSec }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <PrimaryBtn onClick={saving ? undefined : onFinish} disabled={saving} style={{ width:"100%", padding:"14px", fontSize:15 }}>
          {saving ? "Guardando…" : "Ir a mi portal →"}
        </PrimaryBtn>
        <div style={{ fontSize:11, color:B.textSec, marginTop:8 }}>
          Mientras tanto, podés explorar tu portal. Tu acceso completo se activa al confirmar la matrícula.
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function OnboardingWizard() {
  const navigate  = useNavigate();
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [name,    setName]    = useState("");
  const [program, setProgram] = useState(null);
  const [level,   setLevel]   = useState(null);

  const totalSteps = STEPS.length;
  const progress   = (step / (totalSteps - 1)) * 100;

  // Load real user name from Supabase
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/", { replace: true }); return; }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, onboarding_done")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data?.onboarding_done && data?.role !== "estudiante") {
        navigate("/portal", { replace: true });
        return;
      }
      if (data?.full_name) {
        setName(data.full_name.split(" ")[0]);
      }
    }
    load();
  }, [navigate]);

  function next() { if (step < totalSteps - 1) setStep(s => s + 1); }
  function prev() { if (step > 0) setStep(s => s - 1); }

  async function finish() {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Save onboarding data to profile
        await supabase.from("profiles").update({
          onboarding_done: true,
        }).eq("id", session.user.id);

        // Save program/level preference as a note (for coordinator to see)
        const programNames = { en:"Inglés Completo", va:"Asistente Virtual", en_va:"Inglés + VA" };
        await supabase.from("audit_log").insert({
          actor_id:  session.user.id,
          action:    "onboarding_completed",
          entity:    "profile",
          entity_id: session.user.id,
          metadata:  {
            program:      program,
            program_name: programNames[program],
            level_preference: level,
            completed_at: new Date().toISOString(),
          },
        }).catch(console.error);
      }
    } catch (e) {
      console.error("Error saving onboarding:", e);
    }
    navigate("/portal", { replace: true });
  }

  async function skip() {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("profiles").update({ onboarding_done: true }).eq("id", session.user.id);
      }
    } catch (e) { console.error(e); }
    navigate("/portal", { replace: true });
  }

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg, ${B.primary}12 0%, ${B.secondary}08 100%)`, padding:"24px 16px" }}>
      <div style={{ width:"100%", maxWidth:440, background:B.white, borderRadius:20, boxShadow:"0 20px 60px rgba(21,82,102,.12), 0 4px 16px rgba(0,0,0,.06)", overflow:"hidden" }}>

        {/* Progress bar */}
        <div style={{ height:4, background:B.bg }}>
          <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg, ${B.primary}, ${B.secondary})`, transition:"width .4s ease" }} />
        </div>

        {/* Step indicator */}
        <div style={{ padding:"12px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:11, color:B.textSec }}>{step + 1} / {totalSteps}</div>
          <StepDots current={step} total={totalSteps} onGoTo={setStep} />
          {step > 0 && step < totalSteps - 1 && (
            <button onClick={skip} style={{ fontSize:11, color:B.textSec, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
              Saltar →
            </button>
          )}
          {(step === 0 || step === totalSteps - 1) && <div style={{ width:40 }} />}
        </div>

        {/* Step content */}
        <div style={{ minHeight:480 }}>
          <FadeSlide key={step}>
            {step === 0 && <StepWelcome   name={name} onNext={next} />}
            {step === 1 && <StepProgram   selectedProgram={program} onSelect={setProgram} onNext={next} onPrev={prev} />}
            {step === 2 && <StepPlacement program={program} selectedLevel={level} onSelect={setLevel} onNext={next} onPrev={prev} />}
            {step === 3 && <StepHow       onNext={next} onPrev={prev} />}
            {step === 4 && <StepNextSteps program={program} level={level} onNext={next} onPrev={prev} />}
            {step === 5 && <StepReady     name={name} program={program} level={level} onFinish={finish} saving={saving} />}
          </FadeSlide>
        </div>
      </div>
    </div>
  );
}
