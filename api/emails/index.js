// POST /api/emails?action=welcome|reminders|blast
// Merged to stay within Vercel Hobby 12-function limit
import {
  requireAuth, requireRole, getSupabaseAdmin,
  sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit,
} from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action || req.body?.action;
  if (action === 'welcome')    return handleWelcome(req, res);
  if (action === 'reminders')  return handleReminders(req, res);
  if (action === 'blast')      return handleBlast(req, res);    // C1: new endpoint

  // Legacy: no action → welcome (backward compat)
  if (!action) return handleWelcome(req, res);

  return res.status(400).json({ error: 'action required: welcome | reminders | blast' });
}

// ── WELCOME — sends onboarding email to the calling student ──────
async function handleWelcome(req, res) {
  try {
    await checkRateLimit(`welcome:${req.headers['x-forwarded-for']||'x'}`, 10, 60000);
  } catch(e) { return err(res, e); }

  try {
    const { profile: actor } = await requireAuth(req);
    const admin = getSupabaseAdmin();

    const { data: student } = await admin
      .from('students')
      .select(`id, profile:profiles(full_name, email),
        enrollments(id, program_id, current_unit,
          group:groups(schedule, days, teams_link))`)
      .eq('profile_id', actor.id)
      .maybeSingle();

    if (!student) return err(res, { status: 404, message: 'Perfil de estudiante no encontrado' });

    const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
    const enroll  = student.enrollments?.[0];
    const group   = enroll?.group;
    const nextClass = group?.schedule ? `${group.days || 'L·M·V'} · ${group.schedule}` : null;

    const { subject, html } = EmailTemplates.welcome({
      name:        student.profile.full_name.split(' ')[0],
      programName: programNames[enroll?.program_id] || 'WCA Academy',
      teamsLink:   group?.teams_link || null,
      nextClass,
    });

    await sendEmail({ to: student.profile.email, toName: student.profile.full_name, subject, html });
    return ok(res, { message: 'Email de bienvenida enviado', email: student.profile.email });
  } catch(e) { return err(res, e); }
}

// ── REMINDERS — sends overdue reminders to all past-due students ─
async function handleReminders(req, res) {
  try {
    await checkRateLimit(`reminders:${req.headers['x-forwarded-for']||'x'}`, 5, 60000);
  } catch(e) { return err(res, e); }

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'cobros', 'admin', 'super_admin');

    const { studentIds, daysOverdue = 5 } = req.body || {};
    const admin  = getSupabaseAdmin();
    const today  = new Date().toISOString().slice(0, 10);

    let query = admin
      .from('enrollments')
      .select(`id, program_id, status, price_locked, next_payment_date,
        student:students(id, profile:profiles(full_name, email, active))`)
      .eq('status', 'active')
      .not('next_payment_date', 'is', null)
      .lte('next_payment_date', today);

    if (studentIds?.length) query = query.in('student_id', studentIds);

    const { data: overdueEnrollments } = await query;
    if (!overdueEnrollments?.length) return ok(res, { message: 'No hay pagos vencidos para notificar', sent: 0 });

    const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
    let sent = 0;
    const errors = [];

    for (const enroll of overdueEnrollments) {
      const student = enroll.student;
      if (!student?.profile?.email || student.profile.active === false) continue;

      const dueDate = new Date(enroll.next_payment_date);
      const actualDaysOverdue = Math.max(0, Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24)));

      try {
        const { subject, html } = EmailTemplates.paymentReminder({
          name:        student.profile.full_name.split(' ')[0],
          programName: programNames[enroll.program_id] || 'WCA Academy',
          amount:      enroll.price_locked || 95,
          daysOverdue: actualDaysOverdue,
        });
        await sendEmail({ to: student.profile.email, toName: student.profile.full_name, subject, html });
        sent++;
        await new Promise(r => setTimeout(r, 100));
      } catch(e) { errors.push({ studentId: student.id, error: e.message }); }
    }

    await admin.from('audit_log').insert({
      actor_id: actor.id, action: 'sent_payment_reminders', entity: 'payment',
      metadata: { sent, errors: errors.length, daysOverdue },
    });

    return ok(res, { message: `Recordatorios enviados: ${sent}`, sent, errors });
  } catch(e) { return err(res, e); }
}

// ── BLAST — C1 FIX: sends custom email to a specific recipient ───
// Called in a loop from ComunicacionesSection for each student
// Body: { to, toName, subject, html }
// Auth: admin, super_admin
async function handleBlast(req, res) {
  try {
    await checkRateLimit(`blast:${req.headers['x-forwarded-for']||'x'}`, 200, 60000);
  } catch(e) { return err(res, e); }

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin');

    const { to, toName, subject, html } = req.body || {};
    if (!to || !subject || !html) {
      return err(res, { status: 400, message: 'to, subject y html son requeridos' });
    }

    await sendEmail({ to, toName: toName || to, subject, html });
    return ok(res, { message: `Email enviado a ${to}` });
  } catch(e) { return err(res, e); }
}
