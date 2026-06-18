import { describe, expect, it } from "vitest"
import { parseBoardGameRecords } from "@/services/import/boardGamesSchema"

describe("boardGamesSchema.ts", () => {
  it("expands rows into session outcomes with default date and babel team", () => {
    const [row] = parseBoardGameRecords([
      {
        Juego: "Arkham",
        "Veces jugadas": "4",
        "Ratio (éxito/fracaso)": "2 perdidas 2 ganadas",
        Jugadores: "",
      },
    ])

    expect(row.playCount).toBe(4)
    expect(row.outcomes).toEqual(["loss", "loss", "win", "win"])
    expect(row.playedAt.startsWith("2023-04-20")).toBe(true)
    expect(row.participantTokens).toEqual(["babel 4"])
  })

  it("uses provided date and jugadores", () => {
    const [row] = parseBoardGameRecords([
      {
        Juego: "Zombicide",
        Fecha: "22/06/2022",
        "Veces jugadas": "2",
        "Ratio (éxito/fracaso)": "1 perdida 1 ganada",
        Jugadores: "Elena Damian Diegas",
      },
    ])

    expect(row.playedAt.startsWith("2022-06-22")).toBe(true)
    expect(row.participantTokens).toEqual(["elena", "damian", "diegas"])
    expect(row.outcomes).toEqual(["loss", "win"])
  })
})
