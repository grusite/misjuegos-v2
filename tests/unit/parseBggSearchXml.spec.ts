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

    expect(parseBggSearchXml(xml)).toEqual([
      {
        bggId: 9209,
        title: "Azul",
        yearPublished: 2017,
        thumbnailUrl: null,
      },
    ])
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

    expect(parseBggSearchXml(xml)).toEqual([
      {
        bggId: 9209,
        title: "Azul",
        yearPublished: 2017,
        thumbnailUrl: null,
      },
    ])
  })
})
