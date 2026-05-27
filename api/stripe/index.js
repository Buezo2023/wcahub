// /api/stripe — consolidated router
// POST + stripe-signature header → webhook
// POST without stripe-signature → checkout
// Merges: api/stripe/checkout.js + api/stripe/webhook.js

import { requireAuth, ok, err, setCORS, getSupabaseAdmin, checkRateLimit, addOneMonth } from '../_utils.js';

const PROGRAM_PRICES = {
  en:       { name: 'Inglés Completo',          amount: 9500,  interval: 'month' },
  va:       { name: 'Asistente Virtual General', amount: 9500,  interval: 'month' },
  va_mkt:   { name: 'VA · Marketing Digital',   amount: 9500,  interval: 'month' },
  va_legal: { name: 'VA · Legal Assistant',     amount: 9500,  interval: 'month' },
  va_care:  { name: 'VA · Cuidador Remoto',     amount: 9500,  interval: 'month' },
};

export default async function handler(req, res) {
  // Stripe webhook — identified by stripe-signature header
  if (req.headers['stripe-signature']) return handleWebhook(req, res);

  // Checkout session
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  return handleCheckout(req, res);
}

// ── Checkout session ──────────────────────────────────────────────
async function handleCheckout(req, res) {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    checkRateLimit(`stripe_checkout:${ip}`, 10, 60000);
  } catch(e) { return err(res, e); }

  try {
    const { profile } = await requireAuth(req);
    const { programId, studentEmail, studentName, successUrl, cancelUrl } = req.body;

    const price = PROGRAM_PRICES[programId];
    if (!price) return err(res, { status: 400, message: 'Programa inválido' });

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return err(res, { status: 503, message: 'Stripe no configurado' });

    const stripe = (await import('stripe')).default(key);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'subscription',
      customer_email:       studentEmail || profile.email,
      line_items: [{
        price_data: {
          currency:     'usd',
          unit_amount:  price.amount,
          recurring:    { interval: price.interval },
          product_data: { name: price.name },
        },
        quantity: 1,
      }],
      success_url: successUrl || `${process.env.SITE_URL || 'https://wcahub.vercel.app'}/portal?payment=success`,
      cancel_url:  cancelUrl  || `${process.env.SITE_URL || 'https://wcahub.vercel.app'}/portal?payment=cancel`,
      metadata: { programId, profileId: profile.id, studentName: studentName || profile.full_name },
    });

    return ok(res, { sessionId: session.id, url: session.url });
  } catch(e) { return err(res, e); }
}

// ── Webhook handler ───────────────────────────────────────────────
async function handleWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig    = req.headers['stripe-signature'];
  const key    = process.env.STRIPE_SECRET_KEY;

  if (!secret || !key) return res.status(200).json({ received: true });

  let event;
  try {
    const stripe = (await import('stripe')).default(key);
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch(e) {
    console.error('Webhook signature verification failed:', e.message);
    return res.status(400).json({ error: e.message });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { programId, profileId } = session.metadata || {};

    if (profileId && programId) {
      try {
        const admin = getSupabaseAdmin();
        const { data: student } = await admin.from('students')
          .select('id').eq('profile_id', profileId).maybeSingle();

        if (student) {
          const { data: enrollment } = await admin.from('enrollments')
            .select('id').eq('student_id', student.id).eq('program_id', programId).maybeSingle();

          if (enrollment) {
            await admin.from('payments').insert({
              student_id:     student.id,
              enrollment_id:  enrollment.id,
              amount:         session.amount_total / 100,
              currency:       session.currency?.toUpperCase() || 'USD',
              method:         'stripe',
              status:         'confirmed',
              reference_code: session.id,
              stripe_id:      session.payment_intent || session.id,
              confirmed_at:   new Date().toISOString(),
              notes:          'Pago automático via Stripe',
            });

            // Bug 2 fix: advance next_payment_date (Stripe pays directly as confirmed)
            const { data: enroll } = await admin.from('enrollments')
              .select('next_payment_date, status')
              .eq('id', enrollment.id).maybeSingle();
            if (enroll) {
              const base = enroll.next_payment_date || new Date().toISOString().slice(0, 10);
              const updateFields = { next_payment_date: addOneMonth(base) };
              // Also reactivate if the account was auto-suspended
              if (enroll.status === 'suspended') {
                updateFields.status = 'active';
                updateFields.suspended_at = null;
                updateFields.suspended_reason = null;
              }
              await admin.from('enrollments').update(updateFields).eq('id', enrollment.id);
              // Reactivate profile if deactivated
              if (enroll.status === 'suspended') {
                await admin.from('profiles').update({ active: true }).eq('id', profileId);
              }
            }
          }
        }
      } catch(dbErr) {
        console.error('Webhook DB error:', dbErr);
      }
    }
  }

  return res.status(200).json({ received: true });
}
