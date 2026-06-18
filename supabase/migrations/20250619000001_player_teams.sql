-- Phase 9: reusable player teams for fast session setup

create table public.player_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  photo_path text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.player_teams (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  unique (team_id, participant_id)
);

create index player_teams_created_by_idx on public.player_teams (created_by);
create index player_team_members_team_id_idx on public.player_team_members (team_id);
create index player_team_members_participant_id_idx on public.player_team_members (participant_id);

create trigger player_teams_set_updated_at
  before update on public.player_teams
  for each row
  execute function public.set_updated_at();

comment on table public.player_teams is
  'Reusable groups of participants for quick session setup.';

comment on table public.player_team_members is
  'Participants belonging to a player team.';
