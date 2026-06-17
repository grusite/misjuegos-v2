export type TopGameStat = {
  title: string
  count: number
}

export type MonthlyTrendStat = {
  label: string
  boardCount: number
  escapeCount: number
}

export type FrequentPartnerStat = {
  displayName: string
  sessionCount: number
}

export type DashboardSummary = {
  totalProfiles: number
  totalParticipants: number
  totalSessions: number
  boardSessions: number
  escapeSessions: number
  averageBoardDurationMinutes: number
  boardWinRate: number
  boardWins: number
  boardCompleted: number
}

export type EscapeDashboardSummary = {
  totalCompleted: number
  escapedCount: number
  escapeRate: number
  averageCluesUsed: number | null
}

export type DashboardStats = {
  summary: DashboardSummary
  escapeSummary: EscapeDashboardSummary
  topBoardGames: TopGameStat[]
  topEscapeRooms: TopGameStat[]
  monthlyTrends: MonthlyTrendStat[]
  frequentPartners: FrequentPartnerStat[]
}
