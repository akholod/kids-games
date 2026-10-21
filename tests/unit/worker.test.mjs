import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import worker from '../../worker/index.js';

const migrationsDir = fileURLToPath(new URL('../../migrations/', import.meta.url));

// Just the D1 API the Worker uses: prepare().bind().first()/all()/run() and batch() (one transaction).
const makeD1 = (db) => {
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    run: async () => {
      const r = db.prepare(sql).run(...args);
      return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
    },
  });
  return {
    prepare: (sql) => stmt(sql),
    batch: async (stmts) => {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of stmts) out.push(await s.run());
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
};

const makeApp = () => {
  const db = new DatabaseSync(':memory:');
  for (const f of fs.readdirSync(migrationsDir).sort()) if (f.endsWith('.sql')) db.exec(fs.readFileSync(migrationsDir + f, 'utf8'));
  const env = { DB: makeD1(db), SITE_LANG: 'uk' };
  let ip = 0;
  /** Calls the Worker; `opts.cookie` = a session cookie, `opts.type` = Content-Type (default JSON, null = none). */
  const call = async (method, path, body, opts = {}) => {
    const headers = { 'CF-Connecting-IP': `10.0.0.${opts.ip ?? ++ip}` };
    const type = opts.type === undefined ? 'application/json' : opts.type;
    if (type) headers['Content-Type'] = type;
    if (opts.cookie) headers.Cookie = opts.cookie;
    const res = await worker.fetch(
      new Request(`https://kf.test${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }),
      env,
    );
    const text = await res.text();
    const sc = res.headers.get('Set-Cookie');
    return { status: res.status, data: text ? JSON.parse(text) : null, cookie: sc ? sc.split(';')[0] : null };
  };
  const register = async (name, pin = '1234', avatar) => {
    const r = await call('POST', '/api/register', { name, pin, avatar });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    return r;
  };
  return { db, call, register };
};

test('register: old and new avatars, default, bad avatar', async () => {
  const { call, register } = makeApp();
  assert.equal((await register('Old', '1234', '🦁')).data.user.avatar, '🦁');
  assert.equal((await register('New', '1234', 'k:stripes:red:white:10')).data.user.avatar, 'k:stripes:red:white:10');
  assert.equal((await register('Def')).data.user.avatar, '⚽');
  for (const bad of ['🦅x', 'k:stripes:red:white', 'k:nope:red:white:10', 'k:plain:red:white:100', '🦅', 5, { a: 1 }]) {
    const r = await call('POST', '/api/register', { name: 'Bad', pin: '1234', avatar: bad }, { ip: 99 });
    assert.deepEqual([r.status, r.data.error], [400, 'bad_avatar'], String(bad));
  }
});

test('login lockout: 5 fails lock for 5 min, success resets', async () => {
  const { call, register, db } = makeApp();
  const id = (await register('Anna')).data.user.id;
  const login = (pin) => call('POST', '/api/login', { userId: id, pin });
  const r1 = await login('0000');
  assert.deepEqual([r1.status, r1.data.error, r1.data.attemptsLeft], [401, 'bad_pin', 4]);
  assert.equal((await login('1234')).status, 200);
  assert.equal(db.prepare('SELECT failed FROM users WHERE id = ?').get(id).failed, 0);
  for (let i = 0; i < 4; i++) await login('0000');
  const locked = await login('0000');
  assert.deepEqual([locked.status, locked.data.error, locked.data.retryAfter], [429, 'locked', 300]);
  const still = await login('1234');
  assert.equal(still.status, 429, 'right PIN does not unlock');
  db.prepare('UPDATE users SET locked_until = 1 WHERE id = ?').run(id);
  assert.equal((await login('1234')).status, 200);
  assert.deepEqual({ ...db.prepare('SELECT failed, locked_until FROM users WHERE id = ?').get(id) }, { failed: 0, locked_until: 0 });
  assert.equal((await call('POST', '/api/login', { userId: 999, pin: '1234' })).status, 404);
});

test('POST /api/me/avatar', async () => {
  const { call, register } = makeApp();
  const { cookie } = await register('Anna');
  const ok = await call('POST', '/api/me/avatar', { avatar: 'k:sash:navy:sky:99' }, { cookie });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.data.user, { id: 1, name: 'Anna', avatar: 'k:sash:navy:sky:99' });
  assert.equal((await call('GET', '/api/me', undefined, { cookie })).data.user.avatar, 'k:sash:navy:sky:99');
  assert.equal((await call('POST', '/api/me/avatar', { avatar: '🐼' }, { cookie })).status, 200, 'old avatar allowed');
  for (const bad of ['k:plain:red:red:0', 'x', null, undefined]) {
    const r = await call('POST', '/api/me/avatar', { avatar: bad }, { cookie });
    assert.deepEqual([r.status, r.data.error], [400, 'bad_avatar']);
  }
  assert.equal((await call('GET', '/api/me', undefined, { cookie })).data.user.avatar, '🐼');
  const none = await call('POST', '/api/me/avatar', { avatar: '🐼' });
  assert.deepEqual([none.status, none.data.error], [401, 'auth']);
  assert.equal((await call('GET', '/api/me/avatar', undefined, { cookie })).status, 405);
});

test('POST /api/me/name', async () => {
  const { call, register, db } = makeApp();
  const { cookie } = await register('Anna');
  await register('Borys');
  const rename = (name, pin = '1234') => call('POST', '/api/me/name', { name, pin }, { cookie });

  const ok = await rename("  Мар'яна   Іванівна ");
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.data.user, { id: 1, name: 'Марʼяна Іванівна', avatar: '⚽' });
  assert.equal((await call('GET', '/api/me', undefined, { cookie })).data.user.name, 'Марʼяна Іванівна');

  const sameCase = await rename('марʼяна іванівна'.replace('м', 'М'));
  assert.equal(sameCase.status, 200);
  await rename('Anna');
  assert.equal((await rename('ANNA')).status, 200, 'only the case of his own name');
  assert.equal((await rename('ANNA')).data.user.name, 'ANNA', 'same name again');

  const taken = await rename('borys');
  assert.deepEqual([taken.status, taken.data.error], [409, 'name_taken']);
  assert.equal(db.prepare('SELECT name FROM users WHERE id = 1').get().name, 'ANNA');
  for (const bad of ['', '   ', '123', 'a'.repeat(31), 'A<b>', null, 5]) {
    const r = await rename(bad);
    assert.deepEqual([r.status, r.data.error], [400, 'bad_name'], String(bad));
  }
  const none = await call('POST', '/api/me/name', { name: 'Zed', pin: '1234' });
  assert.deepEqual([none.status, none.data.error], [401, 'auth']);
});

test('rename: wrong PIN counts toward the lockout, locked user gets 429, right PIN resets', async () => {
  const { call, register, db } = makeApp();
  const { cookie } = await register('Anna');
  const rename = (pin) => call('POST', '/api/me/name', { name: 'Zed', pin }, { cookie });
  const r1 = await rename('0000');
  assert.deepEqual([r1.status, r1.data.error, r1.data.attemptsLeft], [401, 'bad_pin', 4]);
  assert.equal((await rename('abcd')).data.attemptsLeft, 3);
  assert.equal((await rename(undefined)).data.attemptsLeft, 2);
  assert.equal((await rename('1234')).status, 200, 'right PIN resets the counter');
  assert.equal(db.prepare('SELECT failed FROM users WHERE id = 1').get().failed, 0);
  assert.equal((await rename('0000')).data.attemptsLeft, 4);
  for (let i = 0; i < 3; i++) await rename('0000');
  const locked = await rename('0000');
  assert.deepEqual([locked.status, locked.data.error, locked.data.retryAfter], [429, 'locked', 300]);
  assert.equal((await rename('1234')).status, 429);
  assert.equal((await call('POST', '/api/me/pin', { pin: '1234', newPin: '5555' }, { cookie })).status, 429);
  assert.equal((await call('POST', '/api/login', { userId: 1, pin: '1234' })).status, 429, 'login is locked too');
  db.prepare('UPDATE users SET locked_until = 1 WHERE id = 1').run();
  assert.equal((await rename('1234')).status, 200);
});

test('POST /api/me/pin: format first, wrong PIN, success keeps other sessions', async () => {
  const { call, register, db } = makeApp();
  const a = await register('Anna');
  const login = await call('POST', '/api/login', { userId: 1, pin: '1234' });
  assert.equal(login.status, 200);
  const other = login.cookie;
  const change = (pin, newPin) => call('POST', '/api/me/pin', { pin, newPin }, { cookie: a.cookie });

  for (const bad of ['123', '12345', 'abcd', 1234, null, undefined]) {
    const r = await change('1234', bad);
    assert.deepEqual([r.status, r.data.error], [400, 'bad_pin_format'], String(bad));
  }
  assert.equal(db.prepare('SELECT failed FROM users WHERE id = 1').get().failed, 0, 'format errors do not count');
  const wrong = await change('0000', '5678');
  assert.deepEqual([wrong.status, wrong.data.error, wrong.data.attemptsLeft], [401, 'bad_pin', 4]);
  assert.equal((await call('POST', '/api/login', { userId: 1, pin: '5678' })).status, 401, 'unchanged');

  const ok = await change('1234', '5678');
  assert.deepEqual([ok.status, ok.data], [200, { ok: true }]);
  const old = await call('POST', '/api/login', { userId: 1, pin: '1234' });
  assert.deepEqual([old.status, old.data.error], [401, 'bad_pin']);
  assert.equal((await call('POST', '/api/login', { userId: 1, pin: '5678' })).status, 200);
  assert.equal((await call('GET', '/api/me', undefined, { cookie: other })).status, 200, 'other session still valid');
  assert.equal((await call('GET', '/api/me', undefined, { cookie: a.cookie })).status, 200);
  assert.equal((await call('POST', '/api/me/pin', { pin: '5678', newPin: '1111' })).status, 401, 'no session');
});

test('GET /api/progress returns the fresh user', async () => {
  const { call, register } = makeApp();
  const { cookie } = await register('Anna');
  const empty = await call('GET', '/api/progress', undefined, { cookie });
  assert.deepEqual(empty.data, { rev: 0, state: null, updatedAt: 0, user: { id: 1, name: 'Anna', avatar: '⚽' } });
  const put = await call('PUT', '/api/progress', { baseRev: 0, state: { coins: 1 }, results: [] }, { cookie });
  assert.equal(put.status, 200);
  await call('POST', '/api/me/avatar', { avatar: 'k:halves:green:black:5' }, { cookie });
  await call('POST', '/api/me/name', { name: 'Anya', pin: '1234' }, { cookie });
  const r = await call('GET', '/api/progress', undefined, { cookie });
  assert.equal(r.data.rev, 1);
  assert.deepEqual(r.data.state, { coins: 1 });
  assert.deepEqual(r.data.user, { id: 1, name: 'Anya', avatar: 'k:halves:green:black:5' });
});

test('mutations need a JSON content-type (415) before anything else', async () => {
  const { call, register } = makeApp();
  const { cookie } = await register('Anna');
  for (const [path, body] of [
    ['/api/me/avatar', { avatar: '🐼' }],
    ['/api/me/name', { name: 'Zed', pin: '1234' }],
    ['/api/me/pin', { pin: '1234', newPin: '5555' }],
  ]) {
    for (const type of ['text/plain', null]) {
      const r = await call('POST', path, body, { cookie, type });
      assert.deepEqual([r.status, r.data.error], [415, 'unsupported_media_type'], `${path} ${type}`);
    }
  }
  assert.equal((await call('POST', '/api/login', { userId: 1, pin: '1234' }, { type: 'text/plain' })).status, 415);
  assert.equal((await call('GET', '/api/me', undefined, { cookie })).data.user.name, 'Anna');
});
