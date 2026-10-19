// Laptop guard: a task screen fits a short laptop window (1366×768 minus browser UI) without page scroll,
// and after answering the "next" button is on screen. Pages open in ?parent mode, so the 48px test ribbon is included.
import { test, expect, open } from './helpers.mjs';
import { answerChTask, answerCurrentTask, answerWordTask, openStation, playChTasks, playWordTasks, solveMathTask } from './drivers.mjs';

test.use({ viewport: { width: 1366, height: 657 } });

const overflow = (page) => page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight);

const expectFits = async (page, what) => {
  await page.waitForTimeout(150); // let layout settle (fonts, sizes measured by the engine)
  expect(await overflow(page), `${what}: page scroll`).toBeLessThanOrEqual(2);
};

// The button is fully inside the window (the game may have scrolled itself to show it).
const expectOnScreen = async (page, locator, what) => {
  await expect(locator, what).toBeVisible();
  await page.waitForTimeout(400); // smooth "settle" scroll after answering
  const box = await locator.boundingBox();
  const h = await page.evaluate(() => innerHeight);
  expect(box.y, `${what}: top`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${what}: bottom`).toBeLessThanOrEqual(h);
};

test('math-exam: first task of every station and of the exam fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/math-exam/');
  const n = await page.locator('#stations .station').count();
  for (let i = 0; i < n; i++) {
    await open(page, '/games/math-exam/');
    await tap(page.locator('#stations .station').nth(i).locator('.level').first());
    await expect(page.locator('#play')).toBeVisible();
    await expectFits(page, `station ${i + 1}`);
    await solveMathTask(page, tap);
    await expectOnScreen(page, page.locator('#feedback button').first(), `station ${i + 1} next`);
  }
  await open(page, '/games/math-exam/');
  await tap(page.locator('#exam-btn'));
  await expectFits(page, 'exam');
});

test('sociales-planeta: first task of every station fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/sociales-planeta/');
  const ids = await page.evaluate(() => SP_CONTENT.stations.map((s) => s.id));
  for (const id of ids) {
    await open(page, '/games/sociales-planeta/');
    await page.evaluate((s) => __sp.startStation(s), id);
    await expect(page.locator('#play')).toBeVisible();
    await expectFits(page, id);
  }
  await open(page, '/games/sociales-planeta/');
  await openStation(page, tap, 'curiosidades');
  await answerCurrentTask(page, tap);
  await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), 'curiosidades next');
});

test('football-quiz: question fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/football-quiz/');
  await tap(page.locator('#start-btn'));
  await expect(page.locator('#choices .choice')).toHaveCount(4);
  await expectFits(page, 'question');
  await tap(page.locator('#choices .choice').first());
  await expectOnScreen(page, page.locator('#feedback button').first(), 'next');
});

test('penalty-multiply: start, kick and feedback fit', async ({ page, tap }) => {
  await open(page, '/games/penalty-multiply/');
  await expectFits(page, 'intro');
  await tap(page.locator('#start'));
  await expectFits(page, 'kick');
  const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
  await tap(page.locator(`#goal button[data-value="${a * b}"]`));
  await expectOnScreen(page, page.locator('#feedback button'), 'next');
  await expectFits(page, 'feedback');
});

test('goalkeeper: start screen fits', async ({ page }) => {
  await open(page, '/games/goalkeeper/');
  await expectFits(page, 'start');
  await expectOnScreen(page, page.locator('#start-btn'), 'start button');
});

test('coach-simon: intro, memory play, commands feedback and finish fit', async ({ page, tap }) => {
  await open(page, '/games/coach-simon/');
  await expectFits(page, 'intro memory');
  await tap(page.locator('[data-mode="commands"]'));
  await expectFits(page, 'intro commands');
  await expectOnScreen(page, page.locator('#start'), 'start button');
  await page.evaluate(() => (window.__simon.timeScale = 0.4));
  await tap(page.locator('#start'));
  await page.waitForFunction(() => __simon.phase === 'input');
  await expectFits(page, 'commands shot');
  const cmd = await page.evaluate(() => __simon.cmd);
  await tap(page.locator(`button.zone[data-zone="${cmd.zone}"]`));
  await expectOnScreen(page, page.locator('#feedback button'), 'next');
  await expectFits(page, 'commands feedback');
});

test('word-match: every task type fits; next button visible', async ({ page, tap }) => {
  await open(page, '/games/word-match/');
  const types = await playWordTasks(page, 'clothes', ['pic', 'text', 'listen', 'spell', 'pairs']);
  for (const type of types) {
    await expectFits(page, type);
    await answerWordTask(page, tap);
    await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${type} next`);
    await tap(page.locator('#feedback .fb-actions .btn').first());
  }
});

test('chytanka: every task type fits (the longest words); next button visible', async ({ page, tap }) => {
  await open(page, '/games/chytanka/');
  for (const station of ['dnipro', 'kharkiv']) {
    const types = await playChTasks(page, station, ['read', 'pic', 'hear', 'build', 'gap', 'story']);
    for (const type of types) {
      await expectFits(page, `${station} ${type}`);
      await answerChTask(page, tap);
      await expectOnScreen(page, page.locator('#feedback .fb-actions .btn').first(), `${station} ${type} next`);
      await tap(page.locator('#feedback .fb-actions .btn').first());
    }
  }
});
