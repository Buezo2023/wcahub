// GET /api/admin/stats
// Auth: super_admin, directivo, admin

import { requireAuth, requireRole, getSupabaseAdmin, ok, err, setCORS, checkRateLimit } from '../_utils.js';

export default async function handler(req, res) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    await checkRateLimit(`stats:${ip}`, 60, 60000);
  } catch (e) { return err(res, e); }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { profile: actor } = await requireAuth(req);
    requireRole(actor, 'super_admin', 'directivo', 'admin');

    const admin = getSupabaseAdmin();

    const now    = new Date();
    const y      = now.getFullYear();
    const m      = now.getMonth();
    const month1 = new Date(y, m, 1).toISOString();
    const month0 = new Date(y, m - 1, 1).toISOString();

    // Run all queries in parallel — each is safe to fail individually
    const [
      studentsRes,
      activeEnrollsRes,
      paymentsRes,
      paymentsLastRes,
      programBreakdownRes,
      newStudentsRes,
      staffRes,
      leadsRes,
    ] = await Promise.all([
      admin.from('students').select('id', { count: 'exact' }),
      admin.from('enrollments').select('id, program_id', { count: 'exact' }).eq('status', 'active'),
      // Simplified: no ambiguous join — just amount and created_at for MRR calculation
      admin.from('payments').select('amount, created_at, enrollment_id').eq('status', 'confirmed').gte('created_at', month1),
      admin.from('payments').select('amount').eq('status', 'confirmed').gte('created_at', month0).lt('created_at', month1),
      admin.from('enrollments').select('program_id, status').eq('status', 'active'),
      admin.from('students').select('id', { count: 'exact' }).gte('created_at', month1),
      admin.from('staff').select('id', { count: 'exact' }).eq('active', true),
      // leads may not exist — use catch to avoid breaking everything
      admin.from('leads').select('stage').limit(500).catch(() => ({ data: null, error: null })),
    ]);

    // Validate critical queries
    if (studentsRes.error)
      return err(res, { status: 500, message: `Error cargando estudiantes: ${studentsRes.error.message}` });
    if (activeEnrollsRes.error)
      return err(res, { status: 500, message: `Error cargando matrículas: ${activeEnrollsRes.error.message}` });

    // Non-critical queries: log and continue with empty data
    if (paymentsRes.error)      console.error('[stats] payments error:', paymentsRes.error.message);
    if (paymentsLastRes.error)  console.error('[stats] payments last error:', paymentsLastRes.error.message);
    if (programBreakdownRes.error) console.error('[stats] program breakdown error:', programBreakdownRes.error.message);
    if (newStudentsRes.error)   console.error('[stats] new students error:', newStudentsRes.error.message);
    if (staffRes.error)         console.error('[stats] staff error:', staffRes.error.message);

    const mrr      = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const mrrLast  = (paymentsLastRes.data || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const mrrGrowth = mrrLast > 0 ? ((mrr - mrrLast) / mrrLast * 100).toFixed(1) : 0;

    // Program breakdown
    const byProgram = (programBreakdownRes.data || []).reduce((acc, e) => {
      if (e.program_id) acc[e.program_id] = (acc[e.program_id] || 0) + 1;
      return acc;
    }, {});

    // Lead funnel — safe even if leads table doesn't exist
    const leadFunnel = (leadsRes.data || []).reduce((acc, l) => {
      if (l.stage) acc[l.stage] = (acc[l.stage] || 0) + 1;
      return acc;
    }, {});

    // Revenue by program via enrollments join (safe — no ambiguous column)
    const revenueByProgram = {};
    if (paymentsRes.data && !paymentsRes.error) {
      const enrollmentIds = paymentsRes.data
        .filter(p => p.enrollment_id)
        .map(p => p.enrollment_id);
      if (enrollmentIds.length) {
        const { data: enrollForRevenue } = await admin
          .from('enrollments').select('id, program_id').in('id', enrollmentIds);
        const enrollMap = {};
        (enrollForRevenue || []).forEach(e => { enrollMap[e.id] = e.program_id; });
        paymentsRes.data.forEach(p => {
          const pid = enrollMap[p.enrollment_id] || 'unknown';
          revenueByProgram[pid] = (revenueByProgram[pid] || 0) + Number(p.amount || 0);
        });
      }
    }

    return ok(res, {
      totalStudents:    studentsRes.count  || 0,
      activeEnrolls:    activeEnrollsRes.count || 0,
      mrr,
      mrrLastMonth:     mrrLast,
      mrrGrowthPct:     Number(mrrGrowth),
      arr:              mrr * 12,
      arpu:             activeEnrollsRes.count > 0 ? (mrr / activeEnrollsRes.count).toFixed(2) : 0,
      newStudentsMonth: newStudentsRes.count || 0,
      newThisMonth:     newStudentsRes.count || 0, // alias for BISection compatibility
      totalStaff:       staffRes.count || 0,
      byProgram,
      activePrograms:   Object.keys(byProgram).filter(k => byProgram[k] > 0).length,
      leadFunnel,
      revenueByProgram,
      generatedAt: new Date().toISOString(),
      period: `${now.toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })}`,
    });

  } catch (e) {
    console.error('[stats] unhandled error:', e.message);
    return err(res, { status: 500, message: `Error cargando métricas: ${e.message}` });
  }
}
