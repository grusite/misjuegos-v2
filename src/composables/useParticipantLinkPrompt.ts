import { computed, ref, watch } from "vue"
import { useAuthStore } from "@/stores/authStore"
import { ensureProfile } from "@/services/auth/authService"
import {
  claimParticipantLink,
  fetchParticipantLinkPromptCompleted,
  findParticipantLinkCandidates,
  skipParticipantLinkPrompt,
} from "@/services/accountLinking/participantLinkService"
import type {
  ParticipantLinkCandidate,
  ParticipantLinkPromptState,
} from "@/domain/types/participantLink"
import { participantsRepository } from "@/services/participants/participantsRepository"
import {
  deduplicateLinkedParticipants,
  ensureSelfParticipant,
  syncFriendsFromAllSessions,
} from "@/services/participants/participantBootstrap"
import { appDataCache } from "@/services/cache/memoryCache"

export function useParticipantLinkPrompt() {
  const authStore = useAuthStore()
  const profile = computed(() => authStore.profile)

  const state = ref<ParticipantLinkPromptState>("idle")
  const candidates = ref<ParticipantLinkCandidate[]>([])
  const errorMessage = ref<string | null>(null)
  const resolvedProfileId = ref<string | null>(null)

  watch(
    () => profile.value?.id ?? null,
    (profileId, previousProfileId) => {
      if (profileId === previousProfileId) return

      resolvedProfileId.value = null
      state.value = "idle"
      candidates.value = []
      errorMessage.value = null
    },
  )

  const isOpen = computed(
    () => state.value === "pending" || state.value === "completing",
  )

  async function finishBootstrap(profileId: string, claimedParticipantId?: string) {
    if (!profile.value) return

    if (claimedParticipantId) {
      const claimed = await participantsRepository.getById(claimedParticipantId)
      const existingSelf = await participantsRepository.findByProfileId(
        profileId,
        profileId,
      )

      if (!existingSelf && claimed) {
        await participantsRepository.create(profileId, {
          displayName: claimed.displayName,
          profileId,
          color: claimed.color,
        })
      }
    }

    const selfParticipant = await ensureSelfParticipant(profile.value)
    await deduplicateLinkedParticipants(profileId)
    await syncFriendsFromAllSessions(profileId, selfParticipant.id)
    await deduplicateLinkedParticipants(profileId)
    appDataCache.invalidate(`participants:${profileId}`)
  }

  async function evaluatePrompt(): Promise<boolean> {
    if (!profile.value) return false
    if (resolvedProfileId.value === profile.value.id) return false

    state.value = "loading"
    errorMessage.value = null

    try {
      await ensureProfile(profile.value.id, {
        full_name: profile.value.displayName,
        avatar_url: profile.value.avatarUrl,
      })

      const promptCompleted = await fetchParticipantLinkPromptCompleted(profile.value.id)
      const existingSelf = await participantsRepository.findByProfileId(
        profile.value.id,
        profile.value.id,
      )

      if (existingSelf || promptCompleted) {
        await finishBootstrap(profile.value.id)
        state.value = "completed"
        resolvedProfileId.value = profile.value.id
        return false
      }

      const matches = await findParticipantLinkCandidates(profile.value.displayName)

      candidates.value = matches
      state.value = "pending"
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "No se pudo comprobar amigos existentes"
      state.value = "completed"
      resolvedProfileId.value = profile.value.id
      return false
    }
  }

  async function confirmLink(participantId: string) {
    if (!profile.value) return

    state.value = "completing"
    errorMessage.value = null

    try {
      await claimParticipantLink(participantId)
      await finishBootstrap(profile.value.id, participantId)
      state.value = "completed"
      resolvedProfileId.value = profile.value.id
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "No se pudo enlazar tu cuenta"
      state.value = "pending"
    }
  }

  async function declineLink() {
    if (!profile.value) return

    state.value = "completing"
    errorMessage.value = null

    try {
      await skipParticipantLinkPrompt()
      await finishBootstrap(profile.value.id)
      state.value = "completed"
      resolvedProfileId.value = profile.value.id
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : "No se pudo completar el registro"
      state.value = "pending"
    }
  }

  return {
    state,
    candidates,
    errorMessage,
    isOpen,
    evaluatePrompt,
    confirmLink,
    declineLink,
  }
}
