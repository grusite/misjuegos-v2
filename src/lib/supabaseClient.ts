import { createClient } from "@supabase/supabase-js"
import type { AppDatabase } from "@/domain/types/schema"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copia .env.dist a .env.",
  )
}

export const supabase = createClient<AppDatabase>(supabaseUrl, supabaseAnonKey)
