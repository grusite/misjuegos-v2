import { describe, expect, it } from "vitest"
import { playerTeamFormSchema } from "@/domain/schemas/playerTeam"

describe("playerTeamFormSchema", () => {
  it("accepts a valid team form", () => {
    const parsed = playerTeamFormSchema.safeParse({
      name: "Los habituales",
      description: "Grupo de viernes",
      participantIds: ["550e8400-e29b-41d4-a716-446655440000"],
    })

    expect(parsed.success).toBe(true)
  })

  it("rejects a team without members", () => {
    const parsed = playerTeamFormSchema.safeParse({
      name: "Vacío",
      participantIds: [],
    })

    expect(parsed.success).toBe(false)
  })
})
