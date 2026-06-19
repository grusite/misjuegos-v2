-- Allow linking library photos to sessions / wishlist (UPDATE session_id, desired_game_id)

create policy "photos_update_authenticated"
  on public.photos
  for update
  to authenticated
  using (true)
  with check (true);
