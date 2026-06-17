<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import NewSessionPanel from "@/components/sessions/newSessionPanel.vue"
import { useSessions } from "@/composables/useSessions"
import { useUiStore } from "@/stores/uiStore"

const router = useRouter()
const uiStore = useUiStore()
const {
  sessions,
  participants,
  bggResults,
  isLoading,
  isSaving,
  errorMessage,
  searchBgg,
  createSession,
} = useSessions()

const isCreating = ref(false)
const hasSessions = computed(() => sessions.value.length > 0)

watch(
  () => uiStore.isNavOpen,
  isNavOpen => {
    if (isNavOpen) isCreating.value = false
  },
)

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate))
}

async function handleCreate(payload: {
  title: string
  notes?: string
  selectedParticipants: string[]
  bggSelection?: { bggId: number; title: string; yearPublished: number | null } | null
}) {
  const sessionId = await createSession(payload)
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
        <p class="text-sm uppercase tracking-widest text-secondary">Partidas</p>
        <h1 class="text-3xl font-bold text-primary">Sesiones</h1>
        <p class="text-gray-400">Historial y creación rápida de partidas.</p>
      </div>

      <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-4 text-secondary">
        {{ errorMessage }}
      </p>

      <div class="space-y-3">
        <p v-if="isLoading" class="text-gray-400">Cargando sesiones...</p>

        <RouterLink
          v-for="session in sessions"
          :key="session.id"
          :to="{ name: 'session-detail', params: { id: session.id } }"
          class="block rounded-xl border-4 border-gray-700 p-4 transition-colors hover:border-primary"
        >
          <p class="text-lg font-bold text-primary">{{ session.gameTitle }}</p>
          <p class="text-sm text-gray-400">{{ formatDate(session.playedAt) }}</p>
          <p class="mt-2 text-xs uppercase text-tertiary">{{ session.status }}</p>
        </RouterLink>

        <p
          v-if="!isLoading && sessions.length === 0"
          class="rounded-xl border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
        >
          Todavía no hay sesiones.
        </p>
      </div>
    </div>

    <div
      class="fixed inset-x-0 top-full z-30 mx-auto max-w-lg px-4 transition-transform duration-1000"
      :class="isCreating ? '-translate-y-full' : 'translate-y-0'"
    >
      <div class="max-h-[100dvh] overflow-y-auto overscroll-contain">
        <div class="pt-24 pb-36">
          <NewSessionPanel
            :participants="participants"
            :bgg-results="bggResults"
            :is-saving="isSaving"
            @search-bgg="searchBgg"
            @submit="handleCreate"
            @cancel="isCreating = false"
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
