-- ══════════════════════════════════════════════════════════════════
-- Migración: program_id enum → text + columna published
-- ORDEN CORRECTO: primero programs (PK), después FKs en otras tablas
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- PASO 1: Agregar columnas nuevas a programs (no afecta constraints)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description text;
UPDATE programs SET published = true WHERE published IS NULL;

-- PASO 2: Eliminar las FK constraints ANTES de cambiar los tipos
ALTER TABLE groups      DROP CONSTRAINT IF EXISTS groups_program_id_fkey;
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_program_id_fkey;
ALTER TABLE units       DROP CONSTRAINT IF EXISTS units_program_id_fkey;
ALTER TABLE lms_content DROP CONSTRAINT IF EXISTS lms_content_program_id_fkey;
ALTER TABLE programs    DROP CONSTRAINT IF EXISTS programs_requires_fkey;

-- También quitar el PK de programs para poder cambiar su tipo
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_pkey;

-- PASO 3: Convertir programs.id y programs.requires a text (el PK primero)
ALTER TABLE programs ALTER COLUMN id       TYPE text USING id::text;
ALTER TABLE programs ALTER COLUMN requires TYPE text USING requires::text;

-- PASO 4: Restaurar PK en programs
ALTER TABLE programs ADD PRIMARY KEY (id);

-- PASO 5: Convertir FK columns en otras tablas
ALTER TABLE groups      ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE enrollments ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE units       ALTER COLUMN program_id TYPE text USING program_id::text;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='lms_content' AND column_name='program_id') THEN
    ALTER TABLE lms_content ALTER COLUMN program_id TYPE text USING program_id::text;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='leads' AND column_name='program_interest') THEN
    ALTER TABLE leads ALTER COLUMN program_interest TYPE text USING program_interest::text;
  END IF;
END $$;

-- PASO 6: Restaurar FK constraints
ALTER TABLE groups
  ADD CONSTRAINT groups_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

ALTER TABLE enrollments
  ADD CONSTRAINT enrollments_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

ALTER TABLE units
  ADD CONSTRAINT units_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE programs
  ADD CONSTRAINT programs_requires_fkey
  FOREIGN KEY (requires) REFERENCES programs(id) ON DELETE SET NULL;

-- PASO 7: Eliminar el tipo enum (ya no se necesita)
DROP TYPE IF EXISTS program_id CASCADE;

-- PASO 8: Índice para published
CREATE INDEX IF NOT EXISTS idx_programs_active_published
  ON programs(active, published) WHERE active = true AND published = true;

-- Verificar resultado
SELECT id, name, active, published FROM programs ORDER BY id;
