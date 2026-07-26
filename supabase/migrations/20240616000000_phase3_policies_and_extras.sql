-- ClassFlow Phase 3: write policies, profile extras, triggers

alter table public.profiles
  add column if not exists linked_student_id uuid references public.students (id) on delete set null;

create index if not exists profiles_linked_student_id_idx
  on public.profiles (linked_student_id);

create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create trigger assignments_set_updated_at
  before update on public.assignments
  for each row execute function public.set_updated_at();

create or replace function public.owns_class(class_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    where c.id = class_uuid
      and c.teacher_id = auth.uid()
      and c.institution_id = public.get_user_institution_id()
  )
$$;

create or replace function public.teaches_student(student_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    where s.id = student_uuid
      and c.teacher_id = auth.uid()
      and s.institution_id = public.get_user_institution_id()
  )
$$;

create or replace function public.is_linked_student(student_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.linked_student_id = student_uuid
  )
$$;

-- students
create policy "students_insert_teacher"
  on public.students for insert
  with check (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

create policy "students_update_teacher"
  on public.students for update
  using (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

create policy "students_delete_teacher"
  on public.students for delete
  using (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

-- assignments
create policy "assignments_insert_teacher"
  on public.assignments for insert
  with check (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

create policy "assignments_update_teacher"
  on public.assignments for update
  using (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

create policy "assignments_delete_teacher"
  on public.assignments for delete
  using (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

-- submissions
create policy "submissions_insert"
  on public.submissions for insert
  with check (
    institution_id = public.get_user_institution_id()
    and (
      public.is_linked_student(student_id)
      or public.teaches_student(student_id)
    )
  );

create policy "submissions_update"
  on public.submissions for update
  using (
    institution_id = public.get_user_institution_id()
    and (
      public.is_linked_student(student_id)
      or public.teaches_student(student_id)
    )
  );

-- grades
create policy "grades_insert_teacher"
  on public.grades for insert
  with check (
    institution_id = public.get_user_institution_id()
    and public.teaches_student(student_id)
    and graded_by = auth.uid()
  );

create policy "grades_update_teacher"
  on public.grades for update
  using (
    institution_id = public.get_user_institution_id()
    and graded_by = auth.uid()
    and public.teaches_student(student_id)
  );

-- risk_flags
create policy "risk_flags_insert_teacher"
  on public.risk_flags for insert
  with check (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

create policy "risk_flags_update_teacher"
  on public.risk_flags for update
  using (
    institution_id = public.get_user_institution_id()
    and public.owns_class(class_id)
  );

-- ai_insights
create policy "ai_insights_insert_teacher"
  on public.ai_insights for insert
  with check (institution_id = public.get_user_institution_id());
