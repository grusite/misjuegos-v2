<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import NewEscapeSessionPanel from "@/components/sessions/NewEscapeSessionPanel.vue"
import NewSessionPanel from "@/components/sessions/newSessionPanel.vue"
import ParticipantAvatarStack from "@/components/sessions/ParticipantAvatarStack.vue"
import { useSessions, type SessionFilter } from "@/composables/useSessions"
import { useUiStore } from "@/stores/uiStore"

const router = useRouter()
const uiStore = useUiStore()
const {
  sessions,
  filteredSessions,
  sessionFilter,
  participants,
  playerTeams,
  selfParticipantId,
  escapeCatalog,
  bggResults,
  bggSearchFeedback,
  isBggSearching,
  bggAutoFillTitle,
  bggAutoSelectId,
  isLoading,
  isSaving,
  errorMessage,
  searchBgg,
  clearBggSearchState,
  createSession,
  createEscapeSession,
  createFriendParticipant,
} = useSessions()

const isCreating = ref(false)
const createKind = ref<"board_game" | "escape_room">("board_game")
const hasSessions = computed(() => sessions.value.length > 0)

const filterOptions: Array<{ value: SessionFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "board_game", label: "Juegos de mesa" },
  { value: "escape_room", label: "Escape rooms" },
]

watch(
  () => uiStore.isNavOpen,
  isNavOpen => {
    if (isNavOpen) {
      clearBggSearchState()
      isCreating.value = false
    }
  },
)

watch(isCreating, open => {
  if (!open) clearBggSearchState()
})

onMounted(() => {
  const unregister = uiStore.onHomeClick(() => {
    isCreating.value = false
  })

  onUnmounted(unregister)
})

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate))
}

function sessionTypeLabel(gameType: "board_game" | "escape_room") {
  return gameType === "escape_room" ? "Escape" : "Mesa"
}

function filterChipClasses(value: SessionFilter): string {
  const isActive = sessionFilter.value === value

  if (!isActive) {
    return "border-gray-700 text-gray-400 hover:border-gray-500"
  }

  if (value === "escape_room") {
    return "border-tertiary bg-tertiary/20 text-tertiary"
  }

  if (value === "board_game") {
    return "border-board bg-board/20 text-board"
  }

  return "border-primary bg-primary/20 text-primary"
}

function sessionCardHoverClass(gameType: "board_game" | "escape_room") {
  return gameType === "escape_room"
    ? "border-gray-700 hover:border-tertiary"
    : "border-gray-700 hover:border-board"
}

function sessionTitleClass(gameType: "board_game" | "escape_room") {
  return gameType === "escape_room" ? "text-tertiary" : "text-board"
}

function sessionBadgeClass(gameType: "board_game" | "escape_room") {
  return gameType === "escape_room"
    ? "border-tertiary/40 text-tertiary"
    : "border-board/40 text-board"
}

function avatarAccent(gameType: "board_game" | "escape_room") {
  return gameType === "escape_room" ? "tertiary" : "board"
}

async function handleCreateBoard(payload: {
  title: string
  notes?: string
  selectedParticipants: string[]
  bggSelection?: { bggId: number; title: string; yearPublished: number | null } | null
}) {
  const sessionId = await createSession(payload)
  if (!sessionId) return

  clearBggSearchState()
  isCreating.value = false
  await router.push({ name: "session-detail", params: { id: sessionId } })
}

function handleCancelCreate() {
  clearBggSearchState()
  isCreating.value = false
}

async function handleCreateEscape(payload: {
  catalogId?: string | null
  title: string
  city?: string
  venue?: string
  company?: string
  notes?: string
  selectedParticipants: string[]
}) {
  const sessionId = await createEscapeSession(payload)
  if (!sessionId) return

  isCreating.value = false
  await router.push({ name: "session-detail", params: { id: sessionId } })
}
</script>

<template>
  <section class="relative overflow-hidden pb-28">
    <div
      class="space-y-6 transition-transform duration-1000"
      :class="isCreating ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="space-y-2">
        <p class="text-sm uppercase tracking-widest text-gray-500">Partidas</p>
        <h1 class="text-3xl font-bold text-primary">Sesiones</h1>
        <p class="text-gray-400">Historial y creación rápida de partidas.</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          type="button"
          class="rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors"
          :class="filterChipClasses(option.value)"
          @click="sessionFilter = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-4 text-secondary">
        {{ errorMessage }}
      </p>

      <div class="space-y-3">
        <p v-if="isLoading" class="text-gray-400">Cargando sesiones...</p>

        <article
          v-for="session in filteredSessions"
          :key="session.id"
          class="rounded-xl border-4 p-4 transition-colors"
          :class="sessionCardHoverClass(session.gameType)"
        >
          <div class="flex items-start justify-between gap-3">
            <RouterLink
              :to="{ name: 'session-detail', params: { id: session.id } }"
              class="min-w-0 flex-1"
            >
              <p class="text-lg font-bold" :class="sessionTitleClass(session.gameType)">
                {{ session.gameTitle }}
              </p>
            </RouterLink>
            <div class="flex shrink-0 items-center gap-2">
              <ParticipantAvatarStack
                v-if="session.players.length > 0"
                :members="session.players"
                :accent="avatarAccent(session.gameType)"
              />
              <span
                class="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
                :class="sessionBadgeClass(session.gameType)"
              >
                {{ sessionTypeLabel(session.gameType) }}
              </span>
            </div>
          </div>
          <RouterLink
            :to="{ name: 'session-detail', params: { id: session.id } }"
            class="mt-1 block"
          >
            <p v-if="session.escapeCity || session.escapeVenue" class="text-sm text-gray-500">
              {{ [session.escapeCity, session.escapeVenue].filter(Boolean).join(" · ") }}
            </p>
            <p class="text-sm text-gray-400">{{ formatDate(session.playedAt) }}</p>
            <p class="mt-2 text-xs uppercase text-gray-500">{{ session.status }}</p>
          </RouterLink>
        </article>

        <p
          v-if="!isLoading && filteredSessions.length === 0"
          class="rounded-xl border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
        >
          No hay sesiones con este filtro.
        </p>
      </div>
    </div>

    <div
      class="fixed inset-x-0 top-full z-30 mx-auto max-w-lg px-4 transition-transform duration-1000"
      :class="isCreating ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="max-h-[100dvh] overflow-y-auto overscroll-contain">
        <div class="space-y-4 pt-[calc(5.5rem+env(safe-area-inset-top))] pb-36">
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors"
              :class="
                createKind === 'board_game'
                  ? 'border-board bg-board text-dark'
                  : 'border-gray-700 text-gray-400'
              "
              @click="createKind = 'board_game'"
            >
              Juego de mesa
            </button>
            <button
              type="button"
              class="flex-1 rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-colors"
              :class="
                createKind === 'escape_room'
                  ? 'border-tertiary bg-tertiary text-dark'
                  : 'border-gray-700 text-gray-400'
              "
              @click="createKind = 'escape_room'"
            >
              Escape room
            </button>
          </div>

          <NewSessionPanel
            v-if="createKind === 'board_game'"
            :participants="participants"
            :player-teams="playerTeams"
            :self-participant-id="selfParticipantId"
            :bgg-results="bggResults"
            :bgg-search-feedback="bggSearchFeedback"
            :is-bgg-searching="isBggSearching"
            :bgg-auto-fill-title="bggAutoFillTitle"
            :bgg-auto-select-id="bggAutoSelectId"
            :is-saving="isSaving"
            :create-participant="createFriendParticipant"
            @search-bgg="searchBgg"
            @submit="handleCreateBoard"
            @cancel="handleCancelCreate"
          />
          <NewEscapeSessionPanel
            v-else
            :participants="participants"
            :player-teams="playerTeams"
            :self-participant-id="selfParticipantId"
            :escape-catalog="escapeCatalog"
            :is-saving="isSaving"
            :create-participant="createFriendParticipant"
            @submit="handleCreateEscape"
            @cancel="handleCancelCreate"
          />
        </div>
      </div>
    </div>

    <div
      v-show="!uiStore.isNavOpen"
      class="pointer-events-none fixed inset-x-0 mx-auto flex max-w-lg justify-center px-4 transition-all duration-1000"
      :class="isCreating ? 'bottom-4 z-50' : '-bottom-11 z-20'"
    >
      <button
        type="button"
        class="pointer-events-auto flex rotate-0 flex-col items-center justify-center rounded-full border-4 border-dashed border-dark bg-primary text-dark ring-4 ring-primary transition-all duration-1000"
        :class="
          isCreating
            ? 'h-16 w-16 rotate-180 justify-center pt-0'
            : 'h-32 w-32 justify-start pt-3'
        "
        :aria-label="isCreating ? 'Cerrar formulario' : 'Nueva partida'"
        @click="isCreating = !isCreating"
      >
        <span
          class="font-bold leading-none transition-transform duration-1000"
          :class="
            isCreating
              ? 'translate-y-0 rotate-45 text-2xl'
              : 'text-3xl'
          "
        >
          +
        </span>
        <span
          v-if="!isCreating"
          class="mt-1 text-sm font-bold"
        >
          {{ hasSessions ? "Nueva partida" : "Empezar" }}
        </span>
      </button>
    </div>
  </section>
</template>
