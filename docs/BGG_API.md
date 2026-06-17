# BoardGameGeek XML API — MisJuegos v2

MisJuegos uses the [BGG XML API 2](https://boardgamegeek.com/wiki/page/BGG_XML_API2) **search** endpoint only, to help pick a game title when creating a board-game session.

Official guides:

- [Using the XML API](https://boardgamegeek.com/using_the_xml_api)
- [XML API Terms of Use](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use)

---

## How we comply

| BGG requirement | MisJuegos approach |
|-----------------|-------------------|
| **Register the application** | Jorge registers a **non-commercial** app at [boardgamegeek.com/applications](https://boardgamegeek.com/applications). |
| **Bearer token on every request** | Token stored as `BGG_TOKEN` secret — Edge Function only, never in the Vue app. |
| **Server-side requests, not from clients** | Browser calls Supabase Edge Function `bgg-search`; function calls BGG with `Authorization: Bearer …`. |
| **Keep requests to a minimum** | Search runs only when the user taps **Buscar**; max **10** results; no background sync or bulk import from BGG. |
| **Cache when possible** | Selected `bgg_id`, title, and year are stored in `board_game_details` / `game_catalog` — we do not re-fetch the same game on every page view. |
| **Non-commercial use** | Private tracker for a small group of friends — fits BGG’s non-commercial license. |
| **No AI / LLM training** | API data is not used to train models. |
| **Credit & link to BGG** | UI shows attribution next to the BGG search field; game pages link to BGG when `bgg_id` is known. |
| **Do not expose the token** | `BGG_TOKEN` is **not** a `VITE_*` variable. |

---

## Setup (once BGG approves the application)

### 1. Create a token

1. Open [boardgamegeek.com/applications](https://boardgamegeek.com/applications)
2. Open your approved **MisJuegos** application
3. **Tokens** → generate a token

### 2. Local development

```bash
cp supabase/functions/.env.dist supabase/functions/.env
# Edit supabase/functions/.env and set BGG_TOKEN=your_token_here

supabase stop && supabase start   # reload functions env
```

The token is read from `supabase/functions/.env` (gitignored).

### 3. Production (Supabase cloud)

```bash
supabase secrets set BGG_TOKEN=your_token_here --project-ref yyscffeexxtagilftrwo
```

No redeploy needed — secrets are available immediately to Edge Functions.

### 4. Smoke test

With the app running and logged in:

1. **Partidas** → **Nueva partida** → **Juego de mesa**
2. Type a game name → **Buscar**
3. Results should appear in the dropdown

If the token is missing locally, the UI shows: *«La búsqueda BGG aún no está configurada en el servidor…»*

---

## Architecture

```
Vue (authenticated) → supabase.functions.invoke("bgg-search")
                    → Edge Function (validates JWT, reads BGG_TOKEN)
                    → GET boardgamegeek.com/xmlapi2/search?type=boardgame&query=…
                    → JSON { results: [{ bggId, title, yearPublished }] }
```

Function path: `supabase/functions/bgg-search/index.ts`

---

## What we do **not** do (by design)

- No browser → BGG direct calls (CORS + token exposure)
- No public anonymous BGG proxy
- No scraping collections, marketplace, or full catalog dumps
- No storing or redistributing bulk BGG data beyond session/catalog fields you enter

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| «BGG aún no está configurada» | `BGG_TOKEN` empty in `supabase/functions/.env` or cloud secrets |
| «Token rechazado» | Application still pending, token revoked, or wrong token |
| Empty results, no error | Obscure query — try a well-known title |
| Timeout | BGG queue (202) — retry; function waits and retries automatically |
