import { describe, expect, it } from "vitest"
import { buildDashboardStats } from "@/services/dashboard/dashboardStats"

describe("dashboardStats", () => {
  it("buildDashboardStats aggregates board, escape, trends and partners", () => {
    const stats = buildDashboardStats({
      profileId: "user-1",
      totalProfiles: 3,
      totalParticipants: 5,
      sessions: [
        {
          id: "s1",
          playedAt: "2026-06-10T18:00:00.000Z",
          status: "completed",
          outcome: "win",
          durationMs: 3_600_000,
          gameType: "board_game",
          gameTitle: "Azul",
        },
        {
          id: "s2",
          playedAt: "2026-06-17T20:00:00.000Z",
          status: "completed",
          outcome: "escaped",
          durationMs: 0,
          gameType: "escape_room",
          gameTitle: "La Maldición",
        },
        {
          id: "s3",
          playedAt: "2026-06-17T21:00:00.000Z",
          status: "completed",
          outcome: "win",
          durationMs: 1_800_000,
          gameType: "board_game",
          gameTitle: "Azul",
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
          memberKey: "participant:p1",
          displayName: "Edush",
        },
        {
          sessionId: "s3",
          memberKey: "profile:user-1",
          displayName: "Jorge",
        },
        {
          sessionId: "s3",
          memberKey: "participant:p1",
          displayName: "Edush",
        },
      ],
      escapes: [
        { sessionId: "s2", escaped: true, cluesUsed: 2, rating: 5 },
      ],
    })

    expect(stats.summary.totalSessions).toBe(3)
    expect(stats.summary.boardSessions).toBe(2)
    expect(stats.summary.escapeSessions).toBe(1)
    expect(stats.summary.boardWinRate).toBe(100)
    expect(stats.summary.averageBoardDurationMinutes).toBe(45)
    expect(stats.escapeSummary.escapeRate).toBe(100)
    expect(stats.escapeSummary.averageRating).toBe(5)
    expect(stats.topRatedEscapeRooms[0]).toEqual({
      title: "La Maldición",
      averageRating: 5,
      ratedCount: 1,
    })
    expect(stats.topBoardGames[0]).toEqual({ title: "Azul", count: 2 })
    expect(stats.monthlyTrends).toHaveLength(1)
    expect(stats.frequentPartners[0]).toEqual({
      displayName: "Edush",
      sessionCount: 2,
    })
  })
})
