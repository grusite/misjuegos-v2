import { describe, expect, it } from "vitest"
import {
  boardOutcomeLabelClass,
  boardOutcomeTone,
  escapeOutcomeLabelClass,
  escapeOutcomeTone,
} from "@/lib/utils/outcomeStyles"

describe("outcomeStyles", () => {
  it("maps board outcomes to semantic tones", () => {
    expect(boardOutcomeTone("win")).toBe("success")
    expect(boardOutcomeTone("loss")).toBe("failure")
    expect(boardOutcomeTone("draw")).toBe("neutral")
    expect(boardOutcomeTone("unknown")).toBe("unknown")
  })

  it("maps escape outcomes to semantic tones", () => {
    expect(escapeOutcomeTone(true)).toBe("success")
    expect(escapeOutcomeTone(false)).toBe("failure")
    expect(escapeOutcomeTone(null)).toBe("unknown")
  })

  it("returns label classes for board and escape outcomes", () => {
    expect(boardOutcomeLabelClass("win")).toBe("text-board")
    expect(boardOutcomeLabelClass("loss")).toBe("text-secondary")
    expect(escapeOutcomeLabelClass(true)).toBe("text-board")
    expect(escapeOutcomeLabelClass(false)).toBe("text-secondary")
  })
})
