-- Community garage: extend classic garage_bikes for public Community UI.
-- Photos already live in garage_bike_photos + private garage-photos bucket.
--
-- Apply in Supabase SQL Editor if not pushed via CLI.

begin;

alter table public.garage_bikes
  add column if not exists title text,
  add column if not exists category text,
  add column if not exists discipline text,
  add column if not exists description text,
  add column if not exists provenance text,
  add column if not exists status text not null default 'not_for_sale',
  add column if not exists asking_price_cents integer,
  add column if not exists bike_components jsonb,
  add column if not exists archived boolean not null default false,
  add column if not exists is_public boolean not null default true;

alter table public.garage_bikes
  drop constraint if exists garage_bikes_status_check;

alter table public.garage_bikes
  add constraint garage_bikes_status_check
  check (
    status in ('not_for_sale', 'open_to_offers', 'for_sale', 'trade_only')
  );

alter table public.garage_bikes
  drop constraint if exists garage_bikes_asking_price_nonneg;

alter table public.garage_bikes
  add constraint garage_bikes_asking_price_nonneg
  check (asking_price_cents is null or asking_price_cents >= 0);

-- Allow title-only Community items (manufacturer/model may be blank).
alter table public.garage_bikes
  drop constraint if exists garage_bikes_manufacturer_not_blank;

alter table public.garage_bikes
  drop constraint if exists garage_bikes_model_not_blank;

alter table public.garage_bikes
  drop constraint if exists garage_bikes_identity_check;

alter table public.garage_bikes
  add constraint garage_bikes_identity_check
  check (
    char_length(btrim(coalesce(title, ''))) > 0
    or (
      char_length(btrim(manufacturer_name)) > 0
      and char_length(btrim(model_name)) > 0
    )
  );

comment on column public.garage_bikes.title is
  'Community display title; falls back to manufacturer + model.';
comment on column public.garage_bikes.status is
  'Community availability: not_for_sale | open_to_offers | for_sale | trade_only.';
comment on column public.garage_bikes.is_public is
  'When true, Community members can view this garage item.';

-- Public read for Community surfaces (owner still has full CRUD via existing policies).
drop policy if exists "garage_bikes_public_select" on public.garage_bikes;
create policy "garage_bikes_public_select"
  on public.garage_bikes
  for select
  to anon, authenticated
  using (is_public = true and archived = false);

drop policy if exists "garage_bike_photos_public_select" on public.garage_bike_photos;
create policy "garage_bike_photos_public_select"
  on public.garage_bike_photos
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.garage_bikes b
      where b.id = bike_id
        and b.is_public = true
        and b.archived = false
    )
  );

-- Signed URL reads for public garage photos (path still owner-scoped).
drop policy if exists "garage_photos_storage_select_public" on storage.objects;
create policy "garage_photos_storage_select_public"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'garage-photos'
    and exists (
      select 1
      from public.garage_bike_photos p
      join public.garage_bikes b on b.id = p.bike_id
      where p.storage_path = name
        and b.is_public = true
        and b.archived = false
    )
  );

commit;
