// POST /api/enrollments        → create enrollment (body has no action field)
// POST /api/enrollments + action=create → create enrollment (explicit)
// PATCH /api/enrollments/suspend → suspend or reactivate

import { requireAuth, requireRole, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit, addOneMonth } from '../_utils.js';

const PROGRAM_NAMES = {
  en: 'Inglés Completo', va: 'Asistente Virtual',
  va_mkt: 'VA · Marketing Digital',
  va_legal: 'VA · Legal Assistant',
  va_care: 'VA · Cuidador Remoto',
};
const PREREQUISITES = { va_mkt: 'va', va_legal: 'va', va_care: 'va' };
const VALID_ROLES = ['estudiante','docente','admin','super_admin','asesor_ventas','cobros','coordinadora','directivo'];

// ── Shared helper: resolve current_unit for continuous enrollment ──────────
// Rules:
//   A. groupId → use group.active_unit
//   B. no groupId → cycle_config by program_id + level
//   Returns { unit, source } or throws with a clear message.
//
// Parameters:
//   admin      - Supabase admin client
//   programId  - e.g. 'en', 'va', 'va_mkt'
//   studentLevel - student.level (e.g. 'A1') — required for Inglés, optional for VA
//   groupId    - optional UUID
//   existingUnit - current_unit from an existing enrollment (conserve if present)
//
async function resolveCurrentUnit(admin, { programId, studentLevel, groupId, existingUnit }) {
  // C: existing enrollment — always conserve progress
  if (existingUnit != null) {
    return { unit: existingUnit, source: 'existing_enrollment' };
  }

  // A: group provided — use group.active_unit
  if (groupId) {
    const { data: group, error: gErr } = await admin
      .from('groups')
      .select('id, active, active_unit, capacity, program_id, level')
      .eq('id', groupId)
      .maybeSingle();

    if (gErr) throw { status: 500, message: `Error al consultar el grupo: ${gErr.message}` };
    if (!group)          throw { status: 404, message: 'El grupo especificado no existe' };
    if (!group.active)   throw { status: 422, message: 'El grupo está inactivo y no acepta nuevas matrículas' };
    if (group.program_id !== programId)
      throw { status: 422, message: `El grupo pertenece al programa "${group.program_id}" pero se solicitó "${programId}"` };

    // Capacity check: count active enrollments in this group
    const { count: enrolled } = await admin
      .from('enrollments').select('id', { count: 'exact' })
      .eq('group_id', groupId).eq('status', 'active');
    if ((enrolled || 0) >= (group.capacity || 25))
      throw { status: 422, message: `El grupo está lleno (${enrolled}/${group.capacity || 25} cupos)` };

    // Level match for Inglés
    if (programId === 'en' && studentLevel && group.level && group.level !== studentLevel)
      throw { status: 422, message: `El nivel del grupo es ${group.level} pero el estudiante está en ${studentLevel}` };

    const unit = group.active_unit;
    if (!unit || unit < 1 || unit > 12)
      throw { status: 422, message: `La unidad activa del grupo (${unit}) es inválida. Debe estar entre 1 y 12.` };

    return { unit, source: 'group_active_unit', group };
  }

  // B: no group — look up cycle_config
  const isIngles = programId === 'en';
  let query = admin.from('cycle_config').select('current_unit, program_id, level')
    .eq('program_id', programId);

  if (isIngles && studentLevel) {
    query = query.eq('level', studentLevel);
  } else if (!isIngles && studentLevel) {
    // VA programs: try with level first, then without
    const { data: withLevel } = await query.eq('level', studentLevel).maybeSingle();
    if (withLevel?.current_unit) {
      const unit = withLevel.current_unit;
      if (unit < 1 || unit > 12)
        throw { status: 422, message: `La unidad en cycle_config (${unit}) es inválida. Debe estar entre 1 y 12.` };
      return { unit, source: 'cycle_config' };
    }
    // fallback: try without level
    const { data: noLevel } = await admin.from('cycle_config').select('current_unit')
      .eq('program_id', programId).is('level', null).maybeSingle();
    if (noLevel?.current_unit) {
      const unit = noLevel.current_unit;
      if (unit < 1 || unit > 12)
        throw { status: 422, message: `La unidad en cycle_config (${unit}) es inválida. Debe estar entre 1 y 12.` };
      return { unit, source: 'cycle_config' };
    }
    throw { status: 422, message: `No se encontró configuración de ciclo para el programa "${programId}". Configurá cycle_config en el panel académico antes de matricular.` };
  }

  const { data: cycle } = await query.maybeSingle();
  if (!cycle) {
    const levelHint = isIngles && studentLevel ? ` (nivel ${studentLevel})` : '';
    throw { status: 422, message: `No se encontró configuración de ciclo para "${programId}"${levelHint}. Configurá cycle_config en el panel académico antes de matricular.` };
  }

  const unit = cycle.current_unit;
  if (!unit || unit < 1 || unit > 12)
    throw { status: 422, message: `La unidad en cycle_config (${unit}) es inválida. Debe estar entre 1 y 12.` };

  return { unit, source: 'cycle_config' };
}

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    await checkRateLimit(`enrollments:${ip}`, 30, 60000);
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
      .eq('id', studentId).maybeSingle();
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

    // ── Resolve current_unit (continuous enrollment) ─────────────────
    let resolved;
    try {
      resolved = await resolveCurrentUnit(admin, {
        programId,
        studentLevel: student.level,
        groupId: groupId || null,
        existingUnit: existing?.status === 'active' ? (existing.current_unit ?? null) : null,
      });
    } catch (unitErr) {
      return err(res, { status: unitErr.status || 422, message: unitErr.message });
    }
    const initialUnit = resolved.unit;

    // Fetch group for email / capacity (already validated in resolveCurrentUnit)
    let group = null;
    if (groupId) {
      const { data: g } = await admin.from('groups')
        .select('id, schedule, days, capacity, program_id, level, teacher_groups(teacher:staff(profile:profiles(full_name)))')
        .eq('id', groupId).maybeSingle();
      group = g;
    }

    const now = new Date();
    const payDay = now.getDate();
    const thisMonthCandidate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(payDay).padStart(2,'0')}`;
    const todayStr = now.toISOString().slice(0, 10);
    const nextPaymentStr = thisMonthCandidate <= todayStr
      ? addOneMonth(thisMonthCandidate)
      : thisMonthCandidate;

    const { data: enrollment, error: enrollError } = await admin.from('enrollments')
      .upsert({
        student_id: studentId, program_id: programId, group_id: groupId || null,
        status: 'active',
        // Existing enrollment: keep their progress. New enrollment: start at U1.
        // Student must pass exams sequentially from U1 regardless of group cycle.
        current_unit: initialUnit,
        price_locked: price || null, enrolled_at: new Date().toISOString(),
        next_payment_date: nextPaymentStr,
      }, { onConflict: 'student_id,program_id' }).select().maybeSingle();
    if (enrollError) throw enrollError;
    if (!enrollment) return err(res, { status: 500, message: 'No se pudo crear la matrícula' });

    await admin.from('audit_log').insert({
      actor_id: actor.id, action: 'created_enrollment', entity: 'enrollment',
      entity_id: enrollment.id,
      metadata: {
        studentId, programId, groupId, price,
        initial_unit: initialUnit,
        source: resolved.source,
      },
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
    const reactivateDate = addOneMonth(new Date().toISOString().slice(0, 10));

    const updates = action === 'suspend'
      ? { status: 'suspended', suspended_at: new Date().toISOString(), suspended_reason: reason || null }
      : { status: 'active', suspended_at: null, suspended_reason: null, next_payment_date: reactivateDate };

    const { data, error } = await admin.from('enrollments')
      .update(updates).eq('id', enrollmentId).select().maybeSingle();
    if (error) throw error;

    const { data: student } = await admin.from('students')
      .select('profile_id').eq('id', data.student_id).maybeSingle();

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
