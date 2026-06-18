/** Import-time player teams (created by bootstrap, resolved in CSV rows). */

export type ImportTeamDefinition = {
  token: string
  name: string
  description: string
  memberKeys: string[]
}

export const BABEL_4_TEAM_TOKEN = "babel 4"
export const PRIMOS_TEAM_TOKEN = "primos"

export const ESCAPE_BABEL_IMPORT_TEAMS: ImportTeamDefinition[] = [
  {
    token: BABEL_4_TEAM_TOKEN,
    name: "Babel 4",
    description: "Equipo habitual del Escape Babel",
    memberKeys: ["jorge", "eduardo", "diego", "javi"],
  },
  {
    token: PRIMOS_TEAM_TOKEN,
    name: "Primos",
    description: "Primos (Unai, Vity, Jorge, Diego)",
    memberKeys: ["unai", "vity", "jorge", "diego"],
  },
]

const teamTokens = new Set(
  ESCAPE_BABEL_IMPORT_TEAMS.map(team => team.token),
)

export function isImportTeamToken(token: string): boolean {
  return teamTokens.has(token)
}
