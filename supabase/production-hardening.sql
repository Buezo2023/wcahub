-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Production Hardening SQL
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. INDEXES — acelera queries en tablas que crecen
CREATE INDEX IF NOT EXISTS idx_students_profile ON students(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program ON enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_staff_profile ON staff(profile_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(active);

-- 2. UNIQUE CONSTRAINTS — previene duplicados
ALTER TABLE public.staff ADD CONSTRAINT IF NOT EXISTS staff_profile_id_unique UNIQUE (profile_id);
ALTER TABLE public.students ADD CONSTRAINT IF NOT EXISTS students_profile_id_unique UNIQUE (profile_id);

-- 3. NO-DELETE POLICIES — solo soft delete via active:false
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'no_delete_profiles') THEN
    CREATE POLICY "no_delete_profiles" ON public.profiles FOR DELETE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'no_delete_staff') THEN
    CREATE POLICY "no_delete_staff" ON public.staff FOR DELETE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'no_delete_students') THEN
    CREATE POLICY "no_delete_students" ON public.students FOR DELETE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'no_delete_enrollments') THEN
    CREATE POLICY "no_delete_enrollments" ON public.enrollments FOR DELETE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'no_delete_payments') THEN
    CREATE POLICY "no_delete_payments" ON public.payments FOR DELETE USING (false);
  END IF;
END $$;
