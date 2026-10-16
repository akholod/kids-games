import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { openStation, playStationRound } from './drivers.mjs';

const SLUG = 'sociales-planeta';

for (const lang of [undefined, 'es']) {
  test(`sociales-planeta: loads and plays one full station${lang ? ' (es)' : ''}`, async ({ page, tap }) => {
    await open(page, `/games/${SLUG}/`, { lang });
    const stations = await page.evaluate(() => SP_CONTENT.stations.length);
    await expect(page.locator('#stations .station')).toHaveCount(stations);
    if (lang === 'es') await expectNoCyrillic(page, 'on the hub');
    const c0 = await coins(page);
    expect(await record(page, SLUG)).toBeNull();

    await openStation(page, tap, 'curiosidades');
    if (lang === 'es') await expectNoCyrillic(page, 'on the first task');
    await playStationRound(page, tap);
    if (lang === 'es') await expectNoCyrillic(page, 'on the finish screen');

    await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
    // The station tiles and the catalog record use a nota out of 10
    expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 10, max: 10 });
    expect(await coins(page)).toBeGreaterThan(c0);
    expect(await page.evaluate(() => KF.gameData('sociales-planeta').st.curiosidades)).toMatchObject({ best: 8, max: 8, plays: 1 });

    await tap(page.locator('#finish .actions .btn').last());
    await expect(page.locator('#hub')).toBeVisible();
  });
}
