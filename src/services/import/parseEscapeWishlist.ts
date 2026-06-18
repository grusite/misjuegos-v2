import { normalizeAlias } from "@/domain/normalizeAlias"

const SOURCE_PREFIX = "escape-wishlist"

export function buildWishlistSourceHash(parts: {
  title: string
  company?: string | null
  city?: string | null
  bookingUrl?: string | null
}): string {
  const key = [
    normalizeAlias(parts.title),
    normalizeAlias(parts.company ?? ""),
    normalizeAlias(parts.city ?? ""),
    (parts.bookingUrl ?? "").trim().toLowerCase(),
  ].join("|")

  return `${SOURCE_PREFIX}:${hashValue(key)}`
}

function hashValue(value: string): string {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}

export function titleFromBookingUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split("/").filter(Boolean)
    const slug = segments.at(-1) ?? parsed.hostname.replace(/^www\./, "")

    return slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase())
  } catch {
    return null
  }
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

export function splitCompanyTitle(value: string): {
  company: string | null
  title: string
} {
  const dashMatch = /^(.+?)\s*-\s*(.+)$/.exec(value.trim())
  if (dashMatch) {
    return {
      company: dashMatch[1].trim(),
      title: dashMatch[2].trim(),
    }
  }

  return {
    company: null,
    title: value.trim(),
  }
}

export function splitSlashAlternatives(value: string): string[] {
  return value
    .split(/\s*\/\s*/)
    .map(part => part.trim())
    .filter(Boolean)
}

export function extractCityFromText(value: string): {
  text: string
  city: string | null
} {
  const patterns = [
    /\ben\s+([A-Za-zÀ-ÿ\s]+)$/i,
    /,\s*([A-Za-zÀ-ÿ\s]+)$/,
    /\(([^)]+)\)\s*$/,
  ]

  for (const pattern of patterns) {
    const match = pattern.exec(value.trim())
    if (!match?.[1]) continue

    const city = match[1].trim()
    const text = value.slice(0, match.index).trim().replace(/[,-]\s*$/, "")
    if (city.length >= 3) {
      return { text, city }
    }
  }

  return { text: value.trim(), city: null }
}

export function parseBarcelonaWishlistLine(line: string): {
  title: string
  company: string | null
  city: string
  venue: string | null
} | null {
  const withoutRank = line.replace(/^\d+\.\s*\d+\)\s*/, "").trim()
  if (!withoutRank) return null

  const dashParts = withoutRank.split(/\s+-\s+/)
  if (dashParts.length < 2) {
    return {
      title: withoutRank,
      company: null,
      city: "Barcelona",
      venue: null,
    }
  }

  const title = dashParts[0].trim()
  const rest = dashParts.slice(1).join(" - ").trim()
  const venueMatch = /\(([^)]+)\)\s*$/.exec(rest)
  const venue = venueMatch?.[1]?.replace(/\s*-\s*Barcelona\s*$/i, "").trim() ?? null
  const company = rest.replace(/\([^)]*\)\s*$/, "").trim() || null

  return {
    title,
    company,
    city: "Barcelona",
    venue,
  }
}
