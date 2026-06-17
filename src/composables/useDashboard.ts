import { onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { DashboardStats } from "@/domain/types/dashboard"
import { dashboardRepository } from "@/services/dashboard/dashboardRepository"
import { getDbErrorMessage } from "@/services/errors"

export function useDashboard() {
  const authStore = useAuthStore()
  const stats = ref<DashboardStats | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  async function load() {
    const profileId = authStore.profile?.id
    if (!profileId) return

    isLoading.value = true
    errorMessage.value = null

    try {
      stats.value = await dashboardRepository.getStats(profileId)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    stats,
    isLoading,
    errorMessage,
    load,
  }
}
