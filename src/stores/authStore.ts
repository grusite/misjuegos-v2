import { defineStore } from "pinia"
import { computed, ref } from "vue"

export type AuthProfile = {
  displayName: string
  avatarUrl: string | null
}

export const useAuthStore = defineStore("auth", () => {
  const profile = ref<AuthProfile | null>(null)

  const isAuthenticated = computed(() => profile.value !== null)

  /** Temporary mock login until Supabase auth is wired in Phase 1. */
  function loginMock(displayName = "Demo User") {
    profile.value = {
      displayName,
      avatarUrl: null,
    }
  }

  function logout() {
    profile.value = null
  }

  return {
    profile,
    isAuthenticated,
    loginMock,
    logout,
  }
})
