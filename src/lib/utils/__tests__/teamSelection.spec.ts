import { describe, expect, it } from "vitest"
import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"
import {
  findMatchingTeam,
  findMatchingTeamId,
  sameParticipantSet,
  teamMemberIds,
} from "@/lib/utils/teamSelection"

function buildTeam(
  id: string,
  name: string,
  memberIds: string[],
): PlayerTeamWithMembers {
  return {
    id,
    name,
    description: null,
    photoPath: null,
    createdBy: "owner-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    members: memberIds.map(memberId => ({
      id: memberId,
      ownerId: "owner-1",
      profileId: null,
      displayName: memberId,
      color: null,
      avatarUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    })),
  }
}

describe("teamSelection", () => {
  const teams = [
    buildTeam("team-a", "Babel 4", ["p1", "p2", "p3"]),
    buildTeam("team-b", "Duo", ["p4", "p5"]),
  ]

  it("returns member ids for a team", () => {
    expect(teamMemberIds(teams[0])).toEqual(["p1", "p2", "p3"])
  })

  it("compares participant sets regardless of order", () => {
    expect(sameParticipantSet(["p1", "p2"], ["p2", "p1"])).toBe(true)
    expect(sameParticipantSet(["p1", "p2"], ["p1", "p2", "p3"])).toBe(false)
  })

  it("finds a matching team by participant ids", () => {
    expect(findMatchingTeam(teams, ["p2", "p1", "p3"])).toEqual(teams[0])
    expect(findMatchingTeamId(teams, ["p5", "p4"])).toBe("team-b")
    expect(findMatchingTeam(teams, ["p1"])).toBeNull()
  })
})
