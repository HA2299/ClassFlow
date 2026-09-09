alter table public.resource_library
  add column if not exists file_name text null,
  add column if not exists file_path text null;
