import { describe, expect, it } from "vitest"
import { parseBabelEscapeTime } from "@/services/import/parseBabelTime"
import { parseCluesUsed } from "@/services/import/parseCluesUsed"
import { parseParticipantes } from "@/services/import/parseParticipantes"

describe("parseBabelTime.ts", () => {
  it("parses slash minute format", () => {
    expect(parseBabelEscapeTime("63/66").timeSeconds).toBe(63 * 60)
    expect(parseBabelEscapeTime("-/66").timeSeconds).toBeNull()
  })

  it("parses minute and second quotes", () => {
    expect(parseBabelEscapeTime("64'18''/66").timeSeconds).toBe(64 * 60 + 18)
    expect(parseBabelEscapeTime("41'10\"/60").timeSeconds).toBe(41 * 60 + 10)
  })
})

describe("parseCluesUsed.ts", () => {
  it("parses decimals and ranges", () => {
    expect(parseCluesUsed("0.5")).toBe(1)
    expect(parseCluesUsed("5-8")).toBe(7)
    expect(parseCluesUsed("1+1/2")).toBe(2)
  })
})

describe("parseParticipantes.ts", () => {
  it("parses space-separated nicknames", () => {
    expect(parseParticipantes("jorge edu bego")).toEqual([
      "jorge",
      "edu",
      "bego",
    ])
  })

  it("detects babel team", () => {
    expect(parseParticipantes("Babel 4")).toEqual(["babel 4"])
  })

  it("detects primos team with roster in parentheses", () => {
    expect(parseParticipantes("Primos (Unai, Vity, Jorge, Diego)")).toEqual([
      "primos",
    ])
  })

  it("parses mixed formats", () => {
    expect(parseParticipantes("Pili y Jorge")).toEqual(["pili", "jorge"])
    expect(parseParticipantes("Babel 4 Armando")).toEqual(["babel 4", "armando"])
  })
})
