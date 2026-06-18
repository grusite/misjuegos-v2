#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { csvRowsToRecords, parseCsv } from "../src/services/import/parseCsv.ts"
import { parseEscapeBabelRecords } from "../src/services/import/escapeBabelSchema.ts"
import {
  getFriendDisplayName,
  resolveFriendKey,
} from "../src/services/import/escapeBabelFriendCatalog.ts"
import { ESCAPE_BABEL_IMPORT_TEAMS, isImportTeamToken } from "../src/services/import/importTeams.ts"

const filePath = process.argv[2] ?? "data/import/escape-babel.csv"
const absolutePath = resolve(process.cwd(), filePath)
const csvContent = readFileSync(absolutePath, "utf8")
const records = csvRowsToRecords(parseCsv(csvContent))
const parsedRows = parseEscapeBabelRecords(records)

const friendKeys = new Set<string>()

for (const row of parsedRows) {
  for (const token of row.participantTokens) {
    if (isImportTeamToken(token)) continue
    friendKeys.add(resolveFriendKey(token))
  }
}

const friends = [...friendKeys]
  .map(key => ({
    key,
    displayName: getFriendDisplayName(key),
  }))
  .sort((left, right) => left.displayName.localeCompare(right.displayName, "es"))

console.log(`Archivo: ${filePath}`)
console.log(`Filas: ${parsedRows.length}`)
console.log("")
console.log("Equipos que creará el bootstrap:")
for (const team of ESCAPE_BABEL_IMPORT_TEAMS) {
  const members = team.memberKeys.map(getFriendDisplayName).join(", ")
  console.log(`- ${team.name}: ${members}`)
}
console.log("")
console.log("Amigos que creará el import (displayName + alias del CSV):")
for (const friend of friends) {
  console.log(`- ${friend.displayName} [${friend.key}]`)
}

console.log("")
console.log("Alias fusionados de ejemplo:")
for (const sample of ["edu", "eduardo", "pili", "ire"]) {
  console.log(`  ${sample} → ${getFriendDisplayName(resolveFriendKey(sample))}`)
}
