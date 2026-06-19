import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  AddParticipantFriendInput,
  AddProfileFriendInput,
  FriendListItem,
  Friendship,
  PeopleSearchResult,
} from "@/domain/types/friendship"
import type { AppDatabase } from "@/domain/types/schema"
import { fromPostgrestError, unwrap, unwrapNullable } from "@/services/errors"
import {
  mapFriendListItem,
  mapFriendship,
  toFriendshipInsert,
} from "@/services/friendships/friendshipMapper"
import { getAvatarColor } from "@/lib/utils/avatarColor"
import { participantsRepository } from "@/services/participants/participantsRepository"

type SearchRow = {
  kind: string
  profile_id: string | null
  participant_id: string | null
  display_name: string
  avatar_url: string | null
  color: string | null
  session_count: number
  already_friend: boolean
}

export function createFriendshipsRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async searchPeople(query: string): Promise<PeopleSearchResult[]> {
      const { data, error } = await client.rpc("search_people_to_friend", {
        p_search: query.trim(),
      })

      if (error) throw fromPostgrestError(error)

      return ((data as SearchRow[]) ?? []).map(row => ({
        kind: row.kind === "profile" ? "profile" : "participant",
        profileId: row.profile_id,
        participantId: row.participant_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        color: row.color,
        sessionCount: Number(row.session_count),
        alreadyFriend: row.already_friend,
      }))
    },

    async listFriends(): Promise<FriendListItem[]> {
      const { data, error } = await client.rpc("list_my_friends")

      if (error) throw fromPostgrestError(error)

      return ((data as Parameters<typeof mapFriendListItem>[0][]) ?? []).map(
        mapFriendListItem,
      )
    },

    async addProfileFriend(
      ownerId: string,
      input: AddProfileFriendInput,
    ): Promise<Friendship> {
      const existingActive = await this.findFriendship({
        ownerId,
        friendProfileId: input.friendProfileId,
        status: "active",
      })

      if (existingActive) return existingActive

      const existingParticipant = await participantsRepository.findByProfileId(
        ownerId,
        input.friendProfileId,
      )

      if (!existingParticipant) {
        await participantsRepository.create(ownerId, {
          displayName: input.displayName,
          profileId: input.friendProfileId,
          color: getAvatarColor(input.displayName),
        })
      }

      const disabled = await this.findFriendship({
        ownerId,
        friendProfileId: input.friendProfileId,
        status: "disabled",
      })

      if (disabled) {
        return this.reactivate(disabled.id)
      }

      const result = await client
        .from("friendships")
        .insert(
          toFriendshipInsert(ownerId, {
            friendProfileId: input.friendProfileId,
          }),
        )
        .select("*")
        .single()

      return mapFriendship(unwrap(result))
    },

    async addParticipantFriend(
      ownerId: string,
      input: AddParticipantFriendInput,
    ): Promise<Friendship> {
      const existingActive = await this.findFriendship({
        ownerId,
        friendParticipantId: input.friendParticipantId,
        status: "active",
      })

      if (existingActive) return existingActive

      const ghost = await participantsRepository.getById(input.friendParticipantId)
      if (!ghost || ghost.profileId) {
        throw new Error("Este jugador ya tiene cuenta vinculada")
      }

      const disabled = await this.findFriendship({
        ownerId,
        friendParticipantId: input.friendParticipantId,
        status: "disabled",
      })

      if (disabled) {
        return this.reactivate(disabled.id)
      }

      const result = await client
        .from("friendships")
        .insert(
          toFriendshipInsert(ownerId, {
            friendParticipantId: input.friendParticipantId,
          }),
        )
        .select("*")
        .single()

      return mapFriendship(unwrap(result))
    },

    async createGhostFriend(
      ownerId: string,
      displayName: string,
    ): Promise<{ friendship: Friendship; participantId: string }> {
      const participant = await participantsRepository.create(ownerId, {
        displayName,
        color: getAvatarColor(displayName),
      })

      const friendship = await this.addParticipantFriend(ownerId, {
        friendParticipantId: participant.id,
        displayName,
        color: participant.color,
      })

      return { friendship, participantId: participant.id }
    },

    async disable(friendshipId: string): Promise<void> {
      const { error } = await client
        .from("friendships")
        .update({ status: "disabled" })
        .eq("id", friendshipId)

      if (error) throw fromPostgrestError(error)
    },

    async reactivate(friendshipId: string): Promise<Friendship> {
      const result = await client
        .from("friendships")
        .update({ status: "active" })
        .eq("id", friendshipId)
        .select("*")
        .single()

      return mapFriendship(unwrap(result))
    },

    async findFriendship(options: {
      ownerId: string
      friendProfileId?: string
      friendParticipantId?: string
      status?: "active" | "disabled"
    }): Promise<Friendship | null> {
      let query = client.from("friendships").select("*").eq("owner_id", options.ownerId)

      if (options.status) {
        query = query.eq("status", options.status)
      }

      if (options.friendProfileId) {
        query = query.eq("friend_profile_id", options.friendProfileId)
      }

      if (options.friendParticipantId) {
        query = query.eq("friend_participant_id", options.friendParticipantId)
      }

      const row = unwrapNullable(await query.maybeSingle())
      return row ? mapFriendship(row) : null
    },

    async listPickerParticipants(ownerId: string) {
      const own = await participantsRepository.listForOwner(ownerId)
      const merged = new Map(own.map(participant => [participant.id, participant]))
      const friends = await this.listFriends()

      for (const friend of friends) {
        if (friend.localParticipantId && !merged.has(friend.localParticipantId)) {
          const participant = await participantsRepository.getById(
            friend.localParticipantId,
          )
          if (participant) merged.set(participant.id, participant)
        }

        if (friend.participantId && !merged.has(friend.participantId)) {
          const participant = await participantsRepository.getById(friend.participantId)
          if (participant) merged.set(participant.id, participant)
        }
      }

      return Array.from(merged.values()).sort((left, right) =>
        left.displayName.localeCompare(right.displayName, "es"),
      )
    },
  }
}

export const friendshipsRepository = createFriendshipsRepository(supabase)
