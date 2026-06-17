import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { GameCatalog } from "@/domain/types/catalog"
import type { Participant } from "@/domain/types/participant"
import type { SessionMemberInput } from "@/domain/types/session"
import type { SessionOutcome, SessionStatus } from "@/domain/types/rows"
import { getDbErrorMessage } from "@/services/errors"
import { catalogRepository } from "@/services/catalog/catalogRepository"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"
import { searchBoardGames, type BggSearchResult } from "@/services/bgg/bggService"

export type SessionListItem = {
  id: string
  gameCatalogId: string
  playedAt: string
  status: SessionStatus
  outcome: SessionOutcome | null
  notes: string | null
  gameTitle: string
}

export type CreateSessionPayload = {
  title: string
  notes?: string
  selectedParticipants: string[]
  bggSelection?: BggSearchResult | null
}

export function useSessions() {
  const authStore = useAuthStore()
  const ownerId = computed(() => authStore.profile?.id ?? null)

  const sessions = ref<SessionListItem[]>([])
  const participants = ref<Participant[]>([])
  const bggResults = ref<BggSearchResult[]>([])

  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  async function loadSessions() {
    if (!ownerId.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const sessionRows = await sessionsRepository.list()
      const catalogMap = new Map<string, GameCatalog | null>()

      for (const session of sessionRows) {
        if (!catalogMap.has(session.gameCatalogId)) {
          const catalog = await catalogRepository.getById(session.gameCatalogId)
          catalogMap.set(session.gameCatalogId, catalog)
        }
      }

      sessions.value = sessionRows.map(session => ({
        id: session.id,
        gameCatalogId: session.gameCatalogId,
        playedAt: session.playedAt,
        status: session.status,
        outcome: session.outcome,
        notes: session.notes,
        gameTitle: catalogMap.get(session.gameCatalogId)?.title ?? "Juego",
      }))
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

  onMounted(() => {
    void loadSessions()
    void loadParticipants()
  })

  return {
    sessions,
    participants,
    bggResults,
    isLoading,
    isSaving,
    errorMessage,
    loadSessions,
    searchBgg,
    createSession,
  }
}
