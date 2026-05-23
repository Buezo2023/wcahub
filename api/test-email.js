// POST /api/test-email
// Auth: super_admin only
// Sends a real test email and returns the full Mailrelay response for debugging

import { requireAuth, requireRole, ok, err, setCORS } from './_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'super_admin', 'admin');

    const { to } = req.body;
    const target = to || actor.email;

    // Build the URL exactly as _utils.js does
    const domain   = process.env.MAILRELAY_DOMAIN   || '(NO CONFIGURADO)';
    const apiKey   = process.env.MAILRELAY_API_KEY  || '(NO CONFIGURADO)';
    const fromEmail= process.env.MAILRELAY_FROM_EMAIL || 'no-reply@worldconnectacademy.com';
    const fromName = process.env.MAILRELAY_FROM_NAME  || 'WCA Academy';

    const urlV1  = `https://${domain}/api/v1/send_email`;
    const urlV1s = `https://${domain}/api/v1/send_emails`;

    const body = {
      from:      { email: fromEmail, name: fromName },
      to:        [{ email: target, name: target }],
      subject:   '✅ Test WCA Hub — email de diagnóstico',
      html_part: `<h2>Email de prueba</h2><p>Si ves esto, Mailrelay está funcionando correctamente.</p><p>Dominio: ${domain}</p>`,
    };

    // Try both endpoints
    const results = {};
    for (const [label, url] of [['send_email', urlV1], ['send_emails', urlV1s]]) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'x-auth-token': apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const text = await r.text();
        let json = null;
        try { json = JSON.parse(text); } catch {}
        results[label] = {
          status:     r.status,
          statusText: r.statusText,
          url,
          response:   json || text.slice(0, 500),
          ok:         r.ok,
        };
        if (r.ok) break; // stop if one works
      } catch(e) {
        results[label] = { error: e.message, url };
      }
    }

    return ok(res, {
      target,
      domain,
      fromEmail,
      keyConfigured: apiKey !== '(NO CONFIGURADO)' && apiKey.length > 10,
      results,
    });

  } catch(e) { return err(res, e); }
}
