create table if not exists public.in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('assignment', 'grade', 'submission', 'resource')),
  title text not null,
  message text not null,
  href text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists in_app_notifications_recipient_idx
  on public.in_app_notifications (recipient_id, created_at desc);

create index if not exists in_app_notifications_unread_idx
  on public.in_app_notifications (recipient_id, read_at)
  where read_at is null;

alter table public.in_app_notifications enable row level security;

do $$
begin
  create policy "notifications_select_own" on public.in_app_notifications
    for select
    to authenticated
    using (recipient_id = auth.uid());
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "notifications_update_own" on public.in_app_notifications
    for update
    to authenticated
    using (recipient_id = auth.uid())
    with check (recipient_id = auth.uid());
exception
  when duplicate_object then null;
end $$;
