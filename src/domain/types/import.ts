import type { Json } from "./database"

export type ImportSource = "google_sheets" | "google_drive" | "manual"
export type ImportStatus = "pending" | "running" | "completed" | "failed"

export type ImportRun = {
  id: string
  source: ImportSource
  status: ImportStatus
  fileName: string | null
  createdBy: string
  startedAt: string
  completedAt: string | null
  rowsTotal: number
  rowsImported: number
  rowsSkipped: number
  rowsFailed: number
  dryRun: boolean
  summary: Json | null
  createdAt: string
}

export type ImportError = {
  id: string
  importRunId: string
  rowNumber: number
  fieldName: string | null
  message: string
  rowRaw: Json | null
  createdAt: string
}

export type ImportRunSummary = {
  imported: number
  skipped: number
  failed: number
  warnings: string[]
  bootstrap?: {
    participantsCreated: number
    aliasesAdded: number
    teamsCreated: number
    friendCount: number
  }
}
