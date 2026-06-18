-- Board game expansion name + per-session character/role picks

alter table public.board_game_details
  add column if not exists expansion text;

comment on column public.board_game_details.expansion is
  'Optional expansion name for this catalog entry.';

create table public.board_session_details (
  session_id uuid primary key
    references public.play_sessions (id) on delete cascade,
  players text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.board_session_details is
  '1:1 board-session metadata (co-op character picks, etc.).';

comment on column public.board_session_details.players is
  'Optional in-game characters or roles selected by participants.';

alter table public.board_session_details enable row level security;

create policy "board_session_details_select_authenticated"
  on public.board_session_details
  for select
  to authenticated
  using (true);

create policy "board_session_details_mutate_session_owner"
  on public.board_session_details
  for all
  to authenticated
  using (
    exists (
      select 1 from public.play_sessions s
      where s.id = session_id and s.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.play_sessions s
      where s.id = session_id and s.created_by = auth.uid()
    )
  );
