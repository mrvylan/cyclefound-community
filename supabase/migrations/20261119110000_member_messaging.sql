-- Cross-user member / garage DMs (replaces cf_messages_v1 localStorage for bots).

create table if not exists public.member_threads (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'member'
    check (kind in ('member', 'garage')),
  participant_a uuid not null references auth.users (id) on delete cascade,
  participant_b uuid not null references auth.users (id) on delete cascade,
  item_id uuid,
  item_title text not null default '',
  item_href text not null default '',
  price_label text not null default '',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_threads_distinct_participants check (participant_a <> participant_b),
  constraint member_threads_ordered check (participant_a < participant_b)
);

create unique index if not exists member_threads_pair_item_uidx
  on public.member_threads (
    participant_a,
    participant_b,
    coalesce(item_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists member_threads_updated_idx
  on public.member_threads (updated_at desc);

create table if not exists public.member_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.member_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint member_messages_body_len check (char_length(btrim(body)) between 20 and 2000)
);

create index if not exists member_messages_thread_idx
  on public.member_messages (thread_id, created_at asc);

create table if not exists public.member_thread_reads (
  thread_id uuid not null references public.member_threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

alter table public.member_threads enable row level security;
alter table public.member_messages enable row level security;
alter table public.member_thread_reads enable row level security;

drop policy if exists "member_threads_select" on public.member_threads;
create policy "member_threads_select"
  on public.member_threads for select
  to authenticated
  using (auth.uid() = participant_a or auth.uid() = participant_b);

drop policy if exists "member_threads_insert" on public.member_threads;
create policy "member_threads_insert"
  on public.member_threads for insert
  to authenticated
  with check (auth.uid() = participant_a or auth.uid() = participant_b);

drop policy if exists "member_threads_update" on public.member_threads;
create policy "member_threads_update"
  on public.member_threads for update
  to authenticated
  using (auth.uid() = participant_a or auth.uid() = participant_b);

drop policy if exists "member_messages_select" on public.member_messages;
create policy "member_messages_select"
  on public.member_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.member_threads t
      where t.id = thread_id
        and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );

drop policy if exists "member_messages_insert" on public.member_messages;
create policy "member_messages_insert"
  on public.member_messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.member_threads t
      where t.id = thread_id
        and (t.participant_a = auth.uid() or t.participant_b = auth.uid())
    )
  );

drop policy if exists "member_thread_reads_all" on public.member_thread_reads;
create policy "member_thread_reads_all"
  on public.member_thread_reads for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on table public.member_threads is
  'DM threads between two members (ordered participant ids).';
comment on table public.member_messages is
  'Messages inside member_threads.';
