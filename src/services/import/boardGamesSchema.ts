import { z } from "zod"
import { parseParticipantes } from "@/services/import/parseParticipantes"
import { BABEL_4_TEAM_TOKEN } from "@/services/import/importTeams"
import { parseSpanishDate } from "@/services/import/escapeBabelSchema"
import {
  expandBoardGameOutcomes,
  parseBoardGameRatio,
  parsePlayCount,
} from "@/services/import/parseBoardGameRatio"
import {
  mapBoardGamesHeaders,
  pickBoardGamesField,
} from "@/services/import/boardGamesHeaders"
import type { SessionOutcome } from "@/domain/types/rows"

export const BOARD_GAMES_DEFAULT_DATE = "2023-04-20"

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export const boardGameRowSchema = z.object({
  juego: z.string().min(1, "Juego obligatorio"),
  expansion: z.string().optional(),
  fecha: z.preprocess(emptyToUndefined, z.string().optional()),
  vecesJugadas: z.preprocess(emptyToUndefined, z.string().optional()),
  ratio: z.preprocess(emptyToUndefined, z.string().optional()),
  observaciones: z.string().optional(),
  personajes: z.string().optional(),
  jugadores: z.preprocess(emptyToUndefined, z.string().optional()),
})

export type BoardGameRow = z.infer<typeof boardGameRowSchema>

export type ParsedBoardGameRow = BoardGameRow & {
  playedAt: string
  playCount: number
  outcomes: SessionOutcome[]
  participantTokens: string[]
  sourceRaw: Record<string, string>
}

export function recordToBoardGameRow(
  record: Record<string, string>,
  mapping: Record<string, string>,
): BoardGameRow {
  return boardGameRowSchema.parse({
    juego: pickBoardGamesField(record, mapping, "juego"),
    expansion: pickBoardGamesField(record, mapping, "expansion"),
    fecha: pickBoardGamesField(record, mapping, "fecha"),
    vecesJugadas: pickBoardGamesField(record, mapping, "vecesJugadas"),
    ratio: pickBoardGamesField(record, mapping, "ratio"),
    observaciones: pickBoardGamesField(record, mapping, "observaciones"),
    personajes: pickBoardGamesField(record, mapping, "personajes"),
    jugadores: pickBoardGamesField(record, mapping, "jugadores"),
  })
}

export function parseBoardGameRecords(
  records: Array<Record<string, string>>,
): ParsedBoardGameRow[] {
  if (records.length === 0) return []

  const mapping = mapBoardGamesHeaders(Object.keys(records[0]))

  return records.map(record => {
    const row = recordToBoardGameRow(record, mapping)
    const playCount = parsePlayCount(row.vecesJugadas)
    const ratio = parseBoardGameRatio(row.ratio)
    const jugadores = (row.jugadores ?? "").trim()
    const participantTokens = jugadores
      ? parseParticipantes(jugadores)
      : [BABEL_4_TEAM_TOKEN]

    return {
      ...row,
      playedAt: row.fecha
        ? parseSpanishDate(row.fecha)
        : parseSpanishDate(BOARD_GAMES_DEFAULT_DATE),
      playCount,
      outcomes: expandBoardGameOutcomes(playCount, ratio),
      participantTokens,
      sourceRaw: record,
    }
  })
}
