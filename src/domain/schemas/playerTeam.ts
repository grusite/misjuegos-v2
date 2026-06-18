import { z } from "zod"

export const playerTeamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(100, "Máximo 100 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional(),
  participantIds: z
    .array(z.string().uuid())
    .min(1, "Selecciona al menos un jugador"),
})

export type PlayerTeamFormValues = z.infer<typeof playerTeamFormSchema>
