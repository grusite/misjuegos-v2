-- Attach photos to session chat messages (distinct from session gallery photos)

alter table public.photos
  add column message_id uuid null references public.session_messages (id) on delete cascade;

alter table public.photos
  add constraint photos_message_requires_session
  check (message_id is null or session_id is not null);

create index photos_message_id_idx on public.photos (message_id)
  where message_id is not null;

create index photos_session_gallery_idx on public.photos (session_id, sort_order, created_at)
  where session_id is not null and message_id is null;

comment on column public.photos.message_id is
  'When set, the photo is shown on that chat message (session_id must also be set).';
