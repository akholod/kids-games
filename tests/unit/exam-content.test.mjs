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
