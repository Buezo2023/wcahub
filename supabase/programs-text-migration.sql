-- ══════════════════════════════════════════════════════════════════
-- IMPORTANTE: Ejecutar en DOS pasos separados en Supabase SQL Editor
-- Copiar y pegar PASO 1, ejecutar, luego PASO 2, ejecutar.
-- ══════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════
-- PASO 1: Eliminar políticas RLS bloqueantes
-- Copiar solo hasta aquí, ejecutar, luego continuar con PASO 2
-- ════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "activities_read_enrolled" ON public.unit_activities;

-- Verificar que no queden más políticas que dependan de enrollments.program_id
-- Si el PASO 2 falla con otro nombre de política, agregarlo aquí y re-ejecutar PASO 1.


-- ════════════════════════════════════════════════════════
-- PASO 2: Migración principal (ejecutar DESPUÉS del PASO 1)
-- ════════════════════════════════════════════════════════

DO $$
DECLARE
  r RECORD;
BEGIN

ALTER TABLE programs ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description text;
UPDATE programs SET published = true WHERE published IS NULL;

FOR r IN
  SELECT tc.constraint_name, tc.table_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'programs' AND ccu.column_name = 'id'
LOOP
  EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
END LOOP;

FOR r IN
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'programs' AND constraint_type IN ('FOREIGN KEY','PRIMARY KEY')
LOOP
  EXECUTE format('ALTER TABLE programs DROP CONSTRAINT IF EXISTS %I', r.constraint_name);
END LOOP;

ALTER TABLE programs ALTER COLUMN id       TYPE text USING id::text;
ALTER TABLE programs ALTER COLUMN requires TYPE text USING requires::text;
ALTER TABLE programs ADD PRIMARY KEY (id);

ALTER TABLE groups      ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE units       ALTER COLUMN program_id TYPE text USING program_id::text;
ALTER TABLE enrollments ALTER COLUMN program_id TYPE text USING program_id::text;

IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lms_content' AND column_name='program_id') THEN
  ALTER TABLE lms_content ALTER COLUMN program_id TYPE text USING program_id::text;
END IF;

IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='leads' AND column_name='program_interest') THEN
  ALTER TABLE leads ALTER COLUMN program_interest TYPE text USING program_interest::text;
END IF;

ALTER TABLE groups      ADD CONSTRAINT groups_program_id_fkey      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD CONSTRAINT enrollments_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE units       ADD CONSTRAINT units_program_id_fkey       FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;
ALTER TABLE programs    ADD CONSTRAINT programs_requires_fkey      FOREIGN KEY (requires)   REFERENCES programs(id) ON DELETE SET NULL;

CREATE POLICY "activities_read_enrolled" ON public.unit_activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.units u ON u.id = unit_id
    JOIN public.students s ON s.id = e.student_id
    WHERE u.program_id = e.program_id AND e.status = 'active' AND s.profile_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','docente')
  )
);

DROP TYPE IF EXISTS program_id CASCADE;

CREATE INDEX IF NOT EXISTS idx_programs_active_published
  ON programs(active, published) WHERE active = true AND published = true;

RAISE NOTICE '✓ Migración completada';
END $$;

SELECT id, name, active, published FROM programs ORDER BY id;
