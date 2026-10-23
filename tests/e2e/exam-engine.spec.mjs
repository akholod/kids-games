// A new exam unit is just content: the sociales-planeta page gets a small fake unit (generic task types only) in place of its
// content.js and must run it end to end on the shared engine — a station and the final exam, by keyboard — with the records of its own slug.
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';

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

// ---- optional engine features: task keys, weights, answer hook, hero redrawn on every hub visit ----

// The fake unit with the given stations; `mountOpts` is the source of the options object passed to KFExam.mount next to art/types.
const openUnit = async (page, stations, { mountOpts = '', exam = { [stations[0].id]: 1 }, round = 4, lang } = {}) => {
  const unit = { ...UNIT, round, stations, exam: { perStation: exam } };
  await page.route('**/games/sociales-planeta/content.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: `window.SP_CONTENT = ${JSON.stringify(unit)};` }),
  );
  await page.route('**/games/sociales-planeta/game.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `KFExam.mount(window.SP_CONTENT, { art: window.SPArt, types: window.SP_TYPES, ${mountOpts} });`,
    }),
  );
  await open(page, '/games/sociales-planeta/', { lang });
};

const station = (id, tasks) => ({ id, title: `Estación ${id}`, icon: '🔹', intro: 'Prueba.', tasks });
const keyed = (key, i, extra = {}) => ({ ...choice(`${key}-${i}`, ['x', 'y'], 0), key, ...extra });
const ids = (page) => page.evaluate(() => __exam.session.tasks.map((t) => t.q));

test('tasks with a key: one draw has no repeated key while enough distinct keys exist', async ({ page }) => {
  // 6 keys, two tasks each; a round of 4 (and an exam draw of 4) always has room for 4 different keys.
  const tasks = ['k0', 'k1', 'k2', 'k3', 'k4', 'k5'].flatMap((k) => [keyed(k, 1), keyed(k, 2)]);
  await openUnit(page, [station('k', tasks)], { exam: { k: 4 } });
  for (let i = 0; i < 12; i++) {
    await page.evaluate(() => __exam.startStation('k'));
    const keys = await page.evaluate(() => __exam.session.tasks.map((t) => t.key));
    expect(keys).toHaveLength(4);
    expect(new Set(keys).size).toBe(4);
  }
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => __exam.startExam());
    const keys = await page.evaluate(() => __exam.session.tasks.map((t) => t.key));
    expect(new Set(keys).size).toBe(keys.length);
  }
});

test('tasks with a key: keys repeat only when there are not enough distinct ones', async ({ page }) => {
  const tasks = ['k0', 'k1'].flatMap((k) => [keyed(k, 1), keyed(k, 2), keyed(k, 3)]);
  await openUnit(page, [station('k', tasks)]);
  await page.evaluate(() => __exam.startStation('k'));
  const keys = await page.evaluate(() => __exam.session.tasks.map((t) => t.key));
  expect(keys).toHaveLength(4);
  expect(keys.filter((k) => k === 'k0').length).toBeGreaterThanOrEqual(1);
  expect(keys.filter((k) => k === 'k1').length).toBeGreaterThanOrEqual(1);
});

test('weight: weight 0 is never drawn while enough weighted tasks exist, a heavy task is always drawn', async ({ page }) => {
  const zero = [0, 1, 2].map((i) => keyed(`z${i}`, 1, { w: 0 }));
  const normal = [0, 1, 2, 3, 4, 5].map((i) => keyed(`n${i}`, 1, { w: 1 }));
  const heavy = keyed('heavy', 1, { w: 1000 });
  await openUnit(page, [station('w', [...zero, ...normal, heavy])], { mountOpts: 'weight: (t) => t.w,', exam: { w: 4 } });
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => __exam.startStation('w'));
    const qs = await ids(page);
    expect(qs).toHaveLength(4);
    expect(qs).toContain('heavy-1');
    expect(qs.filter((q) => q.startsWith('z'))).toEqual([]);
  }
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => __exam.startExam());
    const qs = await ids(page);
    expect(qs).toContain('heavy-1');
    expect(qs.filter((q) => q.startsWith('z'))).toEqual([]);
  }
});

test('onAnswer gets the session task and the verdict; a throwing hook does not break the round', async ({ page }) => {
  const tasks = [0, 1, 2, 3].map((i) => keyed(`w${i}`, 1));
  const mountOpts = `onAnswer: (t, ok) => {
    (window.__log ||= []).push({ station: t.station, key: t.key, q: t.q, ok });
    if (window.__log.length === 2) throw new Error('hook failed');
  },`;
  await openUnit(page, [station('h', tasks)], { mountOpts });
  await page.evaluate(() => __exam.startStation('h'));
  await answerByKeys(page); // right
  expect(await page.evaluate(() => window.__log)).toHaveLength(1);
  await page.keyboard.press('Enter');
  await answerByKeys(page, { wrong: true }); // wrong, and the hook throws
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await page.keyboard.press('Enter');
  await answerByKeys(page);
  await page.keyboard.press('Enter');
  await answerByKeys(page);
  await page.keyboard.press('Enter');
  await expect(page.locator('#finish')).toBeVisible();
  const log = await page.evaluate(() => window.__log);
  expect(log.map((e) => e.ok)).toEqual([true, false, true, true]);
  for (const e of log) {
    expect(e.station).toBe('h');
    expect(e.key).toBe(e.q.split('-')[0]);
  }
  expect(await page.evaluate((s) => KF.gameData(s).topics.h, SLUG)).toMatchObject({ total: 4, right: 3 });
});

test('the hub hero is drawn again on every return to the hub', async ({ page }) => {
  await page.route('**/games/sociales-planeta/art.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.SPArt = { art: () => null, hero: () => { const d = document.createElement('div'); d.className = 'demo-hero'; d.textContent = 'rounds:' + Object.keys(KF.gameData('${SLUG}').st || {}).length; return d; } };`,
    }),
  );
  await openUnit(page, [
    station(
      'a',
      [0, 1, 2, 3].map((i) => keyed(`a${i}`, 1)),
    ),
  ]);
  await expect(page.locator('#hero-art .demo-hero')).toHaveText('rounds:0');
  await page.evaluate(() => __exam.startStation('a'));
  await playRound(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();
  await expect(page.locator('#hero-art .demo-hero')).toHaveCount(1);
  await expect(page.locator('#hero-art .demo-hero')).toHaveText('rounds:1');
});

// ---- shared task types: label (scene from the unit art) and fill (a word into a sentence) ----

const fill = (q, text, answer, extra = {}) => ({ type: 'fill', q, text, answer, ...extra });
const FILLS = [
  fill('Completa', 'Las ___ son el material sólido de los relieves.', 'rocas'),
  fill('Completa', 'Los animales ___ viven en el agua.', 'acuáticos', { extra: 'tm' }),
  fill('Completa', 'La ___ mide lo caliente que está algo.', 'temperatura'),
  fill('Completa', 'Las ___ son relieves altos.', 'montañas'),
];
const withStation = (tasks, id = 'f') => tasks.map((t) => ({ ...t, station: id }));
const VOCAB = [
  ['la roca', 'скеля'],
  ['el relieve', 'рельєф'],
  ['la montaña', 'гора'],
  ['el valle', 'долина'],
  ['la llanura', 'рівнина'],
  ['el río', 'річка'],
  ['la costa', 'узбережжя'],
  ['el lago', 'озеро'],
];
const fillStation = () => ({ ...station('f', FILLS), vocab: VOCAB });

// Starts the given tasks as a round of station f.
const play = (page, tasks) => page.evaluate((t) => __exam.play(t), withStation(tasks));
const slotsText = (page) => page.locator('#work .fill-slot').allTextContents();
const typeWord = async (page, word) => {
  for (const c of word) await page.keyboard.press(c);
};
// The word as a kid types it: the plain vowel for an accented one.
const plain = (word) => word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fbTitle = (page) => page.locator('#feedback .fb-title').first();

test('fill: the sentence shows a gap, tiles are letters + traps, a right first try cheers and fills the sentence in', async ({ page }) => {
  await openUnit(page, [fillStation()]);
  await play(page, [FILLS[0]]);
  await expect(page.locator('#work .fill-text')).toHaveAttribute('lang', 'es');
  await expect(page.locator('#work .fill-text')).toHaveText('Las ___ son el material sólido de los relieves.');
  await expect(page.locator('#work .fill-gap')).toHaveCount(1);
  await expect(page.locator('#work .fill-slot')).toHaveCount(5);
  const tiles = await page.locator('#work .fill-tile').allTextContents();
  expect(tiles).toHaveLength(7); // r o c a s + 2 traps
  expect([...'rocas'].every((c) => tiles.includes(c))).toBe(true);
  const traps = [...tiles];
  for (const c of 'rocas') traps.splice(traps.indexOf(c), 1);
  expect(traps.filter((c) => 'aeiou'.includes(c))).toHaveLength(1); // a vowel and a consonant, none of the word's letters
  expect(traps.filter((c) => !'aeiou'.includes(c))).toHaveLength(1);
  expect(traps.some((c) => 'rocas'.includes(c))).toBe(false);
  await expect(page.locator('#work .kbd-hint')).toContainText('tilde');
  // tap the tiles in the right order (the pool is shuffled: pick the first free tile with the letter)
  for (const c of 'rocas')
    await page
      .locator('#work .fill-tile:not([disabled])', { hasText: new RegExp(`^${c}$`) })
      .first()
      .click();
  await expect(page.locator('#work .fill-check')).toBeEnabled();
  await page.locator('#work .fill-check').click();
  await expect(fbTitle(page)).toHaveText('¡Hurra! ⚽');
  await expect(page.locator('#work .fill-gap')).toHaveCount(0);
  await expect(page.locator('#work .fill-word')).toHaveText('rocas');
  await expect(page.locator('#work .fill-task')).toHaveClass(/is-done/);
  await expect(page.locator('#work .fill-slot.good')).toHaveCount(5);
  expect(await page.evaluate(() => __exam.session.results)).toEqual([true]);
});

test('fill: typing — plain vowels give accented tiles, ñ works, Backspace erases, Enter checks, dead keys are ignored', async ({
  page,
}) => {
  await openUnit(page, [fillStation()]);
  await play(page, [FILLS[1], FILLS[3]]);
  // acuáticos: the pool has both a and á; the second «a» typed takes the á tile
  await typeWord(page, 'acu');
  await page.keyboard.press('Backspace');
  expect(await slotsText(page)).toEqual(['a', 'c', '', '', '', '', '', '', '']);
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Dead', code: 'Quote', bubbles: true })));
  expect(await slotsText(page)).toEqual(['a', 'c', '', '', '', '', '', '', '']);
  await typeWord(page, plain('uaticos'));
  expect(await slotsText(page)).toEqual([...'acuáticos']);
  await page.keyboard.press('x'); // full / no such tile: nothing happens, no error
  await page.keyboard.press('Enter');
  await expect(fbTitle(page)).toHaveText('¡Hurra! ⚽');
  await expect(page.locator('#work .fill-word')).toHaveText('acuáticos');
  await page.keyboard.press('Enter'); // next task
  // montañas: ñ typed as itself
  await typeWord(page, 'monta');
  // Playwright cannot press «ñ»: the key event a Spanish keyboard sends
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ñ', code: 'Semicolon', bubbles: true })));
  await typeWord(page, 'as');
  expect(await slotsText(page)).toEqual([...'montañas']);
  await page.keyboard.press('Enter');
  await expect(fbTitle(page)).toHaveText('¡Hurra! ⚽');
});

test('fill: a plain vowel takes the accented tile only when no plain tile of it is free', async ({ page }) => {
  const cafe = (extra) => fill('Completa', 'El ___ es una bebida.', 'café', { extra });
  await openUnit(page, [fillStation()]);
  await play(page, [cafe('xz'), cafe('ae')]);
  // pool c a f é x z: no plain e, so «e» takes the é
  await typeWord(page, 'cafe');
  expect(await slotsText(page)).toEqual([...'café']);
  await page.keyboard.press('Enter');
  await expect(fbTitle(page)).toHaveText('¡Hurra! ⚽');
  await page.keyboard.press('Enter');
  // pool c a f é a e: the plain e is free, so it goes first (and is a mistake here)
  await typeWord(page, 'cafe');
  expect(await slotsText(page)).toEqual([...'cafe']);
});

test('fill: wrong then right is soft; the 2nd miss shows the word', async ({ page }) => {
  await openUnit(page, [fillStation()]);
  await play(page, [FILLS[0], FILLS[0]]);
  // «racos»: r c s are right (locked green), a and o go back
  await typeWord(page, 'racos');
  await page.keyboard.press('Enter');
  await expect(page.locator('#work .fill-slot.good')).toHaveCount(3);
  await expect(page.locator('#work .inline-hint')).toHaveText('Las letras verdes están bien. Prueba con las demás.');
  expect(await slotsText(page)).toEqual(['r', '', 'c', '', 's']);
  await expect(page.locator('#feedback .fb')).toHaveCount(0); // not resolved yet
  await typeWord(page, 'oa');
  await page.keyboard.press('Enter');
  await expect(fbTitle(page)).toHaveText('¡Bien hecho! ⚽'); // soft
  expect(await page.evaluate(() => __exam.session.results)).toEqual([true]);
  await page.keyboard.press('Enter');
  // second task: two misses
  await typeWord(page, 'racos');
  await page.keyboard.press('Enter');
  await typeWord(page, 'ao'); // wrong again
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(fbTitle(page)).toContainText('La respuesta es: rocas.');
  await expect(page.locator('#work .fill-slot.fixed')).toHaveCount(2); // the two letters the game put right
  await expect(page.locator('#work .fill-word.fix')).toHaveText('rocas');
  expect(await slotsText(page)).toEqual([...'rocas']);
  expect(await page.evaluate(() => __exam.session.results)).toEqual([true, false]);
});

test('fill: Check is off and Enter asks to fill the gaps while slots are empty', async ({ page }) => {
  await openUnit(page, [fillStation()]);
  await play(page, [FILLS[0]]);
  await typeWord(page, 'ro');
  await expect(page.locator('#work .fill-check')).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page.locator('#work .inline-hint')).toHaveText('Rellena todos los huecos antes de comprobar.');
  await expect(page.locator('#work .fill-slot')).toHaveCount(5);
});

test('fill: 11 letters fit a 360px phone; tiles and slots are tappable (44px+)', async ({ page, tap }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openUnit(page, [fillStation()]);
  await play(page, [FILLS[2]]);
  const boxes = async (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  const slots = await boxes('#work .fill-slot');
  const tiles = await boxes('#work .fill-tile');
  expect(slots).toHaveLength(11);
  expect(tiles).toHaveLength(13);
  for (const b of [...slots, ...tiles]) {
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(360);
  }
  for (const b of tiles) {
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  for (const b of slots) expect(b.width).toBeGreaterThanOrEqual(36);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  for (const c of 'temperatura') await tap(page.locator('#work .fill-tile:not([disabled])', { hasText: new RegExp(`^${c}$`) }).first());
  await tap(page.locator('#work .fill-check'));
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
});

test('fill: one task fits a short laptop window without page scroll (with the longest word)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 650 });
  await openUnit(page, [fillStation()]);
  await play(page, [FILLS[2]]);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(2);
  await typeWord(page, 'temperatura');
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await page.waitForTimeout(400);
  const box = await page.locator('#feedback .fb-actions .btn').first().boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(650);
});

// ---- label ----

const GLOBE = {
  type: 'label',
  q: 'Pon cada nombre en su sitio',
  scene: 'globe',
  labels: [
    { id: 'ecuador', text: 'Ecuador' },
    { id: 'eje', text: 'Eje' },
    { id: 'polo-sur', text: 'Polo Sur' },
  ],
};

test('label (shared type): chips and slots by keyboard; wrong then right is soft; scene classes come from the scene', async ({ page }) => {
  const compass = {
    ...GLOBE,
    scene: 'compass-rose',
    labels: [
      { id: 'n', text: 'Norte' },
      { id: 's', text: 'Sur' },
    ],
  };
  await openUnit(page, [station('f', [GLOBE])]);
  await play(page, [GLOBE, compass]);
  await expect(page.locator('#work .label-task .scene')).not.toHaveClass(/compass/);
  const shown = await ownTexts(page, '#work .chip');
  expect([...shown].sort()).toEqual(['Ecuador', 'Eje', 'Polo Sur']);
  const spots = await page.locator('#work .slot').evaluateAll((els) => els.map((e) => e.dataset.spot));
  expect([...spots].sort()).toEqual(['ecuador', 'eje', 'polo-sur']);
  const idOf = { Ecuador: 'ecuador', Eje: 'eje', 'Polo Sur': 'polo-sur' };
  const slotOf = (text) => LETTERS[spots.indexOf(idOf[text])];
  // one miss on purpose with the first chip, then everything right
  await page.keyboard.press('1');
  await page.keyboard.press(LETTERS[(spots.indexOf(idOf[shown[0]]) + 1) % 3]);
  await expect(page.locator('#work .inline-hint')).toHaveText('Ese no es su sitio. Prueba otro.');
  for (const [k, text] of shown.entries()) {
    await page.keyboard.press(String(k + 1));
    await page.keyboard.press(slotOf(text));
  }
  await expect(page.locator('#work .slot.filled')).toHaveCount(3);
  await expect(fbTitle(page)).toHaveText('¡Bien hecho! ⚽');
  await page.keyboard.press('Enter');
  // the compass rose scene brings its own class
  await expect(page.locator('#work .label-task .scene')).toHaveClass(/compass/);
  await expect(page.locator('#work .kbd-hint')).toContainText('1–2');
});

test('label: an unknown scene falls back to a plain choice', async ({ page }) => {
  await openUnit(page, [station('f', [GLOBE])]);
  await play(page, [{ ...GLOBE, scene: 'nope' }]);
  await expect(page.locator('#work .choice')).toHaveCount(1);
  await expect(page.locator('#work .label-task')).toHaveCount(0);
});

// ---- vocab (Ukrainian help) ----

test('vocab: shown in the intro dialog (uk site) as a two-column list; the dialog fits 1280×650', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 650 });
  await openUnit(page, [fillStation(), station('g', [keyed('g', 1)])]);
  await page.locator('#stations .station').nth(0).click();
  const v = page.locator('#intro-dlg .vocab');
  await expect(v).toBeVisible();
  await expect(v.locator('h3')).toHaveText('📖 Словничок');
  await expect(v.locator('.vocab-row')).toHaveCount(VOCAB.length);
  await expect(v.locator('dt').first()).toHaveAttribute('lang', 'es');
  await expect(v.locator('dt').first()).toHaveText('la roca');
  await expect(v.locator('dd').first()).toHaveAttribute('lang', 'uk');
  await expect(v.locator('dd').first()).toHaveText('скеля');
  const fit = await page.evaluate(() => {
    const d = document.getElementById('intro-dlg');
    const r = d.getBoundingClientRect();
    return { scroll: d.scrollHeight - d.clientHeight, top: r.top, bottom: r.bottom, h: innerHeight };
  });
  expect(fit.scroll).toBeLessThanOrEqual(1); // no scroll inside the dialog
  expect(fit.top).toBeGreaterThanOrEqual(0);
  expect(fit.bottom).toBeLessThanOrEqual(fit.h);
  // a station without vocab has no list
  await page.keyboard.press('Escape');
  await page.locator('#stations .station').nth(1).click();
  await expect(page.locator('#intro-dlg .vocab')).toHaveCount(0);
});

test('vocab: usable at 360px — nothing wider than the screen, the dialog scrolls inside if needed, buttons reachable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openUnit(page, [fillStation()]);
  await page.locator('#stations .station').nth(0).click();
  const m = await page.evaluate(() => {
    const d = document.getElementById('intro-dlg');
    const r = d.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: d.scrollWidth - d.clientWidth };
  });
  expect(m.left).toBeGreaterThanOrEqual(0);
  expect(m.right).toBeLessThanOrEqual(360);
  expect(m.bottom).toBeLessThanOrEqual(640);
  expect(m.w).toBeLessThanOrEqual(1);
  await page.locator('#intro-go').scrollIntoViewIfNeeded();
  await expect(page.locator('#intro-go')).toBeInViewport();
});

test('vocab: the «📖 Словничок» button belongs to a station round — opens and closes (Esc / button), keys stay with the task', async ({
  page,
  tap,
}) => {
  await openUnit(page, [fillStation()], { exam: { f: 2 } });
  await page.locator('#stations .station').nth(0).click();
  await page.keyboard.press('Enter'); // start from the dialog
  const btn = page.locator('#play-vocab');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText('📖 Словничок');
  await expect(page.locator('#vocab-dlg')).toHaveCount(0);
  // by keyboard: focus the button, Enter opens, Esc closes and returns the focus
  await btn.focus();
  await page.keyboard.press('Enter');
  const dlg = page.locator('#vocab-dlg');
  await expect(dlg).toBeVisible();
  await expect(dlg.locator('.vocab-row')).toHaveCount(VOCAB.length);
  await expect(dlg.locator('dt').nth(1)).toHaveAttribute('lang', 'es');
  await expect(dlg.locator('dd').nth(1)).toHaveAttribute('lang', 'uk');
  expect(await page.evaluate(() => __exam.session.answered)).toBe(false);
  await page.keyboard.press('a'); // the dialog is modal: the task must not get this key
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  await expect(btn).toBeFocused();
  expect((await slotsText(page)).every((t) => t === '')).toBe(true);
  expect(await page.evaluate(() => __exam.session.index)).toBe(0); // Esc closed the glossary, it did not ask to quit
  await expect(page.locator('#quit-dlg')).not.toHaveJSProperty('open', true);
  // the task keeps its keys while the dialog is closed
  const task = await page.evaluate(() => __exam.session.task);
  await btn.blur();
  await typeWord(page, plain(task.answer).slice(0, 2));
  expect((await slotsText(page)).filter(Boolean)).toHaveLength(2);
  // by tap: the close button; the tap leaves the focus alone
  await tap(btn);
  await expect(dlg).toBeVisible();
  await tap(page.locator('#vocab-close'));
  await expect(dlg).toHaveCount(0);
  await expect(btn).not.toBeFocused();
  // the exam never has it
  await page.evaluate(() => __exam.startExam());
  await expect(page.locator('#play-vocab')).toHaveCount(0);
  await expect(page.locator('#vocab-dlg')).toHaveCount(0);
  // back in a station round it is there again
  await page.evaluate(() => __exam.startStation('f'));
  await expect(page.locator('#play-vocab')).toBeVisible();
});

test('vocab: a phone round shows the button without breaking the head', async ({ page, tap }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openUnit(page, [fillStation()]);
  await page.evaluate(() => __exam.startStation('f'));
  const btn = page.locator('#play-vocab');
  await expect(btn).toBeInViewport();
  const b = await btn.boundingBox();
  expect(b.height).toBeGreaterThanOrEqual(44);
  expect(b.x + b.width).toBeLessThanOrEqual(360);
  await tap(btn);
  await expect(page.locator('#vocab-dlg')).toBeVisible();
  const d = await page.locator('#vocab-dlg').boundingBox();
  expect(d.x).toBeGreaterThanOrEqual(0);
  expect(d.x + d.width).toBeLessThanOrEqual(360);
  await tap(page.locator('#vocab-close'));
});

test('vocab: nothing of it is in the DOM on the Spanish site (?lang=es)', async ({ page }) => {
  await openUnit(page, [fillStation()], { lang: 'es' });
  await page.locator('#stations .station').nth(0).click();
  await expect(page.locator('#intro-dlg')).toBeVisible();
  await expect(page.locator('.vocab, .vocab-list, .vocab-row, #vocab-dlg, #play-vocab')).toHaveCount(0);
  await expectNoCyrillic(page, 'in the intro dialog');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('.vocab, .vocab-list, .vocab-row, #vocab-dlg, #play-vocab')).toHaveCount(0);
  await expectNoCyrillic(page, 'in the round');
  expect(await page.evaluate(() => /[\u0400-\u04FF]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
  await page.evaluate(() => __exam.startExam());
  await expect(page.locator('#play-vocab')).toHaveCount(0);
});
