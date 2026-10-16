// shared/kf-game.js (KFG) in a real browser: a bare page with fixtures, no game code involved.
import { fileURLToPath } from 'node:url';
import { test, expect } from './helpers.mjs';

const KIT = fileURLToPath(new URL('../../shared/kf-game.js', import.meta.url));

const load = async (page, body = '') => {
  await page.setContent(`<!doctype html><html><body>${body}</body></html>`);
  await page.addScriptTag({ path: KIT });
};

test('h: class/text/html/on*/attrs, drops null/false, nested arrays', async ({ page }) => {
  await load(page);
  const r = await page.evaluate(() => {
    let clicks = 0;
    const el = KFG.h(
      'div',
      { class: 'a b', id: 'x', hidden: true, 'data-n': 0, title: null, lang: false, onclick: () => clicks++ },
      'text',
      null,
      false,
      undefined,
      [KFG.h('i', { text: '<b>' }), [KFG.h('u', { html: '<b>bold</b>' })]],
      7,
    );
    el.click();
    return {
      html: el.outerHTML,
      kids: el.childNodes.length,
      clicks,
      title: el.hasAttribute('title'),
      lang: el.hasAttribute('lang'),
    };
  });
  expect(r.html).toBe('<div class="a b" id="x" hidden="" data-n="0">text<i>&lt;b&gt;</i><u><b>bold</b></u>7</div>');
  expect(r.kids).toBe(4);
  expect(r.clicks).toBe(1);
  expect(r.title).toBe(false);
  expect(r.lang).toBe(false);
});

test('$, shuffle, pick: copy, determinism with Math.random', async ({ page }) => {
  await load(page, '<p id="p">hi</p>');
  const r = await page.evaluate(() => {
    const real = Math.random;
    const src = [1, 2, 3, 4];
    Math.random = () => 0;
    const zero = KFG.shuffle(src);
    const first = KFG.pick(src);
    Math.random = () => 0.999;
    const same = KFG.shuffle(src);
    const last = KFG.pick(src);
    // Same generator state, same order.
    const lcg = () => {
      let s = 1;
      return () => (s = (s * 16807) % 2147483647) / 2147483647;
    };
    Math.random = lcg();
    const one = KFG.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).join();
    Math.random = lcg();
    const two = KFG.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).join();
    Math.random = real;
    return {
      p: KFG.$('p')?.textContent,
      none: KFG.$('nope'),
      src: src.join(),
      zero: zero.join(),
      same: same.join(),
      first,
      last,
      sorted: KFG.shuffle([3, 1, 2]).sort().join(),
      repeat: one === two,
      moved: one !== '1,2,3,4,5,6,7,8,9',
    };
  });
  expect(r.p).toBe('hi');
  expect(r.none).toBeNull();
  expect(r.src).toBe('1,2,3,4');
  expect(r.zero).toBe('2,3,4,1');
  expect(r.same).toBe('1,2,3,4');
  expect(r.first).toBe(1);
  expect(r.last).toBe(4);
  expect(r.sorted).toBe('1,2,3');
  expect(r.repeat).toBe(true);
  expect(r.moved).toBe(true);
});

test('restart and shake: class replayed; shake respects reduced motion', async ({ page }) => {
  await load(page, '<div id="a"></div><div id="b"></div>');
  // The project runs with reduced motion: shake is a no-op, restart still works.
  expect(await page.evaluate(() => KFG.reduced())).toBe(true);
  const reduced = await page.evaluate(() => {
    const a = KFG.$('a');
    KFG.shake(a, null, undefined);
    KFG.restart(KFG.$('b'), 'x');
    return { shake: a.classList.contains('shake'), x: KFG.$('b').classList.contains('x') };
  });
  expect(reduced).toEqual({ shake: false, x: true });

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await page.evaluate(() => KFG.reduced())).toBe(false);
  const motion = await page.evaluate(() => {
    const a = KFG.$('a');
    const b = KFG.$('b');
    KFG.shake(a, null, b);
    return [a.classList.contains('shake'), b.classList.contains('shake')];
  });
  expect(motion).toEqual([true, true]);
});

test('screens: one visible, others hidden, scroll to top, idOf and onShow', async ({ page }) => {
  await load(
    page,
    '<div id="hub"></div><div id="play" hidden></div><div id="finish" hidden></div><div id="tall" style="height:3000px"></div>' +
      '<div id="s1-screen"></div><div id="s2-screen" hidden></div>',
  );
  const r = await page.evaluate(() => {
    const seen = [];
    const hidden = () => ['hub', 'play', 'finish'].map((id) => KFG.$(id).hidden);
    const show = KFG.screens(['hub', 'play', 'finish']);
    window.scrollTo(0, 500);
    show('play');
    const afterPlay = { hidden: hidden(), y: window.scrollY };
    show('finish');
    const afterFinish = hidden();
    const named = KFG.screens(['s1', 's2'], { idOf: (n) => `${n}-screen`, scroll: false, onShow: (n) => seen.push(n) });
    window.scrollTo(0, 400);
    named('s2');
    return {
      afterPlay,
      afterFinish,
      named: [KFG.$('s1-screen').hidden, KFG.$('s2-screen').hidden],
      y: window.scrollY,
      seen,
    };
  });
  expect(r.afterPlay).toEqual({ hidden: [true, false, true], y: 0 });
  expect(r.afterFinish).toEqual([true, true, false]);
  expect(r.named).toEqual([true, false]);
  expect(r.y).toBe(400);
  expect(r.seen).toEqual(['s2']);
});

test('dots: ok / miss / now, sparse results, total, kind and attrs', async ({ page }) => {
  await load(page, '<div id="d"></div><div id="g"></div>');
  const r = await page.evaluate(() => {
    const d = KFG.$('d');
    const classes = () => [...d.children].map((c) => c.className);
    const results = [];
    results[0] = true;
    results[1] = false;
    KFG.dots(d, results, 2, { total: 5 });
    const sparse = classes();
    KFG.dots(d, [true, false, undefined], 1);
    const noTotal = classes();
    KFG.dots(d, [true], 1, { total: 2, cls: { ok: 'goal', now: 'cur' }, base: 'pip' });
    const custom = classes();
    const g = KFG.$('g');
    KFG.dots(g, ['save', 'miss'], 2, {
      total: 3,
      cls: { ok: 'save' },
      kind: (x) => (x === 'save' ? 'ok' : x === 'miss' ? 'miss' : undefined),
      attrs: (i) => ({ title: `Atak ${i + 1}` }),
    });
    return {
      sparse,
      noTotal,
      custom,
      game: [...g.children].map((c) => `${c.className}|${c.getAttribute('title')}`),
    };
  });
  expect(r.sparse).toEqual(['dot ok', 'dot miss', 'dot now', 'dot', 'dot']);
  expect(r.noTotal).toEqual(['dot ok', 'dot miss', 'dot']);
  expect(r.custom).toEqual(['pip goal', 'pip cur']);
  expect(r.game).toEqual(['dot save|Atak 1', 'dot miss|Atak 2', 'dot now|Atak 3']);
});

test('feedback: fills the box, focuses the first button (also a wrapped one), options', async ({ page }) => {
  await load(page, '<div id="spacer" style="height:3000px"></div><div id="fb"></div>');
  const r = await page.evaluate(() => {
    const fb = KFG.$('fb');
    const box = KFG.h('div', { class: 'fb-box', text: 'Good' });
    const next = KFG.h('button', { type: 'button', text: 'Next' });
    KFG.feedback(fb, box, KFG.h('br'), next);
    const plain = { kids: fb.children.length, focus: document.activeElement === next, y: window.scrollY > 0 };

    window.scrollTo(0, 0);
    const a = KFG.h('button', { type: 'button' });
    const b = KFG.h('button', { type: 'button' });
    KFG.feedback(fb, KFG.h('p'), KFG.h('div', { class: 'fb-actions' }, a, b), false);
    const wrapped = { kids: fb.children.length, focus: document.activeElement === a };

    window.scrollTo(0, 0);
    const c = KFG.h('button', { type: 'button' });
    KFG.feedback(fb, KFG.h('p'), c, { focus: false, scroll: false });
    const quiet = { focus: document.activeElement === c, y: window.scrollY };
    return { plain, wrapped, quiet };
  });
  expect(r.plain).toEqual({ kids: 3, focus: true, y: true });
  expect(r.wrapped).toEqual({ kids: 2, focus: true });
  expect(r.quiet).toEqual({ focus: false, y: 0 });
});

test('feedback scroll "animated" skips scrolling under reduced motion', async ({ page }) => {
  await load(page, '<div style="height:3000px"></div><div id="fb"></div>');
  const reduced = await page.evaluate(() => {
    KFG.feedback(KFG.$('fb'), KFG.h('p'), KFG.h('button', { type: 'button' }), { scroll: 'animated' });
    return window.scrollY;
  });
  expect(reduced).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => KFG.feedback(KFG.$('fb'), KFG.h('p'), KFG.h('button', { type: 'button' }), { scroll: 'animated' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

const KEYS_PAGE = `
  <button id="b" type="button">b</button><a id="link" href="#x">link</a><input id="i">
  <dialog id="d"><button id="dbtn" type="button">in dialog</button></dialog>`;

// A recorder of what the dispatcher did; `prevented` is read by a later listener on document.
const setupKeys = (page) =>
  page.evaluate(() => {
    const MODS = new Set(['Shift', 'Control', 'Alt', 'Meta']);
    const w = window;
    w.log = [];
    w.state = { active: true, ctrl: true };
    w.ctrlObj = {
      onKey: (e) => {
        if (MODS.has(e.key)) return false;
        w.log.push(`k:${e.key}`);
        return e.key === 'a' || e.key === 'Enter';
      },
    };
    w.mk = (opts = {}) =>
      KFG.keys({
        ctrl: () => (w.state.ctrl ? w.ctrlObj : null),
        active: () => w.state.active,
        onEscape: (e) => {
          w.log.push('esc');
          return !e.shiftKey;
        },
        ...opts,
      });
    w.off = w.mk();
    w.prevented = [];
    window.addEventListener('keydown', (e) => MODS.has(e.key) || w.prevented.push(e.defaultPrevented));
  });

const keysState = (page) => page.evaluate(() => ({ log: window.log.slice(), prevented: window.prevented.slice() }));
const resetLog = (page) =>
  page.evaluate(() => {
    window.log.length = 0;
    window.prevented.length = 0;
  });

test('keys: dispatch to ctrl, preventDefault only when handled, active gate, unsubscribe', async ({ page }) => {
  await load(page, KEYS_PAGE);
  await setupKeys(page);
  await page.keyboard.press('a');
  await page.keyboard.press('z');
  expect(await keysState(page)).toEqual({ log: ['k:a', 'k:z'], prevented: [true, false] });

  await resetLog(page);
  await page.evaluate(() => {
    window.state.active = false;
  });
  await page.keyboard.press('a');
  expect((await keysState(page)).log).toEqual([]);

  await page.evaluate(() => {
    window.state.active = true;
    window.state.ctrl = false;
  });
  await page.keyboard.press('a');
  expect((await keysState(page)).log).toEqual([]);

  await page.evaluate(() => {
    window.state.ctrl = true;
    window.off();
  });
  await page.keyboard.press('a');
  expect((await keysState(page)).log).toEqual([]);
});

test('keys: Escape goes to onEscape only; its result decides preventDefault', async ({ page }) => {
  await load(page, KEYS_PAGE);
  await setupKeys(page);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+Escape');
  expect(await keysState(page)).toEqual({ log: ['esc', 'esc'], prevented: [true, false] });
});

test('keys: modifier combos are skipped, ignoreMods lets chosen ones through', async ({ page }) => {
  await load(page, KEYS_PAGE);
  await setupKeys(page);
  await page.keyboard.press('Alt+a');
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Meta+a');
  expect((await keysState(page)).log).toEqual([]);

  await page.evaluate(() => {
    window.off();
    window.off = window.mk({ ignoreMods: ['alt'] });
  });
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Alt+a');
  expect((await keysState(page)).log).toEqual(['k:a']);

  await resetLog(page);
  await page.evaluate(() => {
    window.off();
    window.off = window.mk({ ignoreMods: [] });
  });
  await page.keyboard.press('Alt+a');
  expect((await keysState(page)).log).toEqual(['k:a']);
});

test('keys: Enter/Space on a focused button or link keep their own action; nativeButtons option', async ({ page }) => {
  await load(page, KEYS_PAGE);
  await setupKeys(page);
  await page.locator('#b').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press(' ');
  await page.keyboard.press('a'); // other keys still go to ctrl
  await page.locator('#link').focus();
  await page.keyboard.press('Enter');
  expect((await keysState(page)).log).toEqual(['k:a']);

  // Ctrl+Enter is not a button click: with ctrl allowed it reaches ctrl even on a button.
  await resetLog(page);
  await page.evaluate(() => {
    window.off();
    window.off = window.mk({ ignoreMods: ['alt'] });
  });
  await page.locator('#b').focus();
  await page.keyboard.press('Control+Enter');
  expect((await keysState(page)).log).toEqual(['k:Enter']);

  // Narrow selector: a link no longer counts; false switches the guard off.
  await resetLog(page);
  await page.evaluate(() => {
    window.off();
    window.off = window.mk({ nativeButtons: 'button' });
  });
  await page.locator('#link').focus();
  await page.keyboard.press('Enter');
  await page.locator('#b').focus();
  await page.keyboard.press('Enter');
  expect((await keysState(page)).log).toEqual(['k:Enter']);

  await resetLog(page);
  await page.evaluate(() => {
    window.off();
    window.off = window.mk({ nativeButtons: false });
  });
  await page.keyboard.press('Enter');
  expect((await keysState(page)).log).toEqual(['k:Enter']);
});

test('keys: onKey runs before the button guard and ctrl, not gated by active', async ({ page }) => {
  await load(page, KEYS_PAGE);
  await setupKeys(page);
  await page.evaluate(() => {
    window.off();
    window.off = window.mk({
      onKey: (e) => {
        if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return false;
        window.log.push(`hook:${e.key}`);
        return e.key === 'u';
      },
    });
    window.state.active = false;
  });
  await page.locator('#b').focus();
  await page.keyboard.press('u');
  await page.keyboard.press('Enter');
  expect(await keysState(page)).toEqual({ log: ['hook:u', 'hook:Enter'], prevented: [true, false] });

  await resetLog(page);
  await page.evaluate(() => {
    window.state.active = true;
  });
  await page.keyboard.press('a');
  expect((await keysState(page)).log).toEqual(['hook:a', 'k:a']);
});

test('keys: while a <dialog> is open nothing is dispatched (Esc closes the dialog natively)', async ({ page }) => {
  await load(page, KEYS_PAGE);
  await setupKeys(page);
  await page.evaluate(() => window.document.getElementById('d').showModal());
  await page.keyboard.press('a');
  await page.keyboard.press('Escape');
  await expect(page.locator('#d')).not.toHaveAttribute('open', '');
  expect((await keysState(page)).log).toEqual([]);

  // Closed again: dispatching resumes.
  await page.keyboard.press('a');
  expect((await keysState(page)).log).toEqual(['k:a']);
});

const CONFIRM_PAGE = `
  <button id="open" type="button">open</button>
  <dialog id="dlg"><button type="button" id="y" data-yes>Yes</button><button type="button" id="n" data-no>No</button></dialog>
  <dialog id="plain"><button type="button" id="py">Yes</button><button type="button" id="pn">No</button></dialog>`;

const setupConfirm = (page) =>
  page.evaluate(() => {
    window.log = [];
    window.ask = (id = 'dlg', opts = {}) =>
      KFG.confirm(document.getElementById(id), {
        onYes: () => window.log.push(`${id}:yes:${document.getElementById(id).open}`),
        onNo: () => window.log.push(`${id}:no:${document.getElementById(id).open}`),
        ...opts,
      });
  });
const confirmLog = (page) => page.evaluate(() => window.log.slice());

test('confirm: yes closes the dialog first, then onYes; no focus on "no" by default', async ({ page }) => {
  await load(page, CONFIRM_PAGE);
  await setupConfirm(page);
  await page.evaluate(() => window.ask());
  await expect(page.locator('#dlg')).toHaveAttribute('open', '');
  await expect(page.locator('#n')).toBeFocused();
  await page.locator('#y').click();
  await expect(page.locator('#dlg')).not.toHaveAttribute('open', '');
  expect(await confirmLog(page)).toEqual(['dlg:yes:false']);
});

test('confirm: no and Esc both mean no; wired once, callbacks swapped per call', async ({ page }) => {
  await load(page, CONFIRM_PAGE);
  await setupConfirm(page);
  await page.evaluate(() => window.ask());
  await page.locator('#n').click();
  await expect(page.locator('#dlg')).not.toHaveAttribute('open', '');

  await page.evaluate(() => window.ask());
  await page.keyboard.press('Escape');
  await expect(page.locator('#dlg')).not.toHaveAttribute('open', '');

  // Second and third ask: exactly one callback call per answer (listeners are not stacked).
  await page.evaluate(() => {
    window.ask();
    KFG.confirm(document.getElementById('dlg'), { onYes: () => window.log.push('swapped:yes') });
  });
  await page.locator('#y').click();
  expect(await confirmLog(page)).toEqual(['dlg:no:false', 'dlg:no:false', 'swapped:yes']);
});

test('confirm: falls back to first/second button, focus option, missing callbacks are fine', async ({ page }) => {
  await load(page, CONFIRM_PAGE);
  await setupConfirm(page);
  await page.evaluate(() => window.ask('plain', { focus: 'yes' }));
  await expect(page.locator('#py')).toBeFocused();
  await page.locator('#py').click();
  await page.evaluate(() => window.ask('plain'));
  await expect(page.locator('#pn')).toBeFocused();
  await page.locator('#pn').click();
  expect(await confirmLog(page)).toEqual(['plain:yes:false', 'plain:no:false']);

  await page.evaluate(() => KFG.confirm(document.getElementById('dlg')));
  await page.keyboard.press('Escape');
  await page.evaluate(() => KFG.confirm(document.getElementById('dlg'), { focus: 'none' }));
  await page.locator('#y').click();
  await expect(page.locator('#dlg')).not.toHaveAttribute('open', '');
});
