# MisJuegos v2 — Phased Roadmap

Each task should be independently testable before moving on. Jorge approves plans before large implementation bursts.

## Phase 0 — Scaffold ✅

- [x] Vue 3 + Vite + TypeScript in `misjuegos-v2`
- [x] Tailwind 4 + brand tokens (Changa, palette)
- [x] `public/logo.svg`, title MisJuegos
- [x] Path alias `@/`, ESLint, Prettier (double quotes)
- [x] Vitest + `@vue/test-utils`
- [x] Vue Router + Pinia auth skeleton (mock login)

## Phase 1 — Supabase foundation

- [x] `supabase init` + local dev (`supabase start`)
- [x] Migrations: enums, `profiles`, signup trigger
- [x] Migrations: RLS on profiles
- [x] `supabaseClient.ts` + `.env`
- [x] `pnpm db:types` script
- [x] Real Google OAuth via Supabase Auth
- [x] Replace `loginMock` with real auth flow

## Phase 2 — Repository layer ✅

- [x] `services/errors.ts` (DbError)
- [x] `participantsRepository` + tests
- [x] `participantAliasesRepository`
- [x] `catalogRepository`
- [x] `sessionsRepository`
- [x] Domain mappers

Repositories use `AppDatabase` (`src/domain/types/schema.ts`) for tables not yet migrated; after Phase 5 migrations run `pnpm db:types` and trim `PendingTables` from `rows.ts` when generated types include them.

## Phase 3 — App shell + animations ✅

- [x] Port circular clip-path nav (`Menu.svelte` → `NavDrawer.vue`)
- [x] Port hamburger morph (`HamburgerButton.vue`)
- [x] TopBar with backdrop blur (`AppTopBar.vue`)
- [x] Route stubs for all nav items
- [x] See [`UI_ANIMATIONS.md`](UI_ANIMATIONS.md) — items 1–3 done; FAB (4) in Phase 5

## Phase 4 — Participants ✅

- [x] Migrations: participants + aliases + RLS
- [x] Participants list/search UI
- [x] Add/edit form (Zod)
- [x] Alias management

## Phase 5 — Board game flow ✅

- [x] Migrations: catalog, board_game_details, play_sessions, session_participants
- [x] Migrations: **session_messages**, **board_game_scores**
- [x] BGG service (`services/bgg/`)
- [x] New session flow (BGG search + manual + pick participants)
- [x] Sessions list + detail
- [x] Session timer composable
- [x] Outcome toggle + session messages UI
- [x] Board game scores UI
- [x] Port Home FAB slide animation for “Nueva partida”

## Phase 6 — Escape rooms ✅

- [x] Migrations: escape_room_details + escape_session_details
- [x] New escape session form
- [x] Escape detail panel (clues, time, price, escaped)
- [x] Catalog browse + session list filters

## Phase 7 — Dashboard ✅

- [x] `dashboardRepository.getStats`
- [x] Stat cards, charts (top games, trends, partners)
- [x] Escape room stats section

## Phase 8 — Desired games (wishlist) ✅

Personal “want to play” list — board games and escape rooms you haven’t played yet, useful for planning and booking.

**Placement:**

- Route: `/wishlist` (nav: “Quiero jugar”)
- Separate from `game_catalog` / `play_sessions` — wishlist items are intentions, not played history
- Optional later: “Convert to session” when you actually play one

**Tasks:**

- [x] Migration: `desired_games` (+ RLS)
- [x] `desiredGamesRepository` + Zod schemas
- [x] List UI with filters (chips: Todos / Juegos / Escapes)
- [x] Add/edit form (manual entry; BGG search reuse for board games)
- [x] Mobile-first cards (notes, city/venue visible at a glance for escapes)

## Phase 9 — Player teams (next)

Reusable groups of participants for fast session setup (same crew every week, escape group, etc.).

**Placement (proposed):**

- Route: `/teams` (nav near Participantes)
- Used when creating sessions: “Seleccionar equipo” fills participant checkboxes in one tap
- Team photo stored via Storage (Phase 11) — schema ready now, upload UI can land with photos phase or a minimal upload here

**Tasks:**

- [ ] Migration: `player_teams`, `player_team_members` (+ RLS)
  - Team: `name`, `description`, `photo_path` (nullable until Storage), `created_by`
  - Members: `team_id`, `participant_id` (FK → participants)
- [ ] `playerTeamsRepository` + Zod schemas
- [ ] Teams list + create/edit UI (name, description, member multi-select)
- [ ] Team card with avatar grid or single team image placeholder
- [ ] Hook into new session flows (`useSessions`, escape create): pick team → pre-select members

## Phase 10 — Import pipeline

One-time historical import from Escape Babel (and future sources). **Prefer CSV + local files over live Google APIs** for the initial cutover.

**Import strategy (agreed direction):**

- Export spreadsheet to **CSV** locally → place in repo (e.g. `data/import/escape-babel.csv`) or pass path to CLI
- Run a **Node script** (`pnpm import:escapes` or similar): parse → Zod validate → idempotent upsert via `source_hash`
- **No v1 DB migration**; Sheets/Drive are one-time sources only (see locked decisions in `AGENTS.md`)
- Optional later: Google Sheets fetch for re-runs — not required for first import
- **Pictures:** download from Drive to a local folder → separate upload script (Phase 11) or import script that uploads to Storage and links `photos` rows; no need for Drive API if files are local

**Tasks:**

- [ ] Migrations: `import_runs` + `import_errors`
- [ ] Zod schema + parser for Escape Babel CSV columns
- [ ] Alias resolver (`Participantes` string → `participants` / `participant_aliases`)
- [ ] Idempotent importer (`source_hash`, keep `source_raw`)
- [ ] CLI script: read CSV path, dry-run + commit modes, summary report
- [ ] Import debug UI (optional — view last run, errors, row counts)

## Phase 11 — Photos / Storage

- [ ] Storage bucket + RLS
- [ ] Upload composable + gallery (sessions, teams, etc.)
- [ ] **Local batch script:** upload folder of images from disk → Storage paths + `photos` rows (pairs with Phase 10 CSV import)
- [ ] Google Drive one-time migration script (optional — only if local download is impractical)

## Phase 12 — Utilities

- [ ] Roulette (CSS/spring — port from v1)
- [ ] Sand timer SVG animation
- [ ] 3D dice roller (Three.js + Cannon — lazy route)

## Phase 13 — Production

- [ ] Apply migrations to prod Supabase
- [ ] Run Escape Babel CSV import + photo batch upload
- [ ] Deploy misjuegos.net
- [ ] README setup verified on fresh clone

---

## Target folder structure

```
misjuegos-v2/
├── public/logo.svg
├── supabase/migrations/
├── src/
│   ├── assets/styles/main.css
│   ├── components/ui/
│   ├── components/layout/
│   ├── composables/
│   ├── domain/types/
│   ├── domain/schemas/
│   ├── lib/
│   ├── router/
│   ├── services/
│   │   ├── profiles/
│   │   ├── participants/
│   │   ├── playerTeams/
│   │   ├── catalog/
│   │   ├── desiredGames/
│   │   ├── sessions/
│   │   ├── dashboard/
│   │   ├── bgg/
│   │   ├── import/
│   │   └── storage/
│   ├── stores/
│   └── views/
├── tests/unit/
├── AGENTS.md
└── docs/
```
