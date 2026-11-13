-- Optional public display_name + race-safe founding member numbers.
-- display_name already exists (was mirrored from handle); we repurpose it as
-- an optional human label and stop treating handle-equals-display_name as a name.

-- Config: founding member cap (single source in DB).
create table if not exists public.community_settings (
  key text primary key,
  value_int integer
);

insert into public.community_settings (key, value_int)
values ('founding_member_cap', 50)
on conflict (key) do update set value_int = excluded.value_int;

comment on table public.community_settings is
  'App config integers (e.g. founding_member_cap). Not user-writable.';

alter table public.community_settings enable row level security;

drop policy if exists "community_settings select public" on public.community_settings;
create policy "community_settings select public"
  on public.community_settings for select
  to anon, authenticated
  using (true);

-- Profiles: founding / test flags + member number
alter table public.profiles
  add column if not exists is_founding_member boolean not null default false,
  add column if not exists member_number integer,
  add column if not exists is_test_account boolean not null default false;

comment on column public.profiles.display_name is
  'Optional public display name (e.g. Dylan S.). Not the username; empty = show @handle.';
comment on column public.profiles.is_founding_member is
  'True when member_number <= founding_member_cap. Set only by DB trigger/backfill.';
comment on column public.profiles.member_number is
  'Monotonic signup ordinal among non-test accounts. Assigned once; never reused.';
comment on column public.profiles.is_test_account is
  'Hidden from Members / counts; never gets a member_number. Service-role only.';

create unique index if not exists profiles_member_number_uidx
  on public.profiles (member_number)
  where member_number is not null;

-- Clear mirrored handle → display_name so Community shows @handle until they set a name.
update public.profiles
set display_name = null
where display_name is not null
  and handle is not null
  and lower(btrim(display_name)) = lower(btrim(handle));

-- Also clear display_names that are bare @handles
update public.profiles
set display_name = null
where display_name is not null
  and handle is not null
  and lower(btrim(ltrim(display_name, '@'))) = lower(btrim(handle));

-- Mark Dylan's test username before backfill (@dylan_si).
update public.profiles
set is_test_account = true,
    member_number = null,
    is_founding_member = false
where lower(handle) = 'dylan_si';

-- Backfill member numbers for existing non-test profiles with a handle.
with ordered as (
  select
    id,
    row_number() over (
      order by created_at asc nulls last, id asc
    ) as n
  from public.profiles
  where coalesce(is_test_account, false) = false
    and handle is not null
    and btrim(handle) <> ''
)
update public.profiles p
set
  member_number = o.n,
  is_founding_member = o.n <= coalesce(
    (select value_int from public.community_settings where key = 'founding_member_cap'),
    50
  )
from ordered o
where p.id = o.id
  and p.member_number is null;

-- Race-safe assignment when a handle is first claimed.
create or replace function public.profiles_assign_member_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num integer;
  cap integer;
  jwt_role text;
begin
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(auth.jwt() ->> 'role', '')
  );

  -- Clients must not write protected columns (service_role / definer only).
  if tg_op = 'UPDATE' and coalesce(jwt_role, '') is distinct from 'service_role' then
    new.is_test_account := old.is_test_account;
    -- Allow this trigger to set founding/number when claiming; otherwise freeze.
    if not (
      new.handle is not null
      and old.handle is null
      and old.member_number is null
      and coalesce(new.is_test_account, false) = false
    ) then
      new.member_number := old.member_number;
      new.is_founding_member := old.is_founding_member;
    end if;
  end if;

  if new.is_test_account then
    new.member_number := null;
    new.is_founding_member := false;
    return new;
  end if;

  -- Assign once: handle first set, no number yet.
  if new.handle is not null
     and btrim(new.handle) <> ''
     and new.member_number is null
     and (
       tg_op = 'INSERT'
       or old.handle is null
       or btrim(coalesce(old.handle, '')) = ''
     )
  then
    perform pg_advisory_xact_lock(872014001);

    select coalesce(value_int, 50) into cap
    from public.community_settings
    where key = 'founding_member_cap';
    cap := coalesce(cap, 50);

    select coalesce(max(member_number), 0) + 1 into next_num
    from public.profiles
    where coalesce(is_test_account, false) = false
      and member_number is not null;

    new.member_number := next_num;
    new.is_founding_member := next_num <= cap;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_assign_member_number on public.profiles;
create trigger profiles_assign_member_number
  before insert or update of handle, is_test_account, member_number, is_founding_member
  on public.profiles
  for each row
  execute function public.profiles_assign_member_number();

comment on function public.profiles_assign_member_number() is
  'Assigns member_number + founding badge once when handle is claimed; protects fields from client writes.';

-- Column privileges: authenticated may update display_name; not founding fields.
-- (Supabase often grants UPDATE on whole table — revoke then re-grant safe columns.)
do $$
begin
  -- Best-effort; ignore if roles/grants differ across environments.
  begin
    revoke update on public.profiles from authenticated;
  exception when others then null;
  end;
  begin
    grant update (
      full_name,
      display_name,
      handle,
      handle_changed_at,
      city,
      state,
      zip_code,
      avatar_url,
      seller_type,
      updated_at
    ) on public.profiles to authenticated;
  exception when others then null;
  end;
end $$;

-- FTS: include real display_name in search text (not as identity).
drop function if exists public.search_community_profiles(text, int);

create or replace function public.search_community_profiles(
  query text,
  result_limit int default 20
)
returns table (
  id uuid,
  handle text,
  display_name text,
  city text,
  state text,
  avatar_url text,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  with q as (
    select nullif(btrim(query), '') as raw,
           least(greatest(coalesce(result_limit, 20), 1), 50) as lim
  ),
  tsq as (
    select
      case
        when q.raw is null then null
        else websearch_to_tsquery('english', q.raw)
      end as tsq,
      q.lim
    from q
  )
  select
    p.id,
    p.handle,
    nullif(btrim(p.display_name), '') as display_name,
    p.city,
    p.state,
    p.avatar_url,
    ts_rank(
      to_tsvector(
        'english',
        coalesce(p.handle, '') || ' ' ||
        coalesce(p.display_name, '') || ' ' ||
        coalesce(p.city, '') || ' ' ||
        coalesce(p.state, '')
      ),
      tsq.tsq
    ) as rank
  from public.profiles p
  cross join tsq
  where tsq.tsq is not null
    and p.handle is not null
    and coalesce(p.is_test_account, false) = false
    and to_tsvector(
      'english',
      coalesce(p.handle, '') || ' ' ||
      coalesce(p.display_name, '') || ' ' ||
      coalesce(p.city, '') || ' ' ||
      coalesce(p.state, '')
    ) @@ tsq.tsq
  order by rank desc, p.handle asc
  limit (select lim from tsq);
$$;

revoke all on function public.search_community_profiles(text, int) from public;
grant execute on function public.search_community_profiles(text, int) to authenticated;
grant execute on function public.search_community_profiles(text, int) to anon;
