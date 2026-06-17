import { defineStore } from "pinia"
import { computed, ref } from "vue"
import type { UserMetadata } from "@supabase/supabase-js"
import * as authService from "@/services/auth/authService"
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

  const isAuthenticated = computed(() => profile.value !== null)

  async function loadProfile(userId: string, metadata?: UserMetadata | null) {
    const fromDb = await authService.fetchProfile(userId)

    if (fromDb) {
      profile.value = fromDb
    } else if (metadata) {
      await authService.ensureProfile(userId, metadata)
      profile.value = (await authService.fetchProfile(userId)) ??
        authService.profileFromMetadata(userId, metadata)
    }

    if (!profile.value) return

    try {
      const selfParticipant = await ensureSelfParticipant(profile.value)
      await deduplicateLinkedParticipants(profile.value.id)
      await syncFriendsFromAllSessions(profile.value.id, selfParticipant.id)
      await deduplicateLinkedParticipants(profile.value.id)
    } catch {
      // Participant bootstrap is best-effort; auth should still succeed.
    }
  }

  async function init() {
    if (isInitialized.value) return

    const { data } = await authService.getSession()

    if (data.session?.user) {
      await loadProfile(data.session.user.id, data.session.user.user_metadata)
    }

    authService.onAuthStateChange(async (userId, metadata) => {
      if (userId) {
        await loadProfile(userId, metadata)
      } else {
        profile.value = null
      }
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
