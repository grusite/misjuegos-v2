import { describe, expect, it } from "vitest"
import {
  defaultSelectedParticipantIds,
  sortParticipantsWithSelfFirst,
} from "@/services/participants/participantBootstrap"
import type { Participant } from "@/domain/types/participant"

describe("participantBootstrap", () => {
  const participants: Participant[] = [
    {
      id: "p-edush",
      ownerId: "owner-1",
      profileId: null,
      displayName: "Edush",
      color: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "p-jorge",
      ownerId: "owner-1",
      profileId: "profile-jorge",
      displayName: "Jorge",
      color: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]

  it("sortParticipantsWithSelfFirst puts the logged-in profile first", () => {
    const sorted = sortParticipantsWithSelfFirst(participants, "profile-jorge")

    expect(sorted[0]?.id).toBe("p-jorge")
  })

  it("defaultSelectedParticipantIds prefers the self participant", () => {
    expect(defaultSelectedParticipantIds(participants, "profile-jorge")).toEqual(["p-jorge"])
  })
})
