'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../../games/penalty-multiply/engine.js');
const P = globalThis.PenaltyEngine;

const seeded = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const SEEDS = 500;
const ALL = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const easy = ([a, b]) => [2, 3, 10].includes(a) || [2, 3, 10].includes(b);
const key = ([a, b]) => `${a}x${b}`;

test('coins: ×2, ×3, ×10 pay half a coin, the rest a whole one', () => {
  assert.equal(P.coinFor(7, 2), 0.5);
  assert.equal(P.coinFor(3, 8), 0.5);
  assert.equal(P.coinFor(10, 6), 0.5);
  assert.equal(P.coinFor(2, 2), 0.5);
  assert.equal(P.coinFor(7, 8), 1);
  assert.equal(P.coinFor(4, 5), 1);
  assert.equal(P.coinFor(5, 9), 1);
});

test('round: 12 examples, a from the tables, b from 2–10', () => {
  for (const tables of [ALL, [7], [2], [4, 6]]) {
    for (let seed = 1; seed <= 50; seed++) {
      const r = P.round(tables, 12, seeded(seed));
      assert.equal(r.length, 12);
      for (const [a, b] of r) {
        assert.ok(tables.includes(a), `${a} in ${tables}`);
        assert.ok(b >= 2 && b <= 10 && Number.isInteger(b));
      }
    }
  }
});

test('round: at most 2 examples with ×2, ×3 or ×10 when the tables allow harder ones', () => {
  const counts = [0, 0, 0];
  for (const tables of [ALL, [7], [4, 5], [2, 9]]) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const n = P.round(tables, 12, seeded(seed)).filter(easy).length;
      assert.ok(n <= 2, `${tables}: ${n} easy`);
      counts[n]++;
    }
  }
  // 0, 1 and 2 easy ones all happen
  assert.ok(
    counts.every((c) => c > 0),
    String(counts),
  );
});

test('round: only an easy table (×2) — b is 4–9 except at most 2 examples', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = P.round([2], 12, seeded(seed));
    const outside = r.filter(([, b]) => b < 4 || b > 9).length;
    assert.ok(outside <= 2, String(r.map(key)));
  }
});

test('round: all tables — no example twice in a round', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = P.round(ALL, 12, seeded(seed)).map(key);
    assert.equal(new Set(r).size, 12, r.join(' '));
  }
});

test('round: one table — never the same example twice in a row, each hard one before any repeat', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const r = P.round([7], 12, seeded(seed));
    for (let i = 1; i < r.length; i++) assert.notEqual(key(r[i]), key(r[i - 1]), r.map(key).join(' '));
    const hard = r.filter((p) => !easy(p)).map(key);
    // 6 hard examples (7×4 … 7×9): the first 6 hard ones are all different
    assert.equal(new Set(hard.slice(0, 6)).size, 6, hard.join(' '));
  }
});

test('round: all tables — 6–9 come up more often than 4 and 5', () => {
  const seen = {};
  for (let seed = 1; seed <= SEEDS; seed++) {
    for (const [a, b] of P.round(ALL, 12, seeded(seed))) for (const x of [a, b]) seen[x] = (seen[x] || 0) + 1;
  }
  for (const hard of [6, 7, 8, 9]) for (const mid of [4, 5]) assert.ok(seen[hard] > seen[mid] * 1.4, JSON.stringify(seen));
  for (const e of [2, 3, 10]) assert.ok(seen[e] < seen[4] / 4, JSON.stringify(seen));
});
