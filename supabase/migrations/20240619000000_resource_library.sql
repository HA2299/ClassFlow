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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'classflow-resources',
  'classflow-resources',
  true,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.resource_library
  enable row level security;

do $$
begin
  create policy "resource_library_select" on public.resource_library
    for select
    using (institution_id = public.get_user_institution_id());
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "classflow_resources_upload" on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'classflow-resources'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "classflow_resources_delete" on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'classflow-resources'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "resource_library_insert" on public.resource_library
    for insert
    with check (
      institution_id = public.get_user_institution_id()
      and teacher_id = auth.uid()
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "resource_library_update" on public.resource_library
    for update
    using (
      institution_id = public.get_user_institution_id()
      and teacher_id = auth.uid()
    )
    with check (
      institution_id = public.get_user_institution_id()
      and teacher_id = auth.uid()
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "resource_library_delete" on public.resource_library
    for delete
    using (
      institution_id = public.get_user_institution_id()
      and teacher_id = auth.uid()
    );
exception
  when duplicate_object then null;
end $$;
