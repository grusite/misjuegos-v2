import type { PlayerTeamWithMembers } from "@/domain/types/playerTeam"

export function isTeamMember(team: PlayerTeamWithMembers, profileId: string): boolean {
  return team.members.some(member => member.profileId === profileId)
}

export function canWriteTeam(team: PlayerTeamWithMembers, profileId: string): boolean {
  return team.createdBy === profileId || isTeamMember(team, profileId)
}

export function canDeleteTeam(team: PlayerTeamWithMembers, profileId: string): boolean {
  return team.createdBy === profileId
}
