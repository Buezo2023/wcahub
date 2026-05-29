-- ══════════════════════════════════════════════════════════════
-- WCA Hub — Módulo de Soporte Estudiantil
-- File: supabase/support-tickets.sql
-- Ejecutar en Supabase SQL Editor. Idempotente (puede ejecutarse N veces).
-- ══════════════════════════════════════════════════════════════

-- ── Tablas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                    uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id            uuid REFERENCES students(id),
  profile_id            uuid REFERENCES profiles(id),
  created_by            uuid REFERENCES profiles(id),
  assigned_to           uuid REFERENCES profiles(id),
  category              text NOT NULL DEFAULT 'otro',
  priority              text NOT NULL DEFAULT 'media',
  status                text NOT NULL DEFAULT 'abierto',
  subject               text NOT NULL,
  description           text,
  source                text DEFAULT 'portal',
  related_payment_id    uuid REFERENCES payments(id),
  related_enrollment_id uuid REFERENCES enrollments(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  closed_at             timestamptz,
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

CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id                uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_id         uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_profile_id uuid REFERENCES profiles(id),
  message           text NOT NULL,
  internal          boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

-- ── Trigger: auto-update updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── Índices ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created
  ON public.support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_student
  ON public.support_tickets(student_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_profile
  ON public.support_tickets(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned
  ON public.support_tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket
  ON public.support_ticket_messages(ticket_id, created_at);

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.support_tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- SUPPORT_TICKETS policies
-- ─────────────────────────────────────────────────────────────

-- B1: Staff lee todos los tickets
DROP POLICY IF EXISTS "staff_read_all_tickets" ON public.support_tickets;
CREATE POLICY "staff_read_all_tickets"
  ON public.support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- B2: Estudiante lee solo sus propios tickets
DROP POLICY IF EXISTS "student_read_own_tickets" ON public.support_tickets;
CREATE POLICY "student_read_own_tickets"
  ON public.support_tickets FOR SELECT
  USING (profile_id = auth.uid());

-- B3: Staff crea tickets para cualquier estudiante (profile_id libre)
DROP POLICY IF EXISTS "staff_insert_ticket" ON public.support_tickets;
CREATE POLICY "staff_insert_ticket"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- B4: Estudiante crea ticket solo con su propio profile_id
DROP POLICY IF EXISTS "student_insert_own_ticket" ON public.support_tickets;
CREATE POLICY "student_insert_own_ticket"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- B5: Solo staff actualiza tickets (estado, prioridad, asignación)
DROP POLICY IF EXISTS "staff_update_tickets" ON public.support_tickets;
CREATE POLICY "staff_update_tickets"
  ON public.support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- (Blocker 2: eliminado auth_insert_ticket permisivo — reemplazado por B3 + B4)
DROP POLICY IF EXISTS "auth_insert_ticket" ON public.support_tickets;

-- ─────────────────────────────────────────────────────────────
-- SUPPORT_TICKET_MESSAGES policies
-- ─────────────────────────────────────────────────────────────

-- C1: Staff lee todos los mensajes (incluye internos)
DROP POLICY IF EXISTS "staff_read_all_messages" ON public.support_ticket_messages;
CREATE POLICY "staff_read_all_messages"
  ON public.support_ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- C2: Estudiante lee mensajes públicos de sus propios tickets (no internos)
DROP POLICY IF EXISTS "student_read_public_messages" ON public.support_ticket_messages;
CREATE POLICY "student_read_public_messages"
  ON public.support_ticket_messages FOR SELECT
  USING (
    internal = false
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.profile_id = auth.uid()
    )
  );

-- C3: Staff inserta mensajes en cualquier ticket (incluye notas internas)
DROP POLICY IF EXISTS "staff_insert_any_message" ON public.support_ticket_messages;
CREATE POLICY "staff_insert_any_message"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    sender_profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('super_admin','admin','coordinadora','cobros','directivo')
    )
  );

-- C4: Estudiante inserta mensajes solo en sus propios tickets, nunca internos
DROP POLICY IF EXISTS "student_insert_own_ticket_message" ON public.support_ticket_messages;
CREATE POLICY "student_insert_own_ticket_message"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    sender_profile_id = auth.uid()
    AND internal = false
    AND EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND t.profile_id = auth.uid()
    )
  );

-- (Blocker 3: eliminado auth_insert_message permisivo — reemplazado por C3 + C4)
DROP POLICY IF EXISTS "auth_insert_message" ON public.support_ticket_messages;

-- ── Grants ─────────────────────────────────────────────────────
-- service_role: acceso total (usado por API backend con Supabase admin)
GRANT ALL ON public.support_tickets             TO service_role;
GRANT ALL ON public.support_ticket_messages     TO service_role;

-- authenticated: acceso controlado por RLS
GRANT SELECT, INSERT        ON public.support_tickets         TO authenticated;
GRANT UPDATE                ON public.support_tickets         TO authenticated;
GRANT SELECT, INSERT        ON public.support_ticket_messages TO authenticated;
