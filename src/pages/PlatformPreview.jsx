import { useState } from "react";

const B = {
  primary:"#155266", dark:"#0f3d4d", primaryDim:"#e8f3f6",
  secondary:"#ffbb23", secondaryDim:"#fff4d2",
  bg:"#f5f7fa", white:"#ffffff", text:"#1f2933", textSec:"#6b7280",
  border:"#d1dde3", green:"#059669", greenDim:"#d1fae5",
  red:"#dc2626", redDim:"#fee2e2", amber:"#ffbb23", amberDim:"#fff4d2",
};

const PORTALS = [
  {
    id:"landing",
    label:"Landing Page",
    route:"/",
    role:"Público",
    roleColor:B.green,
    icon:"🌐",
    desc:"Página pública, Placement Test y autoinscripción en 4 pasos",
    sections:["Hero + stats","Cómo funciona","Programas","Testimonios","FAQ","Placement Test","Inscripción","Confirmación"],
    stats:[{ l:"Conversión estimada", v:"28%"},{ l:"Pasos de inscripción", v:"4"},{ l:"Preguntas del test", v:"15"}],
    color:B.green,
    screens:[
      { name:"Hero", bg:B.primary, elements:[
        { type:"nav",  y:0, h:48 },
        { type:"hero", y:48, h:180 },
        { type:"steps", y:228, h:100 },
        { type:"cards", y:328, h:100 },
      ]},
      { name:"Placement Test", bg:B.bg, elements:[
        { type:"test", y:0, h:420 },
      ]},
    ],
  },
  {
    id:"estudiante",
    label:"Portal Estudiante",
    route:"/portal",
    role:"Estudiante",
    roleColor:B.primary,
    icon:"👨‍🎓",
    desc:"Portal completo con ciclo de aprendizaje, exámenes y gamificación",
    sections:["Inicio","Mi programa","Clases en vivo","Práctica 24/7","Examen","Mi progreso","Pagos"],
    stats:[{ l:"Secciones", v:"7"},{ l:"Tipos de actividad", v:"6"},{ l:"Badges", v:"8+"}],
    color:B.primary,
  },
  {
    id:"onboarding",
    label:"Onboarding Wizard",
    route:"/portal/onboarding",
    role:"Estudiante",
    roleColor:B.primary,
    icon:"🎯",
    desc:"Wizard de bienvenida en 6 pasos para el primer acceso",
    sections:["Bienvenida","Tu nivel","Cómo funciona","Tu clase","Tu portal","¡Listo!"],
    stats:[{ l:"Pasos", v:"6"},{ l:"Duración", v:"~2 min"},{ l:"Solo", v:"1 vez"}],
    color:"#7c3aed",
  },
  {
    id:"docente",
    label:"Portal Docente",
    route:"/docente",
    role:"Docente",
    roleColor:"#92400e",
    icon:"👩‍🏫",
    desc:"Gestión de grupos, asistencia, exámenes y banco de actividades",
    sections:["Inicio","Mis grupos","Asistencia","Exámenes","Contenido","Banco actividades"],
    stats:[{ l:"Secciones", v:"6"},{ l:"Grupos max.", v:"∞"},{ l:"Alertas auto.", v:"Sí"}],
    color:"#92400e",
  },
  {
    id:"admin",
    label:"Dashboard Admin",
    route:"/admin",
    role:"Admin",
    roleColor:B.dark,
    icon:"⚙️",
    desc:"Control operativo completo: estudiantes, grupos, pagos y ciclo",
    sections:["Inicio","Estudiantes","Grupos","Matrículas","Pagos","Ciclo","Reportes","B2B"],
    stats:[{ l:"Secciones", v:"8"},{ l:"Roles con acceso", v:"1"},{ l:"Alertas live", v:"4+"}],
    color:B.dark,
  },
  {
    id:"super",
    label:"Super Admin",
    route:"/super",
    role:"Super Admin",
    roleColor:"#2d1b69",
    icon:"⭐",
    desc:"Control total: precios, ciclos, festivos, gamificación, integraciones",
    sections:["Sistema","Precios","Roles","Ciclo","Festivos","Gamificación","Integraciones","Notificaciones","Auditoría","Bancos"],
    stats:[{ l:"Módulos", v:"10"},{ l:"Solo acceso", v:"1 persona"},{ l:"Config. global", v:"Sí"}],
    color:"#2d1b69",
  },
  {
    id:"crm",
    label:"CRM Ventas",
    route:"/crm",
    role:"Ventas",
    roleColor:"#065f46",
    icon:"💼",
    desc:"Pipeline de leads, seguimiento y métricas de conversión",
    sections:["Pipeline Kanban","Todos los leads","Mis tareas","Métricas"],
    stats:[{ l:"Etapas del pipeline", v:"6"},{ l:"Lead scoring", v:"0–100"},{ l:"Vistas", v:"4"}],
    color:"#065f46",
  },
  {
    id:"cobros",
    label:"Gestor de Cobros",
    route:"/cobros",
    role:"Cobros",
    roleColor:"#92400e",
    icon:"💳",
    desc:"Confirmación de transferencias, historial, vencidos y recibos",
    sections:["Inicio","Pendientes","Registrar pago","Historial","Vencidos","Recibos","Mi auditoría"],
    stats:[{ l:"Secciones", v:"7"},{ l:"Métodos pago", v:"3"},{ l:"Audit log", v:"Inmutable"}],
    color:"#92400e",
  },
  {
    id:"coordinacion",
    label:"Coordinación Académica",
    route:"/coordinacion",
    role:"Coordinadora",
    roleColor:B.primary,
    icon:"🎓",
    desc:"Grupos, docentes, estudiantes en riesgo y programa de becas",
    sections:["Inicio","Grupos","Docentes","Estudiantes","En riesgo","Crear horario","Becas","Reportes"],
    stats:[{ l:"Secciones", v:"8"},{ l:"Upgrade becas", v:"Sí"},{ l:"Alertas riesgo", v:"Auto"}],
    color:B.primary,
  },
  {
    id:"bi",
    label:"Dashboard BI",
    route:"/bi",
    role:"Directivos",
    roleColor:"#3c3489",
    icon:"📊",
    desc:"MRR, retención, cohortes, canales de adquisición y rendimiento académico",
    sections:["Overview","Revenue","Retención","Canales","Académico"],
    stats:[{ l:"Vistas", v:"5"},{ l:"KPIs clave", v:"12+"},{ l:"Análisis cohortes", v:"Sí"}],
    color:"#3c3489",
  },
];

const FLOW = [
  { from:"Prospecto",   to:"Ventas CRM",       via:"Lead entra",        color:B.green   },
  { from:"Ventas CRM",  to:"Landing Page",      via:"Placement Test",   color:B.green   },
  { from:"Landing Page",to:"Gestor de Cobros",  via:"Pago / transfer.", color:"#92400e" },
  { from:"Gestor",      to:"Portal Estudiante", via:"Activa cuenta",    color:B.primary },
  { from:"Portal",      to:"Docente",           via:"Clase / examen",   color:"#92400e" },
  { from:"Docente",     to:"Coord. Académica",  via:"Reporta progreso", color:B.primary },
  { from:"Coord.",      to:"Admin",             via:"Gestión operativa",color:B.dark    },
  { from:"Admin",       to:"Super Admin",       via:"Config. sistema",  color:"#2d1b69" },
];

function PortalCard({ portal, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? portal.color : B.white,
      border: `1.5px solid ${selected ? portal.color : B.border}`,
      borderRadius:14, padding:"14px 16px", cursor:"pointer",
      transition:"all .2s", transform: selected ? "scale(1.02)" : "scale(1)",
      boxShadow: selected ? `0 8px 24px ${portal.color}30` : "none",
    }}>
      <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ fontSize:22, lineHeight:1 }}>{portal.icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:700, color: selected ? "#fff" : B.text, marginBottom:2 }}>{portal.label}</div>
          <code style={{ fontSize:9, color: selected ? "rgba(255,255,255,.6)" : B.textSec }}>{portal.route}</code>
        </div>
        <span style={{ fontSize:9, padding:"2px 8px", borderRadius:20, background: selected ? "rgba(255,255,255,.2)" : portal.roleColor+"18", color: selected ? "#fff" : portal.roleColor, fontWeight:600, flexShrink:0 }}>{portal.role}</span>
      </div>
      <div style={{ fontSize:10, color: selected ? "rgba(255,255,255,.75)" : B.textSec, lineHeight:1.6, marginBottom:10 }}>{portal.desc}</div>
      <div style={{ display:"flex", gap:10 }}>
        {portal.stats.map((s,i) => (
          <div key={i} style={{ flex:1, textAlign:"center", background: selected ? "rgba(255,255,255,.1)" : B.bg, borderRadius:7, padding:"5px 4px" }}>
            <div style={{ fontSize:14, fontWeight:800, color: selected ? "#fff" : portal.color }}>{s.v}</div>
            <div style={{ fontSize:8, color: selected ? "rgba(255,255,255,.5)" : B.textSec, marginTop:1 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPortal({ portal }) {
  const [tab, setTab] = useState(0);

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", background:B.bg, borderRadius:12, overflow:"hidden", border:`1px solid ${B.border}` }}>
      {/* Browser bar */}
      <div style={{ background:"#2d2d2d", padding:"6px 12px", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <div style={{ display:"flex", gap:4 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }} />)}
        </div>
        <div style={{ flex:1, background:"#3d3d3d", borderRadius:5, padding:"3px 10px", fontSize:10, color:"#999", textAlign:"center" }}>
          wcahub.com{portal.route}
        </div>
      </div>

      {/* Sidebar + content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {/* Mini sidebar */}
        <div style={{ width:140, background:portal.id==="landing"?B.white:portal.color, display:"flex", flexDirection:"column", padding:"12px 0", flexShrink:0 }}>
          {portal.id === "landing" ? (
            <div style={{ padding:"0 12px" }}>
              <div style={{ fontSize:12, fontWeight:800, color:B.primary, marginBottom:12 }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
              {["Programas","Metodología","Precios","Testimonios"].map(l => (
                <div key={l} style={{ fontSize:9, color:B.textSec, padding:"5px 0", borderBottom:`1px solid ${B.borderLight}` }}>{l}</div>
              ))}
              <div style={{ marginTop:10, padding:"7px 10px", background:B.primary, borderRadius:7, fontSize:10, color:"#fff", fontWeight:600, textAlign:"center" }}>Comenzar gratis</div>
            </div>
          ) : (
            <>
              <div style={{ padding:"0 12px 10px", borderBottom:"1px solid rgba(255,255,255,.1)", marginBottom:6 }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#fff" }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
                <div style={{ fontSize:7, color:"rgba(255,255,255,.4)", letterSpacing:1, textTransform:"uppercase", marginTop:2 }}>{portal.role}</div>
              </div>
              {portal.sections.map((s,i) => (
                <button key={i} onClick={() => setTab(i)} style={{
                  display:"flex", alignItems:"center", gap:7, padding:"7px 12px", border:"none",
                  background: tab===i ? "rgba(255,255,255,.15)" : "transparent",
                  color: tab===i ? "#fff" : "rgba(255,255,255,.5)",
                  fontSize:10, cursor:"pointer", textAlign:"left",
                  borderLeft:`2px solid ${tab===i ? B.secondary : "transparent"}`,
                  fontFamily:"'DM Sans','Segoe UI',sans-serif", fontWeight: tab===i?600:400,
                }}>
                  {s}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Content area */}
        <div style={{ flex:1, overflow:"auto", background:B.bg, padding:12 }}>
          <MockContent portal={portal} section={portal.sections[tab]} />
        </div>
      </div>
    </div>
  );
}

function MockContent({ portal, section }) {
  const cards = (n, color, height=40) => Array.from({length:n},(_,i) => (
    <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:8, height, marginBottom:6, padding:"8px 10px", display:"flex", gap:8, alignItems:"center" }}>
      <div style={{ width:height*0.5, height:height*0.5, borderRadius:4, background:`${color}20`, flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ height:7, background:`${color}30`, borderRadius:3, marginBottom:4, width:["80%","60%","70%","50%","75%"][i%5] }} />
        <div style={{ height:5, background:B.borderLight, borderRadius:3, width:"40%" }} />
      </div>
      <div style={{ width:40, height:14, borderRadius:10, background:`${color}15` }} />
    </div>
  ));

  const statsRow = (items) => (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${items.length},1fr)`, gap:8, marginBottom:10 }}>
      {items.map(([v,l,c],i) => (
        <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:8, padding:"10px 12px", borderTop:`2px solid ${c}` }}>
          <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
          <div style={{ fontSize:9, color:B.textSec, marginTop:2 }}>{l}</div>
        </div>
      ))}
    </div>
  );

  const chart = (color, h=60) => (
    <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:8, padding:10, marginBottom:8 }}>
      <div style={{ height:7, background:B.borderLight, borderRadius:3, marginBottom:8, width:"30%" }} />
      <svg width="100%" height={h} viewBox={`0 0 200 ${h}`} preserveAspectRatio="none">
        <defs><linearGradient id={`g${color.replace("#","")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2}/><stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient></defs>
        {(() => {
          const pts = [20,45,35,55,40,65,50,70,60,80,55,75].map((v,i)=>({ x:i*(200/11), y:h-4-(v/100)*(h-10) }));
          const line = pts.map(p=>`${p.x},${p.y}`).join(" ");
          const area = `M${pts[0].x},${pts[0].y} ${pts.slice(1).map(p=>`L${p.x},${p.y}`).join(" ")} L200,${h} L0,${h} Z`;
          return (<><path d={area} fill={`url(#g${color.replace("#","")})`}/><polyline points={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"/></>);
        })()}
      </svg>
    </div>
  );

  const table = (color, rows=4) => (
    <div style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:8, overflow:"hidden", marginBottom:8 }}>
      <div style={{ background:B.bg, display:"flex", gap:0 }}>
        {["Nombre","Nivel","Estado",""].map((h,i) => <div key={i} style={{ flex:i===3?0:1, padding:"6px 8px", fontSize:8, fontWeight:600, color:B.textSec, minWidth:i===3?30:0 }}>{h}</div>)}
      </div>
      {Array.from({length:rows},(_,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", borderTop:`1px solid ${B.borderLight}` }}>
          <div style={{ flex:1, padding:"6px 8px" }}><div style={{ height:7, background:`${color}20`, borderRadius:2, width:"70%" }}/></div>
          <div style={{ flex:1, padding:"6px 8px" }}><div style={{ height:12, width:20, background:`${color}18`, borderRadius:10 }}/></div>
          <div style={{ flex:1, padding:"6px 8px" }}><div style={{ height:12, width:32, background:B.greenDim, borderRadius:10 }}/></div>
          <div style={{ minWidth:30, padding:"6px 8px" }}><div style={{ height:14, width:22, background:B.primaryDim, borderRadius:4 }}/></div>
        </div>
      ))}
    </div>
  );

  const kanban = (color) => (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:8 }}>
      {["Nuevo","Contactado","Propuesta"].map((col,ci) => (
        <div key={ci} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:8, padding:8 }}>
          <div style={{ fontSize:8, fontWeight:600, color, marginBottom:6 }}>{col} · {3-ci}</div>
          {Array.from({length:3-ci},(_,i) => (
            <div key={i} style={{ background:B.bg, borderRadius:5, padding:6, marginBottom:4, border:`1px solid ${B.border}` }}>
              <div style={{ height:6, background:`${color}30`, borderRadius:2, marginBottom:3, width:["75%","55%","65%"][i] }} />
              <div style={{ height:5, background:B.borderLight, borderRadius:2, width:"40%" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const c = portal.color;

  // Landing special case
  if (portal.id === "landing") {
    return (
      <div>
        <div style={{ background:`linear-gradient(135deg,${B.primary},${B.dark})`, borderRadius:10, padding:14, marginBottom:8 }}>
          <div style={{ height:8, background:"rgba(255,255,255,.2)", borderRadius:3, width:"60%", marginBottom:6 }} />
          <div style={{ height:12, background:"rgba(255,255,255,.3)", borderRadius:3, width:"80%", marginBottom:6 }} />
          <div style={{ height:6, background:"rgba(255,255,255,.15)", borderRadius:3, width:"70%", marginBottom:10 }} />
          <div style={{ display:"flex", gap:6 }}>
            <div style={{ height:26, flex:1, background:B.secondary, borderRadius:7 }} />
            <div style={{ height:26, flex:1, background:"rgba(255,255,255,.15)", borderRadius:7 }} />
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:8 }}>
          {[["¿Cómo funciona?",B.primary],["Programas",B.dark],["Testimonios",B.green]].map(([t,col],i)=>(
            <div key={i} style={{ background:B.white, border:`1px solid ${B.border}`, borderRadius:8, padding:10 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:`${col}20`, margin:"0 auto 6px" }} />
              <div style={{ height:6, background:`${col}30`, borderRadius:2, width:"80%", margin:"0 auto" }} />
            </div>
          ))}
        </div>
        {cards(2, B.primary, 36)}
      </div>
    );
  }

  // Per section content
  const s = section?.toLowerCase() || "";
  if (s.includes("inicio") || s.includes("resumen") || s.includes("overview") || s.includes("sistema")) {
    return (<div>{statsRow([["134","Activos",c],["$18.4k","MRR",B.green],["9","Grupos",c],["4","En riesgo",B.red]])}{chart(c)}{cards(3,c,38)}</div>);
  }
  if (s.includes("estudiante") || s.includes("alumno")) {
    return (<div>{statsRow([["134","Total",c],["4","At-risk",B.red],["85%","Asist.",B.green]])}{table(c,5)}</div>);
  }
  if (s.includes("grupo")) {
    return (<div>{statsRow([["9","Grupos",c],["134","Alumnos",B.primary],["85%","Ocup.",B.amber]])}{cards(4,c,44)}</div>);
  }
  if (s.includes("pago") || s.includes("cobro") || s.includes("historial") || s.includes("pendiente")) {
    return (<div>{statsRow([["$18.4k","Cobrado",c],[3+"","Pend.",B.amber],[2+"","Vencidos",B.red]])}{cards(4,c,40)}</div>);
  }
  if (s.includes("pipeline") || s.includes("lead") || s.includes("crm")) {
    return (<div>{statsRow([["37","Leads",c],["9","Conv.",B.green],["33%","Tasa",B.amber]])}{kanban(c)}</div>);
  }
  if (s.includes("examen") || s.includes("exam")) {
    return (<div>{statsRow([["78%","Aprobación",c],["1.8","Intentos avg",B.amber],[4+"","Bloqueados",B.red]])}{table(c,4)}</div>);
  }
  if (s.includes("contenido") || s.includes("unidad") || s.includes("banco")) {
    return (<div>{statsRow([["12","Unidades",c],["8","Publicadas",B.green],["4","Pendientes",B.amber]])}{cards(4,c,38)}</div>);
  }
  if (s.includes("asistencia")) {
    return (<div>{statsRow([["85%","Promedio",B.green],["9","Sesiones",c],["1","Pend.",B.amber]])}{chart(c,50)}{cards(2,c,34)}</div>);
  }
  if (s.includes("report") || s.includes("reporte")) {
    return (<div>{chart(c,70)}{chart(B.green,50)}{cards(2,c,32)}</div>);
  }
  if (s.includes("ciclo")) {
    return (<div>{statsRow([["U9/12","A1",c],["U6/12","A2",B.dark],["U9/12","B1",B.green]])}{chart(c,60)}</div>);
  }
  if (s.includes("precio") || s.includes("precio") || s.includes("precio")) {
    return (<div>{cards(4,c,50)}</div>);
  }
  if (s.includes("integra")) {
    return (<div>{cards(7,c,44)}</div>);
  }
  if (s.includes("beca") || s.includes("scholarship")) {
    return (<div>{statsRow([["2","Becados",c],["1","Elegible",B.amber]])}{cards(2,c,60)}</div>);
  }
  if (s.includes("revenue") || s.includes("mrr") || s.includes("ingreso")) {
    return (<div>{statsRow([["$18.4k","MRR",c],["$221k","ARR",B.green],["$94","ARPU",B.amber]])}{chart(c,80)}</div>);
  }
  if (s.includes("retenc") || s.includes("cohorte") || s.includes("churn")) {
    return (<div>{statsRow([["4.8%","Churn",B.red],["83%","M3",c],["67%","M6",B.amber]])}{cards(3,c,36)}</div>);
  }
  if (s.includes("canal") || s.includes("adquisición")) {
    return (<div>{statsRow([["407","Leads",c],["33%","Conv.",B.green],["$47","CAC",B.amber]])}{table(c,5)}</div>);
  }
  if (s.includes("académ") || s.includes("rendimiento")) {
    return (<div>{statsRow([["85%","Asist.",B.green],["78%","Aprobación",c]])}{chart(c,60)}{table(c,3)}</div>);
  }
  // Default
  return (<div>{statsRow([[" ","",c],[" ","",B.green],[" ","",B.amber]])}{cards(4,c,40)}</div>);
}

export default function PlatformPreview() {
  const [selected, setSelected] = useState("landing");
  const [hoveredFlow, setHoveredFlow] = useState(null);
  const [tab, setTab] = useState("portales"); // portales | flujo | mapa

  const portal = PORTALS.find(p=>p.id===selected);

  return (
    <div style={{ height:"100%", background:B.dark, fontFamily:"'DM Sans','Segoe UI',sans-serif", display:"flex", flexDirection:"column", borderRadius:16, overflow:"hidden" }}>

      {/* TOP BAR */}
      <div style={{ background:"#0a2535", padding:"0 20px", height:52, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#fff", letterSpacing:-0.5 }}>WCA <span style={{ color:B.secondary }}>Hub</span></div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", letterSpacing:1 }}>PLATFORM PREVIEW · 10 MÓDULOS</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[
            { id:"portales", label:"📁 Portales" },
            { id:"flujo",    label:"🔗 Flujo operativo" },
            { id:"mapa",     label:"🗺 Mapa de rutas" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"5px 14px", border:`1px solid ${tab===t.id?"rgba(255,187,35,.5)":"rgba(255,255,255,.1)"}`, borderRadius:8, background: tab===t.id?"rgba(255,187,35,.12)":"transparent", color: tab===t.id?B.secondary:"rgba(255,255,255,.4)", fontSize:10, cursor:"pointer", fontFamily:"inherit", fontWeight:tab===t.id?600:400 }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ fontSize:10, background:"rgba(5,150,105,.15)", color:B.green, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>✅ 10 módulos listos</div>
          <div style={{ fontSize:10, background:"rgba(255,187,35,.15)", color:B.secondary, padding:"3px 10px", borderRadius:20, fontWeight:600 }}>5 835 líneas</div>
        </div>
      </div>

      {/* PORTALES TAB */}
      {tab === "portales" && (
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Left: portal list */}
          <div style={{ width:310, borderRight:"1px solid rgba(255,255,255,.06)", overflow:"auto", padding:12, background:"#0d1f2d", flexShrink:0 }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", letterSpacing:1, textTransform:"uppercase", marginBottom:10, padding:"0 4px" }}>Selecciona un módulo</div>
            {PORTALS.map(p => (
              <PortalCard key={p.id} portal={p} selected={selected===p.id} onClick={() => setSelected(p.id)} />
            ))}
            <div style={{ height:8 }} />
          </div>

          {/* Right: mock portal */}
          <div style={{ flex:1, padding:14, display:"flex", flexDirection:"column", gap:10, overflow:"hidden" }}>

            {/* Header strip */}
            <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)", borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
              <div style={{ fontSize:22 }}>{portal.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{portal.label}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:1 }}>{portal.desc}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {portal.sections.map((s,i) => (
                  <div key={i} style={{ fontSize:8, padding:"2px 8px", borderRadius:20, background:`${portal.color}20`, color:"rgba(255,255,255,.5)", fontWeight:500 }}>{s}</div>
                ))}
              </div>
            </div>

            {/* Portal mock */}
            <div style={{ flex:1, overflow:"hidden" }}>
              <MockPortal portal={portal} />
            </div>
          </div>
        </div>
      )}

      {/* FLUJO TAB */}
      {tab === "flujo" && (
        <div style={{ flex:1, padding:20, overflow:"auto" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:20, textAlign:"center" }}>Flujo completo de operación — de prospecto a graduado</div>

          {/* Flow diagram */}
          <div style={{ display:"flex", flexDirection:"column", gap:0, maxWidth:700, margin:"0 auto" }}>
            {FLOW.map((f,i) => (
              <div key={i} onMouseEnter={() => setHoveredFlow(i)} onMouseLeave={() => setHoveredFlow(null)}
                style={{ display:"flex", alignItems:"center", opacity: hoveredFlow===null||hoveredFlow===i?1:.3, transition:"opacity .2s" }}>
                <div style={{ flex:1, background: hoveredFlow===i?f.color+"30":"rgba(255,255,255,.04)", border:`1px solid ${hoveredFlow===i?f.color:"rgba(255,255,255,.08)"}`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, transition:"all .2s" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:f.color+"20", border:`1.5px solid ${f.color}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:14 }}>{PORTALS.find(p=>p.label.includes(f.from.split(" ")[0]))||{icon:"👤"} ?.icon || "👤"}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{f.from}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,.4)" }}>origen</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flex:2 }}>
                    <div style={{ flex:1, height:1, background:f.color+"40" }} />
                    <div style={{ fontSize:9, padding:"3px 10px", borderRadius:20, background:f.color+"20", color:f.color, fontWeight:600, whiteSpace:"nowrap", border:`1px solid ${f.color}30` }}>{f.via}</div>
                    <div style={{ flex:1, height:1, background:f.color+"40" }} />
                    <div style={{ color:f.color, fontSize:14 }}>→</div>
                  </div>
                  <div style={{ flex:1, textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{f.to}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,.4)" }}>destino</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Role matrix */}
          <div style={{ maxWidth:700, margin:"20px auto 0" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", letterSpacing:1, textTransform:"uppercase", marginBottom:12, textAlign:"center" }}>Roles y sus portales</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
              {[
                { role:"Estudiante", portals:["Portal Estudiante","Onboarding"], color:B.primary },
                { role:"Docente",    portals:["Portal Docente"],                 color:"#92400e" },
                { role:"Admin",      portals:["Dashboard Admin","Super Admin"], color:B.dark },
                { role:"Ventas",     portals:["CRM Ventas"],                    color:B.green },
                { role:"Cobros",     portals:["Gestor Cobros"],                 color:"#92400e" },
                { role:"Coord.",     portals:["Coord. Académica"],              color:B.primary },
                { role:"Directivos", portals:["Dashboard BI"],                  color:"#3c3489" },
                { role:"Marketing",  portals:["Dashboard BI","CRM (read)"],     color:B.amber },
                { role:"IT",         portals:["Super Admin (parcial)"],         color:B.dark },
                { role:"Soporte",    portals:["Admin (parcial)"],               color:B.green },
              ].map((r,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${r.color}30`, borderRadius:9, padding:"10px 10px" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:r.color, marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>{r.role}</div>
                  {r.portals.map(p => (
                    <div key={p} style={{ fontSize:8, color:"rgba(255,255,255,.5)", padding:"2px 0", display:"flex", gap:4 }}>
                      <span style={{ color:r.color }}>→</span>{p}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAPA TAB */}
      {tab === "mapa" && (
        <div style={{ flex:1, padding:20, overflow:"auto" }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", marginBottom:20, textAlign:"center" }}>Mapa completo de rutas — wcahub.com</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, maxWidth:800, margin:"0 auto" }}>
            <div>
              <div style={{ fontSize:9, color:B.secondary, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Rutas MVP — Diseñadas ✅</div>
              {[
                { route:"/",                   module:"Landing + Placement Test + Autoinscripción",  role:"Público",    color:B.green },
                { route:"/portal",             module:"Portal del Estudiante (7 secciones)",          role:"Estudiante", color:B.primary },
                { route:"/portal/onboarding",  module:"Onboarding Wizard (primer acceso)",            role:"Estudiante", color:"#7c3aed" },
                { route:"/docente",            module:"Portal del Docente (6 secciones)",             role:"Docente",    color:"#92400e" },
                { route:"/admin",              module:"Dashboard Admin (8 secciones)",                role:"Admin",      color:B.dark },
                { route:"/super",              module:"Super Admin (10 módulos)",                     role:"SuperAdmin", color:"#2d1b69" },
                { route:"/crm",                module:"CRM de Ventas (4 vistas)",                     role:"Ventas",     color:B.green },
                { route:"/cobros",             module:"Gestor de Cobros (7 secciones)",               role:"Cobros",     color:"#92400e" },
                { route:"/coordinacion",       module:"Coordinación Académica (8 secciones)",         role:"Coord.",     color:B.primary },
                { route:"/bi",                 module:"Dashboard BI (5 vistas)",                      role:"Directivos", color:"#3c3489" },
              ].map((r,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 10px", border:`1px solid ${r.color}30`, borderRadius:8, marginBottom:5, background:`${r.color}08`, cursor:"pointer" }}
                  onClick={() => { setSelected(PORTALS.find(p=>p.route===r.route.split("/")[1]||r.route==="/"&&p.id==="landing"||p.route===r.route)?.id || PORTALS[0].id); setTab("portales"); }}>
                  <code style={{ fontSize:10, color:r.color, fontWeight:700, minWidth:130, flexShrink:0 }}>{r.route}</code>
                  <div style={{ flex:1, fontSize:10, color:"rgba(255,255,255,.6)" }}>{r.module}</div>
                  <span style={{ fontSize:8, padding:"1px 7px", borderRadius:20, background:`${r.color}20`, color:r.color, fontWeight:600, flexShrink:0 }}>{r.role}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Rutas Fase 2 — Especificadas ○</div>
              {[
                { route:"/contabilidad",   module:"Portal Contabilidad",       color:B.amber },
                { route:"/marketing",      module:"Dashboard Marketing",        color:B.amber },
                { route:"/soporte",        module:"Portal Soporte",             color:B.amber },
                { route:"/empresa",        module:"Portal B2B Empresa",         color:B.amber },
                { route:"/verify/:code",   module:"Verificación certificados", color:B.amber },
              ].map((r,i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"7px 10px", border:"1px solid rgba(255,255,255,.06)", borderRadius:8, marginBottom:5, opacity:.5 }}>
                  <code style={{ fontSize:10, color:B.amber, fontWeight:700, minWidth:130 }}>{r.route}</code>
                  <div style={{ flex:1, fontSize:10, color:"rgba(255,255,255,.4)" }}>{r.module}</div>
                  <span style={{ fontSize:8, padding:"1px 7px", borderRadius:20, background:"rgba(255,187,35,.1)", color:B.amber, fontWeight:600 }}>Fase 2</span>
                </div>
              ))}

              {/* Stack tech summary */}
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Stack tecnológico recomendado</div>
                {[
                  { layer:"Frontend",  tech:"React + Tailwind + react-router-dom",     color:B.primary },
                  { layer:"Backend",   tech:"Node.js + Express / Django REST",          color:B.green },
                  { layer:"Base datos",tech:"PostgreSQL + Redis",                        color:"#92400e" },
                  { layer:"Auth",      tech:"Microsoft 365 SSO (MSAL)",                 color:B.dark },
                  { layer:"Pagos",     tech:"Stripe Subscriptions + Webhooks",          color:"#2d1b69" },
                  { layer:"Video",     tech:"Microsoft Stream (principal) + Bunny.net", color:"#3c3489" },
                  { layer:"Notif.",    tech:"Twilio WhatsApp + SendGrid + BullMQ",      color:B.amber },
                  { layer:"Deploy",    tech:"Vercel (front) + Railway/Render (back)",   color:B.green },
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 8px", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
                    <div style={{ fontSize:9, color:s.color, fontWeight:600, width:70, flexShrink:0 }}>{s.layer}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,.5)" }}>{s.tech}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary footer */}
          <div style={{ maxWidth:800, margin:"16px auto 0", background:"rgba(255,187,35,.08)", border:"1px solid rgba(255,187,35,.2)", borderRadius:10, padding:"12px 16px", display:"flex", gap:16, justifyContent:"center" }}>
            {[["10","Portales diseñados"],["36","Secciones de spec"],["26","Entidades en ERD"],["5 835","Líneas de código"],["0","Pendientes abiertos"]].map(([v,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:800, color:B.secondary }}>{v}</div>
                <div style={{ fontSize:8, color:"rgba(255,255,255,.4)", marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
