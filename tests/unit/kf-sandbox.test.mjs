import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const code = fs.readFileSync(`${root}shared/kf.js`, 'utf8');
const kitCode = fs.readFileSync(`${root}shared/kit.js`, 'utf8');

const makeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    _m: m,
  };
};
const plain = (x) => JSON.parse(JSON.stringify(x));

// kf.js in test mode (?parent). `now` is a mutable clock, `fetches` counts network calls.
const load = ({ lang = 'uk', search = '?parent', kit = true, sessionStorage = makeStorage(), localStorage = makeStorage() } = {}) => {
  const dev = { now: 1_700_000_000_000, fetches: 0, sessionStorage, localStorage };
  const sandbox = {
    localStorage,
    sessionStorage,
    location: { search },
    document: { visibilityState: 'visible', addEventListener() {} },
    KF_SITE: { lang },
    KF_CARDS: [],
    URLSearchParams,
    btoa,
    atob,
    console,
    crypto: { randomUUID: () => 'x' },
    Date: class extends Date {
      constructor(...a) {
        super(...(a.length ? a : [dev.now]));
      }
      static now() {
        return dev.now;
      }
    },
    fetch: async () => {
      dev.fetches++;
      throw new TypeError('network must not be used in test mode');
    },
    setTimeout: () => 0,
    clearTimeout() {},
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  if (kit) vm.runInContext(kitCode, sandbox);
  vm.runInContext(code, sandbox);
  dev.KF = sandbox.KF;
  return dev;
};

const DEMO_AVATAR = 'k:stripes:blue:yellow:1';

test('sandbox: seeded demo player, users() hides the pin, guest until login', async () => {
  for (const [lang, name] of [
    ['uk', 'Тестовий гравець'],
    ['es', 'Jugador de prueba'],
  ]) {
    const { KF } = load({ lang });
    assert.equal(KF.TEST_MODE, true);
    assert.equal(KF.auth.user, null);
    assert.equal(KF.auth.status, 'guest');
    assert.equal(KF.auth.hasGuestProgress(), false);
    const r = await KF.auth.users();
    assert.deepEqual(plain(r), { ok: true, users: [{ id: 1, name, avatar: DEMO_AVATAR }] });
  }
});

test('sandbox login: ok, bad pin counts down, lock after 5 for 5 min, success resets', async () => {
  const d = load();
  const { KF } = d;
  const events = [];
  KF.on('auth', (e) => events.push(plain(e)));
  assert.deepEqual(plain(await KF.auth.login(99, '1234')), { ok: false, error: 'no_user', hasGuestProgress: false });

  const bad = await KF.auth.login(1, '0000');
  assert.deepEqual(plain(bad), { ok: false, error: 'bad_pin', attemptsLeft: 4, hasGuestProgress: false });
  assert.equal(KF.auth.user, null);
  assert.equal(events.length, 0, 'a failed login is no change');

  const ok = await KF.auth.login(1, '1234');
  assert.deepEqual(plain(ok), { ok: true, user: { id: 1, name: 'Тестовий гравець', avatar: DEMO_AVATAR }, hasGuestProgress: false });
  assert.equal(KF.auth.status, 'synced');
  assert.equal(KF.auth.user.id, 1);
  assert.deepEqual(events, [{ user: ok.user, status: 'synced' }].map(plain));

  assert.equal((await KF.auth.login(1, '0000')).attemptsLeft, 4, 'success reset the counter');
  for (let i = 0; i < 3; i++) await KF.auth.login(1, '0000');
  const locked = await KF.auth.login(1, '0000');
  assert.deepEqual([locked.error, locked.retryAfter], ['locked', 300]);
  const still = await KF.auth.login(1, '1234');
  assert.deepEqual([still.ok, still.error], [false, 'locked'], 'the right PIN does not unlock');
  assert.equal(still.retryAfter, 300);
  d.now += 100_000;
  assert.equal((await KF.auth.login(1, '1234')).retryAfter, 200);
  d.now += 200_001;
  assert.equal((await KF.auth.login(1, '1234')).ok, true);
  assert.equal((await KF.auth.login(1, '0000')).attemptsLeft, 4);
  assert.equal(d.fetches, 0);
});

test('sandbox register: validation, name_taken, logs in, keeps coins', async () => {
  const { KF, sessionStorage } = load();
  const coins = KF.get().coins;
  assert.equal(coins, 100);
  for (const [args, error] of [
    [['', '1234'], 'bad_name'],
    [['123', '1234'], 'bad_name'],
    [['a'.repeat(31), '1234'], 'bad_name'],
    [['Ok', '123'], 'bad_pin_format'],
    [['Ok', 'abcd'], 'bad_pin_format'],
    [['Ok', '1234', 'nope'], 'bad_avatar'],
    [['Ok', '1234', 'k:plain:red:red:0'], 'bad_avatar'],
    [['тестовий   ГРАВЕЦЬ', '1234'], 'name_taken'],
  ]) {
    const r = await KF.auth.register(...args);
    assert.deepEqual(plain(r), { ok: false, error, hasGuestProgress: false }, JSON.stringify(args));
  }
  assert.equal(KF.auth.user, null);

  const r = await KF.auth.register("  Мар'яна  ", '4321', 'k:hoops:red:white:10');
  assert.deepEqual(plain(r), { ok: true, user: { id: 2, name: 'Марʼяна', avatar: 'k:hoops:red:white:10' }, hasGuestProgress: false });
  assert.equal(KF.auth.user.name, 'Марʼяна');
  assert.equal(KF.auth.status, 'synced');
  assert.equal(KF.get().coins, coins, 'sandbox progress is not reset');
  assert.equal((await KF.auth.register('Another', '1111')).user.avatar, '⚽', 'default avatar');
  assert.deepEqual(plain((await KF.auth.users()).users.map((u) => u.name)).sort(), ['Another', 'Марʼяна', 'Тестовий гравець'].sort());

  // the new player's PIN works
  await KF.auth.logout();
  assert.equal((await KF.auth.login(2, '1234')).error, 'bad_pin');
  assert.equal((await KF.auth.login(2, '4321')).ok, true);
  // pins never leak
  assert.ok(!JSON.stringify((await KF.auth.users()).users).includes('pin'));
  assert.ok(sessionStorage.getItem('kf-test-auth'));
});

test('sandbox rename / changePin / setAvatar', async () => {
  const d = load();
  const { KF } = d;
  const r0 = await KF.auth.rename('X', '1234');
  assert.deepEqual(plain(r0), { ok: false, error: 'auth' }, 'not logged in');
  assert.equal((await KF.auth.setAvatar('⚽')).error, 'auth');
  assert.equal((await KF.auth.changePin('1234', '4321')).error, 'auth');

  await KF.auth.register('Borys', '1111');
  await KF.auth.login(1, '1234');
  const events = [];
  KF.on('auth', (e) => events.push(plain(e)));

  const bad = await KF.auth.rename('Zed', '0000');
  assert.deepEqual(plain(bad), { ok: false, error: 'bad_pin', attemptsLeft: 4 });
  assert.equal((await KF.auth.rename('', '1234')).error, 'bad_name');
  assert.equal((await KF.auth.rename('borys', '1234')).error, 'name_taken');
  assert.equal(KF.auth.user.name, 'Тестовий гравець');
  assert.equal(events.length, 0);
  const own = await KF.auth.rename('ТЕСТОВИЙ ГРАВЕЦЬ', '1234');
  assert.equal(own.ok, true, 'only the case of his own name');
  const ok = await KF.auth.rename('Zed', '1234');
  assert.deepEqual(plain(ok), { ok: true, user: { id: 1, name: 'Zed', avatar: DEMO_AVATAR } });
  assert.equal(KF.auth.user.name, 'Zed');
  assert.equal(events.at(-1).user.name, 'Zed');
  assert.equal(events.length, 2);

  // wrong PIN on rename counts towards the lockout shared with login
  for (let i = 0; i < 4; i++) await KF.auth.rename('Q', '0000');
  const locked = await KF.auth.rename('Q', '0000');
  assert.deepEqual([locked.error, locked.retryAfter], ['locked', 300]);
  assert.equal((await KF.auth.changePin('1234', '5555')).error, 'locked');
  d.now += 300_001;

  // new PIN: format is checked before the PIN (no attempt burnt)
  assert.equal((await KF.auth.changePin('1234', '12')).error, 'bad_pin_format');
  assert.equal((await KF.auth.changePin('0000', '5555')).attemptsLeft, 4);
  const p = await KF.auth.changePin('1234', '5555');
  assert.equal(p.ok, true);
  await KF.auth.logout();
  assert.equal((await KF.auth.login(1, '1234')).error, 'bad_pin');
  assert.equal((await KF.auth.login(1, '5555')).ok, true);

  assert.equal((await KF.auth.setAvatar('nope')).error, 'bad_avatar');
  const a = await KF.auth.setAvatar('k:sash:navy:sky:99');
  assert.deepEqual(plain(a), { ok: true, user: { id: 1, name: 'Zed', avatar: 'k:sash:navy:sky:99' } });
  assert.equal(KF.auth.user.avatar, 'k:sash:navy:sky:99');
  assert.equal((await KF.auth.setAvatar('🐼')).ok, true, 'old avatar');
  assert.equal(d.fetches, 0);
});

test('sandbox logout, adoptGuest, persistence in sessionStorage only', async () => {
  const d = load();
  const { KF } = d;
  await KF.auth.login(1, '1234');
  KF.addCoins(5);
  const events = [];
  KF.on('auth', (e) => events.push(plain(e)));
  assert.deepEqual(plain(await KF.auth.logout()), { ok: true, lost: false });
  assert.equal(KF.auth.user, null);
  assert.equal(KF.auth.status, 'guest');
  assert.deepEqual(events, [{ user: null, status: 'guest' }]);
  assert.equal(KF.get().coins, 105, 'logout keeps the sandbox progress');
  assert.equal(KF.auth.adoptGuest(), true);

  await KF.auth.login(1, '1234');
  await KF.auth.rename('Zed', '1234');
  // the same tab (next page) sees the same sandbox; another tab (fresh sessionStorage) starts clean
  const next = load({ sessionStorage: d.sessionStorage });
  assert.equal(next.KF.auth.user.name, 'Zed');
  assert.equal(next.KF.auth.status, 'synced');
  const other = load();
  assert.equal(other.KF.auth.user, null);
  assert.equal((await other.KF.auth.users()).users[0].name, 'Тестовий гравець');
});

test('sandbox: nothing in localStorage, no fetch, no kit = any avatar accepted', async () => {
  const d = load({ kit: false });
  const { KF } = d;
  await KF.auth.login(1, '1234');
  assert.equal((await KF.auth.setAvatar('whatever')).ok, true);
  await KF.auth.register('Q', '1234');
  await KF.auth.changePin('1234', '9999');
  await KF.auth.logout();
  KF.answer('x', true);
  assert.equal(d.fetches, 0);
  assert.equal(d.localStorage._m.size, 0);
  assert.ok(d.sessionStorage._m.has('kf-test-auth'));
});
