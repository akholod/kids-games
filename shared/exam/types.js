// Keeper Fun Games — generic exam task renderers: KFExam.types.{choice, tf, sort, order, pairs, label, fill, pick}, and KFExam.builder (word from tiles).
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

  // Label a drawn scene (ctx.art.scene(name), see ExamScene): tap a name chip then a slot (or slot then chip). ≤1 mistake = correct.
  /** @type {ExamRenderer<ExamLabelTask>} */
  const label = (task, work, ctx) => {
    const { h, T, shuffle, shake, art, hint: mkHint, kbdHint, draggable, resolve, answered, setKeys, LETTERS } = ctx;
    const sc = art?.scene?.(task.scene);
    if (!sc) return ctx.fallback(task, work, [{ text: task.labels[0].text, ok: true }]);
    const labels = shuffle(task.labels);
    const spots = sc.spots.filter((s) => labels.some((l) => l.id === s.id));
    const [bw, bh] = sc.box;
    const hint = mkHint();
    let selChip = null;
    let selSlot = null;
    let mistakes = 0;
    let placedN = 0;
    const tries = new Map();
    const chipEls = labels.map((l, k) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => tapChip(k) },
        h('kbd', { text: String(k + 1) }),
        l.text,
      );
      draggable(b, {
        onStart: () => {
          selChip = k;
          mark();
        },
        targets: '.slot',
        onDrop: (t) => tapSlot(Number(t.dataset.i)),
      });
      return b;
    });
    const slotEls = spots.map((s, k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'slot',
          'data-i': String(k),
          'data-spot': s.id,
          'aria-label': T('siteLabel', { l: LETTERS[k] }),
          'aria-pressed': 'false',
          style: `left:${(s.x / bw) * 100}%;top:${(s.y / bh) * 100}%;width:${(s.w / bw) * 100}%`,
          onclick: () => tapSlot(k),
        },
        h('span', { class: 'q', 'aria-hidden': 'true', text: '?' }),
        h('kbd', { text: LETTERS[k] }),
      ),
    );
    const mark = () => {
      chipEls.forEach((c, k) => c.setAttribute('aria-pressed', String(k === selChip)));
      slotEls.forEach((s, k) => s.setAttribute('aria-pressed', String(k === selSlot)));
    };
    const fill = (/** @type {number} */ chipK, /** @type {number} */ slotK, /** @type {boolean} */ fixed) => {
      const el = slotEls[slotK];
      el.replaceChildren(labels[chipK].text);
      el.classList.add('filled');
      if (fixed) el.classList.add('fixed');
      el.disabled = true;
      el.setAttribute('aria-label', labels[chipK].text);
      chipEls[chipK].remove();
      chipEls[chipK].disabled = true;
      placedN++;
      selChip = null;
      selSlot = null;
      const nextChip = chipEls.findIndex((c) => !c.disabled);
      if (nextChip >= 0) selChip = nextChip;
      mark();
      if (placedN === spots.length) resolve(mistakes <= 1, { soft: mistakes === 1 });
    };
    const attempt = () => {
      if (selChip === null || selSlot === null) return;
      const chipK = selChip;
      const slotK = selSlot;
      if (labels[chipK].id === spots[slotK].id) {
        hint.textContent = '';
        fill(chipK, slotK, false);
        return;
      }
      mistakes++;
      shake(chipEls[chipK], slotEls[slotK]);
      const t = (tries.get(chipK) || 0) + 1;
      tries.set(chipK, t);
      selSlot = null;
      if (t >= 2) {
        hint.textContent = T('labelShown', { text: labels[chipK].text });
        fill(
          chipK,
          spots.findIndex((s) => s.id === labels[chipK].id),
          true,
        );
      } else {
        hint.textContent = T('labelTry');
        mark();
      }
    };
    const tapChip = (/** @type {number} */ k) => {
      if (answered() || !chipEls[k] || chipEls[k].disabled) return;
      selChip = k;
      mark();
      attempt();
    };
    const tapSlot = (/** @type {number} */ k) => {
      if (answered() || !slotEls[k] || slotEls[k].disabled) return;
      selSlot = k;
      mark();
      if (selChip === null) {
        hint.textContent = T('pickLabel');
        return;
      }
      attempt();
    };
    selChip = 0;
    mark();
    const scene = h('div', { class: `scene${sc.cls ? ` ${sc.cls}` : ''}`, style: `--ar:${bw / bh}` }, sc.el, slotEls);
    // Wide screens: the names stand in a column beside the drawing (label-task in exam.css).
    work.append(
      h('div', { class: 'label-task' }, h('div', { class: 'label-side' }, h('div', { class: 'tray' }, chipEls), hint), scene),
      kbdHint(T('kLabel', { n: labels.length, l: LETTERS[spots.length - 1] })),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= labels.length) {
        tapChip(n - 1);
        return true;
      }
      const k = LETTERS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && k >= 0 && k < spots.length) {
        tapSlot(k);
        return true;
      }
      return false;
    });
  };

  // ---------- builder ----------
  // A word built from units (letters, syllables) in slots: tap a tile (or type), tap a filled slot = it and the ones after it go back,
  // ⌫ = erase, check when full: a miss locks the right slots green and sends the rest back once, the second miss shows the answer.
  // Used by renderers of units that spell: KFExam.builder(ctx, opts) → ExamBuilder (see types/exam.d.ts); the renderer lays out the parts.
  /** @type {ExamBuilderFactory} */
  const builder = (ctx, o) => {
    const { h, T, shake, resolve, answered } = ctx;
    const { target, classes, strings } = o;
    const pool = o.tiles || null;
    const same = o.same || ((a, b) => a === b);
    const show = o.show || ((u) => u);
    const n = target.length;
    /** @type {(string | null)[]} slot → unit in it */
    const units = Array(n).fill(null);
    /** @type {(number | null)[]} slot → index of the tile of the pool in it */
    const from = Array(n).fill(null);
    /** @type {Set<number>} slots already checked right (locked) */
    const good = new Set();
    let tries = 0;
    const hint = ctx.hint();
    // Tiles and the erase button must not take the focus on a tap: Enter would then click them instead of «check».
    const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();

    const slotEls = target.map((_, i) =>
      h('button', { type: 'button', class: classes.slot, 'data-i': String(i), onmousedown: keepFocus, onclick: () => takeFrom(i) }),
    );
    const tileEls = (pool || []).map((unit, t) =>
      h(
        'button',
        {
          type: 'button',
          class: classes.tile,
          [o.tileAttr || 'data-unit']: unit,
          onmousedown: keepFocus,
          onclick: () => putTile(t),
          text: o.tileContent ? null : unit,
        },
        o.tileContent?.(unit, t),
      ),
    );
    const eraseBtn = h(
      'button',
      { type: 'button', class: `btn btn-light ${classes.erase}`, onmousedown: keepFocus, onclick: () => erase() },
      T(strings.erase),
    );
    const checkBtn = h('button', { type: 'button', class: `btn btn-dark ${classes.check}`, onclick: () => check() }, T('check'));
    const slotsEl = h('div', { class: classes.slots, lang: o.slotsLang }, slotEls);
    const tilesEl = h('div', { class: classes.tiles, lang: o.tilesLang }, tileEls);

    const used = (/** @type {number} */ t) => from.includes(t);
    const free = () => units.indexOf(null);
    const draw = () => {
      const next = free();
      slotEls.forEach((el, i) => {
        const u = units[i];
        el.textContent = u === null ? '' : show(u);
        el.classList.toggle('filled', u !== null);
        el.classList.toggle('good', good.has(i));
        el.classList.toggle('next', i === next && !answered());
        el.disabled = u === null || good.has(i) || answered();
      });
      tileEls.forEach((el, t) => {
        el.disabled = used(t) || answered();
      });
      checkBtn.disabled = next >= 0;
      if (checkBtn.disabled && document.activeElement === checkBtn) checkBtn.blur(); // no focus ring on a dead button
      eraseBtn.disabled = !units.some((u, i) => u !== null && !good.has(i));
    };

    const fill = (/** @type {string} */ unit, /** @type {number | null} */ t) => {
      const s = free();
      units[s] = unit;
      from[s] = t;
      hint.textContent = '';
      draw();
      if (free() < 0) checkBtn.focus({ preventScroll: true });
    };
    const putTile = (/** @type {number} */ t) => {
      if (answered() || !pool || t < 0 || t >= pool.length || used(t)) return;
      if (free() < 0) {
        if (o.shakeFull) shake(slotsEl);
        return;
      }
      fill(pool[t], t);
    };
    const put = (/** @type {string} */ unit) => {
      const t = pool ? pool.findIndex((c, i) => same(c, unit) && !used(i)) : -1;
      if (free() < 0 || (pool && t < 0)) shake(free() < 0 ? slotsEl : tilesEl);
      else if (pool) putTile(t);
      else if (!answered()) fill(unit, null);
    };
    // Back one unit: the last one that is not locked green.
    const erase = () => {
      if (answered()) return;
      for (let i = n - 1; i >= 0; i--) {
        if (units[i] !== null && !good.has(i)) {
          units[i] = null;
          from[i] = null;
          break;
        }
      }
      draw();
    };
    // A tapped unit goes back to the tiles, with the ones after it (slots fill left to right).
    const takeFrom = (/** @type {number} */ i) => {
      if (answered() || good.has(i)) return;
      for (let j = i; j < n; j++) {
        if (good.has(j)) continue;
        units[j] = null;
        from[j] = null;
      }
      draw();
    };
    const check = () => {
      if (answered()) return;
      if (free() >= 0) {
        hint.textContent = T(strings.fill);
        shake(slotsEl);
        return;
      }
      tries++;
      const wrong = target.map((_, i) => i).filter((i) => !same(/** @type {string} */ (units[i]), target[i]));
      for (const i of target.keys()) if (!wrong.includes(i)) good.add(i);
      if (!wrong.length || tries >= 2) {
        // Done: the player's right units stay green, the fixed ones are amber.
        hint.textContent = '';
        resolve(!wrong.length, wrong.length ? { answer: o.answer ?? target.join('') } : { soft: tries > 1 });
        draw();
        for (const i of wrong) {
          slotEls[i].textContent = show(target[i]);
          slotEls[i].classList.add('fixed');
        }
        o.onDone?.(!wrong.length);
        return;
      }
      // One more try: right units lock green, the others go back to the tiles.
      for (const i of wrong) {
        units[i] = null;
        from[i] = null;
      }
      hint.textContent = good.size ? T(strings.green) : T(strings.again);
      draw();
      for (const i of wrong) KFG.restart(slotEls[i], 'missed');
      shake(...wrong.map((i) => slotEls[i]));
    };

    draw();
    return {
      slotsEl,
      tilesEl,
      slotEls,
      tileEls,
      eraseBtn,
      checkBtn,
      hint,
      put,
      putTile,
      erase,
      check,
      values: () => [...units],
      setKeys: (extra) =>
        ctx.setKeys((e) => {
          if (e.key === 'Enter') {
            check();
            return true;
          }
          if (e.key === 'Backspace' || e.key === 'Delete') {
            erase();
            return true;
          }
          if (extra?.(e)) return true;
          const k = o.keyUnit?.(e);
          if (k === null || k === undefined) return false;
          if (typeof k === 'number') putTile(k);
          else put(k);
          return true;
        }),
    };
  };

  // ---------- fill ----------
  // One word written into a sentence (text has one ___): letter tiles of the word + 2 traps go into slots via the builder.
  // Typing: a letter takes a free tile of it; a plain vowel takes the accented one (á é í ó ú) when no plain one is free.
  const ACCENTED = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
  const PLAIN = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
  const TRAP_VOWELS = 'aeiou';
  const TRAP_CONSONANTS = 'bcdfglmnprstv';

  // Two letters that are not in the word (one vowel and one consonant when possible), so the extra tiles look like real choices.
  /** @param {string[]} letters @param {(a: string[]) => string[]} shuffle */
  const trapLetters = (letters, shuffle) => {
    const has = new Set(letters.map((c) => PLAIN[c] || c));
    const free = (/** @type {string} */ set) => shuffle([...set].filter((c) => !has.has(c)));
    const v = free(TRAP_VOWELS);
    const c = free(TRAP_CONSONANTS);
    return [v[0], c[0], ...v.slice(1), ...c.slice(1)].filter(Boolean).slice(0, 2);
  };

  // A typed letter: e.key, or the physical key on a non-Latin layout (a Ukrainian keyboard gives «ф» for A). A dead key (´) is not a letter.
  const typedLetter = (/** @type {KeyboardEvent} */ e) => {
    if (e.key === 'Dead' || e.key.length !== 1) return null;
    if (/[a-záéíóúüñ]/i.test(e.key)) return e.key.toLowerCase();
    const m = /^Key([A-Z])$/.exec(e.code || '');
    return m ? m[1].toLowerCase() : null;
  };

  /** @type {ExamRenderer<ExamFillTask>} */
  const fill = (task, work, ctx) => {
    const { h, T, shuffle, kbdHint } = ctx;
    const target = [...task.answer];
    const extra = task.extra ? [...task.extra] : trapLetters(target, shuffle);
    const pool = shuffle([...target, ...extra]);
    const [before, after] = task.text.split('___');
    const lang = ctx.content.lang || 'es';
    const gap = h('span', { class: 'fill-gap', text: '___' });
    const sentence = h('p', { class: 'fill-text', lang }, before, gap, after);
    /** @type {ExamBuilder} */
    const b = builder(ctx, {
      target,
      tiles: pool,
      shakeFull: true,
      // A free tile of the letter, else (a plain vowel) of its accented twin; else the letter itself, which shakes the tiles.
      keyUnit: (e) => {
        const c = typedLetter(e);
        if (c === null) return null;
        const tile = (/** @type {string} */ u) => pool.findIndex((p, i) => p === u && !b.tileEls[i].disabled);
        const t = tile(c);
        const acc = t < 0 && ACCENTED[c] ? tile(ACCENTED[c]) : -1;
        return t >= 0 ? t : acc >= 0 ? acc : c;
      },
      classes: { slot: 'fill-slot', tile: 'fill-tile', slots: 'fill-slots', tiles: 'fill-tiles', erase: 'fill-erase', check: 'fill-check' },
      tileAttr: 'data-ch',
      slotsLang: lang,
      tilesLang: lang,
      strings: { fill: 'fillNeed', green: 'fillGreen', again: 'fillAgain', erase: 'fillErase' },
      onDone: (ok) => {
        gap.replaceWith(h('b', { class: `fill-word${ok ? '' : ' fix'}`, text: task.answer }));
        box.classList.add('is-done');
      },
    });
    if (target.length > 8) b.slotsEl.classList.add('is-long');
    const box = h(
      'div',
      { class: 'fill-task' },
      h('div', { class: 'fill-main' }, sentence, b.slotsEl, b.hint),
      h('div', { class: 'fill-side' }, b.tilesEl, h('div', { class: 'fill-actions' }, b.eraseBtn, b.checkBtn)),
    );
    work.append(box, kbdHint(T('kFill')));
    b.setKeys();
  };

  // ---------- pick ----------
  // Tap the right words of a sentence: `[word]` in the text marks a right one, the others are traps. Punctuation stays beside its
  // word but is not tappable. Check: all right = done; the 1st miss locks the right picks (green), takes the wrong ones back and
  // lets the player try once more; the 2nd miss shows the answer (right green, missed outlined, wrong red) and resolves false.
  /** @typedef {{ pre: string, word: string, post: string, right: boolean }} PickWord */
  /**
   * The sentence as chunks: a word with the punctuation stuck to it, or a bare string (a dash on its own).
   * @param {string} text
   * @returns {(PickWord | string)[]}
   */
  const pickChunks = (text) =>
    text
      .split(/\s+/)
      .filter(Boolean)
      .map((chunk) => {
        const m = /^([^[]*)\[([^\]]+)\](.*)$/.exec(chunk);
        if (m) return { pre: m[1], word: m[2], post: m[3], right: true };
        const w = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u.exec(chunk);
        return w?.[2] ? { pre: w[1], word: w[2], post: w[3], right: false } : chunk;
      });

  /** @type {ExamRenderer<ExamPickTask>} */
  const pick = (task, work, ctx) => {
    const { h, T, shake, hint: mkHint, kbdHint, resolve, answered, setKeys } = ctx;
    const chunks = pickChunks(task.text);
    /** @type {{ word: string, right: boolean, el: HTMLButtonElement }[]} */
    const words = [];
    /** @type {Set<number>} */
    const sel = new Set();
    /** @type {Set<number>} the right picks of a checked try: locked */
    const locked = new Set();
    let checks = 0;
    const hint = mkHint();
    const stop = (/** @type {Event} */ e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const line = chunks.map((c) => {
      if (typeof c === 'string') return h('span', { class: 'pick-chunk', text: c });
      const i = words.length;
      const el = /** @type {HTMLButtonElement} */ (
        h('button', {
          type: 'button',
          class: 'pick-word',
          'aria-pressed': 'false',
          text: c.word,
          onclick: () => toggle(i),
          // Enter on a focused word checks (it must not click the word), Space toggles it: both handled here, before the engine's key handler
          onkeydown: (/** @type {KeyboardEvent} */ e) => {
            if (e.key === 'Enter') {
              stop(e);
              check();
            } else if (e.key === ' ') {
              stop(e);
              toggle(i);
            }
          },
          onkeyup: (/** @type {KeyboardEvent} */ e) => e.key === ' ' && stop(e),
        })
      );
      words.push({ word: c.word, right: c.right, el });
      return h('span', { class: 'pick-chunk' }, c.pre, el, c.post);
    });
    const draw = () => {
      words.forEach((w, i) => {
        w.el.setAttribute('aria-pressed', String(sel.has(i)));
        w.el.classList.toggle('is-good', locked.has(i));
        w.el.disabled = locked.has(i) || answered();
      });
      clearBtn.disabled = answered() || [...sel].every((i) => locked.has(i));
    };
    const toggle = (/** @type {number} */ i) => {
      if (answered() || locked.has(i)) return;
      if (sel.has(i)) sel.delete(i);
      else sel.add(i);
      hint.textContent = '';
      draw();
    };
    const clear = () => {
      if (answered()) return;
      for (const i of [...sel]) if (!locked.has(i)) sel.delete(i);
      hint.textContent = '';
      draw();
    };
    const check = () => {
      if (answered()) return;
      if (!sel.size) {
        hint.textContent = T('pickNeed');
        shake(line[0]);
        return;
      }
      checks++;
      const wrong = [...sel].filter((i) => !words[i].right);
      const missed = words.map((w, k) => k).filter((k) => words[k].right && !sel.has(k));
      if (!wrong.length && !missed.length) {
        for (const i of sel) locked.add(i);
        draw();
        resolve(true, { soft: checks > 1 });
        return;
      }
      if (checks >= 2) {
        // The answer: right picks green, missed right words outlined, wrong picks red.
        words.forEach((w, i) => {
          w.el.disabled = true;
          w.el.classList.toggle('is-good', sel.has(i) && w.right);
          w.el.classList.toggle('is-wrong', sel.has(i) && !w.right);
          w.el.classList.toggle('is-missed', !sel.has(i) && w.right);
        });
        clearBtn.disabled = true;
        checkBtn.disabled = true;
        hint.textContent = '';
        resolve(false, {
          answer: words
            .filter((w) => w.right)
            .map((w) => w.word)
            .join(', '),
        });
        return;
      }
      // One more try: the right picks lock green, the wrong ones go back (flashing amber).
      for (const i of sel) if (words[i].right) locked.add(i);
      for (const i of wrong) {
        sel.delete(i);
        KFG.restart(words[i].el, 'missed');
      }
      hint.textContent = locked.size ? T('pickGreen') : T('pickAgain');
      draw();
      shake(...wrong.map((i) => words[i].el));
    };
    const checkBtn = /** @type {HTMLButtonElement} */ (
      h('button', { type: 'button', class: 'btn btn-dark pick-check', onclick: () => check() }, T('check'))
    );
    const clearBtn = /** @type {HTMLButtonElement} */ (
      h('button', { type: 'button', class: 'btn btn-light pick-clear', onclick: () => clear() }, T('pickClear'))
    );
    // Words are the only tab stops that matter: a tap on the buttons must not steal the focus from the keyboard flow.
    clearBtn.addEventListener('mousedown', (e) => e.preventDefault());
    draw();
    work.append(
      h(
        'div',
        { class: 'pick-task' },
        // spaces between the chunks are real text (copy, screen readers); the flex layout does not draw them
        h(
          'p',
          { class: 'pick-text', lang: ctx.content.lang || 'es' },
          line.flatMap((c, i) => (i ? [' ', c] : [c])),
        ),
        hint,
        h('div', { class: 'pick-actions' }, clearBtn, checkBtn),
      ),
      kbdHint(T('kPick')),
    );
    const focusAt = (/** @type {number} */ d) => {
      const live = words.map((w) => w.el).filter((el) => !el.disabled);
      if (!live.length) return;
      const at = live.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
      live[at < 0 ? (d > 0 ? 0 : live.length - 1) : (at + d + live.length) % live.length].focus();
    };
    setKeys((e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') focusAt(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') focusAt(-1);
      else if (e.key === 'Enter') check();
      else if (e.key === 'Backspace' || e.key === 'Delete') clear();
      else if (e.key === ' ') {
        const i = words.findIndex((w) => w.el === document.activeElement);
        if (i >= 0) toggle(i);
        else focusAt(1);
      } else return false;
      return true;
    });
  };

  window.KFExam.types = { choice, tf, sort, order, pairs: pairsTask, label, fill, pick };
  window.KFExam.builder = builder;
})();
