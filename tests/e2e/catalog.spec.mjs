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
      const shown = await cards.evaluateAll((els) => els.map((e) => ({ href: e.getAttribute('href'), title: e.querySelector('strong').firstChild.textContent.trim() })));
      // Cards are grouped by category: compare as sets.
      expect(shown.map((c) => c.title).sort()).toEqual(expected.map((g) => g.title).sort());
      expect(shown.filter((c) => c.href).map((c) => c.href).sort()).toEqual(expected.filter((g) => g.playable).map((g) => `games/${g.slug}/`).sort());
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
