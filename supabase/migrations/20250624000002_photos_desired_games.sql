-- Link photos to wishlist items (Quiero jugar) as well as play sessions

alter table public.photos
  add column if not exists desired_game_id uuid references public.desired_games (id) on delete set null;

alter table public.photos
  add constraint photos_single_link_check
  check (not (session_id is not null and desired_game_id is not null));

create index photos_desired_game_id_sort_idx
  on public.photos (desired_game_id, sort_order, created_at)
  where desired_game_id is not null;

drop index if exists public.photos_unassigned_idx;

create index photos_unassigned_idx on public.photos (created_at desc)
  where session_id is null and desired_game_id is null;

comment on column public.photos.desired_game_id is
  'Optional link to a wishlist entry (desired_games). Mutually exclusive with session_id.';
