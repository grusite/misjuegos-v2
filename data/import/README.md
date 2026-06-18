# Escape Babel CSV import

Place your exported spreadsheet here: `escape-babel.csv`

## One-shot import (recommended)

Creates friends + aliases + teams **Babel 4** and **Primos**, then imports all escape sessions.

```bash
# Set in .env:
# IMPORT_USER_ID=<your profiles.id — see below>
# SUPABASE_SERVICE_ROLE_KEY=<from supabase status>

pnpm import:escapes --fresh data/import/escape-babel.csv
```

`--fresh` wipes app data (participants, sessions, teams) but **keeps your Google login / profile**.

## `IMPORT_USER_ID` — what is it?

The UUID of **your** row in `public.profiles` (the Google account that owns the imported data).

- Sessions and participants are created with `created_by = IMPORT_USER_ID`.
- On bootstrap, the friend **Jorge** is linked to this profile (`participants.profile_id`).
- **Yes — use your own profile id** (Jorge’s Google account after logging in once locally).

### How to get it

**Option A — Supabase Studio (easiest)**

Studio ships with local Supabase. If you have not started it yet:

```bash
nvm use
supabase start          # first run downloads Docker images; needs Docker Desktop running
supabase status         # look for "Studio URL" → usually http://127.0.0.1:54323
```

Open that URL in the browser → **Table Editor** → `profiles` → copy your row’s `id`.

**Option B — SQL in the terminal**

```bash
supabase start
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "select id, display_name from profiles;"
```

**Option C — CLI helper (no browser)**

```bash
pnpm import:list-profiles
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env` (from `supabase status`).

Put it in `.env`:

```
IMPORT_USER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## Other commands

```bash
# Preview friends and teams that will be created
pnpm import:list-participants

# Dry-run (no DB writes)
IMPORT_USER_ID=<uuid> pnpm import:escapes --dry-run data/import/escape-babel.csv

# Reset only (no import) — requires local Supabase running (`supabase start`)
pnpm db:reset-data
```

## Alias merges (automatic)

| CSV tokens | One friend |
|------------|------------|
| edu, eduardo, edush | Eduardo |
| pili, pilar | Pilar |
| ire, irene | Irene |

## Import teams (automatic)

| Team | Members |
|------|---------|
| Babel 4 | Jorge, Eduardo, Diego, Javi |
| Primos | Unai, Vity, Jorge, Diego |

CSV row `Primos (Unai, Vity, Jorge, Diego)` resolves to team **Primos**.

Unknown tokens (e.g. `serapio`, `mario`) become friends with capitalized names.

## Google login → link friend

Planned for **Phase 11** (see `docs/ROADMAP.md`): on **first Google login only**, show a modal suggesting existing friends by name — link profile to reuse historical games, or create a new participant. Not needed to run the historical import.

Import is **CLI-only** (`pnpm import:escapes`); there is no in-app import screen.

# Board games historical import

Additive import — does **not** wipe escape data. Run after `pnpm import:escapes` if you already imported escapes.

```bash
pnpm import:board-games data/import/board-games.csv
```

## CSV columns

| Column | Maps to |
|--------|---------|
| Juego | `game_catalog.title` |
| Expansión | `board_game_details.expansion` |
| Fecha | `play_sessions.played_at` (default `20/04/2023` if empty) |
| Veces jugadas | Number of `play_sessions` rows created |
| Ratio (éxito/fracaso) | Split into `win` / `loss` / `unknown` outcomes |
| Observaciones | `play_sessions.notes` (same on every session from the row) |
| Personajes | `board_session_details.players` (co-op character picks) |
| Jugadores | `session_participants` (empty → team **Babel 4**) |

## Example ratios

- `2 perdidas 2 ganadas` → 4 sessions (2 loss, 2 win)
- `14 ganadas?` with `15?` plays → 14 wins, 1 loss
- `4 ganadas?` with `7?` plays → 4 wins, 3 losses
- `??` with `5?` plays → 5 sessions with `unknown` outcome

Creates **Elena** if missing. Maps **Diegas** → Diego.

## Wishlist import ("Quiero jugar")

Additive import for escape room wishlist entries (`desired_games`).

```bash
pnpm import:wishlist data/import/escape-wishlist.csv
```

CSV columns: `title`, `company`, `city`, `venue`, `booking_url`, `notes`

- URLs go in `booking_url` (title can be the room name)
- Barcelona section entries use `city=Barcelona` and `venue` for neighbourhood
- Idempotent via `source_hash` — safe to re-run

Edit `data/import/escape-wishlist.csv` to add more rows later.

