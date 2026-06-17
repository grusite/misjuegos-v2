import { describe, expect, it } from "vitest"
import {
  formatEscapeTime,
  parseEscapeTimeToSeconds,
} from "@/lib/utils/parseEscapeTime"
import { mapEscapeSessionDetails } from "@/services/sessions/escapeSessionMapper"

describe("parseEscapeTime.ts", () => {
  it("parses mm:ss format", () => {
    expect(parseEscapeTimeToSeconds("45:30")).toBe(2730)
  })

  it("parses hh:mm:ss format", () => {
    expect(parseEscapeTimeToSeconds("1:05:30")).toBe(3930)
  })

  it("returns null for invalid values", () => {
    expect(parseEscapeTimeToSeconds("")).toBeNull()
    expect(parseEscapeTimeToSeconds("abc")).toBeNull()
  })

  it("formats seconds back to mm:ss", () => {
    expect(formatEscapeTime(2730)).toBe("45:30")
  })

  it("formats seconds with hours", () => {
    expect(formatEscapeTime(3930)).toBe("1:05:30")
  })
})

describe("escapeSessionMapper.ts", () => {
  it("maps escape session details row", () => {
    const mapped = mapEscapeSessionDetails({
      session_id: "session-1",
      clues_used: 3,
      time_result: "45:30",
      time_seconds: 2730,
      price: 25,
      price_currency: "EUR",
      escaped: true,
    })

    expect(mapped).toEqual({
      sessionId: "session-1",
      cluesUsed: 3,
      timeResult: "45:30",
      timeSeconds: 2730,
      price: 25,
      priceCurrency: "EUR",
      escaped: true,
    })
  })
})
