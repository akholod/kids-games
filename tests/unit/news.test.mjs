// «What's new» (KF.news / KF.seeNews, shared/news.js): kf.js booted in a vm sandbox with a fixed clock.
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const read = (p) => fs.readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');
const code = read('../../shared/kf.js');
// The feature is 'ready' (the kids get it). The 'beta' gate (test mode only) is checked on a copy of kf.js
// with NEWS_STATUS = 'beta' (test-side only; kf.js is not changed).
const READY = "const NEWS_STATUS = /** @type {'beta' | 'ready'} */ ('ready');";
assert.ok(code.includes(READY), 'NEWS_STATUS line in shared/kf.js changed: update this test');
const codeBeta = code.replace(READY, "const NEWS_STATUS = 'beta';");

const makeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};

// Default "now": 2026-11-16 12:00 UTC -> today = 2026-11-16, 21 days back = 2026-10-26.
const NOW = Date.parse('2026-11-16T12:00:00Z');

const load = ({
  lang = 'uk',
  news = [],
  now = NOW,
  parent = true,
  ready = false, // false = the 'beta' copy of kf.js
  localStorage = makeStorage(),
  sessionStorage = makeStorage(),
  games = null, // extra KF.GAMES entries
} = {}) => {
  const sandbox = {
    localStorage,
    sessionStorage,
    location: { search: parent ? '?parent' : '' },
    document: { visibilityState: 'visible', addEventListener() {} },
    KF_SITE: { lang },
    KF_NEWS: news,
    Date: class extends Date {
      constructor(...a) {
        super(...(a.length ? a : [now]));
      }
      static now() {
        return now;
      }
    },
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
  vm.runInContext(ready ? code : codeBeta, sandbox);
  if (games) sandbox.KF.GAMES.push(...games);
  return sandbox.KF;
};

const plain = (x) => JSON.parse(JSON.stringify(x));
const ids = (KF) => plain(KF.news().map((n) => n.id));

const entry = (id, date, extra = {}) => ({
  id,
  date,
  sites: ['uk', 'es'],
  icon: '⭐',
  uk: { title: `Укр ${id}`, text: `Текст ${id}` },
  es: { title: `Es ${id}`, text: `Texto ${id}` },
  ...extra,
});

test('NEWS_DAYS is 21', () => {
  assert.equal(load().NEWS_DAYS, 21);
});

test('site filter: uk entries on uk, es entries on es, texts in the site language', () => {
  const news = [
    entry('both', '2026-11-10'),
    entry('uk-only', '2026-11-11', { sites: ['uk'], es: undefined }),
    entry('es-only', '2026-11-12', { sites: ['es'] }),
  ];
  const uk = load({ news });
  assert.deepEqual(ids(uk), ['uk-only', 'both']);
  assert.deepEqual(
    uk.news().map((n) => [n.title, n.text]),
    [
      ['Укр uk-only', 'Текст uk-only'],
      ['Укр both', 'Текст both'],
    ],
  );
  const es = load({ lang: 'es', news });
  assert.deepEqual(ids(es), ['es-only', 'both']);
  assert.deepEqual(
    es.news().map((n) => [n.title, n.text]),
    [
      ['Es es-only', 'Texto es-only'],
      ['Es both', 'Texto both'],
    ],
  );
});

test('item shape: id, date, icon, title, text; no game / href when the entry has neither', () => {
  const [n] = load({ news: [entry('plain', '2026-11-15', { icon: '🎉' })] }).news();
  assert.deepEqual(plain(n), {
    id: 'plain',
    date: '2026-11-15',
    icon: '🎉',
    title: 'Укр plain',
    text: 'Текст plain',
    game: null,
    href: null,
  });
});

test('21-day window: the day 21 days ago is still shown, the day before is not', () => {
  const news = [entry('d21', '2026-10-26'), entry('d22', '2026-10-25'), entry('old', '2026-09-01')];
  assert.deepEqual(ids(load({ news })), ['d21']);
  // one day later the 2026-10-26 entry is gone too
  assert.deepEqual(ids(load({ news, now: NOW + 864e5 })), []);
});

test('today (UTC) is shown, a future date waits until its day comes', () => {
  const news = [entry('today', '2026-11-16'), entry('tomorrow', '2026-11-17')];
  // 23:59 UTC on the 16th: tomorrow still waits
  assert.deepEqual(ids(load({ news, now: Date.parse('2026-11-16T23:59:59Z') })), ['today']);
  // 00:00 UTC on the 17th: both
  assert.deepEqual(ids(load({ news, now: Date.parse('2026-11-17T00:00:00Z') })), ['tomorrow', 'today']);
  // 00:00 UTC on the 16th: today is already today
  assert.deepEqual(ids(load({ news, now: Date.parse('2026-11-16T00:00:00Z') })), ['today']);
});

test('newest first, whatever the order in the file', () => {
  const news = [entry('b', '2026-11-05'), entry('c', '2026-11-14'), entry('a', '2026-10-30')];
  assert.deepEqual(ids(load({ news })), ['c', 'b', 'a']);
});

test('at most 4: the 4 newest; once those are seen the older ones come', () => {
  const news = ['01', '02', '03', '04', '05', '06'].map((d) => entry(`n${d}`, `2026-11-${d}`));
  const KF = load({ news });
  assert.deepEqual(ids(KF), ['n06', 'n05', 'n04', 'n03']);
  KF.seeNews(['n06', 'n05', 'n04', 'n03']);
  assert.deepEqual(ids(KF), ['n02', 'n01']);
});

test('a game entry: item has the listed game and href games/<slug>/', () => {
  const [n] = load({ news: [entry('g', '2026-11-10', { game: 'math-exam' })] }).news();
  assert.equal(n.href, 'games/math-exam/');
  assert.equal(n.game?.slug, 'math-exam');
  const es = load({ lang: 'es', news: [entry('g', '2026-11-10', { game: 'math-exam' })] }).news()[0];
  assert.equal(es.href, 'games/math-exam/');
  // the game comes in the site language (KF.siteGames)
  const esTitle = load({ lang: 'es' })
    .siteGames()
    .find((g) => g.slug === 'math-exam')?.title;
  assert.equal(es.game?.title, esTitle);
});

test('a game entry is hidden while its game is not listed on the site', () => {
  // chytanka is a uk-only game
  const news = [entry('chyt', '2026-11-10', { game: 'chytanka' }), entry('none', '2026-11-09', { game: 'no-such-game' })];
  assert.deepEqual(ids(load({ news })), ['chyt']);
  assert.deepEqual(ids(load({ lang: 'es', news })), []);
});

test('a game entry is hidden while its game is beta outside test mode, shown in test mode', () => {
  const beta = {
    slug: 'zz-beta',
    title: 'Бета',
    desc: '',
    icon: '🧪',
    status: 'beta',
    sites: ['uk', 'es'],
    es: { title: 'Beta', desc: '' },
  };
  const news = [entry('b', '2026-11-10', { game: 'zz-beta' }), entry('plain', '2026-11-09')];
  // the kids (feature 'ready', no ?parent): the beta game's entry is not there
  assert.deepEqual(ids(load({ news, ready: true, parent: false, games: [beta] })), ['plain']);
  // parents' test mode lists beta games, so the entry is shown
  const t = load({ news, games: [beta] }).news();
  assert.deepEqual(
    t.map((n) => [n.id, n.href]),
    [
      ['b', 'games/zz-beta/'],
      ['plain', null],
    ],
  );
});

test('a link entry keeps its catalog hash as href', () => {
  const [n] = load({ news: [entry('cr', '2026-11-10', { link: '#creatures' })] }).news();
  assert.equal(n.href, '#creatures');
  assert.equal(n.game, null);
});

test('es site falls back to uk texts only if an es entry has no es block (content test forbids it)', () => {
  const [n] = load({ lang: 'es', news: [entry('x', '2026-11-10', { es: undefined })] }).news();
  assert.equal(n.title, 'Укр x');
});

test('seeNews: news() excludes the ids, newsSeen has them once, repeat calls change nothing', () => {
  const news = [entry('a', '2026-11-10'), entry('b', '2026-11-11'), entry('c', '2026-11-12')];
  const KF = load({ news });
  assert.deepEqual(plain(KF.get().newsSeen), []);
  KF.seeNews(['c', 'a']);
  assert.deepEqual(ids(KF), ['b']);
  assert.deepEqual(plain(KF.get().newsSeen), ['c', 'a']);
  KF.seeNews(['a', 'c']);
  assert.deepEqual(plain(KF.get().newsSeen), ['c', 'a']);
  KF.seeNews(['a', 'b']);
  assert.deepEqual(plain(KF.get().newsSeen), ['c', 'a', 'b']);
  assert.deepEqual(ids(KF), []);
  KF.seeNews([]);
  assert.deepEqual(plain(KF.get().newsSeen), ['c', 'a', 'b']);
});

// KNOWN BUG (reported): seeNews filters only against the saved ids, not within the call, so a repeated id
// in one call is stored twice. Remove `todo` once kf.js dedupes.
test('seeNews: a repeated id inside one call is stored once', () => {
  const KF = load({ news: [entry('b', '2026-11-11')] });
  KF.seeNews(['b', 'b']);
  assert.deepEqual(plain(KF.get().newsSeen), ['b']);
});

test('seeNews persists: a reload of the page (same storage) does not show the seen news again', () => {
  const news = [entry('a', '2026-11-10'), entry('b', '2026-11-11')];
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const first = load({ news, localStorage, sessionStorage });
  first.seeNews(['b']);
  const again = load({ news, localStorage, sessionStorage });
  assert.deepEqual(plain(again.get().newsSeen), ['b']);
  assert.deepEqual(ids(again), ['a']);
});

test('seeNews persists for the kids too (no ?parent, feature ready)', () => {
  const news = [entry('a', '2026-11-10')];
  const localStorage = makeStorage();
  const first = load({ news, parent: false, ready: true, localStorage });
  assert.deepEqual(ids(first), ['a']);
  first.seeNews(['a']);
  assert.deepEqual(ids(load({ news, parent: false, ready: true, localStorage })), []);
});

test('beta: [] outside test mode, entries in test mode', () => {
  const news = [entry('a', '2026-11-10')];
  assert.deepEqual(plain(load({ news, parent: false }).news()), []);
  assert.deepEqual(ids(load({ news, parent: true })), ['a']);
});

test('ready (shipped): the kids get the news without ?parent', () => {
  const news = [entry('a', '2026-11-10')];
  const KF = load({ news, parent: false, ready: true });
  assert.equal(KF.TEST_MODE, false);
  assert.deepEqual(ids(KF), ['a']);
});

test('no shared/news.js on the page (KF_NEWS missing or not an array) -> []', () => {
  assert.deepEqual(plain(load({ news: undefined }).news()), []);
  assert.deepEqual(plain(load({ news: null }).news()), []);
  assert.deepEqual(plain(load({ news: {} }).news()), []);
});

test('merge3: two devices saw different news -> both ids kept, no duplicates', () => {
  const m = load()._merge3;
  const st = (newsSeen) => ({ v: 1, coins: 0, newsSeen });
  assert.deepEqual(plain(m(st([]), st(['a']), st(['b'])).newsSeen).sort(), ['a', 'b']);
  assert.deepEqual(plain(m(st(['x']), st(['x', 'a']), st(['x', 'a', 'b'])).newsSeen).sort(), ['a', 'b', 'x']);
  // seen on one side only (the other did not touch it)
  assert.deepEqual(plain(m(st(['x']), st(['x']), st(['x', 'b'])).newsSeen).sort(), ['b', 'x']);
  assert.deepEqual(plain(m(st(['x']), st(['x', 'a']), st(['x'])).newsSeen).sort(), ['a', 'x']);
});

test('merge3: old states without newsSeen', () => {
  const m = load()._merge3;
  const old = { v: 1, coins: 3, cards: { p: 1 } };
  assert.deepEqual(plain(m(old, old, old).newsSeen), []);
  assert.deepEqual(plain(m(old, old, { ...old, newsSeen: ['a'] }).newsSeen), ['a']);
  assert.deepEqual(plain(m(old, { ...old, newsSeen: ['b'] }, old).newsSeen), ['b']);
  assert.deepEqual(plain(m(undefined, { ...old, newsSeen: ['b'] }, { ...old, newsSeen: ['a'] }).newsSeen).sort(), ['a', 'b']);
});

test('old saved progress without newsSeen: news() works, seeNews adds the field', () => {
  const news = [entry('a', '2026-11-10'), entry('b', '2026-11-11')];
  const localStorage = makeStorage();
  localStorage.setItem('kf-progress-v1', JSON.stringify({ v: 1, coins: 12, cards: {}, stats: { correct: 1 } }));
  const KF = load({ news, parent: false, ready: true, localStorage });
  assert.equal(KF.get().coins, 12, 'the old progress was read');
  assert.deepEqual(ids(KF), ['b', 'a']);
  KF.seeNews(['a']);
  assert.deepEqual(plain(KF.get().newsSeen), ['a']);
  assert.deepEqual(ids(KF), ['b']);
});

test('importCode of an old code (no newsSeen) works with news', () => {
  const news = [entry('a', '2026-11-10')];
  const KF = load({ news });
  KF.seeNews(['a']);
  const oldCode = btoa(JSON.stringify({ v: 1, coins: 7 })); // ASCII only;
  assert.equal(KF.importCode(oldCode), true);
  assert.deepEqual(ids(KF), ['a']);
  KF.seeNews(['a']);
  assert.deepEqual(plain(KF.get().newsSeen), ['a']);
});

// ---- content of the real shared/news.js ----

const loadContent = () => {
  const box = {};
  box.window = box;
  vm.createContext(box);
  vm.runInContext(read('../../shared/news.js'), box);
  return box.KF_NEWS;
};

test('shared/news.js: entries are valid', () => {
  const NEWS = loadContent();
  assert.ok(Array.isArray(NEWS), 'window.KF_NEWS is an array');
  const games = new Map(load().GAMES.map((g) => [g.slug, g]));
  const cyr = /[Ѐ-ӿ]/;
  const seen = new Set();
  for (const n of NEWS) {
    const at = `news ${n.id}`;
    assert.equal(typeof n.id, 'string', at);
    assert.ok(n.id.length > 0, at);
    assert.ok(!seen.has(n.id), `${at}: id is not unique`);
    seen.add(n.id);
    assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/, at);
    assert.equal(new Date(`${n.date}T00:00:00Z`).toISOString().slice(0, 10), n.date, `${at}: a real calendar day`);
    assert.ok(Array.isArray(n.sites) && n.sites.length > 0, `${at}: sites`);
    for (const s of n.sites) assert.ok(s === 'uk' || s === 'es', `${at}: site ${s}`);
    assert.equal(new Set(n.sites).size, n.sites.length, `${at}: repeated site`);
    assert.ok(typeof n.icon === 'string' && n.icon.length > 0, `${at}: icon`);
    for (const k of ['title', 'text']) assert.ok(typeof n.uk?.[k] === 'string' && n.uk[k].trim(), `${at}: uk.${k}`);
    if (n.sites.includes('es')) {
      for (const k of ['title', 'text']) {
        assert.ok(typeof n.es?.[k] === 'string' && n.es[k].trim(), `${at}: es.${k}`);
        assert.ok(!cyr.test(n.es[k]), `${at}: Cyrillic in es.${k}`);
      }
    }
    assert.ok(!(n.game && n.link), `${at}: both game and link`);
    if (n.game !== undefined) {
      const g = games.get(n.game);
      assert.ok(g, `${at}: game ${n.game} is not in KF.GAMES`);
      for (const s of n.sites) assert.ok(g.sites.includes(s), `${at}: game ${n.game} is not on site ${s}`);
    }
    if (n.link !== undefined) assert.ok(typeof n.link === 'string' && n.link.startsWith('#') && n.link.length > 1, `${at}: link`);
  }
});
