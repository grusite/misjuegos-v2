-- Phase 11: first-login participant linking

alter table public.profiles
  add column if not exists participant_link_prompt_completed_at timestamptz;

comment on column public.profiles.participant_link_prompt_completed_at is
  'When set, the first-login “¿Eres alguno de estos amigos?” prompt will not show again.';

-- Private group: all members can read participants (needed for session rosters + linking UI).
create policy "participants_select_authenticated"
  on public.participants
  for select
  to authenticated
  using (true);

create policy "participant_aliases_select_authenticated"
  on public.participant_aliases
  for select
  to authenticated
  using (true);

create or replace function public.find_participant_link_candidates(search_name text)
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
    select lower(trim(search_name)) as value
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
    and (
      lower(trim(p.display_name)) = ns.value
      or lower(trim(p.display_name)) like '%' || ns.value || '%'
      or ns.value like '%' || lower(trim(p.display_name)) || '%'
      or exists (
        select 1
        from public.participant_aliases pa
        where pa.participant_id = p.id
          and (
            lower(trim(pa.alias)) = ns.value
            or lower(trim(pa.alias)) like '%' || ns.value || '%'
            or ns.value like '%' || lower(trim(pa.alias)) || '%'
          )
      )
    )
  group by p.id, p.display_name, p.color, ns.value
  order by
    case when lower(trim(p.display_name)) = ns.value then 0 else 1 end,
    session_count desc,
    p.display_name;
$$;

create or replace function public.claim_participant_link(participant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.participants p
    where p.id = participant_id
      and p.profile_id is null
  ) then
    raise exception 'Participant not found or already linked';
  end if;

  update public.participants
  set profile_id = current_user_id
  where id = participant_id;

  update public.profiles
  set participant_link_prompt_completed_at = now()
  where id = current_user_id
    and participant_link_prompt_completed_at is null;
end;
$$;

create or replace function public.skip_participant_link_prompt()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set participant_link_prompt_completed_at = now()
  where id = current_user_id
    and participant_link_prompt_completed_at is null;
end;
$$;

grant execute on function public.find_participant_link_candidates(text) to authenticated;
grant execute on function public.claim_participant_link(uuid) to authenticated;
grant execute on function public.skip_participant_link_prompt() to authenticated;
