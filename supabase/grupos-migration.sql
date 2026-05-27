-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Migración: Grupos y Asistencia
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- Seguro de ejecutar múltiples veces (IF NOT EXISTS / IF EXISTS)
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- 1. ATTENDANCE — corrección de campos
-- ─────────────────────────────────────────────────────────────────

-- 1a. Agregar student_id (alternativa a enrollment_id para el upsert del docente)
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;

-- 1b. Agregar status text para guardar "present" | "absent" | "late"
ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'present'
    CHECK (status IN ('present','absent','late'));

-- 1c. Nuevo unique constraint para el onConflict que usa PortalDocente
--     El existente es (enrollment_id, class_date) — este complementa con student_id + class_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date
  ON public.attendance(student_id, class_date)
  WHERE student_id IS NOT NULL;

-- 1d. Poblar student_id en registros existentes (si hay datos viejos)
UPDATE public.attendance a
SET student_id = e.student_id
FROM public.enrollments e
WHERE a.enrollment_id = e.id
  AND a.student_id IS NULL;

-- 1e. RLS: docentes pueden insertar/actualizar asistencia de sus grupos
DROP POLICY IF EXISTS "attendance_docente_write" ON public.attendance;
CREATE POLICY "attendance_docente_write" ON public.attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_groups tg
      JOIN public.staff s ON s.id = tg.teacher_id
      WHERE s.profile_id = auth.uid()
        AND tg.group_id = attendance.group_id
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','super_admin','coordinadora')
    )
  );


-- ─────────────────────────────────────────────────────────────────
-- 2. GROUPS — días estructurados
-- ─────────────────────────────────────────────────────────────────

-- 2a. Agregar columna days_arr (array de códigos de día: mon, tue, wed, thu, fri, sat, sun)
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS days_arr text[] DEFAULT ARRAY[]::text[];

-- 2b. Migrar datos existentes de days (texto libre) → days_arr
--     Cubre los dos formatos usados: "Lun · Mié · Vie" y "L·M·V"
UPDATE public.groups SET days_arr = (
  SELECT array_agg(d) FROM (
    VALUES
      (CASE WHEN days ILIKE '%lun%' OR days LIKE '%L·%' OR days = 'L·M·V' THEN 'mon' END),
      (CASE WHEN days ILIKE '%mar%' THEN 'tue' END),
      (CASE WHEN days ILIKE '%mi%' OR days LIKE '%·M·%' OR days = 'L·M·V' THEN 'wed' END),
      (CASE WHEN days ILIKE '%jue%' THEN 'thu' END),
      (CASE WHEN days ILIKE '%vie%' OR days LIKE '%·V%' OR days = 'L·M·V' THEN 'fri' END),
      (CASE WHEN days ILIKE '%s%b%' THEN 'sat' END),
      (CASE WHEN days ILIKE '%dom%' THEN 'sun' END)
  ) AS t(d) WHERE d IS NOT NULL
)
WHERE days_arr = ARRAY[]::text[] OR days_arr IS NULL;

-- 2c. Índice para búsquedas por día (el && operator requiere GIN)
CREATE INDEX IF NOT EXISTS idx_groups_days_arr
  ON public.groups USING GIN(days_arr);


-- ─────────────────────────────────────────────────────────────────
-- 3. VERIFY
-- ─────────────────────────────────────────────────────────────────
SELECT
  'attendance columns' AS check,
  COUNT(*) AS count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'attendance'
  AND column_name IN ('student_id','status')
UNION ALL
SELECT
  'groups days_arr',
  COUNT(*)
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'groups'
  AND column_name = 'days_arr';
