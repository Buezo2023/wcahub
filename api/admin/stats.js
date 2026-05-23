// GET /api/admin/stats
// Auth: super_admin, directivo, admin

import { requireAuth, requireRole, getSupabaseAdmin, ok, err, CORS } from '../_utils.js';

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
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

    // Run all queries in parallel
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
      admin.from('payments').select('amount, program_id:enrollments(program_id), created_at').eq('status', 'confirmed').gte('created_at', month1),
      admin.from('payments').select('amount').eq('status', 'confirmed').gte('created_at', month0).lt('created_at', month1),
      admin.from('enrollments').select('program_id, status').eq('status', 'active'),
      admin.from('students').select('id', { count: 'exact' }).gte('created_at', month1),
      admin.from('staff').select('id', { count: 'exact' }).eq('active', true),
      admin.from('leads').select('stage'),
    ]);

    const mrr      = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const mrrLast  = (paymentsLastRes.data || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    const mrrGrowth = mrrLast > 0 ? ((mrr - mrrLast) / mrrLast * 100).toFixed(1) : 0;

    // Program breakdown
    const enrollsByProgram = (programBreakdownRes.data || []).reduce((acc, e) => {
      acc[e.program_id] = (acc[e.program_id] || 0) + 1;
      return acc;
    }, {});

    // Lead funnel
    const leadFunnel = (leadsRes.data || []).reduce((acc, l) => {
      acc[l.stage] = (acc[l.stage] || 0) + 1;
      return acc;
    }, {});

    return ok(res, {
      // Core KPIs
      totalStudents:   studentsRes.count  || 0,
      activeEnrolls:   activeEnrollsRes.count || 0,
      mrr:             mrr,
      mrrLastMonth:    mrrLast,
      mrrGrowthPct:    Number(mrrGrowth),
      arr:             mrr * 12,
      arpu:            activeEnrollsRes.count > 0 ? (mrr / activeEnrollsRes.count).toFixed(2) : 0,
      newStudentsMonth: newStudentsRes.count || 0,
      totalStaff:       staffRes.count || 0,

      // Breakdowns
      enrollsByProgram,
      leadFunnel,

      // Revenue by program (current month)
      revenueByProgram: (paymentsRes.data || []).reduce((acc, p) => {
        const pid = p.program_id?.program_id || 'unknown';
        acc[pid] = (acc[pid] || 0) + Number(p.amount || 0);
        return acc;
      }, {}),

      // Meta
      generatedAt: new Date().toISOString(),
      period:      `${now.toLocaleDateString('es-HN', { month: 'long', year: 'numeric' })}`,
    });

  } catch (e) {
    return err(res, e);
  }
}
