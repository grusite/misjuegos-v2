# Deploy MisJuegos v2 on Cloudflare Pages

Static hosting for the Vite + Vue app at **https://misjuegos.net**. Supabase stays on cloud (`yyscffeexxtagilftrwo`); only the frontend is on Pages.

Repo: `grusite/misjuegos-v2` on GitHub.

---

## 1. Supabase Auth (before first prod login)

**Dashboard → Authentication → URL configuration**

| Setting | Value |
|---------|--------|
| Site URL | `https://misjuegos.net` |
| Redirect URLs | `https://misjuegos.net/**` |

Keep `http://127.0.0.1:54321/**` if you still develop locally.

Google OAuth redirect URI stays on Supabase (not Pages):

`https://yyscffeexxtagilftrwo.supabase.co/auth/v1/callback`

---

## 2. Create the Pages project

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Authorize GitHub → select **`grusite/misjuegos-v2`**
3. **Production branch:** `main`

### Build settings

| Field | Value |
|-------|--------|
| Framework preset | None (or Vite — same result) |
| Build command | `pnpm run build` |
| Build output directory | `dist` |
| Root directory | *(leave empty)* |

Cloudflare detects **pnpm** from `packageManager` in `package.json`. Node **22** comes from `.node-version`.

---

## 3. Environment variables (build)

**Pages project → Settings → Environment variables → Production** (and Preview if you use previews):

| Name | Value | Notes |
|------|--------|--------|
| `VITE_SUPABASE_URL` | `https://yyscffeexxtagilftrwo.supabase.co` | Public |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | Publishable key from Supabase API settings |

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` here — CLI imports only, never in the frontend build.

Save → **Retry deployment** (or push a commit) so the build picks up the vars.

---

## 4. Custom domain `misjuegos.net`

1. Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `misjuegos.net` (and `www.misjuegos.net` if you use www)
3. If the zone is already on Cloudflare, DNS records are added automatically (`CNAME` → `*.pages.dev`)

**Cutover from v1:** remove or repoint the old A/CNAME record for `misjuegos.net` to the new Pages target. Propagation is usually minutes on Cloudflare.

---

## 5. Verify after deploy

- [ ] `https://misjuegos.net` loads the app
- [ ] Deep link works: `https://misjuegos.net/sessions` (needs `public/_redirects` SPA fallback)
- [ ] Google login completes and returns to the app
- [ ] Sessions, dashboard, photos load against prod Supabase

---

## 6. Optional — deploy from CLI (no Git push)

```bash
nvm use
pnpm install
VITE_SUPABASE_URL=https://yyscffeexxtagilftrwo.supabase.co \
VITE_SUPABASE_ANON_KEY=sb_publishable_... \
pnpm build

npx wrangler pages deploy dist --project-name=misjuegos
```

Install Wrangler once: `pnpm add -D wrangler` or `npm i -g wrangler`, then `wrangler login`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Blank page after refresh on `/sessions/...` | Ensure `public/_redirects` is in the repo (`/* /index.html 200`) |
| Build fails on Node | Confirm `.node-version` is `22` and `engines.node` in package.json |
| Login redirects to wrong host | Update Supabase **Site URL** to `https://misjuegos.net` |
| `Faltan VITE_SUPABASE_*` at runtime | Set env vars in Pages **before** build; redeploy |
| Old v1 site still shows | DNS still points at previous host — check Cloudflare DNS records |

---

See also: [`data/import/README.md`](../data/import/README.md#production-cutover-checklist-phase-16) (Phase 16 checklist).
