import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { DesiredGameFormValues } from "@/domain/schemas/desiredGame"
import type { DesiredGame, DesiredGameStatus } from "@/domain/types/desiredGame"
import type { GameType } from "@/domain/types/rows"
import { getDbErrorMessage } from "@/services/errors"
import { desiredGamesRepository } from "@/services/desiredGames/desiredGamesRepository"
import { searchBoardGames, type BggSearchResult } from "@/services/bgg/bggService"

export type DesiredGameFilter = "all" | GameType

function formToInput(values: DesiredGameFormValues) {
  if (values.type === "board_game") {
    return {
      type: values.type,
      title: values.title,
      notes: values.notes || null,
      priority: values.priority ?? null,
      bggId: values.bggId ?? null,
    }
  }

  return {
    type: values.type,
    title: values.title,
    notes: values.notes || null,
    priority: values.priority ?? null,
    city: values.city || null,
    venue: values.venue || null,
    company: values.company || null,
    bookingUrl: values.bookingUrl || null,
  }
}

export function useDesiredGames() {
  const authStore = useAuthStore()
  const ownerId = computed(() => authStore.profile?.id ?? null)

  const items = ref<DesiredGame[]>([])
  const bggResults = ref<BggSearchResult[]>([])
  const typeFilter = ref<DesiredGameFilter>("all")
  const showArchived = ref(false)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  const filteredItems = computed(() => {
    return items.value.filter(item => {
      const matchesType =
        typeFilter.value === "all" || item.type === typeFilter.value
      const matchesStatus = showArchived.value
        ? true
        : item.status === "active"

      return matchesType && matchesStatus
    })
  })

  const activeCount = computed(
    () => items.value.filter(item => item.status === "active").length,
  )

  async function load() {
    isLoading.value = true
    errorMessage.value = null

    try {
      items.value = await desiredGamesRepository.list()
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function searchBgg(query: string) {
    bggResults.value = await searchBoardGames(query)
  }

  async function createItem(values: DesiredGameFormValues) {
    if (!ownerId.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      const created = await desiredGamesRepository.create(
        ownerId.value,
        formToInput(values),
      )
      items.value = sortItems([created, ...items.value])
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(id: string, values: DesiredGameFormValues) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const updated = await desiredGamesRepository.update(id, formToInput(values))
      items.value = sortItems(
        items.value.map(item => (item.id === id ? updated : item)),
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function setStatus(id: string, status: DesiredGameStatus) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const updated = await desiredGamesRepository.updateStatus(id, status)
      items.value = sortItems(
        items.value.map(item => (item.id === id ? updated : item)),
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function removeItem(id: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await desiredGamesRepository.remove(id)
      items.value = items.value.filter(item => item.id !== id)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  function sortItems(list: DesiredGame[]): DesiredGame[] {
    return [...list].sort((a, b) => {
      const priorityA = a.priority ?? 0
      const priorityB = b.priority ?? 0
      if (priorityA !== priorityB) return priorityB - priorityA
      return a.title.localeCompare(b.title, "es")
    })
  }

  onMounted(() => {
    void load()
  })

  return {
    items,
    filteredItems,
    activeCount,
    bggResults,
    typeFilter,
    showArchived,
    isLoading,
    isSaving,
    errorMessage,
    load,
    searchBgg,
    createItem,
    updateItem,
    setStatus,
    removeItem,
  }
}
