import type { Json } from "./database"
import type { GameType } from "./rows"

export type GameCatalog = {
  id: string
  type: GameType
  title: string
  slug: string | null
  createdBy: string
  createdAt: string
  source: string | null
  sourceExternalId: string | null
}

export type BoardGameDetails = {
  gameCatalogId: string
  bggId: number | null
  expansionOfId: string | null
  minPlayers: number | null
  maxPlayers: number | null
  playingTimeMin: number | null
  thumbnailUrl: string | null
  yearPublished: number | null
  rawBgg: Json | null
}

export type EscapeRoomDetails = {
  gameCatalogId: string
  city: string | null
  venue: string | null
  roomName: string | null
  company: string | null
}

export type BoardGameCatalogEntry = GameCatalog & {
  type: "board_game"
  boardGameDetails: BoardGameDetails
}

export type EscapeRoomCatalogEntry = GameCatalog & {
  type: "escape_room"
  escapeRoomDetails: EscapeRoomDetails
}

export type CreateBoardGameInput = {
  title: string
  createdBy: string
  slug?: string | null
  source?: string | null
  sourceExternalId?: string | null
  bggId?: number | null
  expansionOfId?: string | null
  minPlayers?: number | null
  maxPlayers?: number | null
  playingTimeMin?: number | null
  thumbnailUrl?: string | null
  yearPublished?: number | null
  rawBgg?: Json | null
}

export type CreateEscapeRoomInput = {
  title: string
  createdBy: string
  slug?: string | null
  source?: string | null
  sourceExternalId?: string | null
  city?: string | null
  venue?: string | null
  roomName?: string | null
  company?: string | null
}
