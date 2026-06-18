import { createClient } from "@supabase/supabase-js"
import type { AppDatabase } from "../../src/domain/types/schema.ts"

export function createServiceSupabaseClient(serviceRoleKey: string) {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL

  if (!url) {
    throw new Error("Falta VITE_SUPABASE_URL o SUPABASE_URL en el entorno")
  }

  return createClient<AppDatabase>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
