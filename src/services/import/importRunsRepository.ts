import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  ImportError,
  ImportRun,
  ImportSource,
  ImportStatus,
} from "@/domain/types/import"
import type { Json } from "@/domain/types/database"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable } from "@/services/errors"

type ImportRunRow = {
  id: string
  source: ImportSource
  status: ImportStatus
  file_name: string | null
  created_by: string
  started_at: string
  completed_at: string | null
  rows_total: number
  rows_imported: number
  rows_skipped: number
  rows_failed: number
  dry_run: boolean
  summary: Json | null
  created_at: string
}

type ImportErrorRow = {
  id: string
  import_run_id: string
  row_number: number
  field_name: string | null
  message: string
  row_raw: Json | null
  created_at: string
}

function mapImportRun(row: ImportRunRow): ImportRun {
  return {
    id: row.id,
    source: row.source,
    status: row.status,
    fileName: row.file_name,
    createdBy: row.created_by,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    rowsTotal: row.rows_total,
    rowsImported: row.rows_imported,
    rowsSkipped: row.rows_skipped,
    rowsFailed: row.rows_failed,
    dryRun: row.dry_run,
    summary: row.summary,
    createdAt: row.created_at,
  }
}

function mapImportError(row: ImportErrorRow): ImportError {
  return {
    id: row.id,
    importRunId: row.import_run_id,
    rowNumber: row.row_number,
    fieldName: row.field_name,
    message: row.message,
    rowRaw: row.row_raw,
    createdAt: row.created_at,
  }
}

export type CreateImportRunInput = {
  source?: ImportSource
  fileName?: string | null
  createdBy: string
  dryRun?: boolean
  rowsTotal?: number
}

export type UpdateImportRunInput = {
  status?: ImportStatus
  completedAt?: string | null
  rowsImported?: number
  rowsSkipped?: number
  rowsFailed?: number
  summary?: Json | null
}

export type CreateImportErrorInput = {
  importRunId: string
  rowNumber: number
  fieldName?: string | null
  message: string
  rowRaw?: Json | null
}

export function createImportRunsRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async create(input: CreateImportRunInput): Promise<ImportRun> {
      const result = await client
        .from("import_runs")
        .insert({
          source: input.source ?? "google_sheets",
          status: "running",
          file_name: input.fileName ?? null,
          created_by: input.createdBy,
          dry_run: input.dryRun ?? false,
          rows_total: input.rowsTotal ?? 0,
        })
        .select("*")
        .single()

      return mapImportRun(unwrap(result) as ImportRunRow)
    },

    async update(id: string, input: UpdateImportRunInput): Promise<ImportRun> {
      const result = await client
        .from("import_runs")
        .update({
          ...(input.status !== undefined && { status: input.status }),
          ...(input.completedAt !== undefined && { completed_at: input.completedAt }),
          ...(input.rowsImported !== undefined && { rows_imported: input.rowsImported }),
          ...(input.rowsSkipped !== undefined && { rows_skipped: input.rowsSkipped }),
          ...(input.rowsFailed !== undefined && { rows_failed: input.rowsFailed }),
          ...(input.summary !== undefined && { summary: input.summary }),
        })
        .eq("id", id)
        .select("*")
        .single()

      return mapImportRun(unwrap(result) as ImportRunRow)
    },

    async getLatestForUser(userId: string): Promise<ImportRun | null> {
      const result = await client
        .from("import_runs")
        .select("*")
        .eq("created_by", userId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const row = unwrapNullable(result) as ImportRunRow | null
      return row ? mapImportRun(row) : null
    },

    async listErrors(importRunId: string): Promise<ImportError[]> {
      const result = await client
        .from("import_errors")
        .select("*")
        .eq("import_run_id", importRunId)
        .order("row_number")

      return (unwrap(result) as ImportErrorRow[]).map(mapImportError)
    },

    async addError(input: CreateImportErrorInput): Promise<ImportError> {
      const result = await client
        .from("import_errors")
        .insert({
          import_run_id: input.importRunId,
          row_number: input.rowNumber,
          field_name: input.fieldName ?? null,
          message: input.message,
          row_raw: input.rowRaw ?? null,
        })
        .select("*")
        .single()

      return mapImportError(unwrap(result) as ImportErrorRow)
    },
  }
}

export const importRunsRepository = createImportRunsRepository(supabase)
