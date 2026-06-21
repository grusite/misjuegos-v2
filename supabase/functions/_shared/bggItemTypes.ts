/** BGG XML item types we accept from search results. */
export const BGG_SEARCH_ITEM_TYPES = new Set([
  "boardgame",
  "boardgameexpansion",
])

export function isBggExpansionType(itemType: string | null): boolean {
  return itemType === "boardgameexpansion"
}

export function isAllowedBggSearchItemType(itemType: string | null): boolean {
  return itemType !== null && BGG_SEARCH_ITEM_TYPES.has(itemType)
}
