import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreateDesiredGameInput,
  DesiredGame,
  DesiredGameStatus,
  UpdateDesiredGameInput,
} from "@/domain/types/desiredGame"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable } from "@/services/errors"
import {
  mapDesiredGame,
  toDesiredGameInsert,
  toDesiredGameUpdate,
} from "@/services/desiredGames/desiredGameMapper"

export function createDesiredGamesRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async list(): Promise<DesiredGame[]> {
      const result = await client
        .from("desired_games")
        .select("*")
        .order("priority", { ascending: false, nullsFirst: false })
        .order("title")

      return unwrap(result).map(mapDesiredGame)
    },

    async getById(id: string): Promise<DesiredGame | null> {
      const result = await client
        .from("desired_games")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapDesiredGame(row) : null
    },

    async getBySourceHash(
      createdBy: string,
      sourceHash: string,
    ): Promise<DesiredGame | null> {
      const result = await client
        .from("desired_games")
        .select("*")
        .eq("created_by", createdBy)
        .eq("source_hash", sourceHash)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapDesiredGame(row) : null
    },

    async create(
      createdBy: string,
      input: CreateDesiredGameInput,
    ): Promise<DesiredGame> {
      const result = await client
        .from("desired_games")
        .insert(toDesiredGameInsert(createdBy, input))
        .select("*")
        .single()

      return mapDesiredGame(unwrap(result))
    },

    async update(
      id: string,
      input: UpdateDesiredGameInput,
    ): Promise<DesiredGame> {
      const result = await client
        .from("desired_games")
        .update(toDesiredGameUpdate(input))
        .eq("id", id)
        .select("*")
        .single()

      return mapDesiredGame(unwrap(result))
    },

    async updateStatus(
      id: string,
      status: DesiredGameStatus,
    ): Promise<DesiredGame> {
      return this.update(id, { status })
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from("desired_games").delete().eq("id", id)
      if (error) throw error
    },
  }
}

export const desiredGamesRepository = createDesiredGamesRepository(supabase)
