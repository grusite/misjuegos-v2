-- Phase 6: escape-room specific details

create table public.escape_room_details (
  game_catalog_id uuid primary key
    references public.game_catalog (id) on delete cascade,
  city text,
  venue text,
  room_name text,
  company text
);

create table public.escape_session_details (
  session_id uuid primary key
    references public.play_sessions (id) on delete cascade,
  clues_used int,
  time_result text,
  time_seconds int,
  price numeric,
  price_currency text not null default 'EUR',
  escaped boolean
);

comment on table public.escape_room_details is
  '1:1 metadata for escape-room catalog entries.';

comment on table public.escape_session_details is
  '1:1 metadata for escape-room play sessions.';
