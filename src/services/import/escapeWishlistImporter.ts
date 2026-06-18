import type { SupabaseClient } from "@supabase/supabase-js"
import type { ImportRunSummary } from "@/domain/types/import"
import type { Json } from "@/domain/types/database"
import { csvRowsToRecords, parseCsv } from "@/services/import/parseCsv"
import { parseWishlistCsvRecords } from "@/services/import/escapeWishlistSchema"
import { buildWishlistSourceHash } from "@/services/import/parseEscapeWishlist"
import { createImportRunsRepository } from "@/services/import/importRunsRepository"
import { createDesiredGamesRepository } from "@/services/desiredGames/desiredGamesRepository"
import type { AppDatabase } from "@/domain/types/schema"

export type EscapeWishlistImportOptions = {
  csvContent: string
  fileName: string
  createdBy: string
  dryRun?: boolean
}

export type EscapeWishlistImportResult = {
  runId: string
  summary: ImportRunSummary
  dryRun: boolean
}

export async function importEscapeWishlistCsv(
  client: SupabaseClient<AppDatabase>,
  options: EscapeWishlistImportOptions,
): Promise<EscapeWishlistImportResult> {
  const dryRun = options.dryRun ?? false
  const importRuns = createImportRunsRepository(client)
  const desiredGamesRepository = createDesiredGamesRepository(client)

  const records = csvRowsToRecords(parseCsv(options.csvContent))
  const parsedRows = parseWishlistCsvRecords(records)

  const summary: ImportRunSummary = {
    imported: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
  }

  const run = dryRun
    ? { id: "dry-run", dryRun: true }
    : await importRuns.create({
        fileName: options.fileName,
        createdBy: options.createdBy,
        dryRun,
        rowsTotal: parsedRows.length,
      })

  async function recordError(
    rowNumber: number,
    message: string,
    rowRaw?: Record<string, string>,
  ) {
    summary.failed += 1

    if (!dryRun && run.id !== "dry-run") {
      await importRuns.addError({
        importRunId: run.id,
        rowNumber,
        fieldName: null,
        message,
        rowRaw: rowRaw as Json,
      })
    }
  }

  for (const [index, row] of parsedRows.entries()) {
    const rowNumber = index + 2

    try {
      const sourceHash = buildWishlistSourceHash({
        title: row.title,
        company: row.company,
        city: row.city,
        bookingUrl: row.bookingUrl,
      })

      if (!dryRun) {
        const existing = await desiredGamesRepository.getBySourceHash(
          options.createdBy,
          sourceHash,
        )

        if (existing) {
          summary.skipped += 1
          continue
        }
      }

      if (dryRun) {
        summary.imported += 1
        continue
      }

      await desiredGamesRepository.create(options.createdBy, {
        type: "escape_room",
        title: row.title,
        company: row.company ?? null,
        city: row.city ?? null,
        venue: row.venue ?? null,
        bookingUrl: row.bookingUrl ?? null,
        notes: row.notes ?? null,
        source: "escape-wishlist",
        sourceHash,
      })

      summary.imported += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido al importar fila"

      await recordError(rowNumber, message, row.sourceRaw)
    }
  }

  if (!dryRun && run.id !== "dry-run") {
    await importRuns.update(run.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      rowsImported: summary.imported,
      rowsSkipped: summary.skipped,
      rowsFailed: summary.failed,
      summary: summary as Json,
    })
  }

  return {
    runId: run.id,
    summary,
    dryRun,
  }
}
