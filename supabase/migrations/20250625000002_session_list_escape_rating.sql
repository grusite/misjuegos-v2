-- Include escape rating in session list summaries

drop function if exists public.list_play_session_summaries(
  uuid,
  public.game_type,
  text,
  uuid[],
  uuid,
  timestamptz,
  timestamptz,
  int,
  int
);

create function public.list_play_session_summaries(
  p_game_catalog_id uuid default null,
  p_game_type public.game_type default null,
  p_search text default null,
  p_participant_ids uuid[] default null,
  p_player_team_id uuid default null,
  p_played_at_from timestamptz default null,
  p_played_at_to timestamptz default null,
  p_limit int default 25,
  p_offset int default 0
)
returns table (
  id uuid,
  game_catalog_id uuid,
  played_at timestamptz,
  status public.session_status,
  outcome public.session_outcome,
  notes text,
  player_team_id uuid,
  game_title text,
  game_type public.game_type,
  escape_city text,
  escape_venue text,
  escape_rating smallint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    ps.id,
    ps.game_catalog_id,
    ps.played_at,
    ps.status,
    ps.outcome,
    ps.notes,
    ps.player_team_id,
    gc.title as game_title,
    gc.type as game_type,
    erd.city as escape_city,
    erd.venue as escape_venue,
    esd.rating as escape_rating
  from public.play_sessions ps
  inner join public.game_catalog gc on gc.id = ps.game_catalog_id
  left join public.escape_room_details erd on erd.game_catalog_id = gc.id
  left join public.escape_session_details esd on esd.session_id = ps.id
  where
    (p_game_catalog_id is null or ps.game_catalog_id = p_game_catalog_id)
    and (p_game_type is null or gc.type = p_game_type)
    and (
      p_search is null
      or btrim(p_search) = ''
      or position(lower(btrim(p_search)) in lower(gc.title)) > 0
      or position(lower(btrim(p_search)) in lower(coalesce(erd.city, ''))) > 0
      or position(lower(btrim(p_search)) in lower(coalesce(erd.venue, ''))) > 0
    )
    and (
      p_participant_ids is null
      or cardinality(p_participant_ids) = 0
      or exists (
        select 1
        from public.session_participants sp
        where sp.session_id = ps.id
          and sp.participant_id = any (p_participant_ids)
      )
    )
    and (p_player_team_id is null or ps.player_team_id = p_player_team_id)
    and (p_played_at_from is null or ps.played_at >= p_played_at_from)
    and (p_played_at_to is null or ps.played_at <= p_played_at_to)
  order by ps.played_at desc
  limit greatest(coalesce(p_limit, 25), 0)
  offset greatest(coalesce(p_offset, 0), 0);
$$;
