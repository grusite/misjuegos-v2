import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"
import { createDesiredGamesRepository } from "@/services/desiredGames/desiredGamesRepository"

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

const desiredGameRow = {
  id: "d1",
  type: "escape_room" as const,
  title: "La Mazmorra",
  notes: "Reservar en finde",
  priority: 3,
  city: "Madrid",
  venue: "Clue Hunter",
  company: null,
  booking_url: "https://example.com",
  bgg_id: null,
  game_catalog_id: null,
  status: "active" as const,
  created_by: "u1",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
}

describe("desiredGamesRepository", () => {
  let chain: QueryChain
  let repository: ReturnType<typeof createDesiredGamesRepository>

  beforeEach(() => {
    chain = createQueryChain()
    repository = createDesiredGamesRepository(createMockClient(chain))
  })

  it("list returns mapped desired games", async () => {
    chain.order
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({
        data: [desiredGameRow],
        error: null,
      })

    const items = await repository.list()

    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe("La Mazmorra")
    expect(items[0]?.bookingUrl).toBe("https://example.com")
  })

  it("create inserts and maps a desired game", async () => {
    chain.single.mockResolvedValue({
      data: desiredGameRow,
      error: null,
    })

    const created = await repository.create("u1", {
      type: "escape_room",
      title: "La Mazmorra",
      city: "Madrid",
      venue: "Clue Hunter",
      bookingUrl: "https://example.com",
    })

    expect(created.city).toBe("Madrid")
    expect(chain.insert).toHaveBeenCalled()
  })
})
