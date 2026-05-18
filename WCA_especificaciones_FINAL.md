# WCA Academy — Especificaciones del sistema
### Versión FINAL · Mayo 2026 · Lista para desarrollo

---

## Resumen ejecutivo

Plataforma web SaaS de gestión académica para WCA Academy, academia de idiomas 100% remota con sede en Honduras y estudiantes de todo el mundo. Metodología de matrícula continua con ciclos de 12 semanas, gamificación integrada, autoinscripción sin intervención administrativa y control total desde un panel de Super Admin.

**Stack recomendado**
- Frontend: React + Tailwind CSS (PWA-ready)
- Backend: Node.js / Django con API REST
- Base de datos: PostgreSQL
- Pagos: Stripe (tarjeta + suscripciones recurrentes)
- Almacenamiento: AWS S3 o Cloudflare R2
- Hosting: Vercel / Railway / Render
- Notificaciones: Twilio (WhatsApp + SMS) + SendGrid (email)
- Video en vivo: Zoom API o Google Meet API

---

## 1. Productos y precios

Todos los precios son editables en tiempo real desde el panel de Super Admin sin tocar código.

| Producto | Precio | Ciclo de cobro | Clases en vivo | Plataforma 24/7 | Certificado |
|---|---|---|---|---|---|
| Inglés completo | $95 | Mensual | ✓ | ✓ | ✓ A1–C1 |
| Asistente Virtual (VA) | $75 | Mensual | ✓ | ✓ | ✓ VA |
| Inglés + VA | $170 | Mensual | ✓ | ✓ | ✓ Ambos |
| Beca Inglés | $50 | Trimestral | ✓ | ✗ | Con restricción |

### Reglas de precios
- Un cambio de precio solo aplica a nuevas inscripciones y renovaciones futuras
- Los estudiantes activos conservan su precio hasta notificación explícita
- El Super Admin puede crear cupones y descuentos con fecha de expiración
- El leaderboard mensual de gamificación puede generar descuentos automáticos (% configurable por Super Admin)

---

## 2. Roles y permisos

### 2.1 Tabla de roles

| Rol | N.º usuarios | Descripción |
|---|---|---|
| **Super Admin** | 1–2 | Control total: precios, roles, ciclos, integraciones, auditoría global |
| **Admin** | 2–4 | Gestión operativa completa. Sin config técnica ni contabilidad profunda |
| **Contabilidad** | 1–2 | Visibilidad financiera total. Solo lectura de cobros del gestor |
| **Coord. académica** | 2–4 | Cursos, grupos, horarios, docentes, cambios de plan de estudiantes |
| **Gestor de cobros** | 1–3 | Registra, corrige y anula pagos autónomamente. Log visible para Contabilidad |
| **Docente** | N | Sus grupos: asistencia, calificaciones, control de intentos de examen |
| **IT** | 1–2 | Config técnica, roles, logs, backups. Sin acceso a datos del negocio |
| **Estudiante** | Todos | Portal dinámico según programas matriculados |

### 2.2 Regla de oro
> Mínimo privilegio necesario. El gestor anula pagos solo; contabilidad solo observa. El coordinador mueve estudiantes entre planes; el docente solo ve sus grupos.

---

## 3. Programas académicos

### 3.1 Programa de Inglés
- **Marco:** CEFR (Marco Común Europeo de Referencia para las Lenguas)
- **Niveles:** A1 → A2 → B1 → B2 → C1
- **Estructura por nivel:** 12 unidades (1 unidad = 1 semana)
- **Metodología:** Matrícula continua — el ciclo corre independientemente de los alumnos
- **Clases en vivo:** Lunes, miércoles y viernes por horario asignado
- **Práctica:** Plataforma disponible 24/7

### 3.2 Programa Asistente Virtual Bilingüe (VA)
- **Módulos:** 4
- **Certificado:** WCA Asistente Virtual Bilingüe
- **Requisito de ingreso:** Ninguno — inscripción abierta
- **Progreso:** Independiente del programa de Inglés

### 3.3 Programa de Becas
- **Precio:** $50 cada 3 meses (ciclo trimestral vía Stripe)
- **Incluye:** Clases en vivo únicamente
- **Excluye:** Plataforma 24/7, ejercicios, exámenes digitales
- **Control:** Registrado en el sistema (asistencia visible, sin contenido)
- **Evaluación:** A definir (examen oral/Zoom o solo asistencia)
- **Upgrade a plan completo:**
  - Lo ejecuta el Coordinador académico desde el Admin
  - Al hacer el cambio, el sistema activa acceso a plataforma desde la **unidad donde ya va** el estudiante
  - El historial de asistencia se conserva
  - No reinicia el ciclo

### 3.4 Combinaciones de matrícula

| Opción | Portal muestra |
|---|---|
| Solo Inglés | Solo programa inglés |
| Solo VA | Solo programa VA |
| Inglés + VA | Ambos programas, progreso independiente |
| Beca | Solo clases en vivo y asistencia |

---

## 4. Metodología del ciclo continuo

### 4.1 El "reloj global" por nivel
- Cada nivel tiene un ciclo de 12 unidades que avanza cada lunes automáticamente
- El ciclo es global para el nivel — no depende de cuántos alumnos haya
- Al llegar a la unidad 12, el sistema reinicia automáticamente a la unidad 1 el lunes siguiente
- Este reloj se activa una sola vez por nivel desde el Super Admin

### 4.2 Ingreso de nuevo estudiante
1. Autoinscripción o Admin asigna nivel
2. El sistema detecta la unidad activa ese lunes
3. Matricula al estudiante desde esa unidad
4. El estudiante completa hasta la U12 y en el siguiente ciclo retoma desde la U1
5. Al completar todas las unidades → sube de nivel automáticamente

### 4.3 Ejemplo práctico
> Estudiante ingresa en semana 8 → cursa U8 a U12 (5 unidades) → siguiente ciclo cursa U1 a U7 (7 unidades) → completa el nivel → sube a A2 automáticamente.

### 4.4 Horarios y docentes
- Cada docente se asigna a **un nivel específico** con **múltiples franjas horarias**
- Ejemplo: José / A1 / Lunes-Miércoles-Viernes: 6–7 PM, 7–8 PM, 8–9 PM, 9–10 PM
- Al subir de nivel, el estudiante elige horario disponible del nivel nuevo (self-service con cupos)
- **El estudiante puede cambiar de horario por su cuenta** desde su portal, sujeto a cupos disponibles

---

## 5. Sistema de exámenes y desbloqueo

| Parámetro | Valor |
|---|---|
| Intentos por examen | 3 máximo |
| Nota mínima aprobatoria | 70% |
| Intentos extra | Solo el docente puede habilitarlos |
| Desbloqueo de siguiente unidad | Automático al aprobar |
| Desbloqueo de siguiente nivel | Automático al aprobar U12 con ≥70% |
| Acceso al contenido | 24/7 |

### Flujo semanal completo
```
Lunes → Clase en vivo (docente + grupo)
Lunes–Domingo → Práctica 24/7 (videos, ejercicios, flashcards, diálogos)
Cualquier momento → Examen final de unidad (máx. 3 intentos)
Al aprobar ≥70% → Desbloqueo automático siguiente unidad
Al aprobar U12 ≥70% → Sube de nivel + certificado generado
```

### Gestión de intentos agotados
Cuando el estudiante agota sus 3 intentos:
1. Sistema bloquea el acceso a nuevos intentos
2. Notificación automática al docente
3. El docente decide: habilitar intento extra, reiniciar unidad o contactar al estudiante

---

## 6. Placement Test

- **Alcance:** Solo programa de Inglés (VA no requiere test)
- **Marco:** CEFR — inglés general
- **Duración:** ~20 minutos
- **Preguntas:** 20 (vocabulario, gramática, comprensión lectora, uso en contexto)
- **Pregunta abierta final:** "¿Por qué quieres aprender inglés?" — no afecta el nivel; contexto para el docente
- **Resultado:** Asignación automática de nivel

| Correctas | Nivel |
|---|---|
| 0–3 | A1 Principiante |
| 4–7 | A2 Básico |
| 8–11 | B1 Intermedio |
| 12–15 | B2 Intermedio alto |
| 16–20 | C1 Avanzado |

- El estudiante puede aceptar el nivel sugerido o cambiarlo manualmente

---

## 7. Flujo de autoinscripción

Sin intervención del Admin en ningún paso.

```
1. Registro (nombre, correo, contraseña)
2. Placement Test → nivel sugerido (solo Inglés)
3. Selección de programa(s)
4. Selección de horario (cupos en tiempo real)
5. Datos personales
6. Pago
7. Activación automática → acceso inmediato al portal
```

Admin recibe notificación informativa. No ejecuta ninguna acción.

---

## 8. Flujos de pago

### 8.1 Tarjeta — Stripe (activación automática)
```
Estudiante paga → Stripe procesa → Webhook payment_intent.succeeded
→ Sistema activa cuenta → Matricula en ciclo activo
→ Asigna horario elegido → Correo + WhatsApp de bienvenida
```
- Sin intervención humana. Activa en segundos.
- Stripe Subscriptions para cobros mensuales/trimestrales automáticos

### 8.2 Transferencia bancaria (confirmación manual)
```
Estudiante elige transferencia → Cuenta creada en estado "Pendiente"
→ Sistema muestra datos bancarios + código único (ej. WCA-B1-8821)
→ Estudiante transfiere y sube comprobante en el portal
→ Gestor recibe alerta → verifica en banco → confirma en sistema
→ Sistema activa cuenta → igual que Stripe desde aquí
```
- Límite de confirmación: **24 horas hábiles**
- Si no se confirma: alerta automática a gestor y Admin

### 8.3 Efectivo en sede
- Mismo flujo que transferencia
- Gestor registra cobro manualmente → activa la cuenta

### 8.4 Anulaciones y correcciones
- El Gestor de cobros puede anular y corregir pagos **de forma autónoma**
- Cada acción queda en el log de auditoría visible para Contabilidad

### 8.5 Política de reembolsos
- **Reembolso completo dentro de los primeros 7 días** desde la activación
- Después de 7 días: sin reembolso
- El reembolso lo procesa el Gestor de cobros desde el panel de Stripe
- El sistema desactiva la cuenta automáticamente al confirmar el reembolso

---

## 9. Plataforma global

### 9.1 Zonas horarias
- Todos los horarios se almacenan en **UTC** en la base de datos
- Al mostrar al estudiante, el sistema convierte al **timezone del navegador** automáticamente
- Al registrarse, el sistema detecta y sugiere el timezone; el estudiante puede ajustarlo en su perfil

### 9.2 Moneda
- **USD como moneda base** para toda la plataforma
- Stripe acepta tarjetas de +135 países en USD
- Transferencia bancaria disponible solo para Honduras

### 9.3 Métodos de pago disponibles
- Tarjeta internacional (Visa, MC, AMEX) vía Stripe
- Transferencia bancaria (Honduras)
- Efectivo en sede (Honduras)
- PayPal recomendado como futuro segundo método digital

### 9.4 Idioma de la plataforma
- **Español por defecto** para todos los usuarios
- **Inglés disponible** como alternativa, seleccionable en el perfil del estudiante
- Los estudiantes internacionales pueden configurar inglés al registrarse
- El contenido de los cursos (videos, ejercicios) puede estar en inglés independientemente del idioma de la UI

### 9.5 Cumplimiento legal
- Política de privacidad visible (obligatoria para GDPR si hay alumnos de la UE)
- Términos y condiciones con política de reembolsos
- SSL obligatorio en toda la plataforma
- Datos de tarjeta nunca en servidores de WCA (Stripe los maneja)

---

## 10. Portal del estudiante

| Sección | Contenido |
|---|---|
| **Inicio** | Bienvenida, unidad activa, próxima clase, métricas (XP, racha, avance del ciclo) |
| **Mi programa** | Lista de 12 unidades con estado y nota. Solo muestra los programas matriculados |
| **Clases en vivo** | Calendario semanal convertido a timezone del alumno. Botón de acceso activo cuando corresponde. **Cambio de horario self-service** si hay cupos |
| **Práctica 24/7** | Videos, ejercicios, flashcards, diálogos, PDFs de la unidad activa |
| **Examen** | Intentos disponibles (1/2/3), tomar examen, resultado y desbloqueo automático |
| **Mi progreso** | Ruta A1→C1, certificados descargables con QR, gráfica de rendimiento, badges ganados |
| **Pagos** | Estado de cuenta, próximo pago, historial con recibos. Política de reembolso visible |

---

## 11. Sistema de gamificación

### 11.1 Puntos XP

| Acción | XP |
|---|---|
| Asistir a clase en vivo | +50 |
| Completar práctica 24/7 | +25 |
| Aprobar examen al 1er intento | +100 |
| Nota perfecta (100%) en examen | +200 |
| Racha de 7 días activo | +150 |
| 0 faltas en el mes | +250 |
| Completar un nivel | +500 |
| Referir un amigo activo | +300 |

### 11.2 Rangos

| Rango | XP requerido |
|---|---|
| 🥉 Explorer | 0 |
| 🥈 Learner | 500 |
| 🥇 Achiever | 2,000 |
| ⭐ WCA Pro | 5,000 |

### 11.3 Badges (insignias)

| Badge | Condición |
|---|---|
| 🔥 Racha 30 días | 30 días consecutivos activo |
| 🎯 Perfección | 100% en 3 exámenes seguidos |
| ⚡ Velocidad | 5 unidades aprobadas por encima del tiempo esperado |
| 🌍 Global | Estudia desde fuera de Honduras |
| 🤝 Embajador | Refirió 5 amigos activos |
| 📅 Constancia | 6 meses sin faltar |
| 🏆 WCA Champion | Completó A1 → C1 |
| 🎓 Bilingüe | Certificado Inglés + VA completados |

### 11.4 Leaderboard mensual
- Ranking de XP dentro del grupo/nivel
- Top 3 recibe descuento en siguiente pago (% configurable por Super Admin)
- Se reinicia el primer día de cada mes

---

## 12. Certificados

- Se generan automáticamente al aprobar la U12 del nivel con ≥70%
- Cada certificado tiene un **código QR único y verificable**
- El QR apunta a una página pública de WCA con el nombre, nivel y fecha del certificado
- El estudiante puede descargarlo desde su portal en cualquier momento
- Diseño del certificado configurable desde Super Admin

---

## 13. Super Admin — Panel de control total

El Super Admin puede modificar sin tocar código:

**Productos y precios**
- Crear, editar o desactivar planes
- Cambiar precios (no afecta matrículas activas)
- Crear cupones y descuentos con fecha límite
- Configurar recompensas del leaderboard

**Academia**
- Niveles y estructura de cursos
- Iniciar / reiniciar ciclos por nivel
- Horarios globales y cupos por franja
- Diseño de certificados

**Sistema**
- Crear y gestionar roles con permisos granulares
- Configurar integraciones (Stripe, WhatsApp, Zoom)
- Plantillas de notificaciones (email y WhatsApp)
- Auditoría completa de todas las acciones del sistema
- Reportes y exportaciones globales

---

## 14. Notificaciones automáticas

| Evento | Destinatario | Canal | Timing |
|---|---|---|---|
| Nueva transferencia subida | Gestor | WhatsApp + in-app | Inmediato |
| Pago Stripe procesado | Gestor | In-app | Informativo |
| Pago sin confirmar +24h | Gestor + Admin | WhatsApp + email | Automático |
| Cuenta activada | Estudiante | WhatsApp + email | Al activar |
| Nuevo estudiante matriculado | Admin + Docente | In-app | Inmediato |
| Clase en vivo en 1 hora | Estudiante | WhatsApp | Automático |
| Examen disponible | Estudiante | In-app | Lunes |
| Examen aprobado | Estudiante | In-app | Inmediato |
| 3 intentos agotados | Docente | In-app + email | Inmediato |
| Nivel completado | Estudiante + Admin | WhatsApp + email | Automático |
| Certificado generado | Estudiante | WhatsApp + email | Automático |
| Inactividad +7 días | Coordinador | In-app | Automático |
| Pago próximo a vencer | Estudiante | WhatsApp | 3 días antes |
| Reembolso procesado | Estudiante | Email | Al confirmar |

---

## 15. Funcionalidades de crecimiento (Fase 2)

Para los primeros 3–6 meses post-lanzamiento:

1. **Integración WhatsApp Business API** (Twilio) — recordatorios de clase, pago, examen
2. **Asistencia automática** — docente toma lista; alertas por faltas consecutivas
3. **Integración Zoom / Meet** — link de clase directo en el portal del estudiante
4. **Analytics del docente** — rendimiento del grupo, alumnos en riesgo, asistencia %
5. **Sistema de retención** — alertas por inactividad, exámenes fallidos, pagos próximos
6. **Programa de referidos** — código único por estudiante, descuento automático al activar referido

## 16. Funcionalidades de escala (Fase 3)

Para cuando WCA tenga tracción consolidada:

1. **App móvil PWA** — instalable desde el navegador, push notifications, práctica offline
2. **Portal de empresas (B2B)** — cupos corporativos con dashboard de progreso de empleados
3. **Tutor IA de práctica** — chatbot en inglés 24/7 con contexto del nivel del estudiante
4. **Multi-sede / franquicia** — arquitectura multi-tenant para expansión a otras ciudades
5. **Reportes BI avanzados** — LTV, tasa de retención, proyección de ingresos, deserción por nivel

---

## 17. Preguntas pendientes menores

- [x] Evaluación del becado: solo asistencia (sin examen digital)
- [x] Bancos: BAC Credomatic, BI Honduras, Ficohsa (configurados en Super Admin → Cuentas banco)
- [x] Dominio: wcahub.com
- [x] El docente sube el contenido de sus unidades desde el Portal Docente → Contenido

---

*Documento generado en sesión de diseño con Claude — WCA Academy 2026*
*Estado: COMPLETO y listo para desarrollo*

---

## 18. Currículo — Serie Wide Angle (Oxford University Press)

### Mapeo de niveles

| Nivel WCA | Libro | Unidades | Ritmo regular | Ritmo beca |
|---|---|---|---|---|
| A1 | Wide Angle 1 | 12 unidades | 12 semanas | 6 meses |
| A2 | Wide Angle 2 | 12 unidades | 12 semanas | 6 meses |
| B1 | Wide Angle 3 | 12 unidades | 12 semanas | 6 meses ← fin beca |
| B2 | Wide Angle 4 | 12 unidades | 12 semanas | Solo plan completo |
| C1 | Wide Angle 5 | 12 unidades | 12 semanas | Solo plan completo |

### Unidades Wide Angle 1 (A1)
1. Self · 2. Things · 3. Places · 4. Life · 5. Travel · 6. Skills · 7. Reasons · 8. History · 9. Comforts · 10. Adventure · 11. Learning · 12. Activities

### Unidades Wide Angle 2 (A2)
1. Identity · 2. Relationships · 3. Responsibilities · 4. Extremes · 5. Creativity · 6. Places · 7–12. (continuación del libro)

### Unidades Wide Angle 3 (B1)
1. Interactions · 2. Time · 3. Learning · 4. Movement · 5. Home · 6. Images · 7–12. (continuación del libro)

### Unidades Wide Angle 4 (B2)
1. Achievements · 2. News · 3. Frontiers · 4. Processes · 5. Survival · 6. Trends · 7–12. (continuación del libro)

### Unidades Wide Angle 5 (C1)
1. Values · 2. Memory · 3. Discoveries · 4. Privacy · 5. Alternatives · 6. Fun · 7–12. (continuación del libro)

### Habilidades por unidad (estructura de cada unidad)
Cada unidad en la plataforma tiene actividades organizadas en 8 habilidades:
1. **Reading** — estrategia lectora + texto auténtico
2. **Listening** — estrategia auditiva + audio
3. **Speaking** — situación comunicativa real
4. **Writing** — producción escrita guiada
5. **English for Real** — lenguaje funcional en video
6. **Grammar** — reglas + práctica en contexto
7. **Vocabulary** — vocabulario temático de la unidad
8. **Pronunciation** — fonética y entonación

---

## 19. Banco de actividades

### Tipos de actividades disponibles por habilidad

| Habilidad | Tipos disponibles |
|---|---|
| Vocabulario | Flashcards, Matching, Fill in the blank, Word building |
| Gramática | Multiple choice, Error correction, Sentence rewrite, Gap fill |
| Reading | True/False, Comprehension questions, Highlight key info, Summary |
| Listening | Multiple choice, Note-taking, Dictation, Ordering |
| Speaking | Prompt cards, Role play, Record & submit, Discussion questions |
| Writing | Guided writing, Email template, Paragraph builder, Peer review |
| Pronunciación | Listen & repeat, Minimal pairs, Stress marking, Phoneme identification |

### Gestión del banco
- **Banco predeterminado:** actividades creadas por Admin alineadas a Wide Angle
- **Creación docente:** el docente puede crear actividades desde cero o basarse en las del banco
- **Admin como respaldo:** Admin puede editar, archivar o crear actividades en cualquier momento
- **Etiquetas:** toda actividad tiene nivel + unidad + habilidad + tipo + visibilidad (solo mis grupos / todos)

---

## 20. Programa de Becas — Especificaciones completas

### Reglas del programa
- Todos los becados ingresan en **A1**
- Cada nivel dura **6 meses** (~2 semanas por unidad)
- La beca cubre **A1, A2 y B1** únicamente
- Al completar B1 pueden hacer upgrade a plan completo (ejecutado por Coordinador académico)
- El upgrade preserva el progreso: el estudiante entra al ciclo activo del nivel B2 desde la unidad correspondiente

### Acceso en plataforma (becados)
- ✓ Registro en el sistema
- ✓ Asistencia registrada por el docente
- ✓ Historial visible en Admin
- ✗ Sin acceso a contenido 24/7
- ✗ Sin exámenes digitales
- ✗ Sin certificado digital (hasta upgrade)

### Formulario de ingreso a la beca
Campos requeridos para reportes de financiación y proyectos:
- Nombre completo, fecha de nacimiento, país, ciudad
- Género, ocupación, nivel educativo
- ¿Por qué aplica a la beca? (texto largo)
- ¿Cómo impactará el inglés en su vida? (texto largo)
- Rango de ingresos del hogar (USD)
- Acceso a internet (Sí / No / Limitado)
- Dispositivo disponible (PC / Laptop / Tablet / Solo móvil)

### Exportación de datos
- Contabilidad y Super Admin pueden exportar datos de becados en Excel/CSV
- Uso: reportes de impacto, presentaciones a donantes, financiación de proyectos

---

## 21. Información bancaria (transferencias)

Administrada por **Contabilidad** desde el panel de Admin. Los bancos pueden agregarse, editarse o desactivarse sin tocar código.

**Bancos iniciales:**
- BAC Credomatic
- BI (Banco de Inversiones)
- Ficohsa

**Campos por banco:** nombre del banco, número de cuenta, tipo de cuenta, nombre del titular, instrucciones adicionales.

---

## 22. Dominio

- **Dominio:** wcahub.com
- **Portal estudiante:** wcahub.com (o app.wcahub.com)
- **Admin:** admin.wcahub.com
- **Verificación certificados:** wcahub.com/verify/{codigo}

---

## 23. Decisiones finales resueltas

| Decisión | Resolución |
|---|---|
| Cambio de horario | Self-service con cupos disponibles |
| Idioma de la plataforma | Español por defecto, inglés disponible en perfil |
| Política de reembolsos | Reembolso completo en los primeros 7 días |
| Evaluación becados | Solo asistencia (no examen digital) |
| Bancos para transferencia | BAC Credomatic, BI, Ficohsa (gestionados por Contabilidad) |
| Dominio | wcahub.com |
| Contenido de unidades | Docente lo sube; Admin también puede gestionar |
| Libro de texto | Wide Angle 1–5 (Oxford University Press) |
| Banco de actividades | Predeterminado + creación desde cero por docente |

---

*Documento COMPLETO — Todas las decisiones tomadas — Listo para desarrollo*
*wcahub.com · WCA Academy 2026*

---

## 24. Respuestas de auditoría — 11 preguntas clave

| # | Pregunta | Respuesta | Implicación técnica |
|---|---|---|---|
| 1 | ¿Las clases se graban? | Sí, disponibles 7 días | Teams graba a SharePoint/OneDrive. La plataforma muestra el link de la grabación por 7 días, luego expira automáticamente |
| 2 | ¿Máximo por grupo? | 25+ estudiantes | Teams soporta grupos grandes. Definir número exacto. El sistema bloquea nuevas inscripciones al llegar al tope |
| 3 | ¿Ciclo pausa en feriados? | Sí — Admin configura calendario | Módulo de calendario de festivos en Super Admin. El reloj del ciclo respeta los días marcados como festivo |
| 4 | ¿Se puede pausar suscripción? | No — solo cancelar o seguir | Sin lógica de freeze. Al cancelar: acceso suspendido, progreso conservado. Al reactivar: acceso restaurado desde donde estaba |
| 5 | ¿Hay menores de edad? | Sí — consentimiento del tutor | Formulario de registro detecta si el estudiante es menor. Flujo adicional: datos del tutor + consentimiento digital firmado |
| 6 | ¿Link de clase en vivo? | Microsoft Teams, un link por nivel | ⚠️ Requiere decisión: un link por GRUPO (nivel+horario) es más seguro que uno por nivel. Ver nota abajo |
| 7 | ¿Progreso al reactivar? | Sí, conserva todo el progreso | Al suspender: estado = "suspendido", nunca borrar progreso. Al reactivar: restaura acceso a la unidad donde estaba |
| 8 | ¿Migración de estudiantes? | No — empezamos desde cero | Sin importador CSV necesario para el lanzamiento |
| 9 | ¿Cómo funciona el examen? | Temporizador + aleatorio + sin volver atrás | Temporizador visible, preguntas en orden random del banco, navegación unidireccional (no se puede regresar), auto-envío al terminar el tiempo |
| 10 | ¿Portal B2B? | Sí, en esta fase | Módulo B2B incluido: cuentas empresa, gestión de empleados inscritos, reportes de progreso corporativos, facturación |
| 11 | ¿Clase de prueba gratuita? | Sí, para todos los prospectos | Tipo de matrícula "Trial" en el sistema. El CRM registra asistencia. El Ventas hace seguimiento post-trial |

### ⚠️ Nota crítica — Link de Teams por nivel

Tener UN solo link de Teams por nivel significa que un estudiante del horario 6PM y uno del horario 9PM tienen el mismo link. El sistema debe:
- Mostrar al estudiante ÚNICAMENTE su horario activo en ese momento
- Idealmente: un canal/link por GRUPO (nivel + horario), no por nivel
- Recomendación: crear un Team de Teams con canales por grupo (A1-6PM, A1-7PM, etc.)

---

## 25. Módulo B2B — Especificaciones

### Cuenta empresa
- Nombre de empresa, RTN/NIT, dirección, contacto principal
- Puede tener múltiples empleados inscritos
- Un administrador de empresa ve el progreso de todos sus empleados
- Precio especial por volumen (configurable por Super Admin)

### Flujo B2B
1. Admin o Ventas crea la cuenta empresa
2. La empresa recibe acceso a su portal B2B
3. El administrador de empresa inscribe empleados (nombre + email)
4. El sistema envía invitación a cada empleado para completar registro y Placement Test
5. La empresa paga por todos los empleados en una sola factura mensual
6. El portal B2B muestra: empleado, nivel, progreso %, asistencia %, última actividad

### Facturación B2B
- Factura formal con datos fiscales de la empresa
- Generada por Contabilidad
- Stripe puede emitir facturas automáticas con los datos correctos
- Historial de facturas descargable en el portal B2B

---

## 26. Clase de prueba gratuita (Trial Class)

### Flujo
1. El prospecto solicita trial desde la landing page o el CRM (Ventas lo gestiona)
2. El sistema asigna al prospecto a la próxima sesión disponible de su nivel detectado (post-Placement Test)
3. El prospecto recibe el link de Teams y el horario
4. Asiste a una clase en vivo (sin acceso a plataforma 24/7 ni examen)
5. Post-clase: el sistema envía automáticamente un correo/WhatsApp con la oferta de inscripción
6. El CRM registra si asistió (hot lead) o no asistió (cold lead)
7. Ventas hace seguimiento personalizado

### Reglas
- Máximo 1 clase trial por prospecto
- No genera progreso ni unidad activa
- La grabación de la trial NO está disponible para el prospecto
- Si el prospecto no se inscribe en 7 días, el CRM envía recordatorio automático

---

## 27. Menores de edad — Flujo de registro

### Detección
- Al registrarse, el sistema calcula si el estudiante es menor de 18 según la fecha de nacimiento
- Si es menor: activa el flujo de consentimiento parental antes de continuar

### Campos adicionales para menores
- Nombre completo del tutor/padre/madre
- Relación con el menor
- Email del tutor
- Teléfono del tutor
- Consentimiento digital (checkbox con texto legal)
- El tutor recibe email de confirmación y puede ver el progreso del menor

### Restricciones para menores
- No puede cambiar email ni contraseña sin aprobación del tutor
- Las comunicaciones importantes van también al tutor
- Cumplimiento COPPA (si hay estudiantes menores de 13 en EE.UU.) y GDPR-Kids

---

## 28. Examen — Especificaciones técnicas

| Parámetro | Valor |
|---|---|
| Temporizador | Sí — visible y cuenta regresiva |
| Duración | A definir por unidad (sugerido: 20–30 minutos) |
| Orden de preguntas | Aleatorio — cada intento tiene un orden diferente |
| Navegación | Unidireccional — no se puede volver a preguntas anteriores |
| Auto-envío | Sí — si el tiempo expira, el examen se envía automáticamente con las respuestas dadas |
| Anti-cheat básico | Detectar cambio de pestaña (warning) + preguntas aleatorias del banco |
| Resultado | Inmediato al enviar |
| Intentos | Máximo 3, luego solo el docente puede habilitar más |

---

## 29. Grabaciones de clase — Flujo técnico

- Plataforma: Microsoft Teams (integrado con Microsoft 365)
- Las grabaciones se almacenan automáticamente en SharePoint/OneDrive del docente
- El docente sube el link de la grabación a la plataforma después de cada clase
- O: integración automática con MS Graph API para publicar grabaciones automáticamente
- El estudiante ve la grabación en su portal durante 7 días desde la fecha de la clase
- Después de 7 días: el link expira y la grabación ya no es accesible desde el portal
- El docente conserva la grabación en su OneDrive

---

## 30. Entidad "Grupo" — Modelo de datos

Esta entidad es nueva y crítica. Un Grupo es:

```
Grupo {
  id
  nivel: A1/A2/B1/B2/C1
  horario: 6PM / 7PM / 8PM / 9PM
  dias: Lun/Mié/Vie
  docente_id
  teams_link (canal específico del grupo)
  unidad_activa: 1-12
  ciclo_inicio_fecha
  capacidad_maxima: 25+
  estudiantes: [estudiante_id]
  estado: activo/pausado/cerrado
}
```

El estudiante pertenece a UN grupo. Esto permite:
- Leaderboard por grupo
- Asistencia por sesión específica
- El docente ve solo sus grupos
- El sistema sabe qué grabación corresponde a qué grupo

---

*Documento COMPLETO con auditoría — Mayo 2026*
*11/11 preguntas respondidas — Listo para desarrollo*

---

## 31. Infraestructura de video y clases — Decisiones finales

### Videos de práctica (contenido 24/7)
- **Plataforma:** Microsoft Stream (ya grabados y almacenados)
- **Integración:** El docente o Admin pega el link de Stream en cada unidad dentro del CMS
- **Reproductor:** Embed de Microsoft Stream en la plataforma o link directo
- **Permisos:** Configurar en Stream que los videos sean accesibles con link (sin requerir cuenta Microsoft del estudiante)
- **Sin costo adicional** de hosting de video — ya está en Microsoft 365 de WCA

### Links de clase en vivo (Microsoft Teams)
- **Proceso de configuración (una sola vez por grupo):**
  1. Admin/IT crea el grupo en la plataforma (Nivel + Horario, ej: A1 · 6:00 PM)
  2. El docente crea la reunión recurrente en Teams y copia el link
  3. Admin pega el link en la configuración del grupo
  4. El sistema muestra ese link al estudiante en su portal cuando corresponde
- **Sin integración API de Teams necesaria** — solo almacenar y mostrar el link
- **El link es recurrente** — el mismo para todas las sesiones del grupo

### CMS de contenido — Flujo simplificado
El docente gestiona el contenido de cada unidad con 3 tipos de recursos:
1. **Video** → pega link de Microsoft Stream
2. **Material PDF** → sube archivo (almacenado en S3/Cloudflare R2)
3. **Actividades** → crea desde el banco o desde cero en el constructor

No hay hosting de video propio — todo vive en Microsoft Stream de WCA.


---

## 32. Microsoft 365 — Integración completa

### Autenticación
- Cada estudiante tendrá un correo académico WCA con Microsoft 365
- Login en wcahub.com con cuenta Microsoft (SSO — Single Sign-On)
- Sin contraseña separada para la plataforma — usa sus credenciales de Microsoft
- El Admin provisiona las cuentas Microsoft al matricular al estudiante

### Videos
- Stream videos accesibles para todos los usuarios de la organización
- Los estudiantes acceden con su cuenta Microsoft WCA — sin fricción
- **Plan B de video (fallback):** el CMS acepta dos campos de link por video:
  - Link primario: Microsoft Stream (requiere cuenta WCA)
  - Link de respaldo: Bunny.net o Vimeo (acceso sin cuenta, por si Stream falla)
  - El sistema muestra el primario por defecto; si falla, muestra el secundario


---

## 33. ERD — Entidades de la base de datos (26 tablas)

### Entidades principales
| Entidad | Descripción | Relaciones clave |
|---|---|---|
| `USER` | Base para todos los roles. Email + MS365 ID como identificadores únicos | → ROLE (1:1), → STUDENT (1:0..1) |
| `ROLE` | 11 roles con permisos en formato JSON | ← USER |
| `STUDENT` | Perfil académico del alumno. Tipo: regular/scholarship/b2b/trial | → GROUP, → COMPANY, → SUBSCRIPTION |
| `TUTOR_CONSENT` | Requerido para menores de edad. Consentimiento digital del tutor | → STUDENT (1:1) |
| `GROUP` | Nivel + Horario + Docente + Unidad activa. Entidad central del ciclo | → LEVEL, → USER(teacher), → SESSION |
| `LEVEL` | A1-C1. Precio, secuencia, total de unidades | → UNIT, → CYCLE_CLOCK |
| `UNIT` | 1-12 por nivel. Links Stream + Bunny.net + PDF | → LEVEL, → EXAM, → ACTIVITY |
| `CYCLE_CLOCK` | Una fila por nivel. Registra la unidad activa global | → LEVEL (1:1) |
| `HOLIDAY` | Calendario de festivos configurable por Super Admin | Consultado por cron job |
| `SESSION` | Cada clase en vivo (lunes/mié/vie). Fecha + link grabación | → GROUP, → ATTENDANCE |
| `ATTENDANCE` | Registro de asistencia por sesión y estudiante | → SESSION, → STUDENT |
| `EXAM` | Un examen por unidad. Configuración de tiempo y nota mínima | → UNIT (1:1) |
| `EXAM_ATTEMPT` | Intento individual de examen. Máx. 3. Incluye respuestas | → EXAM, → STUDENT |
| `ACTIVITY` | Actividad del banco. Tipo + habilidad + contenido JSON | → UNIT, → USER(created_by) |
| `PAYMENT` | Pago individual. Soporta Stripe, transferencia y efectivo | → STUDENT |
| `SUBSCRIPTION` | Suscripción recurrente en Stripe. Mensual o trimestral | → STUDENT (1:1) |
| `CERTIFICATE` | Certificado emitido. Código QR verificable único | → STUDENT, → LEVEL |
| `BADGE` | Definición de insignia. Criterio en JSON | ← STUDENT_BADGE |
| `STUDENT_BADGE` | Badges ganados por el estudiante | → STUDENT, → BADGE |
| `STUDENT_XP` | Puntos XP acumulados y rango actual | → STUDENT (1:1) |
| `XP_EVENT` | Evento individual de XP (log) | → STUDENT |
| `COMPANY` | Empresa B2B. Precio por seat, contacto | → STUDENT |
| `SCHOLARSHIP` | Beca activa. Estado + datos del formulario en JSON | → STUDENT (1:1) |
| `LEAD` | Prospecto en el CRM. Score + etapa + nivel detectado | → LEVEL, → USER(assigned_to) |
| `TRIAL_CLASS` | Clase de prueba. Asistencia + seguimiento | → LEAD, → GROUP |
| `COUPON` | Cupón de descuento. Max usos, expiración | → USER(created_by) |
| `NOTIFICATION` | Cola de notificaciones. Canal: WhatsApp/email/in-app | → USER |
| `AUDIT_LOG` | Log inmutable de todas las acciones del sistema | → USER |

---

## 34. Algoritmo del ciclo continuo

### Pseudocódigo del cron job semanal

```
FUNCTION runWeeklyCycleClock() — Ejecuta cada lunes 00:00 CST

  today = getCurrentDate()

  IF isHoliday(today) THEN
    pauseAllCycles()
    notifyAllStudents("No hay clase hoy por feriado")
    RETURN
  END IF

  FOR EACH level IN getAllActiveLevels() DO
    clock = getCycleClock(level.id)
    newUnit = clock.active_unit + 1

    IF newUnit > 12 THEN
      newUnit = 1  // Reinicio automático del ciclo
    END IF

    updateCycleClock(level.id, {
      active_unit: newUnit,
      last_advanced_on: today,
      next_advance_on: nextMonday(today)
    })

    FOR EACH group IN getActiveGroups(level.id) DO
      FOR EACH student IN getActiveStudents(group.id) DO
        unlockUnit(student.id, level.id, newUnit)
        student.current_unit = newUnit
        sendNotification(student, "whatsapp", { template: "new_unit", unit: newUnit })

        IF hasCompletedAllUnits(student.id, level.id) THEN
          promoteToNextLevel(student, level)
        END IF
      END FOR

      createSession({ group_id: group.id, unit_number: newUnit, date: today })
    END FOR
  END FOR
END FUNCTION

FUNCTION promoteToNextLevel(student, currentLevel)
  nextLevel = getNextLevel(currentLevel)  // A1→A2→B1→B2→C1→NULL

  issueCertificate(student, currentLevel)  // Siempre emitir certificado

  IF nextLevel == NULL THEN
    student.state = "graduated"
    notifyGraduation(student)
    RETURN
  END IF

  entryUnit = getCycleClock(nextLevel.id).active_unit
  enrollInLevel(student, nextLevel, entryUnit)
  notifyLevelUp(student, currentLevel, nextLevel, entryUnit)
END FUNCTION
```

---

## 35. Máquina de estados del estudiante

| Estado | Descripción | Puede hacer | Transición saliente |
|---|---|---|---|
| `TRIAL` | Clase de prueba | Asistir a clase | → PENDING_PAYMENT o ACTIVE (pago) |
| `MINOR_PENDING` | Espera consentimiento del tutor | Solo ver pantalla de espera | → PENDING_PAYMENT o ACTIVE |
| `PENDING_PAYMENT` | Transferencia en espera | Subir comprobante | → ACTIVE (gestor confirma) |
| `ACTIVE` | Estado normal | Acceso completo | → SUSPENDED (pago falla) / → GRADUATED |
| `SUSPENDED` | Sin pago. Progreso conservado | Ver pantalla de reactivación | → ACTIVE (paga de nuevo) |
| `SCHOLARSHIP` | Beca activa | Solo clases en vivo | → ACTIVE (upgrade coordinador) |
| `B2B_ACTIVE` | Empresa paga | Igual que ACTIVE | → SUSPENDED (empresa cancela) |
| `GRADUATED` | Completó C1 | Descargar certificados | → ACTIVE (re-inscripción) |

---

## 36. Webhooks de Stripe → acciones del sistema

| Evento Stripe | Acción |
|---|---|
| `payment_intent.succeeded` | Activar cuenta + matricular en ciclo activo + bienvenida |
| `invoice.paid` | Renovar suscripción + mantener acceso |
| `invoice.payment_failed` | Notificar + crear alerta gestor + 72h de gracia |
| `customer.subscription.deleted` | Suspender acceso + conservar progreso |
| `charge.refunded` | Suspender + registrar en audit_log + notificar contabilidad |

