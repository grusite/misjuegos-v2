import { computed, onMounted, ref, watch } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { EscapeRoomCatalogEntry } from "@/domain/types/catalog"
import type { Participant } from "@/domain/types/participant"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import type { SessionMemberPreview } from "@/domain/types/session"
import type { GameType, SessionOutcome, SessionStatus } from "@/domain/types/rows"
import { participantFormSchema } from "@/domain/schemas/participant"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import { getDbErrorMessage } from "@/services/errors"
import { appDataCache } from "@/services/cache/memoryCache"
import { fetchParticipantLinkPromptCompleted } from "@/services/accountLinking/participantLinkService"
import { catalogRepository } from "@/services/catalog/catalogRepository"
import {
  ensureSelfParticipant,
  sortParticipantsWithSelfFirst,
  syncFriendsFromSession,
} from "@/services/participants/participantBootstrap"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { playerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"
import {
  countActiveSessionFilters,
  createDefaultSessionListFilters,
  hashListSessionsOptions,
  toListSessionsOptions,
  type SessionListFilterState,
} from "@/services/sessions/sessionListFilters"
import {
  bggSearchFeedbackForError,
  searchBoardGames,
  type BggSearchFeedback,
  type BggSearchResult,
} from "@/services/bgg/bggService"

export type { SessionFilter } from "@/services/sessions/sessionListFilters"

export type SessionListItem = {
  id: string
  gameCatalogId: string
  gameType: GameType
  playedAt: string
  status: SessionStatus
  outcome: SessionOutcome | null
  notes: string | null
  gameTitle: string
  escapeCity: string | null
  escapeVenue: string | null
  playerTeamId: string | null
  players: SessionMemberPreview[]
}

export type CreateSessionPayload = {
  title: string
  notes?: string
  selectedParticipants: string[]
  playerTeamId?: string | null
  bggSelection?: BggSearchResult | null
}

export type CreateEscapeSessionPayload = {
  catalogId?: string | null
  title: string
  city?: string
  venue?: string
  roomName?: string
  company?: string
  notes?: string
  selectedParticipants: string[]
  playerTeamId?: string | null
}

const SESSIONS_PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

function invalidateSessionsCache(ownerId: string) {
  appDataCache.invalidate(`sessions:${ownerId}`)
}

export function useSessions() {
  const authStore = useAuthStore()
  const ownerId = computed(() => authStore.profile?.id ?? null)

  const sessions = ref<SessionListItem[]>([])
  const participants = ref<Participant[]>([])
  const playerTeams = ref<PlayerTeamWithMembers[]>([])
  const escapeCatalog = ref<EscapeRoomCatalogEntry[]>([])
  const bggResults = ref<BggSearchResult[]>([])
  const bggSearchFeedback = ref<BggSearchFeedback | null>(null)
  const isBggSearching = ref(false)
  const bggAutoFillTitle = ref<string | null>(null)
  const bggAutoSelectId = ref<number | null>(null)
  const sessionFilters = ref<SessionListFilterState>(createDefaultSessionListFilters())
  const debouncedSearch = ref("")

  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const hasMoreSessions = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const sessionsOffset = ref(0)

  const sessionFilter = computed({
    get: () => sessionFilters.value.gameType,
    set: value => {
      sessionFilters.value = { ...sessionFilters.value, gameType: value }
    },
  })

  const hasActiveSessionFilters = computed(
    () => countActiveSessionFilters(sessionFilters.value) > 0,
  )

  const selfParticipantId = computed(
    () => participants.value.find(participant => participant.profileId === ownerId.value)?.id ?? null,
  )

  const listSessionsOptions = computed(() =>
    toListSessionsOptions(sessionFilters.value, selfParticipantId.value),
  )

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => sessionFilters.value.search,
    value => {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
      searchDebounceTimer = setTimeout(() => {
        debouncedSearch.value = value.trim()
      }, SEARCH_DEBOUNCE_MS)
    },
  )

  const filtersReady = ref(false)

  watch(
    [
      () => sessionFilters.value.gameType,
      debouncedSearch,
      () => sessionFilters.value.onlyMine,
      () => sessionFilters.value.participantIds,
      () => sessionFilters.value.playerTeamId,
      () => sessionFilters.value.datePreset,
      () => sessionFilters.value.dateFrom,
      () => sessionFilters.value.dateTo,
      ownerId,
    ],
    () => {
      if (!filtersReady.value || !ownerId.value) return
      void loadSessions({ force: true })
    },
  )

  async function resolveSessionMembers(selectedParticipantIds: string[]) {
    if (!ownerId.value || !authStore.profile) return []

    const selfParticipant = await ensureSelfParticipant(authStore.profile)
    const memberIds = new Set(selectedParticipantIds)
    memberIds.add(selfParticipant.id)

    return Array.from(memberIds).map(participantId => ({ participantId }))
  }

  async function saveSessionMembers(
    sessionId: string,
    selectedParticipantIds: string[],
    playerTeamId: string | null = null,
  ) {
    if (!ownerId.value || !authStore.profile) return

    const selfParticipant = await ensureSelfParticipant(authStore.profile)
    const members = await resolveSessionMembers(selectedParticipantIds)

    await sessionsRepository.setParticipants(sessionId, members)
    await sessionsRepository.update(sessionId, { playerTeamId })
    await syncFriendsFromSession(sessionId, ownerId.value, selfParticipant.id)
    if (ownerId.value) {
      invalidateSessionsCache(ownerId.value)
      appDataCache.invalidate(`participants:${ownerId.value}`)
    }
    await loadParticipants(true)
  }

  async function loadSessions(options?: { append?: boolean; force?: boolean }) {
    if (!ownerId.value) return

    const append = options?.append ?? false
    const force = options?.force ?? false
    const offset = append ? sessionsOffset.value : 0
    const queryOptions = {
      ...listSessionsOptions.value,
      limit: SESSIONS_PAGE_SIZE + 1,
      offset,
    }
    const queryKey = hashListSessionsOptions(listSessionsOptions.value)
    const cacheKey = `sessions:${ownerId.value}:${queryKey}:${offset}`

    if (!force && !append) {
      const cached = appDataCache.get<SessionListItem[]>(cacheKey)
      if (cached) {
        sessions.value = cached
        sessionsOffset.value = cached.length
        hasMoreSessions.value = cached.length >= SESSIONS_PAGE_SIZE
        return
      }
    }

    if (append) {
      isLoadingMore.value = true
    } else {
      isLoading.value = true
    }
    errorMessage.value = null

    try {
      const summaries = await sessionsRepository.listSummaries(queryOptions)

      hasMoreSessions.value = summaries.length > SESSIONS_PAGE_SIZE
      const page = hasMoreSessions.value
        ? summaries.slice(0, SESSIONS_PAGE_SIZE)
        : summaries

      const membersBySession = await sessionsRepository.listMemberPreviewsBySessionIds(
        page.map(session => session.id),
      )

      const items: SessionListItem[] = page.map(summary => ({
        id: summary.id,
        gameCatalogId: summary.gameCatalogId,
        gameType: summary.gameType,
        playedAt: summary.playedAt,
        status: summary.status,
        outcome: summary.outcome,
        notes: summary.notes,
        gameTitle: summary.gameTitle,
        escapeCity: summary.escapeCity,
        escapeVenue: summary.escapeVenue,
        playerTeamId: summary.playerTeamId,
        players: membersBySession.get(summary.id) ?? [],
      }))

      if (append) {
        sessions.value = [...sessions.value, ...items]
      } else {
        sessions.value = items
        appDataCache.set(cacheKey, items)
      }

      sessionsOffset.value = offset + page.length
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  async function loadMoreSessions() {
    if (!hasMoreSessions.value || isLoadingMore.value || isLoading.value) return
    await loadSessions({ append: true })
  }

  function clearSessionFilters() {
    sessionFilters.value = createDefaultSessionListFilters()
    debouncedSearch.value = ""
  }

  async function loadParticipants(force = false) {
    if (!ownerId.value || !authStore.profile) return

    const cacheKey = `participants:${ownerId.value}`

    if (!force) {
      const cached = appDataCache.get<Participant[]>(cacheKey)
      if (cached) {
        participants.value = sortParticipantsWithSelfFirst(cached, ownerId.value)
        return
      }
    }

    try {
      const promptCompleted = await fetchParticipantLinkPromptCompleted(ownerId.value)
      const existingSelf = await participantsRepository.findByProfileId(
        ownerId.value,
        ownerId.value,
      )

      if (promptCompleted || existingSelf) {
        await ensureSelfParticipant(authStore.profile)
      }

      const list = await participantsRepository.listForOwner(ownerId.value)
      const sorted = sortParticipantsWithSelfFirst(list, ownerId.value)
      participants.value = sorted
      appDataCache.set(cacheKey, sorted)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  async function loadPlayerTeams(force = false) {
    if (!ownerId.value) return

    const cacheKey = `playerTeams:${ownerId.value}`

    if (!force) {
      const cached = appDataCache.get<PlayerTeamWithMembers[]>(cacheKey)
      if (cached) {
        playerTeams.value = cached
        return
      }
    }

    try {
      playerTeams.value = await playerTeamsRepository.listForOwner(ownerId.value)
      appDataCache.set(cacheKey, playerTeams.value)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  async function loadEscapeCatalog(force = false) {
    const cacheKey = "escapeCatalog"

    if (!force) {
      const cached = appDataCache.get<EscapeRoomCatalogEntry[]>(cacheKey)
      if (cached) {
        escapeCatalog.value = cached
        return
      }
    }

    try {
      escapeCatalog.value = await catalogRepository.listEscapeRooms()
      appDataCache.set(cacheKey, escapeCatalog.value)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  async function searchBgg(query: string) {
    const normalized = query.trim()

    bggSearchFeedback.value = null
    bggAutoFillTitle.value = null
    bggAutoSelectId.value = null

    if (!normalized) {
      bggResults.value = []
      bggSearchFeedback.value = {
        tone: "hint",
        message: "Escribe un nombre para buscar en BGG.",
      }
      return
    }

    isBggSearching.value = true

    try {
      const results = await searchBoardGames(normalized)
      bggResults.value = results

      if (results.length === 0) {
        bggSearchFeedback.value = {
          tone: "hint",
          message: `Nada en BGG para «${normalized}». Usa el nombre de arriba.`,
        }
        bggAutoFillTitle.value = normalized
        return
      }

      if (results.length === 1) {
        const [match] = results
        if (match) {
          bggAutoSelectId.value = match.bggId
          bggAutoFillTitle.value = match.title
        }
        return
      }

      bggSearchFeedback.value = {
        tone: "hint",
        message: `${results.length} resultados. Elige uno de la lista.`,
      }
    } catch (error) {
      bggResults.value = []
      bggSearchFeedback.value = bggSearchFeedbackForError(error)
      bggAutoFillTitle.value = normalized
    } finally {
      isBggSearching.value = false
    }
  }

  function clearBggSearchState() {
    bggResults.value = []
    bggSearchFeedback.value = null
    bggAutoFillTitle.value = null
    bggAutoSelectId.value = null
    isBggSearching.value = false
  }

  async function createFriendParticipant(displayName: string): Promise<Participant | null> {
    if (!ownerId.value) return null

    const parsed = participantFormSchema.safeParse({ displayName })
    if (!parsed.success) return null

    const normalizedName = parsed.data.displayName

    try {
      const existing = await participantsRepository.findByDisplayName(
        ownerId.value,
        normalizedName,
      )

      if (existing) {
        await loadParticipants(true)
        return existing
      }

      await participantsRepository.create(ownerId.value, {
        displayName: normalizedName,
        color: getAvatarColor(normalizedName),
      })

      await loadParticipants(true)
      return (
        participants.value.find(
          participant => participant.displayName.toLowerCase() === normalizedName.toLowerCase(),
        ) ?? null
      )
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      return null
    }
  }

  async function createSession(payload: CreateSessionPayload): Promise<string | null> {
    if (!ownerId.value) return null

    isSaving.value = true
    errorMessage.value = null

    try {
      const game = await catalogRepository.createBoardGame({
        title: payload.title.trim(),
        createdBy: ownerId.value,
        source: payload.bggSelection ? "bgg" : "manual",
        sourceExternalId: payload.bggSelection
          ? String(payload.bggSelection.bggId)
          : null,
        bggId: payload.bggSelection?.bggId ?? null,
        yearPublished: payload.bggSelection?.yearPublished ?? null,
      })

      const session = await sessionsRepository.create({
        gameCatalogId: game.id,
        createdBy: ownerId.value,
        playerTeamId: payload.playerTeamId ?? null,
        playedAt: new Date().toISOString(),
        status: "in_progress",
        notes: payload.notes?.trim() || null,
      })

      await sessionsRepository.update(session.id, {
        isPaused: false,
        lastStartedAt: new Date().toISOString(),
      })

      await saveSessionMembers(
        session.id,
        payload.selectedParticipants,
        payload.playerTeamId ?? null,
      )
      await loadSessions({ force: true })

      return session.id
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function createEscapeSession(
    payload: CreateEscapeSessionPayload,
  ): Promise<string | null> {
    if (!ownerId.value) return null

    isSaving.value = true
    errorMessage.value = null

    try {
      let catalogId = payload.catalogId ?? null

      if (!catalogId) {
        const game = await catalogRepository.createEscapeRoom({
          title: payload.title.trim(),
          createdBy: ownerId.value,
          city: payload.city ?? null,
          venue: payload.venue ?? null,
          roomName: payload.roomName ?? null,
          company: payload.company ?? null,
          source: "manual",
        })
        catalogId = game.id
      }

      const session = await sessionsRepository.create({
        gameCatalogId: catalogId,
        createdBy: ownerId.value,
        playerTeamId: payload.playerTeamId ?? null,
        playedAt: new Date().toISOString(),
        status: "planned",
        notes: payload.notes?.trim() || null,
      })

      await sessionsRepository.upsertEscapeSessionDetails(session.id, {
        priceCurrency: "EUR",
      })

      await saveSessionMembers(
        session.id,
        payload.selectedParticipants,
        payload.playerTeamId ?? null,
      )
      if (ownerId.value) {
        invalidateSessionsCache(ownerId.value)
        appDataCache.invalidate("escapeCatalog")
      }
      await Promise.all([loadSessions({ force: true }), loadEscapeCatalog(true)])

      return session.id
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      return null
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    filtersReady.value = true
    void loadSessions()
    void loadParticipants()
    void loadPlayerTeams()
    void loadEscapeCatalog()
  })

  return {
    sessions,
    sessionFilters,
    sessionFilter,
    hasActiveSessionFilters,
    participants,
    playerTeams,
    escapeCatalog,
    bggResults,
    bggSearchFeedback,
    isBggSearching,
    bggAutoFillTitle,
    bggAutoSelectId,
    isLoading,
    isLoadingMore,
    hasMoreSessions,
    isSaving,
    errorMessage,
    selfParticipantId,
    clearSessionFilters,
    loadSessions,
    loadMoreSessions,
    loadEscapeCatalog,
    searchBgg,
    clearBggSearchState,
    createSession,
    createEscapeSession,
    createFriendParticipant,
  }
}
