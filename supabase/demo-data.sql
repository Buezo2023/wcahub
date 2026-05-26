-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Demo data: 1 estudiante completo para ver el Panel General
-- ─────────────────────────────────────────────────────────────────
-- IMPORTANTE: Necesita que darwin.buezo2012@gmail.com ya exista en
-- auth.users (el super_admin). Este script usa su user_id como actor.
-- ─────────────────────────────────────────────────────────────────
-- Ejecutar DESPUÉS de migrations.sql
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_actor_id    uuid;
  v_student_uid uuid;
  v_student_id  uuid;
  v_enroll_id   uuid;
  v_group_id    uuid;
BEGIN

  -- Obtener el super_admin como actor
  SELECT id INTO v_actor_id FROM auth.users WHERE email = 'darwin.buezo2012@gmail.com' LIMIT 1;
  IF v_actor_id IS NULL THEN
    RAISE NOTICE 'Super admin not found — skipping demo data';
    RETURN;
  END IF;

  -- ── 1. Crear auth user para el estudiante demo ──────────────────
  INSERT INTO auth.users (
    id, email, email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, role, aud
  )
  VALUES (
    gen_random_uuid(), 'maria.garcia.demo@wcahub.dev',
    now(), now(), now(),
    '{"full_name":"María García Demo"}'::jsonb,
    'authenticated', 'authenticated'
  )
  ON CONFLICT (email) DO NOTHING;

  SELECT id INTO v_student_uid FROM auth.users WHERE email = 'maria.garcia.demo@wcahub.dev';
  IF v_student_uid IS NULL THEN
    RAISE NOTICE 'Demo user already exists — continuing';
    SELECT id INTO v_student_uid FROM auth.users WHERE email = 'maria.garcia.demo@wcahub.dev';
  END IF;

  -- ── 2. Perfil ───────────────────────────────────────────────────
  INSERT INTO public.profiles (id, email, full_name, phone, role, active)
  VALUES (v_student_uid, 'maria.garcia.demo@wcahub.dev', 'María García Demo', '+504 9800-1234', 'estudiante', true)
  ON CONFLICT (id) DO UPDATE SET full_name = 'María García Demo', active = true;

  -- ── 3. Student record ───────────────────────────────────────────
  INSERT INTO public.students (profile_id, level, scholarship)
  VALUES (v_student_uid, 'A1', false)
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT id INTO v_student_id FROM public.students WHERE profile_id = v_student_uid;

  -- ── 4. Obtener un grupo activo ──────────────────────────────────
  SELECT id INTO v_group_id FROM public.groups
  WHERE program_id = 'en' AND level = 'A1' AND active = true LIMIT 1;

  -- ── 5. Enrollment ───────────────────────────────────────────────
  INSERT INTO public.enrollments
    (student_id, program_id, group_id, status, current_unit, price_locked,
     enrolled_at, next_payment_date)
  VALUES
    (v_student_id, 'en', v_group_id, 'active', 3, 95,
     now() - INTERVAL '45 days',
     (date_trunc('month', now()) + INTERVAL '1 month')::date)
  ON CONFLICT (student_id, program_id) DO UPDATE
    SET status = 'active', next_payment_date =
      (date_trunc('month', now()) + INTERVAL '1 month')::date;

  SELECT id INTO v_enroll_id FROM public.enrollments
  WHERE student_id = v_student_id AND program_id = 'en';

  -- ── 6. Pago confirmado este mes ─────────────────────────────────
  INSERT INTO public.payments
    (student_id, enrollment_id, amount, currency, method, status,
     reference_code, confirmed_by, confirmed_at, period_start,
     created_at)
  VALUES
    (v_student_id, v_enroll_id, 95.00, 'USD', 'transfer', 'confirmed',
     'WCA-DEMO-2026', v_actor_id, now() - INTERVAL '5 days',
     date_trunc('month', now())::date,
     now() - INTERVAL '6 days')
  ON CONFLICT DO NOTHING;

  -- ── 7. Pago del mes anterior ────────────────────────────────────
  INSERT INTO public.payments
    (student_id, enrollment_id, amount, currency, method, status,
     reference_code, confirmed_by, confirmed_at, period_start,
     created_at)
  VALUES
    (v_student_id, v_enroll_id, 95.00, 'USD', 'transfer', 'confirmed',
     'WCA-DEMO-2026-M1', v_actor_id, now() - INTERVAL '35 days',
     (date_trunc('month', now()) - INTERVAL '1 month')::date,
     now() - INTERVAL '36 days')
  ON CONFLICT DO NOTHING;

  -- ── 8. Audit log ────────────────────────────────────────────────
  INSERT INTO public.audit_log (actor_id, action, entity, metadata)
  VALUES (v_actor_id, 'demo_data_created', 'system',
    '{"message":"Demo student created for Panel General testing"}'::jsonb);

  RAISE NOTICE 'Demo data created successfully for student: %', v_student_uid;
END $$;

-- Verificar resultados
SELECT
  'students'    AS tabla, COUNT(*) AS total FROM public.students
UNION ALL SELECT 'enrollments', COUNT(*) FROM public.enrollments
UNION ALL SELECT 'payments',    COUNT(*) FROM public.payments
UNION ALL SELECT 'leads',       COUNT(*) FROM public.leads;
