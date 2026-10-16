// Laptop only: every game must be playable with the keyboard (AGENTS.md conventions).
import { test, expect, open, record } from './helpers.mjs';
import { playMathSession } from './drivers.mjs';

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
      const i = await page.evaluate((want) => [...document.querySelectorAll('#work .choice')].findIndex((b) => [...b.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('') === want), text);
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

// Known gap: penalty-multiply has no key handling yet (AGENTS.md wants number keys + Enter).
test.fixme('penalty-multiply: answers with the keyboard (1–3 pick a goal target, Enter = next kick)', async ({ page }) => {
  await open(page, '/games/penalty-multiply/');
  await page.locator('#start').focus();
  await page.keyboard.press('Enter');
  const [a, b] = (await page.textContent('#question')).match(/\d+/g).map(Number);
  const i = await page.$$eval('#goal button', (bs, want) => bs.findIndex((x) => Number(x.dataset.value) === want), a * b);
  await page.keyboard.press(String(i + 1));
  await expect(page.locator('#feedback button')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#round-label')).toContainText('2');
});
