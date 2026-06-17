<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useRoute } from "vue-router"
import UiButton from "@/components/ui/UiButton.vue"
import UiConfirmDialog from "@/components/ui/UiConfirmDialog.vue"
import SessionMessageItem from "@/components/sessions/SessionMessageItem.vue"
import { useSessionDetail } from "@/composables/useSessionDetail"
import type { SessionOutcome } from "@/domain/types/rows"
import type { SessionScoreInput } from "@/domain/types/session"

const route = useRoute()
const sessionId = String(route.params.id ?? "")

const {
  session,
  gameTitle,
  members,
  messages,
  scores,
  isLoading,
  isSaving,
  errorMessage,
  elapsedLabel,
  elapsedMs,
  canWrite,
  startTimer,
  pauseTimer,
  resetTimer,
  setOutcome,
  addMessage,
  saveScores,
} = useSessionDetail(sessionId)

const messageDraft = ref("")
const showResetConfirm = ref(false)
const showMessagesSheet = ref(false)
const scoreDraft = reactive<Record<string, string>>({})

const outcomeOptions: Array<{ label: string; value: SessionOutcome }> = [
  { label: "Victoria", value: "win" },
  { label: "Derrota", value: "loss" },
  { label: "Empate", value: "draw" },
  { label: "Desconocido", value: "unknown" },
]

const isPlaying = computed(() => session.value?.status === "in_progress")
const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))
const isTimerPaused = computed(() => session.value?.isPaused ?? true)

const scoreByParticipant = computed(() => {
  const map = new Map<string, number | null>()
  for (const score of scores.value) {
    if (score.participantId) map.set(score.participantId, score.score)
  }
  return map
})

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate))
}

function buildScorePayload(): SessionScoreInput[] {
  return members.value.map(member => {
    const raw = scoreDraft[member.id]
    const parsed = raw === undefined || raw === "" ? null : Number(raw)

    return {
      participantId: member.participantId,
      profileId: member.profileId,
      score: Number.isFinite(parsed) ? parsed : null,
    }
  })
}

async function handleSaveScores() {
  await saveScores(buildScorePayload())
}

async function handleSendMessage() {
  const content = messageDraft.value.trim()
  if (!content) return
  await addMessage(content)
  messageDraft.value = ""
}

async function handleResetConfirm() {
  await resetTimer()
  showResetConfirm.value = false
}
</script>

<template>
  <section class="space-y-6" :class="isPlaying ? 'pb-28' : 'pb-6'">
    <RouterLink
      :to="{ name: 'sessions' }"
      class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary"
    >
      ← Volver a sesiones
    </RouterLink>

    <p v-if="isLoading" class="text-gray-400">Cargando sesión...</p>
    <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-4 text-secondary">
      {{ errorMessage }}
    </p>

    <article v-if="session && !isLoading" class="space-y-5 rounded-2xl border-4 border-primary/40 p-4 sm:p-5">
      <header class="space-y-1">
        <p class="text-sm uppercase tracking-widest text-secondary">Detalle de sesión</p>
        <h1 class="text-2xl font-bold text-primary sm:text-3xl">{{ gameTitle }}</h1>
        <p class="text-sm text-gray-400">{{ formatDate(session.playedAt) }}</p>
      </header>

      <section class="space-y-3 rounded-xl border-2 border-gray-700 p-4">
        <div class="flex w-full items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-xs uppercase tracking-wide text-gray-500">Temporizador</p>
            <p class="text-3xl font-bold tabular-nums text-primary">{{ elapsedLabel }}</p>
          </div>
          <span class="shrink-0 rounded-full border border-tertiary/40 px-3 py-1 text-xs tabular-nums uppercase text-tertiary">
            {{ elapsedSeconds }}s
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <UiButton
            :variant="isTimerPaused ? 'primary' : 'ghost'"
            :disabled="!canWrite || isSaving || !isTimerPaused"
            @click="startTimer"
          >
            Iniciar
          </UiButton>
          <UiButton
            :variant="!isTimerPaused ? 'secondary' : 'ghost'"
            :disabled="!canWrite || isSaving || isTimerPaused"
            @click="pauseTimer"
          >
            Pausar
          </UiButton>
          <UiButton
            variant="ghost"
            :disabled="!canWrite || isSaving"
            @click="showResetConfirm = true"
          >
            Reset
          </UiButton>
        </div>
      </section>

      <section
        v-if="isPlaying"
        class="space-y-3 rounded-xl border-2 border-gray-700 p-4"
      >
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs uppercase tracking-wide text-gray-500">Mensajes en partida</p>
          <UiButton
            type="button"
            variant="ghost"
            class="!px-3 !py-1 !text-sm"
            @click="showMessagesSheet = true"
          >
            Abrir chat
          </UiButton>
        </div>
        <div class="max-h-40 space-y-2 overflow-y-auto">
          <SessionMessageItem
            v-for="message in messages.slice(-3)"
            :key="message.id"
            :author-display-name="message.authorDisplayName"
            :content="message.content"
            :created-at="message.createdAt"
            compact
          />
          <p v-if="messages.length === 0" class="text-sm text-gray-500">
            Apunta ideas o momentos graciosos mientras jugáis.
          </p>
        </div>
      </section>

      <details
        class="group space-y-3 rounded-xl border-2 border-gray-700 p-4"
        :open="!isPlaying"
      >
        <summary class="cursor-pointer text-xs uppercase tracking-wide text-gray-500 marker:content-none">
          <span class="flex items-center justify-between gap-2">
            Resultado
            <span class="text-[10px] normal-case text-gray-600 group-open:hidden">
              {{ isPlaying ? "Al terminar" : "" }}
            </span>
          </span>
        </summary>
        <div class="space-y-3 pt-2">
          <div class="grid grid-cols-2 gap-2">
            <UiButton
              v-for="option in outcomeOptions"
              :key="option.value"
              variant="ghost"
              :disabled="!canWrite || isSaving"
              @click="setOutcome(option.value)"
            >
              {{ option.label }}
            </UiButton>
          </div>
          <p class="text-sm text-gray-300">
            Actual:
            <span class="font-semibold capitalize">{{ session.outcome ?? "sin definir" }}</span>
          </p>
        </div>
      </details>

      <details
        class="group space-y-3 rounded-xl border-2 border-gray-700 p-4"
        :open="!isPlaying"
      >
        <summary class="cursor-pointer text-xs uppercase tracking-wide text-gray-500 marker:content-none">
          <span class="flex items-center justify-between gap-2">
            Puntuaciones
            <span class="text-[10px] normal-case text-gray-600 group-open:hidden">
              {{ isPlaying ? "Al terminar" : "" }}
            </span>
          </span>
        </summary>
        <div class="space-y-3 pt-2">
          <div class="space-y-2">
            <label v-for="member in members" :key="member.id" class="flex items-center gap-2">
              <span class="min-w-0 flex-1 truncate text-sm text-gray-300">{{ member.displayName }}</span>
              <input
                v-model="scoreDraft[member.id]"
                type="number"
                inputmode="decimal"
                :placeholder="scoreByParticipant.get(member.participantId ?? '')?.toString() ?? '0'"
                class="w-24 rounded-lg border-2 border-gray-600 bg-dark px-2 py-1 text-right text-sm text-gray-100 focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <UiButton :disabled="!canWrite || isSaving" @click="handleSaveScores">
            Guardar puntuaciones
          </UiButton>
        </div>
      </details>

      <section
        v-if="!isPlaying"
        class="space-y-3 rounded-xl border-2 border-gray-700 p-4"
      >
        <p class="text-xs uppercase tracking-wide text-gray-500">Mensajes</p>
        <div class="max-h-52 space-y-2 overflow-y-auto">
          <SessionMessageItem
            v-for="message in messages"
            :key="message.id"
            :author-display-name="message.authorDisplayName"
            :content="message.content"
            :created-at="message.createdAt"
          />
          <p v-if="messages.length === 0" class="text-sm text-gray-500">Sin mensajes todavía.</p>
        </div>
        <div class="flex gap-2">
          <input
            v-model="messageDraft"
            type="text"
            placeholder="Escribe un mensaje..."
            class="min-w-0 flex-1 rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none"
          />
          <UiButton :disabled="isSaving || !messageDraft.trim()" @click="handleSendMessage">
            Enviar
          </UiButton>
        </div>
      </section>
    </article>

    <div
      v-if="isPlaying"
      class="fixed inset-x-0 bottom-0 z-20 border-t-2 border-gray-700 bg-dark/95 p-4 backdrop-blur-sm"
    >
      <div class="mx-auto flex max-w-lg gap-2">
        <input
          v-model="messageDraft"
          type="text"
          placeholder="Mensaje rápido..."
          class="min-w-0 flex-1 rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none"
          @keydown.enter.prevent="handleSendMessage"
        />
        <UiButton
          :disabled="isSaving || !messageDraft.trim()"
          class="!px-4"
          @click="handleSendMessage"
        >
          Enviar
        </UiButton>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showMessagesSheet"
        class="fixed inset-0 z-50 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="Chat de partida"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/60"
          aria-label="Cerrar chat"
          @click="showMessagesSheet = false"
        />

        <div class="relative mx-auto max-h-[80dvh] w-full max-w-lg rounded-t-2xl border-4 border-primary bg-dark p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-primary">Chat de partida</h2>
            <button
              type="button"
              class="rounded-full p-2 text-gray-400 hover:text-primary"
              aria-label="Cerrar"
              @click="showMessagesSheet = false"
            >
              ✕
            </button>
          </div>

          <div class="mb-4 max-h-[50dvh] space-y-2 overflow-y-auto">
            <SessionMessageItem
              v-for="message in messages"
              :key="message.id"
              :author-display-name="message.authorDisplayName"
              :content="message.content"
              :created-at="message.createdAt"
            />
            <p v-if="messages.length === 0" class="text-sm text-gray-500">Sin mensajes todavía.</p>
          </div>

          <div class="flex gap-2">
            <input
              v-model="messageDraft"
              type="text"
              placeholder="Escribe un mensaje..."
              class="min-w-0 flex-1 rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none"
              @keydown.enter.prevent="handleSendMessage"
            />
            <UiButton :disabled="isSaving || !messageDraft.trim()" @click="handleSendMessage">
              Enviar
            </UiButton>
          </div>
        </div>
      </div>
    </Teleport>

    <UiConfirmDialog
      :open="showResetConfirm"
      title="¿Reiniciar temporizador?"
      message="Se perderá el tiempo acumulado de esta partida. Esta acción no se puede deshacer."
      confirm-label="Reiniciar"
      @confirm="handleResetConfirm"
      @cancel="showResetConfirm = false"
    />
  </section>
</template>

<style scoped>
details > summary {
  list-style: none;
}

details > summary::-webkit-details-marker {
  display: none;
}
</style>
