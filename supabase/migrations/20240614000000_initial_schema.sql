-- ClassFlow Phase 1: institutions, profiles, classes

create type public.user_role as enum (
  'teacher',
  'student',
  'parent',
  'institution_admin',
  'system_admin'
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id) on delete cascade,
  role public.user_role not null default 'teacher',
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  identity_number text null check (char_length(identity_number) between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_institution_id_idx on public.profiles (institution_id);
create index classes_institution_id_idx on public.classes (institution_id);
create index classes_teacher_id_idx on public.classes (teacher_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

create or replace function public.get_user_institution_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select institution_id from public.profiles where id = auth.uid()
$$;

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;

create policy "institutions_select_own"
  on public.institutions for select
  using (id = public.get_user_institution_id());

create policy "institutions_insert_authenticated"
  on public.institutions for insert
  with check (auth.uid() is not null);

create policy "profiles_select_same_institution"
  on public.profiles for select
  using (institution_id = public.get_user_institution_id());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "classes_select_same_institution"
  on public.classes for select
  using (institution_id = public.get_user_institution_id());

create policy "classes_insert_teacher"
  on public.classes for insert
  with check (
    institution_id = public.get_user_institution_id()
    and teacher_id = auth.uid()
  );

create policy "classes_update_teacher"
  on public.classes for update
  using (
    teacher_id = auth.uid()
    and institution_id = public.get_user_institution_id()
  );

create policy "classes_delete_teacher"
  on public.classes for delete
  using (
    teacher_id = auth.uid()
    and institution_id = public.get_user_institution_id()
  );
