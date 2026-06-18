import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreateSessionInput,
  ListSessionsOptions,
  PlaySession,
  SessionListSummary,
  SessionMemberInput,
  SessionMemberPreview,
  SessionMessage,
  SessionMessageInput,
  SessionParticipant,
  SessionScore,
  SessionScoreInput,
  UpdateSessionInput,
} from "@/domain/types/session"
import type { GameType } from "@/domain/types/rows"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable, fromPostgrestError } from "@/services/errors"
import {
  mapBoardSessionDetails,
  toBoardSessionDetailsUpsert,
} from "@/services/sessions/boardSessionMapper"
import type {
  BoardSessionDetails,
  UpsertBoardSessionDetailsInput,
} from "@/domain/types/boardSession"
import {
  mapEscapeSessionDetails,
  toEscapeSessionDetailsUpsert,
} from "@/services/sessions/escapeSessionMapper"
import type {
  EscapeSessionDetails,
  UpsertEscapeSessionDetailsInput,
} from "@/domain/types/escapeSession"
import {
  mapPlaySession,
  mapSessionMemberPreview,
  mapSessionParticipant,
  toPlaySessionInsert,
  toPlaySessionUpdate,
} from "@/services/sessions/sessionMapper"

import {
  escapeIlikePattern,
} from "@/services/sessions/sessionListFilters"

const SESSION_CATALOG_EMBED = `
  title,
  type,
  escape_room_details (
    city,
    venue
  )
`

function buildSessionListSelect(options: ListSessionsOptions): string {
  const needsCatalogInner = Boolean(options.search || options.gameType)
  const catalogEmbed = needsCatalogInner
    ? `game_catalog!inner (${SESSION_CATALOG_EMBED})`
    : `game_catalog:game_catalog_id (${SESSION_CATALOG_EMBED})`

  const participantEmbed =
    options.participantIds && options.participantIds.length > 0
      ? ", session_participants!inner(participant_id)"
      : ""

  return `
    id,
    game_catalog_id,
    played_at,
    status,
    outcome,
    notes,
    player_team_id,
    ${catalogEmbed}
    ${participantEmbed}
  `
}

type FilterableQuery = {
  eq: (column: string, value: unknown) => FilterableQuery
  gte: (column: string, value: unknown) => FilterableQuery
  lte: (column: string, value: unknown) => FilterableQuery
  in: (column: string, values: readonly unknown[]) => FilterableQuery
  or: (filters: string) => FilterableQuery
}

function applyListFilters(
  query: FilterableQuery,
  options: ListSessionsOptions,
): FilterableQuery {
  let next = query

  if (options.gameCatalogId) {
    next = next.eq("game_catalog_id", options.gameCatalogId)
  }

  if (options.gameType) {
    next = next.eq("game_catalog.type", options.gameType)
  }

  if (options.search) {
    const pattern = `%${escapeIlikePattern(options.search)}%`
    next = next.or(
      `game_catalog.title.ilike.${pattern},game_catalog.escape_room_details.city.ilike.${pattern},game_catalog.escape_room_details.venue.ilike.${pattern}`,
    )
  }

  if (options.participantIds && options.participantIds.length > 0) {
    next = next.in("session_participants.participant_id", options.participantIds)
  }

  if (options.playerTeamId) {
    next = next.eq("player_team_id", options.playerTeamId)
  }

  if (options.playedAtFrom) {
    next = next.gte("played_at", options.playedAtFrom)
  }

  if (options.playedAtTo) {
    next = next.lte("played_at", options.playedAtTo)
  }

  return next
}

const MESSAGE_SELECT =
  "id, session_id, author_profile_id, content, created_at, author:profiles!session_messages_author_profile_id_fkey(display_name)"

type SessionListRow = {
  id: string
  game_catalog_id: string
  played_at: string
  status: PlaySession["status"]
  outcome: PlaySession["outcome"]
  notes: string | null
  player_team_id: string | null
  game_catalog: {
    title: string
    type: GameType
    escape_room_details: { city: string | null; venue: string | null } | null
  } | null
}

type CoParticipantRow = {
  participant: {
    id: string
    display_name: string
    profile_id: string | null
  } | null
}

function mapSessionListSummary(row: SessionListRow): SessionListSummary {
  const escapeDetails = row.game_catalog?.escape_room_details ?? null

  return {
    id: row.id,
    gameCatalogId: row.game_catalog_id,
    gameType: row.game_catalog?.type ?? "board_game",
    playedAt: row.played_at,
    status: row.status,
    outcome: row.outcome,
    notes: row.notes,
    playerTeamId: row.player_team_id,
    gameTitle: row.game_catalog?.title ?? "Juego",
    escapeCity: escapeDetails?.city ?? null,
    escapeVenue: escapeDetails?.venue ?? null,
  }
}

const SESSION_MEMBER_PREVIEW_SELECT = `
  id,
  session_id,
  participant:participants (
    display_name,
    color,
    linked_profile:profiles!participants_profile_id_fkey (
      display_name,
      avatar_url
    )
  ),
  profile:profiles!session_participants_profile_id_fkey (
    display_name,
    avatar_url
  )
`

type SessionMessageRow = AppDatabase["public"]["Tables"]["session_messages"]["Row"]
type SessionMessageAuthorRow = { display_name: string }

export function createSessionsRepository(client: SupabaseClient<AppDatabase>) {
  function mapSessionMessage(
    row: SessionMessageRow & { author?: SessionMessageAuthorRow | null },
    fallbackAuthorName?: string,
  ): SessionMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      authorProfileId: row.author_profile_id,
      authorDisplayName: row.author?.display_name ?? fallbackAuthorName ?? "Usuario",
      content: row.content,
      createdAt: row.created_at,
    }
  }

  function mapSessionScore(row: AppDatabase["public"]["Tables"]["board_game_scores"]["Row"]): SessionScore {
    return {
      id: row.id,
      sessionId: row.session_id,
      profileId: row.profile_id,
      participantId: row.participant_id,
      score: row.score,
      rank: row.rank,
      isWinner: row.is_winner,
    }
  }

  return {
    async list(options: ListSessionsOptions = {}): Promise<PlaySession[]> {
      let query = client
        .from("play_sessions")
        .select("*")
        .order("played_at", { ascending: false })

      if (options.gameCatalogId) {
        query = query.eq("game_catalog_id", options.gameCatalogId)
      }

      if (options.playerTeamId) {
        query = query.eq("player_team_id", options.playerTeamId)
      }

      if (options.playedAtFrom) {
        query = query.gte("played_at", options.playedAtFrom)
      }

      if (options.playedAtTo) {
        query = query.lte("played_at", options.playedAtTo)
      }

      if (options.limit !== undefined) {
        const offset = options.offset ?? 0
        query = query.range(offset, offset + options.limit - 1)
      } else if (options.offset !== undefined) {
        query = query.range(options.offset, options.offset + 24)
      }

      const result = await query
      return unwrap(result).map(mapPlaySession)
    },

    async listSummaries(
      options: ListSessionsOptions = {},
    ): Promise<SessionListSummary[]> {
      let query = client
        .from("play_sessions")
        .select(buildSessionListSelect(options))
        .order("played_at", { ascending: false })

      query = applyListFilters(query as FilterableQuery, options) as typeof query

      if (options.limit !== undefined) {
        const offset = options.offset ?? 0
        query = query.range(offset, offset + options.limit - 1)
      } else if (options.offset !== undefined) {
        query = query.range(options.offset, options.offset + 24)
      }

      const result = await query
      return unwrap(result).map(row =>
        mapSessionListSummary(row as unknown as SessionListRow),
      )
    },

    async getById(id: string): Promise<PlaySession | null> {
      const result = await client
        .from("play_sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapPlaySession(row) : null
    },

    async getBySourceHash(sourceHash: string): Promise<PlaySession | null> {
      const result = await client
        .from("play_sessions")
        .select("*")
        .eq("source_hash", sourceHash)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapPlaySession(row) : null
    },

    async create(input: CreateSessionInput): Promise<PlaySession> {
      const result = await client
        .from("play_sessions")
        .insert(toPlaySessionInsert(input))
        .select("*")
        .single()

      return mapPlaySession(unwrap(result))
    },

    async update(id: string, input: UpdateSessionInput): Promise<PlaySession> {
      const result = await client
        .from("play_sessions")
        .update(toPlaySessionUpdate(input))
        .eq("id", id)
        .select("*")
        .single()

      return mapPlaySession(unwrap(result))
    },

    async listParticipants(sessionId: string): Promise<SessionParticipant[]> {
      const result = await client
        .from("session_participants")
        .select("*")
        .eq("session_id", sessionId)

      return unwrap(result).map(mapSessionParticipant)
    },

    async listSessionIdsForParticipant(participantId: string): Promise<string[]> {
      const result = await client
        .from("session_participants")
        .select("session_id")
        .eq("participant_id", participantId)

      return [...new Set(unwrap(result).map(row => row.session_id))]
    },

    async listSessionIdsForProfile(profileId: string): Promise<string[]> {
      const result = await client
        .from("session_participants")
        .select("session_id, participants!inner(profile_id)")
        .eq("participants.profile_id", profileId)

      return [...new Set(unwrap(result).map(row => row.session_id))]
    },

    async listDistinctCoParticipants(
      sessionIds: string[],
      excludeParticipantId: string,
    ): Promise<Array<{ displayName: string; profileId: string | null }>> {
      if (sessionIds.length === 0) return []

      const result = await client
        .from("session_participants")
        .select(`
          participant:participants (
            id,
            display_name,
            profile_id
          )
        `)
        .in("session_id", sessionIds)
        .neq("participant_id", excludeParticipantId)
        .not("participant_id", "is", null)

      const seen = new Map<string, { displayName: string; profileId: string | null }>()

      for (const row of unwrap(result) as CoParticipantRow[]) {
        if (!row.participant) continue

        seen.set(row.participant.id, {
          displayName: row.participant.display_name,
          profileId: row.participant.profile_id,
        })
      }

      return Array.from(seen.values())
    },

    async listMemberPreviewsBySessionIds(
      sessionIds: string[],
    ): Promise<Map<string, SessionMemberPreview[]>> {
      const grouped = new Map<string, SessionMemberPreview[]>()

      if (sessionIds.length === 0) return grouped

      const result = await client
        .from("session_participants")
        .select(SESSION_MEMBER_PREVIEW_SELECT)
        .in("session_id", sessionIds)

      for (const row of unwrap(result)) {
        const { sessionId, member } = mapSessionMemberPreview(row)
        const members = grouped.get(sessionId) ?? []
        members.push(member)
        grouped.set(sessionId, members)
      }

      return grouped
    },

    async setParticipants(
      sessionId: string,
      members: SessionMemberInput[],
    ): Promise<SessionParticipant[]> {
      const { error: deleteError } = await client
        .from("session_participants")
        .delete()
        .eq("session_id", sessionId)

      if (deleteError) throw fromPostgrestError(deleteError)

      if (members.length === 0) return []

      const insertResult = await client
        .from("session_participants")
        .insert(
          members.map(member => ({
            session_id: sessionId,
            profile_id: member.profileId ?? null,
            participant_id: member.participantId ?? null,
          })),
        )
        .select("*")

      return unwrap(insertResult).map(mapSessionParticipant)
    },

    async listMessages(sessionId: string): Promise<SessionMessage[]> {
      const result = await client
        .from("session_messages")
        .select(MESSAGE_SELECT)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })

      return unwrap(result).map(row => mapSessionMessage(row))
    },

    async addMessage(
      sessionId: string,
      input: SessionMessageInput,
    ): Promise<SessionMessage> {
      const result = await client
        .from("session_messages")
        .insert({
          session_id: sessionId,
          author_profile_id: input.authorProfileId,
          content: input.content,
        })
        .select(MESSAGE_SELECT)
        .single()

      return mapSessionMessage(unwrap(result), input.authorDisplayName)
    },

    async listScores(sessionId: string): Promise<SessionScore[]> {
      const result = await client
        .from("board_game_scores")
        .select("*")
        .eq("session_id", sessionId)
        .order("rank", { ascending: true, nullsFirst: false })

      return unwrap(result).map(mapSessionScore)
    },

    async setScores(
      sessionId: string,
      scores: SessionScoreInput[],
    ): Promise<SessionScore[]> {
      const { error: deleteError } = await client
        .from("board_game_scores")
        .delete()
        .eq("session_id", sessionId)

      if (deleteError) throw fromPostgrestError(deleteError)
      if (scores.length === 0) return []

      const result = await client
        .from("board_game_scores")
        .insert(
          scores.map(score => ({
            session_id: sessionId,
            profile_id: score.profileId ?? null,
            participant_id: score.participantId ?? null,
            score: score.score ?? null,
            rank: score.rank ?? null,
            is_winner: score.isWinner ?? null,
          })),
        )
        .select("*")

      return unwrap(result).map(mapSessionScore)
    },

    async getEscapeSessionDetails(
      sessionId: string,
    ): Promise<EscapeSessionDetails | null> {
      const result = await client
        .from("escape_session_details")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapEscapeSessionDetails(row) : null
    },

    async upsertEscapeSessionDetails(
      sessionId: string,
      input: UpsertEscapeSessionDetailsInput,
    ): Promise<EscapeSessionDetails> {
      const result = await client
        .from("escape_session_details")
        .upsert(toEscapeSessionDetailsUpsert(sessionId, input), {
          onConflict: "session_id",
        })
        .select("*")
        .single()

      return mapEscapeSessionDetails(unwrap(result))
    },

    async getBoardSessionDetails(
      sessionId: string,
    ): Promise<BoardSessionDetails | null> {
      const result = await client
        .from("board_session_details")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapBoardSessionDetails(row) : null
    },

    async upsertBoardSessionDetails(
      sessionId: string,
      input: UpsertBoardSessionDetailsInput,
    ): Promise<BoardSessionDetails> {
      const result = await client
        .from("board_session_details")
        .upsert(toBoardSessionDetailsUpsert(sessionId, input), {
          onConflict: "session_id",
        })
        .select("*")
        .single()

      return mapBoardSessionDetails(unwrap(result))
    },
  }
}

export const sessionsRepository = createSessionsRepository(supabase)
