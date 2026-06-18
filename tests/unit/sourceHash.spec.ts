import { describe, expect, it } from "vitest"
import {
  buildEscapeCatalogExternalId,
  buildEscapeSessionSourceHash,
} from "@/services/import/sourceHash"
import type { ParsedEscapeBabelRow } from "@/services/import/escapeBabelSchema"

describe("sourceHash.ts", () => {
  it("builds stable catalog and session hashes", () => {
    const row = {
      playedAt: "2024-03-15T12:00:00.000Z",
      ciudad: "Madrid",
      sitio: "The City",
      sala: "Misión Imposible",
      participantTokens: ["diego", "jorge"],
    } as ParsedEscapeBabelRow

    const catalogId = buildEscapeCatalogExternalId("Madrid", "The City", "Misión Imposible")
    const hashA = buildEscapeSessionSourceHash(row)
    const hashB = buildEscapeSessionSourceHash({
      ...row,
      participantTokens: ["jorge", "diego"],
    })

    expect(catalogId).toMatch(/^escape-babel:catalog:[0-9a-f]{8}$/)
    expect(hashA).toBe(hashB)
  })
})
