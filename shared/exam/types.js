// Keeper Fun Games — generic exam task renderers: KFExam.types.{choice, tf, sort, order, pairs}.
// Include after shared/exam/exam.js. Each is (task, work, ctx) → void, see ExamRendererCtx in types/exam.d.ts.
// @ts-check
'use strict';

(() => {
  /** @type {ExamRenderer<ExamChoiceTask>} */
  const choice = (task, work, ctx, preset) => {
    const { h, T, shuffle, resolve, setKeys, withArt, kbdHint } = ctx;
    const opts = preset || (task.options || []).map((text, i) => ({ text, ok: i === task.answer }));
    const list = preset || task.fixed ? opts : shuffle(opts);
    const words = list.some((o) => String(o.text).length > 14);
    let done = false;
    const buttons = list.map((o, i) =>
      h('button', { type: 'button', class: 'choice', onclick: () => choose(i) }, h('kbd', { text: String(i + 1) }), o.text),
    );
    const choose = (/** @type {number} */ i) => {
      if (done) return;
      done = true;
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (list[j].ok) b.classList.add('right');
        else if (j !== i) b.classList.add('dim');
      });
      if (!list[i].ok) buttons[i].classList.add('wrong');
      resolve(list[i].ok, { answer: list.find((o) => o.ok)?.text });
    };
    work.append(
      ...withArt(task, h('div', { class: `choices${words ? ' words' : ''}` }, buttons), kbdHint(T('kChoice', { n: buttons.length }))),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= buttons.length) {
        choose(n - 1);
        return true;
      }
      return false;
    });
  };

  // True / false. keys V/F, 1/2.
  /** @type {ExamRenderer<ExamTfTask>} */
  const tf = (task, work, ctx) => {
    const { h, T, resolve, setKeys, withArt, kbdHint } = ctx;
    let done = false;
    const mk = (/** @type {boolean} */ val, /** @type {string} */ icon, /** @type {string} */ label, /** @type {string} */ key) =>
      h(
        'button',
        { type: 'button', class: 'choice', onclick: () => choose(val) },
        h('kbd', { text: key }),
        h('b', { 'aria-hidden': 'true', text: icon }),
        label,
      );
    const yes = mk(true, '✓', T('true'), 'V');
    const no = mk(false, '✗', T('false'), 'F');
    const choose = (/** @type {boolean} */ val) => {
      if (done) return;
      done = true;
      const ok = val === task.truth;
      yes.disabled = true;
      no.disabled = true;
      (task.truth ? yes : no).classList.add('right');
      if (!ok) (val ? yes : no).classList.add('wrong');
      resolve(ok, { answer: task.truth ? T('true') : T('false') });
    };
    work.append(...withArt(task, h('div', { class: 'choices tf' }, yes, no), kbdHint(T('kTf'))));
    setKeys((e) => {
      const k = e.key.toLowerCase();
      if (k === 'v' || k === '1') {
        choose(true);
        return true;
      }
      if (k === 'f' || k === '2') {
        choose(false);
        return true;
      }
      return false;
    });
  };

  // Sort into bins: tap a card, then a bin (or bin number). ≤1 mistake = correct.
  const sampleItems = (/** @type {ExamSortTask} */ task, /** @type {number} */ n, /** @type {ExamRendererCtx['shuffle']} */ shuffle) => {
    const byBin = task.bins.map((b) => shuffle(task.items.filter((it) => it.bin === b.id)));
    const out = byBin.map((list) => list[0]).filter(Boolean);
    const rest = shuffle(byBin.flatMap((list) => list.slice(1)));
    while (out.length < n && rest.length) out.push(rest.pop());
    return shuffle(out);
  };
  /** @type {ExamRenderer<ExamSortTask>} */
  const sort = (task, work, ctx) => {
    const { h, T, shuffle, shake, hint: mkHint, kbdHint, draggable, resolve, answered, setKeys } = ctx;
    const items = sampleItems(task, 6, shuffle);
    const bins = task.bins;
    const placed = new Set();
    const tries = new Map();
    let mistakes = 0;
    let sel = 0;
    const hint = mkHint();
    const binLists = [];
    const chips = items.map((it, i) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => select(i) },
        it.icon && h('span', { class: 'ico', 'aria-hidden': 'true', text: it.icon }),
        it.text,
      );
      draggable(b, { onStart: () => select(i), targets: '.bin', onDrop: (t) => drop(Number(t.dataset.i)) });
      return b;
    });
    const binEls = bins.map((b, i) => {
      const list = h('div', { class: 'bin-items' });
      binLists.push(list);
      return h(
        'button',
        { type: 'button', class: 'bin', 'data-i': String(i), onclick: () => drop(i) },
        h(
          'span',
          { class: 'bin-head' },
          h('span', { class: 'ico', 'aria-hidden': 'true', text: b.icon }),
          b.label,
          h('kbd', { text: String(i + 1) }),
        ),
        list,
      );
    });
    const select = (/** @type {number} */ i) => {
      if (placed.has(i)) return;
      sel = i;
      chips.forEach((c, j) => c.setAttribute('aria-pressed', String(j === i)));
    };
    const remaining = () => items.map((_, i) => i).filter((i) => !placed.has(i));
    const place = (/** @type {number} */ i, /** @type {number} */ binIdx, /** @type {boolean} */ fixed) => {
      placed.add(i);
      chips[i].remove();
      binLists[binIdx].append(
        h('span', { class: fixed ? 'fixed' : '', text: `${items[i].icon ? `${items[i].icon} ` : ''}${items[i].text}` }),
      );
      const el = binEls[binIdx];
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 500);
      const rest = remaining();
      if (!rest.length) {
        resolve(mistakes <= 1, { soft: mistakes === 1 });
        return;
      }
      select(rest[0]);
    };
    const drop = (/** @type {number} */ binIdx) => {
      if (answered() || !bins[binIdx]) return;
      if (!remaining().includes(sel)) {
        hint.textContent = T('pickCard');
        return;
      }
      const it = items[sel];
      if (it.bin === bins[binIdx].id) {
        hint.textContent = '';
        place(sel, binIdx, false);
        return;
      }
      mistakes++;
      const t = (tries.get(sel) || 0) + 1;
      tries.set(sel, t);
      shake(chips[sel], binEls[binIdx]);
      if (t >= 2) {
        const right = bins.findIndex((b) => b.id === it.bin);
        hint.textContent = T('sortGoes', { item: it.text, bin: bins[right].label });
        place(sel, right, true);
      } else {
        hint.textContent = T('sortTry');
      }
    };
    select(0);
    work.append(
      h('div', { class: 'tray' }, chips),
      hint,
      h('div', { class: 'bins', style: `--n:${bins.length}` }, binEls),
      kbdHint(T('kSort', { n: bins.length })),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= bins.length) {
        drop(n - 1);
        return true;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const rest = remaining();
        if (!rest.length) return true;
        const at = Math.max(0, rest.indexOf(sel));
        const d = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        select(rest[(at + d + rest.length) % rest.length]);
        chips[sel].focus({ preventScroll: true });
        return true;
      }
      return false;
    });
  };

  // Order: tap cards in order, each gets the next free number. Two checks allowed.
  /** @type {ExamRenderer<ExamOrderTask>} */
  const order = (task, work, ctx) => {
    const { h, T, shuffle, shake, hint: mkHint, kbdHint, withArt, resolve, answered, setKeys, LETTERS } = ctx;
    const n = task.items.length;
    const cards = shuffle(task.items.map((text, i) => ({ text, i })));
    const num = new Map(); // card index → number (1-based)
    const good = new Set();
    let checks = 0;
    const hint = mkHint();
    const els = cards.map((c, k) =>
      h(
        'button',
        { type: 'button', class: 'ord-card', onclick: () => tap(k) },
        h('span', { class: 'ord-num', 'aria-hidden': 'true' }),
        h('span', { text: c.text }),
        h('kbd', { text: LETTERS[k] }),
      ),
    );
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark', disabled: true, onclick: () => check() }, T('check'));
    const undoBtn = h('button', { type: 'button', class: 'btn btn-light', onclick: () => undo() }, T('undo'));
    const draw = () => {
      els.forEach((el, k) => {
        const v = num.get(k);
        el.querySelector('.ord-num').textContent = v ? String(v) : '';
        el.classList.toggle('set', !!v);
        el.classList.toggle('good', good.has(k));
        el.setAttribute('aria-label', `${cards[k].text}${v ? ` — ${v}` : ''}`);
      });
      checkBtn.disabled = num.size < n;
      undoBtn.disabled = [...num.keys()].every((k) => good.has(k));
    };
    const tap = (/** @type {number} */ k) => {
      if (answered() || good.has(k)) return;
      if (num.has(k)) num.delete(k);
      else {
        const used = new Set(num.values());
        let v = 1;
        while (used.has(v)) v++;
        num.set(k, v);
      }
      hint.textContent = '';
      draw();
      if (num.size === n) checkBtn.focus({ preventScroll: true });
    };
    const undo = () => {
      let last = null;
      for (const [k, v] of num) if (!good.has(k) && (last === null || v > num.get(last))) last = k;
      if (last !== null) {
        num.delete(last);
        draw();
      }
    };
    const reveal = () => {
      const sorted = cards.map((c, k) => k).sort((a, b) => cards[a].i - cards[b].i);
      els.forEach((el, k) => {
        el.disabled = true;
        const ok = num.get(k) === cards[k].i + 1;
        el.classList.toggle('good', ok);
        el.classList.toggle('bad', !ok);
        el.querySelector('.ord-num').textContent = String(cards[k].i + 1);
      });
      list.replaceChildren(...sorted.map((k) => els[k]));
      actions.remove();
    };
    const check = () => {
      if (answered()) return;
      if (num.size < n) {
        hint.textContent = T('orderNeedAll');
        return;
      }
      checks++;
      const wrong = cards.map((c, k) => k).filter((k) => num.get(k) !== cards[k].i + 1);
      if (!wrong.length) {
        reveal();
        resolve(true, { soft: checks > 1 });
        return;
      }
      if (checks >= 2) {
        reveal();
        resolve(false);
        return;
      }
      cards.forEach((c, k) => {
        if (!wrong.includes(k)) good.add(k);
      });
      wrong.forEach((k) => num.delete(k));
      shake(...wrong.map((k) => els[k]));
      hint.textContent = T('orderGreen');
      draw();
    };
    const list = h('div', { class: 'order' }, els);
    const actions = h('div', { class: 'ord-actions' }, undoBtn, checkBtn);
    draw();
    work.append(...withArt(task, list, hint, actions, kbdHint(T('kOrder'))));
    setKeys((e) => {
      const k = LETTERS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && k >= 0 && k < n) {
        tap(k);
        return true;
      }
      if (e.key === 'Backspace') {
        undo();
        return true;
      }
      if (e.key === 'Enter') {
        check();
        return true;
      }
      return false;
    });
  };

  // Pairs: tap left then right (any order). ≤1 mistake = correct.
  const PAIR_COLORS = ['#c9f269', '#bfe3ff', '#ffd9a8', '#f3c6ef', '#c8f0dc'];
  /** @type {ExamRenderer<ExamPairsTask>} */
  const pairsTask = (task, work, ctx) => {
    const { h, T, shuffle, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, LETTERS } = ctx;
    const pairs = task.pairs;
    const left = shuffle(pairs.map((p, i) => ({ text: p[0], i })));
    const right = shuffle(pairs.map((p, i) => ({ text: p[1], i })));
    let selL = null;
    let selR = null;
    let mistakes = 0;
    let matched = 0;
    const tries = new Map();
    const hint = mkHint();
    const mk = (/** @type {{ text: string }} */ item, /** @type {'L' | 'R'} */ side, /** @type {number} */ k) =>
      h(
        'button',
        { type: 'button', class: 'pr', 'aria-pressed': 'false', onclick: () => tap(side, k) },
        h('kbd', { text: side === 'L' ? String(k + 1) : LETTERS[k] }),
        item.text,
      );
    const lEls = left.map((it, k) => mk(it, 'L', k));
    const rEls = right.map((it, k) => mk(it, 'R', k));
    const mark = () => {
      lEls.forEach((el, k) => el.setAttribute('aria-pressed', String(k === selL)));
      rEls.forEach((el, k) => el.setAttribute('aria-pressed', String(k === selR)));
    };
    const lock = (/** @type {number} */ l, /** @type {number} */ r) => {
      const color = PAIR_COLORS[matched % PAIR_COLORS.length];
      matched++;
      for (const el of [lEls[l], rEls[r]]) {
        el.classList.add('matched');
        el.style.setProperty('--pc', color);
        el.disabled = true;
        el.prepend(h('span', { class: 'tag', 'aria-hidden': 'true', text: String(matched) }));
      }
    };
    const tap = (/** @type {'L' | 'R'} */ side, /** @type {number} */ k) => {
      if (answered()) return;
      const els = side === 'L' ? lEls : rEls;
      if (!els[k] || els[k].disabled) return;
      if (side === 'L') selL = selL === k ? null : k;
      else selR = selR === k ? null : k;
      mark();
      if (selL === null || selR === null) return;
      const l = selL;
      const r = selR;
      selL = null;
      selR = null;
      if (left[l].i === right[r].i) {
        hint.textContent = '';
        lock(l, r);
      } else {
        mistakes++;
        shake(lEls[l], rEls[r]);
        const t = (tries.get(l) || 0) + 1;
        tries.set(l, t);
        if (t >= 2) {
          lock(
            l,
            right.findIndex((x) => x.i === left[l].i),
          );
          hint.textContent = T('pairShown');
        } else {
          hint.textContent = T('pairNo');
        }
      }
      mark();
      if (matched === pairs.length) resolve(mistakes <= 1, { soft: mistakes === 1 });
    };
    work.append(
      h('div', { class: 'pairs' }, h('div', { class: 'col' }, lEls), h('div', { class: 'col' }, rEls)),
      hint,
      kbdHint(T('kPairs', { n: pairs.length, l: LETTERS[pairs.length - 1] })),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= pairs.length) {
        tap('L', n - 1);
        return true;
      }
      const k = LETTERS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && k >= 0 && k < pairs.length) {
        tap('R', k);
        return true;
      }
      return false;
    });
  };

  window.KFExam.types = { choice, tf, sort, order, pairs: pairsTask };
})();
