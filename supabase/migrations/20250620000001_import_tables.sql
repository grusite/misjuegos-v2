-- Phase 10: track one-time CSV / Sheets imports

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source public.import_source not null default 'google_sheets',
  status public.import_status not null default 'pending',
  file_name text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  rows_total int not null default 0,
  rows_imported int not null default 0,
  rows_skipped int not null default 0,
  rows_failed int not null default 0,
  dry_run boolean not null default false,
  summary jsonb,
  created_at timestamptz not null default now()
);

create table public.import_errors (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.import_runs (id) on delete cascade,
  row_number int not null,
  field_name text,
  message text not null,
  row_raw jsonb,
  created_at timestamptz not null default now()
);

create index import_runs_created_by_idx on public.import_runs (created_by);
create index import_runs_started_at_idx on public.import_runs (started_at desc);
create index import_errors_run_id_idx on public.import_errors (import_run_id);

comment on table public.import_runs is
  'Audit log for historical data imports (Escape Babel CSV, etc.).';

comment on table public.import_errors is
  'Per-row validation or resolution failures during an import run.';
