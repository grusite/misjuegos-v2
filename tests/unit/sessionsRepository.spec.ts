import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"
import { createSessionsRepository } from "@/services/sessions/sessionsRepository"

type QueryChain = {
  select: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
}

function createQueryChain(): QueryChain & PromiseLike<{ data: []; error: null }> {
  const response = { data: [] as [], error: null }
  const chain = {} as QueryChain & PromiseLike<{ data: []; error: null }>

  chain.select = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.gte = vi.fn(() => chain)
  chain.lte = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.or = vi.fn(() => chain)
  chain.range = vi.fn(() => chain)
  chain.then = (onFulfilled) =>
    Promise.resolve(response).then(onFulfilled as (value: typeof response) => unknown)

  return chain
}

function createMockClient(chain: QueryChain) {
  return {
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient<AppDatabase>
}

describe("sessionsRepository.listSummaries filters", () => {
  let chain: QueryChain
  let repository: ReturnType<typeof createSessionsRepository>

  beforeEach(() => {
    chain = createQueryChain()
    repository = createSessionsRepository(createMockClient(chain))
  })

  it("applies participant, team, date and search filters", async () => {
    await repository.listSummaries({
      participantIds: ["p1", "p2"],
      playerTeamId: "team-1",
      playedAtFrom: "2024-01-01T00:00:00.000Z",
      playedAtTo: "2024-12-31T23:59:59.999Z",
      search: "babel",
      gameType: "escape_room",
    })

    expect(chain.select).toHaveBeenCalledWith(
      expect.stringContaining("session_participants!inner"),
    )
    expect(chain.select).toHaveBeenCalledWith(
      expect.stringContaining("game_catalog!inner"),
    )
    expect(chain.eq).toHaveBeenCalledWith("game_catalog.type", "escape_room")
    expect(chain.in).toHaveBeenCalledWith("session_participants.participant_id", [
      "p1",
      "p2",
    ])
    expect(chain.eq).toHaveBeenCalledWith("player_team_id", "team-1")
    expect(chain.gte).toHaveBeenCalledWith("played_at", "2024-01-01T00:00:00.000Z")
    expect(chain.lte).toHaveBeenCalledWith("played_at", "2024-12-31T23:59:59.999Z")
    expect(chain.or).toHaveBeenCalledWith(
      'game_catalog.title.ilike."%babel%",game_catalog.escape_room_details.city.ilike."%babel%",game_catalog.escape_room_details.venue.ilike."%babel%"',
    )
  })
})
