// «Expedición safari» (Naturales 3.º, Unidad 2): an exam unit on the shared engine with two own task types (ficha, clave), practice at
// half a coin and a final exam re-themed as a jeep safari (🕳️ potholes, the 4th = 🛞 a flat tyre stops the jeep, 🔧 a spare wheel).
// Expected behaviour from the plan (.pi/plan-naturales-animales.md: the ficha / clave contracts, exam settings, theme) and the hooks
// (/tmp/na-design/hooks.md); answers come from the content itself.
import { test, expect, open, coins, record, expectNoCyrillic } from './helpers.mjs';
import { examPlayer, unitPage } from './drivers.mjs';

const SLUG = 'naturales-animales';
const URL = `/games/${SLUG}/`;
const na = examPlayer('__na');
const { startFromIntro, openIntro, allTasks, taskWhere, playOnly } = unitPage('NA_CONTENT', '__na');
const fbTitle = (page) => page.locator('#feedback .fb-title').last();
const SOFT = '¡Bien hecho! 📸';
const OWN = ['ficha', 'clave'];
// «cuaderno de campo» = the explorer's field notebook (plan, station 8), not a pitch: taken out before the check.
const FOOTBALL = /⚽|🟨|🟥|\bgol(es|azo)?\b|partido|árbitro|\bcampo\b|tarjeta|expuls|\bVAR\b/i;
const examData = (page) => page.evaluate((s) => KF.gameData(s).exam ?? null, SLUG);
const visibleText = (page) => page.evaluate(() => document.getElementById('exam-root').innerText.replace(/cuadernos? de campo/gi, ''));
const expectNoFootball = async (page, what) => expect(await visibleText(page), what).not.toMatch(FOOTBALL);
const results = async (page) => (await na.session(page)).results;
// The plan's row labels for the miss note («Nace: ovíparo · …»).
const ROW_SHORT = { come: 'Come', mueve: 'Se mueve', nace: 'Nace', grupo: 'Es' };
const OPT_LABEL = {
  herbivoro: 'herbívoro',
  carnivoro: 'carnívoro',
  omnivoro: 'omnívoro',
  anda: 'anda',
  salta: 'salta',
  repta: 'repta',
  nada: 'nada',
  vuela: 'vuela',
  viviparo: 'vivíparo',
  oviparo: 'ovíparo',
  ovoviviparo: 'ovovivíparo',
  mamifero: 'mamífero',
  ave: 'ave',
  pez: 'pez',
  reptil: 'reptil',
  anfibio: 'anfibio',
  invertebrado: 'invertebrado',
};

test('hub: eight stations, the jeep hero with 8 empty photos, the exam card warns about the flat tyre', async ({ page }) => {
  await open(page, URL);
  await expect(page.locator('#stations .station')).toHaveCount(8);
  await expect(page.locator('#hub h1')).toHaveText('Expedición safari');
  const hero = page.locator('#hero-art svg.na-hero');
  await expect(hero).toBeVisible();
  await expect(hero).toHaveAttribute('data-passed', '0');
  await expect(page.locator('#hero-art g.na-photo')).toHaveCount(8);
  await expect(page.locator('#hero-art g.na-photo.is-on')).toHaveCount(0);
  const info = page.locator('#exam-info');
  await expect(info).toContainText('15 preguntas');
  await expect(info).toContainText('🕳️');
  await expect(info).toContainText('🛞');
  await expect(info).toContainText('no hay monedas');
  await expectNoFootball(page, 'hub');
  expect(await record(page, SLUG)).toBeNull();
});

test('hub hero: a passed station fills its photo', async ({ page }) => {
  await open(page, URL);
  await page.evaluate((s) => {
    const d = KF.gameData(s);
    KF.gameData(s, { ...d, st: { ...(d.st || {}), nacer: { best: 6, max: 6, stars: 3, plays: 1 } } });
    __na.toHub();
  }, SLUG);
  await expect(page.locator('#hero-art svg.na-hero')).toHaveAttribute('data-passed', '1');
  await expect(page.locator('#hero-art g.na-photo.is-on')).toHaveCount(1);
});

test('a station from its tile: a round of 6 with both ficha and clave, perfect = 6 × 0.5 + the bonus; 📸 is the score icon', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL);
  const c0 = await coins(page);
  await startFromIntro(page, tap, 'ficha');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#goals')).toHaveText('📸 0');
  const s = await na.session(page);
  expect(s.tasks).toHaveLength(6);
  for (const k of OWN) expect(s.tasks.filter((t) => t.type === k).length, k).toBeGreaterThanOrEqual(1);
  // (station «ficha» has only fichas and claves: the engine's caps are soft and fill the round with them)
  await na.playSession(page, tap);
  await expect(page.locator('#finish .score-pill')).toContainText('6 / 6');
  await expect(page.locator('#finish .score-pill small')).toHaveText('📸');
  await expectNoFootball(page, 'station finish');
  expect(await page.evaluate((x) => KF.gameData(x).st.ficha, SLUG)).toMatchObject({ best: 6, max: 6, stars: 3, plays: 1 });
  expect((await coins(page)) - c0).toBe(8);
});

// ---------- ficha ----------

test('ficha: the photo and one chip row per task row; all right at the first check = ok, not soft; chips green', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'ficha', (x) => x.rows.length >= 3);
  await playOnly(page, t);
  const root = page.locator('#work .na-ficha');
  await expect(root).toHaveAttribute('data-rows', String(t.rows.length));
  await expect(page.locator(`#work figure.na-snap[data-animal="${t.animal}"] svg`)).toHaveCount(1);
  await expect(page.locator('#work .na-row')).toHaveCount(t.rows.length);
  for (const r of t.rows) {
    const n = r.options?.length ?? { come: 3, mueve: 5, nace: 3, grupo: 6 }[r.id];
    await expect(page.locator(`#work .na-row[data-row="${r.id}"] .na-opt`), r.id).toHaveCount(n);
  }
  await na.answerTask(page, tap);
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
  await expect(root).toHaveClass(/is-done/);
  for (const r of t.rows) {
    await expect(page.locator(`#work .na-row[data-row="${r.id}"]`)).toHaveAttribute('data-state', 'right');
    await expect(page.locator(`#work .na-row[data-row="${r.id}"] .na-opt[data-opt="${r.answer}"]`)).toHaveClass(/is-right/);
  }
  expect(await results(page)).toEqual([true]);
});

test('ficha: Comprobar with an empty row only hints (no try spent); then right = not soft', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'ficha');
  await playOnly(page, t);
  await tap(page.locator(`#work .na-row[data-row="${t.rows[0].id}"] .na-opt[data-opt="${t.rows[0].answer}"]`));
  await tap(page.locator('#work .na-check'));
  await expect(page.locator('#work .na-actions .inline-hint')).toHaveText('Elige una respuesta en cada fila.');
  expect(await page.evaluate(() => __na.session.answered)).toBe(false);
  for (const r of t.rows) await tap(page.locator(`#work .na-row[data-row="${r.id}"] .na-opt[data-opt="${r.answer}"]`));
  await tap(page.locator('#work .na-check'));
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
});

test('ficha retry: the 1st wrong check keeps the right rows (locked) and strikes the wrong pick; fixed = soft; a 2nd wrong check = miss with the note', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'ficha', (x) => x.rows.length >= 2 && x.rows.some((r) => (r.options?.length ?? 3) >= 3));
  await playOnly(page, t, t);
  const opts = (r) =>
    r.options ??
    {
      come: ['herbivoro', 'carnivoro', 'omnivoro'],
      mueve: ['anda', 'salta', 'repta', 'nada', 'vuela'],
      nace: ['viviparo', 'oviparo', 'ovoviviparo'],
      grupo: ['mamifero', 'ave', 'pez', 'reptil', 'anfibio', 'invertebrado'],
    }[r.id];
  const bad = t.rows.find((r) => opts(r).length >= 3);
  const [w1, w2] = opts(bad).filter((o) => o !== bad.answer);
  const chip = (r, o) => page.locator(`#work .na-row[data-row="${r}"] .na-opt[data-opt="${o}"]`);
  const row = (r) => page.locator(`#work .na-row[data-row="${r}"]`);

  // 1st: right everywhere but `bad`
  for (const r of t.rows) await tap(chip(r.id, r.id === bad.id ? w1 : r.answer));
  await tap(page.locator('#work .na-check'));
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await expect(page.locator('#work .na-actions .inline-hint')).toHaveText('Lo verde está bien. Cambia lo naranja.');
  await expect(row(bad.id)).toHaveAttribute('data-state', 'wrong');
  await expect(chip(bad.id, w1)).toHaveClass(/is-struck/);
  await expect(chip(bad.id, w1)).toBeDisabled();
  for (const r of t.rows.filter((x) => x.id !== bad.id)) {
    await expect(row(r.id)).toHaveAttribute('data-state', 'right');
    // a locked row cannot be changed: its chips are disabled
    for (const o of opts(r)) await expect(chip(r.id, o)).toBeDisabled();
  }
  await tap(chip(bad.id, bad.answer));
  await tap(page.locator('#work .na-check'));
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).toHaveText(SOFT);
  await na.next(page, tap);

  // 2nd round of the same ficha: two wrong checks = miss; the note names the right answer of the missed row only
  for (const r of t.rows) await tap(chip(r.id, r.id === bad.id ? w1 : r.answer));
  await tap(page.locator('#work .na-check'));
  await tap(chip(bad.id, w2));
  await tap(page.locator('#work .na-check'));
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback')).toContainText(`${ROW_SHORT[bad.id]}: ${OPT_LABEL[bad.answer]}`);
  for (const r of t.rows.filter((x) => x.id !== bad.id))
    await expect(page.locator('#feedback')).not.toContainText(`${ROW_SHORT[r.id]}: ${OPT_LABEL[r.answer]}`);
  await expect(row(bad.id)).toHaveAttribute('data-state', 'fixed');
  await expect(chip(bad.id, bad.answer)).toHaveClass(/is-fixed/);
  await expect(chip(bad.id, w2)).toHaveClass(/is-wrong/);
  await expect(page.locator('#work .na-check')).toBeHidden();
  expect(await results(page)).toEqual([true, false]);
});

// ---------- clave ----------

test('clave: the right path = ok, not soft; the trail has one step per node and the leaf shows the group', async ({ page, tap }) => {
  await open(page, URL);
  const t = await taskWhere(page, 'clave', (x) => x.tree === 'vertebrados' && x.answer === 'reptil');
  expect(t, 'a vertebrados clave to reptil').toBeTruthy();
  await playOnly(page, t);
  const root = page.locator('#work .na-clave');
  await expect(root).toHaveAttribute('data-tree', 'vertebrados');
  await expect(page.locator('#work ul.na-facts > li')).toHaveCount(t.facts.length);
  await expect(page.locator('#work p.na-leaf')).toBeHidden();
  // reptil = the last «no» of every question (plan: pelo, plumas, aletas, piel desnuda → else reptil)
  for (let i = 0; i < 4; i++) {
    await expect(root).toHaveAttribute('data-depth', String(i));
    await tap(page.locator('#work .na-yn-btn[data-ans="no"]'));
  }
  await expect(root).toHaveClass(/is-done/);
  await expect(root).toHaveAttribute('data-depth', '4');
  await expect(root).toHaveAttribute('data-wrong', '0');
  await expect(page.locator('#work ol.na-trail > li.na-step[data-ans="no"]')).toHaveCount(4);
  await expect(page.locator('#work p.na-leaf strong')).toHaveText('Reptil');
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).not.toHaveText(SOFT);
});

test('clave: one wrong step = retry at the same node, still ok (soft); two wrong steps = the game shows the branch, miss with the group', async ({
  page,
  tap,
}) => {
  await open(page, URL);
  const t = await taskWhere(page, 'clave', (x) => x.tree === 'vertebrados' && x.answer === 'ave');
  expect(t, 'a vertebrados clave to ave').toBeTruthy();
  await playOnly(page, t, t, t);
  const root = page.locator('#work .na-clave');
  const btn = (a) => page.locator(`#work .na-yn-btn[data-ans="${a}"]`);
  // ave = no (pelo), yes (plumas)
  await btn('yes').click();
  await expect(root).toHaveAttribute('data-depth', '0');
  await expect(root).toHaveAttribute('data-wrong', '1');
  await expect(btn('yes')).toHaveClass(/is-wrong/);
  await expect(page.locator('#work .na-clave .inline-hint')).toHaveText('Mira otra vez las pistas de la ficha.');
  await expect(page.locator('#feedback .fb')).toHaveCount(0);
  await btn('no').click();
  await btn('yes').click();
  await expect(page.locator('#feedback .fb.ok')).toBeVisible();
  await expect(fbTitle(page)).toHaveText(SOFT);
  await na.next(page, tap);

  // two wrong at the first node: the game takes «no» itself (fixed step), the walk goes on
  await btn('yes').click();
  await btn('yes').click();
  await expect(page.locator('#work li.na-step.is-fixed[data-ans="no"]')).toHaveCount(1);
  await expect(root).toHaveAttribute('data-depth', '1');
  await expect(page.locator('#work .na-clave .inline-hint')).toHaveText(/^Era «No»\./);
  await btn('yes').click();
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  await expect(page.locator('#feedback')).toContainText('Ave');
  await na.next(page, tap);

  // wrong once at two different nodes: also a miss (wrong ≤ 1 is the rule)
  await btn('yes').click();
  await btn('no').click();
  await btn('no').click();
  await expect(page.locator('#work li.na-step.is-fixed')).toHaveCount(1);
  await expect(page.locator('#feedback .fb.miss')).toBeVisible();
  expect(await results(page)).toEqual([true, false, false]);
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
  const s = await na.session(page);
  expect(s.mode).toBe('exam');
  expect(s.tasks).toHaveLength(15);
  const per = await page.evaluate(() => NA_CONTENT.exam.perStation);
  for (const [id, n] of Object.entries(per)) expect(s.tasks.filter((t) => t.station === id).length, id).toBe(n);
  await expect(page.locator('#goals')).toHaveText('📸 0');
  for (let i = 0; i < s.tasks.length; i++) {
    await na.answerTask(page, tap);
    await expect(page.locator('#feedback .fb.ok'), `task ${i + 1}`).toBeVisible();
    expect(await coins(page), `coins after answer ${i + 1}`).toBe(c0);
    await na.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText('15 / 15');
  await expect(page.locator('#finish .score-pill small')).toHaveText('📸');
  await expect(page.locator('#finish .msg')).toContainText('¡Ruta perfecta, sin baches!');
  await expectNoFootball(page, 'exam finish');
  expect((await coins(page)) - c0).toBe(20);
  expect(await examData(page)).toMatchObject({ nota: '10,0' });
});

const missableExam = async (page, tap, n) => {
  await tap(page.locator('#exam-btn'));
  const s = await na.session(page);
  const missable = ['choice', 'tf', ...OWN];
  const misses = s.tasks.flatMap((t, i) => (missable.includes(t.type) ? [i] : [])).slice(0, n);
  expect(misses).toHaveLength(n);
  return misses;
};

test('the final exam: each mistake a 🕳️ pothole, the 4th a 🛞 flat tyre — the jeep stops, no coins, no exam record', async ({
  page,
  tap,
}) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const c0 = await coins(page);
  const misses = await missableExam(page, tap, 4);
  const last = misses[3];
  for (let i = 0; i <= last; i++) {
    const wrong = misses.includes(i);
    await na.answerTask(page, tap, { wrong });
    await expect(page.locator(`#feedback .fb.${wrong ? 'miss' : 'ok'}`), `task ${i + 1}`).toBeVisible();
    const n = misses.indexOf(i) + 1;
    if (n >= 1 && n < 4) {
      await expect(page.locator('#feedback .ref-card.y')).toBeVisible();
      await expect(page.locator('#feedback .ref .fb-title')).toHaveText('¡Un bache!');
      const left = 4 - n;
      await expect(page.locator('#feedback .ref')).toContainText(
        `¡Cuidado! ${left === 1 ? 'Falta 1 fallo' : `Faltan ${left} fallos`} para la rueda pinchada.`,
      );
      await expect(page.locator('#cards i.y')).toHaveCount(n);
      await expectNoFootball(page, `pothole ${n}`);
    }
    expect(await coins(page)).toBe(c0);
    if (i < last) await na.next(page, tap);
  }
  await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
  await expect(page.locator('#feedback .ref .fb-title')).toHaveText('¡Rueda pinchada!');
  await expect(page.locator('#feedback .ref')).toContainText('El jeep se queda parado.');
  await expect(page.locator('#var-btn')).toHaveText('🔧 Rueda de repuesto (2 🪙)');
  await expectNoFootball(page, 'flat tyre');
  await page.locator('#feedback .fb-actions .btn').first().click();
  const fin = page.locator('#finish');
  await expect(fin).toHaveAttribute('data-sendoff', '1');
  await expect(fin.locator('h1')).toHaveText('¡Jeep parado! 🛞');
  await expect(fin.locator('.msg')).toContainText('Con 4 fallos el jeep se queda sin ruedas.');
  await expect(fin.locator('.score-pill small')).toHaveText('📸');
  await expectNoFootball(page, 'stopped');
  expect(await coins(page)).toBe(c0);
  expect(await examData(page)).toBeNull();
});

test('the final exam: the spare wheel (#var-btn) for 2 coins, the safari goes on; the next flat tyre stops the jeep', async ({
  page,
  tap,
}) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const c0 = await coins(page);
  const misses = await missableExam(page, tap, 5);
  for (let i = 0; i <= misses[4]; i++) {
    const wrong = misses.includes(i);
    await na.answerTask(page, tap, { wrong });
    await expect(page.locator(`#feedback .fb.${wrong ? 'miss' : 'ok'}`), `task ${i + 1}`).toBeVisible();
    if (i === misses[3]) {
      await expect(page.locator('#var-btn')).toHaveText('🔧 Rueda de repuesto (2 🪙)');
      await tap(page.locator('#var-btn'));
      await expect(page.locator('#var-btn')).toHaveCount(0);
      await expect(page.locator('#feedback .ref .fb-title')).toHaveText('¡Rueda de repuesto puesta!');
      await expect(page.locator('#feedback .ref-card.y')).toBeVisible();
      expect((await coins(page)) - c0).toBe(-2);
      await expect(page.locator('#cards i')).toHaveCount(3);
      await expectNoFootball(page, 'spare wheel');
    }
    if (i < misses[4]) await na.next(page, tap);
  }
  await expect(page.locator('#feedback .ref-card.r')).toBeVisible();
  await expect(page.locator('#var-btn')).toHaveCount(0);
  await na.next(page, tap);
  await expect(page.locator('#finish')).toHaveAttribute('data-sendoff', '1');
  await expect(page.locator('#finish h1')).toHaveText('¡Jeep parado! 🛞');
  expect((await coins(page)) - c0).toBe(-2);
});

// ---------- languages ----------

test('Ukrainian site: the glossary in a station dialog', async ({ page, tap }) => {
  await open(page, URL);
  const v = await page.evaluate(() => NA_CONTENT.stations[0].vocab);
  await openIntro(page, tap, 'comer');
  await expect(page.locator('#intro-dlg .vocab .vocab-row')).toHaveCount(v.length);
  await expect(page.locator('#intro-dlg .vocab-row dd').first()).toHaveText(v[0][1]);
});

test('Spanish site (?lang=es): hub, a dialog, the rule note, ficha and clave (wrong) and the finish — no Cyrillic, no glossary', async ({
  page,
  tap,
}) => {
  test.setTimeout(90_000);
  await open(page, URL, { lang: 'es' });
  await expectNoCyrillic(page, 'on the hub');
  await openIntro(page, tap, 'ficha');
  await expectNoCyrillic(page, 'in the station dialog');
  await expect(page.locator('#intro-dlg .vocab')).toHaveCount(0);
  await tap(page.locator('#intro-read'));
  await expect(page.locator('#text-dlg')).toHaveJSProperty('open', true);
  await expectNoCyrillic(page, 'on the rule note');
  await tap(page.locator('#text-close'));
  await tap(page.locator('#intro-back'));
  const tasks = [await taskWhere(page, 'ficha'), await taskWhere(page, 'clave', (x) => x.tree === 'invertebrados')];
  await playOnly(page, ...tasks);
  for (const t of tasks) {
    await expectNoCyrillic(page, `on the ${t.type} task`);
    await na.answerTask(page, tap, { wrong: true });
    await expectNoCyrillic(page, `after the ${t.type} answer`);
    await na.next(page, tap);
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expectNoCyrillic(page, 'on the finish screen');
  expect(await page.evaluate(() => /[Ѐ-ӿ]/.test(document.getElementById('exam-root').innerHTML))).toBe(false);
});

// every own-type task of the content renders and can be answered right (data-driven: catches a task whose data the renderer cannot play)
test('every ficha and clave of the content is playable right by its data', async ({ page, tap }) => {
  test.setTimeout(120_000);
  await open(page, URL);
  const tasks = (await allTasks(page)).filter((t) => OWN.includes(t.type));
  await playOnly(page, ...tasks);
  for (const t of tasks) {
    await na.answerTask(page, tap);
    await expect(page.locator('#feedback .fb.ok'), `${t.station}: ${t.name}`).toBeVisible();
    await expect(fbTitle(page), `${t.station}: ${t.name}`).not.toHaveText(SOFT);
    await na.next(page, tap);
  }
  await expect(page.locator('#finish .score-pill')).toContainText(`${tasks.length} / ${tasks.length}`);
});
