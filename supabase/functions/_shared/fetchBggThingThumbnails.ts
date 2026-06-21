import { fetchBggXml } from "./bggXmlUtils.ts"
import { parseBggThingThumbnails } from "./parseBggThingXml.ts"

const BGG_THING_URL = "https://boardgamegeek.com/xmlapi2/thing"

export async function fetchBggThingThumbnails(
  bggIds: number[],
  token: string,
): Promise<Map<number, string>> {
  if (bggIds.length === 0) return new Map()

  const url = `${BGG_THING_URL}?id=${bggIds.join(",")}`
  const xmlText = await fetchBggXml(url, token)

  return parseBggThingThumbnails(xmlText)
}
