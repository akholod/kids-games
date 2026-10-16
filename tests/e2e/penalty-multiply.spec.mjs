import { test, expect, open, coins, record } from './helpers.mjs';
import { playPenaltyRound } from './drivers.mjs';

const SLUG = 'penalty-multiply';

test('penalty-multiply: loads and plays one full round', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`);
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('.chip')).toHaveCount(10);
  const c0 = await coins(page);
  expect(await record(page, SLUG)).toBeNull();

  await playPenaltyRound(page, tap);

  await expect(page.locator('#final-score')).toHaveText('5 / 5');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 5, max: 5 });
  expect(await coins(page)).toBeGreaterThan(c0);

  // "Ще раз" starts a fresh round
  await tap(page.locator('#again'));
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#round-label')).toContainText('1');
});
