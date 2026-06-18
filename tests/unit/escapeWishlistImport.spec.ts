import { describe, expect, it } from "vitest"
import {
  buildWishlistSourceHash,
  parseBarcelonaWishlistLine,
  splitCompanyTitle,
  titleFromBookingUrl,
} from "@/services/import/parseEscapeWishlist"
import { parseWishlistCsvRecords } from "@/services/import/escapeWishlistSchema"

describe("parseEscapeWishlist.ts", () => {
  it("splits company and room title", () => {
    expect(splitCompanyTitle("the cubick - la entrevista")).toEqual({
      company: "the cubick",
      title: "la entrevista",
    })
  })

  it("derives title from booking URL", () => {
    expect(titleFromBookingUrl("https://www.goldencelebraciones.com/hostal-psiquiatrico")).toBe(
      "Hostal Psiquiatrico",
    )
  })

  it("parses Barcelona ranked lines", () => {
    expect(
      parseBarcelonaWishlistLine(
        "3. 5) CyberCity 2049 - Escape Barcelona (Santa Coloma de Gramenet - Barcelona)",
      ),
    ).toEqual({
      title: "CyberCity 2049",
      company: "Escape Barcelona",
      city: "Barcelona",
      venue: "Santa Coloma de Gramenet",
    })
  })

  it("builds stable source hashes", () => {
    const hash = buildWishlistSourceHash({
      title: "La Casa",
      company: "Insomnia Corporation",
      city: "Barcelona",
    })

    expect(hash.startsWith("escape-wishlist:")).toBe(true)
    expect(hash).toBe(
      buildWishlistSourceHash({
        title: "La Casa",
        company: "Insomnia Corporation",
        city: "Barcelona",
      }),
    )
  })
})

describe("escapeWishlistSchema.ts", () => {
  it("parses wishlist CSV rows", () => {
    const [row] = parseWishlistCsvRecords([
      {
        title: "La entrevista",
        company: "The Cubick",
        city: "Madrid",
        booking_url: "",
        notes: "",
      },
    ])

    expect(row.title).toBe("La entrevista")
    expect(row.company).toBe("The Cubick")
    expect(row.city).toBe("Madrid")
  })
})
