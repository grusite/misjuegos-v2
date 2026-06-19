import { computed, onMounted, ref } from "vue"
import { useAuthStore } from "@/stores/authStore"
import type { AppPhoto } from "@/domain/types/photo"
import { getDbErrorMessage } from "@/services/errors"
import { photosRepository } from "@/services/photos/photosRepository"
import {
  type PhotoUploadTarget,
  uploadPhotoFiles,
} from "@/services/photos/uploadPhotos"
import { deleteSessionPhotoFile } from "@/services/storage/sessionPhotosStorage"

const MEDIA_PAGE_SIZE = 36

export type MediaFilter = "all" | "unassigned" | "linked"

export function useMediaLibrary() {
  const authStore = useAuthStore()
  const photos = ref<AppPhoto[]>([])
  const filter = ref<MediaFilter>("all")
  const isLoading = ref(false)
  const isLoadingMore = ref(false)
  const isUploading = ref(false)
  const hasMore = ref(false)
  const errorMessage = ref<string | null>(null)
  const offset = ref(0)

  const canUpload = computed(() => Boolean(authStore.profile))

  async function load(options?: { append?: boolean; force?: boolean }) {
    const append = options?.append ?? false
    const force = options?.force ?? false

    if (!append && !force && photos.value.length > 0) return

    if (append) {
      isLoadingMore.value = true
    } else {
      isLoading.value = true
      offset.value = 0
    }
    errorMessage.value = null

    try {
      const pageOffset = append ? offset.value : 0

      const listOptions = {
        limit: MEDIA_PAGE_SIZE + 1,
        offset: pageOffset,
        unassignedOnly: filter.value === "unassigned",
        assignedOnly: filter.value === "linked",
      }

      const page = await photosRepository.list(listOptions)
      hasMore.value = page.length > MEDIA_PAGE_SIZE
      const items = hasMore.value ? page.slice(0, MEDIA_PAGE_SIZE) : page

      photos.value = append ? [...photos.value, ...items] : items
      offset.value = pageOffset + items.length
    } catch (error) {
      errorMessage.value = getDbErrorMessage(error)
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value || isLoading.value) return
    await load({ append: true })
  }

  async function setFilter(next: MediaFilter) {
    if (filter.value === next) return
    filter.value = next
    photos.value = []
    await load({ force: true })
  }

  async function uploadPhotos(
    files: FileList | File[],
    target: PhotoUploadTarget = { kind: "library" },
  ) {
    const profile = authStore.profile
    if (!profile) return

    const fileList = Array.from(files)
    if (fileList.length === 0) return

    isUploading.value = true
    errorMessage.value = null

    try {
      const created = await uploadPhotoFiles({
        userId: profile.id,
        files: fileList,
        target,
      })

      const shouldShow =
        filter.value === "all" ||
        (filter.value === "unassigned" && target.kind === "library") ||
        (filter.value === "linked" && target.kind !== "library")

      if (shouldShow) {
        photos.value = [...created, ...photos.value]
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

  function applyLinkedPhoto(updated: AppPhoto) {
    const index = photos.value.findIndex(item => item.id === updated.id)

    if (filter.value === "unassigned" && (updated.sessionId || updated.desiredGameId)) {
      if (index >= 0) photos.value = photos.value.filter(item => item.id !== updated.id)
      return
    }

    if (filter.value === "linked" && !updated.sessionId && !updated.desiredGameId) {
      if (index >= 0) photos.value = photos.value.filter(item => item.id !== updated.id)
      return
    }

    if (index >= 0) {
      photos.value = photos.value.map(item => (item.id === updated.id ? updated : item))
    }
  }

  onMounted(() => {
    void load({ force: true })
  })

  return {
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
  }
}
