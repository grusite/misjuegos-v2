-- Session participants and team members can edit shared records (private group).

create or replace function public.is_session_participant(p_session_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_participants sp
    left join public.participants p on p.id = sp.participant_id
    where sp.session_id = p_session_id
      and (
        sp.profile_id = p_user_id
        or p.profile_id = p_user_id
      )
  );
$$;

create or replace function public.is_team_member(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.player_team_members ptm
    join public.participants p on p.id = ptm.participant_id
    where ptm.team_id = p_team_id
      and p.profile_id = p_user_id
  );
$$;

create or replace function public.can_write_play_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.play_sessions s
      where s.id = p_session_id
        and s.created_by = auth.uid()
    )
    or public.is_session_participant(p_session_id, auth.uid());
$$;

create or replace function public.can_write_player_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.player_teams t
      where t.id = p_team_id
        and t.created_by = auth.uid()
    )
    or public.is_team_member(p_team_id, auth.uid());
$$;

grant execute on function public.is_session_participant(uuid, uuid) to authenticated;
grant execute on function public.is_team_member(uuid, uuid) to authenticated;
grant execute on function public.can_write_play_session(uuid) to authenticated;
grant execute on function public.can_write_player_team(uuid) to authenticated;

-- play_sessions

drop policy if exists "play_sessions_update_own" on public.play_sessions;
drop policy if exists "play_sessions_delete_own" on public.play_sessions;

create policy "play_sessions_update_participants"
  on public.play_sessions
  for update
  to authenticated
  using (public.can_write_play_session(id))
  with check (public.can_write_play_session(id));

create policy "play_sessions_delete_participants"
  on public.play_sessions
  for delete
  to authenticated
  using (public.can_write_play_session(id));

-- session_participants

drop policy if exists "session_participants_mutate_session_owner" on public.session_participants;

create policy "session_participants_mutate_session_writers"
  on public.session_participants
  for all
  to authenticated
  using (public.can_write_play_session(session_id))
  with check (public.can_write_play_session(session_id));

-- escape_session_details

drop policy if exists "escape_session_details_mutate_session_owner" on public.escape_session_details;

create policy "escape_session_details_mutate_session_writers"
  on public.escape_session_details
  for all
  to authenticated
  using (public.can_write_play_session(session_id))
  with check (public.can_write_play_session(session_id));

-- board_game_scores

drop policy if exists "board_game_scores_mutate_session_owner" on public.board_game_scores;

create policy "board_game_scores_mutate_session_writers"
  on public.board_game_scores
  for all
  to authenticated
  using (public.can_write_play_session(session_id))
  with check (public.can_write_play_session(session_id));

-- player_teams

drop policy if exists "player_teams_update_own" on public.player_teams;

create policy "player_teams_update_members"
  on public.player_teams
  for update
  to authenticated
  using (public.can_write_player_team(id))
  with check (public.can_write_player_team(id));

-- player_team_members

drop policy if exists "player_team_members_mutate_team_owner" on public.player_team_members;

create policy "player_team_members_mutate_team_writers"
  on public.player_team_members
  for all
  to authenticated
  using (public.can_write_player_team(team_id))
  with check (
    public.can_write_player_team(team_id)
    and exists (
      select 1
      from public.participants p
      where p.id = participant_id
        and (
          p.owner_id = auth.uid()
          or p.profile_id = auth.uid()
        )
    )
  );
