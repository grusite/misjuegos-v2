import { describe, expect, it } from "vitest"
import {
  ESCAPE_BABEL_FRIEND_CATALOG,
  findFriendCatalogEntry,
  getFriendDisplayName,
  resolveFriendKey,
} from "@/services/import/escapeBabelFriendCatalog"

describe("escapeBabelFriendCatalog.ts", () => {
  it("merges edu/eduardo/edush aliases", () => {
    expect(resolveFriendKey("edu")).toBe("eduardo")
    expect(resolveFriendKey("eduardo")).toBe("eduardo")
    expect(resolveFriendKey("edush")).toBe("eduardo")
    expect(getFriendDisplayName("eduardo")).toBe("Eduardo")
  })

  it("merges pili/pilar and ire/irene aliases", () => {
    expect(resolveFriendKey("pili")).toBe("pilar")
    expect(resolveFriendKey("pilar")).toBe("pilar")
    expect(resolveFriendKey("ire")).toBe("irene")
    expect(resolveFriendKey("irene")).toBe("irene")
  })

  it("falls back to token key for unknown friends", () => {
    expect(resolveFriendKey("serapio")).toBe("serapio")
    expect(getFriendDisplayName("serapio")).toBe("Serapio")
  })

  it("covers every catalog entry with at least one alias", () => {
    for (const entry of ESCAPE_BABEL_FRIEND_CATALOG) {
      expect(findFriendCatalogEntry(entry.aliases[0] ?? entry.displayName)).toEqual(
        entry,
      )
    }
  })
})
