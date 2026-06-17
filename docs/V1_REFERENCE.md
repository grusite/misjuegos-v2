# MisJuegos v1 — Reference Guide

The original Svelte MVP is **not** the codebase to extend — it is the **behavioral and UX reference** for v2.

## Location

| | Path |
|---|------|
| **Local (Jorge's machine)** | `/Users/jorgemartin/repo/misjuegos-master` |
| **Relative from v2** | `../misjuegos-master` |

If the v1 repo is not cloned locally, agents should ask Jorge before guessing UX behavior.

---

## What to reuse from v1

| Area | Reuse | v1 location |
|------|-------|-------------|
| Brand / logo | Copy assets | `public/logo.svg` |
| Color palette | Same tokens | `tailwind.config.cjs` |
| UI animations | Port to Vue | See [`UI_ANIMATIONS.md`](UI_ANIMATIONS.md) |
| BGG integration | Same API logic | `src/lib/boardGameGeekAPI.ts` |
| Session flow UX | Same steps | `src/components/views/Home/NewBoardGame.svelte` |
| Game detail UX | Timer, outcome, players, messages | `src/components/views/BoardGame/` |
| Friends UX | Search + add unregistered player | `src/components/views/Friends/` |
| Dashboard metrics | Same stat ideas | `src/lib/db/index.ts` → `getDashboardStats` |
| Date/time formatting | Port utils | `src/lib/utils/index.ts` |
| Dice / roulette / timer | Port in Phase 10 | `src/components/views/Dices/`, `Roulette/`, `Timer/` |

## What NOT to reuse from v1

| Area | Why | v1 location |
|------|-----|-------------|
| Anonymous login | Dropped — use `participants` | `src/lib/auth.ts`, `src/components/views/Login/` |
| `board_games` as catalog+session | Split in v2 schema | `src/types/Database.ts` |
| `db/index.ts` monolith | Replace with services | `src/lib/db/index.ts` (~1000 lines) |
| Friend matrix (8 CRUD variants) | Simplified participants model | `src/lib/db/index.ts` |
| JSONB messages on board_games | Normalized `session_messages` table | `BoardGameSerializer.ts` |
| Direct Supabase in Svelte views | Views → composables → services | Most `*.svelte` views |
| Svelte components | Rewrite in Vue 3 | All of `src/components/` |

---

## v1 feature → file map

Use this when implementing a v2 feature to understand existing behavior.

### Auth & users

| Feature | v1 files |
|---------|----------|
| Google OAuth | `src/lib/auth.ts`, `src/lib/supabase.ts` |
| Anonymous login (deprecated) | `src/lib/auth.ts`, `Login.svelte`, `LinkAccountsDialog.svelte` |
| User avatars | `src/components/common/UserAvatar.svelte`, `UserAvatarGroup.svelte` |

### Sessions (board games)

| Feature | v1 files |
|---------|----------|
| Session list + FAB | `src/components/views/Home/Home.svelte` |
| Create session (BGG search → pick friends) | `src/components/views/Home/NewBoardGame.svelte` |
| BGG search result card | `src/components/views/BoardGame/GameItem.svelte` |
| Session list card | `src/components/common/BoardGameCard.svelte` |
| Session detail page | `src/components/views/BoardGame/Game.svelte` |
| Timer, outcome, edit metadata | `src/components/views/BoardGame/GameDetails.svelte` |
| In-session timer widget | `src/components/views/BoardGame/GameTimer.svelte` |
| Session chat messages | `src/components/views/BoardGame/GameMessages.svelte` |
| Add/remove players | `GameDetails.svelte`, `UserSearchDialog.svelte` |

### Friends

| Feature | v1 files |
|---------|----------|
| Friend list + search | `src/components/views/Friends/Friends.svelte` |
| Friend row | `src/components/views/Friends/FriendItem.svelte` |

### Dashboard

| Feature | v1 files |
|---------|----------|
| Stats page | `src/components/views/Dashboard/Dashboard.svelte` |
| Stat card | `StatCard.svelte` |
| Charts | `TopGamesChart.svelte`, `PlayingTrendsChart.svelte`, `PlayerStatsTable.svelte` |
| Query logic | `src/lib/db/index.ts` → `getDashboardStats` and helpers |

### Layout & navigation

| Feature | v1 files |
|---------|----------|
| Routes | `src/components/layout/MainLayout.svelte` |
| Top bar + hamburger | `src/components/layout/TopBar.svelte`, `Hamburger.svelte` |
| Circular nav menu | `src/components/layout/Menu.svelte` |
| App entry + auth gate | `src/App.svelte` |

### Utilities

| Feature | v1 files |
|---------|----------|
| 3D dice | `src/lib/utils/dice/`, `src/components/views/Dices/` |
| Roulette | `src/components/views/Roulette/Roulette.svelte` |
| Sand timer | `src/components/views/Timer/Timer.svelte` |

### Data layer (reference only — rewrite in v2)

| Concern | v1 files |
|---------|----------|
| All DB queries + realtime + dashboard | `src/lib/db/index.ts` |
| Serializers | `src/lib/db/serializers/*.ts` |
| Generated types | `src/types/Database.ts` |
| BGG client | `src/lib/boardGameGeekAPI.ts` |

---

## v1 database model (for comparison)

```
anonymous_users
board_games          ← catalog + session merged (messages JSONB, timer state)
user_board_games     ← players per session
friends              ← complex user/anonymous FK matrix
users                ← view on auth.users
```

v2 replaces this with `game_catalog`, `play_sessions`, `session_participants`, `participants`, `session_messages`, etc. See [`DATABASE.md`](DATABASE.md).

---

## How agents should use this

1. Read the v2 spec in `AGENTS.md` / `docs/DATABASE.md` first.
2. When implementing a feature, open the matching v1 files above to understand **UX flow and edge cases**.
3. Port **behavior and motion**, not Svelte syntax or the old schema.
4. For animations, follow [`UI_ANIMATIONS.md`](UI_ANIMATIONS.md) with v1 as the visual source of truth.
