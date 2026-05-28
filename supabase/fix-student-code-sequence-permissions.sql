-- ══════════════════════════════════════════════════════════════════
-- Fix: permission denied for sequence student_code_seq
-- Ejecutar en Supabase SQL Editor (una sola vez)
--
-- Problema: al convertir un usuario de docente a estudiante desde
-- api/auth (change-role), el INSERT en students dispara el trigger
-- generate_student_code(). Si la funcion no es SECURITY DEFINER,
-- el llamador necesita permisos sobre la secuencia y la tabla.
-- ══════════════════════════════════════════════════════════════════

-- PASO 1: Crear la secuencia si no existe
DO $$ BEGIN
  CREATE SEQUENCE IF NOT EXISTS public.student_code_seq
    START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PASO 2: Permisos sobre la secuencia
ALTER SEQUENCE public.student_code_seq OWNER TO postgres;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.student_code_seq TO authenticated;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.student_code_seq TO service_role;
GRANT USAGE, SELECT, UPDATE ON SEQUENCE public.student_code_seq TO anon;

-- PASO 3: Funcion con SECURITY DEFINER
-- Corre con privilegios del definer (postgres), no del llamador.
-- Conserva la logica WCA-YY-NNNN. Respeta student_code si ya viene definido.
-- Maneja colisiones incrementando seq hasta encontrar codigo libre.
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS trigger AS $$
DECLARE
  new_code text;
  seq      int;
BEGIN
  IF NEW.student_code IS NOT NULL AND NEW.student_code <> '' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) + 1 INTO seq FROM public.students;
  new_code := 'WCA-' || TO_CHAR(NOW(), 'YY') || '-' || LPAD(seq::text, 4, '0');

  WHILE EXISTS (SELECT 1 FROM public.students WHERE student_code = new_code) LOOP
    seq := seq + 1;
    new_code := 'WCA-' || TO_CHAR(NOW(), 'YY') || '-' || LPAD(seq::text, 4, '0');
  END LOOP;

  NEW.student_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- PASO 4: Recrear trigger
DROP TRIGGER IF EXISTS student_code_gen ON public.students;
CREATE TRIGGER student_code_gen
  BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE PROCEDURE public.generate_student_code();

-- PASO 5: Permisos tabla students
GRANT INSERT, SELECT, UPDATE ON public.students TO service_role;

-- Verificar
SELECT proname, prosecdef, proowner::regrole
FROM pg_proc
WHERE proname = 'generate_student_code';
