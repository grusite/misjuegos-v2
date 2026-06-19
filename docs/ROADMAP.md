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

## Phase 9 — Player teams ✅

Reusable groups of participants for fast session setup (same crew every week, escape group, etc.).

**Placement:**

- Route: `/teams` (nav near Participantes)
- Used when creating sessions: “Seleccionar equipo” fills participant checkboxes in one tap
- Team photo stored via Storage (Phase 11) — schema ready now, upload UI can land with photos phase

**Tasks:**

- [x] Migration: `player_teams`, `player_team_members` (+ RLS)
- [x] `playerTeamsRepository` + Zod schemas
- [x] Teams list + create/edit UI (name, description, member multi-select)
- [x] Team card with avatar grid or single team image placeholder
- [x] Hook into new session flows (`useSessions`, escape create): pick team → pre-select members

## Phase 10 — Import pipeline ✅

One-time historical import from Escape Babel (and future sources). **Prefer CSV + local files over live Google APIs** for the initial cutover.

**Import strategy (agreed direction):**

- Export spreadsheet to **CSV** locally → place in repo (e.g. `data/import/escape-babel.csv`) or pass path to CLI
- Run a **Node script** (`pnpm import:escapes` or similar): parse → Zod validate → idempotent upsert via `source_hash`
- **No v1 DB migration**; Sheets/Drive are one-time sources only (see locked decisions in `AGENTS.md`)
- Optional later: Google Sheets fetch for re-runs — not required for first import
- **Pictures:** download from Drive to a local folder → separate upload script (Phase 11) or import script that uploads to Storage and links `photos` rows; no need for Drive API if files are local

**Tasks:**

- [x] Migrations: `import_runs` + `import_errors`
- [x] Zod schema + parser for Escape Babel CSV columns
- [x] Alias resolver (`Participantes` string → `participants` / `participant_aliases`)
- [x] Idempotent importer (`source_hash`, keep `source_raw`)
- [x] CLI script: read CSV path, dry-run + commit modes, summary report
- [x] Bootstrap friends + aliases from CSV catalog (incl. alias merges)
- [x] Bootstrap teams: **Babel 4**, **Primos**
- [x] CLI `--fresh` one-shot (reset data + bootstrap + import)

## Phase 11 — Account linking ✅

On **first Google login only** (not every session):

- [x] Modal: “¿Eres alguno de estos amigos?” — suggest `participants` matched by display name / Google name
- [x] Confirm → link `participants.profile_id` to reuse imported sessions and stats
- [x] Decline → create a new participant for this account
- [x] Persist “already asked” flag on profile so the prompt never repeats

## Phase 12 — Session list filters ✅

Richer filtering on the home sessions list (`SessionsView`) — today only type chips exist (Todas / Juegos de mesa / Escape rooms).

**Filters to add:**

- **Search** — text box; match game title (and escape city/venue if useful)
- **Yo** — sessions where the logged-in user’s linked `participant` appears in `session_participants` (pairs with Phase 11 account linking)
- **Jugador** — pick one or more participants; show sessions they joined
- **Equipo** — pick a `player_team`; match sessions with that `player_team_id`
- **Fechas** — date range and/or presets (este mes, este año, etc.) on `played_at`

**Implementation notes:**

- Sessions are paginated (`SESSIONS_PAGE_SIZE`); filters that need full history should push criteria into `sessionsRepository.listSessions` (server-side), not only client-side on the loaded page
- Combine filters with existing type chips; clear-all / active-filter chips for mobile
- Persist last-used filters in UI store or URL query params (optional — decide during implementation)

**Tasks:**

- [x] Extend `listSessions` query: participant ids, `player_team_id`, date range, title search (ilike)
- [x] Composable: filter state + debounced search; reset pagination when filters change
- [x] Mobile-first filter bar / expandable panel on home
- [x] “Yo” shortcut chip (hidden or disabled until participant is linked to profile)
- [x] Participant + team pickers (reuse existing participant/team data from `useSessions`)
- [x] Date range UI (native date inputs or preset chips)
- [x] Empty state copy when no sessions match filters
- [x] Unit tests for filter → query mapping

## Phase 13 — Photos / Storage ✅

- [x] Storage bucket + RLS
- [x] Upload composable + gallery (sessions)
- [x] **Local batch script:** upload folder of images from disk → Storage paths + `photos` rows
- [x] Media library (`/media`) — upload without session; filter unassigned vs linked
- [x] Wishlist photos — `desired_game_id` on `photos`, upload from **Quiero jugar** cards
- [ ] Link library photo → session or wishlist from UI (future — repo `link()` ready)
- [ ] When marking wishlist item **Jugado** and creating a session, carry/link existing photos (future)
- [ ] Google Drive one-time migration script (optional — only if local download is impractical)

## Phase 14 — Utilities (next)

- [ ] Roulette (CSS/spring — port from v1)
- [ ] Sand timer SVG animation
- [ ] 3D dice roller (Three.js + Cannon — lazy route)

## Phase 15 — Game ratings

Personal ratings for played games — **escape rooms first** (typically one play per room; rating captures how much you enjoyed the experience).

**Scale (decide before implementation):**

- **Recommended for escapes:** **1–5 stars** (half-steps optional) — familiar from booking/review sites, quick to tap on mobile
- **Alternative:** 1–10 integer — closer to BGG; better if you want one scale for board games later
- Store as `smallint` either way; UI can show stars or numeric label

**Placement:**

- Escape: `rating` on `escape_session_details` (rate the play session / room experience)
- Board games (optional, later): same pattern on session or catalog — lower priority since replays are common

**Tasks:**

- [ ] Migration: `rating` column on `escape_session_details` (+ optional `rating_note` text)
- [ ] Zod + repository update for escape session create/edit
- [ ] Star (or numeric) picker in escape create flow + detail panel
- [ ] Escape session list: show rating at a glance; sort/filter by rating (optional)
- [ ] Dashboard: average escape rating, top-rated rooms (optional)
- [ ] Board game ratings (stretch — only if Jorge wants parity with BGG-style scoring)

## Phase 16 — Production cutover

One-time migration to cloud Supabase + `misjuegos.net`. **Full ordered checklist:** [`data/import/README.md`](../data/import/README.md#production-cutover-checklist-phase-16).

Summary (do not skip):

1. Apply all migrations to prod (`supabase db push`)
2. Confirm Storage bucket `session-photos`
3. Prod Google OAuth + first login → `IMPORT_USER_ID`
4. `pnpm import:escapes --fresh data/import/escape-babel.csv`
5. `pnpm import:board-games data/import/board-games.csv`
6. `pnpm import:wishlist data/import/escape-wishlist.csv`
7. `pnpm upload:photos …` (local `data/import/photos/` → Supabase Storage)
8. Smoke test prod
9. Deploy frontend with prod env
10. Cloudflare DNS cutover

- [ ] Checklist completed (see import README)
- [ ] Deploy misjuegos.net
- [ ] Retire v1 Supabase project when satisfied

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
