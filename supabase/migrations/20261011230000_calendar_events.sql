create type public.calendar_event_type as enum (
  'exam',
  'quiz',
  'makeup_exam',
  'project',
  'submission_deadline',
  'special_lesson',
  'class_activity',
  'school_event',
  'other'
);

create type public.calendar_event_status as enum (
  'draft',
  'published',
  'cancelled'
);

create type public.calendar_event_sync_status as enum (
  'disabled',
  'pending',
  'synced',
  'error'
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  event_type public.calendar_event_type not null default 'exam',
  subject text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  status public.calendar_event_status not null default 'published',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  linked_assignment_id uuid,
  external_provider text,
  external_calendar_id text,
  external_event_id text,
  sync_status public.calendar_event_sync_status not null default 'disabled',
  last_synced_at timestamptz,
  reminder_at timestamptz,
  notify_students boolean not null default false,
  notify_teacher boolean not null default true,
  material text,
  topics text[] default array[]::text[],
  duration_minutes integer,
  max_score numeric(5,2),
  preparation_links text[] default array[]::text[],
  special_notes text
);

create table public.calendar_event_class_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, class_id)
);

create index calendar_events_institution_id_idx on public.calendar_events (institution_id);
create index calendar_events_start_at_idx on public.calendar_events (start_at);
create index calendar_event_class_links_event_id_idx on public.calendar_event_class_links (event_id);
create index calendar_event_class_links_class_id_idx on public.calendar_event_class_links (class_id);

create or replace function public.set_calendar_event_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_calendar_event_updated_at();

alter table public.calendar_events enable row level security;
alter table public.calendar_event_class_links enable row level security;

create policy "calendar_events_select_same_institution"
  on public.calendar_events for select
  using (
    institution_id = public.get_user_institution_id()
    and (
      status = 'published'
      or created_by = auth.uid()
      or exists (
        select 1
        from public.classes c
        where c.id in (
          select link.class_id
          from public.calendar_event_class_links link
          where link.event_id = public.calendar_events.id
        )
        and c.teacher_id = auth.uid()
      )
    )
  );

create policy "calendar_events_insert_teacher"
  on public.calendar_events for insert
  with check (
    institution_id = public.get_user_institution_id()
    and created_by = auth.uid()
  );

create policy "calendar_events_update_teacher"
  on public.calendar_events for update
  using (
    created_by = auth.uid()
    and institution_id = public.get_user_institution_id()
  );

create policy "calendar_events_delete_teacher"
  on public.calendar_events for delete
  using (
    created_by = auth.uid()
    and institution_id = public.get_user_institution_id()
  );

create policy "calendar_event_class_links_select_same_institution"
  on public.calendar_event_class_links for select
  using (
    exists (
      select 1
      from public.calendar_events ev
      where ev.id = calendar_event_class_links.event_id
        and ev.institution_id = public.get_user_institution_id()
    )
  );

create policy "calendar_event_class_links_insert_teacher"
  on public.calendar_event_class_links for insert
  with check (
    exists (
      select 1
      from public.calendar_events ev
      where ev.id = calendar_event_class_links.event_id
        and ev.created_by = auth.uid()
        and ev.institution_id = public.get_user_institution_id()
    )
  );

create policy "calendar_event_class_links_delete_teacher"
  on public.calendar_event_class_links for delete
  using (
    exists (
      select 1
      from public.calendar_events ev
      where ev.id = calendar_event_class_links.event_id
        and ev.created_by = auth.uid()
        and ev.institution_id = public.get_user_institution_id()
    )
  );
