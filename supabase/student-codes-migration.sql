-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Códigos de estudiante
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- Seguro de ejecutar múltiples veces
-- ═══════════════════════════════════════════════════════════════════

-- 1. Secuencia atómica (reemplaza COUNT(*)+1)
CREATE SEQUENCE IF NOT EXISTS student_code_seq
  START 1 INCREMENT 1 MINVALUE 1 NO CYCLE;

-- 2. Función corregida — usa nextval(), no COUNT
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.student_code IS NULL THEN
    NEW.student_code := 'WCA-' || LPAD(nextval('student_code_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-crear trigger (garantiza que esté bien enlazado)
DROP TRIGGER IF EXISTS student_code_gen ON students;
CREATE TRIGGER student_code_gen
  BEFORE INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION generate_student_code();

-- 4. Ajustar secuencia al máximo existente (por si ya hay códigos)
SELECT setval(
  'student_code_seq',
  COALESCE(
    MAX(CAST(REPLACE(student_code, 'WCA-', '') AS integer)),
    0
  )
) FROM students WHERE student_code ~ '^WCA-\d+$';

-- 5. Poblar estudiantes existentes sin código, en orden cronológico
--    (los más antiguos obtienen los números más bajos)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM students
  WHERE student_code IS NULL
)
UPDATE students s
SET student_code = 'WCA-' || LPAD(
  (SELECT setval('student_code_seq', currval('student_code_seq') + 1)
   FROM (SELECT 1) x)::text, 6, '0')
FROM ordered o
WHERE s.id = o.id;

-- Forma más segura del backfill con DO block
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM students
    WHERE student_code IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE students
    SET student_code = 'WCA-' || LPAD(nextval('student_code_seq')::text, 6, '0')
    WHERE id = r.id AND student_code IS NULL;
  END LOOP;
END $$;

-- 6. Verificar resultado
SELECT
  COUNT(*) AS total_students,
  COUNT(student_code) AS with_code,
  COUNT(*) - COUNT(student_code) AS without_code,
  MIN(student_code) AS first_code,
  MAX(student_code) AS last_code
FROM students;
