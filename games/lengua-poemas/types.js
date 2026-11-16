// Renderers of the task types only «La liga de las palabras» has:
//   window.LP_TYPES = { forge, save, substitute } → KFExam.mount(..., { types })
//   window.LP_CHECK(unit, art?) → string[]   content errors of these three types (empty = fine), for the unit tests
// The unit also reuses «fix» from games/lengua-mundo/types.js (window.LE_TYPES.fix). Data shapes: types/lengua-poemas.d.ts.
// No DOM at load time (the unit tests load this file in a vm with only KF.i18n).
// @ts-check
'use strict';

(() => {
  // Texts: Spanish on both sites, like the engine's (exam units are taught in Spanish).
  const S = {
    check: 'Comprobar ✓',
    erase: '⌫ Borrar',
    stems: 'Raíz',
    sufs: 'Terminación',
    kForge: ({ l, n }) => `Teclado: A–${l} para la raíz, 1–${n} para la terminación, ⌫ borra, Enter comprueba`,
    forgeNeed: 'Elige una raíz y una terminación.',
    forgeGreen: 'Lo verde está bien. Cambia lo otro.',
    forgeAgain: 'Esa palabra no existe. ¡Prueba otra vez!',
    forgeDone: ({ w }) => `¡Camiseta lista: ${w}!`,
    forgeSum: ({ a, b, w }) => `${a} + ${b} = ${w}`,
    shirt: ({ w }) => `En la camiseta: ${w}`,
    shirtEmpty: 'La camiseta está sin nombre',
    kSave: ({ n }) => `Teclado: B o V la letra · ← → el hueco · 1–\u2060${n} el porqué · ⌫ borra · Enter comprueba`,
    why: '¿Por qué?',
    gap: ({ i, n }) => `Hueco ${i} de ${n}`,
    gapFull: ({ i, n, l }) => `Hueco ${i} de ${n}: ${l}`,
    saveNeedLetters: 'Pon b o v en cada hueco.',
    saveNeedReason: 'Elige por qué se escribe así.',
    savePost: '¡Al palo! Lo verde está bien. Prueba otra vez.',
    savePostNone: '¡Al palo! Prueba otra vez.',
    saveSaved: '¡Paradón! 🧤',
    saveGoal: 'Esta vez entró. Mira cómo se escribe.',
    rule: ({ r }) => `Regla: ${r}.`,
    kSub: ({ n }) => `Teclado: ← → o Espacio elige el trozo, 1–${n} el pronombre, Enter comprueba`,
    subOut: 'Sale',
    subIn: 'Entra',
    subNeedChunk: 'Toca primero el trozo que sale.',
    subNeedPron: 'Ahora elige el pronombre que entra.',
    subGreen: 'Lo verde está bien. Cambia lo otro.',
    subAgain: 'Ese cambio no vale. ¡Prueba otra vez!',
    subDone: '¡Cambio hecho!',
    sentence: 'Frase',
  };
  const U = KF.i18n({ uk: S, es: S });

  /** The reasons of the save task: rule id → its label. */
  const RULES = {
    aba: 'Terminación -aba, -abas, -ábamos, -abais, -aban',
    bir: 'Verbos en -bir',
    exc: 'Excepción: hervir, servir, vivir',
    brbl: 'B antes de r o l (br, bl)',
    memo: 'Se aprende de memoria',
  };
  /** A rule label with every «-aba»-like ending kept on one line. */
  const ruleLabel = (/** @type {ExamRendererCtx['h']} */ h, /** @type {string} */ r) =>
    String(RULES[r] || r)
      .split(/(-\p{L}+)/u)
      .filter(Boolean)
      .map((part) => (part.startsWith('-') ? h('span', { class: 'lp-nb', text: part }) : part));
  const STEM_KEYS = 'ABC';
  const CYRILLIC = /[Ѐ-ӿ]/;

  // A tap on a control must not move the focus onto it: Enter would then click it again instead of checking / the engine's «next».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();
  /** Enter on a focused tile of the task checks (its own click would press the tile again); once answered it is the engine's. */
  const enterChecks = (/** @type {HTMLElement} */ root, /** @type {() => void} */ check, /** @type {() => boolean} */ answered) =>
    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey || answered()) return;
      const t = /** @type {HTMLElement} */ (e.target);
      if (t.closest?.('.lp-check')) return;
      e.preventDefault();
      check();
    });
  /** The font size that fits `len` letters into `width` viewBox units (bold rounded sans: ~0.58 em a letter). */
  const fit = (/** @type {number} */ len, /** @type {number} */ width, /** @type {number} */ max) =>
    String(Math.round(Math.min(max, width / Math.max(1, len * 0.58))));
  const strip = (/** @type {string} */ s) => String(s).trim().replace(/\.$/, '');

  // ---------- forge: «La fábrica de camisetas» — a stem + a suffix pressed on a shirt ----------
  /** @type {ExamRenderer<LPForgeTask>} */
  const forge = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys, lang } = ctx;
    const stems = (Array.isArray(task.stems) ? task.stems : []).filter(Boolean).slice(0, STEM_KEYS.length);
    const sufs = (Array.isArray(task.suffixes) ? task.suffixes : []).filter(Boolean).slice(0, 4);
    const [rs, rx] = Array.isArray(task.answer) ? task.answer : [];
    if (!stems.includes(rs) || !sufs.includes(rx) || !task.word) {
      // Broken data: a plain choice of the words the pieces make.
      const words = [...new Set(stems.flatMap((s) => sufs.map((x) => s + x)))];
      return ctx.fallback(task, work, [
        { text: task.word || words[0] || '—', ok: true },
        ...words.filter((w) => w !== task.word).map((w) => ({ text: w, ok: false })),
      ]);
    }
    const stemOrder = shuffle(stems);
    const sufOrder = shuffle(sufs);
    /** @type {string | null} */
    let stem = null;
    /** @type {string | null} */
    let suf = null;
    let stemLock = false;
    let sufLock = false;
    /** @type {('stem' | 'suf')[]} */
    const placed = [];
    let tries = 0;
    let done = false;
    const hint = mkHint();

    const svg = ctx.art?.press?.() || null;
    const nameEl = svg?.querySelector('.lp-name') || null;
    const nameStem = svg?.querySelector('.lp-name-stem') || null;
    const nameSuf = svg?.querySelector('.lp-name-suf') || null;
    // Without the drawing the word goes on a plain plate.
    const plate = svg ? null : h('p', { class: 'lp-plate' }, h('span', { class: 'lp-name-stem' }), h('span', { class: 'lp-name-suf' }));
    const stage = h('div', { class: 'lp-press', role: 'img', lang }, svg || plate);
    const longest = Math.max(...stems.map((s) => s.length)) + Math.max(...sufs.map((x) => x.length));

    const tile = (/** @type {'stem' | 'suf'} */ kind, /** @type {string} */ v, /** @type {number} */ k) =>
      h(
        'button',
        {
          type: 'button',
          class: `lp-tile lp-${kind}`,
          [`data-${kind}`]: v,
          'aria-pressed': 'false',
          onmousedown: keepFocus,
          onclick: () => choose(kind, v),
        },
        h('kbd', { text: kind === 'stem' ? STEM_KEYS[k] : String(k + 1) }),
        h('span', { class: 'lp-tile-text', text: kind === 'stem' ? `${v}-` : `-${v}` }),
      );
    const stemEls = stemOrder.map((v, k) => tile('stem', v, k));
    const sufEls = sufOrder.map((v, k) => tile('suf', v, k));
    const eraseBtn = h(
      'button',
      { type: 'button', class: 'btn btn-light lp-erase', onmousedown: keepFocus, onclick: () => erase() },
      U('erase'),
    );
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark lp-check', onclick: () => check() }, U('check'));
    const actions = h('div', { class: 'lp-actions' }, eraseBtn, checkBtn);

    const draw = () => {
      const st = stem ?? '';
      const sx = suf ?? '';
      if (svg) {
        if (nameStem) nameStem.textContent = stem ?? '···';
        if (nameSuf) nameSuf.textContent = suf ?? (stem ? '···' : '');
        nameEl?.setAttribute('font-size', fit(Math.max(longest, 6), 150, 34));
      } else if (plate) {
        /** @type {HTMLElement} */ (plate.firstChild).textContent = stem ?? '···';
        /** @type {HTMLElement} */ (plate.lastChild).textContent = suf ?? '···';
      }
      stage.classList.toggle('has-stem', !!stem);
      stage.classList.toggle('has-suf', !!suf);
      stage.setAttribute('aria-label', st || sx ? U('shirt', { w: st + sx }) : U('shirtEmpty'));
      stemEls.forEach((b, k) => b.setAttribute('aria-pressed', String(stemOrder[k] === stem)));
      sufEls.forEach((b, k) => b.setAttribute('aria-pressed', String(sufOrder[k] === suf)));
      eraseBtn.disabled = done || (!(stem && !stemLock) && !(suf && !sufLock));
    };
    const choose = (/** @type {'stem' | 'suf'} */ kind, /** @type {string} */ v) => {
      if (done || answered()) return;
      const els = kind === 'stem' ? stemEls : sufEls;
      const order = kind === 'stem' ? stemOrder : sufOrder;
      const b = els[order.indexOf(v)];
      if (!b || b.disabled) return;
      if ((kind === 'stem' && stemLock) || (kind === 'suf' && sufLock)) return shake(b);
      if (kind === 'stem') stem = v;
      else suf = v;
      const i = placed.indexOf(kind);
      if (i >= 0) placed.splice(i, 1);
      placed.push(kind);
      hint.textContent = '';
      draw();
    };
    const erase = () => {
      if (done || answered()) return;
      for (let i = placed.length - 1; i >= 0; i--) {
        const kind = placed[i];
        if ((kind === 'stem' && stemLock) || (kind === 'suf' && sufLock)) continue;
        placed.splice(i, 1);
        if (kind === 'stem') stem = null;
        else suf = null;
        break;
      }
      draw();
    };
    const lockRight = () => {
      for (const [els, order, v, kind] of /** @type {const} */ ([
        [stemEls, stemOrder, rs, 'stem'],
        [sufEls, sufOrder, rx, 'suf'],
      ])) {
        const picked = kind === 'stem' ? stem : suf;
        els.forEach((b, k) => {
          if (order[k] === v && picked === v) b.classList.add('is-right');
        });
      }
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      const missed = !ok;
      stem = rs;
      suf = rx;
      draw();
      for (const b of [...stemEls, ...sufEls]) {
        b.disabled = true;
        const v = b.dataset.stem ?? b.dataset.suf;
        const right = (b.dataset.stem !== undefined && v === rs) || (b.dataset.suf !== undefined && v === rx);
        if (right) b.classList.add(missed && !b.classList.contains('is-right') ? 'is-fixed' : 'is-right');
      }
      actions.remove();
      root.classList.add('is-done');
      stage.classList.add('is-printed');
      if (missed) stage.classList.add('is-fixed');
      if (!reduced()) KFG.restart(stage, 'is-press');
      hint.textContent = ok ? U('forgeDone', { w: task.word }) : '';
      const sum = U('forgeSum', { a: `${rs}-`, b: `-${rx}`, w: task.word });
      resolve(ok, ok ? { soft: tries > 1 } : { answer: task.word, note: sum });
    };
    const check = () => {
      if (done || answered()) return;
      if (!stem || !suf) {
        hint.textContent = U('forgeNeed');
        shake(stage);
        return;
      }
      tries++;
      if (stem === rs && suf === rx) return finish(true);
      if (tries >= 2) return finish(false);
      // One more try: the right piece stays (green, locked), the wrong one goes back and its tile is crossed out.
      lockRight();
      stemLock = stem === rs;
      sufLock = suf === rx;
      if (!stemLock) {
        stemEls[stemOrder.indexOf(stem)].classList.add('is-wrong');
        stemEls[stemOrder.indexOf(stem)].disabled = true;
        stem = null;
      }
      if (!sufLock) {
        sufEls[sufOrder.indexOf(suf)].classList.add('is-wrong');
        sufEls[sufOrder.indexOf(suf)].disabled = true;
        suf = null;
      }
      placed.splice(0, placed.length, .../** @type {('stem' | 'suf')[]} */ ([stemLock && 'stem', sufLock && 'suf'].filter(Boolean)));
      hint.textContent = stemLock || sufLock ? U('forgeGreen') : U('forgeAgain');
      shake(stage);
      draw();
    };

    const root = h(
      'div',
      { class: 'lp-forge' },
      stage,
      h(
        'div',
        { class: 'lp-forge-side' },
        h(
          'div',
          { class: 'lp-row' },
          h('p', { class: 'lp-row-label', text: U('stems') }),
          h('div', { class: 'lp-tiles lp-stems', lang }, stemEls),
        ),
        h(
          'div',
          { class: 'lp-row' },
          h('p', { class: 'lp-row-label', text: U('sufs') }),
          h('div', { class: 'lp-tiles lp-sufs', lang }, sufEls),
        ),
        hint,
        actions,
        kbdHint(U('kForge', { l: STEM_KEYS[stemEls.length - 1], n: sufEls.length })),
      ),
    );
    enterChecks(root, check, answered);
    draw();
    work.append(root);
    setKeys((e) => {
      if (e.key === 'Enter') {
        check();
        return true;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        erase();
        return true;
      }
      const d = Number(e.key);
      if (d >= 1 && d <= sufOrder.length) {
        choose('suf', sufOrder[d - 1]);
        return true;
      }
      const l = e.key.length === 1 ? STEM_KEYS.indexOf(e.key.toUpperCase()) : -1;
      if (l >= 0 && l < stemOrder.length) {
        choose('stem', stemOrder[l]);
        return true;
      }
      return false;
    });
  };

  // ---------- save: B or V — the keeper saves the right letter (and its reason) ----------
  /** @type {ExamRenderer<LPSaveTask>} */
  const save = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys, lang } = ctx;
    const word = String(task.word || '');
    const gaps = (Array.isArray(task.gaps) ? task.gaps : []).filter((i) => /[bv]/.test(word[i] || '')).sort((a, b) => a - b);
    const reasons = (Array.isArray(task.reasons) ? task.reasons : []).filter((r) => r in RULES).slice(0, 3);
    if (!gaps.length || !reasons.includes(task.rule)) {
      const swap = [...word].map((c, i) => (gaps.includes(i) ? (c === 'b' ? 'v' : 'b') : c)).join('');
      return ctx.fallback(task, work, [
        { text: word || '—', ok: true },
        { text: swap === word ? `${word}?` : swap, ok: false },
      ]);
    }
    const n = gaps.length;
    /** @type {(string | null)[]} */
    const vals = gaps.map(() => null);
    const lock = gaps.map(() => false);
    const reasonOrder = /** @type {string[]} */ (shuffle(reasons));
    /** @type {string | null} */
    let reason = null;
    let reasonLock = false;
    let cur = 0;
    let tries = 0;
    let done = false;
    const hint = mkHint();

    const svg = ctx.art?.goal?.() || null;
    const goalBox = svg ? h('div', { class: 'lp-goal', 'data-pose': 'ready', 'aria-hidden': 'true' }, svg) : null;
    const keeper = /** @type {SVGGElement | null} */ (svg?.querySelector('.lp-keeper') || null);
    const ballEl = /** @type {SVGGElement | null} */ (svg?.querySelector('.lp-ball') || null);

    const gapEls = gaps.map((gi, k) =>
      h('button', {
        type: 'button',
        class: 'lp-gap',
        'data-i': String(gi),
        'aria-pressed': 'false',
        onmousedown: keepFocus,
        onclick: () => focusGap(k),
      }),
    );
    const letters = [...word].map((c, i) => {
      const k = gaps.indexOf(i);
      return k >= 0 ? gapEls[k] : h('span', { class: 'lp-ch', text: c });
    });
    const [before, after] = Array.isArray(task.ctx) ? task.ctx : ['', ''];
    const sentence = h(
      'p',
      { class: 'lp-sentence', lang },
      before && h('span', { class: 'lp-ctx', text: before }),
      h('span', { class: 'lp-word' }, letters),
      after && h('span', { class: 'lp-ctx', text: after }),
    );
    const letterBtn = (/** @type {'b' | 'v'} */ l) =>
      h(
        'button',
        { type: 'button', class: 'lp-letter', 'data-letter': l, onmousedown: keepFocus, onclick: () => put(l) },
        h('kbd', { text: l.toUpperCase() }),
        h('span', { text: l }),
      );
    const bv = h('div', { class: 'lp-bv' }, letterBtn('b'), letterBtn('v'));
    const reasonEls = reasonOrder.map((r, k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'lp-reason',
          'data-rule': r,
          'aria-pressed': 'false',
          onmousedown: keepFocus,
          onclick: () => pickReason(r),
        },
        h('kbd', { text: String(k + 1) }),
        h('span', {}, ruleLabel(h, r)),
      ),
    );
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark lp-check', onclick: () => check() }, U('check'));

    const draw = () => {
      gapEls.forEach((b, k) => {
        b.textContent = vals[k] ?? '';
        b.dataset.val = vals[k] ?? '';
        b.setAttribute('aria-pressed', String(!done && k === cur));
        b.setAttribute('aria-label', vals[k] ? U('gapFull', { i: k + 1, n, l: vals[k] }) : U('gap', { i: k + 1, n }));
      });
      reasonEls.forEach((b, k) => b.setAttribute('aria-pressed', String(reasonOrder[k] === reason)));
    };
    const open = () => gaps.map((_, k) => k).filter((k) => !lock[k]);
    const focusGap = (/** @type {number} */ k) => {
      if (done || answered() || lock[k]) return;
      cur = k;
      draw();
    };
    const put = (/** @type {'b' | 'v'} */ l) => {
      if (done || answered()) return;
      if (lock[cur]) {
        const free = open();
        if (!free.length) return;
        cur = free[0];
      }
      vals[cur] = l;
      gapEls[cur].classList.remove('is-wrong');
      // On to the next open gap that is still empty (else the next open one).
      const free = open();
      const nextEmpty = free.find((k) => k > cur && !vals[k]) ?? free.find((k) => !vals[k]);
      if (nextEmpty !== undefined) cur = nextEmpty;
      hint.textContent = '';
      draw();
    };
    const move = (/** @type {number} */ d) => {
      const free = open();
      if (!free.length) return;
      const at = free.indexOf(cur);
      cur = free[(at < 0 ? 0 : at + d + free.length) % free.length];
      draw();
    };
    const back = () => {
      if (done || answered()) return;
      if (!lock[cur] && vals[cur]) vals[cur] = null;
      else {
        const prev = open()
          .filter((k) => k < cur && vals[k])
          .pop();
        if (prev === undefined) return;
        cur = prev;
        vals[prev] = null;
      }
      draw();
    };
    const pickReason = (/** @type {string} */ r) => {
      if (done || answered()) return;
      const b = reasonEls[reasonOrder.indexOf(r)];
      if (!b || b.disabled) return;
      if (reasonLock) return shake(b);
      reason = r;
      hint.textContent = '';
      draw();
    };
    /** The ball's way to the pose: an arc; the CSS of [data-pose] holds the end. */
    const kick = (/** @type {'save' | 'goal' | 'post'} */ pose) => {
      if (!goalBox || !ballEl || !keeper) return;
      if (pose !== 'post') goalBox.dataset.pose = pose;
      if (reduced()) return;
      const ends = {
        save: { ball: [78, -86, 0.8], keeper: 'translate(34px, -8px) rotate(52deg)' },
        goal: { ball: [76, -116, 0.62], keeper: 'translate(-34px, -8px) rotate(-52deg)' },
        post: { ball: [100, -82, 0.72], keeper: 'translate(-10px, 0) rotate(-8deg)' },
      };
      const e = ends[pose];
      const [x, y, s] = e.ball;
      const end = `translate(${x}px, ${y}px) scale(${s}) rotate(320deg)`;
      const mid = `translate(${x / 2}px, ${y / 2 - 34}px) scale(${(1 + s) / 2}) rotate(160deg)`;
      if (pose === 'post') {
        // Off the post and back out to the front.
        ballEl.animate(
          [
            { transform: 'none' },
            { transform: mid, offset: 0.3 },
            { transform: end, offset: 0.5 },
            { transform: 'translate(130px, -10px) scale(.9) rotate(420deg)', offset: 0.75 },
            { transform: 'none', opacity: 0, offset: 0.9 },
            { transform: 'none', opacity: 1 },
          ],
          { duration: 1100, easing: 'ease-out' },
        );
        keeper.animate([{ transform: 'none' }, { transform: e.keeper, offset: 0.4 }, { transform: 'none' }], {
          duration: 700,
          easing: 'ease-in-out',
        });
        return;
      }
      ballEl.animate([{ transform: 'none' }, { transform: mid, offset: 0.5 }, { transform: end }], {
        duration: 620,
        easing: 'cubic-bezier(.3,.1,.4,1)',
      });
      keeper.animate([{ transform: 'none' }, { transform: e.keeper }], {
        duration: 440,
        delay: 140,
        easing: 'cubic-bezier(.3,.7,.4,1)',
        fill: 'backwards',
      });
      if (pose === 'goal')
        svg
          ?.querySelector('.lp-net')
          ?.animate([{ transform: 'none' }, { transform: 'scale(1.03)', offset: 0.85 }, { transform: 'none' }], { duration: 900 });
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      // Green = it was right, amber = shown now.
      gapEls.forEach((b, k) => {
        const right = word[gaps[k]];
        b.classList.remove('is-wrong');
        b.classList.add(vals[k] === right ? 'is-right' : 'is-fixed');
        vals[k] = right;
        b.disabled = true;
      });
      reasonEls.forEach((b, k) => {
        b.disabled = true;
        if (reasonOrder[k] === task.rule) b.classList.add(reason === task.rule ? 'is-right' : 'is-fixed');
        else if (reasonOrder[k] === reason) b.classList.add('is-wrong');
      });
      reason = task.rule;
      for (const b of bv.querySelectorAll('button')) b.disabled = true;
      checkBtn.remove();
      draw();
      root.classList.add('is-done');
      kick(ok ? 'save' : 'goal');
      hint.textContent = ok ? U('saveSaved') : U('saveGoal');
      resolve(ok, ok ? { soft: tries > 1 } : { answer: word, note: U('rule', { r: RULES[task.rule] }) });
    };
    const check = () => {
      if (done || answered()) return;
      const empty = vals.findIndex((v) => !v);
      if (empty >= 0) {
        cur = empty;
        draw();
        hint.textContent = U('saveNeedLetters');
        shake(sentence);
        return;
      }
      if (!reason) {
        hint.textContent = U('saveNeedReason');
        shake(...reasonEls);
        return;
      }
      tries++;
      const lettersOk = vals.every((v, k) => v === word[gaps[k]]);
      const reasonOk = reason === task.rule;
      if (lettersOk && reasonOk) return finish(true);
      if (tries >= 2) return finish(false);
      // One more try: right letters (and the right reason) lock green; the wrong ones empty, the wrong reason is crossed out.
      vals.forEach((v, k) => {
        if (v === word[gaps[k]]) {
          lock[k] = true;
          gapEls[k].classList.add('is-right');
          gapEls[k].disabled = true;
        } else {
          vals[k] = null;
          gapEls[k].classList.add('is-wrong');
        }
      });
      if (reasonOk) {
        reasonLock = true;
        reasonEls[reasonOrder.indexOf(reason)].classList.add('is-right');
      } else {
        const b = reasonEls[reasonOrder.indexOf(reason)];
        b.classList.add('is-wrong');
        b.disabled = true;
        reason = null;
      }
      const free = open();
      if (free.length) cur = free[0];
      kick('post');
      hint.textContent = lock.some(Boolean) || reasonLock ? U('savePost') : U('savePostNone');
      draw();
    };

    const root = h(
      'div',
      { class: `lp-save${goalBox ? '' : ' no-art'}` },
      sentence,
      h('div', { class: 'lp-pitch' }, goalBox, bv),
      h(
        'div',
        { class: 'lp-save-side' },
        h('div', { class: 'lp-why' }, h('p', { class: 'lp-row-label', text: U('why') }), h('div', { class: 'lp-reasons' }, reasonEls)),
        hint,
        h('div', { class: 'lp-actions' }, checkBtn),
      ),
      kbdHint(U('kSave', { n: reasonEls.length })),
    );
    enterChecks(root, check, answered);
    draw();
    work.append(root);
    setKeys((e) => {
      const key = e.key.toLowerCase();
      if (key === 'enter') check();
      else if (key === 'b' || key === 'v') put(key);
      else if (key === 'arrowright') move(1);
      else if (key === 'arrowleft') move(-1);
      else if (key === 'backspace' || key === 'delete') back();
      else {
        const d = Number(e.key);
        if (!(d >= 1 && d <= reasonOrder.length)) return false;
        pickReason(reasonOrder[d - 1]);
      }
      return true;
    });
  };

  // ---------- substitute: a pronoun comes on for a phrase (the substitution board) ----------
  /** @type {ExamRenderer<LPSubstituteTask>} */
  const substitute = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys, lang } = ctx;
    const chunks = (Array.isArray(task.chunks) ? task.chunks : []).map(String);
    const options = (Array.isArray(task.options) ? task.options : []).filter(Boolean).slice(0, 4);
    const target = Number(task.target);
    if (chunks.length < 2 || !(target >= 0 && target < chunks.length) || !options.includes(task.answer)) {
      return ctx.fallback(task, work, [
        { text: task.answer || options[0] || '—', ok: true },
        ...options.filter((o) => o !== task.answer).map((o) => ({ text: o, ok: false })),
      ]);
    }
    const order = shuffle(options);
    /** @type {number | null} */
    let sel = null;
    /** @type {string | null} */
    let pron = null;
    let chunkLock = false;
    let pronLock = false;
    let tries = 0;
    let done = false;
    const hint = mkHint();
    hint.textContent = U('subNeedChunk');

    const svg = ctx.art?.subBoard?.() || null;
    const ledOut = svg?.querySelector('.lp-led-out') || null;
    const ledIn = svg?.querySelector('.lp-led-in') || null;
    // Without the drawing: two plain rows.
    const rowOut = svg ? null : h('p', { class: 'lp-led-row is-out' });
    const rowIn = svg ? null : h('p', { class: 'lp-led-row is-in' });
    const board = h('div', { class: 'lp-board', lang }, svg || [rowOut, rowIn]);

    const chunkEls = chunks.map((c, i) =>
      h(
        'button',
        {
          type: 'button',
          class: 'lp-chunk',
          'data-i': String(i),
          'aria-pressed': 'false',
          onmousedown: keepFocus,
          onclick: () => pickChunk(i),
        },
        c,
      ),
    );
    const line = h('div', { class: 'lp-chunks', role: 'group', 'aria-label': U('sentence'), lang }, chunkEls);
    const pronEls = order.map((p, k) =>
      h(
        'button',
        { type: 'button', class: 'lp-pron', 'data-p': p, 'aria-pressed': 'false', onmousedown: keepFocus, onclick: () => pickPron(p) },
        h('kbd', { text: String(k + 1) }),
        h('span', { text: p }),
      ),
    );
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark lp-check', onclick: () => check() }, U('check'));

    const draw = () => {
      const out = sel === null ? '' : chunks[sel].replace(/[.,;:!?]+$/, '');
      const inn = pron ?? '';
      if (ledOut) {
        ledOut.textContent = out || '· · ·';
        ledOut.setAttribute('font-size', fit(Math.max(out.length, 8), 210, 30));
      }
      if (ledIn) {
        ledIn.textContent = inn || '· · ·';
        ledIn.setAttribute('font-size', fit(Math.max(inn.length, 8), 210, 30));
      }
      if (rowOut) rowOut.textContent = `▼ ${U('subOut')}: ${out || '…'}`;
      if (rowIn) rowIn.textContent = `▲ ${U('subIn')}: ${inn || '…'}`;
      board.classList.toggle('has-out', !!out);
      board.classList.toggle('has-in', !!inn);
      board.setAttribute('aria-label', `${U('subOut')}: ${out || '…'} · ${U('subIn')}: ${inn || '…'}`);
      chunkEls.forEach((b, i) => b.setAttribute('aria-pressed', String(i === sel)));
      pronEls.forEach((b, k) => b.setAttribute('aria-pressed', String(order[k] === pron)));
    };
    const pickChunk = (/** @type {number} */ i) => {
      if (done || answered()) return;
      const b = chunkEls[i];
      if (!b || b.disabled) return;
      if (chunkLock) return shake(b);
      sel = i;
      hint.textContent = pron ? '' : U('subNeedPron');
      draw();
    };
    const pickPron = (/** @type {string} */ p) => {
      if (done || answered()) return;
      const b = pronEls[order.indexOf(p)];
      if (!b || b.disabled) return;
      if (pronLock) return shake(b);
      pron = p;
      hint.textContent = sel === null ? U('subNeedChunk') : '';
      draw();
    };
    const step = (/** @type {number} */ d) => {
      if (done || chunkLock) return;
      const free = chunkEls.map((_, i) => i).filter((i) => !chunkEls[i].disabled);
      if (!free.length) return;
      const at = sel === null ? (d > 0 ? -1 : free.length) : free.indexOf(sel);
      pickChunk(free[(at + d + free.length) % free.length]);
    };
    /** The result sentence, with the pronoun that came on marked. */
    const resultLine = () => {
      const r = String(task.result || '');
      const m = r.toLowerCase().indexOf(String(task.answer).toLowerCase());
      const kids =
        m < 0
          ? [r]
          : [r.slice(0, m), h('mark', { class: 'lp-in', text: r.slice(m, m + task.answer.length) }), r.slice(m + task.answer.length)];
      return h('p', { class: 'lp-result', lang }, kids);
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      sel = target;
      pron = task.answer;
      draw();
      chunkEls.forEach((b) => {
        b.disabled = true;
      });
      pronEls.forEach((b, k) => {
        b.disabled = true;
        if (order[k] === task.answer) b.classList.add(ok || pronLock ? 'is-right' : 'is-fixed');
      });
      line.replaceWith(resultLine());
      root.classList.add('is-done');
      board.classList.add('is-done');
      if (!ok) board.classList.add('is-fixed');
      if (!reduced()) KFG.restart(board, 'is-flip');
      checkBtn.remove();
      hint.textContent = ok ? U('subDone') : '';
      resolve(ok, ok ? { soft: tries > 1 } : { answer: strip(task.result) });
    };
    const check = () => {
      if (done || answered()) return;
      if (sel === null) {
        hint.textContent = U('subNeedChunk');
        shake(line);
        return;
      }
      if (!pron) {
        hint.textContent = U('subNeedPron');
        shake(...pronEls);
        return;
      }
      tries++;
      const chunkOk = sel === target;
      const pronOk = pron === task.answer;
      if (chunkOk && pronOk) return finish(true);
      if (tries >= 2) return finish(false);
      if (chunkOk) {
        chunkLock = true;
        chunkEls[sel].classList.add('is-right');
      } else {
        chunkEls[sel].classList.add('is-wrong');
        chunkEls[sel].disabled = true;
        sel = null;
      }
      if (pronOk) {
        pronLock = true;
        pronEls[order.indexOf(pron)].classList.add('is-right');
      } else {
        const b = pronEls[order.indexOf(pron)];
        b.classList.add('is-wrong');
        b.disabled = true;
        pron = null;
      }
      hint.textContent = chunkOk || pronOk ? U('subGreen') : U('subAgain');
      shake(board);
      draw();
    };

    const root = h(
      'div',
      { class: 'lp-sub' },
      line,
      h(
        'div',
        { class: 'lp-sub-main' },
        board,
        h(
          'div',
          { class: 'lp-sub-side' },
          h('div', { class: 'lp-prons', lang }, pronEls),
          hint,
          h('div', { class: 'lp-actions' }, checkBtn),
          kbdHint(U('kSub', { n: pronEls.length })),
        ),
      ),
    );
    enterChecks(root, check, answered);
    draw();
    work.append(root);
    setKeys((e) => {
      if (e.key === 'Enter') check();
      else if (e.key === 'ArrowRight' || e.key === ' ') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else {
        const d = Number(e.key);
        if (!(d >= 1 && d <= order.length)) return false;
        pickPron(order[d - 1]);
      }
      return true;
    });
  };

  // ---------- content check (unit tests) ----------
  /**
   * Errors in the tasks of the three own types (the engine's validate skips them). [] = fine.
   * @param {ExamUnit} unit
   * @param {ExamArt} [art] when given, every art key must have a drawing and the art must draw press / goal / subBoard
   * @returns {string[]}
   */
  const check = (unit, art) => {
    /** @type {string[]} */
    const errs = [];
    const txt = (/** @type {any} */ x) => typeof x === 'string' && x.trim() !== '';
    const uniq = (/** @type {any[]} */ xs) => new Set(xs).size === xs.length;
    const cyr = (/** @type {any} */ t) =>
      ['q', 'fact', 'word', 'result', 'passage', 'listen'].some((k) => CYRILLIC.test(String(t[k] ?? ''))) ||
      ['stems', 'suffixes', 'ctx', 'chunks', 'options'].some(
        (k) => Array.isArray(t[k]) && t[k].some((/** @type {any} */ x) => CYRILLIC.test(String(x))),
      );
    const used = new Set();
    for (const s of unit?.stations || [])
      s.tasks.forEach((/** @type {any} */ t, ti) => {
        const w = `station ${s.id} task ${ti + 1} (${t.type})`;
        const err = (/** @type {string} */ m) => errs.push(`${w}: ${m}`);
        if (!['forge', 'save', 'substitute'].includes(t.type)) return;
        used.add(t.type);
        if (!txt(t.q)) err('q missing');
        if (cyr(t)) err('Cyrillic in the task (it is in Spanish)');
        if (t.art && art && !art.has?.(t.art)) err(`no art «${t.art}»`);
        switch (t.type) {
          case 'forge': {
            const stems = Array.isArray(t.stems) ? t.stems : [];
            const sufs = Array.isArray(t.suffixes) ? t.suffixes : [];
            if (stems.length < 2 || stems.length > 3 || !stems.every(txt)) err('stems must be 2–3 texts');
            if (sufs.length < 2 || sufs.length > 4 || !sufs.every(txt)) err('suffixes must be 2–4 texts');
            if (!uniq(stems)) err('stems must be unique');
            if (!uniq(sufs)) err('suffixes must be unique');
            if (!txt(t.word)) err('word missing');
            if (!Array.isArray(t.answer) || t.answer.length !== 2) {
              err('answer must be [stem, suffix]');
              break;
            }
            const [a, b] = t.answer;
            if (!stems.includes(a)) err(`answer stem «${a}» is not in stems`);
            if (!sufs.includes(b)) err(`answer suffix «${b}» is not in suffixes`);
            if (`${a}${b}` !== t.word) err(`«${a}» + «${b}» is not «${t.word}»`);
            const makes = stems
              .flatMap((/** @type {string} */ x) => sufs.map((/** @type {string} */ y) => x + y))
              .filter((x) => x === t.word);
            if (makes.length > 1) err(`more than one pair makes «${t.word}»`);
            break;
          }
          case 'save': {
            const word = String(t.word ?? '');
            const gaps = Array.isArray(t.gaps) ? t.gaps : [];
            const reasons = Array.isArray(t.reasons) ? t.reasons : [];
            if (!/^[a-záéíóúüñ]+$/.test(word)) err('word must be one lowercase word');
            if (!gaps.length) err('gaps missing');
            if (!uniq(gaps)) err('gaps must be unique');
            for (const g of gaps)
              if (!Number.isInteger(g) || g < 0 || g >= word.length) err(`gap ${g} is out of the word`);
              else if (!/[bv]/.test(word[g])) err(`gap ${g} is «${word[g]}», not b or v`);
            if (
              t.ctx !== undefined &&
              (!Array.isArray(t.ctx) || t.ctx.length !== 2 || !t.ctx.every((/** @type {any} */ x) => typeof x === 'string'))
            )
              err('ctx must be [before, after]');
            if (reasons.length < 2 || reasons.length > 3) err('reasons must be 2–3');
            if (!uniq(reasons)) err('reasons must be unique');
            for (const r of reasons) if (!(r in RULES)) err(`reason «${r}» is not one of ${Object.keys(RULES).join(', ')}`);
            if (!reasons.includes(t.rule)) err(`rule «${t.rule}» is not in reasons`);
            break;
          }
          case 'substitute': {
            const chunks = Array.isArray(t.chunks) ? t.chunks : [];
            const options = Array.isArray(t.options) ? t.options : [];
            if (chunks.length < 2 || !chunks.every(txt)) err('chunks must be 2+ texts');
            if (!(Number.isInteger(t.target) && t.target >= 0 && t.target < chunks.length)) err('target is not an index of chunks');
            if (options.length < 3 || options.length > 4 || !options.every(txt)) err('options must be 3–4 texts');
            if (!uniq(options)) err('options must be unique');
            if (!options.includes(t.answer)) err(`answer «${t.answer}» is not in options`);
            if (!txt(t.result)) err('result missing');
            else if (txt(t.answer) && !t.result.toLowerCase().includes(t.answer.toLowerCase()))
              err(`result does not contain «${t.answer}»`);
            break;
          }
        }
      });
    if (art) {
      if (used.has('forge') && typeof art.press !== 'function') errs.push('art: no press() for forge');
      if (used.has('save') && typeof art.goal !== 'function') errs.push('art: no goal() for save');
      if (used.has('substitute') && typeof art.subBoard !== 'function') errs.push('art: no subBoard() for substitute');
    }
    return errs;
  };

  window.LP_TYPES = { forge, save, substitute };
  window.LP_CHECK = check;
  window.LP_RULES = RULES;
})();
