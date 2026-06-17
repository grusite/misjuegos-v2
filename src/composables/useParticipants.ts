import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { ParticipantFormValues } from "@/domain/schemas/participant"
import type { ParticipantWithAliases } from "@/domain/types/participant"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import { DbError, getDbErrorMessage } from "@/services/errors"
import { participantAliasesRepository } from "@/services/participants/participantAliasesRepository"
import { participantsRepository } from "@/services/participants/participantsRepository"

export function useParticipants() {
  const authStore = useAuthStore()

  const participants = ref<ParticipantWithAliases[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const searchQuery = ref("")

  const ownerId = computed(() => authStore.profile?.id ?? null)

  const filteredParticipants = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return participants.value

    return participants.value.filter(participant => {
      const matchesName = participant.displayName.toLowerCase().includes(query)
      const matchesAlias = participant.aliases.some(alias =>
        alias.alias.includes(query),
      )

      return matchesName || matchesAlias
    })
  })

  async function load() {
    if (!ownerId.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      participants.value = await participantsRepository.listForOwnerWithAliases(
        ownerId.value,
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function createParticipant(values: ParticipantFormValues) {
    if (!ownerId.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      const created = await participantsRepository.create(ownerId.value, {
        displayName: values.displayName,
        color: getAvatarColor(values.displayName),
      })

      participants.value = [
        ...participants.value,
        { ...created, aliases: [] },
      ].sort((a, b) => a.displayName.localeCompare(b.displayName, "es"))
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateParticipant(
    id: string,
    values: ParticipantFormValues,
  ) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const updated = await participantsRepository.update(id, {
        displayName: values.displayName,
      })

      participants.value = participants.value
        .map(participant =>
          participant.id === id ? { ...updated, aliases: participant.aliases } : participant,
        )
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "es"))
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function removeParticipant(id: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await participantsRepository.remove(id)
      participants.value = participants.value.filter(
        participant => participant.id !== id,
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function addAlias(participantId: string, alias: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const created = await participantAliasesRepository.add(participantId, {
        alias,
        source: "manual",
      })

      participants.value = participants.value.map(participant =>
        participant.id === participantId
          ? {
              ...participant,
              aliases: [...participant.aliases, created].sort((a, b) =>
                a.alias.localeCompare(b.alias, "es"),
              ),
            }
          : participant,
      )
    } catch (error) {
      if (error instanceof DbError && error.code === "23505") {
        errorMessage.value = "Ya existe un alias con ese nombre"
      } else {
        errorMessage.value = getDbErrorMessage(error)
      }
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function removeAlias(participantId: string, aliasId: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await participantAliasesRepository.remove(aliasId)

      participants.value = participants.value.map(participant =>
        participant.id === participantId
          ? {
              ...participant,
              aliases: participant.aliases.filter(alias => alias.id !== aliasId),
            }
          : participant,
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    participants,
    filteredParticipants,
    isLoading,
    isSaving,
    errorMessage,
    searchQuery,
    load,
    createParticipant,
    updateParticipant,
    removeParticipant,
    addAlias,
    removeAlias,
  }
}
