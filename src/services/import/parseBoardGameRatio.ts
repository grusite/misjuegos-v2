import type { SessionOutcome } from "@/domain/types/rows"

export type ParsedBoardGameRatio = {
  wins: number
  losses: number
}

export function parsePlayCount(value: string | undefined): number {
  const trimmed = (value ?? "").trim().replace(/\?/g, "")
  if (!trimmed) return 1

  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function parseBoardGameRatio(value: string | undefined): ParsedBoardGameRatio {
  const text = (value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()

  if (!text || text === "??" || text === "?") {
    return { wins: 0, losses: 0 }
  }

  let wins = 0
  let losses = 0

  const winMatch = text.match(/(\d+)\s*(?:ganad|victor|win|exito|éxito)/)
  const lossMatch = text.match(/(\d+)\s*(?:perdid|fracas|loss|fall)/)

  if (winMatch) {
    wins = Number.parseInt(winMatch[1], 10)
  }

  if (lossMatch) {
    losses = Number.parseInt(lossMatch[1], 10)
  }

  if (wins === 0 && losses === 0) {
    if (/(ganad|victor|win|exito|éxito)/.test(text)) {
      wins = 1
    } else if (/(perdid|fracas|loss|fall)/.test(text)) {
      losses = 1
    }
  }

  return {
    wins: Number.isFinite(wins) ? wins : 0,
    losses: Number.isFinite(losses) ? losses : 0,
  }
}

export function expandBoardGameOutcomes(
  playCount: number,
  ratio: ParsedBoardGameRatio,
): SessionOutcome[] {
  let wins = ratio.wins
  let losses = ratio.losses

  if (wins + losses > playCount) {
    const scale = playCount / (wins + losses)
    wins = Math.round(wins * scale)
    losses = Math.round(losses * scale)

    while (wins + losses > playCount) {
      if (wins >= losses && wins > 0) wins -= 1
      else if (losses > 0) losses -= 1
    }
  }

  if (wins + losses < playCount) {
    if (wins > 0 && losses === 0) {
      losses = playCount - wins
    } else if (losses > 0 && wins === 0) {
      wins = playCount - losses
    }
  }

  const outcomes: SessionOutcome[] = []

  for (let index = 0; index < losses; index += 1) {
    outcomes.push("loss")
  }

  for (let index = 0; index < wins; index += 1) {
    outcomes.push("win")
  }

  while (outcomes.length < playCount) {
    outcomes.push("unknown")
  }

  return outcomes.slice(0, playCount)
}
