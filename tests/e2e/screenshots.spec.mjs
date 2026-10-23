// Phone-only visual guard for behavior-preserving refactors: start screen + first task of every game, catalog top.
// Baselines live in tests/e2e/screenshots.spec.mjs-snapshots/ (Linux Chrome); refresh with
//   pnpm test:e2e screenshots --update-snapshots
import { test, expect, open } from './helpers.mjs';
import { openStation, playChTasks, playDcTasks, playWordTasks, unitPage } from './drivers.mjs';

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

test('naturales-entorno-hub: stations and the hero', async ({ page }) => {
  await open(page, '/games/naturales-entorno/');
  await expect(page.locator('#hero-art svg.cn-hero')).toBeVisible();
  await snap(page, 'naturales-entorno-hub');
});

test('lengua-mundo-hub: stations and the hero', async ({ page }) => {
  await open(page, '/games/lengua-mundo/');
  await expect(page.locator('#hero-art svg.le-hero')).toBeVisible();
  await snap(page, 'lengua-mundo-hub');
});

test('lengua-mundo-read: the reading screen of the baobab legend', async ({ page, tap }) => {
  await open(page, '/games/lengua-mundo/');
  await unitPage('LE_CONTENT', '__le').startFromIntro(page, tap, 'baobab');
  await expect(page.locator('#read-screen')).toBeVisible();
  await snap(page, 'lengua-mundo-read');
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

test('word-match: hub and a spell task', async ({ page }) => {
  await open(page, '/games/word-match/');
  await snap(page, 'word-match-hub');
  await playWordTasks(page, 'animals', ['spell']);
  await expect(page.locator('.wm-spell')).toBeVisible();
  await snap(page, 'word-match-spell');
});

test('chytanka: hub and a read task by syllables', async ({ page }) => {
  await open(page, '/games/chytanka/');
  await snap(page, 'chytanka-hub');
  await playChTasks(page, 'kyiv', ['read']);
  await expect(page.locator('.ch-word.is-split')).toBeVisible();
  await snap(page, 'chytanka-read');
});

test('dictado: hub and the typed final', async ({ page }) => {
  await open(page, '/games/dictado/');
  await snap(page, 'dictado-hub');
  await playDcTasks(page, 'mp-mb', ['write']);
  await expect(page.locator('.dc-key[data-k="ñ"]')).toBeVisible();
  await snap(page, 'dictado-write');
});

test('profile: the player card and the shirt editor', async ({ page }) => {
  await open(page, '/');
  await page.evaluate(() => KF.auth.login(1, '1234'));
  await page.goto('/profile/');
  await expect(page.locator('#pc-kit svg')).toBeVisible();
  await snap(page, 'profile');
});
