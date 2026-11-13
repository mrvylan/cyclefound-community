-- Ensure Classic estimate columns exist on shared garage_bikes (no-op if already applied).

begin;

alter table public.garage_bikes
  add column if not exists estimated_value_cents integer,
  add column if not exists estimated_value_low_cents integer,
  add column if not exists estimated_value_high_cents integer,
  add column if not exists estimated_value_sample_size integer,
  add column if not exists estimated_value_confidence text,
  add column if not exists estimated_value_source text,
  add column if not exists estimated_value_at timestamptz,
  add column if not exists estimated_value_meta jsonb;

alter table public.garage_bikes
  drop constraint if exists garage_bikes_estimated_value_nonneg;

alter table public.garage_bikes
  add constraint garage_bikes_estimated_value_nonneg
  check (
    (estimated_value_cents is null or estimated_value_cents >= 0)
    and (estimated_value_low_cents is null or estimated_value_low_cents >= 0)
    and (estimated_value_high_cents is null or estimated_value_high_cents >= 0)
    and (
      estimated_value_sample_size is null
      or estimated_value_sample_size >= 0
    )
  );

commit;
