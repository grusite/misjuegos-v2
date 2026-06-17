<script setup lang="ts">
import { computed, reactive, ref } from "vue"
import { useRoute } from "vue-router"
import UiButton from "@/components/ui/UiButton.vue"
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
const scoreDraft = reactive<Record<string, string>>({})

const outcomeOptions: Array<{ label: string; value: SessionOutcome }> = [
  { label: "Victoria", value: "win" },
  { label: "Derrota", value: "loss" },
  { label: "Empate", value: "draw" },
  { label: "Desconocido", value: "unknown" },
]

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
</script>

<template>
  <section class="space-y-6 pb-6">
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
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-gray-500">Temporizador</p>
            <p class="text-3xl font-bold text-primary">{{ elapsedLabel }}</p>
          </div>
          <span class="rounded-full border border-tertiary/40 px-3 py-1 text-xs uppercase text-tertiary">
            {{ Math.floor(elapsedMs / 1000) }}s
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <UiButton :disabled="!canWrite || isSaving || !session.isPaused" @click="startTimer">Iniciar</UiButton>
          <UiButton variant="secondary" :disabled="!canWrite || isSaving || session.isPaused" @click="pauseTimer">
            Pausar
          </UiButton>
          <UiButton variant="ghost" :disabled="!canWrite || isSaving" @click="resetTimer">Reset</UiButton>
        </div>
      </section>

      <section class="space-y-3 rounded-xl border-2 border-gray-700 p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Resultado</p>
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
          Actual: <span class="font-semibold capitalize">{{ session.outcome ?? "sin definir" }}</span>
        </p>
      </section>

      <section class="space-y-3 rounded-xl border-2 border-gray-700 p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Puntuaciones</p>
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
        <UiButton :disabled="!canWrite || isSaving" @click="handleSaveScores">Guardar puntuaciones</UiButton>
      </section>

      <section class="space-y-3 rounded-xl border-2 border-gray-700 p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Mensajes</p>
        <div class="max-h-52 space-y-2 overflow-y-auto pr-1">
          <article
            v-for="message in messages"
            :key="message.id"
            class="rounded-lg border border-gray-700 bg-dark/60 p-3"
          >
            <p class="text-sm text-gray-100">{{ message.content }}</p>
            <p class="mt-1 text-xs text-gray-500">{{ formatDate(message.createdAt) }}</p>
          </article>
          <p v-if="messages.length === 0" class="text-sm text-gray-500">Sin mensajes todavía.</p>
        </div>
        <div class="flex gap-2">
          <input
            v-model="messageDraft"
            type="text"
            placeholder="Escribe un mensaje..."
            class="min-w-0 flex-1 rounded-lg border-2 border-gray-600 bg-dark px-3 py-2 text-sm text-gray-100 focus:border-primary focus:outline-none"
          />
          <UiButton :disabled="isSaving || !messageDraft.trim()" @click="handleSendMessage">Enviar</UiButton>
        </div>
      </section>
    </article>
  </section>
</template>
