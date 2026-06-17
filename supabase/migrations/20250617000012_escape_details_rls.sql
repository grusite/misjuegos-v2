-- Phase 6 RLS for escape details

alter table public.escape_room_details enable row level security;
alter table public.escape_session_details enable row level security;

create policy "escape_room_details_select_authenticated"
  on public.escape_room_details
  for select
  to authenticated
  using (true);

create policy "escape_room_details_mutate_catalog_owner"
  on public.escape_room_details
  for all
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

create policy "escape_session_details_select_authenticated"
  on public.escape_session_details
  for select
  to authenticated
  using (true);

create policy "escape_session_details_mutate_session_owner"
  on public.escape_session_details
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
