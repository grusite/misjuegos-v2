import {
  isBggErrorResponse,
  isBggQueuedResponse,
  parseBggSearchXml,
  type BggSearchItem,
} from "./parseBggSearchXml.ts"

const BGG_SEARCH_URL = "https://boardgamegeek.com/xmlapi2/search"
const MAX_ATTEMPTS = 6
const RETRY_DELAY_MS = 2_000

export async function fetchBggSearch(
  query: string,
  token: string,
): Promise<BggSearchItem[]> {
  const normalized = query.trim()
  if (!normalized) return []

  const url = `${BGG_SEARCH_URL}?type=boardgame&query=${encodeURIComponent(normalized)}`

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/xml",
      },
    })

    if (response.status === 202) {
      await delay(RETRY_DELAY_MS)
      continue
    }

    const xmlText = await response.text()

    if (response.status === 401 || response.status === 403) {
      throw new Error("bgg_unauthorized")
    }

    if (!response.ok) {
      throw new Error(`bgg_http_${response.status}`)
    }

    if (isBggQueuedResponse(xmlText)) {
      await delay(RETRY_DELAY_MS)
      continue
    }

    if (isBggErrorResponse(xmlText)) {
      throw new Error("bgg_error_response")
    }

    return parseBggSearchXml(xmlText)
  }

  throw new Error("bgg_timeout")
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
