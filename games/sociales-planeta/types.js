// Renderers of the task types only «El planeta donde vivimos» has: they need its drawings (art.js) and map data (maps.js).
// window.SP_TYPES = { mapTap, label, paint, walk } → KFExam.mount(..., { types }). Generic types live in shared/exam/types.js.
// @ts-check
'use strict';

/** @typedef {ExamTaskBase & { type: 'mapTap', map: 'world', target: string, kind: 'continent' | 'ocean' }} SPMapTapTask */
/** @typedef {ExamTaskBase & { type: 'label', scene: string, labels: { id: string, text: string }[] }} SPLabelTask */
/** @typedef {ExamTaskBase & { type: 'paint', scene: 'aerial', zones: { id: string, name: string, color: string }[] }} SPPaintTask */
/** @typedef {ExamTaskBase & { type: 'walk', grid: string, from: string, to?: string, steps?: string[], answer: string }} SPWalkTask */

window.SP_TYPES = (() => {
  // Texts of these four types (Spanish on both sites, like the engine's).
  const SP = {
    youTapped: ({ name }) => `Has tocado: ${name}.`,
    kMap: 'Toca en el mapa. Teclado: Tab para moverte, Enter para elegir',
    kLabel: ({ n, l }) => `Toca un nombre y después su sitio. Teclado: 1–${n} para el nombre, A–${l} para el sitio`,
    pickLabel: 'Primero toca un nombre.',
    labelTry: 'Ese no es su sitio. Prueba otro.',
    labelShown: ({ text }) => `Así: «${text}» va aquí.`,
    paletteTitle: 'Leyenda',
    kPaint: 'Elige un color y toca una zona del dibujo. Teclado: 1–6 para el color, Tab y Enter para pintar',
    pickColor: 'Primero elige un color de la leyenda.',
    paintHint: ({ name }) => `Esto es: ${name}. Busca su color en la leyenda.`,
    paintOk: ({ name }) => `¡Sí! ${name}.`,
    north: 'Norte',
    south: 'Sur',
    east: 'Este',
    west: 'Oeste',
    kDir: 'Teclado: flechas o N, S, E, O',
    kPath: 'Muévete con las flechas o con N, S, E, O. ⌫ para deshacer',
    step: ({ n, dir }) => `${n} ${n === 1 ? 'paso' : 'pasos'} al ${dir}`,
    noSteps: 'Aún no te has movido',
    edge: '¡Ahí se acaba el mapa!',
    arrived: ({ name }) => `¡Has llegado ${name.startsWith('el ') ? `al ${name.slice(3)}` : `a ${name}`}!`,
    youHere: 'Estás aquí',
    walkPlan: 'Sigue los pasos con el dedo:',
    siteLabel: ({ l }) => `Sitio ${l}`,
    you: 'Tú',
  };
  const U = KF.i18n({ uk: SP, es: SP });
  /** Direction names for the d-pad, spoken answers and step chips (plain data: T() would turn a non-string into its key). */
  const DIR_NAMES = { norte: U('north'), sur: U('south'), este: U('east'), oeste: U('west') };

  /** @param {string} s */
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Map tap on the world map: Tab through regions, Enter to choose.
  /** @type {ExamRenderer<SPMapTapTask>} */
  const mapTap = (task, work, ctx) => {
    const { h, reduced, art, resolve, answered, kbdHint } = ctx;
    const m = art.worldMap({ interactive: true });
    const W = window.SP_MAPS?.world;
    if (!m || !W) return ctx.fallback(task, work, [{ text: cap(task.target), ok: true }]); // no map data
    const pickRegion = (/** @type {string} */ id) => {
      if (answered()) return;
      const ok = id === task.target;
      const t = m.regions.get(task.target);
      const p = m.regions.get(id);
      m.el.classList.add('is-done');
      m.regions.forEach((r) => r.el.removeAttribute('tabindex'));
      t.el.classList.add('is-right');
      m.showLabel(task.target);
      if (!ok) {
        p.el.classList.add('is-wrong');
        m.showLabel(id, 'is-wrong');
        if (!reduced()) t.el.classList.add('is-pulse');
      }
      resolve(ok, { answer: t.name, note: ok ? null : U('youTapped', { name: p.name }) });
    };
    m.regions.forEach((r, id) => {
      r.el.addEventListener('click', () => pickRegion(id));
      r.el.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pickRegion(id);
        }
      });
    });
    work.append(h('div', { class: 'map-wrap' }, m.el), kbdHint(U('kMap')));
  };

  // Label a drawn scene: tap a name chip then a slot (or slot then chip). ≤1 mistake = correct.
  /** @type {ExamRenderer<SPLabelTask>} */
  const label = (task, work, ctx) => {
    const { h, shuffle, shake, art, hint: mkHint, kbdHint, draggable, resolve, answered, setKeys, LETTERS } = ctx;
    const sc = art.scene(task.scene);
    if (!sc) return ctx.fallback(task, work, [{ text: task.labels[0].text, ok: true }]);
    const labels = shuffle(task.labels);
    const spots = sc.spots.filter((/** @type {{ id: string }} */ s) => labels.some((l) => l.id === s.id));
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
    const slotEls = spots.map((/** @type {{ id: string, x: number, y: number, w: number }} */ s, /** @type {number} */ k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'slot',
          'data-i': String(k),
          'data-spot': s.id,
          'aria-label': U('siteLabel', { l: LETTERS[k] }),
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
        hint.textContent = U('labelShown', { text: labels[chipK].text });
        fill(
          chipK,
          spots.findIndex((/** @type {{ id: string }} */ s) => s.id === labels[chipK].id),
          true,
        );
      } else {
        hint.textContent = U('labelTry');
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
        hint.textContent = U('pickLabel');
        return;
      }
      attempt();
    };
    selChip = 0;
    mark();
    const scene = h('div', { class: `scene${task.scene === 'compass-rose' ? ' compass' : ''}` }, sc.el, slotEls);
    work.append(
      h('div', { class: 'tray' }, chipEls),
      hint,
      scene,
      kbdHint(U('kLabel', { n: labels.length, l: LETTERS[spots.length - 1] })),
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

  // Paint the aerial view with the legend colours. ≤2 mistakes = correct (6 zones).
  /** @type {Record<string, string>} */
  const COLORS = { rojo: '#e2453c', morado: '#8b4fc4', marron: '#9a6236', verde: '#3f9a4a', amarillo: '#f2c53d', azul: '#2f86d6' };
  /** @type {Record<string, string>} */
  const COLOR_NAMES = { rojo: 'Rojo', morado: 'Morado', marron: 'Marrón', verde: 'Verde', amarillo: 'Amarillo', azul: 'Azul' };
  /** @type {ExamRenderer<SPPaintTask>} */
  const paint = (task, work, ctx) => {
    const { h, shake, art, hint: mkHint, kbdHint, resolve, answered, setKeys } = ctx;
    const ae = art.aerial();
    const zones = task.zones;
    let color = null;
    let mistakes = 0;
    const painted = new Set();
    const hint = mkHint();
    const sw = zones.map((z, k) =>
      h(
        'button',
        {
          type: 'button',
          class: 'swatch',
          style: `--c:${COLORS[z.color] || '#999'}`,
          'aria-pressed': 'false',
          onclick: () => pickColor(k),
        },
        h('i', { 'aria-hidden': 'true' }),
        h('span', {}, COLOR_NAMES[z.color] || z.color, h('small', { text: z.name })),
        h('kbd', { text: String(k + 1) }),
      ),
    );
    const pickColor = (/** @type {number} */ k) => {
      if (answered()) return;
      color = zones[k].color;
      sw.forEach((s, j) => s.setAttribute('aria-pressed', String(j === k)));
      hint.textContent = '';
    };
    const paintZone = (/** @type {string} */ id) => {
      if (answered() || painted.has(id)) return;
      const z = zones.find((x) => x.id === id);
      if (!z) return;
      if (!color) {
        hint.textContent = U('pickColor');
        shake(...sw);
        return;
      }
      if (z.color === color) {
        painted.add(id);
        ae.paint(id, color);
        ae.zones.get(id).removeAttribute('tabindex');
        sw[zones.indexOf(z)].classList.add('done');
        hint.textContent = U('paintOk', { name: z.name });
        if (painted.size === zones.length) resolve(mistakes <= 2, { soft: mistakes > 0 });
      } else {
        mistakes++;
        hint.textContent = U('paintHint', { name: z.name });
        shake(ae.zones.get(id));
      }
    };
    ae.zones.forEach((/** @type {Element} */ g, /** @type {string} */ id) => {
      const z = zones.find((x) => x.id === id);
      g.setAttribute('aria-label', z ? z.name : id);
      g.addEventListener('click', () => paintZone(id));
      g.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          paintZone(id);
        }
      });
    });
    work.append(
      h(
        'div',
        { class: 'paint' },
        h('div', { class: 'aerial-wrap' }, ae.el),
        h('div', { class: 'palette' }, h('h3', { text: U('paletteTitle') }), sw),
      ),
      hint,
      kbdHint(U('kPaint')),
    );
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= zones.length) {
        pickColor(n - 1);
        return true;
      }
      return false;
    });
  };

  // Walk on the grid map (north up).
  /** @type {Record<string, [number, number]>} */
  const DIRS = { norte: [0, -1], sur: [0, 1], este: [1, 0], oeste: [-1, 0] };
  /** @type {Record<string, string>} */
  const KEY_DIR = {
    ArrowUp: 'norte',
    ArrowDown: 'sur',
    ArrowRight: 'este',
    ArrowLeft: 'oeste',
    n: 'norte',
    s: 'sur',
    e: 'este',
    o: 'oeste',
  };
  const ARROWS = { norte: '↑', sur: '↓', este: '→', oeste: '←' };
  const keyDir = (/** @type {KeyboardEvent} */ e) => KEY_DIR[e.key] || KEY_DIR[e.key.toLowerCase()];
  const groupSteps = (/** @type {string[]} */ steps) =>
    steps.reduce(
      (acc, d) => {
        const last = acc[acc.length - 1];
        if (last && last.dir === d) last.n++;
        else acc.push({ dir: d, n: 1 });
        return acc;
      },
      /** @type {{ dir: string, n: number }[]} */ ([]),
    );
  const stepChips = (/** @type {ExamRendererCtx} */ { h }, /** @type {string[]} */ steps, cls = '') =>
    groupSteps(steps).map((g) => h('span', { class: cls, text: `${ARROWS[g.dir]} ${U('step', { n: g.n, dir: g.dir })}` }));
  const roseSvg =
    '<svg viewBox="-30 -34 60 64" class="board-rose" aria-hidden="true"><circle r="17" fill="#fffdf5" stroke="#2c4a3e" stroke-width="2"/><path d="M0-24L5 0 0 24-5 0Z" fill="#2c4a3e"/><path d="M-24 0L0 5 24 0 0-5Z" fill="#2c4a3e" opacity=".55"/><path d="M0-24L5 0-5 0Z" fill="#d9473b"/><text y="-25" text-anchor="middle" font-size="13" font-weight="900" fill="#2c4a3e">N</text></svg>';

  const board = (
    /** @type {ExamRendererCtx} */ { h },
    /** @type {any} */ grid,
    /** @type {{ from: string, target: string | null }} */ { from, target },
  ) => {
    const [nx, ny] = grid.size;
    /** @type {Record<string, string>} */
    const at = {};
    for (const [id, p] of Object.entries(grid.places)) at[`${p.at[0]},${p.at[1]}`] = id;
    const el = h('div', { class: 'board', style: `--n:${nx}` });
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const id = at[`${x},${y}`];
        const p = id && grid.places[id];
        el.append(
          h(
            'div',
            { class: `cell${x === 0 ? ' left' : x === nx - 1 ? ' right' : ''}` },
            p &&
              h(
                'div',
                { class: `place${id === target ? ' target' : ''}`, 'data-id': id },
                h('span', { class: 'ico', 'aria-hidden': 'true', text: p.icon }),
                h('span', { class: 'nm', text: cap(p.name) }),
              ),
          ),
        );
      }
    }
    const trail = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    trail.setAttribute('class', 'trail');
    trail.setAttribute('viewBox', `0 0 ${nx} ${ny}`);
    trail.setAttribute('preserveAspectRatio', 'none');
    const token = h('div', { class: 'token' }, h('span', { title: U('youHere'), text: U('you') }));
    el.append(trail, token);
    const pos = [...grid.places[from].at];
    const moveToken = (/** @type {number[]} */ [x, y]) => {
      token.style.left = `${(x / nx) * 100}%`;
      token.style.top = `${(y / ny) * 100}%`;
    };
    moveToken(pos);
    const drawTrail = (/** @type {number[][]} */ pts) => {
      trail.innerHTML = pts.length > 1 ? `<polyline points="${pts.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(' ')}"/>` : '';
    };
    const wrap = h('div', { class: 'board-wrap', html: roseSvg });
    wrap.append(el);
    // Cell width for name labels.
    const ro = new ResizeObserver(() => el.style.setProperty('--cw', `${el.clientWidth / nx}px`));
    ro.observe(el);
    return { wrap, el, pos, moveToken, drawTrail, trail, nx, ny, at };
  };

  const dpad = (/** @type {ExamRendererCtx} */ { h }, /** @type {(d: string) => void} */ onDir) => {
    const btn = (/** @type {string} */ d, /** @type {string} */ arrow) =>
      h(
        'button',
        { type: 'button', class: `dir ${d[0]}`, 'data-dir': d, onclick: () => onDir(d) },
        h('b', { 'aria-hidden': 'true', text: arrow }),
        DIR_NAMES[d],
      );
    const btns = { norte: btn('norte', '↑'), oeste: btn('oeste', '←'), este: btn('este', '→'), sur: btn('sur', '↓') };
    return {
      el: h('div', { class: 'dpad' }, Object.values(btns), h('span', { class: 'hub-dot', 'aria-hidden': 'true', text: '🧭' })),
      btns,
    };
  };

  /** @type {ExamRenderer<SPWalkTask>} */
  const walk = (task, work, ctx) => {
    const { h, T, shuffle, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys } = ctx;
    const C = /** @type {SPContent} */ (ctx.content);
    const grid = C.grids[task.grid];
    if (!grid?.places[task.from]) return ctx.fallback(task, work, [{ text: String(task.answer), ok: true }]);
    const cardinal = C.CARDINALS.includes(task.answer);
    const isPath = task.answer === 'path';
    const b = board(ctx, grid, { from: task.from, target: cardinal || isPath ? task.to : null });
    const hint = mkHint();
    const fromAt = grid.places[task.from].at;

    if (cardinal) {
      const toAt = grid.places[task.to].at;
      const pad = dpad(ctx, (d) => choose(d));
      const choose = (/** @type {string} */ d) => {
        if (answered()) return;
        Object.values(pad.btns).forEach((x) => {
          x.disabled = true;
        });
        pad.btns[task.answer].classList.add('right');
        if (d !== task.answer) pad.btns[d].classList.add('wrong');
        b.trail.innerHTML = `<line class="arrow" x1="${fromAt[0] + 0.5}" y1="${fromAt[1] + 0.5}" x2="${toAt[0] + 0.5}" y2="${toAt[1] + 0.5}"/>`;
        resolve(d === task.answer, { answer: DIR_NAMES[task.answer].toLowerCase() });
      };
      work.append(h('div', { class: 'walk' }, b.wrap, h('div', { class: 'side' }, pad.el, kbdHint(U('kDir')))));
      setKeys((e) => {
        const d = keyDir(e);
        if (d) {
          choose(d);
          return true;
        }
        return false;
      });
      return;
    }

    if (isPath) {
      const target = grid.places[task.to];
      const path = [[...fromAt]];
      /** @type {string[]} */
      const steps = [];
      const list = h('div', { class: 'steps', 'aria-live': 'polite' });
      const drawList = () =>
        list.replaceChildren(...(steps.length ? stepChips(ctx, steps) : [h('span', { class: 'empty', text: U('noSteps') })]));
      const undoBtn = h('button', { type: 'button', class: 'btn btn-light', onclick: () => undo() }, T('undo'));
      const move = (/** @type {string} */ d) => {
        if (answered()) return;
        const [x, y] = path[path.length - 1];
        const nx = x + DIRS[d][0];
        const ny = y + DIRS[d][1];
        if (nx < 0 || ny < 0 || nx >= b.nx || ny >= b.ny) {
          hint.textContent = U('edge');
          shake(b.el);
          return;
        }
        hint.textContent = '';
        path.push([nx, ny]);
        steps.push(d);
        b.moveToken([nx, ny]);
        b.drawTrail(path);
        drawList();
        if (nx === target.at[0] && ny === target.at[1]) {
          Object.values(pad.btns).forEach((x2) => {
            x2.disabled = true;
          });
          undoBtn.disabled = true;
          hint.textContent = U('arrived', { name: target.name });
          resolve(true);
        }
      };
      const undo = () => {
        if (answered() || !steps.length) return;
        path.pop();
        steps.pop();
        b.moveToken(path[path.length - 1]);
        b.drawTrail(path);
        drawList();
        hint.textContent = '';
      };
      const pad = dpad(ctx, move);
      drawList();
      work.append(h('div', { class: 'walk' }, b.wrap, h('div', { class: 'side' }, pad.el, list, undoBtn, hint, kbdHint(U('kPath')))));
      setKeys((e) => {
        const d = keyDir(e);
        if (d) {
          move(d);
          return true;
        }
        if (e.key === 'Backspace') {
          undo();
          return true;
        }
        return false;
      });
      return;
    }

    // Follow the given steps in your head, then pick the place.
    const answerId = task.answer;
    const others = shuffle(Object.keys(grid.places).filter((id) => id !== answerId && id !== task.from)).slice(0, 3);
    const opts = shuffle([answerId, ...others]);
    let done = false;
    const buttons = opts.map((id, i) =>
      h(
        'button',
        { type: 'button', class: 'choice', onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { class: 'pi', 'aria-hidden': 'true', text: grid.places[id].icon }),
        cap(grid.places[id].name),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (done) return;
      done = true;
      buttons.forEach((x, j) => {
        x.disabled = true;
        if (opts[j] === answerId) x.classList.add('right');
        else if (j !== i) x.classList.add('dim');
      });
      if (opts[i] !== answerId) buttons[i].classList.add('wrong');
      // Show the walk.
      const path = [[...fromAt]];
      for (const d of task.steps) {
        const [x, y] = path[path.length - 1];
        path.push([x + DIRS[d][0], y + DIRS[d][1]]);
      }
      let k = 0;
      const tick = () => {
        k++;
        b.moveToken(path[k]);
        b.drawTrail(path.slice(0, k + 1));
        if (k < path.length - 1) setTimeout(tick, 230);
      };
      if (reduced()) {
        b.moveToken(path[path.length - 1]);
        b.drawTrail(path);
      } else setTimeout(tick, 150);
      resolve(opts[i] === answerId, { answer: cap(grid.places[answerId].name) });
    };
    work.append(
      h(
        'div',
        { class: 'walk' },
        b.wrap,
        h(
          'div',
          { class: 'side' },
          h('p', { class: 'kbd-hint', style: 'display:block', text: U('walkPlan') }),
          h('div', { class: 'steps' }, stepChips(ctx, task.steps, 'plan')),
          h('div', { class: 'places' }, buttons),
          kbdHint(T('kChoice', { n: buttons.length })),
        ),
      ),
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

  return { mapTap, label, paint, walk };
})();
