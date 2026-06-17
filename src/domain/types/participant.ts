export type Participant = {
  id: string
  ownerId: string
  profileId: string | null
  displayName: string
  color: string | null
  avatarUrl: string | null
  createdAt: string
}

export type CreateParticipantInput = {
  displayName: string
  color?: string | null
  profileId?: string | null
}

export type UpdateParticipantInput = {
  displayName?: string
  color?: string | null
  profileId?: string | null
}

export type ParticipantAlias = {
  id: string
  participantId: string
  alias: string
  source: "import" | "manual" | null
}

export type CreateParticipantAliasInput = {
  alias: string
  source?: "import" | "manual"
}

export type ParticipantWithAliases = Participant & {
  aliases: ParticipantAlias[]
}
