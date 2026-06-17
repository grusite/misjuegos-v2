import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreateParticipantInput,
  Participant,
  ParticipantWithAliases,
  UpdateParticipantInput,
} from "@/domain/types/participant"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable, fromPostgrestError } from "@/services/errors"
import {
  mapParticipant,
  mapParticipantAlias,
  toParticipantInsert,
  toParticipantUpdate,
} from "@/services/participants/participantMapper"

export function createParticipantsRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async listForOwner(ownerId: string): Promise<Participant[]> {
      const result = await client
        .from("participants")
        .select("*")
        .eq("owner_id", ownerId)
        .order("display_name")

      return unwrap(result).map(mapParticipant)
    },

    async listForOwnerWithAliases(
      ownerId: string,
    ): Promise<ParticipantWithAliases[]> {
      const result = await client
        .from("participants")
        .select("*, participant_aliases(*)")
        .eq("owner_id", ownerId)
        .order("display_name")

      return unwrap(result).map(row => ({
        ...mapParticipant(row),
        aliases: (row.participant_aliases ?? []).map(mapParticipantAlias),
      }))
    },

    async search(ownerId: string, query: string): Promise<Participant[]> {
      const result = await client
        .from("participants")
        .select("*")
        .eq("owner_id", ownerId)
        .ilike("display_name", `%${query}%`)
        .order("display_name")

      return unwrap(result).map(mapParticipant)
    },

    async getById(id: string): Promise<Participant | null> {
      const result = await client
        .from("participants")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapParticipant(row) : null
    },

    async findByProfileId(
      ownerId: string,
      profileId: string,
    ): Promise<Participant | null> {
      const result = await client
        .from("participants")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("profile_id", profileId)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapParticipant(row) : null
    },

    async findByDisplayName(
      ownerId: string,
      displayName: string,
    ): Promise<Participant | null> {
      const result = await client
        .from("participants")
        .select("*")
        .eq("owner_id", ownerId)
        .ilike("display_name", displayName)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapParticipant(row) : null
    },

    async create(
      ownerId: string,
      input: CreateParticipantInput,
    ): Promise<Participant> {
      const result = await client
        .from("participants")
        .insert(toParticipantInsert(ownerId, input))
        .select("*")
        .single()

      return mapParticipant(unwrap(result))
    },

    async update(
      id: string,
      input: UpdateParticipantInput,
    ): Promise<Participant> {
      const result = await client
        .from("participants")
        .update(toParticipantUpdate(input))
        .eq("id", id)
        .select("*")
        .single()

      return mapParticipant(unwrap(result))
    },

    async remove(id: string): Promise<void> {
      await this.reassignAndRemove(id)
    },

    async reassignAndRemove(
      participantId: string,
      replacementParticipantId?: string,
    ): Promise<void> {
      if (replacementParticipantId) {
        const { data: sessionRows, error: sessionFetchError } = await client
          .from("session_participants")
          .select("id, session_id")
          .eq("participant_id", participantId)

        if (sessionFetchError) throw fromPostgrestError(sessionFetchError)

        for (const row of sessionRows ?? []) {
          const { data: existing } = await client
            .from("session_participants")
            .select("id")
            .eq("session_id", row.session_id)
            .eq("participant_id", replacementParticipantId)
            .maybeSingle()

          if (existing) {
            const { error } = await client
              .from("session_participants")
              .delete()
              .eq("id", row.id)

            if (error) throw fromPostgrestError(error)
          } else {
            const { error } = await client
              .from("session_participants")
              .update({ participant_id: replacementParticipantId })
              .eq("id", row.id)

            if (error) throw fromPostgrestError(error)
          }
        }

        const { data: scoreRows, error: scoreFetchError } = await client
          .from("board_game_scores")
          .select("id, session_id")
          .eq("participant_id", participantId)

        if (scoreFetchError) throw fromPostgrestError(scoreFetchError)

        for (const row of scoreRows ?? []) {
          const { data: existing } = await client
            .from("board_game_scores")
            .select("id")
            .eq("session_id", row.session_id)
            .eq("participant_id", replacementParticipantId)
            .maybeSingle()

          if (existing) {
            const { error } = await client
              .from("board_game_scores")
              .delete()
              .eq("id", row.id)

            if (error) throw fromPostgrestError(error)
          } else {
            const { error } = await client
              .from("board_game_scores")
              .update({ participant_id: replacementParticipantId })
              .eq("id", row.id)

            if (error) throw fromPostgrestError(error)
          }
        }
      } else {
        const { error: sessionError } = await client
          .from("session_participants")
          .delete()
          .eq("participant_id", participantId)

        if (sessionError) throw fromPostgrestError(sessionError)

        const { error: scoreError } = await client
          .from("board_game_scores")
          .delete()
          .eq("participant_id", participantId)

        if (scoreError) throw fromPostgrestError(scoreError)
      }

      const { error } = await client.from("participants").delete().eq("id", participantId)
      if (error) throw fromPostgrestError(error)
    },

    async linkProfile(id: string, profileId: string): Promise<Participant> {
      return this.update(id, { profileId })
    },
  }
}

export const participantsRepository = createParticipantsRepository(supabase)
