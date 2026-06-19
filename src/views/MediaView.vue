<script setup lang="ts">
import { ref } from "vue"
import { Icon } from "@iconify/vue"
import PhotoLinkDialog from "@/components/media/PhotoLinkDialog.vue"
import PhotoUploadDialog from "@/components/media/PhotoUploadDialog.vue"
import UiButton from "@/components/ui/UiButton.vue"
import UiConfirmDialog from "@/components/ui/UiConfirmDialog.vue"
import type { AppPhoto } from "@/domain/types/photo"
import {
  useMediaLibrary,
  type MediaFilter,
} from "@/composables/useMediaLibrary"

const {
  photos,
  filter,
  isLoading,
  isLoadingMore,
  isUploading,
  hasMore,
  canUpload,
  errorMessage,
  loadMore,
  setFilter,
  uploadPhotos,
  removePhoto,
  applyLinkedPhoto,
} = useMediaLibrary()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedPhotoUrl = ref<string | null>(null)
const linkPhoto = ref<AppPhoto | null>(null)
const showLinkDialog = ref(false)
const showUploadDialog = ref(false)
const pendingUploadFiles = ref<File[]>([])
const showDeleteConfirm = ref(false)
const pendingDeletePhotoId = ref<string | null>(null)

const filterOptions: Array<{ value: MediaFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "unassigned", label: "Sin enlace" },
  { value: "linked", label: "Enlazadas" },
]

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  pendingUploadFiles.value = Array.from(input.files)
  showUploadDialog.value = true
  input.value = ""
}

async function handleUploadConfirm(
  destination: "library" | "session",
  sessionId: string | null,
) {
  const files = pendingUploadFiles.value
  if (files.length === 0) return

  const target =
    destination === "session" && sessionId
      ? { kind: "session" as const, sessionId }
      : { kind: "library" as const }

  await uploadPhotos(files, target)
  pendingUploadFiles.value = []
  showUploadDialog.value = false
}

function closeUploadDialog() {
  if (isUploading.value) return
  showUploadDialog.value = false
  pendingUploadFiles.value = []
}

function filterChipClasses(value: MediaFilter): string {
  return filter.value === value
    ? "border-primary bg-primary/20 text-primary"
    : "border-gray-700 text-gray-400 hover:border-gray-500"
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(isoDate))
}

function openLinkDialog(photo: AppPhoto) {
  linkPhoto.value = photo
  showLinkDialog.value = true
}

function closeLinkDialog() {
  showLinkDialog.value = false
  linkPhoto.value = null
}

function handlePhotoLinked(updated: AppPhoto) {
  applyLinkedPhoto(updated)
}

function requestDeletePhoto(photoId: string) {
  pendingDeletePhotoId.value = photoId
  showDeleteConfirm.value = true
}

async function handleDeleteConfirm() {
  if (!pendingDeletePhotoId.value) return

  await removePhoto(pendingDeletePhotoId.value)
  pendingDeletePhotoId.value = null
  showDeleteConfirm.value = false
}

function cancelDeletePhoto() {
  showDeleteConfirm.value = false
  pendingDeletePhotoId.value = null
}
</script>

<template>
  <section class="space-y-6 pb-10">
    <div class="space-y-2">
      <p class="text-sm uppercase tracking-widest text-gray-500">Biblioteca</p>
      <h1 class="text-3xl font-bold text-primary">Fotos</h1>
      <p class="text-gray-400">
        Al subir, elige si van a la biblioteca o a una partida. También puedes enlazarlas después.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors"
        :class="filterChipClasses(option.value)"
        @click="setFilter(option.value)"
      >
        {{ option.label }}
      </button>

      <UiButton
        v-if="canUpload"
        type="button"
        variant="primary"
        class="ml-auto px-3 py-1.5 text-sm"
        :disabled="isUploading"
        @click="openFilePicker"
      >
        {{ isUploading ? "Subiendo..." : "Subir fotos" }}
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

    <p v-if="errorMessage" class="rounded-lg bg-secondary/20 p-4 text-secondary">
      {{ errorMessage }}
    </p>

    <p v-if="isLoading" class="text-gray-400">Cargando fotos...</p>

    <div
      v-else-if="photos.length > 0"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <figure
        v-for="photo in photos"
        :key="photo.id"
        class="group relative overflow-hidden rounded-xl border-2 border-gray-700 bg-gray-900/40"
      >
        <button
          type="button"
          class="block w-full"
          @click="selectedPhotoUrl = photo.publicUrl"
        >
          <img
            :src="photo.publicUrl"
            :alt="photo.caption ?? photo.sourceFileId ?? 'Foto'"
            class="aspect-square w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </button>

        <div class="space-y-2 p-2 text-xs text-gray-400">
          <p>{{ formatDate(photo.createdAt) }}</p>
          <RouterLink
            v-if="photo.sessionId"
            :to="{ name: 'session-detail', params: { id: photo.sessionId } }"
            class="inline-flex items-center gap-1 font-semibold text-board hover:underline"
          >
            Ver partida
          </RouterLink>
          <RouterLink
            v-else-if="photo.desiredGameId"
            :to="{ name: 'wishlist' }"
            class="inline-flex items-center gap-1 font-semibold text-tertiary hover:underline"
          >
            En lista de deseos
          </RouterLink>
          <p v-else class="text-primary">Sin enlace</p>

          <button
            v-if="canUpload"
            type="button"
            class="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-600 px-2 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-primary hover:text-primary"
            @click="openLinkDialog(photo)"
          >
            <Icon icon="mdi:link-variant" class="h-4 w-4" aria-hidden="true" />
            {{ photo.sessionId || photo.desiredGameId ? "Cambiar enlace" : "Enlazar partida" }}
          </button>
        </div>

        <button
          v-if="canUpload"
          type="button"
          class="absolute right-2 top-2 rounded-full bg-dark/90 p-1.5 text-secondary sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
          aria-label="Eliminar foto"
          @click="requestDeletePhoto(photo.id)"
        >
          <Icon icon="mdi:trash-can-outline" class="h-4 w-4" aria-hidden="true" />
        </button>
      </figure>
    </div>

    <p
      v-else
      class="rounded-xl border-4 border-dashed border-gray-700 p-6 text-center text-gray-500"
    >
      No hay fotos con este filtro.
    </p>

    <button
      v-if="!isLoading && hasMore"
      type="button"
      class="w-full rounded-xl border-2 border-dashed border-gray-600 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      :disabled="isLoadingMore"
      @click="loadMore"
    >
      {{ isLoadingMore ? "Cargando más..." : "Cargar más fotos" }}
    </button>

    <PhotoUploadDialog
      :open="showUploadDialog"
      :files="pendingUploadFiles"
      :is-uploading="isUploading"
      :error-message="errorMessage"
      @close="closeUploadDialog"
      @confirm="handleUploadConfirm"
    />

    <PhotoLinkDialog
      :open="showLinkDialog"
      :photo="linkPhoto"
      @close="closeLinkDialog"
      @linked="handlePhotoLinked"
    />

    <UiConfirmDialog
      :open="showDeleteConfirm"
      title="Eliminar foto"
      message="La imagen se borrará de la biblioteca y del almacenamiento. No se puede deshacer."
      confirm-label="Eliminar"
      @confirm="handleDeleteConfirm"
      @cancel="cancelDeletePhoto"
    />

    <Teleport to="body">
      <div
        v-if="selectedPhotoUrl"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
        role="dialog"
        aria-modal="true"
        @click="selectedPhotoUrl = null"
      >
        <img
          :src="selectedPhotoUrl"
          alt="Vista ampliada"
          class="max-h-[90vh] max-w-full rounded-lg object-contain"
          @click.stop
        />
        <button
          type="button"
          class="absolute right-4 top-4 rounded-full bg-dark/80 p-2 text-white"
          aria-label="Cerrar"
          @click="selectedPhotoUrl = null"
        >
          <Icon icon="mdi:close" class="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </Teleport>
  </section>
</template>
