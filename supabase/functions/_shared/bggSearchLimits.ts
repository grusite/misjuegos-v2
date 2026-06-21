export const BGG_SEARCH_PAGE_SIZE = 10
export const BGG_SEARCH_MAX_RESULTS = 30

export function normalizeBggSearchLimit(limit?: number): number {
  if (!limit || limit < 1) return BGG_SEARCH_PAGE_SIZE

  return Math.min(Math.floor(limit), BGG_SEARCH_PAGE_SIZE)
}

export function normalizeBggSearchOffset(offset?: number): number {
  if (!offset || offset < 0) return 0

  return Math.min(Math.floor(offset), BGG_SEARCH_MAX_RESULTS - 1)
}
