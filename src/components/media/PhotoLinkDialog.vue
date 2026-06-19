<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { Icon } from "@iconify/vue"
import SessionPickerPanel from "@/components/media/SessionPickerPanel.vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { AppPhoto } from "@/domain/types/photo"
import { getDbErrorMessage } from "@/services/errors"
import { photosRepository } from "@/services/photos/photosRepository"

const props = defineProps<{
  open: boolean
  photo: AppPhoto | null
}>()

const emit = defineEmits<{
  close: []
  linked: [photo: AppPhoto]
}>()

const selectedSessionId = ref<string | null>(null)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)

const isLinked = computed(
  () => Boolean(props.photo?.sessionId || props.photo?.desiredGameId),
)

watch(
  () => [props.open, props.photo?.sessionId] as const,
  ([open, sessionId]) => {
    if (!open) return

    selectedSessionId.value = sessionId ?? null
    errorMessage.value = null
  },
)

async function linkToSession() {
  if (!props.photo || !selectedSessionId.value) return

  isSaving.value = true
  errorMessage.value = null

  try {
    const updated = await photosRepository.link(props.photo.id, {
      sessionId: selectedSessionId.value,
    })
    emit("linked", updated)
    emit("close")
  } catch (error) {
    errorMessage.value = getDbErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}

async function unlinkPhoto() {
  if (!props.photo) return

  isSaving.value = true
  errorMessage.value = null

  try {
    const updated = await photosRepository.unlink(props.photo.id)
    emit("linked", updated)
    emit("close")
  } catch (error) {
    errorMessage.value = getDbErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && photo"
      class="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-link-title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-black/70"
        aria-label="Cerrar"
        @click="emit('close')"
      />

      <div
        class="relative flex max-h-[85dvh] w-full max-w-lg flex-col rounded-t-2xl border-4 border-primary bg-dark p-4 sm:rounded-2xl"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="min-w-0 space-y-1">
            <h2 id="photo-link-title" class="text-lg font-bold text-primary">
              Enlazar foto
            </h2>
            <p class="text-sm text-gray-400">
              Elige la partida a la que pertenece esta imagen.
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-full p-2 text-gray-400 hover:text-primary"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <Icon icon="mdi:close" class="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <SessionPickerPanel
          class="min-h-0 flex-1"
          :disabled="isSaving"
          :selected-session-id="selectedSessionId"
          @select="selectedSessionId = $event"
        />

        <p v-if="errorMessage" class="my-3 rounded-lg bg-secondary/20 p-3 text-sm text-secondary">
          {{ errorMessage }}
        </p>

        <div class="mt-4 flex gap-2">
          <UiButton
            v-if="isLinked"
            type="button"
            variant="ghost"
            class="flex-1 border-2 border-gray-600 text-gray-300"
            :disabled="isSaving"
            @click="unlinkPhoto"
          >
            Quitar enlace
          </UiButton>
          <UiButton
            type="button"
            class="flex-1"
            :disabled="isSaving || !selectedSessionId"
            @click="linkToSession"
          >
            {{ isSaving ? "Guardando..." : "Enlazar" }}
          </UiButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
