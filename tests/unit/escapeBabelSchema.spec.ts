import { describe, expect, it } from "vitest"
import {
  parseEscaped,
  parseEscapeBabelRecords,
  parsePrice,
  parseSpanishDate,
} from "@/services/import/escapeBabelSchema"
import { parseParticipantes } from "@/services/import/parseParticipantes"

describe("escapeBabelSchema.ts", () => {
  it("parses Spanish dates", () => {
    const iso = parseSpanishDate("15/03/2024")
    expect(iso.startsWith("2024-03-15")).toBe(true)
  })

  it("parses prices with euro symbol", () => {
    expect(parsePrice("30€")).toBe(30)
    expect(parsePrice("25,50")).toBe(25.5)
  })

  it("detects escaped and failed outcomes", () => {
    expect(parseEscaped("si").outcome).toBe("escaped")
    expect(parseEscaped("no").outcome).toBe("failed")
    expect(parseEscaped("Escapamos").outcome).toBe("escaped")
    expect(parseEscaped("No escapamos").outcome).toBe("failed")
  })

  it("parses participant tokens", () => {
    expect(parseParticipantes("Jorge, Diego y Edush")).toEqual([
      "jorge",
      "diego",
      "edush",
    ])
  })

  it("maps CSV records into normalized rows", () => {
    const [row] = parseEscapeBabelRecords([
      {
        Fecha: "15/03/2024",
        Ciudad: "Madrid",
        Sitio: "The City",
        Sala: "Misión Imposible",
        Resultado: "Escapamos",
        Participantes: "Jorge, Diego",
        "N pistas": "2",
        Tiempo: "45/60",
        Precio: "25",
      },
    ])

    expect(row.sala).toBe("Misión Imposible")
    expect(row.cluesUsed).toBe(2)
    expect(row.timeSeconds).toBe(45 * 60)
    expect(row.price).toBe(25)
    expect(row.participantTokens).toEqual(["jorge", "diego"])
    expect(row.outcome).toBe("escaped")
  })
})
