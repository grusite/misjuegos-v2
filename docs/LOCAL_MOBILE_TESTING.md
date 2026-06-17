# Local mobile testing (LAN)

How to test the MisJuegos UI on a phone against **local Supabase** without configuring Google OAuth for the LAN IP.

**Verified workflow (Jorge, Jun 2025):** change `VITE_SUPABASE_URL` to the Mac's LAN IP, log in on desktop, copy a session URL, open it on the phone.

---

## Prerequisites

- Mac and phone on the **same Wi‑Fi** (guest networks often block device-to-device traffic).
- Local Supabase running: `supabase start`
- Dev server exposed on the network: `pnpm dev --host`
- Mac LAN IP (example: `192.168.1.217`) — find with `ipconfig getifaddr en0` on macOS.

---

## Steps

### 1. Point the app at Supabase via LAN IP

In `.env` (local only — do not commit):

```env
VITE_SUPABASE_URL=http://<LAN_IP>:54321
```

Example: `http://192.168.1.217:54321`

Restart the dev server after changing `.env`:

```bash
pnpm dev --host
```

On the phone, use Vite's **Network** URL, e.g. `http://192.168.1.217:5173`.

> **Why:** `127.0.0.1` on the phone means the phone itself, not your Mac. The phone must reach Supabase on the Mac's LAN address.

### 2. Log in on the Mac (desktop browser)

Use normal Google OAuth at `http://localhost:5173` or `http://<LAN_IP>:5173`.

No Google Console / `config.toml` changes are required for this flow — OAuth runs only on the desktop.

### 3. Copy a session URL (Mac browser console)

After logging in, run in DevTools:

```javascript
const key = Object.keys(localStorage).find((k) => k.includes("auth-token"));
const session = JSON.parse(localStorage.getItem(key));
const lanIp = "192.168.1.217"; // your Mac's LAN IP
const url = `http://${lanIp}:5173/#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=${session.expires_in}&token_type=bearer`;
copy(url);
```

Replace `lanIp` with your actual IP. The URL is copied to the clipboard.

### 4. Open the URL on the phone

Paste into Chrome (or Safari) on the phone and open it.

Supabase JS reads the hash fragment, stores the session, and the app loads logged in.

### 5. When finished testing on desktop only

Revert `.env` to localhost:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
```

Restart `pnpm dev`.

---

## If the hash URL redirects to login

Common causes:

| Cause | Fix |
|-------|-----|
| `.env` still has `127.0.0.1` | Use `<LAN_IP>:54321`, restart dev server |
| Dev server not restarted after `.env` change | Stop and run `pnpm dev --host` again |
| Phone can't reach Supabase | Open `http://<LAN_IP>:54321` on the phone; check macOS Firewall |
| Session expired | Log in again on Mac and copy a fresh URL |

**Fallback — paste localStorage directly**

1. On Mac: `copy(localStorage.getItem(Object.keys(localStorage).find(k => k.includes("auth-token"))))`
2. On phone, use a bookmarklet or USB remote debugging to set key `sb-<hostname>-auth-token` (for `192.168.x.x` the key is `sb-192-auth-token`).

---

## Optional: full Google OAuth on the phone

Only needed if you want to tap "Entrar con Google" on the device itself:

1. `supabase/config.toml` → add `http://<LAN_IP>:5173` to `additional_redirect_urls`
2. Google Cloud Console → add `http://<LAN_IP>:54321/auth/v1/callback`
3. `supabase stop && supabase start`

For UI testing, **session URL transfer (above) is simpler**.

---

## Agent quick reference

When Jorge asks to test on mobile locally:

1. `VITE_SUPABASE_URL=http://<LAN_IP>:54321` in `.env`
2. `pnpm dev --host`
3. Login on Mac → console script → copy session URL with `#access_token=...`
4. Open that URL on the phone at `http://<LAN_IP>:5173`
5. Revert `.env` to `127.0.0.1` when done

Auth code already uses `window.location.origin` for OAuth `redirectTo` — no app code changes needed for LAN testing.
