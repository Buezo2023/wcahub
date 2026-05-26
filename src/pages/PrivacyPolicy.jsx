// ─── Privacy Policy / Política de privacidad ─────────────────────
import { useNavigate } from "react-router-dom";

const P="#155266";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth:740, margin:"0 auto", padding:"40px 24px", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"var(--text-primary,#0f172a)", lineHeight:1.8 }}>
      <button onClick={()=>navigate(-1)} style={{ background:"none",border:"none",cursor:"pointer",color:P,fontSize:13,fontFamily:"inherit",marginBottom:24,padding:0,display:"flex",alignItems:"center",gap:6 }}>
        ← Volver
      </button>

      <div style={{ fontSize:11,fontWeight:700,color:P,textTransform:"uppercase",letterSpacing:.8,marginBottom:6 }}>
        World Connect Academy
      </div>
      <h1 style={{ fontSize:28,fontWeight:800,color:P,marginBottom:4,lineHeight:1.2 }}>
        Política de Privacidad
      </h1>
      <p style={{ fontSize:13,color:"#64748b",marginBottom:32 }}>
        Última actualización: {new Date().toLocaleDateString("es-HN",{day:"2-digit",month:"long",year:"numeric"})}
      </p>

      {[
        {
          title: "1. Responsable del tratamiento",
          content: `World Connect Academy (WCA), con sede en Honduras, es la entidad responsable del tratamiento de los datos personales recopilados a través de la plataforma WCA Hub (wcahub.vercel.app).\n\nContacto: info@worldconnectacademy.com`
        },
        {
          title: "2. Datos que recopilamos",
          content: `Al crear una cuenta y usar la plataforma, recopilamos:\n\n• Datos de identificación: nombre completo, dirección de correo electrónico\n• Datos de contacto: teléfono (opcional)\n• Datos académicos: programa inscrito, nivel, progreso en unidades y exámenes\n• Datos de pago: comprobantes de transferencia (no almacenamos datos de tarjetas)\n• Datos técnicos: dirección IP, tipo de dispositivo, navegador (para seguridad)\n• Datos de uso: historial de actividades completadas en el LMS, puntuaciones XP`
        },
        {
          title: "3. Finalidad del tratamiento",
          content: `Utilizamos tus datos para:\n\n• Gestionar tu acceso y cuenta en la plataforma\n• Procesar inscripciones y pagos\n• Hacer seguimiento de tu progreso académico\n• Enviarte comunicaciones relacionadas con tu programa (recordatorios de pago, evaluaciones)\n• Emitir certificados de finalización\n• Mejorar la calidad de la plataforma`
        },
        {
          title: "4. Base legal",
          content: `El tratamiento de tus datos se basa en:\n\n• Ejecución de contrato: para prestarte el servicio educativo contratado\n• Interés legítimo: para mejorar la plataforma y prevenir fraudes\n• Consentimiento: para comunicaciones de marketing (si las activamos en el futuro)`
        },
        {
          title: "5. Cookies y almacenamiento local",
          content: `Usamos las siguientes tecnologías de almacenamiento:\n\n• Sesión de autenticación (Supabase Auth): necesaria para mantener tu sesión activa. Se elimina al cerrar sesión.\n• Preferencia de tema (wca-theme): guarda si preferís modo oscuro o claro.\n• Progreso offline (wca_pending_progress): guarda temporalmente actividades completadas sin conexión para sincronizarlas al reconectarte.\n• Consentimiento de cookies (wca_cookie_consent): registra tu decisión sobre las cookies.\n\nNo usamos cookies de terceros, publicidad ni seguimiento.`
        },
        {
          title: "6. Conservación de datos",
          content: `Conservamos tus datos mientras mantengas una cuenta activa en la plataforma. Al solicitar la eliminación de tu cuenta, eliminamos tus datos personales en un plazo de 30 días, excepto los que debamos conservar por obligaciones legales (registros de transacciones por 5 años).`
        },
        {
          title: "7. Compartición de datos",
          content: `No vendemos ni alquilamos tus datos a terceros. Compartimos información únicamente con:\n\n• Supabase Inc. (infraestructura de base de datos y autenticación) — bajo contrato con cláusulas de protección de datos\n• Stripe Inc. (procesamiento de pagos, si aplica) — certificado PCI DSS\n• Resend (servicio de correo electrónico) — solo tu dirección de correo y nombre\n\nTodos los proveedores cumplen estándares internacionales de seguridad.`
        },
        {
          title: "8. Tus derechos",
          content: `Tenés derecho a:\n\n• Acceder a tus datos personales\n• Rectificar datos incorrectos\n• Solicitar la eliminación de tu cuenta y datos\n• Oponerte al tratamiento para fines de marketing\n• Portabilidad de tus datos en formato CSV\n\nPara ejercer estos derechos escribinos a: privacidad@worldconnectacademy.com`
        },
        {
          title: "9. Seguridad",
          content: `Implementamos las siguientes medidas de seguridad:\n\n• Cifrado TLS 1.3 para todas las comunicaciones\n• Autenticación con OAuth 2.0 (Google, Microsoft)\n• Políticas de acceso por rol (RLS) en base de datos\n• Headers de seguridad (HSTS, X-Frame-Options, CSP)\n• Tokens de acceso con expiración y refresh automático`
        },
        {
          title: "10. Cambios a esta política",
          content: `Si realizamos cambios materiales a esta política, te lo notificaremos por correo electrónico con al menos 15 días de anticipación. El uso continuado de la plataforma después de ese período implica la aceptación de los cambios.`
        },
      ].map(({ title, content }) => (
        <div key={title} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:P, marginBottom:8 }}>{title}</h2>
          <div style={{ fontSize:14, color:"#374151", whiteSpace:"pre-line" }}>{content}</div>
        </div>
      ))}

      <div style={{ marginTop:40, padding:"16px 20px", background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, fontSize:13, color:"#0369a1" }}>
        ¿Preguntas? Contactanos en <a href="mailto:privacidad@worldconnectacademy.com" style={{ color:"#0369a1", fontWeight:600 }}>privacidad@worldconnectacademy.com</a>
      </div>
    </div>
  );
}
