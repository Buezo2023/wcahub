
-- SQL para pegar en Supabase — Sistema de notificaciones in-app
-- Tabla separada de email_queue para notificaciones in-app

CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        text NOT NULL,      -- 'info' | 'success' | 'warning' | 'payment' | 'exam' | 'class'
  title       text NOT NULL,
  body        text,
  link        text,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Cada usuario solo ve sus notificaciones
DROP POLICY IF EXISTS "notif_own" ON notifications;
CREATE POLICY "notif_own" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Staff puede insertar notificaciones para cualquier usuario
DROP POLICY IF EXISTS "notif_staff_insert" ON notifications;
CREATE POLICY "notif_staff_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin','coordinadora','cobros')
    )
  );

CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, read, created_at DESC);

-- Función para crear notificación desde backend (service role)
CREATE OR REPLACE FUNCTION notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_link text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications(user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
