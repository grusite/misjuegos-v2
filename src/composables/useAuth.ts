import { computed } from "vue"
import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const authStore = useAuthStore()

  const profile = computed(() => authStore.profile)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading)

  function loginWithGoogle() {
    return authStore.loginWithGoogle()
  }

  function logout() {
    return authStore.logout()
  }

  return {
    profile,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    logout,
  }
}
