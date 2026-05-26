import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, signInWithMicrosoft } from "../lib/supabase.js";

/* ─── Design direction: "Luxury EdTech Internacional"
   Fondo crema casi-blanco, sidebar de color sólido WCA verde-petróleo,
   tipografía Georgia para display + DM Sans para body,
   amarillo dorado #ffbb23 como acento dominante,
   composición asimétrica, scroll animations suaves,
   vocación: WCA es LA academia VA bilingüe de LATAM
─────────────────────────────────────────────────────── */

const T = {
  deep:   "#0f2d38",
  teal:   "#155266",
  tealMid:"#1a6a82",
  cream:  "#faf9f7",
  white:  "#ffffff",
  gold:   "#ffbb23",
  goldDk: "#e6a800",
  ink:    "#0f1b22",
  muted:  "#4a6270",
  border: "#dde6ea",
  purple: "#5b3fa6",
  rose:   "#c2185b",
  tealLt: "#e8f3f6",
};

const programs = [
  { id:"en",      icon:"🇬🇧", name:"Inglés Completo",        price:95,  tag:"Base",          color:T.teal,   desc:"CEFR A1–C1 · Oxford Wide Angle · Clases en vivo + práctica 24/7", popular:false },
  { id:"va",      icon:"💻",  name:"Asistente Virtual",      price:75,  tag:"Más popular",   color:T.purple, desc:"VA bilingüe · Herramientas digitales · Gestión remota profesional", popular:true  },
  { id:"va_mkt",  icon:"📱",  name:"VA · Marketing Digital", price:95,  tag:"Especialización",color:T.rose,   desc:"Redes sociales · Copywriting · Email marketing · Analítica web",   popular:false },
  { id:"va_legal",icon:"⚖️",  name:"VA · Legal Assistant",   price:95,  tag:"Especialización",color:"#0e7490",desc:"Documentos legales · Inglés jurídico · Agenda legal · CRM Legal",  popular:false },
  { id:"va_care", icon:"🏥",  name:"VA · Cuidador Remoto",   price:95,  tag:"Especialización",color:T.tealMid,desc:"Terminología médica · Coordinación de citas · Registros de salud", popular:false },
];

const stats = [
  { n:"1,200+", label:"Graduados activos"  },
  { n:"20+",    label:"Países"             },
  { n:"94%",    label:"Tasa de empleo"     },
  { n:"$18/hr", label:"Salario promedio"   },
];

const testimonials = [
  { name:"Andrea Castillo",  country:"🇨🇴 Colombia",  role:"VA · Marketing Digital",   quote:"En 6 meses pasé de cero a facturar $1,400/mes desde casa. WCA cambió mi vida completamente.", avatar:"AC" },
  { name:"Diego Ramírez",    country:"🇲🇽 México",    role:"VA · Legal Assistant",      quote:"El nivel de inglés que aprendí me abrió puertas con clientes en Nueva York. Imposible sin WCA.", avatar:"DR" },
  { name:"Valentina Ortega", country:"🇦🇷 Argentina", role:"Asistente Virtual General", quote:"Ahora trabajo para 3 clientes en EEUU. La formación de WCA es brutal — práctica y enfocada.", avatar:"VO" },
  { name:"Carlos Jiménez",   country:"🇭🇳 Honduras",  role:"VA · Cuidador Remoto",      quote:"Desde Tegucigalpa trabajando para clínicas en Miami. Si yo pude, cualquiera puede.", avatar:"CJ" },
];

const howItWorks = [
  { n:"01", title:"Placement Test",        desc:"Hacés el test gratuito y detectamos tu nivel de inglés. Sin presión, sin trampa." },
  { n:"02", title:"Elegís tu programa",    desc:"Inglés, VA General o una especialización. O combinás: Inglés + VA a la vez." },
  { n:"03", title:"Clases en vivo",        desc:"3 veces por semana vía Teams con tu grupo. Grabaciones disponibles 7 días." },
  { n:"04", title:"Práctica 24/7",         desc:"Plataforma propia con ejercicios, exámenes y feedback inmediato. Sin horarios." },
  { n:"05", title:"Certificado CEFR/WCA",  desc:"Al completar cada nivel recibís un certificado verificable con QR. Compartilo en LinkedIn." },
];


const ROLES = [
  { path:"/portal",       icon:"👨‍🎓", label:"Portal Estudiante",     role:"Estudiante",    color:"#155266", desc:"Accede a tus programas, práctica y clases en vivo" },
  { path:"/docente",      icon:"👩‍🏫", label:"Portal Docente",         role:"Docente",       color:"#92400e", desc:"Gestiona tus grupos, asistencia y contenido" },
  { path:"/admin",        icon:"⚙️",  label:"Dashboard Admin",        role:"Admin",         color:"#0f3d4d", desc:"Estudiantes, pagos, grupos y matrículas" },
  { path:"/super",        icon:"⭐",  label:"Super Admin",            role:"Super Admin",   color:"#2d1b69", desc:"Control total del sistema, programas y RRHH" },
  { path:"/crm",          icon:"💼",  label:"CRM Ventas",             role:"Asesor Ventas", color:"#059669", desc:"Pipeline, leads, tareas y métricas de conversión" },
  { path:"/cobros",       icon:"💳",  label:"Gestor de Cobros",       role:"Cobros",        color:"#d97706", desc:"Pagos, transferencias, vencidos y recibos" },
  { path:"/coordinacion", icon:"🎓",  label:"Coordinación Académica", role:"Coordinadora",  color:"#155266", desc:"Docentes, grupos, horarios y becas" },
  { path:"/bi",           icon:"📊",  label:"Dashboard BI",           role:"Directivos",    color:"#3c3489", desc:"MRR, ARR, retención, cohortes y métricas clave" },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function FadeIn({ children, delay = 0, direction = "up", style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : direction === "up" ? "translateY(28px)" : direction === "left" ? "translateX(-28px)" : "translateX(28px)",
      transition: `opacity .65s ${delay}s ease, transform .65s ${delay}s ease`,
      ...style,
    }}>
      {children}
    </div>

  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, countries: 20, graduates: 1200 });

  useEffect(() => {
    // Load real student count from Supabase
    import('../lib/supabase.js').then(({ supabase }) => {
      supabase.from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'estudiante')
        .then(({ count }) => {
          if (count && count > 0) setStats(s => ({ ...s, students: count }));
        });
    });
  }, []);
  const [activeProgram, setActiveProgram] = useState("va");
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [hoveredRole, setHoveredRole] = useState(null);

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:T.cream, color:T.ink, overflowX:"hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        :root { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${T.gold}60; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .hover-lift { transition: transform .2s, box-shadow .2s; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(15,45,56,.14); }
        .gold-btn { background: ${T.gold}; color: ${T.deep}; border: none; cursor: pointer; font-weight: 700; font-family: inherit; transition: background .15s, transform .1s; }
        .gold-btn:hover { background: ${T.goldDk}; transform: translateY(-1px); }
        .ghost-btn { background: transparent; color: ${T.white}; border: 1.5px solid rgba(255,255,255,.35); cursor: pointer; font-family: inherit; transition: all .15s; }
        .ghost-btn:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.7); }
        .teal-btn { background: ${T.teal}; color: ${T.white}; border: none; cursor: pointer; font-family: inherit; font-weight: 700; transition: background .15s; }
        .teal-btn:hover { background: ${T.tealMid}; }
        @media (max-width: 768px) {
          .hero-grid { flex-direction: column !important; }
          .hide-mobile { display: none !important; }
          .hero-text h1 { font-size: 36px !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .programs-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
          .cta-inner { flex-direction: column !important; text-align: center; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none; }
        }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .float { animation: floatY 4s ease-in-out infinite; }
        .float2 { animation: floatY 4s ease-in-out infinite 2s; }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{ position:"sticky", top:0, zIndex:"var(--z-sticky)", background:"rgba(250,249,247,.95)", backdropFilter:"blur(12px)", borderBottom:`1px solid ${T.border}`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:T.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:16, fontWeight:800, color:T.gold }}>W</span>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:T.teal, letterSpacing:-.3 }}>WCA <span style={{ color:T.gold }}>Academy</span></div>
            <div style={{ fontSize:11, color:T.muted, letterSpacing:1.5, textTransform:"uppercase" }}>Virtual Assistant Training</div>
          </div>
        </div>

        <div className="nav-links" style={{ display:"flex", alignItems:"center", gap:28 }}>
          {[["Programas","#programas"],["Cómo funciona","#como"],["Testimonios","#testimonios"],["Precios","#precios"]].map(([l,h])=>(
            <a key={l} href={h} style={{ fontSize:13, color:T.muted, textDecoration:"none", fontWeight:500, transition:"color .15s" }}
              onMouseEnter={e=>e.target.style.color=T.teal} onMouseLeave={e=>e.target.style.color=T.muted}>{l}</a>
          ))}
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button className="ghost-btn" style={{ padding:"8px 16px", borderRadius:8, fontSize:12, color:T.teal, borderColor:T.border }} onClick={()=>setRoleModal(true)}>Iniciar sesión</button>
          <button className="gold-btn" style={{ padding:"8px 16px", borderRadius:8, fontSize:12 }} onClick={()=>document.getElementById("registro")?.scrollIntoView({behavior:"smooth"})}>Comenzar gratis</button>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section style={{ background:`linear-gradient(150deg, ${T.deep} 0%, ${T.teal} 55%, ${T.tealMid} 100%)`, padding:"80px 24px 90px", position:"relative", overflow:"hidden" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(255,187,35,.06)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-60, left:"20%", width:250, height:250, borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"30%", left:"-5%", width:150, height:150, borderRadius:"50%", border:"1px solid rgba(255,187,35,.15)", pointerEvents:"none" }}/>

        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", gap:60 }} className="hero-grid">

          {/* Text */}
          <div className="hero-text" style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,187,35,.15)", border:"1px solid rgba(255,187,35,.3)", borderRadius:30, padding:"6px 14px", marginBottom:24 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:T.gold, animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:12, color:T.gold, fontWeight:600 }}>Academia VA Bilingüe #1 en LATAM</span>
            </div>

            <h1 className="serif" style={{ fontSize:54, fontWeight:400, color:T.white, lineHeight:1.1, marginBottom:20, letterSpacing:-1 }}>
              Conviértete en<br/>
              <em style={{ color:T.gold }}>Asistente Virtual</em><br/>
              bilingüe de alto valor
            </h1>

            <p style={{ fontSize:16, color:"rgba(255,255,255,.7)", lineHeight:1.8, marginBottom:32, maxWidth:480 }}>
              Aprende inglés y formación VA al mismo tiempo. En 3–6 meses estás facturando en dólares desde cualquier lugar del mundo.
            </p>


            {/* ── Stats bar ── */}
            <div style={{ display:"flex", gap:24, marginTop:16, flexWrap:"wrap" }}>
              {[
                { n: stats.students > 10 ? `+${stats.students}` : "+1,200", l: "estudiantes activos" },
                { n: "20+", l: "países" },
                { n: "94%", l: "tasa de aprobación" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div style={{ fontSize:22, fontWeight:800, color:T.gold, lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
              <button className="gold-btn" style={{ padding:"14px 32px", borderRadius:12, fontSize:15 }} onClick={()=>document.getElementById("registro")?.scrollIntoView({behavior:"smooth"})}>
                Comenzar gratis →
              </button>
              <button className="ghost-btn" style={{ padding:"14px 24px", borderRadius:12, fontSize:14, display:"flex", alignItems:"center", gap:8 }} onClick={()=>document.getElementById("como")?.scrollIntoView({behavior:"smooth"})}>
                ▶ Cómo funciona
              </button>
            </div>

            {/* Flags */}
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex" }}>
                {["🇭🇳","🇨🇴","🇲🇽","🇦🇷","🇵🇪","🇪🇸"].map((f,i)=>(
                  <div key={i} style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${T.teal}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, marginLeft:i>0?-8:0, background:T.deep }}>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.5)" }}>{stats.students > 0 ? `+${stats.students} estudiantes activos` : "+1,200 graduados"} en 20+ países</div>
            </div>
          </div>

          {/* Card visual */}
          <div className="hide-mobile float" style={{ flexShrink:0, width:340 }}>
            <div style={{ background:"rgba(255,255,255,.07)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,.12)", borderRadius:24, padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", fontWeight:600, letterSpacing:1 }}>MI PROGRESO</div>
                <div style={{ fontSize:11, background:T.gold, color:T.deep, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>ACTIVO</div>
              </div>
              {/* Progress rings */}
              <div style={{ display:"flex", gap:16, marginBottom:20 }}>
                {[{l:"Inglés",pct:75,c:T.gold},{l:"VA General",pct:58,c:"#a78bfa"},{l:"Marketing",pct:30,c:"#f9a8d4"}].map(({l,pct,c},i)=>(
                  <div key={i} style={{ flex:1, textAlign:"center" }}>
                    <svg viewBox="0 0 60 60" width={60} height={60} style={{ display:"block", margin:"0 auto 6px" }}>
                      <circle cx={30} cy={30} r={24} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={5}/>
                      <circle cx={30} cy={30} r={24} fill="none" stroke={c} strokeWidth={5}
                        strokeDasharray={`${(pct/100)*150.8} 150.8`} strokeLinecap="round"
                        transform="rotate(-90 30 30)" style={{transition:"stroke-dasharray 1s"}}/>
                      <text x={30} y={35} textAnchor="middle" fontSize={13} fontWeight="700" fill={c}>{pct}%</text>
                    </svg>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", fontWeight:500 }}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Next class */}
              <div style={{ background:"rgba(255,187,35,.12)", border:"1px solid rgba(255,187,35,.25)", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:11, color:T.gold, fontWeight:600, marginBottom:4 }}>PRÓXIMA CLASE EN VIVO</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>Lunes · 6:00 PM</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.55)" }}>Unit 9: Future · con Ana Torres</div>
              </div>
              {/* Skills */}
              {[["Listening",89,"#6b21a8"],["Vocabulary",87,"#166534"],["Communication",92,"#7c3aed"]].map(([s,v,c])=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.6)", width:100, flexShrink:0 }}>{s}</div>
                  <div style={{ flex:1, height:5, background:"rgba(255,255,255,.1)", borderRadius:3 }}>
                    <div style={{ height:"100%", width:`${v}%`, background:c, borderRadius:3 }}/>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.7)", fontWeight:600, width:28, textAlign:"right" }}>{v}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ maxWidth:1100, margin:"60px auto 0" }}>
          <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:"rgba(255,255,255,.1)", borderRadius:16, overflow:"hidden" }}>
            {stats.map((s,i)=>(
              <div key={i} style={{ padding:"20px 24px", textAlign:"center", background:"rgba(255,255,255,.05)" }}>
                <div className="serif" style={{ fontSize:32, fontWeight:400, color:T.gold, lineHeight:1 }}>{s.n}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.55)", marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY VA BILINGÜE ────────────────────────────────────── */}
      <section style={{ padding:"90px 24px", maxWidth:1100, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:2.5, textTransform:"uppercase", marginBottom:12 }}>El mercado más demandado</div>
            <h2 className="serif" style={{ fontSize:42, color:T.ink, lineHeight:1.2, marginBottom:16 }}>
              El inglés solo ya no alcanza.<br/>
              <span style={{ color:T.teal }}>Los empleadores buscan VAs.</span>
            </h2>
            <p style={{ fontSize:16, color:T.muted, maxWidth:560, margin:"0 auto", lineHeight:1.8 }}>
              El trabajo remoto bilingüe creció 340% en LATAM desde 2020. Las empresas de EEUU y Europa pagan en dólares a profesionales que combinan inglés + habilidades VA.
            </p>
          </div>
        </FadeIn>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:24 }} className="how-grid">
          {[
            { icon:"💵", title:"Gana en dólares",    desc:"El VA bilingüe promedio factura entre $800–2,500 USD/mes. Desde tu casa, en cualquier país de LATAM.", color:T.teal },
            { icon:"🌍", title:"Trabaja desde donde quieras", desc:"Tus clientes están en EE.UU., Canadá y Europa. Tu oficina es donde tengas wifi.", color:"#7c3aed" },
            { icon:"⚡", title:"6 meses para empezar", desc:"No necesitás título universitario. Con WCA en 6 meses estás lista/o para trabajar con clientes internacionales.", color:T.rose },
          ].map((c,i)=>(
            <FadeIn key={i} delay={i*0.12}>
              <div className="hover-lift" style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:20, padding:28, borderTop:`4px solid ${c.color}` }}>
                <div style={{ fontSize:36, marginBottom:16 }}>{c.icon}</div>
                <div className="serif" style={{ fontSize:20, color:T.ink, marginBottom:10 }}>{c.title}</div>
                <div style={{ fontSize:14, color:T.muted, lineHeight:1.75 }}>{c.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PROGRAMS ───────────────────────────────────────────── */}
      <section id="programas" style={{ background:T.deep, padding:"90px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <FadeIn>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:2.5, textTransform:"uppercase", marginBottom:12 }}>Programas</div>
              <h2 className="serif" style={{ fontSize:42, color:T.white, lineHeight:1.2, marginBottom:16 }}>
                Un ecosistema completo.<br/><span style={{ color:T.gold }}>Empieza donde quieras.</span>
              </h2>
              <p style={{ fontSize:15, color:"rgba(255,255,255,.55)", maxWidth:520, margin:"0 auto", lineHeight:1.8 }}>
                Podés inscribirte en uno o combinar programas. Cada uno avanza de forma independiente.
              </p>
            </div>
          </FadeIn>

          {/* Program tabs */}
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:40 }}>
            {programs.map(p=>(
              <button key={p.id} onClick={()=>setActiveProgram(p.id)} style={{
                padding:"8px 16px", borderRadius:30, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                background: activeProgram===p.id ? p.color : "rgba(255,255,255,.06)",
                color: activeProgram===p.id ? "#fff" : "rgba(255,255,255,.5)",
                border: `1.5px solid ${activeProgram===p.id ? p.color : "rgba(255,255,255,.1)"}`,
                transition:"all .2s",
              }}>
                {p.icon} {p.name}
              </button>
            ))}
          </div>

          {/* Active program detail */}
          {programs.filter(p=>p.id===activeProgram).map(p=>(
            <FadeIn key={p.id}>
              <div style={{ background:"rgba(255,255,255,.05)", backdropFilter:"blur(10px)", border:`1px solid rgba(255,255,255,.1)`, borderRadius:24, padding:"36px 40px", display:"flex", gap:40, alignItems:"center" }}>
                <div style={{ width:90, height:90, borderRadius:22, background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:44, flexShrink:0 }}>{p.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div className="serif" style={{ fontSize:26, color:T.white }}>{p.name}</div>
                    {p.popular && <span style={{ fontSize:11, background:T.gold, color:T.deep, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>{p.tag}</span>}
                    {!p.popular && p.tag && <span style={{ fontSize:11, background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.6)", padding:"3px 10px", borderRadius:20 }}>{p.tag}</span>}
                  </div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,.6)", lineHeight:1.7, marginBottom:20 }}>{p.desc}</div>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <div className="serif" style={{ fontSize:36, color:T.gold }}>${p.price}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>/ mes</div>
                    <button className="gold-btn" style={{ marginLeft:"auto", padding:"12px 28px", borderRadius:12, fontSize:14 }} onClick={()=>document.getElementById("registro")?.scrollIntoView({behavior:"smooth"})}>
                      Inscribirme →
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}

          {/* Prereq note */}
          <div style={{ marginTop:16, textAlign:"center", fontSize:12, color:"rgba(255,255,255,.3)" }}>
            Las especializaciones VA requieren completar primero el programa <strong style={{color:"rgba(255,255,255,.5)"}}>Asistente Virtual General</strong>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="como" style={{ padding:"90px 24px", maxWidth:1100, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:2.5, textTransform:"uppercase", marginBottom:12 }}>Metodología</div>
            <h2 className="serif" style={{ fontSize:42, color:T.ink, lineHeight:1.2 }}>
              Simple. Enfocado.<br/><span style={{ color:T.teal }}>Con resultados reales.</span>
            </h2>
          </div>
        </FadeIn>

        <div className="how-grid" style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:0 }}>
          {howItWorks.map((h,i)=>(
            <FadeIn key={i} delay={i*0.1}>
              <div style={{ textAlign:"center", padding:"0 16px", position:"relative" }}>
                {i < howItWorks.length-1 && (
                  <div style={{ position:"absolute", top:28, left:"60%", right:0, height:1, background:`linear-gradient(90deg,${T.gold},transparent)`, opacity:.3 }}/>
                )}
                <div style={{ width:56, height:56, borderRadius:"50%", background:T.teal, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", position:"relative", zIndex:"var(--z-base)" }}>
                  <span className="serif" style={{ fontSize:18, color:T.gold }}>{h.n}</span>
                </div>
                <div className="serif" style={{ fontSize:16, color:T.ink, marginBottom:8 }}>{h.title}</div>
                <div style={{ fontSize:13, color:T.muted, lineHeight:1.65 }}>{h.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────── */}
      <section id="testimonios" style={{ background:"#f0f7fa", padding:"90px 24px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <FadeIn>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:2.5, textTransform:"uppercase", marginBottom:12 }}>Testimonios</div>
              <h2 className="serif" style={{ fontSize:42, color:T.ink, lineHeight:1.2 }}>
                Sus palabras,<br/><span style={{ color:T.teal }}>no las nuestras.</span>
              </h2>
            </div>
          </FadeIn>
          <div className="testimonials-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20 }}>
            {testimonials.map((t,i)=>(
              <FadeIn key={i} delay={i*0.1}>
                <div className="hover-lift" style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:20, padding:28 }}>
                  <div style={{ fontSize:32, color:T.gold, fontStyle:"italic", lineHeight:1, marginBottom:16 }}>"</div>
                  <p className="serif" style={{ fontSize:17, color:T.ink, lineHeight:1.65, marginBottom:20, fontStyle:"italic" }}>"{t.quote}"</p>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:T.teal, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:T.gold, flexShrink:0 }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>{t.name}</div>
                      <div style={{ fontSize:12, color:T.muted }}>{t.country} · {t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────── */}
      <section id="precios" style={{ padding:"90px 24px", maxWidth:1100, margin:"0 auto" }}>
        <FadeIn>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:2.5, textTransform:"uppercase", marginBottom:12 }}>Precios</div>
            <h2 className="serif" style={{ fontSize:42, color:T.ink, lineHeight:1.2, marginBottom:16 }}>
              Transparente.<br/><span style={{ color:T.teal }}>Sin sorpresas.</span>
            </h2>
            <p style={{ fontSize:15, color:T.muted, maxWidth:480, margin:"0 auto" }}>Pagás mes a mes. Sin contratos. Sin permanencia mínima. Cancelás cuando quieras.</p>
          </div>
        </FadeIn>

        <div className="programs-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
          {programs.slice(0,3).map((p,i)=>(
            <FadeIn key={i} delay={i*0.1}>
              <div className="hover-lift" style={{ background:p.popular?T.teal:T.white, border:`1.5px solid ${p.popular?T.teal:T.border}`, borderRadius:22, padding:"28px 24px", position:"relative", overflow:"hidden" }}>
                {p.popular && <div style={{ position:"absolute", top:16, right:-24, background:T.gold, color:T.deep, fontSize:11, fontWeight:700, padding:"4px 36px", transform:"rotate(30deg)" }}>Popular</div>}
                <div style={{ fontSize:32, marginBottom:14 }}>{p.icon}</div>
                <div className="serif" style={{ fontSize:20, color:p.popular?T.white:T.ink, marginBottom:8 }}>{p.name}</div>
                <div style={{ fontSize:13, color:p.popular?"rgba(255,255,255,.6)":T.muted, lineHeight:1.7, marginBottom:20, minHeight:56 }}>{p.desc}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:24 }}>
                  <span className="serif" style={{ fontSize:40, color:p.popular?T.gold:T.teal, lineHeight:1 }}>${p.price}</span>
                  <span style={{ fontSize:13, color:p.popular?"rgba(255,255,255,.5)":T.muted }}>/ mes</span>
                </div>
                <button className={p.popular?"gold-btn":"teal-btn"} style={{ width:"100%", padding:"13px", borderRadius:12, fontSize:14 }} onClick={()=>document.getElementById("registro")?.scrollIntoView({behavior:"smooth"})}>
                  Comenzar ahora
                </button>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Especializations */}
        <FadeIn delay={0.2}>
          <div style={{ marginTop:20, background:"var(--bg-surface, #fff)", border:`1px solid ${T.border}`, borderRadius:22, padding:"24px 28px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.muted, marginBottom:16, textTransform:"uppercase", letterSpacing:.8 }}>Especializaciones VA · $95/mes c/u · Requieren VA General</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
              {programs.slice(2).map((p,i)=>(
                <div key={i} style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 14px", background:"var(--bg-page)", borderRadius:12, border:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:22 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{p.name.replace("VA · ","")}</div>
                    <div style={{ fontSize:11, color:T.muted }}>12 semanas · 12 unidades</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── REGISTER / CTA ─────────────────────────────────────── */}

      {/* ── ALIADOS ────────────────────────────────────────────── */}
      <section style={{ background:"var(--bg-surface)", padding:"72px 24px", borderTop:"1px solid #e8f0f3" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>

          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:2.5, textTransform:"uppercase", marginBottom:10 }}>
              Ecosistema de alianzas
            </div>
            <h2 className="serif" style={{ fontSize:34, color:T.ink, lineHeight:1.2, marginBottom:0 }}>
              Construimos junto a los mejores
            </h2>
          </div>

          {/* Grupo 1 — Impulsados por */}
          <div style={{ marginBottom:48 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22 }}>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,#e2e8f0)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 16px", background:T.tealLt||"#e8f3f6", borderRadius:30, border:"1px solid #c5dde5" }}>
                <span style={{ fontSize:14 }}>🚀</span>
                <span style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:1, textTransform:"uppercase" }}>Impulsados por</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,#e2e8f0,transparent)" }}/>
            </div>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>

              {/* BID LAB */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 24px", background:"#f0f8ff", border:"1.5px solid #bfdbfe", borderRadius:16, cursor:"default", minWidth:180 }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="14" fill="#1e40af"/>
                  <text x="14" y="19" textAnchor="middle" fontSize="10" fontWeight="800" fill="white">BID</text>
                </svg>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#1e40af", letterSpacing:-.3 }}>BID <span style={{ color:"#60a5fa" }}>LAB</span></div>
                  <div style={{ fontSize:11, color:"#93c5fd", fontWeight:500, letterSpacing:.5 }}>BANCO INTERAMERICANO</div>
                </div>
              </div>

              {/* Región Plateada */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 24px", background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"1.5px solid #86efac", borderRadius:16, cursor:"default", minWidth:200 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#059669,#10b981)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:16 }}>🌿</span>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#065f46", letterSpacing:-.2 }}>Región Plateada</div>
                  <div style={{ fontSize:11, color:"#6ee7b7", fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>Iniciativa de Impacto</div>
                </div>
              </div>

              {/* Red de Impacto LATAM */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 24px", background:"linear-gradient(135deg,#fff7ed,#ffedd5)", border:"1.5px solid #fdba74", borderRadius:16, cursor:"default", minWidth:210 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#ea580c,#f97316)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:16 }}>🌎</span>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#9a3412" }}>Red de Impacto</div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#ea580c", letterSpacing:.3 }}>LATAM</div>
                </div>
              </div>

              {/* Iniciativa Dinámica */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 24px", background:"linear-gradient(135deg,#faf5ff,#f3e8ff)", border:"1.5px solid #c4b5fd", borderRadius:16, cursor:"default", minWidth:190 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:16 }}>⚡</span>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#5b21b6" }}>Iniciativa Dinámica</div>
                  <div style={{ fontSize:11, color:"#c4b5fd", fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>Aceleradora LATAM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grupo 2 — Respaldados por */}
          <div style={{ marginBottom:48 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22 }}>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,#e2e8f0)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 16px", background:"#fef2f2", borderRadius:30, border:"1px solid #fca5a5" }}>
                <span style={{ fontSize:14 }}>🤝</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#dc2626", letterSpacing:1, textTransform:"uppercase" }}>Respaldados por</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,#e2e8f0,transparent)" }}/>
            </div>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>

              {/* USA Flag + Embassy */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 24px", background:"linear-gradient(135deg,#fff,#f8faff)", border:"1.5px solid #bfdbfe", borderRadius:16, cursor:"default", minWidth:230, boxShadow:"0 2px 8px rgba(0,0,200,.06)" }}>
                <div style={{ fontSize:28, lineHeight:1 }}>🇺🇸</div>
                <div style={{ borderLeft:"1.5px solid #e2e8f0", paddingLeft:12 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#1e3a8a", letterSpacing:-.2 }}>U.S. Embassy</div>
                  <div style={{ fontSize:11, color:"#93c5fd", fontWeight:600, letterSpacing:.5, textTransform:"uppercase" }}>Tegucigalpa, Honduras</div>
                </div>
              </div>

              {/* Exchange Alumni */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 24px", background:"linear-gradient(135deg,#fefce8,#fef9c3)", border:"1.5px solid #fde68a", borderRadius:16, cursor:"default", minWidth:220 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg,#1e3a8a,#1e40af)", border:"2px solid #fde68a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:"#fde68a" }}>EA</span>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color:"#92400e", letterSpacing:-.2 }}>Exchange Alumni</div>
                  <div style={{ fontSize:11, color:"#d97706", fontWeight:600, letterSpacing:.4, textTransform:"uppercase" }}>Connect · Empower · Inspire</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grupo 3 — Apoyo Financiero Internacional */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22 }}>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,#e2e8f0)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 16px", background:"#f0fdf4", borderRadius:30, border:"1px solid #86efac" }}>
                <span style={{ fontSize:14 }}>🌍</span>
                <span style={{ fontSize:11, fontWeight:700, color:"#16a34a", letterSpacing:1, textTransform:"uppercase" }}>Apoyo internacional</span>
              </div>
              <div style={{ height:1, flex:1, background:"linear-gradient(90deg,#e2e8f0,transparent)" }}/>
            </div>
            <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>

              {/* BCIE */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 20px", background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"1.5px solid #6ee7b7", borderRadius:12, cursor:"default", minWidth:170 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#065f46,#059669)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:11, fontWeight:900, color:"white" }}>BCIE</span>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#065f46" }}>BCIE</div>
                  <div style={{ fontSize:12, color:"#6ee7b7", fontWeight:600, letterSpacing:.3, textTransform:"uppercase" }}>Banco Centroamericano</div>
                </div>
              </div>

              {/* Unión Europea */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 20px", background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1.5px solid #93c5fd", borderRadius:12, cursor:"default", minWidth:170 }}>
                <div style={{ width:34, height:34, borderRadius:"50%", background:"#003399", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>🇪🇺</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1e3a8a" }}>Unión Europea</div>
                  <div style={{ fontSize:12, color:"#93c5fd", fontWeight:600, letterSpacing:.3, textTransform:"uppercase" }}>Cooperación al Desarrollo</div>
                </div>
              </div>

              {/* Cooperación Alemana */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 20px", background:"linear-gradient(135deg,#fafafa,#f5f5f5)", border:"1.5px solid #d1d5db", borderRadius:12, cursor:"default", minWidth:190 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#111,#374151)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:14 }}>🇩🇪</span>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#111" }}>Cooperación Alemana</div>
                  <div style={{ fontSize:12, color:"#9ca3af", fontWeight:600, letterSpacing:.3, textTransform:"uppercase" }}>Deutsche Zusammenarbeit</div>
                </div>
              </div>

              {/* KFW */}
              <div className="hover-lift" style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 20px", background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1.5px solid #fcd34d", borderRadius:12, cursor:"default", minWidth:130 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:"linear-gradient(135deg,#78350f,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:"white" }}>KfW</span>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#78350f" }}>KfW</div>
                  <div style={{ fontSize:12, color:"#fcd34d", fontWeight:600, letterSpacing:.3, textTransform:"uppercase" }}>Banco de Fomento</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tagline final */}
          <div style={{ textAlign:"center", marginTop:44 }}>
            <p style={{ fontSize:13, color:T.muted, fontStyle:"italic" }}>
              WCA forma parte de un ecosistema global comprometido con el desarrollo económico de Latinoamérica.
            </p>
          </div>
        </div>
      </section>

      <section id="registro" style={{ background:T.deep, padding:"90px 24px" }}>
        <div style={{ maxWidth:640, margin:"0 auto", textAlign:"center" }}>
          <FadeIn>
            <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:2.5, textTransform:"uppercase", marginBottom:16 }}>Empieza hoy</div>
            <h2 className="serif" style={{ fontSize:44, color:T.white, lineHeight:1.15, marginBottom:16 }}>
              Tu carrera como VA<br/><em style={{ color:T.gold }}>comienza aquí.</em>
            </h2>
            <p style={{ fontSize:15, color:"rgba(255,255,255,.55)", marginBottom:40, lineHeight:1.8 }}>
              Hacé el placement test gratuito. En 5 minutos sabés tu nivel de inglés y qué programa te conviene.
            </p>
          </FadeIn>

          {/* Auth options */}
          <FadeIn delay={0.1}>
            <div style={{ background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:20, padding:28 }}>
              <div style={{ fontSize:14, color:"rgba(255,255,255,.6)", marginBottom:20, fontWeight:500 }}>Registrate con tu cuenta</div>
              <div style={{ display:"flex", gap:12, marginBottom:20 }}>
                {/* Microsoft */}
                <button onClick={signInWithMicrosoft} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 16px", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.14)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.08)";}}>
                  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  Continuar con Microsoft
                </button>
                {/* Google */}
                <button onClick={signInWithGoogle} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 16px", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all .15s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,.14)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.08)";}}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#4285f4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
                    <path fill="#34a853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
                    <path fill="#fbbc05" d="M11.68 28.18A13.93 13.93 0 0 1 10.9 24c0-1.45.25-2.86.68-4.18v-5.7H4.34A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.56 10.77l7.12-5.7.99-.89z"/>
                    <path fill="#ea4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.34 5.7C13.42 14.62 18.27 10.75 24 10.75z"/>
                  </svg>
                  Continuar con Google
                </button>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }}/><span style={{ fontSize:12, color:"rgba(255,255,255,.3)" }}>o</span><div style={{ flex:1, height:1, background:"rgba(255,255,255,.1)" }}/>
              </div>

              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" type="email" style={{ flex:1, padding:"13px 16px", borderRadius:12, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none" }}
                  onFocus={e=>{e.target.style.borderColor=T.gold;}} onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.15)";}}/>
                <button className="gold-btn" onClick={()=>{ if(email.trim()) signInWithGoogle(); else setRoleModal(true); }} style={{ padding:"13px 24px", borderRadius:12, fontSize:14, whiteSpace:"nowrap" }}>
                  Comenzar gratis
                </button>
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>Sin tarjeta de crédito. Placement test gratuito. Cancela cuando quieras.</div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ background:T.ink, padding:"48px 24px 32px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div className="footer-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:40, marginBottom:40 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:34, height:34, borderRadius:8, background:T.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:16, fontWeight:800, color:T.gold }}>W</span>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>WCA Academy</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", letterSpacing:1.5 }}>VIRTUAL ASSISTANT TRAINING</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", lineHeight:1.8, maxWidth:280 }}>
                La academia VA bilingüe de referencia en Latinoamérica. Inglés + formación VA + especialización.
              </p>
            </div>
            {[
              { title:"Programas", links:["Inglés Completo","VA General","Marketing Digital","Legal Assistant","Cuidador Remoto"] },
              { title:"Empresa",   links:["Sobre WCA","Instructores","Metodología","B2B / Empresas","Blog"] },
              { title:"Soporte", links:[
        {label:"Centro de ayuda",  href:"mailto:info@worldconnectacademy.com"},
        {label:"Política de privacidad", href:"/privacidad"},
        {label:"Términos de uso",  href:"/terminos"},
        {label:"Contacto",         href:"mailto:info@worldconnectacademy.com"},
      ]},
            ].map((col,i)=>(
              <div key={i}>
                <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,.4)", letterSpacing:1.5, textTransform:"uppercase", marginBottom:14 }}>{col.title}</div>
                {col.links.map(l=><div key={l}
                  onClick={()=>{const id=l.toLowerCase().replace(/[^a-z0-9]/g,"-");const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:"smooth"});}}
                  style={{ fontSize:13, color:"rgba(255,255,255,.3)", marginBottom:8, cursor:"pointer", transition:"color .15s" }}
                  onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.3)"}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.2)" }}>© 2026 World Connect Academy. Todos los derechos reservados.</div>
            <div style={{ display:"flex", gap:6 }}>
              {["🇭🇳","🇨🇴","🇲🇽","🇦🇷","🇵🇪"].map((f,i)=><span key={i} style={{ fontSize:16 }}>{f}</span>)}
              <span style={{ fontSize:12, color:"rgba(255,255,255,.2)", marginLeft:6 }}>+15 países más</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ── */}
      {roleModal && (
        <div
          onClick={e=>{ if(e.target===e.currentTarget) setRoleModal(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(10,25,35,.7)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:"var(--z-modal)", padding:20 }}>
          <div style={{ background:"var(--bg-surface)", borderRadius:24, padding:"36px 36px 28px", width:420, maxWidth:"100%", boxShadow:"0 32px 80px rgba(0,0,0,.3)", animation:"popIn .22s cubic-bezier(.34,1.56,.64,1) both" }}>

            {/* Logo + header */}
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ width:52, height:52, borderRadius:13, background:T.teal, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <span style={{ fontSize:22, fontWeight:900, color:T.gold }}>W</span>
              </div>
              <div style={{ fontSize:20, fontWeight:800, color:T.ink, marginBottom:6 }}>
                WCA <span style={{ color:T.teal }}>Hub</span>
              </div>
              <div style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>
                Iniciá sesión o creá tu cuenta.<br/>
                <span style={{ fontSize:12, color:"#94a3b8" }}>Tu acceso se configura según tu rol en WCA.</span>
              </div>
            </div>

            {/* Auth buttons */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button
                onClick={()=>{ setRoleModal(false); signInWithGoogle(); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 16px", background:"var(--bg-surface)", border:"1.5px solid #e2e8f0", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:600, color:"#0f172a", fontFamily:"inherit", transition:"all .15s", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#4285f4";e.currentTarget.style.boxShadow="0 2px 12px rgba(66,133,244,.15)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.06)";}}>
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#4285f4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34a853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.32-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#fbbc05" d="M11.68 28.18A13.93 13.93 0 0 1 10.9 24c0-1.45.25-2.86.68-4.18v-5.7H4.34A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.56 10.77l7.12-5.7.99-.89z"/><path fill="#ea4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.34 5.7C13.42 14.62 18.27 10.75 24 10.75z"/></svg>
                Continuar con Google
              </button>

              <button
                onClick={()=>{ setRoleModal(false); signInWithMicrosoft(); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 16px", background:"var(--bg-surface)", border:"1.5px solid #e2e8f0", borderRadius:12, cursor:"pointer", fontSize:14, fontWeight:600, color:"#0f172a", fontFamily:"inherit", transition:"all .15s", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="#00a4ef";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,164,239,.15)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.06)";}}>
                <svg width="20" height="20" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#f25022"/><rect x="11" y="1" width="9" height="9" fill="#7fba00"/><rect x="1" y="11" width="9" height="9" fill="#00a4ef"/><rect x="11" y="11" width="9" height="9" fill="#ffb900"/></svg>
                Continuar con Microsoft
              </button>
            </div>

            {/* Footer */}
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9", textAlign:"center" }}>
              <p style={{ fontSize:11, color:"#94a3b8", lineHeight:1.6, margin:0 }}>
                Al continuar aceptás los{" "}
                <span style={{ color:T.teal, cursor:"pointer" }}>Términos de uso</span>
                {" "}y la{" "}
                <a href="/privacidad" style={{ color:"#ffbb23", cursor:"pointer", textDecoration:"underline", fontSize:"inherit" }}>Política de privacidad</a>
                {" "}de WCA Academy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}