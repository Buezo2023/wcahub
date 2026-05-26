// POST /api/emails?action=welcome|reminders
// Merged to stay within Vercel Hobby 12-function limit
import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action || req.body?.action;

  if (action === 'welcome') return handleWelcome(req, res);
  if (action === 'reminders') return handleReminders(req, res);

  // Legacy: POST /api/emails/welcome (no action) → welcome
  if (req.method === 'POST' && !action) return handleWelcome(req, res);

  return res.status(400).json({ error: 'action required: welcome|reminders' });
}

// POST /api/emails/welcome
// Body: { userId? } — if not provided, sends to calling user
// Auth: any authenticated user

import { requireAuth, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

async function handleWelcome(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`welcome:${ip}`, 10, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    const admin = getSupabaseAdmin();

    // Get full student info
    const { data: student } = await admin
      .from('students')
      .select(`
        id,
        profile:profiles(full_name, email),
        enrollments(
          id, program_id, current_unit,
          group:groups(schedule, days, teams_link)
        )
      `)
      .eq('profile_id', actor.id)
      .single();

    if (!student) return err(res, { status: 404, message: 'Perfil de estudiante no encontrado' });

    const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
    const enroll  = student.enrollments?.[0];
    const group   = enroll?.group;

    // Calculate next class day
    const nextClass = group?.schedule
      ? `${group.days || 'L·M·V'} · ${group.schedule}`
      : null;

    const { subject, html } = EmailTemplates.welcome({
      name:        student.profile.full_name.split(' ')[0],
      programName: programNames[enroll?.program_id] || 'WCA Academy',
      teamsLink:   group?.teams_link || null,
      nextClass,
    });

    await sendEmail({
      to:     student.profile.email,
      toName: student.profile.full_name,
      subject, html,
    });

    return ok(res, { message: 'Email de bienvenida enviado', email: student.profile.email });

  } catch (e) {
    return err(res, e);
  }
}


async function handleReminders(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`reminders:${ip}`, 5, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'cobros', 'admin', 'super_admin');

    const { studentIds, daysOverdue = 5 } = req.body || {};
    const admin = getSupabaseAdmin();

    // Smart detection using next_payment_date
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    // daysOverdue: also used as "days before due" for pre-reminders
    const dueCutoff = new Date(now);
    dueCutoff.setDate(dueCutoff.getDate() - daysOverdue);
    const cutoffDate = dueCutoff.toISOString().slice(0, 10);

    let query = admin
      .from('enrollments')
      .select(`
        id, program_id, status, price_locked, next_payment_date,
        student:students(
          id,
          profile:profiles(full_name, email, active)
        )
      `)
      .eq('status', 'active')
      .not('next_payment_date', 'is', null)
      .lte('next_payment_date', today); // due today or overdue

    if (studentIds?.length) {
      query = query.in('student_id', studentIds);
    }

    const { data: overdueEnrollments } = await query;
    if (!overdueEnrollments?.length) return ok(res, { message: 'No hay pagos vencidos para notificar', sent: 0 });

    const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };

    let sent = 0;
    const errors = [];

    for (const enroll of overdueEnrollments) {
      const student = enroll.student;
      if (!student?.profile?.email || student.profile.active === false) continue;

      const dueDate = new Date(enroll.next_payment_date);
      const actualDaysOverdue = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));

      // Wrap in student-like object for email template
      const activeEnroll = enroll;

      try {
        const { subject, html } = EmailTemplates.paymentReminder({
          name:        student.profile.full_name.split(' ')[0],
          programName: programNames[activeEnroll.program_id] || 'WCA Academy',
          amount:      activeEnroll.price_locked || 95,
          daysOverdue: actualDaysOverdue,
        });

        await sendEmail({
          to:     student.profile.email,
          toName: student.profile.full_name,
          subject, html,
        });

        sent++;
        await new Promise(r => setTimeout(r, 100)); // Rate limit: 10/sec
      } catch (e) {
        errors.push({ studentId: student.id, error: e.message });
      }
    }

    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    'sent_payment_reminders',
      entity:    'payment',
      entity_id: null,
      metadata:  { sent, errors: errors.length, daysOverdue },
    });

    return ok(res, { message: `Recordatorios enviados: ${sent}`, sent, errors });

  } catch (e) {
    return err(res, e);
  }
}
