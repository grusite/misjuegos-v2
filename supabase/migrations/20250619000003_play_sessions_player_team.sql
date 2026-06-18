-- Link sessions to the player team used when selecting participants (for stats + UI).

alter table public.play_sessions
  add column player_team_id uuid references public.player_teams (id) on delete set null;

create index play_sessions_player_team_id_idx
  on public.play_sessions (player_team_id);
