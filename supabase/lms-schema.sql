-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub LMS — Schema
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. unit_activities ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.unit_activities (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id     uuid REFERENCES public.units(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('video','lesson','quiz','fill_blank','matching','roleplay','typing')),
  order_num   int NOT NULL,
  title       text NOT NULL,
  content     jsonb NOT NULL DEFAULT '{}',
  xp_reward   int DEFAULT 20,
  published   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(unit_id, order_num)
);
ALTER TABLE public.unit_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "activities_read_enrolled" ON public.unit_activities FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.units u ON u.id = unit_id
      JOIN public.students s ON s.id = e.student_id
      WHERE u.program_id = e.program_id
        AND e.status = 'active'
        AND s.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
        AND p.role IN ('admin','super_admin','coordinadora','docente')
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "activities_write_admin" ON public.unit_activities FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. user_activity_progress ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_activity_progress (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id   uuid REFERENCES public.unit_activities(id) ON DELETE CASCADE,
  completed     boolean DEFAULT false,
  score         numeric(5,2) DEFAULT 0,
  xp_earned     int DEFAULT 0,
  attempts      int DEFAULT 0,
  answers       jsonb,                        -- student's last answers
  completed_at  timestamptz,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(profile_id, activity_id)
);
CREATE INDEX IF NOT EXISTS idx_uap_profile ON public.user_activity_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_uap_activity ON public.user_activity_progress(activity_id);
ALTER TABLE public.user_activity_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "uap_own" ON public.user_activity_progress FOR ALL USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "uap_staff" ON public.user_activity_progress FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 3. xp_ledger ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  source      text NOT NULL,                 -- activity | exam | login | streak | unit_complete
  source_id   uuid,
  amount      int NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_profile ON public.xp_ledger(profile_id);
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "xp_own_read" ON public.xp_ledger FOR SELECT USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "xp_insert" ON public.xp_ledger FOR INSERT WITH CHECK (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "xp_staff_read" ON public.xp_ledger FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente'))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. Add total_xp to profiles ──────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp_level int DEFAULT 1;

-- ── Verify ───────────────────────────────────────────────────────
SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_name = t.table_name AND table_schema = 'public') AS cols
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_name IN ('unit_activities','user_activity_progress','xp_ledger')
ORDER BY table_name;

-- ── Función RPC: increment XP en profiles ────────────────────────
CREATE OR REPLACE FUNCTION public.increment_xp(p_profile_id uuid, p_amount int)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.profiles
  SET total_xp = COALESCE(total_xp, 0) + p_amount,
      xp_level = CASE
        WHEN COALESCE(total_xp, 0) + p_amount >= 2000 THEN 5
        WHEN COALESCE(total_xp, 0) + p_amount >= 1000 THEN 4
        WHEN COALESCE(total_xp, 0) + p_amount >= 500  THEN 3
        WHEN COALESCE(total_xp, 0) + p_amount >= 200  THEN 2
        ELSE 1
      END
  WHERE id = p_profile_id;
$$;
