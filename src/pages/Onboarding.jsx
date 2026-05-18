import { useState, useEffect } from "react";

const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"#e8f3f6",
  secondary:"#ffbb23", secondaryDim:"#fff4d2", accent:"#fab82c",
  bg:"#f5f7fa", white:"#ffffff", text:"#1f2933", textSec:"#6b7280",
  border:"#d1dde3", green:"#059669", greenDim:"#d1fae5",
  red:"#dc2626", redDim:"#fee2e2",
};

// ─── STUDENT DATA ────────────────────────────────────────────────
const STUDENT = {
  name: "María",
  level: "B1",
  levelName: "Intermedio",
  program: "Inglés",
  group: "B1 · 6:00–7:00 PM",
  teacher: "Ana Torres",
  unit: 9,
  unitTitle: "Comforts",
  nextClass: "Lunes 16 Jun · 6:00 PM",
  teamsLink: "#",
  daysUntilClass: 3,
  cycleProgress: Math.round((9/12)*100),
};

// ─── STEP CONFIGS ────────────────────────────────────────────────
const STEPS = [
  { id:"welcome",   label:"Bienvenida"  },
  { id:"level",     label:"Tu nivel"    },
  { id:"how",       label:"Cómo funciona"},
  { id:"schedule",  label:"Tu clase"    },
  { id:"platform",  label:"Tu portal"   },
  { id:"ready",     label:"¡Listo!"     },
];

// ─── UTILS ───────────────────────────────────────────────────────
function useTypewriter(text, speed = 28, start = true) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!start) return;
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, start]);
  return displayed;
}

function useMount() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  return mounted;
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────
function PrimaryBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      padding:"13px 32px", background:B.primary, color:"#fff", border:"none",
      borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer",
      fontFamily:"inherit", transition:"background .15s", ...style,
    }}
    onMouseEnter={e=>e.target.style.background=B.dark}
    onMouseLeave={e=>e.target.style.background=B.primary}>
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

function FadeSlide({ children, key: k }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, [k]);
  return (
    <div style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(12px)", transition:"all .4s ease", height:"100%" }}>
      {children}
    </div>
  );
}

// ─── CONFETTI ────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({length:28}, (_,i) => ({
    x: 10 + (i * 3.5) % 88,
    delay: (i * 0.08).toFixed(2),
    color: [B.secondary, B.primary, B.accent, B.green, "#a78bfa", "#f87171"][i%6],
    size: 5 + (i%3)*3,
    drift: ((i%7)-3)*12,
  }));
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      <style>{`
        @keyframes fall { from{transform:translateY(-20px) rotate(0deg);opacity:1} to{transform:translateY(120%) rotate(var(--d));opacity:0} }
      `}</style>
      {pieces.map((p,i) => (
        <div key={i} style={{
          position:"absolute", left:`${p.x}%`, top:0,
          width:p.size, height:p.size, borderRadius:i%3===0?0:"50%",
          background:p.color,
          animation:`fall 1.8s ${p.delay}s ease-in forwards`,
          ["--d"]: `${p.drift}deg`,
        }}/>
      ))}
    </div>
  );
}

// ─── STEPS ───────────────────────────────────────────────────────

// STEP 0 — Welcome
function StepWelcome({ student, onNext }) {
  const greeting = useTypewriter(`¡Hola, ${student.name}!`, 45);
  const mounted = useMount();
  return (
    <div style={{ textAlign:"center", padding:"32px 24px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        {/* Logo */}
        <div style={{ fontSize:13, fontWeight:700, color:B.primary, letterSpacing:1, marginBottom:28, opacity:mounted?1:0, transition:"opacity .5s" }}>
          WCA <span style={{ color:B.secondary }}>HUB</span>
        </div>

        {/* Avatar */}
        <div style={{ position:"relative", width:96, height:96, margin:"0 auto 24px" }}>
          <div style={{ width:96, height:96, borderRadius:"50%", background:`linear-gradient(135deg, ${B.primary}, ${B.dark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:800, color:"#fff" }}>
            {student.name[0]}
          </div>
          <div style={{ position:"absolute", bottom:2, right:2, width:24, height:24, borderRadius:"50%", background:B.secondary, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${B.white}` }}>
            <i className="ti ti-check" style={{ fontSize:12, color:B.dark }} aria-hidden="true" />
          </div>
        </div>

        <h1 style={{ fontSize:32, fontWeight:800, color:B.text, marginBottom:8, minHeight:44, letterSpacing:-0.5 }}>{greeting}</h1>
        <p style={{ fontSize:15, color:B.textSec, lineHeight:1.7, maxWidth:360, margin:"0 auto" }}>
          Tu cuenta está activa y tu primera clase te espera. En los próximos minutos te mostramos todo lo que necesitas saber.
        </p>

        {/* Quick badges */}
        <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:24, flexWrap:"wrap" }}>
          {[
            { icon:"ti-language", text:`Nivel ${student.level}`, color:B.primary, bg:B.primaryDim },
            { icon:"ti-video",    text:student.group,             color:B.dark,    bg:B.bg },
            { icon:"ti-book",     text:student.program,           color:B.green,   bg:B.greenDim },
          ].map((b,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:b.bg, borderRadius:20, border:`1px solid ${b.color}30` }}>
              <i className={`ti ${b.icon}`} style={{ fontSize:13, color:b.color }} aria-hidden="true" />
              <span style={{ fontSize:11, fontWeight:600, color:b.color }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <PrimaryBtn onClick={onNext} style={{ width:"100%", padding:"14px" }}>
          Empezar tour &nbsp;→
        </PrimaryBtn>
        <div style={{ fontSize:11, color:B.textSec, marginTop:10 }}>~2 minutos · puedes saltar en cualquier momento</div>
      </div>
    </div>
  );
}

// STEP 1 — Level
function StepLevel({ student, onNext, onPrev }) {
  const levels = ["A1","A2","B1","B2","C1"];
  const idx = levels.indexOf(student.level);
  const descs = {
    A1:"Empiezas desde cero y construyes una base sólida en inglés cotidiano.",
    A2:"Puedes comunicarte en situaciones básicas y amplías tu vocabulario.",
    B1:"Te desenvuelves en conversaciones comunes y trabajas tu fluidez.",
    B2:"Manejas inglés con soltura y te enfocas en comunicación profesional.",
    C1:"Perfeccionas el uso en contextos académicos e internacionales.",
  };
  return (
    <div style={{ padding:"28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Tu nivel</div>
        <h2 style={{ fontSize:26, fontWeight:800, color:B.text, marginBottom:4, letterSpacing:-0.5 }}>
          {student.level} — {student.levelName}
        </h2>
        <p style={{ fontSize:13, color:B.textSec, lineHeight:1.7, marginBottom:24 }}>
          {descs[student.level]}
        </p>

        {/* Level path */}
        <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:24, overflow:"hidden", borderRadius:10, border:`1px solid ${B.border}` }}>
          {levels.map((l,i) => (
            <div key={l} style={{ flex:1, padding:"10px 6px", textAlign:"center", background:i<idx?B.greenDim:i===idx?B.primary:B.bg, borderRight:i<4?`1px solid ${B.border}`:"none", transition:"all .3s .1s" }}>
              <div style={{ fontSize:13, fontWeight:800, color:i<idx?B.green:i===idx?"#fff":"#ccc" }}>{l}</div>
              <div style={{ fontSize:9, marginTop:3, color:i<idx?"#065f46":i===idx?"rgba(255,255,255,.6)":"#bbb" }}>
                {i<idx?"✓":i===idx?"← aquí":""}
              </div>
            </div>
          ))}
        </div>

        {/* What you'll learn */}
        <div style={{ background:B.primaryDim, borderRadius:12, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:B.primary, marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>En este nivel aprenderás</div>
          {([
            { A1:["Saludos e introducciones","Vocabulario cotidiano","Verbos básicos en presente"],
              A2:["Conversación en situaciones reales","Gramática de uso diario","Descripción de personas y lugares"],
              B1:["Expresión escrita formal e informal","Gramática avanzada intermedia","Comprensión de textos auténticos"],
              B2:["Comunicación profesional","Condicionales y voz pasiva","Vocabulario académico"],
              C1:["Matices y expresiones idiomáticas","Gramática avanzada","Discurso académico y formal"],
            }[student.level]].flat()).map((item,i) => (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", fontSize:12, color:B.primary, marginBottom:6 }}>
              <i className="ti ti-check" style={{ fontSize:13, color:B.green, flexShrink:0 }} aria-hidden="true" />
              {item}
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

// STEP 2 — How it works
function StepHow({ onNext, onPrev }) {
  const [activeStep, setActiveStep] = useState(0);
  const HOW = [
    { icon:"ti-video", color:"#fff", bg:B.primary, title:"Clase en vivo", desc:"Lunes, miércoles y viernes tu docente imparte la clase en Microsoft Teams. Todos los grupos del mismo nivel ven la misma unidad esa semana.", tag:"3x por semana" },
    { icon:"ti-device-laptop", color:"#fff", bg:B.dark, title:"Práctica 24/7", desc:"Después de clase accedes a videos, ejercicios, flashcards y actividades en la plataforma. A cualquier hora, desde cualquier dispositivo.", tag:"Sin restricción" },
    { icon:"ti-writing", color:"#fff", bg:B.secondary === "#ffbb23" ? "#92400e" : B.dark, title:"Examen de unidad", desc:"Tienes hasta 3 intentos para aprobar con 70% o más. El examen tiene temporizador y preguntas en orden aleatorio.", tag:"≥70% para aprobar" },
    { icon:"ti-lock-open", color:"#fff", bg:B.green, title:"Desbloqueo automático", desc:"Al aprobar, la siguiente unidad se desbloquea automáticamente. Sin esperar a nadie. El sistema lo hace en segundos.", tag:"Instantáneo" },
  ];
  return (
    <div style={{ padding:"28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Cómo funciona</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:B.text, marginBottom:20, letterSpacing:-0.5 }}>El ciclo semanal de WCA</h2>

        {/* Steps */}
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {HOW.map((h, i) => (
            <div key={i} onClick={() => setActiveStep(i)} style={{ display:"flex", gap:14, padding:"12px 0", cursor:"pointer", position:"relative" }}>
              {i < HOW.length-1 && <div style={{ position:"absolute", left:18, top:44, bottom:0, width:2, background:i===activeStep?B.primary:B.border, transition:"background .3s" }}/>}
              <div style={{ width:36, height:36, borderRadius:"50%", background:i===activeStep?h.bg:B.bg, border:`2px solid ${i===activeStep?h.bg:B.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all .25s", zIndex:1 }}>
                <i className={`ti ${h.icon}`} style={{ fontSize:16, color:i===activeStep?h.color:B.textSec, transition:"color .25s" }} aria-hidden="true" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:i===activeStep?B.text:B.textSec }}>{h.title}</div>
                  {i===activeStep && <span style={{ fontSize:9, padding:"2px 8px", borderRadius:20, background:B.secondaryDim, color:"#92400e", fontWeight:600 }}>{h.tag}</span>}
                </div>
                {i===activeStep && (
                  <div style={{ fontSize:12, color:B.textSec, lineHeight:1.7, animation:"fadeIn .2s ease" }}>
                    {h.desc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} style={{ flex:1 }}>Continuar →</PrimaryBtn>
      </div>
    </div>
  );
}

// STEP 3 — Schedule & Class
function StepSchedule({ student, onNext, onPrev }) {
  const [calExpanded, setCalExpanded] = useState(false);
  const days = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const classDays = [1, 3, 5]; // Mon, Wed, Fri (0-indexed)
  return (
    <div style={{ padding:"28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Tu clase en vivo</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:B.text, marginBottom:20, letterSpacing:-0.5 }}>¿Cuándo nos vemos?</h2>

        {/* Next class card */}
        <div style={{ background:B.primary, borderRadius:16, padding:"20px", marginBottom:16, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,.06)" }}/>
          <div style={{ fontSize:10, color:"rgba(255,255,255,.55)", letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Próxima clase</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:4 }}>{student.nextClass}</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.65)", marginBottom:16 }}>
            Docente: {student.teacher} · Unidad {student.unit}: {student.unitTitle}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <a href={student.teamsLink} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"rgba(255,255,255,.15)", borderRadius:8, textDecoration:"none", color:"#fff", fontSize:12, fontWeight:600, border:"1px solid rgba(255,255,255,.2)" }}>
              <i className="ti ti-video" style={{ fontSize:14 }} aria-hidden="true" />
              Unirme en Teams
            </a>
            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px", background:B.secondary, borderRadius:8, fontSize:11, fontWeight:700, color:B.dark }}>
              <i className="ti ti-clock" style={{ fontSize:13 }} aria-hidden="true" />
              En {student.daysUntilClass} días
            </div>
          </div>
        </div>

        {/* Mini calendar */}
        <button onClick={() => setCalExpanded(!calExpanded)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:B.bg, border:`1px solid ${B.border}`, borderRadius:10, cursor:"pointer", fontFamily:"inherit", marginBottom:6 }}>
          <span style={{ fontSize:12, fontWeight:600, color:B.text }}>Ver horario semanal</span>
          <i className={`ti ti-chevron-${calExpanded?"up":"down"}`} style={{ fontSize:14, color:B.textSec }} aria-hidden="true" />
        </button>
        {calExpanded && (
          <div style={{ background:B.bg, borderRadius:10, padding:12, border:`1px solid ${B.border}`, animation:"fadeIn .2s" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {days.map((d,i) => (
                <div key={d} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, color:B.textSec, marginBottom:4 }}>{d}</div>
                  <div style={{ width:32, height:32, borderRadius:8, background:classDays.includes(i)?B.primary:B.white, border:`1px solid ${classDays.includes(i)?B.primary:B.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto", flexDirection:"column" }}>
                    {classDays.includes(i) && <i className="ti ti-video" style={{ fontSize:12, color:"#fff" }} aria-hidden="true" />}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:10, color:B.textSec, marginTop:8, textAlign:"center" }}>
              Clases: lunes, miércoles y viernes · Práctica 24/7 los demás días
            </div>
          </div>
        )}

        {/* Tip */}
        <div style={{ display:"flex", gap:8, padding:"10px 12px", background:B.secondaryDim, borderRadius:10, marginTop:10, border:`1px solid ${B.accent}30` }}>
          <i className="ti ti-bulb" style={{ fontSize:14, color:"#92400e", flexShrink:0, marginTop:1 }} aria-hidden="true" />
          <div style={{ fontSize:11, color:"#92400e", lineHeight:1.6 }}>
            Si faltas a clase, la grabación queda disponible <strong>7 días</strong> en tu portal. Nunca perderás el contenido.
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} style={{ flex:1 }}>Continuar →</PrimaryBtn>
      </div>
    </div>
  );
}

// STEP 4 — Platform tour
function StepPlatform({ student, onNext, onPrev }) {
  const [active, setActive] = useState(0);
  const SECTIONS = [
    { icon:"ti-layout-dashboard", label:"Inicio", desc:"Tu resumen diario: unidad activa, próxima clase, progreso del ciclo y métricas de la semana.", color:B.primary },
    { icon:"ti-book",             label:"Mi programa", desc:"Las 12 unidades del ciclo con tu progreso, notas y estado de cada una. Completas las verdes, la azul es tu unidad activa.", color:B.dark },
    { icon:"ti-device-laptop",   label:"Práctica 24/7", desc:"Videos de clase, ejercicios, flashcards y actividades de la unidad activa. Disponible a cualquier hora.", color:B.green },
    { icon:"ti-writing",         label:"Examen", desc:"Tu examen de la unidad activa con el temporizador y tus intentos disponibles. Aprueba con 70% para desbloquear la siguiente.", color:"#155266" },
    { icon:"ti-certificate",     label:"Mi progreso", desc:"Tu ruta de niveles A1→C1, badges ganados, XP acumulado y certificados descargables.", color:B.secondary === "#ffbb23" ? "#92400e" : B.dark },
  ];
  return (
    <div style={{ padding:"28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Tu portal</div>
        <h2 style={{ fontSize:24, fontWeight:800, color:B.text, marginBottom:20, letterSpacing:-0.5 }}>Todo lo que necesitas, en un lugar</h2>

        {/* Mini portal mockup */}
        <div style={{ background:B.white, borderRadius:12, border:`1px solid ${B.border}`, overflow:"hidden", marginBottom:14 }}>
          {/* Fake topbar */}
          <div style={{ background:B.primary, padding:"8px 12px", display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#fff" }}>WCA Hub</div>
            <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <i className="ti ti-bell" style={{ fontSize:10, color:"#fff" }} aria-hidden="true" />
              </div>
              <div style={{ width:20, height:20, borderRadius:"50%", background:B.secondary, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:700, color:B.dark }}>MR</div>
            </div>
          </div>
          {/* Fake nav */}
          <div style={{ display:"flex", borderBottom:`1px solid ${B.border}` }}>
            {SECTIONS.map((s,i) => (
              <button key={i} onClick={() => setActive(i)} style={{
                flex:1, padding:"8px 4px", border:"none",
                background: active===i ? B.primaryDim : "transparent",
                borderBottom: `2px solid ${active===i ? B.primary : "transparent"}`,
                cursor:"pointer", transition:"all .15s",
              }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:14, color:active===i?B.primary:B.textSec, display:"block", margin:"0 auto" }} aria-hidden="true" />
                <div style={{ fontSize:8, color:active===i?B.primary:B.textSec, marginTop:2, fontWeight:active===i?600:400 }}>{s.label}</div>
              </button>
            ))}
          </div>
          {/* Content preview */}
          <div style={{ padding:"12px", minHeight:70, background:B.bg }}>
            <div style={{ fontSize:11, fontWeight:600, color:SECTIONS[active].color, marginBottom:3 }}>{SECTIONS[active].label}</div>
            <div style={{ fontSize:10, color:B.textSec, lineHeight:1.6 }}>{SECTIONS[active].desc}</div>
          </div>
        </div>

        {/* Cycle bar */}
        <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:10, padding:"12px 14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:600, color:B.text }}>Tu ciclo actual — {student.level}</div>
            <div style={{ fontSize:11, color:B.primary, fontWeight:600 }}>U{student.unit}/12</div>
          </div>
          <div style={{ display:"flex", gap:3 }}>
            {Array.from({length:12},(_,i)=>(
              <div key={i} style={{ flex:1, height:6, borderRadius:3, background: i+1<student.unit?B.green:i+1===student.unit?B.secondary:B.bg, transition:"background .3s" }}/>
            ))}
          </div>
          <div style={{ fontSize:9, color:B.textSec, marginTop:5 }}>Unidad activa: U{student.unit} — {student.unitTitle}</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <GhostBtn onClick={onPrev}>← Atrás</GhostBtn>
        <PrimaryBtn onClick={onNext} style={{ flex:1 }}>¡Casi listo! →</PrimaryBtn>
      </div>
    </div>
  );
}

// STEP 5 — Ready!
function StepReady({ student, onFinish }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{ padding:"28px 24px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", textAlign:"center", position:"relative", overflow:"hidden" }}>
      {show && <Confetti />}
      <div>
        <div style={{ fontSize:56, marginBottom:12, animation:"pop .5s ease" }}>🎉</div>
        <h2 style={{ fontSize:28, fontWeight:800, color:B.text, marginBottom:8, letterSpacing:-0.5 }}>
          ¡Todo listo, {student.name}!
        </h2>
        <p style={{ fontSize:13, color:B.textSec, lineHeight:1.7, marginBottom:28 }}>
          Tu cuenta está activa y ya sabes cómo funciona WCA.<br />
          Tu primera clase es el <strong style={{ color:B.primary }}>{student.nextClass}</strong>.
        </p>

        <style>{`@keyframes pop{0%{transform:scale(0)}70%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>

        {/* Checklist */}
        <div style={{ background:B.bg, borderRadius:12, padding:16, textAlign:"left", marginBottom:4 }}>
          {[
            { text:`Nivel detectado: ${student.level} — ${student.levelName}`, done:true },
            { text:`Ciclo activo: U${student.unit} — ${student.unitTitle}`, done:true },
            { text:`Horario: ${student.group}`, done:true },
            { text:"Acceso a plataforma 24/7 activado", done:true },
            { text:"Cuenta Microsoft 365 asignada", done:true },
          ].map((item,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 0", borderBottom:i<4?`1px solid ${B.border}`:"none" }}>
              <div style={{ width:20, height:20, borderRadius:"50%", background:item.done?B.green:"transparent", border:`1.5px solid ${item.done?B.green:B.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {item.done && <i className="ti ti-check" style={{ fontSize:10, color:"#fff" }} aria-hidden="true" />}
              </div>
              <span style={{ fontSize:12, color:B.text }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <PrimaryBtn onClick={onFinish} style={{ width:"100%", padding:"14px", fontSize:15 }}>
          Ir a mi portal →
        </PrimaryBtn>
        <div style={{ fontSize:10, color:B.textSec, marginTop:8 }}>
          Puedes volver a este tour desde Configuración → Guía de inicio
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const totalSteps = STEPS.length;
  const progress = ((step) / (totalSteps - 1)) * 100;

  function next() { if (step < totalSteps - 1) setStep(s => s + 1); }
  function prev() { if (step > 0) setStep(s => s - 1); }

  if (done) return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:B.bg, padding:24 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:18, fontWeight:700, color:B.text, marginBottom:8 }}>¡Bienvenida al portal, María!</div>
        <div style={{ fontSize:12, color:B.textSec, marginBottom:16 }}>El wizard de onboarding se ha completado. El estudiante ahora ve su portal normal.</div>
        <button onClick={() => { setStep(0); setDone(false); }} style={{ padding:"9px 20px", background:B.primary, color:"#fff", border:"none", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
          Ver onboarding de nuevo
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg, ${B.primary}12 0%, ${B.secondary}08 100%)`, padding:"24px 16px" }}>

      {/* Card */}
      <div style={{ width:"100%", maxWidth:440, background:B.white, borderRadius:20, boxShadow:"0 20px 60px rgba(21,82,102,.12), 0 4px 16px rgba(0,0,0,.06)", overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Progress bar */}
        <div style={{ height:4, background:B.bg, flexShrink:0 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg, ${B.primary}, ${B.secondary})`, transition:"width .4s ease" }} />
        </div>

        {/* Step indicator */}
        <div style={{ padding:"14px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ fontSize:10, color:B.textSec }}>{step + 1} / {totalSteps}</div>
          <StepDots current={step} total={totalSteps} onGoTo={setStep} />
          {step > 0 && (
            <button onClick={() => setDone(true)} style={{ fontSize:10, color:B.textSec, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
              Saltar
            </button>
          )}
          {step === 0 && <div style={{ width:36 }} />}
        </div>

        {/* Step content — fixed height */}
        <div style={{ minHeight:480 }}>
          <FadeSlide key={step}>
            {step === 0 && <StepWelcome   student={STUDENT} onNext={next} />}
            {step === 1 && <StepLevel     student={STUDENT} onNext={next} onPrev={prev} />}
            {step === 2 && <StepHow       onNext={next} onPrev={prev} />}
            {step === 3 && <StepSchedule  student={STUDENT} onNext={next} onPrev={prev} />}
            {step === 4 && <StepPlatform  student={STUDENT} onNext={next} onPrev={prev} />}
            {step === 5 && <StepReady     student={STUDENT} onFinish={() => setDone(true)} />}
          </FadeSlide>
        </div>
      </div>
    </div>
  );
}
