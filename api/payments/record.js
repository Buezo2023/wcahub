// POST /api/payments/record
// Body: { studentId, enrollmentId, amount, method, bank, referenceCode, proofUrl, periodStart, periodEnd, notes }
// Auth: cobros, admin, super_admin

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`payment_record:${ip}`, 30, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'cobros', 'admin', 'super_admin');

    const {
      studentId, enrollmentId, amount, method = 'transfer',
      bank, referenceCode, proofUrl, periodStart, periodEnd,
      notes, autoConfirm = false,
    } = req.body;

    if (!studentId || !amount) return err(res, { status: 400, message: 'studentId y amount son requeridos' });

    const admin = getSupabaseAdmin();

    // Get student info for the receipt
    const { data: student } = await admin
      .from('students')
      .select('id, profile:profiles(full_name, email), enrollments(id, program_id, group:groups(schedule))')
      .eq('id', studentId)
      .single();

    if (!student) return err(res, { status: 404, message: 'Estudiante no encontrado' });

    // Generate reference code if not provided
    const code = referenceCode || `WCA-${new Date().getFullYear()}-${Math.random().toString(36).slice(-6).toUpperCase()}`;

    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .insert({
        student_id:     studentId,
        enrollment_id:  enrollmentId || null, // Don't guess — cobros must select the correct enrollment
        amount:         Number(amount),
        currency:       'USD',
        method,
        status:         autoConfirm ? 'confirmed' : 'pending',
        reference_code: code,
        bank:           bank || null,
        proof_url:      proofUrl || null,
        period_start:   periodStart || null,
        period_end:     periodEnd || null,
        notes:          notes || null,
        confirmed_by:   autoConfirm ? actor.id : null,
        confirmed_at:   autoConfirm ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    autoConfirm ? 'recorded_and_confirmed_payment' : 'recorded_payment',
      entity:    'payment',
      entity_id: payment.id,
      metadata:  { amount, method, code },
    });

    // Send confirmation email if auto-confirmed
    if (autoConfirm && student.profile?.email) {
      try {
        const programId = student.enrollments?.[0]?.program_id;
        const programNames = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
        const { subject, html } = EmailTemplates.paymentConfirmed({
          name:        student.profile.full_name.split(' ')[0],
          amount:      Number(amount).toFixed(2),
          programName: programNames[programId] || programId || 'WCA Academy',
          period:      periodStart ? new Date(periodStart).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' }) : '—',
          code,
        });
        await sendEmail({ to: student.profile.email, toName: student.profile.full_name, subject, html });
      } catch (emailErr) {
        console.error('Email error (non-fatal):', emailErr);
      }
    }

    return ok(res, {
      message:   autoConfirm ? 'Pago registrado y confirmado' : 'Pago registrado — pendiente de confirmación',
      paymentId: payment.id,
      code,
    }, 201);

  } catch (e) {
    return err(res, e);
  }
}
