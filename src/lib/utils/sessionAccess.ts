export type SessionMemberAccess = {
  profileId: string | null
}

export function canWriteSession(
  sessionCreatedBy: string,
  profileId: string,
  members: SessionMemberAccess[],
): boolean {
  if (sessionCreatedBy === profileId) return true
  return members.some(member => member.profileId === profileId)
}
