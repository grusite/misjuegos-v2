import { decodeXmlEntities } from "./bggXmlUtils.ts"
import { isAllowedBggSearchItemType } from "./bggItemTypes.ts"
import {
  BGG_SEARCH_MAX_RESULTS,
  normalizeBggSearchLimit,
  normalizeBggSearchOffset,
} from "./bggSearchLimits.ts"

export type BggSearchItem = {
  bggId: number
  title: string
  baseTitle: string
  expansion: string | null
  baseBggId: number | null
  isExpansion: boolean
  yearPublished: number | null
  thumbnailUrl: string | null
}

export type BggSearchParseResult = {
  items: BggSearchItem[]
  total: number
  hasMore: boolean
}

const ITEM_REGEX = /<item\b([^>]*?)>([\s\S]*?)<\/item>/gi
const NAME_TAG_REGEX = /<name\b[^>]*\/?>/gi

export function parseBggSearchXml(
  xmlText: string,
  options?: { limit?: number; offset?: number },
): BggSearchParseResult {
  const allItems = parseAllBggSearchItems(xmlText)
  const offset = normalizeBggSearchOffset(options?.offset)
  const limit = normalizeBggSearchLimit(options?.limit)
  const cappedTotal = Math.min(allItems.length, BGG_SEARCH_MAX_RESULTS)
  const end = Math.min(offset + limit, cappedTotal)
  const items = allItems.slice(offset, end)

  return {
    items,
    total: cappedTotal,
    hasMore: end < cappedTotal,
  }
}

function parseAllBggSearchItems(xmlText: string): BggSearchItem[] {
  const items: BggSearchItem[] = []

  for (const match of xmlText.matchAll(ITEM_REGEX)) {
    const attrs = match[1] ?? ""
    const inner = match[2] ?? ""

    const itemType = readItemType(attrs)
    if (!isAllowedBggSearchItemType(itemType)) continue

    const idMatch = attrs.match(/\bid="(\d+)"/)
    if (!idMatch) continue

    const title = parsePrimaryName(inner) ?? "Sin título"
    const yearMatch = inner.match(/<yearpublished\b[^>]*\bvalue="(\d+)"/)

    items.push({
      bggId: Number(idMatch[1]),
      title,
      baseTitle: title,
      expansion: null,
      baseBggId: null,
      isExpansion: false,
      yearPublished: yearMatch ? Number(yearMatch[1]) : null,
      thumbnailUrl: null,
    })
  }

  return items
}

function parsePrimaryName(inner: string): string | null {
  const nameTags = inner.match(NAME_TAG_REGEX) ?? []

  for (const tag of nameTags) {
    if (!/\btype="primary"/.test(tag)) continue

    const value = readAttribute(tag, "value")
    if (value) return decodeXmlEntities(value)
  }

  for (const tag of nameTags) {
    const value = readAttribute(tag, "value")
    if (value) return decodeXmlEntities(value)
  }

  return null
}

function readItemType(attrs: string): string | null {
  return attrs.match(/\btype="([^"]+)"/)?.[1] ?? null
}

function readAttribute(tag: string, attribute: string): string | null {
  const pattern = new RegExp(`\\b${attribute}="([^"]*)"`)
  return tag.match(pattern)?.[1] ?? null
}

export { isBggErrorResponse, isBggQueuedResponse } from "./bggXmlUtils.ts"
