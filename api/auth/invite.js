// POST /api/auth/invite
// Body: { action, ...params }
//
// action = 'student'  → crea estudiante + enrollment (admin/coordinadora)
// action = 'staff'    → crea staff con rol correcto + email de staff (admin/super_admin)
// action = 'resend'   → reenvía email de acceso a usuario existente (admin/super_admin)
// action = 'test-email' → prueba Mailrelay (super_admin only)

import {
  requireAuth, requireRole, getSupabaseAdmin,
  sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit,
} from '../_utils.js';

// ── Staff constants ────────────────────────────────────────────────
const ROLE_MAP = {
  'Docente':'docente','Coordinadora':'coordinadora','Admin':'admin',
  'Gestor de Cobros':'cobros','Ventas':'asesor_ventas',
  'Marketing':'asesor_ventas','IT':'admin','Soporte':'admin','Contabilidad':'cobros',
};
const PORTAL_MAP = {
  docente:'/docente',coordinadora:'/coordinacion',admin:'/admin',
  cobros:'/cobros',asesor_ventas:'/crm',estudiante:'/portal',
};

function staffEmailHtml({ name, role, portalUrl, email }) {
  const first = name.split(' ')[0];
  return {
    subject: `Bienvenido/a al equipo WCA — Accedé a tu portal`,
    html: `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:#155266;padding:28px 32px;text-align:center;">
    <div style="display:inline-block;background:#ffbb23;width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#155266;margin-bottom:12px;">W</div>
    <div style="font-size:20px;font-weight:800;color:#fff;">World Connect Academy</div>
    <div style="font-size:13px;color:rgba(255,255,255,.6);margin-top:4px;">Portal de gestión académica</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:22px;color:#0f172a;margin:0 0 8px;">¡Bienvenido/a, ${first}! 👋</h2>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Fuiste agregado/a al equipo de <strong>World Connect Academy</strong> como <strong>${role}</strong>.
    </p>
    <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <div style="font-size:11px;color:#0369a1;font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;">📋 TU ROL</div>
      <div style="font-size:16px;font-weight:700;color:#0f172a;">${role}</div>
    </div>
    <p style="font-size:13px;color:#475569;margin:0 0 20px;">
      Hacé clic e iniciá sesión con tu cuenta de <strong>Google</strong> usando este email. No necesitás contraseña.
    </p>
    <a href="${portalUrl}" style="display:block;text-align:center;background:#155266;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:16px;">
      Acceder a WCA Hub →
    </a>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;font-size:12px;color:#64748b;text-align:center;">
      Iniciá sesión con: <strong style="color:#0f172a;">${email}</strong>
    </div>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;font-size:11px;color:#94a3b8;">
    World Connect Academy · wcahub.vercel.app
  </div>
</div></body></html>`,
  };
}

// ── Handlers ───────────────────────────────────────────────────────

async function handleStudent(req, actor) {
  const { email, fullName, programId = 'en', level = 'A1', price = 95, groupId } = req.body;
  if (!email || !fullName) return { status: 400, message: 'email y fullName son requeridos' };

  const admin = getSupabaseAdmin();
  const { data: existingProfile } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();

  let userId, isNewUser = false;
  if (existingProfile) {
    userId = existingProfile.id;
  } else {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    userId = newUser.user.id;
    isNewUser = true;
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://wcahub.vercel.app/auth/callback',
      data: { full_name: fullName },
    }).catch(e => console.warn('Magic link:', e.message));
  }

  await admin.from('profiles').upsert({ id: userId, email, full_name: fullName, role: 'estudiante', active: true }, { onConflict: 'id' });
  const { data: student, error: sErr } = await admin.from('students').upsert({ profile_id: userId, level }, { onConflict: 'profile_id' }).select().single();
  if (sErr) throw sErr;

  const { data: enrollment, error: eErr } = await admin.from('enrollments').upsert({
    student_id: student.id, program_id: programId, group_id: groupId || null,
    status: 'active', current_unit: 1, price_locked: price,
  }, { onConflict: 'student_id,program_id' }).select().single();
  if (eErr) throw eErr;

  await admin.from('audit_log').insert({ actor_id: actor.id, action: 'invited_student', entity: 'student', entity_id: student.id, metadata: { email, programId, level } });

  if (isNewUser) {
    try {
      const progNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA·Marketing', va_legal:'VA·Legal', va_care:'VA·Cuidador' };
      const { subject, html } = EmailTemplates.invite({ name: fullName.split(' ')[0], email, programName: progNames[programId] || programId });
      await sendEmail({ to: email, toName: fullName, subject, html });
    } catch(e) { console.error('Student email:', e.message); }
  }
  return { message: `Estudiante ${existingProfile ? 'matriculado' : 'invitado'} exitosamente`, studentId: student.id, enrolled: !!enrollment, emailSent: isNewUser };
}

async function handleStaff(req, actor) {
  const { email, fullName, role = 'Docente', salary, hireDate } = req.body;
  if (!email || !fullName) return { status: 400, message: 'email y fullName son requeridos' };

  const supabaseRole = ROLE_MAP[role] || 'docente';
  const portalUrl    = `https://wcahub.vercel.app${PORTAL_MAP[supabaseRole] || '/portal'}`;
  const admin        = getSupabaseAdmin();

  const { data: existing } = await admin.from('profiles').select('id, role').eq('email', email).maybeSingle();
  let userId, isNew = false;

  if (existing) {
    userId = existing.id;
    if (existing.role !== supabaseRole) await admin.from('profiles').update({ role: supabaseRole, active: true }).eq('id', userId);
  } else {
    const { data: newUser, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: fullName } });
    if (error) {
      if (error.message?.includes('already registered')) {
        const { data: { users } } = await admin.auth.admin.listUsers();
        const found = users.find(u => u.email === email);
        if (found) userId = found.id; else throw error;
      } else throw error;
    } else { userId = newUser.user.id; isNew = true; }
  }

  await admin.from('profiles').upsert({ id: userId, email, full_name: fullName, role: supabaseRole, active: true }, { onConflict: 'id' });
  const { data: staffRow } = await admin.from('staff').upsert({
    profile_id: userId, position: role,
    department: role === 'Docente' ? 'Académico' : 'Administrativo',
    salary: salary ? Number(salary) : null,
    hire_date: hireDate || new Date().toISOString().slice(0, 10),
    active: true,
  }, { onConflict: 'profile_id' }).select().single();

  await admin.from('audit_log').insert({ actor_id: actor.id, action: 'invited_staff', entity: 'staff', entity_id: staffRow?.id || userId, metadata: { email, role, fullName } }).catch(() => {});

  let emailSent = false;
  try {
    const { subject, html } = staffEmailHtml({ name: fullName, role, portalUrl, email });
    await sendEmail({ to: email, toName: fullName, subject, html });
    emailSent = true;
  } catch(e) { console.error('Staff email:', e.message); }

  return { message: `${fullName} agregado/a como ${role}${emailSent ? ' — email enviado' : ' (Mailrelay no configurado)'}`, userId, role: supabaseRole, emailSent, isNew };
}

async function handleResend(req, actor) {
  const { email } = req.body;
  if (!email) return { status: 400, message: 'email requerido' };

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('id, full_name, role, email').eq('email', email).maybeSingle();
  if (!profile) return { status: 404, message: 'Usuario no encontrado' };

  const role       = profile.role || 'estudiante';
  const portalUrl  = `https://wcahub.vercel.app${PORTAL_MAP[role] || '/portal'}`;
  const firstName  = (profile.full_name || email).split(' ')[0];
  const roleLabel  = { docente:'Docente', coordinadora:'Coordinadora', admin:'Admin', cobros:'Gestor de Cobros', asesor_ventas:'Ventas', estudiante:'Estudiante' }[role] || role;
  const isStaff    = role !== 'estudiante';

  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:#155266;padding:28px 32px;text-align:center;">
    <div style="display:inline-block;background:#ffbb23;width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;font-weight:900;color:#155266;margin-bottom:12px;">W</div>
    <div style="font-size:20px;font-weight:800;color:#fff;">World Connect Academy</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:22px;color:#0f172a;margin:0 0 16px;">Tu acceso a WCA Hub, ${firstName}</h2>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      ${isStaff ? `Sos parte del equipo WCA como <strong>${roleLabel}</strong>.` : `Tu matrícula en WCA Academy está activa.`}
      Iniciá sesión con tu cuenta de <strong>Google</strong>.
    </p>
    <a href="${portalUrl}" style="display:block;text-align:center;background:#155266;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:16px;">Acceder a WCA Hub →</a>
    <div style="background:#f8fafc;border-radius:8px;padding:12px 16px;font-size:12px;color:#64748b;text-align:center;">
      Iniciá sesión con: <strong style="color:#0f172a;">${email}</strong>
    </div>
  </div>
</div></body></html>`;

  await sendEmail({ to: email, toName: profile.full_name || email, subject: `Tu acceso a WCA Hub — ${roleLabel}`, html });
  return { message: `Email reenviado a ${email}`, role, portalUrl };
}

async function handleTestEmail(req, actor) {
  const { to } = req.body;
  const target   = to || actor.email;
  const domain   = process.env.MAILRELAY_DOMAIN   || '(NO CONFIGURADO)';
  const apiKey   = process.env.MAILRELAY_API_KEY  || '';
  const fromEmail= process.env.MAILRELAY_FROM_EMAIL || 'no-reply@worldconnectacademy.com';
  const fromName = process.env.MAILRELAY_FROM_NAME  || 'WCA Academy';

  if (!apiKey || !domain || domain === '(NO CONFIGURADO)') {
    return { error: 'Mailrelay no configurado', domain, keyConfigured: false };
  }

  // Try all known Mailrelay endpoints to find the correct one
  const endpoints = [
    'send_email', 'send_emails', 'push_emails', 'push_mailing',
    'send_mailing', 'transactional', 'messages', 'email',
  ];

  const baseBody = {
    from_name:  fromName,
    from_email: fromEmail,
    to:         [{ email: target, name: target }],
    subject:    'Test WCA Hub',
    html:       '<p>Email de prueba desde WCA Hub.</p>',
  };

  const headers = {
    'X-Auth-Token': apiKey, 'x-auth-token': apiKey,
    'Content-Type': 'application/json', 'Accept': 'application/json',
  };

  const results = {};
  for (const ep of endpoints) {
    const url = `https://${domain}/api/v1/${ep}`;
    try {
      const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(baseBody) });
      const text = await r.text();
      let json = null; try { json = JSON.parse(text); } catch {}
      results[ep] = { status: r.status, ok: r.ok, response: json || text.slice(0, 100) };
      // Stop if we get a non-404 response (even an error like 422 means endpoint exists)
      if (r.status !== 404) break;
    } catch(e) {
      results[ep] = { error: e.message };
    }
  }

  const working = Object.entries(results).find(([, v]) => v.ok);
  const nonNotFound = Object.entries(results).find(([, v]) => v.status && v.status !== 404);

  return {
    target, domain, keyConfigured: apiKey.length > 10,
    results,
    workingEndpoint: working?.[0] || null,
    bestEndpoint:    nonNotFound?.[0] || null,
    summary: working
      ? `✓ Email enviado via ${working[0]}`
      : nonNotFound
        ? `Endpoint encontrado: ${nonNotFound[0]} (status ${nonNotFound[1].status})`
        : 'Todos los endpoints devuelven 404 — verificar dominio o plan de Mailrelay',
  };
}

// ── Main handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { checkRateLimit(`invite:${req.headers['x-forwarded-for']||'x'}`, 15, 60000); } catch(e) { return err(res, e); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    const { action = 'student' } = req.body;

    switch (action) {
      case 'student':
        requireRole(actor, 'admin', 'super_admin', 'coordinadora');
        return ok(res, await handleStudent(req, actor), 201);

      case 'staff':
        requireRole(actor, 'admin', 'super_admin');
        return ok(res, await handleStaff(req, actor), 201);

      case 'resend':
        requireRole(actor, 'admin', 'super_admin');
        return ok(res, await handleResend(req, actor));

      case 'test-email':
        requireRole(actor, 'admin', 'super_admin');
        return ok(res, await handleTestEmail(req, actor));

      default:
        return err(res, { status: 400, message: `action desconocida: ${action}` });
    }
  } catch(e) { return err(res, e); }
}
