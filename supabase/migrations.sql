-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Migrations & Missing Tables
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- Seguro para ejecutar múltiples veces (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. enrollments.next_payment_date (si no existe) ──────────────
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS next_payment_date date;

-- ── 2. programs.active (si no existe) ────────────────────────────
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- ── 3. bank_accounts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre     text NOT NULL,
  banco      text,
  cuenta     text,
  titular    text,
  tipo       text DEFAULT 'ahorro',
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "banks_read_staff" ON public.bank_accounts FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','cobros'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "banks_write_admin" ON public.bank_accounts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. app_config ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_config (
  key        text PRIMARY KEY,
  value      jsonb,
  updated_at timestamptz DEFAULT now()
);

-- ── 5. b2b_companies ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_companies (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  contact_name  text,
  contact_email text,
  contact_phone text,
  seats_paid    int DEFAULT 1,
  discount_pct  numeric(5,2) DEFAULT 0,
  notes         text,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.b2b_companies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "b2b_staff" ON public.b2b_companies FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','asesor_ventas'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 6. notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type       text DEFAULT 'info',   -- info, success, warning, error
  title      text NOT NULL,
  body       text,
  link       text,
  read       boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "notifs_own" ON public.notifications FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 7. staff RLS policies ─────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "staff_read_own" ON public.staff FOR SELECT USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "staff_admin" ON public.staff FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 8. teacher_groups RLS ────────────────────────────────────────
DO $$ BEGIN
  CREATE POLICY "tg_read_all" ON public.teacher_groups FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente','estudiante','cobros'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "tg_admin" ON public.teacher_groups FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 9. groups / programs write protection ────────────────────────
DO $$ BEGIN
  CREATE POLICY "groups_read_all"  ON public.groups FOR SELECT USING (true);
  CREATE POLICY "groups_write_admin" ON public.groups FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "programs_read_all" ON public.programs FOR SELECT USING (true);
  CREATE POLICY "programs_write_admin" ON public.programs FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 11. onboarding_done (AuthCallback + Onboarding wizard) ───────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_done boolean DEFAULT false;

-- ── 12. certificates (PortalEstudiante — generated on completion) ─
CREATE TABLE IF NOT EXISTS public.certificates (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  uuid REFERENCES public.students(id) ON DELETE CASCADE,
  program_id  text NOT NULL,
  level       text,
  data        jsonb,
  issued_at   timestamptz DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "certs_own" ON public.certificates FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "certs_admin" ON public.certificates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 13. student_notes (DashboardAdmin — notas por estudiante) ─────
CREATE TABLE IF NOT EXISTS public.student_notes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id  uuid REFERENCES public.students(id) ON DELETE CASCADE,
  author_id   uuid REFERENCES public.profiles(id),
  note        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "notes_staff" ON public.student_notes FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','cobros','docente'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ── 14. attendance RLS policies ──────────────────────────────────
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "attendance_read" ON public.attendance FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente'))
    OR EXISTS (
      SELECT 1 FROM enrollments e JOIN students s ON s.id = e.student_id
      WHERE e.id = enrollment_id AND s.profile_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "attendance_write" ON public.attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 15. audit_log write policy (frontend direct writes) ──────────
DO $$ BEGIN
  CREATE POLICY "audit_write_self" ON public.audit_log FOR INSERT WITH CHECK (
    actor_id = auth.uid() OR actor_id IS NULL
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 10. Verify: show table status ────────────────────────────────
SELECT table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ── 16. Performance indexes ───────────────────────────────────────
-- Run these in Supabase SQL Editor for query performance at scale

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active) WHERE active = true;

-- students
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id        ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id        ON public.enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status            ON public.enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_next_payment_date ON public.enrollments(next_payment_date)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_enrollments_group_id          ON public.enrollments(group_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_student_id    ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON public.payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at    ON public.payments(created_at DESC);

-- leads
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- audit_log
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON public.audit_log(action);

-- LMS
CREATE INDEX IF NOT EXISTS idx_units_program  ON public.units(program_id, level);
CREATE INDEX IF NOT EXISTS idx_activities_unit ON public.unit_activities(unit_id, order_num);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.unit_activities(type);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON public.notifications(user_id, read)
  WHERE read = false;


-- ── B2B: add program_id column ────────────────────────────────────
-- b2b_companies.program_id: use program_id enum type to match programs.id
-- No FK constraint — store as text to avoid enum dependency issues
ALTER TABLE public.b2b_companies
  ADD COLUMN IF NOT EXISTS program_id text,       -- matches programs.id values (en, va, etc.)
  ADD COLUMN IF NOT EXISTS program_name text;      -- cached name for display

-- ─── Migration: profiles XP + preferred_name ─────────────────────
-- Run AFTER initial schema.sql
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_xp        integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS xp_level        integer DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS preferred_name  text;

-- RPC: increment_xp
-- Called by LMSPlayer.jsx when a student completes an activity
-- Params: p_profile_id uuid, p_amount integer
CREATE OR REPLACE FUNCTION increment_xp(p_profile_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    total_xp = COALESCE(total_xp, 0) + p_amount,
    xp_level = GREATEST(1, FLOOR((COALESCE(total_xp, 0) + p_amount) / 500) + 1)
  WHERE id = p_profile_id;
END;
$$;

-- Grant execute to authenticated users (needed for SECURITY DEFINER to work from client)
GRANT EXECUTE ON FUNCTION increment_xp(uuid, integer) TO authenticated;

-- ─── Migration: Enable Row Level Security ────────────────────────
-- Policies already exist in schema.sql — just enable enforcement.
-- Test each table in staging before running in production.

-- Sensitive tables: enable RLS
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE students     ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;

-- Additional tables with policies in migrations.sql
ALTER TABLE groups           ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff            ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance       ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes    ENABLE ROW LEVEL SECURITY;

-- ─── MISSING POLICY: profiles own UPDATE ─────────────────────────
-- profiles_own only covers SELECT. Students need UPDATE for
-- preferred_name, phone, avatar_url in PortalEstudiante.
-- Safe: only own row, only non-sensitive columns enforced by app.
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── MISSING POLICY: enrollments read for docente ────────────────
-- PortalDocente reads enrollments (student_id, group_id) to list
-- students in a group. enrollments_staff covers admin/coordinadora/cobros
-- but NOT docente. Adding a read-only policy for docente.
DROP POLICY IF EXISTS "enrollments_docente_read" ON enrollments;
CREATE POLICY "enrollments_docente_read" ON enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teacher_groups tg
      JOIN staff s ON s.id = tg.teacher_id
      WHERE s.profile_id = auth.uid()
        AND tg.group_id = enrollments.group_id
    )
  );

-- ─── MISSING POLICY: payments read for directivo (BI dashboard) ──
-- BIDashboard reads payments for revenue charts.
-- payments_staff covers cobros/admin/super_admin but NOT directivo.
DROP POLICY IF EXISTS "payments_directivo_read" ON payments;
CREATE POLICY "payments_directivo_read" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('directivo', 'admin', 'super_admin')
    )
  );

-- ─── MISSING POLICY: student_progress write for own student ──────
-- LMSPlayer writes student_progress when completing activities.
-- progress_staff covers admins/docentes, progress_own covers SELECT.
-- Students need INSERT/UPDATE on their own progress rows.
DROP POLICY IF EXISTS "progress_own_write" ON student_progress;
CREATE POLICY "progress_own_write" ON student_progress
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.id = enrollment_id AND s.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.id = enrollment_id AND s.profile_id = auth.uid()
    )
  );

-- ─── Migration: columnas faltantes en tablas existentes ──────────
-- Fecha: 2026-05-26
-- Ejecutar DESPUÉS de lms-schema.sql

-- 1. student_progress: ExamModule escribe student_id, program_id, unit, exam_score, passed
--    El schema actual usa enrollment_id + unit_id. Agregamos las columnas alternativas
--    para que el upsert no falle en silencio.
ALTER TABLE public.student_progress
  ADD COLUMN IF NOT EXISTS student_id  uuid REFERENCES public.students(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS program_id  text,
  ADD COLUMN IF NOT EXISTS unit        int,
  ADD COLUMN IF NOT EXISTS exam_score  numeric(5,2),
  ADD COLUMN IF NOT EXISTS passed      boolean DEFAULT false;

-- Índice para el onConflict="student_id,program_id,unit" que usa ExamModule
CREATE UNIQUE INDEX IF NOT EXISTS idx_sp_student_prog_unit
  ON public.student_progress(student_id, program_id, unit)
  WHERE student_id IS NOT NULL;

-- 2. enrollments: PortalEstudiante escribe completed_at cuando termina el programa
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 3. student_notes: DashboardAdmin inserta type='general' pero la columna no existe
ALTER TABLE public.student_notes
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'general';

-- 4. author_id faltaba en el insert de DashboardAdmin — agregar NOT NULL con default null
--    (ya existe la columna, solo verificar)
-- ALTER TABLE public.student_notes ALTER COLUMN author_id DROP NOT NULL; -- solo si da error
