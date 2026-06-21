import { describe, expect, it } from "vitest"
import { buildDashboardStats } from "@/services/dashboard/dashboardStats"

describe("dashboardStats frequent partners", () => {
  it("counts partners when self is linked via participant profile_id", () => {
    const stats = buildDashboardStats({
      profileId: "user-1",
      totalProfiles: 2,
      totalParticipants: 3,
      sessions: [
        {
          id: "s1",
          playedAt: "2026-06-10T18:00:00.000Z",
          status: "completed",
          outcome: "win",
          durationMs: 0,
          gameType: "board_game",
          gameTitle: "Azul",
        },
        {
          id: "s2",
          playedAt: "2026-06-11T18:00:00.000Z",
          status: "completed",
          outcome: "win",
          durationMs: 0,
          gameType: "board_game",
          gameTitle: "Catan",
        },
      ],
      members: [
        {
          sessionId: "s1",
          memberKey: "profile:user-1",
          displayName: "Jorge",
        },
        {
          sessionId: "s1",
          memberKey: "participant:friend-1",
          displayName: "Edush",
        },
        {
          sessionId: "s2",
          memberKey: "profile:user-1",
          displayName: "Jorge",
        },
        {
          sessionId: "s2",
          memberKey: "participant:friend-1",
          displayName: "Edush",
        },
      ],
      escapes: [],
    })

    expect(stats.frequentPartners).toEqual([
      { displayName: "Edush", sessionCount: 2 },
    ])
  })

  it("ignores sessions where the logged-in user is not a member", () => {
    const stats = buildDashboardStats({
      profileId: "user-1",
      totalProfiles: 2,
      totalParticipants: 2,
      sessions: [
        {
          id: "s1",
          playedAt: "2026-06-10T18:00:00.000Z",
          status: "completed",
          outcome: "win",
          durationMs: 0,
          gameType: "board_game",
          gameTitle: "Azul",
        },
      ],
      members: [
        {
          sessionId: "s1",
          memberKey: "participant:friend-1",
          displayName: "Edush",
        },
        {
          sessionId: "s1",
          memberKey: "participant:friend-2",
          displayName: "Diego",
        },
      ],
      escapes: [],
    })

    expect(stats.frequentPartners).toEqual([])
  })
})
