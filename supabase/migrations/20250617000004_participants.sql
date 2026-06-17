-- participants: friends without (or before) an account

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  display_name text not null,
  color text,
  created_at timestamptz not null default now()
);

create index participants_owner_id_idx on public.participants (owner_id);
create index participants_display_name_idx on public.participants (display_name);

comment on table public.participants is
  'Non-account players managed by owner_id. Linked via profile_id when they sign up.';

-- participant_aliases: normalized names for import matching

create table public.participant_aliases (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  alias text not null,
  source text,
  unique (participant_id, alias)
);

create index participant_aliases_alias_idx on public.participant_aliases (alias);

comment on table public.participant_aliases is
  'Import/manual alias strings (normalized) for resolving spreadsheet names.';
