import { normalizeAlias } from "@/domain/normalizeAlias"

const HEADER_ALIASES: Record<string, string[]> = {
  juego: ["juego", "game", "title"],
  expansion: ["expansión", "expansion"],
  fecha: ["fecha", "date"],
  vecesJugadas: ["veces jugadas", "times played", "plays"],
  ratio: ["ratio", "ratio (exito/fracaso)", "ratio (éxito/fracaso)", "resultado"],
  observaciones: ["observaciones", "notes", "notas"],
  personajes: ["personajes", "characters"],
  jugadores: ["jugadores", "players", "participantes"],
}

export function mapBoardGamesHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const header of headers) {
    const normalized = normalizeAlias(header)

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some(alias => normalizeAlias(alias) === normalized)) {
        mapping[field] = header
        break
      }
    }
  }

  return mapping
}

export function pickBoardGamesField(
  record: Record<string, string>,
  mapping: Record<string, string>,
  field: string,
): string {
  const header = mapping[field]
  if (!header) return ""
  return record[header] ?? ""
}
