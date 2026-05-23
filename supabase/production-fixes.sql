-- ══════════════════════════════════════════════════════
-- WCA HUB — Production fixes
-- ══════════════════════════════════════════════════════

-- 1. Columnas faltantes en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_done boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- 2. Índices de performance
CREATE INDEX IF NOT EXISTS idx_payments_enrollment  ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_progress_unit        ON student_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_groups_program       ON groups(program_id);
CREATE INDEX IF NOT EXISTS idx_teacher_groups_group ON teacher_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead       ON crm_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_attendance_group     ON attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_group    ON enrollments(group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email       ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_students_profile     ON students(profile_id);

-- 3. RLS en tablas expuestas
ALTER TABLE public.programs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_config   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks      ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS (DROP primero para evitar conflictos)
DROP POLICY IF EXISTS "programs_auth_read"    ON public.programs;
DROP POLICY IF EXISTS "groups_auth_read"      ON public.groups;
DROP POLICY IF EXISTS "units_auth_read"       ON public.units;
DROP POLICY IF EXISTS "holidays_auth_read"    ON public.holidays;
DROP POLICY IF EXISTS "cycle_auth_read"       ON public.cycle_config;
DROP POLICY IF EXISTS "teacher_groups_read"   ON public.teacher_groups;
DROP POLICY IF EXISTS "staff_internal_read"   ON public.staff;
DROP POLICY IF EXISTS "crm_tasks_sales"       ON public.crm_tasks;

CREATE POLICY "programs_auth_read"  ON public.programs       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "groups_auth_read"    ON public.groups         FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "units_auth_read"     ON public.units          FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "holidays_auth_read"  ON public.holidays       FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "cycle_auth_read"     ON public.cycle_config   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "teacher_groups_read" ON public.teacher_groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "staff_internal_read" ON public.staff          FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','super_admin','coordinadora','cobros','asesor_ventas','directivo'))
);
CREATE POLICY "crm_tasks_sales" ON public.crm_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','super_admin','asesor_ventas'))
);

-- 5. Recrear profiles policies sin recursión
DROP POLICY IF EXISTS "profiles_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_trigger_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_own"       ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_full"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_all"    ON public.profiles;

CREATE POLICY "profiles_read_own"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');
CREATE POLICY "profiles_service_all" ON public.profiles FOR ALL   USING (auth.role() = 'service_role');

-- 6. Nuevas tablas de negocio
CREATE TABLE IF NOT EXISTS public.documents (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id  uuid REFERENCES payments(id) ON DELETE CASCADE,
  student_id  uuid REFERENCES students(id),
  type        text NOT NULL,
  url         text NOT NULL,
  filename    text,
  size_bytes  int,
  uploaded_by uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_own" ON public.documents;
CREATE POLICY "documents_own" ON public.documents FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  OR auth.role() = 'service_role'
);

CREATE TABLE IF NOT EXISTS public.email_queue (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email     text NOT NULL,
  to_name      text,
  subject      text NOT NULL,
  html_body    text NOT NULL,
  status       text DEFAULT 'pending',
  attempts     int DEFAULT 0,
  last_error   text,
  scheduled_at timestamptz DEFAULT now(),
  sent_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "email_queue_service" ON public.email_queue;
CREATE POLICY "email_queue_service" ON public.email_queue FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status, scheduled_at);

CREATE TABLE IF NOT EXISTS public.certificates (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    uuid REFERENCES students(id),
  enrollment_id uuid REFERENCES enrollments(id),
  program_id    text REFERENCES programs(id),
  level         text,
  issued_at     timestamptz DEFAULT now(),
  cert_url      text,
  cert_code     text UNIQUE
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certificates_own" ON public.certificates;
CREATE POLICY "certificates_own" ON public.certificates FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  OR auth.role() = 'service_role'
);

CREATE TABLE IF NOT EXISTS public.b2b_companies (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name          text NOT NULL,
  contact_name  text,
  contact_email text,
  contact_phone text,
  country       text DEFAULT 'HN',
  seats_paid    int DEFAULT 0,
  discount_pct  numeric(5,2) DEFAULT 0,
  active        boolean DEFAULT true,
  notes         text,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.b2b_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "b2b_staff_only" ON public.b2b_companies;
CREATE POLICY "b2b_staff_only" ON public.b2b_companies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','super_admin','asesor_ventas','cobros'))
);

CREATE TABLE IF NOT EXISTS public.student_notes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES profiles(id),
  note       text NOT NULL,
  type       text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_notes_staff" ON public.student_notes;
CREATE POLICY "student_notes_staff" ON public.student_notes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
    AND role IN ('admin','super_admin','coordinadora','docente','cobros'))
);
CREATE INDEX IF NOT EXISTS idx_student_notes_student ON student_notes(student_id);

-- 7. Trigger robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, active, onboarding_done)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    'estudiante', true, false
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Permisos
GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;

-- ══ FIN ══
