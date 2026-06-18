#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createServiceSupabaseClient } from "./lib/supabaseServiceClient.ts"

function loadEnvFile() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env"), "utf8")

    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue

      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex === -1) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env is optional when vars are exported in the shell
  }
}

async function main() {
  loadEnvFile()

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY en .env (local: supabase status)")
    process.exit(1)
  }

  const client = createServiceSupabaseClient(serviceRoleKey)
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, created_at")
    .order("created_at", { ascending: true })

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  if (!data?.length) {
    console.log("No hay perfiles. Inicia sesión una vez en la app (Google) y vuelve a ejecutar.")
    process.exit(0)
  }

  console.log("Perfiles (usa el id como IMPORT_USER_ID):\n")
  for (const profile of data) {
    console.log(`- ${profile.display_name ?? "(sin nombre)"}`)
    console.log(`  id: ${profile.id}\n`)
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
