-- ══════════════════════════════════════════════════════════════════
-- Migración: programs.id de enum → text + columna published
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- PASO 1: Agregar columna published a programs (borrador vs publicado)
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

-- Programas existentes están publicados por defecto
UPDATE programs SET published = true WHERE published IS NULL;

-- PASO 2: Agregar description si no existe
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS description text;

-- PASO 3: Convertir program_id de enum a text en todas las tablas
-- Postgres no permite ALTER COLUMN cuando hay FKs, así que lo hacemos
-- columna a columna usando un cast temporal.

-- 3a. groups
ALTER TABLE groups
  ALTER COLUMN program_id TYPE text USING program_id::text;

-- 3b. enrollments
ALTER TABLE enrollments
  ALTER COLUMN program_id TYPE text USING program_id::text;

-- 3c. lms_content
ALTER TABLE lms_content
  ALTER COLUMN program_id TYPE text USING program_id::text;

-- 3d. gamification_events (si existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='gamification_events' AND column_name='program_id') THEN
    ALTER TABLE gamification_events
      ALTER COLUMN program_id TYPE text USING program_id::text;
  END IF;
END $$;

-- 3e. leads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='program_interest') THEN
    ALTER TABLE leads
      ALTER COLUMN program_interest TYPE text USING program_interest::text;
  END IF;
END $$;

-- 3f. programs table itself (PK last)
ALTER TABLE programs
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE programs
  ALTER COLUMN requires TYPE text USING requires::text;

-- PASO 4: Eliminar el tipo enum (ya no se necesita)
DROP TYPE IF EXISTS program_id CASCADE;

-- PASO 5: Re-agregar FK de programs.requires → programs.id
ALTER TABLE programs
  ADD CONSTRAINT programs_requires_fkey
  FOREIGN KEY (requires) REFERENCES programs(id) ON DELETE SET NULL;

-- PASO 6: Índices
CREATE INDEX IF NOT EXISTS idx_programs_active_published
  ON programs(active, published)
  WHERE active = true AND published = true;

-- Verificar
SELECT id, name, active, published FROM programs ORDER BY id;
