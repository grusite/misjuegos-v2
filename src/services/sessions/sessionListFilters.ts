import type { GameType } from "@/domain/types/rows"
import type { ListSessionsOptions } from "@/domain/types/session"

export type SessionFilter = "all" | GameType

export type SessionDatePreset = "all" | "this_month" | "this_year" | "custom"

export type SessionListFilterState = {
  gameType: SessionFilter
  search: string
  onlyMine: boolean
  participantIds: string[]
  playerTeamId: string | null
  datePreset: SessionDatePreset
  dateFrom: string | null
  dateTo: string | null
}

export function createDefaultSessionListFilters(): SessionListFilterState {
  return {
    gameType: "all",
    search: "",
    onlyMine: false,
    participantIds: [],
    playerTeamId: null,
    datePreset: "all",
    dateFrom: null,
    dateTo: null,
  }
}

export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

function dateInputToIsoStart(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
}

function dateInputToIsoEnd(date: string): string {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()
}

export function resolveDateRange(
  preset: SessionDatePreset,
  from: string | null,
  to: string | null,
): { from?: string; to?: string } {
  const now = new Date()

  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString(), to: now.toISOString() }
  }

  if (preset === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1)
    return { from: start.toISOString(), to: now.toISOString() }
  }

  if (preset === "custom") {
    const resolved: { from?: string; to?: string } = {}
    if (from) resolved.from = dateInputToIsoStart(from)
    if (to) resolved.to = dateInputToIsoEnd(to)
    return resolved
  }

  return {}
}

export function toListSessionsOptions(
  state: SessionListFilterState,
  selfParticipantId: string | null,
): ListSessionsOptions {
  const options: ListSessionsOptions = {}

  if (state.gameType !== "all") {
    options.gameType = state.gameType
  }

  const search = state.search.trim()
  if (search) {
    options.search = search
  }

  let participantIds = [...state.participantIds]
  if (state.onlyMine && selfParticipantId) {
    participantIds = [selfParticipantId]
  }
  if (participantIds.length > 0) {
    options.participantIds = participantIds
  }

  if (state.playerTeamId) {
    options.playerTeamId = state.playerTeamId
  }

  const range = resolveDateRange(state.datePreset, state.dateFrom, state.dateTo)
  if (range.from) options.playedAtFrom = range.from
  if (range.to) options.playedAtTo = range.to

  return options
}

export function countActiveSessionFilters(state: SessionListFilterState): number {
  let count = 0

  if (state.gameType !== "all") count += 1
  if (state.search.trim()) count += 1
  if (state.onlyMine) count += 1
  if (!state.onlyMine && state.participantIds.length > 0) count += 1
  if (state.playerTeamId) count += 1
  if (state.datePreset !== "all") count += 1

  return count
}

export function hashListSessionsOptions(options: ListSessionsOptions): string {
  const normalized = {
    gameCatalogId: options.gameCatalogId ?? null,
    gameType: options.gameType ?? null,
    search: options.search ?? null,
    participantIds: options.participantIds?.slice().sort() ?? null,
    playerTeamId: options.playerTeamId ?? null,
    playedAtFrom: options.playedAtFrom ?? null,
    playedAtTo: options.playedAtTo ?? null,
  }

  return JSON.stringify(normalized)
}
