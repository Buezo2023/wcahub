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

-- ── 10. Verify: show table status ────────────────────────────────
SELECT table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS col_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
