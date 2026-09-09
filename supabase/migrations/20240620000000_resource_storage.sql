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
