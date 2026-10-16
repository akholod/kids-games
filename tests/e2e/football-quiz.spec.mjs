import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';

const SLUG = 'football-quiz';

// Plays one whole round answering every question right; returns the number of questions.
const playPerfectRound = async (page, tap, { lang } = {}) => {
  await tap(page.locator('#start-btn'));
  await expect(page.locator('#play')).toBeVisible();
  let n = 0;
  while ((await page.evaluate(() => window.__quiz.screen)) === 'play') {
    const c = await page.evaluate(() => window.__quiz.correctIndex);
    if (n === 0 && lang === 'es') await expectNoCyrillic(page, 'on the first question');
    await tap(page.locator('#choices .choice').nth(c));
    await expect(page.locator('#feedback .btn')).toBeVisible();
    if (n === 0 && lang === 'es') await expectNoCyrillic(page, 'on the first feedback');
    await tap(page.locator('#feedback .btn'));
    n++;
    expect(n).toBeLessThanOrEqual(20);
  }
  return n;
};

for (const lang of [undefined, 'es']) {
  test(`football-quiz: loads and plays one full round${lang ? ' (es)' : ''}`, async ({ page, tap }) => {
    await open(page, `/games/${SLUG}/`, { lang });
    await expect(page.locator('#start-btn')).toBeVisible();
    expect(await page.evaluate(() => window.QUIZ_QUESTIONS.length)).toBeGreaterThan(50);
    if (lang === 'es') {
      expect(await page.evaluate(() => document.documentElement.lang)).toBe('es');
      await expectNoCyrillic(page, 'on the start screen');
    }
    const c0 = await coins(page);
    expect(await record(page, SLUG)).toBeNull();

    const n = await playPerfectRound(page, tap, { lang });
    expect(n).toBe(12);
    await expect(page.locator('#finish')).toBeVisible();
    await expect(page.locator('#finish-score')).toHaveText('12 / 12');
    if (lang === 'es') await expectNoCyrillic(page, 'on the finish screen');

    const rec = await record(page, SLUG);
    expect(rec).toMatchObject({ plays: 1, best: 12, max: 12 });
    expect(await coins(page)).toBeGreaterThan(c0);
  });
}
