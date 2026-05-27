// GET /api/jobs/weekly-digest
// Cron: domingos 10am UTC (4am Honduras)
// Envía email de resumen semanal a cada estudiante activo con:
//   - XP ganado esta semana
//   - Racha actual
//   - Posición en leaderboard del mes
//   - Próxima clase
// Auth: Vercel cron | CRON_SECRET | super_admin JWT

import { getSupabaseAdmin, sendEmail, requireAuth } from '../_utils.js';

export default async function handler(req, res) {
  const isCron   = req.headers['x-vercel-cron'] === '1';
  const isSecret = process.env.CRON_SECRET && req.headers['x-cron-secret'] === process.env.CRON_SECRET;
  let isAdmin = false;
  if (!isCron && !isSecret) {
    try { const { profile } = await requireAuth(req); isAdmin = profile.role === 'super_admin'; } catch(_) {}
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
  }
  if (req.method !== 'GET') return res.status(405).end();

  const admin = getSupabaseAdmin();
  const results = { sent: 0, skipped: 0, errors: [] };

  try {
    // Load active students with enrollment + gamification data
    const { data: profiles } = await admin
      .from('profiles')
      .select(`
        id, full_name, email, current_streak, total_xp, xp_level,
        students(
          id,
          enrollments(
            id, program_id, status, current_unit,
            group:groups(schedule, days, teams_link)
          )
        )
      `)
      .eq('role', 'estudiante')
      .eq('active', true)
      .not('email', 'is', null);

    if (!profiles?.length) return res.status(200).json({ message: 'No active students', results });

    // Load XP earned this week per profile
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weekXp } = await admin
      .from('xp_ledger')
      .select('profile_id, amount')
      .gte('created_at', weekAgo.toISOString());

    const xpThisWeek = {};
    (weekXp || []).forEach(r => {
      xpThisWeek[r.profile_id] = (xpThisWeek[r.profile_id] || 0) + r.amount;
    });

    // Load monthly leaderboard positions (top 20)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthXpData } = await admin
      .from('xp_ledger')
      .select('profile_id, amount')
      .gte('created_at', monthStart);

    const xpThisMonth = {};
    (monthXpData || []).forEach(r => {
      xpThisMonth[r.profile_id] = (xpThisMonth[r.profile_id] || 0) + r.amount;
    });
    const leaderboard = Object.entries(xpThisMonth)
      .sort(([,a],[,b]) => b - a)
      .map(([id], i) => ({ id, rank: i + 1 }));
    const rankMap = Object.fromEntries(leaderboard.map(r => [r.id, r.rank]));

    // Send digest to each student
    for (const p of profiles) {
      const firstName   = p.full_name?.split(' ')[0] || 'Estudiante';
      const weeklyXp    = xpThisWeek[p.id] || 0;
      const monthRank   = rankMap[p.id] || null;
      const streak      = p.current_streak || 0;
      const activeEnrolls = p.students?.flatMap(s => s.enrollments || []).filter(e => e.status === 'active') || [];

      // Skip if no activity and no enrollments
      if (weeklyXp === 0 && activeEnrolls.length === 0) { results.skipped++; continue; }

      const nextClass = activeEnrolls
        .map(e => e.group)
        .filter(Boolean)
        .map(g => `${g.days || 'L·M·V'} · ${g.schedule}`)
        .join(', ') || null;

      const rankLine = monthRank
        ? `<div style="background:#f3e8ff;border-radius:8px;padding:10px 14px;margin-top:10px;font-size:13px;color:#7c3aed">
            🏆 Posición en el ranking de ${new Date().toLocaleDateString('es-HN',{month:'long'})}: <strong>#${monthRank}</strong>
           </div>`
        : '';

      try {
        await sendEmail({
          to: p.email, toName: p.full_name,
          subject: `Resumen de tu semana en WCA — ${streak > 0 ? `🔥 ${streak} días de racha!` : '¡Seguí practicando!'}`,
          html: `
            <!DOCTYPE html><html><head><meta charset="utf-8"></head>
            <body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f7fa;margin:0;padding:20px">
            <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
              <div style="background:#155266;padding:28px;text-align:center">
                <div style="display:inline-block;background:#ffbb23;width:44px;height:44px;border-radius:10px;line-height:44px;font-size:22px;font-weight:900;color:#155266">W</div>
                <div style="color:#fff;font-size:18px;font-weight:700;margin-top:10px">Tu semana en WCA</div>
                <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px">
                  Semana del ${new Date(weekAgo).toLocaleDateString('es-HN',{day:'2-digit',month:'short'})} al ${new Date().toLocaleDateString('es-HN',{day:'2-digit',month:'short'})}
                </div>
              </div>
              <div style="padding:28px">
                <h2 style="color:#0f172a;font-size:20px;margin:0 0 20px">¡Hola, ${firstName}! 👋</h2>

                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px">
                  <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center">
                    <div style="font-size:22px;font-weight:800;color:#155266">⚡ ${weeklyXp}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:3px">XP esta semana</div>
                  </div>
                  <div style="background:${streak >= 7 ? '#fff8e6' : '#f8fafc'};border-radius:10px;padding:14px;text-align:center">
                    <div style="font-size:22px;font-weight:800;color:${streak >= 7 ? '#d97706' : '#94a3b8'}">🔥 ${streak}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:3px">Días de racha</div>
                  </div>
                  <div style="background:#f8fafc;border-radius:10px;padding:14px;text-align:center">
                    <div style="font-size:22px;font-weight:800;color:#7c3aed">⭐ ${p.total_xp?.toLocaleString() || 0}</div>
                    <div style="font-size:11px;color:#64748b;margin-top:3px">XP total</div>
                  </div>
                </div>

                ${rankLine}

                ${nextClass ? `
                  <div style="background:#e8f3f6;border-radius:10px;padding:14px 16px;margin-top:16px">
                    <div style="font-size:11px;color:#155266;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px">📅 PRÓXIMAS CLASES</div>
                    <div style="font-size:14px;font-weight:600;color:#0f172a">${nextClass}</div>
                  </div>` : ''}

                ${weeklyXp === 0 ? `
                  <div style="background:#fff8e6;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-top:16px;font-size:13px;color:#92400e">
                    Esta semana no registramos actividad. ¡Una práctica de 10 minutos al día hace la diferencia! 💪
                  </div>` : ''}

                <a href="https://wcahub.vercel.app/portal" style="display:block;text-align:center;background:#155266;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;margin-top:20px">
                  Continuar practicando →
                </a>
              </div>
              <div style="background:#f8fafc;padding:14px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
                World Connect Academy · <a href="https://wcahub.vercel.app" style="color:#155266">wcahub.vercel.app</a>
              </div>
            </div>
            </body></html>`,
        });
        results.sent++;
      } catch(e) { results.errors.push({ email: p.email, error: e.message }); }
    }

    return res.status(200).json({
      message: `Digest enviado a ${results.sent} estudiantes`,
      results,
    });

  } catch(e) {
    return res.status(500).json({ error: e.message, results });
  }
}
