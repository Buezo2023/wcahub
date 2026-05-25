// PATCH /api/enrollments/suspend
// Body: { enrollmentId, action: 'suspend'|'reactivate', reason? }
// Auth: admin, super_admin

import { requireAuth, requireRole, getSupabaseAdmin, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`suspend:${ip}`, 20, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin');

    const { enrollmentId, action, reason } = req.body;
    if (!enrollmentId || !action) return err(res, { status: 400, message: 'enrollmentId y action son requeridos' });
    if (!['suspend','reactivate'].includes(action)) return err(res, { status: 400, message: "action debe ser 'suspend' o 'reactivate'" });

    const admin = getSupabaseAdmin();

    const updates = action === 'suspend'
      ? { status: 'suspended', suspended_at: new Date().toISOString(), suspended_reason: reason || null }
      : { status: 'active',    suspended_at: null, suspended_reason: null };

    const { data, error } = await admin
      .from('enrollments')
      .update(updates)
      .eq('id', enrollmentId)
      .select()
      .single();
    if (error) throw error;

    // Only deactivate profile if ALL enrollments are suspended (not just this one)
    const { data: student } = await admin
      .from('students')
      .select('profile_id')
      .eq('id', data.student_id)
      .single();

    if (student) {
      if (action === 'suspend') {
        // Check if student has any other active enrollments
        const { data: otherActive } = await admin
          .from('enrollments')
          .select('id')
          .eq('student_id', data.student_id)
          .eq('status', 'active')
          .neq('id', enrollmentId);

        // Only deactivate profile if NO active enrollments remain
        if (!otherActive || otherActive.length === 0) {
          await admin.from('profiles').update({ active: false }).eq('id', student.profile_id);
        }
      } else {
        // Reactivating — always reactivate the profile
        await admin.from('profiles').update({ active: true }).eq('id', student.profile_id);
      }
    }

    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    action === 'suspend' ? 'suspended_enrollment' : 'reactivated_enrollment',
      entity:    'enrollment',
      entity_id: enrollmentId,
      metadata:  { reason },
    });

    return ok(res, { message: action === 'suspend' ? 'Matrícula suspendida' : 'Matrícula reactivada', enrollment: data });

  } catch (e) {
    return err(res, e);
  }
}
