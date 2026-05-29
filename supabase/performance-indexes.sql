-- ══════════════════════════════════════════════════════════════════
-- WCA Hub — Performance Indexes for 1,500+ students
-- File: supabase/performance-indexes.sql
-- Ejecutar en Supabase SQL Editor. Idempotente (IF NOT EXISTS).
-- No altera schema ni datos. No ejecutar automáticamente.
-- ══════════════════════════════════════════════════════════════════

-- ── Student portal ────────────────────────────────────────────
-- Portal loads enrollments by student_id + status on every login
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status
  ON enrollments(student_id, status);

-- Portal and register check student_id + program_id (upsert key)
CREATE INDEX IF NOT EXISTS idx_enrollments_student_program
  ON enrollments(student_id, program_id);

-- Group dashboard queries active enrollments by group
CREATE INDEX IF NOT EXISTS idx_enrollments_group_status
  ON enrollments(group_id, status);

-- Every portal load does students WHERE profile_id = ? (most-hit query)
CREATE INDEX IF NOT EXISTS idx_students_profile
  ON students(profile_id);

-- Portal loads certificates by student_id on every active login
CREATE INDEX IF NOT EXISTS idx_certificates_student
  ON certificates(student_id);

-- ── Payments ──────────────────────────────────────────────────
-- handleConfirm fetches payment by enrollment_id on every approval
CREATE INDEX IF NOT EXISTS idx_payments_enrollment
  ON payments(enrollment_id);

-- Cobros filters by status + date in PagosSection
CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON payments(status, created_at DESC);

-- Transfer verification and registration duplicate check
CREATE INDEX IF NOT EXISTS idx_payments_reference
  ON payments(reference_code);

-- ── LMS ───────────────────────────────────────────────────────
-- LMSPlayer + ExamModule query units by program + level + number
CREATE INDEX IF NOT EXISTS idx_units_program_level_number
  ON units(program_id, level, unit_number);

-- LMSPlayer queries activities by unit (published only, ordered)
CREATE INDEX IF NOT EXISTS idx_unit_activities_unit_published
  ON unit_activities(unit_id, published, order_num);

-- E2 fix: user_activity_progress load filtered by profile + activity
CREATE INDEX IF NOT EXISTS idx_user_activity_progress_profile_activity
  ON user_activity_progress(profile_id, activity_id);

-- Exam save/load: student_progress lookup by enrollment + unit
CREATE INDEX IF NOT EXISTS idx_student_progress_enrollment_unit
  ON student_progress(enrollment_id, unit_id);

-- ── Reports / BI ──────────────────────────────────────────────
-- stats.js counts enrollments by program + status for breakdown
CREATE INDEX IF NOT EXISTS idx_enrollments_program_status
  ON enrollments(program_id, status);

-- stats.js: new students count by created_at month
CREATE INDEX IF NOT EXISTS idx_students_created
  ON students(created_at DESC);

-- ── Notifications ─────────────────────────────────────────────
-- Notifications panel: unread by profile + date
CREATE INDEX IF NOT EXISTS idx_notifications_profile_read
  ON notifications(profile_id, read, created_at DESC);

-- ── Audit log ─────────────────────────────────────────────────
-- Audit queries by entity + entity_id (actor/created already indexed)
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_log(entity, entity_id);
