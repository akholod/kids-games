// Pre-recorded clips: every English word of word-match has one, the manifest (shared/audio.js) and audio/en/ agree.
import test from 'node:test';
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const path = (rel) => fileURLToPath(new URL(`../../${rel}`, import.meta.url));
const read = (rel) => fs.readFileSync(path(rel), 'utf8');

// Same rule as slug() in shared/kf-game.js and scripts/build-audio.mjs.
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const boot = (files, extra = {}) => {
  const sb = { console, Math, KF: { lang: 'uk', i18n: () => (key) => key }, KFG: { shuffle: (a) => [...a] }, ...extra };
  sb.window = sb;
  vm.createContext(sb);
  for (const f of files) vm.runInContext(read(f), sb, { filename: f });
  return sb;
};

const manifest = [...boot(['shared/audio.js']).KF_AUDIO.en];
const files = fs.readdirSync(path('audio/en')).filter((f) => !f.startsWith('.'));

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

test('audio: manifest and audio/en/ agree, slugs are sorted and unique', () => {
  assert.equal(new Set(manifest).size, manifest.length);
  assert.deepEqual(manifest, [...manifest].sort());
  for (const s of manifest) assert.ok(fs.existsSync(path(`audio/en/${s}.mp3`)), `${s}: no file`);
  assert.deepEqual(
    files.filter((f) => !f.endsWith('.mp3') || !manifest.includes(f.slice(0, -4))),
    [],
    'files outside the manifest',
  );
});
