'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../../games/math-exam/engine.js');
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
  assert.equal(M.fmt(4528), '4528');
  assert.equal(M.fmt(1000), '1000');
  assert.equal(M.fmt(9999), '9999');
  assert.equal(M.fmt(12345), '12.345');
  assert.equal(M.fmt(987), '987');
  assert.equal(M.fmt(10000), '10.000');
  assert.equal(M.fmt(0), '0');
});

test('digits and PLACES', () => {
  assert.deepEqual(M.digits(4528), { UM: 4, C: 5, D: 2, U: 8 });
  assert.deepEqual(M.digits(305), { UM: 0, C: 3, D: 0, U: 5 });
  assert.deepEqual(
    M.PLACES.map((p) => p.key),
    ['UM', 'C', 'D', 'U'],
  );
  assert.deepEqual(
    M.PLACES.map((p) => p.value),
    [1000, 100, 10, 1],
  );
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
  assert.equal(M.LEVELS.valor.length, 9);
  assert.equal(M.LEVELS.columna.length, 6);
  assert.equal(M.LEVELS.redondeo.length, 2);
  assert.equal(M.LEVELS.problemas.length, 2);
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
  const a = M.makeTask('columna', 3, seeded(42));
  const b = M.makeTask('columna', 3, seeded(42));
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

test('valor L4: packs accept non-canonical', () => {
  each('valor', 4, (t) => {
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

test('valor L5: decompose both forms', () => {
  const t = M.makeTask('valor', 5, seeded(5));
  const n = t.data.n;
  assert.match(t.es, /^Descompón el número \d{4} según el valor de sus cifras y la posición que ocupan\.$/);
  assert.equal(M.checkAnswer(t, M.digits(n)).correct, true);
  const add = Object.entries({ UM: 1000, C: 100, D: 10, U: 1 })
    .map(([k, v]) => M.digits(n)[k] * v)
    .filter(Boolean);
  assert.equal(M.checkAnswer(t, add).correct, true);
  assert.equal(M.checkAnswer(t, [...add].reverse()).correct, true);
  assert.equal(M.checkAnswer(t, [...add, 1]).correct, false);
  assert.equal(M.checkAnswer(t, { UM: 9, C: 9, D: 9, U: 9 }).correct, false);
  const fixed = { kind: 'decompose', answer: { UM: 4, C: 5, D: 2, U: 8 }, level: 5, data: {} };
  assert.equal(M.checkAnswer(fixed, [4000, 500, 20, 8]).correct, true);
  assert.equal(M.checkAnswer(fixed, [4000, 50, 20, 8]).correct, false);
});

test('valor L7: read packs, non-canonical', () => {
  each('valor', 7, (t) => {
    const p = t.data.packs;
    assert.equal(t.answer, p.UM * 1000 + p.C * 100 + p.D * 10 + p.U);
    assert.ok(t.answer >= 1000 && t.answer <= 9999);
    assert.ok(p.C > 9 || p.D > 9 || p.U > 9, 'non-canonical');
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    assert.equal(M.checkAnswer(t, String(M.fmt(t.answer))).correct, true);
    assert.equal(M.checkAnswer(t, t.answer + 10).correct, false);
  });
});

test('valor L3: mayor y menor valor', () => {
  const which = new Set();
  each('valor', 3, (t) => {
    const { digit, which: w } = t.data;
    which.add(w);
    assert.equal(t.kind, 'choice');
    assert.match(t.es, new RegExp(`^¿En qué número tiene la cifra ${digit} el ${w} valor\\?$`));
    assert.equal(t.choices.length, 3);
    assert.equal(new Set(t.choices.map((c) => c.value)).size, 3);
    const pos = (n) => String(n).indexOf(String(digit));
    for (const c of t.choices) {
      assert.equal(c.label, M.fmt(c.value));
      assert.ok(c.value >= 1000 && c.value <= 9999);
      assert.equal(String(c.value).split(String(digit)).length - 1, 1, 'digit exactly once');
    }
    assert.equal(new Set(t.choices.map((c) => pos(c.value))).size, 3, 'different places');
    const sorted = [...t.choices].sort((x, y) => pos(y.value) - pos(x.value)); // rightmost first
    assert.equal(t.answer, (w === 'menor' ? sorted[0] : sorted[2]).value);
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    const bad = M.checkAnswer(t, t.choices.find((c) => c.value !== t.answer).value);
    assert.equal(bad.correct, false);
    assert.ok(bad.error.es && bad.error.ua);
  });
  assert.deepEqual([...which].sort(), ['mayor', 'menor']);
});

test('valor L6: muro de descomposición', () => {
  const keysSeen = new Set();
  each('valor', 6, (t) => {
    const { n, parts } = t.data;
    assert.equal(t.kind, 'number');
    assert.ok(n >= 1000 && n <= 9999);
    assert.equal(parts.filter((p) => p.value === null).length, 1);
    parts.forEach((p) => assert.ok(['UM', 'C', 'D', 'U'].includes(p.key)));
    const val = { UM: 1000, C: 100, D: 10, U: 1 };
    const total = parts.reduce((s, p) => s + (p.value === null ? t.answer : p.value) * val[p.key], 0);
    assert.equal(total, n);
    assert.ok(t.es.startsWith(`Completa: ${n} = `) && t.es.includes('__'));
    parts.forEach((p) => keysSeen.add(parts.map((x) => x.key).join('')));
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    assert.equal(M.checkAnswer(t, t.answer + 1).correct, false);
  });
  assert.ok(keysSeen.size >= 5, `forms ${keysSeen.size}`);
  const t = {
    kind: 'number',
    level: 6,
    answer: 35,
    data: {
      sub: 'muro',
      n: 3519,
      parts: [
        { value: null, key: 'C' },
        { value: 1, key: 'D' },
        { value: 9, key: 'U' },
      ],
    },
  };
  assert.equal(M.checkAnswer(t, 35).correct, true);
  assert.equal(M.checkAnswer(t, 5).correct, false);
});

const WORDS = {
  1000: 'mil',
  1001: 'mil uno',
  1010: 'mil diez',
  1015: 'mil quince',
  1016: 'mil dieciséis',
  1020: 'mil veinte',
  1021: 'mil veintiuno',
  1022: 'mil veintidós',
  1023: 'mil veintitrés',
  1026: 'mil veintiséis',
  1030: 'mil treinta',
  1031: 'mil treinta y uno',
  1100: 'mil cien',
  1101: 'mil ciento uno',
  1121: 'mil ciento veintiuno',
  1500: 'mil quinientos',
  1700: 'mil setecientos',
  1900: 'mil novecientos',
  2000: 'dos mil',
  2327: 'dos mil trescientos veintisiete',
  2372: 'dos mil trescientos setenta y dos',
  3227: 'tres mil doscientos veintisiete',
  3519: 'tres mil quinientos diecinueve',
  4022: 'cuatro mil veintidós',
  4026: 'cuatro mil veintiséis',
  4275: 'cuatro mil doscientos setenta y cinco',
  4528: 'cuatro mil quinientos veintiocho',
  5000: 'cinco mil',
  5555: 'cinco mil quinientos cincuenta y cinco',
  6100: 'seis mil cien',
  6666: 'seis mil seiscientos sesenta y seis',
  7086: 'siete mil ochenta y seis',
  7777: 'siete mil setecientos setenta y siete',
  8006: 'ocho mil seis',
  8040: 'ocho mil cuarenta',
  8200: 'ocho mil doscientos',
  9090: 'nueve mil noventa',
  9100: 'nueve mil cien',
  9900: 'nueve mil novecientos',
  9999: 'nueve mil novecientos noventa y nueve',
  3401: 'tres mil cuatrocientos uno',
  6013: 'seis mil trece',
  2900: 'dos mil novecientos',
  1800: 'mil ochocientos',
  7300: 'siete mil trescientos',
};

test('numberToWords table', () => {
  assert.ok(Object.keys(WORDS).length >= 40);
  for (const [n, w] of Object.entries(WORDS)) assert.equal(M.numberToWords(Number(n)), w, n);
  assert.equal(M.numberToWords(0), 'cero');
  assert.equal(M.numberToWords(100), 'cien');
  assert.equal(M.numberToWords(21), 'veintiuno');
});

test('numberToWords: all 1000..9999 are well-formed', () => {
  for (let n = 1000; n <= 9999; n++) {
    const w = M.numberToWords(n);
    assert.match(w, /^[a-zñáéíóú ]+$/, w);
    assert.ok(!/ {2}|\bcien (?!mil)|ciento$|^ | $/.test(w), w);
    if (n % 1000 === 0) assert.ok(/mil$/.test(w));
    assert.ok(!/ y (cero|diez|veinte)/.test(w), w);
    assert.ok(!/ y \w+ y /.test(w), w);
  }
});

test('valor L8: se lee', () => {
  const subs = { read: 0, write: 0 };
  each('valor', 8, (t) => {
    const { sub, n } = t.data;
    subs[sub]++;
    assert.equal(t.answer, n);
    if (sub === 'read') {
      assert.equal(t.kind, 'choice');
      assert.equal(t.es, `¿Cómo se lee ${n}?`);
      assert.equal(t.choices.length, 3);
      assert.equal(new Set(t.choices.map((c) => c.label)).size, 3);
      assert.equal(new Set(t.choices.map((c) => c.value)).size, 3);
      t.choices.forEach((c) => {
        assert.ok(c.value >= 1000 && c.value <= 9999);
        assert.equal(c.label, M.numberToWords(c.value));
      });
      assert.equal(M.checkAnswer(t, n).correct, true);
      const e = M.checkAnswer(t, t.choices.find((c) => c.value !== n).value);
      assert.equal(e.correct, false);
      assert.ok(e.error.es.includes(M.numberToWords(n)));
    } else {
      assert.equal(t.kind, 'number');
      assert.equal(t.es, `Escribe con cifras: ${M.numberToWords(n)}`);
      assert.equal(M.checkAnswer(t, n).correct, true);
      assert.equal(M.checkAnswer(t, n + 1).correct, false);
    }
  });
  assert.ok(subs.read > SEEDS * 0.35 && subs.write > SEEDS * 0.35, JSON.stringify(subs));
});

test('valor L9: añade, quita y series', () => {
  const subs = { add: 0, sub: 0, serie: 0 };
  each('valor', 9, (t) => {
    const { sub } = t.data;
    subs[sub]++;
    assert.equal(t.kind, 'number');
    assert.ok(t.answer >= 1000 && t.answer <= 9999);
    if (sub === 'serie') {
      const { terms, step } = t.data;
      assert.ok([1, 10, 100, 1000, 5].includes(Math.abs(step)));
      assert.equal(terms.length, 4);
      terms.forEach((x, i) => {
        assert.ok(x >= 1000 && x <= 9999);
        if (i) assert.equal(x - terms[i - 1], step);
      });
      assert.equal(t.answer, terms[3]);
      assert.equal(t.es, `Continúa la serie: ${terms.slice(0, 3).join(', ')}, …`);
    } else {
      const { n, place, k } = t.data;
      const v = { UM: 1000, C: 100, D: 10 }[place];
      assert.equal(t.answer, n + (sub === 'add' ? 1 : -1) * k * v);
      assert.equal(t.es, `¿Qué número obtienes si ${sub === 'add' ? 'añades' : 'quitas'} ${k} ${place} a ${n}?`);
    }
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    const e = M.checkAnswer(t, t.answer + 1).error;
    assert.ok(e.es && e.ua);
  });
  for (const k of Object.keys(subs)) assert.ok(subs[k] > SEEDS * 0.2, `${k} ${subs[k]}`);
});

test('columna levels: mixed ops, carry/borrow counts', () => {
  for (const level of [1, 2, 3]) {
    const ops = new Set();
    let plus = 0;
    each('columna', level, (t) => {
      const { op, a, b, result } = t.data;
      assert.ok(t.es.startsWith(op === '+' ? 'Coloca en torre y calcula: ' : 'Coloca en torre y resta: '));
      ops.add(op);
      if (op === '+') plus++;
      assert.ok(a >= 1000 && a <= 9999 && b >= 1000 && b <= 9999);
      assert.ok(result >= 0 && result <= 9999);
      assert.equal(result, op === '+' ? a + b : a - b);
      assert.equal(t.answer, result);
      assert.equal(M.checkAnswer(t, result).correct, true);
      const s = M.solveColumn(op, a, b);
      const n = op === '+' ? s.carries : s.borrows;
      assert.ok(n >= 1, 'carry/borrow present');
      if (level === 1) assert.equal(n, 1);
      if (level === 2) assert.ok(n >= 2);
      if (op === '-') {
        if (level < 3) assert.equal(s.zeroChains, 0);
        else assert.ok(s.zeroChains >= 1);
      }
      if (level === 3 && op === '+') {
        assert.ok([a, b, result].some((x) => String(x).includes('0')));
      }
    });
    assert.deepEqual([...ops].sort(), ['+', '-']);
    assert.ok(plus > SEEDS * 0.35 && plus < SEEDS * 0.65, `plus ${plus}`);
  }
});

test('column steps and marks: 4.003 − 1.257', () => {
  const d = M.solveColumn('-', 4003, 1257);
  assert.equal(d.result, 2746);
  assert.deepEqual(
    d.steps.map((s) => s.place),
    ['U', 'D', 'C', 'UM'],
  );
  assert.deepEqual(
    d.steps.map((s) => s.digit),
    [6, 4, 7, 2],
  );
  assert.deepEqual(
    d.steps.map((s) => s.borrowed),
    [true, false, false, false],
  );
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
  assert.deepEqual(
    d.steps.map((s) => s.digit),
    [4, 5, 2],
  );
  assert.deepEqual(
    d.steps.map((s) => s.borrowed),
    [true, true, false],
  );
  assert.deepEqual(
    d.steps.map((s) => s.top),
    [2, 2, 4],
  );
  assert.deepEqual(d.marks.crossed, { D: true, C: true });
  assert.deepEqual(d.marks.newTop, { D: 2, C: 4 });
  assert.deepEqual(d.marks.smallOne, { U: true, D: true });
});

test('addition steps', () => {
  const d = M.solveColumn('+', 1678, 1565);
  assert.deepEqual(
    d.steps.map((s) => s.digit),
    [3, 4, 2, 3],
  );
  assert.deepEqual(
    d.steps.map((s) => s.carryOut),
    [1, 1, 1, 0],
  );
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

test('columna L4: busca el error', () => {
  let wrongCount = 0;
  const codes = new Set();
  each('columna', 4, (t) => {
    const { op, a, b, shown, result, errorCode, steps, marks } = t.data;
    assert.equal(t.kind, 'fix');
    assert.equal(t.es, 'Comprueba si está bien resuelta. Si hay un error, corrígelo.');
    assert.ok(steps && marks);
    assert.equal(result, op === '+' ? a + b : a - b);
    assert.ok(shown >= 0 && shown <= 9999);
    assert.deepEqual(t.answer, { ok: errorCode === null, value: result });
    const s = M.solveColumn(op, a, b);
    assert.ok((op === '+' ? s.carries : s.borrows) >= 1);
    if (errorCode === null) {
      assert.equal(shown, result);
      assert.equal(M.checkAnswer(t, { ok: true }).correct, true);
      const e = M.checkAnswer(t, { ok: false, value: result + 1 }).error;
      assert.equal(e.code, 'no-error');
    } else {
      wrongCount++;
      codes.add(errorCode);
      assert.notEqual(shown, result);
      assert.ok(op === '+' ? errorCode === 'forgot-carry' : ['smaller-from-larger', 'forgot-decrement'].includes(errorCode));
      const A = String(a).split('').reverse().map(Number);
      const B = String(b).split('').reverse().map(Number);
      const len = Math.max(A.length, B.length, String(result).length);
      while (A.length < len) A.push(0);
      while (B.length < len) B.push(0);
      const fromCols = (cols) => cols.reduce((x, d, i) => x + d * 10 ** i, 0);
      const expected = {
        'forgot-carry': fromCols(A.map((d, i) => (d + B[i]) % 10)),
        'smaller-from-larger': fromCols(A.map((d, i) => Math.abs(d - B[i]))),
        'forgot-decrement': fromCols(A.map((d, i) => (d < B[i] ? d + 10 - B[i] : d - B[i]))),
      }[errorCode];
      assert.equal(shown, expected);
      const miss = M.checkAnswer(t, { ok: true });
      assert.equal(miss.correct, false);
      assert.equal(miss.error.code, 'missed-error');
      assert.ok(miss.error.es && miss.error.ua);
      assert.equal(M.checkAnswer(t, { ok: false, value: result }).correct, true);
      assert.equal(M.checkAnswer(t, { ok: false, value: shown }).correct, false);
      assert.equal(M.checkAnswer(t, { ok: false, value: shown }).error.code, 'same-as-shown');
      assert.equal(M.checkAnswer(t, { ok: false, value: result + 1 }).correct, false);
    }
  });
  assert.ok(wrongCount > SEEDS * 0.4 && wrongCount < SEEDS * 0.6, `wrong ${wrongCount}`);
  assert.deepEqual([...codes].sort(), ['forgot-carry', 'forgot-decrement', 'smaller-from-larger']);
  const t = {
    kind: 'fix',
    data: { op: '+', a: 478, b: 256, shown: 624, result: 734, errorCode: 'forgot-carry', steps: M.solveColumn('+', 478, 256).steps },
  };
  assert.match(M.checkAnswer(t, { ok: true }).error.es, /Se ha olvidado de llevar una en las decenas/);
});

test('columna L5: prueba de la resta', () => {
  let okCount = 0;
  each('columna', 5, (t) => {
    const { op, a, b, result, prueba, steps, marks } = t.data;
    assert.equal(t.kind, 'column');
    assert.equal(op, '+');
    assert.ok(steps && marks);
    const { minuendo, sustraendo, diferencia, ok } = prueba;
    assert.equal(diferencia, a);
    assert.equal(sustraendo, b);
    assert.equal(ok, diferencia + sustraendo === minuendo);
    assert.equal(t.answer, a + b);
    assert.equal(result, a + b);
    assert.ok(a + b <= 9999);
    assert.ok(M.solveColumn('+', a, b).carries >= 1);
    assert.equal(t.es, `Haz la prueba de la resta ${minuendo} − ${sustraendo} = ${diferencia}: suma la diferencia y el sustraendo.`);
    if (ok) okCount++;
    assert.equal(M.checkAnswer(t, a + b).correct, true);
    assert.equal(M.checkAnswer(t, a + b + 1).correct, false);
  });
  assert.ok(okCount > SEEDS * 0.6 && okCount < SEEDS * 0.8, `ok ${okCount}`);
});

test('columna L6: número que falta', () => {
  const subs = {};
  each('columna', 6, (t) => {
    const { sub, op, a, b, result, wrongValue } = t.data;
    subs[sub] = (subs[sub] || 0) + 1;
    assert.equal(t.kind, 'number');
    assert.equal(t.answer, result);
    assert.ok(t.answer >= 1 && t.answer <= 9999);
    const s = M.solveColumn(op, a, b);
    assert.ok((op === '+' ? s.carries : s.borrows) >= 1);
    if (sub === 'minuendo') assert.equal(t.es, `Halla el número que falta: __ − ${b} = ${a}`);
    if (sub === 'sumando') assert.equal(t.es, `Halla el número que falta: ${b} + __ = ${a}`);
    if (sub === 'faltan') assert.equal(t.es, `¿Cuántas unidades le faltan a ${b} para ser ${a}?`);
    if (sub === 'diferencia') assert.match(t.es, /^Calcula la diferencia entre \d+ y \d+\.$/);
    assert.equal(M.checkAnswer(t, t.answer).correct, true);
    assert.equal(M.checkAnswer(t, String(t.answer)).correct, true);
    const e = M.checkAnswer(t, wrongValue).error;
    assert.equal(e.code, 'wrong-op');
    assert.ok(e.es && e.ua);
    assert.equal(M.checkAnswer(t, t.answer + 1).error.code, 'wrong');
  });
  assert.deepEqual(Object.keys(subs).sort(), ['diferencia', 'faltan', 'minuendo', 'sumando']);
});

test('redondeo invariants', () => {
  for (const level of [1, 2]) {
    let mids = 0;
    const places = { D: 0, C: 0, UM: 0 };
    each('redondeo', level, (t) => {
      const { n, place, low, high, mid } = t.data;
      const p = { D: 10, C: 100, UM: 1000 }[place];
      places[place]++;
      assert.equal(t.kind, 'round');
      assert.equal(high - low, p);
      assert.equal(mid, low + p / 2);
      assert.ok(n > low && n < high);
      assert.ok(n >= 100 && t.answer <= 9999);
      if (place === 'UM') assert.ok(n >= 1000);
      assert.equal(t.answer, M.roundTo(n, place));
      assert.ok(t.answer === low || t.answer === high);
      assert.match(t.es, /^Redondea \d+ (a las decenas|a las centenas|a las unidades de millar)\.$/);
      assert.equal(t.data.hideLine === true, level === 2);
      if (n === mid) mids++;
      assert.equal(M.checkAnswer(t, t.answer).correct, true);
      const other = t.answer === low ? high : low;
      const e = M.checkAnswer(t, other).error;
      assert.equal(e.code, 'direction');
      assert.ok(e.es.startsWith(`${M.fmt(n)} está entre ${M.fmt(low)} y ${M.fmt(high)}. `));
      assert.ok(e.es.includes(n === mid ? `Está justo en el medio: redondeamos hacia arriba, a ${M.fmt(high)}.` : 'Está más cerca de '));
    });
    for (const k of Object.keys(places)) assert.ok(places[k] > SEEDS * 0.25, `${k} ${places[k]}`);
    assert.ok(mids > SEEDS * 0.1 && mids < SEEDS * 0.3, `mids ${mids}`);
  }
});

test('problemas: templates, ops, carry/borrow, ranges', () => {
  for (const level of [1, 2]) {
    const ops = new Set();
    const shapes = new Set();
    each('problemas', level, (t) => {
      const { op, a, b, result } = t.data;
      ops.add(op);
      shapes.add(t.es.replace(/\d[\d.]*/g, '#'));
      assert.equal(t.kind, 'problema');
      assert.ok(t.data.steps && t.data.marks);
      assert.ok(a >= 1000 && a <= 9999 && b >= 1000 && b <= 9999);
      assert.ok(result >= 1 && result <= 9999);
      assert.equal(result, op === '+' ? a + b : a - b);
      assert.equal(t.answer, result);
      const s = M.solveColumn(op, a, b);
      assert.ok((op === '+' ? s.carries : s.borrows) >= 1);
      assert.match(t.es, /\?$/);
      assert.ok(t.es.includes(M.fmt(a)) && t.es.includes(M.fmt(b)));
      assert.ok(!/[ґєіїа-я]*\(ла\)/.test(t.ua));
      assert.deepEqual(M.checkAnswer(t, result), { correct: true });
      assert.equal(M.checkAnswer(t, String(M.fmt(result))).correct, true);
      assert.equal(M.checkOp(t, op).correct, true);
      const bad = M.checkOp(t, op === '+' ? '-' : '+');
      assert.equal(bad.correct, false);
      assert.equal(bad.error.code, 'wrong-op');
      assert.ok(bad.error.es && bad.error.ua);
      const wrongOpValue = op === '-' ? a + b : Math.abs(a - b);
      const e = M.checkAnswer(t, wrongOpValue).error;
      assert.equal(e.code, 'wrong-op');
      assert.ok(e.es && e.ua);
      assert.equal(M.checkColumnStep(t, 0, t.data.steps[0].digit).correct, true);
    });
    assert.deepEqual([...ops].sort(), ['+', '-']);
    assert.ok(shapes.size >= (level === 2 ? 19 : 16), `templates ${shapes.size}`);
  }
});

test('problemas L2: book templates (más que, change unknown, years)', () => {
  const seen = { patos: 0, pilas: 0, years: 0 };
  each('problemas', 2, (t) => {
    const { op, a, b } = t.data;
    if (/ranas más que patos/.test(t.es)) {
      seen.patos++;
      assert.equal(op, '+');
      assert.equal(t.answer, a + b);
    }
    if (/Los alumnos echan algunas más/.test(t.es)) {
      seen.pilas++;
      assert.equal(op, '-');
      assert.ok(t.es.includes(`había ${b} pilas`) && t.es.includes(`ahora hay ${a}`));
    }
    if (/¿Cuántos años pasaron/.test(t.es)) {
      seen.years++;
      assert.equal(op, '-');
      assert.ok(a >= 1900 && a <= 2026 && b >= 1500 && b < a);
      assert.ok(M.solveColumn('-', a, b).borrows >= 1);
      assert.equal(M.checkOp(t, '-').correct, true);
    }
  });
  for (const k of Object.keys(seen)) assert.ok(seen[k] > 5, `${k} ${seen[k]}`);
});

test('problemas: column diagnosis and checkOp variants', () => {
  const t = { kind: 'problema', answer: 734, data: M.solveColumn('+', 478, 256) };
  assert.equal(M.checkAnswer(t, 624).error.code, 'forgot-carry');
  assert.equal(M.checkAnswer(t, 735).error.code, 'arith');
  assert.equal(M.checkAnswer(t, 222).error.code, 'wrong-op');
  const s = { kind: 'problema', answer: 254, data: M.solveColumn('-', 532, 278) };
  assert.equal(M.checkAnswer(s, 346).error.code, 'smaller-from-larger');
  assert.equal(M.checkAnswer(s, 810).error.code, 'wrong-op');
  assert.equal(M.checkOp(s, '−').correct, true);
  assert.equal(M.checkOp(s, '-').correct, true);
  assert.equal(M.checkOp(s, '+').correct, false);
  assert.equal(M.checkOp(t, '+').correct, true);
  assert.equal(M.checkColumnStep(s, 0, 4, true).correct, true);
});

test('makeExam count and mix', () => {
  const exam = M.makeExam({ count: 12, rng: seeded(7) });
  assert.equal(exam.length, 12);
  assert.equal(new Set(exam.map((t) => t.topic)).size, 4);
  const kinds = new Set(M.makeExam({ count: 400, rng: seeded(11) }).map((t) => t.kind));
  for (const k of ['choice', 'number', 'packs', 'decompose', 'column', 'round', 'problema', 'fix']) assert.ok(kinds.has(k), k);
  assert.equal(M.makeExam({ count: 3, rng: seeded(1) }).length, 3);
  assert.equal(M.makeExam({ rng: seeded(2) }).length, 12);
  const biased = M.makeExam({ count: 200, weights: { columna: 10, valor: 0.01, redondeo: 0.01, problemas: 0.01 }, rng: seeded(9) });
  assert.ok(biased.filter((t) => t.topic === 'columna').length > 150);
  assert.equal(
    M.makeExam({ count: 40, maxLevels: { columna: 2 }, rng: seeded(4) })
      .filter((t) => t.topic === 'columna')
      .every((t) => t.level <= 2),
    true,
  );
});

test('weakWeights ordering', () => {
  const w = M.weakWeights({
    valor: { right: 9, total: 10 },
    columna: { right: 2, total: 10 },
    redondeo: { right: 5, total: 10 },
  });
  assert.ok(w.columna > w.redondeo && w.redondeo > w.valor);
  assert.ok(w.valor > 0);
  assert.ok(w.problemas > 0);
  assert.ok(M.weakWeights({ valor: { right: 10, total: 10 } }).valor > 0);
  assert.ok(Object.values(M.weakWeights()).every((x) => x > 0));
});

// ---- Spanish site: same numbers, Spanish-only text -----------------------------------

const CYR = /[\u0400-\u04FF]/;
const everyLevel = (fn) => {
  for (const { key } of M.TOPICS) for (const { level } of M.LEVELS[key]) fn(key, level);
};

// A few deliberately wrong inputs for any kind, to collect the error objects.
const wrongInputs = (t) => [
  0,
  t.answer + 10,
  -1,
  1000,
  { UM: 0, C: 0, D: 0, U: 1 },
  [1, 2],
  { ok: true },
  { ok: false, value: 1 },
  ...(t.choices ? t.choices.map((c) => c.value) : []),
  ...(t.data && t.data.low !== undefined ? [t.data.low, t.data.high] : []),
];

test('es: same seed gives identical numbers and answers as uk', () => {
  everyLevel((topic, level) => {
    for (let seed = 1; seed <= 60; seed++) {
      const uk = M.makeTask(topic, level, seeded(seed));
      const es = M.makeTask(topic, level, seeded(seed), 'es');
      assert.equal(es.id, uk.id);
      assert.equal(es.kind, uk.kind);
      assert.deepEqual(es.answer, uk.answer);
      assert.deepEqual(es.data, uk.data);
      assert.deepEqual(
        es.choices?.map((c) => c.value),
        uk.choices?.map((c) => c.value),
      );
      if (!uk.choices || uk.data.sub !== 'read') assert.deepEqual(es.choices, uk.choices);
      if (uk.kind !== 'choice' || !/^¿Cómo se lee/.test(uk.es)) assert.equal(es.es, uk.es);
      assert.equal(es.lang, 'es');
      assert.equal(uk.lang, 'uk');
      assert.equal(uk.hint, uk.ua);
    }
  });
  const a = M.makeExam({ count: 24, rng: seeded(5) });
  const b = M.makeExam({ count: 24, rng: seeded(5), lang: 'es' });
  assert.deepEqual(
    b.map((t) => [t.id, t.answer]),
    a.map((t) => [t.id, t.answer]),
  );
});

test('es: no Cyrillic in tasks, hints and error messages of any task type', () => {
  everyLevel((topic, level) => {
    for (let seed = 1; seed <= 120; seed++) {
      const t = M.makeTask(topic, level, seeded(seed), 'es');
      assert.ok(!('ua' in t), `${topic}${level}: es task has no ua`);
      assert.ok(t.es && t.hint, `${topic}${level}: es and hint present`);
      assert.ok(!CYR.test(JSON.stringify(t)), `${topic}${level}: ${JSON.stringify(t)}`);
      for (const v of wrongInputs(t)) {
        const r = M.checkAnswer(t, v);
        if (r.error) {
          assert.ok(r.error.es && !('ua' in r.error), `${topic}${level}`);
          assert.ok(!CYR.test(JSON.stringify(r.error)), `${topic}${level}: ${JSON.stringify(r.error)}`);
        }
      }
      if (t.data?.steps) {
        for (let i = 0; i < t.data.steps.length; i++) {
          for (const flag of [undefined, true, false, 0, 1]) {
            for (const d of [0, 5, 7]) {
              const r = M.checkColumnStep(t, i, d, flag);
              if (r.error) assert.ok(r.error.es && !CYR.test(JSON.stringify(r.error)));
            }
          }
        }
      }
      if (t.kind === 'problema') {
        for (const op of ['+', '-']) {
          const r = M.checkOp(t, op);
          if (r.error) assert.ok(!CYR.test(JSON.stringify(r.error)) && !('ua' in r.error));
        }
      }
      if (t.kind === 'fix') {
        for (const v of [{ ok: true }, { ok: false, value: 1 }, { ok: false, value: t.data.result }, {}]) {
          const r = M.checkAnswer(t, v);
          if (r.error) assert.ok(!CYR.test(JSON.stringify(r.error)));
        }
      }
    }
  });
  assert.ok(M.checkColumnStep(M.makeTask('columna', 1, seeded(3), 'es'), 99, 1).error.es);
});

test('uk: tasks and errors keep the Ukrainian explanation', () => {
  everyLevel((topic, level) => {
    const t = M.makeTask(topic, level, seeded(9));
    assert.ok(CYR.test(t.ua), `${topic}${level}`);
    const r = M.checkAnswer(t, t.kind === 'choice' ? t.choices.find((c) => c.value !== t.answer).value : { ok: !t.answer.ok, value: 1 });
    if (t.kind === 'choice') assert.ok(CYR.test(r.error.ua));
  });
});

test('es: texts per task type (printed with MATH_ES_DUMP=1)', () => {
  const dump = [];
  everyLevel((topic, level) => {
    const t = M.makeTask(topic, level, seeded(21), 'es');
    dump.push(`${topic} ${level} [${t.kind}] ${t.es}\n    💡 ${t.hint}`);
  });
  if (process.env.MATH_ES_DUMP) console.log(dump.join('\n'));
  assert.equal(dump.length, 9 + 6 + 2 + 2);
});
