import type { SupabaseClient } from "@supabase/supabase-js"
import type { ParticipantWithAliases } from "@/domain/types/participant"
import type { ImportRunSummary } from "@/domain/types/import"
import type { Json } from "@/domain/types/database"
import { parseEscapeBabelRecords } from "@/services/import/escapeBabelSchema"
import { csvRowsToRecords, parseCsv } from "@/services/import/parseCsv"
import { createImportParticipantResolver } from "@/services/import/importParticipantResolver"
import {
  buildEscapeCatalogExternalId,
  buildEscapeSessionSourceHash,
} from "@/services/import/sourceHash"
import { createImportRunsRepository } from "@/services/import/importRunsRepository"
import { createCatalogRepository } from "@/services/catalog/catalogRepository"
import { createParticipantsRepository } from "@/services/participants/participantsRepository"
import { createSessionsRepository } from "@/services/sessions/sessionsRepository"
import { createPlayerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"
import { bootstrapImportFriends } from "@/services/import/bootstrapImportFriends"
import type { BootstrapImportFriendsResult } from "@/services/import/bootstrapImportFriends"

import { parseBabelEscapeTime } from "@/services/import/parseBabelTime"
import type { AppDatabase } from "@/domain/types/schema"

export type EscapeBabelImportOptions = {
  csvContent: string
  fileName: string
  createdBy: string
  dryRun?: boolean
  bootstrapFriends?: boolean
}

export type EscapeBabelImportResult = {
  runId: string
  summary: ImportRunSummary
  dryRun: boolean
  bootstrap?: BootstrapImportFriendsResult
}

export async function importEscapeBabelCsv(
  client: SupabaseClient<AppDatabase>,
  options: EscapeBabelImportOptions,
): Promise<EscapeBabelImportResult> {
  const dryRun = options.dryRun ?? false
  const bootstrapFriends = options.bootstrapFriends ?? true
  const importRuns = createImportRunsRepository(client)
  const catalogRepository = createCatalogRepository(client)
  const sessionsRepository = createSessionsRepository(client)
  const participantsRepository = createParticipantsRepository(client)

  const records = csvRowsToRecords(parseCsv(options.csvContent))
  const parsedRows = parseEscapeBabelRecords(records)

  let bootstrapResult: BootstrapImportFriendsResult | undefined

  if (bootstrapFriends && !dryRun) {
    bootstrapResult = await bootstrapImportFriends(
      client,
      options.createdBy,
      parsedRows,
    )
  }

  const participants = await participantsRepository.listForOwnerWithAliases(
    options.createdBy,
  )
  const playerTeams = createPlayerTeamsRepository(client)
  const teams = await playerTeams.listForOwner(options.createdBy)
  const resolver = createImportParticipantResolver(participants, teams)

  const summary: ImportRunSummary = {
    imported: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
  }

  const run = dryRun
    ? {
        id: "dry-run",
        dryRun: true,
      }
    : await importRuns.create({
        fileName: options.fileName,
        createdBy: options.createdBy,
        dryRun,
        rowsTotal: parsedRows.length,
      })

  async function recordError(
    rowNumber: number,
    message: string,
    fieldName?: string | null,
    rowRaw?: Record<string, string>,
  ) {
    summary.failed += 1

    if (!dryRun && run.id !== "dry-run") {
      await importRuns.addError({
        importRunId: run.id,
        rowNumber,
        fieldName: fieldName ?? null,
        message,
        rowRaw: rowRaw as Json,
      })
    }
  }

  for (const [index, row] of parsedRows.entries()) {
    const rowNumber = index + 2

    try {
      const sourceHash = buildEscapeSessionSourceHash(row)
      const existing = await sessionsRepository.getBySourceHash(sourceHash)

      if (existing) {
        summary.skipped += 1
        continue
      }

      const { participantIds, playerTeamId, unresolved } = resolver.resolveMany(
        row.participantTokens,
      )

      if (unresolved.length > 0) {
        const message = `Participantes no encontrados: ${unresolved.join(", ")}`
        summary.warnings.push(`Fila ${rowNumber}: ${message}`)

        if (!dryRun && run.id !== "dry-run") {
          await importRuns.addError({
            importRunId: run.id,
            rowNumber,
            fieldName: "participantes",
            message,
            rowRaw: row.sourceRaw as Json,
          })
        }
      }

      if (dryRun) {
        summary.imported += 1
        continue
      }

      const catalogExternalId = buildEscapeCatalogExternalId(
        row.ciudad,
        row.sitio,
        row.sala,
      )

      let catalogId: string | null = null
      const existingCatalog = await catalogRepository.findByExternalId(
        "escape_room",
        "escape-babel",
        catalogExternalId,
      )

      if (existingCatalog) {
        catalogId = existingCatalog.id
      } else {
        const createdCatalog = await catalogRepository.createEscapeRoom({
          title: row.sala ?? "Sin nombre",
          createdBy: options.createdBy,
          city: row.ciudad,
          venue: row.sitio,
          roomName: row.sala ?? "Sin nombre",
          source: "escape-babel",
          sourceExternalId: catalogExternalId,
        })

        catalogId = createdCatalog.id
      }

      if (!catalogId) {
        throw new Error("No se pudo crear el catálogo de escape")
      }

      const session = await sessionsRepository.create({
        gameCatalogId: catalogId,
        createdBy: options.createdBy,
        playerTeamId,
        playedAt: row.playedAt,
        status: "completed",
        outcome: row.outcome,
        notes: row.notas ?? null,
        source: "escape-babel",
        sourceHash,
        sourceRaw: row.sourceRaw as Json,
      })

      const parsedTime = parseBabelEscapeTime(row.tiempo)

      await sessionsRepository.upsertEscapeSessionDetails(session.id, {
        cluesUsed: row.cluesUsed ?? null,
        timeResult: parsedTime.timeResult || row.tiempo || null,
        timeSeconds: row.timeSeconds,
        price: row.price,
        priceCurrency: "EUR",
        escaped: row.escaped,
      })

      if (participantIds.length > 0) {
        await sessionsRepository.setParticipants(
          session.id,
          participantIds.map((participantId: string) => ({ participantId })),
        )
      }

      summary.imported += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido al importar fila"

      await recordError(rowNumber, message, null, row.sourceRaw)
    }
  }

  if (!dryRun && run.id !== "dry-run") {
    await importRuns.update(run.id, {
      status: summary.failed > 0 ? "completed" : "completed",
      completedAt: new Date().toISOString(),
      rowsImported: summary.imported,
      rowsSkipped: summary.skipped,
      rowsFailed: summary.failed,
      summary: {
        ...summary,
        bootstrap: bootstrapResult
          ? {
              participantsCreated: bootstrapResult.participantsCreated,
              aliasesAdded: bootstrapResult.aliasesAdded,
              teamsCreated: bootstrapResult.teamsCreated,
              friendCount: bootstrapResult.friendKeys.length,
            }
          : undefined,
      } as Json,
    })
  }

  return {
    runId: run.id,
    summary: {
      ...summary,
      bootstrap: bootstrapResult
        ? {
            participantsCreated: bootstrapResult.participantsCreated,
            aliasesAdded: bootstrapResult.aliasesAdded,
            teamsCreated: bootstrapResult.teamsCreated,
            friendCount: bootstrapResult.friendKeys.length,
          }
        : undefined,
    },
    dryRun,
    bootstrap: bootstrapResult,
  }
}

export type { ParticipantWithAliases }
