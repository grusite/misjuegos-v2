import { defineStore } from "pinia"
import { computed, ref } from "vue"
import type { UserMetadata } from "@supabase/supabase-js"
import * as authService from "@/services/auth/authService"
import { appDataCache } from "@/services/cache/memoryCache"
import {
  deduplicateLinkedParticipants,
  ensureSelfParticipant,
  syncFriendsFromAllSessions,
} from "@/services/participants/participantBootstrap"

export type AuthProfile = {
  id: string
  displayName: string
  avatarUrl: string | null
}

export const useAuthStore = defineStore("auth", () => {
  const profile = ref<AuthProfile | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  let hasBootstrappedParticipants = false

  const isAuthenticated = computed(() => profile.value !== null)

  async function bootstrapParticipants() {
    if (!profile.value || hasBootstrappedParticipants) return

    const selfParticipant = await ensureSelfParticipant(profile.value)
    await deduplicateLinkedParticipants(profile.value.id)
    await syncFriendsFromAllSessions(profile.value.id, selfParticipant.id)
    await deduplicateLinkedParticipants(profile.value.id)
    appDataCache.invalidate(`participants:${profile.value.id}`)
    hasBootstrappedParticipants = true
  }

  async function loadProfile(
    userId: string,
    metadata?: UserMetadata | null,
    options?: { bootstrap?: boolean },
  ) {
    const fromDb = await authService.fetchProfile(userId)

    if (fromDb) {
      profile.value = fromDb
    } else if (metadata) {
      await authService.ensureProfile(userId, metadata)
      profile.value = (await authService.fetchProfile(userId)) ??
        authService.profileFromMetadata(userId, metadata)
    }

    if (!profile.value) return

    if (options?.bootstrap) {
      try {
        await bootstrapParticipants()
      } catch {
        // Participant bootstrap is best-effort; auth should still succeed.
      }
    }
  }

  async function init() {
    if (isInitialized.value) return

    const { data } = await authService.getSession()

    if (data.session?.user) {
      await loadProfile(data.session.user.id, data.session.user.user_metadata, {
        bootstrap: true,
      })
    }

    authService.onAuthStateChange(async (event, userId, metadata) => {
      if (!userId) {
        profile.value = null
        hasBootstrappedParticipants = false
        appDataCache.clear()
        return
      }

      if (event === "TOKEN_REFRESHED" && profile.value?.id === userId) {
        return
      }

      const isNewUser = profile.value?.id !== userId

      await loadProfile(userId, metadata, {
        bootstrap: event === "SIGNED_IN" || isNewUser,
      })
    })

    isInitialized.value = true
  }

  async function loginWithGoogle() {
    isLoading.value = true
    try {
      await authService.signInWithGoogle()
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    await authService.signOut()
    profile.value = null
    hasBootstrappedParticipants = false
    appDataCache.clear()
  }

  return {
    profile,
    isInitialized,
    isLoading,
    isAuthenticated,
    init,
    loginWithGoogle,
    logout,
  }
})
