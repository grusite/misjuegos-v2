import { decodeXmlEntities } from "./bggXmlUtils.ts"

const ITEM_REGEX = /<item\b([^>]*?)>([\s\S]*?)<\/item>/gi

export function parseBggThingThumbnails(xmlText: string): Map<number, string> {
  const thumbnails = new Map<number, string>()

  for (const match of xmlText.matchAll(ITEM_REGEX)) {
    const attrs = match[1] ?? ""
    const inner = match[2] ?? ""

    const idMatch = attrs.match(/\bid="(\d+)"/)
    if (!idMatch) continue

    const thumbnailMatch = inner.match(/<thumbnail>([^<]*)<\/thumbnail>/)
    if (!thumbnailMatch?.[1]) continue

    thumbnails.set(Number(idMatch[1]), decodeXmlEntities(thumbnailMatch[1]))
  }

  return thumbnails
}
