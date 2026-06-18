import { z } from "zod"
import { normalizeAlias } from "@/domain/normalizeAlias"

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export const wishlistCsvRowSchema = z.object({
  title: z.string().min(1, "Título obligatorio"),
  company: z.string().optional(),
  city: z.string().optional(),
  venue: z.string().optional(),
  bookingUrl: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.string().optional(),
})

export type WishlistCsvRow = z.infer<typeof wishlistCsvRowSchema>

export type ParsedWishlistEntry = WishlistCsvRow & {
  sourceRaw: Record<string, string>
}

const HEADER_ALIASES: Record<string, string[]> = {
  title: ["title", "titulo", "título", "sala", "juego"],
  company: ["company", "compania", "compañía", "sitio", "empresa"],
  city: ["city", "ciudad"],
  venue: ["venue", "local", "ubicacion", "ubicación"],
  bookingUrl: ["booking_url", "booking url", "url", "link"],
  notes: ["notes", "notas", "observaciones"],
}

function mapWishlistHeaders(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const header of headers) {
    const normalized = normalizeAlias(header)

    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some(alias => normalizeAlias(alias) === normalized)) {
        mapping[field] = header
        break
      }
    }
  }

  return mapping
}

function pickField(
  record: Record<string, string>,
  mapping: Record<string, string>,
  field: string,
): string {
  const header = mapping[field]
  if (!header) return ""
  return record[header] ?? ""
}

export function parseWishlistCsvRecords(
  records: Array<Record<string, string>>,
): ParsedWishlistEntry[] {
  if (records.length === 0) return []

  const mapping = mapWishlistHeaders(Object.keys(records[0]))

  return records.map(record => {
    const row = wishlistCsvRowSchema.parse({
      title: pickField(record, mapping, "title"),
      company: pickField(record, mapping, "company"),
      city: pickField(record, mapping, "city"),
      venue: pickField(record, mapping, "venue"),
      bookingUrl: pickField(record, mapping, "bookingUrl"),
      notes: pickField(record, mapping, "notes"),
    })

    return {
      ...row,
      sourceRaw: record,
    }
  })
}
