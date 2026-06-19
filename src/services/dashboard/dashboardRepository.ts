import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { DashboardStats } from "@/domain/types/dashboard"
import type { AppDatabase } from "@/domain/types/schema"
import type { SessionOutcome } from "@/domain/types/rows"
import { unwrap } from "@/services/errors"
import {
  buildDashboardStats,
  type DashboardEscapeRow,
  type DashboardMemberRow,
  type DashboardSessionRow,
} from "@/services/dashboard/dashboardStats"

const SESSION_SELECT = `
  id,
  played_at,
  status,
  outcome,
  duration_ms,
  catalog:game_catalog!play_sessions_game_catalog_id_fkey (
    title,
    type
  )
`

const MEMBER_SELECT = `
  session_id,
  participant_id,
  profile_id,
  participant:participants (
    display_name
  ),
  profile:profiles!session_participants_profile_id_fkey (
    display_name
  )
`

type SessionQueryRow = {
  id: string
  played_at: string
  status: string
  outcome: SessionOutcome | null
  duration_ms: number
  catalog: { title: string; type: "board_game" | "escape_room" } | null
}

type MemberQueryRow = {
  session_id: string
  participant_id: string | null
  profile_id: string | null
  participant: { display_name: string } | null
  profile: { display_name: string } | null
}

export function createDashboardRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async getStats(profileId: string): Promise<DashboardStats> {
      const [profilesResult, participantsResult, sessionsResult, membersResult, escapesResult] =
        await Promise.all([
          client.from("profiles").select("id", { count: "exact", head: true }),
          client.from("participants").select("id", { count: "exact", head: true }),
          client.from("play_sessions").select(SESSION_SELECT),
          client.from("session_participants").select(MEMBER_SELECT),
          client.from("escape_session_details").select("session_id, escaped, clues_used, rating"),
        ])

      if (profilesResult.error) throw profilesResult.error
      if (participantsResult.error) throw participantsResult.error

      const sessions = unwrap(sessionsResult).map(mapSessionRow)
      const members = unwrap(membersResult).map(mapMemberRow)
      const escapes = unwrap(escapesResult).map(mapEscapeRow)

      return buildDashboardStats({
        profileId,
        totalProfiles: profilesResult.count ?? 0,
        totalParticipants: participantsResult.count ?? 0,
        sessions,
        members,
        escapes,
      })
    },
  }
}

function mapSessionRow(row: SessionQueryRow): DashboardSessionRow {
  return {
    id: row.id,
    playedAt: row.played_at,
    status: row.status,
    outcome: row.outcome,
    durationMs: row.duration_ms,
    gameType: row.catalog?.type ?? "board_game",
    gameTitle: row.catalog?.title ?? "Juego",
  }
}

function mapMemberRow(row: MemberQueryRow): DashboardMemberRow {
  if (row.profile_id) {
    return {
      sessionId: row.session_id,
      memberKey: `profile:${row.profile_id}`,
      displayName: row.profile?.display_name ?? "Jugador",
    }
  }

  return {
    sessionId: row.session_id,
    memberKey: `participant:${row.participant_id ?? row.session_id}`,
    displayName: row.participant?.display_name ?? "Participante",
  }
}

function mapEscapeRow(row: {
  session_id: string
  escaped: boolean | null
  clues_used: number | null
  rating: number | null
}): DashboardEscapeRow {
  return {
    sessionId: row.session_id,
    escaped: row.escaped,
    cluesUsed: row.clues_used,
    rating: row.rating,
  }
}

export const dashboardRepository = createDashboardRepository(supabase)
