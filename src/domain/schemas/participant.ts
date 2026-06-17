import { z } from "zod"

export const participantFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
})

export const participantAliasFormSchema = z.object({
  alias: z
    .string()
    .trim()
    .min(1, "El alias es obligatorio")
    .max(100, "Máximo 100 caracteres"),
})

export type ParticipantFormValues = z.infer<typeof participantFormSchema>
export type ParticipantAliasFormValues = z.infer<typeof participantAliasFormSchema>
