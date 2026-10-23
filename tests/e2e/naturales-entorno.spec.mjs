// «Conozco mi entorno» (Ciencias de la Naturaleza, Unidad 1): a content-only exam unit on the shared engine plus its own water-filter task.
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer } from './drivers.mjs';

const SLUG = 'naturales-entorno';
const URL = `/games/${SLUG}/`;
const cn = examPlayer('__cn');

const stationIndex = (page, id) => page.evaluate((s) => CN_CONTENT.stations.findIndex((x) => x.id === s), id);
const openIntro = async (page, tap, id) => tap(page.locator('#stations .station').nth(await stationIndex(page, id)));
const openStation = async (page, tap, id) => {
  await openIntro(page, tap, id);
  await tap(page.locator('#intro-go'));
  await expect(page.locator('#play')).toBeVisible();
};
// A task of the content by type (and a test), to play on its own: `__cn.play` takes tasks tagged with their station.
const allTasks = (page) => page.evaluate(() => CN_CONTENT.stations.flatMap((s) => s.tasks.map((t) => ({ ...t, station: s.id }))));
const taskWhere = async (page, type, ok = () => true) => (await allTasks(page)).find((t) => t.type === type && ok(t)) ?? null;
const playOnly = (page, ...tasks) => page.evaluate((t) => __cn.play(t), tasks);
const fbTitle = (page) => page.locator('#feedback .fb-title').first();

test('hub: eight stations, the hero dome, the exam card', async ({ page }) => {
  await open(page, URL);
  await expect(page.locator('#hub h1')).toHaveText('Conozco mi entorno');
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expect(page.locator('#hero-art svg.cn-hero')).toHaveCount(1);
  await expect(page.locator('#hero-art svg.cn-hero')).toHaveAttribute('data-passed', '0');
  await expect(page.locator('#exam-btn')).toBeVisible();
  await expect(page.locator('#exam-info')).toContainText('12 preguntas');
  expect(await record(page, SLUG)).toBeNull();
});

test('a station with a label task: full round, record, coins and the hero comes alive', async ({ page, tap }) => {
  await open(page, URL);
  const c0 = await coins(page);
  await openStation(page, tap, 'ecosistema');
  const types = (await cn.session(page)).tasks.map((t) => t.type);
  expect(types).toContain('label'); // «always» puts the scene first
  expect(types).toHaveLength(8);
  await cn.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: 10, max: 10 });
  expect(await page.evaluate(() => KF.gameData('naturales-entorno').st.ecosistema)).toMatchObject({ best: 8, max: 8, stars: 3, plays: 1 });
  expect(await coins(page)).toBeGreaterThan(c0);
  await tap(page.locator('#finish .actions .btn').last());
  await expect(page.locator('#hub')).toBeVisible();
  await expect(page.locator('#stations .station').nth(0)).toContainText('Mejor: 8/8');
  await expect(page.locator('#hero-art svg.cn-hero')).toHaveAttribute('data-passed', '1');
});

test('the water-filter station: the filter task is always in the round; full round', async ({ page, tap }) => {
  await open(page, URL);
  await openStation(page, tap, 'filtro');
  const types = (await cn.session(page)).tasks.map((t) => t.type);
  expect(types).toContain('filter');
  const played = await cn.playSession(page, tap);
  expect(played).toEqual(types);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  expect(await page.evaluate(() => KF.gameData('naturales-entorno').st.filtro)).toMatchObject({ best: 8, max: 8, plays: 1 });
});

test('filter task: right first time — shuffled chips, layers drop in, dirty water runs through, a cheer', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'filter');
  await playOnly(page, t);
  await expect(page.locator('#work .cn-layer')).toHaveCount(t.layers.length);
  const shown = await page.locator('#work .cn-layer').evaluateAll((els) => els.map((e) => e.dataset.layer));
  expect([...shown].sort()).toEqual([...t.layers].sort());
  expect(shown).not.toEqual(t.layers); // never offered already in order
  await expect(page.locator('#work .cn-filter-art')).toHaveAttribute('data-step', '0');
  await expect(page.locator('#work .cn-slot')).toHaveCount(t.layers.length);
  await expect(page.locator('#work .cn-slot').first()).toHaveAttribute('data-layer', t.layers[0]);
  await expect(page.locator('#work .cn-filter-note')).toBeHidden();
  await cn.answerTask(page, tap);
  await expect(page.locator('#work .cn-slot.is-on')).toHaveCount(t.layers.length);
  await expect(page.locator('#work .cn-slot.is-fixed')).toHaveCount(0);
  await expect(page.locator('#work .cn-filter-art')).toHaveAttribute('data-step', 'done');
  await expect(page.locator('#work .cn-filter-note')).toBeVisible();
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText('¡Bien hecho! ⚽'); // a right first try is a full cheer
  expect((await cn.session(page)).results).toEqual([true]);
});

test('filter task: one mistake is still right (soft)', async ({ page, tap }) => {
  await open(page, URL);
  await playOnly(page, await taskWhere(page, 'filter'));
  await cn.answerTask(page, tap, { mistakes: 1 });
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).toHaveText('¡Bien hecho! ⚽');
  await expect(page.locator('#work .cn-slot.is-fixed')).toHaveCount(0);
});

test('filter task: two misses on the first layer — the game puts it in (amber), the answer is false and the right order is shown', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'filter');
  await playOnly(page, t);
  await cn.answerTask(page, tap, { mistakes: 2 });
  await expect(page.locator('#work .cn-slot.is-fixed')).toHaveCount(1);
  await expect(page.locator('#work .cn-slot.is-on')).toHaveCount(t.layers.length);
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  const list = `${t.layers.slice(0, -1).join(', ')} y ${t.layers.at(-1)}`;
  await expect(fbTitle(page)).toContainText(`de abajo arriba, ${list}`);
  expect((await cn.session(page)).results).toEqual([false]);
  await expect(page.locator('#dots .dot.miss')).toHaveCount(1);
});

test('fill task typed on the keyboard: accented answer from plain vowels, right first try and a soft retry', async ({ page }) => {
  await open(page, URL);
  const accented = await taskWhere(page, 'fill', (t) => /[áéíóú]/.test(t.answer));
  expect(accented).not.toBeNull();
  const second = await taskWhere(page, 'fill', (t) => t.answer !== accented.answer && t.answer.length > 4);
  await playOnly(page, accented, second);
  await expect(page.locator('#work .fill-text')).toHaveAttribute('lang', 'es');
  await expect(page.locator('#work .fill-slot')).toHaveCount([...accented.answer].length);
  await cn.answerTask(page, null, { keyboard: true });
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText('¡Bien hecho! ⚽');
  await expect(page.locator('#work .fill-word')).toHaveText(accented.answer);
  await page.keyboard.press('Enter');
  await cn.answerTask(page, null, { keyboard: true, wrong: true });
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).toHaveText('¡Bien hecho! ⚽');
  expect((await cn.session(page)).results).toEqual([true, true]);
});

test('label scenes: the 3-label and the 5-label scene — taps, a wrong slot first is soft', async ({ page, tap }) => {
  await open(page, URL);
  const scenes = await page.evaluate(() =>
    CN_CONTENT.stations.flatMap((s) => s.tasks.filter((t) => t.type === 'label').map((t) => ({ ...t, station: s.id }))),
  );
  expect(new Set(scenes.map((t) => t.scene))).toEqual(new Set(['componentes', 'relieve']));
  const five = scenes.find((t) => t.labels.length === 5);
  await playOnly(
    page,
    scenes.find((t) => t.scene === 'componentes'),
    five,
  );
  await expect(page.locator('#work .slot')).toHaveCount(3);
  await cn.answerTask(page, tap);
  await expect(page.locator('#work .slot.filled')).toHaveCount(3);
  await expect(fbTitle(page)).not.toHaveText('¡Bien hecho! ⚽');
  await cn.next(page, tap);
  await expect(page.locator('#work .slot')).toHaveCount(5);
  await cn.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#work .slot.filled')).toHaveCount(5);
  await expect(fbTitle(page)).toHaveText('¡Bien hecho! ⚽');
});

test('the final exam: 12 tasks from every station, no glossary button, a grade, a review button per station with misses', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL);
  await tap(page.locator('#exam-btn'));
  await expect(page.locator('#play-label')).toContainText('Examen final');
  const s = await cn.session(page);
  expect(s.mode).toBe('exam');
  expect(s.tasks).toHaveLength(12);
  expect(new Set(s.tasks.map((t) => t.station))).toEqual(
    new Set(['ecosistema', 'cadena', 'tipos', 'relieve', 'rocas', 'reinos', 'cuidado', 'filtro']),
  );
  await expect(page.locator('#play-vocab')).toHaveCount(0);
  // two deliberate misses on choice / true-false tasks: yellow cards, 10/12 = «Notable»
  const misses = s.tasks.flatMap((t, i) => (t.type === 'choice' || t.type === 'tf' ? [i] : [])).slice(0, 2);
  expect(misses).toHaveLength(2);
  await cn.playSession(page, tap, { wrongAt: misses });
  await expect(page.locator('#finish .grade b')).toHaveText('Notable');
  await expect(page.locator('#finish .score-pill')).toContainText('10 / 12');
  await expect(page.locator('#finish .rrow')).toHaveCount(8);
  await expect(page.locator('#finish .rrow .btn')).toHaveCount(new Set(misses.map((i) => s.tasks[i].station)).size); // «Repasar»
  expect(await page.evaluate(() => KF.gameData('naturales-entorno').exam)).toMatchObject({ grade: 'Notable' });
  await expect(page.locator('#play-vocab')).toHaveCount(0);
});

test('the exam with every answer right is «Sobresaliente»', async ({ page, tap }) => {
  test.setTimeout(90_000);
  await open(page, URL);
  await tap(page.locator('#exam-btn'));
  await cn.playSession(page, tap);
  await expect(page.locator('#finish .grade b')).toHaveText('Sobresaliente');
  await expect(page.locator('#finish .score-pill')).toContainText('12 / 12');
  await expect(page.locator('#finish .rrow .okmark')).toHaveCount(8);
});

test('Ukrainian glossary: in the intro dialog of every station, behind the 📖 button during a round', async ({ page, tap }) => {
  await open(page, URL);
  const vocab = await page.evaluate(() => Object.fromEntries(CN_CONTENT.stations.map((s) => [s.id, s.vocab])));
  for (const id of Object.keys(vocab)) {
    await openIntro(page, tap, id);
    const rows = page.locator('#intro-dlg .vocab .vocab-row');
    await expect(rows, id).toHaveCount(vocab[id].length);
    await expect(page.locator('#intro-dlg .vocab h3')).toHaveText('📖 Словничок');
    await expect(rows.first().locator('dt')).toHaveAttribute('lang', 'es');
    await expect(rows.first().locator('dt')).toHaveText(vocab[id][0][0]);
    await expect(rows.first().locator('dd')).toHaveAttribute('lang', 'uk');
    await expect(rows.first().locator('dd')).toHaveText(vocab[id][0][1]);
    await tap(page.locator('#intro-back'));
  }
  await openStation(page, tap, 'rocas');
  const btn = page.locator('#play-vocab');
  await expect(btn).toBeVisible();
  await tap(btn);
  await expect(page.locator('#vocab-dlg .vocab-row')).toHaveCount(vocab.rocas.length);
  await tap(page.locator('#vocab-close'));
  await expect(page.locator('#vocab-dlg')).toHaveCount(0);
  // the round goes on after the dialog
  await cn.answerTask(page, tap);
  await expect(page.locator('#feedback .fb')).toBeVisible();
});

test('Spanish site (?lang=es): a round with a label and the filter, no Cyrillic, no glossary', async ({ page, tap }) => {
  await open(page, URL, { lang: 'es' });
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expectNoCyrillic(page, 'on the hub');
  for (const id of ['ecosistema', 'filtro']) {
    await openIntro(page, tap, id);
    await expect(page.locator('#intro-dlg')).toBeVisible();
    await expect(page.locator('.vocab, .vocab-list, #vocab-dlg, #play-vocab')).toHaveCount(0);
    await expectNoCyrillic(page, `in the ${id} dialog`);
    await tap(page.locator('#intro-go'));
    await expect(page.locator('#play')).toBeVisible();
    await expect(page.locator('.vocab, .vocab-list, #vocab-dlg, #play-vocab')).toHaveCount(0);
    await expectNoCyrillic(page, `on the first ${id} task`);
    await cn.playSession(page, tap);
    await expectNoCyrillic(page, `on the ${id} finish screen`);
    await tap(page.locator('#finish .actions .btn').last());
    await expect(page.locator('#hub')).toBeVisible();
  }
  expect(await page.evaluate(() => /[Ѐ-ӿ]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
});
