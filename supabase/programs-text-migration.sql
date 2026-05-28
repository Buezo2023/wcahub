-- ══════════════════════════════════════════════════════════════════
-- Migración: program_id enum → text + columna published
-- VERSIÓN FINAL: maneja políticas RLS que dependen de program_id
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN

-- ── PASO 1: Columnas nuevas ──────────────────────────────────────
ALTER TABLE programs ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description text;
UPDATE programs SET published = true WHERE published IS NULL;

-- ── PASO 2: Eliminar políticas RLS que dependen de program_id ───
-- (se recrean al final con el mismo contenido)
DROP POLICY IF EXISTS "activities_read_enrolled" ON public.unit_activities;

-- ── PASO 3: Eliminar TODAS las FK que apuntan a programs(id) ────
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
  RAISE NOTICE 'Dropped FK: % on %', r.constraint_name, r.table_name;
END LOOP;

-- ── PASO 4: Eliminar self-FK y PK de programs ───────────────────
FOR r IN
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'programs' AND constraint_type IN ('FOREIGN KEY','PRIMARY KEY')
LOOP
  EXECUTE format('ALTER TABLE programs DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
  RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
END LOOP;

-- ── PASO 5: Convertir programs (PK primero) ──────────────────────
ALTER TABLE programs ALTER COLUMN id       TYPE text USING id::text;
ALTER TABLE programs ALTER COLUMN requires TYPE text USING requires::text;
ALTER TABLE programs ADD PRIMARY KEY (id);

-- ── PASO 6: Convertir FK columns en otras tablas ─────────────────
ALTER TABLE groups      ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE units       ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE enrollments ALTER COLUMN program_id TYPE text USING program_id::text;

IF EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='lms_content' AND column_name='program_id') THEN
  ALTER TABLE lms_content ALTER COLUMN program_id TYPE text USING program_id::text;
END IF;

IF EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_name='leads' AND column_name='program_interest') THEN
  ALTER TABLE leads ALTER COLUMN program_interest TYPE text USING program_interest::text;
END IF;

-- ── PASO 7: Restaurar FK constraints ─────────────────────────────
ALTER TABLE groups ADD CONSTRAINT groups_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

ALTER TABLE enrollments ADD CONSTRAINT enrollments_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;

ALTER TABLE units ADD CONSTRAINT units_program_id_fkey
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;

ALTER TABLE programs ADD CONSTRAINT programs_requires_fkey
  FOREIGN KEY (requires) REFERENCES programs(id) ON DELETE SET NULL;

-- ── PASO 8: Recrear política RLS con los mismos criterios ────────
CREATE POLICY "activities_read_enrolled" ON public.unit_activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.units u ON u.id = unit_id
    JOIN public.students s ON s.id = e.student_id
    WHERE u.program_id = e.program_id
      AND e.status = 'active'
      AND s.profile_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente')
  )
);

-- ── PASO 9: Eliminar tipo enum y agregar índice ──────────────────
DROP TYPE IF EXISTS program_id CASCADE;

CREATE INDEX IF NOT EXISTS idx_programs_active_published
  ON programs(active, published) WHERE active = true AND published = true;

RAISE NOTICE '✓ Migración completada. programs.id = TEXT, published column added.';

END $$;

-- Verificar
SELECT id, name, active, published FROM programs ORDER BY id;
