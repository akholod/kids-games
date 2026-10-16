// Coin rules that must not drift: easy content pays less, the perfect-round bonus is paid until a level is done perfectly once.
import { test, expect, open, coins } from './helpers.mjs';
import { chooseTables, playPenaltyRound, openStation, playStationRound } from './drivers.mjs';

test('penalty-multiply: only table ×2, perfect round = +2 coins and a hint about tables 6–9', async ({ page, tap }) => {
  await open(page, '/games/penalty-multiply/');
  await chooseTables(page, [2]);
  const c0 = await coins(page);
  await playPenaltyRound(page, tap);
  await expect(page.locator('#final-score')).toHaveText('5 / 5');
  expect((await coins(page)) - c0).toBe(2);
  await expect(page.locator('#final-message')).toContainText('Зароблено 2 🪙');
  await expect(page.locator('#final-message')).toContainText('таблицю 6, 7, 8 чи 9');
});

test('penalty-multiply: only table ×7, perfect round = +10 coins (5 goals at a coin each + the +5 bonus of a hard table)', async ({
  page,
  tap,
}) => {
  await open(page, '/games/penalty-multiply/');
  await chooseTables(page, [7]);
  const c0 = await coins(page);
  await playPenaltyRound(page, tap);
  await expect(page.locator('#final-score')).toHaveText('5 / 5');
  expect((await coins(page)) - c0).toBe(10);
  await expect(page.locator('#final-message')).toContainText('є бонус за 5 голів');
});

test('sociales-planeta: the same station perfect twice pays +13, then +8 (bonus only once)', async ({ page, tap }) => {
  await open(page, '/games/sociales-planeta/');
  for (const expected of [13, 8]) {
    const c0 = await coins(page);
    await openStation(page, tap, 'curiosidades');
    await playStationRound(page, tap);
    await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
    expect((await coins(page)) - c0).toBe(expected);
    await tap(page.locator('#finish .actions .btn').last()); // «A las estaciones»
    await expect(page.locator('#hub')).toBeVisible();
  }
});
