import { z } from "zod"
import { parseCluesUsed } from "@/services/import/parseCluesUsed"
import { parseBabelEscapeTime } from "@/services/import/parseBabelTime"
import { parseParticipantes } from "@/services/import/parseParticipantes"
import {
  mapEscapeBabelHeaders,
  pickMappedField,
} from "@/services/import/escapeBabelHeaders"

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export const escapeBabelRowSchema = z.object({
  fecha: z.string().min(1, "Fecha obligatoria"),
  ciudad: z.string().optional(),
  sitio: z.string().optional(),
  sala: z.string().optional(),
  resultado: z.string().optional(),
  participantes: z.string().optional(),
  cluesUsed: z.preprocess(emptyToUndefined, z.string().optional()),
  tiempo: z.string().optional(),
  precio: z.preprocess(emptyToUndefined, z.string().optional()),
  notas: z.string().optional(),
})

export type EscapeBabelRow = z.infer<typeof escapeBabelRowSchema>

export type ParsedEscapeBabelRow = Omit<EscapeBabelRow, "cluesUsed"> & {
  playedAt: string
  escaped: boolean | null
  outcome: "escaped" | "failed" | "unknown"
  timeSeconds: number | null
  cluesUsed: number | null
  price: number | null
  participantTokens: string[]
  sourceRaw: Record<string, string>
}

export function recordToEscapeBabelRow(
  record: Record<string, string>,
  mapping: Record<string, string>,
): EscapeBabelRow {
  const sala = pickMappedField(record, mapping, "sala").trim()
  const sitio = pickMappedField(record, mapping, "sitio").trim()

  return escapeBabelRowSchema.parse({
    fecha: pickMappedField(record, mapping, "fecha"),
    ciudad: pickMappedField(record, mapping, "ciudad"),
    sitio,
    sala: sala || sitio || "Sin nombre",
    resultado: pickMappedField(record, mapping, "resultado"),
    participantes: pickMappedField(record, mapping, "participantes"),
    cluesUsed: pickMappedField(record, mapping, "cluesUsed"),
    tiempo: pickMappedField(record, mapping, "tiempo"),
    precio: pickMappedField(record, mapping, "precio"),
    notas: pickMappedField(record, mapping, "notas"),
  })
}

export function parseEscapeBabelRecords(
  records: Array<Record<string, string>>,
): ParsedEscapeBabelRow[] {
  if (records.length === 0) return []

  const mapping = mapEscapeBabelHeaders(Object.keys(records[0]))

  return records.map(record => {
    const row = recordToEscapeBabelRow(record, mapping)
    const escaped = parseEscaped(row.resultado)
    const parsedTime = parseBabelEscapeTime(row.tiempo)

    return {
      ...row,
      playedAt: parseSpanishDate(row.fecha),
      escaped: escaped.escaped,
      outcome: escaped.outcome,
      timeSeconds: parsedTime.timeSeconds,
      cluesUsed: parseCluesUsed(row.cluesUsed),
      price: row.precio ? parsePrice(row.precio) : null,
      participantTokens: parseParticipantes(row.participantes ?? ""),
      sourceRaw: record,
    }
  })
}

export function parseSpanishDate(value: string): string {
  const trimmed = value.trim()

  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(trimmed)
  if (slashMatch) {
    const day = Number.parseInt(slashMatch[1], 10)
    const month = Number.parseInt(slashMatch[2], 10)
    let year = Number.parseInt(slashMatch[3], 10)
    if (year < 100) year += 2000

    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
  }

  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  throw new Error(`Fecha no válida: ${value}`)
}

export function parsePrice(value: string): number | null {
  const normalized = value
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .trim()

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseEscaped(resultado: string | undefined): {
  escaped: boolean | null
  outcome: "escaped" | "failed" | "unknown"
} {
  const text = normalizeResultado(resultado)

  if (text === "si" || text === "sí") {
    return { escaped: true, outcome: "escaped" }
  }

  if (text === "no") {
    return { escaped: false, outcome: "failed" }
  }

  if (/(no escap|fall|perd|fail)/.test(text)) {
    return { escaped: false, outcome: "failed" }
  }

  if (/(escap|super|complet|yes|win)/.test(text)) {
    return { escaped: true, outcome: "escaped" }
  }

  return { escaped: null, outcome: "unknown" }
}

function normalizeResultado(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
}

/** @deprecated Use parseParticipantes */
export function splitParticipantNames(value: string): string[] {
  return parseParticipantes(value)
}
