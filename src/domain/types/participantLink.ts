export type ParticipantLinkCandidate = {
  id: string
  displayName: string
  color: string | null
  sessionCount: number
  matchKind: "exact" | "partial"
}

export type ParticipantLinkPromptState =
  | "idle"
  | "loading"
  | "pending"
  | "completing"
  | "completed"
