import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"
import { createPlayerTeamsRepository } from "@/services/playerTeams/playerTeamsRepository"

type QueryChain = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function createQueryChain(): QueryChain {
  const chain = {} as QueryChain

  chain.select = vi.fn(() => chain)
  chain.insert = vi.fn(() => chain)
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.maybeSingle = vi.fn()
  chain.single = vi.fn()

  return chain
}

function createMockClient(chain: QueryChain) {
  return {
    from: vi.fn(() => chain),
  } as unknown as SupabaseClient<AppDatabase>
}

const teamRow = {
  id: "t1",
  name: "Los habituales",
  description: "Viernes",
  photo_path: null,
  created_by: "u1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  player_team_members: [
    {
      participant_id: "p1",
      participants: {
        id: "p1",
        owner_id: "u1",
        profile_id: null,
        display_name: "Ana",
        color: null,
        created_at: "2025-01-01T00:00:00Z",
        linked_profile: null,
      },
    },
  ],
}

describe("playerTeamsRepository", () => {
  let chain: QueryChain
  let repository: ReturnType<typeof createPlayerTeamsRepository>

  beforeEach(() => {
    chain = createQueryChain()
    repository = createPlayerTeamsRepository(createMockClient(chain))
  })

  it("listForOwner returns mapped teams with members", async () => {
    chain.order.mockResolvedValue({
      data: [teamRow],
      error: null,
    })

    const teams = await repository.listForOwner("u1")

    expect(teams).toHaveLength(1)
    expect(teams[0]?.name).toBe("Los habituales")
    expect(teams[0]?.members[0]?.displayName).toBe("Ana")
  })
})
