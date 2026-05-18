import { useState } from "react";

const B = {
  primary:"#155266", primaryHov:"#0f3d4d", primaryDim:"#e8f3f6",
  secondary:"#ffbb23", secondaryDim:"#fff4d2", accent:"#fab82c",
  dark:"#0f3d4d", bg:"#f5f7fa", white:"#ffffff",
  text:"#1f2933", textSec:"#6b7280", border:"#d1dde3",
  green:"#059669", greenDim:"#d1fae5", red:"#dc2626",
};

// ─── PLACEMENT TEST ──────────────────────────────────────────────
const QUESTIONS = [
  { q:"What is the meaning of 'happy'?", opts:["Sad","Tired","Glad","Angry"], ans:2, lvl:1 },
  { q:"Choose the correct sentence:", opts:["She have a car.","She has a car.","She haves a car.","She is have a car."], ans:1, lvl:1 },
  { q:"Fill in: 'I ___ to school every day.'", opts:["go","goes","going","gone"], ans:0, lvl:1 },
  { q:"Someone says 'I'm starving.' They mean:", opts:["They are cold.","They are tired.","They are very hungry.","They are happy."], ans:2, lvl:2 },
  { q:"Which sentence is in the past tense?", opts:["She walks to work.","She will walk.","She walked to work.","She is walking."], ans:2, lvl:2 },
  { q:"Choose the word that means 'to get bigger':", opts:["shrink","expand","reduce","divide"], ans:1, lvl:2 },
  { q:"Complete: 'If it rains tomorrow, we ___ stay inside.'", opts:["will","would","should have","are"], ans:0, lvl:3 },
  { q:"'The meeting was postponed.' What does 'postponed' mean?", opts:["cancelled","moved to a later time","started early","made longer"], ans:1, lvl:3 },
  { q:"Which uses Present Perfect correctly?", opts:["I have saw that movie.","I have seen that movie.","I seen that movie.","I did see that."], ans:1, lvl:3 },
  { q:"Choose the correct conditional:", opts:["She would come if she had known.","She would have come if she had known.","She will have come.","She should come."], ans:1, lvl:4 },
  { q:"Identify the passive voice sentence:", opts:["The chef prepared the meal.","The meal was prepared by the chef.","Someone prepared the meal.","The chef had prepared it."], ans:1, lvl:4 },
  { q:"'The speech was ambiguous.' 'Ambiguous' means:", opts:["very clear","open to multiple interpretations","inspiring","controversial"], ans:1, lvl:4 },
  { q:"'Cognitive dissonance occurs when...' What is it?", opts:["Mental clarity","Holding two conflicting ideas","Learning new beliefs","Selective memory"], ans:1, lvl:5 },
  { q:"Choose the most natural phrasing:", opts:["It's high time we addressed this.","It's high time we will address this.","It's high time we have addressed.","It's high time we are addressing."], ans:0, lvl:5 },
  { q:"In a formal email, which closing is correct?", opts:["See ya!","Cheers mate","Yours sincerely","Later"], ans:2, lvl:5 },
];

const LEVELS = [
  { code:"A1", name:"Principiante",    range:[0,3],  desc:"Construyes bases sólidas desde cero.",           color:B.primary },
  { code:"A2", name:"Básico",          range:[4,6],  desc:"Amplías vocabulario y gramática fundamental.",   color:"#0f5a78" },
  { code:"B1", name:"Intermedio",      range:[7,9],  desc:"Trabajas fluidez y precisión gramatical.",       color:B.dark },
  { code:"B2", name:"Interm. alto",    range:[10,12],desc:"Comunicación profesional y matices avanzados.", color:"#1a4d3a" },
  { code:"C1", name:"Avanzado",        range:[13,15],desc:"Perfeccionas uso académico y profesional.",      color:"#2d1b69" },
];

const PROGRAMS = [
  { id:"en",   name:"Inglés completo",  price:95,  interval:"mes",    desc:"A1 → C1 con certificación CEFR. Clases en vivo + plataforma 24/7.", tag:null,    color:B.primary },
  { id:"va",   name:"Asistente Virtual",price:75,  interval:"mes",    desc:"4 módulos de formación como VA bilingüe. Certificado WCA.",         tag:null,    color:B.dark },
  { id:"combo",name:"Inglés + VA",      price:170, interval:"mes",    desc:"Los dos programas combinados. Progreso independiente por programa.", tag:"Popular",color:B.secondary },
  { id:"beca", name:"Beca Inglés",      price:50,  interval:"trimestre",desc:"A1 → B1 con beca. Solo clases en vivo. Cupos limitados.",          tag:"Beca",  color:B.green },
];

const SCHEDULES = [
  { time:"6:00 – 7:00 PM", days:"Lun · Mié · Vie", cupos:4,  teacher:"José R."  },
  { time:"7:00 – 8:00 PM", days:"Lun · Mié · Vie", cupos:7,  teacher:"José R."  },
  { time:"8:00 – 9:00 PM", days:"Lun · Mié · Vie", cupos:12, teacher:"Ana T."   },
  { time:"9:00 – 10:00 PM",days:"Lun · Mié · Vie", cupos:0,  teacher:"Ana T."   },
];

const TESTIMONIALS = [
  { name:"María López",    country:"🇭🇳", level:"B1", text:"Llevo 6 meses en WCA y ya me desenvuelvo en entrevistas de trabajo en inglés. La metodología de clases en vivo + práctica diaria es lo que hace la diferencia.", avatar:"ML" },
  { name:"Carlos Reyes",   country:"🇨🇴", level:"A2", text:"Entré sin saber nada y en 3 meses ya puedo mantener conversaciones básicas. El hecho de poder ingresar al ciclo cualquier semana me facilitó mucho comenzar.", avatar:"CR" },
  { name:"Ana Sofía Vega", country:"🇦🇷", level:"C1", text:"Completé los 5 niveles en WCA y conseguí el trabajo que quería. El certificado con QR verificable fue clave en mi entrevista con una empresa internacional.", avatar:"AV" },
];

const FAQS = [
  { q:"¿Puedo empezar en cualquier momento?", a:"Sí. WCA usa matrícula continua — el ciclo corre todos los lunes independientemente. Al inscribirte, el sistema te ubica automáticamente en la unidad activa de tu nivel." },
  { q:"¿Necesito un horario fijo?", a:"Las clases en vivo son 3 veces por semana en el horario que eliges. El contenido de práctica está disponible 24/7, por lo que puedes estudiar cuando quieras." },
  { q:"¿Qué pasa si falto a una clase?", a:"Todas las clases se graban y quedan disponibles 7 días en tu portal. Nunca pierdes el contenido." },
  { q:"¿Los certificados son reconocidos?", a:"Sí. Los certificados de WCA están basados en el Marco Común Europeo de Referencia (CEFR) y tienen un código QR verificable que cualquier empleador puede consultar." },
  { q:"¿Puedo pausar la suscripción?", a:"Si necesitas cancelar, tu progreso se conserva indefinidamente. Al reactivar, retomas exactamente desde donde estabas." },
  { q:"¿Cómo sé qué nivel me corresponde?", a:"Al inscribirte haces un Placement Test de 15 preguntas (~20 minutos). El sistema detecta tu nivel automáticamente y te ubica en el ciclo correcto." },
];

// ─── COMPONENTS ──────────────────────────────────────────────────
function Btn({ children, variant="primary", onClick, style={} }) {
  const base = { padding:"11px 24px", borderRadius:10, fontSize:13, fontWeight:700, cursor:"pointer", border:"none", fontFamily:"inherit", transition:"all .15s", ...style };
  const styles = {
    primary: { background:B.primary, color:"#fff", ...base },
    secondary: { background:B.secondary, color:B.dark, ...base },
    outline: { background:"transparent", color:B.primary, border:`2px solid ${B.primary}`, ...base },
    ghost: { background:"rgba(255,255,255,.1)", color:"#fff", border:"1px solid rgba(255,255,255,.2)", ...base },
  };
  return <button onClick={onClick} style={styles[variant]}>{children}</button>;
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [section, setSection]   = useState("landing"); // landing | test | enroll | confirm
  const [testStep, setTestStep] = useState(0);
  const [answers, setAnswers]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [detectedLevel, setDetectedLevel] = useState(null);
  const [why, setWhy]           = useState("");
  const [selProgram, setSelProgram] = useState(null);
  const [selSchedule, setSelSchedule] = useState(0);
  const [enrollStep, setEnrollStep] = useState(0); // 0=program 1=schedule 2=data 3=payment
  const [payMethod, setPayMethod] = useState("card");
  const [faqOpen, setFaqOpen]   = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Test logic
  function submitAnswer(i) {
    if (selected !== null) return;
    setSelected(i);
    setTimeout(() => {
      const newAnswers = [...answers, { q:testStep, correct:i===QUESTIONS[testStep].ans }];
      setAnswers(newAnswers);
      if (testStep < QUESTIONS.length - 1) {
        setTestStep(testStep + 1);
        setSelected(null);
      } else {
        const score = newAnswers.filter(a=>a.correct).length;
        const lvl = LEVELS.find(l => score >= l.range[0] && score <= l.range[1]) || LEVELS[0];
        setDetectedLevel(lvl);
        setTestStep(testStep + 1);
      }
    }, 700);
  }

  const progress = ((testStep) / QUESTIONS.length) * 100;

  if (section === "test") return <PlacementTest testStep={testStep} selected={selected} submitAnswer={submitAnswer} QUESTIONS={QUESTIONS} progress={progress} detectedLevel={detectedLevel} why={why} setWhy={setWhy} onEnroll={() => { setSelProgram("en"); setSection("enroll"); }} onBack={() => setSection("landing")} />;

  if (section === "enroll") return <EnrollFlow step={enrollStep} setStep={setEnrollStep} detectedLevel={detectedLevel} selProgram={selProgram} setSelProgram={setSelProgram} selSchedule={selSchedule} setSelSchedule={setSelSchedule} payMethod={payMethod} setPayMethod={setPayMethod} PROGRAMS={PROGRAMS} SCHEDULES={SCHEDULES} onDone={() => setSection("confirm")} onBack={() => setSection("landing")} />;

  if (section === "confirm") return <ConfirmScreen detectedLevel={detectedLevel} selProgram={PROGRAMS.find(p=>p.id===selProgram)} schedule={SCHEDULES[selSchedule]} onPortal={() => setSection("landing")} />;

  // ── LANDING ──
  return (
    <div style={{ background:B.bg, minHeight:"100%", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* NAV */}
      <nav style={{ background:B.white, borderBottom:`1px solid ${B.border}`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1080, margin:"0 auto", padding:"0 24px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:20, fontWeight:800, color:B.primary, letterSpacing:-0.5 }}>
            WCA <span style={{ color:B.secondary }}>Hub</span>
          </div>
          <div style={{ display:"flex", gap:28, alignItems:"center" }}>
            {["Programas","Metodología","Precios","Testimonios"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize:13, color:B.textSec, textDecoration:"none", fontWeight:500 }}>{item}</a>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="outline" style={{ padding:"8px 18px", fontSize:12 }}>Iniciar sesión</Btn>
            <Btn variant="primary" onClick={() => setSection("test")} style={{ padding:"8px 18px", fontSize:12 }}>Comenzar gratis</Btn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background:`linear-gradient(135deg, ${B.primary} 0%, ${B.dark} 60%, #0a2e3d 100%)`, padding:"72px 24px 80px" }}>
        <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,187,35,.15)", border:"1px solid rgba(255,187,35,.3)", borderRadius:20, padding:"5px 14px", marginBottom:20 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:B.secondary, display:"inline-block" }} />
            <span style={{ fontSize:11, color:B.secondary, fontWeight:600, letterSpacing:.5 }}>100% REMOTO · ESTUDIANTES EN 20+ PAÍSES</span>
          </div>
          <h1 style={{ fontSize:46, fontWeight:800, color:"#fff", lineHeight:1.15, marginBottom:18, letterSpacing:-1 }}>
            Aprende inglés con<br />
            <span style={{ color:B.secondary }}>metodología continua</span>
          </h1>
          <p style={{ fontSize:17, color:"rgba(255,255,255,.65)", maxWidth:580, margin:"0 auto 36px", lineHeight:1.7 }}>
            Entra en cualquier semana, avanza a tu ritmo y obtén certificados CEFR verificables. Clases en vivo + práctica 24/7.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <Btn variant="secondary" onClick={() => setSection("test")} style={{ fontSize:14, padding:"13px 30px" }}>
              Hacer Placement Test gratuito →
            </Btn>
            <Btn variant="ghost" style={{ fontSize:14, padding:"13px 30px" }}>
              Ver clase de prueba
            </Btn>
          </div>
          {/* Stats */}
          <div style={{ display:"flex", gap:0, justifyContent:"center", marginTop:52, borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:36 }}>
            {[["134+","Estudiantes activos"],["20+","Países"],["5","Niveles CEFR"],["98%","Satisfacción"]].map(([n,l],i) => (
              <div key={i} style={{ flex:1, textAlign:"center", borderRight: i<3?"1px solid rgba(255,255,255,.1)":undefined }}>
                <div style={{ fontSize:28, fontWeight:800, color:B.secondary }}>{n}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"64px 24px", background:B.white }}>
        <div style={{ maxWidth:860, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Metodología</div>
            <h2 style={{ fontSize:30, fontWeight:800, color:B.text, letterSpacing:-0.5 }}>Así funciona WCA</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
            {[
              { n:"1", icon:"ti-clipboard-list", title:"Haz el Placement Test", desc:"15 preguntas en 20 minutos. El sistema detecta tu nivel A1–C1 automáticamente y te ubica en el ciclo activo.", color:B.primary },
              { n:"2", icon:"ti-user-plus", title:"Elige tu horario", desc:"Selecciona el programa y el horario de clase que te conviene. Pagas y accedes de inmediato.", color:B.dark },
              { n:"3", icon:"ti-rocket", title:"Aprende y certifícate", desc:"Clases en vivo 3x por semana + plataforma 24/7. Aprueba los exámenes y obtén tu certificado CEFR.", color:B.secondary },
            ].map((s,i) => (
              <div key={i} style={{ textAlign:"center", padding:"28px 20px", background:B.bg, borderRadius:16, border:`1px solid ${B.border}` }}>
                <div style={{ width:56, height:56, borderRadius:"50%", background:s.color, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize:24, color:"#fff" }} aria-hidden="true" />
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:s.color, marginBottom:6 }}>{s.n}.</div>
                <div style={{ fontSize:14, fontWeight:700, color:B.text, marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:12, color:B.textSec, lineHeight:1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section id="programas" style={{ padding:"64px 24px", background:B.bg }}>
        <div style={{ maxWidth:920, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Programas</div>
            <h2 style={{ fontSize:30, fontWeight:800, color:B.text, letterSpacing:-0.5 }}>Elige tu programa</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
            {PROGRAMS.map(p => (
              <div key={p.id} style={{ background:B.white, borderRadius:16, padding:24, border:`2px solid ${p.id==="combo"?B.secondary:B.border}`, position:"relative", overflow:"hidden" }}>
                {p.tag && <div style={{ position:"absolute", top:16, right:16, fontSize:10, background:p.id==="combo"?B.secondary:B.greenDim, color:p.id==="combo"?B.dark:"#065f46", padding:"3px 10px", borderRadius:20, fontWeight:700 }}>{p.tag}</div>}
                <div style={{ fontSize:16, fontWeight:800, color:p.color, marginBottom:6 }}>{p.name}</div>
                <div style={{ fontSize:12, color:B.textSec, lineHeight:1.6, marginBottom:16 }}>{p.desc}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:20 }}>
                  <span style={{ fontSize:28, fontWeight:800, color:B.text }}>${p.price}</span>
                  <span style={{ fontSize:12, color:B.textSec }}>/{p.interval}</span>
                </div>
                <Btn variant={p.id==="combo"?"secondary":"primary"} onClick={() => { setSelProgram(p.id); setSection("test"); }} style={{ width:"100%", padding:"10px" }}>
                  Comenzar
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonios" style={{ padding:"64px 24px", background:B.white }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <div style={{ fontSize:11, fontWeight:700, color:B.secondary, letterSpacing:2, textTransform:"uppercase", marginBottom:8 }}>Testimonios</div>
            <h2 style={{ fontSize:30, fontWeight:800, color:B.text, letterSpacing:-0.5 }}>Lo que dicen nuestros estudiantes</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {TESTIMONIALS.map((t,i) => (
              <div key={i} style={{ background:B.bg, borderRadius:16, padding:22, border:`1px solid ${B.border}` }}>
                <div style={{ fontSize:22, color:B.secondary, marginBottom:12, lineHeight:1 }}>"</div>
                <div style={{ fontSize:12, color:B.text, lineHeight:1.8, marginBottom:18 }}>{t.text}</div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:B.primaryDim, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:B.primary }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:B.text }}>{t.name} {t.country}</div>
                    <div style={{ fontSize:10, color:B.textSec }}>Nivel {t.level}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:"64px 24px", background:B.bg }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <h2 style={{ fontSize:30, fontWeight:800, color:B.text, letterSpacing:-0.5 }}>Preguntas frecuentes</h2>
          </div>
          {FAQS.map((f,i) => (
            <div key={i} style={{ background:B.white, borderRadius:12, border:`1px solid ${B.border}`, marginBottom:8, overflow:"hidden" }}>
              <button onClick={() => setFaqOpen(faqOpen===i?null:i)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                <span style={{ fontSize:13, fontWeight:600, color:B.text }}>{f.q}</span>
                <i className={`ti ti-chevron-${faqOpen===i?"up":"down"}`} style={{ fontSize:16, color:B.textSec, flexShrink:0, marginLeft:12 }} aria-hidden="true" />
              </button>
              {faqOpen===i && <div style={{ padding:"0 18px 16px", fontSize:12, color:B.textSec, lineHeight:1.8 }}>{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background:`linear-gradient(135deg, ${B.primary}, ${B.dark})`, padding:"64px 24px", textAlign:"center" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <h2 style={{ fontSize:32, fontWeight:800, color:"#fff", marginBottom:12, letterSpacing:-0.5 }}>¿Listo para empezar?</h2>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.65)", marginBottom:30, lineHeight:1.7 }}>
            Haz el Placement Test gratis y descubre tu nivel en 20 minutos. Sin compromiso.
          </p>
          <Btn variant="secondary" onClick={() => setSection("test")} style={{ fontSize:14, padding:"14px 36px" }}>
            Comenzar Placement Test →
          </Btn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:B.dark, padding:"40px 24px" }}>
        <div style={{ maxWidth:1080, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff" }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:4 }}>World Connect Academy · wcahub.com</div>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>© 2025 WCA Academy · Todos los derechos reservados</div>
        </div>
      </footer>
    </div>
  );
}

// ─── PLACEMENT TEST ───────────────────────────────────────────────
function PlacementTest({ testStep, selected, submitAnswer, QUESTIONS, progress, detectedLevel, why, setWhy, onEnroll, onBack }) {
  const done = testStep >= QUESTIONS.length;

  if (done && detectedLevel) return (
    <div style={{ minHeight:"100%", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:B.white, borderRadius:20, padding:36, maxWidth:500, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,.08)" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:B.primaryDim, margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <i className="ti ti-certificate" style={{ fontSize:36, color:B.primary }} aria-hidden="true" />
        </div>
        <div style={{ fontSize:11, color:B.secondary, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Tu nivel detectado</div>
        <div style={{ fontSize:52, fontWeight:800, color:B.primary, lineHeight:1 }}>{detectedLevel.code}</div>
        <div style={{ fontSize:18, fontWeight:600, color:B.text, marginTop:4, marginBottom:12 }}>{detectedLevel.name}</div>
        <div style={{ fontSize:13, color:B.textSec, lineHeight:1.7, marginBottom:24, padding:"12px 16px", background:B.bg, borderRadius:10 }}>{detectedLevel.desc}</div>

        {/* Pregunta abierta */}
        <div style={{ textAlign:"left", marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:600, color:B.text, display:"block", marginBottom:6 }}>¿Por qué quieres aprender inglés? <span style={{ fontWeight:400, color:B.textSec }}>(opcional)</span></label>
          <textarea value={why} onChange={e=>setWhy(e.target.value)} placeholder="Trabajo, viajes, estudios, objetivos personales..." rows={3} style={{ width:"100%", padding:"10px 12px", border:`1px solid ${B.border}`, borderRadius:10, fontSize:12, color:B.text, background:B.bg, resize:"none", fontFamily:"inherit" }} />
          <div style={{ fontSize:10, color:B.textSec, marginTop:4 }}>Tu respuesta ayuda al docente a personalizar las clases.</div>
        </div>

        <button onClick={onEnroll} style={{ width:"100%", padding:"13px", background:B.primary, color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:10 }}>
          Continuar con la inscripción →
        </button>
        <button onClick={onBack} style={{ width:"100%", padding:"10px", background:"transparent", color:B.textSec, border:"none", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );

  const q = QUESTIONS[testStep];
  return (
    <div style={{ minHeight:"100%", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:B.white, borderRadius:20, padding:32, maxWidth:520, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.08)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:600, color:B.primary }}>WCA Placement Test</div>
          <div style={{ fontSize:12, color:B.textSec }}>{testStep + 1} / {QUESTIONS.length}</div>
        </div>
        <div style={{ height:6, background:B.bg, borderRadius:3, marginBottom:24, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${progress}%`, background:B.primary, borderRadius:3, transition:"width .4s" }} />
        </div>
        <div style={{ fontSize:15, fontWeight:600, color:B.text, marginBottom:20, lineHeight:1.5 }}>{q.q}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {q.opts.map((opt,i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.ans;
            const showResult = selected !== null;
            let bg = B.bg, border = `1px solid ${B.border}`, color = B.text;
            if (showResult && isCorrect) { bg = B.greenDim; border = `2px solid ${B.green}`; color = "#065f46"; }
            else if (showResult && isSelected && !isCorrect) { bg = "#fee2e2"; border = `2px solid ${B.red}`; color = B.red; }
            else if (isSelected) { bg = B.primaryDim; border = `2px solid ${B.primary}`; color = B.primary; }
            return (
              <button key={i} onClick={() => submitAnswer(i)} style={{ padding:"12px 16px", border, borderRadius:10, background:bg, color, fontSize:13, textAlign:"left", cursor:selected===null?"pointer":"default", fontFamily:"inherit", fontWeight: isSelected||isCorrect?600:400, transition:"all .15s" }}>
                {opt}
              </button>
            );
          })}
        </div>
        <button onClick={onBack} style={{ marginTop:20, background:"none", border:"none", cursor:"pointer", fontSize:11, color:B.textSec, fontFamily:"inherit" }}>← Volver</button>
      </div>
    </div>
  );
}

// ─── ENROLL FLOW ──────────────────────────────────────────────────
function EnrollFlow({ step, setStep, detectedLevel, selProgram, setSelProgram, selSchedule, setSelSchedule, payMethod, setPayMethod, PROGRAMS, SCHEDULES, onDone, onBack }) {
  const [form, setForm] = useState({ name:"", email:"", phone:"", country:"" });
  const prog = PROGRAMS.find(p=>p.id===selProgram);

  const STEPS = ["Programa","Horario","Tus datos","Pago"];

  return (
    <div style={{ minHeight:"100%", background:B.bg, fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:"32px 24px" }}>
      <div style={{ maxWidth:600, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:20, fontWeight:800, color:B.primary, marginBottom:4 }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
          {detectedLevel && <div style={{ fontSize:11, color:B.textSec }}>Nivel detectado: <strong style={{ color:B.primary }}>{detectedLevel.code} — {detectedLevel.name}</strong></div>}
        </div>

        {/* Steps bar */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
          {STEPS.map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", flex: i<STEPS.length-1?1:"auto" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:i<step?B.green:i===step?B.primary:B.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color: i<=step?"#fff":B.textSec }}>
                  {i<step?"✓":i+1}
                </div>
                <div style={{ fontSize:9, color:i===step?B.primary:B.textSec, fontWeight:i===step?700:400, whiteSpace:"nowrap" }}>{s}</div>
              </div>
              {i<STEPS.length-1 && <div style={{ flex:1, height:2, background:i<step?B.green:B.border, margin:"0 6px 14px" }} />}
            </div>
          ))}
        </div>

        <div style={{ background:B.white, borderRadius:16, padding:24, border:`1px solid ${B.border}` }}>

          {/* STEP 0: Program */}
          {step === 0 && (
            <div>
              {detectedLevel && (
                <div style={{ background:B.primaryDim, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:B.primary, display:"flex", gap:8 }}>
                  <i className="ti ti-certificate" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true" />
                  Tu Placement Test detectó <strong>Nivel {detectedLevel.code}</strong>. Ingresas en la unidad activa del ciclo.
                </div>
              )}
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Elige tu programa</div>
              {PROGRAMS.map(p => (
                <div key={p.id} onClick={() => setSelProgram(p.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:14, border:`2px solid ${selProgram===p.id?p.color:B.border}`, borderRadius:12, marginBottom:10, cursor:"pointer", background:selProgram===p.id?`${p.color}08`:"transparent", transition:"all .15s" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${p.color}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <i className={p.id==="beca"?"ti ti-certificate":"ti ti-language"} style={{ fontSize:20, color:p.color }} aria-hidden="true" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:B.text }}>{p.name}</div>
                    <div style={{ fontSize:11, color:B.textSec, marginTop:2 }}>{p.desc}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:p.color }}>${p.price}</div>
                    <div style={{ fontSize:10, color:B.textSec }}>/{p.interval}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => selProgram && setStep(1)} style={{ width:"100%", padding:"12px", background:selProgram?B.primary:B.border, color:selProgram?"#fff":B.textSec, border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:selProgram?"pointer":"not-allowed", fontFamily:"inherit", marginTop:6 }}>Continuar →</button>
            </div>
          )}

          {/* STEP 1: Schedule */}
          {step === 1 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Elige tu horario</div>
              <div style={{ fontSize:11, color:B.textSec, marginBottom:14 }}>Clases en vivo lunes, miércoles y viernes. El contenido de práctica está disponible 24/7.</div>
              {SCHEDULES.map((s,i) => (
                <div key={i} onClick={() => s.cupos>0&&setSelSchedule(i)} style={{ display:"flex", alignItems:"center", gap:14, padding:14, border:`2px solid ${selSchedule===i&&s.cupos>0?B.primary:B.border}`, borderRadius:12, marginBottom:10, cursor:s.cupos>0?"pointer":"not-allowed", background:selSchedule===i&&s.cupos>0?B.primaryDim:s.cupos===0?"#fafafa":"transparent", opacity:s.cupos===0?.5:1, transition:"all .15s" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:B.text }}>{s.time}</div>
                    <div style={{ fontSize:11, color:B.textSec, marginTop:2 }}>{s.days} · Docente: {s.teacher}</div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:600, color:s.cupos===0?B.red:s.cupos<=5?B.amber:B.green }}>
                    {s.cupos===0?"Sin cupos":`${s.cupos} cupos`}
                  </div>
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:6 }}>
                <button onClick={() => setStep(0)} style={{ flex:1, padding:"11px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:12, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Volver</button>
                <button onClick={() => setStep(2)} style={{ flex:2, padding:"11px", background:B.primary, color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Continuar →</button>
              </div>
            </div>
          )}

          {/* STEP 2: Data */}
          {step === 2 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Tus datos personales</div>
              {[
                { label:"Nombre completo", key:"name", ph:"María Rodríguez", type:"text" },
                { label:"Correo electrónico", key:"email", ph:"maria@correo.com", type:"email" },
                { label:"Teléfono / WhatsApp", key:"phone", ph:"+504 9999-0000", type:"tel" },
                { label:"País de residencia", key:"country", ph:"Honduras", type:"text" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11, color:B.textSec, display:"block", marginBottom:4 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e=>setForm(d=>({...d,[f.key]:e.target.value}))} placeholder={f.ph} style={{ width:"100%", padding:"10px 12px", border:`1px solid ${B.border}`, borderRadius:10, fontSize:12, color:B.text, background:B.bg, fontFamily:"inherit" }} />
                </div>
              ))}
              <div style={{ display:"flex", gap:8, marginTop:6 }}>
                <button onClick={() => setStep(1)} style={{ flex:1, padding:"11px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:12, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Volver</button>
                <button onClick={() => form.name&&form.email&&setStep(3)} style={{ flex:2, padding:"11px", background:B.primary, color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Continuar →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:B.text, marginBottom:14 }}>Confirma y paga</div>
              {/* Summary */}
              <div style={{ background:B.bg, borderRadius:10, padding:14, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:B.textSec, textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>Resumen</div>
                {[[prog?.name||"—", `$${prog?.price||0}/${prog?.interval}`],[`Horario: ${SCHEDULES[selSchedule]?.time}`,""],[`Unidad de ingreso`,`U${detectedLevel?LEVELS.indexOf(LEVELS.find(l=>l.code===detectedLevel.code))+5:1} (ciclo activo)`]].map(([k,v],i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"5px 0", borderTop:i>0?`1px solid ${B.border}`:"none" }}>
                    <span style={{ color:B.textSec }}>{k}</span>
                    {v && <span style={{ fontWeight:600, color:B.text }}>{v}</span>}
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:800, padding:"10px 0 0", borderTop:`2px solid ${B.border}`, marginTop:8 }}>
                  <span style={{ color:B.text }}>Total hoy</span>
                  <span style={{ color:B.primary }}>${prog?.price || 0}.00</span>
                </div>
              </div>
              {/* Payment method */}
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {[["card","ti-credit-card","Tarjeta"],["transfer","ti-building-bank","Transferencia"],["cash","ti-cash","Efectivo"]].map(([id,icon,label]) => (
                  <button key={id} onClick={() => setPayMethod(id)} style={{ flex:1, padding:"10px 6px", border:`2px solid ${payMethod===id?B.primary:B.border}`, borderRadius:10, background:payMethod===id?B.primaryDim:B.white, cursor:"pointer", fontFamily:"inherit" }}>
                    <i className={`ti ${icon}`} style={{ fontSize:18, color:payMethod===id?B.primary:B.textSec, display:"block", marginBottom:4 }} aria-hidden="true" />
                    <div style={{ fontSize:10, fontWeight:600, color:payMethod===id?B.primary:B.textSec }}>{label}</div>
                  </button>
                ))}
              </div>
              {payMethod==="card" && (
                <div>
                  <input placeholder="Número de tarjeta" style={{ width:"100%", padding:"10px 12px", border:`1px solid ${B.border}`, borderRadius:10, fontSize:12, marginBottom:8, background:B.bg, fontFamily:"inherit" }} />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <input placeholder="MM/AA" style={{ padding:"10px 12px", border:`1px solid ${B.border}`, borderRadius:10, fontSize:12, background:B.bg, fontFamily:"inherit" }} />
                    <input placeholder="CVV" style={{ padding:"10px 12px", border:`1px solid ${B.border}`, borderRadius:10, fontSize:12, background:B.bg, fontFamily:"inherit" }} />
                  </div>
                </div>
              )}
              {payMethod==="transfer" && (
                <div style={{ background:B.primaryDim, borderRadius:10, padding:14, fontSize:11, color:B.primary, lineHeight:1.8 }}>
                  <div style={{ fontWeight:700, marginBottom:6 }}>Datos para transferencia</div>
                  <div>Banco: BAC Credomatic · Cuenta: 0123-4567-8901</div>
                  <div>A nombre de: WCA Academy S.A.</div>
                  <div style={{ marginTop:8, fontWeight:600 }}>Tu código de referencia: WCA-{detectedLevel?.code||"A1"}-{Math.floor(Math.random()*9000)+1000}</div>
                </div>
              )}
              {payMethod==="cash" && (
                <div style={{ background:B.primaryDim, borderRadius:10, padding:14, fontSize:11, color:B.primary, lineHeight:1.8 }}>
                  <div style={{ fontWeight:700, marginBottom:6 }}>Pago en sede WCA</div>
                  <div>Bulevar Morazán, San Pedro Sula</div>
                  <div>Horario de caja: Lun–Vie 8 AM–6 PM</div>
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <button onClick={() => setStep(2)} style={{ flex:1, padding:"11px", background:B.bg, color:B.textSec, border:`1px solid ${B.border}`, borderRadius:12, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>← Volver</button>
                <button onClick={onDone} style={{ flex:2, padding:"11px", background:B.primary, color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  {payMethod==="card"?"Pagar y activar matrícula →":"Confirmar inscripción →"}
                </button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onBack} style={{ marginTop:14, background:"none", border:"none", cursor:"pointer", fontSize:11, color:B.textSec, display:"block", margin:"14px auto 0", fontFamily:"inherit" }}>← Volver al inicio</button>
      </div>
    </div>
  );
}

// ─── CONFIRM ─────────────────────────────────────────────────────
function ConfirmScreen({ detectedLevel, selProgram, schedule, onPortal }) {
  return (
    <div style={{ minHeight:"100%", background:B.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ background:B.white, borderRadius:20, padding:36, maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,.08)" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
        <div style={{ fontSize:22, fontWeight:800, color:B.text, marginBottom:6 }}>¡Bienvenido/a a WCA!</div>
        <div style={{ fontSize:13, color:B.textSec, marginBottom:24, lineHeight:1.7 }}>
          Tu matrícula está activa. Recibirás un correo y WhatsApp con tus credenciales de acceso a wcahub.com.
        </div>
        <div style={{ background:B.bg, borderRadius:12, padding:16, marginBottom:24, textAlign:"left" }}>
          {[
            ["Nivel", `${detectedLevel?.code||"A1"} — ${detectedLevel?.name||""}`],
            ["Programa", selProgram?.name||"Inglés"],
            ["Horario", `${schedule?.time||""} · ${schedule?.days||""}`],
            ["Primera clase", "Próximo lunes"],
            ["Acceso plataforma", "Activo ahora"],
          ].map(([k,v],i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"6px 0", borderBottom:i<4?`1px solid ${B.border}`:"none" }}>
              <span style={{ color:B.textSec }}>{k}</span>
              <span style={{ fontWeight:600, color:B.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background:B.greenDim, borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:11, color:"#065f46", display:"flex", gap:8 }}>
          <i className="ti ti-bolt" style={{ fontSize:13, flexShrink:0 }} aria-hidden="true" />
          El sistema te ubicó en la unidad activa del ciclo. No necesitas hacer nada más.
        </div>
        <button onClick={onPortal} style={{ width:"100%", padding:"12px", background:B.primary, color:"#fff", border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Ir a mi portal →
        </button>
      </div>
    </div>
  );
}
