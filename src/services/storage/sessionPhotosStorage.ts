import { supabase } from "@/lib/supabaseClient"

export const SESSION_PHOTOS_BUCKET = "session-photos"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export function isAllowedPhotoMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType)
}

export function buildSessionPhotoStoragePath(
  userId: string,
  sessionId: string,
  fileName: string,
): string {
  return `${userId}/${sessionId}/${fileName}`
}

export function buildLibraryPhotoStoragePath(userId: string, fileName: string): string {
  return `${userId}/library/${fileName}`
}

export function buildTeamPhotoStoragePath(
  userId: string,
  teamId: string,
  fileName: string,
): string {
  return `${userId}/teams/${teamId}/${fileName}`
}

export function buildDesiredGamePhotoStoragePath(
  userId: string,
  desiredGameId: string,
  fileName: string,
): string {
  return `${userId}/desired/${desiredGameId}/${fileName}`
}

export function getSessionPhotoPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(SESSION_PHOTOS_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export async function uploadSessionPhotoFile(
  storagePath: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(SESSION_PHOTOS_BUCKET).upload(storagePath, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType,
  })

  if (error) throw error
}

export async function deleteSessionPhotoFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SESSION_PHOTOS_BUCKET)
    .remove([storagePath])

  if (error) throw error
}
