// POST /api/auth/invite-staff
// Body: { email, fullName, role, salary?, hireDate? }
// Auth: admin, super_admin
// Diferente al invite de estudiantes:
//   - No crea student ni enrollment
//   - Asigna el rol de staff correcto desde el inicio
//   - Envía email de staff via Mailrelay (no confunde con "tu matrícula")
//   - Genera link de acceso directo via Supabase admin

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, ok, err, setCORS, checkRateLimit } from '../_utils.js';

const ROLE_MAP = {
  'Docente':          'docente',
  'Coordinadora':     'coordinadora',
  'Admin':            'admin',
  'Gestor de Cobros': 'cobros',
  'Ventas':           'asesor_ventas',
  'Marketing':        'asesor_ventas',
  'IT':               'admin',
  'Soporte':          'admin',
  'Contabilidad':     'cobros',
};

const PORTAL_MAP = {
  docente:       '/docente',
  coordinadora:  '/coordinacion',
  admin:         '/admin',
  cobros:        '/cobros',
  asesor_ventas: '/crm',
};

function staffEmailHtml({ name, role, portalUrl }) {
  const firstName = name.split(' ')[0];
  return {
    subject: `Bienvenido/a al equipo WCA — Accedé a tu portal`,
    html: `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:#155266;padding:28px 32px;text-align:center;">
    <div style="display:inline-block;background:#ffbb23;width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#155266;margin-bottom:12px;">W</div>
    <div style="font-size:20px;font-weight:800;color:#fff;">World Connect Academy</div>
    <div style="font-size:13px;color:rgba(255,255,255,.6);margin-top:4px;">Portal de gestión académica</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:22px;color:#0f172a;margin:0 0 8px;">¡Bienvenido/a, ${firstName}! 👋</h2>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Fuiste agregado/a al equipo de <strong>World Connect Academy</strong> como <strong>${role}</strong>.
    </p>
    <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:11px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">📋 TU ROL</div>
      <div style="font-size:16px;font-weight:700;color:#0f172a;">${role}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Acceso al portal de WCA Hub</div>
    </div>
    <p style="font-size:13px;color:#475569;margin:0 0 20px;">
      Para acceder, hacé clic en el botón e iniciá sesión con tu cuenta de <strong>Google</strong>
      usando este email. No necesitás contraseña.
    </p>
    <a href="${portalUrl}" style="display:block;text-align:center;background:#155266;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:16px;">
      Acceder a WCA Hub →
    </a>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;font-size:12px;color:#64748b;text-align:center;">
      Entrá con Google usando: <strong style="color:#0f172a;">${firstName.toLowerCase()}@tu-dominio.com</strong>
    </div>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;">
    World Connect Academy · wcahub.vercel.app
  </div>
</div>
</body></html>`,
  };
}

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try { checkRateLimit(`invite-staff:${req.headers['x-forwarded-for']||'x'}`, 10, 60000); }
  catch(e) { return err(res, e); }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin');

    const { email, fullName, role = 'Docente', salary, hireDate } = req.body;
    if (!email || !fullName) return err(res, { status: 400, message: 'email y fullName son requeridos' });

    const supabaseRole = ROLE_MAP[role] || 'docente';
    const portalPath   = PORTAL_MAP[supabaseRole] || '/portal';
    const portalUrl    = `https://wcahub.vercel.app${portalPath}`;
    const admin        = getSupabaseAdmin();

    // 1. Check if already exists
    const { data: existing } = await admin.from('profiles')
      .select('id, role').eq('email', email).maybeSingle();

    let userId;
    let isNew = false;

    if (existing) {
      userId = existing.id;
      // Update role if different
      if (existing.role !== supabaseRole) {
        await admin.from('profiles').update({ role: supabaseRole, active: true }).eq('id', userId);
      }
    } else {
      // 2. Create auth user (email_confirm: true → skip Supabase confirmation email)
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createErr) {
        // If user already exists in auth but not in profiles
        if (createErr.message?.includes('already registered')) {
          const { data: { users } } = await admin.auth.admin.listUsers();
          const found = users.find(u => u.email === email);
          if (found) userId = found.id;
          else throw createErr;
        } else throw createErr;
      } else {
        userId = newUser.user.id;
        isNew  = true;
      }
    }

    // 3. Upsert profile with correct role
    await admin.from('profiles').upsert({
      id:        userId,
      email,
      full_name: fullName,
      role:      supabaseRole,
      active:    true,
    }, { onConflict: 'id' });

    // 4. Create staff record
    const { data: staffRow } = await admin.from('staff').upsert({
      profile_id: userId,
      position:   role,
      department: role === 'Docente' ? 'Académico' : 'Administrativo',
      salary:     salary ? Number(salary) : null,
      hire_date:  hireDate || new Date().toISOString().slice(0, 10),
      active:     true,
    }, { onConflict: 'profile_id' }).select().single();

    // 5. Audit
    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    'invited_staff',
      entity:    'staff',
      entity_id: staffRow?.id || userId,
      metadata:  { email, role, fullName },
    }).catch(() => {});

    // 6. Send Mailrelay email with correct staff template
    let emailSent = false;
    try {
      const { subject, html } = staffEmailHtml({ name: fullName, role, portalUrl });
      await sendEmail({ to: email, toName: fullName, subject, html });
      emailSent = true;
    } catch(emailErr) {
      console.error('Staff email error:', emailErr.message);
    }

    return ok(res, {
      message:   `${fullName} agregado/a como ${role}${emailSent ? ' — email enviado' : ' (email pendiente de configuración)'}`,
      userId,
      role:      supabaseRole,
      emailSent,
      isNew,
    }, 201);

  } catch(e) { return err(res, e); }
}
// debug route — DELETE BEFORE PRODUCTION
// GET /api/auth/invite-staff?email=xxx — resend email to existing staff
