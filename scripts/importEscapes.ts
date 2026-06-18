#!/usr/bin/env node
import { execSync } from "node:child_process"
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
  console.log(`Uso: pnpm import:escapes [--dry-run] [--fresh] [--no-bootstrap] [--user=<uuid>] <ruta.csv>

Opciones:
  --fresh         Borra datos de la app (mantiene login) y luego importa
  --dry-run       Simula sin escribir en la base de datos
  --no-bootstrap  No crea amigos/equipo (solo sesiones)

Variables de entorno:
  SUPABASE_SERVICE_ROLE_KEY  Clave service role (local: supabase status)
  IMPORT_USER_ID             UUID del perfil importador (created_by)
  VITE_SUPABASE_URL          URL de Supabase

Flujo recomendado (una sola vez):
  IMPORT_USER_ID=<tu-uuid> pnpm import:escapes --fresh data/import/escape-babel.csv
`)
}

async function main() {
  loadEnvFile()

  const { values, positionals } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      fresh: { type: "boolean", default: false },
      "no-bootstrap": { type: "boolean", default: false },
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

  if (values.fresh && !values["dry-run"]) {
    console.log("Borrando datos de prueba (amigos, partidas, importaciones)...")
    execSync("pnpm db:reset-data", { stdio: "inherit", cwd: process.cwd() })
  }

  const { createServiceSupabaseClient } = await import("./lib/supabaseServiceClient.ts")
  const { importEscapeBabelCsv } = await import(
    "../src/services/import/escapeBabelImporter.ts"
  )

  const absolutePath = resolve(process.cwd(), filePath)
  const csvContent = readFileSync(absolutePath, "utf8")
  const fileName = filePath.split("/").pop() ?? filePath

  const client = serviceRoleKey
    ? createServiceSupabaseClient(serviceRoleKey)
    : createServiceSupabaseClient(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
      )

  const result = await importEscapeBabelCsv(client, {
    csvContent,
    fileName,
    createdBy,
    dryRun: values["dry-run"],
    bootstrapFriends: !values["no-bootstrap"],
  })

  console.log("")
  console.log(values["dry-run"] ? "Simulación (dry-run)" : "Importación completada")
  console.log(`Run ID: ${result.runId}`)

  if (result.bootstrap) {
    console.log("")
    console.log("Bootstrap amigos:")
    console.log(`  Amigos: ${result.bootstrap.friendKeys.length}`)
    console.log(`  Participantes creados: ${result.bootstrap.participantsCreated}`)
    console.log(`  Alias añadidos: ${result.bootstrap.aliasesAdded}`)
    console.log(`  Equipos creados: ${result.bootstrap.teamsCreated}`)
  }

  console.log("")
  console.log(`Sesiones importadas: ${result.summary.imported}`)
  console.log(`Omitidas (ya existían): ${result.summary.skipped}`)
  console.log(`Fallidas: ${result.summary.failed}`)

  if (result.summary.warnings.length > 0) {
    console.log("")
    console.log("Avisos:")
    for (const warning of result.summary.warnings) {
      console.log(`- ${warning}`)
    }
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
