import { describe, expect, it } from "vitest"
import {
  isAllowedBggSearchItemType,
  isBggExpansionType,
} from "../../supabase/functions/_shared/bggItemTypes.ts"
import { parseBggSearchXml } from "../../supabase/functions/_shared/parseBggSearchXml.ts"

describe("bggItemTypes", () => {
  it("treats boardgameexpansion as an expansion", () => {
    expect(isBggExpansionType("boardgameexpansion")).toBe(true)
    expect(isBggExpansionType("boardgame")).toBe(false)
  })

  it("accepts board games and expansions from search results", () => {
    expect(isAllowedBggSearchItemType("boardgame")).toBe(true)
    expect(isAllowedBggSearchItemType("boardgameexpansion")).toBe(true)
    expect(isAllowedBggSearchItemType("boardgameaccessory")).toBe(false)
  })
})

describe("parseBggSearchXml item types", () => {
  it("includes boardgameexpansion rows without matching boardgameaccessory", () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<items total="3">
  <item type="boardgame" id="9209">
    <name type="primary" value="Azul" />
  </item>
  <item type="boardgameexpansion" id="282308">
    <name type="primary" value="Arkham Horror (Third Edition): Dead of Night" />
  </item>
  <item type="boardgameaccessory" id="123">
    <name type="primary" value="Insert" />
  </item>
</items>`

    expect(parseBggSearchXml(xml).items.map(item => item.bggId)).toEqual([9209, 282308])
  })
})
