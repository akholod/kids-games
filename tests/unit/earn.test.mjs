// Daily coin budget (KF.earn), half coins, perfect-round bonus and the merge of per-day budgets.
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const code = fs.readFileSync(fileURLToPath(new URL('../../shared/kf.js', import.meta.url)), 'utf8');

const store = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
const boot = () => {
  const sb = { localStorage: store(), sessionStorage: store(), location: { search: '', href: 'http://x/', hostname: 'x' }, console, setTimeout, clearTimeout, addEventListener() {}, URLSearchParams, URL };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(code, sb);
  return sb.KF;
};

test('daily budget: 40 coins in full, then a third; other games unaffected', () => {
  const KF = boot();
  const caps = [];
  KF.on('earn-cap', (s) => caps.push(s));
  const c0 = KF.get().coins;
  for (let i = 0; i < 40; i++) KF.answer('g', true);
  assert.equal(KF.get().coins - c0, 40);
  assert.deepEqual(caps, ['g']);
  for (let i = 0; i < 9; i++) KF.answer('g', true);
  assert.equal(KF.get().coins - c0, 43, 'after cap: 1 coin per 3');
  KF.answer('h', true);
  assert.equal(KF.get().coins - c0, 44, 'other game unaffected');
});

test('half coins and no-coin answers', () => {
  const KF = boot();
  const c1 = KF.get().coins;
  KF.answer('p', true, { coin: 0.5 });
  assert.equal(KF.get().coins, c1);
  KF.answer('p', true, { coin: 0.5 });
  assert.equal(KF.get().coins, c1 + 1);
  KF.answer('p', true, { coin: false });
  assert.equal(KF.get().coins, c1 + 1);
});

test('perfect-round bonus: default 5, explicit 0, none for imperfect', () => {
  const KF = boot();
  let r = KF.finishGame('q', { score: 5, max: 5, bonus: 0 });
  assert.equal(r.perfect, true);
  assert.equal(r.bonus, 0);
  r = KF.finishGame('q', { score: 5, max: 5 });
  assert.equal(r.bonus, 5);
  r = KF.finishGame('q', { score: 4, max: 5 });
  assert.equal(r.bonus, 0);
});

test('after the cap the bonus is a third; KF.earn pays by the same budget', () => {
  const KF = boot();
  for (let i = 0; i < 49; i++) KF.answer('g', true);
  // g at 49 units -> +5 => paidFor(54) - paidFor(49) = 44 - 43 = 1
  const r = KF.finishGame('g', { score: 1, max: 1 });
  assert.equal(r.bonus, 1);
  assert.equal(KF.earn('g', 3), 1);
});

test('only today is kept; units add up on merge', () => {
  const KF = boot();
  KF.answer('g', true);
  const days = Object.keys(KF.get().earned);
  assert.equal(days.length, 1);
  const d = days[0];
  const base = { earned: { '2000-01-01': { g: 5 }, [d]: { g: 10 } } };
  const local = { earned: { [d]: { g: 30 } } };
  const server = { earned: { '2000-01-01': { g: 5 }, [d]: { g: 20 } } };
  assert.deepEqual(JSON.parse(JSON.stringify(KF._merge3(base, local, server).earned)), { [d]: { g: 40 } });
});
