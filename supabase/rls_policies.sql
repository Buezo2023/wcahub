-- ══════════════════════════════════════════════════════════════════
-- WCA Hub — Políticas de Row Level Security (RLS)
-- Ejecutar en Supabase SQL Editor (una sola vez por tabla)
-- Última revisión: 2026-05-27
--
-- CONVENCIONES:
--   auth.uid()               → UUID del usuario autenticado
--   get_my_role()            → helper que lee role de profiles sin recursión
--   Service Role Key (API)   → bypassa RLS automáticamente en el backend
-- ══════════════════════════════════════════════════════════════════

-- ── Helper function: devuelve el rol del usuario actual ───────────
-- Usamos security definer + search_path para evitar recursión
-- en políticas de la propia tabla profiles.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ══════════════════════════════════════════════════════════════════
-- TABLE: profiles
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado puede leer su propio perfil
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Lectura ampliada: staff puede ver todos los perfiles (para listas de estudiantes etc.)
CREATE POLICY "profiles_select_staff"
  ON profiles FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','docente','cobros','asesor_ventas','directivo'));

-- Actualización: cada usuario puede editar solo sus campos no-sensibles
-- Los campos role/active son protegidos por trigger (ver abajo)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Actualización admin: admins pueden editar cualquier perfil
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (get_my_role() IN ('admin','super_admin'));

-- Insert solo via service role (API backend) — no desde cliente
-- (sin política de INSERT = solo service role puede insertar)

-- ── Trigger: proteger campos sensibles de auto-modificación ──────
-- Impide que un usuario se cambie el rol o se reactive a sí mismo
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Solo el service role puede cambiar role o active
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'No podés cambiar tu propio rol';
    END IF;
    IF NEW.active IS DISTINCT FROM OLD.active THEN
      RAISE EXCEPTION 'No podés cambiar tu propio estado activo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_fields();


-- ══════════════════════════════════════════════════════════════════
-- TABLE: students
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Estudiante puede leer su propio registro
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  USING (profile_id = auth.uid());

-- Staff puede leer todos los estudiantes
CREATE POLICY "students_select_staff"
  ON students FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','docente','cobros','asesor_ventas','directivo'));

-- Solo API (service role) puede insertar y modificar estudiantes
-- (sin política de INSERT/UPDATE desde cliente)


-- ══════════════════════════════════════════════════════════════════
-- TABLE: enrollments
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Estudiante puede leer sus propias matrículas
CREATE POLICY "enrollments_select_own"
  ON enrollments FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

-- Staff puede leer todas las matrículas
CREATE POLICY "enrollments_select_staff"
  ON enrollments FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','docente','cobros','asesor_ventas','directivo'));

-- Solo API (service role) puede modificar matrículas
-- (sin política de INSERT/UPDATE/DELETE desde cliente)


-- ══════════════════════════════════════════════════════════════════
-- TABLE: payments
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Estudiante puede leer sus propios pagos
CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

-- Staff financiero puede leer todos los pagos
CREATE POLICY "payments_select_staff"
  ON payments FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','cobros','directivo'));

-- Solo API (service role) puede insertar y modificar pagos
-- IMPORTANTE: el portal del estudiante ahora usa /api/payments (no insert directo)


-- ══════════════════════════════════════════════════════════════════
-- TABLE: staff
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Cada docente puede leer su propio registro
CREATE POLICY "staff_select_own"
  ON staff FOR SELECT
  USING (profile_id = auth.uid());

-- Admin/coordinadora puede leer todos
CREATE POLICY "staff_select_admin"
  ON staff FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','directivo'));

-- Solo API puede insertar y modificar staff


-- ══════════════════════════════════════════════════════════════════
-- TABLE: groups
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden ver grupos (necesario para mostrar horarios)
CREATE POLICY "groups_select_authenticated"
  ON groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Solo coordinadora/admin puede crear o modificar grupos
CREATE POLICY "groups_insert_coordinadora"
  ON groups FOR INSERT
  WITH CHECK (get_my_role() IN ('admin','super_admin','coordinadora'));

CREATE POLICY "groups_update_coordinadora"
  ON groups FOR UPDATE
  USING (get_my_role() IN ('admin','super_admin','coordinadora'));


-- ══════════════════════════════════════════════════════════════════
-- TABLE: teacher_groups
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE teacher_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_groups_select_authenticated"
  ON teacher_groups FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "teacher_groups_write_coordinadora"
  ON teacher_groups FOR ALL
  USING (get_my_role() IN ('admin','super_admin','coordinadora'));


-- ══════════════════════════════════════════════════════════════════
-- TABLE: student_progress
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Estudiante puede leer y escribir su propio progreso
CREATE POLICY "progress_select_own"
  ON student_progress FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "progress_upsert_own"
  ON student_progress FOR INSERT
  WITH CHECK (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

CREATE POLICY "progress_update_own"
  ON student_progress FOR UPDATE
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

-- Docente/admin puede ver progreso de sus estudiantes
CREATE POLICY "progress_select_staff"
  ON student_progress FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','docente','directivo'));


-- ══════════════════════════════════════════════════════════════════
-- TABLE: leads
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Solo ventas/admin puede ver y modificar leads
CREATE POLICY "leads_all_ventas"
  ON leads FOR ALL
  USING (get_my_role() IN ('asesor_ventas','admin','super_admin'));


-- ══════════════════════════════════════════════════════════════════
-- TABLE: crm_tasks
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_tasks_all_ventas"
  ON crm_tasks FOR ALL
  USING (get_my_role() IN ('asesor_ventas','admin','super_admin'));


-- ══════════════════════════════════════════════════════════════════
-- TABLE: b2b_companies
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE b2b_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "b2b_select_staff"
  ON b2b_companies FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','directivo','cobros'));

CREATE POLICY "b2b_write_admin"
  ON b2b_companies FOR ALL
  USING (get_my_role() IN ('admin','super_admin'));


-- ══════════════════════════════════════════════════════════════════
-- TABLE: audit_log
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden leer el audit log
CREATE POLICY "audit_log_select_admin"
  ON audit_log FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','directivo'));

-- Cualquier autenticado puede insertar (para registrar acciones propias)
-- El service role bypassa esta política para inserts del backend
CREATE POLICY "audit_log_insert_authenticated"
  ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Nadie puede modificar o eliminar audit logs (inmutables)
-- (sin políticas UPDATE/DELETE = bloqueado para todos excepto service role)


-- ══════════════════════════════════════════════════════════════════
-- TABLE: certificates
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Estudiante puede ver sus propios certificados
CREATE POLICY "certificates_select_own"
  ON certificates FOR SELECT
  USING (
    student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())
  );

-- Admin/coordinadora puede ver todos
CREATE POLICY "certificates_select_admin"
  ON certificates FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','directivo'));

-- Solo service role puede crear certificados (desde el backend)


-- ══════════════════════════════════════════════════════════════════
-- TABLE: student_notes
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Staff puede leer y crear notas
CREATE POLICY "notes_read_staff"
  ON student_notes FOR SELECT
  USING (get_my_role() IN ('admin','super_admin','coordinadora','docente'));

CREATE POLICY "notes_insert_staff"
  ON student_notes FOR INSERT
  WITH CHECK (get_my_role() IN ('admin','super_admin','coordinadora','docente'));

-- Solo el autor o admin puede eliminar una nota
CREATE POLICY "notes_delete_own_or_admin"
  ON student_notes FOR DELETE
  USING (author_id = auth.uid() OR get_my_role() IN ('admin','super_admin'));


-- ══════════════════════════════════════════════════════════════════
-- STORAGE: bucket "proofs" (comprobantes de pago)
-- ══════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → Storage → Policies

-- Política: estudiante puede subir a su propio path proofs/{uid}/*
-- INSERT
INSERT INTO storage.policies (name, bucket_id, definition, action)
VALUES (
  'proofs_upload_own',
  'proofs',
  '(bucket_id = ''proofs'' AND (storage.foldername(name))[1] = auth.uid()::text)',
  'INSERT'
) ON CONFLICT DO NOTHING;

-- SELECT: cobros/admin pueden ver todos los comprobantes
INSERT INTO storage.policies (name, bucket_id, definition, action)
VALUES (
  'proofs_read_cobros',
  'proofs',
  '(bucket_id = ''proofs'' AND get_my_role() IN (''cobros'',''admin'',''super_admin''))',
  'SELECT'
) ON CONFLICT DO NOTHING;

-- SELECT propio: estudiante puede ver sus propios comprobantes
INSERT INTO storage.policies (name, bucket_id, definition, action)
VALUES (
  'proofs_read_own',
  'proofs',
  '(bucket_id = ''proofs'' AND (storage.foldername(name))[1] = auth.uid()::text)',
  'SELECT'
) ON CONFLICT DO NOTHING;
