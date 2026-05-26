// ─── Terms of Use / Términos de uso ──────────────────────────────
import { useNavigate } from "react-router-dom";
const P="#155266";

export default function TermsOfUse() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth:740, margin:"0 auto", padding:"40px 24px", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"var(--text-primary,#0f172a)", lineHeight:1.8 }}>
      <button onClick={()=>navigate(-1)} style={{ background:"none",border:"none",cursor:"pointer",color:P,fontSize:13,fontFamily:"inherit",marginBottom:24,padding:0,display:"flex",alignItems:"center",gap:6 }}>
        ← Volver
      </button>
      <div style={{ fontSize:11,fontWeight:700,color:P,textTransform:"uppercase",letterSpacing:.8,marginBottom:6 }}>World Connect Academy</div>
      <h1 style={{ fontSize:28,fontWeight:800,color:P,marginBottom:4,lineHeight:1.2 }}>Términos de uso</h1>
      <p style={{ fontSize:13,color:"#64748b",marginBottom:32 }}>
        Última actualización: {new Date().toLocaleDateString("es-HN",{day:"2-digit",month:"long",year:"numeric"})}
      </p>

      {[
        { title:"1. Aceptación", content:`Al crear una cuenta en WCA Hub, aceptás estos términos en su totalidad. Si no estás de acuerdo, no utilices la plataforma.\n\nWorld Connect Academy (WCA) se reserva el derecho de modificar estos términos con previo aviso de 15 días.` },
        { title:"2. Uso de la plataforma", content:`WCA Hub es una plataforma educativa de uso exclusivo para estudiantes y personal de World Connect Academy.\n\nTe comprometés a:\n• No compartir tus credenciales de acceso\n• No reproducir, distribuir ni comercializar el contenido educativo de la plataforma\n• No intentar acceder a cuentas o datos de otros usuarios\n• Usar la plataforma únicamente para fines educativos` },
        { title:"3. Propiedad intelectual", content:`Todo el contenido de la plataforma (videos, materiales, ejercicios, evaluaciones) es propiedad de World Connect Academy o de sus licenciantes (Oxford University Press para los materiales Wide Angle).\n\nSe te otorga una licencia personal, no exclusiva e intransferible para acceder al contenido mientras dure tu matrícula activa.` },
        { title:"4. Pagos y reembolsos", content:`Los pagos de matrícula son mensuales y se procesan según las condiciones acordadas al inscribirte.\n\n• Los pagos no son reembolsables una vez procesados, salvo causas de fuerza mayor\n• El acceso se suspende automáticamente 15 días después del vencimiento sin pago\n• Para reactivar tu acceso, debés ponerte al día con los pagos pendientes` },
        { title:"5. Certificados", content:`Los certificados de finalización se emiten al completar el programa en su totalidad (todas las unidades y evaluaciones con nota mínima de 70%).\n\nLos certificados son válidos como constancia de formación en WCA. Para validación internacional, consultá con la coordinación académica.` },
        { title:"6. Suspensión de cuenta", content:`WCA se reserva el derecho de suspender o eliminar cuentas que:\n\n• Compartan acceso con personas no matriculadas\n• Intenten manipular el sistema de puntuaciones o XP\n• Reproduzcan o distribuyan material educativo sin autorización\n• Incumplan el código de conducta académica` },
        { title:"7. Limitación de responsabilidad", content:`WCA no se responsabiliza por:\n\n• Interrupciones del servicio por mantenimiento o fuerza mayor\n• Pérdida de progreso por problemas de conectividad del usuario\n• Decisiones laborales tomadas basadas en el contenido de la plataforma\n\nHacemos nuestro mejor esfuerzo para mantener la plataforma disponible 24/7.` },
        { title:"8. Ley aplicable", content:`Estos términos se rigen por las leyes de la República de Honduras. Cualquier disputa se someterá a la jurisdicción de los tribunales de Tegucigalpa, Honduras.` },
      ].map(({ title, content }) => (
        <div key={title} style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:16,fontWeight:700,color:P,marginBottom:8 }}>{title}</h2>
          <div style={{ fontSize:14,color:"#374151",whiteSpace:"pre-line" }}>{content}</div>
        </div>
      ))}

      <div style={{ marginTop:40, padding:"16px 20px", background:"#f0f9ff", border:"1px solid #bae6fd", borderRadius:12, fontSize:13, color:"#0369a1" }}>
        ¿Preguntas? Contactanos en <a href="mailto:info@worldconnectacademy.com" style={{ color:"#0369a1",fontWeight:600 }}>info@worldconnectacademy.com</a>
      </div>
    </div>
  );
}
