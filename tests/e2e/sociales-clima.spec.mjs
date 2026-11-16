// «La vuelta al mundo en globo» (Sociales 3.º, Tema 2): an exam unit on the shared engine with three own task types (spainMap,
// climograma, spot), practice at half a coin and a final exam re-themed as a balloon flight (clouds, a storm lands the balloon, radar).
// Expected texts come from the plan (.pi/plan-sociales-clima.md); answers come from the content itself.
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer, unitPage } from './drivers.mjs';

const SLUG = 'sociales-clima';
const URL = `/games/${SLUG}/`;
const sc = examPlayer('__sc');
const { startFromIntro, openIntro, allTasks, taskWhere, playOnly } = unitPage('SC_CONTENT', '__sc');
const fbTitle = (page) => page.locator('#feedback .fb-title').last();
const SOFT = '¡Bien hecho! 🎈';
const OWN = ['spainMap', 'climograma', 'spot'];
const FOOTBALL = /⚽|🟨|🟥|\bgol(es|azo)?\b|partido|árbitro|tarjeta|expuls|\bVAR\b/i;
const examData = (page) => page.evaluate((s) => KF.gameData(s).exam ?? null, SLUG);
const visibleText = (page) => page.evaluate(() => document.getElementById('exam-root').innerText);
const expectNoFootball = async (page, what) => expect(await visibleText(page), what).not.toMatch(FOOTBALL);

test('hub: eight stations, the balloon hero with 8 empty stamps, the exam card warns about the storm', async ({ page }) => {
  await open(page, URL);
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expect(page.locator('#hub h1')).toHaveText('La vuelta al mundo en globo');
  const hero = page.locator('#hero-art svg.sc-hero');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveAttribute('data-passed', '0');
  await expect(page.locator('#hero-art g.sc-stamp')).toHaveCount(8);
  await expect(page.locator('#hero-art g.sc-stamp.is-on')).toHaveCount(0);
  const info = page.locator('#exam-info');
  await expect(info).toContainText('15 preguntas');
  await expect(info).toContainText('☁️');
  await expect(info).toContainText('⛈️');
  await expect(info).toContainText('no hay monedas');
  await expectNoFootball(page, 'hub');
  expect(await record(page, SLUG)).toBeNull();
});

test('hub hero: a passed station stamps its slot', async ({ page }) => {
  await open(page, URL);
  await page.evaluate((s) => {
    const d = KF.gameData(s);
    KF.gameData(s, { ...d, st: { ...(d.st || {}), zonas: { best: 6, max: 6, stars: 3, plays: 1 } } });
    __sc.toHub();
  }, SLUG);
  await expect(page.locator('#hero-art svg.sc-hero')).toHaveAttribute('data-passed', '1');
  await expect(page.locator('#hero-art g.sc-stamp.is-on')).toHaveCount(1);
  await expect(page.locator('#hero-art g.sc-stamp[data-stamp="3"]')).toHaveClass(/is-on/);
});

test('a station from its tile: a round of 6 with every own type at most twice, perfect = 6 × 0.5 + the bonus; 🎈 is the score icon', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL);
  const c0 = await coins(page);
  await startFromIntro(page, tap, 'forma');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#read-screen')).toBeHidden();
  await expect(page.locator('#goals')).toHaveText('🎈 0');
  const s = await sc.session(page);
  expect(s.tasks).toHaveLength(6);
  for (const k of OWN) expect(s.tasks.filter((t) => t.type === k).length, k).toBeLessThanOrEqual(2);
  expect(
    s.tasks.some((t) => t.type === 'spot'),
    'spot always in a forma round',
  ).toBe(true);
  await sc.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('6 / 6');
  await expect(page.locator('#finish .score-pill small')).toHaveText('🎈');
  await expectNoFootball(page, 'station finish');
  expect(await page.evaluate((x) => KF.gameData(x).st.forma, SLUG)).toMatchObject({ best: 6, max: 6, stars: 3, plays: 1 });
  expect((await coins(page)) - c0).toBe(8);
});

test('the engine default score icon stays ⚽ in another unit', async ({ page }) => {
  await open(page, '/games/lengua-poemas/');
  await page.evaluate(() => __lp.startStation('derivadas'));
  await expect(page.locator('#goals')).toHaveText('⚽ 0');
});

// ---------- spainMap ----------

test('spainMap weather: right first time; one wrong symbol (right regions lock, the wrong one empties) then fixed = soft; twice wrong = revealed', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'spainMap', (x) => x.mode === 'weather');
  await playOnly(page, t, t, t);
  const asked = Object.keys(t.answer);
  await expect(page.locator('#work .sc-mapgame')).toHaveAttribute('data-mode', 'weather');
  await expect(page.locator('#work .sc-reg.is-asked')).toHaveCount(asked.length);
  await expect(page.locator('#work .sc-tok')).toHaveCount(t.tokens.length);
  await expect(page.locator('#work .sc-forecast-text')).toHaveText(t.text);
  await sc.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(page.locator('#work .sc-ring.is-right')).toHaveCount(asked.length);
  for (const [r, tok] of Object.entries(t.answer))
    await expect(page.locator(`#work .sc-reg[data-region="${r}"]`)).toHaveAttribute('data-token', tok);
  await sc.next(page, tap);

  // one wrong check, step by step
  const [r0, a0] = Object.entries(t.answer)[0];
  const other = t.tokens.find((x) => x.id !== a0).id;
  for (const [r, tok] of Object.entries(t.answer)) {
    await tap(page.locator(`#work .sc-tok[data-token="${r === r0 ? other : tok}"]`));
    await tap(page.locator(`#work .sc-pill[data-region="${r}"]`));
  }
  await tap(page.locator('#work .sc-check'));
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await expect(page.locator(`#work .sc-reg[data-region="${r0}"]`)).toHaveAttribute('data-token', '');
  await expect(page.locator('#work .sc-ring.is-wrong')).toHaveCount(1);
  await expect(page.locator('#work .sc-reg.is-locked')).toHaveCount(asked.length - 1);
  // a locked (right) region keeps its token
  const [r1, a1] = Object.entries(t.answer)[1];
  await tap(page.locator(`#work .sc-pill[data-region="${r1}"]`));
  await expect(page.locator(`#work .sc-reg[data-region="${r1}"]`)).toHaveAttribute('data-token', a1);
  await tap(page.locator(`#work .sc-tok[data-token="${a0}"]`));
  await tap(page.locator(`#work .sc-pill[data-region="${r0}"]`));
  await tap(page.locator('#work .sc-check'));
  await expect(fbTitle(page)).toHaveText(SOFT);
  await sc.next(page, tap);

  await sc.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#work .sc-ring.is-fixed')).toHaveCount(1);
  await expect(page.locator(`#work .sc-reg[data-region="${r0}"]`)).toHaveAttribute('data-token', a0);
  expect((await sc.session(page)).results).toEqual([true, true, false]);
});

test('spainMap: Check with an empty region only hints (no try used); a tap on a region with the chosen token empties it', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'spainMap', (x) => x.mode === 'climate');
  await playOnly(page, t);
  const [r0, a0] = Object.entries(t.answer)[0];
  await tap(page.locator(`#work .sc-tok[data-token="${a0}"]`));
  await expect(page.locator(`#work .sc-tok[data-token="${a0}"]`)).toHaveAttribute('aria-pressed', 'true');
  await tap(page.locator(`#work .sc-pill[data-region="${r0}"]`));
  await expect(page.locator(`#work .sc-reg[data-region="${r0}"]`)).toHaveAttribute('data-token', a0);
  await tap(page.locator(`#work .sc-pill[data-region="${r0}"]`));
  await expect(page.locator(`#work .sc-reg[data-region="${r0}"]`)).toHaveAttribute('data-token', '');
  await tap(page.locator('#work .sc-check'));
  await expect(page.locator('#work .inline-hint')).not.toHaveText('');
  expect(await page.evaluate(() => __sc.session.answered)).toBe(false);
  // now all right at the first real check: not soft
  await sc.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
});

test('spainMap climate: the regions take their climate colour; not-asked regions are not clickable', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'spainMap', (x) => x.mode === 'climate');
  await playOnly(page, t);
  await expect(page.locator('#work .sc-mapgame')).toHaveAttribute('data-mode', 'climate');
  const notAsked = page.locator('#work .sc-reg:not(.is-asked)').first();
  const id = await notAsked.getAttribute('data-region');
  expect(Object.keys(t.answer)).not.toContain(id);
  await tap(page.locator(`#work .sc-tok[data-token="${t.tokens[0].id}"]`));
  await notAsked.dispatchEvent('click');
  await expect(notAsked).not.toHaveAttribute('data-token', /./);
  await sc.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(page.locator('#work .sc-mapgame')).toHaveClass(/is-done/);
});

// ---------- climograma ----------

test('climograma tapMonth: right; a wrong month first (soft); twice wrong shows the month name', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'climograma', (x) => x.mode === 'tapMonth');
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .sc-col')).toHaveCount(12);
  await expect(page.locator('#work .sc-bar')).toHaveCount(12);
  await expect(page.locator('#work .sc-dot')).toHaveCount(12);
  await sc.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(page.locator(`#work .sc-col[data-month="${t.answer}"]`)).toHaveClass(/is-right/);
  await sc.next(page, tap);
  await sc.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await expect(page.locator(`#work .sc-col[data-month="${(t.answer + 1) % 12}"]`)).toHaveClass(/is-wrong/);
  await sc.next(page, tap);
  await sc.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  const MONTHS = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  await expect(page.locator('#feedback')).toContainText(new RegExp(MONTHS[t.answer], 'i'));
  await expect(page.locator(`#work .sc-col[data-month="${t.answer}"]`)).toHaveClass(/is-fixed/);
  expect((await sc.session(page)).results).toEqual([true, true, false]);
});

test('climograma tapMonth on the book table: the warmest month is julio (20 °C)', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'climograma', (x) => x.mode === 'tapMonth' && /calor/.test(x.q) && /libro/i.test(x.place ?? ''));
  expect(t, 'a tapMonth «más calor» on the book data').toBeTruthy();
  await playOnly(page, t);
  await tap(page.locator('#work .sc-col[data-month="6"]'));
  await expect(page.locator('#work .sc-picked-val')).toHaveText(/julio/i);
  await tap(page.locator('#work .sc-check'));
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
});

test('climograma fillBar: build the bar right; at 0 the first check only hints; one wrong value (soft); twice wrong shows «N mm»', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'climograma', (x) => x.mode === 'fillBar');
  const v = t.rain[t.missing];
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .sc-col.is-miss')).toHaveAttribute('data-month', String(t.missing));
  if (t.table) await expect(page.locator('#work .sc-table td.is-miss')).toHaveCount(2);
  await tap(page.locator('#work .sc-check'));
  await expect(page.locator('#work .inline-hint')).not.toHaveText('');
  expect(await page.evaluate(() => __sc.session.answered)).toBe(false);
  await sc.answerTask(page, tap);
  await expect(page.locator('#work .sc-step-val')).toHaveText(`${v} mm`);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await sc.next(page, tap);
  await sc.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await sc.next(page, tap);
  await sc.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback')).toContainText(`${v} mm`);
  await expect(page.locator('#work .sc-climo')).toHaveClass(/is-fixed/);
  expect((await sc.session(page)).results).toEqual([true, true, false]);
});

// ---------- spot ----------

test('spot: every human-made thing found = right; one natural tap first = soft; two = not right', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'spot');
  await playOnly(page, t, t, t);
  await expect(page.locator('#work .sc-spot')).toHaveAttribute('data-scene', t.scene);
  await sc.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(page.locator('#work .sc-hit.is-right')).toHaveCount(t.find.length);
  await expect(page.locator('#work .sc-found-text')).toHaveText(`Encontrados: ${t.find.length} de ${t.find.length}`);
  await sc.next(page, tap);
  await sc.answerTask(page, tap, { mistakes: 1 });
  await expect(fbTitle(page)).toHaveText(SOFT);
  await expect(page.locator('#work .sc-hit.is-wrong')).toHaveCount(1);
  await sc.next(page, tap);
  await sc.answerTask(page, tap, { wrong: true });
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  expect((await sc.session(page)).results).toEqual([true, true, false]);
});

test('spot: the 3rd wrong tap ends it at once and marks the missing ones', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'spot');
  await playOnly(page, t);
  const others = await page.evaluate(
    ([s, f]) =>
      SCArt.spotItems(s)
        .map((i) => i.id)
        .filter((id) => !f.includes(id)),
    [t.scene, t.find],
  );
  expect(others.length).toBeGreaterThanOrEqual(3);
  await tap(page.locator(`#work .sc-hit[data-id="${t.find[0]}"]`));
  await expect(page.locator('#work .sc-found-text')).toHaveText(`Encontrados: 1 de ${t.find.length}`);
  for (const id of others.slice(0, 2)) await tap(page.locator(`#work .sc-hit[data-id="${id}"]`));
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await tap(page.locator(`#work .sc-hit[data-id="${others[2]}"]`));
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#work .sc-hit.is-fixed')).toHaveCount(t.find.length - 1);
});

// ---------- the final exam ----------

test('the final exam perfect: 15 tasks by perStation, no coin until the end, then 15 + the bonus 5; no football words', async ({
  page,
  tap,
}) => {
  test.setTimeout(150_000);
  await open(page, URL);
  const c0 = await coins(page);
  await tap(page.locator('#exam-btn'));
  const s = await sc.session(page);
  expect(s.mode).toBe('exam');
  expect(s.tasks).toHaveLength(15);
  const per = await page.evaluate(() => SC_CONTENT.exam.perStation);
  for (const [id, n] of Object.entries(per)) expect(s.tasks.filter((t) => t.station === id).length, id).toBe(n);
  for (const k of OWN) expect(s.tasks.filter((t) => t.type === k).length, k).toBeLessThanOrEqual(1);
  for (let i = 0; i < s.tasks.length; i++) {
    await sc.answerTask(page, tap);
    await expect(page.locator('#feedback .fb.ok'), `task ${i + 1}`).toBeVisible();
    expect(await coins(page), `coins after answer ${i + 1}`).toBe(c0);
    await sc.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText('15 / 15');
  await expect(page.locator('#finish .score-pill small')).toHaveText('🎈');
  await expect(page.locator('#finish .msg')).toContainText('¡Cielo despejado, sin nubes!');
  await expectNoFootball(page, 'exam finish');
  expect((await coins(page)) - c0).toBe(20);
  expect(await examData(page)).toMatchObject({ nota: '10,0' });
});

const missableExam = async (page, tap, n) => {
  await tap(page.locator('#exam-btn'));
  const s = await sc.session(page);
  const missable = ['choice', 'tf', ...OWN];
  const misses = s.tasks.flatMap((t, i) => (missable.includes(t.type) ? [i] : [])).slice(0, n);
  expect(misses).toHaveLength(n);
  return misses;
};

test('the final exam: each mistake a ☁️ cloud, the 4th a ⛈️ storm — the balloon lands, no coins, no exam record', async ({ page, tap }) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const c0 = await coins(page);
  const misses = await missableExam(page, tap, 4);
  const last = misses[3];
  for (let i = 0; i <= last; i++) {
    const wrong = misses.includes(i);
    await sc.answerTask(page, tap, { wrong, mistakes: wrong ? 2 : 0 });
    await expect(page.locator(`#feedback .fb.${wrong ? 'miss' : 'ok'}`), `task ${i + 1}`).toBeVisible();
    const n = misses.indexOf(i) + 1;
    if (n >= 1 && n < 4) {
      await expect(page.locator('#feedback .ref-card.y')).toBeVisible();
      await expect(page.locator('#feedback .ref .fb-title')).toHaveText('¡Una nube!');
      const left = 4 - n;
      await expect(page.locator('#feedback .ref')).toContainText(
        `¡Cuidado! ${left === 1 ? 'Falta 1 fallo' : `Faltan ${left} fallos`} para la tormenta.`,
      );
      await expect(page.locator('#cards i.y')).toHaveCount(n);
      await expectNoFootball(page, `cloud ${n}`);
    }
    expect(await coins(page)).toBe(c0);
    if (i < last) await sc.next(page, tap);
  }
  await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
  await expect(page.locator('#feedback .ref .fb-title')).toHaveText('¡Tormenta!');
  await expect(page.locator('#feedback .ref')).toContainText('El globo tiene que aterrizar.');
  await expect(page.locator('#var-btn')).toHaveText('📡 Radar: esquivar la tormenta (2 🪙)');
  await expectNoFootball(page, 'storm');
  await page.locator('#feedback .fb-actions .btn').first().click();
  const fin = page.locator('#finish');
  await expect(fin).toHaveAttribute('data-sendoff', '1');
  await expect(fin.locator('h1')).toHaveText('¡Aterrizaje forzoso! ⛈️');
  await expect(fin.locator('.msg')).toContainText('Con 4 fallos la tormenta obliga al globo a aterrizar.');
  await expect(fin.locator('.score-pill small')).toHaveText('🎈');
  await expectNoFootball(page, 'landing');
  expect(await coins(page)).toBe(c0);
  expect(await examData(page)).toBeNull();
});

test('the final exam: the radar dodges the storm for 2 coins (key A), the flight goes on; the next storm lands the balloon', async ({
  page,
  tap,
}) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const c0 = await coins(page);
  const misses = await missableExam(page, tap, 5);
  for (let i = 0; i <= misses[4]; i++) {
    const wrong = misses.includes(i);
    await sc.answerTask(page, tap, { wrong, mistakes: wrong ? 2 : 0 });
    await expect(page.locator(`#feedback .fb.${wrong ? 'miss' : 'ok'}`), `task ${i + 1}`).toBeVisible();
    if (i === misses[3]) {
      await expect(page.locator('#var-btn')).toHaveText('📡 Radar: esquivar la tormenta (2 🪙)');
      await page.keyboard.press('a');
      await expect(page.locator('#var-btn')).toHaveCount(0);
      await expect(page.locator('#feedback .ref .fb-title')).toHaveText('Radar: ¡tormenta esquivada!');
      await expect(page.locator('#feedback .ref-card.y')).toBeVisible();
      expect((await coins(page)) - c0).toBe(-2);
      await expect(page.locator('#cards i')).toHaveCount(3);
      await expectNoFootball(page, 'radar');
    }
    if (i < misses[4]) await sc.next(page, tap);
  }
  await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
  await expect(page.locator('#var-btn')).toHaveCount(0);
  await sc.next(page, tap);
  await expect(page.locator('#finish')).toHaveAttribute('data-sendoff', '1');
  await expect(page.locator('#finish h1')).toHaveText('¡Aterrizaje forzoso! ⛈️');
  expect((await coins(page)) - c0).toBe(-2);
});

// ---------- languages ----------

test('Ukrainian site: the glossary in a station dialog', async ({ page, tap }) => {
  await open(page, URL);
  const v = await page.evaluate(() => SC_CONTENT.stations[0].vocab);
  await openIntro(page, tap, 'tiempo');
  await expect(page.locator('#intro-dlg .vocab .vocab-row')).toHaveCount(v.length);
  await expect(page.locator('#intro-dlg .vocab-row dd').first()).toHaveText(v[0][1]);
});

test('Spanish site (?lang=es): hub, a dialog, the rule note, every own type (wrong) and the finish — no Cyrillic, no glossary', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL, { lang: 'es' });
  await expectNoCyrillic(page, 'on the hub');
  await openIntro(page, tap, 'espana');
  await expectNoCyrillic(page, 'in the station dialog');
  await expect(page.locator('#intro-dlg .vocab')).toHaveCount(0);
  await tap(page.locator('#intro-read'));
  await expect(page.locator('#text-dlg')).toHaveJSProperty('open', true);
  await expectNoCyrillic(page, 'on the rule note');
  await tap(page.locator('#text-close'));
  await tap(page.locator('#intro-back'));
  const tasks = [
    await taskWhere(page, 'spainMap', (x) => x.mode === 'weather'),
    await taskWhere(page, 'spainMap', (x) => x.mode === 'climate'),
    await taskWhere(page, 'climograma', (x) => x.mode === 'tapMonth'),
    await taskWhere(page, 'climograma', (x) => x.mode === 'fillBar'),
    await taskWhere(page, 'spot'),
  ];
  await playOnly(page, ...tasks);
  for (const t of tasks) {
    await expectNoCyrillic(page, `on the ${t.type} task`);
    await sc.answerTask(page, tap, { wrong: true });
    await expectNoCyrillic(page, `after the ${t.type} answer`);
    await sc.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expectNoCyrillic(page, 'on the finish screen');
  expect(await page.evaluate(() => /[Ѐ-ӿ]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
});

// every task of the content renders and can be answered right (data-driven: catches a task whose data the renderer cannot play)
test('every own-type task of the content is playable right by its data', async ({ page, tap }) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const tasks = (await allTasks(page)).filter((t) => OWN.includes(t.type));
  await playOnly(page, ...tasks);
  for (const t of tasks) {
    await sc.answerTask(page, tap);
    await expect(page.locator('#feedback .fb.ok'), `${t.station}: ${t.q}`).toBeVisible();
    await sc.next(page, tap);
  }
  await expect(page.locator('#finish .score-pill')).toContainText(`${tasks.length} / ${tasks.length}`);
});
