# MisJuegos v2

Rebuild of [MisJuegos](https://misjuegos.net) — track board game and escape room sessions with friends.

> **Agents:** read [`AGENTS.md`](AGENTS.md) first. This repo uses harness engineering — context for humans and AI lives there.

## Stack

Vue 3 · TypeScript · Vite · Tailwind CSS 4 · Pinia · Vue Router · Supabase · Vitest

## Quick start

```bash
nvm use
pnpm install
cp .env.dist .env   # Supabase vars — Phase 1
pnpm dev
```

Open http://localhost:5173 → login screen → **Entrar con Google**.

### Supabase local

```bash
# Requires Docker (Colima, Docker Desktop, etc.)
cp .env.dist .env
# Add Google OAuth credentials to .env (see below)
supabase start
pnpm dev
```

Google OAuth setup:

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
3. Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` in `.env`
4. Restart Supabase: `supabase stop && supabase start`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm test` | Unit tests |
| `pnpm lint` | ESLint |
| `pnpm ts` | Typecheck |
| `pnpm db:types` | Regenerate Supabase types from local DB |

## Docs

| File | Contents |
|------|----------|
| [`AGENTS.md`](AGENTS.md) | Agent harness — decisions, architecture, workflow |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phased rebuild plan |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Supabase schema |
| [`docs/V1_REFERENCE.md`](docs/V1_REFERENCE.md) | v1 Svelte MVP — file map & what to reuse |

## Status

**Phase 3 ✅** — App shell: hamburger morph, circular nav reveal, route stubs.

**Phase 4 🔜** — Participants.

| [`docs/UI_ANIMATIONS.md`](docs/UI_ANIMATIONS.md) | v1 animations to preserve |

## v1 reference

Svelte MVP at `/Users/jorgemartin/repo/misjuegos-master` — see [`docs/V1_REFERENCE.md`](docs/V1_REFERENCE.md) for feature → file mapping.

## Brand

| Token | Hex |
|-------|-----|
| dark | `#0f0e17` |
| primary | `#facc15` |
| secondary | `#f25f4c` |
| tertiary | `#e53170` |

Logo: `public/logo.svg` · Font: Changa
