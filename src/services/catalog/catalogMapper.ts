import { normalizeAlias } from "@/domain/normalizeAlias"
import type {
  BoardGameCatalogEntry,
  BoardGameDetails,
  CreateBoardGameInput,
  CreateEscapeRoomInput,
  EscapeRoomCatalogEntry,
  EscapeRoomDetails,
  GameCatalog,
} from "@/domain/types/catalog"
import type {
  BoardGameDetailsRow,
  EscapeRoomDetailsRow,
  GameCatalogRow,
} from "@/domain/types/rows"

export function mapGameCatalog(row: GameCatalogRow): GameCatalog {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    createdBy: row.created_by,
    createdAt: row.created_at,
    source: row.source,
    sourceExternalId: row.source_external_id,
  }
}

export function mapBoardGameDetails(row: BoardGameDetailsRow): BoardGameDetails {
  return {
    gameCatalogId: row.game_catalog_id,
    bggId: row.bgg_id,
    expansionOfId: row.expansion_of_id,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    playingTimeMin: row.playing_time_min,
    thumbnailUrl: row.thumbnail_url,
    yearPublished: row.year_published,
    rawBgg: row.raw_bgg,
  }
}

export function mapEscapeRoomDetails(
  row: EscapeRoomDetailsRow,
): EscapeRoomDetails {
  return {
    gameCatalogId: row.game_catalog_id,
    city: row.city,
    venue: row.venue,
    roomName: row.room_name,
    company: row.company,
  }
}

export function toBoardGameCatalogEntry(
  catalog: GameCatalogRow,
  details: BoardGameDetailsRow,
): BoardGameCatalogEntry {
  return {
    ...mapGameCatalog(catalog),
    type: "board_game",
    boardGameDetails: mapBoardGameDetails(details),
  }
}

export function toEscapeRoomCatalogEntry(
  catalog: GameCatalogRow,
  details: EscapeRoomDetailsRow,
): EscapeRoomCatalogEntry {
  return {
    ...mapGameCatalog(catalog),
    type: "escape_room",
    escapeRoomDetails: mapEscapeRoomDetails(details),
  }
}

export function toBoardGameCatalogInsert(input: CreateBoardGameInput) {
  return {
    catalog: {
      type: "board_game" as const,
      title: input.title,
      created_by: input.createdBy,
      slug: input.slug ?? null,
      source: input.source ?? null,
      source_external_id: input.sourceExternalId ?? null,
    },
    details: {
      bgg_id: input.bggId ?? null,
      expansion_of_id: input.expansionOfId ?? null,
      min_players: input.minPlayers ?? null,
      max_players: input.maxPlayers ?? null,
      playing_time_min: input.playingTimeMin ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      year_published: input.yearPublished ?? null,
      raw_bgg: input.rawBgg ?? null,
    },
  }
}

export function toEscapeRoomCatalogInsert(input: CreateEscapeRoomInput) {
  return {
    catalog: {
      type: "escape_room" as const,
      title: input.title,
      created_by: input.createdBy,
      slug: input.slug ?? null,
      source: input.source ?? null,
      source_external_id: input.sourceExternalId ?? null,
    },
    details: {
      city: input.city ?? null,
      venue: input.venue ?? null,
      room_name: input.roomName ?? null,
      company: input.company ?? null,
    },
  }
}

export function slugifyTitle(title: string): string {
  return normalizeAlias(title).replace(/\s+/g, "-")
}
