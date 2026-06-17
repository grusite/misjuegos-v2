import type { PostgrestError } from "@supabase/supabase-js"

export class DbError extends Error {
  readonly code: string
  readonly details: string | null
  readonly hint: string | null

  constructor(
    message: string,
    options: {
      code: string
      details?: string | null
      hint?: string | null
      cause?: unknown
    },
  ) {
    super(message, { cause: options.cause })
    this.name = "DbError"
    this.code = options.code
    this.details = options.details ?? null
    this.hint = options.hint ?? null
  }
}

export function fromPostgrestError(error: PostgrestError): DbError {
  return new DbError(error.message, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    cause: error,
  })
}

export function unwrap<T>(result: {
  data: T | null
  error: PostgrestError | null
}): T {
  if (result.error) throw fromPostgrestError(result.error)
  if (result.data === null) {
    throw new DbError("Resultado vacío de la base de datos", { code: "EMPTY" })
  }
  return result.data
}

export function getDbErrorMessage(error: unknown): string {
  if (error instanceof DbError) {
    if (error.code === "23505") {
      return "Ya existe un registro con ese valor"
    }

    return error.message
  }

  if (error instanceof Error) return error.message

  return "Ha ocurrido un error"
}

export function unwrapNullable<T>(result: {
  data: T | null
  error: PostgrestError | null
}): T | null {
  if (result.error) {
    if (result.error.code === "PGRST116") return null
    throw fromPostgrestError(result.error)
  }

  return result.data
}
