// A new exam unit is just content: the sociales-planeta page gets a small fake unit (generic task types only) in place of its
// content.js and must run it end to end on the shared engine — a station and the final exam, by keyboard — with the records of its own slug.
import { test, expect, open, coins, record } from './helpers.mjs';

const SLUG = 'exam-demo';

const choice = (q, options, answer) => ({ type: 'choice', q, options, answer });
const tf = (q, truth) => ({ type: 'tf', q, truth });
const sort = (q) => ({
  type: 'sort',
  q,
  bins: [
    { id: 'big', label: 'Grandes', icon: '🐘' },
    { id: 'small', label: 'Pequeños', icon: '🐜' },
  ],
  items: [
    { text: 'elefante', bin: 'big' },
    { text: 'ballena', bin: 'big' },
    { text: 'hormiga', bin: 'small' },
    { text: 'mosca', bin: 'small' },
  ],
});
const order = (q) => ({ type: 'order', q, items: ['uno', 'dos', 'tres'] });
const pairs = (q) => ({
  type: 'pairs',
  q,
  pairs: [
    ['perro', 'ladra'],
    ['gato', 'maúlla'],
    ['vaca', 'muge'],
  ],
});

const UNIT = {
  slug: SLUG,
  lang: 'es',
  title: 'Unidad de prueba',
  subject: 'Pruebas',
  unitLabel: 'Unidad 9',
  intro: 'Un examen que es solo contenido.',
  round: 4,
  stations: [
    {
      id: 'a',
      title: 'Estación A',
      icon: '🅰️',
      intro: 'De todo un poco.',
      tasks: [
        choice('A1', ['x', 'y', 'z'], 1),
        choice('A2', ['x', 'y'], 0),
        tf('A3', true),
        tf('A4', false),
        sort('A5'),
        order('A6'),
        pairs('A7'),
      ],
    },
    {
      id: 'b',
      title: 'Estación B',
      icon: '🅱️',
      intro: 'Solo elegir.',
      tasks: [choice('B1', ['x', 'y'], 1), choice('B2', ['x', 'y', 'z'], 2), tf('B3', true), tf('B4', true), tf('B5', false)],
    },
    {
      id: 'c',
      title: 'Estación C',
      icon: '©️',
      intro: 'Ordenar y unir.',
      tasks: [sort('C1'), order('C2'), pairs('C3'), choice('C4', ['x', 'y'], 0), tf('C5', true)],
    },
  ],
  exam: { perStation: { a: 2, b: 2, c: 1 } },
  strings: { stationsTitle: 'Zonas' },
  lists: { praise: ['¡Hurra!'] },
};

const LETTERS = 'ABCDEFGH';
const text = (page, selector) => page.locator(selector).first().textContent();

// Texts of the buttons' own text nodes (the <kbd> hint is not part of it).
const ownTexts = (page, selector) =>
  page.evaluate(
    (sel) =>
      [...document.querySelectorAll(sel)].map((b) =>
        [...b.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent)
          .join(''),
      ),
    selector,
  );

// Answers the current task by keys, reading what is right from the engine's session. `wrong` only works for choice / true-false.
const answerByKeys = async (page, { wrong = false } = {}) => {
  const key = (k) => page.keyboard.press(k);
  const t = await page.evaluate(() => __exam.session.task);
  switch (t.type) {
    case 'choice': {
      const shown = await ownTexts(page, '#work .choice');
      const right = shown.indexOf(t.options[t.answer]);
      return key(String(wrong ? ((right + 1) % shown.length) + 1 : right + 1));
    }
    case 'tf':
      return key(t.truth !== wrong ? 'v' : 'f');
    case 'sort': {
      for (let i = 0; i < 10 && !(await page.evaluate(() => __exam.session.answered)); i++) {
        const chip = await text(page, '#work .chip[aria-pressed=true]');
        const bin = t.items.find((it) => it.text === chip).bin;
        await key(String(t.bins.findIndex((b) => b.id === bin) + 1));
      }
      return;
    }
    case 'order': {
      const shown = await ownTexts(page, '#work .ord-card span:not(.ord-num)');
      for (const item of t.items) await key(LETTERS[shown.indexOf(item)]);
      return key('Enter');
    }
    case 'pairs': {
      const left = await ownTexts(page, '#work .pairs .col:first-child .pr');
      const right = await ownTexts(page, '#work .pairs .col:last-child .pr');
      for (const [k, l] of left.entries()) {
        const r = right.indexOf(t.pairs.find((p) => p[0] === l)[1]);
        await key(String(k + 1));
        await key(LETTERS[r]);
      }
      return;
    }
    default:
      throw new Error(`unsupported task type ${t.type}`);
  }
};

// Answers every task of the running round by keys and goes on with Enter; `wrongAt` = task indexes to miss on purpose.
const playRound = async (page, { wrongAt = [] } = {}) => {
  const n = await page.evaluate(() => __exam.session.tasks.length);
  for (let i = 0; i < n; i++) {
    expect(await page.evaluate(() => __exam.session.index)).toBe(i);
    await answerByKeys(page, { wrong: wrongAt.includes(i) });
    await expect(page.locator('#feedback .fb-actions .btn').first()).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
};

test('a fake unit with generic tasks plays a station and the exam on the shared engine', async ({ page, tap }) => {
  await page.route('**/games/sociales-planeta/content.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: `window.SP_CONTENT = ${JSON.stringify(UNIT)};` }),
  );
  await open(page, '/games/sociales-planeta/');

  // Hub: everything comes from the unit
  await expect(page.locator('#stations .station')).toHaveCount(3);
  await expect(page.locator('#hub h1')).toHaveText('Unidad de prueba');
  await expect(page.locator('.game-top .eyebrow')).toHaveText('Pruebas');
  await expect(page.locator('#hub .section-label')).toHaveText('Zonas'); // unit.strings override
  await expect(page.locator('#exam-info')).toContainText('5 preguntas');
  expect(await record(page, SLUG)).toBeNull();
  expect(await record(page, 'sociales-planeta')).toBeNull();

  // Station A, perfect, by keys
  const c0 = await coins(page);
  await page.locator('#stations .station').nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro-title')).toHaveText('Estación A');
  await expect(page.locator('#intro-meta')).toContainText('4 preguntas');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#play-label')).toContainText('Estación A');
  await answerByKeys(page);
  await expect(page.locator('#feedback .fb-title')).toHaveText(/./); // feedback is up
  await expect(page.locator('#dots .dot.ok')).toHaveCount(1);
  await page.keyboard.press('Enter');
  for (let i = 1; i < 4; i++) {
    await answerByKeys(page);
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText('4 / 4');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 10, max: 10 });
  expect(await record(page, 'sociales-planeta')).toBeNull();
  expect(await page.evaluate((s) => KF.gameData(s).st.a, SLUG)).toMatchObject({ best: 4, max: 4, stars: 3, plays: 1 });
  expect((await coins(page)) - c0).toBe(9); // 4 answers + the perfect bonus

  // Esc on the finish screen: back to the hub, which shows the record
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();
  await expect(page.locator('#stations .station').nth(0)).toContainText('Mejor: 4/4');
  await expect(page.locator('#tally')).toContainText('1/3');

  // The same station again with taps to start: no second bonus
  const c1 = await coins(page);
  await tap(page.locator('#stations .station').nth(0));
  await tap(page.locator('#intro-go'));
  await playRound(page);
  expect((await coins(page)) - c1).toBe(4);
  await tap(page.locator('#finish .actions .btn').last());
  await expect(page.locator('#hub')).toBeVisible();

  // The exam: one deliberate miss (station B has only choice / true-false, so one is always there)
  await tap(page.locator('#exam-btn'));
  await expect(page.locator('#play-label')).toContainText('Examen final');
  const kinds = await page.evaluate(() => __exam.session.tasks.map((t) => t.type));
  expect(kinds).toHaveLength(5);
  const miss = kinds.findIndex((k) => k === 'choice' || k === 'tf');
  expect(miss).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < 5; i++) {
    await answerByKeys(page, { wrong: i === miss });
    if (i === miss) {
      await expect(page.locator('#cards i.y')).toHaveCount(1);
      await expect(page.locator('#feedback .ref-card.y')).toBeVisible();
    }
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText('4 / 5');
  await expect(page.locator('#finish .grade b')).toHaveText('Notable');
  await expect(page.locator('#finish .rrow')).toHaveCount(3);
  await expect(page.locator('#finish .rrow .btn')).toHaveCount(1); // «Repasar» for the station with the miss
  expect(await page.evaluate((s) => KF.gameData(s).exam, SLUG)).toMatchObject({ n: 8, grade: 'Notable', nota: '8,0' });
  expect(await record(page, SLUG)).toMatchObject({ plays: 3, best: 10, max: 10 });
  expect(await page.evaluate((s) => KF.gameData(s).topics, SLUG)).toMatchObject({ a: { total: 10 } });

  // Esc mid-round asks, and "yes" goes back to the hub
  await tap(page.locator('#finish .actions .btn').first()); // again
  await expect(page.locator('#play')).toBeVisible();
  await answerByKeys(page);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', true);
  await tap(page.locator('#quit-yes'));
  await expect(page.locator('#hub')).toBeVisible();
  expect(await record(page, SLUG)).toMatchObject({ plays: 3 }); // the abandoned round is not counted
});

test('the unit praise list is used for right answers', async ({ page }) => {
  await page.route('**/games/sociales-planeta/content.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: `window.SP_CONTENT = ${JSON.stringify(UNIT)};` }),
  );
  await open(page, '/games/sociales-planeta/');
  await page.evaluate(() => __exam.startStation('b'));
  await answerByKeys(page);
  await expect(page.locator('#feedback .fb.ok .fb-title')).toHaveText('¡Hurra! ⚽');
});
