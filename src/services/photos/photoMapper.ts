import type { AppPhoto, CreatePhotoInput, PhotoSource } from "@/domain/types/photo"
import type { PhotoRow } from "@/domain/types/rows"
import { getSessionPhotoPublicUrl } from "@/services/storage/sessionPhotosStorage"

export function mapAppPhoto(row: PhotoRow): AppPhoto {
  return {
    id: row.id,
    sessionId: row.session_id,
    desiredGameId: row.desired_game_id,
    storagePath: row.storage_path,
    publicUrl: getSessionPhotoPublicUrl(row.storage_path),
    source: row.source as PhotoSource,
    sourceFileId: row.source_file_id,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export function toPhotoInsert(input: CreatePhotoInput) {
  return {
    session_id: input.sessionId ?? null,
    desired_game_id: input.desiredGameId ?? null,
    storage_path: input.storagePath,
    created_by: input.createdBy,
    source: input.source ?? "upload",
    source_file_id: input.sourceFileId ?? null,
    caption: input.caption ?? null,
    sort_order: input.sortOrder ?? 0,
  }
}
