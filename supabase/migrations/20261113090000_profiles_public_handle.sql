-- Public handle as the only Community identity.
-- Shared profiles table (marketplace still may read display_name — keep column,
-- make nullable, and mirror handle into it for back-compat).

alter table public.profiles
  add column if not exists handle text,
  add column if not exists handle_changed_at timestamptz;

comment on column public.profiles.handle is
  'Public @handle — sole public identity on Community.';
comment on column public.profiles.handle_changed_at is
  'When handle was last set/changed; 30-day cooldown between changes.';

-- History of vacated handles (reserved 90 days; 301 redirect target).
create table if not exists public.handle_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  handle text not null,
  vacated_at timestamptz not null default now()
);

create index if not exists handle_history_handle_lower_idx
  on public.handle_history (lower(handle));

create index if not exists handle_history_vacated_idx
  on public.handle_history (vacated_at desc);

create index if not exists handle_history_profile_idx
  on public.handle_history (profile_id, vacated_at desc);

comment on table public.handle_history is
  'Previous public handles. Reserved 90 days; /@old → current profile.';

alter table public.handle_history enable row level security;

drop policy if exists "handle_history select public" on public.handle_history;
create policy "handle_history select public"
  on public.handle_history for select
  to anon, authenticated
  using (true);

-- Owners can insert their own history rows (claim/change path).
drop policy if exists "handle_history insert own" on public.handle_history;
create policy "handle_history insert own"
  on public.handle_history for insert
  to authenticated
  with check (auth.uid() = profile_id);

-- Backfill handles from display_name / full_name when missing.
create or replace function public.cf_slug_name_part(raw text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      regexp_replace(
        lower(trim(coalesce(raw, ''))),
        '[^a-z0-9]+',
        '',
        'g'
      ),
      ''
    ),
    'rider'
  );
$$;

do $$
declare
  r record;
  first_part text;
  last_part text;
  candidate text;
  n int;
  parts text[];
begin
  for r in
    select id, display_name, full_name
    from public.profiles
    where handle is null or btrim(handle) = ''
  loop
    parts := regexp_split_to_array(
      trim(coalesce(nullif(btrim(r.display_name), ''), nullif(btrim(r.full_name), ''), 'rider')),
      '\s+'
    );
    first_part := public.cf_slug_name_part(parts[1]);
    if array_length(parts, 1) > 1 then
      last_part := public.cf_slug_name_part(parts[array_length(parts, 1)]);
      candidate := left(first_part, 18) || '_' || left(last_part, 1);
    else
      last_part := '';
      candidate := left(first_part, 20);
    end if;

    candidate := regexp_replace(lower(candidate), '[^a-z0-9_]', '', 'g');
    candidate := regexp_replace(candidate, '_+', '_', 'g');
    candidate := regexp_replace(candidate, '^_+|_+$', '', 'g');
    if candidate !~ '^[a-z]' then
      candidate := 'r' || candidate;
    end if;
    if length(candidate) < 3 then
      candidate := rpad(candidate, 3, '0');
    end if;
    candidate := left(candidate, 20);

    n := 1;
    while exists (
      select 1 from public.profiles p
      where lower(p.handle) = lower(candidate)
    ) or candidate in (
      'admin','administrator','support','help','cyclefound','cycle_found',
      'staff','mod','moderator','settings','account','login','signup','api',
      'members','garage','wanted','about','terms','privacy','null','undefined'
    )
    loop
      n := n + 1;
      candidate := left(
        regexp_replace(
          case when last_part <> '' then left(first_part, 18) || '_' || left(last_part, 1)
               else left(first_part, 18) end,
          '_+$',
          '',
          'g'
        ),
        20 - length(n::text)
      ) || n::text;
    end loop;

    update public.profiles
    set
      handle = candidate,
      handle_changed_at = coalesce(handle_changed_at, created_at, now()),
      display_name = coalesce(nullif(btrim(display_name), ''), candidate)
    where id = r.id;
  end loop;
end $$;

-- Enforce uniqueness case-insensitively.
create unique index if not exists profiles_handle_lower_uidx
  on public.profiles (lower(handle));

-- Completed Community accounts must have a handle (null only during brief signup).
alter table public.profiles alter column handle drop not null;

-- Allow marketplace / Community to clear display_name later.
alter table public.profiles alter column display_name drop not null;

-- FTS: prefer handle; do not expose full_name in search ranking text.
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
    p.handle as display_name,
    p.city,
    p.state,
    p.avatar_url,
    ts_rank(
      to_tsvector(
        'english',
        coalesce(p.handle, '') || ' ' ||
        coalesce(p.city, '') || ' ' ||
        coalesce(p.state, '')
      ),
      tsq.tsq
    ) as rank
  from public.profiles p
  cross join tsq
  where tsq.tsq is not null
    and p.handle is not null
    and to_tsvector(
      'english',
      coalesce(p.handle, '') || ' ' ||
      coalesce(p.city, '') || ' ' ||
      coalesce(p.state, '')
    ) @@ tsq.tsq
  order by rank desc, p.handle asc
  limit (select lim from tsq);
$$;

comment on function public.search_community_profiles(text, int) is
  'FTS over public handles + location. full_name is private and not searched.';

revoke all on function public.search_community_profiles(text, int) from public;
grant execute on function public.search_community_profiles(text, int) to authenticated;
grant execute on function public.search_community_profiles(text, int) to anon;

-- Resolve current handle for an old/vacated handle (within 90 days).
create or replace function public.resolve_handle_redirect(old_handle text)
returns table (current_handle text, profile_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.handle, h.profile_id
  from public.handle_history h
  join public.profiles p on p.id = h.profile_id
  where lower(h.handle) = lower(trim(old_handle))
    and h.vacated_at > now() - interval '90 days'
    and p.handle is not null
  order by h.vacated_at desc
  limit 1;
$$;

revoke all on function public.resolve_handle_redirect(text) from public;
grant execute on function public.resolve_handle_redirect(text) to anon, authenticated;
