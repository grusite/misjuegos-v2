import type {
  DashboardStats,
  FrequentPartnerStat,
  MonthlyTrendStat,
  TopGameStat,
} from "@/domain/types/dashboard"
import type { GameType, SessionOutcome } from "@/domain/types/rows"

export type DashboardSessionRow = {
  id: string
  playedAt: string
  status: string
  outcome: SessionOutcome | null
  durationMs: number
  gameType: GameType
  gameTitle: string
}

export type DashboardMemberRow = {
  sessionId: string
  memberKey: string
  displayName: string
}

export type DashboardEscapeRow = {
  sessionId: string
  escaped: boolean | null
  cluesUsed: number | null
}

export type BuildDashboardStatsInput = {
  profileId: string
  totalProfiles: number
  totalParticipants: number
  sessions: DashboardSessionRow[]
  members: DashboardMemberRow[]
  escapes: DashboardEscapeRow[]
}

const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const

export function buildDashboardStats(input: BuildDashboardStatsInput): DashboardStats {
  const boardSessions = input.sessions.filter(session => session.gameType === "board_game")
  const escapeSessions = input.sessions.filter(session => session.gameType === "escape_room")

  const completedBoard = boardSessions.filter(session => session.status === "completed")
  const boardWins = completedBoard.filter(session => session.outcome === "win").length
  const boardWinRate =
    completedBoard.length > 0 ? Math.round((boardWins / completedBoard.length) * 1000) / 10 : 0

  const timedBoard = boardSessions.filter(session => session.durationMs > 0)
  const averageBoardDurationMinutes =
    timedBoard.length > 0
      ? Math.round(
          (timedBoard.reduce((sum, session) => sum + session.durationMs, 0) /
            timedBoard.length /
            60000) *
            10,
        ) / 10
      : 0

  const escapeBySession = new Map(input.escapes.map(row => [row.sessionId, row]))
  const completedEscapes = escapeSessions.filter(session => session.status === "completed")
  const escapedCount = completedEscapes.filter(session => {
    const details = escapeBySession.get(session.id)
    return details?.escaped === true || session.outcome === "escaped"
  }).length

  const escapeRate =
    completedEscapes.length > 0
      ? Math.round((escapedCount / completedEscapes.length) * 1000) / 10
      : 0

  const clues = input.escapes
    .map(row => row.cluesUsed)
    .filter((value): value is number => value !== null && value >= 0)
  const averageCluesUsed =
    clues.length > 0
      ? Math.round((clues.reduce((sum, value) => sum + value, 0) / clues.length) * 10) / 10
      : null

  return {
    summary: {
      totalProfiles: input.totalProfiles,
      totalParticipants: input.totalParticipants,
      totalSessions: input.sessions.length,
      boardSessions: boardSessions.length,
      escapeSessions: escapeSessions.length,
      averageBoardDurationMinutes,
      boardWinRate,
      boardWins,
      boardCompleted: completedBoard.length,
    },
    escapeSummary: {
      totalCompleted: completedEscapes.length,
      escapedCount,
      escapeRate,
      averageCluesUsed,
    },
    topBoardGames: buildTopGames(boardSessions),
    topEscapeRooms: buildTopGames(escapeSessions),
    monthlyTrends: buildMonthlyTrends(input.sessions),
    frequentPartners: buildFrequentPartners(input.profileId, input.members),
  }
}

function buildTopGames(sessions: DashboardSessionRow[]): TopGameStat[] {
  const counts = new Map<string, number>()

  for (const session of sessions) {
    const title = session.gameTitle.trim() || "Sin título"
    counts.set(title, (counts.get(title) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "es"))
    .slice(0, 5)
}

function buildMonthlyTrends(sessions: DashboardSessionRow[]): MonthlyTrendStat[] {
  const buckets = new Map<string, MonthlyTrendStat>()

  for (const session of sessions) {
    const playedAt = new Date(session.playedAt)
    const key = `${playedAt.getFullYear()}-${String(playedAt.getMonth() + 1).padStart(2, "0")}`
    const label = `${MONTH_LABELS[playedAt.getMonth()]} ${playedAt.getFullYear()}`

    const bucket = buckets.get(key) ?? {
      label,
      boardCount: 0,
      escapeCount: 0,
    }

    if (session.gameType === "board_game") bucket.boardCount += 1
    else bucket.escapeCount += 1

    buckets.set(key, bucket)
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([, value]) => value)
}

function buildFrequentPartners(
  profileId: string,
  members: DashboardMemberRow[],
): FrequentPartnerStat[] {
  const membersBySession = new Map<string, DashboardMemberRow[]>()

  for (const member of members) {
    const sessionMembers = membersBySession.get(member.sessionId) ?? []
    sessionMembers.push(member)
    membersBySession.set(member.sessionId, sessionMembers)
  }

  const selfKey = `profile:${profileId}`
  const partnerCounts = new Map<string, { displayName: string; sessionCount: number }>()

  for (const sessionMembers of membersBySession.values()) {
    const includesSelf = sessionMembers.some(member => member.memberKey === selfKey)
    if (!includesSelf) continue

    for (const member of sessionMembers) {
      if (member.memberKey === selfKey) continue

      const current = partnerCounts.get(member.memberKey) ?? {
        displayName: member.displayName,
        sessionCount: 0,
      }

      partnerCounts.set(member.memberKey, {
        displayName: member.displayName,
        sessionCount: current.sessionCount + 1,
      })
    }
  }

  return Array.from(partnerCounts.values())
    .sort((a, b) => b.sessionCount - a.sessionCount || a.displayName.localeCompare(b.displayName, "es"))
    .slice(0, 5)
}
