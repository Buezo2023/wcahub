-- ══════════════════════════════════════════════════════════════════
-- Migración: program_id enum → text + columna published
-- VERSIÓN ROBUSTA: elimina constraints dinámicamente por tipo
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN

-- ── PASO 1: Agregar columnas nuevas a programs ───────────────────
ALTER TABLE programs ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description text;
UPDATE programs SET published = true WHERE published IS NULL;

-- ── PASO 2: Eliminar TODAS las FK que apuntan a programs(id) ─────
FOR r IN
  SELECT tc.constraint_name, tc.table_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'programs'
    AND ccu.column_name = 'id'
LOOP
  EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
    r.table_name, r.constraint_name);
  RAISE NOTICE 'Dropped FK: % on table %', r.constraint_name, r.table_name;
END LOOP;

-- ── PASO 3: Eliminar self-referencing FK en programs.requires ────
FOR r IN
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'programs' AND constraint_type = 'FOREIGN KEY'
LOOP
  EXECUTE format('ALTER TABLE programs DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
  RAISE NOTICE 'Dropped self-FK: %', r.constraint_name;
END LOOP;

-- ── PASO 4: Eliminar PK de programs ─────────────────────────────
FOR r IN
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'programs' AND constraint_type = 'PRIMARY KEY'
LOOP
  EXECUTE format('ALTER TABLE programs DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
  RAISE NOTICE 'Dropped PK: %', r.constraint_name;
END LOOP;

-- ── PASO 5: Convertir programs.id → text (PK primero) ───────────
ALTER TABLE programs ALTER COLUMN id       TYPE text USING id::text;
ALTER TABLE programs ALTER COLUMN requires TYPE text USING requires::text;
ALTER TABLE programs ADD PRIMARY KEY (id);

-- ── PASO 6: Convertir FK columns en otras tablas ─────────────────
ALTER TABLE groups      ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE enrollments ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE units       ALTER COLUMN program_id TYPE text USING program_id::text;

IF EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='lms_content' AND column_name='program_id') THEN
  ALTER TABLE lms_content ALTER COLUMN program_id TYPE text USING program_id::text;
END IF;

IF EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='leads' AND column_name='program_interest') THEN
  ALTER TABLE leads ALTER COLUMN program_interest TYPE text USING program_interest::text;
END IF;

-- ── PASO 7: Restaurar FK constraints ─────────────────────────────
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

-- ── PASO 8: Eliminar el tipo enum ───────────────────────────────
DROP TYPE IF EXISTS program_id CASCADE;

-- ── PASO 9: Índice ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_programs_active_published
  ON programs(active, published) WHERE active = true AND published = true;

RAISE NOTICE '✓ Migración completada. programs.id ahora es TEXT.';

END $$;

-- Verificar
SELECT id, name, active, published FROM programs ORDER BY id;
