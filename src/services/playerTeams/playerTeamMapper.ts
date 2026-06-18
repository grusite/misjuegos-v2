import type {
  CreatePlayerTeamInput,
  PlayerTeam,
  UpdatePlayerTeamInput,
} from "@/domain/types/playerTeam"
import type { Database } from "@/domain/types/database"
import { mapParticipant } from "@/services/participants/participantMapper"
import type { ParticipantRow } from "@/domain/types/rows"

type PlayerTeamUpdateRow = Database["public"]["Tables"]["player_teams"]["Update"]

type PlayerTeamRow = {
  id: string
  name: string
  description: string | null
  photo_path: string | null
  created_by: string
  created_at: string
  updated_at: string
}

type TeamMemberRow = {
  participant_id: string
  participants: ParticipantRow & {
    linked_profile?: { avatar_url: string | null } | null
  }
}

export type PlayerTeamRowWithMembers = PlayerTeamRow & {
  player_team_members: TeamMemberRow[]
}

export function mapPlayerTeam(row: PlayerTeamRow): PlayerTeam {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    photoPath: row.photo_path,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapPlayerTeamWithMembers(row: PlayerTeamRowWithMembers) {
  const members = (row.player_team_members ?? [])
    .map(member => member.participants)
    .filter(Boolean)
    .map(mapParticipant)

  return {
    ...mapPlayerTeam(row),
    members,
  }
}

export function toPlayerTeamInsert(createdBy: string, input: CreatePlayerTeamInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    photo_path: input.photoPath ?? null,
    created_by: createdBy,
  }
}

export function toPlayerTeamUpdate(input: UpdatePlayerTeamInput): PlayerTeamUpdateRow {
  const update: PlayerTeamUpdateRow = {}

  if (input.name !== undefined) update.name = input.name.trim()
  if (input.description !== undefined) {
    update.description = input.description?.trim() || null
  }
  if (input.photoPath !== undefined) update.photo_path = input.photoPath

  return update
}

export function uniqueParticipantIds(ids: string[]): string[] {
  return [...new Set(ids)]
}

export function toTeamMemberInserts(teamId: string, participantIds: string[]) {
  return uniqueParticipantIds(participantIds).map(participantId => ({
    team_id: teamId,
    participant_id: participantId,
  }))
}
