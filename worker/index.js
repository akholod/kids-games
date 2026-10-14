const ITER = 100000;
const COOKIE = 'kf_session';
const YEAR = 365 * 24 * 3600;
const DAY_MS = 24 * 3600 * 1000;
const MAX_BODY = 256 * 1024;
const MAX_RESULTS = 100;
const MAX_FAILS = 5;
const LOCK_MS = 5 * 60 * 1000;
const MAX_USERS = 40;
const MAX_SIGNUPS = 3;
const AVATARS = ['⚽', '🧤', '🥅', '🏆', '⭐', '🔥', '🦁', '🐯', '🦊', '🐼', '🚀', '⚡'];

const enc = new TextEncoder();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (buf) => b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function pbkdf2(pin, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

async function verifyPin(pin, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const hash = await pbkdf2(pin, unb64(parts[2]), Number(parts[1]));
  return safeEqual(hash, unb64(parts[3]));
}

async function hashPin(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await pbkdf2(pin, salt, ITER))}`;
}

async function sha256(s) {
  return b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
const err = (code, status, extra = {}, headers) => json({ error: code, ...extra }, status, headers);

const cookie = (value, maxAge) =>
  `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

function getCookie(request, name) {
  const h = request.headers.get('Cookie') || '';
  for (const part of h.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

class HttpError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

async function readJson(request) {
  const ct = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (ct !== 'application/json') throw new HttpError('unsupported_media_type', 415);
  const len = Number(request.headers.get('Content-Length'));
  if (len > MAX_BODY) throw new HttpError('too_large', 413);
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_BODY) throw new HttpError('too_large', 413);
  try {
    return JSON.parse(new TextDecoder().decode(buf));
  } catch {
    throw new HttpError('bad_json', 400);
  }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isInt = (v) => Number.isSafeInteger(v);

async function auth(request, env, now) {
  const token = getCookie(request, COOKIE);
  if (!token || token.length > 100) return null;
  const hash = await sha256(token);
  const row = await env.DB.prepare(
    'SELECT u.id, u.name, u.avatar, s.last_seen FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?'
  ).bind(hash).first();
  if (!row) return null;
  let setCookie = null;
  if (now - row.last_seen > DAY_MS) {
    await env.DB.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').bind(now, hash).run();
    setCookie = cookie(token, YEAR);
  }
  return { user: { id: row.id, name: row.name, avatar: row.avatar }, hash, setCookie };
}

async function login(request, env, now) {
  const body = await readJson(request);
  if (!isObj(body) || !isInt(body.userId) || typeof body.pin !== 'string') return err('bad_request', 400);
  const u = await env.DB.prepare('SELECT id, name, avatar, pin_hash, failed, locked_until FROM users WHERE id = ?')
    .bind(body.userId).first();
  if (!u) return err('no_user', 404);
  if (u.locked_until > now) return err('locked', 429, { retryAfter: Math.ceil((u.locked_until - now) / 1000) });

  const ok = /^\d{4}$/.test(body.pin) && (await verifyPin(body.pin, u.pin_hash));
  if (!ok) {
    const failed = (u.failed || 0) + 1;
    if (failed >= MAX_FAILS) {
      await env.DB.prepare('UPDATE users SET failed = 0, locked_until = ? WHERE id = ?').bind(now + LOCK_MS, u.id).run();
      return err('locked', 429, { retryAfter: LOCK_MS / 1000 });
    }
    await env.DB.prepare('UPDATE users SET failed = ? WHERE id = ?').bind(failed, u.id).run();
    return err('bad_pin', 401, { attemptsLeft: MAX_FAILS - failed });
  }

  return startSession(env, u, now, [env.DB.prepare('UPDATE users SET failed = 0, locked_until = 0 WHERE id = ?').bind(u.id)]);
}

// Creates the session row (in one batch with `before`) and answers with the user + cookie.
async function startSession(env, u, now, before = [], status = 200) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.batch([
    ...before,
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)')
      .bind(await sha256(token), u.id, now, now),
  ]);
  return json({ user: { id: u.id, name: u.name, avatar: u.avatar } }, status, { 'Set-Cookie': cookie(token, YEAR) });
}

async function register(request, env, now) {
  const body = await readJson(request);
  if (!isObj(body)) return err('bad_request', 400);
  // NFC keeps й/ї as single letters; every apostrophe becomes ʼ, so Мар'яна and Марʼяна are one name.
  const name = typeof body.name === 'string' ? body.name.normalize('NFC').replace(/['’]/g, 'ʼ').replace(/\s+/g, ' ').trim() : '';
  if (!/^[\p{L} '’ʼ-]{1,30}$/u.test(name) || !/\p{L}/u.test(name)) return err('bad_name', 400);
  if (typeof body.pin !== 'string' || !/^\d{4}$/.test(body.pin)) return err('bad_pin_format', 400);
  const avatar = body.avatar == null || body.avatar === '' ? AVATARS[0] : body.avatar;
  if (!AVATARS.includes(avatar)) return err('bad_avatar', 400);

  const total = await env.DB.prepare('SELECT count(*) AS n FROM users').first();
  if (total.n >= MAX_USERS) return err('full', 403);

  const key = await sha256(request.headers.get('CF-Connecting-IP') || 'unknown');
  const recent = await env.DB.prepare('SELECT count(*) AS n, min(created_at) AS oldest FROM users WHERE signup_key = ? AND created_at > ?')
    .bind(key, now - DAY_MS).first();
  if (recent.n >= MAX_SIGNUPS) return err('too_many', 429, { retryAfter: Math.max(1, Math.ceil((recent.oldest + DAY_MS - now) / 1000)) });

  const taken = await env.DB.prepare('SELECT 1 FROM users WHERE name = ? COLLATE NOCASE').bind(name).first();
  if (taken) return err('name_taken', 409);

  const pinHash = await hashPin(body.pin);
  let id;
  try {
    const r = await env.DB.prepare('INSERT INTO users (name, avatar, pin_hash, created_at, signup_key) VALUES (?, ?, ?, ?, ?)')
      .bind(name, avatar, pinHash, now, key).run();
    id = r.meta.last_row_id;
  } catch (e) {
    if (/UNIQUE/i.test(String(e && (e.message || e)))) return err('name_taken', 409);
    throw e;
  }
  return startSession(env, { id, name, avatar }, now, [], 201);
}

function validateResults(results) {
  if (!Array.isArray(results)) return false;
  if (results.length > MAX_RESULTS) return 'too_many';
  for (const r of results) {
    if (!isObj(r) || typeof r.id !== 'string' || !r.id || r.id.length > 64) return false;
    if (typeof r.slug !== 'string' || !r.slug || r.slug.length > 64) return false;
    if (!isInt(r.score) || !isInt(r.max) || !isInt(r.at)) return false;
  }
  return true;
}

async function putProgress(request, env, session, now) {
  const body = await readJson(request);
  if (!isObj(body) || !isInt(body.baseRev) || body.baseRev < 0 || !isObj(body.state)) return err('bad_request', 400);
  const results = body.results === undefined ? [] : body.results;
  const v = validateResults(results);
  if (v === 'too_many') return err('too_many_results', 400);
  if (!v) return err('bad_request', 400);

  const uid = session.user.id;
  const stateJson = JSON.stringify(body.state);
  const resultStmts = results.map((r) =>
    env.DB.prepare('INSERT OR IGNORE INTO results (id, user_id, slug, score, max, at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(r.id, uid, r.slug, r.score, r.max, r.at)
  );

  const save = body.baseRev === 0
    ? env.DB.prepare('INSERT OR IGNORE INTO progress (user_id, state, rev, updated_at) VALUES (?, ?, 1, ?)')
        .bind(uid, stateJson, now)
    : env.DB.prepare('UPDATE progress SET state = ?, rev = rev + 1, updated_at = ? WHERE user_id = ? AND rev = ?')
        .bind(stateJson, now, uid, body.baseRev);

  // Results are history: stored regardless of the outcome. Single batch = one transaction.
  const out = await env.DB.batch([save, ...resultStmts]);
  if (out[0].meta.changes === 1) return json({ rev: body.baseRev + 1 });

  const cur = await env.DB.prepare('SELECT state, rev FROM progress WHERE user_id = ?').bind(uid).first();
  return err('conflict', 409, { rev: cur ? cur.rev : 0, state: cur ? JSON.parse(cur.state) : null });
}

async function handle(request, env, url, now) {
  const { pathname } = url;
  const method = request.method;

  if (pathname === '/api/users' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, name, avatar FROM users ORDER BY name COLLATE NOCASE, id').all();
    return json({ users: results });
  }
  if (pathname === '/api/login' && method === 'POST') return login(request, env, now);
  if (pathname === '/api/register' && method === 'POST') return register(request, env, now);

  const known = ['/api/logout', '/api/me', '/api/progress'];
  if (!known.includes(pathname)) return err('not_found', 404);

  if (pathname === '/api/logout' && method === 'POST') {
    const ct = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (ct !== 'application/json') return err('unsupported_media_type', 415);
    const token = getCookie(request, COOKIE);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'Set-Cookie': cookie('', 0) } });
  }

  const allowed = pathname === '/api/progress' ? ['GET', 'PUT'] : pathname === '/api/me' ? ['GET'] : [];
  if (!allowed.includes(method)) return err('method_not_allowed', 405);
  if (method === 'PUT') {
    const ct = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (ct !== 'application/json') return err('unsupported_media_type', 415);
  }

  const session = await auth(request, env, now);
  if (!session) return err('auth', 401);

  let res;
  if (pathname === '/api/me') {
    res = json({ user: session.user });
  } else if (method === 'GET') {
    const row = await env.DB.prepare('SELECT state, rev, updated_at FROM progress WHERE user_id = ?')
      .bind(session.user.id).first();
    res = json(row ? { rev: row.rev, state: JSON.parse(row.state), updatedAt: row.updated_at }
                   : { rev: 0, state: null, updatedAt: 0 });
  } else {
    res = await putProgress(request, env, session, now);
  }
  if (session.setCookie) res.headers.append('Set-Cookie', session.setCookie);
  return res;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return err('not_found', 404);
    try {
      return await handle(request, env, url, Date.now());
    } catch (e) {
      if (e instanceof HttpError) return err(e.code, e.status);
      console.error(e);
      return err('server', 500);
    }
  },
};
