import type {
  EscapeSessionDetails,
  UpsertEscapeSessionDetailsInput,
} from "@/domain/types/escapeSession"
import type { AppDatabase } from "@/domain/types/schema"

type EscapeSessionDetailsRow =
  AppDatabase["public"]["Tables"]["escape_session_details"]["Row"]
type EscapeSessionDetailsInsert =
  AppDatabase["public"]["Tables"]["escape_session_details"]["Insert"]

export function mapEscapeSessionDetails(
  row: EscapeSessionDetailsRow,
): EscapeSessionDetails {
  return {
    sessionId: row.session_id,
    cluesUsed: row.clues_used,
    timeResult: row.time_result,
    timeSeconds: row.time_seconds,
    price: row.price === null ? null : Number(row.price),
    priceCurrency: row.price_currency,
    escaped: row.escaped,
  }
}

export function toEscapeSessionDetailsUpsert(
  sessionId: string,
  input: UpsertEscapeSessionDetailsInput,
): EscapeSessionDetailsInsert {
  return {
    session_id: sessionId,
    ...(input.cluesUsed !== undefined && { clues_used: input.cluesUsed }),
    ...(input.timeResult !== undefined && { time_result: input.timeResult }),
    ...(input.timeSeconds !== undefined && { time_seconds: input.timeSeconds }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.priceCurrency !== undefined && {
      price_currency: input.priceCurrency,
    }),
    ...(input.escaped !== undefined && { escaped: input.escaped }),
  }
}
