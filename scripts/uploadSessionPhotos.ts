#!/usr/bin/env node
import { parseArgs } from "node:util"
import { createClient } from "@supabase/supabase-js"
import { readFileSync, readdirSync } from "node:fs"
import { basename, extname, resolve } from "node:path"
import type { AppDatabase } from "../src/domain/types/schema"

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
    // optional
  }
}

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])

function printHelp() {
  console.log(`Uso: pnpm upload:photos [--session=<uuid>] [--user=<uuid>] <carpeta|manifest.csv>

Modos:
  Carpeta sin --session   Biblioteca compartida (sin partida asignada)
  Carpeta con --session   Fotos de una sesión concreta
  manifest.csv            Columnas: file_path[,caption] o session_id,file_path[,caption]

Variables:
  SUPABASE_SERVICE_ROLE_KEY
  IMPORT_USER_ID (created_by / prefijo storage)
  VITE_SUPABASE_URL
`)
}

async function uploadFile(
  client: ReturnType<typeof createClient<AppDatabase>>,
  userId: string,
  filePath: string,
  caption: string | null,
  sortOrder: number,
  sessionId: string | null,
) {
  const extension = extname(filePath).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error(`Extensión no permitida: ${filePath}`)
  }

  const fileName = `${crypto.randomUUID()}${extension}`
  const storagePath = sessionId
    ? `${userId}/${sessionId}/${fileName}`
    : `${userId}/library/${fileName}`

  const fileBody = readFileSync(filePath)
  const { error: uploadError } = await client.storage
    .from("session-photos")
    .upload(storagePath, fileBody, {
      contentType:
        extension === ".png"
          ? "image/png"
          : extension === ".webp"
            ? "image/webp"
            : extension === ".gif"
              ? "image/gif"
              : "image/jpeg",
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { error: insertError } = await client.from("photos").insert({
    session_id: sessionId,
    storage_path: storagePath,
    created_by: userId,
    source: "import",
    source_file_id: basename(filePath),
    caption,
    sort_order: sortOrder,
  })

  if (insertError) {
    await client.storage.from("session-photos").remove([storagePath])
    throw insertError
  }
}

async function main() {
  loadEnvFile()

  const { values, positionals } = parseArgs({
    options: {
      session: { type: "string" },
      user: { type: "string" },
      help: { type: "boolean", default: false },
    },
    allowPositionals: true,
  })

  if (values.help) {
    printHelp()
    return
  }

  const inputPath = positionals[0]
  const userId = values.user ?? process.env.IMPORT_USER_ID
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!inputPath || !userId || !supabaseUrl || !serviceRoleKey) {
    printHelp()
    process.exitCode = 1
    return
  }

  const client = createClient<AppDatabase>(supabaseUrl, serviceRoleKey)
  const resolvedPath = resolve(process.cwd(), inputPath)

  if (resolvedPath.endsWith(".csv")) {
    const content = readFileSync(resolvedPath, "utf8")
    const lines = content.split("\n").map(line => line.trim()).filter(Boolean)
    const [header, ...rows] = lines
    const hasSessionColumn = header?.startsWith("session_id")

    if (!header?.includes("file_path")) {
      throw new Error("manifest.csv debe incluir file_path (y opcional session_id, caption)")
    }

    let uploaded = 0
    for (const row of rows) {
      const parts = row.split(",").map(value => value.trim())
      const sessionId = hasSessionColumn ? parts[0] || null : null
      const filePath = hasSessionColumn ? parts[1] : parts[0]
      const caption = hasSessionColumn ? parts[2] ?? "" : parts[1] ?? ""

      if (!filePath) continue

      await uploadFile(
        client,
        userId,
        resolve(process.cwd(), filePath),
        caption || null,
        uploaded,
        sessionId,
      )
      uploaded += 1
    }

    console.log(`Subidas ${uploaded} fotos desde manifest`)
    return
  }

  const sessionId = values.session ?? null
  const files = readdirSync(resolvedPath)
    .filter(name => ALLOWED_EXTENSIONS.has(extname(name).toLowerCase()))
    .map(name => resolve(resolvedPath, name))

  let uploaded = 0
  for (const filePath of files) {
    await uploadFile(client, userId, filePath, null, uploaded, sessionId)
    uploaded += 1
  }

  if (sessionId) {
    console.log(`Subidas ${uploaded} fotos a la sesión ${sessionId}`)
  } else {
    console.log(`Subidas ${uploaded} fotos a la biblioteca (sin partida)`)
  }
}

void main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
