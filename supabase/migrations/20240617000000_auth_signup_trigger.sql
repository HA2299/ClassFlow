-- Auto-create institution + profile when auth user is created (signup metadata)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inst_id uuid;
  inst_name text;
  user_full_name text;
begin
  inst_name := nullif(trim(coalesce(new.raw_user_meta_data->>'institution_name', '')), '');
  if inst_name is null then
    inst_name := 'מוסד חדש';
  end if;

  user_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');
  if user_full_name is null then
    user_full_name := split_part(new.email, '@', 1);
  end if;

  insert into public.institutions (name)
  values (inst_name)
  returning id into inst_id;

  insert into public.profiles (id, institution_id, role, full_name, email, identity_number)
  values (new.id, inst_id, 'teacher', user_full_name, new.email, new.raw_user_meta_data->>'identity_number');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recovery for users who exist in auth.users but have no profile yet
create or replace function public.complete_teacher_signup(institution_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inst_id uuid;
  inst_name text;
  user_full_name text;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid()) then
    return;
  end if;

  select email, raw_user_meta_data->>'full_name'
  into user_email, user_full_name
  from auth.users
  where id = auth.uid();

  if user_email is null then
    raise exception 'auth user not found';
  end if;

  inst_name := nullif(trim(institution_name), '');
  if inst_name is null then
    inst_name := nullif(trim(coalesce(
      (select raw_user_meta_data->>'institution_name' from auth.users where id = auth.uid()),
      ''
    )), '');
  end if;
  if inst_name is null then
    inst_name := 'מוסד חדש';
  end if;

  user_full_name := nullif(trim(coalesce(user_full_name, '')), '');
  if user_full_name is null then
    user_full_name := split_part(user_email, '@', 1);
  end if;

  insert into public.institutions (name)
  values (inst_name)
  returning id into inst_id;

  insert into public.profiles (id, institution_id, role, full_name, email, identity_number)
  values (
    auth.uid(),
    inst_id,
    'teacher',
    user_full_name,
    user_email,
    (select raw_user_meta_data->>'identity_number' from auth.users where id = auth.uid())
  );
end;
$$;

grant execute on function public.complete_teacher_signup(text) to authenticated;
