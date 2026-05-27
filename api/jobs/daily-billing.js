// GET /api/jobs/daily-billing
// Cron: runs daily at 9am UTC
// - Sends pre-reminders 5 days before due
// - Sends overdue notices on due date
// - Auto-suspends after 15 days overdue
// Auth: Vercel cron token OR internal

import { getSupabaseAdmin, sendEmail, EmailTemplates, requireAuth, addOneMonth } from '../_utils.js';

const GRACE_DAYS    = 5;   // warn before due
const SUSPEND_DAYS  = 15;  // auto-suspend after X days overdue
const PROG_NAMES    = { en:'Inglés Completo', va:'Asistente Virtual',
                        va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };

export default async function handler(req, res) {
  // Allow: (1) Vercel cron, (2) matching CRON_SECRET env var, (3) super_admin JWT
  const isCron   = req.headers['x-vercel-cron'] === '1';
  const cronEnv  = process.env.CRON_SECRET;
  const isSecret = cronEnv && req.headers['x-cron-secret'] === cronEnv;

  let isAdmin = false;
  if (!isCron && !isSecret) {
    try {
      const { profile } = await requireAuth(req);
      isAdmin = profile.role === 'super_admin';
    } catch (_) {}
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') return res.status(405).end();

  const admin = getSupabaseAdmin();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const results = {
    preReminders:  { sent: 0, errors: [] },
    dueToday:      { sent: 0, errors: [] },
    overdueWarning:{ sent: 0, errors: [] },
    autoSuspended: { count: 0, errors: [] },
  };

  try {
    // Load all active enrollments with next_payment_date
    const { data: enrollments } = await admin
      .from('enrollments')
      .select(`
        id, program_id, status, price_locked, next_payment_date,
        student:students(
          id,
          profile:profiles(id, full_name, email, active)
        )
      `)
      .in('status', ['active'])
      .not('next_payment_date', 'is', null);

    if (!enrollments?.length) {
      return res.status(200).json({ message: 'No active enrollments', results });
    }

    for (const enroll of enrollments) {
      const profile = enroll.student?.profile;
      if (!profile?.email || profile.active === false) continue;

      const dueDate    = new Date(enroll.next_payment_date);
      const diffDays   = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      const daysLate   = -diffDays; // positive = overdue
      const firstName  = profile.full_name?.split(' ')[0] || 'Estudiante';
      const programName= PROG_NAMES[enroll.program_id] || 'WCA Academy';
      const amount     = enroll.price_locked || 95;

      // ── A: Pre-reminder — 5 days before due (window [5,6] for 1-day cron recovery) ──
      if (diffDays >= GRACE_DAYS && diffDays <= GRACE_DAYS + 1) {
        try {
          await sendEmail({
            to: profile.email, toName: profile.full_name,
            subject: `📅 Tu pago vence en ${GRACE_DAYS} días — WCA Academy`,
            html: `<p>Hola ${firstName},</p>
              <p>Tu próximo pago de <strong>$${amount}</strong> para <strong>${programName}</strong> 
              vence el <strong>${new Date(enroll.next_payment_date).toLocaleDateString('es-HN',{day:'2-digit',month:'long'})}</strong>.</p>
              <p>Para realizar tu pago, ingresá a tu portal y elegí el método de pago o coordiná con tu asesor.</p>
              <p style="color:#666;font-size:12px">WCA Academy · wcahub.vercel.app</p>`,
          });
          results.preReminders.sent++;
        } catch(e) { results.preReminders.errors.push({ id: enroll.id, error: e.message }); }
      }

      // ── B: Due today ──
      else if (diffDays === 0) {
        try {
          await sendEmail({
            to: profile.email, toName: profile.full_name,
            subject: `⚠️ Tu pago vence HOY — WCA Academy`,
            html: `<p>Hola ${firstName},</p>
              <p>Tu pago de <strong>$${amount}</strong> para <strong>${programName}</strong> 
              vence <strong>hoy</strong>.</p>
              <p>Realizá tu transferencia y enviá el comprobante para mantener tu cuenta activa.</p>
              <p style="color:#666;font-size:12px">WCA Academy · wcahub.vercel.app</p>`,
          });
          results.dueToday.sent++;
        } catch(e) { results.dueToday.errors.push({ id: enroll.id, error: e.message }); }
      }

      // ── C: Overdue warning (D+5 to D+6, window allows 1-day cron recovery) ──
      else if (daysLate >= GRACE_DAYS && daysLate <= GRACE_DAYS + 1) {
        try {
          const { subject, html } = EmailTemplates.paymentReminder({
            name: firstName, programName, amount, daysOverdue: daysLate,
          });
          await sendEmail({ to: profile.email, toName: profile.full_name, subject, html });
          results.overdueWarning.sent++;
        } catch(e) { results.overdueWarning.errors.push({ id: enroll.id, error: e.message }); }
      }

      // ── D: Auto-suspend after SUSPEND_DAYS ──
      else if (daysLate >= SUSPEND_DAYS) {
        try {
          // Check if already suspended
          const { data: current } = await admin
            .from('enrollments').select('status').eq('id', enroll.id).maybeSingle();
          if (current?.status === 'active') {
            // Safety check: do NOT suspend if there's a pending payment in the last 5 days
            const fiveDaysAgo = new Date(today);
            fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
            // Check by enrollment_id first; fall back to student_id if enrollment_id was null
            let pendingQuery = admin.from('payments')
              .select('id')
              .eq('status', 'pending')
              .gte('created_at', fiveDaysAgo.toISOString())
              .limit(1);
            pendingQuery = pendingQuery.eq('enrollment_id', enroll.id);
            let { data: recentPending } = await pendingQuery;
            // Fallback: check by student_id (covers payments without enrollment_id)
            if (!recentPending?.length) {
              const { data: byStudent } = await admin.from('payments')
                .select('id').eq('student_id', enroll.student.id)
                .eq('status', 'pending').gte('created_at', fiveDaysAgo.toISOString()).limit(1);
              recentPending = byStudent;
            }
            if (recentPending?.length) {
              await admin.from('audit_log').insert({
                action: 'auto_suspend_skipped',
                entity: 'enrollment',
                entity_id: enroll.id,
                metadata: { reason: 'pending_payment_found', days_overdue: daysLate },
              }).catch(() => {});
              continue; // skip — student has a pending payment being reviewed
            }
            await admin.from('enrollments').update({
              status:           'suspended',
              suspended_at:     today.toISOString(),
              suspended_reason: `Auto-suspendido por falta de pago — ${daysLate} días vencido`,
            }).eq('id', enroll.id);

            // Check if student has other active enrollments
            const { data: others } = await admin
              .from('enrollments').select('id')
              .eq('student_id', enroll.student.id)
              .eq('status', 'active')
              .neq('id', enroll.id);

            if (!others?.length) {
              await admin.from('profiles')
                .update({ active: false })
                .eq('id', profile.id);
            }

            // Notify student
            await sendEmail({
              to: profile.email, toName: profile.full_name,
              subject: `⛔ Tu cuenta WCA ha sido suspendida`,
              html: `<p>Hola ${firstName},</p>
                <p>Tu matrícula en <strong>${programName}</strong> ha sido <strong>suspendida</strong> 
                por ${daysLate} días de pago pendiente.</p>
                <p>Para reactivar tu cuenta, regularizá tu pago y contactá a cobros.</p>
                <p style="color:#666;font-size:12px">WCA Academy · wcahub.vercel.app</p>`,
            }).catch(() => {});

            // Log audit
            await admin.from('audit_log').insert({
              action: 'auto_suspended',
              entity: 'enrollment',
              entity_id: enroll.id,
              metadata: { days_overdue: daysLate, program: enroll.program_id, student: profile.full_name },
            }).catch(() => {});

            results.autoSuspended.count++;
          }
        } catch(e) { results.autoSuspended.errors.push({ id: enroll.id, error: e.message }); }
      }
    }

    // Final log — mark as degraded if too many errors
    const totalErrors = Object.values(results).reduce((sum, r) => sum + (r.errors?.length || 0), 0);
    const totalSent   = Object.values(results).reduce((sum, r) => sum + (r.sent || r.count || 0), 0);
    const isDegraded  = totalErrors > 0 && totalErrors >= totalSent;

    await admin.from('audit_log').insert({
      action: isDegraded ? 'daily_billing_degraded' : 'daily_billing_run',
      entity: 'system',
      metadata: { date: todayStr, results, degraded: isDegraded, totalErrors, totalSent },
    }).catch(() => {});

    return res.status(200).json({
      message: isDegraded ? 'Daily billing completed with errors' : 'Daily billing processed',
      date: todayStr,
      degraded: isDegraded,
      results,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
