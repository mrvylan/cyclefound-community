-- When an auth user is deleted, free their username for reuse immediately
-- (do not leave handle_history rows that reserve the name for 90 days).

create or replace function public.release_handles_on_auth_user_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.handle_history where profile_id = old.id;

  -- Clear before the profiles row cascades away so unique(lower(handle)) frees.
  update public.profiles
  set
    handle = null,
    handle_changed_at = null,
    display_name = null
  where id = old.id;

  return old;
end;
$$;

drop trigger if exists release_handles_on_auth_user_delete on auth.users;
create trigger release_handles_on_auth_user_delete
  before delete on auth.users
  for each row
  execute function public.release_handles_on_auth_user_delete();

comment on function public.release_handles_on_auth_user_delete() is
  'Frees profiles.handle + handle_history when an auth user is deleted so usernames can be claimed again.';
