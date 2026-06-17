<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import NewSessionPanel from "@/components/sessions/newSessionPanel.vue"
import UiButton from "@/components/ui/UiButton.vue"
import { useSessions } from "@/composables/useSessions"

const router = useRouter()
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
  <section class="relative space-y-6 pb-28">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-secondary">Partidas</p>
      <h1 class="text-3xl font-bold text-primary">Sesiones</h1>
      <p class="text-gray-400">Historial y creación rápida de partidas.</p>
    </div>

    <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-4 text-secondary">
      {{ errorMessage }}
    </p>

    <Transition name="panel">
      <NewSessionPanel
        v-if="isCreating"
        :participants="participants"
        :bgg-results="bggResults"
        :is-saving="isSaving"
        @search-bgg="searchBgg"
        @submit="handleCreate"
        @cancel="isCreating = false"
      />
    </Transition>

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

    <div class="fixed inset-x-0 bottom-6 z-20 mx-auto flex max-w-lg justify-center px-4">
      <UiButton
        class="w-full max-w-sm rounded-full !py-4 text-xl"
        @click="isCreating = !isCreating"
      >
        {{ isCreating ? "Cerrar nueva partida" : "Nueva partida" }}
      </UiButton>
    </div>
  </section>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: all 0.35s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
