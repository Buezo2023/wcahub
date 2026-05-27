// POST /api/auth/invite
// Body: { action, ...params }
//
// action = 'student'  → crea estudiante + enrollment (admin/coordinadora)
// action = 'staff'    → crea staff con rol correcto + email de staff (admin/super_admin)
// action = 'resend'   → reenvía email de acceso a usuario existente (admin/super_admin)
// action = 'test-email' → prueba Mailrelay (super_admin only)

import {
  requireAuth, requireRole, getSupabaseAdmin,
  sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit, addOneMonth,
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
  const { email, fullName, programId = 'en', level = 'A1', price = 95, groupId, scholarship = false, forceStudent = false } = req.body;
  if (!email || !fullName) return { status: 400, message: 'email y fullName son requeridos' };

  const admin = getSupabaseAdmin();

  // ── Dual-role guard: warn if email already has an active staff record ──
  if (!forceStudent) {
    const { data: staffCheck } = await admin.from('profiles')
      .select('id, role, staff(id, active)')
      .eq('email', email).maybeSingle();
    if (staffCheck) {
      const activeStaff = staffCheck.staff?.filter(s => s.active) || [];
      if (activeStaff.length > 0) {
        return {
          status: 409,
          message: `${email} ya es miembro del staff (rol: ${staffCheck.role}). ` +
            `Matricularlo como estudiante duplicará su cuenta. ` +
            `Enviá forceStudent:true si estás seguro.`,
          conflict: true,
          currentRole: staffCheck.role,
        };
      }
    }
  }

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
  const { data: existSt } = await admin.from('students').select('id').eq('profile_id', userId).maybeSingle();
  let student;
  if (existSt) {
    const { data, error: sErr } = await admin.from('students').update({ level }).eq('id', existSt.id).select().maybeSingle();
    if (sErr) throw sErr;
    student = data;
  } else {
    const { data, error: sErr } = await admin.from('students').insert({ profile_id: userId, level, scholarship }).select().maybeSingle();
    if (sErr) throw sErr;
    student = data;
  }

  // Set next_payment_date: same day of month, next occurrence (safe – no 31-day overflow)
  const _now = new Date();
  const _todayStr = _now.toISOString().slice(0, 10);
  // Build current-month candidate at day-of-enrollment
  const _padDay = String(_now.getUTCDate()).padStart(2, '0');
  const _padMon = String(_now.getUTCMonth() + 1).padStart(2, '0');
  const _thisMonthDate = `${_now.getUTCFullYear()}-${_padMon}-${_padDay}`;
  // If that date is today or in the past, advance by one month safely
  const _nextPayStr = _thisMonthDate <= _todayStr
    ? addOneMonth(_thisMonthDate)
    : _thisMonthDate;

  const { data: enrollment, error: eErr } = await admin.from('enrollments').upsert({
    student_id: student.id, program_id: programId, group_id: groupId || null,
    status: 'active', current_unit: 1, price_locked: price,
    next_payment_date: _nextPayStr,
  }, { onConflict: 'student_id,program_id' }).select().maybeSingle();
  if (eErr) throw eErr;

  await admin.from('audit_log').insert({ actor_id: actor.id, action: 'invited_student', entity: 'student', entity_id: student.id, metadata: { email, programId, level } });

  if (isNewUser) {
    try {
      const progNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA·Marketing', va_legal:'VA·Legal', va_care:'VA·Cuidador' };
      const { subject, html } = EmailTemplates.invite({ name: fullName.split(' ')[0], email, programName: progNames[programId] || programId, studentCode: student.student_code || null });
      await sendEmail({ to: email, toName: fullName, subject, html });
    } catch(e) { console.error('Student email:', e.message); }
  }
  return { message: `Estudiante ${existingProfile ? 'matriculado' : 'invitado'} exitosamente`, studentId: student.id, studentCode: student.student_code, enrolled: !!enrollment, emailSent: isNewUser };
}

async function handleStaff(req, actor) {
  const { email, fullName, role = 'Docente', salary, hireDate, forceStaff = false } = req.body;
  if (!email || !fullName) return { status: 400, message: 'email y fullName son requeridos' };

  const supabaseRole = ROLE_MAP[role] || 'docente';
  const portalUrl    = `https://wcahub.vercel.app${PORTAL_MAP[supabaseRole] || '/portal'}`;
  const admin        = getSupabaseAdmin();

  // ── Dual-role guard: prevent a student with active enrollments from becoming staff ──
  // Pass forceStaff=true in the body to override (super_admin only).
  if (!forceStaff) {
    const { data: existingProf } = await admin.from('profiles')
      .select('id, role, students(id, enrollments(id, status))')
      .eq('email', email).maybeSingle();
    if (existingProf) {
      const activeEnrolls = existingProf.students?.flatMap(s => s.enrollments || [])
        .filter(e => e.status === 'active') || [];
      if (activeEnrolls.length > 0) {
        return {
          status: 409,
          message: `${email} tiene ${activeEnrolls.length} matrícula(s) activa(s) como estudiante. ` +
            `Cambiar su rol a ${role} puede bloquear su acceso al portal. ` +
            `Enviá forceStaff:true si estás seguro.`,
          conflict: true,
          activeEnrollments: activeEnrolls.length,
        };
      }
    }
  }

  const { data: existing } = await admin.from('profiles').select('id, role').eq('email', email).maybeSingle();
  let userId, isNew = false;

  let supabaseInviteSent = false;

  if (existing) {
    userId = existing.id;
    if (existing.role !== supabaseRole)
      await admin.from('profiles').update({ role: supabaseRole, active: true }).eq('id', userId);
  } else {
    // Use inviteUserByEmail → Supabase sends the invite email automatically
    // (magic link to the right portal). Works without a custom email domain.
    const { data: invited, error: invErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `https://wcahub.vercel.app${PORTAL_MAP[supabaseRole] || '/portal'}`,
      data: { full_name: fullName, role: supabaseRole },
    });

    if (invErr) {
      // User already exists in Auth but not in profiles — look them up
      if (invErr.message?.includes('already been registered') || invErr.status === 422) {
        const { data: { users } } = await admin.auth.admin.listUsers();
        const found = users.find(u => u.email === email);
        if (found) { userId = found.id; }
        else throw invErr;
      } else throw invErr;
    } else {
      userId = invited.user.id;
      isNew = true;
      supabaseInviteSent = true; // Supabase sent the invite email
    }
  }

  const { error: profErr } = await admin.from('profiles').upsert(
    { id: userId, email, full_name: fullName, role: supabaseRole, active: true },
    { onConflict: 'id' }
  );
  if (profErr) throw new Error('Error guardando perfil: ' + profErr.message);

  // Check if staff record exists, then insert or update
  const { data: existingStaff } = await admin.from('staff')
    .select('id').eq('profile_id', userId).maybeSingle();

  let staffRow;
  if (existingStaff) {
    const { data, error: updErr } = await admin.from('staff')
      .update({ position: role, department: role === 'Docente' ? 'Académico' : 'Administrativo',
        salary: salary ? Number(salary) : null, active: true })
      .eq('id', existingStaff.id).select().maybeSingle();
    if (updErr) throw new Error('Error actualizando staff: ' + updErr.message);
    staffRow = data;
  } else {
    const { data, error: insErr } = await admin.from('staff')
      .insert({ profile_id: userId, position: role,
        department: role === 'Docente' ? 'Académico' : 'Administrativo',
        salary: salary ? Number(salary) : null,
        hire_date: hireDate || new Date().toISOString().slice(0, 10),
        active: true })
      .select().maybeSingle();
    if (insErr) throw new Error('Error creando staff: ' + insErr.message);
    staffRow = data;
  }

  try { await admin.from('audit_log').insert({ actor_id: actor.id, action: 'invited_staff', entity: 'staff', entity_id: staffRow?.id || userId, metadata: { email, role, fullName } }); } catch(_) {}

  // Send invite email — try multiple methods
  let emailSent = supabaseInviteSent;
  let emailNote = '';

  // If user already existed (no Supabase invite sent), try resending invite
  if (!emailSent) {
    try {
      const { error: reInvErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: portalUrl,
        data: { full_name: fullName, role: supabaseRole },
      });
      if (!reInvErr) emailSent = true;
    } catch(_) {}
  }

  // Also try Resend for branded email (works when domain is verified)
  let resendSent = false;
  try {
    const { subject, html } = staffEmailHtml({ name: fullName, role, portalUrl, email });
    await sendEmail({ to: email, toName: fullName, subject, html });
    resendSent = true;
  } catch(_) {}

  emailSent = emailSent || resendSent;
  emailNote = emailSent
    ? 'email de invitación enviado (revisá bandeja + spam)'
    : 'usuario creado — reenviar invitación desde RRHH con botón ✉';

  return {
    message: `${fullName} agregado/a como ${role} — ${emailNote}`,
    userId, role: supabaseRole, emailSent, isNew,
    supabaseInviteSent, resendSent,
  };
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
  const { to }    = req.body;
  const target    = to || actor.email;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName  = process.env.MAILRELAY_FROM_NAME || "WCA Academy";

  if (!resendKey) {
    return {
      target, configured: false, ok: false,
      summary: "RESEND_API_KEY no configurada en Vercel",
    };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [target],
        subject: "✅ Test WCA Hub",
        html:    `<p>Resend funcionando correctamente. Para: ${target}</p>`,
      }),
    });
    const raw = await r.text();
    let data  = {};
    try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 200) }; }

    if (r.ok) {
      return { target, configured: true, status: r.status, ok: true,
               summary: `✓ Email enviado a ${target} — revisá tu bandeja` };
    }
    return { target, configured: true, status: r.status, ok: false,
             summary: `Error Resend ${r.status}: ${data.message || data.name || raw.slice(0, 100)}` };
  } catch(e) {
    return { target, configured: true, ok: false,
             summary: "Error de red: " + e.message };
  }
}


async function handleResendSupabase(req, actor) {
  const { email } = req.body;
  if (!email) return { status: 400, ok: false, message: 'email requerido' };

  const admin = getSupabaseAdmin();

  // Look up profile to get the correct portal
  const { data: profile } = await admin.from('profiles')
    .select('id, full_name, role')
    .eq('email', email)
    .maybeSingle();

  if (!profile) return { ok: false, message: `No se encontró usuario con email ${email}` };

  const PORTAL_MAP_LOCAL = {
    docente: '/docente', coordinadora: '/coordinacion', admin: '/admin',
    cobros: '/cobros', asesor_ventas: '/crm', super_admin: '/super', estudiante: '/portal',
  };
  const portalPath = PORTAL_MAP_LOCAL[profile.role] || '/portal';

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `https://wcahub.vercel.app${portalPath}`,
    data: { full_name: profile.full_name, role: profile.role },
  });

  if (error) {
    // If already invited/confirmed, Supabase returns 422 — still works via Google OAuth
    if (error.status === 422 || error.message?.includes('already')) {
      return { ok: true, message: `La cuenta ya fue activada — ${email} puede ingresar con Google directamente` };
    }
    return { ok: false, message: `Error Supabase: ${error.message}` };
  }

  return { ok: true, message: `Invitación enviada a ${email} — revisá bandeja + spam` };
}

// ── Main handler ───────────────────────────────────────────────────

// ── action = 'magic-link' → send OTP email with rate limiting ─────
async function handleMagicLink(req, res, admin) {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return err(res, { status: 400, message: 'Email requerido' });
  }
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return err(res, { status: 400, message: 'Email inválido' });
  }
  // Rate limit by email (3/15min) and IP (5/15min)
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  try {
    await checkRateLimit(`magic:email:${normalized}`, 3, 15 * 60 * 1000);
    await checkRateLimit(`magic:ip:${ip}`, 5, 15 * 60 * 1000);
  } catch (_) {
    // Anti-enumeration: always return success even when rate limited
    return ok(res, { sent: true, limited: true });
  }
  // Generate magic link server-side — silently ignore if user doesn't exist
  try {
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalized,
      options: { redirectTo: `${process.env.SITE_URL || 'https://wcahub.vercel.app'}/auth/callback` },
    });
  } catch (_) { /* anti-enumeration: swallow errors */ }
  return ok(res, { sent: true });
}

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { await checkRateLimit(`invite:${req.headers['x-forwarded-for']||'x'}`, 15, 60000); } catch(e) { return err(res, e); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // magic-link is public (no auth required — it's the recovery entry point)
  if (req.body?.action === 'magic-link') {
    const admin = getSupabaseAdmin();
    return handleMagicLink(req, res, admin);
  }

  try {
    const { profile: actor } = await requireAuth(req);
    const { action = 'student' } = req.body;

    switch (action) {
      case 'student':
        requireRole(actor, 'admin', 'super_admin', 'coordinadora');
        return ok(res, await handleStudent(req, actor), 201);

      case 'staff': {
        // coordinadora can only invite docentes, not other roles
        const staffRole = req.body?.role || 'Docente';
        if (actor.role === 'coordinadora' && staffRole !== 'Docente') {
          return err(res, { status: 403, message: 'Coordinadora solo puede agregar docentes' });
        }
        requireRole(actor, 'admin', 'super_admin', 'coordinadora');
        return ok(res, await handleStaff(req, actor), 201);
      }

      case 'resend':
        requireRole(actor, 'admin', 'super_admin');
        return ok(res, await handleResend(req, actor));

      case 'resend-supabase':
        requireRole(actor, 'admin', 'super_admin');
        return ok(res, await handleResendSupabase(req, actor));

      case 'test-email':
        requireRole(actor, 'admin', 'super_admin');
        return ok(res, await handleTestEmail(req, actor));

      // ── change-role (merged from api/auth/role.js) ────────────
    case 'change-role': {
      requireRole(actor, 'super_admin');
      const { userId, role: newRole } = req.body;
      if (!userId || !newRole) return err(res, { status: 400, message: 'userId y role son requeridos' });
      const VALID_ROLES = ['estudiante','docente','admin','super_admin','asesor_ventas','cobros','coordinadora','directivo'];
      if (!VALID_ROLES.includes(newRole)) return err(res, { status: 400, message: `Rol inválido. Opciones: ${VALID_ROLES.join(', ')}` });
      const adminCR = getSupabaseAdmin();
      const { data: updated, error: roleErr } = await adminCR.from('profiles')
        .update({ role: newRole }).eq('id', userId)
        .select('id, email, full_name, role').maybeSingle();
      if (roleErr) throw roleErr;
      await adminCR.from('audit_log').insert({
        actor_id: actor.id, action: 'changed_role', entity: 'profile',
        entity_id: userId, metadata: { new_role: newRole },
      });
      return ok(res, { message: `Rol actualizado a ${newRole}`, profile: updated });
    }

    // ── resolve-conflict: limpia doble registro staff/student ────────
    case 'resolve-conflict': {
      requireRole(actor, 'super_admin', 'admin');
      const { userId, resolution } = req.body;
      // resolution: 'keep-staff' | 'keep-student'
      if (!userId || !['keep-staff', 'keep-student'].includes(resolution)) {
        return err(res, { status: 400, message: 'userId y resolution (keep-staff|keep-student) son requeridos' });
      }
      const adminRC = getSupabaseAdmin();

      // Load full user data
      const { data: user } = await adminRC.from('profiles')
        .select('id, email, full_name, role, students(id, enrollments(id, status)), staff(id, active)')
        .eq('id', userId).maybeSingle();
      if (!user) return err(res, { status: 404, message: 'Usuario no encontrado' });

      const auditMeta = { resolution, email: user.email, old_role: user.role };

      if (resolution === 'keep-staff') {
        // 1. Set role to docente (or existing staff role if already set)
        const targetRole = ['docente','coordinadora','admin','cobros','asesor_ventas','directivo'].includes(user.role)
          ? user.role : 'docente';
        await adminRC.from('profiles').update({ role: targetRole, active: true }).eq('id', userId);

        // 2. Suspend all active student enrollments
        const activeEnrolls = user.students?.flatMap(s => s.enrollments || [])
          .filter(e => e.status === 'active') || [];
        for (const enroll of activeEnrolls) {
          await adminRC.from('enrollments').update({
            status: 'suspended',
            suspended_at: new Date().toISOString(),
            suspended_reason: `Suspendido: usuario migrado a rol ${targetRole} (resolución de conflicto)`,
          }).eq('id', enroll.id);
        }

        auditMeta.new_role = targetRole;
        auditMeta.enrollments_suspended = activeEnrolls.length;
        await adminRC.from('audit_log').insert({
          actor_id: actor.id, action: 'resolved_conflict_kept_staff',
          entity: 'profile', entity_id: userId, metadata: auditMeta,
        });
        return ok(res, {
          message: `${user.full_name} mantenido como ${targetRole}. ${activeEnrolls.length} matrícula(s) suspendida(s).`,
          newRole: targetRole, enrollmentsSuspended: activeEnrolls.length,
        });
      }

      if (resolution === 'keep-student') {
        // 1. Set role to estudiante
        await adminRC.from('profiles').update({ role: 'estudiante', active: true }).eq('id', userId);

        // 2. Deactivate all staff records
        const staffIds = user.staff?.map(s => s.id) || [];
        for (const staffId of staffIds) {
          await adminRC.from('staff').update({ active: false }).eq('id', staffId);
        }

        auditMeta.new_role = 'estudiante';
        auditMeta.staff_deactivated = staffIds.length;
        await adminRC.from('audit_log').insert({
          actor_id: actor.id, action: 'resolved_conflict_kept_student',
          entity: 'profile', entity_id: userId, metadata: auditMeta,
        });
        return ok(res, {
          message: `${user.full_name} mantenido como estudiante. ${staffIds.length} registro(s) de staff desactivado(s).`,
          newRole: 'estudiante', staffDeactivated: staffIds.length,
        });
      }
    }

    // ── GDPR: export my data ──────────────────────────────────────────
    case 'export-data': {
      const uid = actor.id;
      // Gather all personal data for this user
      const [profileRes, studentRes, enrollRes, payRes, progressRes] = await Promise.all([
        admin.from('profiles').select('*').eq('id', uid).maybeSingle(),
        admin.from('students').select('*').eq('profile_id', uid).maybeSingle(),
        admin.from('enrollments').select('*, groups(schedule, level, days)').eq('student_id',
          (await admin.from('students').select('id').eq('profile_id', uid).maybeSingle()).data?.id || ''
        ),
        admin.from('payments').select('amount, status, method, confirmed_at, reference_code').eq('student_id',
          (await admin.from('students').select('id').eq('profile_id', uid).maybeSingle()).data?.id || ''
        ),
        admin.from('progress').select('*').eq('profile_id', uid),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        platform: 'WCA Hub — World Connect Academy',
        profile: profileRes.data || {},
        student: studentRes.data || {},
        enrollments: enrollRes.data || [],
        payments: payRes.data || [],
        progress: progressRes.data || [],
      };

      // Remove sensitive internal fields
      delete exportData.profile.id;
      delete exportData.student.profile_id;

      return ok(res, { export: exportData });
    }

    // ── GDPR: delete my account ────────────────────────────────────
    case 'delete-account': {
      const { confirmEmail } = req.body;
      // Require email confirmation to prevent accidental deletion
      if (!confirmEmail || confirmEmail.toLowerCase() !== actor.email.toLowerCase()) {
        return err(res, { status: 400, message: 'Email de confirmación no coincide' });
      }

      const uid = actor.id;

      // 1. Cancel Stripe subscription if active
      try {
        const { data: student } = await admin.from('students').select('id, stripe_subscription_id')
          .eq('profile_id', uid).maybeSingle();
        if (student?.stripe_subscription_id) {
          const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
          await stripe.subscriptions.cancel(student.stripe_subscription_id).catch(() => {});
        }
      } catch (_) {}

      // 2. Soft delete — anonymize personal data, keep financial records for compliance
      const anonymized = `deleted_${Date.now()}`;
      await admin.from('profiles').update({
        full_name: 'Cuenta eliminada',
        email: `${anonymized}@deleted.wca`,
        phone: null,
        preferred_name: null,
        active: false,
        deleted_at: new Date().toISOString(),
      }).eq('id', uid);

      // 3. Deactivate enrollments
      const { data: st } = await admin.from('students').select('id').eq('profile_id', uid).maybeSingle();
      if (st?.id) {
        await admin.from('enrollments').update({ status: 'cancelled' })
          .eq('student_id', st.id).eq('status', 'active');
      }

      // 4. Revoke Supabase auth session
      await admin.auth.admin.deleteUser(uid).catch(() => {});

      // 5. Audit log
      try {
        await admin.from('audit_log').insert({
          actor_id: uid, action: 'account_deleted', entity: 'profile', entity_id: uid,
          metadata: { reason: 'user_request', gdpr: true },
        });
      } catch (_) {}

      return ok(res, { deleted: true });
    }

    default:
        return err(res, { status: 400, message: `action desconocida: ${action}` });
    }
  } catch(e) { return err(res, e); }
}
