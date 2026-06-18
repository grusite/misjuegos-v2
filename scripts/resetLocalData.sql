-- Wipe app data for a fresh import (keeps auth.users + profiles).
-- Local only — run: pnpm db:reset-data  (supabase db query --local)

truncate table
  public.import_errors,
  public.import_runs,
  public.player_team_members,
  public.player_teams,
  public.session_messages,
  public.board_game_scores,
  public.session_participants,
  public.board_session_details,
  public.escape_session_details,
  public.play_sessions,
  public.escape_room_details,
  public.board_game_details,
  public.game_catalog,
  public.desired_games,
  public.participant_aliases,
  public.participants
restart identity cascade;
