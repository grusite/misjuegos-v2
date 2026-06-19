<script setup lang="ts">
import SessionPhotoGallery from "@/components/sessions/SessionPhotoGallery.vue"
import { useDesiredGamePhotos } from "@/composables/useDesiredGamePhotos"

const props = defineProps<{
  desiredGameId: string
  accent: "board" | "tertiary"
  canWrite?: boolean
}>()

const {
  photos,
  isLoading,
  isUploading,
  errorMessage,
  uploadPhotos,
  removePhoto,
} = useDesiredGamePhotos(props.desiredGameId)
</script>

<template>
  <div class="space-y-2">
    <SessionPhotoGallery
      :photos="photos"
      :is-loading="isLoading"
      :is-uploading="isUploading"
      :can-write="canWrite ?? true"
      :accent="accent"
      empty-message="Aún no hay fotos de este deseo."
      @upload="uploadPhotos"
      @remove="removePhoto"
    />
    <p
      v-if="errorMessage"
      class="rounded-lg bg-secondary/20 p-2 text-xs text-secondary"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>
