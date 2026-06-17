import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { EscapeRoomCatalogEntry, GameCatalog } from "@/domain/types/catalog"
import type { Participant } from "@/domain/types/participant"
import type { SessionMemberInput, SessionMemberPreview } from "@/domain/types/session"
import type { GameType, SessionOutcome, SessionStatus } from "@/domain/types/rows"
import { getDbErrorMessage } from "@/services/errors"
import { catalogRepository } from "@/services/catalog/catalogRepository"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"
import { searchBoardGames, type BggSearchResult } from "@/services/bgg/bggService"

export type SessionFilter = "all" | GameType

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
  players: SessionMemberPreview[]
}

export type CreateSessionPayload = {
  title: string
  notes?: string
  selectedParticipants: string[]
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
}

export function useSessions() {
  const authStore = useAuthStore()
  const ownerId = computed(() => authStore.profile?.id ?? null)

  const sessions = ref<SessionListItem[]>([])
  const participants = ref<Participant[]>([])
  const escapeCatalog = ref<EscapeRoomCatalogEntry[]>([])
  const bggResults = ref<BggSearchResult[]>([])
  const sessionFilter = ref<SessionFilter>("all")

  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  const filteredSessions = computed(() => {
    if (sessionFilter.value === "all") return sessions.value
    return sessions.value.filter(session => session.gameType === sessionFilter.value)
  })

  async function loadSessions() {
    if (!ownerId.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const sessionRows = await sessionsRepository.list()
      const membersBySession = await sessionsRepository.listMemberPreviewsBySessionIds(
        sessionRows.map(session => session.id),
      )
      const catalogMap = new Map<string, GameCatalog | null>()
      const escapeMap = new Map<string, EscapeRoomCatalogEntry | null>()

      for (const session of sessionRows) {
        if (!catalogMap.has(session.gameCatalogId)) {
          const catalog = await catalogRepository.getById(session.gameCatalogId)
          catalogMap.set(session.gameCatalogId, catalog)

          if (catalog?.type === "escape_room") {
            escapeMap.set(
              session.gameCatalogId,
              await catalogRepository.getEscapeRoomById(session.gameCatalogId),
            )
          }
        }
      }

      sessions.value = sessionRows.map(session => {
        const catalog = catalogMap.get(session.gameCatalogId)
        const escape = escapeMap.get(session.gameCatalogId)

        return {
          id: session.id,
          gameCatalogId: session.gameCatalogId,
          gameType: catalog?.type ?? "board_game",
          playedAt: session.playedAt,
          status: session.status,
          outcome: session.outcome,
          notes: session.notes,
          gameTitle: catalog?.title ?? "Juego",
          escapeCity: escape?.escapeRoomDetails.city ?? null,
          escapeVenue: escape?.escapeRoomDetails.venue ?? null,
          players: membersBySession.get(session.id) ?? [],
        }
      })
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadParticipants() {
    if (!ownerId.value) return

    try {
      participants.value = await participantsRepository.listForOwner(ownerId.value)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  async function loadEscapeCatalog() {
    try {
      escapeCatalog.value = await catalogRepository.listEscapeRooms()
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  async function searchBgg(query: string) {
    bggResults.value = await searchBoardGames(query)
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
        playedAt: new Date().toISOString(),
        status: "in_progress",
        notes: payload.notes?.trim() || null,
      })

      await sessionsRepository.update(session.id, {
        isPaused: false,
        lastStartedAt: new Date().toISOString(),
      })

      const members: SessionMemberInput[] = payload.selectedParticipants.map(
        participantId => ({
          participantId,
        }),
      )

      await sessionsRepository.setParticipants(session.id, members)
      await loadSessions()

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
        playedAt: new Date().toISOString(),
        status: "planned",
        notes: payload.notes?.trim() || null,
      })

      await sessionsRepository.upsertEscapeSessionDetails(session.id, {
        priceCurrency: "EUR",
      })

      const members: SessionMemberInput[] = payload.selectedParticipants.map(
        participantId => ({
          participantId,
        }),
      )

      await sessionsRepository.setParticipants(session.id, members)
      await Promise.all([loadSessions(), loadEscapeCatalog()])

      return session.id
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
      return null
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    void loadSessions()
    void loadParticipants()
    void loadEscapeCatalog()
  })

  return {
    sessions,
    filteredSessions,
    sessionFilter,
    participants,
    escapeCatalog,
    bggResults,
    isLoading,
    isSaving,
    errorMessage,
    loadSessions,
    loadEscapeCatalog,
    searchBgg,
    createSession,
    createEscapeSession,
  }
}
