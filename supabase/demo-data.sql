-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Demo data para Panel General
-- ─────────────────────────────────────────────────────────────────
-- NOTA: No se puede insertar en auth.users desde el SQL Editor.
-- Este script crea el student/enrollment/payment usando el profile
-- del super_admin (darwin.buezo2012@gmail.com) como estudiante demo.
-- Esto hace que el Panel General muestre KPIs reales sin necesitar
-- crear usuarios de auth adicionales.
--
-- Para ver datos en el panel hay DOS opciones:
-- OPCIÓN A (este script): usa tu propio perfil como demo.
-- OPCIÓN B: matriculá un estudiante real desde SuperAdmin → Academia
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_actor_id    uuid;
  v_student_id  uuid;
  v_enroll_id   uuid;
  v_group_id    uuid;
BEGIN

  -- Obtener el super_admin existente
  SELECT id INTO v_actor_id FROM auth.users
  WHERE email = 'darwin.buezo2012@gmail.com' LIMIT 1;

  IF v_actor_id IS NULL THEN
    RAISE NOTICE 'Super admin no encontrado — verificá el email en auth.users';
    RETURN;
  END IF;

  -- Crear student record para el super_admin si no existe
  INSERT INTO public.students (profile_id, level, scholarship)
  VALUES (v_actor_id, 'B1', false)
  ON CONFLICT (profile_id) DO NOTHING;

  SELECT id INTO v_student_id FROM public.students WHERE profile_id = v_actor_id;
  IF v_student_id IS NULL THEN
    RAISE NOTICE 'No se pudo crear el student record';
    RETURN;
  END IF;

  -- Obtener un grupo activo
  SELECT id INTO v_group_id FROM public.groups
  WHERE active = true LIMIT 1;

  -- Enrollment activo
  INSERT INTO public.enrollments
    (student_id, program_id, group_id, status, current_unit, price_locked,
     enrolled_at, next_payment_date)
  VALUES
    (v_student_id, 'en', v_group_id, 'active', 3, 95,
     NOW() - INTERVAL '45 days',
     (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::date)
  ON CONFLICT (student_id, program_id) DO UPDATE
    SET status = 'active',
        next_payment_date = (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::date;

  SELECT id INTO v_enroll_id FROM public.enrollments
  WHERE student_id = v_student_id AND program_id = 'en';

  -- Pago confirmado este mes
  INSERT INTO public.payments
    (student_id, enrollment_id, amount, currency, method, status,
     reference_code, confirmed_by, confirmed_at,
     period_start, created_at)
  SELECT
    v_student_id, v_enroll_id, 95.00, 'USD', 'transfer', 'confirmed',
    'WCA-DEMO-' || TO_CHAR(NOW(),'YYYYMM'),
    v_actor_id, NOW() - INTERVAL '5 days',
    DATE_TRUNC('month', NOW())::date,
    NOW() - INTERVAL '6 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = v_student_id
      AND period_start = DATE_TRUNC('month', NOW())::date
  );

  -- Pago confirmado mes anterior
  INSERT INTO public.payments
    (student_id, enrollment_id, amount, currency, method, status,
     reference_code, confirmed_by, confirmed_at,
     period_start, created_at)
  SELECT
    v_student_id, v_enroll_id, 95.00, 'USD', 'transfer', 'confirmed',
    'WCA-DEMO-' || TO_CHAR(NOW() - INTERVAL '1 month','YYYYMM'),
    v_actor_id, NOW() - INTERVAL '35 days',
    DATE_TRUNC('month', NOW() - INTERVAL '1 month')::date,
    NOW() - INTERVAL '36 days'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.payments
    WHERE student_id = v_student_id
      AND period_start = DATE_TRUNC('month', NOW() - INTERVAL '1 month')::date
  );

  RAISE NOTICE 'Demo data OK — student_id: %', v_student_id;
END $$;

-- Verificar
SELECT
  'students'    AS tabla, COUNT(*) AS total FROM public.students
UNION ALL SELECT 'enrollments (active)', COUNT(*) FROM public.enrollments WHERE status = 'active'
UNION ALL SELECT 'payments (confirmed)', COUNT(*) FROM public.payments WHERE status = 'confirmed'
UNION ALL SELECT 'leads',               COUNT(*) FROM public.leads;
