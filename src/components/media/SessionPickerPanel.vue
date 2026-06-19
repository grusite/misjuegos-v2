<script setup lang="ts">
import { computed, ref, watch } from "vue"
import SearchInput from "@/components/ui/SearchInput.vue"
import type { SessionListSummary } from "@/domain/types/session"
import type { GameType } from "@/domain/types/rows"
import { getDbErrorMessage } from "@/services/errors"
import { sessionsRepository } from "@/services/sessions/sessionsRepository"

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    selectedSessionId?: string | null
  }>(),
  {
    disabled: false,
    selectedSessionId: null,
  },
)

const emit = defineEmits<{
  select: [sessionId: string]
}>()

const search = ref("")
const typeFilter = ref<"all" | GameType>("all")
const sessions = ref<SessionListSummary[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const filteredSessions = computed(() => {
  if (typeFilter.value === "all") return sessions.value
  return sessions.value.filter(session => session.gameType === typeFilter.value)
})

watch(
  () => props.disabled,
  disabled => {
    if (!disabled) void loadSessions()
  },
  { immediate: true },
)

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void loadSessions()
  }, 300)
})

async function loadSessions() {
  isLoading.value = true
  errorMessage.value = null

  try {
    sessions.value = await sessionsRepository.listSummaries({
      search: search.value.trim() || undefined,
      limit: 40,
    })
  } catch (error) {
    errorMessage.value = getDbErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
    new Date(isoDate),
  )
}

function typeLabel(gameType: GameType): string {
  return gameType === "escape_room" ? "Escape" : "Mesa"
}

function typeChipClass(gameType: GameType): string {
  return gameType === "escape_room"
    ? "border-tertiary/40 text-tertiary"
    : "border-board/40 text-board"
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <button
        v-for="option in [
          { value: 'all', label: 'Todas' },
          { value: 'board_game', label: 'Mesa' },
          { value: 'escape_room', label: 'Escape' },
        ]"
        :key="option.value"
        type="button"
        class="rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors"
        :class="
          typeFilter === option.value
            ? 'border-primary bg-primary/20 text-primary'
            : 'border-gray-700 text-gray-400'
        "
        :disabled="disabled"
        @click="typeFilter = option.value as typeof typeFilter"
      >
        {{ option.label }}
      </button>
    </div>

    <SearchInput
      v-model="search"
      placeholder="Buscar por nombre, ciudad o sitio..."
    />

    <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-3 text-sm text-secondary">
      {{ errorMessage }}
    </p>

    <div class="max-h-56 space-y-2 overflow-y-auto">
      <p v-if="isLoading" class="text-sm text-gray-400">Buscando partidas...</p>

      <button
        v-for="session in filteredSessions"
        :key="session.id"
        type="button"
        class="flex w-full items-start justify-between gap-3 rounded-xl border-2 p-3 text-left transition-colors disabled:opacity-50"
        :class="
          selectedSessionId === session.id
            ? 'border-primary bg-primary/10'
            : 'border-gray-700 hover:border-primary'
        "
        :disabled="disabled"
        @click="emit('select', session.id)"
      >
        <div class="min-w-0">
          <p class="font-semibold text-gray-100">{{ session.gameTitle }}</p>
          <p
            v-if="session.escapeCity || session.escapeVenue"
            class="text-xs text-gray-500"
          >
            {{ [session.escapeCity, session.escapeVenue].filter(Boolean).join(" · ") }}
          </p>
          <p class="text-xs text-gray-500">{{ formatDate(session.playedAt) }}</p>
        </div>
        <span
          class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase"
          :class="typeChipClass(session.gameType)"
        >
          {{ typeLabel(session.gameType) }}
        </span>
      </button>

      <p
        v-if="!isLoading && filteredSessions.length === 0"
        class="rounded-xl border-2 border-dashed border-gray-700 p-4 text-center text-sm text-gray-500"
      >
        No hay partidas con esta búsqueda.
      </p>
    </div>
  </div>
</template>
