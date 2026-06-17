import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  BoardGameCatalogEntry,
  CreateBoardGameInput,
  CreateEscapeRoomInput,
  EscapeRoomCatalogEntry,
  GameCatalog,
} from "@/domain/types/catalog"
import type { GameType } from "@/domain/types/rows"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable } from "@/services/errors"
import {
  mapGameCatalog,
  toBoardGameCatalogEntry,
  toBoardGameCatalogInsert,
  toEscapeRoomCatalogEntry,
  toEscapeRoomCatalogInsert,
} from "@/services/catalog/catalogMapper"

export type ListCatalogOptions = {
  type?: GameType
}

export function createCatalogRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async list(options: ListCatalogOptions = {}): Promise<GameCatalog[]> {
      let query = client.from("game_catalog").select("*").order("title")

      if (options.type) {
        query = query.eq("type", options.type)
      }

      const result = await query
      return unwrap(result).map(mapGameCatalog)
    },

    async getById(id: string): Promise<GameCatalog | null> {
      const result = await client
        .from("game_catalog")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapGameCatalog(row) : null
    },

    async findByExternalId(
      type: GameType,
      source: string,
      sourceExternalId: string,
    ): Promise<GameCatalog | null> {
      const result = await client
        .from("game_catalog")
        .select("*")
        .eq("type", type)
        .eq("source", source)
        .eq("source_external_id", sourceExternalId)
        .maybeSingle()

      const row = unwrapNullable(result)
      return row ? mapGameCatalog(row) : null
    },

    async getBoardGameById(id: string): Promise<BoardGameCatalogEntry | null> {
      const catalogResult = await client
        .from("game_catalog")
        .select("*")
        .eq("id", id)
        .eq("type", "board_game")
        .maybeSingle()

      const catalog = unwrapNullable(catalogResult)
      if (!catalog) return null

      const detailsResult = await client
        .from("board_game_details")
        .select("*")
        .eq("game_catalog_id", id)
        .single()

      return toBoardGameCatalogEntry(catalog, unwrap(detailsResult))
    },

    async getEscapeRoomById(
      id: string,
    ): Promise<EscapeRoomCatalogEntry | null> {
      const catalogResult = await client
        .from("game_catalog")
        .select("*")
        .eq("id", id)
        .eq("type", "escape_room")
        .maybeSingle()

      const catalog = unwrapNullable(catalogResult)
      if (!catalog) return null

      const detailsResult = await client
        .from("escape_room_details")
        .select("*")
        .eq("game_catalog_id", id)
        .single()

      return toEscapeRoomCatalogEntry(catalog, unwrap(detailsResult))
    },

    async createBoardGame(
      input: CreateBoardGameInput,
    ): Promise<BoardGameCatalogEntry> {
      const { catalog, details } = toBoardGameCatalogInsert(input)

      const catalogResult = await client
        .from("game_catalog")
        .insert(catalog)
        .select("*")
        .single()

      const catalogRow = unwrap(catalogResult)

      const detailsResult = await client
        .from("board_game_details")
        .insert({
          game_catalog_id: catalogRow.id,
          ...details,
        })
        .select("*")
        .single()

      return toBoardGameCatalogEntry(catalogRow, unwrap(detailsResult))
    },

    async createEscapeRoom(
      input: CreateEscapeRoomInput,
    ): Promise<EscapeRoomCatalogEntry> {
      const { catalog, details } = toEscapeRoomCatalogInsert(input)

      const catalogResult = await client
        .from("game_catalog")
        .insert(catalog)
        .select("*")
        .single()

      const catalogRow = unwrap(catalogResult)

      const detailsResult = await client
        .from("escape_room_details")
        .insert({
          game_catalog_id: catalogRow.id,
          ...details,
        })
        .select("*")
        .single()

      return toEscapeRoomCatalogEntry(catalogRow, unwrap(detailsResult))
    },

    async listEscapeRooms(): Promise<EscapeRoomCatalogEntry[]> {
      const catalogs = await client
        .from("game_catalog")
        .select("*")
        .eq("type", "escape_room")
        .order("title")

      const entries: EscapeRoomCatalogEntry[] = []

      for (const catalog of unwrap(catalogs)) {
        const detailsResult = await client
          .from("escape_room_details")
          .select("*")
          .eq("game_catalog_id", catalog.id)
          .single()

        entries.push(toEscapeRoomCatalogEntry(catalog, unwrap(detailsResult)))
      }

      return entries
    },
  }
}

export const catalogRepository = createCatalogRepository(supabase)
