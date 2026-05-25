// POST /api/payments/upload-proof
// Body: { paymentId, proofUrl } — URL from Supabase Storage
// Auth: estudiante (own payments only)
import { requireAuth, getSupabaseAdmin, ok, err, setCORS } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

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
      .single();

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
