import type { Participant } from "@/domain/types/participant"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"

export async function ensureSelfParticipant(profile: {
  id: string
  displayName: string
}): Promise<Participant> {
  const existing = await participantsRepository.findByProfileId(profile.id, profile.id)
  if (existing) {
    if (existing.displayName !== profile.displayName) {
      return participantsRepository.update(existing.id, {
        displayName: profile.displayName,
      })
    }
    return existing
  }

  return participantsRepository.create(profile.id, {
    displayName: profile.displayName,
    profileId: profile.id,
  })
}

export async function ensureFriendParticipant(
  ownerId: string,
  input: { profileId?: string | null; displayName: string },
  existingByProfileId: Map<string, Participant>,
  existingByName: Map<string, Participant>,
): Promise<Participant | null> {
  if (input.profileId === ownerId) {
    return existingByProfileId.get(ownerId) ?? null
  }

  if (input.profileId) {
    const byProfile = existingByProfileId.get(input.profileId)
    if (byProfile) return byProfile
  }

  const byName = existingByName.get(input.displayName.toLowerCase())
  if (byName) {
    if (input.profileId && !byName.profileId) {
      const updated = await participantsRepository.update(byName.id, {
        profileId: input.profileId,
      })
      existingByProfileId.set(input.profileId, updated)
      return updated
    }
    return byName
  }

  const created = await participantsRepository.create(ownerId, {
    displayName: input.displayName,
    profileId: input.profileId ?? null,
  })
  existingByName.set(created.displayName.toLowerCase(), created)
  if (created.profileId) {
    existingByProfileId.set(created.profileId, created)
  }
  return created
}

export async function deduplicateLinkedParticipants(ownerId: string): Promise<void> {
  const participants = await participantsRepository.listForOwner(ownerId)
  const grouped = new Map<string, Participant[]>()

  for (const participant of participants) {
    if (!participant.profileId) continue

    const group = grouped.get(participant.profileId) ?? []
    group.push(participant)
    grouped.set(participant.profileId, group)
  }

  for (const group of grouped.values()) {
    if (group.length <= 1) continue

    const [canonical, ...duplicates] = [...group].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    )

    for (const duplicate of duplicates) {
      await participantsRepository.reassignAndRemove(duplicate.id, canonical.id)
    }
  }
}

export async function syncFriendsFromSession(
  sessionId: string,
  ownerId: string,
  selfParticipantId: string,
): Promise<void> {
  const rows = await sessionsRepository.listParticipants(sessionId)
  const existing = await participantsRepository.listForOwner(ownerId)
  const existingByProfileId = new Map(
    existing
      .filter(participant => participant.profileId)
      .map(participant => [participant.profileId!, participant]),
  )
  const existingByName = new Map(
    existing.map(participant => [participant.displayName.toLowerCase(), participant]),
  )

  for (const row of rows) {
    if (!row.participantId || row.participantId === selfParticipantId) continue

    const participant = await participantsRepository.getById(row.participantId)
    if (!participant) continue
    if (participant.profileId === ownerId) continue

    await ensureFriendParticipant(
      ownerId,
      {
        profileId: participant.profileId,
        displayName: participant.displayName,
      },
      existingByProfileId,
      existingByName,
    )
  }
}

export async function syncFriendsFromAllSessions(
  profileId: string,
  selfParticipantId: string,
): Promise<void> {
  const sessionIds = await sessionsRepository.listSessionIdsForParticipant(selfParticipantId)
  if (sessionIds.length === 0) return

  const coParticipants = await sessionsRepository.listDistinctCoParticipants(
    sessionIds,
    selfParticipantId,
  )
  if (coParticipants.length === 0) return

  const existing = await participantsRepository.listForOwner(profileId)
  const existingByProfileId = new Map(
    existing
      .filter(participant => participant.profileId)
      .map(participant => [participant.profileId!, participant]),
  )
  const existingByName = new Map(
    existing.map(participant => [participant.displayName.toLowerCase(), participant]),
  )

  for (const coParticipant of coParticipants) {
    if (coParticipant.profileId === profileId) continue

    await ensureFriendParticipant(
      profileId,
      {
        profileId: coParticipant.profileId,
        displayName: coParticipant.displayName,
      },
      existingByProfileId,
      existingByName,
    )
  }
}

export function sortParticipantsWithSelfFirst(
  participants: Participant[],
  profileId: string,
): Participant[] {
  return [...participants].sort((left, right) => {
    const leftIsSelf = left.profileId === profileId
    const rightIsSelf = right.profileId === profileId
    if (leftIsSelf && !rightIsSelf) return -1
    if (!leftIsSelf && rightIsSelf) return 1
    return left.displayName.localeCompare(right.displayName, "es")
  })
}

export function defaultSelectedParticipantIds(
  participants: Participant[],
  profileId: string,
): string[] {
  const self = participants.find(participant => participant.profileId === profileId)
  if (self) return [self.id]
  if (participants.length > 0) return [participants[0]!.id]
  return []
}
