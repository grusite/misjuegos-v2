#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { parseArgs } from "node:util"

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

function printHelp() {
  console.log(`Uso: pnpm import:wishlist [--dry-run] [--user=<uuid>] <ruta.csv>

Importa la lista "Quiero jugar" de escape rooms (desired_games).

Opciones:
  --dry-run       Simula sin escribir en la base de datos

Variables de entorno:
  SUPABASE_SERVICE_ROLE_KEY  Clave service role
  IMPORT_USER_ID             UUID del perfil importador

Ejemplo:
  pnpm import:wishlist data/import/escape-wishlist.csv
`)
}

async function main() {
  loadEnvFile()

  const { values, positionals } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      user: { type: "string" },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  })

  if (values.help) {
    printHelp()
    return
  }

  const filePath = positionals[0]
  if (!filePath) {
    printHelp()
    process.exitCode = 1
    return
  }

  const createdBy = values.user ?? process.env.IMPORT_USER_ID
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!createdBy) {
    console.error("Falta IMPORT_USER_ID o --user=<uuid>")
    process.exitCode = 1
    return
  }

  if (!values["dry-run"] && !serviceRoleKey) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY para importación real")
    process.exitCode = 1
    return
  }

  const { createServiceSupabaseClient } = await import("./lib/supabaseServiceClient.ts")
  const { importEscapeWishlistCsv } = await import(
    "../src/services/import/escapeWishlistImporter.ts"
  )

  const absolutePath = resolve(process.cwd(), filePath)
  const csvContent = readFileSync(absolutePath, "utf8")
  const fileName = filePath.split("/").pop() ?? filePath

  const client = serviceRoleKey
    ? createServiceSupabaseClient(serviceRoleKey)
    : createServiceSupabaseClient(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
      )

  const result = await importEscapeWishlistCsv(client, {
    csvContent,
    fileName,
    createdBy,
    dryRun: values["dry-run"],
  })

  console.log("")
  console.log(values["dry-run"] ? "Simulación (dry-run)" : "Importación completada")
  console.log(`Run ID: ${result.runId}`)
  console.log("")
  console.log(`Deseados importados: ${result.summary.imported}`)
  console.log(`Omitidos (ya existían): ${result.summary.skipped}`)
  console.log(`Fallidos: ${result.summary.failed}`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
