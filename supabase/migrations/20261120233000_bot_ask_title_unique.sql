-- Prevent persona bots (and anyone) from posting the same question title twice.
-- Case-insensitive per asker so tick retries can't create duplicates.

create unique index if not exists community_questions_asker_title_lower_uidx
  on public.community_questions (asker_id, lower(btrim(title)));
