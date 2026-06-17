import { z } from "zod"

export const newEscapeSessionFormSchema = z.object({
  catalogId: z.string().optional(),
  title: z.string().trim().min(1, "El nombre de la sala es obligatorio").max(200),
  city: z.string().trim().max(100).optional(),
  venue: z.string().trim().max(100).optional(),
  roomName: z.string().trim().max(100).optional(),
  company: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export const escapeSessionDetailsFormSchema = z.object({
  cluesUsed: z.number().int().min(0).max(99).nullable().optional(),
  timeResult: z.string().trim().max(50).optional(),
  price: z.number().min(0).max(9999).nullable().optional(),
  priceCurrency: z.string().trim().length(3).default("EUR"),
  escaped: z.boolean().nullable().optional(),
})

export type NewEscapeSessionFormValues = z.infer<typeof newEscapeSessionFormSchema>
export type EscapeSessionDetailsFormValues = z.infer<typeof escapeSessionDetailsFormSchema>
