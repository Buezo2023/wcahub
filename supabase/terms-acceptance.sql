-- ══════════════════════════════════════════════════════════════════
-- SEC-5 — Aceptación de términos legales
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

-- Agregar columna terms_accepted_at a profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Para usuarios existentes, marcar como aceptado en una fecha pasada
-- (asumiendo que aceptaron al momento de su creación si no lo tienen)
UPDATE profiles
SET terms_accepted_at = created_at
WHERE terms_accepted_at IS NULL
  AND role = 'estudiante';

-- Index para auditoría legal rápida
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at
  ON profiles(terms_accepted_at)
  WHERE terms_accepted_at IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN profiles.terms_accepted_at IS
  'Timestamp ISO de aceptación de Términos de Servicio y Política de Privacidad';
