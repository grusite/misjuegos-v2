import { isBggExpansionType } from "./bggItemTypes.ts"
import { decodeXmlEntities } from "./bggXmlUtils.ts"

export type BggThingDetails = {
  bggId: number
  primaryName: string
  itemType: string | null
  thumbnailUrl: string | null
  baseBggId: number | null
  baseGameTitle: string | null
  /** Expansion ids listed on this item when it is a base board game. */
  expansionBggIds: number[]
}

export type BggThingParseResult = {
  byId: Map<number, BggThingDetails>
  expansionIdsByBaseGame: Map<number, Set<number>>
}

const ITEM_REGEX = /<item\b([^>]*?)>([\s\S]*?)<\/item>/gi
const LINK_TAG_REGEX = /<link\b([^>]*)\/?>/gi
const NAME_TAG_REGEX = /<name\b[^>]*\/?>/gi

export function parseBggThingDetails(xmlText: string): BggThingParseResult {
  const byId = new Map<number, BggThingDetails>()
  const expansionIdsByBaseGame = new Map<number, Set<number>>()

  for (const match of xmlText.matchAll(ITEM_REGEX)) {
    const attrs = match[1] ?? ""
    const inner = match[2] ?? ""

    const idMatch = attrs.match(/\bid="(\d+)"/)
    if (!idMatch) continue

    const bggId = Number(idMatch[1])
    const itemType = readAttribute(attrs, "type")
    const primaryName = parsePrimaryName(inner) ?? "Sin título"
    const thumbnailMatch = inner.match(/<thumbnail>([^<]*)<\/thumbnail>/)
    const baseGameLink = findInboundBaseGameLink(inner)
    const expansionBggIds = findOutboundExpansionLinks(inner)

    if (expansionBggIds.length > 0) {
      expansionIdsByBaseGame.set(bggId, new Set(expansionBggIds))
    }

    byId.set(bggId, {
      bggId,
      primaryName,
      itemType,
      thumbnailUrl: thumbnailMatch?.[1]
        ? decodeXmlEntities(thumbnailMatch[1])
        : null,
      baseBggId: baseGameLink?.id ?? null,
      baseGameTitle: baseGameLink?.title ?? null,
      expansionBggIds,
    })
  }

  return { byId, expansionIdsByBaseGame }
}

export function isConfirmedBggExpansion(
  detail: BggThingDetails,
  expansionIdsByBaseGame: Map<number, Set<number>>,
): boolean {
  if (!isBggExpansionType(detail.itemType)) return false
  if (!detail.baseBggId || !detail.baseGameTitle) return false

  const listedOnBase = expansionIdsByBaseGame.get(detail.baseBggId)
  if (!listedOnBase) {
    // Base game was not in the same batch response — trust BGG's inbound link.
    return true
  }

  return listedOnBase.has(detail.bggId)
}

export function resolveBggCatalogFields(
  detail: BggThingDetails,
  expansionIdsByBaseGame: Map<number, Set<number>>,
): {
  baseTitle: string
  expansion: string | null
  displayTitle: string
  isExpansion: boolean
} {
  const primaryName = detail.primaryName.trim()

  if (!isConfirmedBggExpansion(detail, expansionIdsByBaseGame)) {
    return {
      baseTitle: primaryName,
      expansion: null,
      displayTitle: primaryName,
      isExpansion: false,
    }
  }

  const baseTitle = detail.baseGameTitle!.trim()
  const expansion = deriveExpansionName(
    primaryName,
    baseTitle,
    detail.itemType,
  )

  return {
    baseTitle,
    expansion,
    displayTitle: expansion ? `${baseTitle}: ${expansion}` : baseTitle,
    isExpansion: true,
  }
}

function deriveExpansionName(
  primaryName: string,
  baseTitle: string,
  itemType: string | null,
): string | null {
  if (primaryName === baseTitle) return null

  if (primaryName.startsWith(baseTitle)) {
    const suffix = primaryName.slice(baseTitle.length).replace(/^[\s:\-–—]+/, "").trim()
    if (suffix) return suffix
  }

  if (isBggExpansionType(itemType)) {
    return primaryName
  }

  return null
}

function findOutboundExpansionLinks(inner: string): number[] {
  const expansionIds: number[] = []

  for (const match of inner.matchAll(LINK_TAG_REGEX)) {
    const attrs = match[1] ?? ""

    if (readAttribute(attrs, "type") !== "boardgameexpansion") continue

    const idValue = readAttribute(attrs, "id")
    if (!idValue) continue

    expansionIds.push(Number(idValue))
  }

  return expansionIds
}

function findInboundBaseGameLink(inner: string): { id: number; title: string } | null {
  for (const match of inner.matchAll(LINK_TAG_REGEX)) {
    const attrs = match[1] ?? ""

    if (readAttribute(attrs, "type") !== "boardgame") continue
    if (readAttribute(attrs, "inbound") !== "true") continue

    const idValue = readAttribute(attrs, "id")
    const title = readAttribute(attrs, "value")
    if (!idValue || !title) continue

    return {
      id: Number(idValue),
      title: decodeXmlEntities(title),
    }
  }

  return null
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

function readAttribute(source: string, attribute: string): string | null {
  const pattern = new RegExp(`\\b${attribute}="([^"]*)"`)
  return source.match(pattern)?.[1] ?? null
}

/** @deprecated Use parseBggThingDetails */
export function parseBggThingThumbnails(xmlText: string): Map<number, string> {
  const thumbnails = new Map<number, string>()

  for (const [, detail] of parseBggThingDetails(xmlText).byId) {
    if (detail.thumbnailUrl) {
      thumbnails.set(detail.bggId, detail.thumbnailUrl)
    }
  }

  return thumbnails
}
