import type { Participant } from "@/domain/types/participant"

export type PlayerTeam = {
  id: string
  name: string
  description: string | null
  photoPath: string | null
  photoUrl: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type PlayerTeamWithMembers = PlayerTeam & {
  members: Participant[]
}

export type CreatePlayerTeamInput = {
  name: string
  description?: string | null
  photoPath?: string | null
  participantIds: string[]
}

export type UpdatePlayerTeamInput = {
  name?: string
  description?: string | null
  photoPath?: string | null
  participantIds?: string[]
}
