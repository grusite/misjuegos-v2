<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Icon } from "@iconify/vue"
import SessionPickerPanel from "@/components/media/SessionPickerPanel.vue"
import UiButton from "@/components/ui/UiButton.vue"

export type PhotoUploadDestination = "library" | "session"

const props = defineProps<{
  open: boolean
  files: File[]
  isUploading?: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  close: []
  confirm: [destination: PhotoUploadDestination, sessionId: string | null]
}>()

const destination = ref<PhotoUploadDestination>("library")
const selectedSessionId = ref<string | null>(null)

const previewUrls = computed(() =>
  props.files.map(file => URL.createObjectURL(file)),
)

const canConfirm = computed(() => {
  if (destination.value === "library") return props.files.length > 0
  return Boolean(selectedSessionId.value)
})

function handleConfirm() {
  emit(
    "confirm",
    destination.value,
    destination.value === "session" ? selectedSessionId.value : null,
  )
}

function resetState() {
  destination.value = "library"
  selectedSessionId.value = null
}

watch(
  () => props.open,
  open => {
    if (open) resetState()
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && files.length > 0"
      class="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-upload-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        :disabled="isUploading"
        @click="emit('close')"
      />

      <div
        class="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl border-4 border-primary bg-dark p-4 sm:rounded-2xl"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <h2 id="photo-upload-title" class="text-lg font-bold text-primary">
              ¿Dónde guardar {{ files.length === 1 ? "la foto" : "las fotos" }}?
            </h2>
            <p class="text-sm text-gray-400">
              Elige si van a la biblioteca o a una partida concreta.
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-full p-2 text-gray-400 hover:text-primary disabled:opacity-50"
            aria-label="Cerrar"
            :disabled="isUploading"
            @click="emit('close')"
          >
            <Icon icon="mdi:close" class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
          <img
            v-for="(url, index) in previewUrls"
            :key="index"
            :src="url"
            alt=""
            class="h-16 w-16 shrink-0 rounded-lg border border-gray-700 object-cover"
          />
        </div>

        <div class="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="rounded-xl border-2 p-3 text-left transition-colors disabled:opacity-50"
            :class="
              destination === 'library'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-700 text-gray-300'
            "
            :disabled="isUploading"
            @click="destination = 'library'"
          >
            <Icon icon="mdi:image-album" class="mb-1 h-5 w-5" aria-hidden="true" />
            <p class="text-sm font-semibold">Biblioteca</p>
            <p class="text-xs text-gray-500">Sin enlace por ahora</p>
          </button>
          <button
            type="button"
            class="rounded-xl border-2 p-3 text-left transition-colors disabled:opacity-50"
            :class="
              destination === 'session'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-700 text-gray-300'
            "
            :disabled="isUploading"
            @click="destination = 'session'"
          >
            <Icon icon="mdi:cards" class="mb-1 h-5 w-5" aria-hidden="true" />
            <p class="text-sm font-semibold">Partida</p>
            <p class="text-xs text-gray-500">Galería de la sesión</p>
          </button>
        </div>

        <SessionPickerPanel
          v-if="destination === 'session'"
          class="mb-4"
          :disabled="isUploading"
          :selected-session-id="selectedSessionId"
          @select="selectedSessionId = $event"
        />

        <p
          v-if="errorMessage"
          class="mb-3 rounded-lg bg-secondary/20 p-3 text-sm text-secondary"
        >
          {{ errorMessage }}
        </p>

        <div class="flex gap-2">
          <UiButton
            type="button"
            variant="ghost"
            class="flex-1"
            :disabled="isUploading"
            @click="emit('close')"
          >
            Cancelar
          </UiButton>
          <UiButton
            type="button"
            class="flex-1"
            :disabled="isUploading || !canConfirm"
            @click="handleConfirm"
          >
            {{ isUploading ? "Subiendo..." : "Subir" }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
