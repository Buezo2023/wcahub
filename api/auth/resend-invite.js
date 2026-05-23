// POST /api/auth/resend-invite
// Body: { email }
// Auth: admin, super_admin
// Reenvía el email de acceso a un usuario existente

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, ok, err, setCORS } from '../_utils.js';

const PORTAL_MAP = {
  docente:'docente', coordinadora:'coordinadora', admin:'admin',
  cobros:'cobros', asesor_ventas:'crm', estudiante:'portal',
};

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin');

    const { email } = req.body;
    if (!email) return err(res, { status: 400, message: 'email requerido' });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles')
      .select('id, full_name, role, email').eq('email', email).maybeSingle();
    if (!profile) return err(res, { status: 404, message: 'Usuario no encontrado' });

    const role = profile.role || 'estudiante';
    const portalPath = PORTAL_MAP[role] || 'portal';
    const portalUrl = `https://wcahub.vercel.app/${portalPath}`;
    const firstName = (profile.full_name || email).split(' ')[0];
    const roleLabel = {
      docente:'Docente', coordinadora:'Coordinadora', admin:'Admin',
      cobros:'Gestor de Cobros', asesor_ventas:'Ventas', estudiante:'Estudiante',
    }[role] || role;

    const isStaff = role !== 'estudiante';

    const html = `<!DOCTYPE html>
<html lang="es"><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:#155266;padding:28px 32px;text-align:center;">
    <div style="display:inline-block;background:#ffbb23;width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#155266;margin-bottom:12px;">W</div>
    <div style="font-size:20px;font-weight:800;color:#fff;">World Connect Academy</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:22px;color:#0f172a;margin:0 0 16px;">Tu acceso a WCA Hub, ${firstName}</h2>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      ${isStaff ? `Sos parte del equipo WCA como <strong>${roleLabel}</strong>.` : `Tu matrícula en WCA Academy está activa.`}
      Hacé clic para acceder con tu cuenta de <strong>Google</strong>.
    </p>
    <a href="${portalUrl}" style="display:block;text-align:center;background:#155266;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:16px;">
      Acceder a WCA Hub →
    </a>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;font-size:12px;color:#64748b;text-align:center;">
      Iniciá sesión con Google usando: <strong style="color:#0f172a;">${email}</strong>
    </div>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;">
    WCA Hub · wcahub.vercel.app
  </div>
</div>
</body></html>`;

    await sendEmail({
      to:      email,
      toName:  profile.full_name || email,
      subject: `Tu acceso a WCA Hub — ${roleLabel}`,
      html,
    });

    return ok(res, { message: `Email reenviado a ${email}`, role, portalUrl });
  } catch(e) { return err(res, e); }
}
