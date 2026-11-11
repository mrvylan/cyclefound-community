-- Community garage item types: bike | part | gear (+ bike state, part install target).
-- Safe additive migration — does not rewrite existing category text.
-- Older rows without typing columns still resolve at read time in the app.
--
-- Backfill uses only columns that may already exist on classic garage_bikes
-- (item_kind, part_category, ai_identification). Optional Community `category`
-- is used when present.

begin;

alter table public.garage_bikes
  add column if not exists community_item_type text,
  add column if not exists bike_state text,
  add column if not exists installed_on_bike_id uuid,
  add column if not exists category_needs_review boolean not null default false;

alter table public.garage_bikes
  drop constraint if exists garage_bikes_community_item_type_check;

alter table public.garage_bikes
  add constraint garage_bikes_community_item_type_check
  check (
    community_item_type is null
    or community_item_type in ('bike', 'part', 'gear')
  );

alter table public.garage_bikes
  drop constraint if exists garage_bikes_bike_state_check;

alter table public.garage_bikes
  add constraint garage_bikes_bike_state_check
  check (
    bike_state is null
    or bike_state in ('complete', 'frameset')
  );

-- Optional self-reference for parts installed on a bike in the same garage.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'garage_bikes_installed_on_bike_id_fkey'
  ) then
    alter table public.garage_bikes
      add constraint garage_bikes_installed_on_bike_id_fkey
      foreign key (installed_on_bike_id)
      references public.garage_bikes (id)
      on delete set null;
  end if;
end $$;

comment on column public.garage_bikes.community_item_type is
  'Community add path: bike | part | gear. Null = derive from category at read time.';
comment on column public.garage_bikes.bike_state is
  'When community_item_type = bike: complete | frameset. Null for non-bikes.';
comment on column public.garage_bikes.installed_on_bike_id is
  'Optional part → bike link within the owner garage. Null when standalone.';
comment on column public.garage_bikes.category_needs_review is
  'True when category mapped from Other (or flagged) — keep category, review later.';

-- Backfill without assuming Community-only columns exist.
do $$
declare
  has_category boolean;
  has_part_category boolean;
  has_item_kind boolean;
  has_ai boolean;
  cat_expr text;
  sql text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'garage_bikes' and column_name = 'category'
  ) into has_category;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'garage_bikes' and column_name = 'part_category'
  ) into has_part_category;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'garage_bikes' and column_name = 'item_kind'
  ) into has_item_kind;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'garage_bikes' and column_name = 'ai_identification'
  ) into has_ai;

  -- Prefer Community category, then part_category, then cf JSON category.
  cat_expr := 'lower(trim(coalesce(';
  if has_category then
    cat_expr := cat_expr || 'nullif(category, ''''), ';
  end if;
  if has_part_category then
    cat_expr := cat_expr || 'nullif(part_category, ''''), ';
  end if;
  if has_ai then
    cat_expr := cat_expr || 'nullif(ai_identification->''cf''->>''category'', ''''), ';
  end if;
  cat_expr := cat_expr || ''''')))';

  sql := format($f$
    update public.garage_bikes
    set
      community_item_type = case
        when %1$s in ('complete bikes', 'framesets') then 'bike'
        when %1$s in ('components', 'wheels') then 'part'
        when %1$s in ('accessories', 'tools', 'other') then 'gear'
        %2$s
        else community_item_type
      end,
      bike_state = case
        when %1$s = 'complete bikes' then 'complete'
        when %1$s = 'framesets' then 'frameset'
        else bike_state
      end,
      category_needs_review = case
        when %1$s = 'other' then true
        else category_needs_review
      end
    where community_item_type is null
       or (bike_state is null and %1$s in ('complete bikes', 'framesets'))
       or (category_needs_review = false and %1$s = 'other')
  $f$,
    cat_expr,
    case
      when has_item_kind then
        $k$when item_kind = 'bike' then 'bike'
        when item_kind = 'part' then 'part'$k$
      else
        ''
    end
  );

  execute sql;
end $$;

commit;
