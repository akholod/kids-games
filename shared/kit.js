// Player shirt avatars ("kits"): the stored format, the choices and parsing.
// Shared by the pages (classic script → globalThis.KFKit) and the Worker (imports this file to validate avatars),
// so nothing here may touch the DOM at load time.
//
// Stored in users.avatar as `k:<pattern>:<color1>:<color2>:<mark>`, e.g. `k:stripes:red:white:10`, `k:plain:blue:blue:⚽`.
// mark = a number 1–99 or a picture from MARKS. Old avatars (a bare picture from the first 12 MARKS) stay valid:
// a plain shirt in the colour the catalog always gave that player (LEGACY by user id).
(() => {
  /** @type {Record<KFKitColor, string>} */
  const COLORS = {
    red: '#e2463f',
    orange: '#f07a2a',
    yellow: '#f2b632',
    green: '#18a06a',
    teal: '#1c9fb0',
    sky: '#5cc3f0',
    blue: '#2f7de1',
    navy: '#1f3a7a',
    purple: '#8a5ad8',
    pink: '#e85b9a',
    white: '#f7f6f0',
    black: '#24262c',
  };
  /** Colours of old avatars, picked by user id (the catalog's former KITS order). @type {KFKitColor[]} */
  const LEGACY = ['red', 'blue', 'yellow', 'purple', 'green', 'orange', 'pink', 'teal'];
  /** Always available. @type {KFKitPattern[]} */
  const PATTERNS = ['plain', 'stripes', 'hoops', 'halves', 'sash'];
  /** Special shirts, unlocked by an achievement (checked on the client only). @type {KFKitSpecial[]} */
  const SPECIALS = [
    { id: 'checker', need: 'perfect' },
    { id: 'fire', need: 'streak-5' },
    { id: 'retro', need: 'days-3' },
    { id: 'keeper', need: 'futsal' },
    { id: 'lightning', need: 'streak-15' },
    { id: 'abc', need: 'words-30' },
    { id: 'math', need: 'math-exam' },
    { id: 'world', need: 'planet-notable' },
    { id: 'galaxy', need: 'legend' },
    { id: 'champion', need: 'goals-200' },
  ];
  /** Pictures for the chest; the first 12 are the old avatars. */
  const MARKS = ['⚽', '🧤', '🥅', '🏆', '⭐', '🔥', '🦁', '🐯', '🦊', '🐼', '🚀', '⚡', '🦅', '🐺', '🦈', '🐉', '👑', '💎'];

  const isColor = (/** @type {string} */ c) => Object.hasOwn(COLORS, c);
  const isPattern = (/** @type {string} */ p) => PATTERNS.some((x) => x === p) || SPECIALS.some((s) => s.id === p);
  const isMark = (/** @type {string} */ m) => MARKS.includes(m) || /^[1-9][0-9]?$/.test(m);

  /** Is `avatar` a storable avatar (the new format or an old picture)? The Worker's only check. */
  const valid = (/** @type {unknown} */ avatar) => {
    if (typeof avatar !== 'string' || avatar.length > 40) return false;
    if (MARKS.slice(0, 12).includes(avatar)) return true;
    const p = avatar.split(':');
    return p.length === 5 && p[0] === 'k' && isPattern(p[1]) && isColor(p[2]) && isColor(p[3]) && isMark(p[4]);
  };

  /** The colour an old avatar (or a broken one) gets: by user id, else by name. */
  const legacyColor = (/** @type {{ id?: number | string; name?: string } | undefined} */ user) => {
    const id = Math.abs(Number.parseInt(String(user?.id ?? ''), 10));
    const n = id || [...String(user?.name ?? '')].reduce((a, c) => a + (c.codePointAt(0) || 0), 0);
    return LEGACY[n % LEGACY.length];
  };

  /** Any stored avatar → a kit to draw. Never throws; unknown values give a plain shirt with a ball. */
  const parse = (/** @type {unknown} */ avatar, /** @type {{ id?: number | string; name?: string }} */ user) => {
    const a = typeof avatar === 'string' ? avatar.trim() : '';
    if (valid(a) && a.startsWith('k:')) {
      const [, pattern, c1, c2, mark] = a.split(':');
      return /** @type {KFKit} */ ({ pattern, c1, c2, mark });
    }
    const c = legacyColor(user);
    return /** @type {KFKit} */ ({ pattern: 'plain', c1: c, c2: c, mark: MARKS.includes(a) ? a : MARKS[0] });
  };

  /** A kit → the stored string (validated: throws on a bad kit, so a bug never reaches the server). */
  const format = (/** @type {KFKit} */ kit) => {
    const s = `k:${kit.pattern}:${kit.c1}:${kit.c2}:${kit.mark}`;
    if (!valid(s)) throw new Error(`bad kit ${s}`);
    return s;
  };

  /** The achievement that unlocks a special pattern (null = always available). */
  const need = (/** @type {string} */ pattern) => SPECIALS.find((s) => s.id === pattern)?.need ?? null;

  /** Is the pattern available with these achievements (`KF.get().achievements`)? */
  const unlocked = (/** @type {string} */ pattern, /** @type {Record<string, unknown> | undefined} */ achievements) => {
    const n = need(pattern);
    return !n || !!achievements?.[n];
  };

  /** @type {KFKitData} */
  const api = { COLORS, LEGACY, PATTERNS, SPECIALS, MARKS, valid, parse, format, need, unlocked, legacyColor };

  // ---- Renderer: KFKit.svg(kit) → an <svg> shirt (pages only; touches `document` only when called) ----
  // viewBox 0 0 100 100. Layers: base colour → pattern / special art (clipped to the shirt) → shading → collar, cuffs → outline → mark.
  const NS = 'http://www.w3.org/2000/svg';
  let seq = 0;

  /** @param {string} hex */
  const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  /** Relative luminance 0–1. @param {string} hex */
  const lum = (hex) => {
    const [r, g, b] = rgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.04 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  /** Mix with black (k < 0) or white (k > 0). @param {string} hex @param {number} k */
  const shade = (hex, k) =>
    `#${rgb(hex)
      .map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')}`;
  /** Collar/cuff colour of a one-colour shirt: white on dark and mid colours, dark on light ones. @param {string} hex */
  const contrast = (hex) => (lum(hex) > 0.45 ? '#1f2a33' : '#ffffff');

  /**
   * An SVG element with attributes and children.
   * @param {string} tag @param {Record<string, string | number>} [attrs] @param {(Node | string)[]} kids
   * @returns {SVGElement}
   */
  const s = (tag, attrs = {}, ...kids) => {
    const el = /** @type {SVGElement} */ (document.createElementNS(NS, tag));
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    el.append(...kids);
    return el;
  };
  /** <linearGradient> from [offset, colour, opacity?] stops. @param {KFKitCtx} ctx @param {string} name @param {[number, string, number?][]} stops @param {Record<string, string | number>} [dir] */
  const grad = (ctx, name, stops, dir = { x1: 0, y1: 0, x2: 0, y2: 1 }) => {
    const id = `${ctx.id}-${name}`;
    ctx.defs.append(
      s('linearGradient', { id, ...dir }, ...stops.map(([o, c, a = 1]) => s('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }))),
    );
    return `url(#${id})`;
  };
  /** A 5-point star path. @param {number} cx @param {number} cy @param {number} r */
  const star = (cx, cy, r) =>
    `M${Array.from({ length: 10 }, (_, i) => {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const d = i % 2 ? r * 0.45 : r;
      return `${(cx + d * Math.cos(a)).toFixed(2)} ${(cy + d * Math.sin(a)).toFixed(2)}`;
    }).join('L')}Z`;
  /** Marks a part that moves on animated shirts (kk-* keyframes in kf.css), with an optional delay in s. @param {SVGElement} el @param {string} name @param {number} [delay] */
  const live = (el, name, delay = 0) => {
    if (name) el.classList.add(name);
    if (delay) el.style.setProperty('--d', `${delay}s`);
    return el;
  };

  // Shapes: short sleeves (field players) and long padded sleeves (goalkeeper).
  const SHAPES = {
    short: {
      body: 'M38 8Q50 20 62 8L77 12Q88 17 96 30L85 46L75 39L75 90Q50 95 25 90L25 39L15 46L4 30Q12 17 23 12Z',
      sleeves: ['M23 12Q12 17 4 30L15 46L25 39Q28 25 23 12Z', 'M77 12Q88 17 96 30L85 46L75 39Q72 25 77 12Z'],
      cuffs: ['M4 30L15 46L18.4 43.1L7.4 27.1Z', 'M96 30L85 46L81.6 43.1L92.6 27.1Z'],
    },
    long: {
      body: 'M38 8Q50 20 62 8L77 12Q90 18 94 40L97 68L85 70L80 45L75 40L75 90Q50 95 25 90L25 40L20 45L15 70L3 68L6 40Q10 18 23 12Z',
      sleeves: ['M23 12Q10 18 6 40L3 68L15 70L20 45L25 40Q28 25 23 12Z', 'M77 12Q90 18 94 40L97 68L85 70L80 45L75 40Q72 25 77 12Z'],
      cuffs: ['M3 68L15 70L15.7 64.5L3.4 62.5Z', 'M97 68L85 70L84.3 64.5L96.6 62.5Z'],
    },
  };
  const NECK = 'M38 8Q50 20 62 8';

  /** The 5 basic patterns: c2 drawn over the c1 base. @type {Record<KFKitPattern, (ctx: KFKitCtx) => void>} */
  const BASIC = {
    plain: () => {},
    stripes: (ctx) => {
      for (const x of [25, 35, 47, 59, 71])
        ctx.art.append(s('rect', { x, y: 0, width: x === 25 || x === 71 ? 4 : 6, height: 100, fill: ctx.c2 }));
    },
    hoops: (ctx) => {
      for (const y of [24, 40, 56, 72]) ctx.art.append(s('rect', { x: 0, y, width: 100, height: 8, fill: ctx.c2 }));
    },
    halves: (ctx) => ctx.art.append(s('rect', { x: 50, y: 0, width: 50, height: 100, fill: ctx.c2 })),
    sash: (ctx) => ctx.art.append(s('rect', { x: -20, y: 43, width: 140, height: 14, fill: ctx.c2, transform: 'rotate(48 50 50)' })),
  };

  /**
   * Special shirts, one entry per KFKit.SPECIALS id (new specials = a new entry; ids without one get a plain shirt with a gold star).
   * uses: which of the player's colours the art takes (the editor hides the others); bg: the colour behind the mark (for its ink).
   * Parts with a kk-* class move on the profile's big shirts only (svg(kit, { animate: true }); CSS in kf.css).
   * @type {Record<string, KFKitArt>}
   */
  const ART = {
    checker: {
      uses: { c1: true, c2: true },
      draw(ctx) {
        const q = 50 / 7;
        const id = `${ctx.id}-chk`;
        ctx.defs.append(
          s(
            'pattern',
            { id, patternUnits: 'userSpaceOnUse', width: 2 * q, height: 2 * q, x: 50 - q / 2, y: 4 },
            s('rect', { width: q, height: q, fill: ctx.c2 }),
            s('rect', { x: q, y: q, width: q, height: q, fill: ctx.c2 }),
          ),
        );
        ctx.art.append(s('rect', { width: 100, height: 100, fill: `url(#${id})` }));
      },
    },
    fire: {
      uses: { c1: false, c2: false },
      bg: '#2a1719',
      trim: '#ff8a1f',
      draw(ctx) {
        ctx.art.append(
          s('rect', {
            width: 100,
            height: 100,
            fill: grad(ctx, 'fb', [
              [0, '#24161a'],
              [0.55, '#3d1418'],
              [1, '#6b1010'],
            ]),
          }),
          live(
            s('path', {
              fill: grad(ctx, 'fo', [
                [0, '#e8261a'],
                [0.45, '#ff6a1a'],
                [1, '#ffb21f'],
              ]),
              d: 'M18 100L18 78C26 74 24 64 30 57C31 66 35 69 37 72C37 62 42 54 41 43C49 52 52 61 49 70C54 65 57 58 55 48C64 57 66 67 61 75C66 71 69 66 69 58C75 66 77 72 74 79C77 77 80 75 82 71L82 100Z',
            }),
            'kk-flicker',
          ),
          live(
            s('path', {
              fill: grad(ctx, 'fi', [
                [0, '#ffb21f'],
                [1, '#fff1a0'],
              ]),
              d: 'M24 100L25 86C29 82 29 77 32 72C34 78 37 80 38 84C40 76 44 70 44 63C49 70 50 77 48 83C52 79 55 75 55 68C60 75 61 81 58 86C62 84 64 81 65 77C69 83 70 88 70 92L72 100Z',
            }),
            'kk-flicker',
            0.35,
          ),
          // sparks around the mark
          ...[
            [33, 44, 1.5, 0],
            [67, 41, 1.3, 0.7],
            [30, 64, 1.1, 1.3],
            [70, 63, 1.4, 0.4],
            [50, 37, 1, 1.7],
          ].map(([cx, cy, r, d]) => live(s('circle', { cx, cy, r, fill: '#ffcf4a' }), 'kk-rise', d)),
        );
      },
    },
    retro: {
      uses: { c1: true, c2: true },
      collar: false,
      draw(ctx) {
        const weave = `${ctx.id}-wv`;
        ctx.defs.append(
          s(
            'pattern',
            { id: weave, patternUnits: 'userSpaceOnUse', width: 1.6, height: 1.6 },
            s('rect', { width: 0.8, height: 1.6, fill: '#fff' }),
          ),
        );
        // three stripes down each sleeve
        const stripes = [
          [24, 17, 7, 34.5],
          [25, 22, 9.2, 37.7],
          [25.5, 27, 11.4, 40.9],
        ];
        for (const [x1, y1, x2, y2] of stripes)
          for (const m of [false, true])
            ctx.art.append(
              s('path', {
                d: `M${m ? 100 - x1 : x1} ${y1}L${m ? 100 - x2 : x2} ${y2}`,
                stroke: ctx.c2,
                'stroke-width': 1.7,
                'stroke-linecap': 'round',
              }),
            );
        // faded cloth: a warm wash and a fine weave
        ctx.art.append(
          s('rect', { width: 100, height: 100, fill: '#f1e2bf', opacity: 0.2 }),
          s('rect', { width: 100, height: 100, fill: `url(#${weave})`, opacity: 0.07 }),
        );
        // lace-up collar: the V opening, two collar wings, the laces
        const lace = '#f3ead2';
        ctx.top.append(
          s('path', { d: 'M40 8L50 22L60 8Q50 11 40 8Z', fill: shade(ctx.c1, -0.45) }),
          s('path', { d: 'M50 21V35', stroke: shade(ctx.c1, -0.5), 'stroke-width': 1 }),
          s('path', {
            d: 'M47.6 24L52.4 27.6M52.4 24L47.6 27.6M47.6 29L52.4 32.6M52.4 29L47.6 32.6',
            stroke: lace,
            'stroke-width': 1.1,
            'stroke-linecap': 'round',
          }),
          ...['M37 7L50 22L41 26L29 13Z', 'M63 7L50 22L59 26L71 13Z'].map((d) =>
            s('path', { d, fill: ctx.c2, stroke: shade(ctx.c2, -0.35), 'stroke-width': 0.7, 'stroke-linejoin': 'round' }),
          ),
        );
      },
    },
    keeper: {
      uses: { c1: true, c2: false },
      shape: 'long',
      draw(ctx) {
        // neon trim that stands out from the shirt colour
        const neon = [COLORS.green, COLORS.teal, COLORS.yellow, COLORS.white].includes(ctx.c1) ? '#ff3fa4' : '#c6ff1a';
        ctx.trim = neon;
        // «the wall»: bricks over the chest
        let d = '';
        for (let y = 16, row = 0; y <= 88; y += 6, row++) {
          d += `M25 ${y}H75`;
          for (let x = 25 + (row % 2 ? 6.25 : 0); x < 75; x += 12.5) d += `M${x} ${y}V${y + 6}`;
        }
        ctx.art.append(
          s('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.16, 'stroke-width': 0.8, transform: 'translate(0.6 0.6)' }),
          s('path', { d, fill: 'none', stroke: shade(ctx.c1, -0.4), 'stroke-opacity': 0.55, 'stroke-width': 0.9 }),
          // padded elbows with neon stitching
          ...[
            [11.5, 6],
            [88.5, -6],
          ].map(([cx, rot]) =>
            s(
              'g',
              { transform: `rotate(${rot} ${cx} 50)` },
              s('rect', { x: cx - 6.5, y: 42, width: 13, height: 16, rx: 4.5, fill: shade(ctx.c1, -0.38) }),
              s('path', {
                d: `M${cx - 5} 47.5H${cx + 5}M${cx - 5} 52.5H${cx + 5}`,
                stroke: neon,
                'stroke-width': 0.9,
                'stroke-dasharray': '1.4 1',
              }),
            ),
          ),
          s('path', { d: 'M25 12V90M75 12V90', stroke: neon, 'stroke-width': 1.4 }),
        );
      },
    },
    lightning: {
      uses: { c1: false, c2: false },
      bg: '#232b40',
      trim: '#ffd400',
      draw(ctx) {
        const bolt = '61 8 33 55 48 55 37 98 71 43 55 43 69 8';
        ctx.art.append(
          s('rect', {
            width: 100,
            height: 100,
            fill: grad(ctx, 'lb', [
              [0, '#141a29'],
              [0.5, '#27304a'],
              [1, '#3a4560'],
            ]),
          }),
          // storm clouds
          ...[
            [30, 18, 16, 7],
            [64, 14, 18, 7],
            [22, 30, 10, 5],
            [80, 28, 12, 5],
          ].map(([cx, cy, rx, ry]) => s('ellipse', { cx, cy, rx, ry, fill: '#0d1220', opacity: 0.55 })),
          live(
            s('polygon', { points: bolt, fill: '#fff36b', opacity: 0.3, transform: 'translate(50 52) scale(1.2) translate(-50 -52)' }),
            'kk-flash',
          ),
          live(
            s('polygon', {
              points: bolt,
              fill: grad(ctx, 'lf', [
                [0, '#fff7a8'],
                [1, '#ffc400'],
              ]),
              stroke: '#ff9f00',
              'stroke-width': 1,
            }),
            'kk-flash',
            0.05,
          ),
          ...[
            [29, 46, 0.9],
            [74, 62, 0],
            [27, 74, 1.6],
          ].map(([x, y, dl]) =>
            live(s('path', { d: `M${x} ${y - 4}L${x + 1.4} ${y}L${x} ${y + 4}L${x - 1.4} ${y}Z`, fill: '#fff36b' }), 'kk-twinkle', dl),
          ),
        );
      },
    },
    abc: {
      uses: { c1: false, c2: false },
      bg: '#1f3a7a',
      trim: '#ffffff',
      draw(ctx) {
        ctx.art.append(s('rect', { width: 100, height: 100, fill: '#1f3a7a' }));
        const letters = [
          ['A', 32, 26, 11, -15, '#ffd54a'],
          ['B', 66, 25, 10, 12, '#ffffff'],
          ['C', 30, 82, 11, 10, '#5cc3f0'],
          ['D', 70, 83, 10, -12, '#ff7a6e'],
          ['e', 30, 52, 9, -8, '#ffffff'],
          ['K', 71, 50, 10, 14, '#ffd54a'],
          ['z', 42, 37, 7, -20, '#ff7a6e'],
          ['q', 60, 37, 7, 16, '#5cc3f0'],
          ['G', 50, 88, 8, 0, '#ffffff'],
          ['X', 88, 37, 7, 28, '#ffd54a'],
        ];
        letters.forEach(([ch, x, y, size, rot, fill], i) =>
          ctx.art.append(
            live(
              s(
                'g',
                {},
                s(
                  'text',
                  {
                    x,
                    y,
                    fill,
                    'font-size': size,
                    'font-weight': 900,
                    'font-family': "'Arial Rounded MT Bold',system-ui,sans-serif",
                    'text-anchor': 'middle',
                    'dominant-baseline': 'central',
                    transform: `rotate(${rot} ${x} ${y})`,
                  },
                  String(ch),
                ),
              ),
              'kk-float',
              (i % 4) * 0.5,
            ),
          ),
        );
        // a little Union Jack on the sleeve
        ctx.art.append(
          s(
            'g',
            { transform: 'translate(13.5 33) rotate(-36) translate(-6.5 -3.9)' },
            s('rect', { width: 13, height: 7.8, fill: '#012169' }),
            s('path', { d: 'M0 0L13 7.8M13 0L0 7.8', stroke: '#fff', 'stroke-width': 1.6 }),
            s('path', { d: 'M0 0L13 7.8M13 0L0 7.8', stroke: '#c8102e', 'stroke-width': 0.6 }),
            s('path', { d: 'M6.5 0V7.8M0 3.9H13', stroke: '#fff', 'stroke-width': 2.4 }),
            s('path', { d: 'M6.5 0V7.8M0 3.9H13', stroke: '#c8102e', 'stroke-width': 1.3 }),
            s('rect', { width: 13, height: 7.8, fill: 'none', stroke: '#000', 'stroke-opacity': 0.25, 'stroke-width': 0.4 }),
          ),
        );
      },
    },
    math: {
      uses: { c1: false, c2: false },
      bg: '#fbfbf4',
      trim: '#2f5fb3',
      ink: '#1d2b6b',
      draw(ctx) {
        let grid = '';
        for (let v = 2; v < 100; v += 5) grid += `M${v} 0V100M0 ${v}H100`;
        ctx.art.append(
          s('rect', { width: 100, height: 100, fill: '#fbfbf4' }),
          s('path', { d: grid, stroke: '#8fb8e3', 'stroke-width': 0.45, opacity: 0.8 }),
          s('path', { d: 'M31 0V100', stroke: '#e98a8a', 'stroke-width': 0.8 }),
        );
        const blue = '#2f5fb3';
        const red = '#d8433b';
        const signs = [
          ['3×4=12', 50, 31, 7.5, 0, blue],
          ['7', 36, 47, 9, -10, blue],
          ['+', 68, 46, 11, 0, red],
          ['=', 34, 72, 10, 0, red],
          ['5', 67, 73, 9, 8, blue],
          ['×', 40, 85, 9, 0, red],
          ['8', 60, 86, 8, -6, blue],
          ['1', 12, 35, 7, -30, blue],
          ['+', 88, 35, 8, 0, red],
        ];
        signs.forEach(([t, x, y, size, rot, fill], i) =>
          ctx.art.append(
            live(
              s(
                'g',
                {},
                s(
                  'text',
                  {
                    x,
                    y,
                    fill,
                    'font-size': size,
                    'font-weight': 700,
                    'font-family': "'Comic Sans MS','Chalkboard SE','Comic Neue',system-ui,sans-serif",
                    'text-anchor': 'middle',
                    'dominant-baseline': 'central',
                    transform: `rotate(${rot} ${x} ${y})`,
                  },
                  String(t),
                ),
              ),
              i ? 'kk-twinkle' : '',
              (i % 3) * 0.6,
            ),
          ),
        );
      },
    },
    world: {
      uses: { c1: false, c2: false },
      bg: '#1866c0',
      trim: '#f2c14e',
      draw(ctx) {
        const land = { fill: '#6cc56a', stroke: '#2f7d34', 'stroke-width': 0.6, 'stroke-linejoin': 'round' };
        ctx.art.append(
          s('rect', {
            width: 100,
            height: 100,
            fill: grad(ctx, 'wo', [
              [0, '#2a8ae0'],
              [1, '#0f4f9c'],
            ]),
          }),
          // meridians and parallels
          s(
            'g',
            { fill: 'none', stroke: '#fff', 'stroke-opacity': 0.25, 'stroke-width': 0.7 },
            ...[9, 18, 27].map((rx) => s('ellipse', { cx: 50, cy: 52, rx, ry: 46 })),
            s('path', { d: 'M50 6V98M4 30Q50 36 96 30M4 52H96M4 74Q50 68 96 74' }),
          ),
          ...[
            'M27 20C31 17 37 18 39 22C40 25 37 27 35 30C33 33 31 32 29 35C27 32 26 28 26 25C26 23 26 21 27 20Z',
            'M37 44C40 43 42 46 41 51C40 56 38 60 37 66C36 69 35 70 34 67C34 62 33 57 33 52C33 48 34 45 37 44Z',
            'M50 21C53 19 57 20 57 23C57 25 54 26 52 26C50 26 49 23 50 21Z',
            'M51 30C55 29 60 31 61 36C62 42 59 47 57 53C56 57 54 60 52 58C51 54 50 50 48 47C46 44 46 40 47 36C48 33 49 31 51 30Z',
            'M60 18C65 15 72 16 76 20L76 31C72 33 68 31 66 30C63 29 60 24 60 18Z',
            'M64 64C67 63 70 64 70 67C70 70 67 71 65 70C63 69 62 66 64 64Z',
          ].map((d) => s('path', { ...land, d })),
          s('path', { d: 'M20 89Q50 84 80 89L80 100L20 100Z', fill: '#eef5fb' }),
          // compass on the sleeve
          s('circle', { cx: 87, cy: 33, r: 5.4, fill: '#fdf6e3', stroke: '#8a6200', 'stroke-width': 0.7 }),
          s('path', { d: 'M87 28.4V29.6M87 36.4V37.6M82.4 33H83.6M90.4 33H91.6', stroke: '#8a6200', 'stroke-width': 0.6 }),
          live(
            s(
              'g',
              {},
              s('path', { d: 'M87 28.6L88.5 33H85.5Z', fill: '#d8433b' }),
              s('path', { d: 'M87 37.4L88.5 33H85.5Z', fill: '#1f3a7a' }),
            ),
            'kk-sway',
          ),
        );
      },
    },
    galaxy: {
      uses: { c1: false, c2: false },
      bg: '#141a52',
      trim: '#ffd54a',
      draw(ctx) {
        const nebula = (/** @type {string} */ name, /** @type {string} */ color) => {
          const id = `${ctx.id}-${name}`;
          ctx.defs.append(
            s(
              'radialGradient',
              { id },
              s('stop', { offset: 0, 'stop-color': color, 'stop-opacity': 0.6 }),
              s('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }),
            ),
          );
          return `url(#${id})`;
        };
        ctx.art.append(
          s('rect', {
            width: 100,
            height: 100,
            fill: grad(ctx, 'gb', [
              [0, '#0b1446'],
              [0.6, '#1d1660'],
              [1, '#3a1470'],
            ]),
          }),
          s('ellipse', { cx: 36, cy: 66, rx: 30, ry: 20, fill: nebula('n1', '#ff5fb7'), transform: 'rotate(-25 36 66)' }),
          s('ellipse', { cx: 62, cy: 42, rx: 24, ry: 14, fill: nebula('n2', '#3fd0ff'), transform: 'rotate(20 62 42)' }),
          ...[
            [33, 23, 3.2, '#fff6c8'],
            [58, 30, 2, '#fff6c8'],
            [44, 37, 1.5, '#fff6c8'],
            [69, 52, 2.6, '#ffd54a'],
            [30, 47, 2, '#fff6c8'],
            [57, 77, 3, '#ffd54a'],
            [36, 81, 1.8, '#fff6c8'],
            [69, 83, 2, '#fff6c8'],
            [12, 32, 1.7, '#fff6c8'],
            [88, 36, 1.7, '#fff6c8'],
          ].map(([cx, cy, r, fill], i) => live(s('path', { d: star(+cx, +cy, +r), fill }), 'kk-twinkle', (i % 5) * 0.45)),
          ...[
            [40, 16],
            [62, 41],
            [27, 64],
            [73, 68],
            [50, 71],
            [20, 38],
            [80, 28],
          ].map(([cx, cy]) => s('circle', { cx, cy, r: 0.7, fill: '#fff', opacity: 0.8 })),
          // ringed planet
          live(
            s(
              'g',
              { transform: 'rotate(-18 66 20)' },
              s('ellipse', { cx: 66, cy: 20, rx: 10, ry: 3, fill: 'none', stroke: '#ffe2a8', 'stroke-width': 1.3 }),
              s('circle', {
                cx: 66,
                cy: 20,
                r: 5.5,
                fill: grad(ctx, 'pl', [
                  [0, '#ffd59a'],
                  [1, '#e07a4a'],
                ]),
              }),
              s('path', { d: 'M56 20A10 3 0 0 0 76 20', fill: 'none', stroke: '#ffe2a8', 'stroke-width': 1.3 }),
            ),
            'kk-float',
          ),
        );
      },
    },
    champion: {
      uses: { c1: false, c2: false },
      bg: '#fbfaf5',
      edge: '#5a4100',
      draw(ctx) {
        const gold = grad(
          ctx,
          'gd',
          [
            [0, '#a8740a'],
            [0.3, '#f7d774'],
            [0.45, '#fff4c2'],
            [0.6, '#e2b23a'],
            [1, '#b8860b'],
          ],
          { x1: 0, y1: 0, x2: 100, y2: 100, gradientUnits: 'userSpaceOnUse' },
        );
        const chevron = grad(
          ctx,
          'gc',
          [
            [0, '#c8961e'],
            [0.5, '#f5d660'],
            [1, '#b8860b'],
          ],
          { x1: 25, y1: 0, x2: 75, y2: 0, gradientUnits: 'userSpaceOnUse' },
        );
        ctx.trim = gold;
        ctx.ink = gold;
        ctx.art.append(
          s('rect', { width: 100, height: 100, fill: '#fbfaf5' }),
          s('path', { d: 'M25 18L50 34L75 18V25L50 41L25 25Z', fill: chevron }),
          s('path', { d: 'M25 18L50 34L75 18M25 25L50 41L75 25', fill: 'none', stroke: '#8a6200', 'stroke-width': 0.5 }),
          ...[
            [41, 23.5],
            [50, 26.5],
            [59, 23.5],
          ].map(([cx, cy]) => s('path', { d: star(cx, cy, 3.2), fill: chevron, stroke: '#8a6200', 'stroke-width': 0.5 })),
          live(s('polygon', { points: '40,0 52,0 22,100 10,100', fill: '#fff', opacity: 0.45 }), 'kk-shimmer'),
        );
      },
    },
  };
  /** A special without its own art yet: a plain shirt in the player's colour with a gold star. @type {KFKitArt} */
  const FALLBACK = {
    uses: { c1: true, c2: true },
    draw(ctx) {
      ctx.art.append(s('path', { d: star(50, 29, 5), fill: '#ffd54a', stroke: '#8a6200', 'stroke-width': 0.8 }));
    },
  };
  const artOf = (/** @type {string} */ pattern) =>
    Object.hasOwn(BASIC, pattern) ? null : Object.hasOwn(ART, pattern) ? ART[pattern] : FALLBACK;

  /** Which of the player's colours a pattern shows (the editor hides the unused colour rows). */
  const uses = (/** @type {string} */ pattern) => artOf(pattern)?.uses ?? { c1: true, c2: true };

  /**
   * The shirt as an <svg>. Mark and title are text nodes (avatars come from the server: never markup).
   * @param {KFKit} kit
   * @param {KFKitSvgOpts} [opts]
   */
  const svg = (kit, { size, title, className = '', animate = false } = {}) => {
    const k = kit && typeof kit === 'object' ? kit : parse('', {});
    const hex = (/** @type {string} */ c, /** @type {string} */ dflt) => (Object.hasOwn(COLORS, c) ? COLORS[c] : dflt);
    const c1 = hex(k.c1, COLORS.blue);
    const c2 = hex(k.c2, c1);
    const art = artOf(k.pattern);
    const shape = SHAPES[art?.shape || 'short'];
    const id = `kfk${++seq}`;
    const defs = s('defs');
    const root = s('svg', {
      viewBox: '0 0 100 100',
      class: `kf-kit ${animate ? 'is-live ' : ''}${className}`.trim(),
      focusable: 'false',
      'data-kit-pattern': k.pattern,
    });
    if (size) {
      root.setAttribute('width', String(size));
      root.setAttribute('height', String(size));
    }
    if (title) {
      root.setAttribute('role', 'img');
      root.append(s('title', {}, title));
    } else root.setAttribute('aria-hidden', 'true');

    /** @type {KFKitCtx} */
    const ctx = { id, defs, c1, c2, art: s('g'), top: s('g') };
    defs.append(s('clipPath', { id: `${id}-clip` }, s('path', { d: shape.body })));
    ctx.art.append(s('rect', { width: 100, height: 100, fill: c1 }));
    if (art) art.draw(ctx);
    else BASIC[/** @type {KFKitPattern} */ (k.pattern)]?.(ctx);

    const plainTrim = c1 === c2 ? contrast(c1) : c2;
    const trim = ctx.trim || art?.trim || (art && !art.uses.c2 ? contrast(c1) : plainTrim);
    const shading = s(
      'g',
      {},
      ...shape.sleeves.map((d) => s('path', { d, fill: '#000', opacity: 0.1 })),
      s('rect', {
        width: 100,
        height: 100,
        fill: grad(
          ctx,
          'sh',
          [
            [0, '#000', 0.24],
            [0.3, '#000', 0],
            [0.5, '#fff', 0.14],
            [0.7, '#000', 0],
            [1, '#000', 0.26],
          ],
          { x1: 0, y1: 0, x2: 1, y2: 0 },
        ),
      }),
      s('rect', {
        width: 100,
        height: 100,
        fill: grad(ctx, 'sv', [
          [0, '#fff', 0.18],
          [0.3, '#fff', 0],
          [0.8, '#000', 0],
          [1, '#000', 0.16],
        ]),
      }),
      s('path', { d: 'M23 12Q28 25 25 39M77 12Q72 25 75 39', fill: 'none', stroke: '#000', opacity: 0.2, 'stroke-width': 1 }),
      ...shape.cuffs.map((d) => s('path', { d, fill: trim })),
    );
    root.append(
      defs,
      s('g', { 'clip-path': `url(#${id}-clip)` }, ctx.art, shading),
      // inside of the back of the neck, then the collar band (unless the art has its own collar)
      ...(art?.collar === false
        ? []
        : [
            s('path', { d: `${NECK}Q50 12 38 8Z`, fill: shade(art?.bg || c1, -0.45) }),
            s('path', { d: 'M38 8Q50 12 62 8', fill: 'none', stroke: trim, 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
            s('path', { d: NECK, fill: 'none', stroke: trim, 'stroke-width': 4.5, 'stroke-linecap': 'round' }),
          ]),
      s('path', { d: shape.body, fill: 'none', stroke: '#0d2a1f', 'stroke-opacity': 0.5, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
      ctx.top,
    );

    // The mark: readable on any colour (ink by the colour behind it + an outline in the opposite tone).
    const bg = art?.bg || c1;
    const light = lum(bg) > 0.45;
    const ink = ctx.ink || art?.ink || (light ? '#13241d' : '#ffffff');
    const edge = ctx.edge || art?.edge || (light ? '#ffffff' : '#0b1f17');
    const mark = String(k.mark ?? '');
    if (/^[1-9][0-9]?$/.test(mark)) {
      root.append(
        s(
          'text',
          {
            x: 50,
            y: 51, // chest height, like a real kit
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'font-family': "Bahnschrift,'DIN Alternate','Arial Narrow',system-ui,sans-serif",
            'font-weight': 800,
            'font-size': mark.length > 1 ? 31 : 35,
            'letter-spacing': mark.length > 1 ? -1 : 0,
            fill: ink,
            stroke: edge,
            'stroke-opacity': light ? 0.85 : 0.6,
            'stroke-width': 3.4,
            'stroke-linejoin': 'round',
            'paint-order': 'stroke',
          },
          mark,
        ),
      );
    } else if (mark) {
      defs.append(
        s(
          'filter',
          { id: `${id}-halo`, x: '-30%', y: '-30%', width: '160%', height: '160%' },
          s('feDropShadow', { dx: 0, dy: 0.8, stdDeviation: 1.3, 'flood-color': edge, 'flood-opacity': light ? 0.9 : 0.55 }),
        ),
      );
      root.append(
        s(
          'text',
          {
            x: 50,
            y: 52,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            'font-family': "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
            'font-size': 29,
            filter: `url(#${id}-halo)`,
          },
          mark,
        ),
      );
    }
    return /** @type {SVGSVGElement} */ (/** @type {unknown} */ (root));
  };

  /** @type {Pick<KFKitAPI, 'svg' | 'uses' | 'ART'>} */
  const render = { svg, uses, ART };
  /** @type {any} */ (globalThis).KFKit = Object.assign(/** @type {any} */ (globalThis).KFKit || {}, api, render);
})();
