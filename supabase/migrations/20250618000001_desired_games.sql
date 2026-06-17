-- Phase 8: personal wishlist for board games and escape rooms

create type public.desired_game_status as enum ('active', 'played', 'dropped');

create table public.desired_games (
  id uuid primary key default gen_random_uuid(),
  type public.game_type not null,
  title text not null,
  notes text,
  priority smallint check (priority is null or priority between 1 and 3),
  city text,
  venue text,
  company text,
  booking_url text,
  bgg_id int,
  game_catalog_id uuid references public.game_catalog (id) on delete set null,
  status public.desired_game_status not null default 'active',
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index desired_games_created_by_idx on public.desired_games (created_by);
create index desired_games_type_idx on public.desired_games (type);
create index desired_games_status_idx on public.desired_games (status);

create trigger desired_games_set_updated_at
  before update on public.desired_games
  for each row
  execute function public.set_updated_at();

comment on table public.desired_games is
  'Personal want-to-play list; separate from game_catalog and play_sessions.';
