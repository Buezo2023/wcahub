// ─── WCA Hub — Backend Utilities ─────────────────────────────────
import { createClient } from "@supabase/supabase-js";

// ─── Supabase Admin Client ────────────────────────────────────────
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin env vars missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── In-memory rate limiter (resets per Vercel function cold start) ──
const rateLimitStore = new Map();

export function checkRateLimit(identifier, maxReqs = 10, windowMs = 60000) {
  const now = Date.now();
  const key  = identifier;
  const data = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > data.resetAt) {
    data.count   = 0;
    data.resetAt = now + windowMs;
  }

  data.count++;
  rateLimitStore.set(key, data);

  if (data.count > maxReqs) {
    throw { status: 429, message: "Demasiadas solicitudes. Intentá en un minuto." };
  }
}

// ─── Input sanitizer — prevent XSS in email templates ────────────
export function sanitize(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g, "&#039;")
    .slice(0, 500); // Max length guard
}

// ─── Auth validation ──────────────────────────────────────────────
export async function requireAuth(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) throw { status: 401, message: "No autorizado" };

  const anon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) throw { status: 401, message: "Sesión inválida o expirada" };

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, full_name, email, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw { status: 500, message: "Error verificando perfil" };
  if (!profile)     throw { status: 404, message: "Perfil no encontrado" };
  if (!profile.active) throw { status: 403, message: "Cuenta suspendida" };

  return { user, profile };
}

export function requireRole(profile, ...roles) {
  if (!roles.includes(profile.role)) {
    throw { status: 403, message: `Requiere rol: ${roles.join(" o ")}` };
  }
}

// ─── CORS — fixed to production domain ───────────────────────────
const ALLOWED_ORIGINS = [
  "https://wcahub.vercel.app",
  "https://wcahub.com",
  "http://localhost:5173",
];

export function setCORS(req, res) {
  const origin = req.headers.origin || "";
  const allowed = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  res.setHeader("Access-Control-Allow-Origin",  allowed);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

export const CORS = {}; // kept for compatibility — use setCORS(req, res) instead

// ─── Response helpers ─────────────────────────────────────────────
export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function err(res, error) {
  const status  = error.status  || 500;
  const message = error.message || "Error interno del servidor";
  // Don't log full error object — may contain sensitive data
  console.error(`[WCA API ${status}]`, message);
  return res.status(status).json({ ok: false, error: message });
}

// ─── Email via Resend (resend.com) ───────────────────────────────
// Resend está diseñado para emails transaccionales en serverless.
// Configurar: RESEND_API_KEY en Vercel → obtener en resend.com/api-keys
// FROM_EMAIL debe ser un dominio verificado en Resend (worldconnectacademy.com)
//
// Mientras no esté configurado, los emails se envían via Mailrelay SMTP
// o se saltan con un console.warn.

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL
  || process.env.MAILRELAY_FROM_EMAIL
  || "no-reply@worldconnectacademy.com";
const FROM_NAME  = process.env.MAILRELAY_FROM_NAME || "WCA Academy";

export async function sendEmail({ to, toName, subject, html }) {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — email skipped. Ver: resend.com/api-keys");
    return null;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    `${FROM_NAME} <${FROM_EMAIL}>`,
      to:      [toName ? `${toName} <${to}>` : to],
      subject,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${data.message || data.name || JSON.stringify(data).slice(0, 200)}`);
  }
  return data;
}

// ─── Email templates (inputs sanitized) ──────────────────────────
const wrap = (content) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fa;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:#155266;padding:28px 32px;text-align:center;">
    <div style="display:inline-block;width:44px;height:44px;background:#ffbb23;border-radius:10px;line-height:44px;font-size:22px;font-weight:900;color:#155266;margin-bottom:10px;">W</div>
    <div style="color:#fff;font-size:18px;font-weight:700;">World Connect Academy</div>
    <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px;">La academia VA bilingüe #1 en LATAM</div>
  </div>
  <div style="padding:32px;">${content}</div>
  <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
    <div style="font-size:11px;color:#94a3b8;line-height:1.8;">
      World Connect Academy · Honduras<br>
      <a href="https://wcahub.vercel.app" style="color:#155266;text-decoration:none;">wcahub.vercel.app</a>
      &nbsp;·&nbsp;
      <a href="mailto:info@worldconnectacademy.com" style="color:#155266;text-decoration:none;">info@worldconnectacademy.com</a>
    </div>
  </div>
</div></body></html>`;

export const EmailTemplates = {
  invite({ name, email, programName }) {
    const n = sanitize(name), e = sanitize(email), p = sanitize(programName);
    return {
      subject: `Bienvenido a WCA Academy — Accedé a tu portal`,
      html: wrap(`
        <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">¡Bienvenido, ${n}!</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Tu matrícula en <strong>${p}</strong> fue creada. Hacé clic para acceder con tu cuenta de Google o Microsoft.
        </p>
        <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
          Acceder a WCA Hub →
        </a>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px;">
          Iniciá sesión con el email: <strong>${e}</strong>
        </p>`),
    };
  },

  enrollment({ name, programName, level, schedule, teacher, startDate, price }) {
    const n = sanitize(name), p = sanitize(programName);
    const rows = [["Nivel",level],["Horario",schedule],["Docente",teacher],["Inicio",startDate],["Inversión",`$${price} USD`]];
    return {
      subject: `Matrícula confirmada — ${p}`,
      html: wrap(`
        <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">¡Tu matrícula está lista! 🎉</h2>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">Hola <strong>${n}</strong>, confirmamos tu matrícula en WCA Academy.</p>
        <div style="border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <div style="background:#155266;padding:12px 16px;color:#fff;font-weight:700;font-size:14px;">${p}</div>
          ${rows.map(([k,v]) => `<div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#64748b;">${k}</span><span style="font-size:13px;color:#0f172a;font-weight:600;">${sanitize(String(v))}</span></div>`).join("")}
        </div>
        <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ir a mi portal →</a>`),
    };
  },

  paymentConfirmed({ name, amount, programName, period, code }) {
    const n = sanitize(name), p = sanitize(programName), c = sanitize(code || "");
    return {
      subject: `Pago recibido — WCA Academy`,
      html: wrap(`
        <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Pago confirmado ✅</h2>
        <p style="color:#475569;font-size:14px;margin:0 0 20px;">Hola <strong>${n}</strong>, confirmamos tu pago.</p>
        <div style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="font-size:28px;font-weight:800;color:#059669;">$${Number(amount).toFixed(2)} USD</div>
          <div style="font-size:13px;color:#065f46;">${p} · ${sanitize(period)}</div>
          ${c ? `<div style="font-size:11px;color:#6ee7b7;margin-top:8px;font-family:monospace;">Ref: ${c}</div>` : ""}
        </div>
        <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ir a mi portal →</a>`),
    };
  },

  paymentReminder({ name, programName, amount, daysOverdue }) {
    const n = sanitize(name), p = sanitize(programName);
    return {
      subject: `Recordatorio de pago — ${p}`,
      html: wrap(`
        <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Recordatorio de pago</h2>
        <p style="color:#475569;font-size:14px;margin:0 0 20px;">
          Hola <strong>${n}</strong>, tu pago de <strong>$${Number(amount)} USD</strong> para <strong>${p}</strong>
          está pendiente${daysOverdue > 0 ? ` desde hace ${daysOverdue} días` : ""}.
        </p>
        <div style="background:#fff8e6;border:1.5px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <div style="font-size:13px;color:#92400e;line-height:1.7;">Para mantener tu acceso, realizá tu pago lo antes posible. Si ya pagaste, compartí el comprobante por WhatsApp.</div>
        </div>
        <a href="mailto:info@worldconnectacademy.com" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Contactar a WCA →</a>`),
    };
  },

  welcome({ name, programName, teamsLink, nextClass }) {
    const n = sanitize(name), p = sanitize(programName);
    return {
      subject: `¡Ya estás dentro! Tu primera clase en WCA Academy`,
      html: wrap(`
        <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">¡Todo listo, ${n}! 🎓</h2>
        <p style="color:#475569;font-size:14px;margin:0 0 20px;">Completaste el onboarding y ya estás listo para <strong>${p}</strong>.</p>
        ${nextClass ? `<div style="background:#e8f3f6;border-radius:10px;padding:16px 20px;margin-bottom:20px;"><div style="font-size:12px;color:#155266;font-weight:700;margin-bottom:4px;">📅 PRÓXIMA CLASE</div><div style="font-size:15px;color:#0f172a;font-weight:700;">${sanitize(nextClass)}</div></div>` : ""}
        ${teamsLink && teamsLink !== "#" ? `<a href="${sanitize(teamsLink)}" style="display:inline-block;background:#0078d4;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:12px;">Unirme a Microsoft Teams →</a><br>` : ""}
        <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ver mi portal →</a>`),
    };
  },
};
