create or replace function public.get_user_institution_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_institution_id uuid;
begin
  perform set_config('row_security', 'off', true);

  select institution_id
    into v_institution_id
  from public.profiles
  where id = auth.uid()
  limit 1;

  return v_institution_id;
end;
$$;

drop policy if exists "calendar_events_insert_teacher" on public.calendar_events;
create policy "calendar_events_insert_teacher"
  on public.calendar_events for insert
  with check (
    institution_id = public.get_user_institution_id()
    and created_by = auth.uid()
  );

drop policy if exists "calendar_events_update_teacher" on public.calendar_events;
create policy "calendar_events_update_teacher"
  on public.calendar_events for update
  using (
    created_by = auth.uid()
    and institution_id = public.get_user_institution_id()
  )
  with check (
    created_by = auth.uid()
    and institution_id = public.get_user_institution_id()
  );

drop policy if exists "calendar_events_delete_teacher" on public.calendar_events;
create policy "calendar_events_delete_teacher"
  on public.calendar_events for delete
  using (
    created_by = auth.uid()
    and institution_id = public.get_user_institution_id()
  );
