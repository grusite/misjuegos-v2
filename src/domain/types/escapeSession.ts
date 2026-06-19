export type EscapeSessionDetails = {
  sessionId: string
  cluesUsed: number | null
  timeResult: string | null
  timeSeconds: number | null
  price: number | null
  priceCurrency: string
  escaped: boolean | null
  rating: number | null
  ratingNote: string | null
}

export type UpsertEscapeSessionDetailsInput = {
  cluesUsed?: number | null
  timeResult?: string | null
  timeSeconds?: number | null
  price?: number | null
  priceCurrency?: string
  escaped?: boolean | null
  rating?: number | null
  ratingNote?: string | null
}
