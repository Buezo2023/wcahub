-- ============================================================
-- WCA HUB — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── EXTENSIONES ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── ENUM TYPES ───────────────────────────────────────────────
create type user_role as enum (
  'estudiante', 'docente', 'admin', 'super_admin',
  'asesor_ventas', 'cobros', 'coordinadora', 'directivo'
);

create type program_id as enum (
  'en', 'va', 'va_mkt', 'va_legal', 'va_care'
);

create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1');

create type enrollment_status as enum (
  'active', 'suspended', 'graduated', 'dropped', 'pending'
);

create type payment_status as enum (
  'pending', 'confirmed', 'failed', 'refunded', 'overdue'
);

create type payment_method as enum (
  'stripe', 'transfer', 'cash', 'scholarship', 'b2b'
);

create type lead_stage as enum (
  'nuevo', 'contactado', 'test', 'propuesta', 'convertido', 'perdido'
);

-- ─── PROFILES (extiende auth.users) ───────────────────────────
create table profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text not null unique,
  full_name    text,
  avatar_url   text,
  phone        text,
  country      text default 'HN',
  role         user_role not null default 'estudiante',
  active       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── PROGRAMS ─────────────────────────────────────────────────
create table programs (
  id           program_id primary key,
  name         text not null,
  short_name   text,
  description  text,
  price_monthly numeric(8,2),
  price_quarterly numeric(8,2),
  requires     program_id references programs(id),
  active       boolean default true,  -- si false no aparece en opciones de matrícula
  created_at   timestamptz default now()
);

insert into programs (id, name, short_name, price_monthly, price_quarterly) values
  ('en',       'Inglés Completo',        'Inglés',      95.00, null),
  ('va',       'Asistente Virtual',      'VA General',  75.00, null),
  ('va_mkt',   'VA · Marketing Digital', 'VA Mkt',      null,  95.00),
  ('va_legal', 'VA · Legal Assistant',   'VA Legal',    null,  95.00),
  ('va_care',  'VA · Cuidador Remoto',   'VA Care',     null,  95.00);

update programs set requires = 'va' where id in ('va_mkt', 'va_legal', 'va_care');

-- ─── GROUPS ───────────────────────────────────────────────────
create table groups (
  id           uuid default uuid_generate_v4() primary key,
  program_id   program_id references programs(id),
  level        cefr_level,
  schedule     text not null,              -- "6:00–7:00 PM"
  days         text default 'L·M·V',
  capacity     int default 25,
  teams_link   text,
  active_unit  int default 1,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ─── STAFF (docentes + personal) ──────────────────────────────
create table staff (
  id           uuid default uuid_generate_v4() primary key,
  profile_id   uuid references profiles(id),
  employee_id  text unique,
  position     text,
  department   text,
  salary       numeric(10,2),
  hire_date    date,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- Relación docente → grupos
create table teacher_groups (
  teacher_id  uuid references staff(id) on delete cascade,
  group_id    uuid references groups(id) on delete cascade,
  primary key (teacher_id, group_id)
);

-- ─── STUDENTS ─────────────────────────────────────────────────
create table students (
  id           uuid default uuid_generate_v4() primary key,
  profile_id   uuid references profiles(id) unique,
  student_code text unique,
  level        cefr_level,
  b2b_company  text,
  scholarship  boolean default false,
  notes        text,
  created_at   timestamptz default now()
);

-- ─── ENROLLMENTS ──────────────────────────────────────────────
create table enrollments (
  id           uuid default uuid_generate_v4() primary key,
  student_id   uuid references students(id) on delete cascade,
  program_id   program_id references programs(id),
  group_id     uuid references groups(id),
  status       enrollment_status default 'active',
  enrolled_at  timestamptz default now(),
  current_unit int default 1,
  exam_score   numeric(5,2),
  suspended_at timestamptz,
  suspended_reason text,
  price_locked       numeric(8,2),    -- precio al momento de matricularse
  next_payment_date  date,              -- próximo pago según ciclo de cobro
  unique(student_id, program_id)
);

-- ─── PAYMENTS ─────────────────────────────────────────────────
create table payments (
  id             uuid default uuid_generate_v4() primary key,
  student_id     uuid references students(id),
  enrollment_id  uuid references enrollments(id),
  amount         numeric(8,2) not null,
  currency       text default 'USD',
  method         payment_method not null,
  status         payment_status default 'pending',
  reference_code text,                   -- WCA-B1-0821 o Stripe PI
  bank           text,                   -- BAC, BI Honduras...
  stripe_id      text,                   -- Stripe payment_intent id
  proof_url      text,                   -- URL del comprobante subido
  period_start   date,
  period_end     date,
  confirmed_by   uuid references profiles(id),
  confirmed_at   timestamptz,
  notes          text,
  created_at     timestamptz default now()
);

-- ─── ATTENDANCE ───────────────────────────────────────────────
create table attendance (
  id           uuid default uuid_generate_v4() primary key,
  enrollment_id uuid references enrollments(id) on delete cascade,
  group_id     uuid references groups(id),
  class_date   date not null,
  unit         int,
  present      boolean default false,
  late         boolean default false,
  reason       text,
  recorded_by  uuid references profiles(id),
  created_at   timestamptz default now(),
  unique(enrollment_id, class_date)
);

-- ─── CRM LEADS ────────────────────────────────────────────────
create table leads (
  id           uuid default uuid_generate_v4() primary key,
  full_name    text not null,
  email        text,
  phone        text,
  country      text,
  stage        lead_stage default 'nuevo',
  source       text,                      -- Instagram, Referido, Web...
  program_interest program_id,
  level_interest   cefr_level,
  assigned_to  uuid references profiles(id),
  test_score   numeric(5,2),
  notes        text,
  converted_at timestamptz,              -- cuando se matriculó
  lost_reason  text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── CRM TASKS ────────────────────────────────────────────────
create table crm_tasks (
  id           uuid default uuid_generate_v4() primary key,
  lead_id      uuid references leads(id) on delete cascade,
  assigned_to  uuid references profiles(id),
  title        text not null,
  due_date     timestamptz,
  done         boolean default false,
  done_at      timestamptz,
  created_at   timestamptz default now()
);

-- ─── AUDIT LOG ────────────────────────────────────────────────
create table audit_log (
  id           uuid default uuid_generate_v4() primary key,
  actor_id     uuid references profiles(id),
  action       text not null,            -- 'confirmed_payment', 'suspended_student'...
  entity       text,                     -- 'payment', 'enrollment', 'student'...
  entity_id    uuid,
  metadata     jsonb,
  created_at   timestamptz default now()
);

-- ─── PROGRAM CONTENT ──────────────────────────────────────────
create table units (
  id           uuid default uuid_generate_v4() primary key,
  program_id   program_id references programs(id),
  level        cefr_level,
  unit_number  int not null,
  title        text not null,
  topic        text,
  grammar      text[],
  vocabulary   text[],
  pronunciation text,
  va_tip       text,
  published    boolean default true,
  created_at   timestamptz default now(),
  unique(program_id, level, unit_number)
);

-- ─── STUDENT PROGRESS ─────────────────────────────────────────
create table student_progress (
  id             uuid default uuid_generate_v4() primary key,
  enrollment_id  uuid references enrollments(id) on delete cascade,
  unit_id        uuid references units(id),
  activities_done int default 0,
  test_done      int default 0,
  score          numeric(5,2) default 0,
  completed      boolean default false,
  completed_at   timestamptz,
  unique(enrollment_id, unit_id)
);

-- ─── CYCLE CONFIG ─────────────────────────────────────────────
create table cycle_config (
  id           uuid default uuid_generate_v4() primary key,
  program_id   program_id references programs(id),
  level        cefr_level,
  current_unit int default 1,
  advance_day  text default 'Monday',
  paused       boolean default false,
  updated_at   timestamptz default now(),
  unique(program_id, level)
);

-- ─── HOLIDAYS ─────────────────────────────────────────────────
create table holidays (
  id           uuid default uuid_generate_v4() primary key,
  date         date not null unique,
  name         text not null,
  country      text default 'HN',
  created_at   timestamptz default now()
);


-- ─── BANK ACCOUNTS ────────────────────────────────────────────
create table if not exists bank_accounts (
  id         uuid default gen_random_uuid() primary key,
  nombre     text not null,
  banco      text,
  cuenta     text,
  titular    text,
  tipo       text default 'ahorro',
  active     boolean default true,
  created_at timestamptz default now()
);

-- ─── APP CONFIG ───────────────────────────────────────────────
create table if not exists app_config (
  key        text primary key,
  value      jsonb,
  updated_at timestamptz default now()
);

-- ─── B2B COMPANIES ────────────────────────────────────────────
create table if not exists b2b_companies (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  contact_name  text,
  contact_email text,
  contact_phone text,
  seats_paid    int default 1,
  discount_pct  numeric(5,2) default 0,
  notes         text,
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
create table if not exists notifications (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  type       text default 'info',
  title      text not null,
  body       text,
  link       text,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ─── ÍNDICES para performance ──────────────────────────────────
create index idx_enrollments_student   on enrollments(student_id);
create index idx_enrollments_program   on enrollments(program_id);
create index idx_enrollments_status    on enrollments(status);
create index idx_payments_student      on payments(student_id);
create index idx_payments_status       on payments(status);
create index idx_payments_created      on payments(created_at desc);
create index idx_attendance_enrollment on attendance(enrollment_id);
create index idx_attendance_date       on attendance(class_date desc);
create index idx_leads_stage           on leads(stage);
create index idx_leads_assigned        on leads(assigned_to);
create index idx_audit_actor           on audit_log(actor_id);
create index idx_audit_created         on audit_log(created_at desc);
create index idx_progress_enrollment   on student_progress(enrollment_id);

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
-- Activar RLS en todas las tablas sensibles
alter table profiles          enable row level security;
alter table students          enable row level security;
alter table enrollments       enable row level security;
alter table payments          enable row level security;
alter table attendance        enable row level security;
alter table leads             enable row level security;
alter table audit_log         enable row level security;
alter table student_progress  enable row level security;

-- Profiles: cada usuario ve su propio perfil; admins ven todos
create policy "profiles_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_admin" on profiles
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'coordinadora')
    )
  );

-- Students: el propio estudiante ve su registro; staff ve todos
create policy "students_own" on students
  for select using (
    profile_id = auth.uid()
  );

create policy "students_staff" on students
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'coordinadora', 'docente', 'cobros')
    )
  );

-- Enrollments: estudiante ve las suyas; staff ve todas
create policy "enrollments_own" on enrollments
  for select using (
    exists (
      select 1 from students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

create policy "enrollments_staff" on enrollments
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'coordinadora', 'cobros')
    )
  );

-- Payments: estudiante ve los suyos; cobros y admin ven todos
create policy "payments_own" on payments
  for select using (
    exists (
      select 1 from students s
      where s.id = student_id and s.profile_id = auth.uid()
    )
  );

create policy "payments_staff" on payments
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'cobros')
    )
  );

-- Leads: solo ventas y admin
create policy "leads_sales" on leads
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'asesor_ventas', 'coordinadora')
    )
  );

-- Audit: solo admin
create policy "audit_admin" on audit_log
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'cobros')
    )
  );

-- Student progress: estudiante ve el suyo; docentes y admin ven todos
create policy "progress_own" on student_progress
  for select using (
    exists (
      select 1 from enrollments e
      join students s on s.id = e.student_id
      where e.id = enrollment_id and s.profile_id = auth.uid()
    )
  );

create policy "progress_staff" on student_progress
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'docente', 'coordinadora')
    )
  );

-- ─── FUNCIÓN: updated_at automático ───────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

create trigger leads_updated_at
  before update on leads
  for each row execute procedure update_updated_at();

-- ─── FUNCIÓN: generar código de estudiante ────────────────────
create or replace function generate_student_code()
returns trigger as $$
declare
  new_code text;
  seq int;
begin
  select count(*) + 1 into seq from students;
  new_code := 'WCA-' || to_char(now(), 'YY') || '-' || lpad(seq::text, 4, '0');
  new.student_code := new_code;
  return new;
end;
$$ language plpgsql;

create trigger student_code_gen
  before insert on students
  for each row execute procedure generate_student_code();
