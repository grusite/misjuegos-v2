import { ref } from "vue"
import {
  BGG_SEARCH_PAGE_SIZE,
  searchBoardGames,
  type BggSearchResult,
} from "@/services/bgg/bggService"

export function useBggSearch() {
  const results = ref<BggSearchResult[]>([])
  const total = ref(0)
  const hasMore = ref(false)
  const isSearching = ref(false)
  const isLoadingMore = ref(false)
  const lastQuery = ref("")

  async function search(query: string) {
    const normalized = query.trim()
    lastQuery.value = normalized

    if (!normalized) {
      clear()
      return null
    }

    isSearching.value = true

    try {
      const page = await searchBoardGames(normalized, {
        limit: BGG_SEARCH_PAGE_SIZE,
        offset: 0,
      })
      results.value = page.results
      total.value = page.total
      hasMore.value = page.hasMore
      return page
    } catch (error) {
      clear()
      throw error
    } finally {
      isSearching.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value || !lastQuery.value) return

    isLoadingMore.value = true

    try {
      const page = await searchBoardGames(lastQuery.value, {
        limit: BGG_SEARCH_PAGE_SIZE,
        offset: results.value.length,
      })
      results.value = [...results.value, ...page.results]
      total.value = page.total
      hasMore.value = page.hasMore
    } finally {
      isLoadingMore.value = false
    }
  }

  function clear() {
    results.value = []
    total.value = 0
    hasMore.value = false
    lastQuery.value = ""
    isSearching.value = false
    isLoadingMore.value = false
  }

  return {
    results,
    total,
    hasMore,
    isSearching,
    isLoadingMore,
    search,
    loadMore,
    clear,
  }
}
