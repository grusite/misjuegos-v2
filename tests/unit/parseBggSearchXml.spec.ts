import { describe, expect, it } from "vitest"
import {
  isBggErrorResponse,
  isBggQueuedResponse,
  parseBggSearchXml,
} from "../../supabase/functions/_shared/parseBggSearchXml.ts"

describe("parseBggSearchXml", () => {
  it("parses boardgame search items from BGG XML", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<items total="1" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="9209">
    <name type="primary" value="Azul" />
    <yearpublished value="2017" />
  </item>
</items>`

    expect(parseBggSearchXml(xml)).toEqual({
      items: [
        {
          bggId: 9209,
          title: "Azul",
          baseTitle: "Azul",
          expansion: null,
          baseBggId: null,
          isExpansion: false,
          yearPublished: 2017,
          thumbnailUrl: null,
        },
      ],
      total: 1,
      hasMore: false,
    })
  })

  it("detects BGG queued responses", () => {
    const xml =
      '<error message="Your request for ... has been accepted and will be processed soon." />'

    expect(isBggQueuedResponse(xml)).toBe(true)
    expect(isBggErrorResponse(xml)).toBe(false)
  })

  it("parses items when id attribute precedes type", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<items total="1">
  <item id="9209" type="boardgame">
    <name value="Azul" type="primary" />
    <yearpublished value="2017" />
  </item>
</items>`

    expect(parseBggSearchXml(xml)).toEqual({
      items: [
        {
          bggId: 9209,
          title: "Azul",
          baseTitle: "Azul",
          expansion: null,
          baseBggId: null,
          isExpansion: false,
          yearPublished: 2017,
          thumbnailUrl: null,
        },
      ],
      total: 1,
      hasMore: false,
    })
  })

  it("paginates results with limit and offset", () => {
    const items = Array.from({ length: 15 }, (_, index) => {
      const id = 1000 + index
      return `<item type="boardgame" id="${id}"><name type="primary" value="Game ${id}" /></item>`
    }).join("\n")

    const xml = `<?xml version="1.0"?><items>${items}</items>`

    const firstPage = parseBggSearchXml(xml, { limit: 10, offset: 0 })
    expect(firstPage.items).toHaveLength(10)
    expect(firstPage.total).toBe(15)
    expect(firstPage.hasMore).toBe(true)
    expect(firstPage.items[0]?.bggId).toBe(1000)

    const secondPage = parseBggSearchXml(xml, { limit: 10, offset: 10 })
    expect(secondPage.items).toHaveLength(5)
    expect(secondPage.total).toBe(15)
    expect(secondPage.hasMore).toBe(false)
    expect(secondPage.items[0]?.bggId).toBe(1010)
  })

  it("caps total results at the configured maximum", () => {
    const items = Array.from({ length: 40 }, (_, index) => {
      const id = 2000 + index
      return `<item type="boardgame" id="${id}"><name type="primary" value="Game ${id}" /></item>`
    }).join("\n")

    const xml = `<?xml version="1.0"?><items>${items}</items>`
    const page = parseBggSearchXml(xml, { limit: 10, offset: 20 })

    expect(page.items).toHaveLength(10)
    expect(page.total).toBe(30)
    expect(page.hasMore).toBe(false)
    expect(page.items[0]?.bggId).toBe(2020)
  })
})
