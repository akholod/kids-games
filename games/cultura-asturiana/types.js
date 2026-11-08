// Renderers of the task types only «Cultura asturiana» has:
//   window.CA_TYPES = { feed, cook, wordsearch, clues, calendar, cascayu } → KFExam.mount(..., { types })
//   window.CA_CHECK(unit) → string[]   content errors of these six types (empty = fine), for the unit tests
// Generic types (choice, tf, sort, order, pairs, label, fill, pick) live in shared/exam/types.js. Data shapes: types/cultura-asturiana.d.ts.
// No DOM at load time (the unit tests load this file in a vm with only KF.i18n).
// @ts-check
'use strict';

(() => {
  // Texts: Spanish on both sites, like the engine's (exam units are taught in Spanish).
  const S = {
    kFeed: ({ n }) => `Toca lo que va dentro (o arrástralo). Teclas 1–${n}`,
    feedLeft: ({ n }) => (n === 1 ? '¡Sí! Falta 1.' : `¡Sí! Faltan ${n}.`),
    feedNo: ({ item }) => `«${item}»: ¡eso no! Prueba con otra cosa.`,
    feedFull: '¡Ya está todo dentro!',
    feedTarget: ({ n, need }) => `Dentro: ${n} de ${need}`,
    and: 'y',
    kCook: ({ n }) => `Toca los pasos en orden. Teclas 1–${n}`,
    cookFirst: 'Empieza por el principio: ¿qué va primero?',
    cookNotYet: 'Todavía no: ¿qué va antes?',
    cookExtra: ({ item }) => `«${item}» no va en esta receta.`,
    cookShown: ({ item }) => `Ahora toca: «${item}».`,
    cookGood: ({ n, total }) => `¡Bien! Paso ${n} de ${total}.`,
    cookDone: '¡Listo para comer!',
    kWs: 'Toca la primera letra y la última (o arrastra). Teclado: flechas para moverte, Enter o Espacio para marcar',
    wsStart: 'Ahora toca la última letra de la palabra.',
    wsLine: 'Las palabras van en línea recta: → o ↓.',
    wsNo: 'Esa no es ninguna palabra de la lista. ¡Sigue buscando!',
    wsAgain: 'Esa ya la has encontrado.',
    wsFound: ({ w }) => `¡${w}!`,
    wsClue: ({ l }) => `Pista: una palabra empieza por la letra que brilla (${l}).`,
    wsNote: ({ n }) => `Las has encontrado todas, con ${n} intentos fallidos.`,
    wsCell: ({ r, c, l }) => `Fila ${r}, columna ${c}: ${l}`,
    wsWords: 'Palabras',
    kClues: ({ n }) => `P = otra pista · Teclas 1–${n} para responder`,
    clueMore: 'Otra pista',
    clueOf: ({ i, n }) => `Pista ${i} de ${n}`,
    clueOne: '¡Con una sola pista! 🕵️',
    clueN: ({ n }) => `Lo has adivinado con ${n} pistas.`,
    clueWho: '¿Quién soy?',
    kCal: ({ n, l }) => `Toca una tarjeta y después su mes (o arrástrala). Teclado: A–${l} o ← → para la tarjeta, 1–${n} para el mes`,
    calPick: 'Primero toca una tarjeta.',
    calTry: 'Ese no es su mes. Prueba otro.',
    calGoes: ({ item, month }) => `«${item}» va en ${month}.`,
    kHop: 'Teclas: V o ← = Verdad · F o → = Mentira · Enter = seguir',
    hopTrue: 'Verdad',
    hopFalse: 'Mentira',
    hopOf: ({ i, n }) => `Casilla ${i} de ${n}`,
    hopOops: '¡Pisaste la raya!',
    hopWasTrue: 'Era verdad.',
    hopWasFalse: 'Era mentira.',
    hopOn: 'Seguir →',
    hopNice: '¡Salto perfecto!',
    hopNote: ({ n, total }) => `Has saltado bien ${n} de ${total} casillas.`,
    hopEnd: '¡Llegaste al cielo! ⭐',
  };
  const U = KF.i18n({ uk: S, es: S });

  /** @param {ExamRendererCtx} ctx @param {string | undefined} key @param {string} cls */
  const pic = (ctx, key, cls) => {
    const el = key ? ctx.art?.art(key) : null;
    return el ? ctx.h('span', { class: cls, 'aria-hidden': 'true' }, el) : null;
  };
  /** «a, b y c». */
  const list = (/** @type {string[]} */ xs) =>
    xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ${U('and')} ${xs[xs.length - 1]}`;
  // A tap on a control must not move the focus onto it: Enter would then click it again instead of the engine's «next».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();

  // ---------- feed: give the right things to a drawn target ----------
  const FEED_SAYS = {
    gochu: { yum: ['¡Ñam, ñam!', '¡Qué rico!', '¡Oink! ¡Más!'], no: '¡Puaj!' },
    vaca: { yum: ['¡Muuu, rico!', '¡Ñam!', '¡Muuu!'], no: '¡Muuu… eso no!' },
    tripa: { yum: ['¡Adentro!', '¡Bien!', '¡Eso sí!'], no: '¡Eso no lleva!' },
  };
  const BAG_SAYS = { yum: ['¡Dentro!', '¡Eso sí!', '¡Bien!'], no: '¡Eso no va!' };

  /** @type {ExamRenderer<CAFeedTask>} */
  const feed = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, draggable, resolve, answered, setKeys, lang } = ctx;
    const all = (Array.isArray(task.items) ? task.items : []).filter((it) => it?.text);
    const oks = all.filter((it) => it.ok);
    const target = ctx.art?.art(`t-${task.who}`);
    if (!target || !oks.length || oks.length === all.length) {
      return ctx.fallback(task, work, [
        { text: oks[0]?.text || all[0]?.text || '—', ok: true },
        ...all.filter((it) => !it.ok).map((it) => ({ text: it.text, ok: false })),
      ]);
    }
    const says = FEED_SAYS[task.who] || BAG_SAYS;
    const items = shuffle(all);
    const need = oks.length;
    let found = 0;
    let mistakes = 0;
    let done = false;
    let yumN = 0;
    const hint = mkHint();
    const slots = Array.from({ length: need }, () => h('span', { class: 'ca-pile-slot' }));
    const pile = h('div', { class: 'ca-pile', 'aria-hidden': 'true' }, slots);
    const bubble = h('span', { class: 'ca-bubble', 'aria-hidden': 'true' });
    const count = h('span', { class: 'ca-feed-count', text: U('feedTarget', { n: 0, need }) });
    const box = h('div', { class: 'ca-feed-target', 'data-who': task.who, 'data-mood': '' }, target, pile, bubble, count);
    const fill = /** @type {SVGPathElement | null} */ (target.querySelector('.ca-fill'));

    const react = (/** @type {'yum' | 'no'} */ mood) => {
      box.dataset.mood = mood;
      bubble.textContent = mood === 'yum' ? says.yum[yumN++ % says.yum.length] : says.no;
      KFG.restart(box, `is-${mood}`);
      box.classList.remove(mood === 'yum' ? 'is-no' : 'is-yum');
    };
    const tiles = items.map((it, k) => {
      const b = h(
        'button',
        { type: 'button', class: 'ca-item', 'data-i': String(all.indexOf(it)), onclick: () => give(k) },
        h('kbd', { text: String(k + 1) }),
        pic(ctx, it.art, 'ca-item-pic'),
        h('span', { class: 'ca-item-name', text: it.text }),
      );
      draggable(b, { targets: '.ca-feed-target', onDrop: () => give(k) });
      return b;
    });
    // The picture of the tile flies into the next free place of the pile (nothing flies with reduced motion).
    const putIn = (/** @type {number} */ k, /** @type {HTMLElement} */ slot) => {
      const it = items[k];
      const mini = pic(ctx, it.art, 'ca-pile-pic') || h('span', { class: 'ca-pile-dot', text: '✓' });
      slot.classList.add('is-full');
      slot.title = it.text;
      if (reduced()) return slot.append(mini);
      const from = tiles[k].querySelector('.ca-item-pic') || tiles[k];
      const a = from.getBoundingClientRect();
      const b = slot.getBoundingClientRect();
      const ghost = /** @type {HTMLElement} */ (from.cloneNode(true));
      ghost.classList.add('ca-fly');
      Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
      document.body.append(ghost);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const s = Math.max(0.3, b.width / Math.max(1, a.width));
      const anim = ghost.animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(${(1 + s) / 2})`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.4 },
        ],
        { duration: 460, easing: 'cubic-bezier(.3,0,.4,1)' },
      );
      const land = () => {
        ghost.remove();
        if (!slot.childElementCount) slot.append(mini);
      };
      anim.onfinish = land;
      anim.oncancel = land;
    };
    const finish = () => {
      done = true;
      tiles.forEach((b) => {
        b.disabled = true;
        if (!b.classList.contains('is-in')) b.classList.add('is-out');
      });
      box.classList.add('is-full');
      if (document.activeElement instanceof HTMLElement && tiles.includes(/** @type {HTMLButtonElement} */ (document.activeElement)))
        document.activeElement.blur();
      hint.textContent = U('feedFull');
      const okTexts = oks.map((it) => it.text);
      resolve(mistakes <= 1, mistakes === 0 ? {} : mistakes === 1 ? { soft: true } : { answer: list(okTexts) });
    };
    const give = (/** @type {number} */ k) => {
      if (done || answered()) return;
      const it = items[k];
      const b = tiles[k];
      if (!it || !b || b.disabled) return;
      b.disabled = true;
      if (it.ok) {
        b.classList.add('is-in');
        putIn(k, slots[found]);
        found++;
        count.textContent = U('feedTarget', { n: found, need });
        if (fill) fill.style.strokeDashoffset = String(100 - (100 * found) / need);
        react('yum');
        if (found === need) return finish();
        hint.textContent = U('feedLeft', { n: need - found });
      } else {
        mistakes++;
        b.classList.add('is-no');
        shake(b);
        react('no');
        hint.textContent = U('feedNo', { item: it.text });
      }
    };
    work.append(
      h(
        'div',
        { class: 'ca-feed', style: `--n:${items.length}` },
        box,
        h('div', { class: 'ca-feed-side' }, h('div', { class: 'ca-items', lang }, tiles), hint, kbdHint(U('kFeed', { n: items.length }))),
      ),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= tiles.length) {
        give(n - 1);
        return true;
      }
      return false;
    });
  };

  // ---------- cook: a recipe step by step, the dish builds up ----------
  /** @type {ExamRenderer<CACookTask>} */
  const cook = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys, lang } = ctx;
    const steps = (Array.isArray(task.steps) ? task.steps : []).filter((s) => s?.text);
    const extra = (Array.isArray(task.extra) ? task.extra : []).filter((s) => s?.text);
    if (steps.length < 2) return ctx.fallback(task, work, [{ text: steps[0]?.text || '—', ok: true }]);
    const svg = ctx.art?.dish?.(task.dish);
    // Without the drawing it is still a recipe to put in order.
    if (!svg) return KFExam.types.order({ ...task, type: 'order', items: steps.map((s) => s.text) }, work, ctx);
    /** @type {{ text: string, art?: string, i: number }[]} */
    let cards = shuffle([...steps.map((s, i) => ({ ...s, i })), ...extra.map((s) => ({ ...s, i: -1 }))]);
    // A shuffle may come out with the steps already in order: then the first two swap.
    const inOrder = () => cards.filter((c) => c.i >= 0).every((c, k, a) => !k || a[k - 1].i < c.i);
    if (inOrder()) {
      const a = cards.findIndex((c) => c.i === 0);
      const b = cards.findIndex((c) => c.i === 1);
      cards = cards.map((c, k) => (k === a ? cards[b] : k === b ? cards[a] : c));
    }
    const n = steps.length;
    const hasQueso = steps.some((s) => s.art === 'queso');
    let next = 0;
    let mistakes = 0;
    let missesHere = 0;
    let fillets = 0;
    let done = false;
    const hint = mkHint();
    const stage = h('div', { class: 'ca-dish', 'data-step': '0' }, svg);

    const btns = cards.map((c, k) =>
      h(
        'button',
        { type: 'button', class: 'ca-step', 'data-i': c.i >= 0 ? String(c.i) : `x${k}`, onclick: () => tap(k) },
        h('kbd', { text: String(k + 1) }),
        h('span', { class: 'ca-step-num', 'aria-hidden': 'true' }),
        pic(ctx, c.art, 'ca-step-pic'),
        h('span', { class: 'ca-step-text', text: c.text }),
      ),
    );
    const layerOn = (/** @type {string} */ ly) => {
      const g = svg.querySelector(`[data-ly="${ly}"]`);
      if (!g) return;
      g.classList.add('is-on');
      if (!reduced())
        g.animate(
          [
            { transform: 'translateY(-46px)', opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          {
            duration: 380,
            easing: 'cubic-bezier(.3,.7,.4,1.3)',
          },
        );
    };
    const apply = (/** @type {string | undefined} */ key) => {
      if (key === 'filete') layerOn(fillets++ ? 'filete2' : 'filete');
      else if (key === 'jamon') {
        layerOn('jamon');
        if (!hasQueso) layerOn('queso');
      } else if (key === 'queso' || key === 'harina' || key === 'huevo' || key === 'pan-rallado') layerOn(key);
      else if (key === 'sarten') svg.classList.add('is-pan');
      else KFG.restart(svg, 'is-puff');
    };
    const place = (/** @type {number} */ k, /** @type {boolean} */ fixed) => {
      const b = btns[k];
      b.disabled = true;
      b.classList.add('is-set');
      if (fixed) b.classList.add('is-fixed');
      /** @type {HTMLElement} */ (b.querySelector('.ca-step-num')).textContent = String(next + 1);
      b.setAttribute('aria-label', `${next + 1}. ${cards[k].text}`);
      apply(cards[k].art);
      next++;
      missesHere = 0;
      stage.dataset.step = String(next);
      if (next >= n) return end();
      if (!fixed) hint.textContent = U('cookGood', { n: next, total: n });
    };
    const end = () => {
      done = true;
      svg.classList.add('is-done');
      if (svg.classList.contains('is-pan')) svg.classList.add('is-fried');
      btns.forEach((b, k) => {
        b.disabled = true;
        if (cards[k].i < 0) b.classList.add('is-no');
      });
      hint.textContent = U('cookDone');
      if (mistakes) {
        // The right order, as a list: steps first (numbered), the extra cards after them.
        const order = btns.map((_, k) => k).sort((a, b) => (cards[a].i < 0 ? 99 : cards[a].i) - (cards[b].i < 0 ? 99 : cards[b].i));
        grid.replaceChildren(...order.map((k) => btns[k]));
        grid.classList.add('is-sorted');
      }
      resolve(mistakes <= 1, mistakes === 0 ? {} : mistakes === 1 ? { soft: true } : { answer: steps.map((s) => s.text).join(' → ') });
    };
    const tap = (/** @type {number} */ k) => {
      if (done || answered()) return;
      const c = cards[k];
      const b = btns[k];
      if (!c || b.disabled) return;
      if (c.i === next) {
        place(k, false);
        return;
      }
      mistakes++;
      missesHere++;
      shake(b, stage);
      if (c.i < 0) {
        b.disabled = true;
        b.classList.add('is-no');
        hint.textContent = U('cookExtra', { item: c.text });
      } else hint.textContent = next === 0 ? U('cookFirst') : U('cookNotYet');
      if (missesHere >= 2) {
        // The second miss on one step: the right card goes in (amber).
        hint.textContent = U('cookShown', { item: steps[next].text });
        place(
          cards.findIndex((x) => x.i === next),
          true,
        );
      }
    };
    const grid = h('div', { class: 'ca-steps', lang }, btns);
    work.append(
      h('div', { class: 'ca-cook' }, stage, h('div', { class: 'ca-cook-side' }, grid, hint, kbdHint(U('kCook', { n: btns.length })))),
    );
    setKeys((e) => {
      const d = Number(e.key);
      if (d >= 1 && d <= btns.length) {
        tap(d - 1);
        return true;
      }
      return false;
    });
  };

  // ---------- wordsearch: sopa de letras ----------
  const WS_COLORS = ['#ffd86b', '#a8e0ff', '#c9f269', '#ffc2d9', '#d9c6ff', '#ffcf9e', '#b6f0d8', '#f3e48a'];
  /** Where a word runs in the grid: left → right in a row, or top → bottom in a column; null = not there. */
  const locate = (/** @type {string[][]} */ g, /** @type {string} */ w) => {
    const L = [...w];
    for (let r = 0; r < g.length; r++)
      for (let c = 0; c < g[r].length; c++) {
        if (L.every((ch, i) => g[r][c + i] === ch)) return { r, c, dir: 'h', len: L.length };
        if (L.every((ch, i) => g[r + i]?.[c] === ch)) return { r, c, dir: 'v', len: L.length };
      }
    return null;
  };
  /** @param {CAWordsearchTask} task */
  const wsGrid = (task) => (Array.isArray(task.rows) ? task.rows : []).map((r) => [...String(r).toUpperCase()]);

  /** @type {ExamRenderer<CAWordsearchTask>} */
  const wordsearch = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, lang } = ctx;
    const g = wsGrid(task);
    const R = g.length;
    const C = g[0]?.length || 0;
    const words = (Array.isArray(task.words) ? task.words : []).map((w) => String(w).toUpperCase());
    if (!R || !C || g.some((r) => r.length !== C) || !words.length || words.some((w) => !locate(g, w))) {
      console.warn('cultura-asturiana: a wordsearch with a word that is not in its grid', task);
      return ctx.fallback(task, work, [{ text: words[0] || '—', ok: true }]);
    }
    /** @type {Map<number, number>} word index → colour index */
    const found = new Map();
    let wrong = 0;
    /** @type {{ r: number, c: number } | null} */
    let anchor = null;
    let cur = { r: 0, c: 0 };
    const hint = mkHint();
    const cells = g.map((row, r) =>
      row.map((l, c) =>
        h('button', {
          type: 'button',
          class: 'ca-ws-cell',
          'data-r': String(r),
          'data-c': String(c),
          tabindex: r === 0 && c === 0 ? '0' : '-1',
          style: `grid-row:${r + 1};grid-column:${c + 1}`,
          'aria-label': U('wsCell', { r: r + 1, c: c + 1, l }),
          text: l,
        }),
      ),
    );
    const sel = h('span', { class: 'ca-ws-sel', hidden: true, 'aria-hidden': 'true' });
    const grid = h('div', { class: 'ca-ws-grid', style: `--c:${C};--r:${R}`, lang }, sel, cells.flat());
    const chips = words.map((w) =>
      h('li', { class: 'ca-ws-word', 'data-word': w }, h('span', { class: 'ca-ws-tick', 'aria-hidden': 'true' }), w),
    );
    const wordList = h('ul', { class: 'ca-ws-words', 'aria-label': U('wsWords'), lang }, chips);

    const cellAt = (/** @type {number} */ x, /** @type {number} */ y) => {
      const el = /** @type {HTMLElement | null} */ (document.elementFromPoint(x, y)?.closest('.ca-ws-cell'));
      return el && grid.contains(el) ? { r: Number(el.dataset.r), c: Number(el.dataset.c) } : null;
    };
    /** The cells from a to b on one row or one column, in reading order; null = not a straight line. */
    const lineOf = (/** @type {{ r: number, c: number }} */ a, /** @type {{ r: number, c: number }} */ b) => {
      if (a.r === b.r) {
        const [c0, c1] = a.c < b.c ? [a.c, b.c] : [b.c, a.c];
        return Array.from({ length: c1 - c0 + 1 }, (_, i) => ({ r: a.r, c: c0 + i }));
      }
      if (a.c === b.c) {
        const [r0, r1] = a.r < b.r ? [a.r, b.r] : [b.r, a.r];
        return Array.from({ length: r1 - r0 + 1 }, (_, i) => ({ r: r0 + i, c: a.c }));
      }
      return null;
    };
    const placeBar = (/** @type {HTMLElement} */ el, /** @type {{ r: number, c: number }[]} */ line) => {
      const a = line[0];
      const b = line[line.length - 1];
      el.style.gridRow = `${a.r + 1} / ${b.r + 2}`;
      el.style.gridColumn = `${a.c + 1} / ${b.c + 2}`;
    };
    let selN = 0;
    /** The live selection; `wrong` = a red flash that goes away by itself. */
    const showSel = (/** @type {{ r: number, c: number }[] | null} */ line, wrong = false) => {
      const n = ++selN;
      sel.hidden = !line;
      sel.classList.toggle('is-wrong', wrong);
      if (line) placeBar(sel, line);
      if (wrong) setTimeout(() => n === selN && showSel(null), 600);
    };
    const markAnchor = () => {
      for (const el of cells.flat()) el.classList.remove('is-anchor');
      if (anchor) cells[anchor.r][anchor.c].classList.add('is-anchor');
    };
    const clueNext = () => {
      for (const el of cells.flat()) el.classList.remove('is-clue');
      if (wrong < 3) return;
      const i = words.findIndex((_, k) => !found.has(k));
      const at = i >= 0 ? locate(g, words[i]) : null;
      if (!at) return;
      cells[at.r][at.c].classList.add('is-clue');
      hint.textContent = U('wsClue', { l: g[at.r][at.c] });
    };
    const finish = () => {
      for (const el of cells.flat()) {
        el.disabled = true;
        el.classList.remove('is-anchor', 'is-clue');
      }
      sel.hidden = true;
      if (document.activeElement instanceof HTMLElement && grid.contains(document.activeElement)) document.activeElement.blur();
      resolve(wrong <= 2, wrong === 0 ? {} : wrong <= 2 ? { soft: true } : { note: U('wsNote', { n: wrong }) });
    };
    const choose = (/** @type {{ r: number, c: number }} */ a, /** @type {{ r: number, c: number }} */ b) => {
      anchor = null;
      markAnchor();
      const line = lineOf(a, b);
      if (!line) {
        showSel(null);
        hint.textContent = U('wsLine');
        shake(grid);
        return;
      }
      const str = line.map((p) => g[p.r][p.c]).join('');
      const i = words.findIndex((w, k) => w === str && !found.has(k));
      if (i < 0) {
        if (words.includes(str)) hint.textContent = U('wsAgain');
        else {
          wrong++;
          hint.textContent = U('wsNo');
          showSel(line, true);
          shake(...line.map((p) => cells[p.r][p.c]));
          clueNext();
        }
        return;
      }
      const k = found.size % WS_COLORS.length;
      found.set(i, k);
      showSel(null);
      const bar = h('span', { class: 'ca-ws-bar', 'aria-hidden': 'true', style: `--wc:${WS_COLORS[k]}` });
      placeBar(bar, line);
      grid.prepend(bar);
      for (const p of line) cells[p.r][p.c].classList.add('is-found');
      chips[i].classList.add('is-found');
      chips[i].style.setProperty('--wc', WS_COLORS[k]);
      hint.textContent = U('wsFound', { w: words[i] });
      clueNext();
      if (found.size === words.length) finish();
    };
    const tapCell = (/** @type {number} */ r, /** @type {number} */ c) => {
      if (answered()) return;
      focusCell(r, c, false);
      if (!anchor) {
        anchor = { r, c };
        markAnchor();
        showSel([anchor]);
        hint.textContent = U('wsStart');
        return;
      }
      if (anchor.r === r && anchor.c === c) {
        anchor = null;
        markAnchor();
        showSel(null);
        hint.textContent = '';
        return;
      }
      choose(anchor, { r, c });
    };
    const focusCell = (/** @type {number} */ r, /** @type {number} */ c, move = true) => {
      cells[cur.r][cur.c].tabIndex = -1;
      cur = { r, c };
      cells[r][c].tabIndex = 0;
      if (move) cells[r][c].focus({ preventScroll: true });
    };

    // A tap (and Enter / Space on a focused cell) is a click on a cell: it marks the first / last letter. The click is the last event
    // of a tap, so the feedback sheet that may open under the finger gets no ghost click. A drag (pointer pressed on one cell and
    // released on another of its row / column, snapped to that line) selects on release; the click that may follow it is ignored.
    /** @type {{ id: number, a: { r: number, c: number }, b: { r: number, c: number } } | null} */
    let drag = null;
    let quietUntil = 0;
    const snap = (/** @type {{ r: number, c: number }} */ a, /** @type {{ r: number, c: number }} */ b) =>
      Math.abs(b.r - a.r) > Math.abs(b.c - a.c) ? { r: b.r, c: a.c } : { r: a.r, c: b.c };
    const move = (/** @type {PointerEvent} */ e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = cellAt(e.clientX, e.clientY);
      if (!p) return;
      const b = snap(drag.a, p);
      if (b.r === drag.b.r && b.c === drag.b.c) return;
      drag.b = b;
      anchor = null;
      markAnchor();
      showSel(b.r === drag.a.r && b.c === drag.a.c ? null : lineOf(drag.a, b));
    };
    const up = (/** @type {PointerEvent} */ e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { a, b } = drag;
      drag = null;
      removeEventListener('pointermove', move);
      removeEventListener('pointerup', up);
      removeEventListener('pointercancel', up);
      if (a.r === b.r && a.c === b.c) return; // a tap: its click marks the cell
      quietUntil = Date.now() + 400;
      if (e.type === 'pointercancel' || answered()) return showSel(null);
      focusCell(b.r, b.c, false);
      choose(a, b);
    };
    grid.addEventListener('pointerdown', (e) => {
      if (answered() || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const a = cellAt(e.clientX, e.clientY);
      if (!a) return;
      if (e.pointerType === 'mouse') e.preventDefault(); // no text selection, the focus stays where it is
      drag = { id: e.pointerId, a, b: a };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
      addEventListener('pointercancel', up);
    });
    grid.addEventListener('click', (e) => {
      const el = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest?.('.ca-ws-cell'));
      if (!el || Date.now() < quietUntil) return;
      tapCell(Number(el.dataset.r), Number(el.dataset.c));
    });

    work.append(
      h('div', { class: 'ca-ws', style: `--c:${C};--r:${R}` }, wordList, h('div', { class: 'ca-ws-main' }, grid, hint)),
      kbdHint(U('kWs')),
    );
    setKeys((e) => {
      const d = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      if (d) {
        const inGrid = document.activeElement instanceof HTMLElement && grid.contains(document.activeElement);
        if (!inGrid) focusCell(cur.r, cur.c);
        else focusCell(Math.min(R - 1, Math.max(0, cur.r + d[0])), Math.min(C - 1, Math.max(0, cur.c + d[1])));
        return true;
      }
      // Enter / Space without a focused cell (a focused one clicks itself): mark the cursor cell.
      if (e.key === 'Enter' || e.key === ' ') {
        tapCell(cur.r, cur.c);
        cells[cur.r][cur.c].focus({ preventScroll: true });
        return true;
      }
      return false;
    });
  };

  // ---------- clues: «¿Quién soy?» ----------
  /** @type {ExamRenderer<CACluesTask>} */
  const clues = (task, work, ctx) => {
    const { h, shuffle, resolve, setKeys, kbdHint, lang } = ctx;
    const texts = (Array.isArray(task.clues) ? task.clues : []).filter(Boolean);
    const options = Array.isArray(task.options) ? task.options : [];
    if (!texts.length || options.length < 2 || !(task.answer >= 0 && task.answer < options.length)) {
      return ctx.fallback(task, work, [{ text: options[task.answer] || options[0] || '—', ok: true }]);
    }
    // Picture options only when every key has a drawing (like the shared choice).
    const arts = task.pics ? options.map((k) => ctx.art?.art(k) || null) : [];
    const pics = !!task.pics && arts.every(Boolean);
    const nameOf = (/** @type {number} */ i) => (task.pics ? task.labels?.[i] || options[i] : options[i]);
    // Short text options (one or two words) stand two by two on phones.
    const short = !pics && options.every((_, i) => String(nameOf(i)).length <= 14);
    const order = shuffle(options.map((_, i) => i));
    let shown = 1;
    let done = false;
    const clueEls = texts.map((t, i) =>
      h(
        'li',
        { class: 'ca-clue', hidden: i > 0 },
        h('span', { class: 'ca-clue-n', 'aria-hidden': 'true', text: String(i + 1) }),
        h('span', { class: 'ca-clue-text', text: t }),
      ),
    );
    const left = h('span', { class: 'ca-clue-left' });
    const counter = h('p', { class: 'ca-clue-of', 'aria-live': 'polite' });
    const more = /** @type {HTMLButtonElement} */ (
      h(
        'button',
        { type: 'button', class: 'btn btn-light ca-more', onmousedown: keepFocus, onclick: () => next() },
        `💡 ${U('clueMore')} `,
        h('kbd', { text: 'P' }),
      )
    );
    const reveal = task.art ? pic(ctx, task.art, 'ca-clue-reveal') : null;
    const mystery = h(
      'div',
      { class: `ca-clue-card${reveal ? ' has-art' : ''}` },
      h('div', { class: 'ca-clue-mark', 'aria-hidden': 'true' }, reveal || null, h('span', { class: 'ca-clue-q', text: '?' })),
      h('p', { class: 'ca-clue-who', text: U('clueWho') }),
    );
    const draw = () => {
      clueEls.forEach((el, i) => {
        el.hidden = i >= shown;
      });
      counter.textContent = U('clueOf', { i: shown, n: texts.length });
      left.replaceChildren(...texts.slice(shown).map(() => h('span', { class: 'ca-clue-lock', 'aria-hidden': 'true', text: '?' })));
      more.disabled = done || shown >= texts.length;
    };
    const next = () => {
      if (done || shown >= texts.length) return;
      shown++;
      draw();
      KFG.restart(clueEls[shown - 1], 'is-new');
    };
    const buttons = order.map((i, k) =>
      pics
        ? h(
            'button',
            {
              type: 'button',
              class: 'choice pic ca-opt',
              'data-i': String(i),
              'data-key': options[i],
              'aria-label': nameOf(i),
              onclick: () => choose(k),
            },
            h('kbd', { text: String(k + 1) }),
            h('span', { class: 'pic-art' }, arts[i]),
            h('span', { class: 'ca-opt-name', text: nameOf(i) }),
          )
        : h(
            'button',
            { type: 'button', class: 'choice ca-opt', 'data-i': String(i), onclick: () => choose(k) },
            h('kbd', { text: String(k + 1) }),
            nameOf(i),
          ),
    );
    const choose = (/** @type {number} */ k) => {
      if (done) return;
      done = true;
      const ok = order[k] === task.answer;
      const used = shown;
      shown = texts.length;
      draw();
      clueEls.forEach((el, i) => el.classList.toggle('is-late', i >= used));
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (order[j] === task.answer) b.classList.add('right');
        else if (j !== k) b.classList.add('dim');
      });
      if (!ok) buttons[k].classList.add('wrong');
      mystery.classList.add('is-open');
      resolve(ok, ok ? { note: used === 1 ? U('clueOne') : U('clueN', { n: used }) } : { answer: nameOf(task.answer) });
    };
    draw();
    work.append(
      h(
        'div',
        { class: `ca-clues${pics ? ' has-pics' : ''}` },
        h(
          'div',
          { class: 'ca-clue-board' },
          mystery,
          h(
            'div',
            { class: 'ca-clue-col' },
            counter,
            h('ol', { class: 'ca-clue-list', lang }, clueEls, h('li', { class: 'ca-clue-rest' }, left)),
            more,
          ),
        ),
        h('div', { class: `choices ca-opts${pics ? ' pics' : ''}${short ? ' is-short' : ''}`, lang }, buttons),
      ),
      kbdHint(U('kClues', { n: buttons.length })),
    );
    setKeys((e) => {
      if (e.key.toLowerCase() === 'p' || e.code === 'KeyP') {
        next();
        return true;
      }
      const d = Number(e.key);
      if (d >= 1 && d <= buttons.length) {
        choose(d - 1);
        return true;
      }
      return false;
    });
  };

  // ---------- calendar: things into their months ----------
  const MONTHS = {
    enero: 'Enero',
    febrero: 'Febrero',
    marzo: 'Marzo',
    abril: 'Abril',
    mayo: 'Mayo',
    junio: 'Junio',
    julio: 'Julio',
    agosto: 'Agosto',
    septiembre: 'Septiembre',
    octubre: 'Octubre',
    noviembre: 'Noviembre',
    diciembre: 'Diciembre',
  };
  const MONTH_IDS = Object.keys(MONTHS);
  const SEASON = (/** @type {string} */ id) =>
    ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'][
      MONTH_IDS.indexOf(id)
    ];
  const KEYS = 'ABCDEFGHIJ';

  /** @type {ExamRenderer<CACalendarTask>} */
  const calendar = (task, work, ctx) => {
    const { h, shuffle, shake, hint: mkHint, kbdHint, draggable, resolve, answered, setKeys, lang } = ctx;
    const months = (Array.isArray(task.months) ? task.months : []).filter((m) => m in MONTHS);
    const all = (Array.isArray(task.items) ? task.items : []).filter((it) => it?.text && months.includes(it.month));
    if (months.length < 2 || !all.length) return ctx.fallback(task, work, [{ text: all[0]?.text || '—', ok: true }]);
    const items = shuffle(all).slice(0, KEYS.length);
    const placed = new Set();
    const tries = new Map();
    let mistakes = 0;
    let sel = 0;
    const hint = mkHint();
    const chips = items.map((it, i) => {
      const b = h(
        'button',
        { type: 'button', class: 'chip ca-cal-item', 'data-i': String(all.indexOf(it)), 'aria-pressed': 'false', onclick: () => select(i) },
        h('kbd', { text: KEYS[i] }),
        pic(ctx, it.art, 'ca-cal-pic'),
        h('span', { text: it.text }),
      );
      draggable(b, { onStart: () => select(i), targets: '.ca-month', onDrop: (t) => drop(Number(t.dataset.k)) });
      return b;
    });
    const lists = months.map(() => h('div', { class: 'ca-month-items' }));
    const pages = months.map((m, k) =>
      h(
        'button',
        { type: 'button', class: 'ca-month', 'data-k': String(k), 'data-month': m, 'data-season': SEASON(m), onclick: () => drop(k) },
        h('span', { class: 'ca-rings', 'aria-hidden': 'true' }),
        h('span', { class: 'ca-month-head' }, h('b', { text: MONTHS[m] }), h('kbd', { text: String(k + 1) })),
        task.astur?.[m] && h('span', { class: 'ca-month-astur', lang: 'ast', text: task.astur[m] }),
        lists[k],
      ),
    );
    const remaining = () => items.map((_, i) => i).filter((i) => !placed.has(i));
    const select = (/** @type {number} */ i) => {
      if (placed.has(i) || answered()) return;
      sel = i;
      chips.forEach((c, j) => c.setAttribute('aria-pressed', String(j === i)));
    };
    const put = (/** @type {number} */ i, /** @type {number} */ k, /** @type {boolean} */ fixed) => {
      placed.add(i);
      chips[i].remove();
      lists[k].append(h('span', { class: `ca-month-tag${fixed ? ' is-fixed' : ''}` }, pic(ctx, items[i].art, 'ca-tag-pic'), items[i].text));
      KFG.restart(pages[k], 'is-flash');
      const rest = remaining();
      if (!rest.length) {
        pages.forEach((p) => {
          p.disabled = true;
        });
        resolve(mistakes <= 1, mistakes === 1 ? { soft: true } : {});
        return;
      }
      select(rest[0]);
    };
    const drop = (/** @type {number} */ k) => {
      if (answered() || !months[k]) return;
      if (!remaining().includes(sel)) {
        hint.textContent = U('calPick');
        return;
      }
      const it = items[sel];
      if (it.month === months[k]) {
        hint.textContent = '';
        put(sel, k, false);
        return;
      }
      mistakes++;
      const t = (tries.get(sel) || 0) + 1;
      tries.set(sel, t);
      shake(chips[sel], pages[k]);
      if (t >= 2) {
        const right = months.indexOf(it.month);
        hint.textContent = U('calGoes', { item: it.text, month: MONTHS[it.month].toLowerCase() });
        put(sel, right, true);
      } else hint.textContent = U('calTry');
    };
    select(0);
    work.append(
      h(
        'div',
        { class: 'ca-cal' },
        h('div', { class: 'tray ca-cal-tray', lang }, chips),
        hint,
        h('div', { class: 'ca-months', style: `--n:${months.length}`, lang }, pages),
      ),
      kbdHint(U('kCal', { n: months.length, l: KEYS[items.length - 1] })),
    );
    setKeys((e) => {
      const d = Number(e.key);
      if (d >= 1 && d <= months.length) {
        drop(d - 1);
        return true;
      }
      const l = e.key.length === 1 ? KEYS.indexOf(e.key.toUpperCase()) : -1;
      if (l >= 0 && l < items.length) {
        select(l);
        return true;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const rest = remaining();
        if (!rest.length) return true;
        const at = Math.max(0, rest.indexOf(sel));
        const dir = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        select(rest[(at + dir + rest.length) % rest.length]);
        chips[sel].focus({ preventScroll: true });
        return true;
      }
      return false;
    });
  };

  // ---------- cascayu: true / false on a hopscotch ----------
  /** @type {ExamRenderer<CACascayuTask>} */
  const cascayu = (task, work, ctx) => {
    const { h, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys, lang } = ctx;
    const steps = (Array.isArray(task.steps) ? task.steps : []).filter((s) => s?.text && typeof s.truth === 'boolean');
    const b = steps.length ? ctx.art?.board?.(steps.length) : null;
    if (!b) {
      return ctx.fallback(task, work, [
        { text: U('hopTrue'), ok: steps[0]?.truth !== false },
        { text: U('hopFalse'), ok: steps[0]?.truth === false },
      ]);
    }
    const n = steps.length;
    let k = 0;
    let rights = 0;
    let waiting = false;
    const hint = mkHint();
    const svg = b.el;
    const stone = /** @type {SVGGElement} */ (svg.querySelector('.ca-stone'));
    const sqs = /** @type {SVGGElement[]} */ ([...svg.querySelectorAll('.ca-sq')]).sort(
      (x, y) => Number(x.dataset.n) - Number(y.dataset.n),
    );
    let pos = { ...b.start };
    const moveTo = (/** @type {{ x: number, y: number }} */ p) => {
      const from = pos;
      pos = { ...p };
      stone.style.transform = `translate(${p.x}px, ${p.y}px)`;
      if (reduced()) return;
      stone.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px)` },
          { transform: `translate(${(from.x + p.x) / 2}px, ${Math.min(from.y, p.y) - 34}px) scale(1.18)`, offset: 0.5 },
          { transform: `translate(${p.x}px, ${p.y}px)` },
        ],
        { duration: 520, easing: 'ease-in-out' },
      );
    };
    stone.style.transform = `translate(${pos.x}px, ${pos.y}px)`;

    const count = h('p', { class: 'ca-hop-of' });
    const text = h('p', { class: 'ca-hop-text', lang });
    const mk = (/** @type {boolean} */ val) =>
      h(
        'button',
        {
          type: 'button',
          class: `choice ca-hop-ans ${val ? 'is-true' : 'is-false'}`,
          'data-truth': String(val),
          onmousedown: keepFocus,
          onclick: () => answer(val),
        },
        h('kbd', { text: val ? 'V' : 'F' }),
        h('b', { 'aria-hidden': 'true', text: val ? '✓' : '✗' }),
        val ? U('hopTrue') : U('hopFalse'),
      );
    const yes = mk(true);
    const no = mk(false);
    const oopsText = h('p', { class: 'ca-hop-oops-text' });
    const goOn = h('button', { type: 'button', class: 'btn btn-dark ca-hop-next', onclick: () => cont() }, U('hopOn'));
    const oops = h('div', { class: 'ca-hop-oops', hidden: true, role: 'status' }, oopsText, goOn);
    const root = h(
      'div',
      { class: 'ca-hop', 'data-step': '0' },
      h('div', { class: 'ca-hop-board', style: `--ar:${b.size[0] / b.size[1]}` }, svg),
      h(
        'div',
        { class: 'ca-hop-side' },
        h('div', { class: 'ca-hop-card' }, count, text),
        h('div', { class: 'choices tf ca-hop-btns' }, yes, no),
        oops,
        hint,
      ),
    );
    const show = () => {
      root.dataset.step = String(k);
      count.textContent = U('hopOf', { i: k + 1, n });
      text.textContent = steps[k].text;
      sqs.forEach((s, i) => s.classList.toggle('is-now', i === k));
      yes.disabled = false;
      no.disabled = false;
      KFG.restart(text, 'is-new');
    };
    const end = () => {
      yes.disabled = true;
      no.disabled = true;
      sqs.forEach((s) => s.classList.remove('is-now'));
      const all = rights === n;
      if (all) {
        moveTo(b.goal);
        svg.classList.add('is-won');
        hint.textContent = U('hopEnd');
      }
      root.classList.add('is-done');
      resolve(all, all ? {} : { note: U('hopNote', { n: rights, total: n }) });
    };
    const answer = (/** @type {boolean} */ val) => {
      if (waiting || answered() || k >= n) return;
      const st = steps[k];
      const ok = val === st.truth;
      yes.disabled = true;
      no.disabled = true;
      const c = b.centers[k];
      if (ok) {
        rights++;
        sqs[k].classList.add('is-ok');
        moveTo(c);
        hint.textContent = U('hopNice');
        k++;
        if (k >= n) return end();
        show();
        return;
      }
      // On the line: the stone lands on the square's bottom edge; the right answer shows, then «Seguir».
      sqs[k].classList.add('is-oops');
      moveTo({ x: c.x, y: c.y + 30 });
      shake(sqs[k]);
      hint.textContent = '';
      oopsText.replaceChildren(h('b', { text: U('hopOops') }), ' ', st.truth ? U('hopWasTrue') : U('hopWasFalse'));
      (st.truth ? yes : no).classList.add('right');
      (val ? yes : no).classList.add('wrong');
      k++;
      if (k >= n) {
        oops.hidden = false;
        goOn.hidden = true;
        return end();
      }
      waiting = true;
      oops.hidden = false;
      goOn.focus({ preventScroll: true });
    };
    const cont = () => {
      if (!waiting || answered()) return;
      waiting = false;
      oops.hidden = true;
      yes.classList.remove('right', 'wrong');
      no.classList.remove('right', 'wrong');
      show();
    };
    show();
    work.append(root, kbdHint(U('kHop')));
    setKeys((e) => {
      const key = e.key.toLowerCase();
      if (waiting) {
        if (key === 'enter' || key === ' ' || key === 'arrowright') {
          cont();
          return true;
        }
        return false;
      }
      if (key === 'v' || key === 'arrowleft' || key === '1') answer(true);
      else if (key === 'f' || key === 'm' || key === 'arrowright' || key === '2') answer(false);
      else return false;
      return true;
    });
  };

  // ---------- content check (unit tests) ----------
  /**
   * Errors in the tasks of the six own types (the engine's validate skips them). [] = fine.
   * @param {ExamUnit} unit
   * @param {ExamArt} [art] when given, every art key and feed target must have a drawing
   * @returns {string[]}
   */
  const check = (unit, art) => {
    /** @type {string[]} */
    const errs = [];
    const txt = (/** @type {any} */ x) => typeof x === 'string' && x.trim() !== '';
    const hasArt = (/** @type {string | undefined} */ k) => !k || !art || art.has(k);
    for (const s of unit?.stations || [])
      s.tasks.forEach((/** @type {any} */ t, ti) => {
        const w = `station ${s.id} task ${ti + 1} (${t.type})`;
        const err = (/** @type {string} */ m) => errs.push(`${w}: ${m}`);
        const items = Array.isArray(t.items) ? t.items : [];
        switch (t.type) {
          case 'feed':
            if (!['gochu', 'vaca', 'cesta', 'fardo', 'bolsa', 'tripa'].includes(t.who)) err(`who «${t.who}» has no drawing`);
            if (items.length < 4 || items.length > 9) err('items must be 4–9');
            if (!items.some((it) => it.ok) || items.every((it) => it.ok)) err('items need ok and not-ok ones');
            if (!items.every((it) => txt(it.text))) err('every item needs a text');
            if (new Set(items.map((it) => it.text)).size !== items.length) err('item texts must be unique');
            for (const it of items) if (!hasArt(it.art)) err(`no art «${it.art}»`);
            break;
          case 'cook': {
            const steps = Array.isArray(t.steps) ? t.steps : [];
            const extra = Array.isArray(t.extra) ? t.extra : [];
            if (t.dish !== 'cachopo') err(`dish «${t.dish}» has no drawing`);
            if (steps.length < 3 || steps.length + extra.length > 9) err('steps must be 3+, steps + extra ≤ 9');
            if (![...steps, ...extra].every((x) => txt(x?.text))) err('every step needs a text');
            if (new Set([...steps, ...extra].map((x) => x?.text)).size !== steps.length + extra.length) err('step texts must be unique');
            for (const x of [...steps, ...extra]) if (!hasArt(x?.art)) err(`no art «${x.art}»`);
            break;
          }
          case 'wordsearch': {
            const g = wsGrid(t);
            if (g.length < 2 || g.length > 8) err('rows must be 2–8');
            if (!g.length || g.some((r) => r.length !== g[0].length) || g[0].length > 10) err('rows must have the same length, ≤ 10');
            if (!(t.rows || []).every((r) => /^[A-ZÑ]+$/.test(r))) err('rows: UPPERCASE letters A–Z and Ñ only');
            const words = Array.isArray(t.words) ? t.words : [];
            if (!words.length) err('words missing');
            for (const wd of words) if (!locate(g, String(wd).toUpperCase())) err(`«${wd}» is not in the grid (→ or ↓)`);
            break;
          }
          case 'clues':
            if (!Array.isArray(t.clues) || t.clues.length < 2 || t.clues.length > 4 || !t.clues.every(txt)) err('clues must be 2–4 texts');
            if (!Array.isArray(t.options) || t.options.length < 2 || t.options.length > 4) err('options must be 2–4');
            else if (!(Number.isInteger(t.answer) && t.answer >= 0 && t.answer < t.options.length))
              err('answer is not an index of options');
            if (t.pics) {
              if (!Array.isArray(t.labels) || t.labels.length !== t.options?.length) err('pics need one label per option');
              for (const k of t.options || []) if (!hasArt(k)) err(`no art «${k}»`);
            }
            if (!hasArt(t.art)) err(`no art «${t.art}»`);
            break;
          case 'calendar': {
            const months = Array.isArray(t.months) ? t.months : [];
            if (months.length < 2 || months.length > 6) err('months must be 2–6');
            for (const m of months) if (!(m in MONTHS)) err(`month «${m}» is not one of enero…diciembre`);
            if (items.length < 2 || items.length > KEYS.length) err(`items must be 2–${KEYS.length}`);
            for (const it of items) {
              if (!txt(it.text)) err('every item needs a text');
              if (!months.includes(it.month)) err(`item «${it.text}»: month «${it.month}» is not on the board`);
              if (!hasArt(it.art)) err(`no art «${it.art}»`);
            }
            break;
          }
          case 'cascayu': {
            const steps = Array.isArray(t.steps) ? t.steps : [];
            if (steps.length < 3 || steps.length > 5) err('steps must be 3–5');
            if (!steps.every((st) => txt(st?.text) && typeof st.truth === 'boolean')) err('every step needs a text and truth');
            break;
          }
        }
      });
    return errs;
  };

  window.CA_TYPES = { feed, cook, wordsearch, clues, calendar, cascayu };
  window.CA_CHECK = check;
})();
