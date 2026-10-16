import { test, expect, open, coins, record } from './helpers.mjs';
import { playGoalkeeperMatch } from './drivers.mjs';

const SLUG = 'goalkeeper';

test('goalkeeper: loads and plays one full match', async ({ page, tap }) => {
  test.setTimeout(90_000);
  await open(page, `/games/${SLUG}/`);
  await expect(page.locator('#start-btn')).toBeVisible();
  const c0 = await coins(page);
  expect(await record(page, SLUG)).toBeNull();

  await playGoalkeeperMatch(page, tap);

  await expect(page.locator('#end-screen')).toBeVisible();
  await expect(page.locator('#end-score')).toHaveText('6 / 6 сейвів');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 6, max: 6 });
  expect(await coins(page)).toBeGreaterThan(c0);
});
