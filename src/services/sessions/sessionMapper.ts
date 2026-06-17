import type {
  CreateSessionInput,
  PlaySession,
  SessionParticipant,
  UpdateSessionInput,
} from "@/domain/types/session"
import type {
  PlaySessionInsert,
  PlaySessionRow,
  PlaySessionUpdate,
  SessionParticipantRow,
} from "@/domain/types/rows"

export function mapPlaySession(row: PlaySessionRow): PlaySession {
  return {
    id: row.id,
    gameCatalogId: row.game_catalog_id,
    createdBy: row.created_by,
    playedAt: row.played_at,
    status: row.status,
    outcome: row.outcome,
    durationMs: row.duration_ms,
    isPaused: row.is_paused,
    lastStartedAt: row.last_started_at,
    endedAt: row.ended_at,
    notes: row.notes,
    source: row.source,
    sourceHash: row.source_hash,
    sourceRaw: row.source_raw,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapSessionParticipant(
  row: SessionParticipantRow,
): SessionParticipant {
  return {
    id: row.id,
    sessionId: row.session_id,
    profileId: row.profile_id,
    participantId: row.participant_id,
  }
}

export function toPlaySessionInsert(input: CreateSessionInput): PlaySessionInsert {
  return {
    game_catalog_id: input.gameCatalogId,
    created_by: input.createdBy,
    played_at: input.playedAt,
    status: input.status ?? "planned",
    outcome: input.outcome ?? null,
    notes: input.notes ?? null,
    source: input.source ?? null,
    source_hash: input.sourceHash ?? null,
    source_raw: input.sourceRaw ?? null,
  }
}

export function toPlaySessionUpdate(
  input: UpdateSessionInput,
): PlaySessionUpdate {
  return {
    ...(input.playedAt !== undefined && { played_at: input.playedAt }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.outcome !== undefined && { outcome: input.outcome }),
    ...(input.durationMs !== undefined && { duration_ms: input.durationMs }),
    ...(input.isPaused !== undefined && { is_paused: input.isPaused }),
    ...(input.lastStartedAt !== undefined && {
      last_started_at: input.lastStartedAt,
    }),
    ...(input.endedAt !== undefined && { ended_at: input.endedAt }),
    ...(input.notes !== undefined && { notes: input.notes }),
  }
}
