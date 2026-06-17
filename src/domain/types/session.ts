import type { Json } from "./database"
import type { SessionOutcome, SessionStatus } from "./rows"

export type PlaySession = {
  id: string
  gameCatalogId: string
  createdBy: string
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

export type CreateSessionInput = {
  gameCatalogId: string
  createdBy: string
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
}

export type SessionMemberInput = {
  profileId?: string | null
  participantId?: string | null
}

export type ListSessionsOptions = {
  gameCatalogId?: string
  limit?: number
}
