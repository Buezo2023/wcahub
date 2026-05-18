# 🚀 WCA Hub — Guía de Deploy en Vercel
## De cero a URL pública en menos de 10 minutos

---

## Qué vas a tener al terminar

Una URL pública tipo `https://wcahub.vercel.app` con todos los portales funcionando como demo interactivo. Podés compartirla con tu equipo, estudiantes potenciales e inversores.

---

## Paso 1 — Subir el código a GitHub (3 minutos)

1. Creá una cuenta gratuita en **github.com** si no tenés
2. Hacé clic en el botón **"+ New repository"**
3. Nombre: `wcahub` · Privado o público (tu elección) · Crear
4. Descomprimí el ZIP que recibiste en tu computadora
5. Subí todos los archivos arrastrándolos al repositorio en GitHub
   - Hacé clic en **"uploading an existing file"**
   - Arrastrá la carpeta completa `wcahub/`
   - Escribí "Initial commit" y hacé clic en **"Commit changes"**

---

## Paso 2 — Conectar con Vercel (2 minutos)

1. Andá a **vercel.com** y creá una cuenta gratuita (podés entrar con GitHub)
2. Hacé clic en **"Add New Project"**
3. Seleccioná el repositorio `wcahub` que acabás de crear
4. Vercel detecta automáticamente que es un proyecto Vite/React
5. Dejá todo como está y hacé clic en **"Deploy"**

---

## Paso 3 — Esperar el build (2 minutos)

Vercel construye el proyecto automáticamente. Verás logs en tiempo real.
Si todo está bien, aparece un tilde verde y una URL del tipo:

```
✅ https://wcahub-xxxxxxxxx.vercel.app
```

---

## Paso 4 — Acceder al demo

Abrí la URL y navegá a `/hub` para ver el menú de todos los portales:

```
https://wcahub.vercel.app/hub
```

Desde ahí podés acceder a cualquier portal:

| Ruta | Portal |
|---|---|
| `/hub` | 🗺 Menú de todos los portales |
| `/` | 🌐 Landing page pública |
| `/portal` | 👨‍🎓 Portal del estudiante |
| `/onboarding` | 🎯 Wizard de bienvenida |
| `/docente` | 👩‍🏫 Portal del docente |
| `/admin` | ⚙️ Dashboard Admin |
| `/super` | ⭐ Super Admin |
| `/crm` | 💼 CRM de Ventas |
| `/cobros` | 💳 Gestor de Cobros |
| `/coordinacion` | 🎓 Coordinación Académica |
| `/bi` | 📊 Dashboard BI |
| `/preview` | 🗺 Vista unificada |

---

## Paso 5 — Dominio personalizado (opcional, 2 minutos)

Si tenés el dominio `wcahub.com`:

1. En Vercel → tu proyecto → **"Settings"** → **"Domains"**
2. Escribí `wcahub.com` y hacé clic en **"Add"**
3. Vercel te da dos registros DNS para agregar en tu registrador de dominio
4. En 5–30 minutos el dominio apunta a tu deploy

---

## ⚠️ Qué es este deploy y qué NO es

**SÍ es:**
- Un demo interactivo completamente funcional
- Una herramienta para mostrar a tu equipo cómo funcionará la plataforma
- Una herramienta de ventas para mostrar a estudiantes potenciales
- La base visual para que un desarrollador construya el backend

**NO es:**
- Una plataforma real de producción
- No guarda datos reales (todo es ficticio hardcodeado)
- No procesa pagos reales
- No tiene autenticación real
- No corre el ciclo continuo automáticamente

Para convertir esto en la plataforma real, consultá `WCA_README_HANDOFF.md`.

---

## Actualizaciones futuras

Cada vez que actualices archivos en GitHub, Vercel hace el redeploy automáticamente. No necesitás hacer nada más.

---

## ¿Problemas?

Si el build falla, el error más común es un import que no encuentra el archivo. Revisá que todos los archivos estén en la carpeta correcta.

Para soporte de Vercel: **vercel.com/docs**

---

*WCA Hub · Demo v1.0 · wcahub.com*
