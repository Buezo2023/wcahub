# WCA Hub — Brief para cotización de desarrollo
## World Connect Academy · wcahub.com

---

## Qué es este proyecto

Plataforma SaaS de gestión académica para una academia de idiomas 100% remota con estudiantes en 20+ países. El diseño, la arquitectura y las especificaciones están **completamente terminados**. Necesitamos un equipo que conecte el frontend al backend.

**Repositorio:** https://github.com/Buezo2023/wcahub  
**Demo en vivo:** https://wcahub.vercel.app/hub

---

## Qué ya está hecho (no cotizar)

Todo el diseño y la arquitectura ya está lista en el repositorio:

| Entregable | Estado |
|---|---|
| 10 portales React completos con branding | ✅ Listo |
| Especificaciones técnicas (36 secciones, 873 líneas) | ✅ Listo |
| ERD completo — 26 tablas con campos y tipos | ✅ Listo |
| Algoritmo del ciclo continuo en pseudocódigo | ✅ Listo |
| Máquina de estados del estudiante | ✅ Listo |
| Mapa de webhooks de Stripe | ✅ Listo |
| Plan de sprints de 12 semanas | ✅ Listo |
| Variables de entorno documentadas | ✅ Listo |
| Criterios de aceptación por módulo | ✅ Listo |

**Archivos de referencia en el repo:**
- `WCA_README_HANDOFF.md` — instrucciones completas para el desarrollador
- `WCA_especificaciones_FINAL.md` — especificaciones de negocio y técnicas
- `src/pages/` — los 10 portales React listos para conectar

---

## Qué necesitamos que coticen

### Backend (Node.js + Express + PostgreSQL)

1. **Setup de infraestructura**
   - Configuración de PostgreSQL (26 tablas según ERD del README)
   - Redis para caché y cola de notificaciones
   - Deploy en Railway/Render

2. **Autenticación Microsoft 365 (MSAL)**
   - SSO con cuentas @wca.edu.hn
   - Middleware RBAC para 11 roles

3. **API REST**
   - Endpoints para los 10 portales (detallados en README)
   - Conexión del frontend React existente al backend

4. **Motor del ciclo continuo** ← el más crítico
   - Cron job lunes 00:00 CST (pseudocódigo completo en README)
   - Lógica de avance de unidades, promoción de nivel, feriados

5. **Integración Stripe**
   - Subscripciones mensuales (4 planes)
   - 5 webhooks mapeados en el README
   - Flujo de transferencia bancaria manual

6. **Sistema de notificaciones**
   - Twilio WhatsApp Business API
   - SendGrid para emails
   - Cola BullMQ (14 tipos de notificaciones documentados)

7. **Certificados con QR verificable**
   - Generación de PDF con código QR
   - Página pública /verify/:code

### Portales adicionales (Fase 2 — cotizar por separado)

- Portal Contabilidad
- Dashboard Marketing  
- Portal Soporte al estudiante
- Portal B2B (empresa)

---

## Stack definido (no negociable)

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + react-router-dom v6 (ya construido) |
| Backend | Node.js + Express |
| ORM | Prisma + PostgreSQL |
| Auth | Microsoft MSAL |
| Pagos | Stripe Subscriptions |
| Notificaciones | Twilio WhatsApp + SendGrid + BullMQ |
| Video | Microsoft Stream (ya integrado, solo mostrar links) |
| Deploy frontend | Vercel (ya configurado) |
| Deploy backend | Railway o Render |

---

## Plazos y expectativas

- **MVP (Sprint 1–8):** 10–12 semanas
- **Fase 2 portales adicionales:** 4 semanas adicionales
- **Equipo mínimo:** 1 desarrollador full-stack mid/senior
- **Reunión de kick-off:** disponible para explicar el sistema en detalle

---

## Cómo revisar el material antes de cotizar

1. Clonar el repo: `git clone https://github.com/Buezo2023/wcahub`
2. Leer `WCA_README_HANDOFF.md` (empezar por aquí)
3. Ver el demo: https://wcahub.vercel.app/hub
4. Revisar `WCA_especificaciones_FINAL.md` para contexto de negocio

El desarrollador que lea el README en 30 minutos debe poder responder cualquier pregunta técnica sin necesidad de reuniones adicionales. Si no puede, no es el equipo indicado.

---

## Contacto

World Connect Academy  
wcahub.com  

*Brief generado el 18 de Mayo 2026*
