-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub — Datos de ejemplo para producción
-- Ejecutar en Supabase → SQL Editor → New Query → Run
-- Seguro para ejecutar múltiples veces (ON CONFLICT DO NOTHING/UPDATE)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. PROGRAMAS ────────────────────────────────────────────────────
INSERT INTO public.programs (id, name, short_name, price_monthly, price_quarterly)
VALUES
  ('en',      'Inglés Completo',        'Inglés',    95.00,  null),
  ('va',      'Asistente Virtual',      'VA General',95.00,  null),
  ('va_mkt',  'VA · Marketing Digital', 'VA Mkt',    null,   265.00),
  ('va_legal','VA · Legal Assistant',   'VA Legal',  null,   265.00),
  ('va_care', 'VA · Cuidador Remoto',   'VA Care',   null,   265.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_quarterly = EXCLUDED.price_quarterly;

UPDATE public.programs SET requires = 'va' WHERE id IN ('va_mkt','va_legal','va_care');

-- ── 2. GRUPOS ───────────────────────────────────────────────────────
-- Nota: IDs generados automáticamente (UUID). Grupos de ejemplo.
INSERT INTO public.groups (program_id, level, schedule, days, capacity, active_unit, active)
VALUES
  ('en', 'A1', '6:00 PM – 7:30 PM',  'Lun · Mié · Vie', 20, 3, true),
  ('en', 'A1', '8:00 PM – 9:30 PM',  'Mar · Jue',        18, 3, true),
  ('en', 'A2', '6:00 PM – 7:30 PM',  'Lun · Mié · Vie', 20, 5, true),
  ('en', 'B1', '6:00 PM – 7:30 PM',  'Lun · Mié',        16, 7, true),
  ('en', 'B1', '8:00 PM – 9:30 PM',  'Mar · Jue · Sáb',  18, 7, true),
  ('en', 'B2', '7:00 PM – 8:30 PM',  'Lun · Mié · Vie', 15, 9, true),
  ('va', 'A1', '6:00 PM – 8:00 PM',  'Mar · Jue',        20, 4, true),
  ('va', 'A2', '8:00 PM – 10:00 PM', 'Lun · Mié',        18, 4, true)
ON CONFLICT DO NOTHING;

-- ── 3. CICLO ACADÉMICO ──────────────────────────────────────────────
INSERT INTO public.cycle_config (program_id, level, current_unit)
VALUES
  ('en','A1',3), ('en','A2',5),
  ('en','B1',7), ('en','B2',9), ('en','C1',11)
ON CONFLICT (program_id, level) DO UPDATE SET current_unit = EXCLUDED.current_unit;

-- ── 4. FESTIVOS ─────────────────────────────────────────────────────
INSERT INTO public.holidays (date, name, country)
VALUES
  ('2026-01-01', 'Año Nuevo',              'HN'),
  ('2026-04-02', 'Jueves Santo',           'HN'),
  ('2026-04-03', 'Viernes Santo',          'HN'),
  ('2026-05-01', 'Día del Trabajo',        'HN'),
  ('2026-09-15', 'Día de la Independencia','HN'),
  ('2026-09-17', 'Día del Maestro',        'HN'),
  ('2026-12-25', 'Navidad',               'HN')
ON CONFLICT (date) DO NOTHING;

-- ── 5. LEADS CRM ────────────────────────────────────────────────────
INSERT INTO public.leads (full_name, email, phone, source, stage, test_score, level_interest, notes)
VALUES
  ('Gabriela Soto',   'gabriela.soto@gmail.com', '+504 9811-2233', 'Placement Test', 'nuevo',      72, 'A2', 'Nivel detectado A2. Interesada en inglés para trabajo remoto.'),
  ('Rodrigo Méndez',  'rodrigo.m@hotmail.com',   '+504 9922-4455', 'Instagram',      'contactado', 45, 'A1', 'Vio anuncio en Instagram. Quiere empezar desde cero.'),
  ('Valeria Castro',  'vcastro@empresa.com',      '+504 9733-6677', 'Referido',       'propuesta',  88, 'B1', 'Referida por estudiante activa. Lista para matricularse.'),
  ('Diego Fuentes',   'dfuentes23@gmail.com',     '+504 9644-8899', 'Placement Test', 'nuevo',      60, 'A1', 'Completó el test pero no ha respondido mensajes.'),
  ('Sebastián Reyes', 'sreyes.va@gmail.com',       '+504 9466-3344', 'WhatsApp',      'propuesta',  NULL, NULL, 'Interesado en programa VA. Se envió propuesta de precio.'),
  ('Camila Ramos',    'c.ramos.hn@gmail.com',     '+504 9377-5566', 'Placement Test', 'perdido',    38,  'A1', 'No contestó después de 3 intentos de contacto.')
ON CONFLICT DO NOTHING;

-- ── 6. TABLA BANK ACCOUNTS (si no existe) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre    text NOT NULL,
  banco     text,
  cuenta    text,
  titular   text,
  tipo      text DEFAULT 'ahorro',
  active    boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "banks_read" ON public.bank_accounts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "banks_write" ON public.bank_accounts FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin','super_admin'))
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.bank_accounts (nombre, banco, cuenta, titular, tipo, active)
VALUES
  ('Cuenta Principal WCA', 'Banco Atlántida', '1234-5678-9012', 'World Connect Academy', 'ahorro',   true),
  ('Cuenta Operativa',     'BAC Honduras',    '9876-5432-1098', 'World Connect Academy', 'corriente',true)
ON CONFLICT DO NOTHING;

-- ── 7. APP CONFIG (gamificación) ────────────────────────────────────
INSERT INTO public.app_config (key, value)
VALUES ('xp_config', '{"exam_pass":100,"perfect_score":150,"attendance":20,"unit_complete":80,"login_streak":10}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ── RESUMEN ─────────────────────────────────────────────────────────
SELECT 'Programas' as tabla, COUNT(*) as registros FROM public.programs
UNION ALL SELECT 'Grupos',   COUNT(*) FROM public.groups
UNION ALL SELECT 'Leads',    COUNT(*) FROM public.leads
UNION ALL SELECT 'Festivos', COUNT(*) FROM public.holidays
UNION ALL SELECT 'Bancos',   COUNT(*) FROM public.bank_accounts;
