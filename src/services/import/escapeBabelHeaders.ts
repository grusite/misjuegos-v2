import { normalizeAlias } from "@/domain/normalizeAlias"

const FIELD_ALIASES: Record<string, string[]> = {
  fecha: ["fecha", "date"],
  ciudad: ["ciudad", "city"],
  sitio: ["sitio", "venue", "local"],
  sala: ["sala", "room", "room name", "nombre"],
  resultado: ["resultado", "result", "outcome"],
  participantes: ["participantes", "players", "jugadores"],
  cluesUsed: ["n pistas", "pistas", "clues", "n_pistas"],
  tiempo: ["tiempo", "time"],
  precio: ["precio", "price"],
  notas: ["notas", "notes"],
  mes: ["mes", "month"],
  anio: ["año", "ano", "year"],
  si: ["si", "sí", "yes"],
  no: ["no"],
}

function normalizeHeader(value: string): string {
  return normalizeAlias(value).replace(/\s+/g, " ")
}

export function mapEscapeBabelHeaders(
  headers: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header)

    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.some(alias => normalizedHeader === normalizeHeader(alias))) {
        mapping[field] = header
        break
      }
    }
  }

  return mapping
}

export function pickMappedField(
  record: Record<string, string>,
  mapping: Record<string, string>,
  field: string,
): string {
  const header = mapping[field]
  if (!header) return ""
  return (record[header] ?? "").trim()
}
