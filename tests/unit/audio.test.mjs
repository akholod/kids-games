// Pre-recorded clips: every English word of word-match and every coach command has one, the manifest (shared/audio.js) and audio/<lang>/ agree.
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildSlug as slug } from './slug-impls.mjs';

const path = (rel) => fileURLToPath(new URL(`../../${rel}`, import.meta.url));
const read = (rel) => fs.readFileSync(path(rel), 'utf8');

// The real slug() of scripts/build-audio.mjs (tests/unit/slug.test.mjs checks that kf-game.js agrees).
const boot = (files, extra = {}) => {
  const sb = { console, Math, KF: { lang: 'uk', i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a] }, ...extra };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of files) vm.runInContext(read(f), sb, { filename: f });
  return sb;
};

const AUDIO = boot(['shared/audio.js']).KF_AUDIO;
const manifest = [...AUDIO.en];

test('audio: every English word of word-match has a clip in the manifest and a non-empty file', () => {
  const { WM_CONTENT: wm } = boot(['shared/exam/exam.js', 'shared/exam/types.js', 'games/word-match/content.js']);
  const words = Object.values(wm.words);
  assert.ok(words.length > 100);
  for (const w of words) {
    const s = slug(w.en);
    assert.ok(s, w.en);
    assert.ok(manifest.includes(s), `${w.en}: «${s}» is not in KF_AUDIO.en (run scripts/build-audio.mjs)`);
    assert.ok(fs.statSync(path(`audio/en/${s}.mp3`)).size > 1000, `${s}.mp3 is empty`);
  }
});

test('audio: every coach-simon command (es, en; with and without "Simon says") has a clip', () => {
  const { SimonEngine } = boot(['games/coach-simon/engine.js']);
  for (const lang of ['es', 'en']) {
    const phrases = SimonEngine.phrases(lang);
    assert.equal(phrases.length, 18);
    for (const p of phrases) {
      const s = slug(p);
      assert.ok([...AUDIO[lang]].includes(s), `${lang} «${p}»: «${s}» is not in KF_AUDIO.${lang}`);
      assert.ok(fs.statSync(path(`audio/${lang}/${s}.mp3`)).size > 1000, `${lang}/${s}.mp3 is empty`);
    }
  }
  assert.equal(slug('Simón dice: arriba a la izquierda'), 'simon-dice-arriba-a-la-izquierda');
});

test('audio: every chytanka word and short text has a Ukrainian clip; look-alike words get different files', () => {
  const { CH_CONTENT: ch } = boot(['shared/exam/exam.js', 'shared/exam/types.js', 'games/chytanka/content.js']);
  const texts = [
    ...Object.values(ch.words).map((w) => w.word),
    ...ch.stations.flatMap((s) => s.tasks.filter((t) => t.type === 'story').map((t) => t.text)),
  ];
  assert.equal(texts.length, 150);
  for (const t of texts) {
    const s = slug(t);
    assert.ok([...AUDIO.uk].includes(s), `uk «${t}»: «${s}» is not in KF_AUDIO.uk`);
    assert.ok(fs.statSync(path(`audio/uk/${s}.mp3`)).size > 1000, `uk/${s}.mp3 is empty`);
  }
  assert.equal(slug('м’яч'), 'myach');
  assert.equal(slug('ведмі́дь'), 'vedmid');
  assert.notEqual(slug('кит'), slug('кіт'));
  assert.notEqual(slug('лис'), slug('ліс'));
  assert.equal(slug('їжак'), 'yizhak');
});

test('audio: everything the dictado coach says has a Spanish clip, every sentence a slow one too', () => {
  const { DC_CONTENT: dc } = boot(['shared/exam/exam.js', 'shared/exam/types.js', 'games/dictado/content.js']);
  const tasks = dc.stations.flatMap((s) => s.tasks.filter((t) => t.say));
  assert.ok(tasks.length > 500);
  for (const t of tasks) {
    const s = slug(t.say);
    assert.ok([...AUDIO.es].includes(s), `es «${t.say}»: «${s}» is not in KF_AUDIO.es`);
    if (t.type === 'cloze') assert.ok([...AUDIO['es-slow']].includes(s), `es-slow «${t.say}»`);
  }
  assert.equal(slug('compañero'), 'companero');
});

test('audio: every lengua-mundo reading paragraph and tone sentence has a Spanish clip (long ones under a short hashed name)', () => {
  const { LE_CONTENT: le } = boot(['shared/exam/exam.js', 'shared/exam/types.js', 'games/lengua-mundo/content.js']);
  const texts = [
    ...le.stations.flatMap((s) => s.text?.paragraphs ?? []),
    ...le.stations.flatMap((s) => s.tasks.filter((t) => t.type === 'tone').map((t) => t.say)),
  ];
  assert.ok(texts.length >= 20, `${texts.length} texts`);
  for (const t of texts) {
    const s = slug(t);
    assert.ok(s.length <= 60, `«${t.slice(0, 30)}…»: slug of ${s.length} characters`);
    assert.ok([...AUDIO.es].includes(s), `es «${t.slice(0, 40)}…»: «${s}» is not in KF_AUDIO.es (run scripts/build-audio.mjs)`);
    assert.ok(fs.statSync(path(`audio/es/${s}.mp3`)).size > 1000, `es/${s}.mp3 is empty`);
  }
});

test('audio: manifest and audio/<lang>/ agree, slugs are sorted and unique', () => {
  assert.deepEqual(Object.keys(AUDIO).sort(), fs.readdirSync(path('audio')).sort());
  for (const [lang, list] of Object.entries(AUDIO)) {
    const slugs = [...list];
    assert.equal(new Set(slugs).size, slugs.length, lang);
    assert.deepEqual(slugs, [...slugs].sort(), lang);
    for (const s of slugs) assert.ok(fs.existsSync(path(`audio/${lang}/${s}.mp3`)), `${lang}/${s}: no file`);
    const files = fs.readdirSync(path(`audio/${lang}`)).filter((f) => !f.startsWith('.'));
    assert.deepEqual(
      files.filter((f) => !f.endsWith('.mp3') || !slugs.includes(f.slice(0, -4))),
      [],
      `${lang}: files outside the manifest`,
    );
  }
});
