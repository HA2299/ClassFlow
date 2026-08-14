create table if not exists public.resource_library (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  teacher_id uuid not null,
  class_id uuid null,
  title text not null,
  description text not null,
  type text not null default 'summary',
  tags text[] default array[]::text[],
  url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_library_type_check
    check (type in ('summary', 'presentation', 'formula', 'link', 'notes'))
);

alter table public.resource_library
  enable row level security;

create policy if not exists "resource_library_select" on public.resource_library
  for select
  using (institution_id = public.get_user_institution_id());

create policy if not exists "resource_library_insert" on public.resource_library
  for insert
  with check (
    institution_id = public.get_user_institution_id()
    and teacher_id = auth.uid()
  );

create policy if not exists "resource_library_update" on public.resource_library
  for update
  using (
    institution_id = public.get_user_institution_id()
    and teacher_id = auth.uid()
  )
  with check (
    institution_id = public.get_user_institution_id()
    and teacher_id = auth.uid()
  );

create policy if not exists "resource_library_delete" on public.resource_library
  for delete
  using (
    institution_id = public.get_user_institution_id()
    and teacher_id = auth.uid()
  );
