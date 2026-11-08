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

// Small manifest (shape of shared/creatures.js): 20 common (c0..), 6 rare (r0..), 3 legend (l0..).
const CREATURES = [];
for (const [cat, n] of [
  ['common', 20],
  ['rare', 6],
  ['legend', 3],
]) {
  for (let i = 0; i < n; i++)
    CREATURES.push({ id: `${cat[0]}${i}`, n: CREATURES.length + 1, cat, el: 'earth', uk: `Укр ${cat}${i}`, es: `Es ${cat}${i}` });
}
const FOOTBALL = [
  { id: 'pedri', name: 'Pedri', cat: 'common' },
  { id: 'messi', name: 'Messi', cat: 'legend' },
];

// ?parent = test mode: 100 coins, per-tab sandbox storage.
const load = ({ lang = 'uk', creatures = CREATURES, cards = FOOTBALL } = {}) => {
  const sandbox = {
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    location: { search: '?parent' },
    document: { visibilityState: 'visible', addEventListener() {} },
    KF_SITE: { lang },
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
  if (creatures) sandbox.KF_CREATURES = creatures;
  if (cards) sandbox.KF_CARDS = cards;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.KF;
};

const plain = (x) => JSON.parse(JSON.stringify(x));
const own = (KF, counts) => {
  Object.assign(KF.get().creatures, counts);
  KF.addCoins(0); // commit: runs the achievement checks
};
const owned = (KF) => Object.values(KF.get().creatures).reduce((a, b) => a + b, 0);
const ach = (KF, id) => KF.ACHIEVEMENTS.find((a) => a.id === id);
const CREATURE_ACH = ['creatures-10', 'creatures-50', 'creatures-full', 'creature-legend'];

test('creature pack: charges PACK_PRICE, 3 creatures with isNew, one pack event', () => {
  const KF = load();
  assert.equal(KF.PACK_PRICE, 10);
  assert.equal(KF.get().coins, 100);
  let pack = null;
  let packs = 0;
  let cardEvents = 0;
  KF.on('pack', (p) => {
    pack = p;
    packs++;
  });
  KF.on('card', () => cardEvents++);
  const got = KF.openPack('creatures');
  assert.equal(got.length, 3);
  assert.equal(KF.get().coins, 90);
  assert.equal(packs, 1);
  assert.equal(pack, got);
  assert.equal(cardEvents, 0);
  assert.ok(got.every((c) => typeof c.isNew === 'boolean'));
  assert.ok(got.every((c) => c.id && c.cat && c.uk && c.es));
  assert.equal(owned(KF), 3);
  assert.equal(KF.get().stats.packs, 1);
  assert.deepEqual(plain(KF.get().cards), {}, 'football untouched');
});

test('creature pack: isNew is true exactly for the first copy', () => {
  const KF = load();
  KF.addCoins(1000);
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    for (const c of KF.openPack('creatures')) {
      assert.equal(c.isNew, !seen.has(c.id));
      seen.add(c.id);
    }
  }
  assert.equal(seen.size, Object.keys(KF.get().creatures).length);
});

test('not enough coins, empty or missing manifest, unknown collection -> null, nothing charged', () => {
  const poor = load();
  poor.spendCoins(95); // 5 left
  assert.equal(poor.openPack('creatures'), null);
  assert.equal(poor.get().coins, 5);
  assert.equal(poor.get().stats.packs, 0);

  for (const creatures of [null, []]) {
    const KF = load({ creatures });
    assert.equal(KF.openPack('creatures'), null);
    assert.equal(KF.get().coins, 100);
    assert.equal(KF.get().stats.packs, 0);
    assert.equal(KF.CREATURES.length, 0);
    assert.equal(KF.duplicates('creatures'), 0);
    assert.equal(KF.sellDuplicate('c0', 'creatures'), 0);
    assert.equal(KF.sellAllDuplicates('creatures'), 0);
    assert.ok(KF.openPack(), 'football pack still works');
  }

  const KF = load();
  assert.equal(KF.openPack('stickers'), null);
  assert.equal(KF.openPack('__proto__'), null);
  assert.equal(KF.duplicates('stickers'), 0);
  assert.equal(KF.sellDuplicate('c0', 'stickers'), 0);
  assert.equal(KF.sellAllDuplicates('stickers'), 0);
  assert.equal(KF.get().coins, 100);
  assert.equal(KF.get().stats.packs, 0);
});

test('football pack stays the default and ignores creatures', () => {
  const KF = load();
  const got = KF.openPack();
  assert.equal(got.length, 3);
  assert.ok(got.every((c) => c.name));
  assert.equal(owned(KF), 0);
  assert.equal(KF.get().stats.packs, 1);
  KF.openPack('cards');
  assert.equal(KF.get().stats.packs, 2);
  assert.equal(KF.get().coins, 80);
});

test('creature pack odds match weights 80/16/4, uniform inside a category', () => {
  const KF = load();
  assert.equal(Object.keys(KF.CREATURE_CATS).join(), 'common,rare,legend');
  assert.deepEqual(
    Object.values(KF.CREATURE_CATS).map((c) => [c.weight, c.sell]),
    [
      [80, 2],
      [16, 5],
      [4, 15],
    ],
  );
  const n = Math.ceil(30000 / KF.PACK_SIZE);
  const count = { common: 0, rare: 0, legend: 0 };
  const perId = {};
  for (let i = 0; i < n; i++) {
    KF.addCoins(KF.PACK_PRICE);
    for (const c of KF.openPack('creatures')) {
      count[c.cat]++;
      perId[c.id] = (perId[c.id] || 0) + 1;
    }
  }
  const total = n * KF.PACK_SIZE;
  for (const [k, w] of Object.entries({ common: 80, rare: 16, legend: 4 })) {
    const pct = (count[k] / total) * 100;
    assert.ok(Math.abs(pct - w) < 1.5, `${k}: ${pct.toFixed(2)}% vs ${w}%`);
  }
  // 3 legends: each about 4% / 3 of all draws
  for (const id of ['l0', 'l1', 'l2']) {
    const pct = (perId[id] / total) * 100;
    assert.ok(Math.abs(pct - 4 / 3) < 0.5, `${id}: ${pct.toFixed(2)}%`);
  }
  assert.equal(KF.get().stats.packs, n);
});

test('duplicates / sellDuplicate / sellAllDuplicates are per collection; last copy kept; paid by category', () => {
  const KF = load();
  KF.get().coins = 0;
  assert.equal(KF.sellDuplicate('c0', 'creatures'), 0);
  own(KF, { c0: 1 });
  assert.equal(KF.sellDuplicate('c0', 'creatures'), 0, 'single copy is never sold');
  own(KF, { c0: 3, r0: 2, l0: 2 }); // extras: 2 + 1 + 1 = 4
  KF.get().cards.pedri = 2; // 1 football extra
  assert.equal(KF.duplicates('creatures'), 4);
  assert.equal(KF.duplicates(), 1, 'football: only cards');
  assert.equal(KF.duplicates('cards'), 1);

  assert.equal(KF.sellDuplicate('c0', 'creatures'), 2);
  assert.equal(KF.get().creatures.c0, 2);
  assert.equal(KF.get().coins, 2);
  // an id from the other collection is unknown
  assert.equal(KF.sellDuplicate('pedri', 'creatures'), 0);
  assert.equal(KF.sellDuplicate('c0'), 0);
  assert.equal(KF.sellDuplicate('c0', 'cards'), 0);
  assert.equal(KF.get().cards.pedri, 2);

  // c0 has 1 extra left (2), r0 1 extra (rare 5), l0 1 extra (legend 15)
  assert.equal(KF.sellAllDuplicates('creatures'), 2 + 5 + 15);
  assert.equal(KF.get().coins, 2 + 22);
  assert.deepEqual({ c0: KF.get().creatures.c0, r0: KF.get().creatures.r0, l0: KF.get().creatures.l0 }, { c0: 1, r0: 1, l0: 1 });
  assert.equal(KF.duplicates('creatures'), 0);
  assert.equal(KF.sellAllDuplicates('creatures'), 0);
  assert.equal(KF.get().cards.pedri, 2, 'football duplicates untouched');
  assert.equal(KF.sellAllDuplicates(), 2, 'football: pedri (common) pays 2');
  assert.equal(KF.get().creatures.c0, 1);
});

test('creatureImg and creatureName', () => {
  const KF = load();
  assert.ok(KF.creatureImg('c001').endsWith('images/creatures/uk/c001.webp'));
  assert.ok(KF.creatureImg('c001', { back: true }).endsWith('images/creatures/uk/c001-b.webp'));
  assert.ok(KF.creatureImg('c001', { thumb: true }).endsWith('images/creatures/uk/thumb/c001.webp'));
  assert.ok(KF.creatureImg('c001', { thumb: true, back: true }).endsWith('images/creatures/uk/thumb/c001-b.webp'));
  const es = load({ lang: 'es' });
  assert.ok(es.creatureImg('c001').endsWith('images/creatures/es/c001.webp'));
  assert.equal(es.creatureName({ uk: 'Громпуш', es: 'Grompush' }), 'Grompush');
  assert.equal(KF.creatureName({ uk: 'Громпуш', es: 'Grompush' }), 'Громпуш');
  assert.equal(es.creatureName({ uk: 'Громпуш' }), 'Громпуш');
  assert.equal(KF.creatureName({}), '');
});

test('creature achievements: 10 / 50 / legend / full', () => {
  const KF = load();
  const got = () => CREATURE_ACH.filter((id) => KF.get().achievements[id]);
  assert.deepEqual(got(), []);
  own(KF, Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`c${i}`, 5]))); // 9 different, many copies
  assert.deepEqual(got(), []);
  own(KF, { c9: 1, x0: 0 }); // zero count is not owned
  assert.deepEqual(got(), ['creatures-10']);
  own(KF, Object.fromEntries(Array.from({ length: 39 }, (_, i) => [`z${i}`, 1]))); // 10 + 39 = 49; ids outside the manifest count too
  assert.deepEqual(got(), ['creatures-10']);
  own(KF, { z39: 1 });
  assert.deepEqual(got(), ['creatures-10', 'creatures-50']);
  own(KF, { r0: 1 });
  assert.ok(!KF.get().achievements['creature-legend'], 'a rare is not a legend');
  own(KF, { l1: 1 });
  assert.deepEqual(got(), ['creatures-10', 'creatures-50', 'creature-legend']);
  assert.ok(!KF.get().achievements['creatures-full']);
});

test('creatures-full: every creature of the manifest', () => {
  const KF = load();
  own(KF, Object.fromEntries(CREATURES.slice(1).map((c) => [c.id, 1])));
  assert.ok(!KF.get().achievements['creatures-full']);
  own(KF, { [CREATURES[0].id]: 1 });
  assert.ok(KF.get().achievements['creatures-full']);
});

test('creature achievements: texts in uk and es, category labels', () => {
  const KF = load();
  const es = load({ lang: 'es' });
  const texts = (K) => CREATURE_ACH.map((id) => [ach(K, id).icon, ach(K, id).title, ach(K, id).desc]);
  assert.deepEqual(texts(KF), [
    ['🐾', 'Друзі з казки', 'Збери 10 різних істот'],
    ['🔮', 'Знавець істот', 'Збери 50 різних істот'],
    ['🐉', 'Усі істоти', 'Збери всіх істот'],
    ['✨', 'Легендарна істота', 'Знайди легендарну істоту'],
  ]);
  assert.deepEqual(texts(es), [
    ['🐾', 'Amigos mágicos', 'Consigue 10 criaturas distintas'],
    ['🔮', 'Experto en criaturas', 'Consigue 50 criaturas distintas'],
    ['🐉', 'Todas las criaturas', 'Consigue todas las criaturas'],
    ['✨', 'Criatura legendaria', 'Encuentra una criatura legendaria'],
  ]);
  assert.deepEqual(
    Object.values(es.CREATURE_CATS).map((c) => c.label),
    ['Común', 'Rara', 'Legendaria'],
  );
  assert.deepEqual(
    Object.values(KF.CREATURE_CATS).map((c) => c.label),
    ['Звичайна', 'Рідкісна', 'Легендарна'],
  );
  // the new achievements come after the football ones
  const ids = KF.ACHIEVEMENTS.map((a) => a.id);
  assert.deepEqual(plain(ids.slice(-4)), CREATURE_ACH);
});

test('creature achievements: full and legend need the manifest, the counts work without it', () => {
  const KF = load({ creatures: null });
  own(KF, Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`c${i}`, 1])));
  assert.ok(KF.get().achievements['creatures-10']);
  assert.ok(!KF.get().achievements['creatures-full'], 'empty manifest is not a full collection');
  own(KF, { l0: 1 });
  assert.ok(!KF.get().achievements['creature-legend']);
});

test('football achievements and duplicates ignore creatures, and the other way round', () => {
  const KF = load();
  own(KF, Object.fromEntries(CREATURES.map((c) => [c.id, 2])));
  for (const id of ['album-10', 'album-50', 'album-full', 'legend', 'rare', 'futsal', 'first-pack'])
    assert.ok(!KF.get().achievements[id], id);
  assert.equal(KF.duplicates(), 0);
  assert.equal(KF.sellAllDuplicates(), 0);

  const K2 = load();
  for (let i = 0; i < 12; i++) K2.get().cards[`f${i}`] = 1;
  K2.addCoins(0);
  assert.ok(K2.get().achievements['album-10']);
  assert.ok(!K2.get().achievements['creatures-10']);
  K2.giveCard('messi');
  assert.ok(K2.get().achievements.legend);
  assert.ok(!K2.get().achievements['creature-legend']);
});

test('a pack of creatures counts for first-pack', () => {
  const KF = load();
  KF.openPack('creatures');
  assert.ok(KF.get().achievements['first-pack']);
});

test('merge3 never loses a creature owned on any side; counts merge like cards', () => {
  const m = load()._merge3;
  const st = (creatures) => ({ v: 1, coins: 0, creatures });
  // two devices sell the same duplicate
  assert.equal(m(st({ x: 2 }), st({ x: 1 }), st({ x: 1 })).creatures.x, 1);
  // sold on one side, the other did not touch it
  assert.equal(m(st({ x: 2 }), st({ x: 1 }), st({ x: 2 })).creatures.x, 1);
  // a new creature on each side
  assert.deepEqual(plain(m(st({}), st({ a: 1 }), st({ b: 2 })).creatures), { a: 1, b: 2 });
  // both found copies of the same one: they add up
  assert.equal(m(st({ x: 1 }), st({ x: 2 }), st({ x: 3 })).creatures.x, 4);
  // owned on one side only
  assert.ok(m(st({ x: 1 }), st({ x: 1 }), st({})).creatures.x >= 1);
  assert.ok(m(st({ x: 1 }), st({}), st({ x: 1 })).creatures.x >= 1);
  assert.ok(m(st({ x: 1 }), st({ x: 0 }), st({ x: 1 })).creatures.x >= 1);
  assert.ok(m(st({ x: 1 }), st({ x: 1 }), st({ x: 0 })).creatures.x >= 1);
  // old states without `creatures`
  const old = m({ v: 1, cards: { p: 1 } }, { v: 1, cards: { p: 1 } }, { v: 1, cards: { p: 1 } });
  assert.deepEqual(plain(old.creatures), {});
  assert.equal(old.cards.p, 1);
  // football keeps its rule
  assert.equal(m({ cards: { x: 2 } }, { cards: { x: 1 } }, { cards: { x: 1 } }).cards.x, 1);
});

test('exportCode / importCode keep creatures; old states get an empty collection', () => {
  const KF = load();
  own(KF, { c0: 3, l1: 1 });
  const code2 = KF.exportCode();
  KF.reset();
  assert.deepEqual(plain(KF.get().creatures), {});
  assert.equal(KF.importCode(code2), true);
  assert.deepEqual(plain(KF.get().creatures), { c0: 3, l1: 1 });
  // a code from before the collection existed
  const oldCode = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, coins: 7, cards: { pedri: 2 } }))));
  assert.equal(KF.importCode(oldCode), true);
  assert.deepEqual(plain(KF.get().creatures), {});
  assert.equal(KF.get().cards.pedri, 2);
  KF.addCoins(10);
  assert.equal(KF.openPack('creatures').length, 3);
});
