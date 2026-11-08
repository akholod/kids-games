// Creature album (second collection on the Album tab): switcher, pack opening, two-sided big card view, Spanish site, deep link.
import { test, expect, open, coins, expectNoCyrillic } from './helpers.mjs';

const toCreatures = async (page, tap) => {
  await tap(page.locator('#tab-album'));
  await tap(page.locator('#col-btn-creatures'));
  await expect(page.locator('#col-creatures')).toBeVisible();
  await expect(page.locator('#col-football')).toBeHidden();
  await expect(page.locator('#col-btn-creatures')).toHaveAttribute('aria-pressed', 'true');
};

// Opens the pack on the stage card by card (taps, «next» on a revealed card), up to the summary.
const playPack = async (page, tap) => {
  const pd = page.locator('#pack-dialog');
  await expect(pd).toHaveJSProperty('open', true);
  await expect(pd).toHaveAttribute('data-col', 'creatures');
  for (let i = 0; i < 12 && !(await page.locator('#pack-summary').isVisible()); i++) {
    await page.waitForFunction(() => !window.__album.pack?.busy);
    if (await page.locator('#pack-summary').isVisible()) break;
    // a revealed creature turns on a tap: «next» goes on
    const shown = (await page.evaluate(() => window.__album.pack.phase)) === 'front';
    await tap(page.locator(shown ? '#pack-next' : '#pack-hit'));
  }
  await expect(page.locator('#pack-summary')).toBeVisible();
};

// The face of the big card that is shown now: its side and image.
const shown = (page) => page.locator('#detail-card .cr-side.is-shown img');
const expectSide = async (page, id, side, lang = 'uk') => {
  await expect(page.locator('#detail-card')).toHaveAttribute('data-side', side);
  await expect(shown(page)).toHaveAttribute('src', new RegExp(`/creatures/${lang}/${id}${side === 'back' ? '-b' : ''}\\.webp$`));
};

// Two packs straight through KF, then the page again: the album starts with 6 creatures and no toasts.
const withCreatures = async (page, lang) => {
  await open(page, '/', { lang });
  await page.evaluate(() => {
    KF.openPack('creatures');
    KF.openPack('creatures');
  });
  await open(page, '/', { lang });
};

test('switch to creatures and open a pack to the summary', async ({ page, tap }) => {
  await open(page, '/');
  await toCreatures(page, tap);
  const total = await page.evaluate(() => KF.CREATURES.length);
  expect(total).toBe(300);
  await expect(page.locator('#cr-album .tile')).toHaveCount(total);
  await expect(page.locator('#cr-album button.tile')).toHaveCount(0);
  await expect(page.locator('#cr-filter .el-chip')).toHaveCount(12);
  const c0 = await coins(page);
  await tap(page.locator('#cr-open-pack'));
  await expect(page.locator('#pack-hit .pack-cr')).toBeVisible();
  await playPack(page, tap);
  await expect(page.locator('#sum-cards .sum-card .cr-card')).toHaveCount(3);
  expect(await coins(page)).toBe(c0 - (await page.evaluate(() => KF.PACK_PRICE)));
  const owned = await page.evaluate(() => Object.values(KF.get().creatures || {}).filter((n) => n > 0).length);
  expect(owned).toBeGreaterThan(0);
  expect(await page.evaluate(() => Object.values(KF.get().cards || {}).filter((n) => n > 0).length)).toBe(0);
  await tap(page.locator('#pack-done'));
  await expect(page.locator('#pack-dialog')).toHaveJSProperty('open', false);
  await expect(page.locator('#cr-album button.tile')).toHaveCount(owned);
  await expect(page.locator('#col-n-creatures')).toHaveText(`${owned} / ${total}`);
  // the football album is still there, untouched
  await tap(page.locator('#col-btn-football'));
  await expect(page.locator('#col-football')).toBeVisible();
  await expect(page.locator('#album .tile')).toHaveCount(await page.evaluate(() => KF.CARDS.length));
});

test('big card: flip by tap and keys, magnifier, prev/next, Esc', async ({ page, tap }) => {
  await withCreatures(page);
  await toCreatures(page, tap);
  await tap(page.locator('#cr-own [data-own="mine"]'));
  const ids = await page.locator('#cr-album button.tile:not([hidden])').evaluateAll((els) => els.map((e) => e.dataset.id));
  expect(ids.length).toBeGreaterThan(1);
  await tap(page.locator(`#cr-album button.tile[data-id="${ids[0]}"]`));
  const dd = page.locator('#card-dialog');
  await expect(dd).toHaveJSProperty('open', true);
  await expect(dd).toHaveAttribute('data-col', 'creatures');
  await expect(page.locator('#detail-actions')).toBeVisible();
  // the back image is already there (preloaded) while the front is shown
  await expect(page.locator('#detail-card .cr-back-side img')).toHaveAttribute('src', new RegExp(`/uk/${ids[0]}-b\\.webp$`));
  await expectSide(page, ids[0], 'front');
  await expect(page.locator('#detail-pos')).toHaveText(`Істота 1 / ${ids.length}`);

  await tap(page.locator('#detail-card .cr-flip'));
  await expectSide(page, ids[0], 'back');
  await tap(page.locator('#detail-flip'));
  await expectSide(page, ids[0], 'front');
  await page.keyboard.press('f');
  await expectSide(page, ids[0], 'back');
  await page.keyboard.press('F');
  await expectSide(page, ids[0], 'front');
  await page.locator('#detail-card .cr-flip').focus();
  await page.keyboard.press('Space');
  await expectSide(page, ids[0], 'back');

  // magnifier: the back at full size; Esc closes it first, the card view stays
  await tap(page.locator('#detail-zoom'));
  await expect(page.locator('#zoom-view')).toBeVisible();
  await expect(page.locator('#zoom-pic')).toHaveAttribute('src', new RegExp(`/uk/${ids[0]}-b\\.webp$`));
  await page.keyboard.press('Escape');
  await expect(page.locator('#zoom-view')).toBeHidden();
  await expect(dd).toHaveJSProperty('open', true);

  // next / prev: a new card starts on its front
  await page.keyboard.press('ArrowRight');
  await expectSide(page, ids[1], 'front');
  await expect(page.locator('#detail-pos')).toHaveText(`Істота 2 / ${ids.length}`);
  await page.keyboard.press('f');
  await expectSide(page, ids[1], 'back');
  await tap(page.locator('#detail-prev'));
  await expectSide(page, ids[0], 'front');
  await tap(page.locator('#detail-next'));
  await expectSide(page, ids[1], 'front');

  await page.keyboard.press('Escape');
  await expect(dd).toHaveJSProperty('open', false);
  await expect(page.locator(`#cr-album button.tile[data-id="${ids[1]}"]`)).toBeFocused();
});

test('Spanish site: Spanish only, Spanish images', async ({ page, tap }) => {
  await withCreatures(page, 'es');
  await toCreatures(page, tap);
  await expect(page.locator('#col-creatures h2')).toHaveText('Criaturas mágicas');
  await expectNoCyrillic(page, 'on the creature album');
  const src = await page.locator('#cr-album button.tile img').first().getAttribute('src');
  expect(src).toMatch(/\/creatures\/es\/thumb\/c\d{3}\.webp$/);

  await tap(page.locator('#cr-open-pack'));
  await expect(page.locator('#pack-dialog')).toHaveJSProperty('open', true);
  await expectNoCyrillic(page, 'in the creature pack');
  await tap(page.locator('#pack-skip'));
  await expect(page.locator('#pack-summary')).toBeVisible();
  await expectNoCyrillic(page, 'in the creature pack summary');
  await tap(page.locator('#pack-done'));

  const id = await page.locator('#cr-album button.tile').first().getAttribute('data-id');
  await tap(page.locator('#cr-album button.tile').first());
  await expectSide(page, id, 'front', 'es');
  await expect(page.locator('#detail-flip')).toContainText('Dale la vuelta');
  await expectNoCyrillic(page, 'on the big card');
  await tap(page.locator('#detail-flip'));
  await expectSide(page, id, 'back', 'es');
  await tap(page.locator('#detail-zoom'));
  await expect(page.locator('#zoom-pic')).toHaveAttribute('src', new RegExp(`/es/${id}-b\\.webp$`));
  await expectNoCyrillic(page, 'in the magnifier');
});

test('deep link #creatures opens the creature album; the choice is remembered', async ({ page, tap }) => {
  await page.goto('/?parent#creatures');
  await expect(page.locator('#tab-album')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#col-creatures')).toBeVisible();
  await page.goto('/?parent#football');
  await expect(page.locator('#tab-album')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#col-football')).toBeVisible();
  // remembered: switch to creatures, come back without a hash
  await tap(page.locator('#col-btn-creatures'));
  await page.goto('/?parent');
  await tap(page.locator('#tab-album'));
  await expect(page.locator('#col-creatures')).toBeVisible();
});

test('beta: without ?parent the album has only football cards and no creature awards', async ({ page, tap }) => {
  await page.goto('/#creatures');
  await expect(page.locator('#panel-album')).toBeVisible();
  await expect(page.locator('#col-switch')).toBeHidden();
  await expect(page.locator('#col-creatures')).toBeHidden();
  await expect(page.locator('#col-football')).toBeVisible();
  expect(await page.evaluate(() => [KF.TEST_MODE, KF.CREATURES.length])).toEqual([false, 0]);
  expect(await page.evaluate(() => KF.ACHIEVEMENTS.some((a) => a.id.startsWith('creature')))).toBe(false);
  await tap(page.locator('#tab-games'));
});

// Pack stage: up to the next revealed card (special cards wait face down for a tap).
const reveal = async (page, tap) => {
  for (let i = 0; i < 6; i++) {
    await page.waitForFunction(() => !window.__album.pack?.busy);
    if ((await page.evaluate(() => window.__album.pack.phase)) === 'front') return;
    await tap(page.locator('#pack-hit'));
  }
  throw new Error('no card revealed');
};
const packSide = async (page, id, side, lang = 'uk') => {
  await expect(page.locator('#pack-hit')).toHaveAttribute('data-side', side);
  await expect(page.locator('#pack-hit .cr-side.is-shown img')).toHaveAttribute(
    'src',
    new RegExp(`/creatures/${lang}/${id}${side === 'back' ? '-b' : ''}\\.webp$`),
  );
};

for (const lang of [undefined, 'es']) {
  const L = lang || 'uk';
  test(`pack (${L}): a revealed creature turns front/back by tap, button and F/Space; next by button, Enter and →`, async ({
    page,
    tap,
  }) => {
    await open(page, '/', { lang });
    await toCreatures(page, tap);
    await tap(page.locator('#cr-open-pack'));
    const ids = await page.evaluate(() => window.__album.pack.ids);
    await reveal(page, tap);
    await expect(page.locator('#pack-actions')).toBeVisible();
    await expect(page.locator('#pack-flip')).toContainText(lang ? 'Dale la vuelta' : 'Переверни');
    await expect(page.locator('#pack-next')).toHaveText(lang ? 'Siguiente →' : 'Далі →');
    // the back is already loading while the front is shown
    await expect(page.locator('#pack-hit .cr-back-side img')).toHaveAttribute('src', new RegExp(`/${L}/${ids[0]}-b\\.webp$`));
    await packSide(page, ids[0], 'front', L);
    if (lang) await expectNoCyrillic(page, 'on a revealed pack card');

    await tap(page.locator('#pack-hit')); // tap on the card = turn it
    await packSide(page, ids[0], 'back', L);
    await expect(page.locator('#pack-zoom-btn')).toBeVisible();
    if (lang) await expectNoCyrillic(page, 'on the back of a pack card');
    await tap(page.locator('#pack-flip'));
    await packSide(page, ids[0], 'front', L);
    await expect(page.locator('#pack-zoom-btn')).toBeHidden();
    await page.locator('#pack-hit').focus();
    await page.keyboard.press('f');
    await packSide(page, ids[0], 'back', L);
    await page.keyboard.press('Space');
    await packSide(page, ids[0], 'front', L);
    await page.keyboard.press('Space');
    await packSide(page, ids[0], 'back', L);

    // magnifier on the back; Esc closes only it
    await tap(page.locator('#pack-zoom-btn'));
    await expect(page.locator('#pack-zoom')).toBeVisible();
    await expect(page.locator('#pack-zoom-pic')).toHaveAttribute('src', new RegExp(`/${L}/${ids[0]}-b\\.webp$`));
    if (lang) await expectNoCyrillic(page, 'in the pack magnifier');
    await page.keyboard.press('Escape');
    await expect(page.locator('#pack-zoom')).toBeHidden();
    expect(await page.evaluate(() => window.__album.pack.phase)).toBe('front');

    // next by the button: the next card starts on its front
    await tap(page.locator('#pack-next'));
    await reveal(page, tap);
    expect(await page.evaluate(() => window.__album.pack.i)).toBe(1);
    await packSide(page, ids[1], 'front', L);
    await page.keyboard.press('F');
    await packSide(page, ids[1], 'back', L);
    // next by Enter (focus stays on the stage)
    await page.keyboard.press('Enter');
    await reveal(page, tap);
    expect(await page.evaluate(() => window.__album.pack.i)).toBe(2);
    await packSide(page, ids[2], 'front', L);
    await expect(page.locator('#pack-next')).toHaveText(lang ? 'Ver las tres →' : 'Усі три →');
    // → on the last card: the summary
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#pack-summary')).toBeVisible();
    await expect(page.locator('#pack-actions')).toBeHidden();

    // summary: a creature opens in the big two-sided view; Esc comes back to the summary
    await tap(page.locator('#sum-cards .sum-card').first());
    await expect(page.locator('#card-dialog')).toHaveJSProperty('open', true);
    await expectSide(page, ids[0], 'front', L);
    await tap(page.locator('#detail-flip'));
    await expectSide(page, ids[0], 'back', L);
    await page.keyboard.press('Escape');
    await expect(page.locator('#card-dialog')).toHaveJSProperty('open', false);
    await expect(page.locator('#pack-dialog')).toHaveJSProperty('open', true);
    await expect(page.locator('#sum-cards .sum-card').first()).toBeFocused();
  });
}
