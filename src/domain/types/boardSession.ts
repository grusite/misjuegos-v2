export type BoardSessionDetails = {
  sessionId: string
  players: string | null
  createdAt: string
  updatedAt: string
}

export type UpsertBoardSessionDetailsInput = {
  players?: string | null
}
