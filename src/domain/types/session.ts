import type { Json } from "./database"
import type { GameType, SessionOutcome, SessionStatus } from "./rows"

export type PlaySession = {
  id: string
  gameCatalogId: string
  createdBy: string
  playerTeamId: string | null
  playedAt: string
  status: SessionStatus
  outcome: SessionOutcome | null
  durationMs: number
  isPaused: boolean
  lastStartedAt: string | null
  endedAt: string | null
  notes: string | null
  source: string | null
  sourceHash: string | null
  sourceRaw: Json | null
  createdAt: string
  updatedAt: string
}

export type SessionParticipant = {
  id: string
  sessionId: string
  profileId: string | null
  participantId: string | null
}

export type SessionMessage = {
  id: string
  sessionId: string
  authorProfileId: string
  authorDisplayName: string
  content: string
  createdAt: string
}

export type SessionScore = {
  id: string
  sessionId: string
  profileId: string | null
  participantId: string | null
  score: number | null
  rank: number | null
  isWinner: boolean | null
}

export type CreateSessionInput = {
  gameCatalogId: string
  createdBy: string
  playerTeamId?: string | null
  playedAt: string
  status?: SessionStatus
  outcome?: SessionOutcome | null
  notes?: string | null
  source?: string | null
  sourceHash?: string | null
  sourceRaw?: Json | null
}

export type UpdateSessionInput = {
  playedAt?: string
  status?: SessionStatus
  outcome?: SessionOutcome | null
  durationMs?: number
  isPaused?: boolean
  lastStartedAt?: string | null
  endedAt?: string | null
  notes?: string | null
  playerTeamId?: string | null
}

export type SessionMemberInput = {
  profileId?: string | null
  participantId?: string | null
}

export type SessionMemberPreview = {
  id: string
  displayName: string
  avatarUrl: string | null
  colorClass: string | null
}

export type SessionMessageInput = {
  content: string
  authorProfileId: string
  authorDisplayName?: string
}

export type SessionScoreInput = {
  profileId?: string | null
  participantId?: string | null
  score?: number | null
  rank?: number | null
  isWinner?: boolean | null
}

export type ListSessionsOptions = {
  gameCatalogId?: string
  gameType?: GameType
  search?: string
  participantIds?: string[]
  playerTeamId?: string
  playedAtFrom?: string
  playedAtTo?: string
  limit?: number
  offset?: number
}

export type SessionListSummary = {
  id: string
  gameCatalogId: string
  gameType: GameType
  playedAt: string
  status: SessionStatus
  outcome: SessionOutcome | null
  notes: string | null
  playerTeamId: string | null
  gameTitle: string
  escapeCity: string | null
  escapeVenue: string | null
  escapeRating: number | null
}
