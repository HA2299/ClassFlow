-- ClassFlow Phase 2+: students, assignments, submissions, grades, risk_flags, ai_insights

create type public.student_status as enum ('active', 'at_risk', 'inactive');
create type public.assignment_difficulty as enum ('easy', 'medium', 'hard');
create type public.assignment_type as enum ('homework', 'quiz', 'project', 'exam');
create type public.submission_status as enum ('submitted', 'graded', 'late');
create type public.risk_flag_type as enum ('low_grades', 'missing_submissions', 'no_activity', 'other');
create type public.risk_severity as enum ('low', 'medium', 'high');
create type public.insight_type as enum ('class_summary', 'student_analysis', 'recommendation', 'risk');

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  email text,
  status public.student_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  name text not null,
  description text,
  due_date timestamptz not null,
  difficulty public.assignment_difficulty not null default 'medium',
  type public.assignment_type not null default 'homework',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  answer text not null default '',
  submitted_at timestamptz,
  status public.submission_status not null default 'submitted',
  created_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade unique,
  student_id uuid not null references public.students (id) on delete cascade,
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  score numeric(5,2) not null check (score >= 0),
  max_score numeric(5,2) not null default 100,
  feedback text,
  graded_at timestamptz not null default now(),
  graded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.risk_flags (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  flag_type public.risk_flag_type not null,
  severity public.risk_severity not null default 'medium',
  description text,
  flagged_at timestamptz not null default now(),
  resolved boolean not null default false
);

create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  class_id uuid references public.classes (id) on delete cascade,
  student_id uuid references public.students (id) on delete cascade,
  title text not null,
  summary text not null,
  insight_type public.insight_type not null,
  created_at timestamptz not null default now()
);

alter table public.students enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.risk_flags enable row level security;
alter table public.ai_insights enable row level security;

-- RLS: same institution via get_user_institution_id()
create policy "students_select" on public.students for select
  using (institution_id = public.get_user_institution_id());
create policy "assignments_select" on public.assignments for select
  using (institution_id = public.get_user_institution_id());
create policy "submissions_select" on public.submissions for select
  using (institution_id = public.get_user_institution_id());
create policy "grades_select" on public.grades for select
  using (institution_id = public.get_user_institution_id());
create policy "risk_flags_select" on public.risk_flags for select
  using (institution_id = public.get_user_institution_id());
create policy "ai_insights_select" on public.ai_insights for select
  using (institution_id = public.get_user_institution_id());
