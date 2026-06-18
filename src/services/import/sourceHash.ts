import { normalizeAlias } from "@/domain/normalizeAlias"
import type { ParsedEscapeBabelRow } from "@/services/import/escapeBabelSchema"

const SOURCE_PREFIX = "escape-babel"

export function buildEscapeCatalogExternalId(
  city: string | null | undefined,
  venue: string | null | undefined,
  roomName: string | null | undefined,
): string {
  const key = [city, venue, roomName]
    .map(value => normalizeAlias(value ?? ""))
    .join("|")

  return `${SOURCE_PREFIX}:catalog:${hashValue(key)}`
}

export function buildEscapeSessionSourceHash(row: ParsedEscapeBabelRow): string {
  const key = [
    row.playedAt.slice(0, 10),
    normalizeAlias(row.ciudad ?? ""),
    normalizeAlias(row.sitio ?? ""),
    normalizeAlias(row.sala ?? ""),
    row.participantTokens.slice().sort().join(","),
  ].join("|")

  return `${SOURCE_PREFIX}:session:${hashValue(key)}`
}

function hashValue(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}
