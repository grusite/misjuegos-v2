import { onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { AppPhoto } from "@/domain/types/photo"
import { getDbErrorMessage } from "@/services/errors"
import { photosRepository } from "@/services/photos/photosRepository"
import {
  buildDesiredGamePhotoStoragePath,
  deleteSessionPhotoFile,
  isAllowedPhotoMimeType,
  uploadSessionPhotoFile,
} from "@/services/storage/sessionPhotosStorage"

const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export function useDesiredGamePhotos(desiredGameId: string) {
  const authStore = useAuthStore()
  const photos = ref<AppPhoto[]>([])
  const isLoading = ref(false)
  const isUploading = ref(false)
  const errorMessage = ref<string | null>(null)
  const hasLoaded = ref(false)

  async function load(force = false) {
    if (!desiredGameId) return
    if (!force && hasLoaded.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      photos.value = await photosRepository.listForDesiredGame(desiredGameId)
      hasLoaded.value = true
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function uploadPhotos(files: FileList | File[]) {
    const profile = authStore.profile
    if (!profile || !desiredGameId) return

    const fileList = Array.from(files)
    if (fileList.length === 0) return

    isUploading.value = true
    errorMessage.value = null

    try {
      const nextSortOrder =
        photos.value.reduce((max, photo) => Math.max(max, photo.sortOrder), -1) + 1

      for (const [index, file] of fileList.entries()) {
        if (!isAllowedPhotoMimeType(file.type)) {
          throw new Error(`Formato no permitido: ${file.name}`)
        }

        if (file.size > MAX_PHOTO_BYTES) {
          throw new Error(`La foto «${file.name}» supera 10 MB`)
        }

        const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const fileName = `${crypto.randomUUID()}.${extension}`
        const storagePath = buildDesiredGamePhotoStoragePath(
          profile.id,
          desiredGameId,
          fileName,
        )

        await uploadSessionPhotoFile(storagePath, file, file.type)

        try {
          const created = await photosRepository.create({
            desiredGameId,
            storagePath,
            createdBy: profile.id,
            sortOrder: nextSortOrder + index,
          })
          photos.value = [...photos.value, created]
        } catch (error) {
          await deleteSessionPhotoFile(storagePath).catch(() => undefined)
          throw error
        }
      }
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : getDbErrorMessage(error)
    } finally {
      isUploading.value = false
    }
  }

  async function removePhoto(photoId: string) {
    const photo = photos.value.find(item => item.id === photoId)
    if (!photo) return

    errorMessage.value = null

    try {
      await photosRepository.delete(photoId)
      await deleteSessionPhotoFile(photo.storagePath)
      photos.value = photos.value.filter(item => item.id !== photoId)
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    photos,
    isLoading,
    isUploading,
    errorMessage,
    load,
    uploadPhotos,
    removePhoto,
  }
}
