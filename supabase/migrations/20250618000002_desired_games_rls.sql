-- Phase 8 RLS for desired_games (private group read, owner mutate)

alter table public.desired_games enable row level security;

create policy "desired_games_select_authenticated"
  on public.desired_games
  for select
  to authenticated
  using (true);

create policy "desired_games_insert_own"
  on public.desired_games
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "desired_games_update_own"
  on public.desired_games
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "desired_games_delete_own"
  on public.desired_games
  for delete
  to authenticated
  using (created_by = auth.uid());
