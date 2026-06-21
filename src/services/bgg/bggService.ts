import { supabase } from "@/lib/supabaseClient"

export type BggSearchResult = {
  bggId: number
  title: string
  yearPublished: number | null
  thumbnailUrl?: string | null
}

export class BggSearchError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "BggSearchError"
    this.code = code
  }
}

export type BggSearchFeedbackTone = "info" | "warning" | "hint"

export type BggSearchFeedback = {
  tone: BggSearchFeedbackTone
  message: string
}

export function bggSearchFeedbackForError(error: unknown): BggSearchFeedback {
  const code = error instanceof BggSearchError ? error.code : "bgg_error"

  if (code === "bgg_not_configured" || code === "bgg_unauthorized") {
    return {
      tone: "info",
      message:
        "BGG aún no disponible. Escribe el nombre del juego arriba y crea la partida con normalidad.",
    }
  }

  if (code === "bgg_timeout") {
    return {
      tone: "warning",
      message:
        error instanceof BggSearchError && error.message
          ? error.message
          : "BoardGameGeek tardó demasiado. Inténtalo otra vez o escribe el nombre a mano.",
    }
  }

  if (code === "invalid_request") {
    return {
      tone: "hint",
      message: "Indica un nombre para buscar en BGG.",
    }
  }

  if (error instanceof BggSearchError && error.message) {
    return {
      tone: "warning",
      message: error.message,
    }
  }

  return {
    tone: "warning",
    message: "No pudimos buscar en BGG. Puedes crear la partida igual.",
  }
}

type BggSearchResponse = {
  results?: BggSearchResult[]
  error?: string
  message?: string
}

const errorMessages: Record<string, string> = {
  bgg_not_configured:
    "La búsqueda BGG aún no está configurada en el servidor. Añade BGG_TOKEN cuando tengas el token aprobado.",
  bgg_unauthorized:
    "BoardGameGeek rechazó el token. Comprueba que tu aplicación esté aprobada y el token sea válido.",
  bgg_timeout:
    "BoardGameGeek tardó demasiado en responder. Espera unos segundos e inténtalo otra vez.",
  unauthorized: "Debes iniciar sesión para buscar en BoardGameGeek.",
  invalid_request: "Indica un nombre de juego válido.",
  bgg_error: "No se pudo consultar BoardGameGeek.",
}

export async function searchBoardGames(query: string): Promise<BggSearchResult[]> {
  const normalized = query.trim()
  if (!normalized) return []

  const { data, error } = await supabase.functions.invoke<BggSearchResponse>(
    "bgg-search",
    { body: { query: normalized } },
  )

  if (error) {
    throw new BggSearchError("bgg_error", errorMessages.bgg_error)
  }

  if (data?.error) {
    throw new BggSearchError(
      data.error,
      data.message ?? errorMessages[data.error] ?? errorMessages.bgg_error,
    )
  }

  return data?.results ?? []
}
