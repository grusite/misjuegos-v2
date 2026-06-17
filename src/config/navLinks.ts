export type NavLink = {
  name: string
  to: string
  icon:
    | "games"
    | "friends"
    | "dices"
    | "roulette"
    | "timer"
    | "dashboard"
}

export const navLinks: NavLink[] = [
  { name: "Partidas", to: "/", icon: "games" },
  { name: "Amigos", to: "/participants", icon: "friends" },
  { name: "Dados", to: "/dices", icon: "dices" },
  { name: "Ruleta", to: "/roulette", icon: "roulette" },
  { name: "Cuenta atrás", to: "/timer", icon: "timer" },
  { name: "Dashboard", to: "/dashboard", icon: "dashboard" },
]
