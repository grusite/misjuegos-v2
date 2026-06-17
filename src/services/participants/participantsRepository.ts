import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreateParticipantInput,
  Participant,
  UpdateParticipantInput,
} from "@/domain/types/participant"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable, fromPostgrestError } from "@/services/errors"
import {
  mapParticipant,
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
      const { error } = await client.from("participants").delete().eq("id", id)
      if (error) throw fromPostgrestError(error)
    },

    async linkProfile(id: string, profileId: string): Promise<Participant> {
      return this.update(id, { profileId })
    },
  }
}

export const participantsRepository = createParticipantsRepository(supabase)
