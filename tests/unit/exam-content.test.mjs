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
