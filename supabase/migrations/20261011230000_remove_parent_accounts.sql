begin;

delete from auth.users u
using public.profiles p
where p.id = u.id
  and p.role::text = 'parent';

drop policy if exists "submission_files_select_authorized" on storage.objects;

do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'user_role'
      and e.enumlabel = 'parent'
  ) then
    alter table public.profiles
      alter column role drop default;

    alter table public.profiles
      alter column role type text using role::text;

    drop type public.user_role;

    create type public.user_role as enum (
      'teacher',
      'student',
      'institution_admin',
      'system_admin'
    );

    alter table public.profiles
      alter column role type public.user_role using role::public.user_role;

    alter table public.profiles
      alter column role set default 'teacher'::public.user_role;
  end if;
end $$;

create policy "submission_files_select_authorized"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'submission-files'
    and (storage.foldername(storage.objects.name))[1] = public.get_user_institution_id()::text
    and exists (
      select 1
      from public.assignments a
      join public.students s on s.class_id = a.class_id
      join public.profiles p on p.id = auth.uid()
      where a.id::text = (storage.foldername(storage.objects.name))[2]
        and s.id::text = (storage.foldername(storage.objects.name))[3]
        and (
          (p.role = 'student' and p.linked_student_id = s.id)
          or (p.role = 'teacher' and a.class_id in (
            select c.id from public.classes c where c.teacher_id = auth.uid()
          ))
          or p.role in ('institution_admin', 'system_admin')
        )
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_role_not_parent'
  ) then
    alter table public.profiles
      add constraint profiles_role_not_parent
      check (role::text <> 'parent');
  end if;
end $$;

commit;
