import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { playMathSession } from './drivers.mjs';

const SLUG = 'math-exam';

for (const lang of [undefined, 'es']) {
  const tag = lang ? ' (es)' : '';

  test(`math-exam: loads and plays one full station round${tag}`, async ({ page, tap }) => {
    await open(page, `/games/${SLUG}/`, { lang });
    await expect(page.locator('#stations .station')).not.toHaveCount(0);
    if (lang === 'es') await expectNoCyrillic(page, 'on the hub');
    const c0 = await coins(page);
    expect(await record(page, SLUG)).toBeNull();

    await tap(page.locator('#stations .station').first().locator('.level').first());
    await expect(page.locator('#play')).toBeVisible();
    if (lang === 'es') await expectNoCyrillic(page, 'on the first task');
    const { n } = await playMathSession(page, tap, lang || 'uk');
    expect(n).toBeGreaterThan(3);

    await expect(page.locator('#finish')).toBeVisible();
    if (lang === 'es') await expectNoCyrillic(page, 'on the finish screen');
    const rec = await record(page, SLUG);
    expect(rec).toMatchObject({ plays: 1 });
    expect(rec.best).toBe(rec.max);
    expect(await coins(page)).toBeGreaterThan(c0);

    await tap(page.locator('#hub-btn'));
    await expect(page.locator('#hub')).toBeVisible();
  });

  test(`math-exam: the 12-task exam (several task kinds) answered all right${tag}`, async ({ page, tap }) => {
    await open(page, `/games/${SLUG}/`, { lang });
    await tap(page.locator('#exam-btn'));
    await expect(page.locator('#play')).toBeVisible();
    const { n, kinds } = await playMathSession(page, tap, lang || 'uk');
    expect(n).toBe(12);
    expect(kinds.length, `task kinds: ${kinds}`).toBeGreaterThanOrEqual(4);
    await expect(page.locator('#finish-score')).toContainText('12');
    if (lang === 'es') await expectNoCyrillic(page, 'on the exam finish screen');
    expect(await record(page, SLUG)).toMatchObject({ plays: 1 });
  });
}
