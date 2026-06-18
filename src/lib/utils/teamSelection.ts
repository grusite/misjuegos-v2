import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

export function teamMemberIds(team: PlayerTeamWithMembers): string[] {
  return team.members.map(member => member.id)
}

export function sameParticipantSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false

  const leftSet = new Set(left)
  return right.every(id => leftSet.has(id))
}

export function findMatchingTeam(
  teams: PlayerTeamWithMembers[],
  participantIds: string[],
): PlayerTeamWithMembers | null {
  return (
    teams.find(team => sameParticipantSet(teamMemberIds(team), participantIds)) ?? null
  )
}

export function findMatchingTeamId(
  teams: PlayerTeamWithMembers[],
  participantIds: string[],
): string | null {
  return findMatchingTeam(teams, participantIds)?.id ?? null
}
