-- Idempotent wishlist imports

alter table public.desired_games
  add column if not exists source text,
  add column if not exists source_hash text;

create unique index if not exists desired_games_source_hash_unique_idx
  on public.desired_games (created_by, source_hash)
  where source_hash is not null;

comment on column public.desired_games.source is
  'Import source label (e.g. escape-wishlist-sheet).';

comment on column public.desired_games.source_hash is
  'Stable hash for idempotent wishlist imports.';
