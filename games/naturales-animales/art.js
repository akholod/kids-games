// Drawings for «Expedición safari» (Ciencias de la Naturaleza 3.º, Unidad 2 «Animales por aquí y por allá»): animal photos (`art`,
// 240 × 180 cards on their habitat, the explorer's camera shots), three skulls for the teeth station and the hub hero — a jeep over
// the explorer's notebook: every passed station sticks its photo in the notebook.
// Same friendly cartoon style as games/english-animals/art.js (flat colours, a warm dark outline); nine of its animals (rana,
// serpiente, lagarto, lombriz, mariposa, arana, escorpion, delfin, perro) are ported into this file, so it needs no other art file.
// Our own drawings, never copies of the book.
// No DOM at load time (the unit tests may load this file in a vm).
// window.NAArt = { art(key), hero(passed?), scene(name), keys(), has(key), name(key) }
//   art keys = Spanish names without accents, hyphens between words (estrella-mar); `craneo-herbivoro | -carnivoro | -omnivoro`.
// @ts-check
'use strict';

window.NAArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `na${++uidN}`;

    // ---------------- Tiny SVG builder (the english-animals one) ----------------
    /** @typedef {Record<string, string | number | null | undefined | false>} Attrs */
    /** @returns {SVGElement} */
    const el = (/** @type {string} */ tag, /** @type {Attrs} */ a = {}, /** @type {any[]} */ ...kids) => {
      const e = /** @type {SVGElement} */ (document.createElementNS(NS, tag));
      for (const [k, v] of Object.entries(a)) if (v !== null && v !== undefined && v !== false) e.setAttribute(k, String(v));
      for (const k of kids.flat(Infinity)) if (k || k === 0) e.append(typeof k === 'number' ? String(k) : k);
      return e;
    };
    const g = (/** @type {Attrs} */ a, /** @type {any[]} */ ...kids) => el('g', a, ...kids);
    const path = (/** @type {string} */ d, /** @type {string} */ fill, /** @type {Attrs} */ a = {}) => el('path', { d, fill, ...a });
    const circ = (
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ r,
      /** @type {string} */ fill,
      /** @type {Attrs} */ a = {},
    ) => el('circle', { cx, cy, r, fill, ...a });
    const ell = (
      /** @type {number} */ cx,
      /** @type {number} */ cy,
      /** @type {number} */ rx,
      /** @type {number} */ ry,
      /** @type {string} */ fill,
      /** @type {Attrs} */ a = {},
    ) => el('ellipse', { cx, cy, rx, ry, fill, ...a });
    const rect = (
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {number} */ width,
      /** @type {number} */ height,
      /** @type {number} */ rx,
      /** @type {string} */ fill,
      /** @type {Attrs} */ a = {},
    ) => el('rect', { x, y, width, height, rx, fill, ...a });
    const line = (/** @type {string} */ d, /** @type {string} */ stroke, /** @type {number} */ w, /** @type {Attrs} */ a = {}) =>
      el('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...a });
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, /** @type {any} */ kids, flip = false) =>
      g({ transform: `translate(${+x.toFixed(2)} ${+y.toFixed(2)}) scale(${+(flip ? -s : s).toFixed(3)} ${+s.toFixed(3)})` }, kids);
    const grad = (/** @type {string} */ id, /** @type {string} */ a, /** @type {string} */ b) =>
      el(
        'linearGradient',
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        el('stop', { offset: 0, 'stop-color': a }),
        el('stop', { offset: 1, 'stop-color': b }),
      );
    const svgEl = (/** @type {string} */ viewBox, /** @type {string} */ cls, /** @type {any[]} */ ...kids) =>
      el('svg', { viewBox, class: cls, 'aria-hidden': 'true', focusable: 'false' }, ...kids);

    // ---------------- Style ----------------
    const INK = '#2e2622';
    const OUT = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    const NO = { stroke: 'none' };
    const limb = (/** @type {string} */ d, /** @type {string} */ c, /** @type {number} */ w, /** @type {Attrs} */ a = {}) =>
      g(a, line(d, INK, w + 5), line(d, c, w));
    const eye = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, look = 0.3) =>
      g(
        {},
        circ(x, y, r, '#fff'),
        circ(x + r * look, y + r * 0.08, r * 0.56, INK, NO),
        circ(x + r * look + r * 0.22, y - r * 0.24, r * 0.2, '#fff', NO),
      );
    /** A small black bead eye (birds, insects). */
    const bead = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r) =>
      g({}, circ(x, y, r, INK, NO), circ(x + r * 0.35, y - r * 0.35, r * 0.32, '#fff', NO));
    const cheek = (/** @type {number} */ x, /** @type {number} */ y, r = 4.5) => ell(x, y, r, r * 0.62, '#f5a3a0', { ...NO, opacity: 0.8 });
    /** A straight leg with a foot, top (x, y0) to the ground. */
    const leg = (/** @type {number} */ x, /** @type {number} */ y0, /** @type {number} */ w, /** @type {string} */ c, foot = INK, y1 = 0) =>
      g(
        {},
        path(`M${x - w / 2} ${y0} L${x - w / 2} ${y1 - 1} L${x + w / 2} ${y1 - 1} L${x + w / 2} ${y0}Z`, c),
        rect(x - w / 2 - 1, y1 - 7, w + 2, 7, 2, foot),
      );
    const tuft = (/** @type {number} */ x, /** @type {number} */ y, c = '#6fb04a') =>
      line(`M${x - 5} ${y}l-2 -8M${x} ${y}l0 -10M${x + 5} ${y}l2 -8`, c, 2);

    // Palette: savanna ochre, leaf green, sky, kraft.
    const OCH = '#e8b04a';
    const OCH_D = '#c98a2e';
    const YEL = '#ffd23f';
    const ORA = '#f28a2e';
    const GRN_L = '#7cc44a';
    // Colours and pose of the drawings ported from games/english-animals/art.js.
    const E_G = '#5cbf4a';
    const E_GD = '#3d9a38';
    const E_OR = '#f28a2e';
    const E_ORD = '#c9601c';
    /** @type {{ open?: boolean, shut?: boolean, long?: boolean, keeper?: boolean }} */
    const POSE = {};
    const eyeP = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, /** @type {any} */ _o, look = 0.3) =>
      eye(x, y, r, look);

    // ---------------- The animals ----------------
    // Each faces right, origin = the middle of the ground under it (y up is negative). box = [left, right, top] in its own units.
    // fly: drawn in the middle of the card (no ground under it).
    /** @typedef {{ hab: string, box: [number, number, number], fly?: boolean, max?: number, draw: (o?: any) => SVGElement }} Animal */
    /** @type {Record<string, Animal>} */
    const ANIMALS = {
      vaca: {
        hab: 'farm',
        box: [-66, 88, -114],
        draw: () => {
          const W = '#fbf8f2';
          const S = '#ddd6ca';
          const P = '#f4a9b6';
          return g(
            OUT,
            leg(-24, -40, 11, S),
            leg(40, -40, 11, S),
            limb('M-50 -70 Q-64 -54 -60 -28', W, 4),
            ell(-60, -24, 5, 8, INK),
            path('M-52 -74 Q-56 -38 -44 -34 L46 -34 Q56 -38 54 -74 Q44 -88 -40 -88 Q-50 -86 -52 -74Z', W),
            g(
              NO,
              path('M-36 -86 Q-16 -90 -12 -76 Q-14 -60 -32 -64 Q-46 -72 -36 -86Z', INK),
              path('M6 -87 Q30 -90 33 -74 Q30 -60 14 -64 Q0 -72 6 -87Z', INK),
              path('M-50 -56 Q-38 -54 -38 -44 Q-44 -36 -50 -38Z', INK),
            ),
            ell(16, -32, 11, 6, P),
            leg(-40, -42, 12, W),
            leg(24, -42, 12, W),
            path('M46 -96 Q58 -110 76 -102 Q86 -86 84 -70 L54 -68 Q44 -82 46 -96Z', W),
            path('M52 -104 Q44 -116 50 -118 Q54 -110 60 -106Z', '#f2e2b8'),
            path('M72 -106 Q78 -118 86 -114 Q80 -110 78 -102Z', '#f2e2b8'),
            ell(42, -94, 10, 5, W, { transform: 'rotate(-18 42 -94)' }),
            ell(74, -66, 16, 11, P),
            g(NO, ell(69, -66, 2.4, 3, INK), ell(79, -66, 2.4, 3, INK)),
            eye(66, -88, 5),
            line('M64 -56 Q70 -53 78 -56', INK, 2),
          );
        },
      },
      conejo: {
        hab: 'land',
        box: [-52, 52, -118],
        draw: () => {
          const C = '#c9b29a';
          const L = '#efe3d3';
          return g(
            OUT,
            circ(-42, -34, 10, '#fff'),
            ell(-8, -32, 36, 30, C),
            ell(-4, -24, 20, 18, L, NO),
            ell(-14, -5, 24, 7, C),
            g({ transform: 'rotate(-12 12 -94)' }, ell(12, -94, 8, 26, C), ell(12, -92, 3.6, 18, '#f5b0b8', NO)),
            g({ transform: 'rotate(14 34 -92)' }, ell(34, -92, 8, 26, C), ell(34, -90, 3.6, 18, '#f5b0b8', NO)),
            circ(26, -60, 22, C),
            ell(36, -52, 11, 8, L, NO),
            ell(20, -6, 9, 5, C),
            eye(30, -66, 5.4),
            path('M44 -57 L49 -57 L46.5 -53Z', '#e86a7d', { 'stroke-width': 1.6 }),
            line('M46 -53 Q46 -48 42 -47 M46 -53 Q47 -48 51 -48', INK, 1.8),
            line('M50 -55 L62 -58 M50 -52 L62 -51', INK, 1.4, { opacity: 0.6 }),
            cheek(22, -50),
          );
        },
      },
      caballo: {
        hab: 'farm',
        box: [-76, 90, -128],
        draw: () => {
          const B = '#a8652f';
          const F = '#8a5226';
          const M = '#4a2c1a';
          return g(
            OUT,
            leg(-30, -54, 9, F, '#3b2a20'),
            leg(40, -54, 9, F, '#3b2a20'),
            path('M-52 -72 Q-74 -62 -70 -28 Q-62 -40 -58 -60Z', M),
            ell(-4, -66, 52, 24, B),
            leg(-44, -54, 10, B, '#3b2a20'),
            leg(26, -54, 10, B, '#3b2a20'),
            path('M28 -78 Q38 -104 54 -116 L72 -102 Q58 -88 52 -62Z', B),
            path('M54 -118 Q66 -128 76 -116 L90 -90 Q90 -78 80 -78 Q68 -80 60 -96Z', B),
            path('M56 -118 L54 -132 L64 -122Z', B),
            path('M54 -116 Q38 -104 28 -78 Q32 -96 26 -96 Q36 -110 48 -122Z', M),
            ell(84, -84, 7, 6, '#c98a5a', NO),
            circ(86, -86, 1.8, INK, NO),
            eye(68, -108, 4.4),
            line('M76 -80 Q82 -78 88 -80', INK, 2),
          );
        },
      },
      leon: {
        hab: 'savanna',
        box: [-80, 84, -110],
        draw: () => {
          const M = '#b8642a';
          return g(
            OUT,
            leg(-28, -40, 11, OCH_D, OCH_D),
            leg(36, -40, 11, OCH_D, OCH_D),
            limb('M-46 -56 Q-70 -50 -72 -78', OCH, 5),
            ell(-74, -82, 7, 9, M),
            ell(-6, -50, 48, 22, OCH),
            ell(-2, -38, 30, 10, '#f3cd7c', NO),
            leg(-42, -40, 12, OCH, OCH),
            leg(22, -40, 12, OCH, OCH),
            g(
              {},
              [0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) =>
                circ(46 + 28 * Math.cos((a * Math.PI) / 180), -72 + 28 * Math.sin((a * Math.PI) / 180), 13, M),
              ),
              circ(46, -72, 30, M, NO),
            ),
            circ(32, -96, 7, OCH),
            circ(64, -96, 7, OCH),
            circ(50, -72, 21, '#f0c060'),
            ell(60, -62, 12, 9, '#fbe3b0'),
            path('M56 -70 L66 -70 L61 -64Z', '#5a3a28', { 'stroke-width': 2 }),
            line('M61 -64 Q61 -58 56 -57 M61 -64 Q62 -58 67 -58', INK, 2),
            eye(48, -78, 4.6),
            eye(62, -78, 4.6),
            cheek(42, -62, 4),
          );
        },
      },
      leopardo: {
        hab: 'savanna',
        box: [-96, 76, -90],
        draw: () => {
          const C = '#f0b84a';
          const S = '#6a3e1a';
          const spots = [
            [-30, -56],
            [-16, -48],
            [-2, -58],
            [12, -48],
            [-40, -44],
            [24, -58],
            [-22, -64],
            [4, -66],
          ];
          return g(
            OUT,
            leg(-28, -34, 9, OCH_D, OCH_D),
            leg(30, -34, 9, OCH_D, OCH_D),
            limb('M-44 -48 Q-80 -40 -82 -70 Q-84 -84 -94 -84', C, 6),
            ell(-6, -48, 44, 17, C),
            ell(-4, -37, 30, 7, '#f8dfa6', NO),
            g(
              { stroke: S, 'stroke-width': 2.2 },
              spots.map(([x, y]) => circ(x, y, 3.6, '#c98a2e')),
            ),
            leg(-40, -34, 10, C, C),
            leg(18, -34, 10, C, C),
            path('M30 -58 Q38 -72 48 -74 L54 -54 Q42 -46 32 -46Z', C),
            circ(54, -66, 16, C),
            path('M42 -78 L42 -88 L50 -80Z', C),
            path('M58 -81 L64 -90 L66 -78Z', C),
            ell(64, -58, 9, 7, '#f8dfa6'),
            path('M62 -64 L70 -64 L66 -59Z', '#5a3a28', { 'stroke-width': 1.8 }),
            g(NO, circ(46, -58, 2, S), circ(40, -66, 1.8, S), circ(50, -52, 1.6, S)),
            eye(58, -70, 4.2),
          );
        },
      },
      lobo: {
        hab: 'forest',
        box: [-84, 90, -104],
        draw: () => {
          const C = '#8a929a';
          const L = '#d7dbe0';
          const F = '#6f7780';
          return g(
            OUT,
            leg(-26, -40, 9, F, '#4a4f55'),
            leg(36, -40, 9, F, '#4a4f55'),
            path('M-44 -60 Q-72 -56 -82 -30 Q-66 -34 -56 -40 Q-50 -48 -42 -50Z', C),
            path('M-74 -36 Q-80 -32 -82 -30 Q-74 -30 -70 -33Z', L, NO),
            ell(-4, -52, 46, 20, C),
            ell(0, -40, 30, 8, L, NO),
            leg(-40, -40, 10, C, '#4a4f55'),
            leg(22, -40, 10, C, '#4a4f55'),
            path('M28 -60 Q34 -80 50 -84 L60 -60 Q46 -46 30 -46Z', C),
            path('M44 -88 Q56 -98 66 -88 L90 -74 Q90 -64 80 -64 L52 -62 Q40 -70 44 -88Z', C),
            path('M48 -64 L80 -64 Q86 -64 88 -70 Q70 -70 52 -72Z', L, NO),
            path('M46 -88 L44 -104 L56 -92Z', C),
            path('M56 -92 L60 -106 L66 -90Z', C),
            ell(88, -74, 4, 3.4, INK),
            line('M74 -66 Q80 -64 86 -66', INK, 2),
            eye(62, -82, 4.4),
          );
        },
      },
      zorro: {
        hab: 'forest',
        box: [-96, 80, -90],
        draw: () => {
          const C = ORA;
          const W = '#fff6ea';
          const D = '#3b2a20';
          return g(
            OUT,
            leg(-24, -32, 8, D, D),
            leg(32, -32, 8, D, D),
            path('M-40 -50 Q-80 -60 -96 -36 Q-88 -16 -60 -26 Q-48 -32 -40 -40Z', C),
            path('M-86 -24 Q-96 -30 -96 -36 Q-90 -20 -76 -22Z', W),
            ell(-4, -44, 42, 16, C),
            leg(-36, -32, 9, C, D),
            leg(20, -32, 9, C, D),
            path('M28 -54 Q34 -66 46 -68 L52 -46 Q40 -40 30 -40Z', C),
            path('M34 -48 Q44 -44 52 -46 Q46 -36 36 -38Z', W, NO),
            path('M44 -74 Q56 -82 64 -72 L80 -60 Q80 -54 72 -54 L50 -52 Q38 -60 44 -74Z', C),
            path('M50 -54 L74 -54 Q80 -54 80 -58 Q64 -60 50 -62Z', W, NO),
            path('M46 -74 L44 -90 L56 -78Z', C),
            path('M56 -78 L62 -92 L66 -76Z', C),
            ell(79, -60, 3.4, 3, INK),
            eye(60, -68, 4),
          );
        },
      },
      oso: {
        hab: 'forest',
        box: [-74, 82, -112],
        draw: () => {
          const C = '#7a4a2a';
          const L = '#c8946a';
          const F = '#63391e';
          return g(
            OUT,
            path('M-30 -44 L-30 -2 L-12 -2 L-12 -44Z', F),
            path('M30 -44 L30 -2 L48 -2 L48 -44Z', F),
            path('M-64 -48 Q-70 -100 -10 -104 Q50 -106 56 -60 Q56 -40 40 -36 L-50 -36 Q-64 -38 -64 -48Z', C),
            path('M-58 -44 L-58 -2 L-36 -2 L-36 -44Z', C),
            path('M14 -44 L14 -2 L36 -2 L36 -44Z', C),
            g(NO, ell(-47, -3, 10, 3.4, L), ell(25, -3, 10, 3.4, L)),
            circ(54, -76, 26, C),
            circ(40, -100, 9, C),
            circ(68, -98, 8, C),
            circ(40, -100, 4, L, NO),
            ell(70, -66, 13, 10, L),
            ell(78, -70, 5.4, 4, INK),
            line('M68 -58 Q74 -55 80 -58', INK, 2),
            eye(58, -84, 4.6),
            cheek(48, -66),
          );
        },
      },
      ardilla: {
        hab: 'forest',
        box: [-62, 46, -116],
        draw: () => {
          const C = '#c9692a';
          const L = '#f4d2a6';
          return g(
            OUT,
            path('M-16 -14 Q-60 -10 -60 -56 Q-60 -96 -30 -110 Q-10 -116 -6 -100 Q-24 -96 -30 -76 Q-34 -46 -6 -34Z', C),
            path('M-30 -104 Q-44 -92 -48 -70', 'none', { stroke: '#e48a4a', 'stroke-width': 4, opacity: 0.8 }),
            ell(4, -30, 22, 26, C),
            ell(8, -26, 12, 16, L, NO),
            ell(-2, -5, 18, 6, C),
            circ(18, -64, 18, C),
            path('M8 -78 L10 -92 L18 -80Z', C),
            ell(30, -58, 8, 6, L, NO),
            ell(36, -62, 3, 2.4, INK),
            eye(24, -68, 4.4),
            ell(24, -34, 7, 9, '#8a5a32'),
            path('M17 -40 Q24 -48 31 -40Z', '#5a3a28', { 'stroke-width': 2 }),
            limb('M14 -36 Q20 -30 22 -34', C, 4),
            cheek(16, -56, 3.6),
          );
        },
      },
      gallina: {
        hab: 'farm',
        box: [-52, 58, -108],
        draw: () => {
          const W = '#fbf6ee';
          const R = '#e2453c';
          return g(
            OUT,
            limb('M-2 -26 L-4 -2', '#f2a634', 4),
            limb('M12 -26 L14 -2', '#f2a634', 4),
            line('M-10 -1 L4 -1 M8 -1 L22 -1', '#d98a10', 3),
            path(
              'M-26 -56 Q-56 -66 -52 -94 Q-42 -84 -36 -84 Q-44 -98 -32 -104 Q-26 -90 -20 -86 Q-22 -100 -10 -100 Q-8 -80 -12 -66Z',
              '#efe5d4',
            ),
            path('M-34 -56 Q-40 -20 4 -20 Q40 -20 40 -52 L34 -82 Q24 -90 14 -78 Q2 -62 -34 -56Z', W),
            path('M-16 -50 Q4 -54 18 -40 Q4 -30 -14 -36Z', '#ece4d4'),
            path('M22 -88 Q26 -100 32 -94 Q36 -104 42 -96 Q48 -100 46 -88Z', R),
            circ(34, -78, 14, W),
            path('M46 -80 L58 -76 L46 -72Z', '#f2a634'),
            path('M44 -70 Q48 -58 42 -58 Q38 -62 40 -70Z', R),
            bead(38, -82, 3),
          );
        },
      },
      aguila: {
        hab: 'sky',
        fly: true,
        box: [-96, 96, -96],
        draw: () => {
          const B = '#6b4428';
          const D = '#4e2f1a';
          return g(
            OUT,
            path('M-8 -46 Q-40 -74 -96 -86 Q-84 -74 -88 -66 Q-74 -64 -76 -54 Q-58 -54 -56 -44 Q-34 -46 -14 -36Z', B),
            path('M8 -46 Q40 -74 96 -86 Q84 -74 88 -66 Q74 -64 76 -54 Q58 -54 56 -44 Q34 -46 14 -36Z', B),
            g(NO, line('M-80 -72 L-66 -66 M-66 -64 L-54 -58 M80 -72 L66 -66 M66 -64 L54 -58', D, 2.4)),
            path('M-10 -10 L0 0 L10 -10 Q6 -18 0 -18 Q-6 -18 -10 -10Z', '#fff'),
            ell(0, -38, 16, 26, B),
            circ(0, -70, 13, '#fff'),
            path('M6 -72 Q18 -72 18 -62 Q14 -64 8 -62Z', '#ffc23a'),
            bead(4, -74, 2.6),
            limb('M-6 -16 L-8 -8', '#ffc23a', 3),
            limb('M6 -16 L8 -8', '#ffc23a', 3),
          );
        },
      },
      buitre: {
        hab: 'savanna',
        box: [-54, 60, -112],
        draw: () => {
          const B = '#5a4436';
          const D = '#3e2e24';
          return g(
            OUT,
            path('M-40 -2 Q-30 -22 0 -22 Q34 -22 44 -2Z', '#a8967e'),
            limb('M-4 -30 L-6 -20', '#9a8f86', 4),
            limb('M10 -30 L12 -20', '#9a8f86', 4),
            path('M-24 -40 L-52 -12 L-36 -14 L-14 -30Z', D),
            path('M-26 -50 Q-30 -88 0 -90 Q28 -90 24 -54 Q20 -30 0 -28 Q-22 -28 -26 -50Z', B),
            path('M-22 -60 Q-6 -66 16 -56 Q6 -36 -18 -40Z', D, NO),
            path('M-6 -86 Q4 -96 16 -88 Q20 -80 10 -78 Q-2 -78 -6 -86Z', '#f4ecdf'),
            limb('M8 -88 Q12 -100 22 -102', '#e8a8a0', 6),
            circ(26, -102, 10, '#e8a8a0'),
            path('M32 -106 Q44 -104 44 -94 Q40 -96 34 -96Z', '#d9c9a8'),
            bead(28, -105, 2.4),
          );
        },
      },
      pinguino: {
        hab: 'ice',
        box: [-38, 46, -110],
        draw: () =>
          g(
            OUT,
            ell(-10, -3, 12, 4.4, '#f2a634'),
            ell(12, -3, 12, 4.4, '#f2a634'),
            path('M-26 -40 Q-30 -100 6 -104 Q36 -104 32 -60 Q32 -10 4 -6 Q-24 -6 -26 -40Z', '#2c3440'),
            path('M-12 -44 Q-12 -76 8 -78 Q24 -76 22 -48 Q22 -14 6 -12 Q-12 -14 -12 -44Z', '#fbfbfb', NO),
            path('M-24 -60 Q-38 -40 -32 -24 Q-22 -34 -20 -48Z', '#2c3440'),
            path('M26 -92 L44 -86 L26 -82Z', ORA),
            eye(18, -90, 4.4),
            ell(22, -80, 5, 3, '#ffd5a0', { ...NO, opacity: 0.7 }),
          ),
      },
      murcielago: {
        hab: 'night',
        fly: true,
        box: [-96, 96, -74],
        draw: () => {
          const B = '#5b4a5e';
          const W = '#7a6880';
          return g(
            OUT,
            path('M-10 -46 Q-40 -74 -96 -66 Q-90 -54 -94 -40 Q-80 -46 -72 -34 Q-62 -44 -50 -30 Q-40 -42 -26 -28 Q-18 -36 -10 -30Z', W),
            path('M10 -46 Q40 -74 96 -66 Q90 -54 94 -40 Q80 -46 72 -34 Q62 -44 50 -30 Q40 -42 26 -28 Q18 -36 10 -30Z', W),
            g(NO, line('M-14 -44 L-60 -60 M-16 -40 L-46 -38 M14 -44 L60 -60 M16 -40 L46 -38', '#4a3a4e', 1.6)),
            ell(0, -36, 14, 20, B),
            path('M-12 -60 L-16 -74 L-4 -62Z', B),
            path('M12 -60 L16 -74 L4 -62Z', B),
            circ(0, -52, 12, B),
            eye(-5, -54, 4, 0.1),
            eye(5, -54, 4, 0.1),
            path('M-3 -45 L-1.6 -41 L-0.6 -45 M0.6 -45 L1.6 -41 L3 -45', '#fff', { 'stroke-width': 1.2 }),
            ell(0, -46, 2.4, 1.4, '#e8a0b0', NO),
          );
        },
      },
      ballena: {
        hab: 'under',
        fly: true,
        box: [-112, 100, -80],
        draw: () => {
          const B = '#3f6fa8';
          const L = '#cfe2f2';
          return g(
            OUT,
            path('M-70 -40 Q-96 -54 -112 -70 Q-100 -72 -92 -64 Q-96 -76 -86 -80 Q-84 -62 -66 -50Z', B),
            path('M-74 -44 Q-40 -80 30 -78 Q100 -76 100 -40 Q100 -14 60 -8 Q-10 -4 -74 -44Z', B),
            path('M-40 -26 Q20 -8 70 -12 Q92 -16 98 -32 Q60 -24 -40 -26Z', L, NO),
            g(NO, line('M-10 -18 L60 -16 M0 -12 L50 -10', '#9fbdd8', 1.6)),
            path('M28 -24 Q20 -8 6 -4 Q14 -18 12 -26Z', B),
            line('M70 -30 Q84 -26 96 -32', INK, 2.4),
            eye(64, -44, 4.4),
            cheek(76, -36),
          );
        },
      },
      tiburon: {
        hab: 'under',
        fly: true,
        box: [-104, 100, -70],
        draw: () => {
          const B = '#7d8fa0';
          const W = '#eef2f5';
          return g(
            OUT,
            path('M-64 -36 L-102 -64 Q-96 -40 -92 -36 Q-96 -26 -104 -10Z', B),
            path('M-4 -48 Q4 -70 18 -72 Q12 -58 16 -46Z', B),
            path('M-70 -36 Q-30 -56 30 -50 Q80 -46 100 -32 Q80 -16 30 -16 Q-30 -16 -70 -36Z', B),
            path('M-50 -30 Q0 -18 40 -20 Q80 -20 98 -30 Q80 -16 30 -16 Q-20 -16 -50 -30Z', W, NO),
            path('M10 -22 Q0 -6 -14 -2 Q-6 -16 -4 -22Z', B),
            line('M66 -26 Q80 -20 92 -28', INK, 2),
            path('M70 -25 L73 -21 L76 -24 L79 -20 L82 -24 L85 -21 L88 -26', '#fff', { 'stroke-width': 1.4 }),
            g(NO, line('M40 -40 v8 M46 -40 v8 M52 -40 v8', '#5d6f80', 1.6)),
            eye(70, -40, 3.8),
          );
        },
      },
      canguro: {
        hab: 'savanna',
        box: [-74, 60, -134],
        draw: () => {
          const C = '#c98a52';
          const L = '#ecc89c';
          return g(
            OUT,
            path('M-14 -30 Q-50 -26 -74 -2 Q-48 -6 -20 -14Z', C),
            path('M-26 -4 Q-30 -40 -10 -48 Q8 -40 4 -16 L20 -6 Q24 -1 18 -1 L-20 -1 Q-28 -1 -26 -4Z', C),
            path('M-16 -40 Q-30 -90 4 -100 Q30 -96 22 -54 Q16 -30 -6 -28Z', C),
            path('M-2 -38 Q-10 -60 6 -74 Q20 -60 16 -42 Q8 -32 -2 -38Z', L, NO),
            path('M0 -46 Q8 -40 16 -46', 'none', { stroke: INK, 'stroke-width': 2.4 }),
            circ(8, -52, 7, C),
            circ(10, -54, 1.8, INK, NO),
            limb('M14 -74 Q24 -68 26 -60', C, 5),
            path('M2 -98 Q8 -116 24 -116 Q40 -114 52 -102 Q54 -94 44 -92 Q30 -92 20 -88 Q4 -86 2 -98Z', C),
            g({ transform: 'rotate(-14 10 -118)' }, ell(10, -120, 6, 14, C), ell(10, -118, 2.6, 9, '#e8a0a0', NO)),
            g({ transform: 'rotate(8 22 -122)' }, ell(22, -124, 6, 14, C)),
            ell(52, -100, 3.4, 3, INK),
            eye(30, -106, 4.4),
          );
        },
      },
      cocodrilo: {
        hab: 'river',
        box: [-104, 96, -48],
        draw: () => {
          const C = '#5a9a3a';
          const L = '#c8d98a';
          const D = '#3f7a2a';
          return g(
            OUT,
            path('M-40 -18 Q-80 -16 -96 -22 Q-106 -26 -102 -16 Q-80 -2 -40 -4Z', C),
            limb('M-24 -10 L-30 -2', D, 7),
            limb('M30 -10 L26 -2', D, 7),
            path('M-44 -16 Q-30 -34 10 -32 L46 -30 L96 -22 Q98 -14 92 -10 L46 -8 Q0 -2 -44 -6Z', C),
            path('M-40 -8 Q0 -4 46 -10 L92 -10 Q80 -6 46 -4 Q0 2 -40 -4Z', L, NO),
            g(
              NO,
              [-88, -70, -52, -34, -16, 2, 20].map((x) => path(`M${x} ${x < -40 ? -17 : -31} l5 -8 l5 8Z`, D)),
            ),
            line('M48 -16 L94 -16', INK, 2),
            path('M56 -16 l3 4 l3 -4 M68 -16 l3 4 l3 -4 M80 -16 l3 4 l3 -4', '#fff', { 'stroke-width': 1.4 }),
            path('M40 -32 Q44 -44 52 -42 Q58 -38 54 -30Z', C),
            eye(48, -38, 4),
            ell(92, -24, 2.4, 1.6, INK, NO),
            limb('M-30 -12 L-38 -2', C, 7),
            limb('M24 -12 L18 -2', C, 7),
          );
        },
      },
      tortuga: {
        hab: 'land',
        box: [-60, 66, -64],
        draw: () => {
          const S = '#8a6a3a';
          const C = '#9ac25a';
          const H = '#b48a4a';
          return g(
            OUT,
            limb('M-30 -14 L-34 -2', C, 9),
            limb('M24 -14 L28 -2', C, 9),
            path('M-50 -16 L-60 -12 L-50 -10Z', C),
            path('M30 -26 Q46 -36 58 -32 Q68 -24 62 -16 Q50 -12 32 -16Z', C),
            path('M-50 -14 Q-52 -60 -4 -62 Q44 -62 42 -14Z', S),
            g(
              { fill: H, stroke: '#5a4020', 'stroke-width': 2 },
              path('M-14 -54 L6 -54 L12 -40 L4 -28 L-16 -28 L-22 -40Z', H),
              path('M-40 -38 L-24 -40 L-18 -28 L-24 -18 L-42 -18Z', H),
              path('M28 -40 L12 -40 L6 -28 L12 -18 L32 -18Z', H),
            ),
            path('M-52 -16 L44 -16 Q44 -10 38 -10 L-46 -10 Q-52 -10 -52 -16Z', '#c9a86a'),
            limb('M-38 -12 L-42 -2', C, 9),
            limb('M16 -12 L20 -2', C, 9),
            eye(52, -28, 4),
            line('M58 -20 Q62 -19 64 -22', INK, 2),
          );
        },
      },
      camaleon: {
        hab: 'land',
        box: [-70, 70, -100],
        draw: () => {
          const C = '#4fb04a';
          const D = '#2f8a3a';
          return g(
            OUT,
            limb('M-70 -30 L70 -36', '#8a5a32', 8),
            path('M-40 -50 Q-60 -48 -60 -66 Q-58 -80 -46 -80 Q-36 -78 -38 -68 Q-40 -60 -48 -64', 'none', {
              stroke: INK,
              'stroke-width': 12,
            }),
            path('M-40 -50 Q-60 -48 -60 -66 Q-58 -80 -46 -80 Q-36 -78 -38 -68 Q-40 -60 -48 -64', 'none', {
              stroke: C,
              'stroke-width': 7,
            }),
            limb('M-20 -48 L-26 -36', D, 5),
            limb('M26 -50 L32 -38', D, 5),
            path('M-40 -52 Q-36 -86 10 -88 Q40 -86 44 -66 Q40 -48 10 -46 Q-20 -44 -40 -52Z', C),
            g(NO, line('M-24 -80 Q-20 -64 -24 -50 M-6 -86 Q-2 -68 -6 -48 M12 -86 Q16 -68 12 -48', D, 3, { opacity: 0.7 })),
            path('M-20 -84 L-14 -94 L-8 -86 L-2 -96 L4 -86 L10 -96 L16 -86', '#fff0', { stroke: INK, 'stroke-width': 3 }),
            path('M36 -82 Q56 -84 62 -68 Q58 -56 42 -56Z', C),
            circ(46, -72, 8, '#9ad86a'),
            circ(48, -72, 3, INK, NO),
            line('M48 -60 Q56 -58 60 -62', INK, 2),
            limb('M-30 -48 L-36 -36', C, 5),
            limb('M18 -48 L22 -36', C, 5),
          );
        },
      },
      salamandra: {
        hab: 'forest',
        box: [-96, 70, -34],
        draw: () => {
          const B = '#2a2a30';
          return g(
            OUT,
            path('M-30 -22 Q-60 -26 -96 -10 Q-60 -8 -30 -10Z', B),
            limb('M-22 -16 L-30 -6 L-24 -2', B, 6),
            limb('M24 -16 L18 -6 L24 -2', B, 6),
            ell(0, -18, 34, 10, B),
            path('M26 -26 Q50 -30 64 -20 Q68 -14 62 -10 Q46 -8 26 -10Z', B),
            g(
              NO,
              [
                [-60, -16, 4],
                [-40, -18, 4.6],
                [-18, -22, 5],
                [2, -14, 4.6],
                [16, -22, 4],
                [40, -22, 4],
                [52, -14, 3],
              ].map(([x, y, r]) => ell(x, y, r, r * 0.8, YEL)),
            ),
            limb('M-16 -12 L-24 -4 L-18 -1', B, 6),
            limb('M28 -12 L34 -4 L40 -1', B, 6),
            eye(46, -22, 4),
            line('M54 -12 Q60 -12 63 -15', '#555', 1.8),
          );
        },
      },
      caracol: {
        hab: 'land',
        box: [-56, 66, -78],
        draw: () => {
          const B = '#e8c08e';
          const S = '#c9742e';
          return g(
            OUT,
            path('M-54 -2 Q-56 -12 -30 -12 L36 -14 Q46 -34 42 -52 L52 -52 Q60 -28 50 -10 Q42 -2 20 -2Z', B),
            line('M42 -50 L36 -74 M50 -50 L56 -72', INK, 2.4),
            circ(36, -75, 4, B),
            circ(56, -73, 4, B),
            circ(36, -75, 1.8, INK, NO),
            circ(56, -73, 1.8, INK, NO),
            circ(-6, -40, 30, S),
            path('M-6 -40 m0 -22 a22 22 0 1 1 -22 22 a16 16 0 0 1 16 -16 a10 10 0 0 1 10 10 a5 5 0 0 1 -5 5', 'none', {
              stroke: '#8a4a1e',
              'stroke-width': 3,
            }),
            eye(46, -36, 3.6),
            line('M48 -24 Q53 -22 56 -26', INK, 1.8),
          );
        },
      },
      pulpo: {
        hab: 'under',
        fly: true,
        box: [-64, 64, -118],
        draw: () => {
          const C = '#d9566a';
          const L = '#f2a0aa';
          const arms = [
            'M-28 -50 Q-52 -30 -50 -10 Q-48 0 -60 -4',
            'M-20 -46 Q-36 -20 -26 -4 Q-20 4 -32 4',
            'M-10 -44 Q-16 -18 -6 0 Q-2 6 -10 10',
            'M2 -44 Q6 -18 2 2 Q0 10 10 10',
            'M12 -44 Q22 -20 18 -2 Q16 6 28 6',
            'M22 -46 Q42 -26 36 -8 Q32 2 46 0',
            'M28 -50 Q56 -36 56 -16 Q56 -4 64 -8',
            'M-30 -54 Q-60 -48 -62 -28',
          ];
          return g(
            {},
            arms.map((d) => g({}, line(d, INK, 13), line(d, C, 8))),
            g(
              NO,
              arms.map((d) => line(d, L, 2.4, { 'stroke-dasharray': '1 7', transform: 'translate(0 1)' })),
            ),
            g(
              OUT,
              path('M-34 -56 Q-40 -118 0 -118 Q40 -118 34 -56 Q20 -42 0 -42 Q-20 -42 -34 -56Z', C),
              ell(-12, -96, 8, 12, '#fff', { ...NO, opacity: 0.25 }),
              eye(-10, -68, 6, 0.2),
              eye(12, -68, 6, 0.2),
              line('M-6 -54 Q1 -50 8 -54', INK, 2.4),
              cheek(-20, -58),
              cheek(22, -58),
            ),
          );
        },
      },
      'estrella-mar': {
        hab: 'under',
        box: [-52, 52, -98],
        draw: () => {
          const pts = Array.from({ length: 10 }, (_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI) / 5;
            const r = i % 2 ? 20 : 50;
            return `${(r * Math.cos(a)).toFixed(1)} ${(-48 + r * Math.sin(a)).toFixed(1)}`;
          });
          return g(
            OUT,
            path(`M${pts.join('L')}Z`, ORA, { 'stroke-linejoin': 'round', 'stroke-width': 3.4 }),
            g(
              NO,
              [
                [0, -78],
                [0, -86],
                [-28, -58],
                [-36, -62],
                [28, -58],
                [36, -62],
                [-18, -26],
                [-22, -18],
                [18, -26],
                [22, -18],
              ].map(([x, y]) => circ(x, y, 2.4, '#ffd08a')),
            ),
            eye(-7, -52, 4.4, 0.1),
            eye(7, -52, 4.4, 0.1),
            line('M-5 -42 Q0 -38 5 -42', INK, 2),
          );
        },
      },
      medusa: {
        hab: 'under',
        fly: true,
        box: [-46, 46, -118],
        draw: () => {
          const C = '#e9a6e0';
          const tent = [-28, -16, -4, 8, 20, 30];
          return g(
            {},
            tent.map((x, i) =>
              line(`M${x} -70 Q${x + (i % 2 ? 8 : -8)} -50 ${x} -34 Q${x + (i % 2 ? -8 : 8)} -18 ${x} -2`, '#c77ac0', 3, { opacity: 0.85 }),
            ),
            g(
              OUT,
              path('M-44 -70 Q-46 -118 0 -118 Q46 -118 44 -70 Q34 -64 22 -70 Q12 -64 0 -70 Q-12 -64 -22 -70 Q-34 -64 -44 -70Z', C, {
                'fill-opacity': 0.92,
              }),
              ell(-18, -100, 10, 6, '#fff', { ...NO, opacity: 0.4 }),
              eye(-10, -88, 4.6, 0.1),
              eye(10, -88, 4.6, 0.1),
              line('M-5 -78 Q0 -74 5 -78', INK, 2),
              cheek(-22, -80, 4),
              cheek(22, -80, 4),
            ),
          );
        },
      },
      esponja: {
        hab: 'under',
        box: [-58, 58, -100],
        draw: () => {
          const tube = (/** @type {number} */ x, /** @type {number} */ h, /** @type {number} */ w, /** @type {string} */ c) =>
            g(
              {},
              path(`M${x - w} 0 Q${x - w - 4} ${-h * 0.5} ${x - w + 2} ${-h} L${x + w - 2} ${-h} Q${x + w + 4} ${-h * 0.5} ${x + w} 0Z`, c),
              ell(x, -h, w - 2, 5, '#7a3e10'),
              g(
                NO,
                [0.3, 0.55, 0.78].map((k, i) => circ(x + (i % 2 ? -w * 0.4 : w * 0.35), -h * k, 2.4, '#00000030')),
              ),
            );
          return g(OUT, tube(-30, 64, 16, '#f2b23a'), tube(30, 52, 14, '#ef8a3a'), tube(0, 96, 18, '#ffcc4a'));
        },
      },
      cangrejo: {
        hab: 'beach',
        box: [-70, 70, -76],
        draw: () => {
          const R = '#e2503c';
          const D = '#b8362a';
          return g(
            OUT,
            [-1, 1].map((s) =>
              g(
                {},
                [0, 1, 2].map((k) => limb(`M${s * 20} ${-22 + k * 4} L${s * (40 + k * 6)} ${-24 + k * 6} L${s * (46 + k * 8)} -2`, D, 4)),
              ),
            ),
            limb('M-22 -36 L-36 -50', R, 6),
            limb('M22 -36 L36 -50', R, 6),
            path('M-34 -50 Q-58 -52 -58 -70 Q-46 -66 -42 -76 Q-30 -74 -34 -50Z', R),
            path('M34 -50 Q58 -52 58 -70 Q46 -66 42 -76 Q30 -74 34 -50Z', R),
            ell(0, -28, 34, 18, R),
            ell(-8, -36, 12, 4, '#fff', { ...NO, opacity: 0.3 }),
            line('M-8 -42 L-10 -56 M8 -42 L10 -56', INK, 2.4),
            eye(-10, -58, 5, 0.1),
            eye(10, -58, 5, 0.1),
            line('M-6 -22 Q0 -18 6 -22', INK, 2),
          );
        },
      },
      abeja: {
        hab: 'air',
        fly: true,
        box: [-50, 50, -76],
        draw: () =>
          g(
            OUT,
            ell(-6, -62, 16, 11, '#dff2fb', { 'fill-opacity': 0.9, transform: 'rotate(-24 -6 -62)' }),
            ell(10, -64, 14, 10, '#dff2fb', { 'fill-opacity': 0.9, transform: 'rotate(18 10 -64)' }),
            path('M-44 -36 L-50 -34 L-44 -32Z', INK),
            ell(-14, -36, 30, 20, YEL),
            g(
              NO,
              path('M-24 -55 Q-28 -36 -24 -17 L-18 -16 Q-22 -36 -18 -56Z', INK),
              path('M-6 -56 Q-10 -36 -6 -16 L0 -16 Q-4 -36 0 -56Z', INK),
            ),
            circ(24, -40, 15, '#3b3330'),
            line('M28 -54 Q30 -66 38 -68 M22 -54 Q20 -66 26 -72', INK, 2),
            eye(28, -42, 4.6),
            line('M28 -32 Q32 -30 35 -33', '#fff', 1.8),
            line('M-20 -16 L-22 -8 M-8 -16 L-6 -8 M4 -18 L8 -10', INK, 2.2),
          ),
      },
      hormiga: {
        hab: 'soil',
        box: [-60, 56, -54],
        draw: () => {
          const B = '#7a2e1e';
          return g(
            OUT,
            [-1, 0, 1].map((k) =>
              g(
                {},
                line(`M${k * 9} -22 L${k * 9 - 8} -10 L${k * 12 - 10} 0`, INK, 3),
                line(`M${k * 9} -22 L${k * 9 + 6} -10 L${k * 12 + 8} 0`, INK, 3),
              ),
            ),
            ell(-36, -24, 22, 15, B),
            ell(0, -24, 12, 8, B),
            circ(30, -30, 13, B),
            line('M34 -42 Q40 -54 52 -52 M28 -42 Q30 -54 40 -58', INK, 2.4),
            eye(34, -32, 4),
            ell(-40, -30, 8, 4, '#fff', { ...NO, opacity: 0.2 }),
          );
        },
      },
      saltamontes: {
        hab: 'land',
        box: [-74, 72, -64],
        draw: () => {
          const C = '#7cc44a';
          const D = '#4f9a2e';
          return g(
            OUT,
            limb('M-16 -26 L-14 -12 L-22 -2', D, 3),
            limb('M2 -26 L4 -12 L-2 -2', D, 3),
            limb('M18 -26 L22 -12 L16 -2', D, 3),
            path('M-60 -26 Q-40 -38 20 -36 L44 -34 L44 -22 L20 -20 Q-40 -16 -60 -26Z', C),
            path('M-50 -32 Q-10 -46 24 -38 Q-6 -30 -50 -28Z', D),
            ell(-14, -44, 26, 9, C, { transform: 'rotate(-38 -14 -44)' }),
            limb('M-32 -60 L-48 -4 L-58 -2', D, 4),
            circ(48, -32, 13, C),
            eye(52, -36, 4.4),
            line('M50 -46 Q60 -64 72 -64 M44 -44 Q48 -64 60 -70', INK, 2),
            line('M56 -24 Q60 -22 62 -26', INK, 1.8),
          );
        },
      },
      ciempies: {
        hab: 'soil',
        box: [-110, 84, -36],
        draw: () => {
          const C = '#c9602c';
          const D = '#8a3a1a';
          const segs = Array.from({ length: 12 }, (_, i) => -96 + i * 14);
          return g(
            OUT,
            segs.map((x) => g({}, line(`M${x} -14 L${x - 6} -2`, D, 2.4), line(`M${x + 4} -14 L${x + 8} -2`, D, 2.4))),
            segs.map((x, i) => ell(x, -18 - Math.sin(i / 1.6) * 3, 9, 8, i % 2 ? C : '#d9763c')),
            circ(72, -22, 11, C),
            line('M76 -30 Q84 -40 90 -36 M70 -32 Q72 -42 80 -46', INK, 2),
            eye(76, -24, 3.6),
          );
        },
      },
      jabali: {
        hab: 'forest',
        box: [-74, 88, -84],
        draw: () => {
          const C = '#5e4636';
          const D = '#46332a';
          return g(
            OUT,
            leg(-28, -34, 9, D, '#2e2420'),
            leg(34, -34, 9, D, '#2e2420'),
            limb('M-50 -54 Q-62 -50 -64 -38', C, 3),
            path('M-54 -46 Q-60 -78 -20 -82 Q30 -86 50 -66 L54 -38 Q40 -30 -40 -30 Q-54 -32 -54 -46Z', C),
            path('M-40 -80 L-34 -90 L-28 -82 L-20 -92 L-14 -82 L-4 -92 L2 -82 L12 -90 L16 -80', 'none', { stroke: INK, 'stroke-width': 3 }),
            leg(-42, -36, 10, C, '#2e2420'),
            leg(20, -36, 10, C, '#2e2420'),
            path('M40 -72 Q56 -80 66 -66 L84 -50 Q88 -40 80 -38 L56 -36 Q42 -44 40 -72Z', C),
            path('M44 -74 L42 -88 L54 -78Z', C),
            ell(84, -45, 6, 8, '#c98a7a'),
            g(NO, ell(83, -47, 1.6, 2.2, INK), ell(86, -43, 1.6, 2.2, INK)),
            path('M74 -40 Q80 -52 84 -56 Q80 -44 78 -38Z', '#fffdf6', { 'stroke-width': 2 }),
            eye(62, -64, 4),
          );
        },
      },
      oveja: {
        hab: 'farm',
        box: [-66, 84, -98],
        draw: () => {
          const W = '#fbf8f2';
          const F = '#3e3532';
          const puffs = [
            [-44, -54, 14],
            [-30, -70, 16],
            [-10, -76, 17],
            [12, -74, 16],
            [32, -64, 14],
            [36, -46, 13],
            [-46, -38, 12],
            [-24, -34, 14],
            [0, -32, 15],
            [22, -34, 14],
          ];
          return g(
            OUT,
            leg(-26, -36, 8, '#2e2826'),
            leg(30, -36, 8, '#2e2826'),
            g(
              {},
              puffs.map(([x, y, r]) => circ(x, y, r, W)),
            ),
            ell(-4, -54, 42, 22, W, NO),
            leg(-38, -32, 9, F),
            leg(18, -32, 9, F),
            ell(46, -82, 9, 5, F, { transform: 'rotate(-24 46 -82)' }),
            path('M48 -84 Q64 -94 74 -80 L80 -60 Q78 -52 68 -52 Q56 -54 52 -66Z', F),
            g(NO, circ(56, -90, 7, W), circ(66, -92, 6, W)),
            eye(66, -76, 4.4),
            line('M70 -56 Q75 -55 78 -58', '#bba', 1.8),
          );
        },
      },
      halcon: {
        hab: 'sky',
        fly: true,
        box: [-84, 70, -82],
        draw: () => {
          const B = '#5b6f86';
          const D = '#3f4f62';
          const L = '#f1ece0';
          return g(
            OUT,
            path('M-6 -46 Q-36 -78 -76 -80 Q-58 -66 -52 -54 Q-30 -48 -14 -38Z', D),
            path('M-40 -42 L-78 -50 Q-84 -38 -78 -22 L-40 -30Z', B),
            path('M-44 -40 Q-10 -54 30 -48 Q52 -44 56 -36 Q40 -24 0 -24 Q-34 -26 -44 -40Z', B),
            path('M-20 -30 Q10 -26 44 -30 Q34 -24 0 -24Z', L, NO),
            g(
              NO,
              [-10, 4, 18].map((x) => line(`M${x} -28 l2 3`, D, 1.6)),
            ),
            path('M0 -48 Q30 -84 60 -80 Q50 -68 50 -56 Q30 -46 10 -40Z', B),
            circ(50, -42, 12, B),
            path('M44 -38 Q52 -30 58 -36 Q54 -42 48 -42Z', L, NO),
            path('M46 -38 Q44 -32 48 -28', 'none', { stroke: D, 'stroke-width': 3 }),
            path('M60 -46 Q70 -46 70 -38 Q66 -40 60 -38Z', '#ffc23a'),
            bead(54, -46, 2.6),
          );
        },
      },
      pato: {
        hab: 'river',
        box: [-56, 64, -88],
        draw: () => {
          const G = '#2f8a4a';
          return g(
            {},
            g(
              OUT,
              path('M-50 -26 Q-56 -40 -44 -42 Q-20 -40 0 -36 L40 -36 Q48 -20 36 -8 Q0 4 -36 -6 Q-50 -12 -50 -26Z', '#a9a39a'),
              path('M22 -36 Q40 -40 44 -24 Q40 -10 24 -12 Q14 -24 22 -36Z', '#8a5a3a'),
              path('M-36 -34 Q-6 -46 14 -30 Q-4 -20 -32 -22Z', '#8f897f'),
              path('M-36 -30 L-26 -30', '#2f5fa8', { 'stroke-width': 5, stroke: '#2f5fa8' }),
              limb('M30 -34 Q26 -54 34 -66', G, 9),
              circ(38, -70, 13, G),
              path('M48 -70 Q64 -70 66 -62 Q58 -58 48 -62Z', '#ffb72e'),
              path('M28 -56 Q36 -54 42 -58', 'none', { stroke: '#fff', 'stroke-width': 3 }),
              bead(40, -74, 2.6),
            ),
            line('M-58 -4 q8 -5 16 0 t16 0 M30 -2 q8 -5 16 0 t16 0', '#fff', 2.4, { opacity: 0.8 }),
          );
        },
      },
      'caballito-mar': {
        hab: 'under',
        fly: true,
        box: [-40, 44, -120],
        draw: () => {
          const C = '#f2a53a';
          const D = '#d97f1e';
          return g(
            OUT,
            path('M-6 -70 Q-26 -64 -22 -46 Q-30 -56 -32 -70Q-26 -76 -14 -76Z', '#ffd27a'),
            path(
              'M0 -112 Q22 -114 24 -96 Q30 -94 42 -94 Q44 -86 30 -84 Q22 -80 18 -70 Q24 -48 16 -30 Q10 -14 -6 -10 Q-22 -6 -22 -20 Q-20 -30 -8 -28 Q2 -28 0 -20 Q-2 -14 -10 -18 Q-6 -24 -12 -24 Q-14 -18 -8 -14 Q6 -18 6 -32 Q6 -50 -4 -62 Q-14 -76 -10 -94 Q-8 -110 0 -112Z',
              C,
            ),
            g(
              NO,
              [-58, -48, -38].map((y) => line(`M-2 ${y} Q6 ${y - 2} 12 ${y}`, D, 2)),
            ),
            path('M2 -112 L6 -122 L12 -112Z', D),
            eye(10, -100, 4.4),
          );
        },
      },
      gato: {
        hab: 'land',
        box: [-58, 50, -110],
        draw: () => {
          const C = '#f2a24a';
          const D = '#d47a22';
          const L = '#fde6c4';
          return g(
            OUT,
            limb('M-26 -10 Q-56 -12 -54 -40 Q-52 -56 -40 -58', C, 7),
            path('M-30 -4 Q-40 -46 -10 -62 Q14 -66 22 -40 Q28 -14 18 -4Z', C),
            path('M-6 -10 Q-10 -34 2 -46 Q14 -36 12 -12Z', L, NO),
            g(NO, line('M-26 -40 Q-20 -36 -18 -30 M-30 -26 Q-24 -22 -22 -16', D, 3)),
            ell(-6, -4, 10, 5, C),
            ell(14, -4, 10, 5, C),
            circ(8, -80, 24, C),
            path('M-12 -92 L-12 -116 L4 -102Z', C),
            path('M16 -102 L32 -116 L30 -92Z', C),
            path('M-8 -98 L-8 -108 L0 -101Z', '#f5b0b8', NO),
            path('M20 -101 L28 -108 L27 -98Z', '#f5b0b8', NO),
            g(NO, line('M2 -104 L4 -96 M10 -104 L10 -96 M18 -104 L16 -96', D, 2.6)),
            eye(0, -82, 4.6, 0.2),
            eye(18, -82, 4.6, 0.2),
            path('M6 -73 L11 -73 L8.5 -70Z', '#e86a7d', { 'stroke-width': 1.6 }),
            line('M8.5 -70 Q8 -66 4 -65 M8.5 -70 Q9 -66 13 -65', INK, 1.8),
            line('M-4 -72 L-18 -74 M-4 -69 L-18 -67 M22 -72 L36 -74 M22 -69 L36 -67', INK, 1.4, { opacity: 0.6 }),
          );
        },
      },
      // ---- ported from games/english-animals/art.js (same drawings, so this file needs no other art file) ----
      rana: {
        hab: 'pond',
        box: [-68, 68, -88],
        draw: (o = POSE) =>
          g(
            OUT,
            ell(-38, -16, 22, 15, E_G),
            ell(38, -16, 22, 15, E_G),
            ell(-52, -3, 15, 5, E_G),
            ell(52, -3, 15, 5, E_G),
            circ(-22, -70, 15, E_G),
            circ(22, -70, 15, E_G),
            ell(0, -40, 42, 33, E_G),
            ell(0, -29, 26, 18, '#d6ee9a', NO),
            g(NO, circ(-34, -30, 4, E_GD), circ(-28, -18, 2.6, E_GD), circ(35, -26, 3.4, E_GD)),
            o.keeper
              ? [
                  limb('M-30 -44 Q-48 -52 -54 -72', E_G, 8),
                  limb('M30 -44 Q48 -52 54 -72', E_G, 8),
                  circ(-55, -77, 10, '#ffb020'),
                  circ(55, -77, 10, '#ffb020'),
                  line('M-60 -80 L-50 -80 M50 -80 L60 -80', '#d98a10', 2),
                ]
              : [limb('M-18 -24 L-22 -4', E_G, 8), limb('M18 -24 L22 -4', E_G, 8), ell(-25, -2, 9, 3.6, E_G), ell(25, -2, 9, 3.6, E_G)],
            eyeP(-22, -72, 9, o, 0.15),
            eyeP(22, -72, 9, o, 0.15),
            o.open
              ? [path('M-24 -54Q0 -58 24 -54Q20 -26 0 -24Q-20 -26 -24 -54Z', '#7a2632'), ell(0, -31, 10, 5, '#f37b8b', NO)]
              : line('M-24 -54Q0 -38 24 -54', INK, 3),
            cheek(-32, -48),
            cheek(32, -48),
          ),
      },
      serpiente: {
        hab: 'land',
        box: [-98, 100, -54],
        draw: (o = POSE) => {
          const d = o.long
            ? 'M-160 -10 C-150 -26 -134 -26 -124 -12 S-98 2 -86 -12 S-62 -26 -50 -12 S-26 2 -14 -12 S12 -26 24 -12 S44 -4 50 -24 Q54 -40 66 -40'
            : 'M-86 -10 C-76 -26 -60 -26 -50 -12 S-24 2 -12 -12 S12 -26 24 -12 S44 -4 50 -24 Q54 -40 66 -40';
          return g(
            {},
            line(d, INK, 22),
            line(d, '#47a83a', 16),
            line(d, YEL, 16, { 'stroke-dasharray': '4 10', 'stroke-linecap': 'butt' }),
            line(d, '#fff', 3, { opacity: 0.35, transform: 'translate(0 -4)' }),
            line('M88 -41 L100 -40 M100 -40 L105 -45 M100 -40 L105 -36', '#e2453c', 2.6),
            g(
              OUT,
              ell(72, -42, 17, 12, '#47a83a'),
              g(NO, circ(64, -48, 2.6, YEL), circ(70, -50, 2, YEL)),
              eyeP(76, -47, 5, o, 0.35),
              o.open ? path('M78 -38 L90 -42 L90 -32Z', '#7a2632') : line('M80 -36 Q85 -36 88 -39', INK, 2),
            ),
          );
        },
      },
      lagarto: {
        hab: 'land',
        box: [-94, 68, -44],
        draw: (o = POSE) =>
          g(
            OUT,
            path(
              o.long
                ? 'M-30 -28 C-70 -32 -110 -22 -146 -34 C-152 -38 -152 -30 -146 -28 C-110 -12 -64 -10 -30 -12Z'
                : 'M-30 -28 C-50 -30 -70 -24 -86 -34 C-91 -37 -93 -31 -88 -29 C-72 -16 -50 -10 -30 -12Z',
              E_OR,
            ),
            limb('M-20 -20 L-10 -10 L-6 -2', E_ORD, 6),
            limb('M18 -20 L12 -10 L16 -2', E_ORD, 6),
            ell(0, -22, 34, 12, E_OR),
            path('M24 -32 Q50 -38 64 -27 Q68 -20 62 -16 Q44 -12 24 -14Z', E_OR),
            path('M-26 -16 Q0 -10 40 -16', 'none', { stroke: '#ffc98a', 'stroke-width': 3, opacity: 0.9 }),
            g(
              NO,
              circ(-16, -28, 3.5, E_ORD),
              circ(-2, -31, 4, E_ORD),
              circ(13, -29, 3.5, E_ORD),
              circ(-40, -24, 3, E_ORD),
              circ(-58, -24, 2.4, E_ORD),
            ),
            limb('M-16 -16 L-28 -8 L-22 -2', E_OR, 6.5),
            limb('M24 -16 L32 -8 L38 -2', E_OR, 6.5),
            line('M-27 -1 L-31 -1 M-22 -1 L-22 -4 M37 -1 L42 -1 M38 -1 L38 -4', INK, 2.4),
            eyeP(46, -28, 5, o, 0.3),
            o.open ? path('M48 -19 L67 -21 L60 -11Z', '#7a2632') : line('M50 -19 L63 -21', INK, 2.4),
          ),
      },
      lombriz: {
        hab: 'soil',
        box: [-64, 64, -48],
        draw: (o = POSE) => {
          const d = o.long
            ? 'M-126 -9 Q-110 -9 -100 -24 Q-85 -46 -70 -24 Q-60 -9 -44 -9 Q-28 -9 -18 -24 Q-3 -46 12 -24 Q22 -9 34 -10 Q44 -11 48 -18'
            : 'M-56 -9 Q-40 -9 -30 -24 Q-15 -46 0 -24 Q10 -9 26 -10 Q40 -11 48 -18';
          return g(
            {},
            line(d, INK, 21),
            line(d, '#e0937f', 15),
            line(d, '#c26f5e', 15, { 'stroke-dasharray': '2 8', 'stroke-linecap': 'butt' }),
            line(d, '#fff', 3, { opacity: 0.75, 'stroke-dasharray': '7 13', transform: 'translate(0 -3.5)' }),
            g(
              OUT,
              circ(52, -19, 10.5, '#e8a08c'),
              ell(49, -24, 3, 2, '#fff', { ...NO, opacity: 0.8 }),
              eyeP(54, -22, 3.4, o, 0.3),
              o.open ? ell(59, -13, 3, 3.4, '#7a2632') : line('M54 -13 Q58 -11 61 -14', INK, 2),
            ),
            g(
              { stroke: '#4e9fc4', 'stroke-width': 1.6 },
              path('M-34 -4 q-3 5 0 7 q3 -2 0 -7Z', '#bfe8f7'),
              path('M8 -2 q-3 5 0 7 q3 -2 0 -7Z', '#bfe8f7'),
              path('M30 1 q-2 4 0 5 q2 -1 0 -5Z', '#bfe8f7'),
            ),
          );
        },
      },
      mariposa: {
        hab: 'air',
        box: [-64, 64, -104],
        draw: (o = POSE) => {
          const wing = g(
            {},
            path('M-4 -60 C-30 -104 -70 -98 -60 -64 C-56 -48 -24 -46 -4 -52Z', '#ff9a2e'),
            path('M-4 -46 C-30 -46 -50 -24 -36 -12 C-22 -4 -8 -26 -4 -40Z', '#3f8fe0'),
            g(NO, circ(-40, -76, 8, YEL), circ(-24, -84, 4, '#fff'), circ(-52, -64, 3.4, '#fff'), circ(-28, -26, 5, '#bfe6ff')),
          );
          return g(
            OUT,
            line('M-3 -76 Q-10 -94 -18 -98 M3 -76 Q10 -94 18 -98', INK, 2),
            circ(-18, -99, 2.6, INK, NO),
            circ(18, -99, 2.6, INK, NO),
            wing,
            g({ transform: 'scale(-1 1)' }, wing.cloneNode(true)),
            [-1, 1].map((s) =>
              line(
                `M${s * 3} -40 L${s * 12} -30 L${s * 10} -10 M${s * 3} -35 L${s * 15} -24 L${s * 17} -6 M${s * 3} -31 L${s * 18} -18 L${s * 26} -8`,
                INK,
                2.2,
              ),
            ),
            ell(0, -50, 5, 22, '#4a3530'),
            circ(0, -75, 7, '#4a3530'),
            eyeP(-3, -76, 2.6, o, 0.2),
            eyeP(3.5, -76, 2.6, o, 0.2),
            o.open ? circ(0, -71, 1.8, '#f37b8b', NO) : null,
          );
        },
      },
      arana: {
        hab: 'land',
        box: [-66, 66, -74],
        draw: (o = POSE) => {
          const B = '#2c2c34';
          const legs = [0, 1, 2, 3].flatMap((k) =>
            [-1, 1].map((s) => line(`M${s * 10} ${-36 + k * 5} L${s * (30 + k * 7)} ${-60 + k * 10} L${s * (36 + k * 9)} 0`, B, 5.5)),
          );
          return g(
            OUT,
            g({ stroke: 'none' }, legs),
            circ(0, -48, 24, B),
            ell(-9, -58, 8, 4.5, '#fff', { ...NO, opacity: 0.22 }),
            circ(0, -26, 16, B),
            circ(-11, -36, 2.4, '#fff', NO),
            circ(11, -36, 2.4, '#fff', NO),
            eyeP(-6, -28, 5.6, o, 0.1),
            eyeP(6, -28, 5.6, o, 0.1),
            o.open ? ell(0, -16, 4, 3.4, '#c0394a', NO) : line('M-4 -17 Q0 -14 4 -17', '#fff', 1.8),
          );
        },
      },
      escorpion: {
        hab: 'sand',
        box: [-60, 76, -86],
        draw: (o = POSE) => {
          const B = '#5a3a28';
          const D = '#3a251a';
          return g(
            { ...OUT, stroke: '#1e1510' },
            [-27, -9, 9, 27].map((f) => line(`M${f * 0.55 + 4} -16 L${f + 2} -10 L${f} 0`, D, 3.8)),
            line('M28 -26 L42 -36', D, 6),
            path('M40 -40 Q54 -54 68 -42 Q58 -42 52 -38 Q60 -34 66 -32 Q54 -24 40 -32Z', D),
            [
              [-28, -22, 8],
              [-42, -30, 7.6],
              [-50, -45, 7.2],
              [-48, -61, 6.8],
              [-38, -73, 6.4],
              [-24, -78, 6],
            ].map(([x, y, r]) => circ(x, y, r, B)),
            path('M-20 -83 Q0 -88 0 -70 Q-6 -75 -17 -74Z', '#c4542c'),
            ell(0, -20, 32, 12, B),
            line('M-12 -31 Q-14 -20 -12 -9 M0 -32 Q-2 -20 0 -8 M12 -31 Q10 -20 12 -9', D, 2),
            ell(-6, -26, 10, 3, '#fff', { ...NO, opacity: 0.18 }),
            [-36, -18, 0, 18].map((f) => line(`M${f * 0.55 + 2} -12 L${f - 2} -7 L${f} 0`, '#1e1510', 5)),
            [-36, -18, 0, 18].map((f) => line(`M${f * 0.55 + 2} -12 L${f - 2} -7 L${f} 0`, '#7a5238', 2.6, NO)),
            limb('M28 -18 Q40 -18 44 -24', B, 7),
            path('M42 -30 Q58 -46 74 -30 Q62 -30 56 -26 Q64 -22 72 -19 Q58 -10 42 -20Z', B),
            eyeP(24, -25, 4.6, o, 0.3),
            o.open ? ell(33, -14, 3, 2.6, '#c0394a') : null,
          );
        },
      },
      delfin: {
        hab: 'water',
        box: [-84, 92, -98],
        draw: (o = POSE) => {
          const GR = '#7f97a8';
          return g(
            OUT,
            path('M-4 -70 Q4 -94 18 -96 Q10 -84 14 -68Z', '#647d8e'),
            path('M-54 -12 L-80 -20 Q-82 -8 -70 -4 Q-82 4 -76 12 L-50 -4Z', '#647d8e'),
            path('M-58 -14 C-40 -56 -10 -72 24 -68 C44 -66 56 -60 62 -52 L84 -50 Q90 -46 84 -42 L60 -42 C36 -34 -20 -30 -50 -4Z', GR),
            path('M60 -42 C36 -36 -6 -32 -44 -10 C-6 -22 30 -34 60 -42Z', '#d6e2ea', NO),
            o.open ? path('M62 -44 L90 -44 L84 -36 L62 -38Z', '#7a2632') : line('M62 -46 Q70 -44 80 -45', INK, 2),
            path('M22 -42 Q20 -26 8 -20 Q14 -34 10 -42Z', '#647d8e'),
            eyeP(50, -55, 4.6, o, 0.35),
            ell(18, -62, 14, 3.5, '#fff', { ...NO, opacity: 0.3, transform: 'rotate(-8 18 -62)' }),
          );
        },
      },
      perro: {
        // Standing, side view: four legs (the far two darker), a wagging tail.
        hab: 'land',
        box: [-66, 74, -102],
        draw: (o = POSE) => {
          const B = '#b0703c';
          const F = '#8f5a2e';
          const L = '#ecc89c';
          const D = '#7a4626';
          return g(
            OUT,
            path('M-28 -44 L-26 -2 L-16 -2 L-16 -44Z', F),
            path('M32 -44 L32 -2 L42 -2 L40 -44Z', F),
            limb('M-40 -56 Q-60 -64 -58 -86', B, 9),
            ell(-2, -52, 44, 21, B),
            path('M-48 -56 Q-52 -30 -46 -2 L-34 -2 Q-32 -28 -26 -40Z', B),
            path('M12 -46 L12 -2 L24 -2 L26 -46Z', B),
            ell(-40, -2, 9, 4.6, L),
            ell(-21, -2, 8, 4.2, L),
            ell(18, -2, 9, 4.6, L),
            ell(37, -2, 8, 4.2, L),
            ell(28, -48, 11, 13, L, NO),
            path('M22 -58 Q24 -76 36 -84 L52 -70 Q46 -56 32 -50Z', B),
            line('M24 -62 Q36 -56 48 -64', '#d9473b', 5),
            circ(36, -58, 3.6, YEL),
            circ(44, -84, 20, B),
            ell(60, -74, 15, 11, L),
            o.open
              ? [path('M52 -70 Q64 -66 74 -71 Q70 -56 58 -58Z', '#7a2632'), ell(63, -60, 5, 3, '#f37b8b', NO)]
              : line('M56 -67 Q63 -64 69 -68', INK, 2.4),
            ell(73, -79, 5.4, 4.2, INK),
            eyeP(50, -90, 4.6, o, 0.35),
            path('M28 -100 Q14 -96 18 -72 Q26 -66 34 -78Z', D),
          );
        },
      },
      // ---- final list, second batch ----
      cerdo: {
        hab: 'farm',
        box: [-64, 84, -88],
        draw: () => {
          const P = '#f4a7b4';
          const D = '#e48c9c';
          return g(
            OUT,
            leg(-28, -28, 10, D, '#b8606e'),
            leg(34, -28, 10, D, '#b8606e'),
            path('M-50 -56 q-12 -4 -10 6 q3 6 -6 9', 'none', { stroke: INK, 'stroke-width': 7 }),
            path('M-50 -56 q-12 -4 -10 6 q3 6 -6 9', 'none', { stroke: P, 'stroke-width': 3 }),
            ell(-2, -50, 52, 28, P),
            ell(-8, -60, 22, 8, '#fff', { ...NO, opacity: 0.3 }),
            leg(-40, -28, 11, P, '#b8606e'),
            leg(20, -28, 11, P, '#b8606e'),
            circ(50, -62, 24, P),
            path('M34 -80 L36 -96 L50 -84Z', D),
            path('M56 -84 L66 -96 L68 -80Z', D),
            ell(74, -56, 10, 12, '#f7bcc6'),
            g(NO, ell(71, -57, 2, 3.4, '#a8505e'), ell(77, -57, 2, 3.4, '#a8505e')),
            eye(56, -70, 4.4),
            line('M58 -44 Q64 -42 68 -45', INK, 2),
            cheek(44, -52),
          );
        },
      },
      elefante: {
        hab: 'savanna',
        box: [-80, 92, -124],
        draw: () => {
          const G = '#9aa3ad';
          const D = '#7d8691';
          const F = '#e4e0d8';
          return g(
            OUT,
            leg(-24, -50, 17, D, F),
            leg(32, -50, 17, D, F),
            limb('M-58 -70 Q-70 -60 -68 -44', G, 3),
            ell(-6, -74, 54, 38, G),
            leg(-42, -48, 18, G, F),
            leg(14, -48, 18, G, F),
            limb('M66 -84 Q86 -66 80 -36 Q78 -22 88 -18', G, 13),
            circ(48, -88, 28, G),
            path('M40 -106 Q4 -112 6 -78 Q8 -54 34 -60 Q44 -74 40 -106Z', '#8a939d'),
            path('M60 -70 Q74 -56 86 -60 Q82 -66 64 -76Z', '#fffdf6', { 'stroke-width': 2.4 }),
            eye(58, -96, 4.4),
            line('M30 -96 Q20 -86 24 -72', '#6f7780', 2, { opacity: 0.7 }),
          );
        },
      },
      'pez-payaso': {
        hab: 'under',
        fly: true,
        box: [-56, 50, -60],
        draw: () => {
          const O = '#f27a1e';
          const band = (/** @type {number} */ x, /** @type {number} */ hh) =>
            path(
              `M${x - 4} ${-30 - hh} Q${x + 4} -30 ${x - 4} ${-30 + hh} L${x + 5} ${-30 + hh} Q${x + 13} -30 ${x + 5} ${-30 - hh}Z`,
              '#fff',
              {
                'stroke-width': 2.4,
              },
            );
          return g(
            OUT,
            path('M-34 -30 L-54 -48 Q-60 -30 -54 -12Z', O),
            path('M-12 -50 Q4 -64 20 -50Z', O),
            path('M-6 -10 Q4 2 12 -10Z', O),
            ell(0, -30, 40, 22, O),
            band(-22, 17),
            band(4, 21),
            path('M28 -46 Q34 -30 28 -14', 'none', { stroke: '#fff', 'stroke-width': 7 }),
            path('M28 -46 Q34 -30 28 -14', 'none', { stroke: INK, 'stroke-width': 2, transform: 'translate(-4 0)' }),
            eye(26, -34, 4.4),
            line('M34 -22 Q38 -21 40 -24', INK, 1.8),
          );
        },
      },
      'erizo-mar': {
        hab: 'under',
        box: [-54, 54, -82],
        draw: () => {
          const spines = Array.from({ length: 19 }, (_, i) => {
            const a = Math.PI + (i * Math.PI) / 18;
            const r = i % 2 ? 50 : 42;
            return `M${(30 * Math.cos(a)).toFixed(1)} ${(-24 + 26 * Math.sin(a)).toFixed(1)} L${(r * Math.cos(a)).toFixed(1)} ${(-24 + (r + 8) * Math.sin(a)).toFixed(1)}`;
          }).join(' ');
          return g(
            {},
            line(spines, INK, 6),
            line(spines, '#8a4a9a', 3),
            g(
              OUT,
              path('M-34 -2 Q-36 -50 0 -52 Q36 -50 34 -2Z', '#6a2f7a'),
              g(
                NO,
                [
                  [-16, -36],
                  [0, -42],
                  [16, -36],
                  [-22, -18],
                  [-6, -24],
                  [10, -24],
                  [24, -16],
                ].map(([x, y]) => circ(x, y, 2.6, '#b07ac0')),
              ),
            ),
          );
        },
      },
      mariquita: {
        hab: 'land',
        box: [-66, 66, -66],
        draw: () => {
          const R = '#e23b2e';
          return g(
            OUT,
            path('M-66 -6 Q-10 -34 66 -10 Q10 14 -66 -6Z', GRN_L),
            line('M-60 -6 Q0 -16 60 -10', '#3d8f38', 2.4),
            g(
              {},
              [-14, 0, 14].map((x) => line(`M${x} -22 L${x - 6} -10 M${x} -22 L${x + 6} -10`, INK, 2.6)),
            ),
            path('M24 -40 Q44 -44 44 -26 Q42 -16 26 -18Z', '#2e2622'),
            line('M38 -40 Q44 -54 52 -54 M32 -42 Q34 -56 42 -60', INK, 2),
            path('M-34 -20 Q-34 -60 0 -60 Q32 -60 32 -20Z', R),
            line('M0 -60 V-20', INK, 2.6),
            g(
              NO,
              [
                [-18, -44, 5],
                [-22, -28, 4],
                [-8, -34, 3.4],
                [14, -46, 5],
                [20, -30, 4],
                [8, -34, 3.4],
              ].map(([x, y, r]) => circ(x, y, r, INK)),
            ),
            ell(-14, -52, 8, 3.4, '#fff', { ...NO, opacity: 0.35 }),
            circ(38, -30, 2.2, '#fff', NO),
          );
        },
      },
      // ---- optional ----
      mamut: {
        hab: 'ice',
        box: [-82, 96, -132],
        draw: () => {
          const B = '#8a5a3a';
          const D = '#6a4228';
          const F = '#e4d8c4';
          const fringe = Array.from({ length: 11 }, (_, i) => `M${-52 + i * 9} -46 l-2 10`).join(' ');
          return g(
            OUT,
            leg(-24, -50, 17, D, F),
            leg(32, -50, 17, D, F),
            path('M-58 -60 Q-66 -110 -10 -112 Q30 -114 50 -96 L56 -60 Q50 -40 -52 -40 Q-60 -44 -58 -60Z', B),
            line(fringe, D, 3),
            leg(-42, -46, 18, B, F),
            leg(14, -46, 18, B, F),
            limb('M66 -84 Q86 -66 80 -36 Q78 -22 88 -18', B, 13),
            path('M30 -112 Q48 -132 66 -110 Q76 -96 70 -82 L40 -74 Q28 -90 30 -112Z', B),
            path('M60 -76 Q82 -50 98 -70 Q96 -82 90 -78 Q80 -64 66 -82Z', '#fffdf6', { 'stroke-width': 2.4 }),
            path('M44 -104 Q30 -96 34 -76 Q40 -70 48 -80Z', D),
            eye(58, -100, 4.2),
          );
        },
      },
      raton: {
        hab: 'land',
        box: [-74, 52, -58],
        draw: () => {
          const C = '#a9a3a0';
          return g(
            OUT,
            line('M-26 -12 Q-50 -4 -56 -20 Q-62 -32 -74 -28', '#d9a0a8', 3),
            ell(-4, -20, 28, 18, C),
            ell(-4, -2, 8, 3, '#d9a0a8'),
            ell(14, -2, 8, 3, '#d9a0a8'),
            path('M14 -34 Q30 -40 50 -22 Q30 -12 16 -12Z', C),
            circ(16, -42, 12, C),
            circ(16, -42, 6.4, '#f5b0b8', NO),
            circ(50, -22, 3.6, '#e86a7d'),
            eye(32, -28, 3.6),
            line('M44 -20 L58 -24 M44 -17 L58 -15', INK, 1.3, { opacity: 0.6 }),
          );
        },
      },
      cabra: {
        hab: 'farm',
        box: [-58, 82, -120],
        draw: () => {
          const W = '#ece4d2';
          const D = '#c9bea6';
          return g(
            OUT,
            leg(-22, -40, 8, D, '#5a4a3a'),
            leg(34, -40, 8, D, '#5a4a3a'),
            path('M-46 -66 L-56 -78 L-44 -72Z', W),
            ell(-2, -58, 46, 22, W),
            leg(-34, -40, 9, W, '#5a4a3a'),
            leg(22, -40, 9, W, '#5a4a3a'),
            path('M30 -64 Q38 -86 50 -92 L58 -72 Q48 -56 34 -50Z', W),
            path('M46 -96 Q58 -106 70 -98 L82 -78 Q82 -70 74 -70 Q60 -72 52 -86Z', W),
            path('M52 -98 Q40 -116 26 -112 Q38 -110 46 -94Z', '#8a7a6a'),
            path('M58 -100 Q50 -120 36 -118 Q48 -114 54 -98Z', '#8a7a6a'),
            ell(46, -92, 8, 4, W, { transform: 'rotate(-20 46 -92)' }),
            path('M70 -72 Q72 -58 66 -54 Q62 -62 64 -72Z', '#d9cfb8'),
            ell(80, -80, 2.4, 2, INK, NO),
            eye(66, -90, 4),
          );
        },
      },
      orca: {
        hab: 'under',
        fly: true,
        box: [-110, 100, -92],
        draw: () => {
          const K = '#22262e';
          return g(
            OUT,
            path('M-70 -40 Q-96 -54 -110 -70 Q-98 -72 -90 -64 Q-94 -76 -84 -80 Q-82 -62 -66 -50Z', K),
            path('M0 -62 Q4 -92 18 -92 Q12 -76 22 -60Z', K),
            path('M-74 -44 Q-40 -76 30 -72 Q100 -70 100 -40 Q100 -14 60 -10 Q-10 -6 -74 -44Z', K),
            path('M-30 -26 Q20 -10 70 -14 Q92 -18 98 -34 Q60 -26 -30 -26Z', '#fff', NO),
            path('M46 -54 Q60 -60 70 -52 Q60 -48 46 -54Z', '#fff', NO),
            path('M-10 -48 Q0 -54 10 -48', 'none', { stroke: '#9aa3ad', 'stroke-width': 4 }),
            path('M28 -24 Q20 -8 6 -4 Q14 -18 12 -26Z', K),
            line('M70 -30 Q84 -26 96 -32', '#9aa3ad', 2),
            bead(66, -46, 3),
          );
        },
      },
      sapo: {
        hab: 'soil',
        box: [-64, 64, -66],
        draw: () => {
          const C = '#9a8a4a';
          const D = '#7a6a34';
          return g(
            OUT,
            ell(-40, -12, 22, 12, C),
            ell(40, -12, 22, 12, C),
            ell(-52, -2, 13, 4, C),
            ell(52, -2, 13, 4, C),
            ell(0, -30, 48, 26, C),
            ell(0, -20, 30, 12, '#d9c98a', NO),
            g(
              NO,
              [
                [-30, -36, 4],
                [-14, -44, 3.4],
                [12, -46, 3.6],
                [30, -36, 4],
                [-36, -22, 3],
                [36, -22, 3],
              ].map(([x, y, r]) => circ(x, y, r, D)),
            ),
            limb('M-18 -18 L-22 -2', C, 8),
            limb('M18 -18 L22 -2', C, 8),
            g(
              {},
              [-18, 18].map((x) => g({}, circ(x, -52, 10, C), circ(x, -54, 6, '#f2b83a'), ell(x, -54, 4.4, 1.6, INK, NO))),
            ),
            line('M-22 -34 Q0 -26 22 -34', INK, 2.6),
          );
        },
      },
      sardina: {
        hab: 'under',
        fly: true,
        box: [-90, 90, -100],
        draw: () => {
          const fish = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
            at(
              x,
              y,
              s,
              g(
                OUT,
                path('M-34 0 L-48 -10 L-46 0 L-48 10Z', '#4f78a8'),
                path('M-36 0 Q-4 -16 34 -2 Q-4 12 -36 0Z', '#c9d6e2'),
                path('M-34 -2 Q-4 -15 32 -4 Q0 -6 -34 -2Z', '#4f78a8', NO),
                g(
                  NO,
                  [-16, -6, 4].map((cx) => circ(cx, -4, 1.6, '#2f4f78')),
                ),
                bead(22, -3, 2.2),
              ),
            );
          return g({}, fish(-20, -78, 1.15), fish(30, -50, 1.3), fish(-30, -18, 1.2));
        },
      },
      atun: {
        hab: 'under',
        fly: true,
        box: [-100, 88, -76],
        draw: () => {
          const B = '#2f4f8a';
          const S = '#c9d6e2';
          return g(
            OUT,
            path('M-60 -38 L-84 -70 Q-90 -72 -88 -64 L-74 -38 L-88 -12 Q-90 -4 -84 -6Z', B),
            path('M-4 -58 L8 -76 L18 -56Z', B),
            path('M-4 -18 L6 -4 L14 -20Z', S),
            path('M-66 -38 Q-30 -64 30 -60 Q72 -56 88 -40 Q72 -18 30 -16 Q-30 -12 -66 -38Z', B),
            path('M-60 -34 Q-20 -24 30 -22 Q70 -22 86 -38 Q72 -18 30 -16 Q-30 -12 -60 -34Z', S, NO),
            g(
              NO,
              [-50, -40, -30].map((x) => path(`M${x} -46 l4 -4 l2 5Z M${x} -28 l4 4 l2 -5Z`, YEL)),
            ),
            path('M30 -40 Q20 -28 10 -26', 'none', { stroke: '#4f6fa8', 'stroke-width': 3 }),
            line('M72 -36 Q80 -33 86 -36', INK, 2),
            eye(66, -44, 4.6),
          );
        },
      },
    };

    // ---------------- Card backgrounds (240 × 180) ----------------
    const W = 240;
    const H = 180;
    const sky = (/** @type {string} */ u, /** @type {string} */ a, /** @type {string} */ b) => [
      el('defs', {}, grad(`${u}s`, a, b)),
      rect(0, 0, W, H, 0, `url(#${u}s)`),
    ];
    const sunAt = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r) => [
      circ(x, y, r * 1.6, '#ffe58a', { opacity: 0.45 }),
      circ(x, y, r, '#ffcf3a'),
    ];
    const bushes = (/** @type {number} */ y, /** @type {string} */ c) =>
      g(
        {},
        [16, 52, 92, 136, 178, 222].map((x, i) => circ(x, y + (i % 2) * 5, 22 + (i % 3) * 5, c)),
      );
    const cloud = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(
        x,
        y,
        s,
        g({ fill: '#fff' }, circ(-14, 0, 12, '#fff'), circ(2, -6, 15, '#fff'), circ(18, 0, 11, '#fff'), rect(-26, 0, 56, 11, 5, '#fff')),
      );
    /** A flat-top acacia, foot at (x, y), h tall. */
    const acacia = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h, c = '#a9b45a') =>
      g(
        {},
        line(
          `M${x} ${y} L${x} ${y - h * 0.62} M${x} ${y - h * 0.4} L${x - h * 0.28} ${y - h * 0.78} M${x} ${y - h * 0.46} L${x + h * 0.3} ${y - h * 0.8}`,
          '#7a5a3a',
          Math.max(2, h * 0.06),
        ),
        ell(x, y - h * 0.84, h * 0.62, h * 0.16, c),
      );
    const waves = (/** @type {number} */ y, c = '#fff', o = 0.6) =>
      line(
        `M10 ${y} q8 -5 16 0 t16 0 M150 ${y + 6} q8 -5 16 0 t16 0 M70 ${y + 22} q8 -5 16 0 t16 0 M190 ${y + 30} q8 -5 16 0 t16 0`,
        c,
        2.4,
        {
          opacity: o,
        },
      );
    const fence = (/** @type {number} */ y) =>
      g(
        {},
        line(`M0 ${y - 22} H240 M0 ${y - 10} H240`, '#b98a5a', 4),
        [14, 64, 114, 164, 214].map((x) => rect(x - 4, y - 32, 8, 34, 2, '#c99a6a')),
      );

    /** @type {Record<string, (u: string) => { kids: any[], gy: number }>} */
    const HAB = {
      land: (u) => ({
        gy: 158,
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          bushes(132, '#c3e6a5'),
          path('M0 146 Q60 136 120 143 T240 140 V180 H0Z', '#9bd06c'),
          path('M0 166 Q80 158 160 166 T240 164 V180 H0Z', '#86c45a'),
          tuft(22, 156),
          tuft(206, 152),
          tuft(120, 172, '#5f9c3e'),
        ],
      }),
      pond: (u) => ({
        gy: 158,
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          bushes(132, '#c3e6a5'),
          path('M0 146 Q60 136 120 143 T240 140 V180 H0Z', '#9bd06c'),
          ell(196, 150, 46, 7, '#7cc4ea'),
          ell(186, 149, 9, 2.6, '#5fae4a'),
          line('M18 146 L16 120 M24 146 L26 114 M30 146 L34 124', '#5f9c3e', 3),
          ell(25, 118, 3, 8, '#8a5a32'),
          path('M0 166 Q80 158 160 166 T240 164 V180 H0Z', '#86c45a'),
          tuft(120, 172, '#5f9c3e'),
        ],
      }),
      sand: (u) => ({
        gy: 156,
        kids: [
          sky(u, '#ffeec4', '#fff8e4'),
          sunAt(204, 40, 16),
          path('M0 126 Q50 112 110 124 T240 118 V180 H0Z', '#f1cf8a'),
          path('M0 148 Q70 138 140 146 T240 142 V180 H0Z', '#e8bd6c'),
          g({}, circ(40, 160, 2, '#c99a4a'), circ(180, 166, 2.4, '#c99a4a'), circ(120, 172, 1.8, '#c99a4a')),
        ],
      }),
      water: (u) => ({
        gy: 124,
        kids: [
          sky(u, '#d4eefb', '#f1faff'),
          sunAt(36, 34, 14),
          path('M0 118 H240 V180 H0Z', '#4aa3d8'),
          path('M0 140 H240 V180 H0Z', '#3c92c9'),
          waves(132),
        ],
      }),
      farm: (u) => ({
        gy: 160,
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          cloud(196, 34, 0.8),
          path('M0 132 Q60 120 120 128 T240 124 V180 H0Z', '#b6dd86'),
          fence(138),
          path('M0 150 Q60 142 120 148 T240 146 V180 H0Z', '#9bd06c'),
          path('M0 168 Q80 160 160 168 T240 166 V180 H0Z', '#86c45a'),
          tuft(26, 160),
          tuft(214, 158),
        ],
      }),
      savanna: (u) => ({
        gy: 160,
        kids: [
          sky(u, '#fde9c0', '#fff6e2'),
          sunAt(200, 40, 16),
          path('M0 128 Q40 118 90 124 T170 120 T240 124 V180 H0Z', '#f0d48a'),
          acacia(34, 128, 62),
          acacia(212, 126, 40, '#b8bf6a'),
          path('M0 146 Q60 136 120 143 T240 140 V180 H0Z', '#e8c46a'),
          path('M0 166 Q80 158 160 166 T240 164 V180 H0Z', '#dcb056'),
          tuft(20, 156, '#b8902e'),
          tuft(214, 152, '#b8902e'),
          tuft(124, 172, '#b8902e'),
        ],
      }),
      forest: (u) => ({
        gy: 160,
        kids: [
          sky(u, '#d4efe4', '#eef8e8'),
          [20, 70, 180, 226].map((x, i) =>
            g({}, rect(x - 6, 40, 12, 120, 3, '#9a7a5a'), circ(x, 40, 30 + (i % 2) * 6, i % 2 ? '#7cc06a' : '#6aae5a')),
          ),
          bushes(140, '#8fcf7a'),
          path('M0 148 Q60 138 120 145 T240 142 V180 H0Z', '#7fbf5a'),
          path('M0 168 Q80 160 160 168 T240 166 V180 H0Z', '#6aae4a'),
          tuft(120, 172, '#4f8f3a'),
        ],
      }),
      sky: (u) => ({
        gy: 160,
        kids: [
          sky(u, '#8fd0f4', '#e4f5fd'),
          cloud(40, 40, 0.9),
          cloud(196, 26, 0.7),
          cloud(206, 120, 0.6),
          path('M0 180 L0 150 L40 118 L70 140 L110 104 L150 146 L190 122 L240 156 V180Z', '#a7c6d8'),
          path('M100 112 L110 104 L120 114 L112 112Z', '#fff'),
          path('M0 180 V166 Q60 154 120 162 T240 160 V180Z', '#9bd06c'),
        ],
      }),
      ice: (u) => ({
        gy: 150,
        kids: [
          sky(u, '#cfeaf8', '#f2fbff'),
          path('M0 118 H240 V180 H0Z', '#5fa8d6'),
          path('M150 118 L170 96 L190 104 L206 90 L240 108 V118Z', '#eef8ff', { stroke: '#a8cde4', 'stroke-width': 2 }),
          path('M10 160 Q20 130 40 132 L200 134 Q226 136 232 160 Q232 170 220 172 L22 172 Q10 170 10 160Z', '#f6fbff', {
            stroke: '#a8cde4',
            'stroke-width': 2,
          }),
          line('M40 150 L80 150 M140 156 L190 156', '#d8ecf8', 3),
        ],
      }),
      under: (u) => ({
        gy: 164,
        kids: [
          sky(u, '#8fd3f0', '#2f7fb8'),
          g({ opacity: 0.18 }, path('M40 0 L70 0 L30 180 L0 180Z', '#fff'), path('M150 0 L170 0 L150 180 L120 180Z', '#fff')),
          path('M0 164 Q60 154 120 162 T240 158 V180 H0Z', '#efd9a0'),
          g(
            { fill: 'none', stroke: '#e8f7ff', 'stroke-width': 1.6 },
            circ(206, 40, 4, 'none'),
            circ(214, 26, 2.6, 'none'),
            circ(30, 60, 3, 'none'),
          ),
          limb('M20 164 Q12 140 22 120 Q30 104 22 90', '#3f9a5a', 5),
          limb('M218 160 Q228 140 218 124', '#3f9a5a', 5),
        ],
      }),
      river: (u) => ({
        gy: 132,
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          bushes(104, '#c3e6a5'),
          path('M0 112 Q60 104 120 110 T240 108 V140 H0Z', '#9bd06c'),
          path('M0 132 Q60 126 120 130 T240 128 V180 H0Z', '#5aa8d4'),
          waves(150),
          line('M200 120 L198 96 M206 120 L210 92 M212 120 L218 100', '#5f9c3e', 3),
        ],
      }),
      beach: (u) => ({
        gy: 160,
        kids: [
          sky(u, '#d4eefb', '#f1faff'),
          sunAt(40, 34, 14),
          path('M0 96 H240 V140 H0Z', '#4aa3d8'),
          waves(110),
          path('M0 132 Q60 122 120 128 T240 124 V180 H0Z', '#f4dca0'),
          path('M0 164 Q80 156 160 164 T240 162 V180 H0Z', '#ecc982'),
          g({}, circ(30, 170, 2.4, '#c99a4a'), circ(196, 172, 2, '#c99a4a')),
          path('M196 150 q8 -10 16 0Z', '#f2a0aa', { stroke: INK, 'stroke-width': 1.6 }),
        ],
      }),
      soil: (u) => ({
        gy: 150,
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          path('M0 96 Q60 88 120 94 T240 92 V180 H0Z', '#9bd06c'),
          path('M0 108 Q60 100 120 106 T240 104 V180 H0Z', '#a8774e'),
          g({}, circ(30, 130, 4, '#8f6340'), circ(200, 124, 5, '#8f6340'), circ(170, 168, 3, '#8f6340'), circ(60, 170, 5, '#8f6340')),
          tuft(30, 102),
          tuft(214, 100),
        ],
      }),
      air: (u) => ({
        gy: 132,
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          bushes(140, '#c3e6a5'),
          path('M0 150 Q60 140 120 147 T240 144 V180 H0Z', '#9bd06c'),
          [
            [30, 168, '#ff7aa8', 34],
            [208, 168, YEL, 28],
            [186, 174, '#b07ae0', 22],
          ].map(([x, y, c, h]) =>
            at(
              /** @type {number} */ (x),
              /** @type {number} */ (y),
              1,
              g(
                {},
                limb(`M0 0 L0 ${-h}`, '#4fa83a', 3),
                g(
                  OUT,
                  [0, 72, 144, 216, 288].map((a) =>
                    ell(0, -(/** @type {number} */ (h)) - 5, 3.4, 5.4, /** @type {string} */ (c), {
                      transform: `rotate(${a} 0 ${-(/** @type {number} */ (h))})`,
                      'stroke-width': 1.6,
                    }),
                  ),
                  circ(0, -(/** @type {number} */ (h)), 3.4, YEL, { 'stroke-width': 1.6 }),
                ),
              ),
            ),
          ),
        ],
      }),
      night: (u) => ({
        gy: 150,
        kids: [
          sky(u, '#1b2550', '#3a4f80'),
          g(
            {},
            [30, 80, 128, 170, 214, 60, 196].map((x, i) => circ(x, 18 + ((i * 37) % 50), i % 3 ? 1.4 : 2, '#fff', { opacity: 0.85 })),
          ),
          path('M206 24 a16 16 0 1 0 12 28 a12 12 0 1 1 -12 -28Z', '#fff2b0'),
          path('M0 180 V150 Q30 120 60 140 Q90 110 130 138 Q170 118 200 142 Q220 130 240 140 V180Z', '#1f3a34'),
        ],
      }),
    };

    /** An animal on its habitat card. */
    const animalCard = (/** @type {string} */ key) => {
      const A = ANIMALS[key];
      const u = uid();
      const hab = HAB[A.hab](u);
      const w = A.box[1] - A.box[0];
      const hh = -A.box[2];
      const maxW = w / hh > 3 ? 226 : 210;
      const maxH = A.fly ? 150 : hab.gy - 16;
      const s = Math.min(maxW / w, maxH / hh, A.max || 1.6);
      const mid = (A.box[0] + A.box[1]) / 2;
      const gy = A.fly ? (H + hh * s) / 2 + (A.hab === 'under' ? -6 : 0) : hab.gy;
      return svgEl(`0 0 ${W} ${H}`, 'art-svg na-card', hab.kids, at(W / 2 - mid * s, gy, s, A.draw()));
    };

    // ---------------- Skulls (station «Dientes y picos»): side view, facing right, on a museum label ----------------
    const BONE = '#f6eedb';
    const TOOTH = '#fffdf6';
    const MOUTH = '#3a2e28';
    const RIDGE = { stroke: '#a8987a', 'stroke-width': 2, fill: 'none' };
    /** A flat grinding tooth (herbivore): a wide block with a flat, ridged chewing face. `up` = a lower tooth. */
    const flatTooth = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, up = false) =>
      g(
        {},
        rect(x, up ? y - h : y, w, h, 2, TOOTH),
        path(`M${x + 3} ${up ? y - h + 4 : y + h - 4} h${w - 6} M${x + 3} ${up ? y - h + 8 : y + h - 8} h${w - 6}`, 'none', RIDGE),
      );
    /** A wide bumpy tooth (omnivore): two rounded cusps on its chewing edge. */
    const bumpTooth = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ h, up = false) => {
      const d = up ? -1 : 1;
      const e = y + d * h;
      return path(
        `M${x} ${y} V${e - d * 3} Q${x + w * 0.25} ${e + d * 2} ${x + w * 0.5} ${e - d * 2} Q${x + w * 0.75} ${e + d * 2} ${x + w} ${e - d * 3} V${y}Z`,
        TOOTH,
      );
    };
    /** A pointed tooth from the jaw edge y, `len` long (negative = up). */
    const fang = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, /** @type {number} */ len) =>
      path(`M${x} ${y} Q${x + w * 0.2} ${y + len * 0.7} ${x + w * 0.5} ${y + len} Q${x + w * 0.8} ${y + len * 0.7} ${x + w} ${y}Z`, TOOTH);
    /** @type {Record<string, () => any[]>} */
    const SKULLS = {
      // Herbivore (cow / horse): a long snout, a row of big FLAT grinding teeth, small cutting teeth in front, a gap between,
      // and NO fangs at all.
      herbivoro: () => [
        rect(-60, -52, 146, 34, 4, MOUTH, NO),
        path('M-92 -54 Q-96 -106 -50 -108 Q-10 -110 22 -90 L84 -66 Q92 -62 88 -52 L-64 -52 Q-88 -50 -92 -54Z', BONE),
        ell(-42, -80, 15, 13, '#5a4a3a'),
        ell(78, -66, 5, 3, '#5a4a3a'),
        path('M-70 4 Q-88 -14 -62 -18 L86 -18 Q92 -10 84 -6 L36 -2 Q-20 12 -70 4Z', BONE),
        [-56, -30, -4].map((x) => flatTooth(x, -52, 25, 15)),
        [-56, -30, -4].map((x) => flatTooth(x, -18, 25, 15, true)),
        rect(68, -52, 8, 13, 1.5, TOOTH),
        rect(77, -52, 8, 13, 1.5, TOOTH),
        rect(68, -31, 8, 13, 1.5, TOOTH),
        rect(77, -31, 8, 13, 1.5, TOOTH),
      ],
      // Carnivore (lion / dog): a short strong jaw with BIG SHARP FANGS above and below, jagged cutting teeth behind them.
      carnivoro: () => [
        rect(-50, -48, 120, 28, 4, MOUTH, NO),
        path('M-86 -52 Q-92 -114 -24 -114 Q30 -114 50 -80 L74 -62 Q80 -54 74 -48 L-58 -48 Q-84 -46 -86 -52Z', BONE),
        ell(-20, -80, 16, 15, '#5a4a3a'),
        ell(68, -58, 4, 3, '#5a4a3a'),
        path('M-64 0 Q-80 -18 -54 -20 L72 -20 Q78 -12 70 -8 L30 -2 Q-20 10 -64 0Z', BONE),
        [-44, -27, -10, 7].map((x) => fang(x, -48, 16, 14)),
        [-38, -21, -4, 13].map((x) => fang(x, -20, 16, -14)),
        fang(30, -20, 16, -42),
        fang(46, -48, 19, 46),
        fang(66, -48, 6, 9),
        fang(60, -20, 6, -8),
      ],
      // Omnivore (person / bear): a round head, WIDE bumpy grinding teeth at the back, SMALL fangs, flat cutting teeth in front.
      omnivoro: () => [
        rect(-44, -48, 110, 30, 4, MOUTH, NO),
        path('M-78 -52 Q-94 -120 -14 -120 Q52 -120 56 -74 L64 -56 Q68 -50 62 -48 L-52 -48 Q-76 -46 -78 -52Z', BONE),
        ell(-2, -82, 15, 14, '#5a4a3a'),
        ell(54, -64, 4, 3, '#5a4a3a'),
        path('M-54 4 Q-70 -16 -46 -18 L62 -18 Q66 -10 60 -6 L24 2 Q-14 14 -54 4Z', BONE),
        [-46, -24, -2].map((x) => bumpTooth(x, -48, 21, 13)),
        [-46, -24, -2].map((x) => bumpTooth(x, -18, 21, 13, true)),
        fang(20, -18, 11, -18),
        fang(26, -48, 12, 20),
        rect(42, -48, 9, 14, 3, TOOTH),
        rect(52, -48, 9, 14, 3, TOOTH),
        rect(42, -32, 9, 14, 3, TOOTH),
        rect(52, -32, 9, 14, 3, TOOTH),
      ],
    };
    // A slate museum board, the skull as big as the card allows (picture choices are small on phones: the teeth must still read).
    const skullCard = (/** @type {string} */ kind) => {
      const u = uid();
      return svgEl(
        `0 0 ${W} ${H}`,
        'art-svg na-card na-skull',
        el('defs', {}, grad(`${u}k`, '#43555e', '#33434b')),
        rect(0, 0, W, H, 0, `url(#${u}k)`),
        g(
          { opacity: 0.12 },
          [36, 72, 108, 144].map((y) => line(`M0 ${y} H240`, '#fff', 1)),
        ),
        at(122, 152, 1.2, g({ ...OUT, 'stroke-width': 2.8 }, SKULLS[kind]())),
      );
    };

    // Spanish names (aria labels, the ficha caption fallback).
    /** @type {Record<string, string>} */
    const NAMES = {
      vaca: 'vaca',
      conejo: 'conejo',
      caballo: 'caballo',
      leon: 'león',
      leopardo: 'leopardo',
      lobo: 'lobo',
      zorro: 'zorro',
      oso: 'oso',
      ardilla: 'ardilla',
      gallina: 'gallina',
      aguila: 'águila',
      buitre: 'buitre',
      pinguino: 'pingüino',
      murcielago: 'murciélago',
      ballena: 'ballena',
      tiburon: 'tiburón',
      canguro: 'canguro',
      cocodrilo: 'cocodrilo',
      tortuga: 'tortuga',
      camaleon: 'camaleón',
      salamandra: 'salamandra',
      caracol: 'caracol',
      pulpo: 'pulpo',
      'estrella-mar': 'estrella de mar',
      medusa: 'medusa',
      esponja: 'esponja',
      cangrejo: 'cangrejo',
      abeja: 'abeja',
      hormiga: 'hormiga',
      saltamontes: 'saltamontes',
      ciempies: 'ciempiés',
      jabali: 'jabalí',
      oveja: 'oveja',
      halcon: 'halcón',
      pato: 'pato',
      'caballito-mar': 'caballito de mar',
      gato: 'gato',
      atun: 'atún',
      cerdo: 'cerdo',
      elefante: 'elefante',
      'pez-payaso': 'pez payaso',
      'erizo-mar': 'erizo de mar',
      mariquita: 'mariquita',
      mamut: 'mamut',
      raton: 'ratón',
      cabra: 'cabra',
      orca: 'orca',
      sapo: 'sapo',
      sardina: 'sardina',
      rana: 'rana',
      lagarto: 'lagarto',
      serpiente: 'serpiente',
      lombriz: 'lombriz',
      escorpion: 'escorpión',
      arana: 'araña',
      delfin: 'delfín',
      mariposa: 'mariposa',
      perro: 'perro',
      'craneo-herbivoro': 'cráneo de herbívoro',
      'craneo-carnivoro': 'cráneo de carnívoro',
      'craneo-omnivoro': 'cráneo de omnívoro',
    };

    const art = (/** @type {string} */ key) => {
      if (ANIMALS[key]) return animalCard(key);
      const m = /^craneo-(herbivoro|carnivoro|omnivoro)$/.exec(String(key || ''));
      if (m) return skullCard(m[1]);
      return null;
    };
    const has = (/** @type {string} */ key) => !!key && (key in ANIMALS || /^craneo-(herbivoro|carnivoro|omnivoro)$/.test(key));
    const keys = () => [...Object.keys(ANIMALS), 'craneo-herbivoro', 'craneo-carnivoro', 'craneo-omnivoro'];

    // ---------------- Hub hero: the jeep over the explorer's notebook ----------------
    // A passed station (its best round gave 2+ stars, KF.gameData(slug).st) sticks its photo in the notebook; the others are dashed
    // empty slots with their number. Photos follow the order of the stations.
    const passedSet = (/** @type {any} */ passed) => {
      if (typeof passed === 'number') return new Set(Array.from({ length: Math.max(0, passed) }, (_, i) => i));
      if (passed instanceof Set) return passed;
      if (Array.isArray(passed)) return new Set(passed);
      const unit = window.NA_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return new Set((unit?.stations || []).map((s, i) => ((Number(st[s.id]?.stars) || 0) >= 2 ? i : -1)).filter((i) => i >= 0));
    };
    // The animal of each station's photo (station order of the plan: comer, dientes, moverse, reproduccion, nacer, columna,
    // invertebrados, vertebrados).
    const PHOTO = ['conejo', 'leon', 'aguila', 'estrella-mar', 'gallina', 'tortuga', 'abeja', 'oso'];
    const PHOTO_BG = ['#e3f3d4', '#fde9c0', '#d6eefb', '#cfe9f7', '#f4fbe6', '#e6f3db', '#fff3c4', '#e2f0e4'];
    // Polaroids on the two pages: x, y, rotation.
    const SLOTS = [
      [58, 176, -6],
      [118, 170, 4],
      [64, 236, 3],
      [124, 230, -4],
      [236, 170, -4],
      [296, 178, 6],
      [232, 232, 5],
      [292, 238, -5],
    ];
    const photo = (/** @type {number} */ i, /** @type {boolean} */ on, /** @type {string} */ u) => {
      const [x, y, rot] = SLOTS[i];
      if (!on)
        return g(
          { class: 'na-photo', 'data-photo': i, transform: `translate(${x} ${y}) rotate(${rot})` },
          rect(-25, -25, 50, 50, 5, 'none', { stroke: '#c9b08a', 'stroke-width': 2, 'stroke-dasharray': '5 5' }),
          el(
            'text',
            { y: 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 900, fill: '#d4bf98', 'font-family': 'system-ui,sans-serif' },
            String(i + 1),
          ),
        );
      const A = ANIMALS[PHOTO[i] || 'conejo'];
      const w = A.box[1] - A.box[0];
      const hh = -A.box[2];
      const s = Math.min(36 / w, 30 / hh);
      const mid = (A.box[0] + A.box[1]) / 2;
      const gy = A.fly ? 15 / 2 + (hh * s) / 2 - 8 : 12;
      return g(
        { class: 'na-photo is-on', 'data-photo': i, transform: `translate(${x} ${y}) rotate(${rot})` },
        g(
          { class: 'na-photo-in' },
          rect(-25, -27, 50, 58, 2, '#fff', { filter: `url(#${u}ds)` }),
          rect(-21, -23, 42, 40, 1, PHOTO_BG[i] || '#eef6e4'),
          path('M-21 10 Q0 6 21 10 V17 H-21Z', A.fly ? 'none' : '#00000010'),
          at(-mid * s, gy, s, g({ transform: 'scale(1)' }, A.draw())),
          rect(-8, -33, 16, 9, 1, '#f6e7a8', { opacity: 0.85, transform: 'rotate(-6)' }),
        ),
      );
    };
    const jeep = () =>
      g(
        { class: 'na-jeep' },
        g(
          { class: 'na-jeep-in' },
          ell(0, 6, 62, 6, '#5a3e2b', { opacity: 0.18 }),
          path('M-58 -8 L-56 -30 Q-54 -36 -46 -36 L-14 -36 L-4 -56 L30 -56 L36 -36 L52 -34 Q60 -32 60 -24 L60 -8Z', '#e2a23a', OUT),
          path('M-4 -52 L28 -52 L32 -38 L-10 -38Z', '#bfe3f5', { ...OUT, 'stroke-width': 2.4 }),
          line('M12 -52 L12 -38', INK, 2.4),
          rect(-52, -30, 32, 6, 2, '#c98a2e', NO),
          line('M-20 -36 L-20 -8', INK, 2),
          rect(54, -26, 8, 6, 2, '#fff3b0', { ...OUT, 'stroke-width': 2 }),
          circ(-60, -22, 10, '#3a3a3a', OUT),
          circ(-60, -22, 4, '#8a8a8a', NO),
          g(
            {},
            [-36, 38].map((x) => g({}, circ(x, -6, 13, '#3a3a3a', OUT), circ(x, -6, 5.5, '#c9c9c9', NO))),
          ),
          // the explorer: hat and camera
          circ(8, -62, 9, '#f1c6a0', OUT),
          path('M-6 -66 Q8 -84 22 -66Z', '#d9b46a', OUT),
          line('M-10 -66 L26 -66', INK, 3),
          rect(14, -66, 14, 10, 2, '#3a3a3a', { ...OUT, 'stroke-width': 2 }),
          circ(23, -61, 3, '#8fd0f4', NO),
        ),
      );
    const hero = (/** @type {any} */ passedArg = undefined) => {
      const u = uid();
      const passed = passedSet(passedArg);
      const total = window.NA_CONTENT?.stations?.length || SLOTS.length;
      const all = passed.size >= total;
      const svg = svgEl(
        '0 0 360 300',
        'hero-svg na-hero',
        el(
          'defs',
          {},
          el('clipPath', { id: `${u}fr` }, rect(4, 4, 352, 292, 30, '#fff')),
          grad(`${u}sky`, '#9ed6f2', '#fde7bd'),
          el(
            'filter',
            { id: `${u}ds`, x: '-20%', y: '-20%', width: '140%', height: '140%' },
            el('feDropShadow', { dx: 0, dy: 1.5, stdDeviation: 1.2, 'flood-color': '#5a3e2b', 'flood-opacity': 0.35 }),
          ),
        ),
        g(
          { 'clip-path': `url(#${u}fr)` },
          rect(0, 0, 360, 300, 0, `url(#${u}sky)`),
          sunAt(300, 46, 20),
          cloud(70, 36, 0.8),
          path('M0 104 Q60 92 120 98 T240 94 T360 100 V300 H0Z', '#f0d48a'),
          acacia(40, 100, 56),
          acacia(330, 98, 36, '#b8bf6a'),
          path('M0 118 Q90 108 180 116 T360 112 V300 H0Z', '#e8c46a'),
          // the dirt track the jeep drives on
          path('M0 128 Q120 116 200 124 T360 120', 'none', { stroke: '#d9a95a', 'stroke-width': 8, 'stroke-linecap': 'round' }),
          // the notebook: kraft cover, two cream pages, an elastic band
          g(
            { transform: 'translate(180 216) rotate(-2.5)' },
            path('M-170 -84 Q-90 -96 0 -82 Q90 -96 170 -84 V108 H-170Z', '#a8743f'),
            path('M-162 -78 Q-84 -90 -2 -76 V102 H-162Z', '#fbf3df'),
            path('M2 -76 Q84 -90 162 -78 V102 H2Z', '#f6ead0'),
            path('M-2 -76 V102 M2 -76 V102', 'none', { stroke: '#d9c49a', 'stroke-width': 2 }),
            g(
              {},
              [-50, -22, 6, 34, 62, 90].map((y) => line(`M-150 ${y}H-14M14 ${y}H150`, '#ecdcb6', 1.4)),
            ),
            rect(150, -88, 10, 196, 3, '#3d9a38', { opacity: 0.9 }),
          ),
          SLOTS.map((_, i) => photo(i, passed.has(i), u)),
          g({ transform: `translate(${all ? 262 : 196 - (passed.size / total) * 0} 124)` }, jeep()),
        ),
        rect(4, 4, 352, 292, 30, 'none', { stroke: '#000', 'stroke-opacity': 0.12, 'stroke-width': 2 }),
      );
      svg.dataset.passed = String(passed.size);
      svg.classList.toggle('is-all', all);
      return svg;
    };

    return {
      art,
      hero,
      // No label scenes yet: a `label` task falls back to a plain choice.
      scene: (/** @type {string} */ _name) => null,
      keys,
      has,
      name: (/** @type {string} */ key) => NAMES[key] || key,
    };
  })()
);
