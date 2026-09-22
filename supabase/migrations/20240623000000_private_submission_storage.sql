update storage.buckets
set public = false
where id = 'submission-files';

do $$
begin
	create policy "submission_files_select_authorized"
		on storage.objects
		for select
		to authenticated
		using (
			bucket_id = 'submission-files'
			and (storage.foldername(name))[1] = public.get_user_institution_id()::text
			and exists (
				select 1
				from public.assignments a
				join public.students s on s.class_id = a.class_id
				join public.profiles p on p.id = auth.uid()
				where a.id::text = (storage.foldername(name))[2]
					and s.id::text = (storage.foldername(name))[3]
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
			and (storage.foldername(name))[1] = public.get_user_institution_id()::text
			and exists (
				select 1
				from public.assignments a
				join public.students s on s.class_id = a.class_id
				join public.profiles p on p.id = auth.uid()
				where a.id::text = (storage.foldername(name))[2]
					and s.id::text = (storage.foldername(name))[3]
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
			and (storage.foldername(name))[1] = public.get_user_institution_id()::text
			and exists (
				select 1
				from public.assignments a
				join public.students s on s.class_id = a.class_id
				join public.profiles p on p.id = auth.uid()
				where a.id::text = (storage.foldername(name))[2]
					and s.id::text = (storage.foldername(name))[3]
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