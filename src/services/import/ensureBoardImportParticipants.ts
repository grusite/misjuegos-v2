import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeAlias } from "@/domain/normalizeAlias"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import {
  getFriendDisplayName,
  resolveFriendKey,
} from "@/services/import/escapeBabelFriendCatalog"
import { createParticipantAliasesRepository } from "@/services/participants/participantAliasesRepository"
import { createParticipantsRepository } from "@/services/participants/participantsRepository"
import type { AppDatabase } from "@/domain/types/schema"

const BOARD_IMPORT_PARTICIPANT_KEYS = ["elena"] as const
const BOARD_IMPORT_ALIASES: Record<string, string[]> = {
  diego: ["diegas"],
}

export async function ensureBoardImportParticipants(
  client: SupabaseClient<AppDatabase>,
  ownerId: string,
): Promise<{ participantsCreated: number; aliasesAdded: number }> {
  const participantsRepository = createParticipantsRepository(client)
  const aliasesRepository = createParticipantAliasesRepository(client)

  let participantsCreated = 0
  let aliasesAdded = 0

  const existingParticipants =
    await participantsRepository.listForOwnerWithAliases(ownerId)

  const participantIdByKey = new Map<string, string>()
  for (const participant of existingParticipants) {
    participantIdByKey.set(resolveFriendKey(participant.displayName), participant.id)
  }

  async function ensureAliases(participantId: string, aliases: string[]) {
    const existingAliases = new Set(
      existingParticipants
        .find(participant => participant.id === participantId)
        ?.aliases.map(alias => alias.alias) ?? [],
    )

    for (const alias of aliases) {
      const normalized = normalizeAlias(alias)
      if (existingAliases.has(normalized)) continue

      try {
        await aliasesRepository.add(participantId, {
          alias: normalized,
          source: "import",
        })
        aliasesAdded += 1
      } catch {
        // Alias already registered globally.
      }
    }
  }

  for (const key of BOARD_IMPORT_PARTICIPANT_KEYS) {
    const displayName = getFriendDisplayName(key)
    let participantId = participantIdByKey.get(key)

    if (!participantId) {
      const byName = await participantsRepository.findByDisplayName(ownerId, displayName)
      participantId = byName?.id
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

    await ensureAliases(participantId, [
      normalizeAlias(displayName),
      key,
    ])
  }

  for (const [key, aliases] of Object.entries(BOARD_IMPORT_ALIASES)) {
    const participantId = participantIdByKey.get(key)
    if (!participantId) continue
    await ensureAliases(participantId, aliases)
  }

  return { participantsCreated, aliasesAdded }
}
