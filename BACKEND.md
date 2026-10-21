# Backend: Cloudflare Worker + D1

The site is a Cloudflare Worker (personal account `20e6b39c875856725537b92999c1b53a`, URL `*.workers.dev`).
A second Worker `keeper-fun-games-es` (wrangler `env.es`, `SITE_LANG=es`) serves the Spanish site from the same code,
assets and the same D1 database (users, progress, results are shared; sessions/cookies are per host).
Static files are served as Workers Static Assets straight from the project root (exclusions in `.assetsignore`);
the Worker code handles `/api/*` and `/shared/site.js` (answers `window.KF_SITE = { lang }` from the `SITE_LANG` var: `uk` | `es`, default `uk`). Storage is one D1 database. No build step, no npm dependencies.

## Files

- `wrangler.jsonc` — worker name `keeper-fun-games` (var `SITE_LANG: "uk"`), `account_id`, assets (`directory: "."`,
  `run_worker_first: ["/api/*", "/shared/site.js"]`), D1 binding `DB` (database `keeper-fun-games`).
  `env.es` → worker `keeper-fun-games-es`, `SITE_LANG: "es"`; envs do not inherit bindings/vars, so assets and D1 are repeated there.
- `.assetsignore` — never upload: `books/`, `.pi/`, `.git/`, `node_modules/`, `worker/`, `migrations/`, `scripts/`, `tests/`,
  `*.md`, `wrangler.jsonc`, `deploy.sh`, dotfiles, tooling configs (`package.json`, lockfile, `playwright.config.mjs`), test output.
- `worker/index.js` — ES module Worker, plain JS (imports `shared/kit.js` for avatar validation; wrangler bundles it).
- `migrations/0001_init.sql` — D1 schema (applied with `wrangler d1 migrations apply`).
- `migrations/0002_signup.sql` — `users.signup_key` (self-registration abuse guard) + index.
- `scripts/add-user.mjs` — add a user by hand: `node scripts/add-user.mjs <name> <pin> [avatar] [--local]`.
- `deploy.sh` — apply remote migrations once (retried up to 3×; same DB), then `wrangler deploy` and `wrangler deploy --env es`.

## Schema

```sql
users(id INTEGER PK, name TEXT UNIQUE, avatar TEXT, pin_hash TEXT, failed INTEGER DEFAULT 0,
      locked_until INTEGER DEFAULT 0, created_at INTEGER,
      signup_key TEXT /* SHA-256 of CF-Connecting-IP; NULL for users added by add-user.mjs */)
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
| `POST /api/register` | `{ name, pin, avatar }` | `201 { user }` + cookie (logged in) · `400 { error: 'bad_name' \| 'bad_pin_format' \| 'bad_avatar' }` · `409 { error: 'name_taken' }` · `429 { error: 'too_many', retryAfter /* s */ }` · `403 { error: 'full' }` |
| `POST /api/logout` | `{}` | `204`, session deleted, cookie cleared |
| `GET /api/me` | — | `200 { user }` · `401 { error: 'auth' }` |
| `GET /api/progress` | — | `200 { rev, state /* object or null */, updatedAt, user: { id, name, avatar } /* fresh from the DB */ }` |
| `POST /api/me/avatar` | `{ avatar }` | `200 { user }` · `400 { error: 'bad_avatar' }` |
| `POST /api/me/name` | `{ name, pin }` | `200 { user }` · `401 { error: 'bad_pin', attemptsLeft }` · `429 { error: 'locked', retryAfter }` · `400 { error: 'bad_name' }` · `409 { error: 'name_taken' }` |
| `POST /api/me/pin` | `{ pin, newPin }` | `200 { ok: true }` · `400 { error: 'bad_pin_format' }` · `401 bad_pin` · `429 locked` |
| `PUT /api/progress` | `{ baseRev, state, results: [{ id, slug, score, max, at }] }` | `200 { rev }` · `409 { error: 'conflict', rev, state }` |

- PIN: exactly 4 digits. 5 wrong PINs in a row → user locked for 5 minutes (`locked_until`); success resets `failed`.
  One helper (`checkPin`) does this for `login`, `/api/me/name` and `/api/me/pin` — they share the counter and the lock.
- Avatar: stored in `users.avatar` as `k:<pattern>:<c1>:<c2>:<mark>` (a shirt) or, for old users, a bare picture from the first 12
  `MARKS`; format, choices and the only server-side check (`KFKit.valid`) are in `shared/kit.js`. Register accepts any valid avatar
  (missing → `⚽`); `/api/me/avatar` needs a valid one (no default). Special patterns are unlocked on the client only.
- `/api/me/*` (session required, else `401 { error: 'auth' }`; JSON content-type guard → 415 before the session check):
  - `name` — same normalisation/rule as register; unique case-insensitively excluding the user himself (changing only the case of
    one's own name is fine); the PIN is checked first, so a wrong PIN counts toward the lockout even if the name is bad.
  - `/api/me/pin` — `newPin` must be exactly 4 digits (`400 bad_pin_format`, checked **before** the PIN, so a typo costs no attempt).
    Stores a fresh pbkdf2 hash; other sessions stay valid (no logout of other devices).
- `PUT /api/progress`: accepted only if `baseRev` equals the stored rev (0 when there is no row); then `rev + 1`.
  `results` are inserted with `INSERT OR IGNORE` (idempotent by client id), also on 409 — they are history, not state.
  Limits: body ≤ 256 KB, ≤ 100 results per request.
- `POST /api/register` (self-registration, public):
  `name` is trimmed and inner whitespace collapsed; must match `/^[\p{L} '’ʼ-]{1,30}$/u` (letters, spaces, hyphens, apostrophes) and contain a letter (same rule as
  `add-user.mjs`). `pin` — exactly 4 digits. `avatar` — one of `AVATARS` (`⚽ 🧤 🥅 🏆 ⭐ 🔥 🦁 🐯 🦊 🐼 🚀 ⚡`; missing → `⚽`).
  Name is unique case-insensitively (`COLLATE NOCASE` check + the `UNIQUE` constraint for races) → `409 name_taken`.
  Limits: max 3 registrations per client per 24 h (key = SHA-256 of `CF-Connecting-IP`, `'unknown'` if absent, stored in
  `users.signup_key`; `retryAfter` = seconds until the oldest of them is 24 h old) → `429 too_many`; at most 40 users in total
  → `403 full`. The session cookie is set exactly as in login. Migration `0002_signup.sql` must be applied before deploy
  (`deploy.sh` does it).
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
  `lastDay`; maps (`cards`, `achievements`, `games`, `gameData.*`) merged key by key with the same rules;
  `cards` counts never drop below 1 if the card was owned in base, local or server (two devices selling the same duplicate);
  arrays = union; other values = local if changed since base, else server. Coins never below 0.
- 401 → session gone: keep local data, `KF.auth.status = 'expired'`, catalog asks for the PIN again.
- Test mode (`?parent`) never touches the network and never syncs; `KF.auth` there is the sandbox described below.

`KF.auth`: `user`, `status` (`'guest' | 'synced' | 'pending' | 'offline' | 'expired'`), `users()`, `login(userId, pin)`,
`register(name, pin, avatar)`, `hasGuestProgress()`, `adoptGuest()` (adds guest progress to the user: merge3 with `base = fresh()`, then clears guest),
`logout()` (pushes first; returns `{ ok: false }` if unsynced changes could not be pushed). Event `KF.on('auth', fn)` on any
status/user change.

`KF.auth.register(name, pin, avatar)` mirrors `login()` (login and register share one post-login routine): test mode →
`{ ok: false, error: 'test_mode' }`; on failure `{ ok: false, error, retryAfter, hasGuestProgress }` (`error` = server code or
`'network'`); on success the user is stored, state loaded, synced, and `{ ok: true, user, hasGuestProgress }` is returned.
`KF.AVATARS` is the list of old picture avatars for the UI.

Account changes (profile page) — `KF.auth.setAvatar(avatar)`, `rename(name, pin)`, `changePin(pin, newPin)` → `KFAuthResult`:
test mode → `{ ok: false, error: 'test_mode' }`; not logged in → `{ ok: false, error: 'auth' }`; offline / fetch failure →
`{ ok: false, error: 'network' }`; server errors → `{ ok: false, error, attemptsLeft?, retryAfter? }` (`bad_avatar`, `bad_name`,
`name_taken`, `bad_pin_format`, `bad_pin`, `locked`). A `401 bad_pin` is **not** a lost session; a `401 auth` is
(`status = 'expired'`, error `'auth'`). On success `{ ok: true, user }` (`changePin`: `user` = the current one): the stored user
(`localStorage['kf-user']` + `KF.auth.user`) takes the server's `{ id, name, avatar }` and `'auth'` is emitted. Online only.
Every pull (`GET /api/progress`) also compares the server's `user` with the stored one — a rename / new shirt made on another
device replaces it and emits `'auth'`.

### Test-mode sandbox auth

In `KF.TEST_MODE` the same `KF.auth` API (`users`, `login`, `register`, `logout`, `setAvatar`, `rename`, `changePin`,
`hasGuestProgress` = false, `adoptGuest` = no-op `true`) runs on a per-tab sandbox in `sessionStorage['kf-test-auth']`:
`{ users: [{ id, name, avatar, pin, failed, lockedUntil }], current }`. It is seeded with one player
(`Тестовий гравець` / `Jugador de prueba` by `KF.lang`, PIN `1234`, avatar `k:stripes:blue:yellow:1`; nobody logged in at first).
It mirrors the server: the same name normalisation/rule, case-insensitive uniqueness (excluding the player himself), 4-digit PINs,
`KFKit.valid` for avatars (accepts anything if `kit.js` is not loaded), the same error codes and fields (`bad_pin` + `attemptsLeft`,
`locked` + `retryAfter` after 5 fails for 5 min, per player, shared by login/rename/changePin; `no_user`, `bad_name`, `name_taken`,
`bad_pin_format`, `bad_avatar`; `auth` when nobody is logged in). `status` is `'synced'` while a player is logged in, else `'guest'`;
`'auth'` is emitted on every successful change. Progress stays the single per-tab sandbox progress (no per-player split, no sync,
login/register do not reset the sandbox coins). `'test_mode'` is no longer returned.
