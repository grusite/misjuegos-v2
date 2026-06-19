-- Phase 15: personal 1–5 star ratings for escape play sessions

alter table public.escape_session_details
  add column if not exists rating smallint
    check (rating is null or (rating >= 1 and rating <= 5)),
  add column if not exists rating_note text;

comment on column public.escape_session_details.rating is
  'Personal 1–5 star rating for the escape room experience.';

comment on column public.escape_session_details.rating_note is
  'Optional short note about the rating.';
