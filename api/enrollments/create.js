// POST /api/enrollments/create
// Body: { studentId, programId, groupId, price }
// Auth: admin, super_admin, coordinadora

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

const PROGRAM_NAMES = {
  en: 'Inglés Completo', va: 'Asistente Virtual',
  va_mkt: 'VA · Marketing Digital',
  va_legal: 'VA · Legal Assistant',
  va_care: 'VA · Cuidador Remoto',
};

// Programs that require va completion first
const PREREQUISITES = { va_mkt: 'va', va_legal: 'va', va_care: 'va' };

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`enroll:${ip}`, 30, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin', 'coordinadora');

    const { studentId, programId, groupId, price } = req.body;
    if (!studentId || !programId) {
      return err(res, { status: 400, message: 'studentId y programId son requeridos' });
    }

    const admin = getSupabaseAdmin();

    // 1. Verify student exists
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('id, level, profile:profiles(full_name, email)')
      .eq('id', studentId)
      .single();
    if (studentError || !student) return err(res, { status: 404, message: 'Estudiante no encontrado' });

    // 2. Check prerequisites
    const prereq = PREREQUISITES[programId];
    if (prereq) {
      const { data: prereqEnroll } = await admin
        .from('enrollments')
        .select('id, status')
        .eq('student_id', studentId)
        .eq('program_id', prereq)
        .maybeSingle();

      if (!prereqEnroll || prereqEnroll.status !== 'active') {
        return err(res, {
          status: 422,
          message: `Este programa requiere completar ${PROGRAM_NAMES[prereq]} primero`,
        });
      }
    }

    // 3. Check for duplicate enrollment
    const { data: existing } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single();

    if (existing?.status === 'active') {
      return err(res, { status: 409, message: 'El estudiante ya está matriculado en este programa' });
    }

    // 4. Get group info if provided
    let group = null;
    if (groupId) {
      const { data: g } = await admin
        .from('groups')
        .select('id, schedule, days, capacity, program_id, level, teacher_groups(teacher:staff(profile:profiles(full_name)))')
        .eq('id', groupId)
        .single();
      group = g;

      // Check capacity
      const { count } = await admin
        .from('enrollments')
        .select('id', { count: 'exact' })
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (count >= (group?.capacity || 25)) {
        return err(res, { status: 422, message: 'El grupo está lleno' });
      }
    }

    // 5. Create or reactivate enrollment
    // Calculate next_payment_date: same day of month as today, next occurrence
    const now = new Date();
    const payDay = now.getDate(); // day of month they enrolled
    const nextPayment = new Date(now.getFullYear(), now.getMonth(), payDay);
    // If today's payment day has passed, move to next month
    if (nextPayment <= now) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    const nextPaymentDate = nextPayment.toISOString().slice(0, 10);

    const { data: enrollment, error: enrollError } = await admin
      .from('enrollments')
      .upsert({
        student_id:        studentId,
        program_id:        programId,
        group_id:          groupId || null,
        status:            'active',
        current_unit:      existing ? existing.current_unit || 1 : 1,
        price_locked:      price || null,
        enrolled_at:       new Date().toISOString(),
        next_payment_date: nextPaymentDate,
      }, { onConflict: 'student_id,program_id' })
      .select()
      .single();

    if (enrollError) throw enrollError;

    // 6. Audit log
    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    'created_enrollment',
      entity:    'enrollment',
      entity_id: enrollment.id,
      metadata:  { studentId, programId, groupId, price },
    });

    // 7. Send enrollment confirmation email
    try {
      const teacher = group?.teacher_groups?.[0]?.teacher?.profile?.full_name || 'Por asignar';
      const { subject, html } = EmailTemplates.enrollment({
        name:        student.profile.full_name.split(' ')[0],
        programName: PROGRAM_NAMES[programId] || programId,
        level:       student.level || 'A1',
        schedule:    group?.schedule || 'Por confirmar',
        teacher,
        startDate:   new Date().toLocaleDateString('es-HN', { dateStyle: 'long' }),
        price:       price || '—',
      });
      await sendEmail({
        to:     student.profile.email,
        toName: student.profile.full_name,
        subject, html,
      });
    } catch (emailErr) {
      console.error('Email error (non-fatal):', emailErr);
    }

    return ok(res, {
      message:      'Matrícula creada exitosamente',
      enrollmentId: enrollment.id,
      student:      student.profile.full_name,
      program:      PROGRAM_NAMES[programId],
    }, 201);

  } catch (e) {
    return err(res, e);
  }
}
