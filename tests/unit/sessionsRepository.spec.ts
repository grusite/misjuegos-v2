import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"
import { createSessionsRepository } from "@/services/sessions/sessionsRepository"

function createMockClient(rpc: ReturnType<typeof vi.fn>) {
  return {
    from: vi.fn(),
    rpc,
  } as unknown as SupabaseClient<AppDatabase>
}

describe("sessionsRepository.listSummaries filters", () => {
  let rpc: ReturnType<typeof vi.fn>
  let repository: ReturnType<typeof createSessionsRepository>

  beforeEach(() => {
    rpc = vi.fn().mockResolvedValue({ data: [], error: null })
    repository = createSessionsRepository(createMockClient(rpc))
  })

  it("calls list_play_session_summaries RPC with mapped filters", async () => {
    await repository.listSummaries({
      participantIds: ["p1", "p2"],
      playerTeamId: "team-1",
      playedAtFrom: "2024-01-01T00:00:00.000Z",
      playedAtTo: "2024-12-31T23:59:59.999Z",
      search: "babel",
      gameType: "escape_room",
      limit: 26,
      offset: 0,
    })

    expect(rpc).toHaveBeenCalledWith("list_play_session_summaries", {
      p_game_catalog_id: null,
      p_game_type: "escape_room",
      p_search: "babel",
      p_participant_ids: ["p1", "p2"],
      p_player_team_id: "team-1",
      p_played_at_from: "2024-01-01T00:00:00.000Z",
      p_played_at_to: "2024-12-31T23:59:59.999Z",
      p_limit: 26,
      p_offset: 0,
    })
  })
})
