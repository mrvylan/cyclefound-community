-- Bot registry + skip founding numbers for bot profiles.

alter table public.profiles
  add column if not exists is_bot boolean not null default false;

comment on column public.profiles.is_bot is
  'Automated persona accounts. Skip member_number / founding assignment.';

create table if not exists public.bot_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  persona_slug text not null unique,
  enabled boolean not null default true,
  last_acted_at timestamptz,
  actions_today integer not null default 0,
  actions_day date,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bot_actions (
  id uuid primary key default gen_random_uuid(),
  bot_user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bot_actions_bot_created_idx
  on public.bot_actions (bot_user_id, created_at desc);

alter table public.bot_accounts enable row level security;
alter table public.bot_actions enable row level security;

-- No client policies — service role only.

-- Skip founding assignment for bots (update existing trigger function).
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

  if tg_op = 'UPDATE' and coalesce(jwt_role, '') is distinct from 'service_role' then
    new.is_test_account := old.is_test_account;
    new.is_bot := old.is_bot;
    if not (
      new.handle is not null
      and old.handle is null
      and old.member_number is null
      and coalesce(new.is_test_account, false) = false
      and coalesce(new.is_bot, false) = false
    ) then
      new.member_number := old.member_number;
      new.is_founding_member := old.is_founding_member;
    end if;
  end if;

  if coalesce(new.is_test_account, false) or coalesce(new.is_bot, false) then
    new.member_number := null;
    new.is_founding_member := false;
    return new;
  end if;

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
      and coalesce(is_bot, false) = false
      and member_number is not null;

    new.member_number := next_num;
    new.is_founding_member := next_num <= cap;
  end if;

  return new;
end;
$$;

comment on table public.bot_accounts is
  'Enabled bot personas for the Community cron worker.';
comment on table public.bot_actions is
  'Audit log of bot cron actions.';
