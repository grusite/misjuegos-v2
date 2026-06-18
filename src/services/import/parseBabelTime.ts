export type ParsedBabelTime = {
  timeResult: string
  timeSeconds: number | null
}

export function parseBabelEscapeTime(raw: string | undefined): ParsedBabelTime {
  const timeResult = (raw ?? "").trim()
  if (!timeResult) {
    return { timeResult: "", timeSeconds: null }
  }

  if (/^-\s*\/\s*\d+/.test(timeResult) || timeResult === "-") {
    return { timeResult, timeSeconds: null }
  }

  if (/^\?\?\/\d+/.test(timeResult)) {
    return { timeResult, timeSeconds: null }
  }

  const slashIndex = timeResult.indexOf("/")
  const usedPart =
    slashIndex >= 0 ? timeResult.slice(0, slashIndex) : timeResult

  if (/^\d+(?:\.\d+)?$/.test(usedPart.trim())) {
    const minutes = Number.parseFloat(usedPart.trim())
    if (Number.isFinite(minutes)) {
      return { timeResult, timeSeconds: Math.round(minutes * 60) }
    }
  }

  const timeSeconds = parseUsedTimePart(usedPart)
  return { timeResult, timeSeconds }
}

function parseUsedTimePart(part: string): number | null {
  const trimmed = part.trim().replace(/^~\s*/, "")
  if (!trimmed || trimmed === "-") return null

  const decimalMinutes = /^(\d+)[,.](\d+)$/.exec(trimmed)
  if (decimalMinutes) {
    const minutes = Number.parseFloat(
      `${decimalMinutes[1]}.${decimalMinutes[2]}`,
    )
    return Number.isFinite(minutes) ? Math.round(minutes * 60) : null
  }

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return Math.round(Number.parseFloat(trimmed) * 60)
  }

  const weirdQuotes = /^(\d+)""(\d+)'/.exec(trimmed)
  if (weirdQuotes) {
    return (
      Number.parseInt(weirdQuotes[1], 10) * 60 +
      Number.parseInt(weirdQuotes[2], 10)
    )
  }

  const minuteSecondMixed = /^(\d+)'(\d+)["']+/.exec(trimmed)
  if (minuteSecondMixed) {
    return (
      Number.parseInt(minuteSecondMixed[1], 10) * 60 +
      Number.parseInt(minuteSecondMixed[2], 10)
    )
  }

  const minuteSecondQuotes = /^(\d+)'(\d+)''/.exec(trimmed)
  if (minuteSecondQuotes) {
    return (
      Number.parseInt(minuteSecondQuotes[1], 10) * 60 +
      Number.parseInt(minuteSecondQuotes[2], 10)
    )
  }

  const minuteSecondDouble = /^(\d+)'(\d+)""/.exec(trimmed)
  if (minuteSecondDouble) {
    return (
      Number.parseInt(minuteSecondDouble[1], 10) * 60 +
      Number.parseInt(minuteSecondDouble[2], 10)
    )
  }

  const minuteSecondPlain = /^(\d+)'(\d+)$/.exec(trimmed)
  if (minuteSecondPlain) {
    return (
      Number.parseInt(minuteSecondPlain[1], 10) * 60 +
      Number.parseInt(minuteSecondPlain[2], 10)
    )
  }

  const minutesOnly = /^(\d+)'/.exec(trimmed)
  if (minutesOnly) {
    return Number.parseInt(minutesOnly[1], 10) * 60
  }

  return null
}
