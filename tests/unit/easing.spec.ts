import { describe, expect, it } from "vitest"
import { quartIn, quartOut } from "@/lib/utils/easing"

describe("easing", () => {
  it("quartOut starts at 0 and ends at 1", () => {
    expect(quartOut(0)).toBe(0)
    expect(quartOut(1)).toBe(1)
  })

  it("quartIn starts at 0 and ends at 1", () => {
    expect(quartIn(0)).toBe(0)
    expect(quartIn(1)).toBe(1)
  })
})
