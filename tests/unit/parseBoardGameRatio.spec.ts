import { describe, expect, it } from "vitest"
import {
  expandBoardGameOutcomes,
  parseBoardGameRatio,
  parsePlayCount,
} from "@/services/import/parseBoardGameRatio"

describe("parseBoardGameRatio.ts", () => {
  it("parses wins and losses from ratio text", () => {
    expect(parseBoardGameRatio("2 perdidas 2 ganadas")).toEqual({
      wins: 2,
      losses: 2,
    })
    expect(parseBoardGameRatio("1 perdida 1 ganada")).toEqual({
      wins: 1,
      losses: 1,
    })
  })

  it("parses wins-only ratios and fills losses from play count", () => {
    expect(parseBoardGameRatio("14 ganadas?")).toEqual({ wins: 14, losses: 0 })
    expect(expandBoardGameOutcomes(15, parseBoardGameRatio("14 ganadas?"))).toEqual([
      "loss",
      ...Array.from({ length: 14 }, () => "win"),
    ])
  })

  it("parses uncertain play counts", () => {
    expect(parsePlayCount("7?")).toBe(7)
    expect(parsePlayCount("5?")).toBe(5)
  })

  it("expands unknown outcomes when ratio is unclear", () => {
    expect(expandBoardGameOutcomes(5, parseBoardGameRatio("??"))).toEqual([
      "unknown",
      "unknown",
      "unknown",
      "unknown",
      "unknown",
    ])
  })

  it("splits 7 plays into 4 wins and 3 losses", () => {
    expect(expandBoardGameOutcomes(7, parseBoardGameRatio("4 ganadas?"))).toEqual([
      "loss",
      "loss",
      "loss",
      "win",
      "win",
      "win",
      "win",
    ])
  })
})
