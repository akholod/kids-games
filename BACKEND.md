# Backend: Cloudflare Worker + D1

The site is one Cloudflare Worker (personal account `20e6b39c875856725537b92999c1b53a`, URL `*.workers.dev`).
Static files are served as Workers Static Assets straight from the project root (exclusions in `.assetsignore`);
the Worker code only handles `/api/*`. Storage is one D1 database. No build step, no npm dependencies.

## Files

- `wrangler.jsonc` — worker name `keeper-fun-games`, `account_id`, assets (`directory: "."`, `run_worker_first: ["/api/*"]`),
  D1 binding `DB` (database `keeper-fun-games`).
- `.assetsignore` — never upload: `books/`, `.pi/`, `.git/`, `node_modules/`, `.omc/`, `worker/`, `migrations/`, `scripts/`,
  `*.md`, `wrangler.jsonc`, `deploy.sh`, `CNAME`, `.surgeignore`, `.assetsignore`, `.gitignore`, `*.test.js`, `.wrangler/`.
- `worker/index.js` — ES module Worker, plain JS.
- `migrations/0001_init.sql` — D1 schema (applied with `wrangler d1 migrations apply`).
- `scripts/add-user.mjs` — add a user by hand: `node scripts/add-user.mjs <name> <pin> [avatar] [--local]`.
- `deploy.sh` — apply remote migrations, then `wrangler deploy`.

## Schema

```sql
users(id INTEGER PK, name TEXT UNIQUE, avatar TEXT, pin_hash TEXT, failed INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0, created_at INTEGER)
sessions(token_hash TEXT PK, user_id INTEGER, created_at INTEGER, last_seen INTEGER)
progress(user_id INTEGER PK, state TEXT /* JSON */, rev INTEGER, updated_at INTEGER)
results(id TEXT PK /* client uuid */, user_id INTEGER, slug TEXT, score INTEGER, max INTEGER, at INTEGER)
```

Times are ms since epoch. `pin_hash` = `pbkdf2$<iterations>$<salt b64>$<hash b64>` (PBKDF2-SHA256, 16-byte salt,
100000 iterations — the Workers maximum). Session token = 32 random bytes (base64url), only its SHA-256 is stored.

## API (JSON, same origin)

Session: cookie `kf_session` — HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age 1 year (refreshed on use).
Mutating requests must send `Content-Type: application/json` (CSRF guard); otherwise 415.
Errors: `{ "error": "<code>" }`.

| Method & path | Body | Response |
|---|---|---|
| `GET /api/users` | — | `200 { users: [{ id, name, avatar }] }` |
| `POST /api/login` | `{ userId, pin }` | `200 { user }` + cookie · `401 { error: 'bad_pin', attemptsLeft }` · `429 { error: 'locked', retryAfter /* s */ }` · `404 { error: 'no_user' }` |
| `POST /api/logout` | `{}` | `204`, session deleted, cookie cleared |
| `GET /api/me` | — | `200 { user }` · `401 { error: 'auth' }` |
| `GET /api/progress` | — | `200 { rev, state /* object or null */, updatedAt }` |
| `PUT /api/progress` | `{ baseRev, state, results: [{ id, slug, score, max, at }] }` | `200 { rev }` · `409 { error: 'conflict', rev, state }` |

- PIN: exactly 4 digits. 5 wrong PINs in a row → user locked for 5 minutes (`locked_until`); success resets `failed`.
- `PUT /api/progress`: accepted only if `baseRev` equals the stored rev (0 when there is no row); then `rev + 1`.
  `results` are inserted with `INSERT OR IGNORE` (idempotent by client id), also on 409 — they are history, not state.
  Limits: body ≤ 256 KB, ≤ 100 results per request.
- `/api/progress*` without a valid session → `401 { error: 'auth' }`.

## Client sync (`shared/kf.js`)

Offline-first: games always read and write a local copy; the server is a backup and the link between devices.

- Guest (not logged in): exactly as before — `localStorage['kf-progress-v1']`, no network.
- Logged in: `localStorage['kf-user'] = { id, name, avatar }` and `localStorage['kf-sync-u<id>'] =
  { state, base, baseRev, dirty, outbox }` — `base` is the last state known to be on the server.
- After every commit: `dirty = true`, push debounced (~1.5 s); also push on `online`, on `visibilitychange` → hidden
  (`fetch` with `keepalive`), and on page load. Pull on load and on tab focus.
- 409 → three-way merge `merge3(base, local, server)` then push again with the server rev:
  numbers = `server + (local − base)`, except "max" fields (`stats.bestStreak`, `games.*.best`, `games.*.max`,
  `games.*.lastPlayed`) = max; `stats.streak`, `stats.dayStreak`, `stats.lastDay` taken from the side with the later
  `lastDay`; maps (`stickers`, `achievements`, `games`, `gameData.*`) merged key by key with the same rules;
  arrays = union; other values = local if changed since base, else server. Coins never below 0.
- 401 → session gone: keep local data, `KF.auth.status = 'expired'`, catalog asks for the PIN again.
- Test mode (`?parent`) never logs in and never syncs.

`KF.auth`: `user`, `status` (`'guest' | 'synced' | 'pending' | 'offline' | 'expired'`), `users()`, `login(userId, pin)`,
`hasGuestProgress()`, `adoptGuest()` (adds guest progress to the user: merge3 with `base = fresh()`, then clears guest),
`logout()` (pushes first; returns `{ ok: false }` if unsynced changes could not be pushed). Event `KF.on('auth', fn)` on any
status/user change.
