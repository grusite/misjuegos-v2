import { normalizeAlias } from "@/domain/normalizeAlias"
import {
  BABEL_4_TEAM_TOKEN,
  PRIMOS_TEAM_TOKEN,
  isImportTeamToken,
} from "@/services/import/importTeams"

const STOPWORDS = new Set([
  "otros",
  "otro",
  "otra",
  "con",
  "sus",
  "respectivas",
  "en",
  "modo",
  "reto",
  "novia",
  "hermana",
  "amigas",
  "amiga",
  "de",
  "sin",
  "pedirlas",
  "y",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "del",
  "al",
  "por",
  "que",
])

export { BABEL_4_TEAM_TOKEN, PRIMOS_TEAM_TOKEN }

export function parseParticipantes(raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  if (/^primos(\s*\([^)]*\))?\s*$/i.test(trimmed)) {
    return [PRIMOS_TEAM_TOKEN]
  }

  const tokens: string[] = []

  if (containsBabelTeam(trimmed)) {
    tokens.push(BABEL_4_TEAM_TOKEN)
  }

  let working = trimmed
  working = working.replace(/^babel\s*4\s*/i, "").trim()

  working = working.replace(/\([^)]*\)/g, match => {
    if (match.includes(",")) {
      return ` ${match.slice(1, -1).replace(/,/g, " ")} `
    }
    return " "
  })

  const segments = working
    .split(/[,;]+|\s+y\s+|\s+and\s+/i)
    .map(segment => segment.trim())
    .filter(Boolean)

  for (const segment of segments) {
    if (isBabelTeam(segment) || isPrimosTeam(segment)) continue

    const segmentTokens = tokenizeSegment(segment)
    for (const token of segmentTokens) {
      if (isImportTeamToken(token)) continue
      if (!tokens.includes(token)) {
        tokens.push(token)
      }
    }
  }

  if (tokens.length === 0) {
    if (isBabelTeam(trimmed)) return [BABEL_4_TEAM_TOKEN]
  }

  return tokens
}

function containsBabelTeam(value: string): boolean {
  return /\bbabel\s*4\b/i.test(value)
}

function isBabelTeam(value: string): boolean {
  return normalizeAlias(value) === BABEL_4_TEAM_TOKEN
}

function isPrimosTeam(value: string): boolean {
  return normalizeAlias(value) === PRIMOS_TEAM_TOKEN
}

function tokenizeSegment(segment: string): string[] {
  const words = segment
    .split(/\s+/)
    .map(word => word.replace(/[()."']/g, "").trim())
    .filter(Boolean)

  const filtered = words.filter(word => {
    const normalized = normalizeAlias(word)
    if (STOPWORDS.has(normalized)) return false
    if (/^\d+$/.test(normalized)) return false
    return normalized.length >= 2
  })

  return filtered.map(word => normalizeAlias(word))
}

export function collectParticipanteTokens(values: string[]): {
  people: string[]
  teams: string[]
} {
  const people = new Set<string>()
  const teams = new Set<string>()

  for (const value of values) {
    for (const token of parseParticipantes(value)) {
      if (token === BABEL_4_TEAM_TOKEN) {
        teams.add("Babel 4")
      } else if (token === PRIMOS_TEAM_TOKEN) {
        teams.add("Primos")
      } else {
        people.add(token)
      }
    }
  }

  return {
    people: [...people].sort((left, right) => left.localeCompare(right, "es")),
    teams: [...teams].sort((left, right) => left.localeCompare(right, "es")),
  }
}
