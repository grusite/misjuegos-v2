-- Phase 5 RLS for catalog/sessions/messages/scores (private group model)

alter table public.game_catalog enable row level security;
alter table public.board_game_details enable row level security;
alter table public.play_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_messages enable row level security;
alter table public.board_game_scores enable row level security;

create policy "game_catalog_select_authenticated"
  on public.game_catalog
  for select
  to authenticated
  using (true);

create policy "game_catalog_insert_own"
  on public.game_catalog
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "game_catalog_update_own"
  on public.game_catalog
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "game_catalog_delete_own"
  on public.game_catalog
  for delete
  to authenticated
  using (created_by = auth.uid());

create policy "board_game_details_select_authenticated"
  on public.board_game_details
  for select
  to authenticated
  using (true);

create policy "board_game_details_insert_own"
  on public.board_game_details
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.game_catalog gc
      where gc.id = game_catalog_id and gc.created_by = auth.uid()
    )
  );

create policy "board_game_details_update_own"
  on public.board_game_details
  for update
  to authenticated
  using (
    exists (
      select 1 from public.game_catalog gc
      where gc.id = game_catalog_id and gc.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.game_catalog gc
      where gc.id = game_catalog_id and gc.created_by = auth.uid()
    )
  );

create policy "board_game_details_delete_own"
  on public.board_game_details
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.game_catalog gc
      where gc.id = game_catalog_id and gc.created_by = auth.uid()
    )
  );

create policy "play_sessions_select_authenticated"
  on public.play_sessions
  for select
  to authenticated
  using (true);

create policy "play_sessions_insert_own"
  on public.play_sessions
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "play_sessions_update_own"
  on public.play_sessions
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "play_sessions_delete_own"
  on public.play_sessions
  for delete
  to authenticated
  using (created_by = auth.uid());

create policy "session_participants_select_authenticated"
  on public.session_participants
  for select
  to authenticated
  using (true);

create policy "session_participants_mutate_session_owner"
  on public.session_participants
  for all
  to authenticated
  using (
    exists (
      select 1 from public.play_sessions s
      where s.id = session_id and s.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.play_sessions s
      where s.id = session_id and s.created_by = auth.uid()
    )
  );

create policy "session_messages_select_authenticated"
  on public.session_messages
  for select
  to authenticated
  using (true);

create policy "session_messages_insert_own_author"
  on public.session_messages
  for insert
  to authenticated
  with check (author_profile_id = auth.uid());

create policy "session_messages_update_own_author"
  on public.session_messages
  for update
  to authenticated
  using (author_profile_id = auth.uid())
  with check (author_profile_id = auth.uid());

create policy "session_messages_delete_own_author"
  on public.session_messages
  for delete
  to authenticated
  using (author_profile_id = auth.uid());

create policy "board_game_scores_select_authenticated"
  on public.board_game_scores
  for select
  to authenticated
  using (true);

create policy "board_game_scores_mutate_session_owner"
  on public.board_game_scores
  for all
  to authenticated
  using (
    exists (
      select 1 from public.play_sessions s
      where s.id = session_id and s.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.play_sessions s
      where s.id = session_id and s.created_by = auth.uid()
    )
  );
