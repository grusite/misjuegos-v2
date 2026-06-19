export type PhotoSource = "upload" | "google_drive" | "import"

export type AppPhoto = {
  id: string
  sessionId: string | null
  desiredGameId: string | null
  storagePath: string
  publicUrl: string
  source: PhotoSource
  sourceFileId: string | null
  caption: string | null
  sortOrder: number
  createdBy: string
  createdAt: string
}

/** @deprecated Use AppPhoto — kept for session-scoped gallery call sites */
export type SessionPhoto = AppPhoto

export type CreatePhotoInput = {
  sessionId?: string | null
  desiredGameId?: string | null
  storagePath: string
  createdBy: string
  source?: PhotoSource
  sourceFileId?: string | null
  caption?: string | null
  sortOrder?: number
}

export type ListPhotosOptions = {
  sessionId?: string
  desiredGameId?: string
  unassignedOnly?: boolean
  assignedOnly?: boolean
  limit?: number
  offset?: number
}

export type LinkPhotoInput = {
  sessionId?: string | null
  desiredGameId?: string | null
}
