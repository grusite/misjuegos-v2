export function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

export function isBggQueuedResponse(xmlText: string): boolean {
  return (
    xmlText.includes("has been accepted and will be processed soon") ||
    xmlText.includes("<message>Your request for")
  )
}

export function isBggErrorResponse(xmlText: string): boolean {
  if (isBggQueuedResponse(xmlText)) return false

  return xmlText.includes("<error")
}

const MAX_ATTEMPTS = 6
const RETRY_DELAY_MS = 2_000

export async function fetchBggXml(url: string, token: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    let response: Response

    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/xml",
          "User-Agent": "MisJuegos/2.0 (private; boardgamegeek.com/applications)",
        },
      })
    } catch (error) {
      const detail = error instanceof Error ? error.message : "fetch_failed"
      throw new Error(`bgg_fetch_failed:${detail}`, { cause: error })
    }

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

    return xmlText
  }

  throw new Error("bgg_timeout")
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
