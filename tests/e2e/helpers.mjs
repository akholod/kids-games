// Shared e2e helpers: deterministic Math.random, error-failing `page` fixture, page opening in test mode.
import { test as base, expect } from '@playwright/test';

export { expect };

// Fixed-seed PRNG (mulberry32), installed before any page script runs.
const seedScript = (seed) => {
  let s = seed >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const test = base.extend({
  seed: [20260101, { option: true }],

  // Touch projects tap, the laptop clicks.
  tap: async ({ hasTouch }, use) => {
    await use((locator) => (hasTouch ? locator.tap() : locator.click()));
  },

  // Every test fails on any uncaught page error or console error, and starts from a seeded Math.random.
  page: async ({ page, seed }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()} (${m.location().url})`);
    });
    await page.addInitScript(seedScript, seed);
    await use(page);
    expect(errors, 'page errors / console errors').toEqual([]);
  },
});

// Opens a page of the site in parents' test mode (per-tab sandbox, 100 coins); lang 'es' forces Spanish.
export const open = async (page, path = '/', { lang } = {}) => {
  const q = lang ? `?parent&lang=${lang}` : '?parent';
  await page.goto(path + q);
  await page.evaluate(() => document.fonts.ready);
};

export const coins = (page) => page.evaluate(() => KF.get().coins);
export const record = (page, slug) => page.evaluate((s) => KF.get().games[s] || null, slug);

// Visible text (and label attributes) with Cyrillic, outside the shared parent test-mode banner.
export const visibleCyrillic = (page) =>
  page.evaluate(() => {
    const re = /[\u0400-\u04FF]/;
    const found = [];
    const visible = (el) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !re.test(n.nodeValue) || el.closest('script,style,template,.kf-test-ribbon')) continue;
      if (visible(el)) found.push(n.nodeValue.trim().slice(0, 80));
    }
    for (const el of document.querySelectorAll('[aria-label],[title],[placeholder],[alt]')) {
      if (el.closest('.kf-test-ribbon') || !visible(el)) continue;
      for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
        const v = el.getAttribute(a);
        if (v && re.test(v)) found.push(`@${a}: ${v.slice(0, 80)}`);
      }
    }
    if (re.test(document.title)) found.push(`<title>: ${document.title}`);
    return found;
  });

export const expectNoCyrillic = async (page, label = '') => {
  expect(await visibleCyrillic(page), `Cyrillic on the Spanish site ${label}`).toEqual([]);
};
