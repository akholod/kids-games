// Renderers of the task types only «Expedición safari» has:
//   window.NA_TYPES = { ficha, clave } → KFExam.mount(..., { types })
//   window.NA_CHECK(unit, art?) → string[]   content errors of these two types and of unit.trees / unit.leaves
//                                             (+ every art key and picture option when `art` is given)
//   window.NA_CLAVE_PATH(unit, task) → ('yes' | 'no')[] | null   the right answers of a clave, node by node (test drivers)
// Data shapes: types/naturales-animales.d.ts. Drawings: art.js (window.NAArt). No DOM at load time (the unit tests load this file
// in a vm with only KF.i18n).
// @ts-check
'use strict';

(() => {
  // Texts: Spanish on both sites, like the engine's (exam units are taught in Spanish).
  const S = {
    check: 'Comprobar ✓',
    // ficha
    fichaNeed: 'Elige una respuesta en cada fila.',
    fichaGreen: 'Lo verde está bien. Cambia lo naranja.',
    fichaDone: '¡Ficha completa!',
    fichaShown: 'Mira la ficha bien rellena.',
    kFicha: ({ n }) => `Teclado: ↑ ↓ fila · ← → o 1–${n} elige · Enter comprueba`,
    rowSummary: ({ label, value }) => `${label}: ${value}`,
    // clave
    yes: 'Sí',
    no: 'No',
    claveAgain: 'Mira otra vez las pistas de la ficha.',
    claveShown: ({ a }) => `Era «${a}». Seguimos por el buen camino.`,
    claveOk: '¡Bien!',
    clavePick: 'Elige Sí o No.',
    claveLeaf: 'Grupo',
    claveDone: '¡Clasificado!',
    kClave: 'Teclado: S = sí, N = no (o 1 / 2, ← → y Enter)',
    clues: 'Pistas',
  };
  const U = KF.i18n({ uk: S, es: S });

  /** The four rows of a ficha: label, short label (the answer summary), icon, options (id → label). Fixed here (not in content.js). */
  /** @type {Record<string, NAFichaRowDef>} */
  const ROWS = {
    come: {
      label: '¿Qué come?',
      short: 'Come',
      icon: '🍽️',
      options: { herbivoro: 'herbívoro', carnivoro: 'carnívoro', omnivoro: 'omnívoro' },
    },
    mueve: {
      label: '¿Cómo se mueve?',
      short: 'Se mueve',
      icon: '🐾',
      options: { anda: 'anda', salta: 'salta', repta: 'repta', nada: 'nada', vuela: 'vuela' },
    },
    nace: {
      label: '¿Cómo nace?',
      short: 'Nace',
      icon: '🥚',
      options: { viviparo: 'vivíparo', oviparo: 'ovíparo', ovoviviparo: 'ovovivíparo' },
    },
    grupo: {
      label: '¿Qué es?',
      short: 'Es',
      icon: '🔎',
      options: { mamifero: 'mamífero', ave: 'ave', pez: 'pez', reptil: 'reptil', anfibio: 'anfibio', invertebrado: 'invertebrado' },
    },
  };
  const rowDef = (/** @type {ExamUnit} */ _unit, /** @type {string} */ id) => ROWS[id];
  const CYRILLIC = /[Ѐ-ӿ]/;

  // A tap on a control must not move the focus onto it: Enter would then click it again instead of checking / the engine's «next».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();
  /** After the answer the engine adds the feedback sheet under the work area: its height (--fb) lets index.html shrink the
   *  photo so task + feedback + next fit a laptop window without page scroll. */
  const fitFeedback = (/** @type {HTMLElement} */ root) => {
    const fb = document.getElementById('feedback');
    if (fb) root.style.setProperty('--fb', `${Math.ceil(fb.getBoundingClientRect().height)}px`);
  };
  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** The explorer's photo of the animal (a polaroid with its name), optional clue list under it. */
  const snapshot = (
    /** @type {ExamRendererCtx} */ ctx,
    /** @type {{ animal: string, name: string }} */ task,
    /** @type {string[]} */ facts = [],
  ) => {
    const { h, art, lang } = ctx;
    const pic = art?.art(task.animal) || null;
    return h(
      'figure',
      { class: 'na-snap', 'data-animal': task.animal },
      h('div', { class: `na-snap-pic${pic ? '' : ' is-empty'}`, 'aria-hidden': 'true' }, pic || h('span', { text: '📷' })),
      h('figcaption', { class: 'na-snap-name', lang, text: cap(task.name || '') }),
      facts.length > 0 &&
        h(
          'ul',
          { class: 'na-facts', lang, 'aria-label': U('clues') },
          facts.map((f) => h('li', { text: f })),
        ),
    );
  };

  // ---------- ficha: the explorer's animal card — come / se mueve / nace / es ----------
  /** @type {ExamRenderer<NAFichaTask>} */
  const ficha = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, lang, content } = ctx;
    const rows = (Array.isArray(task.rows) ? task.rows : [])
      .map((r) => {
        const def = rowDef(content, r?.id);
        if (!def || !(r.answer in def.options)) return null;
        const ids = (Array.isArray(r.options) && r.options.length ? r.options : Object.keys(def.options)).filter((o) => o in def.options);
        if (!ids.includes(r.answer)) ids.push(r.answer);
        return { id: r.id, answer: r.answer, def, ids };
      })
      .filter((r) => r !== null);
    if (!rows.length) return ctx.fallback(task, work, [{ text: task.name || '—', ok: true }]);
    /** @type {(string | null)[]} */
    const sel = rows.map(() => null);
    /** Rows checked right: locked. */
    const locked = rows.map(() => false);
    /** Per row: options already tried and wrong (struck out). */
    const struck = rows.map(() => new Set());
    let cur = 0;
    let tries = 0;
    let done = false;
    const hint = mkHint();

    const optEls = rows.map((r, ri) =>
      r.ids.map((id, oi) => {
        const b = h(
          'button',
          {
            type: 'button',
            class: 'na-opt',
            'data-opt': id,
            'aria-pressed': 'false',
            onmousedown: keepFocus,
            onclick: () => choose(ri, oi),
          },
          h('kbd', { text: String(oi + 1) }),
          r.def.options[id],
        );
        return /** @type {HTMLButtonElement} */ (b);
      }),
    );
    const rowEls = rows.map((r, ri) =>
      h(
        'div',
        { class: 'na-row', 'data-row': r.id, role: 'group', 'aria-label': r.def.label },
        h('p', { class: 'na-row-label' }, h('span', { class: 'na-row-ico', 'aria-hidden': 'true', text: r.def.icon }), r.def.label),
        h('div', { class: 'na-opts', lang }, optEls[ri]),
      ),
    );
    const checkBtn = h(
      'button',
      { type: 'button', class: 'btn btn-dark na-check', onmousedown: keepFocus, onclick: () => check() },
      U('check'),
    );
    const maxOpts = Math.max(...rows.map((r) => r.ids.length));
    const root = h(
      'div',
      { class: 'na-ficha', 'data-rows': rows.length },
      snapshot(ctx, task),
      h('div', { class: 'na-rows' }, rowEls),
      h('div', { class: 'na-actions' }, checkBtn, hint),
      kbdHint(U('kFicha', { n: maxOpts })),
    );

    const draw = () => {
      rows.forEach((r, ri) => {
        rowEls[ri].classList.toggle('is-cur', ri === cur && !done);
        optEls[ri].forEach((b, oi) => {
          const id = r.ids[oi];
          b.setAttribute('aria-pressed', String(sel[ri] === id));
          b.classList.toggle('is-on', sel[ri] === id);
          b.classList.toggle('is-struck', struck[ri].has(id));
          b.disabled = done || locked[ri] || struck[ri].has(id);
        });
      });
    };
    const live = (/** @type {number} */ ri) => !locked[ri];
    const choose = (/** @type {number} */ ri, /** @type {number} */ oi) => {
      if (done || answered() || locked[ri]) return;
      const id = rows[ri].ids[oi];
      if (id === undefined) return;
      if (struck[ri].has(id)) return shake(optEls[ri][oi]);
      sel[ri] = id;
      cur = ri;
      hint.textContent = '';
      draw();
    };
    const moveRow = (/** @type {number} */ d) => {
      for (let k = 1; k <= rows.length; k++) {
        const ri = (cur + d * k + rows.length * k) % rows.length;
        if (live(ri)) {
          cur = ri;
          break;
        }
      }
      draw();
    };
    const step = (/** @type {number} */ d) => {
      if (!live(cur)) return;
      const ids = rows[cur].ids;
      const free = ids.map((_, i) => i).filter((i) => !struck[cur].has(ids[i]));
      if (!free.length) return;
      const at = free.indexOf(ids.indexOf(/** @type {string} */ (sel[cur])));
      const next = at < 0 ? (d > 0 ? free[0] : free[free.length - 1]) : free[(at + d + free.length) % free.length];
      choose(cur, next);
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      const wrong = [];
      rows.forEach((r, ri) => {
        const right = sel[ri] === r.answer;
        rowEls[ri].dataset.state = right ? 'right' : 'fixed';
        optEls[ri].forEach((b, oi) => {
          const id = r.ids[oi];
          b.classList.toggle('is-right', id === r.answer && right);
          b.classList.toggle('is-fixed', id === r.answer && !right);
          b.classList.toggle('is-wrong', !right && id === sel[ri]);
        });
        if (!right) wrong.push(U('rowSummary', { label: r.def.short, value: r.def.options[r.answer] }));
      });
      draw();
      root.classList.add('is-done');
      hint.textContent = ok ? U('fichaDone') : U('fichaShown');
      resolve(ok, ok ? { soft: tries > 1 } : { note: wrong.join(' · ') });
      fitFeedback(root);
    };
    const check = () => {
      if (done || answered()) return;
      const empty = rows.findIndex((_, ri) => !sel[ri]);
      if (empty >= 0) {
        hint.textContent = U('fichaNeed');
        cur = empty;
        draw();
        shake(rowEls[empty]);
        return;
      }
      tries++;
      const bad = rows.map((r, ri) => sel[ri] !== r.answer);
      if (!bad.some(Boolean)) return finish(true);
      if (tries > 1) return finish(false);
      // One retry: right rows lock green, a wrong pick is struck out and its row waits for another.
      rows.forEach((r, ri) => {
        if (!bad[ri]) {
          locked[ri] = true;
          rowEls[ri].dataset.state = 'right';
          optEls[ri][r.ids.indexOf(r.answer)].classList.add('is-right');
        } else {
          struck[ri].add(/** @type {string} */ (sel[ri]));
          sel[ri] = null;
          rowEls[ri].dataset.state = 'wrong';
          shake(rowEls[ri]);
        }
      });
      cur = bad.indexOf(true);
      hint.textContent = U('fichaGreen');
      draw();
    };

    draw();
    work.append(root);
    setKeys((e) => {
      if (done) return false;
      const k = e.key;
      if (k === 'Enter') return check(), true;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        root.classList.add('is-kbd');
        moveRow(k === 'ArrowDown' ? 1 : -1);
        return true;
      }
      if (k === 'ArrowRight' || k === 'ArrowLeft') {
        root.classList.add('is-kbd');
        step(k === 'ArrowRight' ? 1 : -1);
        return true;
      }
      const n = Number(k);
      if (Number.isInteger(n) && n >= 1 && n <= 6 && k.length === 1) {
        root.classList.add('is-kbd');
        if (n > rows[cur].ids.length) return true;
        const before = sel[cur];
        choose(cur, n - 1);
        // A digit fills the row and goes on to the next row that still needs an answer.
        if (sel[cur] && sel[cur] !== before) {
          const next = rows.findIndex((_, ri) => ri > cur && live(ri) && !sel[ri]);
          if (next >= 0) cur = next;
          draw();
        }
        return true;
      }
      return false;
    });
  };

  // ---------- clave: a dichotomous key — walk yes / no questions down to the animal's group ----------
  /** @returns {NAClaveNode | null} */
  const treeOf = (/** @type {ExamUnit} */ unit, /** @type {string} */ id) => {
    const t = /** @type {any} */ (unit)?.trees?.[id];
    return t && typeof t === 'object' ? t : null;
  };
  /**
   * The path from the root to the leaf: the yes / no answer at every node. null = the leaf is not in the tree (or the tree is broken).
   * @param {NAClaveNode | string} node
   * @param {string} leaf
   * @param {number} [depth]
   * @returns {('yes' | 'no')[] | null}
   */
  const route = (node, leaf, depth = 0) => {
    if (typeof node === 'string') return node === leaf ? [] : null;
    if (!node || typeof node !== 'object' || depth > 12) return null;
    for (const side of /** @type {('yes' | 'no')[]} */ (['yes', 'no'])) {
      const r = route(node[side], leaf, depth + 1);
      if (r) return [side, ...r];
    }
    return null;
  };
  const leafLabel = (/** @type {ExamUnit} */ unit, /** @type {string} */ id) => /** @type {any} */ (unit)?.leaves?.[id] || id;

  /** @type {ExamRenderer<NAClaveTask>} */
  const clave = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, lang, content } = ctx;
    const tree = treeOf(content, task.tree);
    const path = tree ? route(tree, task.answer) : null;
    if (!tree || !path?.length) {
      const leaves = Object.keys(/** @type {any} */ (content)?.leaves || {}).filter((l) => l !== task.answer);
      return ctx.fallback(task, work, [
        { text: leafLabel(content, task.answer), ok: true },
        ...leaves.slice(0, 2).map((l) => ({ text: leafLabel(content, l), ok: false })),
      ]);
    }
    /** @type {NAClaveNode} */
    let node = tree;
    let depth = 0;
    let wrongs = 0;
    let done = false;
    /** @type {'yes' | 'no' | null} */
    let sel = null;
    const hint = mkHint();
    const facts = (Array.isArray(task.facts) ? task.facts : []).filter((f) => typeof f === 'string' && f.trim()).slice(0, 4);

    const trail = h('ol', { class: 'na-trail', lang });
    const qEl = h('p', { class: 'na-q', lang, 'aria-live': 'polite' });
    const mk = (/** @type {'yes' | 'no'} */ side, /** @type {string} */ key) =>
      /** @type {HTMLButtonElement} */ (
        h(
          'button',
          { type: 'button', class: `na-yn-btn is-${side}`, 'data-ans': side, onmousedown: keepFocus, onclick: () => answer(side) },
          h('kbd', { text: key }),
          h('b', { 'aria-hidden': 'true', text: side === 'yes' ? '✓' : '✗' }),
          U(side),
        )
      );
    const yesBtn = mk('yes', 'S');
    const noBtn = mk('no', 'N');
    const ask = h('div', { class: 'na-ask' }, qEl, h('div', { class: 'na-yn' }, yesBtn, noBtn));
    const leafEl = h('p', { class: 'na-leaf', hidden: true });
    const root = h(
      'div',
      { class: 'na-clave', 'data-tree': task.tree, 'data-depth': '0', 'data-wrong': '0' },
      snapshot(ctx, task, facts),
      h('div', { class: 'na-key' }, trail, ask, leafEl, hint, kbdHint(U('kClave'))),
    );

    const drawQ = () => {
      qEl.textContent = typeof node === 'object' ? node.q : '';
      root.dataset.depth = String(depth);
      root.dataset.wrong = String(wrongs);
      for (const b of [yesBtn, noBtn]) {
        b.classList.toggle('is-sel', b.dataset.ans === sel);
        b.classList.remove('is-wrong');
        b.disabled = done;
      }
    };
    const addStep = (/** @type {string} */ q, /** @type {'yes' | 'no'} */ side, /** @type {boolean} */ fixed) => {
      trail.append(
        h(
          'li',
          { class: `na-step${fixed ? ' is-fixed' : ''}`, 'data-ans': side },
          h('span', { class: 'na-step-q', text: q }),
          h('b', { class: 'na-step-a', text: `${fixed ? '→ ' : ''}${U(side)}` }),
        ),
      );
    };
    const advance = (/** @type {'yes' | 'no'} */ side, /** @type {boolean} */ fixed) => {
      if (typeof node !== 'object') return;
      addStep(node.q, side, fixed);
      const next = node[side];
      depth++;
      sel = null;
      if (typeof next === 'string') return reach(next);
      node = next;
      drawQ();
    };
    const reach = (/** @type {string} */ leaf) => {
      done = true;
      const ok = wrongs <= 1;
      ask.hidden = true;
      leafEl.hidden = false;
      leafEl.replaceChildren(
        h('span', { class: 'na-leaf-k', text: `🔎 ${U('claveLeaf')}` }),
        h('strong', { lang, text: leafLabel(content, leaf) }),
      );
      root.classList.add('is-done');
      root.dataset.depth = String(depth);
      root.dataset.wrong = String(wrongs);
      hint.textContent = ok ? U('claveDone') : '';
      resolve(ok, ok ? { soft: wrongs > 0 } : { answer: leafLabel(content, task.answer) });
      fitFeedback(root);
    };
    const answer = (/** @type {'yes' | 'no'} */ side) => {
      if (done || answered() || typeof node !== 'object') return;
      const right = path[depth];
      if (side === right) {
        hint.textContent = '';
        return advance(side, false);
      }
      wrongs++;
      const btn = side === 'yes' ? yesBtn : noBtn;
      shake(btn);
      if (wrongs === 1) {
        // One retry at this node.
        sel = null;
        drawQ();
        btn.classList.add('is-wrong');
        hint.textContent = U('claveAgain');
        return;
      }
      // Another wrong step: show the right branch and go on along it.
      hint.textContent = U('claveShown', { a: U(right) });
      advance(right, true);
    };

    drawQ();
    work.append(root);
    setKeys((e) => {
      if (done) return false;
      const k = e.key.toLowerCase();
      if (k === 's' || k === '1') return answer('yes'), true;
      if (k === 'n' || k === '2') return answer('no'), true;
      if (k === 'arrowleft' || k === 'arrowright') {
        sel = k === 'arrowleft' ? 'yes' : 'no';
        drawQ();
        return true;
      }
      if (k === 'enter') {
        if (sel) answer(sel);
        else hint.textContent = U('clavePick');
        return true;
      }
      return false;
    });
  };

  // ---------- content check (unit tests) ----------
  /**
   * Errors in the ficha / clave tasks (the engine's validate skips them), in unit.trees / unit.leaves; with `art`, also every art key
   * and picture option of the unit. [] = fine.
   * @param {ExamUnit} unit
   * @param {ExamArt} [art]
   * @returns {string[]}
   */
  const check = (unit, art) => {
    /** @type {string[]} */
    const errs = [];
    const txt = (/** @type {any} */ x) => typeof x === 'string' && x.trim() !== '';
    const u = /** @type {any} */ (unit);
    const trees = u?.trees && typeof u.trees === 'object' ? u.trees : {};
    const leaves = u?.leaves && typeof u.leaves === 'object' ? u.leaves : {};

    // Trees: every node asks something and has both branches; every leaf has a label; no leaf twice in one tree.
    for (const [id, root] of Object.entries(trees)) {
      /** @type {Record<string, number>} */
      const seen = {};
      const walk = (/** @type {any} */ n, /** @type {string} */ where, /** @type {number} */ d) => {
        if (typeof n === 'string') {
          if (!txt(n)) errs.push(`tree ${id} ${where}: empty leaf`);
          else if (!txt(leaves[n])) errs.push(`tree ${id} ${where}: leaf «${n}» has no label in unit.leaves`);
          seen[n] = (seen[n] || 0) + 1;
          return;
        }
        if (!n || typeof n !== 'object') return errs.push(`tree ${id} ${where}: a node must be an object or a leaf id`);
        if (d > 12) return errs.push(`tree ${id} ${where}: too deep (a loop?)`);
        if (!txt(n.q)) errs.push(`tree ${id} ${where}: node without q`);
        else if (CYRILLIC.test(n.q)) errs.push(`tree ${id} ${where}: Cyrillic in q`);
        for (const side of ['yes', 'no']) {
          if (n[side] === undefined || n[side] === null) errs.push(`tree ${id} ${where}: no «${side}» branch`);
          else walk(n[side], `${where}.${side}`, d + 1);
        }
      };
      walk(root, 'root', 0);
      for (const [leaf, n] of Object.entries(seen))
        if (n > 1) errs.push(`tree ${id}: leaf «${leaf}» is reached ${n} times (one path each)`);
    }
    for (const [leaf, label] of Object.entries(leaves))
      if (!txt(label) || CYRILLIC.test(String(label))) errs.push(`leaf «${leaf}»: label must be a Spanish text`);

    const usedTrees = new Set();
    for (const s of unit?.stations || [])
      s.tasks.forEach((/** @type {any} */ t, ti) => {
        const w = `station ${s.id} task ${ti + 1} (${t.type})`;
        const err = (/** @type {string} */ m) => errs.push(`${w}: ${m}`);
        if (art) {
          if (t.art && !art.has?.(t.art)) err(`no art «${t.art}»`);
          if (t.type === 'choice' && t.pics) for (const k of t.options || []) if (!art.has?.(k)) err(`no picture «${k}»`);
          if ((t.type === 'ficha' || t.type === 'clave') && txt(t.animal) && !art.has?.(t.animal)) err(`no art «${t.animal}»`);
        }
        if (t.type !== 'ficha' && t.type !== 'clave') return;
        if (!txt(t.q)) err('q missing');
        if (!txt(t.animal)) err('animal (art key) missing');
        if (!txt(t.name)) err('name missing');
        if (['q', 'name', 'fact'].some((k) => CYRILLIC.test(String(t[k] ?? '')))) err('Cyrillic in the task (it is in Spanish)');
        if (t.type === 'ficha') {
          const rows = Array.isArray(t.rows) ? t.rows : [];
          if (rows.length < 2 || rows.length > 4) err('rows must be 2–4');
          const ids = rows.map((/** @type {any} */ r) => r?.id);
          if (new Set(ids).size !== ids.length) err('row ids must be unique');
          for (const r of rows) {
            const def = rowDef(unit, r?.id);
            if (!def) {
              err(`unknown row «${r?.id}» (rows: ${Object.keys(ROWS).join(', ')})`);
              continue;
            }
            const all = Object.keys(def.options);
            if (!all.includes(r.answer)) err(`row ${r.id}: unknown answer «${r.answer}» (${all.join(', ')})`);
            if (r.options !== undefined) {
              if (!Array.isArray(r.options) || r.options.length < 2) err(`row ${r.id}: options must list 2+ ids`);
              else {
                for (const o of r.options) if (!all.includes(o)) err(`row ${r.id}: unknown option «${o}»`);
                if (new Set(r.options).size !== r.options.length) err(`row ${r.id}: options must be unique`);
                if (!r.options.includes(r.answer)) err(`row ${r.id}: the answer «${r.answer}» is not in its options`);
              }
            }
          }
        } else {
          usedTrees.add(t.tree);
          if (t.facts !== undefined) {
            if (!Array.isArray(t.facts) || t.facts.length > 4 || !t.facts.every(txt)) err('facts must be up to 4 short texts');
            else if (t.facts.some((/** @type {string} */ f) => CYRILLIC.test(f))) err('Cyrillic in facts');
          }
          if (!txt(t.tree) || !trees[t.tree]) err(`no tree «${t.tree}» in unit.trees`);
          else if (!txt(t.answer)) err('answer (leaf id) missing');
          else if (!route(trees[t.tree], t.answer)?.length) err(`the answer leaf «${t.answer}» is not in tree «${t.tree}»`);
          if (txt(t.answer) && !txt(leaves[t.answer])) err(`the answer leaf «${t.answer}» has no label in unit.leaves`);
        }
      });
    for (const id of Object.keys(trees)) if (!usedTrees.has(id)) errs.push(`tree ${id}: no clave task uses it`);
    return errs;
  };

  window.NA_TYPES = { ficha, clave };
  window.NA_CHECK = check;
  window.NA_CLAVE_PATH = (unit, task) => {
    const t = treeOf(unit, task?.tree);
    return t ? route(t, task.answer) : null;
  };
})();
