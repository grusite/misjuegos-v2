import { describe, expect, it } from "vitest"
import { navLinks } from "@/config/navLinks"

describe("navLinks", () => {
  it("keeps v1 sections grouped by main and tools", () => {
    const mainNames = navLinks
      .filter(link => (link.section ?? "main") === "main")
      .map(link => link.name)
    const toolNames = navLinks
      .filter(link => link.section === "tools")
      .map(link => link.name)

    expect(mainNames).toEqual([
      "Partidas",
      "Quiero jugar",
      "Amigos",
      "Equipos",
      "Fotos",
      "Dashboard",
    ])

    expect(toolNames).toEqual([
      "Dados",
      "Ruleta",
      "Cuenta atrás",
    ])
  })
})
