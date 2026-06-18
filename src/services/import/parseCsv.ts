export function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]

    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\""
        index += 1
      } else if (char === "\"") {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === "\"") {
      inQuotes = true
      continue
    }

    if (char === ",") {
      row.push(field)
      field = ""
      continue
    }

    if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      continue
    }

    if (char === "\r") continue

    field += char
  }

  row.push(field)
  if (row.length > 1 || row[0] !== "") {
    rows.push(row)
  }

  return rows.filter(parsedRow => parsedRow.some(cell => cell.trim().length > 0))
}

export function csvRowsToRecords(
  rows: string[][],
): Array<Record<string, string>> {
  if (rows.length === 0) return []

  const headers = rows[0].map(header => header.trim())
  const records: Array<Record<string, string>> = []

  for (const row of rows.slice(1)) {
    const record: Record<string, string> = {}

    headers.forEach((header, index) => {
      record[header] = (row[index] ?? "").trim()
    })

    records.push(record)
  }

  return records
}
