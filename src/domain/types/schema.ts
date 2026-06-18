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
      claim_participant_link: {
        Args: { participant_id: string }
        Returns: undefined
      }
      skip_participant_link_prompt: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
  }
}
