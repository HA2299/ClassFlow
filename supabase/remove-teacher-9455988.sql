-- Remove one teacher and only the data owned by that teacher.
-- Run this once in the Supabase SQL Editor.

begin;

do $$
declare
  v_teacher_id uuid;
begin
  select id into v_teacher_id
  from auth.users
  where lower(email) = '9455988@gmail.com';

  if v_teacher_id is null then
    raise notice 'Teacher 9455988@gmail.com was not found';
    return;
  end if;

  -- grades.graded_by has no ON DELETE CASCADE.
  delete from public.grades
  where graded_by = v_teacher_id;

  -- resource_library.teacher_id has no foreign-key cascade.
  delete from public.resource_library
  where resource_library.teacher_id = v_teacher_id;

  -- Classes cascade their students, assignments, submissions, grades,
  -- risk flags and class-linked AI insights.
  delete from public.classes
  where classes.teacher_id = v_teacher_id;

  -- Remove the teacher account. profiles is deleted by its FK cascade;
  -- notifications are also deleted by their recipient FK cascade.
  delete from auth.users
  where id = v_teacher_id;
end $$;

commit;

select email
from auth.users
where lower(email) = '9455988@gmail.com';
