import { describe, expect, it } from "vitest"
import { csvRowsToRecords, parseCsv } from "@/services/import/parseCsv"

describe("parseCsv.ts", () => {
  it("parses quoted fields with commas", () => {
    const rows = parseCsv(`name,players\n"Azul","Jorge, Diego"`)

    expect(rows).toEqual([
      ["name", "players"],
      ["Azul", "Jorge, Diego"],
    ])
  })

  it("maps rows to header records", () => {
    const records = csvRowsToRecords([
      ["Fecha", "Sala"],
      ["15/03/2024", "Misión Imposible"],
    ])

    expect(records).toEqual([
      { Fecha: "15/03/2024", Sala: "Misión Imposible" },
    ])
  })
})
