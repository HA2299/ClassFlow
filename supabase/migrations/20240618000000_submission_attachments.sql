alter table public.submissions
  add column if not exists attachment_urls text[] default null,
  add column if not exists attachment_names text[] default null;

drop policy if exists "submissions_update" on public.submissions;
create policy "submissions_update" on public.submissions for update
  using (institution_id = public.get_user_institution_id());

drop policy if exists "submissions_insert" on public.submissions;
create policy "submissions_insert" on public.submissions for insert
  with check (institution_id = public.get_user_institution_id());

drop policy if exists "submissions_delete" on public.submissions;
create policy "submissions_delete" on public.submissions for delete
  using (institution_id = public.get_user_institution_id());
