// Clip file names: shared/kf-game.js and scripts/build-audio.mjs must agree, long texts get a short name + hash.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildSlug, gameHasClip } from './slug-impls.mjs';

const SAMPLES = [
  'Hola',
  '¡Hola, Pedro!',
  'Simón dice: arriba a la izquierda',
  'compañero',
  'El portero para el balón.',
  'м’яч',
  'ведмі́дь',
  'Український народ любить свою мову і своїх сусідів, яких поважає понад усе.',
  // exactly 60 and 61 characters: the boundary
  'a'.repeat(60),
  'b'.repeat(61),
  `${'palabra '.repeat(7)}final`,
  // a long accented Spanish paragraph, like a station text
  'Hace muchos años, en una aldea de las montañas, vivía una niña que hablaba tres lenguas: el castellano, el gallego y el inglés. Cada mañana saludaba a los vecinos en su lengua.',
  // a long Ukrainian paragraph (transliterated before the length is taken)
  'Колись давно в одному селі жила маленька дівчинка, яка говорила трьома мовами: українською, іспанською та англійською. Щоранку вона вітала сусідів їхньою мовою.',
];

test('slug: short slugs are unchanged (no existing clip may be renamed)', () => {
  assert.equal(buildSlug('Hola'), 'hola');
  assert.equal(buildSlug('¡Hola, Pedro!'), 'hola-pedro');
  assert.equal(buildSlug('Simón dice: arriba a la izquierda'), 'simon-dice-arriba-a-la-izquierda');
  assert.equal(buildSlug('м’яч'), 'myach');
  assert.equal(buildSlug('a'.repeat(60)), 'a'.repeat(60));
  // every clip that exists today is short: its name is exactly its slug
  const root = fileURLToPath(new URL('../../audio/', import.meta.url));
  for (const lang of fs.readdirSync(root)) {
    for (const f of fs.readdirSync(`${root}${lang}`)) {
      if (f.endsWith('.mp3') && !f.startsWith('.')) {
        const s = f.slice(0, -4);
        if (s.length <= 60) assert.equal(buildSlug(s), s, `${lang}/${f}`);
      }
    }
  }
});

test('slug: a slug over 60 characters = its first 48 (no trailing "-") + "-" + FNV-1a 32 of the full slug in base 36', () => {
  const long = buildSlug('b'.repeat(61));
  assert.match(long, /^b{48}-[0-9a-z]{1,7}$/);
  assert.ok(long.length <= 60);
  // the hash is FNV-1a: a known value for the full slug 'b' × 61
  let h = 0x811c9dc5;
  for (const c of 'b'.repeat(61)) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  assert.equal(long, `${'b'.repeat(48)}-${h.toString(36)}`);
  // the cut never leaves a dangling "-" before the hash, and two long texts with the same start stay apart
  const a = buildSlug(`${'palabra '.repeat(7)}final uno`);
  const b = buildSlug(`${'palabra '.repeat(7)}final dos`);
  assert.doesNotMatch(a, /--/);
  assert.notEqual(a, b);
  assert.equal(a.slice(0, 47), b.slice(0, 47));
});

test('slug: kf-game.js and build-audio.mjs agree on short, boundary, long, accented and Ukrainian texts', () => {
  for (const text of SAMPLES) {
    const s = buildSlug(text);
    assert.ok(s.length > 0 && s.length <= 60, `«${text.slice(0, 30)}…»: ${s.length} characters`);
    assert.ok(gameHasClip(text, s), `kf-game.js does not find «${s}» for «${text.slice(0, 40)}…»`);
  }
});
