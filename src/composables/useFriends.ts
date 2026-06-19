import { computed, onMounted, ref, watch } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { ParticipantFormValues } from "@/domain/schemas/participant"
import type { FriendListItem, PeopleSearchResult } from "@/domain/types/friendship"
import type { ParticipantAlias } from "@/domain/types/participant"
import { DbError, getDbErrorMessage } from "@/services/errors"
import { friendshipsRepository } from "@/services/friendships/friendshipsRepository"
import { participantAliasesRepository } from "@/services/participants/participantAliasesRepository"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { appDataCache } from "@/services/cache/memoryCache"

const SEARCH_DEBOUNCE_MS = 300

export function useFriends() {
  const authStore = useAuthStore()
  const ownerId = computed(() => authStore.profile?.id ?? null)

  const friends = ref<FriendListItem[]>([])
  const searchResults = ref<PeopleSearchResult[]>([])
  const searchQuery = ref("")
  const aliasMap = ref<Record<string, ParticipantAlias[]>>({})
  const isLoading = ref(false)
  const isSearching = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const filteredFriends = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return friends.value

    return friends.value.filter(friend =>
      friend.displayName.toLowerCase().includes(query),
    )
  })

  watch(searchQuery, value => {
    if (searchTimer) clearTimeout(searchTimer)

    const normalized = value.trim()
    if (normalized.length < 2) {
      searchResults.value = []
      isSearching.value = false
      return
    }

    searchTimer = setTimeout(() => {
      void runSearch(normalized)
    }, SEARCH_DEBOUNCE_MS)
  })

  async function runSearch(query: string) {
    isSearching.value = true
    errorMessage.value = null

    try {
      searchResults.value = await friendshipsRepository.searchPeople(query)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isSearching.value = false
    }
  }

  async function load() {
    if (!ownerId.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      friends.value = await friendshipsRepository.listFriends()
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadAliasesForParticipant(participantId: string) {
    if (aliasMap.value[participantId]) return

    const aliases = await participantAliasesRepository.listForParticipant(participantId)
    aliasMap.value = { ...aliasMap.value, [participantId]: aliases }
  }

  function managedParticipantId(friend: FriendListItem): string | null {
    if (!ownerId.value) return null
    if (friend.localParticipantId) return friend.localParticipantId
    if (
      friend.participantId &&
      friend.participantOwnerId === ownerId.value
    ) {
      return friend.participantId
    }
    return null
  }

  async function addSearchResult(result: PeopleSearchResult) {
    if (!ownerId.value || result.alreadyFriend) return

    isSaving.value = true
    errorMessage.value = null

    try {
      if (result.kind === "profile" && result.profileId) {
        await friendshipsRepository.addProfileFriend(ownerId.value, {
          friendProfileId: result.profileId,
          displayName: result.displayName,
          avatarUrl: result.avatarUrl,
        })
      } else if (result.participantId) {
        await friendshipsRepository.addParticipantFriend(ownerId.value, {
          friendParticipantId: result.participantId,
          displayName: result.displayName,
          color: result.color,
        })
      }

      await load()
      appDataCache.invalidate(`participants:${ownerId.value}`)
      searchResults.value = searchResults.value.map(item =>
        item.profileId === result.profileId &&
        item.participantId === result.participantId
          ? { ...item, alreadyFriend: true }
          : item,
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function createGhostFriend(values: ParticipantFormValues) {
    if (!ownerId.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      await friendshipsRepository.createGhostFriend(ownerId.value, values.displayName)
      await load()
      appDataCache.invalidate(`participants:${ownerId.value}`)
      searchQuery.value = ""
      searchResults.value = []
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function disableFriend(friendshipId: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await friendshipsRepository.disable(friendshipId)
      friends.value = friends.value.filter(friend => friend.friendshipId !== friendshipId)
      if (ownerId.value) {
        appDataCache.invalidate(`participants:${ownerId.value}`)
      }
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function updateManagedFriendName(participantId: string, displayName: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await participantsRepository.update(participantId, { displayName })
      await load()
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function addAlias(participantId: string, alias: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      const created = await participantAliasesRepository.add(participantId, {
        alias,
        source: "manual",
      })

      const current = aliasMap.value[participantId] ?? []
      aliasMap.value = {
        ...aliasMap.value,
        [participantId]: [...current, created].sort((a, b) =>
          a.alias.localeCompare(b.alias, "es"),
        ),
      }
    } catch (error) {
      if (error instanceof DbError && error.code === "23505") {
        errorMessage.value = "Ya existe un alias con ese nombre"
      } else {
        errorMessage.value = getDbErrorMessage(error)
      }
      throw error
    } finally {
      isSaving.value = false
    }
  }

  async function removeAlias(participantId: string, aliasId: string) {
    isSaving.value = true
    errorMessage.value = null

    try {
      await participantAliasesRepository.remove(aliasId)
      aliasMap.value = {
        ...aliasMap.value,
        [participantId]: (aliasMap.value[participantId] ?? []).filter(
          alias => alias.id !== aliasId,
        ),
      }
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    friends,
    filteredFriends,
    searchResults,
    searchQuery,
    aliasMap,
    isLoading,
    isSearching,
    isSaving,
    errorMessage,
    ownerId,
    load,
    loadAliasesForParticipant,
    managedParticipantId,
    addSearchResult,
    createGhostFriend,
    disableFriend,
    updateManagedFriendName,
    addAlias,
    removeAlias,
  }
}
