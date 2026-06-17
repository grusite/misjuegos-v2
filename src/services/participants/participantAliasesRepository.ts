import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import { normalizeAlias } from "@/domain/normalizeAlias"
import type {
  CreateParticipantAliasInput,
  ParticipantAlias,
} from "@/domain/types/participant"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable, fromPostgrestError } from "@/services/errors"
import { mapParticipantAlias } from "@/services/participants/participantMapper"

export function createParticipantAliasesRepository(
  client: SupabaseClient<AppDatabase>,
) {
  return {
    async listForParticipant(participantId: string): Promise<ParticipantAlias[]> {
      const result = await client
        .from("participant_aliases")
        .select("*")
        .eq("participant_id", participantId)
        .order("alias")

      return unwrap(result).map(mapParticipantAlias)
    },

    async findParticipantIdByAlias(alias: string): Promise<string | null> {
      const normalized = normalizeAlias(alias)

      const result = await client
        .from("participant_aliases")
        .select("participant_id")
        .eq("alias", normalized)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row?.participant_id ?? null
    },

    async add(
      participantId: string,
      input: CreateParticipantAliasInput,
    ): Promise<ParticipantAlias> {
      const result = await client
        .from("participant_aliases")
        .insert({
          participant_id: participantId,
          alias: normalizeAlias(input.alias),
          source: input.source ?? "manual",
        })
        .select("*")
        .single()

      return mapParticipantAlias(unwrap(result))
    },

    async remove(id: string): Promise<void> {
      const { error } = await client
        .from("participant_aliases")
        .delete()
        .eq("id", id)

      if (error) throw fromPostgrestError(error)
    },
  }
}

export const participantAliasesRepository =
  createParticipantAliasesRepository(supabase)
