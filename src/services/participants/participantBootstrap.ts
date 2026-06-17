import type { AuthProfile } from "@/stores/authStore"
import type { Participant } from "@/domain/types/participant"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"

export async function ensureSelfParticipant(profile: AuthProfile): Promise<Participant> {
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
): Promise<Participant | null> {
  if (input.profileId === ownerId) {
    return participantsRepository.findByProfileId(ownerId, ownerId)
  }

  if (input.profileId) {
    const byProfile = await participantsRepository.findByProfileId(ownerId, input.profileId)
    if (byProfile) return byProfile
  }

  const byName = await participantsRepository.findByDisplayName(ownerId, input.displayName)
  if (byName) {
    if (input.profileId && !byName.profileId) {
      return participantsRepository.update(byName.id, { profileId: input.profileId })
    }
    return byName
  }

  return participantsRepository.create(ownerId, {
    displayName: input.displayName,
    profileId: input.profileId ?? null,
  })
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

  for (const row of rows) {
    if (!row.participantId || row.participantId === selfParticipantId) continue

    const participant = await participantsRepository.getById(row.participantId)
    if (!participant) continue
    if (participant.profileId === ownerId) continue

    await ensureFriendParticipant(ownerId, {
      profileId: participant.profileId,
      displayName: participant.displayName,
    })
  }
}

export async function syncFriendsFromAllSessions(
  profileId: string,
  selfParticipantId: string,
): Promise<void> {
  const sessionIds = await sessionsRepository.listSessionIdsForParticipant(selfParticipantId)

  for (const sessionId of sessionIds) {
    await syncFriendsFromSession(sessionId, profileId, selfParticipantId)
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
