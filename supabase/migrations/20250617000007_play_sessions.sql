-- Phase 5: sessions and participants in sessions

create table public.play_sessions (
  id uuid primary key default gen_random_uuid(),
  game_catalog_id uuid not null references public.game_catalog (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete cascade,
  played_at timestamptz not null,
  status public.session_status not null default 'planned',
  outcome public.session_outcome,
  duration_ms int not null default 0,
  is_paused boolean not null default false,
  last_started_at timestamptz,
  ended_at timestamptz,
  notes text,
  source text,
  source_hash text unique,
  source_raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index play_sessions_played_at_idx
  on public.play_sessions (played_at desc);

create index play_sessions_game_catalog_idx
  on public.play_sessions (game_catalog_id);

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.play_sessions (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  participant_id uuid references public.participants (id) on delete set null,
  constraint session_participants_profile_or_participant_check
    check (profile_id is not null or participant_id is not null)
);

create index session_participants_session_idx
  on public.session_participants (session_id);
