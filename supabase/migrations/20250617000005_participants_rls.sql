-- RLS: owner manages their participants and aliases

alter table public.participants enable row level security;

create policy "participants_select_own"
  on public.participants
  for select
  to authenticated
  using (owner_id = auth.uid());

create policy "participants_insert_own"
  on public.participants
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "participants_update_own"
  on public.participants
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "participants_delete_own"
  on public.participants
  for delete
  to authenticated
  using (owner_id = auth.uid());

alter table public.participant_aliases enable row level security;

create policy "participant_aliases_select_own"
  on public.participant_aliases
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.participants p
      where p.id = participant_id
        and p.owner_id = auth.uid()
    )
  );

create policy "participant_aliases_insert_own"
  on public.participant_aliases
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.participants p
      where p.id = participant_id
        and p.owner_id = auth.uid()
    )
  );

create policy "participant_aliases_delete_own"
  on public.participant_aliases
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.participants p
      where p.id = participant_id
        and p.owner_id = auth.uid()
    )
  );
