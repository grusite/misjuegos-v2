import {
  buildTeamPhotoStoragePath,
  deleteSessionPhotoFile,
  isAllowedPhotoMimeType,
  uploadSessionPhotoFile,
} from "@/services/storage/sessionPhotosStorage"
import { MAX_PHOTO_BYTES } from "@/services/photos/uploadPhotos"

export async function uploadTeamPhotoFile(options: {
  userId: string
  teamId: string
  file: File
  previousPath?: string | null
}): Promise<string> {
  if (!isAllowedPhotoMimeType(options.file.type)) {
    throw new Error(`Formato no permitido: ${options.file.name}`)
  }

  if (options.file.size > MAX_PHOTO_BYTES) {
    throw new Error(`La imagen supera 10 MB`)
  }

  const extension = options.file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const fileName = `${crypto.randomUUID()}.${extension}`
  const storagePath = buildTeamPhotoStoragePath(options.userId, options.teamId, fileName)

  await uploadSessionPhotoFile(storagePath, options.file, options.file.type)

  if (options.previousPath && options.previousPath !== storagePath) {
    await deleteSessionPhotoFile(options.previousPath).catch(() => undefined)
  }

  return storagePath
}

export async function removeTeamPhotoFile(photoPath: string | null | undefined) {
  if (!photoPath) return
  await deleteSessionPhotoFile(photoPath).catch(() => undefined)
}
