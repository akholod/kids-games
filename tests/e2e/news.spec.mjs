// «What's new» dialog on the catalog: own shared/news.js entries (dates relative to today), test mode.
// Runs on laptop + phone and on the news-only projects ipad / iphone / android / safari.
import { test, expect, open, visibleCyrillic } from './helpers.mjs';

const day = (ago) => new Date(Date.now() - ago * 864e5).toISOString().slice(0, 10);

// Newest first: game (today), link (1 day ago), plain (2 days ago); 'old' is outside the 21-day window.
const NEWS = [
  {
    id: 't-plain',
    date: day(2),
    sites: ['uk', 'es'],
    icon: '🎉',
    uk: { title: 'Тест: просто новина', text: 'Без посилання.' },
    es: { title: 'Prueba: solo una noticia', text: 'Sin enlace.' },
  },
  {
    id: 't-game',
    date: day(0),
    sites: ['uk', 'es'],
    icon: '🧮',
    game: 'math-exam',
    uk: { title: 'Тест: нова гра', text: 'Грай у математику.' },
    es: { title: 'Prueba: juego nuevo', text: 'Juega a las mates.' },
  },
  {
    id: 't-old',
    date: day(40),
    sites: ['uk', 'es'],
    icon: '🦕',
    uk: { title: 'Тест: стара новина', text: 'Давно.' },
    es: { title: 'Prueba: noticia vieja', text: 'Hace mucho.' },
  },
  {
    id: 't-link',
    date: day(1),
    sites: ['uk', 'es'],
    icon: '🐲',
    link: '#creatures',
    uk: { title: 'Тест: істоти', text: 'Нова колекція.' },
    es: { title: 'Prueba: criaturas', text: 'Colección nueva.' },
  },
];
const SHOWN = ['t-game', 't-link', 't-plain'];
const UK_TITLES = ['Тест: нова гра', 'Тест: істоти', 'Тест: просто новина'];
const ES_TITLES = ['Prueba: juego nuevo', 'Prueba: criaturas', 'Prueba: solo una noticia'];

// Registered after the helpers' empty-news route, so it wins.
const routeNews = (page, news = NEWS) =>
  page.route('**/shared/news.js', (r) =>
    r.fulfill({ contentType: 'application/javascript', body: `window.KF_NEWS = ${JSON.stringify(news)};` }),
  );

const dialog = (page) => page.locator('#news-dialog');
const items = (page) => page.locator('#news-list .news-item');
const seen = (page) => page.evaluate(() => [...KF.get().newsSeen].sort());

// The dialog may open a moment after load (auth); "stays closed" = still closed after a while.
const expectStaysClosed = async (page) => {
  await page.waitForFunction(() => !!window.KF);
  await page.waitForTimeout(1500);
  await expect(dialog(page)).toBeHidden();
};

test("opens with this site's news, newest first; «Круто!» closes it and marks them seen; a reload shows nothing", async ({ page, tap }) => {
  await routeNews(page);
  await open(page, '/');
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#news-title')).toHaveText('Що нового');
  await expect(items(page)).toHaveCount(3);
  expect(await items(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-id')))).toEqual(SHOWN);
  for (const [i, t] of UK_TITLES.entries()) await expect(items(page).nth(i)).toContainText(t);
  // a modal dialog, alone: no other dialog under it
  expect(await page.evaluate(() => [...document.querySelectorAll('dialog[open]')].map((d) => d.id))).toEqual(['news-dialog']);
  // links only where there is something to open
  expect(await items(page).evaluateAll((els) => els.map((e) => [e.tagName, e.getAttribute('href')]))).toEqual([
    ['A', 'games/math-exam/'],
    ['A', '#creatures'],
    [expect.not.stringMatching(/^A$/), null],
  ]);

  await tap(page.locator('#news-ok'));
  await expect(dialog(page)).toBeHidden();
  expect(await seen(page)).toEqual([...SHOWN].sort());

  await page.reload();
  await expectStaysClosed(page);
  expect(await page.evaluate(() => KF.news().length)).toBe(0);
});

test('Esc closes it and marks the news seen', async ({ page }) => {
  await routeNews(page);
  await open(page, '/');
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog(page)).toBeHidden();
  expect(await seen(page)).toEqual([...SHOWN].sort());
  await page.reload();
  await expectStaysClosed(page);
});

test('a game item opens the game, and the shown news are seen', async ({ page, tap }) => {
  await routeNews(page);
  await open(page, '/');
  await tap(page.locator('#news-list .news-item[data-id="t-game"]'));
  await expect(page).toHaveURL(/\/games\/math-exam\/(\?.*)?$/);
  expect(await seen(page)).toEqual([...SHOWN].sort());
});

test('the #creatures item opens the creature album', async ({ page, tap, hasTouch }) => {
  await routeNews(page);
  await open(page, '/');
  const item = page.locator('#news-list .news-item[data-id="t-link"]');
  if (hasTouch) {
    // WebKit's locator.tap() often never returns after this same-page hash link (the album does open):
    // tap the item's centre with the raw touchscreen instead.
    const box = await item.boundingBox();
    if (!box) throw new Error('no news item box');
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  } else await tap(item);
  await expect(dialog(page)).toBeHidden();
  await expect(page.locator('#tab-album')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#col-creatures')).toBeVisible();
  await expect(page.locator('#col-football')).toBeHidden();
  expect(await seen(page)).toEqual([...SHOWN].sort());
});

test('no news -> no dialog', async ({ page }) => {
  // the helpers' route serves an empty list
  await open(page, '/');
  await expectStaysClosed(page);
});

test('only old or future news -> no dialog', async ({ page }) => {
  await routeNews(page, [{ ...NEWS[2] }, { ...NEWS[0], id: 't-future', date: day(-2) }]);
  await open(page, '/');
  await expectStaysClosed(page);
});

test('?lang=es: Spanish texts, no Cyrillic', async ({ page, tap }) => {
  await routeNews(page);
  await open(page, '/', { lang: 'es' });
  await expect(dialog(page)).toBeVisible();
  await expect(page.locator('#news-title')).toHaveText('Novedades');
  await expect(items(page)).toHaveCount(3);
  for (const [i, t] of ES_TITLES.entries()) await expect(items(page).nth(i)).toContainText(t);
  // the whole visible page while the dialog is open (everything under a modal dialog is still visible)
  expect(await visibleCyrillic(page), 'Cyrillic on the Spanish site with the news dialog').toEqual([]);
  await expect(page.locator('#news-ok')).not.toHaveText(/^\s*$/);
  await tap(page.locator('#news-ok'));
  await expect(dialog(page)).toBeHidden();
});

test('the dialog fits the viewport with 4 items', async ({ page }) => {
  const four = [0, 1, 2, 3].map((i) => ({
    ...NEWS[0],
    id: `t-${i}`,
    date: day(i),
    uk: { title: `Тест ${i}`, text: 'Довгий текст новини, щоб картка мала два рядки і більше на вузькому екрані телефона.' },
  }));
  await routeNews(page, four);
  await open(page, '/');
  await expect(dialog(page)).toBeVisible();
  await expect(items(page)).toHaveCount(4);
  await expect(page.locator('#news-ok')).toBeInViewport({ ratio: 1 });
  const box = await dialog(page).boundingBox();
  const vp = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.w + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.h + 0.5);
});

test.describe('keyboard', () => {
  test.beforeEach(({ hasTouch }, info) => test.skip(hasTouch || info.project.name !== 'laptop', 'laptop keyboard only'));

  test('Enter closes it', async ({ page }) => {
    await routeNews(page);
    await open(page, '/');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeHidden();
    expect(await seen(page)).toEqual([...SHOWN].sort());
  });

  test('1 opens the first item (the game)', async ({ page }) => {
    await routeNews(page);
    await open(page, '/');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('1');
    await expect(page).toHaveURL(/\/games\/math-exam\/(\?.*)?$/);
    expect(await seen(page)).toEqual([...SHOWN].sort());
  });

  test('2 opens the second item (#creatures)', async ({ page }) => {
    await routeNews(page);
    await open(page, '/');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('2');
    await expect(dialog(page)).toBeHidden();
    await expect(page.locator('#col-creatures')).toBeVisible();
  });

  test('3 on an item without a link does nothing', async ({ page }) => {
    await routeNews(page);
    await open(page, '/');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('3');
    await page.waitForTimeout(300);
    await expect(dialog(page)).toBeVisible();
    expect(page.url()).not.toMatch(/\/games\//);
  });
});
