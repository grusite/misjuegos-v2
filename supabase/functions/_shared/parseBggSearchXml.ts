export type BggSearchItem = {
  bggId: number
  title: string
  yearPublished: number | null
}

export function parseBggSearchXml(xmlText: string): BggSearchItem[] {
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

export function isBggQueuedResponse(xmlText: string): boolean {
  return (
    xmlText.includes("has been accepted and will be processed soon") ||
    xmlText.includes("<message>Your request for")
  )
}

export function isBggErrorResponse(xmlText: string): boolean {
  return xmlText.includes("<error")
}
