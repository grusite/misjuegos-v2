import type {
  CreateDesiredGameInput,
  DesiredGame,
  DesiredGameStatus,
  UpdateDesiredGameInput,
} from "@/domain/types/desiredGame"
import type { Database } from "@/domain/types/database"
import type { GameType } from "@/domain/types/rows"

type DesiredGameUpdateRow = Database["public"]["Tables"]["desired_games"]["Update"]

type DesiredGameRow = {
  id: string
  type: GameType
  title: string
  notes: string | null
  priority: number | null
  city: string | null
  venue: string | null
  company: string | null
  booking_url: string | null
  bgg_id: number | null
  game_catalog_id: string | null
  status: DesiredGameStatus
  created_by: string
  created_at: string
  updated_at: string
}

export function mapDesiredGame(row: DesiredGameRow): DesiredGame {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    notes: row.notes,
    priority: row.priority,
    city: row.city,
    venue: row.venue,
    company: row.company,
    bookingUrl: row.booking_url,
    bggId: row.bgg_id,
    gameCatalogId: row.game_catalog_id,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toDesiredGameInsert(
  createdBy: string,
  input: CreateDesiredGameInput,
) {
  return {
    type: input.type,
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    priority: input.priority ?? null,
    city: input.city?.trim() || null,
    venue: input.venue?.trim() || null,
    company: input.company?.trim() || null,
    booking_url: input.bookingUrl?.trim() || null,
    bgg_id: input.bggId ?? null,
    game_catalog_id: input.gameCatalogId ?? null,
    created_by: createdBy,
  }
}

export function toDesiredGameUpdate(input: UpdateDesiredGameInput): DesiredGameUpdateRow {
  const update: DesiredGameUpdateRow = {}

  if (input.type !== undefined) update.type = input.type
  if (input.title !== undefined) update.title = input.title.trim()
  if (input.notes !== undefined) update.notes = input.notes?.trim() || null
  if (input.priority !== undefined) update.priority = input.priority
  if (input.city !== undefined) update.city = input.city?.trim() || null
  if (input.venue !== undefined) update.venue = input.venue?.trim() || null
  if (input.company !== undefined) update.company = input.company?.trim() || null
  if (input.bookingUrl !== undefined) {
    update.booking_url = input.bookingUrl?.trim() || null
  }
  if (input.bggId !== undefined) update.bgg_id = input.bggId
  if (input.gameCatalogId !== undefined) {
    update.game_catalog_id = input.gameCatalogId
  }
  if (input.status !== undefined) update.status = input.status

  return update
}
