export type BggSearchResult = {
  bggId: number
  title: string
  yearPublished: number | null
}

function parseSearchXml(xmlText: string): BggSearchResult[] {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlText, "application/xml")
  const items = Array.from(xmlDoc.querySelectorAll("item[type='boardgame']"))

  return items.slice(0, 10).map(item => {
    const id = Number(item.getAttribute("id") ?? 0)
    const title =
      item.querySelector("name[type='primary']")?.getAttribute("value") ??
      item.querySelector("name")?.getAttribute("value") ??
      "Sin título"
    const yearValue = item.querySelector("yearpublished")?.getAttribute("value")

    return {
      bggId: id,
      title,
      yearPublished: yearValue ? Number(yearValue) : null,
    }
  })
}

export async function searchBoardGames(query: string): Promise<BggSearchResult[]> {
  const normalized = query.trim()
  if (!normalized) return []

  // Using allorigins as lightweight CORS proxy for BGG XML API.
  const bggUrl = `https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(normalized)}`
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(bggUrl)}`

  try {
    const response = await fetch(proxyUrl)
    if (!response.ok) return []

    const xmlText = await response.text()
    if (!xmlText || xmlText.includes("<error>")) return []

    return parseSearchXml(xmlText)
  } catch {
    return []
  }
}
