// POST /api/stripe/checkout
// Body: { programId, studentEmail, studentName, successUrl?, cancelUrl? }
// Auth: any authenticated user
// Env: STRIPE_SECRET_KEY

import { requireAuth, ok, err, setCORS, getSupabaseAdmin, checkRateLimit } from '../_utils.js';

const PROGRAM_PRICES = {
  en:       { name: 'Inglés Completo',          amount: 9500,  interval: 'month' },
  va:       { name: 'Asistente Virtual General', amount: 9500,  interval: 'month' },
  va_mkt:   { name: 'VA · Marketing Digital',   amount: 9500,  interval: 'month' },
  va_legal: { name: 'VA · Legal Assistant',     amount: 9500,  interval: 'month' },
  va_care:  { name: 'VA · Cuidador Remoto',     amount: 9500,  interval: 'month' },
};

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { checkRateLimit(`stripe:${req.headers['x-forwarded-for']||'x'}`, 10, 60000); } catch(e) { return err(res, e); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    const { programId, studentEmail, studentName, successUrl, cancelUrl } = req.body;

    const prog = PROGRAM_PRICES[programId];
    if (!prog) return err(res, { status: 400, message: 'Programa no válido' });

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return err(res, { status: 503, message: 'Stripe no configurado' });

    const base = successUrl ? '' : 'https://wcahub.vercel.app';

    // Create Stripe Checkout Session
    const params = new URLSearchParams({
      'payment_method_types[]':                    'card',
      'mode':                                       'subscription',
      'line_items[0][price_data][currency]':        'usd',
      'line_items[0][price_data][product_data][name]': prog.name,
      'line_items[0][price_data][unit_amount]':     String(prog.amount),
      'line_items[0][price_data][recurring][interval]': prog.interval,
      'line_items[0][quantity]':                    '1',
      'customer_email':                             studentEmail || actor.email,
      'metadata[programId]':                        programId,
      'metadata[studentEmail]':                     studentEmail || actor.email,
      'metadata[studentName]':                      studentName || actor.full_name || '',
      'success_url':                                successUrl || `${base}/portal?payment=success`,
      'cancel_url':                                 cancelUrl  || `${base}/portal?payment=cancelled`,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method:  'POST',
      headers: {
        'Authorization':  `Bearer ${key}`,
        'Content-Type':   'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();
    if (!stripeRes.ok) throw new Error(session.error?.message || 'Stripe error');

    // Log intent in audit_log
    const admin = getSupabaseAdmin();
    await admin.from('audit_log').insert({
      actor_id: actor.id,
      action:   'stripe_checkout_created',
      entity:   'payment',
      metadata: { programId, email: studentEmail, sessionId: session.id },
    }).catch(() => {});

    return ok(res, { url: session.url, sessionId: session.id });
  } catch(e) { return err(res, e); }
}
