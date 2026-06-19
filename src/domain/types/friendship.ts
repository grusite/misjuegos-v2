export type FriendshipStatus = "active" | "disabled"

export type Friendship = {
  id: string
  ownerId: string
  friendProfileId: string | null
  friendParticipantId: string | null
  status: FriendshipStatus
  createdAt: string
  updatedAt: string
}

export type FriendListItem = {
  friendshipId: string
  status: FriendshipStatus
  kind: "profile" | "participant"
  profileId: string | null
  participantId: string | null
  displayName: string
  avatarUrl: string | null
  color: string | null
  sessionCount: number
  localParticipantId: string | null
  participantOwnerId: string | null
}

export type PeopleSearchResult = {
  kind: "profile" | "participant"
  profileId: string | null
  participantId: string | null
  displayName: string
  avatarUrl: string | null
  color: string | null
  sessionCount: number
  alreadyFriend: boolean
}

export type AddProfileFriendInput = {
  friendProfileId: string
  displayName: string
  avatarUrl?: string | null
}

export type AddParticipantFriendInput = {
  friendParticipantId: string
  displayName: string
  color?: string | null
}
