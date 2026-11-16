// «La liga de las palabras» (Lengua 3.º, Tema 3): an exam unit on the shared engine with three own task types (forge, save,
// substitute), «fix» from lengua-mundo, practice at half a coin and a final exam where the 4th card sends the player off.
// Answers come from the content itself (never hardcoded texts).
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer, unitPage } from './drivers.mjs';

const SLUG = 'lengua-poemas';
const URL = `/games/${SLUG}/`;
const lp = examPlayer('__lp');
const { startFromIntro, openIntro, allTasks, taskWhere, playOnly } = unitPage('LP_CONTENT', '__lp');
const fbTitle = (page) => page.locator('#feedback .fb-title').last();
const SOFT = '¡Bien hecho! ⚽';
const OWN = ['forge', 'save', 'substitute'];
// The longest task of a type (by its data), so every check runs on the biggest case.
const biggest = async (page, type, ok = () => true) =>
  (await allTasks(page)).filter((t) => t.type === type && ok(t)).sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0];
const examData = (page) => page.evaluate((s) => KF.gameData(s).exam ?? null, SLUG);

test('hub: eight stations, the stadium hero, the exam card warns about the send-off', async ({ page }) => {
  await open(page, URL);
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expect(page.locator('#hub h1')).toHaveText('La liga de las palabras');
  await expect(page.locator('#hero-art svg.lp-hero')).toBeVisible();
  const info = page.locator('#exam-info');
  await expect(info).toContainText('14 preguntas');
  await expect(info).toContainText('4.ª');
  await expect(info).toContainText('expulsión y sin monedas');
  expect(await record(page, SLUG)).toBeNull();
});

test('a station from its tile: straight to the questions (readFirst: false), a perfect round of 6 pays 6 × 0.5 + the bonus 5', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const c0 = await coins(page);
  await startFromIntro(page, tap, 'derivadas');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#read-screen')).toBeHidden();
  const s = await lp.session(page);
  expect(s.tasks).toHaveLength(6);
  // at most 2 of each new multi-step type in a practice round
  for (const k of OWN) expect(s.tasks.filter((t) => t.type === k).length, k).toBeLessThanOrEqual(2);
  await lp.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('6 / 6');
  expect(await page.evaluate((x) => KF.gameData(x).st.derivadas, SLUG)).toMatchObject({ best: 6, max: 6, stars: 3, plays: 1 });
  expect((await coins(page)) - c0).toBe(8);
  await tap(page.locator('#finish .actions .btn').last());
  await expect(page.locator('#hub')).toBeVisible();
});

test('forge: right first time prints the word; a wrong stem first (soft, the right suffix stays green); twice wrong shows the word', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await biggest(page, 'forge');
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .lp-stem')).toHaveCount(t.stems.length);
  await expect(page.locator('#work .lp-suf')).toHaveCount(t.suffixes.length);
  await lp.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(page.locator('#work .lp-press')).toHaveClass(/is-printed/);
  await lp.next(page, tap);
  await lp.answerTask(page, tap, { mistakes: 1 });
  await expect(page.locator('#work .lp-tile.is-wrong')).toHaveCount(1);
  await expect(fbTitle(page)).toHaveText(SOFT);
  await lp.next(page, tap);
  await lp.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback')).toContainText(t.word);
  expect((await lp.session(page)).results).toEqual([true, true, false]);
});

test('forge: Check with a piece missing asks for it and does not count as a try', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'forge');
  await playOnly(page, t);
  await tap(page.locator(`#work .lp-stem[data-stem="${t.answer[0]}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(page.locator('#work .inline-hint')).toHaveText('Elige una raíz y una terminación.');
  expect(await page.evaluate(() => __lp.session.answered)).toBe(false);
  await tap(page.locator(`#work .lp-suf[data-suf="${t.answer[1]}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
});

test('save: letters into the gaps and the reason — a save; wrong letters first (soft, «¡Al palo!»); twice wrong = a goal and the word', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await biggest(page, 'save', (x) => x.gaps.length >= 2);
  expect(t, 'a save task with 2+ gaps').toBeTruthy();
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .lp-gap')).toHaveCount(t.gaps.length);
  await expect(page.locator('#work .lp-reason')).toHaveCount(t.reasons.length);
  await lp.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(page.locator('#work .lp-gap.is-right')).toHaveCount(t.gaps.length);
  if (await page.locator('#work .lp-goal').count()) await expect(page.locator('#work .lp-goal')).toHaveAttribute('data-pose', 'save');
  await lp.next(page, tap);
  // one wrong check: «¡Al palo!» and the round goes on
  await lp.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await lp.next(page, tap);
  await lp.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback')).toContainText(t.word);
  await expect(page.locator('#work .lp-gap.is-fixed')).toHaveCount(t.gaps.length);
  if (await page.locator('#work .lp-goal').count()) await expect(page.locator('#work .lp-goal')).toHaveAttribute('data-pose', 'goal');
  expect((await lp.session(page)).results).toEqual([true, true, false]);
});

test('save: right letters with the wrong reason is not right (the reason counts)', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'save');
  await playOnly(page, t);
  const other = t.reasons.find((r) => r !== t.rule);
  for (const g of t.gaps) {
    await tap(page.locator(`#work .lp-gap[data-i="${g}"]`));
    await tap(page.locator(`#work .lp-letter[data-letter="${t.word[g]}"]`));
  }
  await tap(page.locator(`#work .lp-reason[data-rule="${other}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(page.locator('#feedback .fb')).toHaveCount(0); // a retry, not an answer
  await expect(page.locator(`#work .lp-reason[data-rule="${other}"]`)).toHaveClass(/is-wrong/);
  await expect(page.locator('#work .lp-gap.is-right')).toHaveCount(t.gaps.length);
  await tap(page.locator(`#work .lp-reason[data-rule="${t.rule}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(fbTitle(page)).toHaveText(SOFT);
});

test('substitute: the phrase goes off, the pronoun comes on, the sentence shows the result; wrong pronoun first (soft); twice wrong shows it', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await biggest(page, 'substitute');
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .lp-chunk')).toHaveCount(t.chunks.length);
  await expect(page.locator('#work .lp-pron')).toHaveCount(t.options.length);
  await lp.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(page.locator('#work .lp-result')).toHaveText(t.result);
  await lp.next(page, tap);
  await lp.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await lp.next(page, tap);
  await lp.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#work .lp-result')).toHaveText(t.result);
  await expect(page.locator('#feedback')).toContainText(t.result.replace(/\.$/, ''));
  expect((await lp.session(page)).results).toEqual([true, true, false]);
});

test('substitute: the right pronoun on the wrong phrase is not right', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'substitute');
  await playOnly(page, t);
  const other = t.chunks.findIndex((_, i) => i !== t.target);
  await tap(page.locator(`#work .lp-chunk[data-i="${other}"]`));
  await tap(page.locator(`#work .lp-pron[data-p="${t.answer}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await expect(page.locator(`#work .lp-chunk[data-i="${other}"]`)).toHaveClass(/is-wrong/);
  await tap(page.locator(`#work .lp-chunk[data-i="${t.target}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(fbTitle(page)).toHaveText(SOFT);
});

test('fix (from lengua-mundo) works in this unit', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'fix');
  await playOnly(page, t);
  await lp.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
});

test('the final exam perfect: 14 tasks from every station, no coin until the end, then 14 + the bonus 5', async ({ page, tap }) => {
  test.setTimeout(150_000);
  await open(page, URL);
  const c0 = await coins(page);
  await tap(page.locator('#exam-btn'));
  const s = await lp.session(page);
  expect(s.mode).toBe('exam');
  expect(s.tasks).toHaveLength(14);
  const per = await page.evaluate(() => LP_CONTENT.exam.perStation);
  for (const [id, n] of Object.entries(per)) expect(s.tasks.filter((t) => t.station === id).length, id).toBe(n);
  for (let i = 0; i < s.tasks.length; i++) {
    await lp.answerTask(page, tap);
    await expect(page.locator('#feedback .fb.ok')).toBeVisible();
    expect(await coins(page), `coins after answer ${i + 1}`).toBe(c0);
    await lp.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish')).not.toHaveAttribute('data-sendoff', /./);
  await expect(page.locator('#finish .score-pill')).toContainText('14 / 14');
  await expect(page.locator('#finish .grade b')).toHaveText('Sobresaliente');
  expect((await coins(page)) - c0).toBe(19);
  expect(await examData(page)).toMatchObject({ nota: '10,0' });
});

test('the final exam: the 4th mistake is the red card — sent off, no coins, no exam record', async ({ page, tap }) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const c0 = await coins(page);
  await tap(page.locator('#exam-btn'));
  const s = await lp.session(page);
  // tasks the driver can get wrong
  const missable = ['choice', 'tf', ...OWN];
  const misses = s.tasks.flatMap((t, i) => (missable.includes(t.type) ? [i] : [])).slice(0, 4);
  expect(misses).toHaveLength(4);
  const last = misses[3];
  for (let i = 0; i <= last; i++) {
    const wrong = misses.includes(i);
    await lp.answerTask(page, tap, { wrong, mistakes: wrong ? 2 : 0 });
    await expect(page.locator(`#feedback .fb.${wrong ? 'miss' : 'ok'}`), `task ${i + 1}`).toBeVisible();
    const n = misses.indexOf(i) + 1;
    if (n >= 1 && n < 4) await expect(page.locator('#feedback .ref')).toContainText(`¡Cuidado! Te quedan ${4 - n}.`);
    expect(await coins(page)).toBe(c0);
    if (i < last) await lp.next(page, tap);
  }
  await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
  await page.locator('#feedback .fb-actions .btn').first().click();
  const fin = page.locator('#finish');
  await expect(fin).toHaveAttribute('data-sendoff', '1');
  await expect(fin.locator('h1')).toHaveText('¡Expulsado! 🟥');
  await expect(fin.locator('.msg')).toContainText('Con 4 fallos');
  await expect(fin.locator('.actions .btn')).toHaveText(['Otra vez', 'A las estaciones']);
  expect(await coins(page)).toBe(c0);
  expect(await examData(page)).toBeNull();
  const right = last + 1 - 4;
  expect(await record(page, SLUG)).toMatchObject({ plays: 1, best: Math.round((right / 14) * 10), max: 10 });
});

test('Ukrainian site: the glossary in a station dialog', async ({ page, tap }) => {
  await open(page, URL);
  const v = await page.evaluate(() => LP_CONTENT.stations[0].vocab);
  await openIntro(page, tap, 'derivadas');
  await expect(page.locator('#intro-dlg .vocab .vocab-row')).toHaveCount(v.length);
  await expect(page.locator('#intro-dlg .vocab-row dd').first()).toHaveText(v[0][1]);
});

test('Spanish site (?lang=es): hub, a dialog, the rule note, every own type + fix and the finish — no Cyrillic, no glossary', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL, { lang: 'es' });
  await expectNoCyrillic(page, 'on the hub');
  await openIntro(page, tap, 'pronombres');
  await expectNoCyrillic(page, 'in the station dialog');
  await expect(page.locator('#intro-dlg .vocab')).toHaveCount(0);
  await tap(page.locator('#intro-read'));
  await expect(page.locator('#text-dlg')).toHaveJSProperty('open', true);
  await expectNoCyrillic(page, 'on the rule note');
  await tap(page.locator('#text-close'));
  await tap(page.locator('#intro-back'));
  const tasks = [];
  for (const type of [...OWN, 'fix']) tasks.push(await taskWhere(page, type));
  await playOnly(page, ...tasks);
  for (const t of tasks) {
    await expectNoCyrillic(page, `on the ${t.type} task`);
    await lp.answerTask(page, tap, { wrong: t.type !== 'fix' });
    await expectNoCyrillic(page, `after the ${t.type} answer`);
    await lp.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expectNoCyrillic(page, 'on the finish screen');
  expect(await page.evaluate(() => /[Ѐ-ӿ]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
});

test('forge: the right stem with a wrong suffix is not right (both pieces count); the stem stays green', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'forge');
  await playOnly(page, t);
  const other = t.suffixes.find((x) => x !== t.answer[1]);
  await tap(page.locator(`#work .lp-stem[data-stem="${t.answer[0]}"]`));
  await tap(page.locator(`#work .lp-suf[data-suf="${other}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await expect(page.locator(`#work .lp-stem[data-stem="${t.answer[0]}"]`)).toHaveClass(/is-right/);
  await expect(page.locator(`#work .lp-suf[data-suf="${other}"]`)).toHaveClass(/is-wrong/);
});

test('save: one gap right and one wrong is not right (every gap counts); the right one stays green', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'save', (x) => x.gaps.length >= 2);
  await playOnly(page, t);
  const flip = (c) => (c === 'b' ? 'v' : 'b');
  for (const [k, g] of t.gaps.entries()) {
    await tap(page.locator(`#work .lp-gap[data-i="${g}"]`));
    await tap(page.locator(`#work .lp-letter[data-letter="${k === 0 ? t.word[g] : flip(t.word[g])}"]`));
  }
  await tap(page.locator(`#work .lp-reason[data-rule="${t.rule}"]`));
  await tap(page.locator('#work .lp-check'));
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await expect(page.locator(`#work .lp-gap[data-i="${t.gaps[0]}"]`)).toHaveClass(/is-right/);
  await expect(page.locator(`#work .lp-gap[data-i="${t.gaps[1]}"]`)).toHaveClass(/is-wrong/);
});

test('the final exam: the 4th mistake offers the VAR for 2 coins; used, the exam goes on; the next mistake sends off', async ({
  page,
  tap,
}) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const c0 = await coins(page);
  await tap(page.locator('#exam-btn'));
  const s = await lp.session(page);
  const missable = ['choice', 'tf', ...OWN];
  const misses = s.tasks.flatMap((t, i) => (missable.includes(t.type) ? [i] : [])).slice(0, 5);
  expect(misses).toHaveLength(5);
  for (let i = 0; i <= misses[4]; i++) {
    const wrong = misses.includes(i);
    await lp.answerTask(page, tap, { wrong, mistakes: wrong ? 2 : 0 });
    await expect(page.locator(`#feedback .fb.${wrong ? 'miss' : 'ok'}`), `task ${i + 1}`).toBeVisible();
    if (i === misses[3]) {
      await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
      await expect(page.locator('#var-btn')).toHaveText('📺 VAR: anular la roja (2 🪙)');
      await tap(page.locator('#var-btn'));
      expect((await coins(page)) - c0).toBe(-2);
      await expect(page.locator('#cards i')).toHaveCount(3);
    }
    if (i < misses[4]) await lp.next(page, tap);
  }
  await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
  await expect(page.locator('#var-btn')).toHaveCount(0);
  await lp.next(page, tap);
  await expect(page.locator('#finish')).toHaveAttribute('data-sendoff', '1');
  expect((await coins(page)) - c0).toBe(-2);
});
