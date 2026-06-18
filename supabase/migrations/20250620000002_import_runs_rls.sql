alter table public.import_runs enable row level security;
alter table public.import_errors enable row level security;

create policy "import_runs_select_own"
  on public.import_runs
  for select
  to authenticated
  using (created_by = auth.uid());

create policy "import_runs_insert_own"
  on public.import_runs
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "import_runs_update_own"
  on public.import_runs
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "import_errors_select_own"
  on public.import_errors
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.import_runs ir
      where ir.id = import_run_id
        and ir.created_by = auth.uid()
    )
  );

create policy "import_errors_insert_own"
  on public.import_errors
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.import_runs ir
      where ir.id = import_run_id
        and ir.created_by = auth.uid()
    )
  );
