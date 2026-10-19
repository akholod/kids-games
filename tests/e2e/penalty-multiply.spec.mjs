import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { chooseTables, playPenaltyRound } from './drivers.mjs';

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

test('penalty-multiply: Spanish site — Spanish texts, no Cyrillic, a full round with the bonus', async ({ page, tap }) => {
  await open(page, `/games/${SLUG}/`, { lang: 'es' });
  await expect(page).toHaveTitle('Penaltis de multiplicar — Keeper Fun Games');
  await expect(page.locator('#intro h1')).toHaveText('Penaltis de multiplicar');
  await expect(page.locator('.chip.all')).toHaveText('Todas');
  await expectNoCyrillic(page, 'on the intro');
  await chooseTables(page, [7]);
  await tap(page.locator('#start'));
  await expect(page.locator('#round-label')).toHaveText('PENALTI 1 DE 5');
  await expect(page.locator('#goal .target').first()).toHaveAttribute('aria-label', /^Respuesta \d+$/);
  await expectNoCyrillic(page, 'on the first kick');
  // a miss: the keeper saves it, the right answer is shown
  const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
  await tap(page.locator(`#goal .target:not([data-value="${a * b}"])`).first());
  await expect(page.locator('#feedback')).toContainText(`La respuesta correcta es ${a * b}`);
  await expectNoCyrillic(page, 'on the feedback');
  await page.locator('#feedback button').click();
  for (let i = 1; i < 5; i++) {
    const [x, y] = (await page.textContent('#question')).match(/\d+/g).map(Number);
    await tap(page.locator(`#goal button[data-value="${x * y}"]`));
    await expect(page.locator('#feedback')).toContainText('¡GOOOL!');
    await tap(page.locator('#feedback button'));
  }
  await expect(page.locator('#finish h1')).toHaveText('¡Fin del partido!');
  await expect(page.locator('#final-score')).toHaveText('4 / 5');
  await expect(page.locator('#final-message')).toContainText('¡Buen partido!');
  await expect(page.locator('#final-message')).toContainText('Has ganado');
  await expectNoCyrillic(page, 'on the finish screen');
});
