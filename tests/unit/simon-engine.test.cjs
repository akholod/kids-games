'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../../games/coach-simon/engine.js');
const S = globalThis.SimonEngine;

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

const SEEDS = 300;
const LEVELS = ['rookie', 'academy', 'pro'];
const CYR = /[\u0400-\u04FF]/;

test('zones: 9 names in es / en / uk, Spanish and English without Cyrillic', () => {
  assert.equal(S.ZONES.length, 9);
  for (const z of S.ZONES) {
    assert.ok(z.es && z.en && z.uk);
    assert.ok(!CYR.test(z.es + z.en));
    assert.ok(CYR.test(z.uk));
  }
  assert.equal(new Set(S.ZONES.map((z) => z.es)).size, 9);
  assert.equal(new Set(S.ZONES.map((z) => z.en)).size, 9);
});

test('memory: first sequence has the level start length, only level zones, no zone twice in a row', () => {
  for (const level of LEVELS) {
    const m = S.LEVELS[level].memory;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rand = seeded(seed);
      let seq = S.firstSequence(level, rand);
      assert.equal(seq.length, m.start);
      while (seq.length < S.ROUND) {
        const prev = seq;
        seq = S.extend(seq, level, rand);
        assert.deepEqual(seq.slice(0, -1), prev, 'extend keeps the sequence and adds one');
      }
      for (let i = 0; i < seq.length; i++) {
        assert.ok(m.zones.includes(seq[i]), `${level}: zone ${seq[i]}`);
        if (i) assert.notEqual(seq[i], seq[i - 1], `${level} seed ${seed}: repeat at ${i}`);
      }
    }
  }
});

test('memory: check walks the sequence', () => {
  const seq = [0, 4, 8];
  assert.equal(S.check(seq, 0, 0), 'next');
  assert.equal(S.check(seq, 1, 4), 'next');
  assert.equal(S.check(seq, 2, 8), 'done');
  assert.equal(S.check(seq, 1, 5), 'miss');
  assert.equal(S.check(seq, 0, 4), 'miss');
});

test('memory: timing speeds up with length, never below 60%', () => {
  for (const level of LEVELS) {
    const m = S.LEVELS[level].memory;
    assert.deepEqual(S.memoryTiming(level, m.start), { on: m.onMs, gap: m.gapMs });
    let prev = Number.POSITIVE_INFINITY;
    for (let len = m.start; len <= 30; len++) {
      const { on, gap } = S.memoryTiming(level, len);
      assert.ok(on <= prev);
      assert.ok(on >= Math.round(m.onMs * 0.6) && gap >= Math.round(m.gapMs * 0.6));
      prev = on;
    }
  }
  // harder levels are faster
  assert.ok(S.memoryTiming('rookie', 2).on > S.memoryTiming('academy', 2).on);
  assert.ok(S.memoryTiming('academy', 3).on > S.memoryTiming('pro', 3).on);
});

test('commands: 10 per round, level zones, language, no zone twice in a row', () => {
  for (const level of LEVELS) {
    const cfg = S.LEVELS[level].commands;
    for (const lang of S.LANGS) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const cmds = S.makeCommands(level, lang, seeded(seed));
        assert.equal(cmds.length, S.ROUND);
        cmds.forEach((c, i) => {
          assert.ok(cfg.zones.includes(c.zone));
          if (i) assert.notEqual(c.zone, cmds[i - 1].zone);
          if (lang !== 'mix') assert.equal(c.lang, lang);
          else assert.ok(c.lang === 'es' || c.lang === 'en');
          assert.equal(c.words, S.ZONES[c.zone][c.lang]);
          assert.ok(!CYR.test(S.spoken(c)));
        });
      }
    }
  }
});

test('commands: mix gives both languages over a few rounds', () => {
  const langs = new Set();
  for (let seed = 1; seed <= 5; seed++) for (const c of S.makeCommands('academy', 'mix', seeded(seed))) langs.add(c.lang);
  assert.deepEqual([...langs].sort(), ['en', 'es']);
});

test('commands: tricks only on pro — exact count, never first, never adjacent; real pro commands say "Simon says"', () => {
  for (const level of ['rookie', 'academy']) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      for (const c of S.makeCommands(level, 'mix', seeded(seed))) {
        assert.equal(c.trick, false);
        assert.equal(c.prefix, '');
      }
    }
  }
  const n = S.LEVELS.pro.commands.tricks;
  assert.ok(n > 0);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const cmds = S.makeCommands('pro', 'mix', seeded(seed));
    const at = cmds.map((c, i) => (c.trick ? i : -1)).filter((i) => i >= 0);
    assert.equal(at.length, n, `seed ${seed}`);
    assert.ok(!cmds[0].trick);
    for (let i = 1; i < at.length; i++) assert.ok(at[i] - at[i - 1] > 1, `seed ${seed}: adjacent tricks`);
    for (const c of cmds) assert.equal(c.prefix, c.trick ? '' : c.lang === 'es' ? 'Simón dice' : 'Simon says');
  }
});

test('spoken: prefix + lower-case words, or an exclamation', () => {
  const z = 0;
  assert.equal(S.spoken({ zone: z, lang: 'es', trick: false, prefix: '', words: S.ZONES[z].es }), '¡Arriba a la izquierda!');
  assert.equal(S.spoken({ zone: z, lang: 'en', trick: false, prefix: '', words: S.ZONES[z].en }), 'Top left!');
  assert.equal(
    S.spoken({ zone: z, lang: 'es', trick: false, prefix: 'Simón dice', words: S.ZONES[z].es }),
    'Simón dice: arriba a la izquierda',
  );
  assert.equal(S.spoken({ zone: 8, lang: 'en', trick: false, prefix: 'Simon says', words: S.ZONES[8].en }), 'Simon says: bottom right');
});

test('judge: save / goal on real commands, held / fooled on tricks', () => {
  const real = { zone: 3, lang: 'en', trick: false, prefix: '', words: 'Left' };
  const trick = { ...real, trick: true };
  assert.equal(S.judge(real, 3), 'save');
  assert.equal(S.judge(real, 4), 'goal');
  assert.equal(S.judge(real, null), 'goal');
  assert.equal(S.judge(trick, null), 'held');
  assert.equal(S.judge(trick, 3), 'fooled');
  assert.equal(S.judge(trick, 0), 'fooled');
  assert.deepEqual(
    ['save', 'goal', 'held', 'fooled'].map((v) => S.isRight(v)),
    [true, false, true, false],
  );
});

test('keyZone: top-row digits in reading order, numpad spatial, others -1', () => {
  for (let d = 1; d <= 9; d++) assert.equal(S.keyZone(String(d), `Digit${d}`), d - 1);
  const pad = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8 };
  for (const [n, zone] of Object.entries(pad)) {
    assert.equal(S.keyZone(n, `Numpad${n}`), zone);
    assert.equal(S.keyZone('End', `Numpad${n}`), zone, 'NumLock off still maps by code');
  }
  for (const k of ['0', 'a', 'Enter', 'ArrowLeft', ' ']) assert.equal(S.keyZone(k, ''), -1);
  assert.equal(S.keyZone('0', 'Numpad0'), -1);
});

test('rewards: easy level pays less, bonus grows with level', () => {
  assert.ok(S.LEVELS.rookie.coin < S.LEVELS.academy.coin);
  assert.ok(S.LEVELS.rookie.bonus < S.LEVELS.academy.bonus && S.LEVELS.academy.bonus < S.LEVELS.pro.bonus);
});
