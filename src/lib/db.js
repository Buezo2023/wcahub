// ─── WCA Hub — Data Service Layer ────────────────────────────────
// Todas las queries a Supabase centralizadas aquí.
// Si la BD está vacía, cada función devuelve [] o {} sin crashear.

import { supabase } from './supabase.js';

// ─── AUTH ─────────────────────────────────────────────────────────
export async function getCurrentProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return data;
}

// ─── STUDENTS ─────────────────────────────────────────────────────
export async function getStudents({ limit = 50, page = 0, search = '', level = '', status = '' } = {}) {
  const from = page * limit;
  const to   = from + limit - 1;
  let query = supabase
    .from('students')
    .select(`
      id, student_code, level, scholarship, notes, created_at,
      profile:profiles(id, full_name, email, phone, avatar_url, active, role),
      enrollments(id, program_id, status, current_unit, group_id,
        group:groups(id, schedule, days, level, teams_link)
      )
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (level)  query = query.eq('level', level);

  const { data, error, count } = await query;
  if (error) { import.meta.env.DEV && console.warn('[db]', error); return { rows: [], total: 0 }; }

  let results = data || [];

  if (search) {
    const s = search.toLowerCase();
    results = results.filter(st =>
      st.profile?.full_name?.toLowerCase().includes(s) ||
      st.profile?.email?.toLowerCase().includes(s) ||
      st.student_code?.toLowerCase().includes(s)
    );
  }

  if (status) {
    results = results.filter(st =>
      st.enrollments?.some(e => e.status === status)
    );
  }

  return results;
}

export async function getStudent(studentId) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profile:profiles(*),
      enrollments(*, group:groups(*), program:programs(*))
    `)
    .eq('id', studentId)
    .single();
  if (error) { import.meta.env.DEV && console.error('getStudent:', error); return null; }
  return data;
}

export async function updateStudentEnrollment(enrollmentId, updates) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── PAYMENTS ─────────────────────────────────────────────────────
export async function getPayments({ limit = 50, page = 0, status = '', search = '' } = {}) {
  let query = supabase
    .from('payments')
    .select(`
      id, amount, currency, method, status, reference_code,
      bank, proof_url, period_start, period_end, notes, created_at,
      confirmed_at,
      student:students(
        id, student_code,
        profile:profiles(full_name, email, phone)
      ),
      enrollment:enrollments(program_id)
    `, { count: 'exact' })
    .range(page * limit, page * limit + limit - 1)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) { import.meta.env.DEV && console.warn('[db]', error); return { rows: [], total: 0 }; }

  let results = data || [];
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(p =>
      p.student?.profile?.full_name?.toLowerCase().includes(s) ||
      p.reference_code?.toLowerCase().includes(s) ||
      p.student?.student_code?.toLowerCase().includes(s)
    );
  }
  return { rows: results, total: count || results.length };
}

export async function confirmPayment(paymentId, confirmerId) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'confirmed',
      confirmed_by: confirmerId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .select()
    .single();
  if (error) throw error;

  // Log to audit
  await supabase.from('audit_log').insert({
    actor_id: confirmerId,
    action: 'confirmed_payment',
    entity: 'payment',
    entity_id: paymentId,
    metadata: { payment_id: paymentId },
  });

  return data;
}

export async function rejectPayment(paymentId, reason, actorId) {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'failed', notes: reason })
    .eq('id', paymentId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action: 'rejected_payment',
    entity: 'payment',
    entity_id: paymentId,
    metadata: { reason },
  });

  return data;
}

// ─── GROUPS ───────────────────────────────────────────────────────
export async function getGroups({ programId = '', level = '' } = {}) {
  let query = supabase
    .from('groups')
    .select(`
      id, schedule, days, capacity, active_unit, active, teams_link,
      program_id, level,
      teacher_groups(
        teacher:staff(
          id,
          profile:profiles(full_name, avatar_url)
        )
      ),
      enrollments(id, status)
    `)
    .eq('active', true)
    .order('level');

  if (programId) query = query.eq('program_id', programId);
  if (level)     query = query.eq('level', level);

  const { data, error } = await query;
  if (error) { import.meta.env.DEV && console.warn('[db]', error); return []; }
  return data || [];
}

export async function updateGroupTeamsLink(groupId, teamsLink) {
  const { error } = await supabase
    .from('groups')
    .update({ teams_link: teamsLink })
    .eq('id', groupId);
  if (error) throw error;
}

// ─── STAFF ────────────────────────────────────────────────────────
export async function getStaff({ active = true, all = false } = {}) {
  let query = supabase
    .from('staff')
    .select(`
      id, employee_id, position, department, salary, hire_date, active,
      profile:profiles(id, full_name, email, phone, avatar_url, role)
    `)
    .order('hire_date', { ascending: false });

  // active=true → solo activos, active=false → solo inactivos, all=true → todos
  if (!all && active !== undefined && active !== null) {
    query = query.eq('active', active);
  }

  const { data, error } = await query;
  if (error) { import.meta.env.DEV && console.error('getStaff error:', error.message, error.code); return []; }
  return data || [];
}

// ─── LEADS (CRM) ──────────────────────────────────────────────────
export async function getLeads({ search = '', stage = '', limit = 50, page = 0 } = {}) {
  let query = supabase
    .from('leads')
    .select(`
      id, full_name, email, phone, country, stage, source,
      program_interest, level_interest, test_score,
      notes, converted_at, lost_reason, created_at, updated_at,
      assigned:profiles!leads_assigned_to_fkey(full_name, avatar_url),
      tasks:crm_tasks(id, title, due_date, done)
    `)
    .order('updated_at', { ascending: false });

  if (stage) query = query.eq('stage', stage);

  const { data, error, count } = await query;
  if (error) { import.meta.env.DEV && console.warn('[db]', error); return { rows: [], total: 0 }; }

  let results = data || [];
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(l =>
      l.full_name?.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.phone?.includes(s)
    );
  }
  return results;
}

export async function createLead(leadData) {
  const { data, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLeadStage(leadId, stage) {
  const { data, error } = await supabase
    .from('leads')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createTask(taskData) {
  const { data, error } = await supabase
    .from('crm_tasks')
    .insert(taskData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleTask(taskId, done) {
  const { data, error } = await supabase
    .from('crm_tasks')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── PROGRAMS ─────────────────────────────────────────────────────
export async function getPrograms() {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('id');
  if (error) { import.meta.env.DEV && console.error('getPrograms:', error); return []; }
  return data || [];
}

export async function updateProgramPrice(programId, priceMonthly, priceQuarterly) {
  const updates = {};
  if (priceMonthly   !== undefined) updates.price_monthly   = priceMonthly;
  if (priceQuarterly !== undefined) updates.price_quarterly = priceQuarterly;

  const { data, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', programId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── BI / METRICS ─────────────────────────────────────────────────
export async function getMetrics() {
  const [students, payments, enrollments] = await Promise.all([
    supabase.from('students').select('id, created_at', { count: 'exact' }),
    supabase.from('payments').select('amount, status, created_at').eq('status', 'confirmed'),
    supabase.from('enrollments').select('id, program_id, status', { count: 'exact' }).eq('status', 'active'),
  ]);

  const totalStudents  = students.count || 0;
  const activeEnrolls  = enrollments.count || 0;
  const confirmedPays  = payments.data || [];
  const totalRevenue   = confirmedPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const mrr            = totalRevenue; // Simplified — real MRR needs subscription logic

  return { totalStudents, activeEnrolls, totalRevenue, mrr };
}

// ─── PROGRAMS ENROLLMENT ──────────────────────────────────────────
export async function enrollStudent(studentId, programId, groupId, price) {
  const { data, error } = await supabase
    .from('enrollments')
    .upsert({
      student_id:    studentId,
      program_id:    programId,
      group_id:      groupId,
      status:        'active',
      price_locked:  price,
      current_unit:  1,
    }, { onConflict: 'student_id,program_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── ATTENDANCE ───────────────────────────────────────────────────
export async function getAttendance(groupId, dateFrom) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id, class_date, unit, present, late, reason,
      enrollment:enrollments(
        student:students(
          profile:profiles(full_name, avatar_url)
        )
      )
    `)
    .eq('group_id', groupId)
    .gte('class_date', dateFrom || '2025-01-01')
    .order('class_date', { ascending: false });
  if (error) { import.meta.env.DEV && console.error('getAttendance:', error); return []; }
  return data || [];
}

// ─── AUDIT LOG ────────────────────────────────────────────────────
export async function getAuditLog({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('audit_log')
    .select(`
      id, action, entity, entity_id, metadata, created_at,
      actor:profiles!audit_log_actor_id_fkey(full_name, role, avatar_url)
    `)
    .limit(limit)
    .order('created_at', { ascending: false });
  if (error) { import.meta.env.DEV && console.error('getAuditLog:', error); return []; }
  return data || [];
}

// ─── ADMIN: Register new enrollment ──────────────────────────────
export async function registerNewStudent({ fullName, email, phone, programId, level, groupId, price }) {
  // 1. Create or find auth user (invite flow — for now just create profile)
  // In production this would send an email invite via Supabase Auth
  // For now we create the student record directly

  // Check if profile exists by email
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  let profileId = existingProfile?.id;

  // If no profile, we can't create auth.users directly from client
  // Return a pending state — admin will need to invite manually
  if (!profileId) {
    return { status: 'pending_invite', message: `Invitación pendiente para ${email}` };
  }

  // Create student record
  const { data: student, error: studentError } = await supabase
    .from('students')
    .upsert({ profile_id: profileId, level }, { onConflict: 'profile_id' })
    .select()
    .single();
  if (studentError) throw studentError;

  // Create enrollment
  const enrollment = await enrollStudent(student.id, programId, groupId, price);
  return { status: 'success', student, enrollment };
}
