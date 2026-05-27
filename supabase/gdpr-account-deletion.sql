-- ══════════════════════════════════════════════════════════════════
-- SEC-6 GDPR — Columna deleted_at en profiles
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index para encontrar cuentas eliminadas fácilmente
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at
  ON profiles(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Vista de cuentas eliminadas (para auditoría legal, 7 años)
CREATE OR REPLACE VIEW deleted_accounts AS
  SELECT id, email, deleted_at, created_at
  FROM profiles
  WHERE deleted_at IS NOT NULL;

COMMENT ON COLUMN profiles.deleted_at IS
  'Timestamp de eliminación de cuenta por solicitud del usuario (GDPR Art. 17)';
