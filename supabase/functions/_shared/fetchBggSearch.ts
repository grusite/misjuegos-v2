import { fetchBggXml } from "./bggXmlUtils.ts"
import { fetchBggThingDetails } from "./fetchBggThingDetails.ts"
import { parseBggSearchXml, type BggSearchItem } from "./parseBggSearchXml.ts"
import {
  normalizeBggSearchLimit,
  normalizeBggSearchOffset,
} from "./bggSearchLimits.ts"

const BGG_SEARCH_URL = "https://boardgamegeek.com/xmlapi2/search"

export type BggSearchResponse = {
  results: BggSearchItem[]
  total: number
  hasMore: boolean
}

export async function fetchBggSearch(
  query: string,
  token: string,
  options?: { limit?: number; offset?: number },
): Promise<BggSearchResponse> {
  const normalized = query.trim()
  if (!normalized) {
    return { results: [], total: 0, hasMore: false }
  }

  const limit = normalizeBggSearchLimit(options?.limit)
  const offset = normalizeBggSearchOffset(options?.offset)
  const url = `${BGG_SEARCH_URL}?type=boardgame&query=${encodeURIComponent(normalized)}`

  let xmlText: string

  try {
    xmlText = await fetchBggXml(url, token)
  } catch (error) {
    throw error instanceof Error ? error : new Error("bgg_error", { cause: error })
  }

  let page: ReturnType<typeof parseBggSearchXml>

  try {
    page = parseBggSearchXml(xmlText, { limit, offset })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "parse_failed"
    throw new Error(`bgg_parse_failed:${detail}`, { cause: error })
  }

  if (page.items.length === 0) {
    return { results: [], total: page.total, hasMore: page.hasMore }
  }

  try {
    const thingDetails = await fetchBggThingDetails(
      page.items.map(result => result.bggId),
      token,
    )

    const results = page.items.map(result => {
      const detail = thingDetails.get(result.bggId)

      if (!detail) {
        return {
          ...result,
          baseTitle: result.title,
          expansion: null,
          baseBggId: null,
          isExpansion: false,
        }
      }

      return {
        ...result,
        title: detail.displayTitle,
        baseTitle: detail.baseTitle,
        expansion: detail.expansion,
        baseBggId: detail.baseBggId,
        isExpansion: detail.isExpansion,
        thumbnailUrl: detail.thumbnailUrl,
      }
    })

    return { results, total: page.total, hasMore: page.hasMore }
  } catch {
    const results = page.items.map(result => ({
      ...result,
      baseTitle: result.title,
      expansion: null,
      baseBggId: null,
      isExpansion: false,
    }))

    return { results, total: page.total, hasMore: page.hasMore }
  }
}
