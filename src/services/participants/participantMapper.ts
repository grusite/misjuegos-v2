import type {
  CreateParticipantInput,
  Participant,
  ParticipantAlias,
  UpdateParticipantInput,
} from "@/domain/types/participant"
import type {
  ParticipantAliasRow,
  ParticipantInsert,
  ParticipantRow,
  ParticipantUpdate,
} from "@/domain/types/rows"

export function mapParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    ownerId: row.owner_id,
    profileId: row.profile_id,
    displayName: row.display_name,
    color: row.color,
    createdAt: row.created_at,
  }
}

export function toParticipantInsert(
  ownerId: string,
  input: CreateParticipantInput,
): ParticipantInsert {
  return {
    owner_id: ownerId,
    display_name: input.displayName,
    color: input.color ?? null,
    profile_id: input.profileId ?? null,
  }
}

export function toParticipantUpdate(
  input: UpdateParticipantInput,
): ParticipantUpdate {
  return {
    ...(input.displayName !== undefined && { display_name: input.displayName }),
    ...(input.color !== undefined && { color: input.color }),
    ...(input.profileId !== undefined && { profile_id: input.profileId }),
  }
}

export function mapParticipantAlias(row: ParticipantAliasRow): ParticipantAlias {
  const source =
    row.source === "import" || row.source === "manual" ? row.source : null

  return {
    id: row.id,
    participantId: row.participant_id,
    alias: row.alias,
    source,
  }
}
