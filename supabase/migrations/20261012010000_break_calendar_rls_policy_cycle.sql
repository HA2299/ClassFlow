create or replace function public.can_access_calendar_event(
  p_event_id uuid,
  p_institution_id uuid,
  p_created_by uuid,
  p_status public.calendar_event_status
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  if auth.uid() is null
    or p_institution_id is distinct from public.get_user_institution_id()
  then
    return false;
  end if;

  if p_status = 'published' or p_created_by = auth.uid() then
    return true;
  end if;

  return exists (
    select 1
    from public.calendar_event_class_links link
    join public.classes c on c.id = link.class_id
    where link.event_id = p_event_id
      and c.teacher_id = auth.uid()
  );
end;
$$;

create or replace function public.can_access_calendar_event_links(
  p_event_id uuid,
  p_require_owner boolean default false
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
declare
  v_institution_id uuid;
  v_created_by uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select institution_id, created_by
    into v_institution_id, v_created_by
  from public.calendar_events
  where id = p_event_id;

  if not found
    or v_institution_id is distinct from public.get_user_institution_id()
  then
    return false;
  end if;

  return not p_require_owner or v_created_by = auth.uid();
end;
$$;

drop policy if exists "calendar_events_select_same_institution" on public.calendar_events;
create policy "calendar_events_select_same_institution"
  on public.calendar_events for select
  using (
    public.can_access_calendar_event(id, institution_id, created_by, status)
  );

drop policy if exists "calendar_event_class_links_select_same_institution"
  on public.calendar_event_class_links;
create policy "calendar_event_class_links_select_same_institution"
  on public.calendar_event_class_links for select
  using (public.can_access_calendar_event_links(event_id));

drop policy if exists "calendar_event_class_links_insert_teacher"
  on public.calendar_event_class_links;
create policy "calendar_event_class_links_insert_teacher"
  on public.calendar_event_class_links for insert
  with check (public.can_access_calendar_event_links(event_id, true));

drop policy if exists "calendar_event_class_links_delete_teacher"
  on public.calendar_event_class_links;
create policy "calendar_event_class_links_delete_teacher"
  on public.calendar_event_class_links for delete
  using (public.can_access_calendar_event_links(event_id, true));

revoke all on function public.can_access_calendar_event(uuid, uuid, uuid, public.calendar_event_status)
  from public;
revoke all on function public.can_access_calendar_event_links(uuid, boolean)
  from public;
grant execute on function public.can_access_calendar_event(uuid, uuid, uuid, public.calendar_event_status)
  to authenticated;
grant execute on function public.can_access_calendar_event_links(uuid, boolean)
  to authenticated;
