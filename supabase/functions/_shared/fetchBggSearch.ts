import { fetchBggXml } from "./bggXmlUtils.ts"
import { fetchBggThingThumbnails } from "./fetchBggThingThumbnails.ts"
import { parseBggSearchXml, type BggSearchItem } from "./parseBggSearchXml.ts"

const BGG_SEARCH_URL = "https://boardgamegeek.com/xmlapi2/search"

export async function fetchBggSearch(
  query: string,
  token: string,
): Promise<BggSearchItem[]> {
  const normalized = query.trim()
  if (!normalized) return []

  const url = `${BGG_SEARCH_URL}?type=boardgame&query=${encodeURIComponent(normalized)}`

  let xmlText: string

  try {
    xmlText = await fetchBggXml(url, token)
  } catch (error) {
    throw error instanceof Error ? error : new Error("bgg_error", { cause: error })
  }

  let results: BggSearchItem[]

  try {
    results = parseBggSearchXml(xmlText)
  } catch (error) {
    const detail = error instanceof Error ? error.message : "parse_failed"
    throw new Error(`bgg_parse_failed:${detail}`, { cause: error })
  }

  if (results.length === 0) return results

  try {
    const thumbnails = await fetchBggThingThumbnails(
      results.map(result => result.bggId),
      token,
    )

    return results.map(result => ({
      ...result,
      thumbnailUrl: thumbnails.get(result.bggId) ?? null,
    }))
  } catch {
    return results
  }
}
