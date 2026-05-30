// ─── IntegracionesSection — Tecnología & Producto ──────────────
// ARCH-02: Estado de integraciones externas (no implementadas aún).
// Cada tarjeta documenta la fase pendiente y el estado actual.

export function IntegracionesSection() {
  const P = "#155266", PD = "#e8f3f6";
  const A = "#d97706", AD = "#fffbeb";
  const G = "#059669", GD = "#ecfdf5";
  const R = "#dc2626";

  const integrations = [
    {
      icon: "🎓",
      name: "LearnWorlds",
      role: "LMS principal — cursos, lecciones, SCORM, video, evaluaciones, progreso granular",
      status: "pending",
      statusLabel: "Pendiente de integración",
      phase: "LW-01",
      phaseLabel: "LW-01: create-user, enroll-course, progress webhook, SSO",
      note: "WCA Hub activará la matrícula en LearnWorlds automáticamente al confirmar pago.",
      color: A, colorBg: AD,
    },
    {
      icon: "📊",
      name: "Kommo",
      role: "CRM principal — leads, pipeline comercial, tareas, contactos, seguimiento de ventas",
      status: "pending",
      statusLabel: "Pendiente de integración",
      phase: "KOMMO-01",
      phaseLabel: "KOMMO-01: create-lead, webhook, stage sync, lead → matrícula",
      note: "Los leads capturados en WCA Hub se sincronizarán con Kommo como fuente de verdad comercial.",
      color: A, colorBg: AD,
    },
    {
      icon: "💳",
      name: "Stripe",
      role: "Pasarela de pago con tarjeta — checkout, webhook de confirmación automática",
      status: "config",
      statusLabel: "Pendiente de credenciales",
      phase: "STRIPE-01",
      phaseLabel: "STRIPE-01: STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET en Vercel",
      note: "El webhook de Stripe ya está implementado. Solo requiere las variables de entorno en Vercel.",
      color: A, colorBg: AD,
    },
    {
      icon: "📧",
      name: "Email institucional",
      role: "Notificaciones automáticas — bienvenida, confirmación de pago, certificados, tickets de soporte",
      status: "config",
      statusLabel: "Pendiente de dominio/correo",
      phase: "EMAIL-01",
      phaseLabel: "EMAIL-01: configurar dominio worldconnectacademy.com en Resend",
      note: "Resend está integrado en el backend. Solo requiere dominio verificado y RESEND_FROM_EMAIL activo.",
      color: A, colorBg: AD,
    },
  ];

  const stable = [
    { icon:"🎓", name:"Supabase", desc:"Base de datos, autenticación, storage y RLS. Activo en producción." },
    { icon:"⚡", name:"Vercel", desc:"Hosting, funciones serverless y deploy automático desde GitHub." },
    { icon:"📋", name:"Soporte Estudiantil", desc:"Sistema de tickets interno WCA Hub completamente funcional." },
    { icon:"🔒", name:"Auth + Roles", desc:"Sistema de sesión, PrivateRoute y permisos por rol activos." },
  ];

  return (
    <div style={{ padding:24, maxWidth:960, margin:"0 auto" }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)" }}>Tecnología & Producto</div>
        <div style={{ fontSize:13, color:"var(--text-secondary)", marginTop:4, lineHeight:1.6 }}>
          Estado de integraciones externas y módulos de plataforma. Las integraciones pendientes se activarán por fases.
        </div>
      </div>

      {/* Pending integrations */}
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>Integraciones pendientes</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(420px,1fr))", gap:16, marginBottom:28 }}>
        {integrations.map(ig => (
          <div key={ig.name} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:14, padding:20 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:12 }}>
              <div style={{ width:44, height:44, background:ig.colorBg, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{ig.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)" }}>{ig.name}</div>
                  <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:ig.colorBg, color:ig.color, fontWeight:700 }}>{ig.statusLabel}</span>
                </div>
                <div style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.5 }}>{ig.role}</div>
              </div>
            </div>
            <div style={{ background:"var(--bg-surface-subtle)", borderRadius:9, padding:"9px 12px", marginBottom:10 }}>
              <div style={{ fontSize:10, color:"var(--text-tertiary)", fontWeight:700, textTransform:"uppercase", marginBottom:3 }}>Fase</div>
              <div style={{ fontSize:12, color:"var(--text-primary)", fontFamily:"monospace" }}>{ig.phaseLabel}</div>
            </div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.6 }}>💡 {ig.note}</div>
          </div>
        ))}
      </div>

      {/* Stable components */}
      <div style={{ fontSize:12, fontWeight:700, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>Infraestructura activa</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
        {stable.map(s => (
          <div key={s.name} style={{ background:"var(--bg-surface)", border:`1px solid ${G}30`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:18 }}>{s.icon}</span>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>{s.name}</span>
              <span style={{ fontSize:9, padding:"2px 6px", borderRadius:20, background:GD, color:G, fontWeight:700, marginLeft:"auto" }}>ACTIVO</span>
            </div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
