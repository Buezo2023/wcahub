-- ══════════════════════════════════════════════════════════════════
-- Migración: Nivel PH (Phonics) — pre-A1 para programa Inglés
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- PASO 1: Convertir cefr_level de enum → text en todas las tablas
-- Esto permite agregar PH y cualquier nivel futuro sin migración

-- 1a. students.level
ALTER TABLE students
  ALTER COLUMN level TYPE text USING level::text;

-- 1b. groups.level
ALTER TABLE groups
  ALTER COLUMN level TYPE text USING level::text;

-- 1c. units.level
ALTER TABLE units
  ALTER COLUMN level TYPE text USING level::text;

-- 1d. lms_content.level (si existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='lms_content' AND column_name='level') THEN
    ALTER TABLE lms_content ALTER COLUMN level TYPE text USING level::text;
  END IF;
END $$;

-- 1e. leads.level_interest
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='level_interest') THEN
    ALTER TABLE leads ALTER COLUMN level_interest TYPE text USING level_interest::text;
  END IF;
END $$;

-- PASO 2: Eliminar el tipo enum
DROP TYPE IF EXISTS cefr_level CASCADE;

-- PASO 3: Agregar constraint CHECK para validar los valores permitidos
ALTER TABLE students
  ADD CONSTRAINT students_level_check
  CHECK (level IS NULL OR level IN ('PH','A1','A2','B1','B2','C1'));

ALTER TABLE groups
  ADD CONSTRAINT groups_level_check
  CHECK (level IS NULL OR level IN ('PH','A1','A2','B1','B2','C1'));

ALTER TABLE units
  ADD CONSTRAINT units_level_check
  CHECK (level IS NULL OR level IN ('PH','A1','A2','B1','B2','C1'));

-- PASO 4: Insertar el nivel PH como programa de inglés en programs (si corresponde)
-- PH es un nivel, no un programa separado — ya usa program_id='en'
-- Solo necesitamos poder crear unidades con level='PH'

-- PASO 5: Índices útiles
CREATE INDEX IF NOT EXISTS idx_units_program_level ON units(program_id, level);
CREATE INDEX IF NOT EXISTS idx_groups_level ON groups(level);

-- Verificar
SELECT level, COUNT(*) FROM students GROUP BY level ORDER BY level;
SELECT level, COUNT(*) FROM groups GROUP BY level ORDER BY level;
