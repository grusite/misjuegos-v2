import type {
  Friendship,
  FriendshipStatus,
  FriendListItem,
} from "@/domain/types/friendship"
import type { Database } from "@/domain/types/database"

type FriendshipRow = {
  id: string
  owner_id: string
  friend_profile_id: string | null
  friend_participant_id: string | null
  status: Database["public"]["Enums"]["friendship_status"]
  created_at: string
  updated_at: string
}

type FriendListRow = {
  friendship_id: string
  status: Database["public"]["Enums"]["friendship_status"]
  kind: string
  profile_id: string | null
  participant_id: string | null
  display_name: string
  avatar_url: string | null
  color: string | null
  session_count: number
  local_participant_id: string | null
  participant_owner_id: string | null
}

export function mapFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    ownerId: row.owner_id,
    friendProfileId: row.friend_profile_id,
    friendParticipantId: row.friend_participant_id,
    status: row.status as FriendshipStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapFriendListItem(row: FriendListRow): FriendListItem {
  return {
    friendshipId: row.friendship_id,
    status: row.status as FriendshipStatus,
    kind: row.kind === "profile" ? "profile" : "participant",
    profileId: row.profile_id,
    participantId: row.participant_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    color: row.color,
    sessionCount: Number(row.session_count),
    localParticipantId: row.local_participant_id,
    participantOwnerId: row.participant_owner_id,
  }
}

export function toFriendshipInsert(
  ownerId: string,
  input: {
    friendProfileId?: string | null
    friendParticipantId?: string | null
    status?: FriendshipStatus
  },
) {
  return {
    owner_id: ownerId,
    friend_profile_id: input.friendProfileId ?? null,
    friend_participant_id: input.friendParticipantId ?? null,
    status: input.status ?? "active",
  }
}
