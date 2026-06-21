import { describe, expect, it } from "vitest"
import { parseBggThingThumbnails } from "../../supabase/functions/_shared/parseBggThingXml.ts"

describe("parseBggThingXml", () => {
  it("parses thumbnail URLs keyed by bgg id", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<items>
  <item type="boardgame" id="9209">
    <thumbnail>https://cf.geekdo-images.com/thumb/img/9209.jpg</thumbnail>
  </item>
  <item type="boardgame" id="13">
    <thumbnail>https://cf.geekdo-images.com/thumb/img/13.jpg</thumbnail>
  </item>
</items>`

    expect(parseBggThingThumbnails(xml)).toEqual(
      new Map([
        [9209, "https://cf.geekdo-images.com/thumb/img/9209.jpg"],
        [13, "https://cf.geekdo-images.com/thumb/img/13.jpg"],
      ]),
    )
  })
})
