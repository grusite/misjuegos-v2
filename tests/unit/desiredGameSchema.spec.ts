import { describe, expect, it } from "vitest"
import { desiredGameFormSchema } from "@/domain/schemas/desiredGame"

describe("desiredGameFormSchema", () => {
  it("accepts a board game wishlist entry", () => {
    const parsed = desiredGameFormSchema.safeParse({
      type: "board_game",
      title: "Azul",
      priority: 2,
      bggId: 230802,
    })

    expect(parsed.success).toBe(true)
  })

  it("accepts an escape room wishlist entry", () => {
    const parsed = desiredGameFormSchema.safeParse({
      type: "escape_room",
      title: "La Mazmorra",
      city: "Madrid",
      venue: "Clue Hunter",
      bookingUrl: "https://example.com/reserva",
    })

    expect(parsed.success).toBe(true)
  })

  it("rejects an invalid booking URL", () => {
    const parsed = desiredGameFormSchema.safeParse({
      type: "escape_room",
      title: "Test",
      bookingUrl: "not-a-url",
    })

    expect(parsed.success).toBe(false)
  })
})
