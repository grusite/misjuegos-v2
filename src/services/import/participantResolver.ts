import { normalizeAlias } from "@/domain/normalizeAlias"
import type { ParticipantWithAliases } from "@/domain/types/participant"

export type ParticipantResolution = {
  participantIds: string[]
  unresolved: string[]
}

export function createParticipantResolver(participants: ParticipantWithAliases[]) {
  const aliasMap = new Map<string, string>()

  for (const participant of participants) {
    aliasMap.set(normalizeAlias(participant.displayName), participant.id)

    for (const alias of participant.aliases) {
      aliasMap.set(alias.alias, participant.id)
    }
  }

  function resolveName(name: string): string | null {
    return aliasMap.get(normalizeAlias(name)) ?? null
  }

  function resolveMany(names: string[]): ParticipantResolution {
    const participantIds: string[] = []
    const unresolved: string[] = []
    const seen = new Set<string>()

    for (const name of names) {
      const participantId = resolveName(name)

      if (!participantId) {
        unresolved.push(name)
        continue
      }

      if (seen.has(participantId)) continue

      seen.add(participantId)
      participantIds.push(participantId)
    }

    return { participantIds, unresolved }
  }

  return { resolveMany }
}
