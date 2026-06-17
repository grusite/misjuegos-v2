import { describe, expect, it } from "vitest"
import { normalizeAlias } from "@/domain/normalizeAlias"

describe("normalizeAlias", () => {
  it("lowercases and trims", () => {
    expect(normalizeAlias("  Ana  ")).toBe("ana")
  })

  it("removes accents", () => {
    expect(normalizeAlias("José")).toBe("jose")
  })
})
