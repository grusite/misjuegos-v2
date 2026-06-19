-- Broader search for first-login participant linking (not limited to display name match).

create or replace function public.search_participant_link_candidates(p_search text)
returns table (
  id uuid,
  display_name text,
  color text,
  session_count bigint,
  match_kind text
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized_search as (
    select lower(trim(p_search)) as value
  )
  select
    p.id,
    p.display_name,
    p.color,
    count(sp.session_id)::bigint as session_count,
    case
      when lower(trim(p.display_name)) = ns.value then 'exact'
      else 'partial'
    end as match_kind
  from public.participants p
  cross join normalized_search ns
  left join public.session_participants sp on sp.participant_id = p.id
  where p.profile_id is null
    and length(ns.value) >= 2
    and (
      lower(trim(p.display_name)) like '%' || ns.value || '%'
      or exists (
        select 1
        from public.participant_aliases pa
        where pa.participant_id = p.id
          and lower(trim(pa.alias)) like '%' || ns.value || '%'
      )
    )
  group by p.id, p.display_name, p.color, ns.value
  order by
    case when lower(trim(p.display_name)) = ns.value then 0 else 1 end,
    session_count desc,
    p.display_name
  limit 30;
$$;

grant execute on function public.search_participant_link_candidates(text) to authenticated;
