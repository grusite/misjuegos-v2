import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeAlias } from "@/domain/normalizeAlias"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import type { ParsedEscapeBabelRow } from "@/services/import/escapeBabelSchema"
import {
  collectAliasesForFriendKey,
  getFriendDisplayName,
  resolveFriendKey,
} from "@/services/import/escapeBabelFriendCatalog"
import { ESCAPE_BABEL_IMPORT_TEAMS, isImportTeamToken } from "@/services/import/importTeams"
import { createParticipantAliasesRepository } from "@/services/participants/participantAliasesRepository"
import { createParticipantsRepository } from "@/services/participants/participantsRepository"
import { createPlayerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"
import type { AppDatabase } from "@/domain/types/schema"

export type BootstrapImportFriendsResult = {
  participantsCreated: number
  aliasesAdded: number
  teamsCreated: number
  friendKeys: string[]
}

export async function bootstrapImportFriends(
  client: SupabaseClient<AppDatabase>,
  ownerId: string,
  parsedRows: ParsedEscapeBabelRow[],
): Promise<BootstrapImportFriendsResult> {
  const participantsRepository = createParticipantsRepository(client)
  const aliasesRepository = createParticipantAliasesRepository(client)
  const playerTeamsRepository = createPlayerTeamsRepository(client)

  const seenTokens = new Set<string>()
  const friendKeys = new Set<string>()

  for (const row of parsedRows) {
    for (const token of row.participantTokens) {
      if (isImportTeamToken(token)) continue

      seenTokens.add(normalizeAlias(token))
      friendKeys.add(resolveFriendKey(token))
    }
  }

  let participantsCreated = 0
  let aliasesAdded = 0
  const participantIdByKey = new Map<string, string>()

  const existingParticipants =
    await participantsRepository.listForOwnerWithAliases(ownerId)

  for (const participant of existingParticipants) {
    const key = resolveFriendKey(participant.displayName)
    participantIdByKey.set(key, participant.id)
  }

  for (const key of [...friendKeys].sort((left, right) => left.localeCompare(right, "es"))) {
    const displayName = getFriendDisplayName(key)
    const aliases = collectAliasesForFriendKey(key, seenTokens)

    let participantId = participantIdByKey.get(key)

    if (!participantId) {
      const byName = await participantsRepository.findByDisplayName(ownerId, displayName)
      if (byName) {
        participantId = byName.id
      }
    }

    if (!participantId) {
      const created = await participantsRepository.create(ownerId, {
        displayName,
        color: getAvatarColor(displayName),
      })
      participantId = created.id
      participantsCreated += 1
    }

    participantIdByKey.set(key, participantId)

    if (key === "jorge") {
      const linked = await participantsRepository.getById(participantId)
      if (linked && !linked.profileId) {
        await participantsRepository.linkProfile(participantId, ownerId)
      }
    }

    const existingAliases = new Set(
      (
        existingParticipants.find(participant => participant.id === participantId)
          ?.aliases ?? []
      ).map(alias => alias.alias),
    )

    for (const alias of aliases) {
      if (existingAliases.has(alias)) continue

      const globalMatch = await aliasesRepository.findParticipantIdByAlias(alias)
      if (globalMatch && globalMatch !== participantId) continue

      try {
        await aliasesRepository.add(participantId, {
          alias,
          source: "import",
        })
        aliasesAdded += 1
        existingAliases.add(alias)
      } catch {
        // Alias already registered — safe to ignore on re-import.
      }
    }
  }

  let teamsCreated = 0
  const existingTeams = await playerTeamsRepository.listForOwner(ownerId)

  for (const teamDef of ESCAPE_BABEL_IMPORT_TEAMS) {
    const alreadyExists = existingTeams.some(
      team => normalizeAlias(team.name) === normalizeAlias(teamDef.name),
    )

    if (alreadyExists) continue

    const memberIds = teamDef.memberKeys
      .map(key => participantIdByKey.get(key))
      .filter((id): id is string => Boolean(id))

    if (memberIds.length === 0) continue

    await playerTeamsRepository.create(ownerId, {
      name: teamDef.name,
      description: teamDef.description,
      participantIds: memberIds,
    })
    teamsCreated += 1
  }

  return {
    participantsCreated,
    aliasesAdded,
    teamsCreated,
    friendKeys: [...friendKeys].sort((left, right) => left.localeCompare(right, "es")),
  }
}
