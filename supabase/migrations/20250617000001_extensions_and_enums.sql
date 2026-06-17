-- MisJuegos v2 — shared enums (used from Phase 4+). Created in Phase 1 for stable type generation.

create type public.game_type as enum ('board_game', 'escape_room');

create type public.session_status as enum (
  'planned',
  'in_progress',
  'completed',
  'abandoned'
);

create type public.session_outcome as enum (
  'win',
  'loss',
  'draw',
  'unknown',
  'escaped',
  'failed'
);

create type public.import_source as enum ('google_sheets', 'google_drive', 'manual');

create type public.import_status as enum ('pending', 'running', 'completed', 'failed');

create type public.photo_source as enum ('upload', 'google_drive', 'import');
