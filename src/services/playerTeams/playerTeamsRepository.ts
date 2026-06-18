import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  CreatePlayerTeamInput,
  PlayerTeamWithMembers,
  UpdatePlayerTeamInput,
} from "@/domain/types/playerTeam"
import type { AppDatabase } from "@/domain/types/schema"
import { fromPostgrestError, unwrap, unwrapNullable } from "@/services/errors"
import {
  mapPlayerTeamWithMembers,
  toPlayerTeamInsert,
  toPlayerTeamUpdate,
  toTeamMemberInserts,
  type PlayerTeamRowWithMembers,
} from "@/services/playerTeams/playerTeamMapper"

const TEAM_WITH_MEMBERS_SELECT = `
  *,
  player_team_members (
    participant_id,
    participants (
      id,
      owner_id,
      profile_id,
      display_name,
      color,
      created_at,
      linked_profile:profiles!participants_profile_id_fkey (
        avatar_url
      )
    )
  )
`

export function createPlayerTeamsRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async listForOwner(createdBy: string): Promise<PlayerTeamWithMembers[]> {
      const result = await client
        .from("player_teams")
        .select(TEAM_WITH_MEMBERS_SELECT)
        .eq("created_by", createdBy)
        .order("name")

      return unwrap(result).map(row =>
        mapPlayerTeamWithMembers(row as PlayerTeamRowWithMembers),
      )
    },

    async getById(id: string): Promise<PlayerTeamWithMembers | null> {
      const result = await client
        .from("player_teams")
        .select(TEAM_WITH_MEMBERS_SELECT)
        .eq("id", id)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapPlayerTeamWithMembers(row as PlayerTeamRowWithMembers) : null
    },

    async create(
      createdBy: string,
      input: CreatePlayerTeamInput,
    ): Promise<PlayerTeamWithMembers> {
      const insertResult = await client
        .from("player_teams")
        .insert(toPlayerTeamInsert(createdBy, input))
        .select("*")
        .single()

      const team = unwrap(insertResult)
      await this.setMembers(team.id, input.participantIds)

      const created = await this.getById(team.id)
      if (!created) throw new Error("No se pudo cargar el equipo creado")

      return created
    },

    async update(
      id: string,
      input: UpdatePlayerTeamInput,
    ): Promise<PlayerTeamWithMembers> {
      const updatePayload = toPlayerTeamUpdate(input)

      if (Object.keys(updatePayload).length > 0) {
        const result = await client
          .from("player_teams")
          .update(updatePayload)
          .eq("id", id)
          .select("*")
          .single()

        unwrap(result)
      }

      if (input.participantIds) {
        await this.setMembers(id, input.participantIds)
      }

      const updated = await this.getById(id)
      if (!updated) throw new Error("No se pudo cargar el equipo actualizado")

      return updated
    },

    async setMembers(teamId: string, participantIds: string[]): Promise<void> {
      const { error: deleteError } = await client
        .from("player_team_members")
        .delete()
        .eq("team_id", teamId)

      if (deleteError) throw fromPostgrestError(deleteError)

      const inserts = toTeamMemberInserts(teamId, participantIds)
      if (inserts.length === 0) return

      const { error: insertError } = await client
        .from("player_team_members")
        .insert(inserts)

      if (insertError) throw fromPostgrestError(insertError)
    },

    async remove(id: string): Promise<void> {
      const { error } = await client.from("player_teams").delete().eq("id", id)
      if (error) throw fromPostgrestError(error)
    },
  }
}

export const playerTeamsRepository = createPlayerTeamsRepository(supabase)
