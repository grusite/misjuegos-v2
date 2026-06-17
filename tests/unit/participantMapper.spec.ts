import { describe, expect, it } from "vitest"
import {
  mapParticipant,
  toParticipantInsert,
} from "@/services/participants/participantMapper"

describe("participantMapper", () => {
  it("mapParticipant converts snake_case row to domain type", () => {
    const participant = mapParticipant({
      id: "p1",
      owner_id: "o1",
      profile_id: null,
      display_name: "Ana",
      color: "#ff0000",
      created_at: "2025-01-01T00:00:00Z",
    })

    expect(participant).toEqual({
      id: "p1",
      ownerId: "o1",
      profileId: null,
      displayName: "Ana",
      color: "#ff0000",
      createdAt: "2025-01-01T00:00:00Z",
    })
  })

  it("toParticipantInsert maps create input", () => {
    expect(
      toParticipantInsert("o1", {
        displayName: "Ana",
        color: "#ff0000",
      }),
    ).toEqual({
      owner_id: "o1",
      display_name: "Ana",
      color: "#ff0000",
      profile_id: null,
    })
  })
})
