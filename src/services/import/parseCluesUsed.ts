export function parseCluesUsed(value: string | undefined): number | null {
  if (!value?.trim()) return null

  const trimmed = value.trim().toLowerCase()

  const plusFraction = /^(\d+)\+(\d+)\/(\d+)/.exec(trimmed)
  if (plusFraction) {
    const base = Number.parseInt(plusFraction[1], 10)
    const numerator = Number.parseInt(plusFraction[2], 10)
    const denominator = Number.parseInt(plusFraction[3], 10)
    if (denominator === 0) return base
    return Math.round(base + numerator / denominator)
  }

  const range = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/.exec(trimmed)
  if (range) {
    const low = Number.parseFloat(range[1])
    const high = Number.parseFloat(range[2])
    if (Number.isFinite(low) && Number.isFinite(high)) {
      return Math.round((low + high) / 2)
    }
  }

  const leadingNumber = /^(\d+(?:\.\d+)?)/.exec(trimmed)
  if (leadingNumber) {
    return Math.round(Number.parseFloat(leadingNumber[1]))
  }

  return null
}
