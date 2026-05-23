// POST /api/emails/reminders
// Body: { studentIds?: string[], daysOverdue?: number }
// Auth: cobros, admin, super_admin

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, CORS } from '../_utils.js';

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'cobros', 'admin', 'super_admin');

    const { studentIds, daysOverdue = 5 } = req.body || {};
    const admin = getSupabaseAdmin();

    // Get overdue students: active enrollments with no confirmed payment in current month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    let query = admin
      .from('students')
      .select(`
        id,
        profile:profiles(full_name, email, active),
        enrollments(
          id, program_id, status, price_locked,
          payments(id, status, created_at)
        )
      `)
      .eq('profiles.active', true);

    if (studentIds?.length) query = query.in('id', studentIds);

    const { data: students } = await query;
    if (!students?.length) return ok(res, { message: 'No hay estudiantes para notificar', sent: 0 });

    const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };

    let sent = 0;
    const errors = [];

    for (const student of students) {
      if (!student.profile?.email) continue;

      const activeEnroll = student.enrollments?.find(e => e.status === 'active');
      if (!activeEnroll) continue;

      // Check if already paid this month
      const paidThisMonth = activeEnroll.payments?.some(p =>
        p.status === 'confirmed' && p.created_at >= firstOfMonth
      );
      if (paidThisMonth) continue;

      try {
        const { subject, html } = EmailTemplates.paymentReminder({
          name:        student.profile.full_name.split(' ')[0],
          programName: programNames[activeEnroll.program_id] || 'WCA Academy',
          amount:      activeEnroll.price_locked || 95,
          daysOverdue,
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
