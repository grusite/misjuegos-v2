-- Allow authenticated users to self-bootstrap profile rows client-side if needed.
-- This complements the auth.users trigger and avoids FK failures after local resets
-- with stale sessions.

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);
