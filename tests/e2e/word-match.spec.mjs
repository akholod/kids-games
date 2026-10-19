import { test, expect, open, record, expectNoCyrillic } from './helpers.mjs';
import { answerWordTask, playWordSession, playWordTasks } from './drivers.mjs';

const SLUG = 'word-match';
const words = (page) => page.evaluate(() => KF.gameData(WM_CONTENT.store).w || {});

test('word-match: hub with 12 themes and the squad, one full theme round', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await expect(page.locator('#stations .station')).toHaveCount(12);
  await expect(page.locator('.wm-squad')).toContainText('0 з');
  await expect(page.locator('.wm-team .wm-man')).toHaveCount(12);

  await tap(page.locator('#stations .station').first());
  await tap(page.locator('#intro-go'));
  await expect(page.locator('#play')).toBeVisible();
  const seen = await playWordSession(page, tap);
  expect(seen).toHaveLength(8);
  // one round never asks the same word twice
  const keys = seen.filter((t) => t.key).map((t) => t.key);
  expect(new Set(keys).size).toBe(keys.length);
  expect(await record(page, SLUG)).toMatchObject({ plays: 1 });
  // every word of the round got a right answer in the squad record
  const w = await words(page);
  for (const k of keys) expect(w[k]).toMatchObject({ ok: 1, miss: 0, run: 1 });
});

const slugOf = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

test('word-match: every task type — picture, translation, listen (recorded clip), spell with a retry, pairs', async ({ page, tap }) => {
  // count the clips that really start playing, and the clip files requested
  await page.addInitScript(() => {
    window.__clips = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__clips++;
      return start.apply(this, args);
    };
  });
  const clipUrls = [];
  page.on('request', (r) => {
    if (r.url().endsWith('.mp3')) clipUrls.push(new URL(r.url()).pathname);
  });
  await open(page, `/games/${SLUG}/`);
  const types = await playWordTasks(page, 'animals', ['pic', 'text', 'listen', 'spell', 'pairs']);
  expect(types).toEqual(['choice', 'choice', 'listen', 'spell', 'pairs']);

  for (let i = 0; i < types.length; i++) {
    const t = await page.evaluate(() => __wm.session.task);
    if (t.type === 'choice' && t.art) await expect(page.locator('#work .wm-pic')).toBeVisible();
    if (t.type === 'listen') {
      // clips exist for every word: the 🔊 button, not the no-voice word card
      await expect(page.locator('#wm-play')).toBeVisible();
      await expect(page.locator('#wm-word')).toHaveCount(0);
      await tap(page.locator('#wm-play'));
      await expect.poll(() => page.evaluate(() => window.__clips)).toBeGreaterThan(0);
      expect(clipUrls).toContain(`/audio/en/${slugOf(t.word.en)}.mp3`);
    }
    await answerWordTask(page, tap, { wrongFirst: t.type === 'spell' });
    if (t.type === 'spell') await expect(page.locator('.wm-spell')).toHaveClass(/is-done/);
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
  await expect(page.locator('#finish')).toBeVisible();
  const results = await page.evaluate(() => __wm.session.results);
  expect(results.every(Boolean)).toBe(true); // the spell retry still counts as right (soft)
  const w = await words(page);
  expect(Object.keys(w)).toHaveLength(4); // pairs has no key
});

test('word-match: a word without a clip falls back — no voice: the word is shown instead of the 🔊 button', async ({ page, tap }) => {
  await page.route('**/shared/audio.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.KF_AUDIO = { en: [] };' }),
  );
  await open(page, `/games/${SLUG}/`);
  await playWordTasks(page, 'animals', ['listen']);
  const t = await page.evaluate(() => __wm.session.task);
  await expect(page.locator('#wm-word')).toContainText(t.word.en); // headless Chrome has no voice
  await expect(page.locator('#wm-play')).toHaveCount(0);
  await answerWordTask(page, tap);
  await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
});

test('word-match: a word joins the squad after 2 right answers in a row, a miss brings it back more often', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  // every animal word was answered right once already
  await page.evaluate(() => {
    const w = {};
    for (const x of WM_CONTENT.themes.find((t) => t.id === 'animals').words) w[x.key] = { ok: 1, miss: 0, run: 1, team: 0 };
    KF.gameData(WM_CONTENT.store, { w });
  });
  await page.reload();
  await playWordTasks(page, 'animals', ['text', 'text']);
  const first = await page.evaluate(() => __wm.session.task.key);
  await answerWordTask(page, tap);
  await expect(page.locator('.kf-toast', { hasText: 'у твоїй команді' })).toBeVisible();
  expect((await words(page))[first]).toMatchObject({ ok: 2, run: 2, team: 1 });

  // the second word: a wrong answer resets its run
  await tap(page.locator('#feedback .fb-actions .btn').first());
  const t = await page.evaluate(() => __wm.session.task);
  const wrong = await page.evaluate((x) => {
    const want = x.options.find((_, i) => i !== x.answer);
    return [...document.querySelectorAll('#work .choice')].findIndex((b) => b.textContent.includes(want));
  }, t);
  await tap(page.locator('#work .choice').nth(wrong));
  expect((await words(page))[t.key]).toMatchObject({ miss: 1, run: 0, team: 0 });
  await tap(page.locator('#feedback .fb-actions .btn').first());

  // back on the hub the squad counts the new player
  await expect(page.locator('#finish')).toBeVisible();
  await page.evaluate(() => __wm.toHub());
  await expect(page.locator('.wm-squad')).toContainText('1 з');
});

test('word-match: Spanish site — ES↔EN only, no Cyrillic, a full round', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`, { lang: 'es' });
  await expect(page.locator('.wm-squad')).toContainText('0 de');
  await expectNoCyrillic(page, 'on the hub');
  expect(await page.evaluate(() => WM_CONTENT.natives)).toEqual(['es']);
  await tap(page.locator('#stations .station').nth(1));
  await tap(page.locator('#intro-go'));
  await expectNoCyrillic(page, 'on the first task');
  await answerWordTask(page, tap);
  await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
  await expectNoCyrillic(page, 'on the feedback');
  await tap(page.locator('#feedback .fb-actions .btn').first());
  await playWordSession(page, tap);
  await expectNoCyrillic(page, 'on the finish screen');
});
