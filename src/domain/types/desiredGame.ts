import type { GameType } from "@/domain/types/rows"

export type DesiredGameStatus = "active" | "played" | "dropped"

export type DesiredGame = {
  id: string
  type: GameType
  title: string
  notes: string | null
  priority: number | null
  city: string | null
  venue: string | null
  company: string | null
  bookingUrl: string | null
  bggId: number | null
  gameCatalogId: string | null
  status: DesiredGameStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type CreateDesiredGameInput = {
  type: GameType
  title: string
  notes?: string | null
  priority?: number | null
  city?: string | null
  venue?: string | null
  company?: string | null
  bookingUrl?: string | null
  bggId?: number | null
  gameCatalogId?: string | null
}

export type UpdateDesiredGameInput = Partial<CreateDesiredGameInput> & {
  status?: DesiredGameStatus
}
