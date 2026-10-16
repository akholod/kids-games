import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const code = fs.readFileSync(fileURLToPath(new URL('../../shared/kf.js', import.meta.url)), 'utf8');

const makeStorage = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    _m: m,
  };
};

// In-memory server implementing the BACKEND.md API.
const makeServer = () => {
  const srv = {
    users: [{ id: 1, name: 'Keeper', avatar: '⚽', pin: '1234' }, { id: 2, name: 'Other', avatar: '🧤', pin: '0000' }],
    sessions: new Map(), // token -> userId
    progress: new Map(), // userId -> { rev, state }
    results: new Map(), // id -> result
    puts: [],
    calls: 0,
    down: false,
  };
  srv.handle = (device, method, path, body) => {
    srv.calls++;
    if (srv.down) throw new TypeError('network down');
    const json = (status, data) => ({ status, json: async () => data });
    if (path === '/api/users') return json(200, { users: srv.users.map(({ pin, ...u }) => u) });
    if (path === '/api/login') {
      const u = srv.users.find((x) => x.id === body.userId);
      if (!u) return json(404, { error: 'no_user' });
      if (u.pin !== body.pin) return json(401, { error: 'bad_pin', attemptsLeft: 4 });
      device.token = randomUUID();
      srv.sessions.set(device.token, u.id);
      return json(200, { user: { id: u.id, name: u.name, avatar: u.avatar } });
    }
    if (path === '/api/logout') {
      srv.sessions.delete(device.token);
      return { status: 204, json: async () => { throw new Error('empty'); } };
    }
    const uid = srv.sessions.get(device.token);
    if (!uid) return json(401, { error: 'auth' });
    const row = srv.progress.get(uid) || { rev: 0, state: null };
    if (method === 'GET') return json(200, { rev: row.rev, state: row.state, updatedAt: 0 });
    srv.puts.push(body);
    for (const r of body.results) srv.results.set(r.id, { ...r, uid });
    if (body.baseRev !== row.rev) return json(409, { error: 'conflict', rev: row.rev, state: row.state });
    srv.progress.set(uid, { rev: row.rev + 1, state: body.state });
    return json(200, { rev: row.rev + 1 });
  };
  return srv;
};

// Fake card manifest (shape of shared/cards.js): 176 common, 25 futsal, 50 rare, 13 legend.
const FAKE_CARDS = [];
const addCards = (cat, n, named = []) => {
  for (let i = 0; i < n; i++) {
    const id = named[i] || `${cat}-${i}`;
    FAKE_CARDS.push({ id, name: id, cat });
  }
};
addCards('common', 176, ['pedri', 'harry-kane', 'thibaut-courtois']);
addCards('futsal', 25);
addCards('rare', 50, ['kylian-mbappe', 'lamine-yamal']);
addCards('legend', 13, ['lionel-messi']);

// One "browser" loading kf.js. Fake timers: dev.tick(ms).
const settle = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setImmediate(r));
};

const FakeDateBase = Date.now();
const loadDevice = (srv, { search = '', localStorage = makeStorage(), sessionStorage = makeStorage(), token = null, cards = FAKE_CARDS } = {}) => {
  const dev = { token, listeners: {}, docListeners: {}, timers: [], now: 0, nextId: 1, fetches: 0, localStorage, sessionStorage };
  const sandbox = {
    localStorage,
    sessionStorage,
    location: { search },
    document: (dev.doc = {
      visibilityState: 'visible',
      addEventListener: (t, fn) => (dev.docListeners[t] ||= []).push(fn),
    }),
    crypto: { randomUUID },
    Date: class extends Date {
      constructor(...a) {
        super(...(a.length ? a : [FakeDateBase + dev.now]));
      }
      static now() {
        return FakeDateBase + dev.now;
      }
    },
    URLSearchParams,
    btoa,
    atob,
    console,
    fetch: async (url, opts = {}) => {
      dev.fetches++;
      dev.lastOpts = opts;
      return srv.handle(dev, opts.method || 'GET', url, opts.body ? JSON.parse(opts.body) : undefined);
    },
    setTimeout: (fn, ms) => {
      const id = dev.nextId++;
      dev.timers.push({ id, fn, at: dev.now + ms });
      return id;
    },
    clearTimeout: (id) => {
      dev.timers = dev.timers.filter((t) => t.id !== id);
    },
  };
  sandbox.window = sandbox;
  if (cards) sandbox.KF_CARDS = cards;
  sandbox.addEventListener = (t, fn) => (dev.listeners[t] ||= []).push(fn);
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  dev.KF = sandbox.KF;
  dev.fire = (t, e = {}) => (dev.listeners[t] || []).forEach((fn) => fn(e));
  dev.tick = async (ms) => {
    dev.now += ms;
    for (;;) {
      const due = dev.timers.filter((t) => t.at <= dev.now).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      dev.timers = dev.timers.filter((t) => t !== due);
      due.fn();
      await settle();
    }
    await settle();
  };
  return dev;
};

const plain = (x) => JSON.parse(JSON.stringify(x));
const slot = (dev, id = 1) => JSON.parse(dev.localStorage.getItem(`kf-sync-u${id}`));

test('guest flow unchanged, no network', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  const { KF } = d;
  assert.equal(KF.auth.status, 'guest');
  assert.equal(KF.auth.user, null);
  KF.answer('x', true);
  KF.answer('x', true);
  assert.equal(KF.get().coins, 2);
  assert.equal(KF.finishGame('x', { score: 5, max: 5 }).perfect, true);
  assert.equal(KF.get().coins, 7);
  assert.ok(d.localStorage.getItem('kf-progress-v1'));
  assert.equal(JSON.parse(d.localStorage.getItem('kf-progress-v1')).coins, 7);
  KF.addCoins(10);
  assert.equal(KF.openPack().length, 3);
  assert.equal(KF.importCode(KF.exportCode()), true);
  await d.tick(5000);
  assert.equal(d.fetches, 0);
  assert.equal(KF.auth.hasGuestProgress(), true);
  KF.reset();
  assert.equal(KF.get().coins, 0);
  assert.equal(KF.auth.hasGuestProgress(), false);
});

test('login: bad pin, then pull + debounced push', async () => {
  const srv = makeServer();
  srv.sessions.set('seed', 1);
  srv.progress.set(1, { rev: 3, state: { v: 1, coins: 40, cards: { 'lionel-messi': 1 }, achievements: { legend: 1 }, games: {}, gameData: {}, stats: { correct: 5 } } });
  const d = loadDevice(srv);
  const { KF } = d;
  const events = [];
  KF.on('auth', (e) => events.push(e.status));
  const bad = await KF.auth.login(1, '9999');
  assert.equal(bad.ok, false);
  assert.equal(bad.error, 'bad_pin');
  assert.equal(bad.attemptsLeft, 4);
  assert.equal(KF.auth.user, null);
  const ok = await KF.auth.login(1, '1234');
  assert.equal(ok.ok, true);
  assert.equal(ok.user.name, 'Keeper');
  assert.equal(ok.hasGuestProgress, false);
  assert.equal(KF.auth.status, 'synced');
  assert.equal(KF.get().coins, 40);
  assert.equal(slot(d).baseRev, 3);
  assert.equal(d.localStorage.getItem('kf-progress-v1'), null);
  const puts = srv.puts.length;
  KF.answer('x', true);
  assert.equal(KF.get().coins, 41);
  assert.equal(KF.auth.status, 'pending');
  KF.answer('x', true);
  await d.tick(1000);
  assert.equal(srv.puts.length, puts, 'debounced: nothing sent yet');
  await d.tick(600);
  assert.equal(srv.puts.length, puts + 1, 'one push for two answers');
  assert.equal(srv.progress.get(1).state.coins, 42);
  assert.equal(srv.progress.get(1).rev, 4);
  assert.equal(KF.auth.status, 'synced');
  assert.ok(events.includes('pending') && events.includes('synced'));
  // second page load restores the session
  const d2 = loadDevice(srv, { localStorage: d.localStorage, token: d.token });
  assert.equal(d2.KF.auth.user.id, 1);
  assert.equal(d2.KF.get().coins, 42);
  await settle();
  assert.equal(d2.KF.auth.status, 'synced');
});

test('guest login + adoptGuest adds guest coins', async () => {
  const srv = makeServer();
  srv.progress.set(1, { rev: 1, state: { v: 1, coins: 5, cards: {}, achievements: {}, games: {}, gameData: {}, stats: {} } });
  const d = loadDevice(srv);
  const { KF } = d;
  KF.addCoins(3);
  assert.equal(KF.auth.hasGuestProgress(), true);
  const r = await KF.auth.login(1, '1234');
  assert.equal(r.hasGuestProgress, true);
  assert.equal(KF.get().coins, 5, 'guest progress not mixed in until adopted');
  assert.equal(KF.auth.adoptGuest(), true);
  assert.equal(KF.get().coins, 8);
  assert.equal(d.localStorage.getItem('kf-progress-v1'), null);
  assert.equal(KF.auth.hasGuestProgress(), false);
  await d.tick(2000);
  assert.equal(srv.progress.get(1).state.coins, 8);
});

test('two devices earn concurrently and converge', async () => {
  const srv = makeServer();
  const A = loadDevice(srv);
  const B = loadDevice(srv);
  await A.KF.auth.login(1, '1234');
  await B.KF.auth.login(1, '1234');
  // A: 3 correct in a row + messi + kane
  for (let i = 0; i < 3; i++) A.KF.answer('x', true);
  A.KF.giveCard('lionel-messi');
  A.KF.giveCard('harry-kane');
  A.KF.finishGame('g', { score: 3, max: 5 });
  await A.tick(2000);
  assert.equal(srv.progress.get(1).state.coins, 3);
  // B (still on rev 0): 2 correct + pedri + kane
  B.KF.answer('x', true);
  B.KF.answer('x', true);
  B.KF.giveCard('pedri');
  B.KF.giveCard('harry-kane');
  B.KF.finishGame('g', { score: 2, max: 5 });
  await B.tick(2000); // 409 -> merge -> push
  const s = srv.progress.get(1).state;
  assert.equal(srv.progress.get(1).rev, 2);
  assert.equal(s.coins, 5);
  assert.deepEqual(Object.keys(s.cards).sort(), ['harry-kane', 'lionel-messi', 'pedri']);
  assert.equal(s.cards['harry-kane'], 2);
  assert.equal(s.stats.bestStreak, 3);
  assert.equal(s.stats.correct, 5);
  assert.equal(s.stats.games, 2);
  assert.equal(s.games.g.plays, 2);
  assert.equal(s.games.g.best, 3);
  assert.equal(B.KF.get().coins, 5);
  assert.equal(B.KF.auth.status, 'synced');
  assert.equal(srv.results.size, 2);
  // A catches up on focus
  await A.tick(5000);
  A.fire('focus');
  await settle();
  assert.equal(A.KF.get().coins, 5);
  assert.deepEqual(Object.keys(A.KF.get().cards).sort(), ['harry-kane', 'lionel-messi', 'pedri']);
  assert.equal(A.KF.auth.status, 'synced');
  // no double counting after more rounds of syncing
  A.fire('focus');
  B.fire('focus');
  await A.tick(5000);
  await B.tick(5000);
  assert.equal(srv.progress.get(1).state.coins, 5);
  assert.equal(A.KF.get().coins, 5);
  assert.equal(B.KF.get().coins, 5);
});

test('401 -> expired, local kept; re-login resumes push', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  await d.KF.auth.login(1, '1234');
  srv.sessions.clear();
  d.KF.answer('x', true);
  await d.tick(2000);
  assert.equal(d.KF.auth.status, 'expired');
  assert.equal(d.KF.get().coins, 1);
  assert.equal(slot(d).state.coins, 1);
  assert.equal(slot(d).dirty, true);
  const calls = srv.calls;
  d.KF.answer('x', true);
  await d.tick(60000);
  assert.equal(srv.calls, calls, 'no requests while expired');
  assert.equal(d.KF.get().coins, 2);
  const r = await d.KF.auth.login(1, '1234');
  assert.equal(r.ok, true);
  await d.tick(2000);
  assert.equal(d.KF.auth.status, 'synced');
  assert.equal(srv.progress.get(1).state.coins, 2);
});

test('results outbox sent once', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  await d.KF.auth.login(1, '1234');
  d.KF.finishGame('a', { score: 4, max: 5 });
  assert.equal(slot(d).outbox.length, 1);
  await d.tick(2000);
  const p1 = srv.puts.at(-1);
  assert.equal(p1.results.length, 1);
  assert.deepEqual(Object.keys(p1.results[0]).sort(), ['at', 'id', 'max', 'score', 'slug']);
  assert.equal(slot(d).outbox.length, 0);
  d.KF.answer('a', true);
  await d.tick(2000);
  assert.equal(srv.puts.at(-1).results.length, 0);
  assert.equal(srv.results.size, 1);
});

test('offline -> status offline, backoff retry, recovers', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  await d.KF.auth.login(1, '1234');
  srv.down = true;
  d.KF.finishGame('a', { score: 1, max: 5 });
  d.KF.answer('a', true);
  await d.tick(2000);
  assert.equal(d.KF.auth.status, 'offline');
  assert.equal(slot(d).outbox.length, 1);
  assert.equal(d.KF.get().coins, 1);
  const calls = srv.calls;
  await d.tick(2000); // backoff: not retried yet (5s)
  assert.equal(srv.calls, calls);
  await d.tick(4000);
  assert.ok(srv.calls > calls && srv.calls <= calls + 2, 'one retry');
  const c2 = srv.calls;
  await d.tick(4000); // second backoff is 10s
  assert.equal(srv.calls, c2);
  srv.down = false;
  d.fire('online');
  await settle();
  assert.equal(d.KF.auth.status, 'synced');
  assert.equal(srv.progress.get(1).state.coins, 1);
  assert.equal(srv.results.size, 1);
});

test('hidden -> keepalive push; logout pushes first', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  await d.KF.auth.login(1, '1234');
  d.KF.addCoins(2);
  d.doc.visibilityState = 'hidden';
  d.docListeners.visibilitychange.forEach((fn) => fn());
  await settle();
  assert.equal(d.lastOpts.keepalive, true);
  assert.equal(srv.progress.get(1).state.coins, 2);
  d.doc.visibilityState = 'visible';
  d.KF.addCoins(1);
  const out = await d.KF.auth.logout();
  assert.equal(out.ok, true);
  assert.equal(srv.progress.get(1).state.coins, 3);
  assert.equal(d.KF.auth.user, null);
  assert.equal(d.KF.auth.status, 'guest');
  assert.equal(d.KF.get().coins, 0, 'back to guest state');
  assert.equal(d.localStorage.getItem('kf-user'), null);
  // logout fails when unsynced and server down
  await d.KF.auth.login(1, '1234');
  d.KF.addCoins(1);
  srv.down = true;
  const out2 = await d.KF.auth.logout();
  assert.equal(out2.ok, false);
  assert.equal(d.KF.auth.user.id, 1);
});

test('force logout: expired + dirty drops slot; synced logs out plainly', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  await d.KF.auth.login(1, '1234');
  d.KF.finishGame('a', { score: 1, max: 5 });
  srv.sessions.clear();
  await d.tick(2000);
  assert.equal(d.KF.auth.status, 'expired');
  assert.deepEqual(plain(await d.KF.auth.logout()), { ok: false });
  assert.equal(d.KF.auth.user.id, 1);
  const events = [];
  d.KF.on('auth', (e) => events.push(e.status));
  assert.deepEqual(plain(await d.KF.auth.logout({ force: true })), { ok: true, lost: true });
  assert.equal(d.KF.auth.user, null);
  assert.equal(d.KF.auth.status, 'guest');
  assert.deepEqual(events, ['guest']);
  assert.equal(d.localStorage.getItem('kf-user'), null);
  assert.equal(d.localStorage.getItem('kf-sync-u1'), null);
  assert.equal(d.KF.get().coins, 0);
  // synced: force logout loses nothing
  await d.KF.auth.login(1, '1234');
  d.KF.addCoins(2);
  await d.tick(2000);
  assert.deepEqual(plain(await d.KF.auth.logout({ force: true })), { ok: true, lost: false });
  assert.equal(srv.progress.get(1).state.coins, 2);
  await d.KF.auth.login(1, '1234');
  assert.deepEqual(plain(await d.KF.auth.logout()), { ok: true, lost: false });
});

test('cross-tab storage event for logged-in key', async () => {
  const srv = makeServer();
  const d = loadDevice(srv);
  await d.KF.auth.login(1, '1234');
  const s = slot(d);
  s.state.coins = 77;
  d.localStorage.setItem('kf-sync-u1', JSON.stringify(s));
  let changed = 0;
  d.KF.on('change', () => changed++);
  d.fire('storage', { key: 'kf-sync-u1' });
  assert.equal(d.KF.get().coins, 77);
  assert.equal(changed, 1);
});

test('test mode never logs in or touches network', async () => {
  const srv = makeServer();
  const ls = makeStorage();
  ls.setItem('kf-user', JSON.stringify({ id: 1, name: 'Keeper' }));
  ls.setItem('kf-progress-v1', JSON.stringify({ v: 1, coins: 9 }));
  const d = loadDevice(srv, { search: '?parent', localStorage: ls });
  const { KF } = d;
  assert.equal(KF.TEST_MODE, true);
  assert.equal(KF.auth.user, null);
  assert.equal(KF.auth.status, 'guest');
  assert.equal(KF.get().coins, 100);
  assert.deepEqual(plain(await KF.auth.login(1, '1234')), { ok: false, error: 'test_mode' });
  assert.deepEqual(plain(await KF.auth.users()), { ok: false, error: 'test_mode' });
  KF.answer('x', true);
  KF.finishGame('x', { score: 1, max: 1 });
  d.fire('focus');
  d.fire('online');
  d.fire('storage', { key: 'kf-user' });
  await d.tick(10000);
  assert.equal(KF.auth.hasGuestProgress(), false);
  assert.equal(d.fetches, 0);
  assert.equal(ls.getItem('kf-progress-v1'), JSON.stringify({ v: 1, coins: 9 }));
});

test('merge3 rules', () => {
  const { KF } = loadDevice(makeServer());
  const m = KF._merge3;
  const mk = (o) => ({
    v: 1, coins: 0, cards: {}, achievements: {}, games: {}, gameData: {},
    ...o,
    stats: { correct: 0, wrong: 0, games: 0, perfect: 0, streak: 0, bestStreak: 0, packs: 0, dayStreak: 0, lastDay: '', ...(o.stats || {}) },
  });
  const base = mk({ coins: 10, stats: { correct: 10, bestStreak: 4 }, games: { g: { plays: 1, best: 3, max: 5, lastPlayed: 100 } }, gameData: { goalkeeper: { saves: 5, name: 'a', list: [1] } } });
  const local = mk({
    coins: 7, achievements: { a: 50 }, cards: { messi: 1 }, stats: { correct: 12, bestStreak: 6, streak: 2, dayStreak: 3, lastDay: '2026-01-02' },
    games: { g: { plays: 2, best: 4, max: 5, lastPlayed: 200 } }, gameData: { goalkeeper: { saves: 8, name: 'b', list: [1, 2] } },
  });
  const server = mk({
    coins: 15, achievements: { a: 40, b: 60 }, cards: { pedri: 2 }, stats: { correct: 11, bestStreak: 5, streak: 1, dayStreak: 1, lastDay: '2026-01-01' },
    games: { g: { plays: 1, best: 3, max: 5, lastPlayed: 100 }, h: { plays: 1, best: 1, max: 1, lastPlayed: 1 } }, gameData: { goalkeeper: { saves: 5, name: 'a', list: [1, 3] } },
  });
  const r = m(base, local, server);
  assert.equal(r.coins, 12); // 15 + (7-10)
  assert.equal(r.stats.correct, 13); // 11 + 2
  assert.equal(r.stats.bestStreak, 6);
  assert.equal(r.stats.streak, 2); // later lastDay (local)
  assert.equal(r.stats.dayStreak, 3);
  assert.equal(r.stats.lastDay, '2026-01-02');
  assert.deepEqual(plain(r.cards), { messi: 1, pedri: 2 });
  assert.deepEqual(plain(r.achievements), { a: 40, b: 60 });
  assert.equal(r.games.g.plays, 2);
  assert.equal(r.games.g.best, 4);
  assert.equal(r.games.g.lastPlayed, 200);
  assert.equal(r.games.h.plays, 1);
  assert.equal(r.gameData.goalkeeper.saves, 8);
  assert.equal(r.gameData.goalkeeper.name, 'b'); // changed locally
  assert.deepEqual(plain(r.gameData.goalkeeper.list).sort(), [1, 2, 3]);
  // coins never negative
  assert.equal(m(mk({ coins: 50 }), mk({ coins: 0 }), mk({ coins: 10 })).coins, 0);
  // untouched local value -> server value wins
  assert.equal(m(base, base, server).gameData.goalkeeper.name, 'a');
});

const freshState = (o) => ({ v: 1, coins: 0, cards: {}, achievements: {}, games: {}, gameData: {}, stats: {}, ...o });

test('pack odds roughly match category weights', () => {
  const { KF } = loadDevice(makeServer());
  assert.equal(Object.keys(KF.CARD_CATS).join(), 'common,futsal,rare,legend');
  const n = Math.ceil(20000 / KF.PACK_SIZE);
  const count = { common: 0, futsal: 0, rare: 0, legend: 0 };
  for (let i = 0; i < n; i++) {
    KF.addCoins(KF.PACK_PRICE);
    for (const c of KF.openPack()) count[c.cat]++;
  }
  const total = Object.values(count).reduce((a, b) => a + b, 0);
  for (const [k, w] of Object.entries({ common: 75, futsal: 13, rare: 10, legend: 2 })) {
    const pct = (count[k] / total) * 100;
    assert.ok(Math.abs(pct - w) < 1.5, `${k}: ${pct.toFixed(2)}% vs ${w}%`);
  }
  assert.equal(KF.get().stats.packs, n);
});

test('openPack: coins, price, pack event, empty manifest', () => {
  const { KF } = loadDevice(makeServer());
  assert.equal(KF.openPack(), null);
  KF.addCoins(25);
  let pack = null;
  let cardEvents = 0;
  KF.on('pack', (p) => (pack = p));
  KF.on('card', () => cardEvents++);
  const got = KF.openPack();
  assert.equal(got.length, 3);
  assert.equal(KF.get().coins, 15);
  assert.equal(pack.length, 3);
  assert.equal(cardEvents, 0);
  assert.ok(got.every((c) => typeof c.isNew === 'boolean' && c.id && c.cat));
  assert.equal(Object.values(KF.get().cards).reduce((a, b) => a + b, 0), 3);
  // no manifest: kf.js still works
  const e = loadDevice(makeServer(), { cards: null }).KF;
  e.addCoins(20);
  assert.equal(e.openPack(), null);
  assert.equal(e.giveCard('x'), null);
  assert.equal(e.duplicates(), 0);
  assert.equal(e.cardImg('a', true).endsWith('images/cards/thumb/a.webp'), true);
});

test('giveCard: isNew, unknown id, card event, achievements', () => {
  const { KF } = loadDevice(makeServer());
  const events = [];
  KF.on('card', (c) => events.push(c));
  const a = KF.giveCard('thibaut-courtois');
  assert.equal(a.isNew, true);
  assert.equal(a.cat, 'common');
  assert.equal(KF.giveCard('thibaut-courtois').isNew, false);
  assert.equal(KF.giveCard('nope'), null);
  assert.equal(events.length, 2);
  assert.equal(KF.get().cards['thibaut-courtois'], 2);
  KF.giveCard('lionel-messi');
  KF.giveCard('kylian-mbappe');
  assert.ok(KF.get().achievements.legend && KF.get().achievements.rare);
  assert.ok(!KF.get().achievements['album-10']);
  for (let i = 0; i < 5; i++) KF.giveCard(`futsal-${i}`);
  assert.ok(KF.get().achievements.futsal);
  for (let i = 0; i < 7; i++) KF.giveCard(`common-${i}`);
  assert.ok(KF.get().achievements['album-10']);
});

test('sellDuplicate keeps one copy and pays by category', () => {
  const { KF } = loadDevice(makeServer());
  assert.equal(KF.sellDuplicate('pedri'), 0);
  KF.giveCard('pedri');
  assert.equal(KF.sellDuplicate('pedri'), 0, 'single copy is never sold');
  KF.giveCard('pedri');
  KF.giveCard('pedri');
  KF.giveCard('lionel-messi');
  KF.giveCard('lionel-messi');
  assert.equal(KF.duplicates(), 3);
  assert.equal(KF.sellDuplicate('pedri'), 2);
  assert.equal(KF.get().cards.pedri, 2);
  assert.equal(KF.get().coins, 2);
  assert.equal(KF.sellAllDuplicates(), 2 + 15);
  assert.equal(KF.get().coins, 19);
  assert.equal(KF.get().cards.pedri, 1);
  assert.equal(KF.get().cards['lionel-messi'], 1);
  assert.equal(KF.duplicates(), 0);
  assert.equal(KF.sellAllDuplicates(), 0);
});

test('sticker migration: once, idempotent, refunds', async () => {
  const srv = makeServer();
  const ls = makeStorage();
  ls.setItem('kf-progress-v1', JSON.stringify(freshState({
    coins: 4,
    cards: undefined,
    stickers: { messi: 2, 'courtois-gold': 1, courtois: 1, mudryk: 2, dovbyk: 1, shevchenko: 1, kane: 1, bogus: 1 },
  })));
  const d = loadDevice(srv, { localStorage: ls });
  const st = d.KF.get();
  assert.equal(st.stickers, undefined);
  assert.deepEqual(plain(st.cards), { 'lionel-messi': 2, 'thibaut-courtois': 2, 'harry-kane': 1 });
  assert.equal(st.coins, 4 + 2 * 5 + 3 + 10 + 3); // mudryk x2, dovbyk, shevchenko, bogus
  d.KF.addCoins(0);
  d.KF.answer('x', false); // persist
  const saved = JSON.parse(ls.getItem('kf-progress-v1'));
  assert.equal(saved.stickers, undefined);
  const d2 = loadDevice(srv, { localStorage: ls });
  assert.deepEqual(plain(d2.KF.get().cards), plain(st.cards));
  assert.equal(d2.KF.get().coins, st.coins, 'second load does not refund again');
  // no manifest: nothing converted, nothing lost
  const ls2 = makeStorage();
  ls2.setItem('kf-progress-v1', JSON.stringify(freshState({ stickers: { messi: 1 } })));
  const d3 = loadDevice(srv, { localStorage: ls2, cards: null });
  assert.equal(d3.KF.get().coins, 0);
  assert.deepEqual(plain(d3.KF.get().stickers), { messi: 1 });
  // synced user state with stickers on the server is migrated too
  srv.progress.set(1, { rev: 1, state: freshState({ coins: 1, stickers: { yamal: 1, gavi: 1 } }) });
  const d4 = loadDevice(srv);
  await d4.KF.auth.login(1, '1234');
  assert.equal(d4.KF.get().cards['lamine-yamal'], 1);
  assert.equal(d4.KF.get().coins, 1 + 3); // gavi has no card in the fake manifest
  assert.equal(d4.KF.get().stickers, undefined);
});

test('two devices selling the same duplicate keep the card', async () => {
  const srv = makeServer();
  const A = loadDevice(srv);
  const B = loadDevice(srv);
  await A.KF.auth.login(1, '1234');
  A.KF.giveCard('pedri');
  A.KF.giveCard('pedri');
  await A.tick(2000);
  await B.KF.auth.login(1, '1234');
  assert.equal(B.KF.get().cards.pedri, 2);
  assert.equal(A.KF.sellDuplicate('pedri'), 2);
  assert.equal(B.KF.sellDuplicate('pedri'), 2);
  await A.tick(2000);
  await B.tick(2000);
  assert.equal(srv.progress.get(1).state.cards.pedri, 1);
  assert.equal(srv.progress.get(1).state.coins, 4, 'both sales are paid');
  A.fire('focus');
  await A.tick(5000);
  assert.equal(A.KF.get().cards.pedri, 1);
  assert.equal(B.KF.get().cards.pedri, 1);
  // merge3 directly: card counts never drop below 1
  const m = A.KF._merge3;
  const r = m(freshState({ cards: { x: 2 } }), freshState({ cards: { x: 1 } }), freshState({ cards: { x: 1 } }));
  assert.equal(r.cards.x, 1);
});
