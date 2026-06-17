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

  it("menu close shrinks clip radius (inverted progress)", () => {
    const maxSize = 1000
    const start = 20 + quartIn(1) * maxSize
    const end = 20 + quartIn(0) * maxSize

    expect(start).toBeGreaterThan(end)
  })
})
