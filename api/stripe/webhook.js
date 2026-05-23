// POST /api/stripe/webhook
// Stripe sends events here — update enrollment status on payment success
// Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

import { getSupabaseAdmin, ok, err } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig    = req.headers['stripe-signature'];
  const key    = process.env.STRIPE_SECRET_KEY;

  if (!secret || !key) return res.status(200).json({ received: true }); // misconfigured, ignore

  let event;
  try {
    // Verify signature using raw body (Vercel sends raw Buffer for webhooks)
    const rawBody = typeof req.body === 'string' ? req.body
      : Buffer.isBuffer(req.body) ? req.body.toString()
      : JSON.stringify(req.body);

    // Simple HMAC verification (Stripe uses SHA256)
    const { createHmac } = await import('crypto');
    const parts = sig.split(',').reduce((acc, p) => {
      const [k, v] = p.split('=');
      acc[k] = v;
      return acc;
    }, {});
    const payload = `${parts.t}.${rawBody}`;
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    if (expected !== parts.v1) throw new Error('Invalid signature');

    event = JSON.parse(rawBody);
  } catch(e) {
    return res.status(400).json({ error: e.message });
  }

  const admin = getSupabaseAdmin();

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { programId, studentEmail } = session.metadata || {};
      if (programId && studentEmail) {
        // Find or create student enrollment
        const { data: profile } = await admin.from('profiles')
          .select('id').eq('email', studentEmail).maybeSingle();
        if (profile) {
          const { data: student } = await admin.from('students')
            .select('id').eq('profile_id', profile.id).maybeSingle();
          if (student) {
            await admin.from('enrollments')
              .update({ status: 'active', suspended_at: null })
              .eq('student_id', student.id)
              .eq('program_id', programId);
            // Record confirmed payment
            await admin.from('payments').insert({
              student_id:   student.id,
              amount:       session.amount_total / 100,
              method:       'stripe',
              status:       'confirmed',
              stripe_id:    session.payment_intent || session.id,
            });
            // Notify student
            await admin.from('notifications').insert({
              user_id: profile.id,
              type:    'success',
              title:   `Pago confirmado — $${session.amount_total / 100}`,
              body:    'Tu matrícula está al día. ¡Seguí aprendiendo!',
              link:    '/portal',
            }).catch(() => {});
          }
        }
        // Audit
        await admin.from('audit_log').insert({
          action:   'stripe_payment_confirmed',
          entity:   'payment',
          metadata: { programId, studentEmail, amount: session.amount_total / 100, sessionId: session.id },
        }).catch(() => {});
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const email = invoice.customer_email;
      if (email) {
        const { data: profile } = await admin.from('profiles')
          .select('id').eq('email', email).maybeSingle();
        if (profile) {
          await admin.from('notifications').insert({
            user_id: profile.id,
            type:    'warning',
            title:   'Pago fallido — actualizá tu método de pago',
            body:    'Hubo un problema al procesar tu suscripción. Actualizá tu tarjeta para mantener el acceso.',
            link:    '/portal',
          }).catch(() => {});
        }
      }
    }
  } catch(e) { console.error('Webhook processing error:', e); }

  return res.status(200).json({ received: true });
}
