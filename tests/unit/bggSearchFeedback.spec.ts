import { describe, expect, it } from "vitest"
import {
  BggSearchError,
  bggSearchFeedbackForError,
} from "@/services/bgg/bggService"

describe("bggSearchFeedbackForError", () => {
  it("returns info tone when BGG is not configured", () => {
    const feedback = bggSearchFeedbackForError(
      new BggSearchError("bgg_not_configured", "missing"),
    )

    expect(feedback.tone).toBe("info")
    expect(feedback.message).toContain("BGG aún no disponible")
  })

  it("returns warning tone for generic BGG failures", () => {
    const feedback = bggSearchFeedbackForError(new BggSearchError("bgg_error", "fail"))

    expect(feedback.tone).toBe("warning")
    expect(feedback.message).toContain("Puedes crear la partida igual")
  })
})
