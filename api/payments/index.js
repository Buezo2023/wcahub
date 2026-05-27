// /api/payments — consolidated router
// POST   + no action → record new payment
// PATCH  + action=confirm|reject → confirm/reject payment
// PATCH  + action=upload-proof → upload proof URL
// Merges: api/payments/record.js + api/payments/confirm.js

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    await checkRateLimit(`payments:${ip}`, 30, 60000);
  } catch (e) { return err(res, e); }

  const action = req.body?.action;

  if (req.method === 'PATCH' && action === 'upload-proof') return handleUploadProof(req, res);
  if (req.method === 'PATCH') return handleConfirm(req, res);
  if (req.method === 'POST')  return handleRecord(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Record new payment ─────────────────────────────────────────────
async function handleRecord(req, res) {
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
      .maybeSingle();

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
      .maybeSingle();

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

  
  } catch (e) { return err(res, e); }
}

// ── Confirm / Reject payment ───────────────────────────────────────
async function handleConfirm(req, res) {
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
      .maybeSingle();

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
      .maybeSingle();
    if (error) throw error;

    // Advance next_payment_date + reactivate if suspended
    if (action === 'confirm' && payment.enrollment_id) {
      const { data: enroll } = await admin
        .from('enrollments')
        .select('next_payment_date, status, student_id')
        .eq('id', payment.enrollment_id)
        .maybeSingle();

      if (enroll) {
        const base = enroll.next_payment_date || new Date().toISOString().slice(0, 10);
        const nextDate = addOneMonth(base);

        // Bug 3 fix: if enrollment was suspended, reactivate it on payment
        const updateFields = { next_payment_date: nextDate };
        if (enroll.status === 'suspended') {
          updateFields.status = 'active';
          updateFields.suspended_at = null;
          updateFields.suspended_reason = null;
        }
        await admin.from('enrollments')
          .update(updateFields)
          .eq('id', payment.enrollment_id);

        // Also reactivate profile if it was deactivated by auto-suspend
        if (enroll.status === 'suspended' && enroll.student_id) {
          const { data: student } = await admin
            .from('students').select('profile_id').eq('id', enroll.student_id).maybeSingle();
          if (student?.profile_id) {
            await admin.from('profiles')
              .update({ active: true })
              .eq('id', student.profile_id);
          }
          // Log the reactivation
          await admin.from('audit_log').insert({
            actor_id:  actor.id,
            action:    'reactivated_after_payment',
            entity:    'enrollment',
            entity_id: payment.enrollment_id,
            metadata:  { next_payment_date: nextDate },
          }).catch(() => {});
        }
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
        const firstName = payment.student.profile.full_name.split(' ')[0];

        if (action === 'confirm') {
          const { subject, html } = EmailTemplates.paymentConfirmed({
            name:        firstName,
            amount:      Number(payment.amount).toFixed(2),
            programName: programNames[programId] || 'WCA Academy',
            period:      payment.period_start
              ? new Date(payment.period_start).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })
              : '—',
            code: payment.reference_code,
          });
          await sendEmail({ to: payment.student.profile.email, toName: payment.student.profile.full_name, subject, html });
        } else {
          // Rejection — notify student so they can re-submit proof
          await sendEmail({
            to:     payment.student.profile.email,
            toName: payment.student.profile.full_name,
            subject: 'Tu comprobante de pago fue rechazado — WCA Academy',
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
              <h2 style="color:#dc2626;margin:0 0 12px">Comprobante rechazado</h2>
              <p style="color:#475569;line-height:1.7">Hola <strong>${firstName}</strong>, tu comprobante de pago de <strong>$${Number(payment.amount).toFixed(2)}</strong> fue revisado y no pudo ser aprobado.</p>
              ${reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin:16px 0;color:#991b1b"><strong>Motivo:</strong> ${reason}</div>` : ''}
              <p style="color:#475569;line-height:1.7">Por favor volvé a subir tu comprobante desde tu portal asegurándote de que sea legible y muestre el monto y la referencia correctamente.</p>
              <a href="https://wcahub.vercel.app/portal" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;margin-top:8px">Ir a mi portal →</a>
              <p style="color:#94a3b8;font-size:12px;margin-top:20px">Si tenés dudas, contactá a cobros por WhatsApp.</p>
            </div>`,
          });
        }
      } catch (emailErr) {
        console.error('Email error (non-fatal):', emailErr);
      }
    }

    return ok(res, {
      message: action === 'confirm' ? 'Pago confirmado' : 'Pago rechazado',
      payment: updated,
    });

  
  } catch (e) { return err(res, e); }
}

// ── Upload proof URL ───────────────────────────────────────────────
async function handleUploadProof(req, res) {
  try {
    const { profile: actor } = await requireAuth(req);
    const { paymentId, proofUrl } = req.body;

    if (!paymentId || !proofUrl) {
      return err(res, { status: 400, message: 'paymentId y proofUrl son requeridos' });
    }

    const admin = getSupabaseAdmin();

    // Get payment and verify ownership
    const { data: payment } = await admin
      .from('payments')
      .select('id, status, student_id, student:students(profile_id)')
      .eq('id', paymentId)
      .maybeSingle();

    if (!payment) return err(res, { status: 404, message: 'Pago no encontrado' });

    // Student can only update their own payments
    const isOwner   = payment.student?.profile_id === actor.id;
    const isAdmin   = ['admin','super_admin','cobros'].includes(actor.role);
    if (!isOwner && !isAdmin) {
      return err(res, { status: 403, message: 'No tenés permiso' });
    }

    if (payment.status === 'confirmed') {
      return err(res, { status: 409, message: 'El pago ya está confirmado' });
    }

    const { error } = await admin
      .from('payments')
      .update({ proof_url: proofUrl })
      .eq('id', paymentId);

    if (error) throw error;

    await admin.from('audit_log').insert({
      actor_id: actor.id,
      action: 'uploaded_proof',
      entity: 'payment',
      entity_id: paymentId,
      metadata: { proofUrl },
    });

    return ok(res, { message: 'Comprobante guardado — cobros lo revisará en breve' });
  } catch(e) {
    return err(res, e);
  }
}
