import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { playSimonCommands, playSimonMemory, startSimon } from './drivers.mjs';

const SLUG = 'coach-simon';

test('coach-simon: memory round won to 10, the perfect bonus only the first time', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#lang-group')).toBeHidden(); // command language only for the commands mode
  const c0 = await coins(page);

  await startSimon(page, tap, { mode: 'memory', level: 'academy' });
  await expect(page.locator('button.zone')).toHaveCount(9);
  await playSimonMemory(page, tap);
  await expect(page.locator('#final-score')).toHaveText('10 / 10');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 10, max: 10 });
  const c1 = await coins(page);
  // 9 sequences (2…10) × 1 coin + the academy bonus 4
  expect(c1 - c0).toBe(13);
  expect(await page.evaluate(() => KF.gameData('coach-simon').perfect)).toMatchObject({ 'memory:academy': true });

  await tap(page.locator('#again'));
  await playSimonMemory(page, tap);
  expect((await coins(page)) - c1).toBe(9); // no bonus the second time
});

test('coach-simon: memory — a miss replays the same sequence, a second miss ends the round', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await startSimon(page, tap, { mode: 'memory', level: 'rookie' });
  const first = await page.evaluate(() => __simon.seq);
  expect(first).toHaveLength(2);
  for (const z of first) expect([0, 2, 6, 8]).toContain(z); // rookie: corners only, the other zones are off
  await expect(page.locator('button.zone:disabled.off')).toHaveCount(5);
  // miss at length 3 twice → score 2 (the longest sequence repeated)
  await playSimonMemory(page, tap, { missAt: [3, 3] });
  await expect(page.locator('#final-score')).toHaveText('2 / 10');
});

test('coach-simon: commands — 10 shots, pro tricks held, translation shown', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await startSimon(page, tap, { mode: 'commands', level: 'pro', lang: 'mix' });
  await expect(page.locator('#round-label')).toContainText('1');
  const results = await playSimonCommands(page, tap);
  expect(results).toHaveLength(10);
  expect(results.filter((v) => v === 'held')).toHaveLength(3);
  expect(results.every((v) => v === 'save' || v === 'held')).toBe(true);
  await expect(page.locator('#final-score')).toHaveText('10 / 10');
  expect(await record(page, SLUG)).toMatchObject({ best: 10, max: 10 });
});

test('coach-simon: commands — a wrong zone and a late answer are goals, explained gently', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await startSimon(page, tap, { mode: 'commands', level: 'rookie', lang: 'es' });
  await page.waitForFunction(() => __simon.phase === 'input');
  const cmd = await page.evaluate(() => __simon.cmd);
  const wrong = await page.evaluate((z) => SimonEngine.LEVELS.rookie.commands.zones.find((x) => x !== z), cmd.zone);
  await tap(page.locator(`button.zone[data-zone="${wrong}"]`));
  await expect(page.locator('#feedback')).toContainText(cmd.words);
  await expect(page.locator('#feedback')).toContainText('—'); // "Arriba a la izquierda — вгорі ліворуч"
  await tap(page.locator('#feedback button'));
  // no tap: the ball arrives (sped up) and counts as a goal
  await page.waitForFunction(() => __simon.phase === 'feedback');
  expect(await page.evaluate(() => __simon.results)).toEqual(['goal', 'goal']);
});

test('coach-simon: Spanish site — no Cyrillic, translation in English', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`, { lang: 'es' });
  await expect(page.locator('#intro h1')).toHaveText('Simón dice');
  await expectNoCyrillic(page, 'on the intro');
  await startSimon(page, tap, { mode: 'commands', level: 'academy', lang: 'es' });
  await page.waitForFunction(() => __simon.phase === 'input');
  const cmd = await page.evaluate(() => __simon.cmd);
  await tap(page.locator(`button.zone[data-zone="${cmd.zone}"]`));
  await expect(page.locator('#feedback .btn')).toBeVisible();
  await expectNoCyrillic(page, 'on the feedback');
  const en = await page.evaluate((z) => SimonEngine.ZONES[z].en.toLowerCase(), cmd.zone);
  await expect(page.locator('#feedback')).toContainText(en);
  await tap(page.locator('#feedback button'));
  await playSimonCommands(page, tap, { shots: 9 });
  await expectNoCyrillic(page, 'on the finish screen');
});

test('coach-simon: commands are pre-recorded clips (es + en on mix), no "no voice" note', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  const clips = new Set();
  page.on('request', (r) => {
    const m = r.url().match(/\/audio\/(es|en)\/([a-z0-9-]+)\.mp3$/);
    if (m) clips.add(`${m[1]}/${m[2]}`);
  });
  await startSimon(page, tap, { mode: 'commands', level: 'pro', lang: 'mix' });
  // all 36 phrases are loaded before the first whistle
  await expect.poll(() => clips.size).toBe(36);
  expect(clips).toContain('es/simon-dice-arriba-a-la-izquierda');
  expect(clips).toContain('en/top-left');
  await expect(page.locator('#voice-note')).toBeHidden();
  await page.waitForFunction(() => __simon.phase === 'input');
  expect(await page.evaluate(() => KFG.speaking())).toBe(true); // the command clip is playing
});
