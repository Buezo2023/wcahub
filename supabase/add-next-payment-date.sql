-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Agregar next_payment_date a enrollments
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Agregar columna
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS next_payment_date date;

-- 2. Poblar enrollments activos existentes:
--    Mismo día del mes que enrolled_at, próxima ocurrencia
UPDATE public.enrollments
SET next_payment_date = (
  -- Primer día del mes actual + (día de matrícula - 1)
  (date_trunc('month', NOW()) + 
   (EXTRACT(day FROM enrolled_at)::int - 1) * INTERVAL '1 day')::date
)
WHERE next_payment_date IS NULL
  AND status IN ('active', 'suspended');

-- 3. Si esa fecha ya pasó este mes → moverla al mes siguiente
UPDATE public.enrollments
SET next_payment_date = next_payment_date + INTERVAL '1 month'
WHERE next_payment_date < CURRENT_DATE
  AND status = 'active';

-- 4. Verificar
SELECT 
  e.id,
  p.full_name,
  e.enrolled_at::date AS matriculado,
  e.next_payment_date  AS proximo_pago,
  e.status,
  CASE 
    WHEN e.next_payment_date < CURRENT_DATE THEN 'VENCIDO'
    WHEN e.next_payment_date = CURRENT_DATE THEN 'HOY'
    WHEN e.next_payment_date <= CURRENT_DATE + 7 THEN 'PRONTO'
    ELSE 'AL DIA'
  END AS estado_pago
FROM public.enrollments e
JOIN public.students s ON s.id = e.student_id
JOIN public.profiles p ON p.id = s.profile_id
WHERE e.status IN ('active','suspended')
ORDER BY e.next_payment_date;
