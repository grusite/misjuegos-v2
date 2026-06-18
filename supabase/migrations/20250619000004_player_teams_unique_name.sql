-- One team name per owner (case-insensitive, trimmed).
-- Rename pre-existing duplicates so the index can be created safely.

with ranked as (
  select
    id,
    row_number() over (
      partition by created_by, lower(trim(name))
      order by created_at, id
    ) as rn
  from public.player_teams
)
update public.player_teams pt
set name = pt.name || ' (' || ranked.rn || ')'
from ranked
where pt.id = ranked.id
  and ranked.rn > 1;

create unique index player_teams_owner_name_unique_idx
  on public.player_teams (created_by, lower(trim(name)));
