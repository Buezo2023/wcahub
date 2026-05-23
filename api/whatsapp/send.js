// POST /api/whatsapp/send
// Body: { to, message?, templateId?, templateData? }
// Auth: admin, super_admin, cobros, asesor_ventas, coordinadora
// Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM

import { requireAuth, requireRole, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export const TEMPLATES = {
  paymentDue: (name, amount, days) =>
    `Hola ${name}! Tu pago de *$${amount}* vence en *${days} dia${days!==1?'s':''}*.\n\nSubi tu comprobante en hub.wcahn.com > Pagos para mantener tu acceso. \n\n_World Connect Academy_`,
  paymentOverdue: (name, amount, days) =>
    `Hola ${name}, tu pago de *$${amount}* lleva *${days} dias vencido*.\n\nTu acceso esta suspendido. Contactanos o subi el comprobante en hub.wcahn.com\n\n_World Connect Academy_`,
  paymentConfirmed: (name, amount) =>
    `Confirmado ${name}! Tu pago de *$${amount}* fue procesado. Tu matricula esta al dia. Segui aprendiendo!\n\n_World Connect Academy_`,
  welcome: (name, program, firstClass) =>
    `Bienvenido/a a WCA, ${name}!\n\nEstas en *${program}*.\n\nPrimera clase: *${firstClass}*\nAccede en: hub.wcahn.com\n\n_World Connect Academy_`,
  newUnit: (name, unit, title) =>
    `Hola ${name}! Esta semana empieza *U${unit}: ${title}*.\n\nEntra a hub.wcahn.com a practicar!\n\n_World Connect Academy_`,
  examResult: (name, unit, score, passed) => passed
    ? `Felicitaciones ${name}! Aprobaste U${unit} con *${score}%*.\n\n_World Connect Academy_`
    : `Hola ${name}, tu resultado en U${unit} fue ${score}%. Necesitas 70%. Tienes mas intentos!\n\n_World Connect Academy_`,
};

async function sendWhatsApp(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';
  if (!sid || !token) { console.warn('Twilio not configured'); return { skipped: true }; }
  const phone = to.replace(/[^\d+]/g, '');
  const normalized = phone.startsWith('+') ? phone : `+${phone}`;
  const params = new URLSearchParams({
    From: `whatsapp:${from}`,
    To:   `whatsapp:${normalized}`,
    Body: body,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Twilio ${res.status}`);
  return { sid: data.sid, status: data.status };
}

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { checkRateLimit(`wa:${req.headers['x-forwarded-for']||'x'}`, 30, 60000); } catch(e) { return err(res, e); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'admin', 'super_admin', 'cobros', 'asesor_ventas', 'coordinadora');
    const { to, message, templateId, templateData } = req.body;
    if (!to || (!message && !templateId)) return err(res, { status: 400, message: 'to y message o templateId requeridos' });
    let body = message;
    if (templateId && TEMPLATES[templateId]) body = TEMPLATES[templateId](...(templateData || []));
    const result = await sendWhatsApp(to, body);
    return ok(res, { ...result, to, preview: body.slice(0, 100) });
  } catch(e) { return err(res, e); }
}
