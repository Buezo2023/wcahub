// GET /api/jobs/class-reminders
// Cron: cada hora, en punto (0 * * * *)
// Busca grupos cuya clase empieza en ~60 minutos y envía WhatsApp + in-app
// Solo actúa si groups.schedule_utc está configurado
// Auth: Vercel cron | CRON_SECRET | super_admin JWT

import { getSupabaseAdmin, requireAuth } from '../_utils.js';

const DAYS_UTC = ['sun','mon','tue','wed','thu','fri','sat'];

async function sendWhatsApp(to, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';
  if (!sid || !token) return { skipped: true };
  const phone = to.replace(/[^\d+]/g, '');
  const norm  = phone.startsWith('+') ? phone : `+${phone}`;
  const params = new URLSearchParams({
    From: `whatsapp:${from}`, To: `whatsapp:${norm}`, Body: body,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    { method:'POST',
      headers:{ 'Authorization':'Basic '+Buffer.from(`${sid}:${token}`).toString('base64'),
                'Content-Type':'application/x-www-form-urlencoded' },
      body: params.toString() }
  );
  return res.ok ? await res.json() : { error: true };
}

// Checks if a group has class within the next 55–75 minutes (UTC)
function classSoonUTC(group, nowUTC) {
  if (!group.schedule_utc) return false;

  // Check if today is a class day for this group
  const todayCode = DAYS_UTC[nowUTC.getUTCDay()];
  const classDays = group.days_arr || [];
  if (classDays.length > 0 && !classDays.includes(todayCode)) return false;

  // Check if class starts in 55–75 min window
  const [h, m] = group.schedule_utc.split(':').map(Number);
  const classMinutes = h * 60 + m;
  const nowMinutes   = nowUTC.getUTCHours() * 60 + nowUTC.getUTCMinutes();
  const diff = classMinutes - nowMinutes;

  return diff >= 55 && diff <= 75;
}

export default async function handler(req, res) {
  const isCron   = req.headers['x-vercel-cron'] === '1';
  const isSecret = process.env.CRON_SECRET && req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  let isAdmin = false;
  if (!isCron && !isSecret) {
    try { const { profile } = await requireAuth(req); isAdmin = profile.role === 'super_admin'; } catch(_) {}
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'GET') return res.status(405).end();

  const admin  = getSupabaseAdmin();
  const nowUTC = new Date();
  const results = { checked: 0, sent: 0, skipped: 0, errors: [] };

  try {
    // Load active groups that have UTC schedule configured
    const { data: groups } = await admin
      .from('groups')
      .select('id, level, schedule, schedule_utc, days_arr, program_id, teams_link')
      .eq('active', true)
      .not('schedule_utc', 'is', null);

    if (!groups?.length) {
      return res.status(200).json({ message: 'No groups with UTC schedule configured', results });
    }

    // Filter groups with class soon
    const soonGroups = groups.filter(g => classSoonUTC(g, nowUTC));
    results.checked = groups.length;

    if (!soonGroups.length) {
      return res.status(200).json({ message: 'No classes starting in ~1 hour', results });
    }

    // For each upcoming group, notify enrolled students
    for (const group of soonGroups) {
      const { data: enrollments } = await admin
        .from('enrollments')
        .select(`
          id,
          student:students(
            id,
            profile:profiles(id, full_name, phone, timezone, active)
          )
        `)
        .eq('group_id', group.id)
        .eq('status', 'active');

      if (!enrollments?.length) continue;

      const progNames = { en:'Inglés', va:'VA General', va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador' };
      const progName  = progNames[group.program_id] || group.program_id;
      const teamsLink = group.teams_link || 'wcahub.vercel.app/portal';

      for (const enroll of enrollments) {
        const profile = enroll.student?.profile;
        if (!profile?.active || !profile?.id) { results.skipped++; continue; }

        // In-app notification (always)
        await admin.from('notifications').insert({
          user_id: profile.id,
          type:    'class',
          title:   `📅 Tu clase de ${progName} empieza en 1 hora`,
          body:    `${group.schedule} · ${group.level || ''} — Hacé click para unirte`,
          link:    teamsLink?.startsWith('http') ? teamsLink : '/portal',
        }).catch(() => {});

        // WhatsApp reminder (if phone available)
        if (profile.phone) {
          const firstName = profile.full_name?.split(' ')[0] || 'Hola';
          const msg = `📅 ${firstName}, tu clase de *${progName}* empieza en *1 hora* (${group.schedule}).\n\n${teamsLink?.startsWith('http') ? `Uníte acá: ${teamsLink}` : 'Ingresá a tu portal en wcahub.vercel.app'}\n\n_World Connect Academy_`;
          const wa = await sendWhatsApp(profile.phone, msg).catch(() => ({ error: true }));
          if (!wa?.error && !wa?.skipped) results.sent++;
          else results.skipped++;
        } else {
          results.skipped++;
        }
      }
    }

    return res.status(200).json({
      message: `Recordatorios enviados — ${soonGroups.length} grupo(s) próximos`,
      upcomingGroups: soonGroups.map(g => g.schedule),
      results,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message, results });
  }
}
