import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreateSessionInput,
  ListSessionsOptions,
  PlaySession,
  SessionMemberInput,
  SessionMemberPreview,
  SessionMessage,
  SessionMessageInput,
  SessionParticipant,
  SessionScore,
  SessionScoreInput,
  UpdateSessionInput,
} from "@/domain/types/session"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable, fromPostgrestError } from "@/services/errors"
import {
  mapEscapeSessionDetails,
  toEscapeSessionDetailsUpsert,
} from "@/services/sessions/escapeSessionMapper"
import type { EscapeSessionDetails, UpsertEscapeSessionDetailsInput } from "@/domain/types/escapeSession"
import {
  mapPlaySession,
  mapSessionMemberPreview,
  mapSessionParticipant,
  toPlaySessionInsert,
  toPlaySessionUpdate,
} from "@/services/sessions/sessionMapper"

const MESSAGE_SELECT =
  "id, session_id, author_profile_id, content, created_at, author:profiles!session_messages_author_profile_id_fkey(display_name)"

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

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const result = await query
      return unwrap(result).map(mapPlaySession)
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
  }
}

export const sessionsRepository = createSessionsRepository(supabase)
