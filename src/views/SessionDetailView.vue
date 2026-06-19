<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import UiButton from "@/components/ui/UiButton.vue"
import UiConfirmDialog from "@/components/ui/UiConfirmDialog.vue"
import BoardOutcomePicker from "@/components/sessions/BoardOutcomePicker.vue"
import SessionMembersEditor from "@/components/sessions/SessionMembersEditor.vue"
import SessionMessageItem from "@/components/sessions/SessionMessageItem.vue"
import MessageComposer from "@/components/sessions/MessageComposer.vue"
import SessionTimerControls from "@/components/sessions/SessionTimerControls.vue"
import EscapeSessionDetailsPanel from "@/components/sessions/EscapeSessionDetailsPanel.vue"
import SessionPhotoGallery from "@/components/sessions/SessionPhotoGallery.vue"
import { useSessionDetail } from "@/composables/useSessionDetail"
import { useSessionPhotos } from "@/composables/useSessionPhotos"
import { boardOutcomeLabelClass } from "@/lib/utils/outcomeStyles"
import type { SessionOutcome } from "@/domain/types/rows"
import type { SessionScoreInput } from "@/domain/types/session"
import { appDataCache } from "@/services/cache/memoryCache"
import { useAuthStore } from "@/stores/authStore"

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sessionId = String(route.params.id ?? "")

const {
  session,
  gameTitle,
  escapeRoom,
  escapeDetails,
  isEscapeSession,
  members,
  participants,
  playerTeams,
  selfParticipantId,
  messages,
  scores,
  isLoading,
  isSaving,
  errorMessage,
  elapsedLabel,
  elapsedMs,
  canWrite,
  canManageMessage,
  startTimer,
  pauseTimer,
  resetTimer,
  saveBoardOutcome,
  addMessage,
  updateMessage,
  deleteMessage,
  deleteSession,
  saveScores,
  saveEscapeDetails,
  saveMembers,
  createFriendParticipant,
} = useSessionDetail(sessionId)

const {
  photos,
  isLoading: isPhotosLoading,
  isUploading: isPhotosUploading,
  errorMessage: photosErrorMessage,
  uploadPhotos,
  removePhoto,
} = useSessionPhotos(sessionId)

const messageDraft = ref("")
const showResetConfirm = ref(false)
const showDeleteSessionConfirm = ref(false)
const showDeleteMessageConfirm = ref(false)
const pendingMessageId = ref<string | null>(null)
const showMessagesSheet = ref(false)
const scoreDraft = reactive<Record<string, string>>({})
const draftOutcome = ref<SessionOutcome>("unknown")

const outcomeLabels: Record<SessionOutcome, string> = {
  win: "Victoria",
  loss: "Derrota",
  draw: "Empate",
  unknown: "Sin definir",
  escaped: "Escapasteis",
  failed: "No escapasteis",
}

const draftOutcomeLabelClass = computed(() => boardOutcomeLabelClass(draftOutcome.value))

const sessionAccent = computed(() => (isEscapeSession.value ? "tertiary" : "board"))

watch(
  () => session.value?.id,
  () => {
    draftOutcome.value = session.value?.outcome ?? "unknown"
  },
  { immediate: true },
)

const isPlaying = computed(
  () => !isEscapeSession.value && session.value?.status === "in_progress",
)
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

async function handleSaveOutcome() {
  await saveBoardOutcome(draftOutcome.value)
}

async function handleSaveScores() {
  await saveScores(buildScorePayload())
}

async function handleSendMessage(files: File[] = []) {
  await addMessage(messageDraft.value, files)
  messageDraft.value = ""
}

async function handleResetConfirm() {
  await resetTimer()
  showResetConfirm.value = false
}

function requestDeleteMessage(messageId: string) {
  pendingMessageId.value = messageId
  showDeleteMessageConfirm.value = true
}

async function handleDeleteMessageConfirm() {
  if (!pendingMessageId.value) return

  await deleteMessage(pendingMessageId.value)
  pendingMessageId.value = null
  showDeleteMessageConfirm.value = false
}

async function handleDeleteSessionConfirm() {
  const deleted = await deleteSession()
  if (!deleted) return

  const profileId = authStore.profile?.id
  if (profileId) {
    appDataCache.invalidate(`sessions:${profileId}`)
  }

  showDeleteSessionConfirm.value = false
  await router.push({ name: "sessions" })
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

    <article
      v-if="session && !isLoading"
      class="space-y-5 rounded-2xl border-4 p-4 sm:p-5"
      :class="isEscapeSession ? 'border-tertiary/40' : 'border-board/40'"
    >
      <header class="space-y-1">
        <p
          class="text-sm uppercase tracking-widest"
          :class="isEscapeSession ? 'text-tertiary' : 'text-board'"
        >
          {{ isEscapeSession ? "Escape room" : "Juego de mesa" }}
        </p>
        <h1
          class="text-2xl font-bold sm:text-3xl"
          :class="isEscapeSession ? 'text-tertiary' : 'text-board'"
        >
          {{ gameTitle }}
        </h1>
        <p class="text-sm text-gray-400">{{ formatDate(session.playedAt) }}</p>
      </header>

      <SessionMembersEditor
        :members="members"
        :participants="participants"
        :teams="playerTeams"
        :player-team-id="session.playerTeamId"
        :self-participant-id="selfParticipantId"
        :accent="sessionAccent"
        :can-write="Boolean(canWrite)"
        :is-saving="isSaving"
        :create-participant="createFriendParticipant"
        :apply-selection="saveMembers"
      />

      <SessionPhotoGallery
        :photos="photos"
        :is-loading="isPhotosLoading"
        :is-uploading="isPhotosUploading"
        :can-write="Boolean(canWrite)"
        :accent="sessionAccent"
        @upload="uploadPhotos"
        @remove="removePhoto"
      />

      <p
        v-if="photosErrorMessage"
        class="rounded-lg bg-secondary/20 p-3 text-sm text-secondary"
      >
        {{ photosErrorMessage }}
      </p>

      <EscapeSessionDetailsPanel
        v-if="isEscapeSession"
        :session-id="sessionId"
        :escape-room="escapeRoom"
        :details="escapeDetails"
        :can-write="Boolean(canWrite)"
        :is-saving="isSaving"
        @save="saveEscapeDetails"
      />

      <template v-if="!isEscapeSession">
      <section class="space-y-3 rounded-xl border-2 border-gray-700 p-4">
        <div class="flex w-full items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-xs uppercase tracking-wide text-gray-500">Temporizador</p>
            <p class="text-3xl font-bold tabular-nums text-board">{{ elapsedLabel }}</p>
          </div>
          <span class="shrink-0 rounded-full border border-board/40 px-3 py-1 text-xs tabular-nums uppercase text-board">
            {{ elapsedSeconds }}s
          </span>
        </div>
        <SessionTimerControls
          :is-paused="isTimerPaused"
          :can-write="Boolean(canWrite)"
          :is-saving="isSaving"
          @start="startTimer"
          @pause="pauseTimer"
          @reset="showResetConfirm = true"
        />
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
            :photos="message.photos"
            :can-manage="canManageMessage(message)"
            :is-saving="isSaving"
            compact
            @save="updateMessage(message.id, $event)"
            @delete="requestDeleteMessage(message.id)"
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
          <BoardOutcomePicker
            v-model="draftOutcome"
            :disabled="!canWrite || isSaving"
          />
          <p class="text-sm text-gray-300">
            Resultado:
            <span class="font-semibold" :class="draftOutcomeLabelClass">
              {{ outcomeLabels[draftOutcome] }}
            </span>
          </p>
          <p class="text-xs text-gray-500">Se guarda al pulsar «Guardar resultado».</p>
          <div class="flex justify-end">
            <UiButton
              variant="board"
              size="compact"
              :disabled="!canWrite || isSaving"
              @click="handleSaveOutcome"
            >
              {{ isSaving ? "Guardando..." : "Guardar resultado" }}
            </UiButton>
          </div>
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
                class="w-24 rounded-lg border-2 border-gray-600 bg-dark px-2 py-1 text-right text-sm text-gray-100 focus:border-board focus:outline-none"
              />
            </label>
          </div>
          <div class="flex justify-end">
            <UiButton
              variant="board"
              size="compact"
              :disabled="!canWrite || isSaving"
              @click="handleSaveScores"
            >
              Guardar puntuaciones
            </UiButton>
          </div>
        </div>
      </details>
      </template>

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
            :photos="message.photos"
            :can-manage="canManageMessage(message)"
            :is-saving="isSaving"
            @save="updateMessage(message.id, $event)"
            @delete="requestDeleteMessage(message.id)"
          />
          <p v-if="messages.length === 0" class="text-sm text-gray-500">Sin mensajes todavía.</p>
        </div>
        <MessageComposer
          v-model="messageDraft"
          :disabled="isSaving"
          placeholder="Escribe un mensaje o adjunta una foto..."
          @send="handleSendMessage"
        />
      </section>

      <section
        v-if="canWrite"
        class="rounded-xl border-2 border-dashed border-secondary/50 p-4"
      >
        <p class="text-sm font-semibold text-secondary">Zona de peligro</p>
        <p class="mt-1 text-xs text-gray-500">
          Elimina esta partida y todos sus mensajes, puntuaciones y datos asociados.
        </p>
        <UiButton
          type="button"
          variant="secondary"
          class="mt-3"
          :disabled="isSaving"
          @click="showDeleteSessionConfirm = true"
        >
          Eliminar partida
        </UiButton>
      </section>
    </article>

    <div
      v-if="isPlaying"
      class="fixed inset-x-0 bottom-0 z-20 border-t-2 border-gray-700 bg-dark/95 p-4 backdrop-blur-sm"
    >
      <div class="mx-auto max-w-lg">
        <MessageComposer
          v-model="messageDraft"
          :disabled="isSaving"
          compact
          placeholder="Mensaje rápido..."
          @send="handleSendMessage"
        />
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

        <div class="relative mx-auto max-h-[80dvh] w-full max-w-lg rounded-t-2xl border-4 border-board bg-dark p-4">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 class="text-lg font-bold text-board">Chat de partida</h2>
            <button
              type="button"
              class="rounded-full p-2 text-gray-400 hover:text-board"
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
              :photos="message.photos"
              :can-manage="canManageMessage(message)"
              :is-saving="isSaving"
              @save="updateMessage(message.id, $event)"
              @delete="requestDeleteMessage(message.id)"
            />
            <p v-if="messages.length === 0" class="text-sm text-gray-500">Sin mensajes todavía.</p>
          </div>

          <MessageComposer
            v-model="messageDraft"
            :disabled="isSaving"
            placeholder="Escribe un mensaje o adjunta una foto..."
            @send="handleSendMessage"
          />
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

    <UiConfirmDialog
      :open="showDeleteMessageConfirm"
      title="¿Eliminar mensaje?"
      message="Este mensaje se borrará de la partida. No se puede deshacer."
      confirm-label="Eliminar"
      @confirm="handleDeleteMessageConfirm"
      @cancel="
        () => {
          showDeleteMessageConfirm = false
          pendingMessageId = null
        }
      "
    />

    <UiConfirmDialog
      :open="showDeleteSessionConfirm"
      title="¿Eliminar partida?"
      message="Se borrarán mensajes, puntuaciones y detalles de esta sesión. Esta acción no se puede deshacer."
      confirm-label="Eliminar partida"
      @confirm="handleDeleteSessionConfirm"
      @cancel="showDeleteSessionConfirm = false"
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
