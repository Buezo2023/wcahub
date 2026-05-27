# WCA Hub — Política de Seguridad y Acceso a Datos

## Regla general

Todo acceso a datos sigue **dos capas de seguridad**:

1. **Capa API** (`/api/*`): autenticación JWT + `requireRole()` + audit log
2. **Capa RLS** (Supabase): políticas a nivel de fila, incluso si el cliente llama directo

Nunca confiar en solo una capa.

---

## ¿Cuándo usar el cliente Supabase directo vs el API?

### ✅ Supabase cliente directo — solo para lecturas y operaciones de bajo riesgo

| Tabla | Operación permitida desde cliente | Requiere |
|-------|-----------------------------------|---------|
| `profiles` | SELECT (propio) | Sesión activa |
| `students` | SELECT (propio) | Sesión activa |
| `enrollments` | SELECT (propias) | Sesión activa |
| `payments` | SELECT (propios) | Sesión activa |
| `student_progress` | SELECT + UPSERT (propio) | Sesión activa |
| `groups` | SELECT | Sesión activa |
| `audit_log` | INSERT | Sesión activa |
| `student_notes` | SELECT + INSERT | Rol staff |
| `leads` | SELECT + UPDATE stage | Rol ventas |
| `crm_tasks` | UPDATE done | Rol ventas |
| `groups` | INSERT + UPDATE | Rol coordinadora+ |
| `b2b_companies` | SELECT | Rol staff |
| Storage `proofs` | UPLOAD (propio path) | Sesión activa |

### ❌ NUNCA desde el cliente — siempre por `/api/*`

| Operación | Por qué requiere API |
|-----------|---------------------|
| Cambiar `profiles.role` | Requiere validación de rol válido + audit log |
| Cambiar `profiles.active` | Puede bloquear acceso — requiere audit log |
| INSERT en `payments` | Requiere referencia, audit log, email de confirmación |
| INSERT en `enrollments` | Requiere verificación de prerequisitos + capacidad de grupo |
| INSERT en `students` | Requiere creación de usuario Auth + email de invitación |
| INSERT en `staff` | Requiere invitación + dual-role check + audit log |
| UPDATE `enrollments.status` | Auto-suspend/reactivate afecta `profiles.active` |
| UPDATE `payments.status` | Confirmar pago avanza `next_payment_date` |

---

## Operaciones que requieren `super_admin`

- Cambiar el rol de cualquier usuario (`action: change-role`)
- Usar `forceStaff: true` o `forceStudent: true` para override del dual-role check
- Acceder al endpoint de billing manual (`/api/jobs/daily-billing`)
- Enviar email de prueba (`action: test-email`)

---

## Dual-role guard

Un mismo email **no puede ser staff activo y estudiante activo simultáneamente** sin confirmación explícita.

- `POST /api/auth { action: "staff" }` → bloquea si el email tiene matrículas activas
- `POST /api/auth { action: "student" }` → bloquea si el email tiene registro de staff activo
- Para override: enviar `forceStaff: true` o `forceStudent: true` en el body (requiere `super_admin`)

---

## Rate limiting

Todos los endpoints tienen rate limiting. Con Upstash Redis configurado es distribuido entre todas las instancias; sin él usa fallback in-memory por instancia.

| Endpoint | Límite |
|----------|--------|
| `/api/auth` (invitaciones) | 15 req/min por IP |
| `/api/payments` | 30 req/min por IP |
| `/api/enrollments` | 30 req/min por IP |
| `/api/emails` (welcome) | 10 req/min por IP |
| `/api/emails` (blast) | 200 req/min por IP |
| `/api/admin/stats` | 60 req/min por IP |
| `/api/stripe` | 10 req/min por IP |
| `/api/whatsapp` | 30 req/min por IP |

Para activar el rate limiter distribuido, agregar en Vercel:
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

---

## CORS

El CORS lo maneja `_utils.js::setCORS()` dinámicamente. Orígenes permitidos:
- `https://wcahub.vercel.app` (producción)
- `https://wcahub.com` (dominio propio, cuando esté configurado)
- `http://localhost:5173` y `5174` (solo en desarrollo)

No agregar bloques CORS estáticos en `vercel.json` — generan headers duplicados.

---

## Variables de entorno requeridas

| Variable | Dónde | Propósito |
|----------|-------|-----------|
| `SUPABASE_URL` | Vercel | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel 🔒 | Admin client (nunca en el frontend) |
| `SUPABASE_ANON_KEY` | Vercel | Client público |
| `VITE_SUPABASE_URL` | Vercel (build) | Acceso desde el frontend |
| `VITE_SUPABASE_ANON_KEY` | Vercel (build) | Acceso desde el frontend |
| `RESEND_API_KEY` | Vercel 🔒 | Envío de emails |
| `RESEND_FROM_EMAIL` | Vercel | Email remitente verificado |
| `UPSTASH_REDIS_REST_URL` | Vercel | Rate limiter distribuido |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel 🔒 | Auth Upstash |
| `TWILIO_ACCOUNT_SID` | Vercel 🔒 | WhatsApp vía Twilio |
| `TWILIO_AUTH_TOKEN` | Vercel 🔒 | Auth Twilio |
| `STRIPE_SECRET_KEY` | Vercel 🔒 | Pagos Stripe |
| `STRIPE_WEBHOOK_SECRET` | Vercel 🔒 | Validación webhook |
| `CRON_SECRET` | Vercel 🔒 | Auth del cron job manual |
