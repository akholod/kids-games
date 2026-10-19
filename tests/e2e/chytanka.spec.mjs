import { test, expect, open, record } from './helpers.mjs';
import { answerChTask, playChSession, playChTasks } from './drivers.mjs';

const SLUG = 'chytanka';
const words = (page) => page.evaluate(() => KF.gameData(CH_CONTENT.store).w || {});

test('chytanka: hub with 10 cities and the passport, one full round of Kyiv', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await expect(page.locator('#stations .station')).toHaveCount(10);
  await expect(page.locator('.ch-passport')).toContainText('Печаток: 0 з 10');
  await expect(page.locator('.ch-passport')).toContainText('Далі — Київ');

  await tap(page.locator('#stations .station').first());
  await tap(page.locator('#intro-go'));
  await expect(page.locator('#play')).toBeVisible();
  const seen = await playChSession(page, tap);
  expect(seen).toHaveLength(6);
  const keys = seen.filter((t) => t.key).map((t) => t.key);
  expect(new Set(keys).size).toBe(keys.length); // a round never asks the same word twice
  expect(await record(page, SLUG)).toMatchObject({ plays: 1 });
  const w = await words(page);
  for (const k of keys) expect(w[k]).toMatchObject({ ok: 1, miss: 0, run: 1 });

  // a perfect round = the Kyiv stamp, the passport counts it and points to the next city
  await page.evaluate(() => __ch.toHub());
  await expect(page.locator('.ch-passport')).toContainText('Печаток: 1 з 10');
  await expect(page.locator('.ch-passport')).toContainText('Далі — Чернігів');
  await expect(page.locator('.ch-city.stamp')).toHaveCount(1);
});

test('chytanka: every task type — read (split toggle), picture → word, hear (clip), build with a retry, gap, story', async ({
  page,
  tap,
}) => {
  await open(page, `/games/${SLUG}/`);
  const clips = [];
  page.on('request', (r) => r.url().includes('/audio/uk/') && clips.push(r.url().split('/').pop()));
  // Odesa: stop 8, words are shown whole (the «По складах» toggle splits them)
  const types = await playChTasks(page, 'odesa', ['read', 'pic', 'hear', 'build', 'gap', 'story']);
  expect(types).toEqual(['read', 'choice', 'hear', 'build', 'gap', 'story']);

  for (let i = 0; i < types.length; i++) {
    const t = await page.evaluate(() => __ch.session.task);
    if (t.type === 'read') {
      await expect(page.locator('.ch-word')).not.toHaveClass(/is-split/);
      await tap(page.locator('#ch-split'));
      await expect(page.locator('.ch-word')).toHaveClass(/is-split/);
      await expect(page.locator('.ch-word .ch-syl')).toHaveCount(t.word.syl.length);
    }
    if (t.type === 'hear') {
      await expect(page.locator('#ch-play')).toBeVisible();
      await expect.poll(() => clips.length).toBeGreaterThan(0);
    }
    if (t.type === 'story') await expect(page.locator('#ch-listen')).toHaveCount(0); // listening only after reading
    await answerChTask(page, tap, { wrongFirst: t.type === 'build' });
    if (t.type === 'build') await expect(page.locator('.ch-build')).toHaveClass(/is-done/);
    if (t.type === 'gap') await expect(page.locator('#ch-slot')).toHaveText(t.options[0]);
    if (t.type === 'story') await expect(page.locator('#ch-listen')).toBeVisible();
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __ch.session.results)).toEqual([true, true, true, true, true, true]); // the build retry is soft
  expect(clips.length).toBeGreaterThan(0);
});

test('chytanka: the first stops show words by syllables; a miss counts against the word', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await playChTasks(page, 'kyiv', ['read', 'hear']);
  await expect(page.locator('.ch-word')).toHaveClass(/is-split/);
  await answerChTask(page, tap);
  await tap(page.locator('#feedback .fb-actions .btn').first());
  const t = await page.evaluate(() => __ch.session.task);
  await tap(page.locator(`.ch-wopt:not([data-word="${t.word.word}"])`).first());
  expect((await words(page))[t.key]).toMatchObject({ ok: 0, miss: 1, run: 0 });
});
