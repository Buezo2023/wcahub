// PATCH /api/payments/confirm
// Body: { paymentId, action: 'confirm'|'reject', reason? }
// Auth: cobros, admin, super_admin

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`payment_confirm:${ip}`, 30, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'cobros', 'admin', 'super_admin');

    const { paymentId, action, reason } = req.body;
    if (!paymentId || !action) return err(res, { status: 400, message: 'paymentId y action requeridos' });
    if (!['confirm','reject'].includes(action)) return err(res, { status: 400, message: "action debe ser 'confirm' o 'reject'" });

    const admin = getSupabaseAdmin();

    // Get payment with student info
    const { data: payment } = await admin
      .from('payments')
      .select(`
        *, student:students(
          id,
          profile:profiles(full_name, email),
          enrollments(program_id)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (!payment) return err(res, { status: 404, message: 'Pago no encontrado' });
    if (payment.status !== 'pending') return err(res, { status: 409, message: `El pago ya está ${payment.status}` });

    const updates = action === 'confirm'
      ? { status: 'confirmed', confirmed_by: actor.id, confirmed_at: new Date().toISOString() }
      : { status: 'failed',    notes: reason || 'Rechazado por cobros' };

    const { data: updated, error } = await admin
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();
    if (error) throw error;

    // Advance next_payment_date by 1 month when payment is confirmed
    if (action === 'confirm' && payment.enrollment_id) {
      const { data: enroll } = await admin
        .from('enrollments')
        .select('next_payment_date')
        .eq('id', payment.enrollment_id)
        .single();

      if (enroll) {
        const current = enroll.next_payment_date
          ? new Date(enroll.next_payment_date)
          : new Date();
        const next = new Date(current);
        next.setMonth(next.getMonth() + 1);
        await admin.from('enrollments')
          .update({ next_payment_date: next.toISOString().slice(0, 10) })
          .eq('id', payment.enrollment_id);
      }
    }

    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    action === 'confirm' ? 'confirmed_payment' : 'rejected_payment',
      entity:    'payment',
      entity_id: paymentId,
      metadata:  { reason },
    });

    // Send email notification
    if (payment.student?.profile?.email) {
      try {
        const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
        const programId = payment.student.enrollments?.[0]?.program_id;

        if (action === 'confirm') {
          const { subject, html } = EmailTemplates.paymentConfirmed({
            name:        payment.student.profile.full_name.split(' ')[0],
            amount:      Number(payment.amount).toFixed(2),
            programName: programNames[programId] || 'WCA Academy',
            period:      payment.period_start
              ? new Date(payment.period_start).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })
              : '—',
            code: payment.reference_code,
          });
          await sendEmail({ to: payment.student.profile.email, toName: payment.student.profile.full_name, subject, html });
        }
      } catch (emailErr) {
        console.error('Email error (non-fatal):', emailErr);
      }
    }

    return ok(res, {
      message: action === 'confirm' ? 'Pago confirmado' : 'Pago rechazado',
      payment: updated,
    });

  } catch (e) {
    return err(res, e);
  }
}
