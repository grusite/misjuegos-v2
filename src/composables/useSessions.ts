import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { EscapeRoomCatalogEntry, GameCatalog } from "@/domain/types/catalog"
import type { Participant } from "@/domain/types/participant"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import type { SessionMemberPreview } from "@/domain/types/session"
import type { GameType, SessionOutcome, SessionStatus } from "@/domain/types/rows"
import { participantFormSchema } from "@/domain/schemas/participant"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import { getDbErrorMessage } from "@/services/errors"
import { catalogRepository } from "@/services/catalog/catalogRepository"
import {
  ensureSelfParticipant,
  sortParticipantsWithSelfFirst,
  syncFriendsFromAllSessions,
  syncFriendsFromSession,
} from "@/services/participants/participantBootstrap"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { playerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"
import {
  bggSearchFeedbackForError,
  searchBoardGames,
  type BggSearchFeedback,
  type BggSearchResult,
} from "@/services/bgg/bggService"

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
  const sessionFilter = ref<SessionFilter>("all")

  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)

  const filteredSessions = computed(() => {
    if (sessionFilter.value === "all") return sessions.value
    return sessions.value.filter(session => session.gameType === sessionFilter.value)
  })

  const selfParticipantId = computed(
    () => participants.value.find(participant => participant.profileId === ownerId.value)?.id ?? null,
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
    await loadParticipants()
  }

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
    if (!ownerId.value || !authStore.profile) return

    try {
      const selfParticipant = await ensureSelfParticipant(authStore.profile)
      await syncFriendsFromAllSessions(ownerId.value, selfParticipant.id)

      const list = await participantsRepository.listForOwner(ownerId.value)
      participants.value = sortParticipantsWithSelfFirst(list, ownerId.value)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  async function loadPlayerTeams() {
    if (!ownerId.value) return

    try {
      playerTeams.value = await playerTeamsRepository.listForOwner(ownerId.value)
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
        await loadParticipants()
        return existing
      }

      await participantsRepository.create(ownerId.value, {
        displayName: normalizedName,
        color: getAvatarColor(normalizedName),
      })

      await loadParticipants()
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
    void loadPlayerTeams()
    void loadEscapeCatalog()
  })

  return {
    sessions,
    filteredSessions,
    sessionFilter,
    participants,
    playerTeams,
    escapeCatalog,
    bggResults,
    bggSearchFeedback,
    isBggSearching,
    bggAutoFillTitle,
    bggAutoSelectId,
    isLoading,
    isSaving,
    errorMessage,
    selfParticipantId,
    loadSessions,
    loadEscapeCatalog,
    searchBgg,
    clearBggSearchState,
    createSession,
    createEscapeSession,
    createFriendParticipant,
  }
}
