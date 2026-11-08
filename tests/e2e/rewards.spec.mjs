// Coin rules that must not drift: easy content pays less, the perfect-round bonus is paid until a level is done perfectly once.
import { test, expect, open, coins } from './helpers.mjs';
import { chooseTables, playPenaltyRound, openStation, playStationRound } from './drivers.mjs';

test('penalty-multiply: only table ×2, perfect round = +6 coins (12 goals at half a coin) and a hint about tables 6–9', async ({
  page,
  tap,
}) => {
  await open(page, '/games/penalty-multiply/');
  await chooseTables(page, [2]);
  const c0 = await coins(page);
  await playPenaltyRound(page, tap);
  await expect(page.locator('#final-score')).toHaveText('12 / 12');
  expect((await coins(page)) - c0).toBe(6);
  await expect(page.locator('#final-message')).toContainText('Зароблено 6 🪙');
  await expect(page.locator('#final-message')).toContainText('таблицю 6, 7, 8 чи 9');
});

test('penalty-multiply: only table ×7, perfect round = a coin a goal (half for 7×2, 7×3, 7×10) + the +5 bonus of a hard table', async ({
  page,
  tap,
}) => {
  await open(page, '/games/penalty-multiply/');
  await chooseTables(page, [7]);
  const c0 = await coins(page);
  const seen = await playPenaltyRound(page, tap);
  await expect(page.locator('#final-score')).toHaveText('12 / 12');
  const easy = seen.filter(([, b]) => [2, 3, 10].includes(b)).length;
  expect(easy).toBeLessThanOrEqual(2);
  expect((await coins(page)) - c0).toBe(Math.floor(12 - easy / 2) + 5);
  await expect(page.locator('#final-message')).toContainText('є бонус за 12 голів');
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
