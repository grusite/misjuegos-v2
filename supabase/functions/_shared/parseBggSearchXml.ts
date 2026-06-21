export type BggSearchItem = {
  bggId: number
  title: string
  yearPublished: number | null
}

const ITEM_REGEX = /<item\b([^>]*?)>([\s\S]*?)<\/item>/gi
const NAME_TAG_REGEX = /<name\b[^>]*\/?>/gi

export function parseBggSearchXml(xmlText: string): BggSearchItem[] {
  const items: BggSearchItem[] = []

  for (const match of xmlText.matchAll(ITEM_REGEX)) {
    if (items.length >= 10) break

    const attrs = match[1] ?? ""
    const inner = match[2] ?? ""

    if (!/\btype="boardgame"/.test(attrs)) continue

    const idMatch = attrs.match(/\bid="(\d+)"/)
    if (!idMatch) continue

    const title = parsePrimaryName(inner) ?? "Sin título"
    const yearMatch = inner.match(/<yearpublished\b[^>]*\bvalue="(\d+)"/)

    items.push({
      bggId: Number(idMatch[1]),
      title,
      yearPublished: yearMatch ? Number(yearMatch[1]) : null,
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

function readAttribute(tag: string, attribute: string): string | null {
  const pattern = new RegExp(`\\b${attribute}="([^"]*)"`)
  return tag.match(pattern)?.[1] ?? null
}

function decodeXmlEntities(text: string): string {
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
