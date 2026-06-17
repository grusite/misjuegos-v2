import type { SessionOutcome } from "@/domain/types/rows"

export type OutcomeTone = "success" | "failure" | "neutral" | "unknown"

export const outcomeToneStyles: Record<
  OutcomeTone,
  { selected: string; idle: string; label: string }
> = {
  success: {
    selected: "border-board bg-board/25 text-board",
    idle: "hover:border-board/50 hover:text-board",
    label: "text-board",
  },
  failure: {
    selected: "border-secondary bg-secondary/25 text-secondary",
    idle: "hover:border-secondary/50 hover:text-secondary",
    label: "text-secondary",
  },
  neutral: {
    selected: "border-gray-400 bg-gray-700/50 text-gray-200",
    idle: "hover:border-gray-500 hover:text-gray-300",
    label: "text-gray-300",
  },
  unknown: {
    selected: "border-dashed border-gray-500 bg-gray-800/80 text-gray-400",
    idle: "hover:border-gray-500",
    label: "text-gray-400",
  },
}

export function boardOutcomeTone(outcome: SessionOutcome): OutcomeTone {
  if (outcome === "win") return "success"
  if (outcome === "loss") return "failure"
  if (outcome === "draw") return "neutral"
  return "unknown"
}

export function boardOutcomeLabelClass(outcome: SessionOutcome): string {
  return outcomeToneStyles[boardOutcomeTone(outcome)].label
}

export function escapeOutcomeTone(escaped: boolean | null): OutcomeTone {
  if (escaped === true) return "success"
  if (escaped === false) return "failure"
  return "unknown"
}

export function escapeOutcomeLabelClass(escaped: boolean | null): string {
  return outcomeToneStyles[escapeOutcomeTone(escaped)].label
}
