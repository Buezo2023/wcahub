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
    await checkRateLimit(`stripe_checkout:${ip}`, 10, 60000);
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

  if (!key) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY not configured — rejecting webhook');
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured — refusing to process webhook without signature verification');
    return res.status(400).json({ error: 'Webhook secret not configured — cannot verify signature' });
  }

  let event;
  try {
    const stripe = (await import('stripe')).default(key);
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch(e) {
    console.error('Webhook signature verification failed:', e.message);
    return res.status(400).json({ error: e.message });
  }

  // ── checkout.session.completed → primer pago, activa la cuenta ──
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { programId, profile_id, profileId, enrollment_id, payment_id, student_id, amount } = session.metadata || {};
    const resolvedProfileId = profile_id || profileId; // support both legacy and new metadata keys

    if (!resolvedProfileId || !programId) {
      console.error('[stripe-webhook] checkout.session.completed missing required metadata', { metadata: session.metadata });
    } else {
      // Validate amount > 0 — never activate for free/test sessions
      const amountTotal = session.amount_total || 0;
      if (amountTotal <= 0) {
        console.error('[stripe-webhook] checkout.session.completed amount_total is 0 — not activating enrollment', { sessionId: session.id, amountTotal });
        await getSupabaseAdmin().from('audit_log').insert({
          action: 'stripe_webhook_zero_amount', entity: 'profile', entity_id: resolvedProfileId,
          metadata: { session_id: session.id, amount_total: amountTotal },
        }).catch(() => {});
      } else {
        await handleStripePayment({
          profileId:    resolvedProfileId,
          programId,
          enrollmentId: enrollment_id || null,
          paymentId:    payment_id || null,
          studentId:    student_id || null,
          amount:       amountTotal / 100,
          currency:     session.currency?.toUpperCase() || 'USD',
          stripeId:     session.payment_intent || session.id,
          referenceId:  session.id,
          note:         'Pago inicial via Stripe Checkout',
        });
      }
    }
  }

  // ── invoice.payment_succeeded → renovación mensual automática ──
  // Se dispara cada mes cuando Stripe cobra la suscripción activa.
  // Sin este handler, el next_payment_date nunca avanza para pagos automáticos.
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    // Solo procesar si es una renovación (no el primer pago, que ya lo maneja checkout.session)
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
      const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const { programId, profileId } = subscription.metadata || {};
      if (profileId && programId) {
        await handleStripePayment({
          profileId, programId,
          amount:      (invoice.amount_paid || 0) / 100,
          currency:    invoice.currency?.toUpperCase() || 'USD',
          stripeId:    invoice.payment_intent || invoice.id,
          referenceId: invoice.id,
          note:        'Renovación mensual automática via Stripe',
        });
      }
    }
  }

  // ── invoice.payment_failed → pago fallido, enviar alerta ────────
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    if (invoice.subscription) {
      const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const { profileId, programId } = subscription.metadata || {};
      if (profileId) {
        try {
          const admin = getSupabaseAdmin();
          await admin.from('audit_log').insert({
            action:   'stripe_payment_failed',
            entity:   'profile',
            entity_id: profileId,
            metadata: {
              invoice_id: invoice.id,
              amount:     (invoice.amount_due || 0) / 100,
              attempt:    invoice.attempt_count,
              next_attempt: invoice.next_payment_attempt
                ? new Date(invoice.next_payment_attempt * 1000).toISOString()
                : null,
              program_id: programId,
            },
          });
        } catch(e) { console.error('Failed payment audit error:', e.message); }
      }
    }
  }

  // ── customer.subscription.deleted → cancelación ─────────────────
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const { profileId, programId } = sub.metadata || {};
    if (profileId && programId) {
      try {
        const admin = getSupabaseAdmin();
        const { data: student } = await admin.from('students')
          .select('id').eq('profile_id', profileId).maybeSingle();
        if (student) {
          await admin.from('enrollments')
            .update({ status: 'suspended', suspended_at: new Date().toISOString(),
              suspended_reason: 'Suscripción Stripe cancelada' })
            .eq('student_id', student.id).eq('program_id', programId).eq('status', 'active');
        }
        await admin.from('audit_log').insert({
          action: 'stripe_subscription_cancelled', entity: 'profile', entity_id: profileId,
          metadata: { subscription_id: sub.id, program_id: programId },
        });
      } catch(e) { console.error('Subscription cancelled audit error:', e.message); }
    }
  }

  return res.status(200).json({ received: true });
}

// ── Shared handler: record payment + activate enrollment ──────────
// Security: amount is taken from session.amount_total (server-side),
// NOT from frontend input. enrollmentId/paymentId from metadata preferred.
async function handleStripePayment({ profileId, programId, enrollmentId, paymentId, studentId, amount, currency, stripeId, referenceId, note }) {
  try {
    const admin = getSupabaseAdmin();

    // Resolve student
    let sid = studentId;
    if (!sid) {
      const { data: student } = await admin.from('students').select('id').eq('profile_id', profileId).maybeSingle();
      if (!student) { console.error('[handleStripePayment] student not found for profile', profileId); return; }
      sid = student.id;
    }

    // Resolve enrollment — prefer explicit enrollmentId from metadata
    let enrollment;
    if (enrollmentId) {
      const { data: e } = await admin.from('enrollments').select('id, next_payment_date, status').eq('id', enrollmentId).maybeSingle();
      enrollment = e;
    }
    if (!enrollment) {
      const { data: e } = await admin.from('enrollments')
        .select('id, next_payment_date, status').eq('student_id', sid).eq('program_id', programId).maybeSingle();
      enrollment = e;
    }
    if (!enrollment) { console.error('[handleStripePayment] enrollment not found', { profileId, programId, enrollmentId }); return; }

    // Validate amount again server-side
    if (!amount || amount <= 0) {
      console.error('[handleStripePayment] invalid amount — not activating', { amount, enrollmentId: enrollment.id });
      return;
    }

    // Validate amount matches price_locked (within 1 cent tolerance for FX rounding)
    const { data: enrollDetails } = await admin.from('enrollments').select('price_locked').eq('id', enrollment.id).maybeSingle();
    if (enrollDetails?.price_locked && Math.abs(enrollDetails.price_locked - amount) > 0.01) {
      console.error('[handleStripePayment] amount mismatch', { expected: enrollDetails.price_locked, received: amount });
      await admin.from('audit_log').insert({
        action: 'stripe_amount_mismatch', entity: 'enrollment', entity_id: enrollment.id,
        metadata: { expected: enrollDetails.price_locked, received: amount, stripe_id: stripeId },
      }).catch(() => {});
      // Still proceed but log prominently — Stripe is authoritative for actual charge
    }

    // Update existing pending payment if paymentId provided, else create new
    if (paymentId) {
      await admin.from('payments').update({
        status: 'confirmed', stripe_id: stripeId,
        confirmed_at: new Date().toISOString(),
        notes: note,
      }).eq('id', paymentId);
    } else {
      await admin.from('payments').insert({
        student_id: sid, enrollment_id: enrollment.id,
        amount, currency, method: 'stripe', status: 'confirmed',
        reference_code: referenceId, stripe_id: stripeId,
        confirmed_at: new Date().toISOString(), notes: note,
      });
    }

    // Activate enrollment
    const base = enrollment.next_payment_date || new Date().toISOString().slice(0, 10);
    const updateFields = { next_payment_date: addOneMonth(base) };
    if (['pending', 'suspended'].includes(enrollment.status)) {
      updateFields.status = 'active';
      updateFields.suspended_at = null;
      updateFields.suspended_reason = null;
    }
    await admin.from('enrollments').update(updateFields).eq('id', enrollment.id);

    // Activate profile
    if (['pending', 'suspended'].includes(enrollment.status)) {
      await admin.from('profiles').update({ active: true }).eq('id', profileId);
    }

    // Audit log
    await admin.from('audit_log').insert({
      action: 'stripe_payment_confirmed', entity: 'enrollment', entity_id: enrollment.id,
      metadata: { amount, currency, stripe_id: stripeId, program_id: programId, prev_status: enrollment.status },
    }).catch(() => {});

  } catch(e) {
    console.error('[handleStripePayment] error:', e.message);
  }
}
