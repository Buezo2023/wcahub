// POST /api/enrollments        → create enrollment (body has no action field)
// POST /api/enrollments + action=create → create enrollment (explicit)
// PATCH /api/enrollments/suspend → suspend or reactivate

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

const PROGRAM_NAMES = {
  en: 'Inglés Completo', va: 'Asistente Virtual',
  va_mkt: 'VA · Marketing Digital',
  va_legal: 'VA · Legal Assistant',
  va_care: 'VA · Cuidador Remoto',
};
const PREREQUISITES = { va_mkt: 'va', va_legal: 'va', va_care: 'va' };
const VALID_ROLES = ['estudiante','docente','admin','super_admin','asesor_ventas','cobros','coordinadora','directivo'];

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`enrollments:${ip}`, 30, 60000);
  } catch (e) { return err(res, e); }

  const action = req.body?.action || (req.method === 'POST' ? 'create' : null);

  // PATCH → suspend/reactivate
  if (req.method === 'PATCH' || action === 'suspend' || action === 'reactivate') {
    return handleSuspend(req, res);
  }
  // POST → create enrollment
  if (req.method === 'POST') {
    return handleCreate(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// ── Create enrollment ─────────────────────────────────────────────
async function handleCreate(req, res) {
  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin', 'coordinadora');

    const { studentId, programId, groupId, price } = req.body;
    if (!studentId || !programId)
      return err(res, { status: 400, message: 'studentId y programId son requeridos' });

    const admin = getSupabaseAdmin();

    const { data: student, error: studentError } = await admin
      .from('students').select('id, level, profile:profiles(full_name, email)')
      .eq('id', studentId).single();
    if (studentError || !student) return err(res, { status: 404, message: 'Estudiante no encontrado' });

    const prereq = PREREQUISITES[programId];
    if (prereq) {
      const { data: prereqEnroll } = await admin.from('enrollments')
        .select('id, status').eq('student_id', studentId).eq('program_id', prereq).maybeSingle();
      if (!prereqEnroll || prereqEnroll.status !== 'active')
        return err(res, { status: 422, message: `Este programa requiere completar ${PROGRAM_NAMES[prereq]} primero` });
    }

    const { data: existing } = await admin.from('enrollments')
      .select('id, status').eq('student_id', studentId).eq('program_id', programId).maybeSingle();
    if (existing?.status === 'active')
      return err(res, { status: 409, message: 'El estudiante ya está matriculado en este programa' });

    let group = null;
    if (groupId) {
      const { data: g } = await admin.from('groups')
        .select('id, schedule, days, capacity, program_id, level, teacher_groups(teacher:staff(profile:profiles(full_name)))')
        .eq('id', groupId).maybeSingle();
      group = g;
      const { count } = await admin.from('enrollments')
        .select('id', { count: 'exact' }).eq('group_id', groupId).eq('status', 'active');
      if (count >= (group?.capacity || 25)) return err(res, { status: 422, message: 'El grupo está lleno' });
    }

    const now = new Date();
    const payDay = now.getDate();
    const nextPayment = new Date(now.getFullYear(), now.getMonth(), payDay);
    if (nextPayment <= now) nextPayment.setMonth(nextPayment.getMonth() + 1);

    const { data: enrollment, error: enrollError } = await admin.from('enrollments')
      .upsert({
        student_id: studentId, program_id: programId, group_id: groupId || null,
        status: 'active', current_unit: existing ? existing.current_unit || 1 : 1,
        price_locked: price || null, enrolled_at: new Date().toISOString(),
        next_payment_date: nextPayment.toISOString().slice(0, 10),
      }, { onConflict: 'student_id,program_id' }).select().single();
    if (enrollError) throw enrollError;

    await admin.from('audit_log').insert({
      actor_id: actor.id, action: 'created_enrollment', entity: 'enrollment',
      entity_id: enrollment.id, metadata: { studentId, programId, groupId, price },
    });

    try {
      const teacher = group?.teacher_groups?.[0]?.teacher?.profile?.full_name || 'Por asignar';
      const { subject, html } = EmailTemplates.enrollment({
        name: student.profile.full_name.split(' ')[0],
        programName: PROGRAM_NAMES[programId] || programId,
        level: student.level || 'A1', schedule: group?.schedule || 'Por confirmar',
        teacher, startDate: new Date().toLocaleDateString('es-HN', { dateStyle: 'long' }), price: price || '—',
      });
      await sendEmail({ to: student.profile.email, toName: student.profile.full_name, subject, html });
    } catch (emailErr) { console.error('Email error (non-fatal):', emailErr); }

    return ok(res, {
      message: 'Matrícula creada exitosamente', enrollmentId: enrollment.id,
      student: student.profile.full_name, program: PROGRAM_NAMES[programId],
    }, 201);
  } catch (e) { return err(res, e); }
}

// ── Suspend / Reactivate enrollment ──────────────────────────────
async function handleSuspend(req, res) {
  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin');

    const { enrollmentId, action, reason } = req.body;
    if (!enrollmentId || !action) return err(res, { status: 400, message: 'enrollmentId y action son requeridos' });
    if (!['suspend','reactivate'].includes(action)) return err(res, { status: 400, message: "action debe ser 'suspend' o 'reactivate'" });

    const admin = getSupabaseAdmin();
    const reactivateDate = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().slice(0,10); })();

    const updates = action === 'suspend'
      ? { status: 'suspended', suspended_at: new Date().toISOString(), suspended_reason: reason || null }
      : { status: 'active', suspended_at: null, suspended_reason: null, next_payment_date: reactivateDate };

    const { data, error } = await admin.from('enrollments')
      .update(updates).eq('id', enrollmentId).select().single();
    if (error) throw error;

    const { data: student } = await admin.from('students')
      .select('profile_id').eq('id', data.student_id).single();

    if (student) {
      if (action === 'suspend') {
        const { data: otherActive } = await admin.from('enrollments')
          .select('id').eq('student_id', data.student_id).eq('status', 'active').neq('id', enrollmentId);
        if (!otherActive || otherActive.length === 0)
          await admin.from('profiles').update({ active: false }).eq('id', student.profile_id);
      } else {
        await admin.from('profiles').update({ active: true }).eq('id', student.profile_id);
      }
    }

    await admin.from('audit_log').insert({
      actor_id: actor.id,
      action: action === 'suspend' ? 'suspended_enrollment' : 'reactivated_enrollment',
      entity: 'enrollment', entity_id: enrollmentId, metadata: { reason },
    });

    return ok(res, { message: action === 'suspend' ? 'Matrícula suspendida' : 'Matrícula reactivada', enrollment: data });
  } catch (e) { return err(res, e); }
}
