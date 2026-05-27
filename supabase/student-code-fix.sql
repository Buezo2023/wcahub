-- ══════════════════════════════════════════════════════════════════
-- WCA Hub — Fix race condition en student_code
-- Reemplaza COUNT(*) (inseguro bajo concurrencia) por SEQUENCE
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Crear secuencia persistente (atómica por definición en PostgreSQL)
CREATE SEQUENCE IF NOT EXISTS student_code_seq
  START WITH 1
  INCREMENT BY 1
  NO CYCLE;

-- 2. Inicializar la secuencia al valor actual de estudiantes existentes
--    (para no colisionar con códigos ya generados)
SELECT setval('student_code_seq', GREATEST((SELECT COUNT(*) FROM students), 1));

-- 3. Reemplazar la función con una que usa la secuencia
CREATE OR REPLACE FUNCTION generate_student_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code text;
BEGIN
  -- nextval() es atómico — garantiza unicidad bajo cualquier nivel de concurrencia
  new_code := 'WCA-' || to_char(now(), 'YY') || '-' || lpad(nextval('student_code_seq')::text, 4, '0');
  NEW.student_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger ya existe — no hay que recrearlo
-- Verificar: SELECT generate_student_code_test(); si querés probar
