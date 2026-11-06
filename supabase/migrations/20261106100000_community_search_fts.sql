-- Pre-Alpha community search helpers (Postgres FTS).
-- Site /search currently filters local-store data; call these RPCs when
-- profiles (and later questions / garage items) should be queried remotely.
--
-- Uses websearch_to_tsquery so quotes, OR, and -negation work like a simple
-- search box. RLS still applies (security invoker).

create or replace function public.search_community_profiles(
  query text,
  result_limit int default 20
)
returns table (
  id uuid,
  display_name text,
  full_name text,
  city text,
  state text,
  avatar_url text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select nullif(btrim(query), '') as raw,
           least(greatest(coalesce(result_limit, 20), 1), 50) as lim
  ),
  tsq as (
    select
      case
        when q.raw is null then null
        else websearch_to_tsquery('english', q.raw)
      end as tsq,
      q.lim
    from q
  )
  select
    p.id,
    p.display_name,
    p.full_name,
    p.city,
    p.state,
    p.avatar_url,
    ts_rank(
      to_tsvector(
        'english',
        coalesce(p.display_name, '') || ' ' ||
        coalesce(p.full_name, '') || ' ' ||
        coalesce(p.city, '') || ' ' ||
        coalesce(p.state, '')
      ),
      tsq.tsq
    ) as rank
  from public.profiles p
  cross join tsq
  where tsq.tsq is not null
    and to_tsvector(
      'english',
      coalesce(p.display_name, '') || ' ' ||
      coalesce(p.full_name, '') || ' ' ||
      coalesce(p.city, '') || ' ' ||
      coalesce(p.state, '')
    ) @@ tsq.tsq
  order by rank desc, p.display_name asc
  limit (select lim from tsq);
$$;

comment on function public.search_community_profiles(text, int) is
  'FTS over profiles via websearch_to_tsquery. Extend with community_questions / garage_items when those tables exist.';

revoke all on function public.search_community_profiles(text, int) from public;
grant execute on function public.search_community_profiles(text, int) to authenticated;
grant execute on function public.search_community_profiles(text, int) to anon;
