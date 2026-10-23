// Laptop only: every game must be playable with the keyboard (AGENTS.md conventions).
import { test, expect, open, record } from './helpers.mjs';
import {
  examPlayer,
  unitPage,
  playChTasks,
  playDcTasks,
  playMathSession,
  playSimonCommands,
  playSimonMemory,
  playWordTasks,
} from './drivers.mjs';

const tapNever = () => {
  throw new Error('keyboard test must not tap');
};

test('math-exam: exam answered with number keys + Enter, Esc goes back to the stations', async ({ page }) => {
  await open(page, '/games/math-exam/');
  await page.locator('#exam-btn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  // Esc leaves the round at once, and the exam can be started again from the keyboard
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();
  await page.locator('#exam-btn').focus();
  await page.keyboard.press('Enter');

  const { n, kinds } = await playMathSession(page, tapNever, 'uk', { keyboard: true });
  expect(n).toBe(12);
  expect(kinds).toContain('choice');
  expect(kinds).toContain('column');
  await expect(page.locator('#finish-score')).toContainText('12');
  expect(await record(page, 'math-exam')).toMatchObject({ plays: 1 });
});

test('football-quiz: level keys, 1–4 answers, Enter for next, Esc back and out to the catalog', async ({ page }) => {
  await open(page, '/games/football-quiz/');
  await page.keyboard.press('2');
  await expect(page.locator('.level[aria-checked="true"]')).toHaveAttribute('data-level', '2');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.level[aria-checked="true"]')).toHaveAttribute('data-level', '1');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__quiz.screen)).toBe('play');

  // 3 questions: answer with the number key (right), Enter for the next one
  for (let i = 0; i < 3; i++) {
    const c = await page.evaluate(() => window.__quiz.correctIndex);
    await page.keyboard.press(String(c + 1));
    await expect(page.locator('#feedback .btn')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('#feedback .btn')).toHaveCount(0);
  }
  expect(await page.evaluate(() => window.__quiz.round.index)).toBe(3);

  // arrows move the focus between the answers
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#choices .choice').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => window.__quiz.screen)).toBe('start');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
});

test('sociales-planeta: choices with 1–4 / V F, Esc closes dialogs and goes back', async ({ page }) => {
  await open(page, '/games/sociales-planeta/');
  const idx = await page.evaluate(() => SP_CONTENT.stations.findIndex((s) => s.id === 'curiosidades'));
  const tile = page.locator('#stations .station').nth(idx);

  // Esc closes the station intro
  await tile.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro-dlg')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro-dlg')).toHaveJSProperty('open', false);

  // Enter opens it again (focus lands on "start"), Enter starts
  await tile.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  const answerByKey = async () => {
    const t = await page.evaluate(() => __sp.session.task);
    if (t.type === 'tf') {
      await page.keyboard.press(t.truth ? 'v' : 'f');
    } else {
      const text = t.options[t.answer];
      const i = await page.evaluate(
        (want) =>
          [...document.querySelectorAll('#work .choice')].findIndex(
            (b) =>
              [...b.childNodes]
                .filter((n) => n.nodeType === 3)
                .map((n) => n.textContent)
                .join('') === want,
          ),
        text,
      );
      await page.keyboard.press(String(i + 1));
    }
    await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
    await page.keyboard.press('Enter');
  };
  await answerByKey();
  await answerByKey();
  expect(await page.evaluate(() => __sp.session.index)).toBe(2);

  // Esc mid-round asks to quit; Esc closes the question and the round goes on
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', false);
  await expect(page.locator('#play')).toBeVisible();
  expect(await page.evaluate(() => __sp.session.index)).toBe(2);

  // Esc, then Tab to "yes" and Enter: back to the hub
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-no')).toBeFocused();
  await page.locator('#quit-yes').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#hub')).toBeVisible();

  // A whole station by keys, then Esc on the finish screen goes back to the hub
  await tile.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 8; i++) await answerByKey();
  await expect(page.locator('#finish')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();
});

test('naturales-entorno: stations, dialogs, choice, label, filter and fill by keys only; Esc goes back', async ({ page }) => {
  const cn = examPlayer('__cn');
  await open(page, '/games/naturales-entorno/');
  const tileOf = async (id) =>
    page.locator('#stations .station').nth(await page.evaluate((s) => CN_CONTENT.stations.findIndex((x) => x.id === s), id));

  // Esc closes the station intro (which shows the Ukrainian glossary); Enter opens it again and Enter starts
  const eco = await tileOf('ecosistema');
  await eco.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro-dlg')).toHaveJSProperty('open', true);
  await expect(page.locator('#intro-dlg .vocab .vocab-row').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro-dlg')).toHaveJSProperty('open', false);
  await eco.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  // The glossary button: Enter opens, Esc closes and gives the focus back; Esc did not ask to quit
  const book = page.locator('#play-vocab');
  await book.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#vocab-dlg')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#vocab-dlg')).toHaveCount(0);
  await expect(book).toBeFocused();
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', false);
  await book.blur();

  // A whole round with keys only: this station always has its label scene (number + letter), choices by 1–4 / V F, sort, order…
  const types = (await cn.session(page)).tasks.map((t) => t.type);
  expect(types).toContain('label');
  expect(await cn.playSession(page, tapNever, { keyboard: true })).toEqual(types);
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  await page.keyboard.press('Escape'); // on the finish screen: back to the hub
  await expect(page.locator('#hub')).toBeVisible();

  // The filter station: layers with 1–5, fill words typed, Esc mid-round asks, Esc again goes on, Esc + yes leaves
  const filtro = await tileOf('filtro');
  await filtro.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', false); // nothing answered yet: straight back
  await expect(page.locator('#hub')).toBeVisible();
  await filtro.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  const kinds = (await cn.session(page)).tasks.map((t) => t.type);
  expect(kinds).toContain('filter');
  expect(kinds).toContain('fill');
  await cn.answerTask(page, tapNever, { keyboard: true });
  await cn.next(page, tapNever, { keyboard: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', false);
  expect((await cn.session(page)).index).toBe(1);
  // the rest of the round with keys
  for (let i = 1; i < kinds.length; i++) {
    await cn.answerTask(page, tapNever, { keyboard: true });
    await cn.next(page, tapNever, { keyboard: true });
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();

  // the final exam by keys too
  await page.locator('#exam-btn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  await cn.playSession(page, tapNever, { keyboard: true });
  await expect(page.locator('#finish .grade b')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();
});

test('lengua-mundo: reading by keys, then fix, chat, tone and pick with keys only; Esc goes back', async ({ page }) => {
  const le = examPlayer('__le');
  const { taskWhere, playOnly } = unitPage('LE_CONTENT', '__le');
  await open(page, '/games/lengua-mundo/');
  const tile = page.locator('#stations .station').nth(await page.evaluate(() => LE_CONTENT.stations.findIndex((s) => s.id === 'baobab')));

  // Enter opens the intro, Enter starts: the reading screen comes first; Esc on it goes back to the hub
  await tile.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#read-screen')).toBeVisible();
  await expect(page.locator('#read-start')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();
  // again, then Enter on «Empezar las preguntas» starts the round
  await tile.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  // 📜: Enter opens the text, Esc closes it and the focus comes back; Esc did not ask to quit
  const book = page.locator('#play-text');
  await book.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#text-dlg')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#text-dlg')).toHaveCount(0);
  await expect(book).toBeFocused();
  await expect(page.locator('#quit-dlg')).toHaveJSProperty('open', false);
  await book.blur();

  // the whole baobab round by keys
  await le.playSession(page, tapNever, { keyboard: true });
  await expect(page.locator('#finish .score-pill')).toContainText('8 / 8');
  await page.keyboard.press('Escape');
  await expect(page.locator('#hub')).toBeVisible();

  // the unit's own types and pick, one by one, keys only
  const tasks = [await taskWhere(page, 'fix'), await taskWhere(page, 'chat'), await taskWhere(page, 'tone'), await taskWhere(page, 'pick')];
  await page.evaluate(() => {
    KFG.say = () => true; // no sound needed
    KFG.speaking = () => false;
  });
  await playOnly(page, ...tasks);
  expect(await le.playSession(page, tapNever, { keyboard: true })).toEqual(['fix', 'chat', 'tone', 'pick']);
  await expect(page.locator('#finish .score-pill')).toContainText('4 / 4');

  // the fix by hand: ← → move, Space toggles, ⌫ undoes, Enter checks (also on a focused word)
  await page.keyboard.press('Escape');
  await playOnly(page, tasks[0]);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#work .le-w').first()).toBeFocused();
  await page.keyboard.press(' ');
  await expect(page.locator('#work .le-w').first()).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Backspace');
  await expect(page.locator('#work .le-w').first()).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#work .le-g').first()).toBeFocused();
  await page.keyboard.press('Enter'); // on a focused gap: checks, does not toggle
  await expect(page.locator('#work .is-wrong').first()).toBeVisible();
  await expect(page.locator('#work .le-g').first()).toHaveAttribute('aria-pressed', 'false');
});

test('penalty-multiply: Enter starts, 1–3 pick a goal target, Enter = next kick, Esc goes back', async ({ page }) => {
  await open(page, '/games/penalty-multiply/');
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  // Esc mid-round goes back to the intro; Enter starts again
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();

  for (let i = 0; i < 5; i++) {
    await expect(page.locator('#round-label')).toContainText(`${i + 1} ІЗ 5`);
    const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
    const at = await page.$$eval('#goal button', (bs, want) => bs.findIndex((x) => Number(x.dataset.value) === want), a * b);
    await page.keyboard.press(String(at + 1));
    await expect(page.locator('#feedback button')).toBeVisible();
    // a second number key while the shot is resolved does nothing
    await page.keyboard.press('1');
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
  await expect(page.locator('#final-score')).toHaveText('5 / 5');

  // Enter on the finish screen plays again; Esc leaves the round, then the intro, for the catalog
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  await expect(page.locator('#round-label')).toContainText('1 ІЗ 5');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
});

test('coach-simon: arrows pick the mode, Enter starts, 1–9 / numpad for zones, Enter = next / again, Esc back and out', async ({
  page,
}) => {
  await open(page, '/games/coach-simon/');
  await page.evaluate(() => (window.__simon.timeScale = 0.05));
  // memory with the numpad (spatial: 7 = top left … 3 = bottom right)
  await page.locator('[data-mode="memory"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  const numpad = (z) => page.keyboard.press(`Numpad${(2 - Math.floor(z / 3)) * 3 + (z % 3) + 1}`);
  await playSimonMemory(page, tapNever, { press: numpad, missAt: [4, 4] });
  await expect(page.locator('#final-score')).toHaveText('3 / 10');

  // "change" (Enter on the focused button) goes to the intro, arrows switch to commands, top-row digits answer, Enter = next
  await page.locator('#change').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro')).toBeVisible();
  await page.locator('[data-mode="memory"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-mode="commands"]')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => (window.__simon.timeScale = 0.4));
  await page.keyboard.press('Enter');
  const results = await playSimonCommands(page, tapNever, {
    press: (z) => page.keyboard.press(String(z + 1)),
    next: () => page.keyboard.press('Enter'),
  });
  expect(results.every((v) => v === 'save' || v === 'held')).toBe(true);
  await expect(page.locator('#final-score')).toHaveText('10 / 10');

  // Enter = again, Esc = intro (from a round), Esc = catalog
  await page.keyboard.press('Enter');
  await expect(page.locator('#play')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#intro')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForURL((u) => !u.pathname.includes('coach-simon'));
});

test('word-match: Enter opens a theme, 1–4 pick, letters + Enter spell, pairs 1–4 + A–D, Enter = next', async ({ page }) => {
  await open(page, '/games/word-match/');
  await page.locator('#stations .station').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro-go')).toBeFocused();
  await page.keyboard.press('Escape');

  await playWordTasks(page, 'animals', ['pic', 'listen', 'spell', 'pairs']);
  // own text of a button (the <kbd> number is not part of it)
  const indexOf = (sel, text) =>
    page.evaluate(
      ([s, want]) =>
        [...document.querySelectorAll(s)].findIndex(
          (b) =>
            [...b.childNodes]
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent)
              .join('') === want,
        ),
      [sel, text],
    );
  for (let i = 0; i < 4; i++) {
    const t = await page.evaluate(() => __wm.session.task);
    if (t.type === 'choice') await page.keyboard.press(String((await indexOf('#work .choice', t.options[t.answer])) + 1));
    if (t.type === 'listen') {
      const keys = await page.locator('.wm-opt').evaluateAll((els) => els.map((e) => e.dataset.key));
      await page.keyboard.press(String(keys.indexOf(t.word.key) + 1));
    }
    if (t.type === 'spell') {
      await page.keyboard.type(t.word.en);
      await page.keyboard.press('Enter');
    }
    if (t.type === 'pairs')
      for (const [en, tr] of t.pairs) {
        await page.keyboard.press(String((await indexOf('#work .pairs .col:nth-child(1) .pr', en)) + 1));
        await page.keyboard.press('ABCD'[await indexOf('#work .pairs .col:nth-child(2) .pr', tr)]);
      }
    await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __wm.session.results)).toEqual([true, true, true, true]);
});

test('chytanka: 1–4 pick, Space splits the word, 1–9 + Enter build, Enter = next', async ({ page }) => {
  await open(page, '/games/chytanka/');
  await page.locator('#stations .station').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro-go')).toBeFocused();
  await page.keyboard.press('Escape');

  await playChTasks(page, 'odesa', ['read', 'hear', 'build', 'gap', 'story']);
  // 1-based position of the button whose data attribute is `value`
  const keyOf = (sel, attr, value) =>
    page.locator(sel).evaluateAll((els, [a, v]) => els.findIndex((e) => e.getAttribute(a) === v) + 1, [attr, value]);
  for (let i = 0; i < 5; i++) {
    const t = await page.evaluate(() => __ch.session.task);
    if (t.type === 'read') {
      await page.keyboard.press(' ');
      await expect(page.locator('.ch-word')).toHaveClass(/is-split/);
      await page.keyboard.press(String(await keyOf('.ch-opt', 'data-key', t.word.key)));
    }
    if (t.type === 'hear') await page.keyboard.press(String(await keyOf('.ch-wopt', 'data-word', t.word.word)));
    if (t.type === 'build') {
      const tiles = await page.locator('.ch-tile').evaluateAll((els) => els.map((e) => e.getAttribute('data-syl')));
      const used = new Set();
      for (const s of t.word.syl) {
        const k = tiles.findIndex((x, j) => x === s && !used.has(j));
        used.add(k);
        await page.keyboard.press(String(k + 1));
      }
      await page.keyboard.press('Enter');
    }
    if (t.type === 'gap') await page.keyboard.press(String(await keyOf('.ch-letter', 'data-letter', t.options[0])));
    if (t.type === 'story') await page.keyboard.press(String(await keyOf('.ch-ans', 'data-answer', t.options[0])));
    await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __ch.session.results)).toEqual([true, true, true, true, true]);
});

test('dictado: 1–n pick, letters + Enter build the word, 0/1–n tilde, Enter = next; the final typed with Shift and the accent key', async ({
  page,
}) => {
  await open(page, '/games/dictado/');
  await page.locator('#stations .station').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#intro-go')).toBeFocused();
  await page.keyboard.press('Escape');

  // 1-based position of the option `value` on screen
  const keyOf = (sel, value) =>
    page.locator(sel).evaluateAll((els, v) => els.findIndex((e) => e.getAttribute('data-opt') === v) + 1, value);
  await playDcTasks(page, 'mp-mb', ['gap', 'pick', 'tiles', 'cloze', 'spot']);
  for (let i = 0; i < 5; i++) {
    const t = await page.evaluate(() => __dc.session.task);
    if (t.type === 'gap' || t.type === 'pick') await page.keyboard.press(String(await keyOf('#work .dc-opt', t.options[0])));
    if (t.type === 'tiles') {
      await page.keyboard.type(t.word);
      await page.keyboard.press('Enter');
    }
    if (t.type === 'cloze')
      for (const g of t.parts.filter((p) => typeof p !== 'string'))
        await page.keyboard.press(String(await keyOf('#dc-chooser .dc-opt', g.right)));
    if (t.type === 'spot') await page.keyboard.press(String(t.wrong + 1));
    await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __dc.session.results)).toEqual([true, true, true, true, true]);

  // tilde (vowel number / 0 = no tilde) and the typed final: Shift for the capital, ' + o = ó
  await page.evaluate(() => {
    const tasks = (id) => DC_CONTENT.stations.find((s) => s.id === id).tasks;
    __dc.play([
      { ...tasks('tilde').find((t) => t.type === 'tilde' && t.word === 'árbol'), station: 'tilde' },
      { ...tasks('tilde').find((t) => t.type === 'tilde' && t.word === 'pelota'), station: 'tilde' },
      { ...tasks('mayusculas').find((t) => t.type === 'write' && t.word === 'Gijón'), station: 'mayusculas' },
    ]);
  });
  await page.keyboard.press('1'); // árbol: the 1st vowel
  await page.keyboard.press('Enter');
  await page.keyboard.press('0'); // pelota: no tilde
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+KeyG');
  await page.keyboard.type('ij');
  await page.keyboard.press("'");
  await page.keyboard.type('on');
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback .fb-actions .btn').first()).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#finish')).toBeVisible();
  expect(await page.evaluate(() => __dc.session.results)).toEqual([true, true, true]);
});

test('profile: arrows pick colours, digits set the number, Enter saves; digits + Enter change the PIN; Esc = back', async ({ page }) => {
  await open(page, '/');
  expect(await page.evaluate(() => KF.auth.login(1, '1234').then((r) => r.ok))).toBe(true);
  await page.goto('/profile/');
  const avatar = () => page.evaluate(() => KF.auth.user.avatar); // starts as k:stripes:blue:yellow:1
  await page.locator('#kit-c1 [aria-checked="true"]').focus();
  await page.keyboard.press('ArrowRight'); // blue → navy
  await expect(page.locator('#kit-c1 [data-color="navy"]')).toBeFocused();
  await page.locator('#num-val').focus();
  await page.keyboard.press('ArrowUp'); // 1 → 2
  await page.keyboard.type('7'); // typed like a scoreboard: 7
  await page.locator('#kit-save').focus();
  await page.keyboard.press('Enter');
  await expect.poll(avatar).toBe('k:stripes:navy:yellow:7');

  await page.locator('#tab-kit').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-pin')).toBeFocused();
  await page.keyboard.type('123443214321');
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('kf-test-auth')).users[0].pin)).toBe('4321');

  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#games-list')).toBeVisible();
});
