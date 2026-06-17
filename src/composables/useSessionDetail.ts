import { computed, onMounted, onUnmounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { EscapeRoomDetails } from "@/domain/types/catalog"
import type { EscapeSessionDetails } from "@/domain/types/escapeSession"
import type { GameType, SessionOutcome } from "@/domain/types/rows"
import type {
  PlaySession,
  SessionMessage,
  SessionParticipant,
  SessionScore,
  SessionScoreInput,
  UpdateSessionInput,
} from "@/domain/types/session"
import { catalogRepository } from "@/services/catalog/catalogRepository"
import { getDbErrorMessage } from "@/services/errors"
import { participantsRepository } from "@/services/participants/participantsRepository"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"

type SessionMember = {
  id: string
  displayName: string
  participantId: string | null
  profileId: string | null
}

export function useSessionDetail(sessionId: string) {
  const authStore = useAuthStore()

  const session = ref<PlaySession | null>(null)
  const gameTitle = ref("Juego")
  const gameType = ref<GameType>("board_game")
  const escapeRoom = ref<EscapeRoomDetails | null>(null)
  const escapeDetails = ref<EscapeSessionDetails | null>(null)
  const members = ref<SessionMember[]>([])
  const messages = ref<SessionMessage[]>([])
  const scores = ref<SessionScore[]>([])

  const isLoading = ref(false)
  const isSaving = ref(false)
  const errorMessage = ref<string | null>(null)
  const nowMs = ref(Date.now())

  let intervalId: number | undefined

  const elapsedMs = computed(() => {
    if (!session.value) return 0
    if (session.value.isPaused || !session.value.lastStartedAt) return session.value.durationMs

    const startedAtMs = new Date(session.value.lastStartedAt).getTime()
    return session.value.durationMs + Math.max(0, nowMs.value - startedAtMs)
  })

  const elapsedLabel = computed(() => {
    const totalSeconds = Math.floor(elapsedMs.value / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  })

  const canWrite = computed(() => {
    return authStore.profile?.id && session.value?.createdBy === authStore.profile.id
  })

  const isEscapeSession = computed(() => gameType.value === "escape_room")

  function setTicker(active: boolean) {
    if (intervalId) {
      window.clearInterval(intervalId)
      intervalId = undefined
    }

    if (active) {
      intervalId = window.setInterval(() => {
        nowMs.value = Date.now()
      }, 1000)
    }
  }

  async function load() {
    if (!sessionId) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const found = await sessionsRepository.getById(sessionId)
      if (!found) {
        errorMessage.value = "No se encontró la sesión."
        return
      }

      session.value = found

      const catalog = await catalogRepository.getById(found.gameCatalogId)
      gameTitle.value = catalog?.title ?? "Juego"
      gameType.value = catalog?.type ?? "board_game"

      if (catalog?.type === "escape_room") {
        const escapeEntry = await catalogRepository.getEscapeRoomById(found.gameCatalogId)
        escapeRoom.value = escapeEntry?.escapeRoomDetails ?? null
        escapeDetails.value = await sessionsRepository.getEscapeSessionDetails(found.id)
      } else {
        escapeRoom.value = null
        escapeDetails.value = null
      }

      const participantRows = await sessionsRepository.listParticipants(found.id)
      members.value = await resolveMembers(participantRows)

      messages.value = await sessionsRepository.listMessages(found.id)
      scores.value =
        catalog?.type === "board_game"
          ? await sessionsRepository.listScores(found.id)
          : []
      setTicker(catalog?.type === "board_game" && !found.isPaused)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function resolveMembers(rows: SessionParticipant[]): Promise<SessionMember[]> {
    const resolved: SessionMember[] = []

    for (const row of rows) {
      if (row.participantId) {
        const participant = await participantsRepository.getById(row.participantId)
        resolved.push({
          id: row.id,
          displayName: participant?.displayName ?? "Participante",
          participantId: row.participantId,
          profileId: row.profileId,
        })
      } else if (row.profileId && authStore.profile?.id === row.profileId) {
        resolved.push({
          id: row.id,
          displayName: authStore.profile.displayName,
          participantId: null,
          profileId: row.profileId,
        })
      }
    }

    return resolved
  }

  async function patchSession(partial: UpdateSessionInput) {
    if (!session.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      const updated = (await sessionsRepository.update(
        session.value.id,
        partial,
      )) as PlaySession
      session.value = updated
      setTicker(!updated.isPaused)
      nowMs.value = Date.now()
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isSaving.value = false
    }
  }

  async function startTimer() {
    if (!session.value || !canWrite.value) return
    if (!session.value.isPaused) return

    await patchSession({
      isPaused: false,
      lastStartedAt: new Date().toISOString(),
      status: "in_progress",
    })
  }

  async function pauseTimer() {
    if (!session.value || !canWrite.value) return
    if (session.value.isPaused) return

    await patchSession({
      isPaused: true,
      durationMs: elapsedMs.value,
      lastStartedAt: null,
    })
  }

  async function resetTimer() {
    if (!session.value || !canWrite.value) return

    await patchSession({
      isPaused: true,
      durationMs: 0,
      lastStartedAt: null,
      endedAt: null,
    })
  }

  async function saveBoardOutcome(outcome: SessionOutcome) {
    if (!session.value || !canWrite.value) return

    await patchSession({
      outcome,
      status: "completed",
      endedAt: new Date().toISOString(),
      isPaused: true,
      durationMs: elapsedMs.value,
      lastStartedAt: null,
    })
  }

  async function addMessage(content: string) {
    if (!session.value || !authStore.profile?.id) return

    const normalized = content.trim()
    if (!normalized) return

    isSaving.value = true
    errorMessage.value = null
    try {
      const created = await sessionsRepository.addMessage(session.value.id, {
        authorProfileId: authStore.profile.id,
        authorDisplayName: authStore.profile.displayName,
        content: normalized,
      })

      messages.value = [...messages.value, created]
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isSaving.value = false
    }
  }

  async function saveEscapeDetails(payload: {
    cluesUsed: number | null
    timeResult: string | null
    timeSeconds: number | null
    price: number | null
    priceCurrency: string
    escaped: boolean | null
  }) {
    if (!session.value || !canWrite.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
      const sessionId = session.value.id

      escapeDetails.value = await sessionsRepository.upsertEscapeSessionDetails(
        sessionId,
        payload,
      )

      if (payload.escaped !== null) {
        const outcome: SessionOutcome = payload.escaped ? "escaped" : "failed"

        session.value = await sessionsRepository.update(sessionId, {
          outcome,
          status: "completed",
          endedAt: new Date().toISOString(),
          isPaused: true,
          lastStartedAt: null,
        })
      }
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isSaving.value = false
    }
  }

  async function saveScores(payload: SessionScoreInput[]) {
    if (!session.value || !canWrite.value) return

    isSaving.value = true
    errorMessage.value = null
    try {
      scores.value = await sessionsRepository.setScores(session.value.id, payload)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isSaving.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  onUnmounted(() => {
    setTicker(false)
  })

  return {
    session,
    gameTitle,
    gameType,
    escapeRoom,
    escapeDetails,
    isEscapeSession,
    members,
    messages,
    scores,
    isLoading,
    isSaving,
    errorMessage,
    elapsedLabel,
    elapsedMs,
    canWrite,
    load,
    startTimer,
    pauseTimer,
    resetTimer,
    saveBoardOutcome,
    addMessage,
    saveScores,
    saveEscapeDetails,
  }
}
