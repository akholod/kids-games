// Exam engine content check: the shipped unit is valid, and KFExam.validate catches broken content.
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildSlug } from './slug-impls.mjs';

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
  assert.deepEqual(Object.keys(KFExam.types).sort(), ['choice', 'fill', 'label', 'order', 'pairs', 'pick', 'sort', 'tf']);
  assert.deepEqual(Object.keys(SP_TYPES).sort(), ['mapTap', 'paint', 'walk']);
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
      text: {
        title: 'La leyenda',
        paragraphs: ['Había una vez un río.', 'El río cantaba.'],
        notes: [['río', 'corriente de agua']],
      },
      vocab: [
        ['la roca', 'скеля'],
        ['el relieve', 'рельєф'],
      ],
      tasks: [
        { type: 'choice', q: 'Pick', options: ['x', 'y', 'z'], answer: 1, passage: 'Un [portero] y un [.]\nOtro párrafo.' },
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
        {
          type: 'label',
          q: 'Label',
          scene: 'globe',
          labels: [
            { id: 'n', text: 'North' },
            { id: 's', text: 'South' },
          ],
        },
        { type: 'fill', q: 'Fill', text: 'Las ___ son el material sólido.', answer: 'rocas' },
        { type: 'pick', q: 'Toca los nombres', text: '¿[Pedro] para el [balón], Ana?' },
        { type: 'fill', q: 'Fill 2', text: 'Los animales ___ viven en el agua.', answer: 'acuáticos', extra: 'tm' },
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
  // label
  ['label without scene', (u) => delete u.stations[0].tasks[5].scene, 'scene missing'],
  ['label with one label', (u) => (u.stations[0].tasks[5].labels = [{ id: 'n', text: 'North' }]), 'labels must be 2+'],
  ['label with a label without text', (u) => (u.stations[0].tasks[5].labels[1] = { id: 's' }), 'labels must be 2+'],
  ['label ids not unique', (u) => (u.stations[0].tasks[5].labels[1].id = 'n'), 'label ids must be unique'],
  ['label texts not unique', (u) => (u.stations[0].tasks[5].labels[1].text = 'North'), 'label texts must be unique'],
  // fill
  ['fill without a gap', (u) => (u.stations[0].tasks[6].text = 'Las rocas son sólidas.'), 'exactly one ___'],
  ['fill with two gaps', (u) => (u.stations[0].tasks[6].text = 'Las ___ y las ___.'), 'exactly one ___'],
  ['fill answer with a capital', (u) => (u.stations[0].tasks[6].answer = 'Rocas'), 'answer «Rocas»'],
  ['fill answer of two words', (u) => (u.stations[0].tasks[6].answer = 'las rocas'), 'answer «las rocas»'],
  ['fill answer too long', (u) => (u.stations[0].tasks[6].answer = 'electricidades'), 'answer «electricidades»'],
  ['fill answer of one letter', (u) => (u.stations[0].tasks[6].answer = 'a'), 'answer «a»'],
  ['fill answer with Cyrillic', (u) => (u.stations[0].tasks[6].answer = 'скеля'), 'answer «скеля»'],
  ['fill extra with a capital', (u) => (u.stations[0].tasks[8].extra = 'Tm'), 'extra «Tm»'],
  ['fill extra too long', (u) => (u.stations[0].tasks[8].extra = 'tmpqr'), 'extra «tmpqr»'],
  // pick
  ['pick without a right word', (u) => (u.stations[0].tasks[7].text = 'Pedro para el balón.'), 'at least one [right word]'],
  ['pick with an unclosed bracket', (u) => (u.stations[0].tasks[7].text = 'El [portero para el balón.'), 'without its ]'],
  ['pick with a stray closing bracket', (u) => (u.stations[0].tasks[7].text = 'El portero] para el [balón].'), 'without its ['],
  ['pick with nested brackets', (u) => (u.stations[0].tasks[7].text = 'El [[portero]] para el balón.'), 'nested'],
  ['pick with two words in a bracket', (u) => (u.stations[0].tasks[7].text = 'Para [el balón].'), 'exactly one word'],
  ['pick with an empty bracket', (u) => (u.stations[0].tasks[7].text = 'Para [] el [balón].'), 'exactly one word'],
  ['pick with Cyrillic', (u) => (u.stations[0].tasks[7].text = 'El [портеро] para el [balón].'), 'no Cyrillic'],
  // passage
  ['passage with an unclosed bracket', (u) => (u.stations[0].tasks[0].passage = 'Un [portero'), 'passage: a [ without its ]'],
  ['passage with a stray closing bracket', (u) => (u.stations[0].tasks[0].passage = 'Un portero]'), 'passage: a ] without its ['],
  ['passage with nested brackets', (u) => (u.stations[0].tasks[0].passage = 'Un [[portero]]'), 'passage: brackets are nested'],
  ['passage with an empty bracket', (u) => (u.stations[0].tasks[0].passage = 'Un [ ] portero'), 'empty [ ]'],
  ['passage that is not a text', (u) => (u.stations[0].tasks[0].passage = 3), 'passage must be a non-empty text'],
  ['empty passage', (u) => (u.stations[0].tasks[0].passage = '  '), 'passage must be a non-empty text'],
  ['passage with Cyrillic', (u) => (u.stations[0].tasks[0].passage = 'Un [портеро]'), 'no Cyrillic'],
  [
    'passage on a unit task type is checked too',
    (u) => u.stations[1].tasks.push({ type: 'x', q: 'Q', passage: 'a [b' }),
    'passage: a [ without its ]',
  ],
  // listen (any task type, also a unit's own)
  ['listen that is not a text', (u) => (u.stations[0].tasks[0].listen = 4), 'listen must be a non-empty text'],
  ['empty listen', (u) => (u.stations[0].tasks[0].listen = ' '), 'listen must be a non-empty text'],
  ['listen with Cyrillic', (u) => (u.stations[0].tasks[0].listen = 'It’s a жаба.'), 'listen must be in the unit language (no Cyrillic)'],
  [
    'listen on a unit task type is checked too',
    (u) => u.stations[1].tasks.push({ type: 'x', q: 'Q', listen: '' }),
    'listen must be a non-empty text',
  ],
  // picture choice
  ['pics that is not a boolean', (u) => (u.stations[0].tasks[0].pics = 'yes'), 'pics must be true or false'],
  ['labels that are not a list', (u) => (u.stations[0].tasks[0].labels = 'x'), 'labels must be a list'],
  ['labels with an empty text', (u) => (u.stations[0].tasks[0].labels = ['a', '', 'c']), 'labels must be a list'],
  ['labels of another length than options', (u) => (u.stations[0].tasks[0].labels = ['a', 'b']), 'one text per option'],
  [
    'labels with Cyrillic',
    (u) => (u.stations[0].tasks[0].labels = ['a', 'жаба', 'c']),
    'labels must be in the unit language (no Cyrillic)',
  ],
  [
    'pics with an empty option',
    (u) => ((u.stations[0].tasks[0].pics = true), (u.stations[0].tasks[0].options[0] = '')),
    'options must be 2–9 texts',
  ],
  // station text
  ['station text that is not an object', (u) => (u.stations[0].text = 'La leyenda'), 'text must be'],
  ['station text without a title', (u) => (u.stations[0].text.title = ' '), 'title missing'],
  ['station text without paragraphs', (u) => (u.stations[0].text.paragraphs = []), 'paragraphs must be 1+'],
  ['station text with an empty paragraph', (u) => (u.stations[0].text.paragraphs[1] = ''), 'paragraphs must be 1+'],
  ['station text with a paragraph that is not a text', (u) => (u.stations[0].text.paragraphs[0] = 5), 'paragraphs must be 1+'],
  ['station text with notes that are not pairs', (u) => (u.stations[0].text.notes = ['río']), 'notes must be [word, meaning]'],
  ['station text with a note of three parts', (u) => (u.stations[0].text.notes = [['río', 'agua', 'x']]), 'notes must be [word, meaning]'],
  ['station text with a note without meaning', (u) => (u.stations[0].text.notes = [['río', '']]), 'notes must be [word, meaning]'],
  ['station text with Cyrillic in a paragraph', (u) => (u.stations[0].text.paragraphs[0] = 'Había una річка.'), 'no Cyrillic'],
  ['station text with Cyrillic in a note', (u) => (u.stations[0].text.notes[0][1] = 'річка'), 'no Cyrillic'],
  // vocab
  ['vocab that is not a list', (u) => (u.stations[0].vocab = 'la roca'), 'vocab must be'],
  ['empty vocab', (u) => (u.stations[0].vocab = []), 'vocab must be'],
  ['vocab entry with three parts', (u) => (u.stations[0].vocab[0] = ['la roca', 'скеля', 'x']), 'vocab 1'],
  ['vocab entry without translation', (u) => (u.stations[0].vocab[1] = ['el relieve', ' ']), 'vocab 2'],
  ['vocab entry that is a string', (u) => (u.stations[0].vocab[0] = 'la roca'), 'vocab 1'],
  ['vocab term in Cyrillic', (u) => (u.stations[0].vocab[0] = ['скеля', 'скеля']), 'Cyrillic only in the translation'],
  // practiceCoin: a number, 0 < x <= 1
  ['practiceCoin 0', (u) => (u.practiceCoin = 0), 'practiceCoin'],
  ['practiceCoin below 0', (u) => (u.practiceCoin = -0.5), 'practiceCoin'],
  ['practiceCoin above 1', (u) => (u.practiceCoin = 1.01), 'practiceCoin'],
  ['practiceCoin as a text', (u) => (u.practiceCoin = '0.5'), 'practiceCoin'],
  ['practiceCoin NaN', (u) => (u.practiceCoin = Number.NaN), 'practiceCoin'],
  ['practiceCoin true', (u) => (u.practiceCoin = true), 'practiceCoin'],
  // exam.sendOff: a boolean
  ['sendOff as a text', (u) => (u.exam.sendOff = 'yes'), 'sendOff'],
  ['sendOff as a number', (u) => (u.exam.sendOff = 1), 'sendOff'],
  // exam.var: the VAR cost in coins (0 / absent = no VAR)
  ['var below 0', (u) => (u.exam.var = -1), 'var'],
  ['var as a text', (u) => (u.exam.var = '2'), 'var'],
  ['var true', (u) => (u.exam.var = true), 'var'],
];

test('a valid fixture passes', () => {
  assert.deepEqual(validate(unit()), []);
  assert.deepEqual(validate(unit(), KFExam.types), []);
});

test('practiceCoin (0 < x <= 1), exam.sendOff (boolean) and exam.var (0, 2) pass at their good values, boundaries included', () => {
  for (const practiceCoin of [1, 0.5, 0.01]) {
    for (const sendOff of [true, false]) {
      const u = unit();
      u.practiceCoin = practiceCoin;
      u.exam.sendOff = sendOff;
      u.exam.var = practiceCoin === 1 ? 0 : 2;
      assert.deepEqual(validate(u), [], `practiceCoin ${practiceCoin}, sendOff ${sendOff}`);
    }
  }
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

test('pick, passage and station text: good content passes (a lone [.], several marks, notes optional, no notes at all)', () => {
  const u = unit();
  assert.deepEqual(validate(u, KFExam.types), []);
  u.stations[0].tasks[0].passage = 'Aquí[.] Y otro [mar] y [luz].';
  u.stations[0].tasks[7].text = 'Pedro y [Ana] van con [Luis], [María] y el [perro].';
  delete u.stations[0].text.notes;
  assert.deepEqual(validate(u, KFExam.types), []);
  u.stations[1].text = { title: 'T', paragraphs: ['Uno.'] };
  assert.deepEqual(validate(u), []);
  assert.ok(Object.keys(KFExam.types).includes('pick'));
});

test('listen and picture choice: good content passes (contentLang, listen with art / pics, labels optional)', () => {
  const u = unit();
  u.contentLang = 'en';
  const t = u.stations[0].tasks;
  t[0].listen = 'It’s a frog.';
  t[0].art = 'frog';
  t[1].listen = 'Are they dangerous?';
  Object.assign(t[0], { pics: true, options: ['frog', 'toad', 'snake'], answer: 0 });
  assert.deepEqual(validate(u, KFExam.types), []);
  t[0].labels = ['a frog', 'a toad', 'a snake'];
  assert.deepEqual(validate(u, KFExam.types), []);
  u.stations[1].tasks.push({ type: 'x', q: 'Q', listen: 'A unit task that listens.' });
  assert.deepEqual(validate(u), []);
});

test('a unit that brings its own renderer for a generic type name (dictado: pick) is not held to the generic shape', () => {
  const u = unit();
  delete u.stations[0].tasks[7].text;
  u.stations[0].tasks[7].options = ['a', 'b'];
  assert.deepEqual(validate(u), []); // without renderers: a «pick» without text is the unit's own
  const errs = validate(u, KFExam.types); // generic renderers: it is a broken generic pick
  assert.equal(errs.length, 1);
  assert.match(errs[0], /text missing/);
  assert.deepEqual(validate(u, { ...KFExam.types, pick: () => {} }), []); // the unit's renderer takes over
});

test('vocab: the translation may be Cyrillic, the Spanish term may not', () => {
  const u = unit();
  u.stations[0].vocab.push(['la capa', 'шар'], ['el CO₂', 'вуглекислий газ']);
  assert.deepEqual(validate(u), []);
  u.stations[0].vocab.push(['скеля', 'скеля']);
  assert.equal(validate(u).length, 1);
});

test('sociales-planeta (shared by both sites): Cyrillic nowhere, except in vocab translations', () => {
  const seen = [];
  const walk = (x, path) => {
    if (typeof x === 'string') {
      if (CYR.test(x) && !/\.vocab\.\d+\.1$/.test(path)) seen.push(path);
    } else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) walk(v, `${path}.${k}`);
  };
  walk(clone(SP_CONTENT), 'sp');
  assert.deepEqual(seen, []);
});

// ---------- naturales-entorno: Ciencias de la Naturaleza, Unidad 1 ----------

// art.js draws SVG with the DOM; scene(name) only needs a node that takes attributes and markup, so a tiny stub is enough.
const bootNaturales = () => {
  const node = () => ({ attrs: {}, dataset: {}, setAttribute() {}, set innerHTML(_) {}, classList: { add() {} } });
  const sb = { console, KF: { i18n: () => (key) => key, gameData: () => ({}) }, document: { createElementNS: node } };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of ['content', 'art', 'types']) {
    vm.runInContext(read(`games/naturales-entorno/${f}.js`), sb, { filename: `games/naturales-entorno/${f}.js` });
  }
  return { content: clone(sb.CN_CONTENT), types: sb.CN_TYPES, art: sb.CNArt };
};

test('naturales-entorno content is valid; Cyrillic only in vocab translations; every station has a glossary', () => {
  const { content: u } = bootNaturales();
  assert.deepEqual(validate(u), []);
  const seen = [];
  const walk = (x, path) => {
    if (typeof x === 'string') {
      if (CYR.test(x) && !/\.vocab\.\d+\.1$/.test(path)) seen.push(path);
    } else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) walk(v, `${path}.${k}`);
  };
  walk(u, 'cn');
  assert.deepEqual(seen, []);
  for (const s of u.stations) assert.ok(s.vocab?.length >= 5, s.id);
  const sum = Object.values(u.exam.perStation).reduce((a, b) => a + b, 0);
  assert.equal(sum, 12);
  assert.deepEqual(
    Object.keys(u.exam.perStation),
    u.stations.map((s) => s.id),
  );
});

test('naturales-entorno: valid with the renderers; every art key and label scene exists; filter tasks are playable', () => {
  const { content: u, types, art } = bootNaturales();
  assert.deepEqual(Object.keys(types), ['filter']);
  assert.deepEqual(validate(u, { ...KFExam.types, ...types }), []);
  const tasks = u.stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id })));
  // Every task type the unit uses has a renderer (generic or its own)
  const known = new Set([...Object.keys(KFExam.types), ...Object.keys(types)]);
  for (const t of tasks) assert.ok(known.has(t.type), `${t.station}: no renderer for ${t.type}`);
  // art.js needs the DOM, but `has` is plain data and scene() runs on a stub node
  const keys = [...new Set(tasks.filter((t) => t.art).map((t) => t.art))];
  assert.ok(keys.length >= 15, `${keys.length} art keys`);
  for (const k of keys) assert.ok(art.has(k), `art «${k}» does not exist`);
  assert.ok(!art.has('nope') && !art.has(''));
  const labels = tasks.filter((t) => t.type === 'label');
  assert.ok(labels.length >= 3);
  for (const t of labels) {
    const sc = art.scene(t.scene);
    assert.ok(sc, `scene «${t.scene}» does not exist`);
    const spots = new Set(sc.spots.map((p) => p.id));
    for (const l of t.labels) assert.ok(spots.has(l.id), `${t.scene}: no hotspot «${l.id}»`);
    assert.equal(sc.spots.length, spots.size, `${t.scene}: duplicate hotspot ids`);
    for (const p of sc.spots)
      assert.ok(p.x >= 0 && p.x <= sc.box[0] && p.y >= 0 && p.y <= sc.box[1] && p.w > 0, `${t.scene}: ${p.id} out of the box`);
  }
  assert.equal(art.scene('nope'), null);
  // The filter task: 2–9 distinct layers (the right order, mouth first)
  const filters = tasks.filter((t) => t.type === 'filter');
  assert.ok(filters.length >= 1);
  for (const t of filters) {
    assert.ok(t.layers.length >= 2 && t.layers.length <= 9, t.q);
    assert.equal(new Set(t.layers).size, t.layers.length, `${t.q}: layers must be distinct`);
  }
  // No fill word twice in a station
  for (const s of u.stations) {
    const answers = s.tasks.filter((t) => t.type === 'fill').map((t) => t.answer);
    assert.equal(new Set(answers).size, answers.length, `${s.id}: the same fill word twice`);
  }
});

// ---------- lengua-mundo: Lengua Castellana, Unidad 1 ----------

const bootLengua = () => {
  const node = () => ({ attrs: {}, dataset: {}, setAttribute() {}, set innerHTML(_) {}, classList: { add() {} } });
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key, gameData: () => ({}) },
    KFG: { shuffle: (a) => [...a], canSay: () => false },
    document: { createElementNS: node },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of [
    'shared/exam/exam.js',
    'shared/exam/types.js',
    'games/lengua-mundo/content.js',
    'games/lengua-mundo/art.js',
    'games/lengua-mundo/types.js',
  ]) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  const audio = { window: {} };
  vm.createContext(audio);
  vm.runInContext(read('shared/audio.js'), audio);
  return {
    E: sb.KFExam,
    content: clone(sb.LE_CONTENT),
    types: sb.LE_TYPES,
    art: sb.LEArt,
    es: new Set(audio.window.KF_AUDIO?.es ?? audio.KF_AUDIO.es),
  };
};

test('lengua-mundo: valid with and without the renderers; exam, sampling and stations are consistent', () => {
  const { E, content: u, types } = bootLengua();
  assert.deepEqual(Object.keys(types).sort(), ['chat', 'fix', 'tone']);
  assert.deepEqual([...E.validate(clone(u))], []);
  assert.deepEqual([...E.validate(clone(u), { ...E.types, ...types })], []);
  assert.equal(u.testHook, '__le');
  assert.equal(u.stations.length, 8);
  assert.deepEqual(
    Object.keys(u.exam.perStation),
    u.stations.map((s) => s.id),
  );
  assert.equal(
    Object.values(u.exam.perStation).reduce((a, b) => a + b, 0),
    12,
  );
  const tasks = u.stations.flatMap((s) => s.tasks);
  assert.ok(tasks.length >= 200, `${tasks.length} tasks`);
  const known = new Set([...Object.keys(E.types), ...Object.keys(types)]);
  for (const t of tasks) assert.ok(known.has(t.type), `no renderer for ${t.type}`);
  // every type named in the sampling rules exists in the unit
  const used = new Set(tasks.map((t) => t.type));
  for (const k of [...Object.keys(u.sampling.caps), ...Object.keys(u.sampling.examCaps), ...u.sampling.always])
    assert.ok(used.has(k), `sampling names «${k}»`);
  // no Cyrillic anywhere in the Spanish content
  assert.ok(!CYR.test(JSON.stringify(u)), 'Cyrillic in the unit content');
  // the readings: baobab and midas only, with notes, and the hook of every other station is plain
  assert.deepEqual(
    u.stations.filter((s) => s.text).map((s) => s.id),
    ['baobab', 'midas'],
  );
  for (const s of u.stations.filter((x) => x.text)) assert.ok(s.text.paragraphs.length >= 5 && s.text.notes?.length >= 1, s.id);
});

test('lengua-mundo: every art key and label scene exists, hotspots match the labels', () => {
  const { content: u, art } = bootLengua();
  const tasks = u.stations.flatMap((s) => s.tasks);
  const keys = [...new Set(tasks.filter((t) => t.art).map((t) => t.art))];
  assert.deepEqual(keys.sort(), ['baobab', 'baobab-reves', 'midas', 'telefono']);
  for (const k of keys) assert.ok(art.has(k), `art «${k}» does not exist`);
  assert.ok(!art.has('nope'));
  const labels = tasks.filter((t) => t.type === 'label');
  assert.deepEqual(labels.map((t) => t.scene).sort(), ['aviso', 'nota']);
  for (const t of labels) {
    const sc = art.scene(t.scene);
    assert.ok(sc, `scene «${t.scene}» does not exist`);
    const spots = new Set(sc.spots.map((p) => p.id));
    assert.equal(spots.size, sc.spots.length, `${t.scene}: duplicate hotspots`);
    assert.deepEqual([...spots].sort(), t.labels.map((l) => l.id).sort(), `${t.scene}: labels and hotspots differ`);
  }
  assert.deepEqual([...art.scene('nota').spots.map((p) => p.id)].sort(), ['destinatario', 'firma', 'mensaje']);
  assert.deepEqual([...art.scene('aviso').spots.map((p) => p.id)].sort(), ['disculpa', 'hecho', 'responsable']);
  assert.equal(art.scene('nope'), null);
});

test('lengua-mundo: every tone sentence and every reading paragraph has a clip in shared/audio.js', () => {
  const { content: u, es } = bootLengua();
  const texts = [
    ...u.stations.flatMap((s) => s.text?.paragraphs ?? []),
    ...u.stations.flatMap((s) => s.tasks.filter((t) => t.type === 'tone').map((t) => t.say)),
  ];
  assert.ok(texts.length >= 20);
  for (const t of texts) {
    const slug = buildSlug(t);
    assert.ok(slug.length <= 60, `«${t.slice(0, 30)}…»: ${slug.length} characters`);
    assert.ok(es.has(slug), `no clip for «${t.slice(0, 50)}…» (${slug}): run scripts/build-audio.mjs`);
  }
});

test('lengua-mundo: fix texts are well formed (capital first, only letters, spaces and . , ¡ ! ¿ ?), with a stop to find', () => {
  const { content: u } = bootLengua();
  const fixes = u.stations.flatMap((s) => s.tasks.filter((t) => t.type === 'fix').map((t) => ({ ...t, st: s.id })));
  assert.ok(fixes.length >= 5);
  for (const t of fixes) {
    assert.match(t.text, /^[\p{Lu}¡¿]/u, `«${t.text}»: must start with a capital`);
    assert.match(t.text, /^[\p{L} .,¡!¿?]+$/u, `«${t.text}»: other characters`);
    assert.ok(t.text.endsWith('.'), `«${t.text}»: ends with a full stop`);
    assert.ok(!/\s{2,}|\s$/.test(t.text), `«${t.text}»: spaces`);
    assert.ok(t.text.length <= 120, `«${t.text}»: ${t.text.length} characters is too long for a screen`);
    // after a full stop the next sentence starts with a capital
    for (const m of t.text.matchAll(/\. (\S)/gu))
      assert.ok(m[1] === m[1].toUpperCase() && m[1] !== m[1].toLowerCase(), `«${t.text}»: lowercase after a stop`);
    assert.equal(t.st, 'punto');
  }
});

test('lengua-mundo: chat turns have 2–3 distinct replies and a valid answer; tone tasks have a sentence and a direction', () => {
  const { content: u } = bootLengua();
  const tasks = u.stations.flatMap((s) => s.tasks);
  const chats = tasks.filter((t) => t.type === 'chat');
  assert.ok(chats.length >= 5);
  for (const t of chats) {
    assert.ok(t.who && t.icon, t.q);
    assert.ok(t.turns.length >= 2 && t.turns.length <= 4, `${t.who}: ${t.turns.length} turns`);
    for (const [i, turn] of t.turns.entries()) {
      const w = `${t.who} turn ${i + 1}`;
      assert.ok(turn.them?.trim(), `${w}: what they say`);
      assert.ok(turn.options.length >= 2 && turn.options.length <= 3, `${w}: ${turn.options.length} options`);
      assert.equal(new Set(turn.options).size, turn.options.length, `${w}: repeated options`);
      assert.ok(
        turn.options.every((o) => typeof o === 'string' && o.trim()),
        `${w}: empty option`,
      );
      assert.ok(Number.isInteger(turn.answer) && turn.answer >= 0 && turn.answer < turn.options.length, `${w}: answer ${turn.answer}`);
      // `why` is optional (the screen falls back to «Mejor así:»), but never an empty text
      if (turn.why !== undefined) assert.ok(typeof turn.why === 'string' && turn.why.trim(), `${w}: empty why`);
    }
  }
  const tones = tasks.filter((t) => t.type === 'tone');
  assert.ok(tones.length >= 10);
  assert.ok(tones.some((t) => t.rising) && tones.some((t) => !t.rising), 'both directions');
  for (const t of tones) {
    assert.equal(typeof t.rising, 'boolean', t.say);
    assert.ok(t.say?.trim() && /[?!.]$/.test(t.say), `tone «${t.say}»`);
    // the intonation is read from the signs at the end: a question rises, a statement falls
    assert.equal(t.rising, /\?$/.test(t.say), `«${t.say}»: ${t.rising ? 'rising' : 'falling'}`);
  }
  assert.equal(new Set(tones.map((t) => t.say)).size, tones.length, 'a tone sentence twice');
});

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

// ---------- word-match: tasks generated from the word list, per site language ----------

const CYR = /[\u0400-\u04FF]/;
const bootWords = (lang) => {
  const sb = { console, Math, KF: { lang, i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a].sort(() => Math.random() - 0.5) } };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/word-match/content.js'])
    vm.runInContext(read(f), sb, { filename: f });
  return sb;
};

for (const lang of ['uk', 'es']) {
  test(`word-match (${lang}): generated content is valid, keys unique, translations unique per theme`, () => {
    const { KFExam: E, WM_CONTENT: wm } = bootWords(lang);
    assert.deepEqual([...E.validate(clone(wm))], []);
    assert.deepEqual([...wm.natives], lang === 'es' ? ['es'] : ['uk', 'es']);
    assert.equal(wm.stations.length, 12);
    const keys = new Set();
    for (const t of wm.themes) {
      assert.ok(t.words.length >= 10, t.id);
      for (const n of ['en', 'es', 'uk']) assert.equal(new Set(t.words.map((w) => w[n])).size, t.words.length, `${t.id}: duplicate ${n}`);
      for (const w of t.words) {
        assert.ok(!keys.has(w.key), w.key);
        keys.add(w.key);
        assert.ok(!CYR.test(w.en + w.es), w.key);
        assert.ok(CYR.test(w.uk), w.key);
      }
    }
    for (const s of wm.stations) {
      assert.ok(s.tasks.length >= 30, `${s.id}: ${s.tasks.length} tasks`);
      const keyed = new Set(s.tasks.filter((x) => x.key).map((x) => x.key));
      assert.ok(keyed.size >= 8, `${s.id}: a round of 8 needs 8 different words`);
      for (const task of s.tasks) {
        if (task.type === 'choice') assert.equal(new Set(task.options).size, task.options.length, `${s.id}: ${task.q}`);
        if (task.type === 'listen') assert.ok(task.options.every((w) => w.pic || w.color) && task.options[0] === task.word);
        if (task.type === 'spell') assert.match(task.word.en, /^[a-z]{3,8}$/i);
        if (task.art) assert.ok(wm.words[task.art], task.art);
      }
    }
  });
}

test('word-match (es): no Cyrillic anywhere in the Spanish site content', () => {
  const { WM_CONTENT: wm } = bootWords('es');
  const seen = [];
  const walk = (x, path) => {
    if (typeof x === 'string') {
      if (CYR.test(x) && !path.endsWith('.uk')) seen.push(path);
    } else if (typeof x === 'function') {
      const s = x({
        n: 1,
        total: 2,
        w: 'x',
        grade: 'g',
        nota: '1',
        coins: 1,
        need: 1,
        a: 'a',
        text: 't',
        item: 'i',
        bin: 'b',
        l: 'D',
        y: 1,
        r: 0,
        score: 1,
        max: 2,
      });
      if (CYR.test(s)) seen.push(path);
    } else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) walk(v, `${path}.${k}`);
  };
  // word objects keep their Ukrainian name (.uk) — the es site never shows it
  walk({ ...wm, words: {}, themes: [] }, 'wm');
  assert.deepEqual(seen, []);
});

// ---------- chytanka («Читанка-мандрівка») ----------

const bootChytanka = () => {
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key },
    KFG: { shuffle: (a) => [...a].sort(() => Math.random() - 0.5) },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/chytanka/content.js'])
    vm.runInContext(read(f), sb, { filename: f });
  return sb;
};
// Ukrainian letters only: a Latin look-alike (i, a, o, e, c, p, x) in a word is an invisible bug.
const UA_WORD = /^[а-щьюяґєії’]+$/;
const STRESS = /\u0301/g;

test('chytanka: generated content is valid; words, syllables and stress marks are consistent', () => {
  for (let run = 0; run < 5; run++) {
    const { KFExam: E, CH_CONTENT: ch } = bootChytanka();
    assert.deepEqual([...E.validate(clone(ch))], []);
    assert.equal(ch.stations.length, 10);
    assert.deepEqual(
      ch.route.map((r) => r.id),
      ch.stations.map((s) => s.id),
    );
    const seen = new Set();
    for (const st of ch.route) {
      assert.equal(st.words.length, 12, st.id);
      assert.equal(new Set(st.words.map((w) => w.pic)).size, 12, `${st.id}: pictures must differ within a stop`);
      for (const w of st.words) {
        assert.ok(!seen.has(w.word), `${w.word}: twice in the unit`);
        seen.add(w.word);
        assert.equal(w.key, `${st.id}.${w.word}`);
        assert.ok(UA_WORD.test(w.word), `${w.word}: not only Ukrainian letters`);
        assert.equal(w.syl.join('').replace(STRESS, ''), w.word);
        const marks = (w.syl.join('').match(STRESS) || []).length;
        assert.equal(marks, w.syl.length > 1 ? 1 : 0, `${w.syl.join('-')}: one stress mark in a word of 2+ syllables`);
        for (const s of w.syl) assert.ok(/[аеєиіїоуюя]/.test(s), `${w.word}: syllable «${s}» without a vowel`);
        assert.ok(w.pic, w.word);
      }
      const station = ch.stations.find((s) => s.id === st.id);
      const types = new Set(station.tasks.map((t) => t.type));
      for (const t of ['read', 'choice', 'hear', 'build', 'story']) assert.ok(types.has(t), `${st.id}: no ${t}`);
      for (const t of station.tasks) {
        if (t.options) assert.equal(new Set(t.options.map((o) => (typeof o === 'string' ? o : o.key))).size, t.options.length, t.q);
        if (t.type === 'read') {
          assert.equal(t.options[0], t.word);
          assert.equal(t.options.length, 4);
          assert.equal(new Set(t.options.map((o) => o.pic)).size, 4);
        }
        if (t.type === 'hear' || t.type === 'choice') {
          assert.equal(t.options.length, 4, t.key);
          assert.equal(t.options[0], ch.words[t.key].word);
        }
        if (t.type === 'build') {
          const own = t.word.syl.map((s) => s.replace(STRESS, ''));
          assert.ok(t.extra.length >= 1);
          for (const x of t.extra) assert.ok(!own.includes(x.replace(STRESS, '')), `${t.word.word}: extra «${x}» is its own syllable`);
        }
        if (t.type === 'gap') {
          assert.equal(t.word.word[t.at], t.options[0], t.key);
          assert.ok(t.options.length >= 2);
        }
        if (t.type === 'story') {
          assert.equal(t.options.length, 4);
          assert.ok(t.text && t.ask, t.text);
        }
      }
    }
    assert.equal(seen.size, 120);
  }
});

// ---------- dictado («Dictado del míster») ----------

const bootDictado = (lang) => {
  const sb = { console, Math, KF: { lang, i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a].sort(() => Math.random() - 0.5) } };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/dictado/content.js'])
    vm.runInContext(read(f), sb, { filename: f });
  return sb;
};
const ACCENTED = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
// The Spanish fields of a task (what is dictated and written): never Cyrillic, on either site.
const spanishOf = (t) => JSON.stringify([t.say, t.word, t.options, t.parts, t.words, t.fix, t.plain]);

for (const lang of ['uk', 'es']) {
  test(`dictado (${lang}): content is valid; gaps, spellings, tildes and sentences are consistent`, () => {
    const { KFExam: E, DC_CONTENT: dc } = bootDictado(lang);
    assert.deepEqual([...E.validate(clone(dc))], []);
    assert.equal(dc.stations.length, 12);
    assert.deepEqual(
      dc.rules.map((r) => r.id),
      dc.stations.map((s) => s.id),
    );
    if (lang === 'es') assert.ok(!CYR.test(JSON.stringify(dc)), 'Cyrillic on the Spanish site');
    const homophones = new Set(dc.homophones);
    const bare = (s) => s.toLowerCase().replace(/[¿¡?!.,]/g, '');
    for (const st of dc.stations) {
      const by = (type) => st.tasks.filter((t) => t.type === type);
      assert.ok(by('write').length >= 10, `${st.id}: write tasks for the final`);
      assert.ok(by('cloze').length >= 6, `${st.id}: sentences`);
      for (const t of st.tasks) {
        assert.ok(!CYR.test(spanishOf(t)), `${st.id}: Cyrillic in ${spanishOf(t)}`);
        assert.ok(t.key?.startsWith(`${st.id}.`), t.key);
        if (['gap', 'pick', 'tiles', 'tilde', 'write'].includes(t.type))
          assert.ok(!homophones.has(bare(t.say)), `${st.id}: «${t.say}» sounds like another word: only in a sentence`);
        if (t.options) assert.equal(new Set(t.options).size, t.options.length, `${st.id}: ${t.options}`);
        if (t.type === 'gap') {
          assert.equal(t.word.slice(t.at, t.at + t.len), t.options[0], t.word);
          assert.ok(t.options.length >= 2);
          assert.equal(t.say, t.word);
        }
        if (t.type === 'pick') {
          assert.equal(t.options[0], t.say);
          assert.ok(t.options.length >= 2 && t.options.length <= 3, t.say);
        }
        if (t.type === 'tiles') {
          assert.ok(!/\s/.test(t.word) && t.word.length <= 10, t.word);
          assert.ok(t.traps.length >= 1 && t.traps.length <= 3, t.word);
        }
        if (t.type === 'tilde') {
          assert.ok(!/[áéíóú]/.test(t.plain), t.plain);
          if (t.answer < 0) assert.equal(t.plain, t.word);
          else {
            assert.equal(ACCENTED[t.word[t.answer]], t.plain[t.answer], t.word);
            assert.equal(
              t.word.replace(/[áéíóú]/g, (c) => ACCENTED[c]),
              t.plain,
            );
          }
        }
        if (t.type === 'cloze') {
          const gaps = t.parts.filter((p) => typeof p !== 'string');
          assert.ok(gaps.length >= 1 && gaps.length <= 3, t.say);
          assert.equal(t.parts.map((p) => (typeof p === 'string' ? p : p.right)).join(''), t.say);
          for (const g of gaps) {
            assert.equal(g.options[0], g.right);
            assert.equal(new Set(g.options).size, g.options.length, t.say);
          }
        }
        if (t.type === 'spot') {
          const right = t.say.split(' ');
          assert.equal(t.words.length, right.length, t.say);
          const diff = [...t.words].map((w, i) => (w === right[i] ? -1 : i)).filter((i) => i >= 0);
          assert.deepEqual(diff, [t.wrong], t.say);
          assert.ok(right[t.wrong].startsWith(t.fix), `${t.fix} / ${right[t.wrong]}`);
        }
        if (t.type === 'write') assert.equal(t.say, t.word);
      }
    }
    // the final is typed: the exam draws only write tasks, station rounds never do
    const types = new Set(dc.stations.flatMap((s) => s.tasks.map((t) => t.type)));
    for (const type of types) if (type !== 'write') assert.equal(dc.sampling.examCaps[type], 0, type);
    assert.equal(dc.sampling.caps.write, 0);
  });
}

// ---------- english-animals: English (Open Up 3), Unit 1 «Animals» ----------

const bootEnglish = () => {
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key, gameData: () => ({}) },
    KFG: { shuffle: (a) => [...a], canSay: () => false },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of ['shared/exam/exam.js', 'shared/exam/types.js', 'games/english-animals/content.js']) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  return { E: sb.KFExam, content: clone(sb.EA_CONTENT) };
};

test('english-animals: valid with the generic renderers (no unit types); exam, hook and language are set', () => {
  const { E, content: u } = bootEnglish();
  assert.deepEqual([...E.validate(clone(u))], []);
  assert.deepEqual([...E.validate(clone(u), E.types)], []);
  assert.equal(u.slug, 'english-animals');
  assert.equal(u.contentLang, 'en');
  assert.equal(u.testHook, '__ea');
  assert.equal(u.stations.length, 9);
  assert.deepEqual(Object.keys(u.exam.perStation).sort(), u.stations.map((s) => s.id).sort());
  const tasks = u.stations.flatMap((s) => s.tasks);
  assert.ok(tasks.length >= 200, `${tasks.length} tasks`);
  for (const t of tasks) assert.ok(E.types[t.type], `no generic renderer for ${t.type}`);
  // every type named in the sampling rules exists in the unit
  const used = new Set(tasks.map((t) => t.type));
  for (const k of [...Object.keys(u.sampling.caps), ...Object.keys(u.sampling.examCaps), ...u.sampling.always])
    assert.ok(used.has(k), `sampling names «${k}»`);
  // readings: the story and the helpers
  assert.deepEqual(
    u.stations.filter((s) => s.text).map((s) => s.id),
    ['story', 'helpers'],
  );
  assert.equal(u.stations.find((s) => s.id === 'story').text.paragraphs.length, 7);
  // the unit has listen tasks, picture choices and the english true / false keys
  assert.ok(tasks.some((t) => t.listen));
  assert.ok(tasks.some((t) => t.pics));
  assert.equal(u.strings.true, 'True');
});

test('english-animals: no Cyrillic anywhere in the content (it is the same on both sites)', () => {
  const { content: u } = bootEnglish();
  assert.ok(!CYR.test(JSON.stringify(u)), 'Cyrillic in the unit content');
  assert.ok(
    u.stations.every((s) => !s.vocab),
    'no Ukrainian glossary',
  );
});

test('english-animals: every picture choice names every picture, every listen is a real sentence, keys are unique per draw', () => {
  const { content: u } = bootEnglish();
  const tasks = u.stations.flatMap((s) => s.tasks);
  const pics = tasks.filter((t) => t.pics);
  assert.ok(pics.length >= 10, `${pics.length} picture choices`);
  for (const t of pics) {
    assert.equal(t.type, 'choice', t.q);
    assert.ok(Array.isArray(t.labels) && t.labels.length === t.options.length, `pics without a label for each option: ${t.q} ${t.options}`);
    assert.equal(new Set(t.options).size, t.options.length, `repeated picture: ${t.options}`);
    assert.equal(new Set(t.labels).size, t.labels.length, `repeated label: ${t.labels}`);
  }
  for (const t of tasks.filter((x) => x.listen)) assert.ok(t.listen.trim().length > 1, t.q);
});

test('english-animals: the right option of a choice is not clearly the longest', () => {
  const { content: u } = bootEnglish();
  const bad = [];
  for (const s of u.stations) {
    for (const t of s.tasks) {
      if (t.type !== 'choice' || t.fixed || t.pics) continue;
      const right = t.options[t.answer].length;
      const other = Math.max(...t.options.filter((_, i) => i !== t.answer).map((o) => o.length));
      if (right > other * 1.3 && right - other > 6) bad.push(`${s.id}: «${t.q}» → ${t.options[t.answer]} (${right} vs ${other})`);
    }
  }
  assert.deepEqual(bad, []);
});

// ---------- cultura-asturiana: Cultura Asturiana 3.º, primer trimestre ----------

const bootCultura = () => {
  const node = () => ({ attrs: {}, dataset: {}, style: {}, setAttribute() {}, append() {}, set innerHTML(_) {}, classList: { add() {} } });
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key, gameData: () => ({}) },
    KFG: { shuffle: (a) => [...a], canSay: () => false },
    document: { createElementNS: node, createElement: node },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of [
    'shared/exam/exam.js',
    'shared/exam/types.js',
    'games/cultura-asturiana/content.js',
    'games/cultura-asturiana/art.js',
    'games/cultura-asturiana/types.js',
  ]) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  return { E: sb.KFExam, content: clone(sb.CA_CONTENT), types: sb.CA_TYPES, art: sb.CAArt, check: sb.CA_CHECK };
};
const CA_OWN = ['calendar', 'cascayu', 'clues', 'cook', 'feed', 'wordsearch'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

test('cultura-asturiana: valid; 8 stations with a glossary and a reading; exam of 20; Cyrillic only in vocab', () => {
  const { E, content: u } = bootCultura();
  assert.deepEqual([...E.validate(clone(u))], []);
  assert.equal(u.slug, 'cultura-asturiana');
  assert.equal(u.testHook, '__ca');
  assert.deepEqual(
    u.stations.map((s) => s.id),
    ['lectura', 'caseria', 'vacas', 'gochu', 'samartin', 'sanxuan', 'gaita', 'juegos'],
  );
  assert.deepEqual(
    Object.keys(u.exam.perStation),
    u.stations.map((s) => s.id),
  );
  assert.equal(
    Object.values(u.exam.perStation).reduce((a, b) => a + b, 0),
    20,
  );
  for (const s of u.stations) {
    assert.ok(s.vocab?.length >= 10, `${s.id}: glossary`);
    assert.ok(s.text?.paragraphs.length >= 4, `${s.id}: reading`);
    assert.ok(s.tasks.length >= 20, `${s.id}: ${s.tasks.length} tasks`);
  }
  const noVocab = { ...u, stations: u.stations.map(({ vocab, ...s }) => s) };
  assert.ok(!CYR.test(JSON.stringify(noVocab)), 'Cyrillic outside the glossaries');
  const used = new Set(u.stations.flatMap((s) => s.tasks.map((t) => t.type)));
  for (const k of CA_OWN) assert.ok(used.has(k), `no ${k} task`);
  for (const k of [...Object.keys(u.sampling.caps), ...Object.keys(u.sampling.examCaps), ...u.sampling.always])
    assert.ok(used.has(k), `sampling names «${k}»`);
});

test('cultura-asturiana: the right option of a text choice is not clearly the longest', () => {
  const { content: u } = bootCultura();
  for (const t of u.stations.flatMap((s) => s.tasks)) {
    if (t.type !== 'choice' || t.pics) continue;
    const ok = t.options[t.answer].length;
    const mx = Math.max(...t.options.filter((_, i) => i !== t.answer).map((o) => o.length));
    assert.ok(!(ok > mx * 1.3 && ok - mx > 6), `«${t.options[t.answer]}» stands out in «${t.q}»`);
  }
});

test('cultura-asturiana: own task types are well formed (feed, cook, wordsearch, clues, calendar, cascayu)', () => {
  const { content: u } = bootCultura();
  for (const s of u.stations) {
    for (const [i, t] of s.tasks.entries()) {
      const w = `${s.id} #${i + 1} (${t.type})`;
      if (t.type === 'feed') {
        assert.ok(['gochu', 'vaca', 'cesta', 'fardo', 'bolsa', 'tripa'].includes(t.who), `${w}: who «${t.who}»`);
        assert.ok(t.items.length >= 4 && t.items.length <= 9, `${w}: ${t.items.length} items`);
        assert.ok(t.items.some((x) => x.ok === true) && t.items.some((x) => x.ok === false), `${w}: right and wrong items`);
        assert.equal(new Set(t.items.map((x) => x.text)).size, t.items.length, `${w}: repeated item`);
      }
      if (t.type === 'cook') {
        assert.ok(t.steps.length >= 3 && t.steps.length <= 8, `${w}: ${t.steps.length} steps`);
        const all = [...t.steps, ...(t.extra ?? [])].map((x) => x.text);
        assert.equal(new Set(all).size, all.length, `${w}: repeated tile text`);
      }
      if (t.type === 'clues') {
        assert.ok(t.clues.length >= 2 && t.clues.length <= 4, `${w}: ${t.clues.length} clues`);
        assert.ok(Number.isInteger(t.answer) && t.answer >= 0 && t.answer < t.options.length, `${w}: answer`);
        assert.equal(new Set(t.options).size, t.options.length, `${w}: repeated option`);
        if (t.pics) assert.equal(t.labels?.length, t.options.length, `${w}: one label per picture`);
      }
      if (t.type === 'calendar') {
        for (const m of t.months) assert.ok(MONTHS.includes(m), `${w}: month «${m}»`);
        for (const it of t.items) assert.ok(t.months.includes(it.month), `${w}: «${it.text}» → «${it.month}»`);
        for (const m of t.months)
          assert.ok(
            t.items.some((it) => it.month === m),
            `${w}: «${m}» gets nothing`,
          );
      }
      if (t.type === 'cascayu') {
        assert.ok(t.steps.length >= 3 && t.steps.length <= 5, `${w}: ${t.steps.length} steps`);
        assert.ok(
          t.steps.every((x) => typeof x.truth === 'boolean' && x.text.trim()),
          `${w}: step shape`,
        );
        assert.ok(t.steps.some((x) => !x.truth) && t.steps.some((x) => x.truth), `${w}: both answers`);
      }
      if (t.type === 'wordsearch') {
        const rows = t.rows.map((r) => [...r]);
        const width = rows[0].length;
        assert.ok(
          rows.every((r) => r.length === width && r.every((c) => /^[A-ZÑ]$/.test(c))),
          `${w}: grid`,
        );
        assert.ok(width <= 10 && rows.length <= 8, `${w}: ${width}×${rows.length} is too big for a phone`);
        const lines = [...rows.map((r) => r.join('')), ...[...Array(width).keys()].map((c) => rows.map((r) => r[c]).join(''))];
        for (const word of t.words) {
          const hits = lines.reduce((n, l) => n + l.split(word).length - 1, 0);
          assert.equal(hits, 1, `${w}: «${word}» is in the grid ${hits} times (left→right or top→bottom)`);
        }
      }
    }
  }
});

test('cultura-asturiana: every reading paragraph has a clip in shared/audio.js', () => {
  const { content: u } = bootCultura();
  const audio = { window: {} };
  vm.createContext(audio);
  vm.runInContext(read('shared/audio.js'), audio);
  const es = new Set(audio.window.KF_AUDIO?.es ?? audio.KF_AUDIO.es);
  const texts = u.stations.flatMap((s) => s.text?.paragraphs ?? []);
  assert.ok(texts.length >= 30);
  for (const t of texts) {
    const slug = buildSlug(t);
    assert.ok(es.has(slug), `no clip for «${t.slice(0, 50)}…» (${slug}): run scripts/build-audio.mjs`);
  }
});

test('cultura-asturiana: valid with the renderers; CA_CHECK passes; every art key and label scene exists', () => {
  const { E, content: u, types, art, check } = bootCultura();
  assert.deepEqual(Object.keys(types).sort(), CA_OWN);
  assert.deepEqual([...E.validate(clone(u), { ...E.types, ...types })], []);
  assert.deepEqual([...check(clone(u), art)], []);
  const tasks = u.stations.flatMap((s) => s.tasks);
  const keys = new Set();
  for (const t of tasks) {
    if (t.art) keys.add(t.art);
    if (t.pics) for (const o of t.options) keys.add(o);
    for (const it of [...(t.items ?? []), ...(t.steps ?? []), ...(t.extra ?? [])]) if (it?.art) keys.add(it.art);
    if (t.type === 'feed') keys.add(`t-${t.who}`);
  }
  for (const k of keys) assert.ok(art.has(k), `art «${k}» does not exist`);
  assert.ok(!art.has('nope'));
  for (const t of tasks.filter((x) => x.type === 'label')) {
    const sc = art.scene(t.scene);
    assert.ok(sc, `scene «${t.scene}» does not exist`);
    const spots = new Set(sc.spots.map((p) => p.id));
    assert.equal(spots.size, sc.spots.length, `${t.scene}: duplicate hotspots`);
    for (const l of t.labels) assert.ok(spots.has(l.id), `${t.scene}: no hotspot «${l.id}»`);
  }
  assert.deepEqual([...art.scene('caseria').spots.map((p) => p.id)].sort(), ['cuadra', 'guerta', 'llagar', 'maizal', 'panera', 'piteru']);
  assert.deepEqual([...art.scene('gaita').spots.map((p) => p.id)].sort(), ['fuelle', 'puntero', 'roncon', 'soplete']);
  // CA_CHECK catches a broken task of an own type
  const bad = clone(u);
  bad.stations[0].tasks.find((t) => t.type === 'feed').who = 'saco';
  assert.ok(check(bad, art).length > 0);
});

// ---------- lengua-poemas: «La liga de las palabras», Lengua Castellana 3.º, Tema 3 ----------
// Expected values from the unit contract (stations, counts, exam settings) and the book (.pi/book-le/unit3.md: rules and the pronoun table).

const bootPoemas = () => {
  const node = () => ({ attrs: {}, dataset: {}, style: {}, setAttribute() {}, append() {}, set innerHTML(_) {}, classList: { add() {} } });
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key, gameData: () => ({}) },
    KFG: { shuffle: (a) => [...a], canSay: () => false },
    document: { createElementNS: node, createElement: node },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of [
    'shared/exam/exam.js',
    'shared/exam/types.js',
    'games/lengua-mundo/types.js',
    'games/lengua-poemas/content.js',
    'games/lengua-poemas/art.js',
    'games/lengua-poemas/types.js',
  ]) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  return {
    E: sb.KFExam,
    content: clone(sb.LP_CONTENT),
    types: { fix: sb.LE_TYPES.fix, ...sb.LP_TYPES },
    art: sb.LPArt,
    check: (u, a) => [...sb.LP_CHECK(u, a)],
  };
};
const LP_STATIONS = [
  ['derivadas', 12],
  ['verbos-b', 12],
  ['bv', 10],
  ['pronombres', 14],
  ['literatura', 8],
  ['trabalenguas', 8],
  ['czs', 8],
  ['puntos', 8],
];
const LP_OWN = ['forge', 'save', 'substitute'];
const words = (s) => s.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length;

test('lengua-poemas: valid; stations, task counts and unit settings as agreed (exam of 14, red after 4, sendOff, VAR at 2, practice at 0.5)', () => {
  const { E, content: u } = bootPoemas();
  assert.deepEqual([...E.validate(clone(u))], []);
  assert.equal(u.slug, 'lengua-poemas');
  assert.equal(u.testHook, '__lp');
  assert.deepEqual(
    u.stations.map((s) => [s.id, s.tasks.length]),
    LP_STATIONS,
  );
  assert.equal(u.readFirst, false);
  assert.equal(u.round, 6);
  assert.equal(u.practiceCoin, 0.5);
  assert.deepEqual(
    { ...u.exam.perStation },
    { derivadas: 2, 'verbos-b': 2, bv: 2, pronombres: 2, literatura: 2, trabalenguas: 1, czs: 2, puntos: 1 },
  );
  assert.equal(
    Object.values(u.exam.perStation).reduce((a, b) => a + b, 0),
    14,
  );
  assert.equal(u.exam.redAfter, 4);
  assert.equal(u.exam.sendOff, true);
  assert.equal(u.exam.var, 2);
  const used = new Set(u.stations.flatMap((s) => s.tasks.map((t) => t.type)));
  for (const k of [...LP_OWN, 'fix']) assert.ok(used.has(k), `no ${k} task`);
  // the new multi-step types: at most 2 of each in a practice round
  for (const k of LP_OWN) assert.ok(u.sampling?.caps?.[k] >= 1 && u.sampling.caps[k] <= 2, `sampling.caps.${k} = ${u.sampling?.caps?.[k]}`);
  for (const k of [...Object.keys(u.sampling.caps ?? {}), ...Object.keys(u.sampling.examCaps ?? {}), ...(u.sampling.always ?? [])])
    assert.ok(used.has(k), `sampling names «${k}»`);
});

test('lengua-poemas: every station has a uk glossary and a short rule note (20–35 words) as its text', () => {
  const { content: u } = bootPoemas();
  for (const s of u.stations) {
    assert.ok(s.vocab?.length >= 1, `${s.id}: glossary`);
    for (const [es, uk] of s.vocab) {
      assert.ok(!CYR.test(es), `${s.id}: Spanish term «${es}» has Cyrillic`);
      assert.ok(CYR.test(uk), `${s.id}: «${es}» has no Ukrainian translation («${uk}»)`);
    }
    assert.ok(s.text?.paragraphs?.length >= 1, `${s.id}: rule note`);
    const n = words(s.text.paragraphs.join(' '));
    assert.ok(n >= 20 && n <= 35, `${s.id}: the rule note has ${n} words`);
  }
});

test('lengua-poemas: Cyrillic nowhere outside the glossaries (Spanish UI on both sites)', () => {
  const { content: u } = bootPoemas();
  const noVocab = { ...u, stations: u.stations.map(({ vocab, ...s }) => s) };
  assert.ok(!CYR.test(JSON.stringify(noVocab)), 'Cyrillic outside the glossaries');
});

test('lengua-poemas: the right option of a text choice is not clearly the longest', () => {
  const { content: u } = bootPoemas();
  for (const t of u.stations.flatMap((s) => s.tasks)) {
    if (t.type !== 'choice' || t.pics) continue;
    const ok = t.options[t.answer].length;
    const mx = Math.max(...t.options.filter((_, i) => i !== t.answer).map((o) => o.length));
    assert.ok(!(ok > mx * 1.3 && ok - mx > 6), `«${t.options[t.answer]}» stands out in «${t.q}»`);
  }
});

test('lengua-poemas: valid with the renderers; LP_CHECK passes with and without the art; art keys exist', () => {
  const { E, content: u, types, art, check } = bootPoemas();
  assert.deepEqual([...E.validate(clone(u), { ...E.types, ...types })], []);
  assert.deepEqual(check(clone(u)), []);
  assert.deepEqual(check(clone(u), art), []);
  for (const t of u.stations.flatMap((s) => s.tasks)) if (t.art) assert.ok(art.has(t.art), `art «${t.art}» does not exist`);
  assert.equal(typeof art.hero, 'function');
});

test('lengua-poemas: every station text paragraph and every listen sentence has a clip in shared/audio.js', () => {
  const { content: u } = bootPoemas();
  const audio = { window: {} };
  vm.createContext(audio);
  vm.runInContext(read('shared/audio.js'), audio);
  const es = new Set(audio.window.KF_AUDIO?.es ?? audio.KF_AUDIO.es);
  const texts = [
    ...u.stations.flatMap((s) => s.text?.paragraphs ?? []),
    ...u.stations.flatMap((s) => s.tasks.map((t) => t.listen).filter(Boolean)),
  ];
  assert.ok(texts.length >= 8);
  for (const t of texts) {
    const slug = buildSlug(t);
    assert.ok(es.has(slug), `no clip for «${t.slice(0, 50)}…» (${slug}): run scripts/build-audio.mjs`);
  }
});

// What the unit must teach (the book's rules, PDF 48 / 55 / 49): the answers of the content, not its wording.
const lpTasks = (u) => u.stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id })));
const saveWords = (u, rule) => lpTasks(u).filter((t) => t.type === 'save' && (!rule || t.rule === rule));

// Words a task asks for (its right answers): save words and the answers of the generic types (answersOf below).
const taught = (u) => [...saveWords(u).map((t) => t.word), ...lpTasks(u).flatMap((t) => answersOf(t))].map((w) => String(w).toLowerCase());

test('lengua-poemas: b/v coverage — the five -aba endings, -bir, hervir / servir / vivir are asked; br and bl as save gaps', () => {
  const { content: u } = bootPoemas();
  // a sort card or a pick word may show the b/v as a gap: «her_ir», «canta_an» (the -aba endings: with the b filled in)
  const all = taught(u)
    .flatMap((w) => w.split(/[^\p{L}_]+/u))
    .filter(Boolean)
    .flatMap((w) => (w.includes('_') ? [w, w.replace(/_/g, 'b')] : [w]));
  for (const end of ['aba', 'abas', 'ábamos', 'abais', 'aban'])
    assert.ok(
      all.some((w) => w.endsWith(end) && w.length > end.length + 1),
      `no -${end} verb among the answers`,
    );
  // a save task with the rule «aba» has its gap on that b
  for (const t of saveWords(u, 'aba')) {
    const b = t.word.search(/(aba|ába)(s|mos|is|n)?$/) + 1;
    assert.ok(t.gaps.includes(b), `${t.word}: the -aba b is not a gap`);
  }
  assert.ok(saveWords(u, 'aba').length >= 2, 'fewer than 2 save tasks with the rule «aba»');
  assert.ok(saveWords(u, 'bir').length >= 1, 'no save task with the rule «bir»');
  assert.ok(saveWords(u, 'exc').length >= 1, 'no save task with the rule «exc»');
  for (const [verb, re] of [
    ['hervir', /^h(i)?er[v_]/],
    ['servir', /^s(i|e)r[v_]/],
    ['vivir', /^vi[v_]/],
  ])
    assert.ok(
      all.some((w) => re.test(w)),
      `no «${verb}» form among the answers`,
    );
  for (const t of saveWords(u, 'exc'))
    assert.ok(
      t.gaps.some((g) => t.word[g] === 'v'),
      `${t.word}: no v gap`,
    );
  const brbl = saveWords(u, 'brbl');
  for (const pair of ['br', 'bl'])
    assert.ok(
      brbl.some((t) => t.gaps.some((g) => t.word.slice(g, g + 2) === pair)),
      `no save task with a gap on «${pair}»`,
    );
});

// The book's table (PDF 49): Yo · Tú, Usted · Él, Ella · Nosotros/Nosotras · Vosotros/Vosotras, Ustedes · Ellos/Ellas.
const PRONOUNS = ['yo', 'tú', 'usted', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ustedes', 'ellos', 'ellas'];
const answersOf = (t) => {
  if (t.type === 'substitute') return [t.answer];
  if (t.type === 'choice' && !t.pics) return [t.options[t.answer]];
  if (t.type === 'fill') return [t.answer];
  if (t.type === 'pick') return [...t.text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
  if (t.type === 'pairs') return t.pairs.flat();
  if (t.type === 'sort') return t.items.map((it) => it.text);
  return [];
};

test('lengua-poemas: every pronoun of the book table is an answer somewhere (substitute, choice, fill, pick, pairs, sort)', () => {
  const { content: u } = bootPoemas();
  const got = new Set(
    lpTasks(u)
      .flatMap(answersOf)
      .map((a) => String(a).toLowerCase().trim()),
  );
  const missing = PRONOUNS.filter((p) => !got.has(p));
  assert.deepEqual(missing, []);
  // and the substitute tasks alone ask at least 5 different ones
  const sub = new Set(
    lpTasks(u)
      .filter((t) => t.type === 'substitute')
      .map((t) => t.answer.toLowerCase()),
  );
  assert.ok(sub.size >= 5, `substitute asks only ${[...sub].join(', ')}`);
});

test('lengua-poemas: own types are playable as authored (one stem+suffix pair makes the word; result starts with a capital and has the pronoun)', () => {
  const { content: u } = bootPoemas();
  for (const t of lpTasks(u)) {
    const w = `${t.station}: ${t.q}`;
    if (t.type === 'forge') {
      const makes = t.stems.flatMap((s) => t.suffixes.map((x) => [s, x])).filter(([s, x]) => s + x === t.word);
      assert.deepEqual(makes, [t.answer], `${w}: pairs that make «${t.word}»`);
    }
    if (t.type === 'save') {
      assert.ok(t.reasons.length >= 2 && t.reasons.length <= 3, `${w}: reasons`);
      if (t.ctx) assert.equal(t.ctx.length, 2, `${w}: ctx`);
    }
    if (t.type === 'substitute') {
      assert.ok(t.options.length >= 3 && t.options.length <= 4, `${w}: options`);
      assert.ok(/^[¿¡]?\p{Lu}/u.test(t.result), `${w}: result «${t.result}» starts with a capital`);
      assert.ok(t.result.toLowerCase().includes(t.answer.toLowerCase()), `${w}: result has «${t.answer}»`);
      assert.ok(!t.result.includes(t.chunks[t.target].replace(/[.,;:!?]+$/, '')), `${w}: result still has the replaced phrase`);
    }
  }
});

// LP_CHECK on a small valid unit, one thing broken at a time (rules from the contract).
const lpUnit = () => ({
  slug: 'lp-demo',
  title: 'Demo',
  stations: [
    {
      id: 'a',
      title: 'A',
      icon: '⚽',
      intro: 'A',
      tasks: [
        { type: 'forge', q: 'Vende pan', stems: ['pan', 'panad'], suffixes: ['ero', 'ista'], answer: ['panad', 'ero'], word: 'panadero' },
        {
          type: 'save',
          q: 'B o V',
          word: 'jugaba',
          gaps: [4],
          ctx: ['Ayer', 'al fútbol.'],
          reasons: ['aba', 'bir', 'memo'],
          rule: 'aba',
        },
        {
          type: 'substitute',
          q: 'Cambia',
          chunks: ['Celia y Olivia', 'juegan en el patio.'],
          target: 0,
          options: ['Ellas', 'Ellos', 'Vosotras'],
          answer: 'Ellas',
          result: 'Ellas juegan en el patio.',
        },
      ],
    },
  ],
  exam: { perStation: { a: 1 } },
});
const LP_BROKEN = [
  // forge
  ['forge answer stem not in stems', (t) => Object.assign(t[0], { answer: ['pa', 'ero'], word: 'paero' })],
  ['forge answer suffix not in suffixes', (t) => Object.assign(t[0], { answer: ['panad', 'eros'], word: 'panaderos' })],
  ['forge stem + suffix is not the word', (t) => (t[0].word = 'panadera')],
  ['forge with repeated stems', (t) => (t[0].stems = ['pan', 'pan', 'panad'])],
  ['forge with repeated suffixes', (t) => (t[0].suffixes = ['ero', 'ista', 'ista'])],
  ['forge with an empty stem', (t) => (t[0].stems = ['panad', ''])],
  ['forge with one stem', (t) => (t[0].stems = ['panad'])],
  ['forge with five suffixes', (t) => (t[0].suffixes = ['ero', 'ista', 'era', 'or', 'ora'])],
  ['forge without a word', (t) => (t[0].word = '')],
  // save
  ['save gap out of the word', (t) => (t[1].gaps = [6])],
  ['save gap below 0', (t) => (t[1].gaps = [-1])],
  ['save repeated gaps', (t) => (t[1].gaps = [4, 4])],
  ['save gap on a letter that is not b / v', (t) => (t[1].gaps = [0])],
  ['save rule not in reasons', (t) => (t[1].rule = 'brbl')],
  ['save reason that is not a rule id', (t) => (t[1].reasons = ['aba', 'ojo'])],
  ['save repeated reasons', (t) => (t[1].reasons = ['aba', 'aba'])],
  ['save with one reason', (t) => (t[1].reasons = ['aba'])],
  // substitute
  ['substitute target out of range', (t) => (t[2].target = 2)],
  ['substitute target below 0', (t) => (t[2].target = -1)],
  ['substitute answer not in options', (t) => Object.assign(t[2], { answer: 'Nosotras', result: 'Nosotras juegan en el patio.' })],
  ['substitute repeated options', (t) => (t[2].options = ['Ellas', 'Ellas', 'Ellos'])],
  ['substitute empty result', (t) => (t[2].result = '')],
  ['substitute with Cyrillic in an option', (t) => (t[2].options = ['Ellas', 'Ellos', 'Вони'])],
  ['substitute with Cyrillic in the result', (t) => (t[2].result = 'Ellas грають.')],
  ['substitute with two options', (t) => (t[2].options = ['Ellas', 'Ellos'])],
];

test('LP_CHECK: the small valid unit passes', () => {
  const { check } = bootPoemas();
  assert.deepEqual(check(lpUnit()), []);
});

for (const [name, mutate] of LP_BROKEN) {
  test(`LP_CHECK catches: ${name}`, () => {
    const { check } = bootPoemas();
    const u = lpUnit();
    mutate(u.stations[0].tasks);
    const errs = check(u);
    assert.ok(errs.length > 0, 'no errors reported');
    // the error names the broken task
    const i = name.startsWith('forge') ? 1 : name.startsWith('save') ? 2 : 3;
    assert.ok(
      errs.some((e) => e.includes(`task ${i}`)),
      `error not about task ${i}: ${JSON.stringify(errs)}`,
    );
  });
}

// ---------- sociales-clima: «La vuelta al mundo en globo», Ciencias Sociales 3.º, Tema 2 ----------
// Expected values from the plan (.pi/plan-sociales-clima.md: stations, exam settings, type contracts, theme strings) and the book
// (.pi/book-cs/unit2.md: the exam topics map, the p. 34 table, the climates of p. 39).

const bootClima = () => {
  const node = () => ({ attrs: {}, dataset: {}, style: {}, setAttribute() {}, append() {}, set innerHTML(_) {}, classList: { add() {} } });
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key, gameData: () => ({}) },
    KFG: { shuffle: (a) => [...a], canSay: () => false },
    document: { createElementNS: node, createElement: node },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of [
    'shared/exam/exam.js',
    'shared/exam/types.js',
    'games/sociales-planeta/maps.js',
    'games/sociales-clima/content.js',
    'games/sociales-clima/art.js',
    'games/sociales-clima/types.js',
  ]) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  return {
    E: sb.KFExam,
    content: clone(sb.SC_CONTENT),
    raw: sb.SC_CONTENT,
    types: sb.SC_TYPES,
    art: sb.SCArt,
    check: (u, a) => [...sb.SC_CHECK(u, a)],
  };
};
const SC_STATIONS = ['tiempo', 'parte', 'factores', 'zonas', 'paisajes', 'climograma', 'forma', 'espana'];
const SC_OWN = ['spainMap', 'climograma', 'spot'];
const scTasks = (u) => u.stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id })));

test('sociales-clima: valid; stations, exam of 15 (parte 1, the rest 2), red after 4, sendOff, VAR at 2, practice at 0.5, own types always', () => {
  const { E, content: u } = bootClima();
  assert.deepEqual([...E.validate(clone(u))], []);
  assert.equal(u.slug, 'sociales-clima');
  assert.equal(u.testHook, '__sc');
  assert.deepEqual(
    u.stations.map((s) => s.id),
    SC_STATIONS,
  );
  // ~10 tasks per station, ≈80 in all
  for (const s of u.stations) assert.ok(s.tasks.length >= 8 && s.tasks.length <= 12, `${s.id}: ${s.tasks.length} tasks`);
  const total = u.stations.reduce((a, s) => a + s.tasks.length, 0);
  assert.ok(total >= 75 && total <= 90, `${total} tasks`);
  assert.equal(u.readFirst, false);
  assert.equal(u.round, 6);
  assert.equal(u.practiceCoin, 0.5);
  assert.deepEqual(
    { ...u.exam.perStation },
    { tiempo: 2, parte: 1, factores: 2, zonas: 2, paisajes: 2, climograma: 2, forma: 2, espana: 2 },
  );
  assert.equal(
    Object.values(u.exam.perStation).reduce((a, b) => a + b, 0),
    15,
  );
  assert.equal(u.exam.redAfter, 4);
  assert.equal(u.exam.sendOff, true);
  assert.equal(u.exam.var, 2);
  assert.deepEqual([...u.sampling.always].sort(), [...SC_OWN].sort());
  for (const k of SC_OWN) {
    assert.ok(u.sampling.caps?.[k] >= 1 && u.sampling.caps[k] <= 2, `sampling.caps.${k} = ${u.sampling.caps?.[k]}`);
    assert.equal(u.sampling.examCaps?.[k], 1, `sampling.examCaps.${k}`);
  }
  const used = new Set(scTasks(u).map((t) => t.type));
  for (const k of [...SC_OWN, 'label']) assert.ok(used.has(k), `no ${k} task`);
  for (const k of [...Object.keys(u.sampling.caps ?? {}), ...Object.keys(u.sampling.examCaps ?? {}), ...(u.sampling.always ?? [])])
    assert.ok(used.has(k), `sampling names «${k}»`);
  // the weather maps carry the forecast as listen (2–3 tasks)
  const listens = scTasks(u).filter((t) => t.type === 'spainMap' && t.mode === 'weather' && t.listen);
  assert.ok(listens.length >= 2 && listens.length <= 3, `${listens.length} weather maps with listen`);
  // the station «parte» is the weather map; «espana» has the climate map
  assert.ok(u.stations[1].tasks.some((t) => t.type === 'spainMap' && t.mode === 'weather'));
  assert.ok(u.stations[7].tasks.some((t) => t.type === 'spainMap' && t.mode === 'climate'));
});

test('sociales-clima: every station has a uk glossary of 7–8 pairs and a short rule note (25–35 words) as its text', () => {
  const { content: u } = bootClima();
  for (const s of u.stations) {
    assert.ok(s.vocab?.length >= 7 && s.vocab.length <= 8, `${s.id}: ${s.vocab?.length} glossary pairs`);
    for (const [es, uk] of s.vocab) {
      assert.ok(!CYR.test(es), `${s.id}: Spanish term «${es}» has Cyrillic`);
      assert.ok(CYR.test(uk), `${s.id}: «${es}» has no Ukrainian translation («${uk}»)`);
    }
    assert.ok(s.text?.paragraphs?.length >= 1, `${s.id}: rule note`);
    const n = words(s.text.paragraphs.join(' '));
    assert.ok(n >= 25 && n <= 35, `${s.id}: the rule note has ${n} words`);
  }
});

test('sociales-clima: Cyrillic nowhere outside the glossaries; the right option of a text choice is not clearly the longest', () => {
  const { content: u } = bootClima();
  const noVocab = { ...u, stations: u.stations.map(({ vocab, ...s }) => s) };
  assert.ok(!CYR.test(JSON.stringify(noVocab)), 'Cyrillic outside the glossaries');
  for (const t of scTasks(u)) {
    if (t.type !== 'choice' || t.pics) continue;
    const ok = t.options[t.answer].length;
    const mx = Math.max(...t.options.filter((_, i) => i !== t.answer).map((o) => o.length));
    assert.ok(!(ok > mx * 1.3 && ok - mx > 6), `«${t.options[t.answer]}» stands out in «${t.q}»`);
  }
});

test('sociales-clima: valid with the renderers; SC_CHECK passes with and without the art; art keys and scenes exist', () => {
  const { E, content: u, types, art, check } = bootClima();
  assert.deepEqual(Object.keys(types).sort(), ['climograma', 'spainMap', 'spot']);
  assert.deepEqual([...E.validate(clone(u), { ...E.types, ...types })], []);
  assert.deepEqual(check(clone(u)), []);
  assert.deepEqual(check(clone(u), art), []);
  for (const t of scTasks(u)) {
    if (t.art) assert.ok(art.has(t.art), `art «${t.art}» does not exist`);
    if (t.type === 'choice' && t.pics) for (const k of t.options) assert.ok(art.has(k), `picture «${k}» does not exist`);
  }
  assert.equal(typeof art.hero, 'function');
  // the label scenes of the plan: the globe with its 5 lines + 3 zones, the relief of book p. 37 with its 9 forms
  assert.deepEqual([...art.scene('globo').spots.map((p) => p.id)].sort(), [
    'antartico',
    'artico',
    'calida',
    'cancer',
    'capricornio',
    'ecuador',
    'fria',
    'templada',
  ]);
  assert.deepEqual([...art.scene('relieve').spots.map((p) => p.id)].sort(), [
    'acantilado',
    'cabo',
    'golfo',
    'isla',
    'llanura',
    'meseta',
    'montana',
    'playa',
    'valle',
  ]);
  // spot scenes: what people made and what is natural, as in the plan
  const human = (name) =>
    [...art.spotItems(name)]
      .filter((i) => i.human)
      .map((i) => i.id)
      .sort();
  assert.deepEqual(human('valle'), ['carretera', 'cultivos', 'pueblo', 'puente', 'torre-electrica']);
  assert.deepEqual(human('costa'), ['barcos', 'faro', 'hotel', 'puerto']);
  assert.deepEqual(human('llanura'), ['carretera', 'cultivos', 'granja']);
});

test('sociales-clima: every station text paragraph and every listen sentence has a clip in shared/audio.js', () => {
  const { content: u } = bootClima();
  const audio = { window: {} };
  vm.createContext(audio);
  vm.runInContext(read('shared/audio.js'), audio);
  const es = new Set(audio.window.KF_AUDIO?.es ?? audio.KF_AUDIO.es);
  const texts = [
    ...u.stations.flatMap((s) => s.text?.paragraphs ?? []),
    ...scTasks(u)
      .map((t) => t.listen)
      .filter(Boolean),
  ];
  assert.ok(texts.length >= 10);
  for (const t of texts) {
    const slug = buildSlug(t);
    assert.ok(es.has(slug), `no clip for «${t.slice(0, 50)}…» (${slug}): run scripts/build-audio.mjs`);
  }
});

// What a task states as true: the q with its right answer, a true statement, the fix of a false one, the pairs, sort items with their bin.
const scTruths = (u) =>
  scTasks(u).flatMap((t) => {
    if (t.type === 'choice') return [`${t.q} ${t.pics ? t.labels?.[t.answer] || t.options[t.answer] : t.options[t.answer]}`];
    if (t.type === 'tf') return [t.truth ? t.q : t.fix || ''];
    if (t.type === 'pairs') return t.pairs.map((p) => p.join(' = '));
    if (t.type === 'sort') return t.items.map((it) => `${it.text} = ${t.bins.find((b) => b.id === it.bin).label}`);
    if (t.type === 'fill') return [t.text.replace('___', t.answer)];
    return [];
  });
const sortBinOf = (u, re) =>
  scTasks(u)
    .filter((t) => t.type === 'sort')
    .flatMap((t) => t.items.filter((it) => re.test(it.text)).map((it) => it.bin));
const labelSpots = (u, scene) =>
  new Set(
    scTasks(u)
      .filter((t) => t.type === 'label' && t.scene === scene)
      .flatMap((t) => t.labels.map((l) => l.id)),
  );
const said = (u, re) => scTruths(u).some((s) => re.test(s));

test('sociales-clima: exam-critical facts are asked — cabo vs golfo (and the swap trap), valle, meseta, sierra', () => {
  const { content: u } = bootClima();
  assert.ok(
    said(u, /golfo.*(mar|agua).*(entra|entrante).*tierra|(mar|agua) (que )?entra en la tierra.*golfo/i),
    'golfo = mar en la tierra',
  );
  assert.ok(said(u, /cabo.*tierra.*(entra|entrante).*mar|tierra (que )?entra en el mar/i), 'cabo = tierra en el mar');
  // the classic swap as a false statement
  assert.ok(
    scTasks(u).some((t) => t.type === 'tf' && t.truth === false && /cabo/i.test(t.q) && /mar en la tierra/i.test(t.q)),
    'no tf trap «un cabo es un entrante del mar en la tierra» (false)',
  );
  assert.ok(said(u, /valle.*llanura entre montañas/i), 'valle = llanura entre montañas');
  assert.ok(said(u, /meseta.*llanura elevada/i), 'meseta = llanura elevada');
  assert.ok(said(u, /sierra.*muchas montañas/i), 'sierra = muchas montañas juntas');
  // the relief scene asks all nine forms of book p. 37 (interior and costa)
  assert.deepEqual([...labelSpots(u, 'relieve')].sort(), [
    'acantilado',
    'cabo',
    'golfo',
    'isla',
    'llanura',
    'meseta',
    'montana',
    'playa',
    'valle',
  ]);
  // costa / interior: cabo and golfo are costa, valle and meseta interior
  assert.deepEqual([...new Set(sortBinOf(u, /^(cabo|golfo)$/))], ['costa']);
  assert.deepEqual([...new Set(sortBinOf(u, /^(valle|meseta)$/))], ['interior']);
});

test('sociales-clima: the four factors of the climate, each with its effect (book p. 31)', () => {
  const { content: u } = bootClima();
  assert.ok(said(u, /altitud.*(frío|alto, más frío)/i), 'altitud: más alto, más frío');
  assert.ok(said(u, /relieve.*viento|montañas.*(barreras|frenan).*viento/i), 'relieve: montañas = barrera para el viento');
  assert.ok(said(u, /mar.*suave/i), 'distancia al mar: junto al mar, clima suave');
  assert.ok(said(u, /polos.*frío/i), 'distancia a los polos: más cerca, más frío');
  const pairs = scTasks(u).find(
    (t) => t.type === 'pairs' && t.pairs.length === 4 && t.pairs.every((p) => /altitud|relieve|mar|polos/.test(p[0])),
  );
  assert.ok(pairs, 'a pairs task with the four factors');
  assert.deepEqual(pairs.pairs.map((p) => p[0].replace(/^(la|el) /, '')).sort(), [
    'altitud',
    'distancia a los polos',
    'distancia al mar',
    'relieve',
  ]);
});

test('sociales-clima: three zones between the imaginary lines; Cáncer N, Capricornio S, Ártico N, Antártico S', () => {
  const { content: u } = bootClima();
  assert.deepEqual([...labelSpots(u, 'globo')].sort(), [
    'antartico',
    'artico',
    'calida',
    'cancer',
    'capricornio',
    'ecuador',
    'fria',
    'templada',
  ]);
  assert.ok(
    said(u, /tres/i) && scTasks(u).some((t) => t.type === 'choice' && /cuántas zonas/i.test(t.q) && t.options[t.answer] === 'tres'),
  );
  assert.ok(said(u, /Cáncer.*norte/i), 'Cáncer al norte');
  assert.ok(said(u, /Capricornio.*sur/i), 'Capricornio al sur');
  assert.ok(said(u, /ártico.*norte/i), 'Ártico al norte');
  assert.ok(said(u, /antártico.*sur/i), 'Antártico al sur');
  assert.ok(said(u, /cálid.*entre.*ecuador.*trópicos|ecuador y los trópicos/i), 'cálida entre el ecuador y los trópicos');
  assert.ok(said(u, /dentro de los círculos polares.*fría|fría.*dentro de los círculos polares/i), 'fría dentro de los círculos polares');
  assert.ok(said(u, /redonda/i), 'why: la Tierra es redonda, rayos desiguales');
  // the zone sort: places between the lines go to the book's zone
  assert.deepEqual([...new Set(sortBinOf(u, /^Entre el ecuador|ecuador$/))], ['calida']);
  assert.deepEqual([...new Set(sortBinOf(u, /^Dentro del círculo polar/))], ['fria']);
  assert.deepEqual([...new Set(sortBinOf(u, /^Entre .*(trópico .* círculo|círculo .* trópico)/))], ['templada']);
});

test('sociales-clima: the six landscapes go to their zone, with the book plants; mediterráneo keeps its leaves', () => {
  const { content: u } = bootClima();
  for (const [re, zone] of [
    [/^taiga$/, 'fria'],
    [/^tundra$/, 'fria'],
    [/^bosque mediterráneo$/, 'templada'],
    [/^bosque (frondoso|atlántico)$/, 'templada'],
    [/^selva$/, 'calida'],
    [/^sabana$/, 'calida'],
  ])
    assert.deepEqual([...new Set(sortBinOf(u, re))], [zone], `${re}`);
  assert.ok(said(u, /taiga.*conífera/i), 'taiga = coníferas');
  assert.ok(said(u, /tundra.*arbustos y musgo/i), 'tundra = arbustos y musgo');
  assert.ok(said(u, /mediterráneo.*pinos y encinas/i), 'mediterráneo = pinos y encinas');
  assert.ok(said(u, /frondoso.*hayas y castaños/i), 'frondoso = hayas y castaños');
  assert.ok(said(u, /mediterráneo siempre tienen hojas|mediterráneo.*hoja perenne/i), 'mediterráneo: siempre tiene hojas');
  assert.ok(said(u, /selva.*(lluviosas|llueve mucho)|llueve menos que en la selva.*sabana/i), 'selva más lluvia que sabana');
});

// Book p. 39 + the plan's defensible regions: the climate of each region the map may ask.
const BOOK_CLIMATE = {
  galicia: 'oceanico',
  asturias: 'oceanico',
  cantabria: 'oceanico',
  'pais-vasco': 'oceanico',
  'castilla-y-leon': 'mediterraneo-interior',
  madrid: 'mediterraneo-interior',
  'castilla-la-mancha': 'mediterraneo-interior',
  extremadura: 'mediterraneo-interior',
  cataluna: 'mediterraneo-litoral',
  valencia: 'mediterraneo-litoral',
  murcia: 'mediterraneo-litoral',
  baleares: 'mediterraneo-litoral',
  canarias: 'subtropical',
};

test('sociales-clima: the four climates on the map of Spain, each region with the book climate; Asturias oceánico; montaña never a token', () => {
  const { content: u } = bootClima();
  const maps = scTasks(u).filter((t) => t.type === 'spainMap' && t.mode === 'climate');
  assert.ok(maps.length >= 2, `${maps.length} climate maps`);
  const tokens = new Set(maps.flatMap((t) => t.tokens.map((x) => x.id)));
  assert.deepEqual([...tokens].sort(), ['mediterraneo-interior', 'mediterraneo-litoral', 'oceanico', 'subtropical']);
  const asked = {};
  for (const t of maps)
    for (const [r, tok] of Object.entries(t.answer)) {
      assert.equal(tok, BOOK_CLIMATE[r], `${r}: ${tok}`);
      asked[r] = tok;
    }
  assert.equal(asked.asturias, 'oceanico');
  assert.equal(asked.canarias, 'subtropical');
  assert.equal(asked.andalucia, undefined);
  // every climate is the answer of some region
  assert.deepEqual([...new Set(Object.values(asked))].sort(), ['mediterraneo-interior', 'mediterraneo-litoral', 'oceanico', 'subtropical']);
  for (const t of scTasks(u).filter((x) => x.type === 'spainMap'))
    for (const x of t.tokens) assert.ok(!/monta/i.test(`${x.id} ${x.label}`));
  // de montaña is asked as text (pairs / choice / tf)
  assert.ok(said(u, /de montaña.*(frío en invierno|verano fresco)/i), 'clima de montaña: frío en invierno, verano fresco');
  assert.ok(
    said(u, /zona templada/i) && said(u, /España.*zona templada|zona templada.*España|España.*templada/i),
    'España en la zona templada',
  );
});

// The region names of the forecasts, and the words that say each weather symbol.
const REGION_NAME = {
  galicia: 'Galicia',
  asturias: 'Asturias',
  cantabria: 'Cantabria',
  'pais-vasco': 'País Vasco',
  navarra: 'Navarra',
  'la-rioja': 'La Rioja',
  aragon: 'Aragón',
  cataluna: 'Cataluña',
  'castilla-y-leon': 'Castilla y León',
  madrid: 'Madrid',
  'castilla-la-mancha': 'Castilla-La Mancha',
  valencia: 'Valencia',
  murcia: 'Murcia',
  extremadura: 'Extremadura',
  andalucia: 'Andalucía',
  baleares: 'Baleares',
  canarias: 'Canarias',
};
const WEATHER_WORD = {
  sol: /\bsol\b/i,
  nubes: /\bnubes?\b/i,
  lluvia: /lluev|lluvia/i,
  nieve: /niev/i,
  tormenta: /tormenta/i,
  niebla: /niebla/i,
};

test('sociales-clima: each weather map answer is what its forecast says (region and symbol in the same sentence)', () => {
  const { content: u } = bootClima();
  const maps = scTasks(u).filter((t) => t.type === 'spainMap' && t.mode === 'weather');
  assert.ok(maps.length >= 2);
  for (const t of maps) {
    assert.equal(t.text, t.listen, 'the forecast read aloud is the one shown');
    const sentences = t.text.split(/\.\s*/).filter(Boolean);
    for (const [region, tok] of Object.entries(t.answer)) {
      const s = sentences.find((x) => x.includes(REGION_NAME[region]));
      assert.ok(s, `«${t.text}» does not name ${REGION_NAME[region]}`);
      assert.ok(WEATHER_WORD[tok].test(s), `«${s}»: ${region} should be ${tok}`);
    }
    // every region the forecast names is asked
    for (const [id, name] of Object.entries(REGION_NAME)) if (t.text.includes(name)) assert.ok(id in t.answer, `${name} named, not asked`);
  }
});

// The book's table (p. 34): never the drawn bars of p. 35. July is the warmest (20 °C), May the rainiest (95 mm).
const BOOK_TEMP = [1, 3, 6, 9, 13, 17, 20, 18, 17, 11, 6, 3];
const BOOK_RAIN = [38, 45, 70, 65, 95, 89, 43, 80, 75, 78, 65, 61];

test('sociales-clima: the climograms of the book use the p. 34 table; line = temperatura, barras = precipitaciones; tiempo vs clima', () => {
  const { content: u } = bootClima();
  const climos = scTasks(u).filter((t) => t.type === 'climograma');
  const book = climos.filter((t) => /libro/i.test(t.place ?? ''));
  assert.ok(book.length >= 1, 'no climogram of the book');
  for (const t of book) {
    assert.deepEqual(t.temp, BOOK_TEMP);
    assert.deepEqual(t.rain, BOOK_RAIN);
  }
  const hottest = book.find((t) => t.mode === 'tapMonth' && /calor/i.test(t.q));
  if (hottest) assert.equal(hottest.answer, 6);
  // a fill task asks a value of the book table: September 75 mm
  const fillBook = book.find((t) => t.mode === 'fillBar');
  if (fillBook) assert.equal(fillBook.rain[fillBook.missing], 75);
  assert.ok(climos.some((t) => t.mode === 'tapMonth') && climos.some((t) => t.mode === 'fillBar'));
  assert.ok(said(u, /línea.*temperatura/i), 'línea = temperatura');
  assert.ok(said(u, /barras.*precipitaciones/i), 'barras = precipitaciones');
  assert.ok(said(u, /temperatura.*°C/) && said(u, /precipitaciones.*mm/), 'units °C and mm');
  // tiempo = momento y lugar; clima = muchos años (~30); meteorólogos vs climatólogos
  assert.ok(said(u, /tiempo atmosférico.*momento.*lugar/i), 'tiempo = momento y lugar');
  assert.ok(said(u, /clima.*(30|muchos) años|30 años/i), 'clima = ~30 años');
  assert.ok(said(u, /meteorólogos = Dicen qué tiempo hará|meteorólogos.*(predic|tiempo que hará)/i), 'meteorólogos predicen el tiempo');
  assert.ok(said(u, /climatólogos.*clima/i), 'climatólogos estudian el clima');
  assert.deepEqual([...new Set(sortBinOf(u, /^(Hoy|Esta tarde|Mañana)/))], ['tiempo']);
  assert.ok(
    scTasks(u).some((t) => t.type === 'tf' && t.truth === false && /tiempo atmosférico/i.test(t.q) && /muchos años|30 años/i.test(t.q)),
    'no tf trap «el tiempo atmosférico … durante muchos años» (false)',
  );
});

// Football words the balloon unit must not show (plan: «No footballs anywhere in this unit»).
const FOOTBALL = /⚽|🟨|🟥|\bgol(es|azo)?\b|partido|árbitro|\bcampo\b|tarjeta|expuls|\bVAR\b/i;
const SAMPLE_ARGS = {
  n: 3,
  red: 4,
  y: 2,
  r: 1,
  grade: 'Bien',
  nota: '7,0',
  score: 1,
  max: 2,
  total: 8,
  title: 'T',
  i: 1,
  a: 'x',
  text: 'x',
  l: 'C',
  item: 'x',
  bin: 'y',
  coins: 3,
  need: 4,
};
const strOf = (v) => (typeof v === 'function' ? v(SAMPLE_ARGS) : String(v));
// The engine's DEFAULT_STRINGS / DEFAULT_LISTS (not exported): read from the source, so a new football default shows up here.
const engineDefaults = (name) => {
  const src = read('shared/exam/exam.js');
  const at = src.indexOf(`const ${name} = {`);
  const body = src.slice(src.indexOf('{', at), src.indexOf('\n  };\n', at) + 4);
  return vm.runInNewContext(`(${body})`);
};

test('sociales-clima: the balloon theme — scoreIcon 🎈 and the plan strings; no football word in unit.strings or lists', () => {
  const { content: u, raw } = bootClima();
  const s = raw.strings;
  assert.equal(s.scoreIcon, '🎈');
  assert.equal(s.goalsLabel, 'Aciertos');
  assert.equal(s.yellow, '¡Una nube!');
  assert.equal(s.red, '¡Tormenta!');
  assert.equal(s.redOff, 'El globo tiene que aterrizar.');
  assert.equal(s.varBtn({ n: 2 }), '📡 Radar: esquivar la tormenta (2 🪙)');
  assert.equal(s.varDone, 'Radar: ¡tormenta esquivada!');
  assert.equal(s.sentOffTitle, '¡Aterrizaje forzoso! ⛈️');
  assert.equal(s.examCards({ y: 2, r: 0 }), 'Nubes: 2 ☁️');
  assert.equal(s.examCards({ y: 3, r: 1 }), 'Nubes: 3 ☁️ · 1 ⛈️');
  assert.equal(s.noCards, '¡Cielo despejado, sin nubes!');
  assert.match(strOf(s.examInfoOff), /☁️/);
  assert.match(strOf(s.examInfoOff), /⛈️/);
  assert.match(strOf(s.examInfoOff), /no hay monedas/);
  for (const [k, v] of Object.entries(s)) assert.ok(!FOOTBALL.test(strOf(v)), `strings.${k}: «${strOf(v)}»`);
  for (const [k, xs] of Object.entries(u.lists ?? {})) for (const x of xs) assert.ok(!FOOTBALL.test(x), `lists.${k}: «${x}»`);
  // and the unit's own text: titles, intros, tasks
  // («un campo de cultivo» is a field of crops, not a pitch: «campo» is left out here)
  const shown = JSON.stringify(u.stations.map(({ vocab, ...st }) => st)) + u.title + u.intro + u.exam.title;
  const hit = shown.match(/⚽|🟨|🟥|\bgol(es|azo)?\b|partido|árbitro|tarjeta|expuls|\bVAR\b/gi);
  assert.equal(hit, null, `football words in the content: ${hit}`);
});

test('sociales-clima: every engine default the player sees with a football word is overridden by the unit', () => {
  const { raw } = bootClima();
  const defaults = engineDefaults('DEFAULT_STRINGS');
  assert.equal(defaults.scoreIcon, '⚽', 'the engine default score icon stays ⚽ for the other units');
  // the sort / order hints call their chips «tarjetas» (cards to tap, not football cards)
  const CHIP_CARDS = ['kSort', 'pickCard', 'kOrder', 'orderNeedAll'];
  const merged = { ...defaults, ...raw.strings };
  for (const k of CHIP_CARDS) delete merged[k];
  const left = Object.entries(merged)
    .filter(([, v]) => FOOTBALL.test(strOf(v)))
    .map(([k, v]) => `${k}: «${strOf(v)}»`);
  assert.deepEqual(left, []);
  const lists = { ...engineDefaults('DEFAULT_LISTS'), ...raw.lists };
  for (const [k, xs] of Object.entries(lists)) for (const x of xs) assert.ok(!FOOTBALL.test(x), `lists.${k}: «${x}»`);
});

// SC_CHECK on a small valid unit, one thing broken at a time (rules from the plan's type contracts).
const scUnit = () => ({
  slug: 'sc-demo',
  title: 'Demo',
  stations: [
    {
      id: 'a',
      title: 'A',
      icon: '🎈',
      intro: 'A',
      tasks: [
        {
          type: 'spainMap',
          q: 'Pon cada símbolo en su comunidad.',
          mode: 'weather',
          tokens: [
            { id: 'sol', label: 'Sol', icon: '☀️' },
            { id: 'lluvia', label: 'Lluvia', icon: '🌧️' },
          ],
          answer: { galicia: 'lluvia', andalucia: 'sol' },
          text: 'Llueve en Galicia. Sol en Andalucía.',
        },
        {
          type: 'spainMap',
          q: 'Pon cada clima en su comunidad.',
          mode: 'climate',
          tokens: [
            { id: 'oceanico', label: 'Oceánico', color: '#2b6cb0' },
            { id: 'subtropical', label: 'Subtropical', color: '#d9534f' },
          ],
          answer: { asturias: 'oceanico', canarias: 'subtropical' },
        },
        {
          type: 'climograma',
          q: 'Toca el mes en que hace más calor.',
          mode: 'tapMonth',
          temp: [...BOOK_TEMP],
          rain: [...BOOK_RAIN],
          answer: 6,
        },
        {
          type: 'climograma',
          q: 'Construye la barra.',
          mode: 'fillBar',
          temp: [...BOOK_TEMP],
          rain: [...BOOK_RAIN],
          missing: 8,
          table: true,
        },
        {
          type: 'climograma',
          q: 'Construye el punto.',
          mode: 'fillTemp',
          temp: [...BOOK_TEMP],
          rain: [...BOOK_RAIN],
          missing: 6,
          table: true,
        },
        { type: 'spot', q: 'Toca todo lo que han hecho las personas.', scene: 'costa', find: ['puerto', 'faro', 'hotel', 'barcos'] },
      ],
    },
  ],
  exam: { perStation: { a: 1 } },
});
// [name, task number (1-based) the error must name, mutate]
const SC_BROKEN = [
  // spainMap
  ['spainMap: unknown region', 1, (t) => (t[0].answer = { galicia: 'lluvia', narnia: 'sol' })],
  ['spainMap: answer token not in tokens', 1, (t) => (t[0].answer = { galicia: 'granizo', andalucia: 'sol' })],
  ['spainMap: repeated token ids', 1, (t) => (t[0].tokens = [t[0].tokens[0], { ...t[0].tokens[0] }, t[0].tokens[1]])],
  ['spainMap: one token', 1, (t) => (t[0].tokens = [t[0].tokens[1]]) && (t[0].answer = { galicia: 'lluvia', asturias: 'lluvia' })],
  [
    'spainMap: six tokens',
    1,
    (t) => t[0].tokens.push(...['nubes', 'nieve', 'tormenta', 'niebla'].map((id) => ({ id, label: id }))) && t[0].tokens.length,
  ],
  ['spainMap: one region asked', 1, (t) => (t[0].answer = { galicia: 'lluvia' })],
  ['spainMap: weather map without the forecast', 1, (t) => delete t[0].text],
  ['spainMap: unknown mode', 1, (t) => (t[0].mode = 'rain')],
  ['spainMap climate: Andalucía (not defensible)', 2, (t) => (t[1].answer = { asturias: 'oceanico', andalucia: 'subtropical' })],
  ['spainMap climate: Aragón (not defensible)', 2, (t) => (t[1].answer.aragon = 'oceanico')],
  // a token that is not one of the four climate ids: only the defensible-region rule can catch it
  [
    'spainMap climate: Andalucía with an own token',
    2,
    (t) => t[1].tokens.push({ id: 'sur', label: 'Sur', color: '#aa7733' }) && (t[1].answer.andalucia = 'sur'),
  ],
  ['spainMap climate: the wrong climate on a region', 2, (t) => (t[1].answer = { asturias: 'subtropical', canarias: 'oceanico' })],
  ['spainMap climate: «de montaña» as a token', 2, (t) => t[1].tokens.push({ id: 'montana', label: 'De montaña', color: '#336655' })],
  ['spainMap climate: token without a colour', 2, (t) => delete t[1].tokens[0].color],
  // climograma
  ['climograma: temp of 11 months', 3, (t) => t[2].temp.pop()],
  ['climograma: rain of 13 months', 3, (t) => t[2].rain.push(40)],
  ['climograma: temp above 35 °C', 3, (t) => (t[2].temp[0] = 36)],
  ['climograma: rain above 210 mm', 3, (t) => (t[2].rain[0] = 211)],
  ['climograma: the asked month is not unique (two months of 20 °C)', 3, (t) => (t[2].temp[7] = 20)],
  ['climograma: the answer is not the warmest month', 3, (t) => (t[2].answer = 7)],
  ['climograma: answer out of 0–11', 3, (t) => (t[2].answer = 12)],
  ['climograma: unknown mode', 3, (t) => (t[2].mode = 'tapYear')],
  ['climograma: missing bar off the 15 mm grid', 4, (t) => (t[3].rain[8] = 70)],
  ['climograma: missing point off the 5 °C grid', 5, (t) => (t[4].missing = 4)],
  ['climograma: missing out of 0–11', 4, (t) => (t[3].missing = -1)],
  // spot (with the art)
  ['spot: unknown element id', 6, (t) => (t[5].find = ['puerto', 'faro', 'hotel', 'castillo'])],
  // a q that does not ask for what people made: only the id rule can catch it
  ['spot: unknown element id (plain q)', 6, (t) => Object.assign(t[5], { q: 'Toca el faro.', find: ['faro', 'castillo'] })],
  ['spot: find misses a human-made item', 6, (t) => (t[5].find = ['puerto', 'faro', 'hotel'])],
  ['spot: find has a natural item', 6, (t) => t[5].find.push('playa')],
  ['spot: unknown scene', 6, (t) => (t[5].scene = 'desierto')],
  ['spot: repeated find ids', 6, (t) => t[5].find.push('faro')],
  ['spot: empty find', 6, (t) => (t[5].find = [])],
];

test('SC_CHECK: the small valid unit passes (with and without the art)', () => {
  const { check, art } = bootClima();
  assert.deepEqual(check(scUnit()), []);
  assert.deepEqual(check(scUnit(), art), []);
});

for (const [name, i, mutate] of SC_BROKEN) {
  test(`SC_CHECK catches: ${name}`, () => {
    const { check, art } = bootClima();
    const u = scUnit();
    mutate(u.stations[0].tasks);
    const errs = check(u, art);
    assert.ok(errs.length > 0, 'no errors reported');
    assert.ok(
      errs.every((e) => e.startsWith(`station a task ${i} `)),
      `errors not only about task ${i}: ${JSON.stringify(errs)}`,
    );
  });
}

// ---------- naturales-animales: «Expedición safari», Ciencias de la Naturaleza 3.º, Unidad 2 ----------
// Expected values from the plan (.pi/plan-naturales-animales.md: stations, exam settings, the ficha / clave contracts, the theme,
// the art keys, the book traps) and the driver hooks (/tmp/na-design/hooks.md: the NA_CHECK error kinds).

const bootNa = () => {
  const node = () => ({ attrs: {}, dataset: {}, style: {}, setAttribute() {}, append() {}, set innerHTML(_) {}, classList: { add() {} } });
  const sb = {
    console,
    Math,
    KF: { lang: 'uk', i18n: () => (key) => key, gameData: () => ({}) },
    KFG: { shuffle: (a) => [...a], canSay: () => false },
    document: { createElementNS: node, createElement: node },
  };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of [
    'shared/exam/exam.js',
    'shared/exam/types.js',
    'games/naturales-animales/content.js',
    'games/naturales-animales/art.js',
    'games/naturales-animales/types.js',
  ]) {
    vm.runInContext(read(f), sb, { filename: f });
  }
  return {
    E: sb.KFExam,
    content: clone(sb.NA_CONTENT),
    raw: sb.NA_CONTENT,
    types: sb.NA_TYPES,
    art: sb.NAArt,
    check: (u, a) => [...sb.NA_CHECK(u, a)],
    path: (u, t) => {
      const p = sb.NA_CLAVE_PATH(u, t);
      return p ? [...p] : p;
    },
  };
};
const NA_STATIONS = ['comer', 'cazar', 'moverse', 'reproduccion', 'nacer', 'invertebrados', 'vertebrados', 'ficha'];
const NA_OWN = ['ficha', 'clave'];
// The plan's row option sets of a ficha (ids).
const NA_ROWS = {
  come: ['herbivoro', 'carnivoro', 'omnivoro'],
  mueve: ['anda', 'salta', 'repta', 'nada', 'vuela'],
  nace: ['viviparo', 'oviparo', 'ovoviviparo'],
  grupo: ['mamifero', 'ave', 'pez', 'reptil', 'anfibio', 'invertebrado'],
};
// The plan's «Art keys (final)» (must) + the three skulls.
const NA_ART_KEYS =
  'vaca oveja caballo conejo leon leopardo lobo gato perro cerdo jabali zorro oso elefante canguro delfin ballena murcielago gallina buitre halcon pinguino pato serpiente tortuga cocodrilo lagarto rana salamandra tiburon atun pez-payaso caballito-mar estrella-mar erizo-mar lombriz medusa esponja caracol pulpo abeja mariposa hormiga mariquita arana escorpion cangrejo craneo-herbivoro craneo-carnivoro craneo-omnivoro'.split(
    ' ',
  );
const naTasks = (u) => u.stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id })));
// Football words the safari unit must not show (plan: «Override every football word players can see»); «cuaderno de campo» is
// the explorer's field notebook of station 8 (plan), not a pitch: that phrase is taken out before the check.
const NA_FOOTBALL = /⚽|🟨|🟥|\bgol(es|azo)?\b|partido|árbitro|\bcampo\b|tarjeta|expuls|\bVAR\b/i;
const naShown = (s) => s.replace(/cuadernos? de campo/gi, '');

test('naturales-animales: valid; eight stations, exam of 15 (2 per station, 1 for one), red after 4, sendOff, VAR at 2, practice at 0.5', () => {
  const { E, content: u } = bootNa();
  assert.deepEqual([...E.validate(clone(u))], []);
  assert.equal(u.slug, 'naturales-animales');
  assert.equal(u.testHook, '__na');
  assert.deepEqual(
    u.stations.map((s) => s.id),
    NA_STATIONS,
  );
  for (const s of u.stations) assert.ok(s.tasks.length >= 8 && s.tasks.length <= 12, `${s.id}: ${s.tasks.length} tasks`);
  const total = u.stations.reduce((a, s) => a + s.tasks.length, 0);
  assert.ok(total >= 75 && total <= 90, `${total} tasks`);
  assert.equal(u.readFirst, false);
  assert.equal(u.round, 6);
  assert.equal(u.practiceCoin, 0.5);
  assert.deepEqual(Object.keys(u.exam.perStation).sort(), [...NA_STATIONS].sort());
  const per = Object.values(u.exam.perStation);
  assert.equal(
    per.reduce((a, b) => a + b, 0),
    15,
  );
  assert.deepEqual(
    per.filter((n) => n === 1),
    [1],
    'one station (the lightest) with 1',
  );
  assert.equal(per.filter((n) => n === 2).length, 7);
  assert.equal(u.exam.redAfter, 4);
  assert.equal(u.exam.sendOff, true);
  assert.equal(u.exam.var, 2);
  const used = new Set(naTasks(u).map((t) => t.type));
  for (const k of NA_OWN) assert.ok(used.has(k), `no ${k} task`);
  for (const k of [...Object.keys(u.sampling?.caps ?? {}), ...Object.keys(u.sampling?.examCaps ?? {}), ...(u.sampling?.always ?? [])])
    assert.ok(used.has(k), `sampling names «${k}»`);
  // station 8 «ficha» is mostly fichas plus claves; claves in invertebrados (columna, invertebrados) and vertebrados
  const st = (id) => u.stations.find((s) => s.id === id).tasks;
  assert.ok(st('ficha').filter((t) => t.type === 'ficha').length > st('ficha').length / 2, 'station ficha: mostly fichas');
  assert.ok(st('ficha').some((t) => t.type === 'clave'));
  assert.deepEqual(
    [
      ...new Set(
        st('invertebrados')
          .filter((t) => t.type === 'clave')
          .map((t) => t.tree),
      ),
    ].sort(),
    ['columna', 'invertebrados'],
  );
  assert.ok(st('vertebrados').some((t) => t.type === 'clave' && t.tree === 'vertebrados'));
});

test('naturales-animales: every station has a uk glossary of 7–8 pairs and a rule note of 25–35 words; no Cyrillic outside the glossaries', () => {
  const { content: u } = bootNa();
  for (const s of u.stations) {
    assert.ok(s.vocab?.length >= 7 && s.vocab.length <= 8, `${s.id}: ${s.vocab?.length} glossary pairs`);
    for (const [es, uk] of s.vocab) {
      assert.ok(!CYR.test(es), `${s.id}: Spanish term «${es}» has Cyrillic`);
      assert.ok(CYR.test(uk), `${s.id}: «${es}» has no Ukrainian translation («${uk}»)`);
    }
    assert.ok(s.text?.paragraphs?.length >= 1, `${s.id}: rule note`);
    const n = words(s.text.paragraphs.join(' '));
    assert.ok(n >= 25 && n <= 35, `${s.id}: the rule note has ${n} words`);
  }
  const noVocab = { ...u, stations: u.stations.map(({ vocab, ...s }) => s) };
  assert.ok(!CYR.test(JSON.stringify(noVocab)), 'Cyrillic outside the glossaries');
  for (const t of naTasks(u)) {
    if (t.type !== 'choice' || t.pics) continue;
    const ok = t.options[t.answer].length;
    const mx = Math.max(...t.options.filter((_, i) => i !== t.answer).map((o) => o.length));
    assert.ok(!(ok > mx * 1.3 && ok - mx > 6), `«${t.options[t.answer]}» stands out in «${t.q}»`);
  }
});

test('naturales-animales: valid with the renderers; NA_CHECK passes with and without the art; every art key used exists', () => {
  const { E, content: u, types, art, check } = bootNa();
  assert.deepEqual(Object.keys(types).sort(), NA_OWN.slice().sort());
  assert.deepEqual([...E.validate(clone(u), { ...E.types, ...types })], []);
  assert.deepEqual(check(clone(u)), []);
  assert.deepEqual(check(clone(u), art), []);
  for (const k of NA_ART_KEYS) assert.equal(art.has(k), true, `plan art key «${k}» is not drawn`);
  assert.equal(art.has('no-such-animal'), false);
  let n = 0;
  for (const t of naTasks(u)) {
    const keys = [t.art, NA_OWN.includes(t.type) ? t.animal : null, ...(t.type === 'choice' && t.pics ? t.options : [])].filter(Boolean);
    for (const k of keys) {
      n++;
      assert.equal(art.has(k), true, `${t.station}: art «${k}» does not exist`);
    }
  }
  assert.ok(n >= 20, `${n} art keys used`);
  assert.equal(typeof art.hero, 'function');
});

test('naturales-animales: every ficha row is a plan row, its answer is in its options (narrowed or the full set), 2–4 rows', () => {
  const { content: u } = bootNa();
  const fichas = naTasks(u).filter((t) => t.type === 'ficha');
  assert.ok(fichas.length >= 6, `${fichas.length} fichas`);
  for (const t of fichas) {
    assert.ok(t.rows.length >= 2 && t.rows.length <= 4, `${t.name}: ${t.rows.length} rows`);
    assert.equal(new Set(t.rows.map((r) => r.id)).size, t.rows.length, `${t.name}: repeated row`);
    for (const r of t.rows) {
      assert.ok(r.id in NA_ROWS, `${t.name}: unknown row ${r.id}`);
      const opts = r.options ?? NA_ROWS[r.id];
      for (const o of opts) assert.ok(NA_ROWS[r.id].includes(o), `${t.name} ${r.id}: unknown option ${o}`);
      assert.ok(opts.length >= 2, `${t.name} ${r.id}: options`);
      assert.ok(opts.includes(r.answer), `${t.name} ${r.id}: answer «${r.answer}» not in ${opts.join(', ')}`);
    }
  }
});

test('naturales-animales: every clave leaf is reachable — NA_CLAVE_PATH walks the tree to it; facts are 2–4 texts', () => {
  const { content: u, path } = bootNa();
  const claves = naTasks(u).filter((t) => t.type === 'clave');
  assert.ok(claves.length >= 6, `${claves.length} claves`);
  for (const t of claves) {
    assert.ok(t.tree in u.trees, `${t.name}: no tree ${t.tree}`);
    const p = path(u, t);
    assert.ok(Array.isArray(p) && p.length >= 1, `${t.name}: no path to ${t.answer} in ${t.tree}`);
    // walking the tree by the path ends exactly on the answer leaf
    let n = u.trees[t.tree];
    for (const side of p) {
      assert.ok(side === 'yes' || side === 'no');
      n = n[side];
    }
    assert.equal(n, t.answer, `${t.name}: the path ends on ${n}`);
    assert.ok(typeof u.leaves[t.answer] === 'string' && u.leaves[t.answer].trim(), `${t.answer}: no label`);
    assert.ok(t.facts?.length >= 2 && t.facts.length <= 4, `${t.name}: ${t.facts?.length} facts`);
  }
});

// Leaves of a tree (every string reached from the root).
const naLeaves = (n) => (typeof n === 'string' ? [n] : [...naLeaves(n.yes), ...naLeaves(n.no)]);

test('naturales-animales: the plan trees — columna, vertebrados in the plan order, invertebrados starts with the arthropods', () => {
  const { content: u, path } = bootNa();
  assert.deepEqual(Object.keys(u.trees).sort(), ['columna', 'invertebrados', 'vertebrados']);
  assert.deepEqual(naLeaves(u.trees.columna).sort(), ['invertebrado', 'vertebrado']);
  assert.deepEqual(naLeaves(u.trees.vertebrados).sort(), ['anfibio', 'ave', 'mamifero', 'pez', 'reptil']);
  const at = (tree, answer) => path(u, { tree, answer });
  assert.deepEqual(at('columna', 'vertebrado'), ['yes']);
  assert.deepEqual(at('columna', 'invertebrado'), ['no']);
  // pelo → mamífero; plumas → ave; aletas → pez; piel desnuda → anfibio; else reptil
  assert.deepEqual(at('vertebrados', 'mamifero'), ['yes']);
  assert.deepEqual(at('vertebrados', 'ave'), ['no', 'yes']);
  assert.deepEqual(at('vertebrados', 'pez'), ['no', 'no', 'yes']);
  assert.deepEqual(at('vertebrados', 'anfibio'), ['no', 'no', 'no', 'yes']);
  assert.deepEqual(at('vertebrados', 'reptil'), ['no', 'no', 'no', 'no']);
  // patas articuladas → 6 patas insecto / 8 arácnido
  assert.deepEqual(at('invertebrados', 'insecto'), ['yes', 'yes']);
  assert.deepEqual(at('invertebrados', 'aracnido'), ['yes', 'no', 'yes']);
  for (const l of ['insecto', 'aracnido', 'crustaceo', 'molusco']) assert.ok(naLeaves(u.trees.invertebrados).includes(l), l);
  // a leaf outside the tree, or a tree that does not exist: no path
  assert.equal(at('columna', 'mamifero'), null);
  assert.equal(at('arboles', 'mamifero'), null);
});

// The plan's traps: the group of these animals wherever a ficha or a clave asks it.
const NA_GROUP = {
  delfin: 'mamifero',
  ballena: 'mamifero',
  murcielago: 'mamifero',
  pinguino: 'ave',
  rana: 'anfibio',
  salamandra: 'anfibio',
  tortuga: 'reptil',
  serpiente: 'reptil',
  cocodrilo: 'reptil',
};

test('naturales-animales: the book traps — murciélago / delfín mamífero, pingüino ave, rana anfibio, tortuga reptil; caballito de mar ovovivíparo', () => {
  const { content: u } = bootNa();
  let n = 0;
  for (const t of naTasks(u)) {
    const want = NA_GROUP[t.animal];
    if (!want) continue;
    if (t.type === 'ficha')
      for (const r of t.rows.filter((x) => x.id === 'grupo')) {
        n++;
        assert.equal(r.answer, want, `ficha ${t.animal}`);
      }
    if (t.type === 'clave' && t.tree === 'vertebrados') {
      n++;
      assert.equal(t.answer, want, `clave ${t.animal}`);
    }
  }
  assert.ok(n >= 3, `${n} trap rows / claves`);
  for (const t of naTasks(u).filter((x) => x.type === 'ficha' && x.animal === 'caballito-mar'))
    for (const r of t.rows.filter((x) => x.id === 'nace')) assert.equal(r.answer, 'ovoviviparo');
  // a pingüino walks and swims: its «mueve» row is never asked with both
  for (const t of naTasks(u).filter((x) => x.type === 'ficha' && x.animal === 'pinguino'))
    for (const r of t.rows.filter((x) => x.id === 'mueve'))
      assert.ok(!(r.options ?? NA_ROWS.mueve).includes('anda') || !(r.options ?? NA_ROWS.mueve).includes('nada'));
});

test('naturales-animales: every station text paragraph has a clip in shared/audio.js', () => {
  const { content: u } = bootNa();
  const audio = { window: {} };
  vm.createContext(audio);
  vm.runInContext(read('shared/audio.js'), audio);
  const es = new Set(audio.window.KF_AUDIO?.es ?? audio.KF_AUDIO.es);
  const texts = u.stations.flatMap((s) => s.text?.paragraphs ?? []);
  assert.ok(texts.length >= 8);
  for (const t of texts) {
    const slug = buildSlug(t);
    assert.ok(es.has(slug), `no clip for «${t.slice(0, 50)}…» (${slug}): run scripts/build-audio.mjs`);
  }
});

test('naturales-animales: the safari theme — 📸 Fotos, 🕳️ bache, 🛞 rueda pinchada, 🔧 rueda de repuesto (2 🪙); no football word shown', () => {
  const { content: u, raw } = bootNa();
  const s = raw.strings;
  assert.equal(s.scoreIcon, '📸');
  assert.equal(s.goalsLabel, 'Fotos');
  assert.match(s.yellow, /bache/i);
  assert.match(s.red, /rueda pinchada/i);
  assert.match(s.varBtn({ n: 2 }), /^🔧 Rueda de repuesto/);
  assert.match(s.varBtn({ n: 2 }), /2 🪙/);
  assert.match(strOf(s.examInfoOff), /🕳️/);
  assert.match(strOf(s.examInfoOff), /🛞/);
  assert.match(strOf(s.examInfoOff), /no hay monedas/);
  for (const [k, v] of Object.entries(s)) assert.ok(!NA_FOOTBALL.test(naShown(strOf(v))), `strings.${k}: «${strOf(v)}»`);
  assert.ok(u.lists?.praise?.length >= 3, 'own praise list (the default has «¡Golazo!»)');
  for (const [k, xs] of Object.entries(u.lists ?? {})) for (const x of xs) assert.ok(!NA_FOOTBALL.test(x), `lists.${k}: «${x}»`);
  // the unit's own text: titles, intros, notes, tasks, tree questions, leaves (the uk glossaries are not shown on es, checked anyway)
  const shown = naShown(JSON.stringify(u.stations) + JSON.stringify(u.trees) + JSON.stringify(u.leaves) + u.title + u.intro + u.exam.title);
  const hit = shown.match(new RegExp(NA_FOOTBALL.source, 'gi'));
  assert.equal(hit, null, `football words in the content: ${hit}`);
  assert.ok(!shown.includes('⚽'));
});

test('naturales-animales: every engine default the player sees with a football word is overridden by the unit', () => {
  const { raw } = bootNa();
  const defaults = engineDefaults('DEFAULT_STRINGS');
  // the sort / order hints call their chips «tarjetas» (cards to tap, not football cards)
  const CHIP_CARDS = ['kSort', 'pickCard', 'kOrder', 'orderNeedAll'];
  const merged = { ...defaults, ...raw.strings };
  for (const k of CHIP_CARDS) delete merged[k];
  const left = Object.entries(merged)
    .filter(([, v]) => NA_FOOTBALL.test(naShown(strOf(v))))
    .map(([k, v]) => `${k}: «${strOf(v)}»`);
  assert.deepEqual(left, []);
  const lists = { ...engineDefaults('DEFAULT_LISTS'), ...raw.lists };
  for (const [k, xs] of Object.entries(lists)) for (const x of xs) assert.ok(!NA_FOOTBALL.test(x), `lists.${k}: «${x}»`);
});

// NA_CHECK on a small valid unit, one thing broken at a time (the error kinds of the hooks: «NA_CHECK negatives»).
const naUnit = () => ({
  slug: 'na-demo',
  title: 'Demo',
  stations: [
    {
      id: 'a',
      title: 'A',
      icon: '📸',
      intro: 'A',
      tasks: [
        {
          type: 'ficha',
          q: 'Rellena la ficha.',
          animal: 'vaca',
          name: 'la vaca',
          rows: [
            { id: 'come', answer: 'herbivoro' },
            { id: 'mueve', answer: 'anda', options: ['anda', 'nada', 'vuela'] },
            { id: 'grupo', answer: 'mamifero' },
          ],
          fact: 'La vaca come hierba.',
        },
        {
          type: 'clave',
          q: '¿Quién es?',
          animal: 'abeja',
          name: 'la abeja',
          facts: ['No tiene huesos', 'Tiene seis patas'],
          tree: 'k',
          answer: 'insecto',
        },
        { type: 'choice', pics: true, q: '¿Cuál vuela?', options: ['vaca', 'halcon'], labels: ['vaca', 'halcón'], answer: 1 },
      ],
    },
  ],
  trees: {
    k: { q: '¿Tiene huesos?', yes: 'vertebrado', no: { q: '¿Tiene seis patas?', yes: 'insecto', no: 'otro' } },
  },
  leaves: { vertebrado: 'Vertebrado', insecto: 'Insecto', otro: 'Otro' },
  exam: { perStation: { a: 1 } },
});
const T1 = /^station a task 1 \(ficha\): /;
const T2 = /^station a task 2 \(clave\): /;
const T3 = /^station a task 3 \(choice\): /;
// [name, the scope every error must have, a word of the kind, mutate(unit)] — tasks = u.stations[0].tasks
const NA_BROKEN = [
  // ficha
  ['ficha: unknown row id', T1, /unknown row/, (u) => (u.stations[0].tasks[0].rows[0].id = 'vive')],
  ['ficha: unknown row answer', T1, /unknown answer/, (u) => (u.stations[0].tasks[0].rows[0].answer = 'frugivoro')],
  ['ficha: unknown option', T1, /unknown option/, (u) => u.stations[0].tasks[0].rows[1].options.push('corre')],
  ['ficha: options < 2', T1, /options/, (u) => (u.stations[0].tasks[0].rows[1].options = ['anda'])],
  ['ficha: options not unique', T1, /unique/, (u) => u.stations[0].tasks[0].rows[1].options.push('nada')],
  ['ficha: answer not in its options', T1, /not in its options/, (u) => (u.stations[0].tasks[0].rows[1].options = ['nada', 'vuela'])],
  ['ficha: 1 row', T1, /2–4/, (u) => (u.stations[0].tasks[0].rows = [{ id: 'come', answer: 'herbivoro' }])],
  [
    'ficha: 5 rows',
    T1,
    /2–4/,
    (u) =>
      (u.stations[0].tasks[0].rows = [
        { id: 'come', answer: 'herbivoro' },
        { id: 'mueve', answer: 'anda' },
        { id: 'nace', answer: 'viviparo' },
        { id: 'grupo', answer: 'mamifero' },
        { id: 'come', answer: 'herbivoro' },
      ]),
  ],
  ['ficha: duplicate row id', T1, /unique/, (u) => (u.stations[0].tasks[0].rows[2] = { id: 'come', answer: 'herbivoro' })],
  ['ficha: q missing', T1, /\bq\b/, (u) => delete u.stations[0].tasks[0].q],
  ['ficha: animal missing', T1, /animal/, (u) => delete u.stations[0].tasks[0].animal],
  ['ficha: name missing', T1, /name/, (u) => (u.stations[0].tasks[0].name = ' ')],
  ['ficha: Cyrillic in the name', T1, /Cyrillic/, (u) => (u.stations[0].tasks[0].name = 'корова')],
  ['ficha: Cyrillic in the fact', T1, /Cyrillic/, (u) => (u.stations[0].tasks[0].fact = 'La vaca — корова.')],
  ['ficha: no art for the animal', T1, /no art «unicornio»/, (u) => (u.stations[0].tasks[0].animal = 'unicornio')],
  // clave
  ['clave: q missing', T2, /\bq\b/, (u) => (u.stations[0].tasks[1].q = '')],
  ['clave: animal missing', T2, /animal/, (u) => delete u.stations[0].tasks[1].animal],
  ['clave: name missing', T2, /name/, (u) => delete u.stations[0].tasks[1].name],
  ['clave: no art for the animal', T2, /no art «unicornio»/, (u) => (u.stations[0].tasks[1].animal = 'unicornio')],
  ['clave: Cyrillic in facts', T2, /Cyrillic/, (u) => (u.stations[0].tasks[1].facts = ['Шість лап', 'No tiene huesos'])],
  ['clave: 5 facts', T2, /facts/, (u) => (u.stations[0].tasks[1].facts = ['a', 'b', 'c', 'd', 'e'])],
  ['clave: an empty fact', T2, /facts/, (u) => (u.stations[0].tasks[1].facts = ['Tiene seis patas', ''])],
  // the tree «k» is then not used either: the error about the task and the one about the tree
  ['clave: no tree', /^station a task 2 \(clave\): |^tree k: /, /no tree «bosque»/, (u) => (u.stations[0].tasks[1].tree = 'bosque')],
  [
    'clave: answer leaf not in the tree',
    T2,
    /not in tree/,
    (u) => (u.stations[0].tasks[1].answer = 'vertebrado2') && (u.leaves.vertebrado2 = 'V'),
  ],
  // the leaf is in the tree but not in leaves: reported for the task and for the tree
  [
    'clave: answer leaf without a label',
    /^station a task 2 \(clave\): |^tree k root\.no\.yes: /,
    /^station a task 2 \(clave\): .*no label/,
    (u) => delete u.leaves.insecto,
  ],
  // pictures
  ['choice pics: an option with no art', T3, /no picture «grifo»/, (u) => (u.stations[0].tasks[2].options[0] = 'grifo')],
  [
    'task art: no art',
    T3,
    /no art «grifo»/,
    (u) => Object.assign(u.stations[0].tasks[2], { pics: false, options: ['a', 'b'], art: 'grifo' }),
  ],
  // trees / leaves
  ['tree: node without q', /^tree k root\.no: /, /without q/, (u) => delete u.trees.k.no.q],
  ['tree: Cyrillic in a node q', /^tree k root: /, /Cyrillic/, (u) => (u.trees.k.q = 'Є кістки?')],
  ['tree: node without a yes branch', /^tree k root: /, /«yes»/, (u) => delete u.trees.k.yes],
  ['tree: node without a no branch', /^tree k root\.no: /, /«no»/, (u) => delete u.trees.k.no.no],
  ['tree: leaf without a label in leaves', /^tree k root\.no\.no: /, /no label/, (u) => delete u.leaves.otro],
  ['leaves: Cyrillic label', /^leaf «otro»: /, /Spanish/, (u) => (u.leaves.otro = 'Інше')],
  ['tree: a leaf reached twice', /^tree k: /, /reached 2 times/, (u) => (u.trees.k.no.no = 'vertebrado')],
  ['tree: a tree no clave uses', /^tree j: /, /no clave/, (u) => (u.trees.j = { q: '¿Vuela?', yes: 'vertebrado', no: 'otro' })],
];

test('NA_CHECK: the small valid unit passes (with and without the art)', () => {
  const { check, art } = bootNa();
  assert.deepEqual(check(naUnit()), []);
  assert.deepEqual(check(naUnit(), art), []);
});

for (const [name, scope, kind, mutate] of NA_BROKEN) {
  test(`NA_CHECK catches: ${name}`, () => {
    const { check, art } = bootNa();
    const u = naUnit();
    mutate(u);
    const errs = check(u, art);
    assert.ok(errs.length > 0, 'no errors reported');
    assert.ok(
      errs.every((e) => scope.test(e)),
      `errors not only about ${scope}: ${JSON.stringify(errs)}`,
    );
    assert.ok(
      errs.some((e) => kind.test(e)),
      `no «${kind}» error: ${JSON.stringify(errs)}`,
    );
  });
}

test('NA_CLAVE_PATH: the yes / no answers node by node; null for a leaf outside the tree or no tree', () => {
  const { path } = bootNa();
  const u = naUnit();
  assert.deepEqual(path(u, { tree: 'k', answer: 'vertebrado' }), ['yes']);
  assert.deepEqual(path(u, { tree: 'k', answer: 'insecto' }), ['no', 'yes']);
  assert.deepEqual(path(u, { tree: 'k', answer: 'otro' }), ['no', 'no']);
  assert.equal(path(u, { tree: 'k', answer: 'pez' }), null);
  assert.equal(path(u, { tree: 'nada', answer: 'otro' }), null);
});
