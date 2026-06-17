import { describe, expect, it } from "vitest"
import { navLinks } from "@/config/navLinks"

describe("navLinks", () => {
  it("includes all main sections from v1", () => {
    const names = navLinks.map(link => link.name)

    expect(names).toEqual([
      "Partidas",
      "Amigos",
      "Dados",
      "Ruleta",
      "Cuenta atrás",
      "Dashboard",
    ])
  })
})
