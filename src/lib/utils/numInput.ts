export function stepNumInput(
  current: number,
  direction: "inc" | "dec",
  options: { min: number; max: number; skip?: number },
): number {
  const skip = options.skip ?? -1
  let next = direction === "inc" ? current + 1 : current - 1
  next = Math.max(options.min, Math.min(options.max, next))

  if (next === skip) {
    return stepNumInput(next, direction, options)
  }

  return next
}
