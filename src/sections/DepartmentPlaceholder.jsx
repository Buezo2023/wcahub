// ─── DepartmentPlaceholder ─────────────────────────────────────
// Used for departments that are planned but not yet implemented.
// Shows a structured overview without fake data.
import { useState } from "react";

const P = "#155266", PD = "#e8f3f6", Y = "#ffbb23";

export function DepartmentPlaceholder({ dept }) {
  const DEPTS = {
    admisiones: {
      icon: "ti-user-check",
      title: "Admisiones & Matrícula",
      description: "Gestión del proceso de preinscripción, matrícula y activación de nuevos estudiantes.",
      status: "En preparación",
      features: [
        { icon:"ti-clipboard-list", label:"Preinscripciones pendientes",   desc:"Estudiantes registrados que aún no completaron el pago." },
        { icon:"ti-credit-card",    label:"Matrículas por confirmar",       desc:"Matrículas en estado pending aguardando comprobante." },
        { icon:"ti-users",          label:"Pendientes de asignación",       desc:"Estudiantes activos sin grupo asignado." },
        { icon:"ti-file-check",     label:"Registros incompletos",          desc:"Perfiles creados sin datos completos." },
        { icon:"ti-calendar-plus",  label:"Asignación de grupos",           desc:"Asignar estudiante a grupo disponible según nivel." },
      ],
      tech: "Requiere vista combinada de enrollments(status=pending) + payments(status=pending) + groups(capacity).",
    },
    soporte: {
      icon: "ti-headset",
      title: "Soporte Estudiantil",
      description: "Centro de atención para problemas de acceso, LMS, pagos y escalamiento interno.",
      status: "En preparación",
      features: [
        { icon:"ti-ticket",         label:"Tickets de soporte",             desc:"Registro y seguimiento de problemas estudiantiles." },
        { icon:"ti-lock-open",      label:"Problemas de acceso",            desc:"Credenciales, portal bloqueado o sin matrícula activa." },
        { icon:"ti-device-laptop",  label:"Problemas LMS",                  desc:"Actividades no cargando, progreso no guardado." },
        { icon:"ti-credit-card",    label:"Problemas de pago",              desc:"Comprobante rechazado, pago no reflejado." },
        { icon:"ti-arrow-forward",  label:"Escalamiento",                   desc:"Derivar a Cobros, Coordinación o IT según el caso." },
      ],
      tech: "Requiere tabla tickets con status, category, priority, assigned_to. Integración con canal WhatsApp/email.",
    },
    tecnologia: {
      icon: "ti-code",
      title: "Tecnología & Producto",
      description: "Estado de servicios, seguimiento de bugs, roadmap del producto y solicitudes de mejora.",
      status: "En preparación",
      features: [
        { icon:"ti-activity-heartbeat", label:"Estado de servicios",        desc:"Supabase, Vercel, Stripe, Microsoft Teams — uptime en vivo." },
        { icon:"ti-bug",                label:"Bugs reportados",            desc:"Issues activos con prioridad, asignado y estado." },
        { icon:"ti-map-2",              label:"Roadmap del producto",        desc:"Funcionalidades planificadas por sprint y fase." },
        { icon:"ti-plug",               label:"Integraciones activas",       desc:"Estado de conexiones con servicios externos." },
        { icon:"ti-message-2",          label:"Solicitudes de mejora",       desc:"Sugerencias del equipo priorizadas." },
      ],
      tech: "Requiere integración con estado de servicios (Supabase/Vercel status APIs) y sistema de issues.",
    },
    alianzas: {
      icon: "ti-building-estate",
      title: "Alianzas & Empleabilidad",
      description: "Empresas aliadas, oportunidades de trabajo remoto, pasantías y matching de egresados.",
      status: "En preparación",
      features: [
        { icon:"ti-building",       label:"Empresas aliadas",               desc:"Directorio de empleadores que contratan egresados WCA." },
        { icon:"ti-briefcase",      label:"Oportunidades remotas",          desc:"Vacantes activas para Asistentes Virtuales egresados." },
        { icon:"ti-certificate",    label:"Perfiles de egresados",          desc:"Estudiantes graduados disponibles para oportunidades." },
        { icon:"ti-arrows-exchange",label:"Matching laboral",               desc:"Conectar perfil del egresado con requisitos del empleador." },
        { icon:"ti-school",         label:"Pasantías",                      desc:"Programas de práctica profesional con aliados." },
      ],
      tech: "Requiere tablas: companies, job_listings, applications. Conexión con perfiles de egresados.",
    },
  };

  const d = DEPTS[dept];
  if (!d) return null;

  return (
    <div style={{ padding:24, maxWidth:900, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
        <div style={{ width:52, height:52, background:PD, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <i className={`ti ${d.icon}`} style={{ fontSize:26, color:P }} aria-hidden="true" />
        </div>
        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)" }}>{d.title}</div>
          <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:2 }}>{d.description}</div>
        </div>
        <div style={{ marginLeft:"auto", padding:"5px 14px", background:PD, color:P, borderRadius:20, fontSize:12, fontWeight:700, border:`1px solid ${P}30` }}>
          🛠 {d.status}
        </div>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>Funciones planificadas</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12 }}>
          {d.features.map((f,i) => (
            <div key={i} style={{ background:"var(--bg-surface-subtle)", borderRadius:10, padding:"14px 16px", display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:32, height:32, background:PD, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <i className={`ti ${f.icon}`} style={{ fontSize:16, color:P }} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{f.label}</div>
                <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:18 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>Deuda técnica</div>
        <div style={{ fontSize:13, color:"var(--text-secondary)", lineHeight:1.7 }}>{d.tech}</div>
      </div>
    </div>
  );
}
