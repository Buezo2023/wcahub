-- ══════════════════════════════════════════════════════════════
-- WCA Hub — Módulo de Soporte Estudiantil
-- File: supabase/support-tickets.sql
-- Ejecutar en Supabase SQL Editor (una sola vez, idempotente).
-- ══════════════════════════════════════════════════════════════

-- ── Tabla principal de tickets ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id          uuid REFERENCES students(id),
  profile_id          uuid REFERENCES profiles(id),
  created_by          uuid REFERENCES profiles(id),
  assigned_to         uuid REFERENCES profiles(id),
  category            text NOT NULL DEFAULT 'otro',
  priority            text NOT NULL DEFAULT 'media',
  status              text NOT NULL DEFAULT 'abierto',
  subject             text NOT NULL,
  description         text,
  source              text DEFAULT 'portal',
  related_payment_id  uuid REFERENCES payments(id),
  related_enrollment_id uuid REFERENCES enrollments(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  closed_at           timestamptz,

  CONSTRAINT support_tickets_category_check CHECK (
    category IN ('acceso','lms','pagos','clases','certificados','perfil','otro')
  ),
  CONSTRAINT support_tickets_priority_check CHECK (
    priority IN ('baja','media','alta','urgente')
  ),
  CONSTRAINT support_tickets_status_check CHECK (
    status IN ('abierto','en_revision','esperando_estudiante','resuelto','cerrado')
  )
);

-- ── Mensajes/respuestas por ticket ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id                uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id         uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_profile_id uuid REFERENCES profiles(id),
  message           text NOT NULL,
  internal          boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- ── Trigger: auto-update updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- ── Índices ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
  ON support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_student
  ON support_tickets(student_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_profile
  ON support_tickets(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned
  ON support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON support_ticket_messages(ticket_id, created_at);

-- ── RLS básico ─────────────────────────────────────────────────
-- Habilitar RLS en ambas tablas.
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Staff (admin, coordinadora, super_admin, cobros) ve todos los tickets.
-- Estudiante solo ve sus propios tickets y mensajes no internos.

-- Política de lectura para tickets
CREATE POLICY IF NOT EXISTS "staff_read_all_tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

CREATE POLICY IF NOT EXISTS "student_read_own_tickets"
  ON support_tickets FOR SELECT
  USING (profile_id = auth.uid());

-- Política de inserción: cualquier autenticado puede crear ticket
CREATE POLICY IF NOT EXISTS "auth_insert_ticket"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Staff puede actualizar tickets
CREATE POLICY IF NOT EXISTS "staff_update_tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- Política de lectura para mensajes (estudiante no ve internos)
CREATE POLICY IF NOT EXISTS "staff_read_all_messages"
  ON support_ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

CREATE POLICY IF NOT EXISTS "student_read_public_messages"
  ON support_ticket_messages FOR SELECT
  USING (
    internal = false
    AND EXISTS (
      SELECT 1 FROM support_tickets t
      WHERE t.id = ticket_id AND t.profile_id = auth.uid()
    )
  );

-- Cualquier autenticado puede insertar mensajes en sus propios tickets
CREATE POLICY IF NOT EXISTS "auth_insert_message"
  ON support_ticket_messages FOR INSERT
  WITH CHECK (sender_profile_id = auth.uid());

-- Grant para service_role (usado por API admin)
GRANT ALL ON support_tickets TO service_role;
GRANT ALL ON support_ticket_messages TO service_role;
