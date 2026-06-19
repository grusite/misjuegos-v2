-- Phase 13: session photos + Storage bucket

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.play_sessions (id) on delete cascade,
  storage_path text not null,
  source public.photo_source not null default 'upload',
  source_file_id text,
  caption text,
  sort_order int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index photos_session_id_sort_idx on public.photos (session_id, sort_order, created_at);
create unique index photos_storage_path_unique on public.photos (storage_path);

alter table public.photos enable row level security;

create policy "photos_select_authenticated"
  on public.photos
  for select
  to authenticated
  using (true);

create policy "photos_insert_own"
  on public.photos
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "photos_delete_own"
  on public.photos
  for delete
  to authenticated
  using (created_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-photos',
  'session-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "session_photos_select"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'session-photos');

create policy "session_photos_insert_own_folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'session-photos'
    and auth.uid()::text = (storage.foldername (name))[1]
  );

create policy "session_photos_delete_own_folder"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'session-photos'
    and auth.uid()::text = (storage.foldername (name))[1]
  );
