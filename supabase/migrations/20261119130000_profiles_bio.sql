-- Public short bio on profiles (Community directory + /u/[handle]).

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  drop constraint if exists profiles_bio_len;

alter table public.profiles
  add constraint profiles_bio_len
  check (bio is null or char_length(bio) <= 600);

comment on column public.profiles.bio is
  'Optional public short bio shown on Community profile and Members directory.';
