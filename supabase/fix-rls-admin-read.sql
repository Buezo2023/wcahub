-- ================================================================
-- FIX: RLS para que admins puedan leer todos los perfiles
-- EJECUTAR EN: Supabase Dashboard → SQL Editor
-- ================================================================

-- Función SECURITY DEFINER para evitar recursión infinita en policies
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Permitir que admins lean todos los perfiles (para tabla de staff, coordinadores, etc.)
DROP POLICY IF EXISTS "profiles_admin_read" ON public.profiles;
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id             -- cada usuario lee el suyo
    OR public.is_admin_or_super()  -- admins leen todos
  );

-- Permitir que admins actualicen cualquier perfil (cambiar roles)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id
    OR public.is_admin_or_super()
  );

-- Staff: también coordinadora puede leer (para ver sus grupos/docentes)
DROP POLICY IF EXISTS "staff_internal_read" ON public.staff;
CREATE POLICY "staff_internal_read" ON public.staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin','super_admin','coordinadora','cobros','asesor_ventas','directivo','docente')
    )
  );

-- Staff: solo admin/super_admin pueden insertar/editar/borrar
DROP POLICY IF EXISTS "staff_admin_write" ON public.staff;
CREATE POLICY "staff_admin_write" ON public.staff
  FOR ALL USING (public.is_admin_or_super());

-- Audit log: todos los roles autenticados pueden insertar, solo admins leer
DROP POLICY IF EXISTS "audit_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_log;
CREATE POLICY "audit_insert"     ON public.audit_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT USING (public.is_admin_or_super());

-- Notifications: cada usuario lee las suyas, cualquier autenticado puede insertar
DROP POLICY IF EXISTS "notifications_own"   ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_own"    ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

SELECT 'RLS policies actualizadas correctamente' as resultado;
