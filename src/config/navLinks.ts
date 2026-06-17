export type NavLink = {
  name: string
  to: string
  /** Iconify id — same sets as v1 (ph / mdi) */
  icon: string
  section?: "main" | "tools"
}

export const navLinks: NavLink[] = [
  { name: "Partidas", to: "/sessions", icon: "ph:puzzle-piece", section: "main" },
  { name: "Amigos", to: "/participants", icon: "ph:users-three", section: "main" },
  { name: "Dashboard", to: "/dashboard", icon: "mdi:chart-box", section: "main" },
  { name: "Dados", to: "/tools/dice", icon: "ph:cube", section: "tools" },
  { name: "Ruleta", to: "/tools/roulette", icon: "ph:poker-chip", section: "tools" },
  { name: "Cuenta atrás", to: "/tools/timer", icon: "mdi:timer-sand-empty", section: "tools" },
]
