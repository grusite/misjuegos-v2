import type { Database } from "./database"
import type { PendingTables } from "./rows"

export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & PendingTables
    Functions: {
      find_participant_link_candidates: {
        Args: { search_name: string }
        Returns: {
          id: string
          display_name: string
          color: string | null
          session_count: number
          match_kind: string
        }[]
      }
      search_participant_link_candidates: {
        Args: { p_search: string }
        Returns: {
          id: string
          display_name: string
          color: string | null
          session_count: number
          match_kind: string
        }[]
      }
      claim_participant_link: {
        Args: { participant_id: string }
        Returns: undefined
      }
      skip_participant_link_prompt: {
        Args: Record<string, never>
        Returns: undefined
      }
      list_play_session_summaries: {
        Args: {
          p_game_catalog_id?: string | null
          p_game_type?: Database["public"]["Enums"]["game_type"] | null
          p_search?: string | null
          p_participant_ids?: string[] | null
          p_player_team_id?: string | null
          p_played_at_from?: string | null
          p_played_at_to?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: {
          id: string
          game_catalog_id: string
          played_at: string
          status: Database["public"]["Enums"]["session_status"]
          outcome: Database["public"]["Enums"]["session_outcome"] | null
          notes: string | null
          player_team_id: string | null
          game_title: string
          game_type: Database["public"]["Enums"]["game_type"]
          escape_city: string | null
          escape_venue: string | null
          escape_rating: number | null
        }[]
      }
      search_people_to_friend: {
        Args: { p_search: string }
        Returns: {
          kind: string
          profile_id: string | null
          participant_id: string | null
          display_name: string
          avatar_url: string | null
          color: string | null
          session_count: number
          already_friend: boolean
        }[]
      }
      list_my_friends: {
        Args: Record<string, never>
        Returns: {
          friendship_id: string
          status: "active" | "disabled"
          kind: string
          profile_id: string | null
          participant_id: string | null
          display_name: string
          avatar_url: string | null
          color: string | null
          session_count: number
          local_participant_id: string | null
          participant_owner_id: string | null
        }[]
      }
    }
  }
}
