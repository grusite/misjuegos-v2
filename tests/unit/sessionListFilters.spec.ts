import { describe, expect, it } from "vitest"
import {
  countActiveSessionFilters,
  createDefaultSessionListFilters,
  escapeIlikePattern,
  hashListSessionsOptions,
  resolveDateRange,
  toListSessionsOptions,
} from "@/services/sessions/sessionListFilters"

describe("sessionListFilters", () => {
  it("escapeIlikePattern escapes wildcard characters", () => {
    expect(escapeIlikePattern("50%_off")).toBe("50\\%\\_off")
  })

  it("toListSessionsOptions maps game type and search", () => {
    const options = toListSessionsOptions(
      {
        ...createDefaultSessionListFilters(),
        gameType: "escape_room",
        search: "babel",
      },
      null,
    )

    expect(options).toEqual({
      gameType: "escape_room",
      search: "babel",
    })
  })

  it("toListSessionsOptions uses self participant when onlyMine is enabled", () => {
    const options = toListSessionsOptions(
      {
        ...createDefaultSessionListFilters(),
        onlyMine: true,
        participantIds: ["other"],
      },
      "self-1",
    )

    expect(options.participantIds).toEqual(["self-1"])
  })

  it("resolveDateRange returns custom bounds in ISO format", () => {
    const range = resolveDateRange("custom", "2024-06-01", "2024-06-30")

    expect(range.from).toBe(new Date(2024, 5, 1, 0, 0, 0, 0).toISOString())
    expect(range.to).toBe(new Date(2024, 5, 30, 23, 59, 59, 999).toISOString())
  })

  it("countActiveSessionFilters ignores default state", () => {
    expect(countActiveSessionFilters(createDefaultSessionListFilters())).toBe(0)
  })

  it("countActiveSessionFilters counts active filters", () => {
    const count = countActiveSessionFilters({
      ...createDefaultSessionListFilters(),
      gameType: "board_game",
      search: "catan",
      onlyMine: true,
      playerTeamId: "team-1",
      datePreset: "this_year",
    })

    expect(count).toBe(5)
  })

  it("hashListSessionsOptions is stable for equivalent participant sets", () => {
    const left = hashListSessionsOptions({
      participantIds: ["b", "a"],
    })
    const right = hashListSessionsOptions({
      participantIds: ["a", "b"],
    })

    expect(left).toBe(right)
  })
})
