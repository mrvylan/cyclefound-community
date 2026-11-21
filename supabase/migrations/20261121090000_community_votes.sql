-- One Useful vote per member per question or answer.
-- Denormalized votes counters on community_questions / community_answers stay in sync via trigger.

create table if not exists public.community_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('question', 'answer')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  constraint community_votes_unique unique (user_id, target_type, target_id)
);

create index if not exists community_votes_target_idx
  on public.community_votes (target_type, target_id);

create index if not exists community_votes_user_idx
  on public.community_votes (user_id, created_at desc);

comment on table public.community_votes is
  'Useful votes on Community questions and answers. One row per voter per target.';

alter table public.community_votes enable row level security;

drop policy if exists "community_votes_select" on public.community_votes;
create policy "community_votes_select"
  on public.community_votes for select
  to anon, authenticated
  using (true);

drop policy if exists "community_votes_insert_own" on public.community_votes;
create policy "community_votes_insert_own"
  on public.community_votes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "community_votes_delete_own" on public.community_votes;
create policy "community_votes_delete_own"
  on public.community_votes for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.community_votes_sync_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t_type text;
  t_id uuid;
  delta integer;
  n integer;
begin
  if tg_op = 'INSERT' then
    t_type := new.target_type;
    t_id := new.target_id;
    delta := 1;
  elsif tg_op = 'DELETE' then
    t_type := old.target_type;
    t_id := old.target_id;
    delta := -1;
  else
    return null;
  end if;

  if t_type = 'question' then
    update public.community_questions
    set votes = greatest(0, votes + delta),
        updated_at = now()
    where id = t_id;
  elsif t_type = 'answer' then
    update public.community_answers
    set votes = greatest(0, votes + delta),
        updated_at = now()
    where id = t_id;
  end if;

  -- Recompute if counter drifted (defensive).
  select count(*)::integer into n
  from public.community_votes
  where target_type = t_type and target_id = t_id;

  if t_type = 'question' then
    update public.community_questions set votes = n where id = t_id;
  else
    update public.community_answers set votes = n where id = t_id;
  end if;

  if tg_op = 'INSERT' then
    return new;
  end if;
  return old;
end;
$$;

drop trigger if exists community_votes_sync_count on public.community_votes;
create trigger community_votes_sync_count
  after insert or delete on public.community_votes
  for each row
  execute function public.community_votes_sync_count();

-- Allow trigger to update votes even when voter is not the author.
-- RLS already limits direct client updates to own rows; security definer covers counters.
