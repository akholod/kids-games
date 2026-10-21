import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const code = fs.readFileSync(fileURLToPath(new URL('../../shared/kf.js', import.meta.url)), 'utf8');

const makeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};
const load = (lang = 'uk') => {
  const sandbox = {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    location: { search: '?parent' },
    document: { visibilityState: 'visible', addEventListener() {} },
    KF_SITE: { lang },
    KF_CARDS: [],
    URLSearchParams,
    btoa,
    atob,
    console,
    crypto: { randomUUID: () => 'x' },
    fetch: async () => {
      throw new TypeError('offline');
    },
    setTimeout: () => 0,
    clearTimeout() {},
    addEventListener() {},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.KF;
};

const KF = load();
const ach = (id) => KF.ACHIEVEMENTS.find((a) => a.id === id);
const state = (o = {}) => ({ v: 1, coins: 0, cards: {}, achievements: {}, games: {}, gameData: {}, stats: {}, ...o });
const squad = (n, extra = {}) => ({
  w: {
    ...Object.fromEntries(Array.from({ length: n }, (_, i) => [`w${i}`, { ok: 2, miss: 0, run: 2, team: 1 }])),
    ...extra,
  },
});

test('words-30: 30 squad words (team flag), not just seen words', () => {
  const a = ach('words-30');
  assert.equal(a.check(state()), false);
  assert.equal(a.check(state({ gameData: { 'word-match-words': squad(29) } })), false);
  assert.equal(a.check(state({ gameData: { 'word-match-words': squad(30) } })), true);
  const seen = { s1: { ok: 1, miss: 0, run: 1, team: 0 }, s2: { ok: 0, miss: 3, run: 0, team: 0 } };
  assert.equal(a.check(state({ gameData: { 'word-match-words': squad(29, seen) } })), false, 'words outside the squad do not count');
  assert.equal(a.check(state({ gameData: { 'word-match-words': squad(29, { x: { team: 1 } }) } })), true);
});

test('math-exam: best score above a training round (8) = a finished exam', () => {
  const a = ach('math-exam');
  assert.equal(a.check(state()), false);
  assert.equal(a.check(state({ games: { 'math-exam': { plays: 9, best: 8, max: 8, lastPlayed: 1 } } })), false, 'perfect training round');
  assert.equal(a.check(state({ games: { 'math-exam': { plays: 1, best: 11, max: 12, lastPlayed: 1 } } })), true);
  assert.equal(a.check(state({ games: { 'math-exam': { plays: 1, best: 12, max: 12, lastPlayed: 1 } } })), true);
  assert.equal(a.check(state({ games: { 'penalty-multiply': { plays: 1, best: 12, max: 12, lastPlayed: 1 } } })), false, 'other games');
});

test('planet-notable: exam nota ≥ 7 (Notable) or better', () => {
  const a = ach('planet-notable');
  const exam = (n) => state({ gameData: { 'sociales-planeta': { exam: { n, grade: 'x', nota: String(n) } } } });
  assert.equal(a.check(state()), false);
  assert.equal(a.check(state({ gameData: { 'sociales-planeta': { st: {} } } })), false, 'no exam yet');
  assert.equal(a.check(exam(6.9)), false, 'Bien');
  assert.equal(a.check(exam(7)), true, 'Notable');
  assert.equal(a.check(exam(10)), true, 'Sobresaliente');
  assert.equal(a.check(state({ gameData: { 'word-match': { exam: { n: 10 } } } })), false, 'another unit');
});

test('new achievements unlock through the normal commit path (toast event)', () => {
  const kf = load();
  const got = [];
  kf.on('achievement', (a) => got.push(a.id));
  kf.gameData('sociales-planeta', { exam: { n: 8, grade: 'Notable', nota: '8,0' } });
  kf.gameData('word-match-words', squad(30));
  assert.equal(kf.get().achievements['planet-notable'] > 0, true);
  assert.equal(kf.get().achievements['words-30'] > 0, true);
  assert.ok(got.includes('planet-notable') && got.includes('words-30'));
  kf.finishGame('math-exam', { score: 11, max: 12 });
  assert.ok(kf.get().achievements['math-exam']);
});

test('texts: uk Ukrainian, es Spanish without Cyrillic', () => {
  const es = load('es');
  for (const id of ['words-30', 'math-exam', 'planet-notable']) {
    const u = ach(id);
    const e = es.ACHIEVEMENTS.find((a) => a.id === id);
    assert.ok(u.icon && /[\u0400-\u04FF]/.test(u.title + u.desc), id);
    assert.ok(e.title && e.desc && !/[\u0400-\u04FF]/.test(e.title + e.desc), id);
    assert.notEqual(u.title, e.title);
    assert.notEqual(u.title, id, 'title is translated, not the key');
  }
});
