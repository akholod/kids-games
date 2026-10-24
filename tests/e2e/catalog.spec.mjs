import { test, expect, open, coins, expectNoCyrillic } from './helpers.mjs';

for (const lang of [undefined, 'es']) {
  const name = lang === 'es' ? 'catalog (es)' : 'catalog (uk)';

  test.describe(name, () => {
    test('lists exactly the listed games of KF.siteGames()', async ({ page }) => {
      await open(page, '/', { lang });
      expect(await page.evaluate(() => KF.lang)).toBe(lang || 'uk');
      const expected = await page.evaluate(() => KF.siteGames().map((g) => ({ slug: g.slug, title: g.title, playable: KF.isPlayable(g) })));
      expect(expected.length).toBeGreaterThan(0);
      const cards = page.locator('#games-list .game-card');
      await expect(cards).toHaveCount(expected.length);
      const shown = await cards.evaluateAll((els) =>
        els.map((e) => ({ href: e.getAttribute('href'), title: e.querySelector('strong').firstChild.textContent.trim() })),
      );
      // Cards are grouped by category: compare as sets.
      expect(shown.map((c) => c.title).sort()).toEqual(expected.map((g) => g.title).sort());
      expect(
        shown
          .filter((c) => c.href)
          .map((c) => c.href)
          .sort(),
      ).toEqual(
        expected
          .filter((g) => g.playable)
          .map((g) => `games/${g.slug}/`)
          .sort(),
      );
      if (lang === 'es') {
        const sites = await page.evaluate(() => KF.siteGames().map((g) => KF.GAMES.find((x) => x.slug === g.slug).sites));
        expect(sites.every((s) => s.includes('es'))).toBe(true);
        await expectNoCyrillic(page, 'on the catalog');
      }
    });

    test('album: open it and buy a pack in test mode', async ({ page }) => {
      await open(page, '/', { lang });
      await page.click('#tab-album');
      const total = await page.evaluate(() => KF.CARDS.length);
      await expect(page.locator('#album .tile')).toHaveCount(total);
      const c0 = await coins(page);
      expect(c0).toBe(100);
      const price = await page.evaluate(() => KF.PACK_PRICE);
      await page.click('#open-pack');
      await expect(page.locator('#pack-dialog')).toHaveJSProperty('open', true);
      if (lang === 'es') await expectNoCyrillic(page, 'in the pack dialog');
      await page.click('#pack-skip');
      await expect(page.locator('#pack-summary')).toBeVisible();
      expect(await coins(page)).toBe(c0 - price);
      const owned = await page.evaluate(() => Object.values(KF.get().cards).filter((n) => n > 0).length);
      expect(owned).toBeGreaterThan(0);
      if (lang === 'es') await expectNoCyrillic(page, 'in the pack summary');
      await page.click('#pack-done');
      await expect(page.locator('#pack-dialog')).toHaveJSProperty('open', false);
      if (lang === 'es') {
        await page.click('#tab-awards');
        await expectNoCyrillic(page, 'on achievements');
      }
    });
  });
}

// The Spanish Worker answers /shared/site.js with lang 'es': until the page scripts have translated the static HTML (which
// carries the Ukrainian defaults), the page stays hidden, so a slow connection never shows Ukrainian text.
test('Spanish site: the page stays hidden until it is translated, then shows Spanish only', async ({ page }) => {
  await page.route('**/shared/site.js', (r) =>
    r.fulfill({
      contentType: 'application/javascript',
      body: "window.KF_SITE = { lang: 'es' };\ndocument.documentElement.dataset.site = 'es';\n",
    }),
  );
  let release = () => {};
  const gate = new Promise((r) => {
    release = r;
  });
  await page.route('**/shared/kf.js', async (r) => {
    await gate;
    await r.continue();
  });
  const loaded = page.goto('/games/penalty-multiply/?parent');
  await page.waitForFunction(() => document.body?.querySelector('#intro') && document.documentElement.dataset.site === 'es');
  expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('hidden');
  release();
  await loaded;
  await expect(page.locator('html')).toHaveClass(/kf-ready/);
  expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('visible');
  await expect(page.locator('#intro h1')).toHaveText('Penaltis de multiplicar');
  await expectNoCyrillic(page, 'once translated');
});

test('Ukrainian site: the page is never hidden', async ({ page }) => {
  await open(page, '/');
  expect(await page.evaluate(() => document.documentElement.dataset.site)).toBe('uk');
  expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('visible');
});
