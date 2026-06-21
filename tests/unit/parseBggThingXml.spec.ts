import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  isConfirmedBggExpansion,
  parseBggThingDetails,
  resolveBggCatalogFields,
} from "../../supabase/functions/_shared/parseBggThingXml.ts"

const fixtureXml = readFileSync(
  resolve(process.cwd(), "tests/fixtures/bgg/thing-arkham-expansion.xml"),
  "utf8",
)

describe("parseBggThingXml", () => {
  it("parses expansion with inbound base-game link from BGG thing XML", () => {
    const { byId } = parseBggThingDetails(fixtureXml)
    const details = byId.get(282308)

    expect(details).toEqual({
      bggId: 282308,
      primaryName: "Arkham Horror (Third Edition): Dead of Night",
      itemType: "boardgameexpansion",
      thumbnailUrl: "https://cf.geekdo-images.com/thumb/img/282308.jpg",
      baseBggId: 257499,
      baseGameTitle: "Arkham Horror (Third Edition)",
      expansionBggIds: [],
    })
  })

  it("lists expansion ids on the base game for cross-validation", () => {
    const { expansionIdsByBaseGame } = parseBggThingDetails(fixtureXml)

    expect([...expansionIdsByBaseGame.get(257499)!]).toEqual([282308, 325625])
  })

  it("confirms expansion only when BGG type and base link match", () => {
    const parsed = parseBggThingDetails(fixtureXml)
    const expansion = parsed.byId.get(282308)!
    const baseGame = parsed.byId.get(257499)!
    const standalone = parsed.byId.get(9209)!

    expect(isConfirmedBggExpansion(expansion, parsed.expansionIdsByBaseGame)).toBe(
      true,
    )
    expect(isConfirmedBggExpansion(baseGame, parsed.expansionIdsByBaseGame)).toBe(
      false,
    )
    expect(
      isConfirmedBggExpansion(standalone, parsed.expansionIdsByBaseGame),
    ).toBe(false)
  })

  it("rejects a fake expansion id not listed on the base game", () => {
    const parsed = parseBggThingDetails(fixtureXml)
    const expansion = {
      ...parsed.byId.get(282308)!,
      bggId: 999999,
    }

    expect(isConfirmedBggExpansion(expansion, parsed.expansionIdsByBaseGame)).toBe(
      false,
    )
  })

  it("confirms expansion with inbound link when base game is not in the batch", () => {
    const { byId, expansionIdsByBaseGame } = parseBggThingDetails(`<?xml version="1.0"?>
<items>
  <item type="boardgameexpansion" id="282308">
    <name type="primary" value="Arkham Horror (Third Edition): Dead of Night" />
    <link type="boardgame" id="257499" value="Arkham Horror (Third Edition)" inbound="true" />
  </item>
</items>`)

    expect(
      isConfirmedBggExpansion(byId.get(282308)!, expansionIdsByBaseGame),
    ).toBe(true)
  })
})

describe("resolveBggCatalogFields", () => {
  it("splits base game and expansion when BGG confirms expansion", () => {
    const parsed = parseBggThingDetails(fixtureXml)
    const resolved = resolveBggCatalogFields(
      parsed.byId.get(282308)!,
      parsed.expansionIdsByBaseGame,
    )

    expect(resolved).toEqual({
      baseTitle: "Arkham Horror (Third Edition)",
      expansion: "Dead of Night",
      displayTitle: "Arkham Horror (Third Edition): Dead of Night",
      isExpansion: true,
    })
  })

  it("keeps standalone games without expansion", () => {
    const parsed = parseBggThingDetails(fixtureXml)
    const resolved = resolveBggCatalogFields(
      parsed.byId.get(9209)!,
      parsed.expansionIdsByBaseGame,
    )

    expect(resolved).toEqual({
      baseTitle: "Azul",
      expansion: null,
      displayTitle: "Azul",
      isExpansion: false,
    })
  })

  it("does not invent an expansion for colon titles on base games", () => {
    const parsed = parseBggThingDetails(fixtureXml)
    const resolved = resolveBggCatalogFields(
      parsed.byId.get(257499)!,
      parsed.expansionIdsByBaseGame,
    )

    expect(resolved.isExpansion).toBe(false)
    expect(resolved.expansion).toBeNull()
  })
})
