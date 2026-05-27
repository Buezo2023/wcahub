-- ══════════════════════════════════════════════════════════════════
-- WCA Hub — Migración de timezone
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Agregar timezone a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Tegucigalpa',
  ADD COLUMN IF NOT EXISTS language_ui text NOT NULL DEFAULT 'es';

-- 2. Agregar schedule_utc a groups para almacenar hora real
--    Mantenemos el campo "schedule" (texto) por compatibilidad con el admin.
--    schedule_utc es el nuevo campo canonico para mostrar a estudiantes internacionales.
ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS schedule_utc time,           -- hora de inicio en UTC
  ADD COLUMN IF NOT EXISTS schedule_end_utc time,       -- hora de fin en UTC
  ADD COLUMN IF NOT EXISTS schedule_timezone text NOT NULL DEFAULT 'America/Tegucigalpa';

-- 3. Para grupos existentes: parsear el texto "6:00–7:00 PM" a UTC
--    Honduras = UTC-6. "6:00 PM HN" = "00:00 UTC (next day)" → simplificamos a time
--    Por ahora dejamos NULL — el admin los actualiza desde la UI mejorada.
--    Ejemplo de update manual: UPDATE groups SET schedule_utc = '00:00:00', schedule_end_utc = '01:00:00' WHERE schedule = '6:00–7:00 PM';

COMMENT ON COLUMN groups.schedule IS 'Texto legible para admin (ej: "6:00–7:00 PM"). Solo para UI interna.';
COMMENT ON COLUMN groups.schedule_utc IS 'Hora de inicio en UTC. Usada para mostrar hora local al estudiante.';
COMMENT ON COLUMN groups.schedule_timezone IS 'Timezone base del grupo (por defecto Honduras).';
COMMENT ON COLUMN profiles.timezone IS 'Timezone IANA del estudiante. Ej: America/Bogota, Europe/Madrid.';
