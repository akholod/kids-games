'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('./engine.js');
const M = globalThis.MathExam;

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
const each = (topic, level, fn) => {
  for (let seed = 1; seed <= SEEDS; seed++) fn(M.makeTask(topic, level, seeded(seed)), seed);
};

const col = (op, a, b) => ({ kind: 'column', data: M.solveColumn(op, a, b) });

test('fmt', () => {
  assert.equal(M.fmt(4528), '4.528');
  assert.equal(M.fmt(1000), '1.000');
  assert.equal(M.fmt(987), '987');
  assert.equal(M.fmt(10000), '10.000');
  assert.equal(M.fmt(0), '0');
});

test('digits and PLACES', () => {
  assert.deepEqual(M.digits(4528), { UM: 4, C: 5, D: 2, U: 8 });
  assert.deepEqual(M.digits(305), { UM: 0, C: 3, D: 0, U: 5 });
  assert.deepEqual(M.PLACES.map((p) => p.key), ['UM', 'C', 'D', 'U']);
  assert.deepEqual(M.PLACES.map((p) => p.value), [1000, 100, 10, 1]);
});

test('roundTo', () => {
  assert.equal(M.roundTo(4538, 'C'), 4500);
  assert.equal(M.roundTo(4550, 'C'), 4600);
  assert.equal(M.roundTo(4500, 'UM'), 5000);
  assert.equal(M.roundTo(4499, 'UM'), 4000);
  assert.equal(M.roundTo(35, 'D'), 40);
  assert.equal(M.roundTo(34, 'D'), 30);
});

test('LEVELS sizes', () => {
  assert.equal(M.LEVELS.valor.length, 5);
  assert.equal(M.LEVELS.columna.length, 7);
  assert.equal(M.LEVELS.redondeo.length, 5);
  assert.equal(M.LEVELS.estimacion.length, 3);
});

test('every task has the common shape', () => {
  for (const topic of Object.keys(M.LEVELS)) {
    M.LEVELS[topic].forEach(({ level }) => {
      each(topic, level, (t) => {
        assert.equal(t.topic, topic);
        assert.equal(t.level, level);
        assert.ok(t.id && t.kind && t.es && t.ua && t.data);
        assert.notEqual(t.answer, undefined);
      });
    });
  }
});

test('determinism with rng', () => {
  const a = M.makeTask('columna', 6, seeded(42));
  const b = M.makeTask('columna', 6, seeded(42));
  assert.deepEqual(a, b);
});

test('valor L1: place of digit', () => {
  each('valor', 1, (t) => {
    assert.equal(t.kind, 'choice');
    assert.match(t.es, /^¿Qué cifra ocupa el lugar de las .+ en \d/);
    const d = M.digits(t.data.n)[t.data.place];
    assert.equal(t.answer, d);
    assert.ok(t.choices.some((c) => c.value === t.answer));
    assert.equal(new Set(t.choices.map((c) => c.value)).size, t.choices.length);
    assert.ok(t.choices.length >= 3 && t.choices.length <= 4);
    assert.deepEqual(M.checkAnswer(t, t.answer), { correct: true });
    assert.equal(M.checkAnswer(t, t.choices.find((c) => c.value !== t.answer).value).correct, false);
  });
});

test('valor L2: value of digit', () => {
  each('valor', 2, (t) => {
    assert.match(t.es, /^¿Cuánto vale la cifra \d en \d/);
    const { digit, place } = t.data;
    assert.equal(t.answer, digit * M.PLACES.find((p) => p.key === place).value);
    assert.ok(t.choices.some((c) => c.value === t.answer));
    assert.equal(new Set(t.choices.map((c) => c.value)).size, t.choices.length);
    assert.equal(new Set(t.choices.map((c) => c.label)).size, t.choices.length);
  });
  const t = { ...M.makeTask('valor', 2, seeded(3)), level: 2 };
  assert.ok(t.choices.length === 4);
});

test('valor L3: packs accept non-canonical', () => {
  each('valor', 3, (t) => {
    assert.equal(t.kind, 'packs');
    const { target } = t.data;
    assert.ok(target >= 100 && target <= 9999);
    assert.deepEqual(M.checkAnswer(t, t.answer), { correct: true });
    assert.equal(M.checkAnswer(t, { UM: 0, C: 0, D: 0, U: target }).correct, true);
    assert.equal(M.checkAnswer(t, { UM: 0, C: 0, D: 0, U: target + 1 }).correct, false);
  });
  const t = { kind: 'packs', data: { target: 1400 } };
  assert.equal(M.checkAnswer(t, { UM: 0, C: 14, D: 0, U: 0 }).correct, true);
  assert.equal(M.checkAnswer(t, { UM: 1, C: 3, D: 10, U: 0 }).correct, true);
});

test('valor L4: decompose both forms', () => {
  const t = M.makeTask('valor', 4, seeded(5));
  const n = t.data.n;
  assert.match(t.es, /^Descompón el número /);
  assert.equal(M.checkAnswer(t, M.digits(n)).correct, true);
  const add = Object.entries({ UM: 1000, C: 100, D: 10, U: 1 }).map(([k, v]) => M.digits(n)[k] * v).filter(Boolean);
  assert.equal(M.checkAnswer(t, add).correct, true);
  assert.equal(M.checkAnswer(t, [...add].reverse()).correct, true);
  assert.equal(M.checkAnswer(t, [...add, 1]).correct, false);
  assert.equal(M.checkAnswer(t, { UM: 9, C: 9, D: 9, U: 9 }).correct, false);
  const fixed = { kind: 'decompose', answer: { UM: 4, C: 5, D: 2, U: 8 }, level: 4, data: {} };
  assert.equal(M.checkAnswer(fixed, [4000, 500, 20, 8]).correct, true);
  assert.equal(M.checkAnswer(fixed, [4000, 50, 20, 8]).correct, false);
});

test('valor L5: read packs, non-canonical', () => {
  each('valor', 5, (t) => {
    const p = t.data.packs;
    assert.equal(t.answer, p.UM * 1000 + p.C * 100 + p.D * 10 + p.U);
    assert.ok(t.answer >= 1000 && t.answer <= 9999);
    assert.ok(p.C > 9 || p.D > 9 || p.U > 9, 'non-canonical');
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    assert.equal(M.checkAnswer(t, String(M.fmt(t.answer))).correct, true);
    assert.equal(M.checkAnswer(t, t.answer + 10).correct, false);
  });
});

const carriesOf = (a, b) => M.solveColumn('+', a, b).carries;

test('columna + levels', () => {
  each('columna', 1, (t) => {
    const { a, b, result } = t.data;
    assert.equal(t.data.op, '+');
    assert.equal(carriesOf(a, b), 0);
    assert.ok(a >= 100 && a <= 999 && b >= 100 && b <= 999 && result <= 999);
  });
  each('columna', 2, (t) => {
    assert.equal(carriesOf(t.data.a, t.data.b), 1);
    assert.ok(t.data.result <= 9999 && t.data.a >= 1000);
  });
  each('columna', 3, (t) => {
    assert.ok(carriesOf(t.data.a, t.data.b) >= 2);
    assert.ok(t.data.result <= 9999);
  });
});

test('columna - levels', () => {
  each('columna', 4, (t) => {
    assert.equal(t.data.op, '-');
    assert.equal(M.solveColumn('-', t.data.a, t.data.b).borrows, 0);
  });
  each('columna', 5, (t) => {
    const s = M.solveColumn('-', t.data.a, t.data.b);
    assert.equal(s.borrows, 1);
    assert.equal(s.zeroChains, 0);
  });
  each('columna', 6, (t) => {
    assert.ok(M.solveColumn('-', t.data.a, t.data.b).borrows >= 2);
  });
  each('columna', 7, (t) => {
    assert.ok(M.solveColumn('-', t.data.a, t.data.b).zeroChains >= 1);
  });
  for (const level of [4, 5, 6, 7]) {
    each('columna', level, (t) => {
      const { a, b, result } = t.data;
      assert.ok(result >= 0 && result <= 9999 && a > b);
      assert.equal(result, a - b);
      assert.equal(t.answer, result);
      assert.equal(M.checkAnswer(t, result).correct, true);
    });
  }
});

test('column steps and marks: 4.003 − 1.257', () => {
  const d = M.solveColumn('-', 4003, 1257);
  assert.equal(d.result, 2746);
  assert.deepEqual(d.steps.map((s) => s.place), ['U', 'D', 'C', 'UM']);
  assert.deepEqual(d.steps.map((s) => s.digit), [6, 4, 7, 2]);
  assert.deepEqual(d.steps.map((s) => s.borrowed), [true, false, false, false]);
  assert.equal(d.steps[0].topAfter, 13);
  assert.equal(d.steps[0].lentFrom, 'D');
  assert.deepEqual(d.marks.crossed, { D: true, C: true, UM: true });
  assert.deepEqual(d.marks.newTop, { D: 9, C: 9, UM: 3 });
  assert.deepEqual(d.marks.smallOne, { U: true });
  assert.equal(d.zeroChains, 2);
});

test('column steps and marks: 532 − 278', () => {
  const d = M.solveColumn('-', 532, 278);
  assert.equal(d.result, 254);
  assert.deepEqual(d.steps.map((s) => s.digit), [4, 5, 2]);
  assert.deepEqual(d.steps.map((s) => s.borrowed), [true, true, false]);
  assert.deepEqual(d.steps.map((s) => s.top), [2, 2, 4]);
  assert.deepEqual(d.marks.crossed, { D: true, C: true });
  assert.deepEqual(d.marks.newTop, { D: 2, C: 4 });
  assert.deepEqual(d.marks.smallOne, { U: true, D: true });
});

test('addition steps', () => {
  const d = M.solveColumn('+', 1678, 1565);
  assert.deepEqual(d.steps.map((s) => s.digit), [3, 4, 2, 3]);
  assert.deepEqual(d.steps.map((s) => s.carryOut), [1, 1, 1, 0]);
  assert.equal(d.result, 3243);
});

test('checkColumnStep', () => {
  const t = { kind: 'column', data: M.solveColumn('-', 4003, 1257) };
  assert.equal(M.checkColumnStep(t, 0, 6, true).correct, true);
  assert.equal(M.checkColumnStep(t, 0, 6).correct, true);
  assert.equal(M.checkColumnStep(t, 0, 4, true).correct, false);
  assert.equal(M.checkColumnStep(t, 0, 6, false).correct, false);
  assert.equal(M.checkColumnStep(t, 0, 4).error.code, 'smaller-from-larger');
  assert.equal(M.checkColumnStep(t, 1, 4).correct, true);
  const s = { kind: 'column', data: M.solveColumn('+', 478, 256) };
  assert.equal(M.checkColumnStep(s, 0, 4, 1).correct, true);
  assert.equal(M.checkColumnStep(s, 0, 4, 0).error.code, 'forgot-carry');
  assert.equal(M.checkColumnStep(s, 1, 3, 1).correct, true);
  assert.equal(M.checkColumnStep(s, 1, 2, 1).error.code, 'digit');
});

test('diagnose codes', () => {
  const code = (t, v) => M.checkAnswer(t, v).error?.code;
  const add = col('+', 478, 256); // 734
  assert.equal(M.checkAnswer(add, 734).correct, true);
  assert.equal(code(add, 624), 'forgot-carry'); // 8+6=4, 7+5=2, 4+2=6
  assert.equal(code(add, 3038), 'misaligned'); // 478 + 2560
  assert.equal(code(add, 735), 'arith');
  const sub = col('-', 532, 278); // 254
  assert.equal(code(sub, 346), 'smaller-from-larger'); // |2-8|, |3-7|, |5-2|
  assert.equal(code(sub, 364), 'forgot-decrement'); // 12-8=4, 13-7=6, 5-2=3
  assert.equal(code(sub, 255), 'arith');
  const sub2 = col('-', 2745, 183); // 2562
  assert.equal(code(sub2, 2745 - 1830), 'misaligned');
  const z = col('-', 4003, 1257);
  assert.equal(code(z, 3856), 'forgot-decrement'); // 13-7, 10-5, 10-2, 4-1
  const msg = M.checkAnswer(add, 624).error;
  assert.match(msg.es, /llevar una/);
  assert.match(msg.ua, /перенести 1/);
});

test('number-kind word problems use column diagnosis', () => {
  each('estimacion', 3, (t) => {
    assert.equal(t.kind, 'number');
    const { op, a, b } = t.data;
    assert.equal(t.answer, op === '+' ? a + b : a - b);
    assert.ok(t.answer >= 0 && t.answer <= 9999);
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    assert.equal(M.checkAnswer(t, t.answer + 1).correct, false);
    assert.match(t.es, /\?$/);
  });
});

test('redondeo invariants', () => {
  for (const level of [1, 2, 3, 4, 5]) {
    let mids = 0;
    each('redondeo', level, (t) => {
      const { n, place, low, high, mid } = t.data;
      const p = { D: 10, C: 100, UM: 1000 }[place];
      assert.equal(t.kind, 'round');
      assert.equal(high - low, p);
      assert.equal(mid, low + p / 2);
      assert.ok(n > low && n < high);
      assert.ok(high <= 9999 && t.answer <= 9999);
      assert.equal(t.answer, M.roundTo(n, place));
      assert.ok(t.answer === low || t.answer === high);
      assert.match(t.es, /^Redondea \d.* (a la decena|a la centena|al millar) más próxim[ao]\.$/);
      if (level === 1) assert.equal(place, 'D');
      if (level === 2) assert.equal(place, 'C');
      if (level === 3) assert.equal(place, 'UM');
      if (n === mid) mids++;
      assert.equal(M.checkAnswer(t, t.answer).correct, true);
      const other = t.answer === low ? high : low;
      assert.equal(M.checkAnswer(t, other).error.code, 'direction');
    });
    if (level >= 4) assert.ok(mids > SEEDS * 0.1 && mids < SEEDS * 0.4, `mids ${mids}`);
    else assert.equal(mids, 0);
  }
});

test('estimacion phases', () => {
  for (const level of [1, 2]) {
    each('estimacion', level, (t) => {
      const d = t.data;
      assert.equal(t.kind, 'estimate');
      assert.equal(d.items.length, level === 1 ? 2 : 3);
      assert.equal(d.rounded.length, d.items.length);
      assert.equal(d.exact, d.items.reduce((s, i) => s + i.price, 0));
      assert.equal(d.estimate, d.rounded.reduce((s, v) => s + v, 0));
      assert.equal(d.fits, d.exact <= d.budget);
      assert.equal(d.fits, d.estimate <= d.budget);
      assert.ok(d.exact <= 9999 && d.budget <= 9999);
      assert.deepEqual(t.answer, { estimate: d.estimate, exact: d.exact, fits: d.fits });
      assert.equal(M.checkAnswer(t, { phase: 'estimate', value: d.estimate }).correct, true);
      assert.equal(M.checkAnswer(t, { phase: 'estimate', value: d.exact }).error.code, 'estimate-exact');
      assert.equal(M.checkAnswer(t, { phase: 'exact', value: d.exact }).correct, true);
      assert.equal(M.checkAnswer(t, { phase: 'exact', value: d.estimate }).correct, false);
      assert.equal(M.checkAnswer(t, { phase: 'fits', value: d.fits }).correct, true);
      assert.equal(M.checkAnswer(t, { phase: 'fits', value: !d.fits }).correct, false);
      assert.equal(M.checkAnswer(t, t.answer).correct, true);
      assert.match(t.es, /¿Te alcanza el dinero\?$/);
    });
  }
});

test('makeExam count and mix', () => {
  const exam = M.makeExam({ count: 12, rng: seeded(7) });
  assert.equal(exam.length, 12);
  assert.equal(new Set(exam.map((t) => t.topic)).size, 4);
  assert.equal(M.makeExam({ count: 3, rng: seeded(1) }).length, 3);
  assert.equal(M.makeExam({ rng: seeded(2) }).length, 12);
  const biased = M.makeExam({ count: 200, weights: { columna: 10, valor: 0.01, redondeo: 0.01, estimacion: 0.01 }, rng: seeded(9) });
  assert.ok(biased.filter((t) => t.topic === 'columna').length > 150);
  assert.equal(M.makeExam({ count: 40, maxLevels: { columna: 2 }, rng: seeded(4) }).filter((t) => t.topic === 'columna').every((t) => t.level <= 2), true);
});

test('weakWeights ordering', () => {
  const w = M.weakWeights({
    valor: { right: 9, total: 10 },
    columna: { right: 2, total: 10 },
    redondeo: { right: 5, total: 10 },
  });
  assert.ok(w.columna > w.redondeo && w.redondeo > w.valor);
  assert.ok(w.valor > 0);
  assert.ok(w.estimacion > 0);
  assert.ok(M.weakWeights({ valor: { right: 10, total: 10 } }).valor > 0);
  assert.ok(Object.values(M.weakWeights()).every((x) => x > 0));
});
