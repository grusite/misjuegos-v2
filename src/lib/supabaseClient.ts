import { createClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"

function readEnv(key: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY"): string | undefined {
  const viteEnv =
    typeof import.meta !== "undefined" ? import.meta.env : undefined
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string> } })
    .process?.env

  return viteEnv?.[key] ?? nodeEnv?.[key]
}

const supabaseUrl = readEnv("VITE_SUPABASE_URL")
const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY")

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.dist a .env.",
  )
}

export const supabase = createClient<AppDatabase>(supabaseUrl, supabaseAnonKey)
