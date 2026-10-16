import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const code = fs.readFileSync(`${root}shared/kf.js`, 'utf8');
const uiCode = fs.readFileSync(`${root}shared/kf-ui.js`, 'utf8');
// kf.js as it was before localization (git HEAD): the Ukrainian site must stay byte-identical to it.
const oldCode = execFileSync('git', ['show', 'HEAD:shared/kf.js'], { cwd: root, encoding: 'utf8' });

const CYR = /[\u0400-\u04FF]/;

const makeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};

const CARDS = [
  { id: 'a', name: 'A', cat: 'common' },
  { id: 'b', name: 'B', cat: 'legend' },
];

// Loads a kf.js source like a browser would. site = window.KF_SITE (undefined = no site.js), search = location.search.
const load = (src, { site, search = '' } = {}) => {
  const sandbox = {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    location: { search },
    document: { visibilityState: 'visible', addEventListener() {} },
    URLSearchParams, btoa, atob, console,
    crypto: { randomUUID: () => 'x' },
    fetch: async () => { throw new TypeError('offline'); },
    setTimeout: () => 0,
    clearTimeout() {},
    KF_CARDS: CARDS,
    addEventListener() {},
  };
  if (site) sandbox.KF_SITE = site;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.KF;
};

const texts = (KF) => ({
  ach: KF.ACHIEVEMENTS.map((a) => ({ id: a.id, icon: a.icon, title: a.title, desc: a.desc })),
  cats: Object.fromEntries(Object.entries(KF.CARD_CATS).map(([k, v]) => [k, v.label])),
  categories: JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(KF.CATEGORIES).filter(([k]) => k !== 'sociales')))),
  games: JSON.parse(JSON.stringify(legacy(KF.GAMES).map(({ slug, title, emoji, category, desc, status }) => ({ slug, title, emoji, category, desc, status })))),
});

const plain = (x) => JSON.parse(JSON.stringify(x));
// Games added after the i18n migration: the snapshot checks below are about the games that existed then.
const NEW_GAMES = new Set(['sociales-planeta']);
const legacy = (list) => list.filter((g) => !NEW_GAMES.has(g.slug));


test('uk: texts byte-identical to HEAD', () => {
  const now = load(code, { site: { lang: 'uk' } });
  const old = load(oldCode);
  assert.equal(now.lang, 'uk');
  assert.deepEqual(plain(texts(now)), plain(texts(old)));
});

test('uk: default without site.js, and unknown lang falls back to uk', () => {
  assert.equal(load(code).lang, 'uk');
  assert.equal(load(code, { site: { lang: 'fr' } }).lang, 'uk');
});

test('uk: siteGames = previous catalog (listed games), uk texts', () => {
  for (const search of ['', '?parent']) {
    const now = load(code, { site: { lang: 'uk' }, search });
    const old = load(oldCode, { search });
    const expected = legacy(old.GAMES.filter((g) => old.isListed(g))).map(({ slug, title, desc }) => ({ slug, title, desc }));
    assert.deepEqual(plain(legacy(now.siteGames()).map(({ slug, title, desc }) => ({ slug, title, desc }))), plain(expected));
    assert.equal(legacy(now.siteGames()).length, 5);
  }
});

test('es: achievements, categories, card categories are Spanish, no Cyrillic', () => {
  const KF = load(code, { site: { lang: 'es' } });
  assert.equal(KF.lang, 'es');
  assert.equal(KF.ACHIEVEMENTS.length, 20);
  const uk = load(code, { site: { lang: 'uk' } });
  KF.ACHIEVEMENTS.forEach((a, i) => {
    assert.equal(a.id, uk.ACHIEVEMENTS[i].id);
    assert.ok(a.title && a.desc);
    assert.ok(!CYR.test(a.title + a.desc), a.id);
    assert.notEqual(a.title, uk.ACHIEVEMENTS[i].title, a.id);
    assert.notEqual(a.desc, uk.ACHIEVEMENTS[i].desc, a.id);
  });
  for (const v of Object.values(KF.CARD_CATS)) assert.ok(!CYR.test(v.label) && v.label);
  for (const v of Object.values(KF.CATEGORIES)) assert.ok(!CYR.test(v.title) && v.title);
  assert.equal(KF.CARD_CATS.legend.weight, 2);
});

test('es: siteGames = math-exam + football-quiz, Spanish, no Cyrillic', () => {
  const KF = load(code, { site: { lang: 'es' } });
  const list = legacy(KF.siteGames());
  assert.deepEqual(plain(list.map((g) => g.slug)), ['math-exam', 'football-quiz']);
  for (const g of list) assert.ok(!CYR.test(g.title + g.desc), g.slug);
  assert.equal(list[0].title, 'Examen de mates');
  assert.equal(list[1].title, 'Quiz de fútbol');
  // KF.GAMES is untouched (Ukrainian texts, for compatibility)
  assert.equal(KF.GAMES.find((g) => g.slug === 'football-quiz').title, 'Футбольний квіз');
});

test('siteGames respects status: beta only in test mode, soon is listed', () => {
  const KF = load(code, { site: { lang: 'es' } });
  const g = KF.GAMES.find((x) => x.slug === 'math-exam');
  g.status = 'beta';
  assert.deepEqual(plain(legacy(KF.siteGames()).map((x) => x.slug)), ['football-quiz']);
  const T = load(code, { site: { lang: 'es' }, search: '?parent' });
  T.GAMES.find((x) => x.slug === 'math-exam').status = 'beta';
  assert.deepEqual(plain(legacy(T.siteGames()).map((x) => x.slug)), ['math-exam', 'football-quiz']);
});

test('?lang override sticks in the tab', () => {
  const sandboxSearch = load(code, { site: { lang: 'uk' }, search: '?lang=es' });
  assert.equal(sandboxSearch.lang, 'es');
  assert.deepEqual(plain(legacy(sandboxSearch.siteGames()).map((g) => g.slug)), ['math-exam', 'football-quiz']);
});

test('every game declares sites and Spanish texts', () => {
  const KF = load(code);
  for (const g of KF.GAMES) {
    assert.ok(Array.isArray(g.sites) && g.sites.includes('uk'), g.slug);
    assert.ok(g.es && g.es.title && g.es.desc && !CYR.test(g.es.title + g.es.desc), g.slug);
  }
});

// kf-ui.js toasts / sync labels / test ribbon
const loadUi = (lang) => {
  const KF = load(code, { site: { lang } });
  const toasts = [];
  const el = () => {
    const n = { className: '', style: { setProperty() {} }, children: [], parentNode: null, classList: { add() {} }, setAttribute() {}, matches: () => false, dataset: {}, set textContent(v) { toasts.push(v); } };
    n.append = (...c) => c.forEach((x) => { x.parentNode = n; n.children.push(x); });
    n.remove = () => { if (n.parentNode) n.parentNode.children = n.parentNode.children.filter((x) => x !== n); n.parentNode = null; };
    Object.defineProperty(n, 'firstElementChild', { get: () => n.children[0] });
    return n;
  };
  const doc = { createElement: el, body: Object.assign(el(), { prepend() {} }), querySelectorAll: () => [] };
  const sandbox = { KF, document: doc, matchMedia: () => ({ matches: true }), setTimeout: () => 0, location: { pathname: '/' }, window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(uiCode, sandbox);
  return { KF, UI: sandbox.window.KFUI, toasts };
};

test('kf-ui: es sync labels and toasts have no Cyrillic', () => {
  const { KF, UI, toasts } = loadUi('es');
  for (const v of Object.values(UI.SYNC)) assert.ok(v.short && v.long && !CYR.test(v.short + v.long));
  KF.addCoins(2);
  KF.answer('x', true);
  for (let i = 0; i < 10; i++) KF.answer('x', true);
  assert.ok(toasts.some((t) => t.startsWith('+')), 'coin toast');
  assert.ok(toasts.some((t) => t.includes('nuevo logro')), 'achievement toast');
  KF.giveCard('b');
  assert.ok(toasts.some((t) => t.includes('Carta nueva')), 'card toast');
  for (const t of toasts) assert.ok(!CYR.test(t), t);
});

test('kf-ui: uk texts unchanged', () => {
  const { KF, UI, toasts } = loadUi('uk');
  assert.equal(UI.SYNC.synced.short, 'Збережено ✓');
  assert.equal(UI.SYNC.expired.long, 'Введи PIN ще раз, щоб прогрес зберігався.');
  assert.equal(UI.SYNC.offline.long, 'Немає інтернету. Прогрес чекає тут і збережеться, коли інтернет повернеться.');
  KF.giveCard('b');
  assert.ok(toasts.includes('🌟 Нова картка: B!'));
  assert.ok(toasts.some((t) => t === '🏅 Легенда! — нове досягнення!' || t.endsWith('— нове досягнення!')));
});
