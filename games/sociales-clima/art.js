// Drawings for «La vuelta al mundo en globo» (Ciencias Sociales 3.º, Tema 2): task stickers (`art`, 160 × 120), the label scenes
// `globo` (zones and imaginary lines) and `relieve` (interior + coast, the nine forms of book p. 37), the spot scenes `valle`,
// `costa`, `llanura` (tap what people made), the Spain base map of spainMap, the weather symbols and the hub hero — a hot-air
// balloon over a travel diary: every passed station sticks its stamp in the diary.
// Flat travel-poster style, our own drawings (never scans from the book). No DOM at load time (the unit tests load this file in a vm).
// window.SCArt = { art(key), hero(), scene(name), spotScene(name), spotItems(name), spotNames(), map(), weather(id, size?),
//                  weatherId(token), has(key), keys() }
// @ts-check
'use strict';

window.SCArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `sc${++uidN}`;
    const svgEl = (/** @type {string} */ viewBox, inner = '', cls = 'art-svg') => {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('viewBox', viewBox);
      el.setAttribute('class', cls);
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('focusable', 'false');
      el.innerHTML = inner;
      return el;
    };
    const r1 = (/** @type {number} */ v) => Math.round(v * 10) / 10;
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, /** @type {string} */ inner) =>
      `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">${inner}</g>`;

    // Palette: sky, sunset, balloon stripes, diary paper; one navy ink for the few outlines.
    const K = '#2b3a4a';
    const SKY_L = '#d8f0fb';
    const DUSK = '#ffe2b8';
    const SUN = '#ffc93c';
    const RED = '#e2483d';
    const YEL = '#ffcf3f';
    const SEA = '#4aa3d8';
    const SEA_D = '#2f7fc0';
    const SAND = '#f2dc9e';
    const GRASS = '#8cc35e';
    const GRASS_D = '#6aa84f';
    const ROCK = '#b3a796';
    const ROCK_D = '#93877a';
    const PAPER_C = '#fbf3df';

    // ---------------- Pieces (origin = foot / centre) ----------------
    /** A vertical gradient (id) from c1 to c2. */
    const grad = (/** @type {string} */ id, /** @type {string} */ c1, /** @type {string} */ c2) =>
      `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`;
    const sun = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, rays = true) =>
      `<g transform="translate(${x} ${y})">${
        rays
          ? `<g stroke="${SUN}" stroke-width="${r1(r * 0.22)}" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              return `<path d="M${r1(Math.cos(a) * r * 1.35)} ${r1(Math.sin(a) * r * 1.35)}L${r1(Math.cos(a) * r * 1.75)} ${r1(Math.sin(a) * r * 1.75)}"/>`;
            }).join('')}</g>`
          : ''
      }<circle r="${r}" fill="${SUN}"/><circle r="${r1(r * 0.62)}" cx="${r1(-r * 0.18)}" cy="${r1(-r * 0.18)}" fill="#ffe17a"/></g>`;
    /** A puffy cloud centred on x, y, ~64 × 30 at s = 1. */
    const cloud = (/** @type {number} */ x, /** @type {number} */ y, s = 1, fill = '#fff', shade = '#e3eef5') =>
      at(
        x,
        y,
        s,
        `<path d="M-30 12A12 12 0 0 1 -24 -8A16 16 0 0 1 4 -16A13 13 0 0 1 26 -4A10 10 0 0 1 30 12Z" fill="${fill}"/><path d="M-30 12H30A10 10 0 0 0 31 6Q0 12 -31 6A12 12 0 0 0 -30 12Z" fill="${shade}"/>`,
      );
    const drops = (/** @type {[number, number][]} */ pts, c = '#3d8fd6') =>
      pts.map(([x, y]) => `<path d="M${x} ${y - 6}Q${x + 4} ${y} ${x} ${y + 3}Q${x - 4} ${y} ${x} ${y - 6}Z" fill="${c}"/>`).join('');
    const conifer = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h, c = '#2f6e3c', c2 = '#25592f') => {
      const w = h * 0.4;
      const tiers = `M0 ${-h}L${w * 0.55} ${-h * 0.62}H${w * 0.3}L${w * 0.8} ${-h * 0.34}H${w * 0.48}L${w} ${-h * 0.12}H${-w}L${-w * 0.48} ${-h * 0.34}H${-w * 0.8}L${-w * 0.3} ${-h * 0.62}H${-w * 0.55}Z`;
      const half = `M0 ${-h}L${w * 0.55} ${-h * 0.62}H${w * 0.3}L${w * 0.8} ${-h * 0.34}H${w * 0.48}L${w} ${-h * 0.12}H0Z`;
      const fix = (/** @type {string} */ d) => d.replace(/-?\d+(\.\d+)?/g, (m) => String(r1(Number(m))));
      return `<g transform="translate(${r1(x)} ${r1(y)})"><rect x="${r1(-h * 0.05)}" y="${r1(-h * 0.16)}" width="${r1(h * 0.1)}" height="${r1(h * 0.16)}" fill="#7a5233"/><path d="${fix(tiers)}" fill="${c}"/><path d="${fix(half)}" fill="${c2}"/></g>`;
    };
    /** A round leafy tree (holm oak, beech…): canopy radius r. */
    const roundTree = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, c = '#5f8f3a', c2 = '#4d7a2e') =>
      `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M${r1(-r * 0.12)} 0L${r1(-r * 0.08)} ${r1(-r * 1.1)}H${r1(r * 0.08)}L${r1(r * 0.12)} 0Z" fill="#7a5233"/>
        <circle cy="${r1(-r * 1.35)}" r="${r}" fill="${c}"/><path d="M${r} ${r1(-r * 1.35)}A${r} ${r} 0 0 1 ${r1(-r * 0.5)} ${r1(-r * 0.48)}A${r1(r * 0.9)} ${r1(r * 0.9)} 0 0 0 ${r} ${r1(-r * 1.35)}Z" fill="${c2}"/></g>`;
    /** A big broadleaf tree: three lobes (beech, chestnut, oak). */
    const broadTree = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, c = '#4caf50', c2 = '#3d9442') =>
      `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M${r1(-r * 0.14)} 0Q${r1(-r * 0.1)} ${r1(-r * 0.8)} ${r1(-r * 0.4)} ${r1(-r * 1.2)}M${r1(r * 0.14)} 0Q${r1(r * 0.1)} ${r1(-r * 0.8)} ${r1(r * 0.4)} ${r1(-r * 1.2)}" stroke="#7a5233" stroke-width="${r1(r * 0.16)}" fill="none" stroke-linecap="round"/><path d="M${r1(-r * 0.16)} 0H${r1(r * 0.16)}L${r1(r * 0.1)} ${r1(-r * 0.9)}H${r1(-r * 0.1)}Z" fill="#7a5233"/>
        <circle cx="${r1(-r * 0.55)}" cy="${r1(-r * 1.3)}" r="${r1(r * 0.62)}" fill="${c}"/><circle cx="${r1(r * 0.55)}" cy="${r1(-r * 1.3)}" r="${r1(r * 0.62)}" fill="${c2}"/><circle cy="${r1(-r * 1.75)}" r="${r1(r * 0.7)}" fill="${c}"/>
        <circle cx="${r1(r * 0.2)}" cy="${r1(-r * 1.55)}" r="${r1(r * 0.35)}" fill="${c2}" opacity=".55"/></g>`;
    /** An umbrella pine: a tall bare trunk and a flat crown. */
    const umbrellaPine = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h, c = '#4f7f3a', c2 = '#3f6a2e') =>
      `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M-3 0Q0 ${r1(-h * 0.45)} ${r1(h * 0.12)} ${r1(-h * 0.78)}" stroke="#7a5233" stroke-width="${r1(h * 0.08)}" fill="none" stroke-linecap="round"/>
        <ellipse cx="${r1(h * 0.12)}" cy="${r1(-h * 0.86)}" rx="${r1(h * 0.46)}" ry="${r1(h * 0.17)}" fill="${c}"/><path d="M${r1(h * 0.58)} ${r1(-h * 0.86)}A${r1(h * 0.46)} ${r1(h * 0.17)} 0 0 1 ${r1(-h * 0.34)} ${r1(-h * 0.86)}Q${r1(h * 0.12)} ${r1(-h * 0.75)} ${r1(h * 0.58)} ${r1(-h * 0.86)}Z" fill="${c2}"/></g>`;
    /** A savanna acacia: a thin crooked trunk and a flat wide crown. */
    const acacia = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h) =>
      `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M0 0L2 ${r1(-h * 0.5)}L${r1(-h * 0.25)} ${r1(-h * 0.82)}M2 ${r1(-h * 0.5)}L${r1(h * 0.3)} ${r1(-h * 0.84)}" stroke="#6b4a2e" stroke-width="${r1(h * 0.07)}" fill="none" stroke-linecap="round"/>
        <path d="M${r1(-h * 0.62)} ${r1(-h * 0.82)}Q0 ${r1(-h * 1.12)} ${r1(h * 0.62)} ${r1(-h * 0.82)}Z" fill="#7f9a35"/><path d="M${r1(-h * 0.62)} ${r1(-h * 0.82)}Q0 ${r1(-h * 0.92)} ${r1(h * 0.62)} ${r1(-h * 0.82)}Z" fill="#6a832b"/></g>`;
    const baobab = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h) =>
      `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M${r1(-h * 0.2)} 0Q${r1(-h * 0.16)} ${r1(-h * 0.5)} ${r1(-h * 0.1)} ${r1(-h * 0.72)}H${r1(h * 0.1)}Q${r1(h * 0.16)} ${r1(-h * 0.5)} ${r1(h * 0.2)} 0Z" fill="#9c7a5a"/>
        <path d="M${r1(-h * 0.08)} ${r1(-h * 0.7)}L${r1(-h * 0.3)} ${r1(-h * 0.92)}M0 ${r1(-h * 0.7)}V${r1(-h * 0.98)}M${r1(h * 0.08)} ${r1(-h * 0.7)}L${r1(h * 0.3)} ${r1(-h * 0.92)}" stroke="#9c7a5a" stroke-width="${r1(h * 0.05)}" stroke-linecap="round"/>
        <g fill="#8aa33a"><ellipse cx="${r1(-h * 0.32)}" cy="${r1(-h * 0.95)}" rx="${r1(h * 0.13)}" ry="${r1(h * 0.07)}"/><ellipse cy="${r1(-h * 1.02)}" rx="${r1(h * 0.14)}" ry="${r1(h * 0.07)}"/><ellipse cx="${r1(h * 0.32)}" cy="${r1(-h * 0.95)}" rx="${r1(h * 0.13)}" ry="${r1(h * 0.07)}"/></g></g>`;
    const palm = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ h, lean = 1) =>
      `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M0 0Q${r1(lean * h * 0.05)} ${r1(-h * 0.5)} ${r1(lean * h * 0.2)} ${r1(-h)}" stroke="#a87a4a" stroke-width="${r1(h * 0.08)}" fill="none" stroke-linecap="round"/>
        <g transform="translate(${r1(lean * h * 0.2)} ${r1(-h)})" fill="#3f9a4a">${[-150, -110, -60, -20, 25]
          .map(
            (a) =>
              `<path transform="rotate(${a})" d="M0 0Q${r1(h * 0.25)} ${r1(-h * 0.14)} ${r1(h * 0.48)} ${r1(h * 0.04)}Q${r1(h * 0.24)} ${r1(-h * 0.03)} 0 0Z"/>`,
          )
          .join('')}</g></g>`;
    const shrub = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ w, c = '#7d8f4a') =>
      `<path d="M${r1(x - w / 2)} ${y}Q${r1(x - w / 2)} ${r1(y - w * 0.45)} ${r1(x - w * 0.12)} ${r1(y - w * 0.4)}Q${x} ${r1(y - w * 0.62)} ${r1(x + w * 0.2)} ${r1(y - w * 0.38)}Q${r1(x + w / 2)} ${r1(y - w * 0.4)} ${r1(x + w / 2)} ${y}Z" fill="${c}"/>`;
    /** A mountain with its foot from x0 to x1 at y, the top at (tx, ty); `snow` = a snow cap. */
    const mountain = (
      /** @type {number} */ x0,
      /** @type {number} */ x1,
      /** @type {number} */ y,
      /** @type {number} */ tx,
      /** @type {number} */ ty,
      c = ROCK,
      c2 = ROCK_D,
      snow = true,
    ) => {
      const sl = (/** @type {number} */ t) => [r1(tx + (x0 - tx) * t), r1(ty + (y - ty) * t)];
      const sr = (/** @type {number} */ t) => [r1(tx + (x1 - tx) * t), r1(ty + (y - ty) * t)];
      const [lx, ly] = sl(0.28);
      const [rx, ry] = sr(0.3);
      return `<path d="M${x0} ${y}L${tx} ${ty}L${x1} ${y}Z" fill="${c}"/><path d="M${tx} ${ty}L${x1} ${y}H${r1(tx + (x1 - tx) * 0.15)}Z" fill="${c2}"/>${
        snow
          ? `<path d="M${tx} ${ty}L${rx} ${ry}L${r1((tx + rx) / 2 + 2)} ${r1(ry - 3)}L${tx} ${r1(ry + 2)}L${r1((tx + lx) / 2)} ${r1(ly - 3)}L${lx} ${ly}Z" fill="#fff"/>`
          : ''
      }`;
    };
    /** Sea waves: short white strokes. */
    const waves = (/** @type {[number, number][]} */ pts, w = 14, c = '#fff', o = 0.75) =>
      `<g stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="${o}">${pts.map(([x, y]) => `<path d="M${x} ${y}q${w / 4} -4 ${w / 2} 0t${w / 2} 0"/>`).join('')}</g>`;
    const house = (/** @type {number} */ x, /** @type {number} */ y, w = 22, wall = '#fbf3df', roof = '#d9573f') =>
      `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="${-w * 0.7}" width="${w}" height="${r1(w * 0.7)}" fill="${wall}"/><path d="M${r1(-w * 0.62)} ${r1(-w * 0.68)}L0 ${r1(-w * 1.15)}L${r1(w * 0.62)} ${r1(-w * 0.68)}Z" fill="${roof}"/>
        <rect x="${r1(-w * 0.12)}" y="${r1(-w * 0.34)}" width="${r1(w * 0.24)}" height="${r1(w * 0.34)}" fill="#8a5a3a"/><rect x="${r1(-w * 0.4)}" y="${r1(-w * 0.55)}" width="${r1(w * 0.18)}" height="${r1(w * 0.16)}" fill="#7cc4ef"/></g>`;
    /** A sticker frame 160 × 120: a sky gradient (or a flat fill) and a clip; `inner` is drawn inside. */
    const tile = (/** @type {string} */ u, /** @type {string} */ c1, /** @type {string} */ c2, /** @type {string} */ inner) =>
      `<defs>${grad(`${u}s`, c1, c2)}<clipPath id="${u}c"><rect width="160" height="120" rx="16"/></clipPath></defs>
       <g clip-path="url(#${u}c)"><rect width="160" height="120" fill="url(#${u}s)"/>${inner}</g>`;
    /** Seen from above (cabo, golfo, isla): sea, its wave marks and a sandy rim under the land. */
    const topSea = (/** @type {string} */ land) =>
      `<rect width="160" height="120" fill="${SEA}"/>${waves(
        [
          [16, 18],
          [118, 100],
          [130, 22],
          [20, 96],
          [72, 106],
        ],
        14,
        '#fff',
        0.55,
      )}<path d="${land}" fill="${SAND}" stroke="${SAND}" stroke-width="7" stroke-linejoin="round"/><path d="${land}" fill="${GRASS}"/>`;

    // ---------------- Task stickers (160 × 120) ----------------
    /** @type {Record<string, (u: string) => string>} */
    const ART = {
      taiga: (u) =>
        tile(
          u,
          '#bcdcee',
          '#eef6fa',
          `<path d="M0 70Q40 58 80 64T160 60V120H0Z" fill="#a9c6d3"/><path d="M0 92Q60 84 160 90V120H0Z" fill="#f2f7fa"/>
           ${[
             [14, 78, 34],
             [36, 72, 40],
             [58, 76, 34],
             [128, 74, 38],
             [148, 78, 32],
             [24, 104, 46],
             [52, 108, 52],
             [82, 104, 46],
             [110, 108, 54],
             [140, 106, 46],
           ]
             .map(([x, y, h]) => conifer(x, y, h, y > 90 ? '#2f6e3c' : '#4a8255', y > 90 ? '#25592f' : '#3d6f47'))
             .join('')}`,
        ),
      tundra: (u) =>
        tile(
          u,
          '#c6d6df',
          '#eef2f4',
          `<path d="M0 66Q50 54 96 62T160 58V120H0Z" fill="#c9d3c4"/><path d="M0 74Q80 66 160 72V120H0Z" fill="#b5a86e"/>
           <path d="M8 82Q30 78 52 84Q30 88 8 82ZM96 96Q122 90 150 98Q124 104 96 96ZM40 108Q60 104 82 110Q60 114 40 108Z" fill="#fff"/>
           ${shrub(30, 98, 22, '#8a9a4a')}${shrub(72, 90, 16, '#a2683e')}${shrub(118, 84, 18, '#7d8f4a')}${shrub(132, 112, 22, '#94743e')}${shrub(14, 116, 16, '#7d8f4a')}${shrub(92, 114, 14, '#a2683e')}
           <g fill="#6f8f3a" opacity=".7"><ellipse cx="54" cy="100" rx="9" ry="3"/><ellipse cx="102" cy="108" rx="10" ry="3"/><ellipse cx="146" cy="88" rx="7" ry="2.5"/></g>
           <g fill="#8d8a84"><ellipse cx="86" cy="80" rx="6" ry="3.6"/><ellipse cx="22" cy="88" rx="4" ry="2.6"/></g>`,
        ),
      'bosque-mediterraneo': (u) =>
        tile(
          u,
          '#a9dcf5',
          '#fdf1d0',
          `${sun(128, 24, 10)}<path d="M0 70Q60 58 160 66V120H0Z" fill="#d8c27a"/><path d="M0 88Q80 80 160 86V120H0Z" fill="#e7d08a"/>
           ${umbrellaPine(44, 92, 62)}${roundTree(100, 98, 15)}${roundTree(140, 90, 11, '#6f8f3a', '#5b7a2e')}${roundTree(14, 84, 10, '#6f8f3a', '#5b7a2e')}
           ${shrub(72, 104, 14, '#8a9a4a')}${shrub(124, 110, 12, '#8a9a4a')}<g fill="#c9ae62"><ellipse cx="30" cy="110" rx="12" ry="2.5"/><ellipse cx="116" cy="102" rx="9" ry="2"/></g>`,
        ),
      'bosque-frondoso': (u) =>
        tile(
          u,
          '#a9cfe6',
          '#e6f3ea',
          `${cloud(118, 22, 0.8, '#eef4f8', '#d3e0e8')}${drops([
            [104, 40],
            [118, 46],
            [132, 40],
          ])}<path d="M0 74Q60 64 160 70V120H0Z" fill="#6aa84f"/><path d="M0 98Q80 90 160 96V120H0Z" fill="#7dbb5a"/>
           ${broadTree(18, 86, 16, '#3d9442', '#2f7d37')}${broadTree(52, 80, 18, '#4caf50', '#3d9442')}${broadTree(132, 82, 17, '#3d9442', '#2f7d37')}
           ${broadTree(90, 104, 22, '#4caf50', '#3d9442')}${broadTree(146, 112, 16, '#5cbf5c', '#4caf50')}${broadTree(30, 114, 18, '#5cbf5c', '#4caf50')}
           <g fill="#2f7d37"><path d="M60 116q4 -12 10 -14q-2 8 -6 14zM120 118q2 -10 8 -12q-1 7 -4 12z"/></g>`,
        ),
      selva: (u) =>
        tile(
          u,
          '#9fd0b0',
          '#cfe8d4',
          `<g fill="#2f7d3c"><circle cx="12" cy="30" r="26"/><circle cx="54" cy="18" r="28"/><circle cx="100" cy="24" r="26"/><circle cx="146" cy="16" r="30"/></g>
           <g fill="#3f9a4a"><circle cx="30" cy="52" r="22"/><circle cx="78" cy="46" r="24"/><circle cx="124" cy="50" r="22"/></g>
           <g stroke="#6b4a2e" stroke-width="6" stroke-linecap="round"><path d="M34 120V60M84 120V56M130 120V60"/></g>
           <g stroke="#3f8a3a" stroke-width="2" fill="none"><path d="M56 40q-4 20 2 40M108 36q4 22 -2 44M20 50q-3 16 2 30"/></g>
           <path d="M0 96Q40 88 80 96T160 92V120H0Z" fill="#2f7d3c"/>
           <g fill="#4caf50"><path d="M0 120Q10 92 34 88Q22 104 16 120Z"/><path d="M40 120Q48 96 70 92Q58 106 54 120Z"/><path d="M92 120Q96 98 118 92Q108 108 104 120Z"/><path d="M130 120Q140 96 160 92V120Z"/></g>
           <g fill="#e2483d"><circle cx="60" cy="88" r="3.4"/><circle cx="114" cy="84" r="3"/></g><g fill="${YEL}"><circle cx="22" cy="82" r="2.6"/></g>
           ${drops(
             [
               [70, 70],
               [146, 66],
               [10, 70],
             ],
             '#bfe3ff',
           )}`,
        ),
      sabana: (u) =>
        tile(
          u,
          '#ffd59a',
          '#fff1d4',
          `${sun(40, 30, 14, false)}<path d="M0 76Q60 68 160 74V120H0Z" fill="#e8c75a"/><path d="M0 96Q80 88 160 94V120H0Z" fill="#f0d36a"/>
           ${acacia(108, 92, 62)}${baobab(32, 92, 46)}${acacia(150, 80, 26)}
           <g stroke="#c9a23a" stroke-width="2" stroke-linecap="round">${[
             [10, 112],
             [24, 108],
             [60, 114],
             [76, 106],
             [96, 116],
             [130, 110],
             [148, 116],
           ]
             .map(([x, y]) => `<path d="M${x} ${y}l-3 -8M${x} ${y}v-9M${x} ${y}l3 -8"/>`)
             .join('')}</g>`,
        ),
      laurisilva: (u) =>
        tile(
          u,
          '#c9dfd6',
          '#e8f1ec',
          `<path d="M0 64Q50 50 160 60V120H0Z" fill="#4f8a5a"/>
           ${roundTree(20, 92, 18, '#2f6e3c', '#25592f')}${roundTree(58, 86, 20, '#3a7a46', '#2f6e3c')}${roundTree(100, 92, 19, '#2f6e3c', '#25592f')}${roundTree(140, 86, 18, '#3a7a46', '#2f6e3c')}
           <path d="M0 102Q80 94 160 100V120H0Z" fill="#3a7a46"/>
           <g fill="#5cbf5c">${[16, 46, 84, 120, 150].map((x) => `<path d="M${x} 118q-8 -12 -14 -12q8 2 14 12zM${x} 118q8 -12 14 -12q-8 2 -14 12z"/>`).join('')}</g>
           <g fill="#fff" opacity=".7"><rect x="-10" y="56" width="120" height="9" rx="4.5"/><rect x="50" y="74" width="130" height="8" rx="4"/><rect x="-6" y="88" width="90" height="7" rx="3.5"/></g>`,
        ),
      montana: (u) =>
        tile(
          u,
          '#9fd3f2',
          '#e6f5fb',
          `${cloud(130, 26, 0.6)}${mountain(0, 78, 100, 30, 50)}${mountain(40, 160, 100, 92, 12)}${mountain(110, 170, 100, 146, 52)}
           <path d="M0 96Q60 88 160 94V120H0Z" fill="${GRASS}"/><path d="M0 108Q80 102 160 106V120H0Z" fill="${GRASS_D}"/>`,
        ),
      llanura: (u) =>
        tile(
          u,
          '#a9dcf5',
          '#eaf7fc',
          `${cloud(42, 26, 0.7)}${cloud(124, 34, 0.5)}<path d="M0 66H160V120H0Z" fill="#9ccc65"/>
           <g fill="#b5d87a"><path d="M0 72H160V80H0Z"/><path d="M0 90H160V100H0Z"/></g><path d="M0 108H160V120H0Z" fill="#8cc35e"/>
           ${roundTree(130, 68, 5, '#5f8f3a', '#4d7a2e')}${roundTree(140, 68, 4, '#5f8f3a', '#4d7a2e')}${roundTree(24, 68, 4, '#5f8f3a', '#4d7a2e')}`,
        ),
      valle: (u) =>
        tile(
          u,
          '#9fd3f2',
          '#e6f5fb',
          `${mountain(-20, 74, 110, 22, 16)}${mountain(86, 180, 110, 136, 20)}
           <path d="M40 60L80 60L120 120H20Z" fill="${GRASS}"/><path d="M58 60H100L136 120H120L80 60Z" fill="${GRASS_D}" opacity=".35"/>
           ${mountain(-30, 60, 120, 0, 40, '#9d9384', '#81786b', false)}${mountain(100, 190, 120, 168, 44, '#9d9384', '#81786b', false)}
           <path d="M66 60Q78 76 66 90Q56 104 76 120" stroke="${SEA}" stroke-width="7" fill="none" stroke-linecap="round"/>
           ${roundTree(100, 96, 5)}${roundTree(44, 104, 6)}`,
        ),
      meseta: (u) =>
        tile(
          u,
          '#9fd3f2',
          '#fdf1d0',
          `${sun(26, 24, 8)}<path d="M18 92L34 50H130L146 92Z" fill="#c98f5a"/><path d="M110 50H130L146 92H122Z" fill="#a8743f"/>
           <path d="M34 50H130" stroke="#d9b077" stroke-width="5"/><path d="M36 48H128L130 52H34Z" fill="#b5c95a"/>
           <g fill="#a8743f" opacity=".6"><path d="M44 62l8 26M70 58l4 30M96 60l2 28"/></g>
           ${roundTree(60, 48, 4, '#6f8f3a', '#5b7a2e')}${roundTree(104, 48, 4, '#6f8f3a', '#5b7a2e')}<g fill="#fff"><ellipse cx="82" cy="46" rx="4" ry="2.6"/><ellipse cx="90" cy="47" rx="3.4" ry="2.2"/></g>
           <path d="M0 90Q80 86 160 90V120H0Z" fill="${GRASS}"/><path d="M0 104Q80 100 160 104V120H0Z" fill="${GRASS_D}"/>`,
        ),
      acantilado: (u) =>
        tile(
          u,
          '#9fd3f2',
          '#e6f5fb',
          `${cloud(124, 22, 0.6)}<rect y="72" width="160" height="48" fill="${SEA}"/><rect y="98" width="160" height="22" fill="${SEA_D}"/>
           <path d="M0 30H74L82 40L78 120H0Z" fill="${ROCK}"/><path d="M60 30H74L82 40L78 120H62Z" fill="${ROCK_D}"/>
           <path d="M0 26H76L74 34H0Z" fill="${GRASS}"/><g stroke="#8f8476" stroke-width="2"><path d="M10 50H40M20 70H60M8 92H50"/></g>
           <path d="M78 104q8 -6 16 0t16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
           ${waves([
             [100, 84],
             [130, 92],
             [116, 110],
           ])}`,
        ),
      playa: (u) =>
        tile(
          u,
          '#9fd3f2',
          '#e6f5fb',
          `${sun(130, 22, 9)}<rect y="46" width="160" height="40" fill="${SEA}"/><rect y="46" width="160" height="10" fill="${SEA_D}" opacity=".5"/>
           <path d="M0 80Q40 72 80 80T160 78V120H0Z" fill="${SAND}"/><path d="M0 80Q40 72 80 80T160 78" stroke="#fff" stroke-width="4" fill="none"/>
           ${waves([
             [20, 60],
             [70, 66],
             [120, 58],
           ])}<g fill="#e7c47a"><path d="M40 100q6 -8 12 0z"/><circle cx="110" cy="104" r="3"/><path d="M128 96l4 6 -8 0z"/></g>`,
        ),
      // Seen from above: the land enters the sea (cabo), the sea enters the land (golfo), sea all round (isla).
      cabo: (u) => tile(u, SEA, SEA, topSea('M-8 128V86Q24 84 52 86Q60 58 72 40Q80 28 88 40Q100 58 108 86Q136 84 168 86V128Z')),
      golfo: (u) => tile(u, SEA, SEA, topSea('M-8 -8H168V72Q140 74 118 72Q112 42 80 38Q48 42 42 72Q20 74 -8 72Z')),
      isla: (u) =>
        tile(u, SEA, SEA, `${topSea('M48 62Q50 38 78 34Q108 32 116 54Q122 76 100 86Q72 96 56 84Q46 76 48 62Z')}${palm(82, 64, 26)}`),
      rayo: (u) =>
        tile(
          u,
          '#5d6b85',
          '#9aa6b8',
          `${cloud(80, 34, 1.5, '#7b879a', '#5f6a7d')}<path d="M86 50L66 82H80L70 112L100 74H84L96 50Z" fill="${YEL}" stroke="#fff3b0" stroke-width="2" stroke-linejoin="round"/>
           <path d="M0 108Q80 100 160 106V120H0Z" fill="#5c6f4a"/>${drops(
             [
               [40, 64],
               [120, 66],
               [130, 86],
               [30, 88],
             ],
             '#c8d8ea',
           )}`,
        ),
      arcoiris: (u) =>
        tile(
          u,
          '#9fd3f2',
          '#e6f5fb',
          `${sun(26, 26, 10)}<g fill="none" stroke-width="6">${['#e2483d', '#f58a3c', YEL, '#5cbf5c', '#3d8fd6', '#7a5bc4']
            .map((c, i) => `<path d="M${30 + i * 6} 104A${50 - i * 6} ${50 - i * 6} 0 0 1 ${130 - i * 6} 104" stroke="${c}"/>`)
            .join('')}</g>${cloud(126, 30, 0.8, '#eef4f8', '#d3e0e8')}${drops([
            [116, 52],
            [130, 58],
            [140, 50],
          ])}<path d="M0 104Q80 98 160 104V120H0Z" fill="${GRASS}"/>`,
        ),
      aurora: (u) =>
        tile(
          u,
          '#0f1f3d',
          '#203a5e',
          `<g fill="#fff">${[
            [14, 12],
            [40, 22],
            [70, 8],
            [120, 14],
            [148, 26],
            [96, 30],
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`)
            .join('')}</g>
           <defs>${grad(`${u}a`, '#7dffb3', '#7dffb300')}${grad(`${u}b`, '#b48cff', '#b48cff00')}</defs>
           <path d="M0 30Q30 14 60 30T120 26T160 20V74Q130 70 100 78T40 74T0 80Z" fill="url(#${u}a)" opacity=".9"/>
           <path d="M20 22Q60 6 100 20T160 10V50Q120 46 80 56T20 52Z" fill="url(#${u}b)" opacity=".55"/>
           <path d="M0 84Q80 78 160 84V120H0Z" fill="#14324a"/><path d="M0 98H160V120H0Z" fill="#1d4a6a"/>
           ${[
             [12, 88, 22],
             [28, 88, 30],
             [140, 88, 26],
             [154, 88, 20],
           ]
             .map(([x, y, h]) => conifer(x, y, h, '#0b1a2b', '#0b1a2b'))
             .join('')}<path d="M40 104q20 -4 40 0M90 110q20 -4 40 0" stroke="#7dffb3" stroke-width="2" opacity=".5" fill="none"/>`,
        ),
      niebla: (u) =>
        tile(
          u,
          '#d6dde2',
          '#eef1f3',
          `<path d="M0 70Q40 56 80 66T160 60V120H0Z" fill="#b9c6c0"/>${conifer(30, 84, 34, '#9aaea4', '#8ea398')}${conifer(118, 80, 30, '#9aaea4', '#8ea398')}${roundTree(76, 88, 12, '#a8b8ae', '#9aaea4')}
           <path d="M0 96Q80 90 160 96V120H0Z" fill="#c7d2cc"/>
           <g fill="#fff" opacity=".85"><rect x="-10" y="50" width="120" height="10" rx="5"/><rect x="40" y="68" width="140" height="10" rx="5"/><rect x="-6" y="86" width="110" height="10" rx="5"/><rect x="70" y="102" width="100" height="9" rx="4.5"/></g>`,
        ),
      granizo: (u) =>
        tile(
          u,
          '#8fa1b5',
          '#c9d4de',
          `${cloud(80, 30, 1.5, '#a7b4c2', '#8b98a8')}<path d="M0 104Q80 98 160 104V120H0Z" fill="#7d9a5a"/>
           <g fill="#fff" stroke="#b8c6d4" stroke-width="1.2">${[
             [44, 56],
             [66, 70],
             [92, 58],
             [116, 72],
             [56, 88],
             [104, 90],
             [80, 82],
             [128, 56],
           ]
             .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2"/>`)
             .join('')}</g><g fill="#fff">${[
             [36, 108],
             [72, 110],
             [98, 106],
             [132, 109],
           ]
             .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="3"/>`)
             .join('')}</g>`,
        ),
      nieve: (u) =>
        tile(
          u,
          '#b9cfe0',
          '#e9f1f7',
          `${cloud(80, 28, 1.4, '#e8eef3', '#cdd8e2')}<path d="M0 96Q80 86 160 94V120H0Z" fill="#fff"/>${conifer(130, 100, 36, '#3d6f47', '#2f5a39')}<path d="M118 84l12 -8 12 8zM121 74l9 -6 9 6z" fill="#fff"/>
           <g stroke="#7fb3dc" stroke-width="1.8" stroke-linecap="round">${[
             [40, 58],
             [70, 70],
             [100, 56],
             [56, 84],
             [92, 84],
             [22, 76],
           ]
             .map(
               ([x, y]) =>
                 `<path d="M${x - 5} ${y}H${x + 5}M${x} ${y - 5}V${y + 5}M${x - 3.5} ${y - 3.5}L${x + 3.5} ${y + 3.5}M${x + 3.5} ${y - 3.5}L${x - 3.5} ${y + 3.5}"/>`,
             )
             .join('')}</g>`,
        ),
      lluvia: (u) =>
        tile(
          u,
          '#9fb3c4',
          '#d8e2ea',
          `${cloud(80, 28, 1.5, '#c3ced8', '#a7b4c2')}<g stroke="#3d8fd6" stroke-width="3" stroke-linecap="round">${[
            [40, 54],
            [62, 64],
            [84, 52],
            [106, 62],
            [128, 54],
            [50, 80],
            [94, 80],
            [118, 84],
          ]
            .map(([x, y]) => `<path d="M${x} ${y}l-4 10"/>`)
            .join('')}</g>
           <path d="M0 102Q80 96 160 102V120H0Z" fill="#6aa84f"/><ellipse cx="80" cy="110" rx="34" ry="6" fill="#7cb6e0"/><ellipse cx="80" cy="110" rx="18" ry="3" fill="none" stroke="#fff" stroke-width="1.6"/>`,
        ),
      'tormenta-arena': (u) =>
        tile(
          u,
          '#f3b26b',
          '#fbe0b0',
          `<path d="M0 84Q40 70 80 82T160 76V120H0Z" fill="#e8b46a"/><path d="M0 100Q60 90 120 100T160 98V120H0Z" fill="#f0c67e"/>
           <path d="M-10 90Q10 30 70 26Q120 22 150 44Q170 60 170 96Z" fill="#c98a4a" opacity=".78"/>
           <g fill="none" stroke="#f6d6a8" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M40 60q16 -14 34 -4q14 8 30 -2"/><path d="M30 80q20 -10 40 0t44 -4"/><path d="M70 42q14 -8 30 0"/></g>
           ${palm(132, 102, 34, -1)}`,
        ),
      huracan: (u) =>
        tile(
          u,
          '#3d8fd6',
          '#2f7fc0',
          `<path d="M120 100Q140 80 150 120H160V0H130Q120 20 140 40Q150 60 120 100Z" fill="#7cbf6a" opacity=".85"/>
           <g transform="translate(70 60)"><path d="M0 0m-48 -6C-46 -40 4 -54 34 -30C10 -42 -22 -30 -24 -6C-26 22 8 30 22 14C10 38 -40 34 -48 -6Z" fill="#fff" opacity=".95"/>
             <path d="M48 6C46 40 -4 54 -34 30C-10 42 22 30 24 6C26 -22 -8 -30 -22 -14C-10 -38 40 -34 48 6Z" fill="#eaf3fb"/><circle r="6" fill="#3d8fd6"/></g>`,
        ),
      satelite: (u) =>
        tile(
          u,
          '#14213d',
          '#22355e',
          `<g fill="#fff">${[
            [16, 14],
            [140, 20],
            [120, 50],
            [24, 60],
            [80, 12],
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`)
            .join('')}</g>
           <path d="M-20 120Q80 70 180 120Z" fill="${SEA}"/><path d="M20 108Q40 96 60 100Q70 108 50 112ZM100 98Q120 92 134 100Q124 108 104 106Z" fill="#7cbf6a"/>
           <g transform="translate(82 44) rotate(-18)"><rect x="-44" y="-9" width="30" height="18" rx="2" fill="#3d6fd6" stroke="#9fc2ff" stroke-width="1.4"/><rect x="14" y="-9" width="30" height="18" rx="2" fill="#3d6fd6" stroke="#9fc2ff" stroke-width="1.4"/>
             <path d="M-34 -9V9M-24 -9V9M24 -9V9M34 -9V9" stroke="#9fc2ff" stroke-width="1"/><path d="M-14 0H14" stroke="#c9d4dc" stroke-width="2"/>
             <rect x="-9" y="-11" width="18" height="22" rx="3" fill="#d9dee3"/><rect x="-9" y="-11" width="18" height="6" fill="${YEL}"/><path d="M0 11V18" stroke="#c9d4dc" stroke-width="2"/><path d="M-6 22A6 4 0 0 0 6 22Z" fill="#c9d4dc"/></g>
           <g fill="none" stroke="${YEL}" stroke-width="2" stroke-linecap="round" opacity=".8"><path d="M94 80q6 6 0 12"/><path d="M102 76q10 10 0 20"/></g>`,
        ),
      termometro: (u) =>
        tile(
          u,
          '#fde7c9',
          '#fff6ea',
          `${sun(126, 30, 11)}<g stroke="#7fb3dc" stroke-width="2" stroke-linecap="round"><path d="M28 70h10M33 65v10M29.5 66.5l7 7M36.5 66.5l-7 7"/></g>
           <rect x="68" y="12" width="24" height="80" rx="12" fill="#fff" stroke="${K}" stroke-width="2.4"/><rect x="75" y="40" width="10" height="56" rx="5" fill="${RED}"/>
           <circle cx="80" cy="98" r="15" fill="${RED}" stroke="${K}" stroke-width="2.4"/><circle cx="75" cy="93" r="4" fill="#ff9a8f"/>
           <g stroke="${K}" stroke-width="1.6">${[22, 32, 42, 52, 62, 72].map((y) => `<path d="M92 ${y}h${y % 20 === 12 ? 9 : 6}"/>`).join('')}</g>`,
        ),
      pluviometro: (u) =>
        tile(
          u,
          '#c9dceb',
          '#eef5fa',
          `${cloud(44, 20, 0.7, '#fff', '#e3eef5')}${drops([
            [36, 40],
            [52, 46],
            [80, 30],
          ])}<path d="M0 104Q80 98 160 104V120H0Z" fill="${GRASS}"/>
           <path d="M56 34H104L88 52H72Z" fill="#d9dee3" stroke="${K}" stroke-width="2.2" stroke-linejoin="round"/>
           <rect x="68" y="52" width="24" height="52" rx="3" fill="#fff" fill-opacity=".85" stroke="${K}" stroke-width="2.2"/><rect x="70" y="78" width="20" height="24" fill="#5aa9e6"/>
           <g stroke="${K}" stroke-width="1.4">${[60, 68, 76, 84, 92].map((y) => `<path d="M92 ${y}h6"/>`).join('')}</g><path d="M80 104V114" stroke="#7a5233" stroke-width="5"/>`,
        ),
      globo: (u) => {
        const R = 46;
        const band = (/** @type {number} */ a, /** @type {number} */ b, /** @type {string} */ c) =>
          `<rect x="34" y="${r1(60 - R * Math.sin(b))}" width="92" height="${r1(R * (Math.sin(b) - Math.sin(a)))}" fill="${c}"/>`;
        const lat = (/** @type {number} */ d) => (d * Math.PI) / 180;
        return tile(
          u,
          '#1d3557',
          '#2c4a7a',
          `<defs><clipPath id="${u}g"><circle cx="80" cy="60" r="${R}"/></clipPath></defs><g clip-path="url(#${u}g)">
             ${band(lat(66.5), lat(90), '#eaf4fb')}${band(lat(23.5), lat(66.5), '#9fd38a')}${band(lat(-23.5), lat(23.5), '#ffd36b')}${band(lat(-66.5), lat(-23.5), '#9fd38a')}${band(lat(-90), lat(-66.5), '#eaf4fb')}
             <g fill="none" stroke="#2b3a4a" stroke-opacity=".18" stroke-width="1.2"><ellipse cx="80" cy="60" rx="18" ry="${R}"/><ellipse cx="80" cy="60" rx="36" ry="${R}"/><path d="M80 14V106"/></g>
             <path d="M34 60H126" stroke="${RED}" stroke-width="2.4"/>
             <g stroke="#e58a2a" stroke-width="1.6" stroke-dasharray="4 3"><path d="M34 ${r1(60 - R * Math.sin(lat(23.5)))}H126M34 ${r1(60 + R * Math.sin(lat(23.5)))}H126"/></g>
             <g stroke="#3d8fd6" stroke-width="1.6" stroke-dasharray="4 3"><path d="M34 ${r1(60 - R * Math.sin(lat(66.5)))}H126M34 ${r1(60 + R * Math.sin(lat(66.5)))}H126"/></g>
             <circle cx="66" cy="44" r="${R}" fill="#fff" opacity=".1"/></g><circle cx="80" cy="60" r="${R}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`,
        );
      },
    };
    const art = (/** @type {string} */ key) => {
      const draw = key && ART[key];
      return draw ? svgEl('0 0 160 120', draw(uid()), 'art-svg sc-art') : null;
    };

    // ---------------- Weather symbols (spainMap): one drawing per id, centred on 0,0, ~36 across at size 1 ----------------
    const W_CLOUD = 'M-14 8A7 7 0 0 1 -11 -4A9.5 9.5 0 0 1 6 -8A8 8 0 0 1 15 0A6 6 0 0 1 14 8Z';
    /** @type {Record<string, string>} */
    const WEATHER = {
      sol: `<g stroke="#f2a516" stroke-width="2.6" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return `<path d="M${r1(Math.cos(a) * 11)} ${r1(Math.sin(a) * 11)}L${r1(Math.cos(a) * 15.5)} ${r1(Math.sin(a) * 15.5)}"/>`;
      }).join('')}</g><circle r="8.4" fill="${SUN}" stroke="#f2a516" stroke-width="1.6"/>`,
      nubes: `<path d="${W_CLOUD}" transform="translate(0 2)" fill="#fff" stroke="#8a9bab" stroke-width="2" stroke-linejoin="round"/>`,
      'sol-nubes': `<g transform="translate(-5 -6) scale(.75)"><g stroke="#f2a516" stroke-width="2.6" stroke-linecap="round">${Array.from(
        { length: 8 },
        (_, i) => {
          const a = (i * Math.PI) / 4;
          return `<path d="M${r1(Math.cos(a) * 11)} ${r1(Math.sin(a) * 11)}L${r1(Math.cos(a) * 15)} ${r1(Math.sin(a) * 15)}"/>`;
        },
      ).join(
        '',
      )}</g><circle r="8.4" fill="${SUN}"/></g><path d="${W_CLOUD}" transform="translate(3 5) scale(.85)" fill="#fff" stroke="#8a9bab" stroke-width="2" stroke-linejoin="round"/>`,
      lluvia: `<path d="${W_CLOUD}" transform="translate(0 -4)" fill="#e9eef3" stroke="#7d8e9e" stroke-width="2" stroke-linejoin="round"/><g stroke="#2f86d6" stroke-width="2.6" stroke-linecap="round"><path d="M-7 8l-2.5 6M1 8l-2.5 6M9 8l-2.5 6"/></g>`,
      nieve: `<path d="${W_CLOUD}" transform="translate(0 -4)" fill="#fff" stroke="#7d8e9e" stroke-width="2" stroke-linejoin="round"/><g stroke="#5aa9e6" stroke-width="2" stroke-linecap="round">${[
        [-8, 11],
        [0, 14],
        [8, 11],
      ]
        .map(
          ([x, y]) =>
            `<path d="M${x - 3} ${y}H${x + 3}M${x} ${y - 3}V${y + 3}M${x - 2.2} ${y - 2.2}L${x + 2.2} ${y + 2.2}M${x + 2.2} ${y - 2.2}L${x - 2.2} ${y + 2.2}"/>`,
        )
        .join('')}</g>`,
      tormenta: `<path d="${W_CLOUD}" transform="translate(0 -5)" fill="#6f7d8f" stroke="#4a5768" stroke-width="2" stroke-linejoin="round"/><path d="M2 1L-5 10H0L-3 17L6 7H1L4 1Z" fill="${YEL}" stroke="#c98a00" stroke-width="1.2" stroke-linejoin="round"/>`,
      niebla: `<g stroke="#8a9bab" stroke-width="3" stroke-linecap="round"><path d="M-13 -8H11M-9 -1H14M-14 6H9M-8 13H12"/></g>`,
      viento: `<g fill="none" stroke="#5f8fb5" stroke-width="2.6" stroke-linecap="round"><path d="M-14 -5H6A4.5 4.5 0 1 0 1.5 -9.5"/><path d="M-14 2H10A5 5 0 1 1 5 7"/><path d="M-14 9H-2"/></g>`,
    };
    /** Emoji (a token's `icon`) → symbol id. */
    /** @type {Record<string, string>} */
    const EMOJI = {
      '☀️': 'sol',
      '☀': 'sol',
      '🌞': 'sol',
      '☁️': 'nubes',
      '☁': 'nubes',
      '⛅': 'sol-nubes',
      '🌤️': 'sol-nubes',
      '🌥️': 'sol-nubes',
      '🌧️': 'lluvia',
      '🌦️': 'lluvia',
      '❄️': 'nieve',
      '🌨️': 'nieve',
      '⛈️': 'tormenta',
      '🌩️': 'tormenta',
      '⚡': 'tormenta',
      '🌫️': 'niebla',
      '💨': 'viento',
    };
    /** The symbol id of a weather token: its own id when it is one, else its emoji. */
    const weatherId = (/** @type {{ id?: string, icon?: string }} */ t) =>
      (t?.id && t.id in WEATHER && t.id) || (t?.icon && EMOJI[t.icon]) || null;
    /** A weather symbol as markup (map) or, with `size`, as its own little <svg> (palette). */
    const weather = (/** @type {string} */ id, /** @type {number} */ size) => {
      const inner = WEATHER[id];
      if (!inner) return null;
      if (!size) return inner;
      const el = svgEl('-18 -18 36 36', inner, 'sc-wx');
      el.setAttribute('width', String(size));
      el.setAttribute('height', String(size));
      return el;
    };

    // ---------------- Spain base map (spainMap): regions of SP_MAPS.spain (games/sociales-planeta/maps.js) ----------------
    // The viewBox is cropped to the peninsula, Baleares and the Canarias inset. Each region gets a point for its symbol / name pill,
    // tuned by hand so the pills of the small north-east regions never overlap.
    const MAP_BOX = [2, 30, 552, 448];
    /** @type {Record<string, [number, number, string]>} id → [x, y, short name] of the region's pill (its preferred place; types.js
     *  pushes apart the pills of the asked regions that would overlap and draws a leader to the region). */
    const PILL = {
      galicia: [70, 112, 'Galicia'],
      asturias: [146, 74, 'Asturias'],
      cantabria: [214, 92, 'Cantabria'],
      'pais-vasco': [276, 62, 'País Vasco'],
      navarra: [330, 104, 'Navarra'],
      'la-rioja': [250, 134, 'La Rioja'],
      aragon: [360, 180, 'Aragón'],
      cataluna: [440, 140, 'Cataluña'],
      'castilla-y-leon': [168, 176, 'Castilla y León'],
      madrid: [236, 222, 'Madrid'],
      'castilla-la-mancha': [300, 280, 'Castilla-La Mancha'],
      valencia: [392, 244, 'C. Valenciana'],
      murcia: [338, 336, 'Murcia'],
      extremadura: [114, 298, 'Extremadura'],
      andalucia: [200, 362, 'Andalucía'],
      baleares: [486, 206, 'Baleares'],
      canarias: [80, 418, 'Canarias'],
    };
    const map = () => {
      const S = window.SP_MAPS?.spain;
      if (!S) return null;
      const u = uid();
      const [ix, iy, iw, ih] = S.inset;
      const nb = Object.values(S.neighbors)
        .map((d) => `<path d="${d}"/>`)
        .join('');
      const regions = S.regions
        .map(
          (/** @type {{ id: string, d: string }} */ r) =>
            `<path class="sc-reg" data-region="${r.id}" d="${r.d}" fill-rule="evenodd" stroke-linejoin="round"/>`,
        )
        .join('');
      const inner = `<defs><pattern id="${u}w" width="24" height="12" patternUnits="userSpaceOnUse"><path d="M2 8q5 -4 10 0t10 0" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.4" fill="none"/></pattern></defs>
        <rect x="-20" y="0" width="640" height="500" fill="#bfe3f6"/><rect x="-20" y="0" width="640" height="500" fill="url(#${u}w)"/>
        <g fill="#ece6d6" stroke="#d6cdb6" stroke-width="1">${nb}</g>
        <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="8" fill="#bfe3f6" stroke="#7d9aa8" stroke-width="1.5" stroke-dasharray="5 4"/>
        <path d="${S.outline}" fill="#fff" stroke="none"/>
        <g class="sc-regs">${regions}</g>
        <path d="${S.outline}" fill="none" stroke="#5f7f8c" stroke-width="1.6" stroke-linejoin="round" pointer-events="none"/>
        <g class="sc-rings" pointer-events="none"></g><g class="sc-leads" pointer-events="none"></g><g class="sc-pills"></g>`;
      const [bx, by, bw, bh] = MAP_BOX;
      const el = svgEl(`${bx} ${by} ${bw} ${bh}`, inner, 'sc-map-svg');
      /** @type {Record<string, [number, number]>} */
      const anchor = Object.fromEntries(S.regions.map((/** @type {{ id: string, label: [number, number] }} */ r) => [r.id, r.label]));
      return {
        el,
        box: /** @type {[number, number, number, number]} */ ([bx, by, bw, bh]),
        pill: PILL,
        anchor,
        ids: S.regions.map((/** @type {{ id: string }} */ r) => r.id),
      };
    };

    // ---------------- Label scenes ----------------
    // scene(name) → ExamScene: x/y = slot centre, w = slot width (viewBox units); `at` = where the slot's leader line points.
    // Each leader carries its spot id (data-ld): index.html hides the leaders whose slot the task does not use.
    const leader = (
      /** @type {string} */ id,
      /** @type {number} */ x1,
      /** @type {number} */ y1,
      /** @type {number} */ x2,
      /** @type {number} */ y2,
    ) =>
      `<g data-ld="${id}"><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${K}" stroke-width="2.6" stroke-dasharray="1 6" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6.5" fill="${RED}" stroke="#fff" stroke-width="2.5"/></g>`;
    const framed = (/** @type {string} */ u, /** @type {number} */ w, /** @type {number} */ hgt, /** @type {string} */ inner) =>
      `<defs><clipPath id="${u}fr"><rect width="${w}" height="${hgt}" rx="18"/></clipPath></defs><g clip-path="url(#${u}fr)">${inner}</g>
       <rect x="1" y="1" width="${w - 2}" height="${hgt - 2}" rx="17" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="2"/>`;
    /**
     * @param {string} u
     * @param {[number, number]} box
     * @param {string} inner
     * @param {{ id: string, x: number, y: number, w: number, at?: number[] }[]} spots
     * @param {string} cls
     * @returns {ExamScene}
     */
    const sceneOf = (u, box, inner, spots, cls) => {
      const lines = spots
        .filter((s) => s.at)
        .map((s) => leader(s.id, s.x, s.y, s.at[0], s.at[1]))
        .join('');
      const el = svgEl(`0 0 ${box[0]} ${box[1]}`, framed(u, box[0], box[1], inner) + lines, `scene-svg ${cls}`);
      return { el, box, spots: spots.map(({ id, x, y, w }) => ({ id, x, y, w })), cls };
    };

    /** @type {Record<string, () => ExamScene>} */
    const SCENES = {
      // The Earth with its five imaginary lines (labels on the right) and the three zones (labels on the bands, fría above).
      globo() {
        const u = uid();
        const cx = 214;
        const cy = 252;
        const R = 188;
        // Latitude → height drawn evenly (like the book's diagram): the polar caps stay big enough to see and to label.
        const y = (/** @type {number} */ d) => r1(cy - (R * d) / 90);
        const halfW = (/** @type {number} */ d) => r1(Math.sqrt(R * R - (y(d) - cy) ** 2));
        const band = (/** @type {number} */ a, /** @type {number} */ b, /** @type {string} */ c) =>
          `<rect x="${cx - R}" y="${y(b)}" width="${2 * R}" height="${r1(y(a) - y(b))}" fill="${c}"/>`;
        // Lines: [id, latitude, colour, dash]; the label column is on the right at x 508, fanned out evenly.
        /** @type {[string, number, string, string][]} */
        const LINES = [
          ['artico', 66.5, '#3d7fc0', '8 6'],
          ['cancer', 23.5, '#e07a1f', '8 6'],
          ['ecuador', 0, RED, ''],
          ['capricornio', -23.5, '#e07a1f', '8 6'],
          ['antartico', -66.5, '#3d7fc0', '8 6'],
        ];
        const SLOT_Y = [72, 162, 252, 342, 432];
        const lines = LINES.map(([, d, c, dash]) => {
          const ly = y(d);
          const x1 = r1(cx + halfW(d));
          return `<path d="M${r1(cx - halfW(d))} ${ly}H${x1}" stroke="${c}" stroke-width="${d === 0 ? 5 : 4}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
        }).join('');
        // Outside the globe: a thin solid line from each line's end to its slot.
        const links = LINES.map(([id, d, c], i) => {
          const ly = y(d);
          const x1 = r1(cx + halfW(d));
          return `<g data-ld="${id}"><path d="M${x1} ${ly}L${cx + R + 12} ${ly}L418 ${SLOT_Y[i]}" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>
            <circle cx="${x1}" cy="${ly}" r="5.5" fill="${c}" stroke="#fff" stroke-width="2"/></g>`;
        }).join('');
        const stars = Array.from({ length: 18 }, (_, i) => {
          const sx = (i * 137 + 23) % 600;
          const sy = (i * 71 + 11) % 480;
          return `<circle cx="${sx}" cy="${sy}" r="${i % 3 ? 1.2 : 1.8}" fill="#fff" opacity=".6"/>`;
        }).join('');
        // Rough continents (a hint that this is the Earth), drawn as a darker tint over the zone colours.
        const land = `<g fill="#1d3557" opacity=".13">
            <path d="M70 120Q104 96 136 112Q154 134 140 160Q126 182 142 206Q160 232 150 262Q140 300 122 330Q110 360 98 384Q86 340 92 300Q96 262 78 236Q56 204 64 170Q60 140 70 120Z"/>
            <path d="M206 108Q240 92 276 104Q300 120 286 140Q270 154 252 152Q232 160 236 180Q270 186 292 214Q312 250 300 290Q286 326 262 352Q246 330 244 296Q238 262 222 236Q206 212 212 184Q196 160 206 108Z"/>
            <path d="M300 112Q340 100 372 122Q388 150 370 176Q348 196 322 184Q304 168 310 146Q294 132 300 112Z"/>
            <path d="M318 318Q344 306 366 318Q374 340 354 352Q330 356 318 340Z"/>
            <path d="M120 418Q214 396 308 418Q260 432 214 432Q168 432 120 418Z"/></g>`;
        const inner = `<defs>${grad(`${u}sp`, '#1d3557', '#2c4a7a')}<clipPath id="${u}e"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
            <radialGradient id="${u}sh" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#0b1a2b" stop-opacity=".28"/></radialGradient></defs>
          <rect width="600" height="480" fill="url(#${u}sp)"/>${stars}
          <g clip-path="url(#${u}e)">
            ${band(66.5, 90, '#eef7fd')}${band(23.5, 66.5, '#a8d98f')}${band(-23.5, 23.5, '#ffd36b')}${band(-66.5, -23.5, '#a8d98f')}${band(-90, -66.5, '#eef7fd')}
            ${land}
            <g fill="none" stroke="#2b3a4a" stroke-opacity=".12" stroke-width="2"><ellipse cx="${cx}" cy="${cy}" rx="${R * 0.35}" ry="${R}"/><ellipse cx="${cx}" cy="${cy}" rx="${R * 0.72}" ry="${R}"/><path d="M${cx} ${cy - R}V${cy + R}"/></g>
            ${lines}
            <rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" fill="url(#${u}sh)"/>
          </g>
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>${links}
          <g fill="#fff" font-family="system-ui,sans-serif" font-weight="900" font-size="15" text-anchor="middle" opacity=".85"><text x="${cx - 120}" y="${cy - R + 4}">N</text><text x="${cx - 120}" y="${cy + R + 6}">S</text></g>`;
        // Slots: lines on the right column; zones: fría above the globe (pointing at the cap), cálida on the north warm band,
        // templada on the south temperate band (the zones repeat north and south: one slot each is enough).
        return sceneOf(
          u,
          [600, 480],
          inner,
          [
            ...LINES.map(([id], i) => ({ id, x: 508, y: SLOT_Y[i], w: 176 })),
            { id: 'fria', x: cx, y: 30, w: 176, at: [cx + 70, r1((y(90) + y(66.5)) / 2 + 6)] },
            { id: 'calida', x: cx, y: r1((y(23.5) + y(0)) / 2), w: 176 },
            { id: 'templada', x: cx, y: r1((y(-23.5) + y(-66.5)) / 2), w: 176 },
          ],
          'sc-scene sc-globo',
        );
      },

      // Interior on the left (mountain, valley, plateau, plain), the coast on the right (gulf, island, cape, cliff, beach).
      relieve() {
        const u = uid();
        const coast =
          'M470 150Q430 160 404 182Q378 206 394 230Q412 252 452 252Q472 266 470 290L484 312L488 396Q462 404 436 402Q402 420 382 460';
        const inner = `<defs>${grad(`${u}sk`, '#8ecdf0', DUSK)}${grad(`${u}sea`, '#5fb3dd', SEA_D)}</defs>
          <rect width="600" height="460" fill="url(#${u}sk)"/>${sun(476, 70, 22)}${cloud(300, 40, 0.9)}${cloud(570, 112, 0.6)}
          <rect x="300" y="150" width="300" height="310" fill="url(#${u}sea)"/>
          ${waves([
            [500, 190],
            [540, 300],
            [520, 236],
            [430, 216],
            [540, 420],
          ])}
          <path d="${coast}" fill="none" stroke="${SAND}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M0 196Q200 180 470 150Q430 160 404 182Q378 206 394 230Q412 252 452 252Q472 266 470 290L484 312L488 396Q462 404 436 402Q402 420 382 460H0Z" fill="${GRASS}"/>
          ${mountain(-10, 200, 206, 92, 48)}${mountain(130, 296, 206, 232, 104, '#a89c8c', '#8a7f72')}
          <path d="M150 206L196 152H232L262 206Z" fill="#7dbb5a"/><path d="M200 156Q212 176 204 190Q196 202 214 214" stroke="${SEA}" stroke-width="6" fill="none" stroke-linecap="round"/>
          ${mountain(120, 214, 208, 168, 124, '#9d9384', '#81786b', false)}${mountain(218, 300, 208, 262, 120, '#9d9384', '#81786b', false)}
          <path d="M288 214L306 150H366L382 214Z" fill="#c98f5a"/><path d="M350 150H366L382 214H364Z" fill="#a8743f"/><path d="M308 146H364L366 154H306Z" fill="#b5c95a"/>
          ${roundTree(320, 148, 4, '#6f8f3a', '#5b7a2e')}${roundTree(352, 148, 4, '#6f8f3a', '#5b7a2e')}<g fill="#fff"><ellipse cx="334" cy="145" rx="4" ry="2.6"/><ellipse cx="342" cy="146" rx="3.4" ry="2.2"/></g>
          <path d="M0 248Q160 232 330 246L420 262Q440 300 420 330Q400 360 380 400L360 460H0Z" fill="#9ccc65"/>
          <g fill="#b5d87a"><path d="M20 290H260L270 312H14Z"/><path d="M10 340H250L262 366H4Z"/></g><g fill="#8cc35e"><path d="M16 314H266L276 336H10Z"/></g>
          ${roundTree(296, 276, 8)}${roundTree(286, 330, 9)}${roundTree(40, 262, 7)}
          <path d="M214 214Q236 240 226 262Q216 286 252 304Q300 330 312 380Q320 420 352 460" stroke="${SEA}" stroke-width="9" fill="none" stroke-linecap="round"/>
          <path d="M466 274Q500 264 532 252Q548 248 550 256Q546 264 528 270Q496 284 468 294Z" fill="${GRASS}" stroke="${SAND}" stroke-width="4" stroke-linejoin="round"/>
          <g transform="translate(540 254)"><rect x="-4" y="-28" width="8" height="28" fill="#fff"/><rect x="-4" y="-20" width="8" height="6" fill="${RED}"/><rect x="-4" y="-8" width="8" height="5" fill="${RED}"/><path d="M-6 -28H6L4 -34H-4Z" fill="${K}"/></g>
          <path d="M412 330L482 314L488 322L418 340Z" fill="${GRASS_D}"/><path d="M418 340L488 322L492 398Q466 406 440 402L424 396Z" fill="${ROCK}"/><path d="M466 328L488 322L492 398L470 402Z" fill="${ROCK_D}"/>
          <g stroke="#8f8476" stroke-width="2.2"><path d="M426 356L482 344M430 378L484 368"/></g><path d="M492 404q8 -6 16 0t16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M530 160Q536 144 556 144Q576 146 576 162Q572 176 552 178Q534 176 530 160Z" fill="${GRASS}" stroke="${SAND}" stroke-width="5"/>${palm(554, 162, 22)}
          <path d="M382 460Q402 420 436 402L452 404Q440 432 432 460Z" fill="${SAND}"/>`;
        return sceneOf(
          u,
          [600, 460],
          inner,
          [
            { id: 'montana', x: 92, y: 22, w: 150, at: [92, 62] },
            { id: 'valle', x: 206, y: 112, w: 130, at: [206, 184] },
            { id: 'meseta', x: 350, y: 90, w: 130, at: [336, 152] },
            { id: 'llanura', x: 118, y: 410, w: 150, at: [130, 324] },
            { id: 'golfo', x: 526, y: 96, w: 130, at: [424, 212] },
            { id: 'isla', x: 506, y: 236, w: 110, at: [552, 176] },
            { id: 'cabo', x: 536, y: 326, w: 110, at: [526, 264] },
            { id: 'acantilado', x: 528, y: 416, w: 140, at: [456, 368] },
            { id: 'playa', x: 300, y: 440, w: 110, at: [418, 436] },
          ],
          'sc-scene sc-relieve',
        );
      },
    };
    SCENES['relieve-interior'] = SCENES.relieve;
    SCENES['relieve-costa'] = SCENES.relieve;
    const scene = (/** @type {string} */ name) => (SCENES[name] ? SCENES[name]() : null);

    // ---------------- Spot scenes: «Detective del paisaje» ----------------
    // 600 × 400. Each item = a drawn group + a round hit area (x, y, r in viewBox units; hit areas never overlap). `human` = made by people.
    /** @typedef {{ id: string, name: string, human: boolean, x: number, y: number, r: number }} SCSpotItem */
    /** @type {Record<string, { items: SCSpotItem[], draw: (u: string) => { back: string, parts: Record<string, string> } }>} */
    const SPOTS = {
      valle: {
        items: [
          { id: 'montana', name: 'Montaña', human: false, x: 150, y: 86, r: 56 },
          { id: 'torre-electrica', name: 'Torre eléctrica', human: true, x: 548, y: 92, r: 44 },
          { id: 'bosque', name: 'Bosque', human: false, x: 410, y: 148, r: 50 },
          { id: 'pueblo', name: 'Pueblo', human: true, x: 104, y: 246, r: 54 },
          { id: 'puente', name: 'Puente', human: true, x: 300, y: 262, r: 44 },
          { id: 'rio', name: 'Río', human: false, x: 334, y: 352, r: 44 },
          { id: 'carretera', name: 'Carretera', human: true, x: 160, y: 352, r: 44 },
          { id: 'cultivos', name: 'Cultivos', human: true, x: 486, y: 300, r: 56 },
        ],
        draw: (u) => ({
          back: `<defs>${grad(`${u}sk`, '#8ecdf0', SKY_L)}</defs><rect width="600" height="400" fill="url(#${u}sk)"/>${cloud(300, 46, 0.9)}${cloud(470, 30, 0.6)}
            <path d="M0 170Q150 150 300 166T600 156V400H0Z" fill="${GRASS}"/><path d="M0 230Q200 214 600 226V400H0Z" fill="#9ccc65"/>`,
          parts: {
            montana: `${mountain(20, 300, 176, 150, 40)}${mountain(-40, 120, 176, 50, 88, '#a89c8c', '#8a7f72')}${mountain(200, 360, 180, 286, 92, '#a89c8c', '#8a7f72', false)}`,
            'torre-electrica': `<path d="M380 120Q470 78 548 66M548 66Q590 60 640 70" stroke="${K}" stroke-width="1.6" fill="none"/>
              <g transform="translate(548 140)"><path d="M-18 0L-5 -82H5L18 0M-12 -30H12M-9 -54H9M-15 -14L9 -54M15 -14L-9 -54" stroke="#56616d" stroke-width="3.2" fill="none" stroke-linejoin="round"/><path d="M-22 -70H22M-16 -82H16" stroke="#56616d" stroke-width="3.2" stroke-linecap="round"/></g>`,
            bosque: [
              [362, 176, 46],
              [388, 170, 58],
              [414, 178, 50],
              [440, 172, 60],
              [462, 180, 46],
              [376, 196, 42],
              [404, 200, 48],
              [432, 198, 44],
              [456, 204, 40],
            ]
              .map(([x, y, h]) => conifer(x, y, h, y > 190 ? '#2f6e3c' : '#3d7f4a', y > 190 ? '#25592f' : '#30683c'))
              .join(''),
            pueblo: `${house(66, 250, 30)}${house(104, 236, 26, '#fff3e0', '#c94a35')}${house(140, 254, 30, '#fbf3df', '#e0703f')}${house(92, 278, 28, '#fff3e0', '#d9573f')}
              <g transform="translate(124 230)"><rect x="-7" y="-46" width="14" height="46" fill="#efe2c8"/><path d="M-10 -46L0 -64L10 -46Z" fill="#a8503a"/><rect x="-3" y="-38" width="6" height="8" rx="3" fill="#6b4a2e"/></g>`,
            carretera: `<path d="M190 400Q170 350 150 318Q132 292 120 282" stroke="#7d848c" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M190 400Q170 350 150 318Q132 292 120 282" stroke="#fff" stroke-width="2.4" stroke-dasharray="10 10" fill="none"/>
              <path d="M150 318Q200 290 260 268" stroke="#7d848c" stroke-width="16" fill="none" stroke-linecap="round"/>`,
            rio: `<path d="M250 168Q236 200 270 222Q318 250 296 288Q276 326 330 350Q370 368 360 400" stroke="${SEA}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M250 168Q236 200 270 222Q318 250 296 288Q276 326 330 350Q370 368 360 400" stroke="#9fd6f5" stroke-width="4" stroke-dasharray="12 18" fill="none" stroke-linecap="round"/>`,
            puente: `<path d="M262 264H340" stroke="#a8743f" stroke-width="14" stroke-linecap="round"/><path d="M270 270Q300 292 330 270" stroke="#8a5a2e" stroke-width="5" fill="none"/><path d="M262 256H340" stroke="#d9b077" stroke-width="3"/>
              <g stroke="#8a5a2e" stroke-width="3"><path d="M276 256V246M300 256V246M324 256V246"/></g><path d="M270 246H332" stroke="#8a5a2e" stroke-width="3"/>`,
            cultivos: `<g transform="translate(486 300)"><path d="M-76 -40H40L70 40H-60Z" fill="#e6c25a"/><g stroke="#c9a23a" stroke-width="3">${[-28, -12, 4, 20].map((y) => `<path d="M${-70 + (y + 40) * 0.2} ${y}H${44 + (y + 40) * 0.35}"/>`).join('')}</g>
              <path d="M-60 40H70L80 70H-50Z" fill="#7fae3f"/><g stroke="#5f8f2e" stroke-width="3">${[48, 56, 64].map((y) => `<path d="M${-56 + (y - 40) * 0.3} ${y}H${72 + (y - 40) * 0.3}"/>`).join('')}</g><path d="M40 -40H96L110 40H70Z" fill="#a3c95a"/></g>`,
          },
        }),
      },
      costa: {
        items: [
          { id: 'isla', name: 'Isla', human: false, x: 352, y: 162, r: 44 },
          { id: 'acantilado', name: 'Acantilado', human: false, x: 190, y: 176, r: 56 },
          { id: 'hotel', name: 'Hotel', human: true, x: 70, y: 190, r: 46 },
          { id: 'faro', name: 'Faro', human: true, x: 446, y: 196, r: 36 },
          { id: 'cabo', name: 'Cabo', human: false, x: 546, y: 222, r: 44 },
          { id: 'puerto', name: 'Puerto', human: true, x: 290, y: 268, r: 46 },
          { id: 'barcos', name: 'Barcos', human: true, x: 432, y: 312, r: 46 },
          { id: 'playa', name: 'Playa', human: false, x: 160, y: 334, r: 50 },
        ],
        draw: (u) => ({
          back: `<defs>${grad(`${u}sk`, '#8ecdf0', DUSK)}${grad(`${u}sea`, '#5fb3dd', SEA_D)}</defs><rect width="600" height="400" fill="url(#${u}sk)"/>${sun(520, 52, 20)}${cloud(150, 40, 0.7)}${cloud(330, 60, 0.5)}
            <rect y="112" width="600" height="288" fill="url(#${u}sea)"/>${waves([
              [300, 136],
              [470, 140],
              [520, 300],
              [560, 360],
              [330, 360],
              [240, 210],
            ])}
            <path d="M0 112H214L220 238Q200 262 178 290Q150 330 136 400H0Z" fill="${GRASS}"/><path d="M0 200Q60 190 150 196L176 290Q150 330 136 400H0Z" fill="#9ccc65"/>`,
          parts: {
            acantilado: `<path d="M150 118H214L222 240L162 236Z" fill="${ROCK}"/><path d="M196 118H214L222 240H204Z" fill="${ROCK_D}"/><path d="M146 112H216L214 124H150Z" fill="${GRASS_D}"/>
              <g stroke="#8f8476" stroke-width="2.4"><path d="M160 150H206M166 186H212M162 218H214"/></g><path d="M214 244q10 -7 20 0t20 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
            hotel: `<g transform="translate(70 230)"><rect x="-34" y="-82" width="68" height="82" fill="#f6efe2"/><rect x="-34" y="-88" width="68" height="8" fill="#e07a1f"/>
              <g fill="#7cc4ef">${[-70, -52, -34].map((y) => [-24, -6, 12].map((x) => `<rect x="${x}" y="${y}" width="12" height="11" rx="2"/>`).join('')).join('')}</g><rect x="-8" y="-16" width="16" height="16" fill="#8a5a3a"/></g>`,
            isla: `<path d="M312 172Q316 146 352 142Q392 142 396 166Q394 186 354 190Q318 190 312 172Z" fill="${GRASS}" stroke="${SAND}" stroke-width="6"/>${palm(356, 168, 32)}`,
            puerto: `<path d="M200 262H340V280H200Z" fill="#a8a29a"/><path d="M200 280H340V286H200Z" fill="#8a847e"/><g fill="#56616d"><rect x="236" y="254" width="6" height="8"/><rect x="276" y="254" width="6" height="8"/><rect x="316" y="254" width="6" height="8"/></g>
              <rect x="204" y="226" width="40" height="28" fill="#c94a35"/><path d="M200 228L224 212L248 228Z" fill="#8a3a2a"/><g fill="none" stroke="#56616d" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M300 262V214L336 206M336 206V222"/></g>`,
            playa: `<path d="M220 238Q200 262 178 290Q150 330 136 400H232Q238 340 262 300Q280 272 290 250Q258 244 220 238Z" fill="${SAND}"/>
              <path d="M290 250Q280 272 262 300Q238 340 232 400" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><g fill="#e7c47a"><path d="M196 330q6 -8 12 0z"/><circle cx="214" cy="370" r="3.4"/><path d="M178 360l4 6 -8 0z"/></g>`,
            barcos: `<g transform="translate(414 326)"><path d="M-22 0H22L15 11H-15Z" fill="#c94a35"/><path d="M0 0V-38L18 -4Z" fill="#fff"/><path d="M0 -34L-13 -4H0Z" fill="#ffe8c8"/></g>
              <g transform="translate(460 298) scale(.8)"><path d="M-22 0H22L15 11H-15Z" fill="#3d6fd6"/><path d="M0 0V-38L18 -4Z" fill="#fff"/></g>`,
            cabo: `<path d="M610 186Q540 192 480 210Q440 222 446 234Q478 242 610 240Z" fill="${GRASS}" stroke="${SAND}" stroke-width="5" stroke-linejoin="round"/>`,
            faro: `<g transform="translate(456 228)"><path d="M-8 0L-5 -54H5L8 0Z" fill="#fff"/><path d="M-7 -14H7L7.6 -4H-7.6ZM-6 -38H6L6.4 -28H-6.4Z" fill="${RED}"/><rect x="-7" y="-64" width="14" height="10" fill="${YEL}"/><path d="M-9 -64H9L0 -74Z" fill="${K}"/>
              <path d="M-7 -59L-44 -70V-50Z" fill="${YEL}" opacity=".45"/></g>`,
          },
        }),
      },
      llanura: {
        items: [
          { id: 'granja', name: 'Granja', human: true, x: 310, y: 170, r: 52 },
          { id: 'arboles', name: 'Árboles', human: false, x: 500, y: 170, r: 52 },
          { id: 'cultivos', name: 'Cultivos', human: true, x: 120, y: 236, r: 62 },
          { id: 'rio', name: 'Río', human: false, x: 240, y: 340, r: 48 },
          { id: 'carretera', name: 'Carretera', human: true, x: 456, y: 320, r: 50 },
        ],
        draw: (u) => ({
          back: `<defs>${grad(`${u}sk`, '#8ecdf0', DUSK)}</defs><rect width="600" height="400" fill="url(#${u}sk)"/>${sun(420, 56, 22)}${cloud(150, 50, 0.9)}${cloud(560, 40, 0.6)}
            <path d="M0 150Q300 138 600 150V400H0Z" fill="#9ccc65"/><path d="M0 260Q300 250 600 262V400H0Z" fill="${GRASS}"/>`,
          parts: {
            granja: `<g transform="translate(310 196)"><rect x="-52" y="-46" width="58" height="46" fill="#c94a35"/><path d="M-58 -44L-23 -72L12 -44Z" fill="#8a3a2a"/><rect x="-32" y="-26" width="20" height="26" fill="#fbf3df"/><path d="M-32 -26L-12 0M-12 -26L-32 0" stroke="#c94a35" stroke-width="3"/>
              <rect x="14" y="-62" width="22" height="62" rx="11" fill="#d9dee3"/><path d="M14 -51A11 11 0 0 1 36 -51" fill="#a8b1ba"/>${house(56, 0, 26)}</g>`,
            arboles: `${roundTree(464, 194, 16)}${roundTree(494, 186, 20, '#4caf50', '#3d9442')}${roundTree(528, 196, 17)}${roundTree(510, 214, 14, '#4caf50', '#3d9442')}`,
            cultivos: `<g><path d="M10 172H230L250 300H-10Z" fill="#e6c25a"/><g stroke="#c9a23a" stroke-width="3.4">${[186, 204, 222, 240, 258, 276].map((y) => `<path d="M${10 - (y - 172) * 0.16} ${y}H${230 + (y - 172) * 0.16}"/>`).join('')}</g>
              <path d="M-10 300H250L256 316H-10Z" fill="#7fae3f"/></g>`,
            rio: `<path d="M-10 330Q120 300 240 340T620 330" stroke="${SEA}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M-10 330Q120 300 240 340T620 330" stroke="#9fd6f5" stroke-width="4" stroke-dasharray="14 20" fill="none"/>`,
            carretera: `<path d="M420 156L404 156L370 400H470Z" fill="#7d848c"/><path d="M412 160L418 400" stroke="#fff" stroke-width="3" stroke-dasharray="12 12"/>`,
          },
        }),
      },
    };
    /** The items of a spot scene (plain data, no DOM): null = unknown scene. */
    const spotItems = (/** @type {string} */ name) => (SPOTS[name] ? SPOTS[name].items.map((i) => ({ ...i })) : null);
    /** The spot scene: the svg with one `g.sc-item-art[data-id]` per item (its drawing, in paint order) and its round hit area
     *  `circle.sc-hit[data-id]` (on top, in reading order). */
    const spotScene = (/** @type {string} */ name) => {
      const sp = SPOTS[name];
      if (!sp) return null;
      const u = uid();
      const { back, parts } = sp.draw(u);
      // Paint order: back to front by the item's y (rivers and roads under the bridge: drawn by their own order below).
      const order = /** @type {Record<string, string[]>} */ ({
        valle: ['montana', 'torre-electrica', 'bosque', 'rio', 'cultivos', 'carretera', 'puente', 'pueblo'],
        costa: ['acantilado', 'playa', 'isla', 'cabo', 'faro', 'hotel', 'puerto', 'barcos'],
        llanura: ['rio', 'cultivos', 'granja', 'arboles', 'carretera'],
      })[name];
      const items = sp.items.map((i) => ({ ...i }));
      const groups = order.map((id) => `<g class="sc-item-art" data-id="${id}">${parts[id]}</g>`).join('');
      // The hit areas sit on top in reading order (top to bottom, left to right): that is the Tab order. types.js makes them buttons.
      const hits = [...items]
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map((it) => `<circle class="sc-hit" data-id="${it.id}" cx="${it.x}" cy="${it.y}" r="${it.r}"/>`)
        .join('');
      // Badges (✓ / ✗ and the name) go on top of everything: types.js fills g.sc-badges.
      const inner = `${framed(u, 600, 400, `${back}${groups}`)}<g class="sc-hits">${hits}</g><g class="sc-badges"></g>`;
      return { svg: svgEl('0 0 600 400', inner, 'sc-spot-svg'), items, box: /** @type {[number, number]} */ ([600, 400]) };
    };

    // ---------------- Hub hero: the balloon over the travel diary ----------------
    // A passed station (its best round gave 2+ stars, KF.gameData(slug).st) sticks its stamp in the diary; the others are dashed
    // empty slots. Stamps follow the order of the stations.
    const passedSet = () => {
      const unit = window.SC_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return new Set((unit?.stations || []).map((s, i) => ((Number(st[s.id]?.stars) || 0) >= 2 ? i : -1)).filter((i) => i >= 0));
    };
    // Stamp drawings, centred on 0,0, ~44 across.
    /** @type {string[]} */
    const STAMPS = [
      // tiempo: sun and cloud
      `${sun(-6, -6, 9)}${cloud(6, 6, 0.42)}`,
      // parte: a satellite
      `<g transform="rotate(-20)"><rect x="-20" y="-5" width="13" height="10" fill="#3d6fd6"/><rect x="7" y="-5" width="13" height="10" fill="#3d6fd6"/><rect x="-6" y="-7" width="12" height="14" rx="2" fill="#d9dee3"/><rect x="-6" y="-7" width="12" height="4" fill="${YEL}"/></g><path d="M4 12q5 4 0 8M9 9q8 7 0 14" stroke="${RED}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      // factores: a mountain and a thermometer
      `${mountain(-20, 10, 14, -6, -14)}<rect x="10" y="-16" width="7" height="24" rx="3.5" fill="#fff" stroke="${K}" stroke-width="1.4"/><rect x="12" y="-6" width="3" height="14" fill="${RED}"/><circle cx="13.5" cy="11" r="5" fill="${RED}" stroke="${K}" stroke-width="1.4"/>`,
      // zonas: the globe and its bands
      `<circle r="17" fill="#a8d98f"/><path d="M-17 0A17 17 0 0 0 17 0V-6H-17Z" fill="#ffd36b" transform="translate(0 3)"/><path d="M-10 -14A17 17 0 0 1 10 -14Z" fill="#eef7fd"/><path d="M-10 14A17 17 0 0 0 10 14Z" fill="#eef7fd"/><path d="M-17 0H17" stroke="${RED}" stroke-width="2"/><circle r="17" fill="none" stroke="${K}" stroke-width="1.4"/>`,
      // paisajes: a conifer and a palm
      `${conifer(-8, 16, 32)}${palm(8, 16, 26)}`,
      // climograma: bars and a line
      `<g fill="#4a90d9">${[-14, -5, 4, 13].map((x, i) => `<rect x="${x - 3}" y="${[2, -6, -2, 6][i]}" width="7" height="${[14, 22, 18, 10][i]}" rx="1"/>`).join('')}</g><path d="M-14 -4L-5 -12L4 -14L13 -6" stroke="${RED}" stroke-width="2.4" fill="none" stroke-linejoin="round"/><path d="M-19 16H19" stroke="${K}" stroke-width="1.6"/>`,
      // forma: a cliff, the sea and a lighthouse
      `<rect x="-20" y="2" width="40" height="16" fill="${SEA}"/><path d="M-20 -6H0L4 18H-20Z" fill="${ROCK}"/><path d="M-20 -9H1V-5H-20Z" fill="${GRASS_D}"/><g transform="translate(-10 -9)"><path d="M-3 0L-2 -14H2L3 0Z" fill="#fff"/><rect x="-2.4" y="-10" width="4.8" height="3" fill="${RED}"/></g>${waves([[8, 10]], 8)}`,
      // espana: a little map of Spain with a star on Madrid
      `<path d="M-19 -10L-10 -15L8 -14L16 -9L13 -2L17 5L9 12L-4 15L-12 12L-16 4L-14 -4Z" fill="${YEL}" stroke="${RED}" stroke-width="2" stroke-linejoin="round"/><path d="M-1 -4l1.6 3.4 3.6 .2-2.8 2.3 1 3.6-3.4-2-3.2 2 1-3.6-2.8-2.3 3.6-.2z" fill="${RED}"/>`,
    ];
    const STAMP_TINT = ['#e3f3fc', '#e9e6f8', '#efe7dc', '#e2f3ea', '#e6f3db', '#fde9d6', '#e2eef7', '#fde3e1'];
    // Slots on the two pages: left page 4, right page 4 (x, y, rotation).
    const SLOTS = [
      [62, 186, -6],
      [118, 176, 5],
      [70, 240, 4],
      [126, 232, -4],
      [234, 176, -5],
      [290, 186, 6],
      [228, 234, 5],
      [286, 242, -5],
    ];
    const hero = () => {
      const u = uid();
      const passed = passedSet();
      const total = window.SC_CONTENT?.stations?.length || SLOTS.length;
      const stampAt = (/** @type {number} */ i) => {
        const [x, y, rot] = SLOTS[i];
        const on = passed.has(i);
        const edge = Array.from({ length: 24 }, (_, k) => {
          const side = Math.floor(k / 6);
          const t = ((k % 6) + 0.5) / 6;
          const p = [
            [-26 + 52 * t, -26],
            [26, -26 + 52 * t],
            [26 - 52 * t, 26],
            [-26, 26 - 52 * t],
          ][side];
          return `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.6"/>`;
        }).join('');
        return on
          ? `<g class="sc-stamp is-on" data-stamp="${i}" transform="translate(${x} ${y}) rotate(${rot})">
              <g class="sc-stamp-in"><rect x="-26" y="-26" width="52" height="52" rx="3" fill="#fff" filter="url(#${u}ds)"/><g fill="${PAPER_C}">${edge}</g>
              <rect x="-21" y="-21" width="42" height="42" rx="2" fill="${STAMP_TINT[i]}"/><g transform="scale(.95)">${STAMPS[i]}</g>
              <rect x="-21" y="-21" width="42" height="42" rx="2" fill="none" stroke="${K}" stroke-opacity=".15"/></g></g>`
          : `<g class="sc-stamp sc-sk" data-stamp="${i}" transform="translate(${x} ${y}) rotate(${rot})"><rect x="-24" y="-24" width="48" height="48" rx="6" fill="none" stroke="#c9b48a" stroke-width="2" stroke-dasharray="5 5"/>
              <text y="7" text-anchor="middle" font-size="20" font-weight="900" fill="#d6c49d" font-family="system-ui,sans-serif">${i + 1}</text></g>`;
      };
      // The flight path joins the stamps in order; the travelled part (up to the last passed stamp) is solid red.
      const pts = SLOTS.map(([x, y]) => [x, y]);
      const path = `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}`;
      const last = Math.max(-1, ...passed);
      const done =
        last >= 0
          ? `M${pts
              .slice(0, last + 1)
              .map(([x, y]) => `${x} ${y}`)
              .join('L')}`
          : '';
      const balloon = `<g class="sc-balloon"><g class="sc-balloon-in">
          <path d="M0 -58C-34 -58 -40 -26 -30 -6C-22 10 -10 18 -8 28H8C10 18 22 10 30 -6C40 -26 34 -58 0 -58Z" fill="${RED}"/>
          <path d="M0 -58C-14 -58 -18 -26 -14 -6C-11 10 -6 18 -4 28H4C6 18 11 10 14 -6C18 -26 14 -58 0 -58Z" fill="${YEL}"/>
          <path d="M0 -58C-28 -58 -34 -26 -26 -6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>
          <path d="M-8 28L-7 40M8 28L7 40M-3 28L-3 40M3 28L3 40" stroke="#6b4a2e" stroke-width="1.4"/>
          <path d="M-9 40H9L7 52H-7Z" fill="#a8743f"/><path d="M-9 40H9V44H-9Z" fill="#8a5a2e"/></g></g>`;
      const inner = `<defs><clipPath id="${u}fr"><rect x="4" y="4" width="352" height="292" rx="30"/></clipPath>
          ${grad(`${u}sky`, '#7cc4ef', '#ffd8a8')}
          <filter id="${u}ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="#5a3e2b" flood-opacity=".3"/></filter></defs>
        <g clip-path="url(#${u}fr)">
          <rect width="360" height="300" fill="url(#${u}sky)"/>${sun(300, 128, 26, false)}${cloud(70, 44, 0.8)}${cloud(196, 26, 0.55)}${cloud(318, 70, 0.5)}
          <g transform="translate(180 220) rotate(-3)">
            <path d="M-168 -96Q-90 -110 0 -92Q90 -110 168 -96V110H-168Z" fill="#5a3e2b"/>
            <path d="M-160 -90Q-84 -104 -2 -86V108H-160Z" fill="${PAPER_C}"/><path d="M2 -86Q84 -104 160 -90V108H2Z" fill="#fbf0d6"/>
            <path d="M-2 -86V108M2 -86V108" stroke="#d9c49a" stroke-width="2"/>
            <g stroke="#ecdcb6" stroke-width="1.4">${[-50, -22, 6, 34, 62, 90].map((y) => `<path d="M-148 ${y}H-14M14 ${y}H148"/>`).join('')}</g>
          </g>
          <path d="${path}" fill="none" stroke="#b89a68" stroke-width="2.4" stroke-dasharray="2 7" stroke-linecap="round"/>
          ${done ? `<path d="${done}" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/>` : ''}
          ${SLOTS.map((_, i) => stampAt(i)).join('')}
          <g transform="translate(${passed.size >= total ? 300 : 196} ${passed.size >= total ? 88 : 96})">${balloon}</g>
        </g>
        <rect x="4" y="4" width="352" height="292" rx="30" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
      const el = svgEl('0 0 360 300', inner, 'hero-svg sc-hero');
      el.dataset.passed = String(passed.size);
      el.classList.toggle('is-all', passed.size >= total);
      return el;
    };

    return {
      art,
      hero,
      scene,
      spotScene,
      spotItems,
      spotNames: () => Object.keys(SPOTS),
      map,
      weather,
      weatherId,
      weatherIds: () => Object.keys(WEATHER),
      keys: () => Object.keys(ART),
      has: (/** @type {string} */ key) => !!key && key in ART,
    };
  })()
);
