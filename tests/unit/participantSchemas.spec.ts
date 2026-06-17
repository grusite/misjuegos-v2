import { describe, expect, it } from "vitest"
import {
  participantAliasFormSchema,
  participantFormSchema,
} from "@/domain/schemas/participant"
import { normalizeAlias } from "@/domain/normalizeAlias"

describe("participant schemas", () => {
  it("participantFormSchema requires displayName", () => {
    const result = participantFormSchema.safeParse({ displayName: "" })

    expect(result.success).toBe(false)
  })

  it("participantFormSchema accepts valid name", () => {
    const result = participantFormSchema.safeParse({
      displayName: "  Ana  ",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayName).toBe("Ana")
    }
  })

  it("participantAliasFormSchema trims alias", () => {
    const result = participantAliasFormSchema.safeParse({ alias: "  José  " })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.alias).toBe("José")
    }
  })
})

describe("normalizeAlias", () => {
  it("normalizes accents for alias preview", () => {
    expect(normalizeAlias("José")).toBe("jose")
  })
})
