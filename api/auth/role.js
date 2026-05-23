// PATCH /api/auth/role
// Body: { userId, role }
// Auth: super_admin only

import { requireAuth, requireRole, getSupabaseAdmin, ok, err, setCORS, checkRateLimit } from '../_utils.js';

const VALID_ROLES = ['estudiante','docente','admin','super_admin','asesor_ventas','cobros','coordinadora','directivo'];

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`role:${ip}`, 20, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'super_admin');

    const { userId, role } = req.body;
    if (!userId || !role) return err(res, { status: 400, message: 'userId y role son requeridos' });
    if (!VALID_ROLES.includes(role)) return err(res, { status: 400, message: `Rol inválido. Opciones: ${VALID_ROLES.join(', ')}` });

    const admin = getSupabaseAdmin();

    const { data, error } = await admin
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, email, full_name, role')
      .single();

    if (error) throw error;

    await admin.from('audit_log').insert({
      actor_id:  actor.id,
      action:    'changed_role',
      entity:    'profile',
      entity_id: userId,
      metadata:  { new_role: role },
    });

    return ok(res, { message: `Rol actualizado a ${role}`, profile: data });

  } catch (e) {
    return err(res, e);
  }
}
