# MisJuegos v2 — Database Schema

Supabase PostgreSQL. All tables use RLS. Migrations live in `supabase/migrations/`.

## Enums

```sql
game_type       -- 'board_game' | 'escape_room'
session_status  -- 'planned' | 'in_progress' | 'completed' | 'abandoned'
session_outcome -- 'win' | 'loss' | 'draw' | 'unknown' | 'escaped' | 'failed'
desired_game_status -- 'active' | 'played' | 'dropped'
import_source   -- 'google_sheets' | 'google_drive' | 'manual'
import_status   -- 'pending' | 'running' | 'completed' | 'failed'
photo_source    -- 'upload' | 'google_drive' | 'import'
```

## Tables

### profiles
Extends `auth.users`. Created via trigger on signup.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users |
| display_name | text | |
| avatar_url | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### participants
People without (or before) an account.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_id | uuid FK → profiles | Who manages this record |
| profile_id | uuid FK → profiles NULL | Linked when they sign up |
| display_name | text | |
| color | text NULL | Avatar fallback |
| created_at | timestamptz | |

### participant_aliases
Import name matching (`Participantes` column, etc.).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| participant_id | uuid FK | |
| alias | text | Normalized (lowercase, no accents) |
| source | text NULL | `'import'` \| `'manual'` |

UNIQUE(participant_id, alias)

### game_catalog
Shared catalog entry — board game or escape room.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| type | game_type | |
| title | text | |
| slug | text NULL | |
| created_by | uuid FK → profiles | |
| created_at | timestamptz | |
| source | text NULL | |
| source_external_id | text NULL | |

Partial UNIQUE(type, source, source_external_id) where not null.

### board_game_details (1:1, type = board_game)

| Column | Type |
|--------|------|
| game_catalog_id | uuid PK |
| bgg_id | int NULL |
| expansion_of_id | uuid NULL → game_catalog |
| min_players, max_players | int NULL |
| playing_time_min | int NULL |
| thumbnail_url | text NULL |
| year_published | int NULL |
| raw_bgg | jsonb NULL |

### escape_room_details (1:1, type = escape_room)

| Column | Type |
|--------|------|
| game_catalog_id | uuid PK |
| city | text NULL |
| venue | text NULL | Sitio |
| room_name | text NULL | Sala |
| company | text NULL |

### desired_games (Phase 8)

Personal wishlist — games/escapes you want to play, separate from catalog and sessions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| type | game_type | board_game \| escape_room |
| title | text | |
| notes | text NULL | |
| priority | smallint NULL | 1–3 optional |
| city, venue, company | text NULL | Escape-specific |
| booking_url | text NULL | |
| bgg_id | int NULL | Board-game BGG link |
| game_catalog_id | uuid NULL FK | Optional link to catalog |
| status | desired_game_status | default active |
| created_by | uuid FK → profiles | |
| created_at, updated_at | timestamptz | |

### play_sessions
A single play instance.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| game_catalog_id | uuid FK | |
| created_by | uuid FK → profiles | |
| played_at | timestamptz | |
| status | session_status | |
| outcome | session_outcome NULL | |
| duration_ms | int default 0 | |
| is_paused | boolean | Live timer |
| last_started_at | timestamptz NULL | |
| ended_at | timestamptz NULL | |
| notes | text NULL | |
| source | text NULL | |
| source_hash | text NULL UNIQUE | Idempotent imports |
| source_raw | jsonb NULL | Original row |
| created_at, updated_at | timestamptz | |

### session_participants

| Column | Type |
|--------|------|
| id | uuid PK |
| session_id | uuid FK |
| profile_id | uuid NULL |
| participant_id | uuid NULL |

CHECK: at least one of profile_id / participant_id set.

### session_messages (Phase 5 — required)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK | |
| author_profile_id | uuid FK → profiles | |
| content | text | |
| created_at | timestamptz | |

Replaces v1 JSONB messages on `board_games`.

### board_game_scores (Phase 5 — required)

| Column | Type |
|--------|------|
| id | uuid PK |
| session_id | uuid FK |
| profile_id | uuid NULL |
| participant_id | uuid NULL |
| score | numeric NULL |
| rank | int NULL |
| is_winner | boolean NULL |

Jorge has Excel score data to import later.

### escape_session_details (1:1 escape sessions)

| Column | Type | Notes |
|--------|------|-------|
| session_id | uuid PK | |
| clues_used | int NULL | N pistas |
| time_result | text NULL | Raw Tiempo |
| time_seconds | int NULL | Parsed |
| price | numeric NULL | |
| price_currency | text default 'EUR' | |
| escaped | boolean NULL | From Resultado / si / no |

### photos

| Column | Type |
|--------|------|
| id | uuid PK |
| session_id | uuid FK |
| storage_path | text |
| source | photo_source |
| source_file_id | text NULL |
| caption | text NULL |
| created_at | timestamptz |

### import_runs / import_errors

Track one-time Google Sheets/Drive imports. See Phase 8 in ROADMAP.

## Escape Babel spreadsheet mapping

| Column | Target |
|--------|--------|
| Fecha | play_sessions.played_at |
| Ciudad | escape_room_details.city |
| Sitio | escape_room_details.venue |
| Sala | game_catalog.title + escape_room_details.room_name |
| Resultado | outcome + escape_session_details.escaped |
| Participantes | session_participants via alias resolver |
| N pistas | clues_used |
| Tiempo | time_result (+ time_seconds) |
| Precio | price |
| Notas | notes |
| mes, año, si, no | source_raw only |

## RLS (private group)

- All tables: `authenticated` role required
- profiles: read all; update own
- participants: CRUD where owner_id = auth.uid()
- play_sessions: read all authenticated; write if created_by = auth.uid()
- import_runs: own runs only

## Migration file plan

```
20250617000001_extensions_and_enums.sql
20250617000002_profiles.sql
20250617000003_participants.sql
20250617000004_game_catalog.sql
20250617000005_play_sessions.sql
20250617000006_session_messages.sql
20250617000007_board_game_scores.sql
20250617000008_escape_details.sql
20250617000009_photos.sql
20250617000010_import_tables.sql
20250617000011_rls_policies.sql
20250617000012_triggers_and_functions.sql
20250617000013_storage_buckets.sql
```
