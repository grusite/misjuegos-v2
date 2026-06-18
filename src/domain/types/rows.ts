import type { Database } from "./database"
import type { Json } from "./database"

export type GameType = Database["public"]["Enums"]["game_type"]
export type SessionStatus = Database["public"]["Enums"]["session_status"]
export type SessionOutcome = Database["public"]["Enums"]["session_outcome"]

export type ParticipantRow = {
  id: string
  owner_id: string
  profile_id: string | null
  display_name: string
  color: string | null
  created_at: string
}

export type ParticipantInsert = {
  id?: string
  owner_id: string
  profile_id?: string | null
  display_name: string
  color?: string | null
  created_at?: string
}

export type ParticipantUpdate = {
  owner_id?: string
  profile_id?: string | null
  display_name?: string
  color?: string | null
  created_at?: string
}

export type ParticipantAliasRow = {
  id: string
  participant_id: string
  alias: string
  source: string | null
}

export type ParticipantAliasInsert = {
  id?: string
  participant_id: string
  alias: string
  source?: string | null
}

export type GameCatalogRow = {
  id: string
  type: GameType
  title: string
  slug: string | null
  created_by: string
  created_at: string
  source: string | null
  source_external_id: string | null
}

export type GameCatalogInsert = {
  id?: string
  type: GameType
  title: string
  slug?: string | null
  created_by: string
  created_at?: string
  source?: string | null
  source_external_id?: string | null
}

export type BoardGameDetailsRow = {
  game_catalog_id: string
  bgg_id: number | null
  expansion_of_id: string | null
  min_players: number | null
  max_players: number | null
  playing_time_min: number | null
  thumbnail_url: string | null
  year_published: number | null
  raw_bgg: Json | null
}

export type BoardGameDetailsInsert = {
  game_catalog_id: string
  bgg_id?: number | null
  expansion_of_id?: string | null
  min_players?: number | null
  max_players?: number | null
  playing_time_min?: number | null
  thumbnail_url?: string | null
  year_published?: number | null
  raw_bgg?: Json | null
}

export type EscapeRoomDetailsRow = {
  game_catalog_id: string
  city: string | null
  venue: string | null
  room_name: string | null
  company: string | null
}

export type EscapeRoomDetailsInsert = {
  game_catalog_id: string
  city?: string | null
  venue?: string | null
  room_name?: string | null
  company?: string | null
}

export type PlaySessionRow = {
  id: string
  game_catalog_id: string
  created_by: string
  player_team_id: string | null
  played_at: string
  status: SessionStatus
  outcome: SessionOutcome | null
  duration_ms: number
  is_paused: boolean
  last_started_at: string | null
  ended_at: string | null
  notes: string | null
  source: string | null
  source_hash: string | null
  source_raw: Json | null
  created_at: string
  updated_at: string
}

export type PlaySessionInsert = {
  id?: string
  game_catalog_id: string
  created_by: string
  player_team_id?: string | null
  played_at: string
  status?: SessionStatus
  outcome?: SessionOutcome | null
  duration_ms?: number
  is_paused?: boolean
  last_started_at?: string | null
  ended_at?: string | null
  notes?: string | null
  source?: string | null
  source_hash?: string | null
  source_raw?: Json | null
  created_at?: string
  updated_at?: string
}

export type PlaySessionUpdate = {
  game_catalog_id?: string
  created_by?: string
  player_team_id?: string | null
  played_at?: string
  status?: SessionStatus
  outcome?: SessionOutcome | null
  duration_ms?: number
  is_paused?: boolean
  last_started_at?: string | null
  ended_at?: string | null
  notes?: string | null
  source?: string | null
  source_hash?: string | null
  source_raw?: Json | null
  created_at?: string
  updated_at?: string
}

export type SessionParticipantRow = {
  id: string
  session_id: string
  profile_id: string | null
  participant_id: string | null
}

export type SessionParticipantInsert = {
  id?: string
  session_id: string
  profile_id?: string | null
  participant_id?: string | null
}

/** Tables not yet in generated `database.ts`. */
export type PendingTables = Record<string, never>
