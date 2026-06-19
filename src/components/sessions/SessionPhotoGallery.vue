<script setup lang="ts">
import { ref } from "vue"
import { Icon } from "@iconify/vue"
import UiButton from "@/components/ui/UiButton.vue"
import type { AppPhoto } from "@/domain/types/photo"

defineProps<{
  photos: AppPhoto[]
  isLoading: boolean
  isUploading: boolean
  canWrite: boolean
  accent: "board" | "tertiary"
  emptyMessage?: string
}>()

const emit = defineEmits<{
  upload: [files: FileList]
  remove: [photoId: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  emit("upload", input.files)
  input.value = ""
}
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-bold uppercase tracking-widest text-gray-500">Fotos</h2>
      <UiButton
        v-if="canWrite"
        type="button"
        :variant="accent"
        class="px-3 py-1.5 text-xs"
        :disabled="isUploading"
        @click="openFilePicker"
      >
        {{ isUploading ? "Subiendo..." : "Añadir fotos" }}
      </UiButton>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      multiple
      class="hidden"
      @change="handleFileChange"
    />

    <p v-if="isLoading" class="text-sm text-gray-400">Cargando fotos...</p>

    <div
      v-else-if="photos.length > 0"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <figure
        v-for="photo in photos"
        :key="photo.id"
        class="group relative overflow-hidden rounded-xl border-2 border-gray-700 bg-gray-900/40"
      >
        <img
          :src="photo.publicUrl"
          :alt="photo.caption ?? 'Foto de la partida'"
          class="aspect-square w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <button
          v-if="canWrite"
          type="button"
          class="absolute right-2 top-2 rounded-full bg-dark/80 p-1.5 text-secondary opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Eliminar foto"
          @click="emit('remove', photo.id)"
        >
          <Icon icon="mdi:trash-can-outline" class="h-4 w-4" aria-hidden="true" />
        </button>
      </figure>
    </div>

    <p
      v-else
      class="rounded-xl border-2 border-dashed border-gray-700 p-4 text-center text-sm text-gray-500"
    >
      {{
        emptyMessage ??
        (canWrite
          ? "Aún no hay fotos de esta partida."
          : "Esta partida no tiene fotos.")
      }}
    </p>
  </section>
</template>
