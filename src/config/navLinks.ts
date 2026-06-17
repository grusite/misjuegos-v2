export type NavLink = {
  name: string
  to: string
  /** Iconify id — same sets as v1 (ph / mdi) */
  icon: string
}

export const navLinks: NavLink[] = [
  { name: "Partidas", to: "/", icon: "ph:puzzle-piece" },
  { name: "Amigos", to: "/participants", icon: "ph:users-three" },
  { name: "Dados", to: "/dices", icon: "ph:cube" },
  { name: "Ruleta", to: "/roulette", icon: "ph:poker-chip" },
  { name: "Cuenta atrás", to: "/timer", icon: "mdi:timer-sand-empty" },
  { name: "Dashboard", to: "/dashboard", icon: "mdi:chart-box" },
]
