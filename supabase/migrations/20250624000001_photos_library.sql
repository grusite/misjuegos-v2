-- Allow photos in a shared library before they are linked to a session

alter table public.photos
  alter column session_id drop not null;

create index photos_created_at_desc_idx on public.photos (created_at desc);

create index photos_unassigned_idx on public.photos (created_at desc)
  where session_id is null;

comment on column public.photos.session_id is
  'Null = photo lives in the shared library until linked to a play session.';
