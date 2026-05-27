// GET /api/jobs/weekly-cycle
// Cron: cada lunes a las 06:00 UTC (medianoche Honduras)
// 1. Avanza active_unit de todos los grupos activos (1→2→...→12→1)
// 2. Sincroniza cycle_config por nivel
// 3. Notifica a estudiantes del nuevo contenido via WhatsApp + in-app
// Auth: Vercel cron header | CRON_SECRET | super_admin JWT

import { getSupabaseAdmin, requireAuth } from '../_utils.js';

const PROG_NAMES = {
  en:'Inglés Completo', va:'Asistente Virtual',
  va_mkt:'VA Marketing', va_legal:'VA Legal', va_care:'VA Cuidador',
};

// Unit titles per level (for WhatsApp "nueva unidad" message)
const UNIT_TITLES = {
  A1: ['Self','Things','Places','Life','Travel','Skills','Reasons','History','Comforts','Adventure','Learning','Activities'],
  A2: ['Identity','Relationships','Responsibilities','Extremes','Creativity','Places','Culture','Change','Technology','Environment','Future','Review'],
  B1: ['Interactions','Time','Learning','Movement','Home','Images','Society','Work','Nature','Mind','Art','Connections'],
  B2: ['Achievements','News','Frontiers','Processes','Survival','Trends','Ethics','Innovation','Heritage','Language','Science','Legacy'],
  C1: ['Values','Memory','Discoveries','Privacy','Alternatives','Fun','Complexity','Persuasion','Narrative','Debate','Synthesis','Mastery'],
};

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

export default async function handler(req, res) {
  // Auth: Vercel cron OR secret header OR super_admin JWT
  const isCron   = req.headers['x-vercel-cron'] === '1';
  const isSecret = process.env.CRON_SECRET && req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  let isAdmin = false;
  if (!isCron && !isSecret) {
    try { const { profile } = await requireAuth(req); isAdmin = profile.role === 'super_admin'; } catch(_) {}
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'GET') return res.status(405).end();

  const admin = getSupabaseAdmin();
  const todayStr = new Date().toISOString().slice(0, 10);
  const results = { groups: 0, notifications: 0, whatsapp: 0, errors: [] };

  try {
    // ── 1. Load all active groups ──────────────────────────────────
    const { data: groups, error: groupsErr } = await admin
      .from('groups')
      .select('id, level, program_id, active_unit, schedule, days')
      .eq('active', true);

    if (groupsErr) throw groupsErr;
    if (!groups?.length) return res.status(200).json({ message: 'No active groups', results });

    // ── 2. Advance each group's active_unit ────────────────────────
    const updates = groups.map(g => {
      const curr = g.active_unit || 1;
      const next = curr >= 12 ? 1 : curr + 1;
      return { id: g.id, active_unit: next, prev_unit: curr, level: g.level, program_id: g.program_id };
    });

    for (const u of updates) {
      const { error } = await admin.from('groups')
        .update({ active_unit: u.active_unit })
        .eq('id', u.id);
      if (error) { results.errors.push({ group: u.id, error: error.message }); continue; }
      results.groups++;
    }

    // ── 3. Sync cycle_config per level (used by SuperAdmin display) ─
    // Group updates by level, take the most common new unit
    const levelUnits = {};
    updates.forEach(u => {
      if (!levelUnits[u.level]) levelUnits[u.level] = [];
      levelUnits[u.level].push(u.active_unit);
    });
    for (const [level, units] of Object.entries(levelUnits)) {
      const mostCommon = units.sort((a,b) =>
        units.filter(v=>v===b).length - units.filter(v=>v===a).length)[0];
      await admin.from('cycle_config').upsert({
        program_id: 'en', level, current_unit: mostCommon, updated_at: new Date().toISOString(),
      }, { onConflict: 'program_id,level' }).catch(() => {});
    }

    // ── 4. Notify enrolled students (in-app + WhatsApp) ────────────
    // Load all active enrollments with student info
    const { data: enrollments } = await admin
      .from('enrollments')
      .select(`
        id, program_id, group_id, current_unit,
        student:students(
          id, level,
          profile:profiles(id, full_name, phone, active)
        )
      `)
      .eq('status', 'active')
      .not('group_id', 'is', null);

    if (enrollments?.length) {
      // Map group_id → new active_unit
      const groupUnitMap = Object.fromEntries(updates.map(u => [u.id, u.active_unit]));

      // Batch in-app notifications and optional WhatsApp
      for (const enroll of enrollments) {
        const profile = enroll.student?.profile;
        if (!profile?.active || !profile?.id) continue;

        const newUnit = groupUnitMap[enroll.group_id];
        if (!newUnit) continue;

        const progName = PROG_NAMES[enroll.program_id] || enroll.program_id;
        const level    = enroll.student?.level || 'A1';
        const titles   = UNIT_TITLES[level] || UNIT_TITLES['A1'];
        const title    = titles[(newUnit - 1) % 12] || `Unidad ${newUnit}`;

        // In-app notification
        await admin.from('notifications').insert({
          user_id: profile.id,
          type:    'class',
          title:   `📚 Nueva unidad disponible — U${newUnit}`,
          body:    `Esta semana: "${title}". ¡Ingresá a practicar!`,
          link:    '/portal',
        }).catch(() => {});
        results.notifications++;

        // WhatsApp (only if phone exists and Twilio configured)
        if (profile.phone) {
          const msg = `Hola ${profile.full_name?.split(' ')[0]}! Esta semana en *${progName}* empieza *U${newUnit}: ${title}*.\n\nEntra a practicar en wcahub.vercel.app 🚀\n\n_World Connect Academy_`;
          const wa = await sendWhatsApp(profile.phone, msg).catch(() => ({ error: true }));
          if (!wa?.error && !wa?.skipped) results.whatsapp++;
        }
      }
    }

    // ── 5. Audit log ───────────────────────────────────────────────
    await admin.from('audit_log').insert({
      action:   'weekly_cycle_advanced',
      entity:   'system',
      metadata: { date: todayStr, results, groupsAdvanced: results.groups },
    }).catch(() => {});

    return res.status(200).json({
      message: `Ciclo avanzado correctamente — ${results.groups} grupos`,
      date: todayStr, results,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message, results });
  }
}
