import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreateSessionInput,
  ListSessionsOptions,
  PlaySession,
  SessionMemberInput,
  SessionParticipant,
  UpdateSessionInput,
} from "@/domain/types/session"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable } from "@/services/errors"
import {
  mapPlaySession,
  mapSessionParticipant,
  toPlaySessionInsert,
  toPlaySessionUpdate,
} from "@/services/sessions/sessionMapper"

export function createSessionsRepository(client: SupabaseClient<AppDatabase>) {
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

    async setParticipants(
      sessionId: string,
      members: SessionMemberInput[],
    ): Promise<SessionParticipant[]> {
      const deleteResult = await client
        .from("session_participants")
        .delete()
        .eq("session_id", sessionId)

      unwrap(deleteResult)

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
  }
}

export const sessionsRepository = createSessionsRepository(supabase)
