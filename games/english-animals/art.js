// Drawings for «Animals» (English, Unit 1): picture cards of the animals (`art`), story scenes, the two label scenes and the hub
// hero — a football pitch in the jungle where the frog keeps goal and every passed station brings its animal fan in colour.
// Our own cartoon drawings (never copies of the book), built with createElementNS (no markup strings).
// window.EAArt = { art(key) → Element|null, scene(name) → ExamScene|null, hero() → Element, has(key) }
//
// art(key): `<animal>` | `<plural>` (two of them: «It's» vs «They're») + an optional modifier `-big | -small | -noisy | -quiet | -long`,
// or a scene key (forest-dark, forest-day, home, kids, boat, net, hospital, fisherman, kid-afraid, kid-calm). Unknown key → null.
// @ts-check
'use strict';

window.EAArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `ea${++uidN}`;

    // ---------------- Tiny SVG builder ----------------
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
    const circ = (cx, cy, r, /** @type {string} */ fill, /** @type {Attrs} */ a = {}) => el('circle', { cx, cy, r, fill, ...a });
    const ell = (cx, cy, rx, ry, /** @type {string} */ fill, /** @type {Attrs} */ a = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...a });
    const rect = (x, y, width, height, rx, /** @type {string} */ fill, /** @type {Attrs} */ a = {}) =>
      el('rect', { x, y, width, height, rx, fill, ...a });
    const line = (/** @type {string} */ d, /** @type {string} */ stroke, w, /** @type {Attrs} */ a = {}) =>
      el('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...a });
    const txt = (x, y, /** @type {string} */ s, /** @type {Attrs} */ a = {}) => el('text', { x, y, ...a }, s);
    const at = (x, y, s, /** @type {any} */ kids, flip = false) =>
      g({ transform: `translate(${+x.toFixed(2)} ${+y.toFixed(2)}) scale(${+(flip ? -s : s).toFixed(3)} ${+s.toFixed(3)})` }, kids);
    const grad = (/** @type {string} */ id, /** @type {string} */ a, /** @type {string} */ b, vertical = true) =>
      el(
        'linearGradient',
        { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 },
        el('stop', { offset: 0, 'stop-color': a }),
        el('stop', { offset: 1, 'stop-color': b }),
      );
    const svgEl = (/** @type {string} */ viewBox, /** @type {string} */ cls, /** @type {any[]} */ ...kids) => {
      return el('svg', { viewBox, class: cls, 'aria-hidden': 'true', focusable: 'false' }, ...kids);
    };

    // ---------------- Style: flat colours with a warm dark outline ----------------
    const INK = '#2e2622';
    const OUT = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    const NO = { stroke: 'none' };
    /** A limb / tube: a dark stroke under a coloured one (= an outlined line). */
    const limb = (/** @type {string} */ d, /** @type {string} */ c, w, /** @type {Attrs} */ a = {}) =>
      g(a, line(d, INK, w + 5), line(d, c, w));
    /** @typedef {{ open?: boolean, shut?: boolean, long?: boolean, keeper?: boolean, fish?: boolean }} Pose */
    const eye = (x, y, r, /** @type {Pose} */ o = {}, look = 0.3) =>
      o.shut
        ? line(`M${x - r * 0.85} ${y}Q${x} ${y + r} ${x + r * 0.85} ${y}`, INK, Math.max(2, r * 0.34))
        : g(
            {},
            circ(x, y, r, '#fff'),
            circ(x + r * look, y + r * 0.08, r * 0.56, INK, NO),
            circ(x + r * look + r * 0.22, y - r * 0.24, r * 0.2, '#fff', NO),
          );
    const cheek = (x, y, r = 4.5) => ell(x, y, r, r * 0.62, '#f5a3a0', { ...NO, opacity: 0.8 });

    // ---------------- The animals ----------------
    // Each faces right, origin = the middle of the ground under it (y up is negative). box = [left, right, top] in its own units;
    // mouth = where the sound lines of «-noisy» start; hab = its card background.
    /** @typedef {{ hab: string, box: [number, number, number], mouth: [number, number], draw: (o: Pose) => SVGElement }} Animal */

    const G = '#5cbf4a';
    const GD = '#3d9a38';
    const RED = '#e23b2e';
    const BLUE = '#2f7fd6';
    const YEL = '#ffd23f';
    const OR = '#f28a2e';
    const ORD = '#c9601c';

    /** @type {Record<string, Animal>} */
    const ANIMALS = {
      frog: {
        hab: 'pond',
        box: [-68, 68, -88],
        mouth: [26, -48],
        draw: (o) =>
          g(
            OUT,
            ell(-38, -16, 22, 15, G),
            ell(38, -16, 22, 15, G),
            ell(-52, -3, 15, 5, G),
            ell(52, -3, 15, 5, G),
            circ(-22, -70, 15, G),
            circ(22, -70, 15, G),
            ell(0, -40, 42, 33, G),
            ell(0, -29, 26, 18, '#d6ee9a', NO),
            g(NO, circ(-34, -30, 4, GD), circ(-28, -18, 2.6, GD), circ(35, -26, 3.4, GD)),
            o.keeper
              ? [
                  limb('M-30 -44 Q-48 -52 -54 -72', G, 8),
                  limb('M30 -44 Q48 -52 54 -72', G, 8),
                  circ(-55, -77, 10, '#ffb020'),
                  circ(55, -77, 10, '#ffb020'),
                  line('M-60 -80 L-50 -80 M50 -80 L60 -80', '#d98a10', 2),
                ]
              : [limb('M-18 -24 L-22 -4', G, 8), limb('M18 -24 L22 -4', G, 8), ell(-25, -2, 9, 3.6, G), ell(25, -2, 9, 3.6, G)],
            eye(-22, -72, 9, o, 0.15),
            eye(22, -72, 9, o, 0.15),
            o.open
              ? [path('M-24 -54Q0 -58 24 -54Q20 -26 0 -24Q-20 -26 -24 -54Z', '#7a2632'), ell(0, -31, 10, 5, '#f37b8b', NO)]
              : line('M-24 -54Q0 -38 24 -54', INK, 3),
            cheek(-32, -48),
            cheek(32, -48),
          ),
      },
      parrot: {
        // On a branch, the long tail feathers hanging below it (fully in the card), two legs gripping the branch.
        hab: 'land',
        box: [-66, 60, -166],
        mouth: [50, -132],
        draw: (o) =>
          g(
            { ...OUT, transform: 'translate(0 -40)' },
            g(
              { transform: 'translate(0 -10)' },
              path('M-10 -40 L-46 42 Q-38 48 -30 42 L2 -36Z', BLUE),
              path('M-2 -38 L-28 48 Q-19 51 -14 44 L10 -34Z', RED),
            ),
            limb('M-60 4 Q0 -2 58 0', '#8a5a32', 9),
            path('M-46 2 Q-58 -14 -68 -2 Q-58 8 -46 2Z', '#4fa83a'),
            limb('M-7 -14 L-8 -3', '#8f8a84', 4),
            limb('M6 -14 L7 -3', '#8f8a84', 4),
            g(
              { transform: 'translate(0 -10)' },
              path('M-4 -6 C-30 -30 -28 -72 -10 -90 C-2 -114 32 -116 40 -94 C44 -80 36 -66 28 -56 C30 -34 20 -14 -4 -6Z', RED),
              path('M-14 -74 Q14 -80 18 -52 Q16 -24 -16 -4 Q-26 -34 -14 -74Z', BLUE),
              path('M-14 -74 Q14 -80 18 -56 Q2 -52 -17 -50 Q-20 -64 -14 -74Z', YEL),
              path('M-16 -4 Q4 -16 12 -32 Q-6 -28 -21 -26 Q-22 -14 -16 -4Z', '#3fae4a'),
              line('M-6 -46 Q4 -38 6 -30', '#1f5fae', 2),
              ell(22, -96, 12, 10, '#fdf1e4', NO),
              eye(23, -98, 5, o, 0.35),
              o.open && path('M33 -92 L52 -86 L44 -70 L32 -80Z', '#7a2632'),
              g(o.open ? { transform: 'rotate(42 33 -88)' } : {}, path('M33 -90 Q46 -90 46 -82 Q40 -76 32 -80Z', '#3b3330')),
              path('M32 -104 Q54 -104 54 -84 Q52 -76 46 -80 Q46 -90 32 -88Z', '#f4e7c8'),
            ),
            line('M-13 1 Q-8 -6 -3 1 M1 1 Q6 -6 11 1', '#8f8a84', 3, NO),
          ),
      },
      lizard: {
        hab: 'land',
        box: [-94, 68, -44],
        mouth: [64, -21],
        draw: (o) =>
          g(
            OUT,
            path(
              o.long
                ? 'M-30 -28 C-70 -32 -110 -22 -146 -34 C-152 -38 -152 -30 -146 -28 C-110 -12 -64 -10 -30 -12Z'
                : 'M-30 -28 C-50 -30 -70 -24 -86 -34 C-91 -37 -93 -31 -88 -29 C-72 -16 -50 -10 -30 -12Z',
              OR,
            ),
            limb('M-20 -20 L-10 -10 L-6 -2', ORD, 6),
            limb('M18 -20 L12 -10 L16 -2', ORD, 6),
            ell(0, -22, 34, 12, OR),
            path('M24 -32 Q50 -38 64 -27 Q68 -20 62 -16 Q44 -12 24 -14Z', OR),
            path('M-26 -16 Q0 -10 40 -16', 'none', { stroke: '#ffc98a', 'stroke-width': 3, opacity: 0.9 }),
            g(
              NO,
              circ(-16, -28, 3.5, ORD),
              circ(-2, -31, 4, ORD),
              circ(13, -29, 3.5, ORD),
              circ(-40, -24, 3, ORD),
              circ(-58, -24, 2.4, ORD),
            ),
            limb('M-16 -16 L-28 -8 L-22 -2', OR, 6.5),
            limb('M24 -16 L32 -8 L38 -2', OR, 6.5),
            line('M-27 -1 L-31 -1 M-22 -1 L-22 -4 M37 -1 L42 -1 M38 -1 L38 -4', INK, 2.4),
            eye(46, -28, 5, o, 0.3),
            o.open ? path('M48 -19 L67 -21 L60 -11Z', '#7a2632') : line('M50 -19 L63 -21', INK, 2.4),
          ),
      },
      snake: {
        hab: 'land',
        box: [-98, 100, -54],
        mouth: [88, -42],
        draw: (o) => {
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
              eye(76, -47, 5, o, 0.35),
              o.open ? path('M78 -38 L90 -42 L90 -32Z', '#7a2632') : line('M80 -36 Q85 -36 88 -39', INK, 2),
            ),
          );
        },
      },
      worm: {
        hab: 'soil',
        box: [-64, 64, -48],
        mouth: [62, -16],
        draw: (o) => {
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
              eye(54, -22, 3.4, o, 0.3),
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
      scorpion: {
        hab: 'sand',
        box: [-60, 76, -86],
        mouth: [36, -16],
        draw: (o) => {
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
            eye(24, -25, 4.6, o, 0.3),
            o.open ? ell(33, -14, 3, 2.6, '#c0394a') : null,
          );
        },
      },
      spider: {
        hab: 'land',
        box: [-66, 66, -74],
        mouth: [10, -17],
        draw: (o) => {
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
            eye(-6, -28, 5.6, o, 0.1),
            eye(6, -28, 5.6, o, 0.1),
            o.open ? ell(0, -16, 4, 3.4, '#c0394a', NO) : line('M-4 -17 Q0 -14 4 -17', '#fff', 1.8),
          );
        },
      },
      dolphin: {
        hab: 'water',
        box: [-84, 92, -98],
        mouth: [88, -45],
        draw: (o) => {
          const GR = '#7f97a8';
          return g(
            OUT,
            path('M-4 -70 Q4 -94 18 -96 Q10 -84 14 -68Z', '#647d8e'),
            path('M-54 -12 L-80 -20 Q-82 -8 -70 -4 Q-82 4 -76 12 L-50 -4Z', '#647d8e'),
            path('M-58 -14 C-40 -56 -10 -72 24 -68 C44 -66 56 -60 62 -52 L84 -50 Q90 -46 84 -42 L60 -42 C36 -34 -20 -30 -50 -4Z', GR),
            path('M60 -42 C36 -36 -6 -32 -44 -10 C-6 -22 30 -34 60 -42Z', '#d6e2ea', NO),
            o.open ? path('M62 -44 L90 -44 L84 -36 L62 -38Z', '#7a2632') : line('M62 -46 Q70 -44 80 -45', INK, 2),
            path('M22 -42 Q20 -26 8 -20 Q14 -34 10 -42Z', '#647d8e'),
            eye(50, -55, 4.6, o, 0.35),
            ell(18, -62, 14, 3.5, '#fff', { ...NO, opacity: 0.3, transform: 'rotate(-8 18 -62)' }),
          );
        },
      },
      fish: {
        hab: 'under',
        box: [-34, 30, -34],
        mouth: [25, -16],
        draw: (o) =>
          g(
            OUT,
            path('M-16 -17 L-33 -30 L-28 -17 L-33 -4Z', '#4f86b8'),
            path('M-4 -29 Q4 -38 12 -28Z', '#4f86b8'),
            path('M-18 -17 Q0 -36 22 -19 Q26 -16 22 -14 Q0 2 -18 -17Z', '#a9c8e2'),
            path('M-17 -18 Q0 -34 21 -19 Q4 -22 -17 -18Z', '#6f9ccc', NO),
            line('M2 -24 Q-1 -17 2 -10', '#4f86b8', 1.8),
            g(NO, path('M-8 -16 a3 3 0 0 1 6 0', 'none', { stroke: '#e3eef7', 'stroke-width': 1.4 })),
            eye(12, -20, 3.8, o, 0.25),
            o.open ? circ(23, -15, 2.4, '#7a2632') : null,
          ),
      },
      butterfly: {
        hab: 'air',
        box: [-64, 64, -104],
        mouth: [8, -74],
        draw: (o) => {
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
            eye(-3, -76, 2.6, o, 0.2),
            eye(3.5, -76, 2.6, o, 0.2),
            o.open ? circ(0, -71, 1.8, '#f37b8b', NO) : null,
          );
        },
      },
      dog: {
        // Standing, side view: four legs (the far two darker), a wagging tail.
        hab: 'land',
        box: [-66, 74, -102],
        mouth: [68, -66],
        draw: (o) => {
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
            eye(50, -90, 4.6, o, 0.35),
            path('M28 -100 Q14 -96 18 -72 Q26 -66 34 -78Z', D),
          );
        },
      },
      bird: {
        hab: 'water',
        box: [-40, 52, -122],
        mouth: [44, -106],
        draw: (o) => {
          const B = '#262a2e';
          return g(
            OUT,
            !o.fish && path('M-34 12 Q-32 -6 -8 -8 Q24 -8 32 12Z', '#858d93'),
            !o.fish && path('M-24 -2 Q-8 -6 10 -5', 'none', { stroke: '#a9b1b6', 'stroke-width': 3 }),
            g(
              { transform: o.fish ? '' : 'translate(0 -7)' },
              path('M-18 -24 L-38 -2 L-30 0 L-12 -20Z', B),
              ell(-4, -40, 18, 30, B, { transform: 'rotate(-18 -4 -40)' }),
              limb('M-7 -16 L-9 -1', '#3a3f44', 4),
              limb('M3 -16 L5 -1', '#3a3f44', 4),
              path('M-17 1 L-3 -2 L-9 3Z M-1 1 L13 -2 L7 3Z', '#3a3f44'),
              path('M-16 -62 Q8 -66 12 -42 Q10 -26 -4 -14 L-9 -21 L-13 -13 L-17 -22 L-23 -17 Q-28 -40 -16 -62Z', '#5b6e66'),
              line('M-12 -50 Q0 -50 4 -38 M-14 -38 Q-4 -36 -2 -26', '#8aa096', 2, NO),
              limb('M4 -64 Q-2 -86 10 -100', B, 12),
              ell(14, -102, 12, 9.5, B),
              ell(20, -95, 5.5, 4, '#f2a634'),
              o.open && path('M24 -102 L46 -100 L30 -92Z', '#7a2632'),
              path('M22 -107 L46 -103 Q50 -99 45 -98 L22 -99Z', '#6d6f72'),
              g(o.open ? { transform: 'rotate(18 22 -99)' } : {}, path('M22 -99 L42 -98 L22 -95Z', '#56585b')),
              circ(16, -104, 3.4, '#3fbf9a'),
              circ(17, -104, 1.6, INK, NO),
              o.fish ? at(52, -88, 0.5, ANIMALS.fish.draw({})) : null,
            ),
          );
        },
      },
      firefly: {
        hab: 'night',
        box: [-30, 30, -44],
        mouth: [22, -26],
        draw: (o) =>
          g(
            {},
            circ(-14, -18, 22, '#fff3a0', { opacity: 0.18, class: 'ea-glow' }),
            circ(-14, -18, 13, '#fff3a0', { opacity: 0.35 }),
            g(
              OUT,
              ell(-12, -18, 12, 8.5, '#ffe14a'),
              ell(4, -24, 11, 8, '#3b3330'),
              path('M-6 -30 Q-8 -46 6 -40 Q4 -32 -2 -28Z', '#d8eef8', { opacity: 0.85 }),
              path('M2 -30 Q8 -46 18 -38 Q12 -30 6 -28Z', '#d8eef8', { opacity: 0.85 }),
              circ(16, -26, 7, '#e2603a'),
              line('M18 -32 Q22 -42 28 -42', INK, 1.8),
              eye(18, -27, 3, o, 0.3),
              line('M0 -18 L-3 -8 M6 -18 L7 -8 M12 -20 L15 -11', '#6b5a50', 1.6),
              line('M-4 -17 L-8 -7 M2 -17 L1 -6 M8 -18 L10 -7', INK, 1.8),
            ),
          ),
      },
    };

    // ---------------- Card backgrounds (240 × 180) ----------------
    const W = 240;
    const H = 180;
    const tuft = (x, y, c = '#6fb04a') => line(`M${x - 5} ${y}l-2 -8M${x} ${y}l0 -10M${x + 5} ${y}l2 -8`, c, 2);
    const flower = (h, petal = '#ff7aa8') =>
      g(
        {},
        limb(`M0 0 Q4 ${-h * 0.5} 0 ${-h}`, '#4fa83a', Math.max(3, h * 0.05)),
        path(`M2 ${-h * 0.42} Q${h * 0.28} ${-h * 0.6} ${h * 0.3} ${-h * 0.4} Q${h * 0.14} ${-h * 0.32} 2 ${-h * 0.42}Z`, '#5cbf4a', OUT),
        g(
          OUT,
          [0, 72, 144, 216, 288].map((a) =>
            ell(0, -h - h * 0.13, h * 0.09, h * 0.14, petal, {
              transform: `rotate(${a} 0 ${-h})`,
              'stroke-width': Math.max(1.5, h * 0.022),
            }),
          ),
          circ(0, -h, h * 0.09, YEL, { 'stroke-width': Math.max(1.5, h * 0.022) }),
        ),
      );
    /** A sailboat (reference object on water), origin = waterline middle, h = its height. */
    const sailboat = (h) => {
      const k = h / 100;
      return at(
        0,
        0,
        k,
        g(
          OUT,
          line('M0 -12 L0 -100', INK, 4),
          path('M4 -96 L44 -22 L4 -22Z', '#fff'),
          path('M-4 -86 L-34 -24 L-4 -24Z', '#ffe08a'),
          path('M-50 -14 L50 -14 L38 6 L-38 6Z', '#d9473b'),
          line('M-44 -6 L44 -6', '#fff', 4, NO),
        ),
      );
    };
    const sky = (u, a, b, w = W, h = H) => [el('defs', {}, grad(`${u}s`, a, b)), rect(0, 0, w, h, 0, `url(#${u}s)`)];
    const sunAt = (x, y, r) => [circ(x, y, r * 1.6, '#ffe58a', { opacity: 0.45 }), circ(x, y, r, '#ffcf3a')];
    const bushes = (y, c) =>
      g(
        { fill: c },
        [16, 52, 92, 136, 178, 222].map((x, i) => circ(x, y + (i % 2) * 5, 22 + (i % 3) * 5, c)),
      );
    const waves = (y, c = '#fff', o = 0.6) =>
      line(
        `M10 ${y} q8 -5 16 0 t16 0 M150 ${y + 6} q8 -5 16 0 t16 0 M70 ${y + 22} q8 -5 16 0 t16 0 M190 ${y + 30} q8 -5 16 0 t16 0`,
        c,
        2.4,
        { opacity: o },
      );

    /** @type {Record<string, (u: string) => { kids: any[], gy: number, ref: string }>} */
    const HAB = {
      land: (u) => ({
        gy: 158,
        ref: 'flower',
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
        ref: 'flower',
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
      soil: (u) => ({
        gy: 150,
        ref: 'flower',
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          path('M0 96 Q60 88 120 94 T240 92 V180 H0Z', '#9bd06c'),
          path('M0 108 Q60 100 120 106 T240 104 V180 H0Z', '#a8774e'),
          g(
            { fill: '#8f6340' },
            circ(30, 130, 4, '#8f6340'),
            circ(200, 124, 5, '#8f6340'),
            circ(170, 168, 3, '#8f6340'),
            circ(60, 170, 5, '#8f6340'),
          ),
          line('M40 108 Q44 124 38 136 M200 106 Q196 118 204 128', '#6f8f3a', 2.4, { opacity: 0.7 }),
          tuft(30, 102),
          tuft(214, 100),
        ],
      }),
      sand: (u) => ({
        gy: 156,
        ref: 'cactus',
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
        ref: 'boat',
        kids: [
          sky(u, '#d4eefb', '#f1faff'),
          sunAt(36, 34, 14),
          path('M0 118 H240 V180 H0Z', '#4aa3d8'),
          path('M0 140 H240 V180 H0Z', '#3c92c9'),
          waves(132),
        ],
      }),
      under: (u) => ({
        gy: 110,
        ref: 'weed',
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
      air: (u) => ({
        gy: 132,
        ref: 'flower',
        kids: [
          sky(u, '#d9f1fb', '#f4fbe6'),
          bushes(140, '#c3e6a5'),
          path('M0 150 Q60 140 120 147 T240 144 V180 H0Z', '#9bd06c'),
          at(30, 170, 1, flower(34, '#ff7aa8')),
          at(208, 168, 1, flower(28, '#ffcf3a')),
          at(186, 174, 1, flower(22, '#b07ae0')),
        ],
      }),
      night: (u) => ({
        gy: 116,
        ref: 'grass',
        kids: [
          sky(u, '#1b2550', '#3a4f80'),
          g(
            {},
            [30, 80, 128, 170, 214, 60, 196].map((x, i) => circ(x, 18 + ((i * 37) % 50), i % 3 ? 1.4 : 2, '#fff', { opacity: 0.85 })),
          ),
          path('M206 24 a16 16 0 1 0 12 28 a12 12 0 1 1 -12 -28Z', '#fff2b0'),
          path('M0 146 Q60 134 120 142 T240 138 V180 H0Z', '#1f3a34'),
          line('M14 146 l-4 -16 M22 146 l2 -18 M224 140 l-3 -14 M232 140 l3 -18', '#2f5a4a', 3),
        ],
      }),
    };
    const refObj = (/** @type {string} */ kind, h) => {
      if (kind === 'boat') return sailboat(h);
      if (kind === 'weed')
        return g({}, limb(`M0 0 Q-10 ${-h * 0.35} 0 ${-h * 0.65} Q8 ${-h * 0.85} 0 ${-h}`, '#3f9a5a', Math.max(4, h * 0.07)));
      if (kind === 'cactus') {
        const k = h / 100;
        return at(
          0,
          0,
          k,
          g(
            OUT,
            path('M-22 -40 Q-36 -40 -36 -56 L-36 -64 Q-36 -70 -30 -70 Q-24 -70 -24 -64 L-24 -54 L-14 -54Z', '#5fae5a'),
            path('M14 -54 L26 -54 L26 -72 Q26 -78 32 -78 Q38 -78 38 -72 L38 -50 Q38 -40 24 -40 L14 -40Z', '#5fae5a'),
            path('M-14 0 L-14 -88 Q-14 -100 0 -100 Q14 -100 14 -88 L14 0Z', '#5fae5a'),
            line('M-4 -90 L-4 -6 M6 -90 L6 -6', '#3f8f3a', 2, NO),
          ),
        );
      }
      if (kind === 'grass')
        return g({}, line(`M0 0 Q-4 ${-h * 0.6} 6 ${-h} M8 0 Q10 ${-h * 0.5} 20 ${-h * 0.8}`, '#2f5a4a', Math.max(3, h * 0.06)));
      return flower(h);
    };

    // ---------------- Composing an animal card ----------------
    const note = (x, y, /** @type {string} */ c) =>
      g({}, ell(x, y, 4.6, 3.4, c, { transform: `rotate(-22 ${x} ${y})` }), line(`M${x + 4} ${y - 1} V${y - 18} q6 3 7 9`, c, 2.4));
    /** Sound lines from a mouth (to the right), with notes: «noisy». */
    const noise = (mx, my, k) =>
      g(
        {},
        [10, 18, 26].map((r, i) => {
          const R = r * k;
          const a = 0.75;
          return line(
            `M${mx + R * Math.cos(-a)} ${my + R * Math.sin(-a)}A${R} ${R} 0 0 1 ${mx + R * Math.cos(a)} ${my + R * Math.sin(a)}`,
            '#e2453c',
            Math.max(2.2, 3.4 * k),
            { opacity: 1 - i * 0.18 },
          );
        }),
      );
    /** «shh»: a small soft bubble near the mouth: «quiet». */
    const shh = (x, y, k) =>
      at(
        x,
        y,
        k,
        g(
          {},
          rect(-2, -24, 44, 22, 11, '#fff', { stroke: '#9fb4c0', 'stroke-width': 1.6 }),
          path('M6 -3 L2 6 L14 -3Z', '#fff', { stroke: '#9fb4c0', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }),
          rect(5, -5, 12, 4, 0, '#fff'),
          txt(20, -8, 'shh', {
            'text-anchor': 'middle',
            'font-size': 15,
            'font-weight': 800,
            'font-style': 'italic',
            fill: '#5a7480',
            'font-family': 'ui-rounded,system-ui,sans-serif',
          }),
        ),
      );

    /** A placed animal: its drawing at (cx, gy) with scale s (box centred on cx), and where its mouth ended up. */
    const put = (/** @type {Animal} */ A, /** @type {Pose} */ pose, cx, gy, s, /** @type {Attrs} */ attrs = {}) => {
      const mid = (A.box[0] + A.box[1]) / 2;
      const node = g(attrs, at(cx - mid * s, gy, s, A.draw(pose)));
      return { node, mouth: [cx + (A.mouth[0] - mid) * s, gy + A.mouth[1] * s], s };
    };
    /** Size of the plain pose: a long pose keeps the same scale and simply runs further left (out of the card). */
    const sizeOf = (/** @type {Animal} */ A) => ({ w: A.box[1] - A.box[0], h: -A.box[2] });

    const PLURAL = {
      scorpions: 'scorpion',
      dolphins: 'dolphin',
      snakes: 'snake',
      frogs: 'frog',
      parrots: 'parrot',
      lizards: 'lizard',
      butterflies: 'butterfly',
      worms: 'worm',
      dogs: 'dog',
      birds: 'bird',
      spiders: 'spider',
      fireflies: 'firefly',
    };
    const parse = (/** @type {string} */ key) => {
      const m = /^([a-z]+)(?:-(big|small|noisy|quiet|long))?$/.exec(String(key || ''));
      if (!m) return null;
      const [, word, mod = ''] = m;
      if (ANIMALS[word]) return { name: word, two: word === 'fish', mod };
      if (PLURAL[word]) return { name: PLURAL[word], two: true, mod };
      return null;
    };

    const animalCard = (/** @type {{ name: string, two: boolean, mod: string }} */ p) => {
      const u = uid();
      const A = ANIMALS[p.name];
      const hab = HAB[A.hab](u);
      /** @type {Pose} */
      const pose = { open: p.mod === 'noisy', shut: p.mod === 'quiet', long: p.mod === 'long' };
      const sz = sizeOf(A);
      const gy = hab.gy;
      /** @type {{ node: SVGElement, mouth: number[], s: number }[]} */
      const placed = [];
      const extra = [];
      const fit = (mw, mh) => Math.min(mw / sz.w, mh / sz.h);
      const wide = sz.w / sz.h > 2.2;
      // Reference objects stand on the card's ground (butterflies fly above theirs).
      const base = A.hab === 'air' ? 174 : A.hab === 'soil' ? 104 : gy;
      if (p.name === 'fish') {
        // A small shoal (fish is also the plural); big / small = one fish against the weed
        const shoal =
          p.mod === 'big' || p.mod === 'small'
            ? [[p.mod === 'big' ? 116 : 170, 108, p.mod === 'big' ? 3 : 0.75]]
            : [
                [70, 70, 1.15],
                [150, 58, 1.0],
                [110, 104, 1.25],
                [184, 100, 1.05],
                [64, 134, 0.95],
              ];
        if (p.mod === 'small') extra.push(at(70, 170, 1, refObj('weed', 150)));
        if (p.mod === 'big') extra.push(at(220, 170, 1, refObj('weed', 30)));
        for (const [x, y, sc] of shoal) placed.push(put(A, pose, x, y + 17 * sc, sc));
      } else if (p.name === 'firefly' && p.two) {
        const dots = [
          [40, 40],
          [76, 26],
          [118, 48],
          [168, 30],
          [204, 58],
          [62, 84],
          [150, 88],
          [214, 104],
          [28, 110],
          [100, 120],
        ];
        extra.push(
          g(
            {},
            dots.map(([x, y], i) => [
              circ(x, y, 9, '#fff3a0', { opacity: 0.25, class: 'ea-glow' }),
              circ(x, y, i % 3 ? 2.6 : 3.4, '#ffe96a'),
            ]),
          ),
        );
        placed.push(put(A, pose, 88, 104, 1.5), put(A, pose, 170, 138, 1.25));
      } else if (p.mod === 'small') {
        // Tiny, next to a big reference object (a tall flower, a cactus, a sailboat…)
        const sc = fit(p.two ? 50 : 62, p.two ? 38 : 46);
        const boat = hab.ref === 'boat';
        extra.push(at(boat ? 72 : 64, base + (boat ? 4 : 2), 1, refObj(hab.ref, boat ? 104 : 112)));
        const y = A.hab === 'air' ? gy - 6 : gy;
        if (p.two) placed.push(put(A, pose, 150, y - 4, sc * 0.9), put(A, pose, 196, y, sc));
        else placed.push(put(A, pose, 170, y, sc));
      } else if (p.mod === 'big') {
        // Fills the card (a bit too big for it), with a tiny reference object
        const sc = fit(p.two ? 150 : 250, p.two ? 150 : 166);
        if (p.two) placed.push(put(A, pose, 78, gy - 8, sc * 0.86), put(A, pose, 152, gy + 2, sc));
        else placed.push(put(A, pose, 112, gy + (A.hab === 'water' ? 0 : 8), sc));
        extra.push(at(222, base + 6, 1, refObj(hab.ref, hab.ref === 'boat' ? 22 : 24)));
      } else if (p.two && wide) {
        const sc = fit(170, 56);
        placed.push(put(A, pose, 116, gy - 52, sc * 0.9), put(A, pose, 136, gy, sc));
      } else if (p.two) {
        const sc = fit(118, A.hab === 'air' ? 92 : 120);
        const y = A.hab === 'air' ? gy - 26 : gy;
        placed.push(put(A, pose, 66, A.hab === 'air' ? y - 12 : y - 8, sc * 0.9), put(A, pose, 176, A.hab === 'air' ? y + 18 : y, sc));
      } else {
        const sc = fit(wide ? 168 : 204, A.hab === 'night' ? 70 : Math.min(132, gy - 14));
        placed.push(put(A, pose, wide ? 128 : W / 2, A.hab === 'night' ? gy + 6 : A.hab === 'air' ? gy - 4 : gy, sc));
      }
      const fx = [];
      for (const [i, pl] of placed.entries()) {
        const k = Math.max(0.65, Math.min(1.3, pl.s * 1.1));
        if (p.mod === 'noisy') {
          fx.push(noise(pl.mouth[0] + 2, pl.mouth[1], k));
          if (i === placed.length - 1 || placed.length === 1)
            fx.push(
              note(Math.min(220, pl.mouth[0] + 30 * k), Math.max(30, pl.mouth[1] - 22 * k), '#3f8fc9'),
              note(Math.min(206, pl.mouth[0] + 14 * k), Math.max(26, pl.mouth[1] - 44 * k), '#e2453c'),
            );
        }
        if (p.mod === 'quiet' && i === placed.length - 1) fx.push(shh(Math.min(194, pl.mouth[0] + 6), Math.max(30, pl.mouth[1] - 4), 1));
      }
      return svgEl(
        `0 0 ${W} ${H}`,
        'art-svg ea-card',
        hab.kids,
        extra,
        placed.map((x) => x.node),
        fx,
      );
    };

    // ---------------- People ----------------
    /** @typedef {{ skin: string, hair: string, shirt: string, shorts: string, girl?: boolean, face?: string, arms?: string, num?: string }} Kid */
    /** A kid, front view, feet at the origin, about 128 tall. */
    const kid = (/** @type {Kid} */ k) => {
      const S = k.skin;
      const face = k.face || 'smile';
      const arms = k.arms || 'down';
      const armL =
        arms === 'up'
          ? 'M-15 -82 Q-34 -86 -22 -104'
          : arms === 'hug'
            ? 'M-15 -82 Q-28 -70 -10 -64'
            : arms === 'pole'
              ? 'M-15 -82 Q-30 -72 -24 -60'
              : 'M-15 -82 Q-24 -70 -24 -56';
      const armR =
        arms === 'up'
          ? 'M15 -82 Q34 -86 22 -104'
          : arms === 'thumb'
            ? 'M15 -82 Q34 -76 30 -94'
            : arms === 'point'
              ? 'M15 -82 Q30 -86 44 -94'
              : arms === 'hug' || arms === 'pole'
                ? 'M15 -82 Q30 -72 14 -64'
                : 'M15 -82 Q24 -70 24 -56';
      const handR =
        arms === 'up'
          ? [22, -106]
          : arms === 'thumb'
            ? [30, -96]
            : arms === 'point'
              ? [46, -95]
              : arms === 'hug' || arms === 'pole'
                ? [12, -64]
                : [24, -54];
      const handL = arms === 'up' ? [-22, -106] : arms === 'hug' ? [-8, -64] : arms === 'pole' ? [-24, -58] : [-24, -54];
      const eyes =
        face === 'scared'
          ? [eye(-7, -104, 5, {}, 0), eye(7, -104, 5, {}, 0), line('M-12 -114 L-4 -118 M12 -114 L4 -118', INK, 2.2)]
          : face === 'calm'
            ? [eye(-7, -104, 3.4, { shut: true }), eye(7, -104, 3.4, { shut: true })]
            : [circ(-7, -104, 2.6, INK, NO), circ(7, -104, 2.6, INK, NO), circ(-6, -105, 0.9, '#fff', NO), circ(8, -105, 0.9, '#fff', NO)];
      const mouth =
        face === 'scared'
          ? ell(0, -93, 4, 5.4, '#7a2632')
          : face === 'calm'
            ? path('M-8 -97 Q0 -86 8 -97Z', '#7a2632')
            : line('M-7 -96 Q0 -90 7 -96', INK, 2.4);
      return g(
        OUT,
        k.girl && path('M-19 -110 Q-30 -82 -20 -70 L20 -70 Q30 -82 19 -110Z', k.hair),
        limb('M-7 -42 L-8 -6', S, 8),
        limb('M7 -42 L8 -6', S, 8),
        ell(-10, -3, 9, 5, '#3a3a44'),
        ell(10, -3, 9, 5, '#3a3a44'),
        k.girl
          ? path('M-18 -58 L-24 -36 L24 -36 L18 -58Z', k.shorts)
          : path('M-18 -58 L-20 -38 L-2 -38 L0 -46 L2 -38 L20 -38 L18 -58Z', k.shorts),
        limb(armL, S, 7),
        limb(armR, S, 7),
        path('M-18 -56 Q-20 -84 -6 -88 L6 -88 Q20 -84 18 -56Z', k.shirt),
        path('M-17 -84 Q-24 -80 -24 -72 L-15 -70Z M17 -84 Q24 -80 24 -72 L15 -70Z', k.shirt),
        k.num &&
          txt(0, -64, k.num, {
            'text-anchor': 'middle',
            'font-size': 16,
            'font-weight': 900,
            fill: '#fff',
            stroke: 'none',
            'font-family': 'system-ui,sans-serif',
          }),
        circ(handL[0], handL[1], 5, S),
        circ(handR[0], handR[1], 5, S),
        arms === 'thumb' && limb(`M${handR[0] + 1} ${handR[1] - 3} l1 -7`, S, 3),
        circ(-18, -102, 4.5, S),
        circ(18, -102, 4.5, S),
        circ(0, -104, 18, S),
        k.girl
          ? [
              path('M-19 -104 Q-22 -126 0 -125 Q22 -126 19 -104 Q14 -114 4 -114 Q-6 -118 -19 -104Z', k.hair),
              path('M16 -118 Q34 -116 32 -92 Q26 -100 18 -108Z', k.hair),
              circ(17, -117, 3.4, '#ff6f91'),
            ]
          : path('M-19 -104 Q-21 -127 0 -125 Q21 -127 19 -104 Q12 -116 2 -113 Q-8 -118 -19 -104Z', k.hair),
        eyes,
        mouth,
        face !== 'scared' && [cheek(-11, -96, 3.4), cheek(11, -96, 3.4)],
      );
    };
    const CARLOS = { skin: '#f1c6a0', hair: '#3b2618', shirt: '#2f9a5a', shorts: '#24405a', num: '1' };
    const LUCIA = { skin: '#e2ad84', hair: '#8a4a22', shirt: '#ffb020', shorts: '#d9473b', girl: true };

    // ---------------- Scene pieces ----------------
    const tree = (h, c = '#5cae4a', trunk = '#8a5a32') =>
      g(
        OUT,
        path(`M-7 0 L-5 ${-h * 0.55} L5 ${-h * 0.55} L7 0Z`, trunk),
        circ(-h * 0.2, -h * 0.62, h * 0.24, c),
        circ(h * 0.2, -h * 0.64, h * 0.24, c),
        circ(0, -h * 0.82, h * 0.26, c),
      );
    const spooky = (h) =>
      g(
        {},
        path(`M-8 0 Q-4 ${-h * 0.5} -6 ${-h} L4 ${-h} Q4 ${-h * 0.5} 8 0Z`, '#101a28'),
        line(
          `M-4 ${-h * 0.6} Q-24 ${-h * 0.7} -34 ${-h * 0.9} M-24 ${-h * 0.72} L-36 ${-h * 0.7} M0 ${-h * 0.75} Q18 ${-h * 0.86} 30 ${-h * 1.02} M18 ${-h * 0.86} L32 ${-h * 0.82} M-2 ${-h * 0.95} L-10 ${-h * 1.1}`,
          '#101a28',
          Math.max(3, h * 0.045),
        ),
      );
    const glowEyes = (x, y, s = 1) =>
      g(
        {},
        ell(x - 6 * s, y, 3.6 * s, 2.4 * s, '#ffe14a'),
        ell(x + 6 * s, y, 3.6 * s, 2.4 * s, '#ffe14a'),
        circ(x - 6 * s, y, 1.1 * s, '#2b1b00'),
        circ(x + 6 * s, y, 1.1 * s, '#2b1b00'),
      );
    const glowDot = (x, y, r = 2.6) => [circ(x, y, r * 3.2, '#fff3a0', { opacity: 0.28, class: 'ea-glow' }), circ(x, y, r, '#ffe96a')];
    const meshIn = (/** @type {string} */ clipId, x0, y0, x1, y1, step = 9, c = '#e9dcb8') => {
      let d = '';
      for (let x = x0 - (y1 - y0); x < x1; x += step) d += `M${x} ${y0}L${x + (y1 - y0)} ${y1}`;
      for (let x = x0; x < x1 + (y1 - y0); x += step) d += `M${x} ${y0}L${x - (y1 - y0)} ${y1}`;
      return g({ 'clip-path': `url(#${clipId})` }, line(d, c, 1.6));
    };
    const card = (/** @type {any[]} */ ...kids) => svgEl(`0 0 ${W} ${H}`, 'art-svg ea-card', ...kids);

    /** @type {Record<string, () => SVGElement>} */
    const SCENE_ART = {
      'forest-day': () => {
        const u = uid();
        return card(
          sky(u, '#cdeefe', '#f5fbe8'),
          sunAt(200, 34, 16),
          bushes(120, '#b6dd96'),
          path('M0 128 Q60 118 120 126 T240 122 V180 H0Z', '#9bd06c'),
          path('M100 180 Q118 150 112 140 Q106 130 122 126 L130 126 Q120 132 128 142 Q138 156 150 180Z', '#ecd9a4'),
          at(32, 150, 1, tree(110)),
          at(78, 134, 1, tree(78, '#6cbc52')),
          at(196, 156, 1, tree(116, '#4fa83a')),
          at(164, 132, 1, tree(66, '#79c45e')),
          at(26, 176, 1, flower(20)),
          at(214, 176, 1, flower(18, '#ffcf3a')),
          at(150, 96, 0.3, ANIMALS.butterfly.draw({})),
          tuft(90, 170),
          tuft(176, 172),
        );
      },
      'forest-dark': () => {
        const u = uid();
        return card(
          sky(u, '#0e1630', '#27365e'),
          circ(186, 34, 26, '#fff6c4', { opacity: 0.15 }),
          circ(186, 34, 16, '#fff3b0'),
          g(
            {},
            [24, 70, 120, 222].map((x, i) => circ(x, 16 + i * 7, 1.4, '#fff', { opacity: 0.8 })),
          ),
          path('M0 140 Q60 128 120 136 T240 132 V180 H0Z', '#152238'),
          at(40, 150, 1, spooky(140)),
          at(206, 150, 1, spooky(126)),
          at(126, 140, 1, spooky(92)),
          g(
            {},
            [36, 92, 150, 210].map((x, i) => circ(x, 152 + (i % 2) * 6, 22, '#0c1424')),
          ),
          glowEyes(72, 148),
          glowEyes(170, 154, 0.9),
          glowEyes(110, 100, 0.8),
          glowEyes(210, 96, 0.8),
          path('M150 64 q8 -10 16 0 q8 -10 16 0 q-8 -2 -16 6 q-8 -8 -16 -6Z', '#0a0f1c'),
        );
      },
      home: () => {
        const u = uid();
        return card(
          sky(u, '#3d3a78', '#f2a46e'),
          g(
            {},
            [30, 78, 140, 200].map((x, i) => circ(x, 16 + i * 6, 1.4, '#fff', { opacity: 0.8 })),
          ),
          path('M0 136 Q60 126 120 132 T240 128 V180 H0Z', '#3f5a3a'),
          at(206, 140, 0.9, tree(100, '#2f4a33', '#3a2a22')),
          g(
            OUT,
            rect(92, 30, 12, 30, 2, '#9a4a3a'),
            path('M60 80 L120 34 L180 80Z', '#b8443a'),
            rect(70, 78, 100, 64, 3, '#f3d9b0'),
            rect(108, 104, 24, 38, 3, '#8a5a32'),
            rect(80, 92, 22, 20, 2, '#ffd86b'),
            rect(138, 92, 22, 20, 2, '#ffd86b'),
            line('M91 92 V112 M80 102 H102 M149 92 V112 M138 102 H160', '#c99a3a', 2, NO),
            circ(127, 124, 1.8, '#ffd86b', NO),
          ),
          path('M98 30 q-6 -8 2 -14 q8 -6 0 -14', 'none', { stroke: '#fff', 'stroke-width': 3, opacity: 0.4, 'stroke-linecap': 'round' }),
          ell(91, 102, 20, 16, '#ffe9a0', { opacity: 0.25 }),
          ell(149, 102, 20, 16, '#ffe9a0', { opacity: 0.25 }),
          path('M112 142 Q104 160 90 180 L130 180 Q128 160 128 142Z', '#c9a66a'),
          glowDot(40, 120),
          glowDot(56, 100, 2),
          glowDot(28, 150, 2.2),
          glowDot(190, 160, 2.4),
          glowDot(176, 112, 2),
          glowDot(222, 104, 2.4),
          glowDot(64, 162, 2),
        );
      },
      kids: () => {
        const u = uid();
        return card(
          sky(u, '#cdeefe', '#f5fbe8'),
          sunAt(208, 30, 14),
          bushes(118, '#b6dd96'),
          at(26, 140, 1, tree(104)),
          at(218, 138, 1, tree(96, '#4fa83a')),
          path('M0 134 Q60 124 120 130 T240 126 V180 H0Z', '#9bd06c'),
          path('M70 180 Q100 150 116 136 L140 136 Q150 152 176 180Z', '#ecd9a4'),
          at(96, 170, 1.05, kid({ ...CARLOS, arms: 'down' })),
          at(150, 172, 1.05, kid({ ...LUCIA, arms: 'point' })),
          at(204, 60, 0.26, ANIMALS.butterfly.draw({})),
          at(28, 176, 1, flower(20)),
        );
      },
      boat: () => {
        const u = uid();
        const netL = 'M50 72 Q30 110 26 136 Q42 144 58 136 Q56 108 50 72Z';
        const netR = 'M190 72 Q210 110 214 136 Q198 144 182 136 Q184 108 190 72Z';
        return card(
          el('defs', {}, el('clipPath', { id: `${u}nl` }, path(netL, '#000')), el('clipPath', { id: `${u}nr` }, path(netR, '#000'))),
          sky(u, '#cfeefc', '#f1faff'),
          sunAt(30, 28, 12),
          line('M160 30 q5 -5 10 0 q5 -5 10 0 M190 44 q4 -4 8 0 q4 -4 8 0', INK, 2),
          path('M0 112 H240 V180 H0Z', '#4aa3d8'),
          line('M120 30 V110 M120 40 L50 72 M120 40 L190 72', INK, 3),
          path(netL, '#e9d6a8', { opacity: 0.6 }),
          meshIn(`${u}nl`, 22, 66, 62, 146, 7, '#7a5a2a'),
          line(netL, '#5a3a1a', 2.6),
          path(netR, '#e9d6a8', { opacity: 0.6 }),
          meshIn(`${u}nr`, 178, 66, 218, 146, 7, '#7a5a2a'),
          line(netR, '#5a3a1a', 2.6),
          g(
            OUT,
            rect(98, 72, 44, 34, 4, '#fff'),
            rect(106, 80, 12, 10, 2, '#9fd6f5'),
            rect(124, 80, 12, 10, 2, '#9fd6f5'),
            path('M40 104 L200 104 L184 140 L56 140Z', '#d9473b'),
          ),
          line('M50 116 L190 116', '#fff', 5),
          path('M0 134 H240 V180 H0Z', '#3c92c9', { opacity: 0.85 }),
          waves(146),
        );
      },
      net: () => {
        const u = uid();
        const bag = 'M70 50 Q60 120 92 150 Q120 166 148 150 Q180 120 170 50Z';
        const fishes = [
          [100, 82, 0.7],
          [140, 78, 0.65, true],
          [112, 112, 0.75, true],
          [146, 116, 0.7],
          [92, 132, 0.6],
          [126, 144, 0.6, true],
        ];
        return card(
          el('defs', {}, el('clipPath', { id: `${u}bag` }, path(bag, '#000'))),
          sky(u, '#cfeefc', '#f1faff'),
          path('M0 150 H240 V180 H0Z', '#4aa3d8'),
          waves(160),
          line('M120 0 V36 M120 36 L76 52 M120 36 L164 52', '#6a4a22', 3),
          g(
            { 'clip-path': `url(#${u}bag)` },
            rect(0, 0, W, H, 0, '#dbeef8', { opacity: 0.5 }),
            fishes.map(([x, y, s, f]) => at(x, y, Number(s), ANIMALS.fish.draw({}), !!f)),
          ),
          meshIn(`${u}bag`, 56, 44, 184, 170, 10),
          line(bag, '#6a4a22', 3),
          line('M70 50 Q120 60 170 50', '#6a4a22', 4),
          path('M100 164 q-3 6 0 8 q3 -2 0 -8Z M140 162 q-3 6 0 8 q3 -2 0 -8Z', '#bfe8f7', { stroke: '#4e9fc4', 'stroke-width': 1.4 }),
        );
      },
      hospital: () => {
        const u = uid();
        return card(
          sky(u, '#eaf4f6', '#dceef2'),
          path('M0 146 H240 V180 H0Z', '#c9dfe4'),
          g(OUT, rect(150, 18, 70, 50, 4, '#bfe6fb'), line('M185 18 V68 M150 43 H220', INK, 3)),
          sunAt(170, 34, 7),
          g(OUT, line('M44 128 V158 M172 128 V158', '#8fa3ad', 5), rect(30, 70, 12, 70, 4, '#8fa3ad'), rect(44, 76, 40, 26, 10, '#fff')),
          at(78, 150, 0.66, kid({ skin: '#f1c6a0', hair: '#3b2618', shirt: '#9fd0f0', shorts: '#9fd0f0', arms: 'thumb', face: 'calm' })),
          g(OUT, path('M40 110 L180 110 Q186 110 186 116 L186 150 L40 150Z', '#5f9fd8'), line('M50 120 H176', '#86bde8', 2, NO)),
          at(176, 160, 0.64, ANIMALS.dog.draw({ shut: true }), true),
          path('M136 72 q-8 -10 -14 -2 q-4 8 14 18 q18 -10 14 -18 q-6 -8 -14 2Z', '#ff6f91', OUT),
        );
      },
      fisherman: () => {
        const u = uid();
        return card(
          sky(u, '#ffe1b8', '#fff5e2'),
          sunAt(190, 40, 14),
          path('M0 104 Q20 40 44 70 Q60 30 84 96 L100 104Z', '#b9c9b0'),
          path('M150 106 Q170 48 196 76 Q214 54 240 96 V106Z', '#a7bc9c'),
          path('M0 104 H240 V180 H0Z', '#5fb0d8'),
          waves(118),
          g(
            OUT,
            path('M20 130 L130 130 L124 142 L26 142Z', '#d8b46a'),
            line('M40 130 V142 M60 130 V142 M80 130 V142 M100 130 V142', '#a8843a', 2),
          ),
          line('M60 96 L28 44', '#8a5a32', 3),
          circ(28, 42, 4, '#ffcf3a', OUT),
          at(76, 132, 0.62, kid({ skin: '#e2ad84', hair: '#3b2618', shirt: '#4f7fa8', shorts: '#2b3a4a', arms: 'pole' })),
          path('M50 70 L76 54 L102 70Z', '#e8c27a', OUT),
          at(170, 150, 0.6, ANIMALS.bird.draw({ fish: true })),
          path('M150 148 q20 -8 44 0', 'none', { stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }),
        );
      },
      'kid-afraid': () => {
        const u = uid();
        return card(
          sky(u, '#dfe3f6', '#eef0fa'),
          path('M0 156 H240 V180 H0Z', '#c9cde8'),
          at(120, 168, 1.12, kid({ ...CARLOS, face: 'scared', arms: 'up' })),
          line('M72 70 l-10 -4 M70 86 l-12 0 M72 102 l-10 4 M168 70 l10 -4 M170 86 l12 0 M168 102 l10 4', '#7a7fb0', 3),
          path('M146 44 q-6 10 0 14 q6 -4 0 -14Z', '#9fd6f5', { stroke: '#4e9fc4', 'stroke-width': 1.6 }),
          txt(56, 46, '!', { 'font-size': 30, 'font-weight': 900, fill: '#d9473b', 'font-family': 'system-ui,sans-serif' }),
          txt(178, 40, '!', { 'font-size': 24, 'font-weight': 900, fill: '#d9473b', 'font-family': 'system-ui,sans-serif' }),
        );
      },
      'kid-calm': () => {
        const u = uid();
        return card(
          sky(u, '#fff1c4', '#fffaf0'),
          g(
            { opacity: 0.35 },
            [0, 30, 60, 90, 120, 150].map((a) => path('M120 80 L110 -40 L130 -40Z', '#ffd86b', { transform: `rotate(${a - 75} 120 80)` })),
          ),
          path('M0 156 H240 V180 H0Z', '#bfe3a0'),
          at(120, 168, 1.12, kid({ ...CARLOS, face: 'calm', arms: 'thumb' })),
        );
      },
    };

    // ---------------- art(key) ----------------
    const art = (/** @type {string} */ key) => {
      if (SCENE_ART[key]) return SCENE_ART[key]();
      const p = parse(key);
      return p ? animalCard(p) : null;
    };

    // ---------------- Label scenes (600 × 400) ----------------
    const leader = (x1, y1, x2, y2) =>
      g(
        {},
        line(`M${x1} ${y1}L${x2} ${y2}`, '#fff', 6, { opacity: 0.8 }),
        line(`M${x1} ${y1}L${x2} ${y2}`, INK, 2.6, { 'stroke-dasharray': '1 6' }),
        circ(x2, y2, 6.5, '#d9473b', { stroke: '#fff', 'stroke-width': 2.5 }),
      );
    const sceneOf = (/** @type {any[]} */ inner, /** @type {{ id: string, x: number, y: number, w: number, at: number[] }[]} */ spots) => ({
      el: svgEl(
        '0 0 600 400',
        'scene-svg',
        inner,
        spots.map((s) => leader(s.x, s.y, s.at[0], s.at[1])),
      ),
      box: /** @type {[number, number]} */ ([600, 400]),
      spots: spots.map(({ id, x, y, w }) => ({ id, x, y, w })),
      cls: 'ea-scene',
    });
    const leaf = (x, y, s, rot, c = '#3f9a3a') =>
      g(
        { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` },
        path('M0 0 Q30 -26 70 0 Q30 26 0 0Z', c, OUT),
        line('M4 0 L64 0', '#2e7a2e', 2),
      );
    const jungleBack = (u) => [
      sky(u, '#d4f0fb', '#eef9e0', 600, 400),
      g(
        {},
        [40, 120, 210, 300, 390, 480, 560].map((x, i) => circ(x, 230 + (i % 2) * 14, 70 + (i % 3) * 12, i % 2 ? '#a9d98a' : '#b9e19a')),
      ),
    ];

    /** @type {Record<string, () => ExamScene>} */
    const SCENES = {
      // The jungle: a parrot on a branch, a snake on a log, a lizard on a rock, a scorpion on the sand.
      'jungle-a': () => {
        const u = uid();
        const inner = [
          jungleBack(u),
          path('M0 300 Q150 280 300 296 T600 290 V400 H0Z', '#8cc760'),
          path('M380 330 Q480 300 600 320 V400 H360Z', '#f1cf8a'),
          g(OUT, path('M40 400 L52 60 L92 60 L104 400Z', '#8a5a32'), path('M90 150 Q200 130 300 150 L300 162 Q200 146 92 166Z', '#8a5a32')),
          leaf(280, 150, 0.9, -20),
          leaf(20, 70, 1.2, -40, '#4fae44'),
          leaf(70, 60, 1.1, -120, '#3f9a3a'),
          at(230, 185, 0.82, ANIMALS.parrot.draw({})),
          g(OUT, rect(380, 220, 190, 34, 16, '#9a6a3a'), ell(570, 237, 10, 17, '#c99a62')),
          at(470, 228, 0.78, ANIMALS.snake.draw({})),
          g(OUT, path('M70 362 Q84 312 160 310 Q236 312 246 362Z', '#a3a9ab')),
          at(166, 316, 0.8, ANIMALS.lizard.draw({})),
          at(490, 376, 0.86, ANIMALS.scorpion.draw({})),
          at(250, 388, 1, flower(40)),
          at(572, 384, 1, flower(30, '#ffcf3a')),
        ];
        return sceneOf(inner, [
          { id: 'parrot', x: 410, y: 50, w: 160, at: [262, 92] },
          { id: 'snake', x: 510, y: 140, w: 160, at: [500, 214] },
          { id: 'lizard', x: 310, y: 236, w: 160, at: [212, 298] },
          { id: 'scorpion', x: 340, y: 336, w: 150, at: [460, 352] },
        ]);
      },
      // A river bank: a frog on a stone, a butterfly over the flowers, a worm in the soil, a dolphin in the river.
      'jungle-b': () => {
        const u = uid();
        const inner = [
          jungleBack(u),
          path('M300 236 Q420 220 600 230 V400 H330 Q300 320 300 236Z', '#4aa3d8'),
          line('M360 280 q10 -6 20 0 t20 0 M480 330 q10 -6 20 0 t20 0 M420 370 q10 -6 20 0 t20 0', '#fff', 3, { opacity: 0.6 }),
          path('M0 250 Q160 236 300 246 Q330 300 340 400 H0Z', '#8cc760'),
          path('M0 330 Q170 320 330 330 L340 400 H0Z', '#a8774e'),
          g({}, circ(60, 370, 5, '#8f6340'), circ(250, 380, 6, '#8f6340'), circ(300, 350, 4, '#8f6340')),
          at(200, 250, 1, flower(66)),
          at(240, 252, 1, flower(50, '#ffcf3a')),
          at(170, 256, 1, flower(44, '#b07ae0')),
          at(204, 140, 0.62, ANIMALS.butterfly.draw({})),
          g(OUT, ell(80, 292, 62, 22, '#a3a9ab')),
          at(80, 282, 0.72, ANIMALS.frog.draw({})),
          at(150, 376, 0.82, ANIMALS.worm.draw({})),
          at(452, 300, 0.92, ANIMALS.dolphin.draw({})),
          path('M380 296 q-6 10 0 14 M520 296 q6 10 0 14', 'none', { stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }),
        ];
        return sceneOf(inner, [
          { id: 'frog', x: 90, y: 120, w: 140, at: [86, 210] },
          { id: 'butterfly', x: 340, y: 60, w: 160, at: [236, 100] },
          { id: 'worm', x: 300, y: 300, w: 140, at: [176, 352] },
          { id: 'dolphin', x: 490, y: 140, w: 160, at: [468, 222] },
        ]);
      },
    };
    const scene = (/** @type {string} */ name) => (SCENES[name] ? SCENES[name]() : null);

    // ---------------- Hub hero: the jungle pitch ----------------
    // A passed station (its best round gave 2+ stars, KF.gameData(slug).st) brings its fan in colour; the others are pale
    // silhouettes waiting (index.html: .ea-sk). The frog keeps goal from the start.
    const passedIds = () => {
      const unit = window.EA_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return new Set((unit?.stations || []).filter((s) => (Number(st[s.id]?.stars) || 0) >= 2).map((s) => s.id));
    };
    // Fans around the pitch, one per station in order: [animal, x, y, scale, flip]
    /** @type {[string, number, number, number, boolean][]} */
    const FANS = [
      ['parrot', 62, 112, 0.42, false],
      ['lizard', 48, 262, 0.42, false],
      ['snake', 300, 118, 0.36, true],
      ['butterfly', 250, 74, 0.3, false],
      ['dog', 316, 262, 0.42, true],
      ['worm', 110, 290, 0.38, false],
      ['scorpion', 260, 292, 0.36, true],
      ['spider', 334, 196, 0.3, false],
      ['bird', 34, 212, 0.34, false],
      ['firefly', 112, 70, 0.55, false],
    ];
    const hero = () => {
      const u = uid();
      const unit = window.EA_CONTENT;
      const stations = unit?.stations || [];
      const passed = passedIds();
      const all = stations.length > 0 && stations.every((s) => passed.has(s.id));
      const fans = stations.slice(0, FANS.length).map((s, i) => {
        const [name, x, y, sc, flip] = FANS[i];
        const on = passed.has(s.id);
        const A = ANIMALS[name];
        const mid = (A.box[0] + A.box[1]) / 2;
        return g(
          { class: on ? 'ea-fan ea-on' : 'ea-fan ea-sk', 'data-station': s.id, style: `--d:${(i * 0.41).toFixed(2)}s` },
          at(x - (flip ? -mid : mid) * sc, y, sc, A.draw({ open: on && all }), flip),
        );
      });
      const pitch = 'M30 300 L112 150 L248 150 L330 300Z';
      const inner = [
        el(
          'defs',
          {},
          grad(`${u}sky`, '#c9ecfb', '#effae4'),
          el('clipPath', { id: `${u}fr` }, rect(8, 8, 344, 288, 30, '#000')),
          el('clipPath', { id: `${u}pt` }, path(pitch, '#000')),
        ),
        g(
          { 'clip-path': `url(#${u}fr)` },
          rect(0, 0, 360, 300, 0, `url(#${u}sky)`),
          sunAt(300, 44, 16),
          g(
            {},
            [20, 70, 130, 200, 260, 330].map((x, i) => circ(x, 150 + (i % 2) * 8, 46 + (i % 3) * 8, i % 2 ? '#9fd27e' : '#b4dd94')),
          ),
          at(24, 170, 1, tree(150, '#4fa83a')),
          at(340, 176, 1, tree(160, '#5cae4a')),
          path('M0 150 H360 V300 H0Z', '#86c45a'),
          path(pitch, '#5fb04a'),
          g(
            { 'clip-path': `url(#${u}pt)` },
            [0, 1, 2, 3, 4].map((i) => rect(0, 150 + i * 32, 360, 16, 0, '#6cbc52')),
          ),
          g(
            { fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.9, 'stroke-linejoin': 'round' },
            path(pitch, 'none'),
            path('M140 150 L132 178 L228 178 L220 150', 'none'),
            path('M72 226 H288', 'none'),
            ell(180, 226, 34, 10, 'none'),
          ),
          g(
            OUT,
            path('M136 150 L136 104 L224 104 L224 150', 'none', { stroke: '#fff', 'stroke-width': 5 }),
            path('M136 150 L136 104 L224 104 L224 150', 'none', { stroke: INK, 'stroke-width': 1.4 }),
          ),
          line(
            'M140 108 L220 108 M140 120 L220 120 M140 132 L220 132 M140 144 L220 144 M150 104 V150 M166 104 V150 M182 104 V150 M198 104 V150 M214 104 V150',
            '#ffffff',
            1.2,
            { opacity: 0.7 },
          ),
          at(180, 152, 0.46, ANIMALS.frog.draw({ keeper: true, open: all })),
          g(OUT, circ(184, 262, 11, '#fff'), path('M184 255 L190 259 L188 266 L180 266 L178 259Z', INK, NO)),
          path('M60 20 Q50 60 74 112', 'none', { stroke: '#4f8a3a', 'stroke-width': 3 }),
          leaf(-6, 30, 1.2, 20, '#4fae44'),
          leaf(366, 30, 1.2, 160, '#3f9a3a'),
          leaf(10, 70, 0.9, -10, '#5cbf4a'),
          fans,
          all &&
            g(
              {},
              rect(124, 22, 112, 38, 12, '#ffd23f', { stroke: INK, 'stroke-width': 3 }),
              txt(180, 50, 'GOAL!', {
                'text-anchor': 'middle',
                'font-size': 25,
                'font-weight': 900,
                fill: INK,
                'letter-spacing': 1.5,
                'font-family': 'ui-rounded,system-ui,sans-serif',
              }),
            ),
        ),
        rect(8, 8, 344, 288, 30, 'none', { stroke: '#2f6a3a', 'stroke-width': 6 }),
        !all &&
          g(
            {},
            rect(130, 18, 100, 34, 10, '#1d3a2a', { stroke: '#2f6a3a', 'stroke-width': 3 }),
            txt(180, 41, `${passed.size} / ${stations.length}`, {
              'text-anchor': 'middle',
              'font-size': 19,
              'font-weight': 900,
              fill: '#c9f269',
              'font-family': 'ui-rounded,system-ui,sans-serif',
              style: 'font-variant-numeric:tabular-nums',
            }),
          ),
      ];
      const svg = svgEl('0 0 360 300', 'hero-svg ea-hero', inner);
      svg.dataset.passed = String(passed.size);
      return svg;
    };

    return {
      art,
      scene,
      hero,
      has: (/** @type {string} */ key) => !!key && (!!SCENE_ART[key] || !!parse(key)),
    };
  })()
);
