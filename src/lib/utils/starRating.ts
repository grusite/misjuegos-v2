export type StarIconKind = "full" | "half" | "empty"

export function isHalfStepRating(value: number): boolean {
  return value >= 1 && value <= 5 && value * 2 === Math.trunc(value * 2)
}

export function getStarIcons(rating: number): StarIconKind[] {
  const stars: StarIconKind[] = []

  for (let index = 1; index <= 5; index += 1) {
    if (rating >= index) {
      stars.push("full")
    } else if (rating >= index - 0.5) {
      stars.push("half")
    } else {
      stars.push("empty")
    }
  }

  return stars
}

export function formatStarRating(rating: number): string {
  return Number.isInteger(rating) ? String(rating) : rating.toFixed(1).replace(".", ",")
}
