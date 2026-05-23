// ─── WCA Hub — Backend Utilities ─────────────────────────────────
// Compartido por todos los API routes de Vercel

import { createClient } from '@supabase/supabase-js';

// ─── Supabase Admin Client (service_role — solo en servidor) ──────
export function getSupabaseAdmin() {
  const url  = process.env.VITE_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin env vars missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// ─── Validate request auth (JWT from frontend) ───────────────────
export async function requireAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) throw { status: 401, message: 'No autorizado' };

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw { status: 401, message: 'Sesión inválida' };

  // Get profile with role
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role, full_name, email, active')
    .eq('id', user.id)
    .single();

  if (!profile?.active) throw { status: 403, message: 'Cuenta suspendida' };
  return { user, profile };
}

// ─── Role guard ───────────────────────────────────────────────────
export function requireRole(profile, ...roles) {
  if (!roles.includes(profile.role)) {
    throw { status: 403, message: `Requiere rol: ${roles.join(' o ')}` };
  }
}

// ─── CORS headers ─────────────────────────────────────────────────
export const CORS = {
  'Access-Control-Allow-Origin':  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ─── Standard response helpers ────────────────────────────────────
export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function err(res, error) {
  const status  = error.status  || 500;
  const message = error.message || 'Error interno del servidor';
  console.error(`[WCA API] ${status}:`, message, error);
  return res.status(status).json({ ok: false, error: message });
}

// ─── Mailrelay Email Service ───────────────────────────────────────
const MAILRELAY_URL = `https://${process.env.MAILRELAY_DOMAIN}/api/v1/send_emails`;
const FROM = {
  email: process.env.MAILRELAY_FROM_EMAIL || 'no-reply@worldconnectacademy.com',
  name:  process.env.MAILRELAY_FROM_NAME  || 'WCA Academy',
};

export async function sendEmail({ to, toName, subject, html, text }) {
  const payload = {
    from:      FROM,
    to:        [{ email: to, name: toName || to }],
    subject,
    html_part: html,
    ...(text ? { text_part: text } : {}),
  };

  const res = await fetch(MAILRELAY_URL, {
    method:  'POST',
    headers: {
      'x-auth-token':  process.env.MAILRELAY_API_KEY,
      'content-type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mailrelay error ${res.status}: ${body}`);
  }

  return await res.json();
}

// ─── Email Templates ──────────────────────────────────────────────
const BASE_STYLE = `
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #f5f7fa;
  margin: 0; padding: 0;
`;

const wrapEmail = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${BASE_STYLE}">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <!-- Header -->
    <div style="background:#155266;padding:28px 32px;text-align:center;">
      <div style="display:inline-block;width:44px;height:44px;background:#ffbb23;border-radius:10px;line-height:44px;font-size:22px;font-weight:900;color:#155266;margin-bottom:10px;">W</div>
      <div style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-.3px;">World Connect Academy</div>
      <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px;">La academia VA bilingüe #1 en LATAM</div>
    </div>
    <!-- Content -->
    <div style="padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <div style="font-size:11px;color:#94a3b8;line-height:1.8;">
        World Connect Academy · Honduras<br>
        <a href="https://wcahub.vercel.app" style="color:#155266;text-decoration:none;">wcahub.vercel.app</a>
        &nbsp;·&nbsp;
        <a href="mailto:info@worldconnectacademy.com" style="color:#155266;text-decoration:none;">info@worldconnectacademy.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;

export const EmailTemplates = {

  // Invitación a nuevo estudiante
  invite({ name, email, tempPassword, programName }) {
    const subject = `🎓 Bienvenido a WCA Academy — Accedé a tu portal`;
    const html = wrapEmail(`
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">¡Bienvenido, ${name}!</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Tu matrícula en <strong>${programName}</strong> ha sido creada exitosamente.
        Ya podés acceder a tu portal de estudiante.
      </p>
      <div style="background:#e8f3f6;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:12px;color:#155266;font-weight:600;margin-bottom:6px;">TUS CREDENCIALES</div>
        <div style="font-size:13px;color:#0f172a;"><strong>Email:</strong> ${email}</div>
        <div style="font-size:13px;color:#0f172a;margin-top:4px;"><strong>Contraseña temporal:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-family:monospace;">${tempPassword}</code></div>
      </div>
      <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        Acceder a mi portal →
      </a>
      <p style="font-size:12px;color:#94a3b8;margin-top:20px;">
        Por seguridad, cambiá tu contraseña la primera vez que inicies sesión.
      </p>
    `);
    return { subject, html };
  },

  // Confirmación de matrícula
  enrollment({ name, programName, level, schedule, teacher, startDate, price }) {
    const subject = `✅ Matrícula confirmada — ${programName}`;
    const html = wrapEmail(`
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">¡Tu matrícula está lista! 🎉</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${name}</strong>, confirmamos tu matrícula en WCA Academy.
      </p>
      <div style="border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <div style="background:#155266;padding:12px 16px;">
          <div style="color:#fff;font-weight:700;font-size:14px;">${programName}</div>
        </div>
        ${[
          ['Nivel', level],
          ['Horario', schedule],
          ['Docente', teacher],
          ['Inicio', startDate],
          ['Inversión mensual', `$${price} USD`],
        ].map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:12px;color:#64748b;">${k}</span>
            <span style="font-size:13px;color:#0f172a;font-weight:600;">${v}</span>
          </div>
        `).join('')}
      </div>
      <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        Ir a mi portal →
      </a>
    `);
    return { subject, html };
  },

  // Confirmación de pago
  paymentConfirmed({ name, amount, programName, period, code }) {
    const subject = `💳 Pago recibido — WCA Academy`;
    const html = wrapEmail(`
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Pago confirmado ✅</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${name}</strong>, hemos recibido y confirmado tu pago.
      </p>
      <div style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="font-size:28px;font-weight:800;color:#059669;margin-bottom:4px;">$${amount} USD</div>
        <div style="font-size:13px;color:#065f46;">${programName} · ${period}</div>
        ${code ? `<div style="font-size:11px;color:#6ee7b7;margin-top:8px;font-family:monospace;">Ref: ${code}</div>` : ''}
      </div>
      <p style="font-size:13px;color:#475569;line-height:1.7;">
        Tu acceso al portal está activo. ¡Seguí aprendiendo! 🚀
      </p>
      <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        Ir a mi portal →
      </a>
    `);
    return { subject, html };
  },

  // Recordatorio de pago vencido
  paymentReminder({ name, programName, amount, daysOverdue }) {
    const subject = `⚠️ Recordatorio de pago — ${programName}`;
    const html = wrapEmail(`
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Recordatorio de pago</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Hola <strong>${name}</strong>, te recordamos que tu pago de
        <strong>$${amount} USD</strong> para <strong>${programName}</strong>
        está pendiente${daysOverdue > 0 ? ` desde hace ${daysOverdue} días` : ''}.
      </p>
      <div style="background:#fff8e6;border:1.5px solid #fcd34d;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        <div style="font-size:13px;color:#92400e;line-height:1.7;">
          Para mantener tu acceso activo, realizá tu pago lo antes posible.
          Si ya realizaste la transferencia, por favor compartí el comprobante.
        </div>
      </div>
      <a href="mailto:info@worldconnectacademy.com" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        Contactar a WCA →
      </a>
    `);
    return { subject, html };
  },

  // Bienvenida post-onboarding
  welcome({ name, programName, teamsLink, nextClass }) {
    const subject = `🌟 ¡Ya estás dentro! Tu primera clase en WCA Academy`;
    const html = wrapEmail(`
      <h2 style="color:#0f172a;font-size:22px;margin:0 0 8px;">¡Todo listo, ${name}! 🎓</h2>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Completaste el onboarding y ya estás lista para tu primera clase de <strong>${programName}</strong>.
      </p>
      ${nextClass ? `
        <div style="background:#e8f3f6;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
          <div style="font-size:12px;color:#155266;font-weight:700;margin-bottom:4px;">📅 PRÓXIMA CLASE</div>
          <div style="font-size:15px;color:#0f172a;font-weight:700;">${nextClass}</div>
        </div>
      ` : ''}
      ${teamsLink && teamsLink !== '#' ? `
        <a href="${teamsLink}" style="display:inline-block;background:#0078d4;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:12px;">
          Unirme a Microsoft Teams →
        </a><br>
      ` : ''}
      <a href="https://wcahub.vercel.app" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">
        Ver mi portal →
      </a>
    `);
    return { subject, html };
  },
};
