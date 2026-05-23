// POST /api/emails/welcome
// Body: { userId? } — if not provided, sends to calling user
// Auth: any authenticated user

import { requireAuth, getSupabaseAdmin, sendEmail, EmailTemplates, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
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
