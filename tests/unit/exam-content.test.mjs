// Exam engine content check: the shipped unit is valid, and KFExam.validate catches broken content.
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const read = (rel) => fs.readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), 'utf8');

// The scripts are classic ones sharing globals through window; types.js of the unit only needs KF.i18n at load.
const boot = () => {
  const sb = { console, KF: { i18n: () => (key) => key } };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/sociales-planeta/content.js', 'games/sociales-planeta/types.js']) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  return sb;
};
const sb = boot();
const { KFExam, SP_CONTENT, SP_TYPES } = sb;
const clone = (x) => JSON.parse(JSON.stringify(x));
const renderers = { ...KFExam.types, ...SP_TYPES };
// Arrays made inside the vm context are not deep-equal to ours: copy them.
const validate = (...args) => [...KFExam.validate(...args)];

test('sociales-planeta content is valid (with and without renderers)', () => {
  assert.deepEqual(validate(clone(SP_CONTENT)), []);
  assert.deepEqual(validate(clone(SP_CONTENT), renderers), []);
  assert.deepEqual(Object.keys(KFExam.types).sort(), ['choice', 'order', 'pairs', 'sort', 'tf']);
  assert.deepEqual(Object.keys(SP_TYPES).sort(), ['label', 'mapTap', 'paint', 'walk']);
});

// A small valid unit with one task of every generic type, to break one thing at a time.
const unit = () => ({
  slug: 'demo',
  title: 'Demo',
  stations: [
    {
      id: 'a',
      title: 'A',
      icon: '🅰️',
      intro: 'Station A',
      tasks: [
        { type: 'choice', q: 'Pick', options: ['x', 'y', 'z'], answer: 1 },
        { type: 'tf', q: 'True?', truth: true },
        {
          type: 'sort',
          q: 'Sort',
          bins: [
            { id: 'p', label: 'P', icon: '1' },
            { id: 'q', label: 'Q', icon: '2' },
          ],
          items: [
            { text: 'one', bin: 'p' },
            { text: 'two', bin: 'q' },
          ],
        },
        { type: 'order', q: 'Order', items: ['first', 'second', 'third'] },
        {
          type: 'pairs',
          q: 'Pairs',
          pairs: [
            ['a', '1'],
            ['b', '2'],
          ],
        },
      ],
    },
    {
      id: 'b',
      title: 'B',
      icon: '🅱️',
      intro: 'Station B',
      tasks: [{ type: 'tf', q: 'False?', truth: false }],
    },
  ],
  exam: { perStation: { a: 3, b: 1 } },
});

// [description, mutate(unit), expected message part]
const BROKEN = [
  ['choice answer out of range', (u) => (u.stations[0].tasks[0].answer = 3), 'answer 3'],
  ['choice answer is not a number', (u) => (u.stations[0].tasks[0].answer = '1'), 'answer 1'],
  ['choice with one option', (u) => (u.stations[0].tasks[0].options = ['x']), 'options'],
  ['tf without truth', (u) => delete u.stations[0].tasks[1].truth, 'truth'],
  ['sort item in a missing bin', (u) => (u.stations[0].tasks[2].items[0].bin = 'zz'), 'bin «zz»'],
  ['sort bin without items', (u) => (u.stations[0].tasks[2].items[1].bin = 'p'), 'bin «q» has no items'],
  ['sort bins with the same id', (u) => (u.stations[0].tasks[2].bins[1].id = 'p'), 'unique'],
  ['order with one item', (u) => (u.stations[0].tasks[3].items = ['only']), 'items'],
  ['order with more items than letter keys', (u) => (u.stations[0].tasks[3].items = Array.from({ length: 9 }, (_, i) => `i${i}`)), 'items'],
  ['pair with three parts', (u) => (u.stations[0].tasks[4].pairs[0] = ['a', '1', 'extra']), 'pair'],
  ['single pair', (u) => (u.stations[0].tasks[4].pairs = [['a', '1']]), 'pairs'],
  ['task without q', (u) => delete u.stations[0].tasks[0].q, 'q missing'],
  ['duplicate station id', (u) => (u.stations[1].id = 'a'), 'duplicate id'],
  ['exam station that does not exist', (u) => (u.exam.perStation.zz = 1), 'no station «zz»'],
  ['exam wants more tasks than the station has', (u) => (u.exam.perStation.b = 2), 'perStation.b = 2'],
  ['exam without perStation', (u) => delete u.exam.perStation, 'perStation'],
  ['hue of a missing station', (u) => (u.hues = { zz: '#fff' }), 'no station «zz»'],
  ['no slug', (u) => delete u.slug, 'slug'],
];

test('a valid fixture passes', () => {
  assert.deepEqual(validate(unit()), []);
  assert.deepEqual(validate(unit(), KFExam.types), []);
});

for (const [name, mutate, expected] of BROKEN) {
  test(`validate catches: ${name}`, () => {
    const u = unit();
    mutate(u);
    const errs = validate(u);
    assert.ok(errs.length > 0, 'no errors reported');
    assert.ok(
      errs.some((e) => e.includes(expected)),
      `expected an error with «${expected}», got ${JSON.stringify(errs)}`,
    );
  });
}

test('validate checks unit task types against the renderers only when they are given', () => {
  const u = unit();
  u.stations[1].tasks.push({ type: 'mapTap', q: 'Tap', target: 'x' });
  assert.deepEqual(validate(u), []);
  assert.deepEqual(validate(u, { ...KFExam.types, mapTap: () => {} }), []);
  const errs = validate(u, KFExam.types);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /no renderer for type «mapTap»/);
});

test('validate survives garbage', () => {
  assert.deepEqual(validate(undefined), ['unit: missing']);
  assert.ok(validate({}).length > 0);
  assert.ok(validate({ slug: 's', title: 't', stations: [{}], exam: {} }).length > 0);
});
