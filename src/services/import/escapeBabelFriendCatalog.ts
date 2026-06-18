import { normalizeAlias } from "@/domain/normalizeAlias"

export type FriendCatalogEntry = {
  key: string
  displayName: string
  aliases: string[]
}

/** Canonical friends + alias groups for Escape Babel CSV import. */
export const ESCAPE_BABEL_FRIEND_CATALOG: FriendCatalogEntry[] = [
  { key: "jorge", displayName: "Jorge Martin", aliases: ["jorge"] },
  { key: "eduardo", displayName: "Eduardo", aliases: ["edu", "eduardo", "edush"] },
  { key: "diego", displayName: "Diego", aliases: ["diego"] },
  { key: "bego", displayName: "Bego", aliases: ["bego"] },
  { key: "javi", displayName: "Javi", aliases: ["javi"] },
  { key: "pilar", displayName: "Pilar", aliases: ["pili", "pilar"] },
  { key: "irene", displayName: "Irene", aliases: ["ire", "irene"] },
  { key: "nat", displayName: "Nat", aliases: ["nat"] },
  { key: "alba", displayName: "Alba", aliases: ["alba"] },
  { key: "david", displayName: "David", aliases: ["david"] },
  { key: "unai", displayName: "Unai", aliases: ["unai"] },
  { key: "vity", displayName: "Vity", aliases: ["vity"] },
  { key: "serapio", displayName: "Serapio", aliases: ["serapio"] },
  { key: "armando", displayName: "Armando", aliases: ["armando"] },
  { key: "arman", displayName: "Arman", aliases: ["arman"] },
  { key: "mario", displayName: "Mario", aliases: ["mario"] },
  { key: "claudio", displayName: "Claudio", aliases: ["claudio"] },
  { key: "alma", displayName: "Alma", aliases: ["alma"] },
  { key: "alex", displayName: "Alex", aliases: ["alex"] },
  { key: "alexia", displayName: "Alexia", aliases: ["alexia"] },
  { key: "noe", displayName: "Noe", aliases: ["noe"] },
  { key: "patri", displayName: "Patri", aliases: ["patri"] },
  { key: "sara", displayName: "Sara", aliases: ["sara"] },
  { key: "roi", displayName: "Roi", aliases: ["roi"] },
  { key: "damian", displayName: "Damián", aliases: ["damian"] },
  { key: "luka", displayName: "Luka", aliases: ["luka"] },
  { key: "manu", displayName: "Manu", aliases: ["manu"] },
  { key: "ana", displayName: "Ana", aliases: ["ana"] },
  { key: "andrea", displayName: "Andrea", aliases: ["andrea"] },
  { key: "antonio", displayName: "Antonio", aliases: ["antonio"] },
  { key: "joan", displayName: "Joan", aliases: ["joan"] },
  { key: "maria", displayName: "María", aliases: ["maria"] },
  { key: "mauro", displayName: "Mauro", aliases: ["mauro"] },
  { key: "clau", displayName: "Clau", aliases: ["clau"] },
]

const catalogByKey = new Map(
  ESCAPE_BABEL_FRIEND_CATALOG.map(entry => [entry.key, entry]),
)

const catalogByAlias = new Map<string, FriendCatalogEntry>()

for (const entry of ESCAPE_BABEL_FRIEND_CATALOG) {
  catalogByAlias.set(normalizeAlias(entry.displayName), entry)
  for (const alias of entry.aliases) {
    catalogByAlias.set(normalizeAlias(alias), entry)
  }
}

export function findFriendCatalogEntry(
  token: string,
): FriendCatalogEntry | null {
  return catalogByAlias.get(normalizeAlias(token)) ?? null
}

export function resolveFriendKey(token: string): string {
  const catalogEntry = findFriendCatalogEntry(token)
  if (catalogEntry) return catalogEntry.key

  return normalizeAlias(token)
}

export function getFriendDisplayName(key: string): string {
  const catalogEntry = catalogByKey.get(key)
  if (catalogEntry) return catalogEntry.displayName

  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function collectAliasesForFriendKey(
  key: string,
  seenTokens: Set<string>,
): string[] {
  const catalogEntry = catalogByKey.get(key)
  const aliases = new Set<string>()

  for (const token of seenTokens) {
    if (resolveFriendKey(token) === key) {
      aliases.add(normalizeAlias(token))
    }
  }

  if (catalogEntry) {
    aliases.add(normalizeAlias(catalogEntry.displayName))
    for (const alias of catalogEntry.aliases) {
      aliases.add(normalizeAlias(alias))
    }
  } else {
    aliases.add(key)
  }

  return [...aliases]
}
