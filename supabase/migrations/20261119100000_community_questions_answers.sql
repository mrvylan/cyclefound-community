-- Shared Community questions + answers (replaces browser-local feed for cross-user bots).

create table if not exists public.community_questions (
  id uuid primary key default gen_random_uuid(),
  asker_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  linked_item_id uuid,
  votes integer not null default 0,
  solved boolean not null default false,
  accepted_answer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_questions_title_len check (char_length(btrim(title)) between 8 and 200),
  constraint community_questions_body_len check (char_length(body) <= 8000)
);

create index if not exists community_questions_created_idx
  on public.community_questions (created_at desc);

create index if not exists community_questions_asker_idx
  on public.community_questions (asker_id);

create index if not exists community_questions_tags_gin
  on public.community_questions using gin (tags);

create table if not exists public.community_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.community_questions (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  votes integer not null default 0,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_answers_body_len check (char_length(btrim(body)) between 1 and 8000)
);

create index if not exists community_answers_question_idx
  on public.community_answers (question_id, created_at asc);

alter table public.community_questions
  drop constraint if exists community_questions_accepted_fk;
alter table public.community_questions
  add constraint community_questions_accepted_fk
  foreign key (accepted_answer_id) references public.community_answers (id)
  on delete set null;

alter table public.community_questions enable row level security;
alter table public.community_answers enable row level security;

drop policy if exists "community_questions_select" on public.community_questions;
create policy "community_questions_select"
  on public.community_questions for select
  to anon, authenticated
  using (true);

drop policy if exists "community_questions_insert" on public.community_questions;
create policy "community_questions_insert"
  on public.community_questions for insert
  to authenticated
  with check (asker_id = auth.uid());

drop policy if exists "community_questions_update_own" on public.community_questions;
create policy "community_questions_update_own"
  on public.community_questions for update
  to authenticated
  using (asker_id = auth.uid())
  with check (asker_id = auth.uid());

drop policy if exists "community_answers_select" on public.community_answers;
create policy "community_answers_select"
  on public.community_answers for select
  to anon, authenticated
  using (true);

drop policy if exists "community_answers_insert" on public.community_answers;
create policy "community_answers_insert"
  on public.community_answers for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "community_answers_update_own" on public.community_answers;
create policy "community_answers_update_own"
  on public.community_answers for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

comment on table public.community_questions is
  'Community Q&A threads — public read; authors insert/update own rows.';
comment on table public.community_answers is
  'Answers on community_questions.';
