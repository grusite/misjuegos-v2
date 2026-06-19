import type { AppPhoto, CreatePhotoInput } from "@/domain/types/photo"
import { photosRepository } from "@/services/photos/photosRepository"
import {
  buildDesiredGamePhotoStoragePath,
  buildLibraryPhotoStoragePath,
  buildSessionPhotoStoragePath,
  deleteSessionPhotoFile,
  isAllowedPhotoMimeType,
  uploadSessionPhotoFile,
} from "@/services/storage/sessionPhotosStorage"

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

export type PhotoUploadTarget =
  | { kind: "library" }
  | { kind: "session"; sessionId: string }
  | { kind: "message"; sessionId: string; messageId: string }
  | { kind: "desired"; desiredGameId: string }

function buildStoragePath(
  userId: string,
  fileName: string,
  target: PhotoUploadTarget,
): string {
  switch (target.kind) {
    case "library":
      return buildLibraryPhotoStoragePath(userId, fileName)
    case "session":
    case "message":
      return buildSessionPhotoStoragePath(userId, target.sessionId, fileName)
    case "desired":
      return buildDesiredGamePhotoStoragePath(userId, target.desiredGameId, fileName)
  }
}

function toCreateInput(
  storagePath: string,
  createdBy: string,
  target: PhotoUploadTarget,
  sortOrder: number,
): CreatePhotoInput {
  const base = { storagePath, createdBy, sortOrder }

  switch (target.kind) {
    case "library":
      return base
    case "session":
      return { ...base, sessionId: target.sessionId }
    case "message":
      return {
        ...base,
        sessionId: target.sessionId,
        messageId: target.messageId,
      }
    case "desired":
      return { ...base, desiredGameId: target.desiredGameId }
  }
}

function validateFile(file: File) {
  if (!isAllowedPhotoMimeType(file.type)) {
    throw new Error(`Formato no permitido: ${file.name}`)
  }

  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`La foto «${file.name}» supera 10 MB`)
  }
}

export async function uploadPhotoFiles(options: {
  userId: string
  files: FileList | File[]
  target: PhotoUploadTarget
  sortOrderStart?: number
}): Promise<AppPhoto[]> {
  const fileList = Array.from(options.files)
  if (fileList.length === 0) return []

  const created: AppPhoto[] = []
  let sortOrder = options.sortOrderStart ?? 0

  for (const file of fileList) {
    validateFile(file)

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const fileName = `${crypto.randomUUID()}.${extension}`
    const storagePath = buildStoragePath(options.userId, fileName, options.target)

    await uploadSessionPhotoFile(storagePath, file, file.type)

    try {
      const photo = await photosRepository.create(
        toCreateInput(storagePath, options.userId, options.target, sortOrder),
      )
      created.push(photo)
      sortOrder += 1
    } catch (error) {
      await deleteSessionPhotoFile(storagePath).catch(() => undefined)
      throw error
    }
  }

  return created
}
