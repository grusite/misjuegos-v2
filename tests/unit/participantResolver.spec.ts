import { describe, expect, it } from "vitest"
import { createParticipantResolver } from "@/services/import/participantResolver"

describe("participantResolver.ts", () => {
  const participants = [
    {
      id: "p1",
      ownerId: "owner",
      profileId: null,
      displayName: "Jorge Martin",
      color: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      aliases: [{ id: "a1", participantId: "p1", alias: "jorge", source: "import" }],
    },
    {
      id: "p2",
      ownerId: "owner",
      profileId: null,
      displayName: "Diego",
      color: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      aliases: [],
    },
  ]

  it("resolves display names and aliases", () => {
    const resolver = createParticipantResolver(participants)
    const result = resolver.resolveMany(["jorge", "Diego", "Desconocido"])

    expect(result.participantIds).toEqual(["p1", "p2"])
    expect(result.unresolved).toEqual(["Desconocido"])
  })
})
