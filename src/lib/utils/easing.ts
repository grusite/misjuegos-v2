export function quartIn(t: number): number {
  return t * t * t * t
}

export function quartOut(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
