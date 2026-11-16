// Renderers of the task types only «La vuelta al mundo en globo» has:
//   window.SC_TYPES = { spainMap, climograma, spot } → KFExam.mount(..., { types })
//   window.SC_CHECK(unit, art?) → string[]   content errors of these three types (+ art keys and label scenes when `art` is given)
// Data shapes: types/sociales-clima.d.ts. Drawings (map base, spot scenes, weather symbols): art.js; map data: sociales-planeta/maps.js.
// No DOM at load time (the unit tests load this file in a vm with only KF.i18n).
// @ts-check
'use strict';

(() => {
  // Texts: Spanish on both sites, like the engine's (exam units are taught in Spanish).
  const S = {
    check: 'Comprobar ✓',
    // spainMap
    forecast: '📺 El parte del tiempo',
    symbols: 'Símbolos',
    climates: 'Climas',
    kMap: ({ n }) => `Teclado: 1–${n} elige · Tab o ← → comunidad · Espacio pone · ⌫ quita · Enter comprueba`,
    pickToken: ({ what }) => `Primero elige ${what}.`,
    aSymbol: 'un símbolo',
    aClimate: 'un clima',
    mapNeed: 'Falta algo: pon uno en cada comunidad marcada.',
    mapGreen: 'Lo verde está bien. Cambia lo naranja.',
    mapAgain: 'Todavía no. ¡Prueba otra vez!',
    mapDone: '¡Mapa terminado!',
    regionEmpty: ({ name }) => `${name}: vacío`,
    regionFull: ({ name, token }) => `${name}: ${token}`,
    // climograma
    tempAxis: 'Temperatura (°C)',
    rainAxis: 'Precipitaciones (mm)',
    rowTemp: '°C',
    rowRain: 'mm',
    month: 'Mes',
    picked: 'Has elegido',
    pickedNone: 'Toca un mes del gráfico',
    kTap: 'Teclado: ← → elige el mes · Enter comprueba',
    kFill: 'Teclado: ↑ ↓ cambia el valor · Enter comprueba',
    tapNeed: 'Toca primero un mes del gráfico.',
    tapAgain: 'No es ese mes.',
    hintTempMax: 'Busca el punto rojo más alto.',
    hintTempMin: 'Busca el punto rojo más bajo.',
    hintRainMax: 'Busca la barra azul más alta.',
    hintRainMin: 'Busca la barra azul más baja.',
    hintAny: 'Fíjate otra vez en el gráfico.',
    barOf: ({ m }) => `Lluvia de ${m}`,
    pointOf: ({ m }) => `Temperatura de ${m}`,
    up: 'Subir',
    down: 'Bajar',
    fillAgainRain: 'Todavía no. Mira la tabla y la escala de la derecha (mm).',
    fillAgainTemp: 'Todavía no. Mira la tabla y la escala de la izquierda (°C).',
    fillZero: 'Usa ▲ para subir la barra.',
    fillDone: '¡Justo!',
    chart: 'Climograma',
    // spot
    found: ({ n, total }) => `Encontrados: ${n} de ${total}`,
    spotHuman: ({ name }) => `«${name}» lo han hecho las personas.`,
    spotNatural: ({ name }) => `«${name}» es natural.`,
    spotYes: ({ name }) => `¡Sí! «${name}».`,
    spotAll: '¡Los has encontrado todos!',
    spotShown: 'Te enseño los que faltaban.',
    kSpot: 'Teclado: Tab o ← → para moverte · Enter o Espacio toca',
  };
  const U = KF.i18n({ uk: S, es: S });

  const MONTHS = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  // The chart's month initials (book p. 35) and the table's (book p. 34).
  const INITIALS = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const TABLE_HEAD = ['E', 'F', 'M', 'A', 'My', 'J', 'Jl', 'A', 'S', 'O', 'N', 'D'];
  const T_MAX = 35;
  const R_MAX = 210;
  const T_STEP = 5;
  const R_STEP = 15;
  /** Region ids of SP_MAPS.spain (kept here so the validator runs without the map data). */
  const REGION_IDS = [
    'galicia',
    'asturias',
    'cantabria',
    'pais-vasco',
    'navarra',
    'la-rioja',
    'aragon',
    'cataluna',
    'castilla-y-leon',
    'madrid',
    'castilla-la-mancha',
    'valencia',
    'murcia',
    'extremadura',
    'andalucia',
    'baleares',
    'canarias',
  ];
  /** Climate mode: only the regions whose climate is clear-cut (book p. 39). Andalucía and «de montaña» are never asked on the map. */
  const CLIMATE_OF = {
    galicia: 'oceanico',
    asturias: 'oceanico',
    cantabria: 'oceanico',
    'pais-vasco': 'oceanico',
    'castilla-y-leon': 'mediterraneo-interior',
    madrid: 'mediterraneo-interior',
    'castilla-la-mancha': 'mediterraneo-interior',
    extremadura: 'mediterraneo-interior',
    cataluna: 'mediterraneo-litoral',
    valencia: 'mediterraneo-litoral',
    murcia: 'mediterraneo-litoral',
    baleares: 'mediterraneo-litoral',
    canarias: 'subtropical',
  };
  const WEATHER_IDS = ['sol', 'nubes', 'sol-nubes', 'lluvia', 'nieve', 'tormenta', 'niebla', 'viento'];
  const WEATHER_EMOJI = ['☀️', '☀', '🌞', '☁️', '☁', '⛅', '🌤️', '🌥️', '🌧️', '🌦️', '❄️', '🌨️', '⛈️', '🌩️', '⚡', '🌫️', '💨'];
  const CYRILLIC = /[Ѐ-ӿ]/;
  const HUMAN_Q = /hech[oa]s? por (las )?personas|han hecho las personas|humaniz|construid|obra de las personas/i;
  const NATURAL_Q = /\bnatural(es)?\b/i;

  // A tap on a control must not move the focus onto it: Enter would then click it again instead of checking / the engine's «next».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();
  /** After the answer the engine adds the feedback sheet under the work area: its height (--fb) lets index.html shrink the
   *  map / chart / scene so task + feedback + next fit a laptop window without page scroll. */
  const fitFeedback = (/** @type {HTMLElement} */ root) => {
    const fb = document.getElementById('feedback');
    if (fb) root.style.setProperty('--fb', `${Math.ceil(fb.getBoundingClientRect().height)}px`);
  };
  const svgNode = (/** @type {string} */ tag, /** @type {Record<string, string | number>} */ attrs = {}) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    return el;
  };
  /** Enter / Space on an SVG «button» (it is not a native button, so the page's key handler leaves it to us). */
  const onActivate = (/** @type {Element} */ el, /** @type {(e: KeyboardEvent) => void} */ fn) =>
    el.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        fn(e);
      }
    });
  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** «a, b y c» */
  const listEs = (/** @type {string[]} */ xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`);

  /**
   * What a tapMonth question asks: the warmest / coldest month, the rainiest / driest. From `task.ask`, else from the words of q.
   * @param {any} task
   * @returns {{ what: 'temp' | 'rain', dir: 'max' | 'min' } | null}
   */
  const askOf = (task) => {
    const a = String(task?.ask || '');
    const m = /^(max|min)(Temp|Rain)$/.exec(a);
    if (m) return { what: m[2] === 'Temp' ? 'temp' : 'rain', dir: /** @type {'max' | 'min'} */ (m[1]) };
    const q = String(task?.q || '').toLowerCase();
    if (/(llueve|llovi[óo]|llover|lluvi|precipitaci)\w*\s+(m[áa]s|mayor)|(m[áa]s|mayor)\s+(lluvi|precipitaci)|m[áa]s lluvioso/.test(q))
      return { what: 'rain', dir: 'max' };
    if (/(llueve|llovi[óo]|lluvi|precipitaci)\w*\s+menos|menos\s+(lluvi|precipitaci)|m[áa]s seco/.test(q))
      return { what: 'rain', dir: 'min' };
    if (/m[áa]s (calor|caluros|c[áa]lid)|temperatura m[áa]s alta|menos fr[íi]o/.test(q)) return { what: 'temp', dir: 'max' };
    if (/m[áa]s fr[íi]|temperatura m[áa]s baja|menos calor/.test(q)) return { what: 'temp', dir: 'min' };
    return null;
  };
  const askHint = (/** @type {ReturnType<typeof askOf>} */ a) =>
    !a
      ? U('hintAny')
      : a.what === 'temp'
        ? U(a.dir === 'max' ? 'hintTempMax' : 'hintTempMin')
        : U(a.dir === 'max' ? 'hintRainMax' : 'hintRainMin');

  // ---------- spainMap: weather symbols or climates onto Spain's regions ----------
  /** @type {ExamRenderer<SCSpainMapTask>} */
  const spainMap = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, lang, art } = ctx;
    const mode = task.mode === 'climate' ? 'climate' : 'weather';
    const tokens = (Array.isArray(task.tokens) ? task.tokens : []).filter((t) => t?.id).slice(0, 5);
    const tok = (/** @type {string} */ id) => tokens.find((t) => t.id === id);
    const answer = task.answer && typeof task.answer === 'object' ? task.answer : {};
    const m = art?.map?.();
    const asked = (m?.ids || REGION_IDS).filter((/** @type {string} */ id) => id in answer && tok(answer[id]));
    if (!m || asked.length < 2 || tokens.length < 2) {
      // No map (data missing): a plain choice for the first asked region.
      const id = asked[0] || Object.keys(answer)[0];
      const right = tok(answer[id]);
      return ctx.fallback(task, work, [
        { text: right?.label || '—', ok: true },
        ...tokens.filter((t) => t !== right).map((t) => ({ text: t.label, ok: false })),
      ]);
    }
    const symbolOf = (/** @type {SCMapToken} */ t) => (mode === 'weather' ? art.weatherId(t) : null);
    const nameOf = (/** @type {string} */ id) => m.pill[id]?.[2] || id;
    /** @type {Record<string, string | null>} */
    const placed = Object.fromEntries(asked.map((id) => [id, null]));
    const lock = new Set();
    /** @type {string | null} */
    let sel = null;
    let tries = 0;
    let done = false;
    const hint = mkHint();

    // ---- the map ----
    const svg = /** @type {SVGSVGElement} */ (m.el);
    const rings = /** @type {SVGGElement} */ (svg.querySelector('.sc-rings'));
    const pillsG = /** @type {SVGGElement} */ (svg.querySelector('.sc-pills'));
    /** @type {Record<string, SVGPathElement>} */
    const regEl = {};
    /** @type {Record<string, SVGPathElement>} */
    const ringEl = {};
    /** @type {Record<string, { g: SVGGElement, mark: SVGGElement }>} */
    const pillEl = {};
    for (const p of svg.querySelectorAll('.sc-reg')) {
      const id = p.getAttribute('data-region');
      if (!asked.includes(id)) continue;
      const path = /** @type {SVGPathElement} */ (p);
      regEl[id] = path;
      path.classList.add('is-asked');
      path.setAttribute('role', 'button');
      path.setAttribute('tabindex', '0');
      path.addEventListener('mousedown', keepFocus);
      path.addEventListener('click', () => tapRegion(id, true));
      onActivate(path, (e) => keyRegion(id, e));
      path.addEventListener('focus', () => ringEl[id]?.classList.add('is-focus'));
      path.addEventListener('blur', () => ringEl[id]?.classList.remove('is-focus'));
      const ring = /** @type {SVGPathElement} */ (
        svgNode('path', { class: 'sc-ring', d: p.getAttribute('d') || '', 'fill-rule': 'evenodd' })
      );
      ringEl[id] = ring;
      rings.append(ring);
    }
    // One pill per asked region: its symbol / colour and its name (tapping it = tapping the region). Pills that would overlap are
    // pushed apart; a pill that moved away from its region gets a leader line to it.
    const PH = 32;
    const pw = (/** @type {string} */ name) => Math.round(name.length * 8.8 + 50);
    const [bx, by, bw, bh] = m.box;
    /** @type {Record<string, [number, number]>} */
    const pos = Object.fromEntries(asked.map((id) => [id, [m.pill[id]?.[0] ?? m.anchor[id][0], m.pill[id]?.[1] ?? m.anchor[id][1]]]));
    for (let it = 0; it < 60; it++) {
      let moved = false;
      for (let i = 0; i < asked.length; i++)
        for (let j = i + 1; j < asked.length; j++) {
          const a = pos[asked[i]];
          const b = pos[asked[j]];
          const ox = (pw(nameOf(asked[i])) + pw(nameOf(asked[j]))) / 2 + 6 - Math.abs(a[0] - b[0]);
          const oy = PH + 6 - Math.abs(a[1] - b[1]);
          if (ox <= 0 || oy <= 0) continue;
          moved = true;
          // Apart along the cheaper axis (mostly up / down: the names are wide).
          if (oy <= ox * 1.6) {
            const d = (oy / 2 + 0.5) * (a[1] <= b[1] ? 1 : -1);
            a[1] -= d;
            b[1] += d;
          } else {
            const d = (ox / 2 + 0.5) * (a[0] <= b[0] ? 1 : -1);
            a[0] -= d;
            b[0] += d;
          }
        }
      for (const id of asked) {
        const half = pw(nameOf(id)) / 2;
        pos[id][0] = Math.min(bx + bw - half - 4, Math.max(bx + half + 4, pos[id][0]));
        pos[id][1] = Math.min(by + bh - PH / 2 - 4, Math.max(by + PH / 2 + 4, pos[id][1]));
      }
      if (!moved) break;
    }
    const leads = /** @type {SVGGElement} */ (svg.querySelector('.sc-leads'));
    for (const id of asked) {
      const name = nameOf(id);
      const [x, y] = pos[id];
      const [ax, ay] = m.anchor[id];
      const pref = m.pill[id] || m.anchor[id];
      if (Math.hypot(x - pref[0], y - pref[1]) > 10) {
        leads.append(
          svgNode('path', { class: 'sc-lead', d: `M${ax} ${ay}L${x} ${y}` }),
          svgNode('circle', { class: 'sc-lead-dot', cx: ax, cy: ay, r: 4 }),
        );
      }
      const w = pw(name);
      const g = /** @type {SVGGElement} */ (
        svgNode('g', { class: 'sc-pill', 'data-region': id, transform: `translate(${Math.round(x)} ${Math.round(y)})` })
      );
      g.append(svgNode('rect', { class: 'sc-pill-bg', x: -w / 2, y: -PH / 2, width: w, height: PH, rx: PH / 2 }));
      const mark = /** @type {SVGGElement} */ (svgNode('g', { class: 'sc-pill-mark', transform: `translate(${-w / 2 + 17} 0)` }));
      g.append(mark);
      const t = svgNode('text', { class: 'sc-pill-name', x: -w / 2 + 35, y: 5.5 });
      t.textContent = name;
      g.append(t);
      g.addEventListener('mousedown', keepFocus);
      g.addEventListener('click', () => tapRegion(id, true));
      pillsG.append(g);
      pillEl[id] = { g, mark };
    }

    // ---- the palette ----
    const tokEls = tokens.map((t, k) => {
      const sym = symbolOf(t);
      const ico =
        mode === 'weather'
          ? sym
            ? art.weather(sym, 40)
            : h('span', { class: 'sc-tok-emoji', text: t.icon || '?' })
          : h('i', { class: 'sc-swatch', style: `--c:${t.color || '#999'}` });
      return h(
        'button',
        {
          type: 'button',
          class: 'sc-tok',
          'data-token': t.id,
          'aria-pressed': 'false',
          onmousedown: keepFocus,
          onclick: () => pick(t.id),
        },
        h('kbd', { text: String(k + 1) }),
        h('span', { class: 'sc-tok-ico', 'aria-hidden': 'true' }, ico),
        h('span', { class: 'sc-tok-text', text: t.label }),
      );
    });
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark sc-check', onclick: () => check() }, U('check'));
    // Once answered the engine shows the `listen` sentence under «Escuchar»; when it is the forecast of our card, index.html hides
    // that copy (.is-said-dup): the card stays beside the map and the prompt band does not grow.
    const saidDup = !!task.text && String(task.listen ?? '').trim() === String(task.text).trim();
    const forecast = task.text
      ? h(
          'div',
          { class: 'sc-forecast' },
          h('p', { class: 'sc-forecast-head', text: U('forecast') }),
          h('p', { class: 'sc-forecast-text', lang, text: task.text }),
        )
      : null;

    const draw = () => {
      for (const id of asked) {
        const t = placed[id] ? tok(placed[id]) : null;
        const path = regEl[id];
        path.dataset.token = t?.id || '';
        path.style.fill = mode === 'climate' && t ? t.color || '' : '';
        path.classList.toggle('is-full', !!t);
        path.setAttribute('aria-label', t ? U('regionFull', { name: nameOf(id), token: t.label }) : U('regionEmpty', { name: nameOf(id) }));
        const { g, mark } = pillEl[id];
        g.classList.toggle('is-full', !!t);
        const sym = t && symbolOf(t);
        mark.innerHTML = !t
          ? '<circle r="12" class="sc-pill-empty"/><text class="sc-pill-q" y="5">?</text>'
          : mode === 'climate'
            ? `<circle r="12" fill="${t.color || '#999'}" stroke="#fff" stroke-width="2.5"/>`
            : sym
              ? `<circle r="15" fill="#fff"/><g transform="scale(.8)">${art.weather(sym)}</g>`
              : `<text y="6" text-anchor="middle" font-size="16">${t.icon || '?'}</text>`;
      }
      tokEls.forEach((b, k) => b.setAttribute('aria-pressed', String(tokens[k].id === sel)));
    };
    const pick = (/** @type {string} */ id) => {
      if (done || answered()) return;
      sel = id;
      hint.textContent = '';
      draw();
    };
    const tapRegion = (/** @type {string} */ id, /** @type {boolean} */ pointer) => {
      if (done || answered()) return;
      if (lock.has(id)) return shake(pillEl[id].g);
      if (!sel) {
        hint.textContent = U('pickToken', { what: mode === 'weather' ? U('aSymbol') : U('aClimate') });
        return shake(...tokEls);
      }
      // A tap on a region that already holds this token takes it off again (keys: ⌫).
      placed[id] = pointer && placed[id] === sel ? null : sel;
      ringEl[id].classList.remove('is-wrong');
      hint.textContent = '';
      draw();
    };
    const keyRegion = (/** @type {string} */ id, /** @type {KeyboardEvent} */ e) => {
      if (done || answered()) return;
      // Enter on a region that already holds the chosen token has nothing left to place there: it checks.
      if (e.key === 'Enter' && sel && placed[id] === sel) return check();
      tapRegion(id, false);
    };
    const clearRegion = (/** @type {string} */ id) => {
      if (done || answered() || lock.has(id) || !placed[id]) return;
      placed[id] = null;
      draw();
    };
    const focusRegion = (/** @type {number} */ d) => {
      const free = asked.filter((id) => !lock.has(id));
      if (!free.length) return;
      const cur = free.indexOf(/** @type {Element} */ (document.activeElement)?.getAttribute?.('data-region'));
      const next = free[cur < 0 ? (d > 0 ? 0 : free.length - 1) : (cur + d + free.length) % free.length];
      regEl[next].focus({ preventScroll: true });
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      for (const id of asked) {
        const right = placed[id] === answer[id];
        ringEl[id].classList.remove('is-wrong', 'is-focus');
        ringEl[id].classList.add(right ? 'is-right' : 'is-fixed');
        pillEl[id].g.classList.add(right ? 'is-right' : 'is-fixed');
        placed[id] = answer[id];
        regEl[id].removeAttribute('tabindex');
        regEl[id].classList.add('is-locked');
      }
      for (const b of tokEls) b.disabled = true;
      sel = null;
      draw();
      checkBtn.remove();
      root.classList.add('is-done');
      hint.textContent = ok ? U('mapDone') : '';
      const summary = asked.map((id) => `${nameOf(id)}: ${tok(answer[id])?.label}`).join(' · ');
      resolve(ok, ok ? { soft: tries > 1 } : task.fact ? {} : { note: summary });
      fitFeedback(root);
    };
    const check = () => {
      if (done || answered()) return;
      const empty = asked.filter((id) => !placed[id]);
      if (empty.length) {
        hint.textContent = U('mapNeed');
        shake(...empty.map((id) => pillEl[id].g));
        return;
      }
      tries++;
      const wrong = asked.filter((id) => placed[id] !== answer[id]);
      if (!wrong.length) return finish(true);
      if (tries >= 2) return finish(false);
      // One more try: the right ones lock green, the wrong ones go back empty with an orange ring.
      for (const id of asked) {
        if (wrong.includes(id)) {
          placed[id] = null;
          ringEl[id].classList.add('is-wrong');
        } else {
          lock.add(id);
          ringEl[id].classList.add('is-right');
          pillEl[id].g.classList.add('is-right');
          regEl[id].removeAttribute('tabindex');
          regEl[id].classList.add('is-locked');
        }
      }
      hint.textContent = lock.size ? U('mapGreen') : U('mapAgain');
      shake(...wrong.map((id) => pillEl[id].g));
      draw();
    };

    const root = h(
      'div',
      { class: `sc-mapgame${saidDup ? ' is-said-dup' : ''}`, 'data-mode': mode },
      h('div', { class: 'sc-map', style: `--ar:${bw / bh}`, role: 'group', 'aria-label': task.q }, svg),
      h(
        'div',
        { class: 'sc-map-side' },
        forecast,
        h(
          'div',
          { class: 'sc-palette' },
          h('p', { class: 'sc-row-label', text: mode === 'weather' ? U('symbols') : U('climates') }),
          h('div', { class: 'sc-toks' }, tokEls),
        ),
        h('div', { class: 'sc-checkrow' }, hint, h('div', { class: 'sc-actions' }, checkBtn)),
        kbdHint(U('kMap', { n: tokens.length })),
      ),
    );
    draw();
    work.append(root);
    setKeys((e) => {
      const focusId = /** @type {Element} */ (document.activeElement)?.getAttribute?.('data-region');
      if (e.key === 'Enter') check();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') focusRegion(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') focusRegion(-1);
      else if ((e.key === 'Backspace' || e.key === 'Delete') && focusId) clearRegion(focusId);
      else {
        const d = Number(e.key);
        if (!(d >= 1 && d <= tokens.length)) return false;
        pick(tokens[d - 1].id);
      }
      return true;
    });
  };

  // ---------- climograma: read a climogram (tap a month) or build its missing bar / point ----------
  const CW = 520;
  const CH = 300;
  const X0 = 44;
  const X1 = 476;
  const YB = 262;
  const YT = 30;
  const COL = (X1 - X0) / 12;
  const yT = (/** @type {number} */ v) => YB - (v / T_MAX) * (YB - YT);
  const yR = (/** @type {number} */ v) => YB - (v / R_MAX) * (YB - YT);
  const cxOf = (/** @type {number} */ i) => X0 + COL * i + COL / 2;
  const nums12 = (/** @type {any} */ a) => Array.isArray(a) && a.length === 12 && a.every((x) => Number.isFinite(x));

  /** @type {ExamRenderer<SCClimogramaTask>} */
  const climograma = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, lang, reduced } = ctx;
    const mode = task.mode === 'fillBar' || task.mode === 'fillTemp' ? task.mode : 'tapMonth';
    const temp = task.temp;
    const rain = task.rain;
    const fill = mode !== 'tapMonth';
    const miss = Number(task.missing);
    const ans = Number(task.answer);
    const okData =
      nums12(temp) &&
      nums12(rain) &&
      (fill ? Number.isInteger(miss) && miss >= 0 && miss < 12 : Number.isInteger(ans) && ans >= 0 && ans < 12);
    if (!okData) {
      const right = fill ? `${(mode === 'fillBar' ? rain : temp)?.[miss] ?? '—'}` : MONTHS[ans] || '—';
      return ctx.fallback(task, work, [{ text: right, ok: true }]);
    }
    const isBar = mode === 'fillBar';
    const step = isBar ? R_STEP : T_STEP;
    const max = isBar ? R_MAX : T_MAX;
    const target = fill ? (isBar ? rain[miss] : temp[miss]) : null;
    const ask = askOf(task);
    let value = 0;
    /** @type {number | null} */
    let sel = null;
    let tries = 0;
    let done = false;
    const wrongMonths = new Set();
    const hint = mkHint();

    // ---- the chart ----
    const svg = /** @type {SVGSVGElement} */ (
      svgNode('svg', { viewBox: `0 0 ${CW} ${CH}`, class: 'sc-chart-svg', role: 'img', 'aria-label': U('chart') })
    );
    const grid = [0, 1, 2, 3, 4, 5, 6, 7]
      .map((k) => {
        const y = YB - (k * (YB - YT)) / 7;
        return `<path d="M${X0} ${y}H${X1}" class="sc-grid${k ? '' : ' is-base'}"/><text x="${X0 - 8}" y="${y + 5}" class="sc-ax sc-ax-t" text-anchor="end">${k * 5}</text><text x="${X1 + 8}" y="${y + 5}" class="sc-ax sc-ax-r">${k * 30}</text>`;
      })
      .join('');
    svg.innerHTML = `<rect x="${X0}" y="${YT}" width="${X1 - X0}" height="${YB - YT}" class="sc-plot"/>${grid}
      <text x="${X0 - 8}" y="18" class="sc-ax sc-ax-t sc-unit" text-anchor="end">°C</text><text x="${X1 + 8}" y="18" class="sc-ax sc-ax-r sc-unit">mm</text>
      <g class="sc-cols"></g><g class="sc-bars"></g><g class="sc-line"></g>
      <g>${INITIALS.map((l, i) => `<text x="${cxOf(i)}" y="${YB + 26}" class="sc-mon" data-month="${i}" text-anchor="middle">${l}</text>`).join('')}</g>`;
    const colsG = /** @type {SVGGElement} */ (svg.querySelector('.sc-cols'));
    const barsG = /** @type {SVGGElement} */ (svg.querySelector('.sc-bars'));
    const lineG = /** @type {SVGGElement} */ (svg.querySelector('.sc-line'));
    const monEls = [...svg.querySelectorAll('.sc-mon')];
    const colEls = MONTHS.map((name, i) => {
      const r = svgNode('rect', {
        class: 'sc-col',
        'data-month': i,
        x: X0 + COL * i + 1,
        y: YT - 12,
        width: COL - 2,
        height: YB - YT + 44,
        rx: 8,
      });
      if (!fill) {
        r.setAttribute('role', 'button');
        r.setAttribute('tabindex', i === 0 ? '0' : '-1');
        r.setAttribute('aria-label', cap(name));
        r.addEventListener('mousedown', keepFocus);
        r.addEventListener('click', () => choose(i));
        onActivate(r, (e) => (e.key === 'Enter' && sel === i ? check() : choose(i, e.key === 'Enter')));
      }
      colsG.append(r);
      return r;
    });
    const barW = 22;
    const barEls = rain.map((v, i) => {
      const r = svgNode('rect', { class: 'sc-bar', 'data-month': i, x: cxOf(i) - barW / 2, width: barW, rx: 3 });
      barsG.append(r);
      return r;
    });
    const linePath = svgNode('path', { class: 'sc-tline' });
    const gapPath = svgNode('path', { class: 'sc-tline is-gap' });
    lineG.append(linePath, gapPath);
    const dotEls = temp.map((v, i) => {
      const c = svgNode('circle', { class: 'sc-dot', 'data-month': i, cx: cxOf(i), r: 5.5 });
      lineG.append(c);
      return c;
    });
    const valText = svgNode('text', { class: 'sc-val', 'text-anchor': 'middle' });
    if (fill) {
      colEls[miss].classList.add('is-miss');
      svg.append(valText);
      // Pointer: tap / drag on the missing column sets the value (snapped to the step).
      const fromPointer = (/** @type {PointerEvent} */ e) => {
        const ctm = svg.getScreenCTM();
        if (!ctm) return;
        const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
        setValue(Math.round((((YB - pt.y) / (YB - YT)) * max) / step) * step);
      };
      const col = colEls[miss];
      col.addEventListener('pointerdown', (/** @type {PointerEvent} */ e) => {
        if (done || answered()) return;
        e.preventDefault();
        col.setPointerCapture?.(e.pointerId);
        fromPointer(e);
      });
      col.addEventListener('pointermove', (/** @type {PointerEvent} */ e) => {
        if (e.buttons && !done && !answered()) fromPointer(e);
      });
    }

    const drawChart = () => {
      rain.forEach((v, i) => {
        const show = isBar && i === miss ? value : v;
        const y = yR(show);
        barEls[i].setAttribute('y', String(y));
        barEls[i].setAttribute('height', String(Math.max(0, YB - y)));
      });
      const ty = temp.map((v, i) => (mode === 'fillTemp' && i === miss ? value : v));
      // The line: solid between known points; in fillTemp the two segments at the missing point are dashed.
      const seg = (/** @type {number} */ i) => `M${cxOf(i)} ${yT(ty[i])}L${cxOf(i + 1)} ${yT(ty[i + 1])}`;
      const isGap = (/** @type {number} */ i) => mode === 'fillTemp' && (i === miss || i + 1 === miss);
      linePath.setAttribute('d', Array.from({ length: 11 }, (_, i) => (isGap(i) ? '' : seg(i))).join(''));
      gapPath.setAttribute('d', Array.from({ length: 11 }, (_, i) => (isGap(i) ? seg(i) : '')).join(''));
      dotEls.forEach((c, i) => c.setAttribute('cy', String(yT(ty[i]))));
      if (isBar) barEls[miss].classList.add('is-input');
      if (mode === 'fillTemp') dotEls[miss].classList.add('is-input');
      if (fill) {
        const y = isBar ? yR(value) : yT(value);
        valText.setAttribute('x', String(cxOf(miss)));
        valText.setAttribute('y', String(Math.max(YT - 2, y - 12)));
        valText.textContent = `${value}`;
      }
      colEls.forEach((c, i) => {
        if (!fill) {
          c.setAttribute('aria-pressed', String(i === sel));
          c.setAttribute('tabindex', i === (sel ?? 0) ? '0' : '-1');
        }
        c.classList.toggle('is-sel', i === sel);
        monEls[i].classList.toggle('is-sel', i === sel || (fill && i === miss));
      });
      root.dataset.value = String(fill ? value : (sel ?? ''));
      if (fill) valOut.textContent = `${value} ${isBar ? 'mm' : '°C'}`;
      else pickedOut.textContent = sel === null ? U('pickedNone') : cap(MONTHS[sel]);
      pickedRow?.classList.toggle('is-empty', sel === null);
    };

    // ---- the side: the picked month, or the value stepper ----
    const pickedOut = h('b', { class: 'sc-picked-val' });
    const pickedRow = fill ? null : h('p', { class: 'sc-picked' }, h('span', { text: U('picked') }), pickedOut);
    const valOut = h('output', { class: 'sc-step-val', 'aria-live': 'polite' });
    const upBtn = h(
      'button',
      { type: 'button', class: 'sc-stepbtn sc-up', 'aria-label': U('up'), onmousedown: keepFocus, onclick: () => setValue(value + step) },
      '▲',
    );
    const downBtn = h(
      'button',
      {
        type: 'button',
        class: 'sc-stepbtn sc-down',
        'aria-label': U('down'),
        onmousedown: keepFocus,
        onclick: () => setValue(value - step),
      },
      '▼',
    );
    const stepper = fill
      ? h(
          'div',
          { class: 'sc-stepper' },
          h('p', { class: 'sc-row-label', text: isBar ? U('barOf', { m: MONTHS[miss] }) : U('pointOf', { m: MONTHS[miss] }) }),
          h('div', { class: 'sc-step-row' }, downBtn, valOut, upBtn),
        )
      : null;
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark sc-check', onclick: () => check() }, U('check'));
    const table = task.table
      ? h(
          'div',
          { class: 'sc-table-wrap' },
          h(
            'table',
            { class: 'sc-table', lang },
            h(
              'thead',
              {},
              h(
                'tr',
                {},
                h('th', { scope: 'col', text: U('month') }),
                TABLE_HEAD.map((l, i) => h('th', { scope: 'col', class: fill && i === miss ? 'is-miss' : '', text: l })),
              ),
            ),
            h(
              'tbody',
              {},
              h(
                'tr',
                { class: 'is-t' },
                h('th', { scope: 'row', text: U('rowTemp') }),
                temp.map((v, i) => h('td', { class: fill && i === miss ? 'is-miss' : '', text: String(v) })),
              ),
              h(
                'tr',
                { class: 'is-r' },
                h('th', { scope: 'row', text: U('rowRain') }),
                rain.map((v, i) => h('td', { class: fill && i === miss ? 'is-miss' : '', text: String(v) })),
              ),
            ),
          ),
        )
      : null;
    const legend = h(
      'p',
      { class: 'sc-legend' },
      h('span', { class: 'sc-lg-t', text: U('tempAxis') }),
      h('span', { class: 'sc-lg-r', text: U('rainAxis') }),
    );

    const setValue = (/** @type {number} */ v) => {
      if (done || answered()) return;
      value = Math.max(0, Math.min(max, v));
      upBtn.disabled = value >= max;
      downBtn.disabled = value <= 0;
      hint.textContent = '';
      drawChart();
    };
    const choose = (/** @type {number} */ i, focus = false) => {
      if (done || answered()) return;
      if (wrongMonths.has(i)) return shake(chart);
      sel = i;
      hint.textContent = '';
      drawChart();
      if (focus || document.activeElement?.classList?.contains('sc-col'))
        /** @type {SVGElement} */ (colEls[i]).focus({ preventScroll: true });
    };
    const move = (/** @type {number} */ d) => {
      const free = MONTHS.map((_, i) => i).filter((i) => !wrongMonths.has(i));
      const at = sel === null ? (d > 0 ? -1 : free.length) : free.indexOf(sel);
      choose(free[(at + d + free.length) % free.length], document.activeElement?.classList?.contains('sc-col'));
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      if (fill) {
        const input = isBar ? barEls[miss] : dotEls[miss];
        value = /** @type {number} */ (target);
        input.classList.add(ok ? 'is-right' : 'is-fixed');
        if (!ok) root.classList.add('is-fixed');
        colEls[miss].classList.add(ok ? 'is-right' : 'is-fixed');
        upBtn.disabled = true;
        downBtn.disabled = true;
      } else {
        colEls[ans].classList.add(ok ? 'is-right' : 'is-fixed');
        sel = ans;
        for (const c of colEls) c.removeAttribute('tabindex');
      }
      drawChart();
      checkBtn.remove();
      root.classList.add('is-done');
      if (ok && !reduced()) KFG.restart(fill ? (isBar ? barEls[miss] : dotEls[miss]) : colEls[ans], 'is-pop');
      hint.textContent = ok && fill ? U('fillDone') : '';
      resolve(ok, ok ? { soft: tries > 1 } : { answer: fill ? `${target} ${isBar ? 'mm' : '°C'}` : MONTHS[ans] });
      fitFeedback(root);
    };
    const check = () => {
      if (done || answered()) return;
      if (!fill && sel === null) {
        hint.textContent = U('tapNeed');
        shake(chart);
        return;
      }
      if (fill && value === 0 && target !== 0 && tries === 0) {
        hint.textContent = U('fillZero');
        shake(stepper);
        return;
      }
      tries++;
      const ok = fill ? value === target : sel === ans;
      if (ok) return finish(true);
      if (tries >= 2) return finish(false);
      if (fill) hint.textContent = isBar ? U('fillAgainRain') : U('fillAgainTemp');
      else {
        wrongMonths.add(sel);
        colEls[sel].classList.add('is-wrong');
        colEls[sel].setAttribute('aria-disabled', 'true');
        hint.textContent = `${U('tapAgain')} ${askHint(ask)}`;
        sel = null;
      }
      shake(chart);
      drawChart();
    };

    const chart = h('div', { class: 'sc-chart', lang }, svg, legend);
    const root = h(
      'div',
      { class: `sc-climo${table ? ' has-table' : ''}`, 'data-mode': mode },
      table,
      chart,
      h(
        'div',
        { class: 'sc-climo-side' },
        pickedRow,
        stepper,
        hint,
        h('div', { class: 'sc-actions' }, checkBtn),
        kbdHint(fill ? U('kFill') : U('kTap')),
      ),
    );
    if (fill) setValue(0);
    else drawChart();
    work.append(root);
    setKeys((e) => {
      if (e.key === 'Enter') check();
      else if (fill && (e.key === 'ArrowUp' || e.key === '+')) setValue(value + step);
      else if (fill && (e.key === 'ArrowDown' || e.key === '-')) setValue(value - step);
      else if (!fill && e.key === 'ArrowRight') move(1);
      else if (!fill && e.key === 'ArrowLeft') move(-1);
      else return false;
      return true;
    });
  };

  // ---------- spot: «Detective del paisaje» — tap what people made ----------
  /** @type {ExamRenderer<SCSpotTask>} */
  const spot = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys, reduced, art } = ctx;
    const sc = art?.spotScene?.(task.scene);
    const items = /** @type {SCSpotItem[]} */ (sc?.items || []);
    const byId = Object.fromEntries(items.map((i) => [i.id, i]));
    const find = [...new Set(Array.isArray(task.find) ? task.find : [])].filter((id) => byId[id]);
    if (!sc || !find.length) {
      const yes = byId[find[0]];
      return ctx.fallback(task, work, [
        { text: yes?.name || '—', ok: true },
        ...items
          .filter((i) => !find.includes(i.id))
          .slice(0, 2)
          .map((i) => ({ text: i.name, ok: false })),
      ]);
    }
    const found = new Set();
    const wrong = new Set();
    let mistakes = 0;
    let done = false;
    const MAX_WRONG = 3;
    const hint = mkHint();
    const svg = /** @type {SVGSVGElement} */ (sc.svg);
    const badges = /** @type {SVGGElement} */ (svg.querySelector('.sc-badges'));
    /** @type {Record<string, SVGElement>} */
    const itemEl = {};
    /** @type {Record<string, SVGElement>} */
    const artEl = {};
    for (const g of svg.querySelectorAll('.sc-item-art')) {
      const id = g.getAttribute('data-id');
      artEl[id] = /** @type {SVGElement} */ (g);
      g.addEventListener('mousedown', keepFocus);
      g.addEventListener('click', () => tap(id));
    }
    // The hit circles are the buttons (in reading order = Tab order).
    for (const c of svg.querySelectorAll('.sc-hit')) {
      const id = c.getAttribute('data-id');
      itemEl[id] = /** @type {SVGElement} */ (c);
      c.setAttribute('role', 'button');
      c.setAttribute('tabindex', '0');
      c.setAttribute('aria-label', byId[id].name);
      c.addEventListener('mousedown', keepFocus);
      c.addEventListener('click', () => tap(id));
      onActivate(c, () => tap(id));
    }
    const order = [...svg.querySelectorAll('.sc-hit')].map((c) => c.getAttribute('data-id'));
    const mark = (/** @type {string} */ id, /** @type {string} */ cls) => {
      itemEl[id]?.classList.add(cls);
      artEl[id]?.classList.add(cls);
    };

    const dots = find.map(() => h('i', { class: 'sc-fdot' }));
    const counter = h(
      'p',
      { class: 'sc-found', 'aria-live': 'polite' },
      h('span', { class: 'sc-fdots', 'aria-hidden': 'true' }, dots),
      h('b', { class: 'sc-found-text' }),
    );
    const list = h('ul', { class: 'sc-found-list' });

    const badge = (/** @type {SCSpotItem} */ it, /** @type {'ok' | 'no' | 'fix'} */ kind) => {
      const w = Math.round(it.name.length * 9 + 44);
      // Above the element's middle, kept inside the 600 × 400 scene.
      const x = Math.min(600 - w / 2 - 6, Math.max(w / 2 + 6, it.x));
      const g = svgNode('g', {
        class: `sc-badge is-${kind}`,
        'data-id': it.id,
        transform: `translate(${x} ${Math.max(24, it.y - it.r * 0.62)})`,
      });
      g.innerHTML = `<rect x="${-w / 2}" y="-16" width="${w}" height="32" rx="16" class="sc-badge-bg"/><circle cx="${-w / 2 + 16}" r="11" class="sc-badge-dot"/>
        <text x="${-w / 2 + 16}" y="5" text-anchor="middle" class="sc-badge-mark">${kind === 'ok' ? '✓' : kind === 'no' ? '✗' : '!'}</text><text x="${-w / 2 + 32}" y="6" class="sc-badge-name"></text>`;
      /** @type {SVGTextElement} */ (g.querySelector('.sc-badge-name')).textContent = it.name;
      badges.append(g);
      if (!reduced()) KFG.restart(/** @type {any} */ (g), 'is-pop');
    };
    const draw = () => {
      dots.forEach((d, k) => d.classList.toggle('is-on', k < found.size));
      /** @type {HTMLElement} */ (counter.lastChild).textContent = U('found', { n: found.size, total: find.length });
    };
    const finish = (/** @type {boolean} */ ok) => {
      done = true;
      const left = find.filter((id) => !found.has(id));
      for (const id of left) {
        mark(id, 'is-fixed');
        badge(byId[id], 'fix');
      }
      for (const c of Object.values(itemEl)) c.removeAttribute('tabindex');
      root.classList.add('is-done');
      hint.textContent = ok ? U('spotAll') : left.length ? U('spotShown') : '';
      const names = listEs(find.map((id) => byId[id].name.toLowerCase()));
      resolve(ok, ok ? { soft: mistakes > 0 } : task.fact ? {} : { answer: cap(names) });
      fitFeedback(root);
    };
    const tap = (/** @type {string} */ id) => {
      if (done || answered()) return;
      const it = byId[id];
      if (found.has(id) || wrong.has(id)) return shake(/** @type {any} */ (itemEl[id]));
      if (find.includes(id)) {
        found.add(id);
        mark(id, 'is-right');
        badge(it, 'ok');
        list.append(h('li', { text: it.name }));
        hint.textContent = U('spotYes', { name: it.name });
        draw();
        if (found.size === find.length) finish(mistakes <= 1);
        return;
      }
      wrong.add(id);
      mistakes++;
      mark(id, 'is-wrong');
      badge(it, 'no');
      hint.textContent = it.human ? U('spotHuman', { name: it.name }) : U('spotNatural', { name: it.name });
      if (mistakes >= MAX_WRONG) finish(false);
    };
    const move = (/** @type {number} */ d) => {
      const live = order.filter((id) => !found.has(id) && !wrong.has(id));
      if (!live.length) return;
      const cur = live.indexOf(/** @type {Element} */ (document.activeElement)?.getAttribute?.('data-id'));
      const next = live[cur < 0 ? (d > 0 ? 0 : live.length - 1) : (cur + d + live.length) % live.length];
      itemEl[next].focus({ preventScroll: true });
    };

    const root = h(
      'div',
      { class: 'sc-spot', 'data-scene': task.scene },
      h('div', { class: 'sc-spot-scene' }, svg),
      h('div', { class: 'sc-spot-side' }, counter, list, hint, kbdHint(U('kSpot'))),
    );
    draw();
    work.append(root);
    setKeys((e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(-1);
      else return false;
      return true;
    });
  };

  // ---------- content check (unit tests) ----------
  /**
   * Errors in the tasks of the three own types (the engine's validate skips them); with `art`, also every art key, picture option,
   * label scene (and its hotspots) and spot scene. [] = fine.
   * @param {ExamUnit} unit
   * @param {ExamArt} [art]
   * @returns {string[]}
   */
  const check = (unit, art) => {
    /** @type {string[]} */
    const errs = [];
    const txt = (/** @type {any} */ x) => typeof x === 'string' && x.trim() !== '';
    const uniq = (/** @type {any[]} */ xs) => new Set(xs).size === xs.length;
    const cyr = (/** @type {any} */ t) =>
      ['q', 'fact', 'text', 'listen', 'place'].some((k) => CYRILLIC.test(String(t[k] ?? ''))) ||
      (Array.isArray(t.tokens) && t.tokens.some((/** @type {any} */ x) => CYRILLIC.test(String(x?.label ?? ''))));
    const used = new Set();
    for (const s of unit?.stations || [])
      s.tasks.forEach((/** @type {any} */ t, ti) => {
        const w = `station ${s.id} task ${ti + 1} (${t.type})`;
        const err = (/** @type {string} */ m) => errs.push(`${w}: ${m}`);
        if (art) {
          if (t.art && !art.has?.(t.art)) err(`no art «${t.art}»`);
          if (t.type === 'choice' && t.pics) for (const k of t.options || []) if (!art.has?.(k)) err(`no picture «${k}»`);
          if (t.type === 'label') {
            const sc = art.scene?.(t.scene);
            if (!sc) err(`no label scene «${t.scene}»`);
            else
              for (const l of t.labels || [])
                if (!sc.spots.some((/** @type {{ id: string }} */ p) => p.id === l.id)) err(`scene «${t.scene}» has no spot «${l.id}»`);
          }
        }
        if (!['spainMap', 'climograma', 'spot'].includes(t.type)) return;
        used.add(t.type);
        if (!txt(t.q)) err('q missing');
        if (cyr(t)) err('Cyrillic in the task (it is in Spanish)');
        switch (t.type) {
          case 'spainMap': {
            const mode = t.mode;
            if (mode !== 'weather' && mode !== 'climate') err(`mode must be weather or climate, not «${mode}»`);
            const tokens = Array.isArray(t.tokens) ? t.tokens : [];
            const ids = tokens.map((/** @type {any} */ x) => x?.id);
            if (tokens.length < 2 || tokens.length > 5) err('tokens must be 2–5');
            if (!ids.every(txt)) err('every token needs an id');
            if (!uniq(ids)) err('token ids must be unique');
            for (const x of tokens) {
              if (!txt(x?.label)) err(`token «${x?.id}» needs a label`);
              if (mode === 'weather' && !WEATHER_IDS.includes(x?.id) && !WEATHER_EMOJI.includes(x?.icon))
                err(`weather token «${x?.id}» has no symbol (id one of ${WEATHER_IDS.join(', ')}, or a known icon)`);
              if (mode === 'climate') {
                if (!/^#[0-9a-f]{6}$/i.test(String(x?.color ?? ''))) err(`climate token «${x?.id}» needs a colour #rrggbb`);
                if (/monta/i.test(`${x?.id} ${x?.label}`)) err('«de montaña» does not follow the regions: ask it with choice / tf');
              }
            }
            const ans = t.answer && typeof t.answer === 'object' ? Object.entries(t.answer) : [];
            if (ans.length < 2 || ans.length > 6) err('answer must ask 2–6 regions');
            /** @type {Record<string, string>} */
            const tokenOfGroup = {};
            /** @type {Record<string, string>} */
            const groupOfToken = {};
            for (const [region, token] of ans) {
              if (!REGION_IDS.includes(region)) err(`no region «${region}» (ids: ${REGION_IDS.join(', ')})`);
              if (!ids.includes(token)) err(`answer «${region}»: no token «${token}»`);
              if (mode !== 'climate') continue;
              const group = CLIMATE_OF[region];
              if (!group) {
                err(`region «${region}» is not asked in climate mode (its climate is not clear-cut)`);
                continue;
              }
              if (Object.values(CLIMATE_OF).includes(token) && token !== group) err(`«${region}» is ${group}, not ${token}`);
              if (tokenOfGroup[group] && tokenOfGroup[group] !== token) err(`«${region}»: one climate, two tokens`);
              if (groupOfToken[token] && groupOfToken[token] !== group) err(`token «${token}» on two different climates`);
              tokenOfGroup[group] = token;
              groupOfToken[token] = group;
            }
            if (mode === 'weather' && !txt(t.text) && !txt(t.listen)) err('a weather map needs the forecast: text or listen');
            break;
          }
          case 'climograma': {
            const mode = t.mode;
            if (!['tapMonth', 'fillBar', 'fillTemp'].includes(mode)) err(`mode must be tapMonth, fillBar or fillTemp, not «${mode}»`);
            const okT = nums12(t.temp);
            const okR = nums12(t.rain);
            if (!okT) err('temp must be 12 numbers');
            else if (t.temp.some((/** @type {number} */ v) => v < 0 || v > T_MAX)) err(`temp values must be 0–${T_MAX} °C`);
            if (!okR) err('rain must be 12 numbers');
            else if (t.rain.some((/** @type {number} */ v) => v < 0 || v > R_MAX)) err(`rain values must be 0–${R_MAX} mm`);
            if (!okT || !okR) break;
            if (mode === 'tapMonth') {
              if (!(Number.isInteger(t.answer) && t.answer >= 0 && t.answer < 12)) {
                err('answer must be a month index 0–11');
                break;
              }
              const a = askOf(t);
              if (!a) {
                err(
                  "can't tell what q asks: set ask ('maxTemp' | 'minTemp' | 'maxRain' | 'minRain') or say más / menos + calor / frío / lluvia",
                );
                break;
              }
              const vals = a.what === 'temp' ? t.temp : t.rain;
              const best = a.dir === 'max' ? Math.max(...vals) : Math.min(...vals);
              const at = vals.map((/** @type {number} */ v, /** @type {number} */ i) => (v === best ? i : -1)).filter((i) => i >= 0);
              if (at.length > 1) err(`${a.dir} ${a.what} is not unique (months ${at.join(', ')})`);
              else if (at[0] !== t.answer) err(`the ${a.dir} ${a.what} is month ${at[0]}, not ${t.answer}`);
            } else if (mode === 'fillBar' || mode === 'fillTemp') {
              if (!(Number.isInteger(t.missing) && t.missing >= 0 && t.missing < 12)) {
                err('missing must be a month index 0–11');
                break;
              }
              const bar = mode === 'fillBar';
              const v = bar ? t.rain[t.missing] : t.temp[t.missing];
              const st = bar ? R_STEP : T_STEP;
              if (v % st !== 0) err(`the missing value ${v} is not a multiple of ${st} (the ▲▼ step)`);
              if (!t.table && !String(t.q).includes(String(v))) err('without table: true the q must give the missing value');
            }
            if (t.table !== undefined && typeof t.table !== 'boolean') err('table must be true / false');
            break;
          }
          case 'spot': {
            const find = Array.isArray(t.find) ? t.find : [];
            if (!txt(t.scene)) err('scene missing');
            if (!find.length || !find.every(txt)) err('find must be 1+ element ids');
            if (!uniq(find)) err('find ids must be unique');
            if (!art) break;
            const items = art.spotItems?.(t.scene) ?? art.spotScene?.(t.scene)?.items ?? null;
            if (!items) {
              err(`no spot scene «${t.scene}»`);
              break;
            }
            const ids = items.map((/** @type {SCSpotItem} */ i) => i.id);
            for (const id of find) if (!ids.includes(id)) err(`scene «${t.scene}» has no element «${id}»`);
            const want = HUMAN_Q.test(t.q) ? true : NATURAL_Q.test(t.q) ? false : null;
            if (want !== null) {
              const exp = items.filter((/** @type {SCSpotItem} */ i) => i.human === want).map((/** @type {SCSpotItem} */ i) => i.id);
              const missing = exp.filter((/** @type {string} */ id) => !find.includes(id));
              const extra = find.filter((/** @type {string} */ id) => !exp.includes(id));
              if (missing.length || extra.length)
                err(
                  `q asks for ${want ? 'what people made' : 'what is natural'}: missing ${missing.join(', ') || '—'}, extra ${extra.join(', ') || '—'}`,
                );
            }
            break;
          }
        }
      });
    if (art) {
      if (used.has('spainMap') && typeof art.map !== 'function') errs.push('art: no map() for spainMap');
      if (used.has('spot') && typeof art.spotScene !== 'function') errs.push('art: no spotScene() for spot');
    }
    return errs;
  };

  window.SC_TYPES = { spainMap, climograma, spot };
  window.SC_CHECK = check;
})();
