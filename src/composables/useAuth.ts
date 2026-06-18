import { computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const profile = computed(() => authStore.profile)
  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const isLoading = computed(() => authStore.isLoading)

  function loginWithGoogle() {
    return authStore.loginWithGoogle()
  }

  async function logout() {
    await authStore.logout()
    await router.push({ name: "login" })
  }

  return {
    profile,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    logout,
  }
}
