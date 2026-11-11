-- Cache for eBay Browse API active-listing aggregates (asking prices).
-- Stores only the slim estimate payload (median/low/high + up to 3 samples).

begin;

create table if not exists public.ebay_price_cache (
  query_key text primary key,
  result jsonb not null,
  fetched_at timestamptz not null default now()
);

create index if not exists ebay_price_cache_fetched_at_idx
  on public.ebay_price_cache (fetched_at desc);

alter table public.ebay_price_cache enable row level security;

-- No anon/authenticated policies: server uses service role only.
revoke all on table public.ebay_price_cache from anon, authenticated;
grant all on table public.ebay_price_cache to service_role;

comment on table public.ebay_price_cache is
  '24h cache of eBay active-listing price aggregates for Community Get estimate.';

commit;
