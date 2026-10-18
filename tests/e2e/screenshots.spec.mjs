// Phone-only visual guard for behavior-preserving refactors: start screen + first task of every game, catalog top.
// Baselines live in tests/e2e/screenshots.spec.mjs-snapshots/ (Linux Chrome); refresh with
//   pnpm test:e2e screenshots --update-snapshots
import { test, expect, open } from './helpers.mjs';
import { openStation } from './drivers.mjs';

const snap = async (page, name) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page).toHaveScreenshot(`${name}.png`);
};

test('catalog top', async ({ page }) => {
  await open(page, '/');
  await snap(page, 'catalog');
});

test('football-quiz: start screen and first question', async ({ page, tap }) => {
  await open(page, '/games/football-quiz/');
  await snap(page, 'football-quiz-start');
  await tap(page.locator('#start-btn'));
  await expect(page.locator('#choices .choice')).toHaveCount(4);
  await snap(page, 'football-quiz-question');
});

test('math-exam: stations and first task', async ({ page, tap }) => {
  await open(page, '/games/math-exam/');
  await snap(page, 'math-exam-hub');
  await tap(page.locator('#stations .station').first().locator('.level').first());
  await expect(page.locator('#work .choice').first()).toBeVisible();
  await snap(page, 'math-exam-task');
});

test('penalty-multiply: start screen and first kick', async ({ page, tap }) => {
  await open(page, '/games/penalty-multiply/');
  await snap(page, 'penalty-multiply-start');
  await tap(page.locator('#start'));
  await expect(page.locator('#goal button')).toHaveCount(3);
  await snap(page, 'penalty-multiply-kick');
});

test('goalkeeper: start screen and the coach lesson', async ({ page, tap }) => {
  // The match itself is timing-based: the lesson is its first static screen.
  await open(page, '/games/goalkeeper/');
  await snap(page, 'goalkeeper-start');
  await tap(page.locator('#start-btn'));
  await expect(page.locator('#lesson-screen')).toBeVisible();
  await snap(page, 'goalkeeper-lesson');
});

test('sociales-planeta: stations and first task', async ({ page, tap }) => {
  await open(page, '/games/sociales-planeta/');
  await snap(page, 'sociales-planeta-hub');
  await openStation(page, tap, 'curiosidades');
  await expect(page.locator('#work .choice').first()).toBeVisible();
  await snap(page, 'sociales-planeta-task');
});

test('coach-simon: start screen and the memory turn', async ({ page, tap }) => {
  await open(page, '/games/coach-simon/');
  await snap(page, 'coach-simon-start');
  await page.evaluate(() => (window.__simon.timeScale = 0.05));
  await tap(page.locator('#start'));
  await page.waitForFunction(() => __simon.phase === 'input');
  await page.waitForTimeout(300); // the last light fades
  await snap(page, 'coach-simon-memory');
});
