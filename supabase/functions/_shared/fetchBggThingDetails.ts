import { isBggExpansionType } from "./bggItemTypes.ts"
import { fetchBggXml } from "./bggXmlUtils.ts"
import {
  parseBggThingDetails,
  resolveBggCatalogFields,
  type BggThingParseResult,
} from "./parseBggThingXml.ts"

const BGG_THING_URL = "https://boardgamegeek.com/xmlapi2/thing"

export type BggThingEnrichment = {
  bggId: number
  baseTitle: string
  expansion: string | null
  displayTitle: string
  isExpansion: boolean
  thumbnailUrl: string | null
  baseBggId: number | null
}

export async function fetchBggThingDetails(
  bggIds: number[],
  token: string,
): Promise<Map<number, BggThingEnrichment>> {
  if (bggIds.length === 0) return new Map()

  const requestedIds = [...new Set(bggIds)]
  let parsed = await fetchBggThingBatch(requestedIds, token)

  const missingBaseIds = collectMissingBaseGameIds(parsed, requestedIds)
  if (missingBaseIds.length > 0) {
    parsed = await fetchBggThingBatch(
      [...new Set([...requestedIds, ...missingBaseIds])],
      token,
    )
  }

  const enriched = new Map<number, BggThingEnrichment>()

  for (const bggId of requestedIds) {
    const detail = parsed.byId.get(bggId)
    if (!detail) continue

    const resolved = resolveBggCatalogFields(detail, parsed.expansionIdsByBaseGame)

    enriched.set(bggId, {
      bggId,
      ...resolved,
      thumbnailUrl: detail.thumbnailUrl,
      baseBggId: resolved.isExpansion ? detail.baseBggId : null,
    })
  }

  return enriched
}

async function fetchBggThingBatch(
  bggIds: number[],
  token: string,
): Promise<BggThingParseResult> {
  const url = `${BGG_THING_URL}?id=${bggIds.join(",")}`
  const xmlText = await fetchBggXml(url, token)

  return parseBggThingDetails(xmlText)
}

function collectMissingBaseGameIds(
  parsed: BggThingParseResult,
  requestedIds: number[],
): number[] {
  const requested = new Set(requestedIds)
  const missing: number[] = []

  for (const bggId of requestedIds) {
    const detail = parsed.byId.get(bggId)
    if (!detail || !isBggExpansionType(detail.itemType) || !detail.baseBggId) {
      continue
    }

    if (!requested.has(detail.baseBggId) && !parsed.byId.has(detail.baseBggId)) {
      missing.push(detail.baseBggId)
    }
  }

  return missing
}
