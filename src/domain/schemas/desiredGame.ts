import { z } from "zod"

const titleField = z
  .string()
  .trim()
  .min(1, "El título es obligatorio")
  .max(200, "Máximo 200 caracteres")

const notesField = z
  .string()
  .trim()
  .max(2000, "Máximo 2000 caracteres")
  .optional()

const priorityField = z
  .union([z.literal(1), z.literal(2), z.literal(3)])
  .nullable()
  .optional()

const boardGameFormSchema = z.object({
  type: z.literal("board_game"),
  title: titleField,
  notes: notesField,
  priority: priorityField,
  bggId: z.number().int().positive().nullable().optional(),
})

const escapeRoomFormSchema = z.object({
  type: z.literal("escape_room"),
  title: titleField,
  notes: notesField,
  priority: priorityField,
  city: z.string().trim().max(100).optional(),
  venue: z.string().trim().max(200).optional(),
  company: z.string().trim().max(200).optional(),
  bookingUrl: z
    .string()
    .trim()
    .url("URL no válida")
    .optional()
    .or(z.literal("")),
})

export const desiredGameFormSchema = z.discriminatedUnion("type", [
  boardGameFormSchema,
  escapeRoomFormSchema,
])

export type DesiredGameFormValues = z.infer<typeof desiredGameFormSchema>
