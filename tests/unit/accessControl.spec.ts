import { describe, expect, it } from "vitest"
import { canWriteSession } from "@/lib/utils/sessionAccess"
import { canDeleteTeam, canWriteTeam } from "@/lib/utils/teamAccess"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

describe("sessionAccess", () => {
  it("allows session creator and linked participants to write", () => {
    expect(
      canWriteSession("creator-1", "creator-1", [{ profileId: "other-1" }]),
    ).toBe(true)

    expect(
      canWriteSession("creator-1", "member-1", [{ profileId: "member-1" }]),
    ).toBe(true)

    expect(
      canWriteSession("creator-1", "outsider-1", [{ profileId: "member-1" }]),
    ).toBe(false)
  })
})

describe("teamAccess", () => {
  const team: PlayerTeamWithMembers = {
    id: "team-1",
    name: "Babel 4",
    description: null,
    photoPath: null,
    photoUrl: null,
    createdBy: "creator-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: [
      {
        id: "p-1",
        ownerId: "creator-1",
        profileId: "member-1",
        displayName: "Pedro",
        color: null,
        avatarUrl: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  }

  it("allows team creator and linked members to edit", () => {
    expect(canWriteTeam(team, "creator-1")).toBe(true)
    expect(canWriteTeam(team, "member-1")).toBe(true)
    expect(canWriteTeam(team, "outsider-1")).toBe(false)
  })

  it("only allows creator to delete team", () => {
    expect(canDeleteTeam(team, "creator-1")).toBe(true)
    expect(canDeleteTeam(team, "member-1")).toBe(false)
  })
})
