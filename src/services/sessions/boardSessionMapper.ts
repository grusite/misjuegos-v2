import type {
  BoardSessionDetails,
  UpsertBoardSessionDetailsInput,
} from "@/domain/types/boardSession"
import type { AppDatabase } from "@/domain/types/schema"

type BoardSessionDetailsRow =
  AppDatabase["public"]["Tables"]["board_session_details"]["Row"]

type BoardSessionDetailsInsert =
  AppDatabase["public"]["Tables"]["board_session_details"]["Insert"]

export function mapBoardSessionDetails(
  row: BoardSessionDetailsRow,
): BoardSessionDetails {
  return {
    sessionId: row.session_id,
    players: row.players,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toBoardSessionDetailsUpsert(
  sessionId: string,
  input: UpsertBoardSessionDetailsInput,
): BoardSessionDetailsInsert {
  return {
    session_id: sessionId,
    players: input.players ?? null,
    updated_at: new Date().toISOString(),
  }
}
