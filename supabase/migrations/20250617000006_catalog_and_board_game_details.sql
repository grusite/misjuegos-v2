-- Phase 5: board game catalog

create table public.game_catalog (
  id uuid primary key default gen_random_uuid(),
  type public.game_type not null,
  title text not null,
  slug text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  source text,
  source_external_id text
);

create unique index game_catalog_external_unique_idx
  on public.game_catalog (type, source, source_external_id)
  where source is not null and source_external_id is not null;

create index game_catalog_type_title_idx
  on public.game_catalog (type, title);

comment on table public.game_catalog is
  'Shared catalog entries for board games and escape rooms.';

create table public.board_game_details (
  game_catalog_id uuid primary key
    references public.game_catalog (id) on delete cascade,
  bgg_id int,
  expansion_of_id uuid references public.game_catalog (id) on delete set null,
  min_players int,
  max_players int,
  playing_time_min int,
  thumbnail_url text,
  year_published int,
  raw_bgg jsonb
);

create index board_game_details_bgg_id_idx
  on public.board_game_details (bgg_id);

comment on table public.board_game_details is
  '1:1 board-game-specific metadata for game_catalog entries.';
