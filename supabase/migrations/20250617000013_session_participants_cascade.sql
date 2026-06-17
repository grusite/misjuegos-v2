-- Deleting a participant should remove dependent rows, not null both FKs.

alter table public.session_participants
  drop constraint if exists session_participants_participant_id_fkey;

alter table public.session_participants
  add constraint session_participants_participant_id_fkey
  foreign key (participant_id)
  references public.participants (id)
  on delete cascade;

alter table public.board_game_scores
  drop constraint if exists board_game_scores_participant_id_fkey;

alter table public.board_game_scores
  add constraint board_game_scores_participant_id_fkey
  foreign key (participant_id)
  references public.participants (id)
  on delete cascade;
