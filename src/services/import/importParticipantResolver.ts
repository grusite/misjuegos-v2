import { normalizeAlias } from "@/domain/normalizeAlias"
import type { ParticipantWithAliases } from "@/domain/types/participant"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

export type ImportParticipantResolution = {
  participantIds: string[]
  playerTeamId: string | null
  unresolved: string[]
}

export function createImportParticipantResolver(
  participants: ParticipantWithAliases[],
  teams: PlayerTeamWithMembers[],
) {
  const aliasMap = new Map<string, string>()
  const teamMap = new Map<string, PlayerTeamWithMembers>()

  for (const participant of participants) {
    aliasMap.set(normalizeAlias(participant.displayName), participant.id)

    for (const alias of participant.aliases) {
      aliasMap.set(alias.alias, participant.id)
    }
  }

  for (const team of teams) {
    teamMap.set(normalizeAlias(team.name), team)
  }

  function resolveToken(token: string): ImportParticipantResolution {
    const team = teamMap.get(normalizeAlias(token))
    if (team) {
      return {
        participantIds: team.members.map(member => member.id),
        playerTeamId: team.id,
        unresolved: [],
      }
    }

    const participantId = aliasMap.get(normalizeAlias(token))
    if (participantId) {
      return {
        participantIds: [participantId],
        playerTeamId: null,
        unresolved: [],
      }
    }

    return {
      participantIds: [],
      playerTeamId: null,
      unresolved: [token],
    }
  }

  function resolveMany(tokens: string[]): ImportParticipantResolution {
    if (tokens.length === 1) {
      return resolveToken(tokens[0])
    }

    const participantIds: string[] = []
    const unresolved: string[] = []
    const seen = new Set<string>()

    for (const token of tokens) {
      const result = resolveToken(token)

      if (result.unresolved.length > 0) {
        unresolved.push(...result.unresolved)
      }

      for (const participantId of result.participantIds) {
        if (seen.has(participantId)) continue
        seen.add(participantId)
        participantIds.push(participantId)
      }
    }

    return {
      participantIds,
      playerTeamId: null,
      unresolved,
    }
  }

  return { resolveMany }
}
