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

Repositories use `AppDatabase` (`src/domain/types/schema.ts`) for tables not yet migrated; after Phase 4/5 migrations run `pnpm db:types` and trim `PendingTables` from `rows.ts` when generated types include them.

## Phase 3 — App shell + animations ✅

- [x] Port circular clip-path nav (`Menu.svelte` → `NavDrawer.vue`)
- [x] Port hamburger morph (`HamburgerButton.vue`)
- [x] TopBar with backdrop blur (`AppTopBar.vue`)
- [x] Route stubs for all nav items
- [x] See [`UI_ANIMATIONS.md`](UI_ANIMATIONS.md) — items 1–3 done; FAB (4) in Phase 5

## Phase 4 — Participants

- [ ] Migrations: participants + aliases + RLS
- [ ] Participants list/search UI
- [ ] Add/edit form (Zod)
- [ ] Alias management

## Phase 5 — Board game flow

- [ ] Migrations: catalog, board_game_details, play_sessions, session_participants
- [ ] Migrations: **session_messages**, **board_game_scores**
- [ ] BGG service (`services/bgg/`)
- [ ] New session flow (BGG search + manual + pick participants)
- [ ] Sessions list + detail
- [ ] Session timer composable
- [ ] Outcome toggle + session messages UI
- [ ] Board game scores UI
- [ ] Port Home FAB slide animation for “Nueva partida”

## Phase 6 — Escape rooms

- [ ] Migrations: escape_room_details + escape_session_details
- [ ] New escape session form
- [ ] Escape detail panel (clues, time, price, escaped)
- [ ] Catalog browse + session list filters

## Phase 7 — Dashboard

- [ ] `dashboardRepository.getStats`
- [ ] Stat cards, charts (top games, trends, partners)
- [ ] Escape room stats section

## Phase 8 — Import pipeline

- [ ] Migrations: import_runs + import_errors
- [ ] Zod schema + parser for Escape Babel columns
- [ ] Alias resolver (Participantes string → participants)
- [ ] Idempotent importer (`source_hash`)
- [ ] CLI/script for CSV + optional Google Sheets fetch
- [ ] Import debug UI

## Phase 9 — Photos

- [ ] Storage bucket + RLS
- [ ] Upload composable + gallery
- [ ] Google Drive one-time migration script

## Phase 10 — Utilities

- [ ] Roulette (CSS/spring — port from v1)
- [ ] Sand timer SVG animation
- [ ] 3D dice roller (Three.js + Cannon — lazy route)

## Phase 11 — Production

- [ ] Apply migrations to prod Supabase
- [ ] Run Escape Babel import
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
│   │   ├── catalog/
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
