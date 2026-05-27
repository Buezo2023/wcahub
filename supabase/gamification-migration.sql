-- ══════════════════════════════════════════════════════════════════
-- WCA Hub — Gamificación: streaks, badges, referidos
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Streak fields en profiles ──────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak  int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date date;

-- ── 2. Badges catalog ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  icon       text NOT NULL,
  description text,
  xp_reward  int  DEFAULT 0,
  category   text DEFAULT 'general'
);

INSERT INTO badges (id, name, icon, description, xp_reward, category) VALUES
  ('streak_7',   'Racha 7 días',     '🔥',  '7 días consecutivos activo en la plataforma', 150, 'streak'),
  ('streak_30',  'Racha 30 días',    '🔥🔥', '30 días consecutivos — dedicación ejemplar',  400, 'streak'),
  ('first_exam', 'Primer examen',    '📝',  'Aprobaste tu primer examen',                   50, 'progress'),
  ('perfect',    'Perfección',       '🎯',  '100% en un examen',                           200, 'progress'),
  ('level_up',   'Escalador',        '⚡',  'Completaste tu primer nivel CEFR',             200, 'progress'),
  ('global',     '🌍 Global',        '🌍',  'Estudiás desde fuera de Honduras',             100, 'community'),
  ('champion',   'WCA Champion',     '🏆',  'Completaste A1 → C1 (Inglés completo)',       1000, 'mastery'),
  ('bilingual',  'Bilingüe WCA',     '🎓',  'Certificado Inglés + VA completados',          500, 'mastery')
ON CONFLICT (id) DO NOTHING;

-- ── 3. Student badges (many-to-many) ──────────────────────────────
CREATE TABLE IF NOT EXISTS student_badges (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  badge_id   text REFERENCES badges(id),
  earned_at  timestamptz DEFAULT now(),
  UNIQUE(student_id, badge_id)
);
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "badges_read_own" ON student_badges
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );
CREATE POLICY IF NOT EXISTS "badges_read_staff" ON student_badges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','coordinadora','docente'))
  );

-- ── 4. Referral code en profiles ──────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Generate for existing users
UPDATE profiles
SET referral_code = 'WCA' || upper(substring(replace(id::text, '-', '') from 1 for 6))
WHERE referral_code IS NULL;

-- Auto-generate on new user insert
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'WCA' || upper(substring(replace(NEW.id::text, '-', '') from 1 for 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referral_code ON profiles;
CREATE TRIGGER trg_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- ── 5. Referrals table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id    uuid REFERENCES profiles(id),
  referred_email text NOT NULL,
  referred_id    uuid REFERENCES profiles(id),
  status         text DEFAULT 'pending', -- pending | activated
  xp_rewarded    boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- ── 6. RPC: update streak ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_streak(p_profile_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  last_date  date;
  today      date := current_date;
  new_streak int;
  longest    int;
  xp_bonus   int := 0;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO last_date, new_streak, longest
  FROM profiles WHERE id = p_profile_id;

  IF last_date IS NULL OR last_date < today - 1 THEN
    -- Streak broken (or first activity)
    new_streak := 1;
  ELSIF last_date = today THEN
    -- Already active today — no change
    RETURN jsonb_build_object('streak', new_streak, 'xp_bonus', 0, 'changed', false);
  ELSE
    -- last_date = yesterday — increment
    new_streak := COALESCE(new_streak, 0) + 1;
  END IF;

  IF new_streak > COALESCE(longest, 0) THEN longest := new_streak; END IF;

  -- XP bonus for streak milestones
  IF new_streak = 7  THEN xp_bonus := 150; END IF;
  IF new_streak = 30 THEN xp_bonus := 400; END IF;

  UPDATE profiles
  SET current_streak     = new_streak,
      longest_streak     = longest,
      last_activity_date = today,
      total_xp           = COALESCE(total_xp, 0) + xp_bonus
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'streak', new_streak,
    'xp_bonus', xp_bonus,
    'milestone', CASE WHEN new_streak IN (7, 30) THEN new_streak ELSE 0 END,
    'changed', true
  );
END;
$$;

-- ── 7. RPC: award badge (idempotent) ─────────────────────────────
CREATE OR REPLACE FUNCTION award_badge(p_student_id uuid, p_badge_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  badge_xp int;
  profile_id uuid;
BEGIN
  -- Check if already earned
  IF EXISTS (SELECT 1 FROM student_badges WHERE student_id = p_student_id AND badge_id = p_badge_id) THEN
    RETURN false;
  END IF;

  SELECT xp_reward INTO badge_xp FROM badges WHERE id = p_badge_id;
  SELECT profile_id INTO profile_id FROM students WHERE id = p_student_id;

  INSERT INTO student_badges (student_id, badge_id) VALUES (p_student_id, p_badge_id);

  -- Award badge XP
  IF badge_xp > 0 AND profile_id IS NOT NULL THEN
    UPDATE profiles SET total_xp = COALESCE(total_xp, 0) + badge_xp WHERE id = profile_id;
    INSERT INTO xp_ledger (profile_id, source, source_id, amount, description)
    VALUES (profile_id, 'badge', p_student_id, badge_xp, 'Badge: ' || p_badge_id);
  END IF;

  RETURN true;
END;
$$;

-- ── 8. Leaderboard monthly XP view ───────────────────────────────
-- No necesita tabla — se calcula desde xp_ledger filtrando por mes
CREATE OR REPLACE VIEW monthly_leaderboard AS
SELECT
  p.id AS profile_id,
  p.full_name,
  p.avatar_url,
  p.xp_level,
  COALESCE(SUM(xl.amount), 0) AS monthly_xp,
  p.current_streak
FROM profiles p
LEFT JOIN xp_ledger xl ON xl.profile_id = p.id
  AND xl.created_at >= date_trunc('month', now())
WHERE p.role = 'estudiante' AND p.active = true
GROUP BY p.id, p.full_name, p.avatar_url, p.xp_level, p.current_streak
ORDER BY monthly_xp DESC;
