update storage.buckets
set public = false
where id = 'submission-files';

create or replace function public.is_institution_admin()
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
			and p.institution_id = public.get_user_institution_id()
			and p.role in ('institution_admin', 'system_admin')
	)
$$;

create or replace function public.can_access_class(class_uuid uuid)
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
			and c.institution_id = public.get_user_institution_id()
			and (c.teacher_id = auth.uid() or public.is_institution_admin())
	)
$$;

create or replace function public.can_access_student(student_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.students s
		join public.profiles p on p.id = auth.uid()
		where s.id = student_uuid
			and s.institution_id = public.get_user_institution_id()
			and (
				p.linked_student_id = s.id
				or public.can_access_class(s.class_id)
			)
	)
$$;

drop policy if exists "students_select" on public.students;
drop policy if exists "assignments_select" on public.assignments;
drop policy if exists "submissions_select" on public.submissions;
drop policy if exists "grades_select" on public.grades;
drop policy if exists "risk_flags_select" on public.risk_flags;
drop policy if exists "ai_insights_select" on public.ai_insights;

create policy "students_select_scoped" on public.students for select
	using (public.can_access_student(id));

create policy "assignments_select_scoped" on public.assignments for select
	using (
		public.can_access_class(class_id)
		or exists (
			select 1
			from public.students s
			join public.profiles p on p.id = auth.uid()
			where s.class_id = assignments.class_id
				and s.institution_id = public.get_user_institution_id()
				and p.linked_student_id = s.id
		)
	);

create policy "submissions_select_scoped" on public.submissions for select
	using (public.can_access_student(student_id));

create policy "grades_select_scoped" on public.grades for select
	using (public.can_access_student(student_id));

create policy "risk_flags_select_scoped" on public.risk_flags for select
	using (public.can_access_student(student_id));

create policy "ai_insights_select_scoped" on public.ai_insights for select
	using (
		(student_id is not null and public.can_access_student(student_id))
		or (class_id is not null and (
			public.can_access_class(class_id)
			or exists (
				select 1
				from public.students s
				join public.profiles p on p.id = auth.uid()
				where s.class_id = ai_insights.class_id
					and p.linked_student_id = s.id
			)
		))
	);

do $$
begin
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
						or (p.role = 'parent' and p.linked_student_id = s.id)
						or (p.role = 'teacher' and a.class_id in (
							select c.id from public.classes c where c.teacher_id = auth.uid()
						))
						or p.role in ('institution_admin', 'system_admin')
					)
			)
		);
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create policy "submission_files_insert_student"
		on storage.objects
		for insert
		to authenticated
		with check (
			bucket_id = 'submission-files'
			and (storage.foldername(storage.objects.name))[1] = public.get_user_institution_id()::text
			and exists (
				select 1
				from public.assignments a
				join public.students s on s.class_id = a.class_id
				join public.profiles p on p.id = auth.uid()
				where a.id::text = (storage.foldername(storage.objects.name))[2]
					and s.id::text = (storage.foldername(storage.objects.name))[3]
					and p.role = 'student'
					and p.linked_student_id = s.id
			)
		);
exception
	when duplicate_object then null;
end $$;

do $$
begin
	create policy "submission_files_delete_authorized"
		on storage.objects
		for delete
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
exception
	when duplicate_object then null;
end $$;