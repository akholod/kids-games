import { test, expect, open, record, expectNoCyrillic } from './helpers.mjs';
import { answerDcTask, playDcSession, playDcTasks } from './drivers.mjs';

const SLUG = 'dictado';
const words = (page) => page.evaluate(() => KF.gameData(DC_CONTENT.store).w || {});

test('dictado: hub with 12 rules and the board, one full round of a rule', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await expect(page.locator('#stations .station')).toHaveCount(12);
  await tap(page.locator('#stations .station').nth(1)); // m antes de p y b
  await tap(page.locator('#intro-go'));
  await expect(page.locator('#play')).toBeVisible();
  const seen = await playDcSession(page, tap);
  expect(seen).toHaveLength(8);
  expect(seen.some((t) => t.type === 'write')).toBe(false); // the keyboard is only for the final
  for (const type of ['cloze', 'spot']) expect(seen.filter((t) => t.type === type)).toHaveLength(1);
  expect(await record(page, SLUG)).toMatchObject({ plays: 1 });
  const w = await words(page);
  for (const k of seen.map((t) => t.key)) expect(w[k]).toMatchObject({ ok: 1, miss: 0 });
});

test('dictado: every task type — gap, pick, tiles with a retry, tilde, cloze (normal + slow clip), spot', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  const clips = [];
  page.on('request', (r) => {
    const m = r.url().match(/\/audio\/(es(?:-slow)?)\/([a-z0-9-]+)\.mp3$/);
    if (m) clips.push(`${m[1]}/${m[2]}`);
  });
  const types = await playDcTasks(page, 'tilde', ['pick', 'tiles', 'tilde', 'cloze', 'spot']);
  expect(types).toEqual(['pick', 'tiles', 'tilde', 'cloze', 'spot']);
  for (let i = 0; i < types.length; i++) {
    const t = await page.evaluate(() => __dc.session.task);
    if (t.type === 'cloze') {
      await tap(page.locator('#dc-slow'));
      await expect.poll(() => clips.some((c) => c.startsWith('es-slow/'))).toBe(true);
    }
    await answerDcTask(page, tap, { wrongFirst: t.type === 'tiles' });
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __dc.session.results)).toEqual([true, true, true, true, true]); // the tiles retry is soft
  expect(clips).toContain('es/balon');
});

test('dictado: gap with «nada» (no h) and a miss counts against the word', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await page.evaluate(() => {
    const s = DC_CONTENT.stations.find((x) => x.id === 'h');
    const t = s.tasks.find((x) => x.type === 'gap' && x.say === 'oreja');
    const u = s.tasks.find((x) => x.type === 'gap' && x.say === 'hielo');
    __dc.play([t, u].map((x) => ({ ...x, station: 'h' })));
  });
  await answerDcTask(page, tap); // oreja: the right choice is «nothing»
  await tap(page.locator('#feedback .fb-actions .btn').first());
  // hielo: pick «nothing» (wrong)
  await tap(page.locator('#work .dc-opt[data-opt=""]'));
  expect((await words(page))['h.hielo']).toMatchObject({ ok: 0, miss: 1, run: 0 });
  expect((await words(page))['h.oreja']).toMatchObject({ ok: 1 });
});

test('dictado: the final is typed on the keyboard — capitals, accents, ¡!', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await page.evaluate(() => {
    const find = (id, word) => ({
      ...DC_CONTENT.stations.find((s) => s.id === id).tasks.find((t) => t.type === 'write' && t.word === word),
      station: id,
    });
    __dc.play([find('mayusculas', 'Gijón'), find('signos', '¡Golazo!'), find('g-gu', 'pingüino'), find('c-qu', 'equipo')]);
  });
  for (let i = 0; i < 4; i++) {
    await expect(page.locator('.dc-key[data-k="ñ"]')).toBeVisible();
    await answerDcTask(page, tap, { wrongFirst: i === 3 });
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __dc.session.results)).toEqual([true, true, true, true]);
});

test('dictado: the exam draws one write task per rule', async ({ page }) => {
  await open(page, `/games/${SLUG}/`);
  await page.evaluate(() => __dc.startExam());
  const tasks = await page.evaluate(() => __dc.session.tasks.map((t) => [t.type, t.station]));
  expect(tasks).toHaveLength(12);
  expect(new Set(tasks.map(([type]) => type))).toEqual(new Set(['write']));
  expect(new Set(tasks.map(([, s]) => s)).size).toBe(12);
});

test('dictado: Spanish site — no Cyrillic, a full round', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`, { lang: 'es' });
  await expectNoCyrillic(page, 'on the hub');
  await tap(page.locator('#stations .station').nth(6)); // ¿? ¡! y la coma
  await tap(page.locator('#intro-go'));
  await expectNoCyrillic(page, 'on the first task');
  await answerDcTask(page, tap);
  await expectNoCyrillic(page, 'on the feedback');
  await tap(page.locator('#feedback .fb-actions .btn').first());
  await playDcSession(page, tap);
  await expectNoCyrillic(page, 'on the finish screen');
});
