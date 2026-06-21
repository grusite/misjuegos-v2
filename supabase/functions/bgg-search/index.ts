import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { fetchBggSearch } from "../_shared/fetchBggSearch.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

type SearchRequest = {
  query?: string
}

type ErrorCode =
  | "unauthorized"
  | "invalid_request"
  | "bgg_not_configured"
  | "bgg_unauthorized"
  | "bgg_timeout"
  | "bgg_error"

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

function errorResponse(code: ErrorCode, message: string, status: number): Response {
  return jsonResponse({ error: code, message }, status)
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return errorResponse("invalid_request", "Método no permitido.", 405)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return errorResponse("unauthorized", "Debes iniciar sesión.", 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")

  if (!supabaseUrl || !supabaseAnonKey) {
    return errorResponse(
      "bgg_error",
      "Configuración de Supabase incompleta.",
      500,
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return errorResponse("unauthorized", "Debes iniciar sesión.", 401)
  }

  const bggToken = Deno.env.get("BGG_TOKEN")?.trim()
  if (!bggToken) {
    return errorResponse(
      "bgg_not_configured",
      "BGG_TOKEN no está configurado en el servidor.",
      503,
    )
  }

  let body: SearchRequest
  try {
    body = (await req.json()) as SearchRequest
  } catch {
    return errorResponse("invalid_request", "Cuerpo JSON inválido.", 400)
  }

  const query = body.query?.trim() ?? ""
  if (!query || query.length > 100) {
    return errorResponse(
      "invalid_request",
      "Indica un nombre de juego (máx. 100 caracteres).",
      400,
    )
  }

  try {
    const results = await fetchBggSearch(query, bggToken)
    return jsonResponse({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : "bgg_error"
    console.error("bgg-search:", message)

    if (message === "bgg_unauthorized") {
      return errorResponse(
        "bgg_unauthorized",
        "Token de BGG rechazado. Revisa la aplicación en BoardGameGeek.",
        502,
      )
    }

    if (message === "bgg_timeout") {
      return errorResponse(
        "bgg_timeout",
        "BoardGameGeek tardó demasiado. Inténtalo de nuevo.",
        504,
      )
    }

    if (message.startsWith("bgg_http_")) {
      const status = message.slice("bgg_http_".length)
      return errorResponse(
        "bgg_error",
        `BoardGameGeek respondió con error HTTP ${status}.`,
        502,
      )
    }

    if (message === "bgg_error_response") {
      return errorResponse(
        "bgg_error",
        "BoardGameGeek devolvió un error en la respuesta.",
        502,
      )
    }

    if (message.startsWith("bgg_fetch_failed:")) {
      return errorResponse(
        "bgg_error",
        "No se pudo conectar con BoardGameGeek desde el servidor.",
        502,
      )
    }

    if (message.startsWith("bgg_parse_failed:")) {
      return errorResponse(
        "bgg_error",
        "No se pudo interpretar la respuesta de BoardGameGeek.",
        502,
      )
    }

    return errorResponse(
      "bgg_error",
      "No se pudo consultar BoardGameGeek.",
      502,
    )
  }
})
