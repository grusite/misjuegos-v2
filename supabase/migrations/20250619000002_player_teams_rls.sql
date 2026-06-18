-- Phase 9 RLS for player teams

alter table public.player_teams enable row level security;
alter table public.player_team_members enable row level security;

create policy "player_teams_select_authenticated"
  on public.player_teams
  for select
  to authenticated
  using (true);

create policy "player_teams_insert_own"
  on public.player_teams
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "player_teams_update_own"
  on public.player_teams
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "player_teams_delete_own"
  on public.player_teams
  for delete
  to authenticated
  using (created_by = auth.uid());

create policy "player_team_members_select_authenticated"
  on public.player_team_members
  for select
  to authenticated
  using (true);

create policy "player_team_members_mutate_team_owner"
  on public.player_team_members
  for all
  to authenticated
  using (
    exists (
      select 1 from public.player_teams t
      where t.id = team_id and t.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.player_teams t
      where t.id = team_id and t.created_by = auth.uid()
    )
    and exists (
      select 1 from public.participants p
      where p.id = participant_id and p.owner_id = auth.uid()
    )
  );
