import { describe, expect, it } from "vitest"
import {
  formatStarRating,
  getStarIcons,
  isHalfStepRating,
} from "@/lib/utils/starRating"

describe("starRating", () => {
  it("validates half-step ratings", () => {
    expect(isHalfStepRating(4.5)).toBe(true)
    expect(isHalfStepRating(3)).toBe(true)
    expect(isHalfStepRating(3.3)).toBe(false)
  })

  it("builds full, half and empty star icons", () => {
    expect(getStarIcons(4.5)).toEqual(["full", "full", "full", "full", "half"])
    expect(getStarIcons(2)).toEqual(["full", "full", "empty", "empty", "empty"])
  })

  it("formats ratings for display", () => {
    expect(formatStarRating(4)).toBe("4")
    expect(formatStarRating(4.5)).toBe("4,5")
  })
})
