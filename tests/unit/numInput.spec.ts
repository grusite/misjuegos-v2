import { describe, expect, it } from "vitest"
import { stepNumInput } from "@/lib/utils/numInput"

describe("numInput", () => {
  it("increments and decrements within bounds", () => {
    expect(stepNumInput(3, "inc", { min: 1, max: 5 })).toBe(4)
    expect(stepNumInput(3, "dec", { min: 1, max: 5 })).toBe(2)
  })

  it("skips excluded values", () => {
    expect(stepNumInput(2, "dec", { min: 0, max: 5, skip: 1 })).toBe(0)
    expect(stepNumInput(0, "inc", { min: 0, max: 5, skip: 1 })).toBe(2)
  })
})

describe("useSpring", () => {
  it("exports a spring composable factory", async () => {
    const { useSpring } = await import("@/composables/useSpring")
    expect(typeof useSpring).toBe("function")
  })
})
