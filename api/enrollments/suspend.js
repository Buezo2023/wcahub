// PATCH /api/enrollments/suspend
// Body: { enrollmentId, action: 'suspend'|'reactivate', reason? }
// Auth: admin, super_admin

import { requireAuth, requireRole, getSupabaseAdmin, ok, err, CORS } from '../_utils.js';

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
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

    // Also update profile active status if suspending
    if (action === 'suspend') {
      const { data: student } = await admin
        .from('students')
        .select('profile_id')
        .eq('id', data.student_id)
        .single();
      if (student) {
        await admin.from('profiles').update({ active: false }).eq('id', student.profile_id);
      }
    } else {
      const { data: student } = await admin
        .from('students')
        .select('profile_id')
        .eq('id', data.student_id)
        .single();
      if (student) {
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
