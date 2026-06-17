# MisJuegos v2 — Agent Harness

**Read this file first** in every new agent session before writing code.

This repo is a ground-up rebuild of MisJuegos (private app at [misjuegos.net](https://misjuegos.net)).

**v1 Svelte MVP reference:** [`docs/V1_REFERENCE.md`](docs/V1_REFERENCE.md) — file map, what to reuse vs rewrite. Local path: `/Users/jorgemartin/repo/misjuegos-master` (or `../misjuegos-master` relative to this repo). Use v1 for **UX/behavior reference**, not blind code port.

---

## Current status

| Phase | Status | Description |
|-------|--------|-------------|
| **0** | ✅ Done | Vue 3 scaffold, Tailwind brand, Router + Pinia auth skeleton |
| **1** | ✅ Done | Supabase local, migrations, RLS, Google OAuth |
| **2** | ✅ Done | Repository layer (DbError, repos, mappers) |
| **3** | ✅ Done | App shell + v1 nav animations |
| **4** | ✅ Done | Participants migrations + UI |
| **5** | ✅ Done | Board games + sessions + messages + scores |
| **6** | ✅ Done | Escape rooms — create flow, detail panel, list filters |
| 7 | 🔜 Next | Dashboard |
| 8 | Pending | Import pipeline (Escape Babel spreadsheet) |
| 9 | Pending | Photos / Storage |
| 10 | Pending | Utilities (dice, roulette, timer) |
| 11 | Pending | Production cutover |

Full task breakdown: [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## Locked design decisions

These were agreed with Jorge — do not revisit without explicit approval:

1. **No anonymous login.** Google auth required. Non-account players are `participants` records, not guest sessions.
2. **Private group RLS.** All authenticated members can read shared data (small trusted group, not multi-tenant SaaS).
3. **`session_messages` table** — include in Phase 5 migrations (not deferred).
4. **`board_game_scores` table** — include now; Jorge has an Excel sheet with score data to import later.
5. **Fresh start.** No migration from v1 `board_games` data. Google Sheets/Drive are one-time import sources only.
6. **Catalog ≠ session.** `game_catalog` (what the game is) separate from `play_sessions` (a play instance). Escape rooms follow the same pattern.
7. **Repo location:** `/Users/jorgemartin/repo/misjuegos-v2`
8. **Local Supabase until prod.** Develop against `supabase start`; cloud project is for Phase 11 cutover only.
9. **Prod DNS:** `misjuegos.net` is on **Cloudflare** (Jorge manages DNS there).

---

## Infrastructure (prod — Phase 11)

| Item | Value |
|------|-------|
| Supabase cloud project | `misjuegos-v2` · ref `yyscffeexxtagilftrwo` |
| Domain | `misjuegos.net` (Cloudflare DNS) |
| Google OAuth client | Reuse existing **misjuegos** web client in Google Cloud |

OAuth redirect URIs to maintain on that client:

| Environment | Redirect URI |
|-------------|--------------|
| Local Supabase | `http://127.0.0.1:54321/auth/v1/callback` |
| Prod Supabase | `https://yyscffeexxtagilftrwo.supabase.co/auth/v1/callback` |
| v1 (legacy, remove when retired) | `https://zkvwwkkrcaocmimuolbv.supabase.co/auth/v1/callback` |


MisJuegos tracks games played with friends:

- **Board games** — BGG search, sessions, timer, outcomes, per-player scores, session chat messages
- **Escape rooms** — city, venue, room, clues, time, price, escaped/failed; imported from “Escape Babel” spreadsheet
- **Participants** — friends with or without accounts; alias matching for imports
- **Dashboard** — stats, charts, frequent partners
- **Utilities** — dice roller (Three.js), roulette, sand timer (Phase 10)

---

## Stack

| Layer | Choice |
|-------|--------|
| UI | Vue 3, TypeScript, Vite, Tailwind CSS 4 |
| State | Pinia (auth + UI global state only) |
| Routing | Vue Router |
| Backend | Supabase (Auth, Postgres, Storage, RLS) |
| Validation | Zod (forms + import rows) |
| Tests | Vitest + `@vue/test-utils` |
| Package manager | pnpm |
| Node | ≥ 20 (see `.nvmrc`) |

---

## Architecture rules

```
Views → Composables → Services/Repositories → Supabase
                ↓
         Pinia (auth, UI only — NOT a DB cache)
```

- **Views/components:** presentation only; no direct Supabase calls
- **Composables:** orchestrate UI logic, call services
- **Services/repositories:** typed Supabase access, mappers, `DbError`
- **Domain:** types + Zod schemas in `src/domain/`
- **Import logic:** isolated, testable modules under `src/services/import/`
- **Imports:** idempotent via `source_hash`; keep `source_raw` alongside normalized fields
- **RLS:** enabled from first migration

### Code style

- **Double quotes** for strings (Prettier)
- **camelCase** files/folders; **PascalCase** Vue components
- **Named exports** preferred
- Minimize scope — smallest correct diff; match existing conventions
- Comments only for non-obvious business logic
- Do not commit secrets (`.env`)
- When adding dependencies, always install the latest available version from the package manager (do not pin or invent older versions unless explicitly requested)

### File layout (target)

See [`docs/ROADMAP.md`](docs/ROADMAP.md#target-folder-structure) for the full tree. Key dirs:

- `src/services/` — repositories
- `src/composables/` — app logic
- `src/stores/` — Pinia (auth, ui)
- `src/domain/` — types + Zod
- `supabase/migrations/` — versioned SQL

---

## Brand & UX

| Token | Hex | Use |
|-------|-----|-----|
| dark | `#0f0e17` | Background |
| primary | `#facc15` | App chrome, nav, yellow actions |
| secondary | `#f25f4c` | Errors, destructive actions |
| board | `#38bdf8` | Board games theme |
| tertiary | `#e53170` | Escape rooms theme |

- Font: **Changa** (Google Fonts)
- Logo: `public/logo.svg`
- Style: playful but polished — bold borders, dashed outlines, primary yellow accents on dark bg
- UI language: **Spanish** (user-facing copy)
- **Mobile-first UX required.** Optimize layouts/interactions for phone usage first (touch targets, viewport fit, readable contrast), then adapt upwards.

### UI animations — MUST preserve from v1

v1 animations are documented in [`docs/UI_ANIMATIONS.md`](docs/UI_ANIMATIONS.md). Phase 3 must port them to Vue — do not replace with generic UI.

**Not yet ported** (Phase 0 uses a simplified nav):

- Circular clip-path menu reveal from hamburger origin
- Hamburger → X morph
- Home FAB slide-up + rotate for “Nueva partida”
- List slide transitions, roulette springs, timer sand SVG, 3D dice

Reference implementation: [`docs/V1_REFERENCE.md`](docs/V1_REFERENCE.md) · `../misjuegos-master/src/components/`

---

## Database

Full schema: [`docs/DATABASE.md`](docs/DATABASE.md)

Core tables: `profiles`, `participants`, `participant_aliases`, `game_catalog`, `board_game_details`, `escape_room_details`, `play_sessions`, `session_participants`, `session_messages`, `board_game_scores`, `escape_session_details`, `photos`, `import_runs`, `import_errors`

---

## How Jorge works — agent expectations

1. **Analyze before generating.** Jorge is an experienced developer — propose plans for large work; don't blindly codegen.
2. **Incremental, testable steps.** Each phase/task should be independently verifiable (`pnpm test`, `pnpm build`, manual smoke test).
3. **Suggest a commit message** when finishing a task/phase (Conventional Commits — see below).
4. **Do not commit** unless Jorge explicitly asks.
5. **Do not push** unless explicitly asked.
6. **Preserve UX intent** from v1, especially animations and playful layout.
7. **Update this harness** when locking new decisions or completing phases (status table, ROADMAP checkboxes).

---

## Conventional Commits

When completing work, suggest one commit message in this format:

```
<type>(<optional scope>): <short imperative summary>

[optional body — what and why, not line-by-line what]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`

**Examples:**

```
feat(auth): add Supabase Google OAuth and profile bootstrap
feat(db): add play_sessions and session_messages migrations with RLS
docs: add agent harness and cursor rules
chore: scaffold Vue 3 app with Tailwind brand tokens
```

---

## Commands

```bash
nvm use && pnpm install
pnpm dev          # http://localhost:5173
pnpm dev --host   # LAN URL for phone testing — see docs/LOCAL_MOBILE_TESTING.md
pnpm test
pnpm lint
pnpm build
pnpm ts
# Phase 1+:
pnpm db:types     # generate Supabase types from local DB
```

---

## Environment

Copy `.env.dist` → `.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_PROJECT_ID=
```

**Phone testing on LAN:** set `VITE_SUPABASE_URL` to `http://<LAN_IP>:54321`, run `pnpm dev --host`, transfer session from desktop — full steps in [`docs/LOCAL_MOBILE_TESTING.md`](docs/LOCAL_MOBILE_TESTING.md).

---

## Session checklist (agents)

Before marking work done:

- [ ] `pnpm test` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] No secrets committed
- [ ] UI matches brand tokens and Spanish copy where applicable
- [ ] Architecture layers respected (no Supabase in views)
- [ ] Suggested commit message provided to Jorge
- [ ] Update `AGENTS.md` status / `docs/ROADMAP.md` if phase completed
