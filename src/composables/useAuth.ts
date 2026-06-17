import { computed } from "vue"
import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const authStore = useAuthStore()

  const profile = computed(() => authStore.profile)
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  function loginMock(displayName?: string) {
    authStore.loginMock(displayName)
  }

  function logout() {
    authStore.logout()
  }

  return {
    profile,
    isAuthenticated,
    loginMock,
    logout,
  }
}
