import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"
import { createParticipantsRepository } from "@/services/participants/participantsRepository"

type QueryChain = {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
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
  chain.ilike = vi.fn(() => chain)
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

const participantRow = {
  id: "p1",
  owner_id: "o1",
  profile_id: null,
  display_name: "Ana",
  color: null,
  created_at: "2025-01-01T00:00:00Z",
}

describe("participantsRepository", () => {
  let chain: QueryChain
  let repository: ReturnType<typeof createParticipantsRepository>

  beforeEach(() => {
    chain = createQueryChain()
    repository = createParticipantsRepository(createMockClient(chain))
  })

  it("listForOwner returns mapped participants", async () => {
    chain.order.mockResolvedValue({
      data: [participantRow],
      error: null,
    })

    const participants = await repository.listForOwner("o1")

    expect(participants).toHaveLength(1)
    expect(participants[0]?.displayName).toBe("Ana")
    expect(chain.eq).toHaveBeenCalledWith("owner_id", "o1")
  })

  it("getById returns null when not found", async () => {
    chain.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "not found", code: "PGRST116", details: null, hint: null },
    })

    const participant = await repository.getById("missing")

    expect(participant).toBeNull()
  })

  it("create inserts and returns a participant", async () => {
    chain.single.mockResolvedValue({
      data: participantRow,
      error: null,
    })

    const participant = await repository.create("o1", {
      displayName: "Ana",
    })

    expect(participant.id).toBe("p1")
    expect(chain.insert).toHaveBeenCalledWith({
      owner_id: "o1",
      display_name: "Ana",
      color: null,
      profile_id: null,
    })
  })

  it("remove deletes by id", async () => {
    chain.eq.mockResolvedValue({
      data: null,
      error: null,
    })

    await repository.remove("p1")

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith("id", "p1")
  })
})
