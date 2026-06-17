-- Phase 5 required tables: session messages and board-game scores

create table public.session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.play_sessions (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index session_messages_session_created_idx
  on public.session_messages (session_id, created_at);

create table public.board_game_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.play_sessions (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  participant_id uuid references public.participants (id) on delete set null,
  score numeric,
  rank int,
  is_winner boolean,
  constraint board_game_scores_profile_or_participant_check
    check (profile_id is not null or participant_id is not null)
);

create index board_game_scores_session_idx
  on public.board_game_scores (session_id);
