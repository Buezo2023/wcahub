# WCA Hub — Developer Handoff
## World Connect Academy · wcahub.com

> **Estado:** Diseño completo · Listo para desarrollo  
> **Fecha:** Mayo 2026  
> **Versión:** 1.0 — MVP

---

## Índice

1. [Resumen del proyecto](#1-resumen-del-proyecto)
2. [Arquitectura de la plataforma](#2-arquitectura-de-la-plataforma)
3. [Stack tecnológico](#3-stack-tecnológico)
4. [Estructura de archivos](#4-estructura-de-archivos)
5. [Instalación y configuración](#5-instalación-y-configuración)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Rutas y roles](#7-rutas-y-roles)
8. [Base de datos — ERD](#8-base-de-datos--erd)
9. [Lógica del ciclo continuo](#9-lógica-del-ciclo-continuo)
10. [Integración Microsoft 365](#10-integración-microsoft-365)
11. [Integración Stripe](#11-integración-stripe)
12. [Sistema de notificaciones](#12-sistema-de-notificaciones)
13. [Plan de sprints](#13-plan-de-sprints)
14. [Criterios de aceptación por módulo](#14-criterios-de-aceptación-por-módulo)
15. [Decisiones de diseño](#15-decisiones-de-diseño)
16. [Pendientes antes del lanzamiento](#16-pendientes-antes-del-lanzamiento)

---

## 1. Resumen del proyecto

WCA Hub es la plataforma SaaS de gestión académica de World Connect Academy, una academia de idiomas 100% remota con estudiantes en 20+ países.

### Qué hace la plataforma

- **Ciclo de aprendizaje continuo** — estudiantes entran en cualquier semana y el sistema los ubica automáticamente en la unidad activa de su nivel (A1 → C1)
- **Clases en vivo** vía Microsoft Teams (3x por semana)
- **Práctica 24/7** — videos en Microsoft Stream + actividades en la plataforma
- **Exámenes** — con temporizador, preguntas aleatorias y máximo 3 intentos
- **Pagos** — Stripe (tarjeta), transferencia bancaria y efectivo
- **Gamificación** — XP, badges, leaderboard mensual y certificados CEFR con QR verificable
- **11 roles** con portales específicos para cada uno

### Métricas actuales (al momento del diseño)
- 134 estudiantes activos
- 9 grupos en 5 niveles
- MRR: $18,420 USD
- Estudiantes en 20+ países

---

## 2. Arquitectura de la plataforma

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (React)                          │
│  Landing │ Portales por rol │ Onboarding │ BI Dashboard          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / REST API
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (Node.js / Express)                 │
│                                                                  │
│  Auth (MSAL)  │  API REST  │  Webhooks (Stripe)  │  Cron jobs   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐                │
│  │ RBAC     │  │ Ciclo    │  │ Notificaciones │                │
│  │ Middleware│  │ Engine   │  │ Queue (BullMQ) │                │
│  └──────────┘  └──────────┘  └────────────────┘                │
└──────────────────┬──────────────────────────────────────────────┘
                   │
     ┌─────────────▼──────────────┐
     │       PostgreSQL + Redis   │
     │  26 tablas · Datos app     │
     └────────────────────────────┘

Servicios externos:
  Microsoft 365  →  SSO + Teams + Stream
  Stripe         →  Pagos + Suscripciones
  Twilio         →  WhatsApp Business API
  SendGrid       →  Email transaccional
  Bunny.net      →  Video fallback (plan B)
  Cloudflare R2  →  PDFs y assets estáticos
```

---

## 3. Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18+ | Framework principal |
| react-router-dom | 6+ | Ruteo SPA |
| Tailwind CSS | 3+ | Utilidades CSS (opcional, los JSX ya tienen estilos inline) |
| recharts | latest | Gráficas en el BI Dashboard |
| @azure/msal-react | latest | Autenticación Microsoft SSO |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 4+ | Framework API REST |
| Prisma | 5+ | ORM para PostgreSQL |
| BullMQ | latest | Cola de notificaciones |
| node-cron | latest | Cron job del ciclo semanal |

### Base de datos
| Tecnología | Uso |
|---|---|
| PostgreSQL 15+ | Base de datos principal |
| Redis 7+ | Caché, sesiones y cola BullMQ |

### Servicios SaaS
| Servicio | Propósito | Plan mínimo |
|---|---|---|
| Microsoft 365 Business | SSO, Teams, Stream | Business Basic |
| Stripe | Pagos y suscripciones | Pay-as-you-go |
| Twilio | WhatsApp Business API | Pay-as-you-go |
| SendGrid | Email transaccional | Free (100/día) → Essentials |
| Bunny.net | Video CDN fallback | Pay-as-you-go |
| Cloudflare R2 | Storage de PDFs | Free (10GB) |

### Deploy recomendado
| Capa | Servicio | Costo estimado |
|---|---|---|
| Frontend | Vercel | Free → Pro $20/mes |
| Backend + API | Railway o Render | $10–20/mes |
| Base de datos | Railway PostgreSQL o Supabase | $10–25/mes |
| Redis | Railway Redis o Upstash | $5–10/mes |
| Dominio | Namecheap / GoDaddy | $12/año |

**Costo infraestructura total estimado: ~$50–80/mes al inicio**

---

## 4. Estructura de archivos

### Archivos de diseño entregados (en este paquete)

```
/design/
├── wca_landing.jsx                 → Ruta /
├── wca_portal_estudiante.jsx       → Ruta /portal
├── wca_onboarding.jsx              → Ruta /portal/onboarding
├── wca_portal_docente.jsx          → Ruta /docente
├── wca_dashboard_admin.jsx         → Ruta /admin
├── wca_super_admin.jsx             → Ruta /super
├── wca_crm.jsx                     → Ruta /crm
├── wca_gestor_cobros.jsx           → Ruta /cobros
├── wca_coordinacion_academica.jsx  → Ruta /coordinacion
├── wca_bi_dashboard.jsx            → Ruta /bi
└── WCA_especificaciones_FINAL.md   → Referencia técnica completa
```

### Estructura recomendada del proyecto React

```
wcahub/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx                     ← Rutas principales (ver sección 7)
│   ├── index.jsx
│   ├── pages/                      ← Un archivo por portal
│   │   ├── Landing.jsx             ← Adaptar de wca_landing.jsx
│   │   ├── PortalEstudiante.jsx
│   │   ├── Onboarding.jsx
│   │   ├── PortalDocente.jsx
│   │   ├── DashboardAdmin.jsx
│   │   ├── SuperAdmin.jsx
│   │   ├── CRM.jsx
│   │   ├── GestorCobros.jsx
│   │   ├── CoordAcademica.jsx
│   │   └── BIDashboard.jsx
│   ├── components/                 ← Componentes compartidos
│   │   ├── Toast.jsx               ← Sistema de toasts (por construir)
│   │   ├── NotificationBell.jsx    ← Centro de notificaciones (por construir)
│   │   ├── ProtectedRoute.jsx      ← Guard de autenticación
│   │   ├── Sidebar.jsx             ← Sidebar reutilizable (extraer de portales)
│   │   └── LoadingSkeleton.jsx     ← Skeleton screens
│   ├── hooks/
│   │   ├── useAuth.js              ← Hook de autenticación MSAL
│   │   ├── useToast.js             ← Hook de notificaciones
│   │   └── useRole.js              ← Hook de permisos por rol
│   ├── services/
│   │   ├── api.js                  ← Cliente HTTP (axios o fetch)
│   │   ├── auth.js                 ← Configuración MSAL
│   │   └── stripe.js               ← Helpers de Stripe
│   ├── constants/
│   │   ├── roles.js                ← Definición de 11 roles
│   │   ├── brand.js                ← Paleta de colores WCA
│   │   └── routes.js               ← Rutas de la app
│   └── utils/
│       ├── formatters.js           ← Formateo de fechas, moneda, etc.
│       └── permissions.js          ← Lógica de RBAC en el cliente
├── .env.example
├── .env.local
└── package.json
```

### Estructura del backend

```
wcahub-api/
├── src/
│   ├── index.js                    ← Entry point
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── students.routes.js
│   │   ├── groups.routes.js
│   │   ├── units.routes.js
│   │   ├── exams.routes.js
│   │   ├── payments.routes.js
│   │   ├── enrollments.routes.js
│   │   ├── cycles.routes.js
│   │   └── webhooks.routes.js      ← Stripe webhooks
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.middleware.js      ← Verificar JWT de Microsoft
│   │   ├── rbac.middleware.js      ← Control de acceso por rol
│   │   └── rateLimiter.js
│   ├── services/
│   │   ├── cycle.service.js        ← Lógica del ciclo continuo
│   │   ├── stripe.service.js       ← Integración Stripe
│   │   ├── microsoft.service.js    ← Graph API (Teams, Stream)
│   │   ├── notification.service.js ← Cola BullMQ
│   │   └── certificate.service.js  ← Generación de certificados con QR
│   ├── jobs/
│   │   └── weeklyCycle.job.js      ← Cron lunes 00:00 CST
│   ├── prisma/
│   │   └── schema.prisma           ← Esquema de BD (ver sección 8)
│   └── config/
│       ├── database.js
│       └── redis.js
├── .env
└── package.json
```

---

## 5. Instalación y configuración

### Frontend

```bash
# 1. Crear proyecto
npx create-react-app wcahub
cd wcahub

# 2. Instalar dependencias
npm install react-router-dom@6 \
  @azure/msal-react @azure/msal-browser \
  recharts \
  axios \
  date-fns \
  qrcode.react \
  react-confetti

# 3. Copiar archivos de diseño
# Mover los .jsx del paquete a src/pages/
# Adaptar imports y props según la estructura del proyecto

# 4. Configurar rutas (ver App.jsx en sección 7)

# 5. Configurar variables de entorno
cp .env.example .env.local
```

### Backend

```bash
# 1. Iniciar proyecto
mkdir wcahub-api && cd wcahub-api
npm init -y

# 2. Instalar dependencias
npm install express \
  prisma @prisma/client \
  @azure/msal-node \
  bullmq ioredis \
  stripe \
  node-cron \
  twilio \
  @sendgrid/mail \
  qrcode \
  bcryptjs \
  jsonwebtoken \
  cors helmet express-rate-limit \
  dotenv

# 3. Inicializar Prisma
npx prisma init

# 4. Aplicar esquema de base de datos
npx prisma migrate dev --name init

# 5. Configurar variables de entorno
cp .env.example .env
```

---

## 6. Variables de entorno

### Frontend (.env.local)

```env
# Microsoft Identity
REACT_APP_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_AZURE_REDIRECT_URI=https://wcahub.com

# API
REACT_APP_API_URL=https://api.wcahub.com

# Stripe
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx

# Analytics (Fase 2)
REACT_APP_GA4_ID=G-XXXXXXXXXX
REACT_APP_META_PIXEL_ID=xxxxxxxxxxxx
```

### Backend (.env)

```env
# Base de datos
DATABASE_URL="postgresql://user:password@host:5432/wcahub"
REDIS_URL="redis://localhost:6379"

# Microsoft 365 / Azure AD
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Productos Stripe (crear en dashboard y pegar IDs)
STRIPE_PRICE_INGLES=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_VA=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_COMBO=price_xxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_BECA=price_xxxxxxxxxxxxxxxxxxxx

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=no-reply@wca.edu.hn

# Bunny.net (video fallback)
BUNNY_CDN_HOSTNAME=wcahub.b-cdn.net
BUNNY_STORAGE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloudflare R2 (PDFs)
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=wcahub-assets

# JWT
JWT_SECRET=una_cadena_muy_larga_y_aleatoria_minimo_64_caracteres
JWT_EXPIRY=7d

# App
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://wcahub.com
CRON_TIMEZONE=America/Tegucigalpa
```

---

## 7. Rutas y roles

### App.jsx — Rutas principales

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './services/auth';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing              from './pages/Landing';
import PortalEstudiante     from './pages/PortalEstudiante';
import Onboarding           from './pages/Onboarding';
import PortalDocente        from './pages/PortalDocente';
import DashboardAdmin       from './pages/DashboardAdmin';
import SuperAdmin           from './pages/SuperAdmin';
import CRM                  from './pages/CRM';
import GestorCobros         from './pages/GestorCobros';
import CoordAcademica       from './pages/CoordAcademica';
import BIDashboard          from './pages/BIDashboard';

export default function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/"            element={<Landing />} />
          <Route path="/verify/:code" element={<CertificateVerify />} />

          {/* Estudiante */}
          <Route path="/portal" element={
            <ProtectedRoute roles={['student']}>
              <PortalEstudiante />
            </ProtectedRoute>
          } />
          <Route path="/portal/onboarding" element={
            <ProtectedRoute roles={['student']}>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Staff */}
          <Route path="/docente" element={
            <ProtectedRoute roles={['teacher']}>
              <PortalDocente />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />
          <Route path="/super" element={
            <ProtectedRoute roles={['superadmin']}>
              <SuperAdmin />
            </ProtectedRoute>
          } />
          <Route path="/crm" element={
            <ProtectedRoute roles={['sales']}>
              <CRM />
            </ProtectedRoute>
          } />
          <Route path="/cobros" element={
            <ProtectedRoute roles={['billing']}>
              <GestorCobros />
            </ProtectedRoute>
          } />
          <Route path="/coordinacion" element={
            <ProtectedRoute roles={['coordinator']}>
              <CoordAcademica />
            </ProtectedRoute>
          } />
          <Route path="/bi" element={
            <ProtectedRoute roles={['superadmin', 'admin']}>
              <BIDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MsalProvider>
  );
}
```

### Roles y sus rutas

| Rol (código) | Descripción | Rutas accesibles |
|---|---|---|
| `student` | Estudiante regular | `/portal`, `/portal/onboarding` |
| `teacher` | Docente | `/docente` |
| `admin` | Administrador | `/admin`, `/bi` |
| `superadmin` | Super Administrador | `/super`, `/admin`, `/bi` |
| `sales` | Asesor de ventas | `/crm` |
| `billing` | Gestor de cobros | `/cobros` |
| `coordinator` | Coordinadora académica | `/coordinacion` |
| `accounting` | Contabilidad | `/contabilidad` *(Fase 2)* |
| `marketing` | Marketing | `/marketing` *(Fase 2)* |
| `support` | Soporte | `/soporte` *(Fase 2)* |
| `it` | IT | `/super` (parcial) |

### ProtectedRoute.jsx

```jsx
import { useMsal } from '@azure/msal-react';
import { useRole } from '../hooks/useRole';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
  const { accounts } = useMsal();
  const { userRole } = useRole();

  // No autenticado → redirect a login
  if (!accounts.length) return <Navigate to="/" />;

  // Sin el rol requerido → redirect
  if (roles && !roles.includes(userRole)) return <Navigate to="/" />;

  // Primera vez del estudiante → onboarding
  if (userRole === 'student' && !localStorage.getItem('onboarding_done')) {
    return <Navigate to="/portal/onboarding" />;
  }

  return children;
}
```

---

## 8. Base de datos — ERD

### Tablas principales (26 entidades)

```sql
-- CORE ENTITIES
USER          (id, email, ms365_id, full_name, phone, country,
               timezone, language, birth_date, is_minor, role_id,
               status, created_at)

ROLE          (id, name, permissions JSONB)

STUDENT       (id, user_id FK, type ENUM, group_id FK,
               company_id FK, current_unit INT, state ENUM,
               enrolled_at, suspended_at)

TUTOR_CONSENT (id, student_id FK, tutor_name, tutor_email,
               relationship, consented BOOL, consented_at)

-- ACADEMIC STRUCTURE
GROUP         (id, level_id FK, teacher_id FK, schedule_time,
               days, teams_link, capacity_max INT, active_unit INT,
               cycle_started_at DATE, status ENUM)

LEVEL         (id, code VARCHAR, name, units_total INT,
               price_monthly DECIMAL, sequence INT)

UNIT          (id, level_id FK, number INT, title,
               stream_url, backup_video_url, pdf_url,
               exam_duration_min INT, status ENUM)

-- CYCLE ENGINE
CYCLE_CLOCK   (id, level_id FK UNIQUE, active_unit INT,
               last_advanced_on DATE, next_advance_on DATE,
               paused BOOL DEFAULT false)

HOLIDAY       (id, date DATE, name, country, affects_cycle BOOL)

-- SESSIONS & ATTENDANCE
SESSION       (id, group_id FK, unit_number INT, session_date DATE,
               recording_url, recording_expires_at TIMESTAMP, status ENUM)

ATTENDANCE    (id, session_id FK, student_id FK, present BOOL,
               recorded_at TIMESTAMP)

-- EXAMS
EXAM          (id, unit_id FK UNIQUE, max_attempts INT DEFAULT 3,
               duration_min INT, pass_score DECIMAL DEFAULT 70.0)

EXAM_ATTEMPT  (id, exam_id FK, student_id FK, attempt_number INT,
               score DECIMAL, passed BOOL, answers JSONB,
               started_at, submitted_at,
               unlocked_by FK, unlock_reason)

ACTIVITY      (id, unit_id FK, type ENUM, skill, title,
               content JSONB, created_by FK, visibility ENUM)

-- PAYMENTS
PAYMENT       (id, student_id FK, amount DECIMAL, currency VARCHAR,
               method ENUM, status ENUM, stripe_payment_id,
               reference_code, proof_url, confirmed_by FK,
               confirmed_at, created_at)

SUBSCRIPTION  (id, student_id FK UNIQUE, stripe_sub_id,
               amount DECIMAL, interval ENUM, status ENUM,
               current_period_end DATE, cancelled_at DATE)

-- GAMIFICATION
CERTIFICATE   (id, student_id FK, level_id FK, verify_code UUID UNIQUE,
               verify_url, issued_at, linkedin_shared BOOL)

BADGE         (id, key VARCHAR UNIQUE, name, description,
               icon, criteria_json)

STUDENT_BADGE (id, student_id FK, badge_id FK, earned_at)
STUDENT_XP    (id, student_id FK UNIQUE, total_xp INT, rank ENUM, updated_at)
XP_EVENT      (id, student_id FK, action VARCHAR, xp_amount INT, created_at)

-- B2B
COMPANY       (id, name, tax_id, contact_email, contact_name,
               price_per_seat DECIMAL, status ENUM)

-- SCHOLARSHIPS
SCHOLARSHIP   (id, student_id FK UNIQUE, status ENUM,
               start_date DATE, end_date DATE, application_data JSONB)

-- CRM
LEAD          (id, full_name, email, phone, country, source,
               detected_level_id FK, stage ENUM, score INT,
               assigned_to FK, notes, created_at)

TRIAL_CLASS   (id, lead_id FK, group_id FK, class_date DATE,
               attended BOOL, follow_up_at TIMESTAMP, status ENUM)

COUPON        (id, code VARCHAR UNIQUE, discount_pct DECIMAL,
               max_uses INT, used_count INT, expires_at DATE,
               created_by FK)

-- SYSTEM
NOTIFICATION  (id, user_id FK, type VARCHAR, channel ENUM,
               payload_json TEXT, status ENUM,
               scheduled_at TIMESTAMP, sent_at TIMESTAMP)

AUDIT_LOG     (id, user_id FK, action VARCHAR, entity VARCHAR,
               entity_id UUID, changes JSONB, ip_address,
               created_at TIMESTAMP)
```

### Índices críticos para rendimiento

```sql
CREATE INDEX idx_student_group ON STUDENT(group_id);
CREATE INDEX idx_student_state ON STUDENT(state);
CREATE INDEX idx_cycle_clock_level ON CYCLE_CLOCK(level_id);
CREATE INDEX idx_session_group_date ON SESSION(group_id, session_date);
CREATE INDEX idx_attendance_session ON ATTENDANCE(session_id);
CREATE INDEX idx_exam_attempt_student ON EXAM_ATTEMPT(student_id, exam_id);
CREATE INDEX idx_payment_student ON PAYMENT(student_id, status);
CREATE INDEX idx_lead_stage ON LEAD(stage, assigned_to);
CREATE INDEX idx_notification_user ON NOTIFICATION(user_id, status);
CREATE INDEX idx_audit_log_user ON AUDIT_LOG(user_id, created_at);
```

---

## 9. Lógica del ciclo continuo

### Cron job — weeklyCycle.job.js

```javascript
// Ejecuta cada lunes 00:00 hora de Honduras (CST = UTC-6)
// Configurar: '0 6 * * 1' en UTC (= 00:00 CST)

import cron from 'node-cron';
import { runWeeklyCycleClock } from '../services/cycle.service.js';

cron.schedule('0 6 * * 1', async () => {
  console.log(`[CYCLE] Running weekly cycle clock — ${new Date().toISOString()}`);
  await runWeeklyCycleClock();
}, { timezone: 'UTC' });
```

### cycle.service.js — Algoritmo principal

```javascript
export async function runWeeklyCycleClock() {
  const today = new Date();

  // 1. Verificar si es feriado
  const holiday = await prisma.holiday.findFirst({
    where: { date: today, affects_cycle: true }
  });

  if (holiday) {
    await pauseAllCycles();
    await notifyAllStudents('holiday', { holiday_name: holiday.name });
    return { status: 'paused', reason: holiday.name };
  }

  // 2. Para cada nivel activo
  const levels = await prisma.level.findMany({ orderBy: { sequence: 'asc' } });

  for (const level of levels) {
    const clock = await prisma.cycle_clock.findUnique({
      where: { level_id: level.id }
    });

    // 3. Avanzar unidad
    let newUnit = clock.active_unit + 1;
    if (newUnit > level.units_total) newUnit = 1; // Reinicio U12 → U1

    // 4. Actualizar reloj
    await prisma.cycle_clock.update({
      where: { level_id: level.id },
      data: {
        active_unit: newUnit,
        last_advanced_on: today,
        next_advance_on: getNextMonday(today),
        paused: false,
      }
    });

    // 5. Para cada grupo del nivel
    const groups = await prisma.group.findMany({
      where: { level_id: level.id, status: 'active' }
    });

    for (const group of groups) {
      // 6. Para cada estudiante activo del grupo
      const students = await prisma.student.findMany({
        where: { group_id: group.id, state: 'active' }
      });

      for (const student of students) {
        // 7. Actualizar unidad actual
        await prisma.student.update({
          where: { id: student.id },
          data: { current_unit: newUnit }
        });

        // 8. Notificar
        await queueNotification(student.user_id, 'new_unit', {
          unit_number: newUnit,
          unit_title: await getUnitTitle(level.id, newUnit),
          teams_link: group.teams_link,
        });

        // 9. Verificar promoción de nivel
        if (await hasCompletedAllUnits(student.id, level.id)) {
          await promoteToNextLevel(student, level);
        }
      }

      // 10. Crear sesión de la semana
      await prisma.session.create({
        data: {
          group_id: group.id,
          unit_number: newUnit,
          session_date: today,
          status: 'scheduled',
        }
      });
    }
  }

  return { status: 'completed', advanced_to: 'next unit per level' };
}

async function promoteToNextLevel(student, currentLevel) {
  const nextLevel = await getNextLevel(currentLevel.sequence);

  // Emitir certificado siempre
  await issueCertificate(student.id, currentLevel.id);

  if (!nextLevel) {
    // Graduado — completó C1
    await prisma.student.update({
      where: { id: student.id },
      data: { state: 'graduated' }
    });
    await queueNotification(student.user_id, 'graduation', {});
    return;
  }

  // Matricular en el siguiente nivel en la unidad activa actual
  const nextClock = await prisma.cycle_clock.findUnique({
    where: { level_id: nextLevel.id }
  });

  const availableGroup = await findAvailableGroup(nextLevel.id, student);

  await prisma.student.update({
    where: { id: student.id },
    data: {
      group_id: availableGroup.id,
      current_unit: nextClock.active_unit,
    }
  });

  await queueNotification(student.user_id, 'level_up', {
    from_level: currentLevel.code,
    to_level: nextLevel.code,
    entry_unit: nextClock.active_unit,
  });
}
```

### Máquina de estados del estudiante

```javascript
// Estados posibles: trial | minor_pending | pending_payment |
//                   active | suspended | scholarship | b2b_active | graduated

const STUDENT_TRANSITIONS = {
  trial:           ['pending_payment', 'active'],
  minor_pending:   ['pending_payment', 'active'],
  pending_payment: ['active'],
  active:          ['suspended', 'graduated'],
  suspended:       ['active'],
  scholarship:     ['active'],          // upgrade por coordinadora
  b2b_active:      ['suspended'],
  graduated:       ['active'],          // re-inscripción
};

function canTransition(currentState, newState) {
  return STUDENT_TRANSITIONS[currentState]?.includes(newState) ?? false;
}
```

---

## 10. Integración Microsoft 365

### Autenticación SSO

```javascript
// src/services/auth.js
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID}`,
    redirectUri: process.env.REACT_APP_AZURE_REDIRECT_URI,
  },
  cache: { cacheLocation: 'sessionStorage' },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read', 'Files.Read.All'], // Para acceder a Stream
};
```

### Grabaciones de clase (Microsoft Stream → SharePoint)

```javascript
// El docente sube el link de Stream manualmente en el portal
// El link se almacena en SESSION.recording_url
// 7 días después de session_date → el campo ya no se muestra al estudiante
// La grabación no se borra del Stream, solo se oculta en el portal

// Expiración automática vía consulta:
// SELECT * FROM session
// WHERE recording_url IS NOT NULL
//   AND session_date < NOW() - INTERVAL '7 days'
// → No mostrar al estudiante, aunque el link siga activo en Stream
```

### Link de Teams por grupo

```javascript
// El Admin configura el link UNA sola vez en la creación del grupo
// Se almacena en GROUP.teams_link
// El portal del estudiante lo muestra con un botón "Unirme a clase"
// cuando la clase está programada para hoy ±30 minutos

function showTeamsButton(session, now) {
  const classTime = new Date(session.session_date);
  const diffMinutes = (classTime - now) / 1000 / 60;
  return diffMinutes >= -10 && diffMinutes <= 90; // Ventana de 100 minutos
}
```

---

## 11. Integración Stripe

### Webhooks — stripe.routes.js

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    switch (event.type) {

      case 'payment_intent.succeeded':
        // Activar cuenta + matricular en ciclo activo
        await activateStudentAccount(event.data.object);
        break;

      case 'invoice.paid':
        // Renovar suscripción mensual
        await renewSubscription(event.data.object);
        break;

      case 'invoice.payment_failed':
        // Notificar + crear alerta para gestor + 72h de gracia
        await handlePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.deleted':
        // Suspender acceso (conservar progreso)
        await suspendStudent(event.data.object);
        break;

      case 'charge.refunded':
        // Suspender + registrar en audit_log
        await processRefund(event.data.object);
        break;
    }

    res.json({ received: true });
  }
);
```

---

## 12. Sistema de notificaciones

### Tipos de notificaciones y canales

| Key | Canal | Trigger | Plantilla |
|---|---|---|---|
| `new_unit` | WhatsApp | Lunes 00:00 CST | "🎓 Nueva unidad disponible: *{unit_title}*" |
| `class_reminder` | WhatsApp | 3h antes de clase | "⏰ Tu clase es en 3 horas: {level} {time}" |
| `exam_passed` | In-app | Al aprobar | "✅ ¡Aprobaste U{unit}! La siguiente unidad está desbloqueada." |
| `exam_failed_3` | In-app + docente | Al agotar intentos | Aviso al docente + mensaje al estudiante |
| `payment_due` | WhatsApp | 3 días antes de vencimiento | "💳 Tu pago vence en 3 días. Monto: *${amount}*" |
| `payment_failed` | WhatsApp + email | Fallo de cobro | "❌ No pudimos cobrar tu suscripción..." |
| `level_up` | Email | Al subir de nivel | Email con certificado adjunto + LinkedIn CTA |
| `graduation` | Email + WhatsApp | Al completar C1 | "🎓 ¡Felicidades! Completaste el programa WCA." |
| `welcome` | Email | Al activar cuenta | Email de bienvenida con instrucciones |
| `transfer_confirmed` | WhatsApp | Al confirmar gestor | "✅ Tu pago fue confirmado. Tu acceso está activo." |
| `trial_followup` | WhatsApp | 24h post-trial | Seguimiento automático de Ventas |
| `lead_assigned` | In-app | Al asignar lead | Aviso al asesor de ventas |
| `blocked_exam` | In-app (docente) | 3 intentos agotados | Alerta para habilitar intento extra |
| `holiday_pause` | WhatsApp | Día de feriado | "📅 No hay clase hoy por feriado: {holiday_name}" |

### notification.service.js

```javascript
import { Queue } from 'bullmq';

const notifQueue = new Queue('notifications', {
  connection: { url: process.env.REDIS_URL }
});

export async function queueNotification(userId, type, payload) {
  // Guardar en BD
  const notif = await prisma.notification.create({
    data: { user_id: userId, type, payload_json: JSON.stringify(payload),
            status: 'pending', scheduled_at: new Date() }
  });

  // Encolar para envío
  await notifQueue.add(type, { notif_id: notif.id, userId, type, payload },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );
}
```

---

## 13. Plan de sprints

### Sprint 0 — Setup (Semana 1)
- [ ] Configurar repos (frontend + backend)
- [ ] Provisionar PostgreSQL + Redis
- [ ] Configurar Microsoft 365: tenant, usuarios de prueba, Teams channels
- [ ] Crear cuenta Stripe + productos + precios
- [ ] Configurar Twilio WhatsApp sandbox
- [ ] Deploy inicial en Railway/Render + Vercel
- [ ] Dominio wcahub.com apuntando al frontend

### Sprint 1 — Auth + Core (Semanas 2–3)
- [ ] Autenticación Microsoft SSO (MSAL)
- [ ] Middleware RBAC por rol
- [ ] CRUD completo de las 26 entidades (Prisma schema + migraciones)
- [ ] API REST básica: `/auth`, `/students`, `/groups`, `/levels`, `/units`
- [ ] Seed de datos iniciales: niveles A1–C1, grupos, precios

### Sprint 2 — Ciclo + Exámenes (Semanas 4–5)
- [ ] Engine del ciclo continuo (cycle.service.js)
- [ ] Cron job lunes 00:00 CST
- [ ] Módulo de exámenes: banco de preguntas, temporizador, intentos
- [ ] Lógica de promoción de nivel
- [ ] Generación de certificados con QR (PDF)

### Sprint 3 — Pagos (Semana 6)
- [ ] Integración Stripe Subscriptions
- [ ] Webhooks: payment_intent.succeeded, invoice.paid, subscription.deleted
- [ ] Flujo de transferencia bancaria (manual)
- [ ] Flujo de reembolso (7 días)
- [ ] API de pagos para el Gestor de Cobros

### Sprint 4 — Portales estudiante + docente (Semanas 7–8)
- [ ] Portal del estudiante (conectar con API)
- [ ] Portal del docente (conectar con API)
- [ ] Onboarding wizard (flag onboarding_completed)
- [ ] Sistema de notificaciones (BullMQ + Twilio + SendGrid)

### Sprint 5 — Admin + Super Admin (Semana 9)
- [ ] Dashboard Admin (conectar con API)
- [ ] Super Admin (conectar con API)
- [ ] Módulo de gestión de festivos
- [ ] Módulo de gamificación (XP, badges)

### Sprint 6 — Portales internos (Semana 10)
- [ ] CRM de Ventas
- [ ] Gestor de Cobros
- [ ] Coordinación Académica
- [ ] Dashboard BI (conectar con consultas reales)

### Sprint 7 — QA + Seguridad (Semana 11)
- [ ] 2FA para SuperAdmin, IT y Contabilidad
- [ ] Tests de carga (k6 o Artillery)
- [ ] Penetration testing básico
- [ ] Revisión de T&C + política de privacidad GDPR
- [ ] Backup automático de BD
- [ ] Monitoreo de errores (Sentry)

### Sprint 8 — Launch (Semana 12)
- [ ] Migración a producción
- [ ] Onboarding del equipo WCA (capacitación)
- [ ] Smoke testing con datos reales
- [ ] Go-live 🚀

---

## 14. Criterios de aceptación por módulo

### Landing Page + Autoinscripción
- [ ] El Placement Test muestra 15 preguntas y detecta nivel correctamente
- [ ] Al completar el test muestra el nivel con descripción
- [ ] El flujo de inscripción tiene 4 pasos funcionales
- [ ] El pago con Stripe procesa correctamente en modo test
- [ ] La transferencia genera un código de referencia único
- [ ] Al confirmar pago, se crea la cuenta y se envía email de bienvenida

### Portal del Estudiante
- [ ] El estudiante ve solo su unidad activa actual
- [ ] El botón de Teams aparece solo en ventana de ±90 min de la clase
- [ ] Las grabaciones desaparecen después de 7 días
- [ ] El examen tiene temporizador visible y auto-envío
- [ ] Las preguntas del examen son en orden aleatorio en cada intento
- [ ] Al aprobar, se desbloquea la siguiente unidad automáticamente
- [ ] Al agotar 3 intentos, se bloquea y se notifica al docente
- [ ] El onboarding aparece solo la primera vez (flag en BD)

### Ciclo continuo
- [ ] Cada lunes a las 00:00 CST el cron avanza la unidad activa de todos los niveles
- [ ] Si el lunes es feriado, el ciclo no avanza y notifica a los estudiantes
- [ ] Al llegar a U12, el ciclo reinicia a U1 automáticamente
- [ ] Un estudiante que aprueba U12 sube al siguiente nivel automáticamente
- [ ] Un estudiante nuevo se ubica en la unidad activa del ciclo, no en U1

### Pagos
- [ ] `payment_intent.succeeded` activa la cuenta en menos de 10 segundos
- [ ] `customer.subscription.deleted` suspende el acceso inmediatamente
- [ ] `invoice.payment_failed` notifica al estudiante y crea alerta para el gestor
- [ ] El progreso se conserva al suspender (no se borra)
- [ ] Al reactivar, el estudiante retoma exactamente donde estaba

---

## 15. Decisiones de diseño

| Decisión | Elegido | Razón |
|---|---|---|
| Auth | Microsoft SSO (MSAL) | WCA ya usa M365; cada estudiante tiene cuenta @wca.edu.hn |
| Video | Microsoft Stream (principal) + Bunny.net (fallback) | Ya existe contenido en Stream; Bunny.net como plan B |
| Link de Teams | URL fija por grupo, pegada manualmente por Admin | Simplísimo de implementar; no requiere API de Teams |
| Grabaciones | Link subido manualmente por docente | Sin integración Graph API en v1; más simple |
| Pagos | Stripe Subscriptions | Maneja ciclos de cobro, webhooks y múltiples países |
| Notificaciones | Twilio WhatsApp + BullMQ | WhatsApp es el canal principal en LATAM |
| Ciclo | Cron job lunes 00:00 CST | Simple, confiable, fácil de debuggear |
| Sin pausa | No hay freeze de suscripción | Decisión del negocio: simplifica la lógica |
| Sin migración | Empezar desde cero | No hay estudiantes previos que migrar |
| Examen | Temporizador + aleatorio + sin volver atrás | Decisión académica para validez del examen |

---

## 16. Pendientes antes del lanzamiento

### Decisiones operativas (del equipo WCA)
- [ ] **Duración exacta del temporizador del examen** — ¿20 min? ¿30 min? ¿Variable por nivel?
- [ ] **Cupo máximo exacto por grupo** — ¿25, 28 o 30 estudiantes?
- [ ] **Protocolo de sustitución de docente** — ¿qué pasa si falta un docente?
- [ ] **Precio en lempiras o solo USD** para pagos en efectivo/transferencia locales

### Legal (antes de aceptar estudiantes europeos)
- [ ] **T&C y política de privacidad** redactadas por abogado local con cláusulas GDPR
- [ ] **Contratos con docentes** incluyendo confidencialidad y propiedad intelectual
- [ ] **Flujo de consentimiento de menores** revisado por abogado

### Técnico (semana 11 del plan de sprints)
- [ ] **2FA** para SuperAdmin, IT y Contabilidad
- [ ] **Backup automático** diario de PostgreSQL
- [ ] **Status page** (status.wcahub.com)
- [ ] **Sentry** o similar para monitoreo de errores en producción
- [ ] **Rate limiting** en la API para prevenir abuso

---

## Contacto y recursos

| Recurso | URL |
|---|---|
| Especificaciones completas | `WCA_especificaciones_FINAL.md` en este paquete |
| Wireframes interactivos | Archivos `.jsx` en este paquete |
| Vista previa unificada | `wca_platform_preview.jsx` |
| Stripe Dashboard | https://dashboard.stripe.com |
| Azure AD Portal | https://portal.azure.com |
| Microsoft Teams Admin | https://admin.teams.microsoft.com |
| Twilio Console | https://console.twilio.com |

---

*WCA Hub · Handoff v1.0 · Mayo 2026*  
*Diseñado para wcahub.com · World Connect Academy*
