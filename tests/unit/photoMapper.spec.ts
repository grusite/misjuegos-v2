import { describe, expect, it } from "vitest"
import { mapAppPhoto, toPhotoInsert } from "@/services/photos/photoMapper"
import {
  buildDesiredGamePhotoStoragePath,
  buildLibraryPhotoStoragePath,
  buildSessionPhotoStoragePath,
} from "@/services/storage/sessionPhotosStorage"

describe("sessionPhotosStorage", () => {
  it("builds session, library and desired-game storage paths under the user folder", () => {
    expect(buildSessionPhotoStoragePath("u1", "s1", "a.jpg")).toBe("u1/s1/a.jpg")
    expect(buildLibraryPhotoStoragePath("u1", "b.jpg")).toBe("u1/library/b.jpg")
    expect(buildDesiredGamePhotoStoragePath("u1", "d1", "c.jpg")).toBe(
      "u1/desired/d1/c.jpg",
    )
  })
})

describe("photoMapper", () => {
  const row = {
    id: "p1",
    session_id: "s1",
    desired_game_id: null,
    message_id: null,
    storage_path: "u1/s1/a.jpg",
    source: "upload",
    source_file_id: null,
    caption: null,
    sort_order: 0,
    created_by: "u1",
    created_at: "2025-01-01T00:00:00Z",
  } as const

  it("maps database rows to AppPhoto", () => {
    const photo = mapAppPhoto(row)

    expect(photo.id).toBe("p1")
    expect(photo.sessionId).toBe("s1")
    expect(photo.desiredGameId).toBeNull()
    expect(photo.messageId).toBeNull()
    expect(photo.storagePath).toBe("u1/s1/a.jpg")
    expect(photo.publicUrl).toContain("u1/s1/a.jpg")
  })

  it("serializes create input for sessions and desired games", () => {
    expect(
      toPhotoInsert({
        sessionId: "s1",
        storagePath: "u1/s1/a.jpg",
        createdBy: "u1",
      }),
    ).toEqual({
      session_id: "s1",
      desired_game_id: null,
      message_id: null,
      storage_path: "u1/s1/a.jpg",
      created_by: "u1",
      source: "upload",
      source_file_id: null,
      caption: null,
      sort_order: 0,
    })

    expect(
      toPhotoInsert({
        desiredGameId: "d1",
        storagePath: "u1/desired/d1/a.jpg",
        createdBy: "u1",
        sortOrder: 2,
      }),
    ).toMatchObject({
      session_id: null,
      desired_game_id: "d1",
      sort_order: 2,
    })
  })
})
