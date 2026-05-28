// /api/payments — consolidated router
// POST   + no action → record new payment
// PATCH  + action=confirm|reject → confirm/reject payment
// PATCH  + action=upload-proof → upload proof URL
// Merges: api/payments/record.js + api/payments/confirm.js

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit, addOneMonth } from '../_utils.js';

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
    if (!paymentId || !action) {
      return err(res, { status: 400, message: 'paymentId y action son requeridos' });
    }
    if (!['confirm', 'reject'].includes(action)) {
      return err(res, { status: 400, message: "action debe ser 'confirm' o 'reject'" });
    }

    const admin = getSupabaseAdmin();

    // ── Load payment with student + profile info ───────────────────
    const { data: payment, error: payErr } = await admin
      .from('payments')
      .select(`
        id, student_id, enrollment_id, amount, status, method,
        reference_code, period_start,
        student:students(
          id,
          profile:profiles(id, full_name, email)
        )
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (payErr) throw payErr;
    if (!payment) return err(res, { status: 404, message: 'Pago no encontrado' });
    if (payment.status !== 'pending') {
      return err(res, { status: 409, message: `El pago ya fue procesado (estado actual: ${payment.status})` });
    }

    // ── REJECT path ────────────────────────────────────────────────
    // C. Only update payment status. Do not touch enrollment or profile.
    if (action === 'reject') {
      const { error: rejErr } = await admin
        .from('payments')
        .update({ status: 'failed', notes: reason || 'Rechazado por cobros' })
        .eq('id', paymentId);
      if (rejErr) throw rejErr;

      await admin.from('audit_log').insert({
        actor_id: actor.id, action: 'rejected_payment',
        entity: 'payment', entity_id: paymentId,
        metadata: { reason: reason || null },
      }).catch(() => {});

      // Notify student via email
      if (payment.student?.profile?.email) {
        const firstName = (payment.student.profile.full_name || '').split(' ')[0] || 'Estudiante';
        sendEmail({
          to: payment.student.profile.email,
          toName: payment.student.profile.full_name,
          subject: 'Tu comprobante de pago fue rechazado — WCA Academy',
          html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px">
            <h2 style="color:#dc2626;margin:0 0 12px">Comprobante rechazado</h2>
            <p style="color:#475569;line-height:1.7">Hola <strong>${firstName}</strong>, tu comprobante de <strong>$${Number(payment.amount).toFixed(2)}</strong> no pudo ser aprobado.</p>
            ${reason ? `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;margin:16px 0;color:#991b1b"><strong>Motivo:</strong> ${reason}</div>` : ''}
            <p style="color:#475569;line-height:1.7">Volvé a subir tu comprobante desde tu portal.</p>
            <a href="https://wcahub.vercel.app/portal" style="display:inline-block;background:#155266;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;margin-top:8px">Ir a mi portal →</a>
          </div>`,
        }).catch(() => {});
      }

      return ok(res, { message: 'Pago rechazado correctamente' });
    }

    // ── CONFIRM path ───────────────────────────────────────────────
    // Step 1: Mark payment as confirmed
    const { error: confErr } = await admin
      .from('payments')
      .update({
        status:       'confirmed',
        confirmed_by: actor.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    if (confErr) throw confErr;

    // Step 2: Resolve enrollment_id
    let enrollmentId   = payment.enrollment_id || null;
    let enrollAction   = 'confirmed_payment'; // default audit action
    let warningMessage = null;

    if (!enrollmentId) {
      // Lookup active/pending/suspended enrollments for this student
      const { data: enrolls, error: enrErr } = await admin
        .from('enrollments')
        .select('id, status, program_id, next_payment_date')
        .eq('student_id', payment.student_id)
        .in('status', ['active', 'pending', 'suspended'])
        .order('created_at', { ascending: false });

      if (enrErr) {
        console.error('[confirm_payment] error fetching enrollments:', enrErr.message);
      }

      const count = enrolls?.length || 0;

      if (count === 0) {
        // B3 — No enrollment found
        enrollAction = 'payment_confirmed_no_enrollment';
        warningMessage = 'Pago confirmado, pero el estudiante no tiene matrícula activa, pendiente ni suspendida. Asociá la matrícula manualmente si corresponde.';

      } else if (count === 1) {
        // B1 — Exactly one enrollment: auto-link
        enrollmentId = enrolls[0].id;
        enrollAction = 'payment_auto_linked_enrollment';
        // Persist the link on the payment row
        await admin
          .from('payments')
          .update({ enrollment_id: enrollmentId })
          .eq('id', paymentId);

      } else {
        // B2 — Multiple enrollments: confirm payment, do NOT touch enrollments
        enrollAction = 'payment_confirmed_ambiguous_enrollment';
        warningMessage = `Pago confirmado, pero el estudiante tiene ${count} matrículas activas/pendientes. Asociá la matrícula manualmente en Cobros → editar pago.`;
        await admin.from('audit_log').insert({
          actor_id: actor.id, action: enrollAction,
          entity: 'payment', entity_id: paymentId,
          metadata: {
            student_id:  payment.student_id,
            enrollments: enrolls.map(e => ({ id: e.id, program_id: e.program_id, status: e.status })),
          },
        }).catch(() => {});
      }
    }

    // Step 3: Update enrollment (only when we have a single resolved ID)
    let enrollmentUpdated = false;
    if (enrollmentId) {
      const { data: enroll, error: enrFetchErr } = await admin
        .from('enrollments')
        .select('id, status, next_payment_date, student_id')
        .eq('id', enrollmentId)
        .maybeSingle();

      if (enrFetchErr) {
        console.error('[confirm_payment] error fetching enrollment:', enrFetchErr.message);
      } else if (enroll) {
        const base     = enroll.next_payment_date || new Date().toISOString().slice(0, 10);
        const nextDate = addOneMonth(base);
        const prevStatus = enroll.status;

        const enrollUpdates = { next_payment_date: nextDate };

        // Activate if was pending or suspended
        if (['pending', 'suspended'].includes(prevStatus)) {
          enrollUpdates.status = 'active';
          if (prevStatus === 'suspended') {
            enrollUpdates.suspended_at     = null;
            enrollUpdates.suspended_reason = null;
          }
        }

        const { error: euErr } = await admin
          .from('enrollments')
          .update(enrollUpdates)
          .eq('id', enrollmentId);

        if (euErr) {
          console.error('[confirm_payment] error updating enrollment:', euErr.message);
        } else {
          enrollmentUpdated = true;

          // Step 4: Activate profile if enrollment was pending/suspended
          if (['pending', 'suspended'].includes(prevStatus) && enroll.student_id) {
            const { data: stud } = await admin
              .from('students').select('profile_id').eq('id', enroll.student_id).maybeSingle();
            if (stud?.profile_id) {
              await admin.from('profiles')
                .update({ active: true })
                .eq('id', stud.profile_id);
            }
          }

          // Step 5: Audit log for enrollment update
          await admin.from('audit_log').insert({
            actor_id:  actor.id,
            action:    enrollAction,
            entity:    'enrollment',
            entity_id: enrollmentId,
            metadata:  {
              prev_status:       prevStatus,
              new_status:        enrollUpdates.status || prevStatus,
              next_payment_date: nextDate,
              payment_id:        paymentId,
            },
          }).catch(() => {});
        }
      }
    }

    // Step 6: Main payment audit log
    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    'confirmed_payment',
      entity:    'payment',
      entity_id: paymentId,
      metadata:  {
        enrollment_id:      enrollmentId || null,
        enrollment_updated: enrollmentUpdated,
        warning:            warningMessage || null,
      },
    }).catch(() => {});

    // Step 7: Send confirmation email
    if (payment.student?.profile?.email) {
      try {
        const firstName  = (payment.student.profile.full_name || '').split(' ')[0] || 'Estudiante';
        const PROG_NAMES = { en:'Inglés Completo', va:'Asistente Virtual', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
        // Get program from enrollment if we have it
        let programName = 'WCA Academy';
        if (enrollmentId) {
          const { data: enrProg } = await admin.from('enrollments').select('program_id').eq('id', enrollmentId).maybeSingle();
          programName = PROG_NAMES[enrProg?.program_id] || enrProg?.program_id || 'WCA Academy';
        }
        const { subject, html } = EmailTemplates.paymentConfirmed({
          name:        firstName,
          amount:      Number(payment.amount).toFixed(2),
          programName,
          period:      payment.period_start
            ? new Date(payment.period_start).toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })
            : '—',
          code: payment.reference_code,
        });
        await sendEmail({ to: payment.student.profile.email, toName: payment.student.profile.full_name, subject, html });
      } catch (emailErr) {
        console.error('[confirm_payment] email error (non-fatal):', emailErr.message);
      }
    }

    // Step 8: Return response — include warning if enrollment was ambiguous or missing
    const responseMessage = warningMessage
      ? `Pago confirmado. ⚠ ${warningMessage}`
      : enrollmentUpdated
        ? 'Pago confirmado y matrícula actualizada correctamente'
        : 'Pago confirmado';

    return ok(res, { message: responseMessage, paymentId, enrollmentId, warning: warningMessage || null });

  } catch (e) {
    return err(res, e);
  }
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
