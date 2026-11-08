// Drawings for «Cultura asturiana · 1.er trimestre»: task pictures (`art`, 160 × 120 «stickers» with a warm dark outline on a soft
// tinted tile), the targets of the feed task (`t-<who>`, 240 × 200, with animated parts), the cachopo pan of the cook task
// (`dish`), the hopscotch board of the cascayu task (`board`), the label scenes (the casería, the gaita) and the hub hero — a
// meadow with an hórreo whose pillars are a goal, guarded by a little keeper; every passed station paints one more part of it.
// Plain SVG, our own drawings (never scans from the book). No DOM at load time (the unit tests load this file in a vm).
// window.CAArt = { art(key), scene(name), hero(), has(key), dish(name), board(n), keys() }
// @ts-check
'use strict';

window.CAArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `ca${++uidN}`;
    const svgEl = (/** @type {string} */ viewBox, inner = '', cls = 'art-svg') => {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('viewBox', viewBox);
      el.setAttribute('class', cls);
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('focusable', 'false');
      el.innerHTML = inner;
      return el;
    };
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, /** @type {string} */ inner, flip = false) =>
      `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
    const rot = (/** @type {number} */ deg, /** @type {number} */ x, /** @type {number} */ y, /** @type {string} */ inner) =>
      `<g transform="rotate(${deg} ${x} ${y})">${inner}</g>`;
    const rnd = (/** @type {number} */ seed) => () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const f = (/** @type {number} */ n) => n.toFixed(1);

    // The outline every sticker shares: a warm near-black, round joins.
    const K = '#3a2a20';
    const ol = (w = 2.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const OL = ol();
    const THIN = ol(1.4);

    // ---------------- Tile backgrounds ----------------
    const TINT = {
      food: '#fbecd2',
      green: '#e2efcf',
      dairy: '#e1edf8',
      pig: '#fbe1e1',
      gold: '#fbefc4',
      lilac: '#ece3f5',
      stone: '#ebe6dc',
    };
    /** A soft tile: tint, a light in the middle, the object's shadow on the floor. */
    const tile = (/** @type {string} */ tint, shadow = 46) =>
      `<rect width="160" height="120" rx="16" fill="${tint}"/><circle cx="80" cy="54" r="52" fill="#fff" opacity=".5"/>
       ${shadow ? `<ellipse cx="80" cy="104" rx="${shadow}" ry="6" fill="#3a2a20" opacity=".1"/>` : ''}`;
    /** Sky + far hills + meadow (scenes). */
    const meadow = (/** @type {string} */ u, far = '#9fc77a', near = '#7fb455') =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe1f3"/><stop offset="1" stop-color="#eef8f2"/></linearGradient></defs>
       <rect width="160" height="120" rx="16" fill="url(#${u}sk)"/>
       <path d="M0 70Q30 56 62 66Q96 52 124 64Q144 58 160 64V120H0Z" fill="${far}"/>
       <path d="M0 86Q50 76 92 84T160 80V120H0Z" fill="${near}"/>`;
    const night = (/** @type {string} */ u) =>
      `<defs><linearGradient id="${u}nt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2c5c"/><stop offset="1" stop-color="#4a4f86"/></linearGradient></defs>
       <rect width="160" height="120" rx="16" fill="url(#${u}nt)"/>
       <g fill="#fff">${[
         [18, 16],
         [44, 28],
         [128, 14],
         [148, 34],
         [100, 22],
         [70, 12],
       ]
         .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1 : 1.5}" opacity=".8"/>`)
         .join('')}</g>`;
    const mountains = (/** @type {number} */ y, snow = true) =>
      `<path d="M0 ${y}L24 ${y - 30}L40 ${y - 16}L66 ${y - 44}L92 ${y - 14}L112 ${y - 34}L136 ${y - 8}L160 ${y - 24}V${y + 20}H0Z" fill="#a8b4c0"/>
       ${snow ? `<path d="M66 ${y - 44}L58 ${y - 32}L64 ${y - 34}L68 ${y - 30}L74 ${y - 34}ZM24 ${y - 30}L18 ${y - 22}L24 ${y - 24}L28 ${y - 21}ZM112 ${y - 34}L106 ${y - 26}L112 ${y - 27}L117 ${y - 25}Z" fill="#fff"/>` : ''}`;
    const sun = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r) =>
      `<circle cx="${x}" cy="${y}" r="${r * 1.55}" fill="#ffe08a" opacity=".45"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffcc3e"/>`;
    const cloud = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(x, y, s, '<path d="M-24 0Q-28 -11 -16 -13Q-12 -24 0 -20Q10 -27 19 -16Q30 -16 28 0Z" fill="#fff" fill-opacity=".92"/>');
    const leaf = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ deg, /** @type {string} */ c, s = 1) =>
      `<g transform="translate(${x} ${y}) rotate(${deg}) scale(${s})"><path d="M0 0Q8 -10 22 -4Q12 8 0 0Z" fill="${c}" ${THIN}/><path d="M2 -1Q11 -4 18 -4" stroke="${K}" stroke-opacity=".4" stroke-width="1" fill="none"/></g>`;
    const grassTuft = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, c = '#5e9e3a') =>
      at(
        x,
        y,
        s,
        `<path d="M-10 0Q-12 -12 -16 -20M-4 0Q-4 -14 -6 -26M2 0Q4 -14 10 -22M8 0Q12 -8 18 -14" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`,
      );
    const sparkle = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, c = '#fff') =>
      `<path d="M${x} ${y - s}L${x + s * 0.25} ${y - s * 0.25}L${x + s} ${y}L${x + s * 0.25} ${y + s * 0.25}L${x} ${y + s}L${x - s * 0.25} ${y + s * 0.25}L${x - s} ${y}L${x - s * 0.25} ${y - s * 0.25}Z" fill="${c}"/>`;
    const bee = (/** @type {number} */ x, /** @type {number} */ y) =>
      `<g transform="translate(${x} ${y})"><ellipse cx="-2" cy="-5" rx="4" ry="3" fill="#fff" opacity=".85" ${ol(1)}/><ellipse cx="3" cy="-5" rx="4" ry="3" fill="#fff" opacity=".85" ${ol(1)}/>
        <ellipse rx="6" ry="4.2" fill="#ffc531" ${ol(1.3)}/><path d="M-1 -4V4M3 -3.6V3.6" stroke="${K}" stroke-width="1.8"/></g>`;

    // ---------------- People ----------------
    /** A head looking at us: skin, hair (path inside), eyes, smile, cheeks; at 0,0 with radius 14. */
    const face = (/** @type {string} */ hair, skin = '#f4c9a3', smile = true) =>
      `<circle r="14" fill="${skin}" ${OL}/>${hair}
       <circle cx="-5" cy="1" r="1.8" fill="${K}"/><circle cx="5" cy="1" r="1.8" fill="${K}"/>
       <circle cx="-8" cy="6" r="2.6" fill="#f08a7a" opacity=".45"/><circle cx="8" cy="6" r="2.6" fill="#f08a7a" opacity=".45"/>
       ${smile ? `<path d="M-4 7Q0 10 4 7" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` : ''}`;
    const etelvina = () =>
      `${at(
        80,
        48,
        1.5,
        `<path d="M-22 48Q-24 20 -10 16H10Q24 20 22 48Z" fill="#2f3a4a" ${OL}/><path d="M-13 18Q0 26 13 18L11 32H-11Z" fill="#fbf4e6" ${THIN}/>
        <path d="M-9 30H9L12 48H-12Z" fill="#c8413a" ${THIN}/><path d="M-9 36H10M-10 42H11" stroke="#f2c14e" stroke-width="1.6"/>
        ${face(`<path d="M-14 -2Q-16 -16 0 -17Q16 -16 14 -2Q8 -10 0 -10Q-8 -10 -14 -2Z" fill="#5a3420"/>`)}
        <path d="M-16 -4Q-18 -20 0 -21Q18 -20 16 -4Q12 -14 0 -14Q-12 -14 -16 -4Z" fill="#c8413a" ${OL}/><path d="M12 -8L22 2L14 2Z" fill="#c8413a" ${THIN}/>
        <path d="M-6 -16l3 3M2 -18l2 4M9 -15l1 4" stroke="#f2c14e" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M-12 8Q-20 18 -16 30" stroke="#5a3420" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      )}`;
    const cristina = () =>
      `${at(
        80,
        48,
        1.5,
        `<path d="M-24 48Q-22 20 -10 16H10Q22 20 24 48Z" fill="#e27ba4" ${OL}/><path d="M-10 16Q0 24 10 16L8 26Q0 30 -8 26Z" fill="#ffd1e2" ${THIN}/>
        <path d="M-18 40Q0 46 18 40" stroke="#ffd1e2" stroke-width="2" fill="none"/><circle cy="30" r="2" fill="#ffd25a" ${ol(1)}/>
        <path d="M-16 0Q-20 30 -14 34Q-18 10 -12 -2ZM16 0Q20 30 14 34Q18 10 12 -2Z" fill="#f2c14e" ${THIN}/>
        ${face(`<path d="M-14 -1Q-16 -17 0 -17Q16 -17 14 -1Q10 -10 2 -11Q-6 -6 -14 -1Z" fill="#f2c14e"/>`)}
        <path d="M-10 -14L-12 -26L-5 -19L0 -28L5 -19L12 -26L10 -14Z" fill="#ffd25a" ${OL}/><circle cy="-19" r="1.8" fill="#3f8fc9"/>`,
      )}`;

    // ---------------- Animals ----------------
    /** A cow facing right, feet at y 104. o = { body, head?, patch?, muzzle, horns: 'short' | 'lyre', s (size), udder? }. */
    const cow = (
      /** @type {string} */ u,
      /** @type {{ body: string, head?: string, patch?: string, muzzle: string, horns: 'short' | 'lyre', s?: number, belly?: string }} */ o,
    ) => {
      const head = o.head || o.body;
      const patches = o.patch
        ? `<g clip-path="url(#${u}cw)" fill="${o.patch}"><path d="M48 38Q60 34 64 46Q66 60 52 60Q40 58 42 46Z"/><path d="M84 52Q98 44 106 56Q108 74 92 72Q80 68 84 52Z"/><path d="M30 66Q40 64 40 76L32 86H26Z"/></g>`
        : '';
      const horns =
        o.horns === 'lyre'
          ? `<path d="M120 33C110 26 110 14 118 8" stroke="#f3ead6" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M134 33C144 26 144 14 136 8" stroke="#f3ead6" stroke-width="4.4" fill="none" stroke-linecap="round"/>
             <path d="M118 8l1 4M136 8l-1 4" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`
          : `<path d="M120 34Q114 30 112 24M134 34Q140 30 142 24" stroke="#f3ead6" stroke-width="4.6" fill="none" stroke-linecap="round"/>`;
      const BODY = 'M32 46Q32 36 44 36H100Q114 36 118 46L120 70Q120 80 108 80H44Q30 80 30 70Z';
      return at(
        80,
        104,
        o.s || 1,
        `<g transform="translate(-80 -104)"><defs><clipPath id="${u}cw"><path d="${BODY}"/></clipPath></defs>
        <path d="M32 46Q20 56 24 78" stroke="${o.body}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M24 78l-4 8 6 -2 2 6z" fill="${K}"/>
        ${[40, 54, 94, 106].map((x) => `<rect x="${x}" y="74" width="10" height="28" rx="4" fill="${o.body}" ${OL}/><rect x="${x}" y="96" width="10" height="7" rx="2" fill="${K}"/>`).join('')}
        <path d="${BODY}" fill="${o.body}" ${OL}/>${patches}
        ${o.belly ? `<path d="M46 76Q74 84 104 76" stroke="${o.belly}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>` : ''}
        <ellipse cx="92" cy="82" rx="8" ry="5" fill="#f3a7b0" ${THIN}/>
        ${horns}
        <path d="M112 40Q114 30 127 30Q140 30 142 40L146 60Q146 72 134 72H124Q112 72 112 60Z" fill="${head}" ${OL}/>
        <path d="M112 38Q100 34 102 44Q106 46 112 44Z" fill="${head}" ${THIN}/><path d="M142 38Q154 34 152 44Q148 46 142 44Z" fill="${head}" ${THIN}/>
        <ellipse cx="129" cy="63" rx="13" ry="9" fill="${o.muzzle}" ${OL}/><circle cx="124" cy="63" r="1.8" fill="${K}"/><circle cx="134" cy="63" r="1.8" fill="${K}"/>
        <circle cx="121" cy="46" r="2.2" fill="${K}"/><circle cx="137" cy="46" r="2.2" fill="${K}"/><circle cx="121.8" cy="45.2" r=".7" fill="#fff"/><circle cx="137.8" cy="45.2" r=".7" fill="#fff"/></g>`,
      );
    };
    // The astur-celta pig: pink with black patches, big floppy ears; facing right, feet at y 100.
    const pig = (/** @type {string} */ u) => {
      const BODY = 'M36 64Q36 40 70 38Q108 36 116 56Q120 80 96 88H56Q36 86 36 64Z';
      return `<defs><clipPath id="${u}pg"><path d="${BODY}"/></clipPath></defs>
        <path d="M38 56Q28 52 30 44Q34 40 36 46" stroke="${K}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        ${[46, 60, 88, 102].map((x) => `<rect x="${x}" y="80" width="10" height="20" rx="4" fill="#f2b0b5" ${OL}/><rect x="${x}" y="95" width="10" height="5" rx="2" fill="${K}"/>`).join('')}
        <path d="${BODY}" fill="#f4b9bd" ${OL}/>
        <g clip-path="url(#${u}pg)" fill="#2e2626"><path d="M44 46Q58 40 62 54Q60 66 46 64Q38 58 44 46Z"/><path d="M78 66Q92 60 98 72Q98 90 82 88Q72 80 78 66Z"/><path d="M96 40Q104 38 108 46L100 50Z"/></g>
        <path d="M104 46Q108 32 124 34Q138 38 138 54Q138 70 122 72Q108 72 104 60Z" fill="#f4b9bd" ${OL}/>
        <ellipse cx="139" cy="58" rx="8" ry="9" fill="#ef9aa3" ${OL}/><ellipse cx="137" cy="56" rx="1.4" ry="2.2" fill="${K}"/><ellipse cx="141" cy="60" rx="1.4" ry="2.2" fill="${K}"/>
        <circle cx="122" cy="50" r="2.2" fill="${K}"/><circle cx="122.8" cy="49.2" r=".7" fill="#fff"/>
        <path d="M108 38Q116 22 130 30Q128 44 118 50Q110 48 108 38Z" fill="#2e2626" ${OL}/>
        <path d="M124 66Q128 69 132 66" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    };
    const hen = `<path d="M-14 -2Q-18 -16 -6 -18Q-2 -28 8 -24Q14 -20 12 -12Q18 -4 10 4Q0 10 -10 6Q-16 4 -14 -2Z" fill="#c8693a" ${OL}/>
      <path d="M8 -26l2 -5 2 4 3 -3v6z" fill="#d9473b" ${THIN}/><path d="M12 -20l6 2 -6 2z" fill="#f2b134" ${THIN}/><circle cx="8" cy="-21" r="1.4" fill="${K}"/>
      <path d="M-14 -6Q-24 -14 -20 -22Q-14 -14 -10 -14" fill="#7a3a1e" ${THIN}/><path d="M-4 6v6M2 6v6" stroke="#f2b134" stroke-width="2"/>`;

    // ---------------- Foods & things ----------------
    const egg = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, c = '#f6e3c8') =>
      `<ellipse cx="${x}" cy="${y}" rx="${9 * s}" ry="${11.5 * s}" fill="${c}" ${OL}/><ellipse cx="${x - 3 * s}" cy="${y - 4 * s}" rx="${2.4 * s}" ry="${3.2 * s}" fill="#fff" opacity=".7"/>`;
    const wicker = (/** @type {number} */ x0, /** @type {number} */ x1, /** @type {number} */ y0, /** @type {number} */ y1) => {
      let out = '';
      for (let y = y0 + 6; y < y1; y += 7) out += `<path d="M${x0} ${y}H${x1}" stroke="#a06a34" stroke-width="1.4"/>`;
      for (let x = x0 + 8; x < x1; x += 10) out += `<path d="M${x} ${y0}V${y1}" stroke="#a06a34" stroke-width="1.2" opacity=".7"/>`;
      return out;
    };
    const basket = (/** @type {string} */ u, /** @type {string} */ inside) =>
      `<defs><clipPath id="${u}bk"><path d="M28 60H132L120 102H40Z"/></clipPath></defs>
       <path d="M40 62Q40 18 80 18Q120 18 120 62" stroke="#b77a3e" stroke-width="6" fill="none" ${ol(0)}/><path d="M40 62Q40 18 80 18Q120 18 120 62" stroke="${K}" stroke-width="1.6" fill="none" opacity=".5"/>
       ${inside}<path d="M28 60H132L120 102H40Z" fill="#d6a062" ${OL}/><g clip-path="url(#${u}bk)">${wicker(28, 132, 60, 102)}</g>
       <rect x="24" y="56" width="112" height="10" rx="5" fill="#c58a4c" ${OL}/>`;
    // A sausage along a path, with tied ends.
    const sausage = (/** @type {string} */ d, /** @type {string} */ c, /** @type {number} */ w, /** @type {string} */ hi) =>
      `<path d="${d}" stroke="${K}" stroke-width="${w + 4.4}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
       <path d="${d}" stroke="${hi}" stroke-width="${Math.max(2, w * 0.18)}" fill="none" stroke-linecap="round" stroke-dasharray="2 ${Math.round(w * 0.9)}" opacity=".7" transform="translate(0 ${-w * 0.22})"/>`;
    const tie = (/** @type {number} */ x, /** @type {number} */ y) =>
      `<path d="M${x - 3} ${y}h6M${x} ${y}q-4 -6 -2 -10M${x} ${y}q5 -5 4 -10" stroke="#e8dcc2" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    const loaf = (/** @type {number} */ rx, /** @type {number} */ ry, /** @type {string} */ c, /** @type {string} */ cuts) =>
      `<ellipse cx="80" cy="74" rx="${rx}" ry="${ry}" fill="${c}" ${OL}/><path d="M${80 - rx + 8} ${74 - ry * 0.2}Q80 ${74 - ry * 1.05} ${80 + rx - 8} ${74 - ry * 0.2}" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>${cuts}`;
    const pot = (/** @type {string} */ inside, c = '#b5623a') =>
      `<path d="M32 58H128Q128 100 104 104H56Q32 100 32 58Z" fill="${c}" ${OL}/>${inside}<rect x="26" y="52" width="108" height="12" rx="6" fill="${c}" ${OL}/>
       <path d="M26 64Q14 64 16 74Q20 80 30 76M134 64Q146 64 144 74Q140 80 130 76" stroke="${K}" stroke-width="2.2" fill="${c}"/>
       <path d="M44 72Q46 90 60 96" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const steam = (/** @type {number} */ x, /** @type {number} */ y) =>
      `<g stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"><path d="M${x - 12} ${y}q-5 -8 0 -14t0 -14"/><path d="M${x} ${y - 2}q-5 -8 0 -14t0 -14"/><path d="M${x + 12} ${y}q-5 -8 0 -14t0 -14"/></g>`;
    const flowerHead = (
      /** @type {number} */ x,
      /** @type {number} */ y,
      /** @type {number} */ r,
      /** @type {string} */ c,
      mid = '#f2c14e',
    ) =>
      `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${f(Math.cos((a * Math.PI) / 180) * r)}" cy="${f(Math.sin((a * Math.PI) / 180) * r)}" r="${f(r * 0.85)}" fill="${c}" ${ol(1)}/>`).join('')}<circle r="${f(r * 0.6)}" fill="${mid}" ${ol(1)}/></g>`;
    const branch = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ deg, /** @type {string} */ c) =>
      `<g transform="translate(${x} ${y}) rotate(${deg})"><path d="M0 0Q14 -4 30 -2" stroke="#7a5a3a" stroke-width="2.4" fill="none" stroke-linecap="round"/>${leaf(8, -2, -40, c, 0.7)}${leaf(16, -2, 30, c, 0.7)}${leaf(24, -2, -30, c, 0.6)}</g>`;
    // An hórreo / panera: a granary on pillars (n = number of pillars along the front), wooden walls, tiled roof.
    const granary = (/** @type {number} */ w, /** @type {number} */ n, gallery = false) => {
      const x0 = 80 - w / 2;
      const pillars = Array.from({ length: n }, (_, i) => x0 + 8 + (i * (w - 16)) / (n - 1));
      return `${pillars.map((x) => `<path d="M${x - 5} 104L${x - 3} 76H${x + 3}L${x + 5} 104Z" fill="#c9c2b4" ${OL}/><rect x="${x - 7}" y="70" width="14" height="6" rx="2" fill="#a9a194" ${THIN}/>`).join('')}
        <rect x="${x0}" y="46" width="${w}" height="26" fill="#a8652e" ${OL}/>
        <g stroke="#7a4520" stroke-width="1.4">${Array.from({ length: Math.floor(w / 8) - 1 }, (_, i) => `<path d="M${x0 + 8 + i * 8} 47V71"/>`).join('')}</g>
        ${gallery ? `<rect x="${x0 - 4}" y="58" width="${w + 8}" height="4" fill="#8a5226" ${THIN}/><g stroke="${K}" stroke-width="1.2">${Array.from({ length: Math.floor((w + 8) / 6) }, (_, i) => `<path d="M${x0 - 2 + i * 6} 62V71"/>`).join('')}</g>` : ''}
        <rect x="${74}" y="52" width="12" height="18" fill="#7a4520" ${THIN}/>
        <path d="M${x0 - 10} 48L${80 - w * 0.18} 22H${80 + w * 0.18}L${x0 + w + 10} 48Z" fill="#c4553a" ${OL}/>
        <path d="M${x0 - 2} 40H${x0 + w + 2}M${x0 + 6} 32H${x0 + w - 6}" stroke="#9c3c26" stroke-width="1.6"/>`;
    };
    const barrel = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(
        x,
        y,
        s,
        `<ellipse cx="0" cy="0" rx="22" ry="26" fill="#a8652e" ${OL}/><ellipse cx="0" cy="0" rx="12" ry="20" fill="#bf7a3e" ${THIN}/>
         <ellipse cx="0" cy="0" rx="6" ry="9" fill="#8a4f22" ${THIN}/><path d="M-20 -10H20M-20 10H20" stroke="#5c5650" stroke-width="2.4"/><circle cx="0" cy="14" r="2.2" fill="${K}"/>`,
      );
    const stoneHut = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(
        x,
        y,
        s,
        `<path d="M-20 0V-18H20V0Z" fill="#c9c0b0" ${OL}/><path d="M-12 -6h6M2 -12h8M-16 -12h5M8 -4h6" stroke="#9a907f" stroke-width="1.4"/>
         <rect x="-4" y="-12" width="8" height="12" fill="#6a4a2c" ${THIN}/><path d="M-26 -16Q0 -42 26 -16Z" fill="#c9a25a" ${OL}/><path d="M-16 -22Q0 -34 16 -22" stroke="#a8813e" stroke-width="1.4" fill="none"/>`,
      );
    const tree = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, c = '#4f8f3a', fruit = '') =>
      at(
        x,
        y,
        s,
        `<path d="M-3 0L-2 -22H2L3 0Z" fill="#7a5034" ${THIN}/><circle cy="-34" r="18" fill="${c}" ${OL}/><circle cx="-12" cy="-26" r="10" fill="${c}" ${THIN}/><circle cx="12" cy="-26" r="10" fill="${c}" ${THIN}/>${fruit}`,
      );
    const pine = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(x, y, s, `<rect x="-2" y="-8" width="4" height="8" fill="#6a4a2c"/><path d="M0 -40L14 -8H-14Z" fill="#3f7a46" ${THIN}/>`);
    const waves = (/** @type {number} */ y) =>
      `<path d="M0 ${y}Q10 ${y - 4} 20 ${y}T40 ${y}T60 ${y}T80 ${y}T100 ${y}T120 ${y}T140 ${y}T160 ${y}V120H0Z" fill="#4f9fd2"/>
       <path d="M8 ${y + 10}q6 -4 12 0M60 ${y + 14}q6 -4 12 0M110 ${y + 8}q6 -4 12 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`;
    const chalkNums = (/** @type {number[][]} */ cells, /** @type {string} */ cls) =>
      cells.map(([x, y, n]) => `<text x="${x}" y="${y}" class="${cls}" text-anchor="middle">${n}</text>`).join('');
    const bag = (/** @type {string} */ c, /** @type {string} */ c2) =>
      `<path d="M46 50Q40 100 54 104H106Q120 100 114 50Z" fill="${c}" ${OL}/><path d="M50 50Q80 40 110 50" fill="none" ${OL}/>
       <path d="M60 50Q60 22 80 22Q100 22 100 50" stroke="${c2}" stroke-width="5" fill="none" stroke-linecap="round"/>
       <path d="M60 50Q60 22 80 22Q100 22 100 50" stroke="${K}" stroke-width="1.4" fill="none" opacity=".6"/>
       <path d="M52 66Q80 76 108 66" stroke="${c2}" stroke-width="4" fill="none"/>${flowerHead(80, 84, 4.6, c2, '#ffd25a')}`;

    /** @type {Record<string, { tint?: string, draw: (u: string) => string }>} */
    const ART = {
      // ---- the story ----
      etelvina: {
        draw: (u) => `${meadow(u)}${mountains(70)}${stoneHut(132, 86, 0.8)}${grassTuft(22, 108, 0.8)}${etelvina()}`,
      },
      cristina: {
        draw: (u) =>
          `<rect width="160" height="120" rx="16" fill="#f6e6f0"/><path d="M14 120V44L22 30L30 44V120Z" fill="#e9d2df" ${THIN}/><path d="M130 120V40L140 24L150 40V120Z" fill="#e9d2df" ${THIN}/>
           <path d="M14 44H30M130 40H150" stroke="${K}" stroke-width="1.4"/>${cristina()}`,
      },
      castillo: {
        draw: (u) =>
          `<defs><linearGradient id="${u}cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c4e4f6"/><stop offset="1" stop-color="#f2f8fb"/></linearGradient></defs>
           <rect width="160" height="120" rx="16" fill="url(#${u}cs)"/>${sun(30, 26, 9)}${cloud(120, 26, 0.8)}
           <path d="M40 120V80L56 70L104 70L122 84L132 120Z" fill="#8f8a7c" ${OL}/>
           <g fill="#e6dccb" ${OL}><rect x="54" y="44" width="52" height="30"/><rect x="44" y="30" width="16" height="44"/><rect x="100" y="30" width="16" height="44"/></g>
           <path d="M44 30v-6h4v4h4v-4h4v4h4v-4M100 30v-6h4v4h4v-4h4v4h4v-4M54 44v-5h5v4h5v-4h5v4h5v-4h5v4h5v-4h5v4h5v-4h4v5" fill="none" ${THIN}/>
           <path d="M74 74V60Q80 52 86 60V74Z" fill="#6a4a2c" ${THIN}/><rect x="49" y="40" width="6" height="9" rx="3" fill="#3a4a6a"/><rect x="105" y="40" width="6" height="9" rx="3" fill="#3a4a6a"/>
           <path d="M108 30V12" stroke="${K}" stroke-width="1.6"/><path d="M108 12l14 4 -14 4Z" fill="#2f6fb0" ${THIN}/>
           ${waves(98)}`,
      },
      brana: {
        draw: (u) =>
          `${meadow(u, '#a9cf86', '#86bb5c')}${mountains(66)}${cloud(40, 22, 0.7)}
           ${stoneHut(56, 92, 1)}${stoneHut(104, 84, 0.8)}${stoneHut(132, 98, 0.7)}${grassTuft(24, 110, 0.9)}${grassTuft(84, 112, 0.7)}`,
      },
      hogaza: {
        tint: TINT.food,
        draw: () =>
          loaf(
            50,
            30,
            '#d49a52',
            `<path d="M54 64q10 -10 22 -2M74 58q10 -8 22 0M92 64q8 -6 16 2" stroke="#9a6028" stroke-width="3" fill="none" stroke-linecap="round"/>
             <path d="M44 84Q80 100 116 84" stroke="#b5793a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
          ),
      },
      ropa: {
        tint: TINT.dairy,
        draw: () =>
          `<rect x="34" y="78" width="92" height="22" rx="6" fill="#fbf7ef" ${OL}/><rect x="40" y="58" width="80" height="22" rx="6" fill="#9cc9ea" ${OL}/>
           <path d="M50 58Q50 48 62 46L80 52L98 46Q110 48 110 58" fill="#9cc9ea" ${OL}/><path d="M72 52L80 60L88 52" fill="none" ${THIN}/>
           <rect x="46" y="38" width="68" height="20" rx="6" fill="#f2a6a0" ${OL}/><path d="M46 48H114" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 4"/>
           <path d="M34 89H126" stroke="#d9cfbd" stroke-width="2"/>`,
      },
      peine: {
        tint: TINT.lilac,
        draw: (u) =>
          `<defs><linearGradient id="${u}pe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#b9c2cc"/><stop offset="1" stop-color="#e6eaee"/></linearGradient></defs>
           ${rot(
             -12,
             80,
             60,
             `<path d="M30 46Q30 34 44 34H116Q130 34 130 46V54H30Z" fill="url(#${u}pe)" ${OL}/>
             <path d="M36 54V86M44 54V90M52 54V90M60 54V90M68 54V90M76 54V90M84 54V90M92 54V90M100 54V90M108 54V90M116 54V90M124 54V86" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/>
             <path d="M36 54V86M44 54V90M52 54V90M60 54V90M68 54V90M76 54V90M84 54V90M92 54V90M100 54V90M108 54V90M116 54V90M124 54V86" stroke="#d3d9df" stroke-width="2.6" stroke-linecap="round"/>
             ${flowerHead(80, 44, 3.4, '#c8b3e6', '#ffd25a')}`,
           )}${sparkle(124, 26, 7, '#fff')}${sparkle(30, 92, 5, '#fff')}`,
      },
      babuchas: {
        tint: TINT.pig,
        draw: () =>
          `${[
            [52, 70, -8],
            [104, 78, 8],
          ]
            .map(([x, y, a]) =>
              rot(
                a,
                x,
                y,
                `<path d="M${x - 30} ${y + 8}Q${x - 30} ${y - 10} ${x - 6} ${y - 10}Q${x + 22} ${y - 10} ${x + 34} ${y - 22}Q${x + 34} ${y + 4} ${x + 18} ${y + 12}H${x - 24}Q${x - 30} ${y + 12} ${x - 30} ${y + 8}Z" fill="#e2558a" ${OL}/>
                 <path d="M${x - 4} ${y - 10}Q${x + 14} ${y - 4} ${x + 24} ${y - 16}" fill="none" stroke="#ffd25a" stroke-width="2.4"/><circle cx="${x + 34}" cy="${y - 22}" r="3" fill="#ffd25a" ${ol(1)}/>
                 <path d="M${x - 26} ${y + 12}H${x + 18}" stroke="#a8325e" stroke-width="3"/>`,
              ),
            )
            .join('')}`,
      },
      piano: {
        tint: TINT.stone,
        draw: () =>
          `<rect x="30" y="24" width="100" height="56" rx="6" fill="#4a2e22" ${OL}/><rect x="38" y="30" width="84" height="18" rx="3" fill="#6a4434"/>
           <path d="M54 34h12M94 34h12" stroke="#d9b98a" stroke-width="2"/><rect x="26" y="58" width="108" height="18" fill="#fbf7ef" ${OL}/>
           <g fill="${K}">${[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((i) => `<rect x="${32 + i * 7.6}" y="58" width="4.6" height="11"/>`).join('')}</g>
           <path d="M34 58V76M44 58V76M54 58V76M64 58V76M74 58V76M84 58V76M94 58V76M104 58V76M114 58V76M124 58V76" stroke="${K}" stroke-width=".8" opacity=".5"/>
           <path d="M34 76V102M126 76V102" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M34 76V102M126 76V102" stroke="#4a2e22" stroke-width="2.6"/>
           <path d="M100 16l2 -8 8 -2v10" stroke="${K}" stroke-width="2" fill="none"/><ellipse cx="99" cy="17" rx="3.4" ry="2.4" fill="${K}"/><ellipse cx="109" cy="15" rx="3.4" ry="2.4" fill="${K}"/>`,
      },
      amasar: {
        tint: TINT.food,
        draw: () =>
          `<path d="M20 70H140L128 100H32Z" fill="#b77a3e" ${OL}/><path d="M28 78H132" stroke="#8a5226" stroke-width="2"/>
           <ellipse cx="80" cy="70" rx="40" ry="14" fill="#f6ead2" ${OL}/><g fill="#fff" opacity=".9"><circle cx="30" cy="62" r="2"/><circle cx="126" cy="60" r="2.4"/><circle cx="44" cy="54" r="1.6"/><circle cx="114" cy="52" r="1.6"/></g>
           <path d="M50 60Q50 44 64 42L74 44Q80 50 76 60Z" fill="#f4c9a3" ${OL}/><path d="M110 60Q110 44 96 42L86 44Q80 50 84 60Z" fill="#f4c9a3" ${OL}/>
           <path d="M56 46V36M66 44V32M94 44V32M104 46V36" stroke="#f4c9a3" stroke-width="7" stroke-linecap="round"/><path d="M40 30L52 40M120 30L108 40" stroke="#c8413a" stroke-width="10" stroke-linecap="round"/>`,
      },
      huevos: {
        tint: TINT.food,
        draw: (u) => basket(u, `${egg(62, 54, 1.1)}${egg(80, 50, 1.15, '#fbf2e4')}${egg(98, 54, 1.1, '#e8c49a')}`),
      },
      calcetin: {
        tint: TINT.dairy,
        draw: () =>
          `<path d="M66 18H100V66Q100 74 106 80L118 90Q126 100 114 106Q104 110 92 102L64 82Q56 76 60 66Z" fill="#e05a4a" ${OL}/>
           <rect x="64" y="16" width="38" height="14" rx="4" fill="#fbf7ef" ${OL}/><path d="M66 44H100M66 56H100" stroke="#fbf7ef" stroke-width="4"/>
           <path d="M74 66H92V84H74Z" fill="#7fbbe6" ${THIN}/><path d="M76 70h14M76 74h14M76 78h14M80 66v18M86 66v18" stroke="#3f7fb0" stroke-width="1"/>
           <path d="M126 24L94 76" stroke="#9aa4ae" stroke-width="2.6" stroke-linecap="round"/><circle cx="125" cy="26" r="2" fill="none" stroke="#6a7480" stroke-width="1.2"/>
           <path d="M125 26Q140 40 130 60Q124 74 132 90" stroke="#3f7fb0" stroke-width="1.6" fill="none"/>`,
      },

      // ---- the casería ----
      panera: { draw: (u) => `${meadow(u)}${cloud(126, 22, 0.7)}${granary(112, 6, true)}` },
      piteru: {
        draw: (u) =>
          `${meadow(u)}<path d="M36 100V56H108V100Z" fill="#c08a52" ${OL}/><path d="M28 58L72 30L116 58Z" fill="#c4553a" ${OL}/>
           <g stroke="#8f5f33" stroke-width="1.4">${[44, 52, 60, 68, 76, 84, 92, 100].map((x) => `<path d="M${x} 58V100"/>`).join('')}</g>
           <path d="M62 100V76Q72 66 82 76V100Z" fill="#5a3a22" ${THIN}/><path d="M58 102L72 88L86 102" stroke="#c08a52" stroke-width="3" fill="none"/>
           ${at(126, 102, 1.1, hen)}${at(44, 110, 0.7, hen, true)}`,
      },
      cuadra: {
        draw: (u) =>
          `${meadow(u)}<path d="M26 104V50H134V104Z" fill="#cfc6b6" ${OL}/><path d="M18 52L80 24L142 52Z" fill="#c4553a" ${OL}/>
           <path d="M36 64h14M62 58h18M96 64h16M110 82h14M34 86h12" stroke="#a49a88" stroke-width="2"/>
           <rect x="58" y="62" width="44" height="42" fill="#7a4a26" ${OL}/><rect x="58" y="62" width="44" height="18" fill="#3a2a20"/>
           <path d="M58 80H102M80 80V104" stroke="#5a3418" stroke-width="2"/>
           <path d="M66 80Q66 64 80 64Q94 64 94 80Z" fill="#8e3b1c" ${OL}/><path d="M68 68Q60 64 62 72M92 68Q100 64 98 72" fill="#8e3b1c" ${THIN}/>
           <ellipse cx="80" cy="77" rx="9" ry="5" fill="#e8c9a8" ${THIN}/><circle cx="74" cy="70" r="1.6" fill="${K}"/><circle cx="86" cy="70" r="1.6" fill="${K}"/>
           <path d="M72 64Q68 58 64 58M88 64Q92 58 96 58" stroke="#f3ead6" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      },
      guerta: {
        draw: (u) =>
          `${meadow(u)}<path d="M8 120L40 74H120L152 120Z" fill="#8a5a36"/><path d="M30 120L58 74M80 120V74M130 120L102 74" stroke="#6e4426" stroke-width="3"/>
           ${[
             [40, 108],
             [60, 92],
             [96, 92],
             [118, 108],
             [76, 104],
           ]
             .map(
               ([x, y], i) =>
                 `<g transform="translate(${x} ${y}) scale(${i === 4 ? 1 : 0.8})"><circle r="10" fill="${i % 2 ? '#7fbf4f' : '#5e9e3a'}" ${OL}/><path d="M-6 -2Q0 6 6 -2M0 -8V6" stroke="#3f7a2a" stroke-width="1.4" fill="none"/></g>`,
             )
             .join('')}
           <path d="M24 74V30M132 74V30" stroke="#8a5a36" stroke-width="3"/><path d="M24 40Q34 46 28 56Q20 62 26 72M132 40Q122 46 128 56Q136 62 130 72" stroke="#5e9e3a" stroke-width="2.4" fill="none"/>
           ${leaf(24, 48, -20, '#7fbf4f', 0.5)}${leaf(132, 52, 200, '#7fbf4f', 0.5)}`,
      },
      maizal: {
        draw: (u) =>
          `${meadow(u, '#b8d68e', '#94c063')}${[20, 44, 68, 92, 116, 140]
            .map((x, i) =>
              at(
                x,
                110 - (i % 2) * 6,
                1 - (i % 2) * 0.1,
                `<path d="M0 0V-70" stroke="#5e9e3a" stroke-width="3.4"/><path d="M0 -20Q-16 -26 -20 -40M0 -36Q14 -42 18 -56M0 -50Q-12 -58 -12 -70" stroke="#6faf45" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M0 -70l-3 -10M0 -70l3 -9M0 -70v-11" stroke="#d6b450" stroke-width="1.6"/>
                <g transform="translate(4 -40) rotate(20)"><ellipse rx="5" ry="12" fill="#f2c94c" ${THIN}/><path d="M-4 4Q-8 12 0 16Q8 12 4 4" fill="#8fc45a" ${ol(1)}/></g>`,
              ),
            )
            .join('')}`,
      },
      llagar: {
        draw: () =>
          `<rect width="160" height="120" rx="16" fill="#efe2cf"/><path d="M0 92H160V120H0Z" fill="#c9b49a"/><path d="M0 92H160" stroke="${K}" stroke-width="1.4" opacity=".4"/>
           ${barrel(40, 70, 1)}${barrel(88, 70, 1)}
           <rect x="116" y="26" width="8" height="70" fill="#8a5226" ${OL}/><rect x="140" y="26" width="8" height="70" fill="#8a5226" ${OL}/><rect x="112" y="22" width="40" height="8" fill="#a8652e" ${OL}/>
           <rect x="124" y="46" width="16" height="14" fill="#c08a52" ${THIN}/><path d="M132 30V46" stroke="#5c5650" stroke-width="3"/><rect x="118" y="74" width="28" height="10" fill="#a8652e" ${THIN}/>
           ${[
             [126, 70],
             [134, 68],
             [140, 72],
           ]
             .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#b8d14a" ${ol(1)}/>`)
             .join('')}`,
      },

      // ---- cows ----
      'vaca-carrenana': {
        draw: (u) =>
          `${meadow(u)}${cow(u, { body: '#8e3b1c', head: '#7a3216', muzzle: '#e8c9a8', horns: 'short', s: 1.04, belly: '#b4552a' })}`,
      },
      'vaca-casina': {
        draw: (u) =>
          `${meadow(u, '#a9cf86', '#86bb5c')}${mountains(62)}${cow(u, { body: '#c47e44', head: '#b06c36', muzzle: '#f2dcbf', horns: 'lyre', s: 0.84 })}`,
      },
      'vaca-frisona': {
        draw: (u) =>
          `${meadow(u)}${cow(u, { body: '#f8f5ee', head: '#f8f5ee', patch: '#2b2522', muzzle: '#f3b7bd', horns: 'short', s: 0.98 })}`,
      },
      'vaca-parda': {
        draw: (u) =>
          `${meadow(u, '#a9cf86', '#86bb5c')}<path d="M0 66L36 22L56 44L84 14L118 52L140 34L160 50V80H0Z" fill="#b9c4cf"/>
           <path d="M84 14L72 32L80 30L86 36L94 28ZM36 22L28 34L36 32L40 36ZM140 34L134 42L140 41L144 44Z" fill="#fff"/>
           <path d="M0 80Q50 74 92 80T160 78V120H0Z" fill="#86bb5c"/>
           ${cow(u, { body: '#968a7c', head: '#8a7e70', muzzle: '#3a3430', horns: 'short', s: 0.94, belly: '#c4b8a6' })}
           <ellipse cx="${80 + (129 - 80) * 0.94}" cy="${104 - (104 - 63) * 0.94}" rx="${15 * 0.94}" ry="${11 * 0.94}" fill="none" stroke="#efe7d6" stroke-width="2.6"/>`,
      },

      // ---- the pig and its food ----
      gochu: { draw: (u) => `${meadow(u)}${at(80, 108, 1, `<g transform="translate(-86 -104)">${pig(u)}</g>`)}` },
      bellota: {
        tint: TINT.green,
        draw: () =>
          `${[
            [62, 64, -14],
            [100, 70, 16],
          ]
            .map(([x, y, a]) =>
              rot(
                a,
                x,
                y,
                `<ellipse cx="${x}" cy="${y + 8}" rx="15" ry="20" fill="#c28a3e" ${OL}/><ellipse cx="${x - 5}" cy="${y + 4}" rx="3.4" ry="7" fill="#fff" opacity=".35"/>
                 <path d="M${x - 18} ${y - 4}Q${x} ${y - 24} ${x + 18} ${y - 4}Q${x} ${y + 2} ${x - 18} ${y - 4}Z" fill="#8a5a2c" ${OL}/>
                 <path d="M${x - 10} ${y - 8}l4 4M${x - 2} ${y - 10}l4 4M${x + 6} ${y - 9}l4 4" stroke="#5e3a1a" stroke-width="1.4"/><path d="M${x} ${y - 14}V${y - 22}" ${OL}/>`,
              ),
            )
            .join('')}${leaf(100, 30, -150, '#6faf45', 1.1)}`,
      },
      castana: {
        tint: TINT.food,
        draw: () =>
          `<g transform="translate(58 68)"><path d="${Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = i % 2 ? 26 : 34;
            return `${i ? 'L' : 'M'}${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;
          }).join('')}Z" fill="#9fbf3a" ${OL}/><path d="M-14 -8Q0 -24 14 -8Q16 10 0 14Q-16 10 -14 -8Z" fill="#7a4420" ${OL}/></g>
           <path d="M96 90Q92 64 110 52Q128 64 124 90Q110 98 96 90Z" fill="#8a4a22" ${OL}/><path d="M98 84Q110 92 122 84" fill="#e7c896" ${ol(1.2)}/><path d="M106 62Q104 72 106 80" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>`,
      },
      nabo: {
        tint: TINT.green,
        draw: () =>
          `${leaf(80, 44, -110, '#5e9e3a', 1.4)}${leaf(80, 44, -70, '#6faf45', 1.4)}${leaf(80, 44, -150, '#7fbf4f', 1.1)}${leaf(80, 44, -30, '#7fbf4f', 1.1)}
           <path d="M80 46Q112 46 110 72Q106 92 82 104Q80 112 78 104Q54 92 50 72Q48 46 80 46Z" fill="#f6f2ea" ${OL}/>
           <path d="M80 46Q112 46 110 64Q80 54 50 64Q48 46 80 46Z" fill="#a8549a" ${THIN}/><path d="M66 76Q70 88 78 94" stroke="#d8d0c0" stroke-width="2" fill="none"/>`,
      },
      berza: {
        tint: TINT.green,
        draw: () =>
          `${leaf(80, 92, -170, '#4f8f3a', 2.6)}${leaf(80, 92, -10, '#4f8f3a', 2.6)}
           <circle cx="80" cy="66" r="32" fill="#7fbf4f" ${OL}/><path d="M50 60Q66 40 80 62Q94 40 110 60" fill="#9fd06a" ${OL}/>
           <path d="M80 62V96M80 76Q66 70 56 76M80 76Q94 70 104 76M80 88Q70 84 62 90M80 88Q90 84 98 90" stroke="#4f8f3a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
      },
      remolacha: {
        tint: TINT.pig,
        draw: () =>
          `${leaf(80, 44, -115, '#5e9e3a', 1.3)}${leaf(80, 44, -65, '#6faf45', 1.3)}<path d="M80 44V30" stroke="#a8325e" stroke-width="2.4"/>
           <path d="M80 44Q114 46 110 74Q104 92 84 98Q80 112 76 98Q56 92 50 74Q46 46 80 44Z" fill="#8e1f4a" ${OL}/>
           <path d="M62 64Q66 80 76 88" stroke="#c45a86" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      },
      maiz: {
        tint: TINT.gold,
        draw: () =>
          rot(
            -30,
            80,
            62,
            `<ellipse cx="80" cy="56" rx="17" ry="38" fill="#f2c94c" ${OL}/>
             <g stroke="#d6a52a" stroke-width="1.4">${[-26, -16, -6, 4, 14, 24].map((y) => `<path d="M64 ${56 + y}Q80 ${60 + y} 96 ${56 + y}"/>`).join('')}<path d="M72 22V90M80 18V94M88 22V90"/></g>
             <path d="M80 80Q52 84 56 112Q72 100 80 92Q88 100 104 112Q108 84 80 80Z" fill="#7fbf4f" ${OL}/><path d="M80 18q-6 -10 -2 -16M80 18q4 -10 10 -12" stroke="#d6b450" stroke-width="2" fill="none"/>`,
          ),
      },
      hierba: {
        tint: TINT.green,
        draw: () =>
          `${grassTuft(56, 100, 2.2, '#5e9e3a')}${grassTuft(96, 102, 2.4, '#6faf45')}${grassTuft(78, 104, 1.8, '#4f8f3a')}
           ${flowerHead(44, 58, 3.6, '#fff', '#f2c14e')}${flowerHead(114, 50, 3.2, '#ffd25a', '#e09a1a')}`,
      },
      pienso: {
        tint: TINT.food,
        draw: () =>
          `<path d="M50 34Q46 60 48 98Q80 106 112 98Q114 60 110 34Q80 28 50 34Z" fill="#e8d6ae" ${OL}/><path d="M48 34Q62 24 64 36Q80 24 96 36Q100 24 112 34" fill="#e8d6ae" ${OL}/>
           <rect x="60" y="56" width="40" height="22" rx="4" fill="#5f9a3a" ${THIN}/><path d="M68 67h24" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
           <g fill="#b8874a" ${ol(1)}>${[
             [36, 100],
             [28, 106],
             [124, 102],
             [132, 96],
             [118, 108],
             [42, 110],
           ]
             .map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="4" rx="2"/>`)
             .join('')}</g>`,
      },
      carne: {
        tint: TINT.pig,
        draw: () =>
          `<path d="M34 64Q30 36 64 34Q104 28 124 48Q136 66 120 84Q96 102 62 96Q36 90 34 64Z" fill="#d9475a" ${OL}/>
           <path d="M40 64Q40 44 66 42Q100 38 116 54Q124 68 112 80" stroke="#f6d2c8" stroke-width="6" fill="none" stroke-linecap="round"/>
           <path d="M58 60Q74 56 88 66M70 78Q86 74 98 82" stroke="#f08a92" stroke-width="2.4" fill="none" stroke-linecap="round"/>
           <circle cx="100" cy="60" r="8" fill="#f6efe2" ${OL}/><circle cx="100" cy="60" r="3" fill="#e7d6bc"/>`,
      },
      pescado: {
        tint: TINT.dairy,
        draw: () =>
          `<path d="M30 62Q60 32 104 52Q118 58 122 62Q118 66 104 72Q60 92 30 62Z" fill="#9fb8c4" ${OL}/>
           <path d="M122 62L144 44Q140 62 144 80Z" fill="#8aa6b4" ${OL}/><path d="M44 62Q74 54 112 62" stroke="#e8a0a8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
           <g fill="#3a4a54">${[
             [60, 52],
             [74, 48],
             [88, 52],
             [70, 72],
             [94, 70],
           ]
             .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`)
             .join('')}</g>
           <circle cx="42" cy="58" r="3" fill="#fff" ${THIN}/><circle cx="42" cy="58" r="1.4" fill="${K}"/><path d="M76 46Q84 34 96 46" fill="#8aa6b4" ${THIN}/>`,
      },
      pollo: {
        tint: TINT.food,
        draw: () =>
          `<path d="M40 74Q36 44 72 40Q108 38 118 60Q122 82 96 90H60Q42 88 40 74Z" fill="#e3a052" ${OL}/>
           <path d="M50 66Q54 50 72 48" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none" stroke-linecap="round"/>
           <path d="M106 80Q122 86 126 98" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M106 80Q122 86 126 98" stroke="#e3a052" stroke-width="5" stroke-linecap="round"/>
           <circle cx="128" cy="100" r="5" fill="#f6efe2" ${OL}/><circle cx="134" cy="98" r="4" fill="#f6efe2" ${OL}/>
           <path d="M40 92H120" stroke="#9fbfd8" stroke-width="5" stroke-linecap="round"/>`,
      },
      queso: {
        tint: TINT.gold,
        draw: () =>
          `<path d="M26 70L104 40L136 64V92L58 100L26 86Z" fill="#f6cf5a" ${OL}/><path d="M26 70L58 84L136 64M58 84V100" fill="none" ${OL}/>
           <path d="M26 70L104 40L136 64L58 84Z" fill="#fbe08a" ${OL}/>
           <g fill="#e6b23a">${[
             [74, 64, 5],
             [96, 56, 3.4],
             [56, 70, 3],
             [88, 86, 4],
             [110, 82, 3],
             [40, 84, 3],
           ]
             .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}"/>`)
             .join('')}</g>`,
      },
      yogur: {
        tint: TINT.dairy,
        draw: () =>
          `<path d="M50 40L58 100H102L110 40Z" fill="#fbf7ef" ${OL}/><path d="M54 62H106L103 84H57Z" fill="#f08aa8" ${THIN}/>
           ${flowerHead(80, 72, 4, '#fff', '#e0557a')}<rect x="46" y="32" width="68" height="10" rx="3" fill="#c8d6e2" ${OL}/><path d="M104 32Q118 18 128 26" stroke="#c8d6e2" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      },
      leche: {
        tint: TINT.dairy,
        draw: () =>
          `<path d="M64 20H96V32Q110 42 110 58V100Q110 104 106 104H54Q50 104 50 100V58Q50 42 64 32Z" fill="#fbfbf8" ${OL}/>
           <rect x="62" y="12" width="36" height="10" rx="3" fill="#3f8fc9" ${OL}/><path d="M50 66H110V88H50Z" fill="#3f8fc9" ${THIN}/>
           <path d="M66 76Q70 70 76 76Q80 82 86 76Q90 70 96 76" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M58 48V60" stroke="#dbe6ee" stroke-width="4" stroke-linecap="round"/>`,
      },
      mantequilla: {
        tint: TINT.gold,
        draw: () =>
          `<ellipse cx="80" cy="88" rx="56" ry="14" fill="#e1edf8" ${OL}/><path d="M48 62L66 48H122L104 62Z" fill="#fde9a0" ${OL}/>
           <path d="M48 62H104V86H48Z" fill="#f8d66a" ${OL}/><path d="M104 62L122 48V72L104 86Z" fill="#f0c650" ${OL}/>
           <path d="M110 40L76 66" stroke="#b9c2cc" stroke-width="6" stroke-linecap="round"/><path d="M126 30L110 40" stroke="#7a5034" stroke-width="8" stroke-linecap="round"/>`,
      },
      miel: {
        tint: TINT.gold,
        draw: () =>
          `<path d="M52 44Q46 52 48 80Q50 102 80 102Q110 102 112 80Q114 52 108 44Z" fill="#f2a516" fill-opacity=".9" ${OL}/>
           <rect x="50" y="34" width="60" height="12" rx="4" fill="#c4553a" ${OL}/><path d="M50 40H110" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 3"/>
           <rect x="62" y="62" width="36" height="22" rx="4" fill="#fbf2d0" ${THIN}/>${bee(80, 74)}
           <path d="M58 52V86" stroke="#ffe08a" stroke-width="4" stroke-linecap="round" opacity=".7"/>${bee(128, 32)}`,
      },
      manzana: {
        tint: TINT.green,
        draw: () =>
          `<path d="M80 40Q60 28 46 44Q34 62 46 84Q58 104 72 100Q80 96 88 100Q102 104 114 84Q126 62 114 44Q100 28 80 40Z" fill="#d93b3b" ${OL}/>
           <path d="M80 40Q86 30 84 22" stroke="${K}" stroke-width="3" stroke-linecap="round"/>${leaf(84, 28, -30, '#6faf45', 1)}
           <path d="M56 52Q50 62 54 74" stroke="#fff" stroke-opacity=".5" stroke-width="5" fill="none" stroke-linecap="round"/>
           <path d="M98 70Q112 64 116 52" stroke="#f2c14e" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`,
      },
      patata: {
        tint: TINT.food,
        draw: () =>
          `${[
            [60, 70, 26, 18, -10],
            [100, 78, 22, 16, 14],
            [82, 52, 18, 13, 4],
          ]
            .map(
              ([x, y, rx, ry, a]) =>
                `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#d8b07a" transform="rotate(${a} ${x} ${y})" ${OL}/><g fill="#a8814e"><circle cx="${x - 6}" cy="${y - 3}" r="1.6"/><circle cx="${x + 7}" cy="${y + 4}" r="1.6"/><circle cx="${x + 2}" cy="${y - 7}" r="1.2"/></g>`,
            )
            .join('')}`,
      },
      mosto: {
        tint: TINT.green,
        draw: () =>
          `<path d="M58 28H100V38Q114 50 112 72Q110 100 80 102Q50 100 48 72Q46 50 58 38Z" fill="#e8d4a0" ${OL}/>
           <path d="M50 64H110Q110 98 80 100Q50 98 50 64Z" fill="#d6b14a" ${THIN}/><path d="M100 40Q124 40 122 62Q120 76 108 78" stroke="${K}" stroke-width="7" fill="none" stroke-linecap="round"/>
           <path d="M100 40Q124 40 122 62Q120 76 108 78" stroke="#e8d4a0" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M58 28L50 22" ${OL}/>
           <circle cx="30" cy="96" r="7" fill="#b8d14a" ${OL}/><circle cx="134" cy="100" r="6" fill="#d93b3b" ${OL}/>`,
      },
      jamon: {
        tint: TINT.pig,
        draw: () =>
          `${rot(
            -18,
            80,
            64,
            `<path d="M30 64Q28 36 62 36Q96 38 112 56L130 60Q136 64 130 68L112 72Q96 92 62 92Q30 92 30 64Z" fill="#b8423a" ${OL}/>
             <path d="M40 64Q40 46 62 44Q80 44 94 54" stroke="#f6d2c8" stroke-width="6" fill="none" stroke-linecap="round"/>
             <path d="M130 60H146V68H130Z" fill="#f6efe2" ${OL}/><path d="M52 74Q70 80 92 72" stroke="#7a2a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
          )}`,
      },
      panceta: {
        tint: TINT.pig,
        draw: () =>
          `<path d="M30 50L122 40L132 76L40 88Z" fill="#f6d8cc" ${OL}/>
           <path d="M33 60L124 50M35 70L128 61M38 80L130 70" stroke="#d9475a" stroke-width="5"/><path d="M30 50L122 40L124 46L32 56Z" fill="#c4553a"/>`,
      },
      lacon: {
        tint: TINT.pig,
        draw: () =>
          `<path d="M36 70Q34 42 66 42Q94 44 104 60L118 64Q124 68 118 72L104 76Q92 96 66 96Q38 96 36 70Z" fill="#e08a7a" ${OL}/>
           <path d="M44 70Q44 52 66 50" stroke="#fbe0d6" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="116" y="62" width="14" height="12" rx="4" fill="#f6efe2" ${OL}/>
           <g fill="#fff" opacity=".8"><circle cx="56" cy="72" r="1.6"/><circle cx="74" cy="62" r="1.4"/><circle cx="84" cy="80" r="1.8"/><circle cx="66" cy="86" r="1.2"/></g>`,
      },
      huevo: { tint: TINT.food, draw: () => `${egg(80, 62, 2.6, '#f6e3c8')}` },
      harina: {
        tint: TINT.stone,
        draw: () =>
          `<path d="M48 30Q44 62 46 100H114Q116 62 112 30Z" fill="#fbf7ef" ${OL}/><path d="M48 30Q60 22 64 32Q80 22 96 32Q100 22 112 30" fill="#fbf7ef" ${OL}/>
           <rect x="58" y="56" width="44" height="24" rx="4" fill="#e8d4a0" ${THIN}/>${at(80, 68, 0.6, `<path d="M0 12V-14" stroke="#c99a3a" stroke-width="2.6"/><g fill="#d6b450" ${ol(1)}>${[-10, -4, 2].map((y) => `<ellipse cx="-4" cy="${y}" rx="3" ry="5" transform="rotate(-30 -4 ${y})"/><ellipse cx="4" cy="${y}" rx="3" ry="5" transform="rotate(30 4 ${y})"/>`).join('')}</g>`)}
           <path d="M30 104Q40 96 52 104T76 104" fill="#fff" ${THIN}/>`,
      },
      'pan-rallado': {
        tint: TINT.food,
        draw: (u) => {
          const r = rnd(7);
          return `<path d="M28 62H132Q130 100 80 102Q30 100 28 62Z" fill="#7fb0d6" ${OL}/><ellipse cx="80" cy="62" rx="52" ry="10" fill="#e8b45e" ${OL}/>
            <g fill="#c4853a">${Array.from({ length: 34 }, () => `<circle cx="${f(36 + r() * 88)}" cy="${f(56 + r() * 12)}" r="${f(0.9 + r() * 1.2)}"/>`).join('')}</g>
            <path d="M40 76Q48 90 66 96" stroke="#fff" stroke-opacity=".4" stroke-width="4" fill="none" stroke-linecap="round"/>`;
        },
      },
      filete: {
        tint: TINT.pig,
        draw: () =>
          `<path d="M28 68Q24 46 60 44Q104 40 128 54Q138 70 120 82Q90 96 56 90Q30 86 28 68Z" fill="#c8364a" ${OL}/>
           <path d="M36 66Q40 52 62 50" stroke="#f6d2c8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 70Q80 62 104 70M70 80Q88 76 106 80" stroke="#e86a7a" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      },
      sarten: {
        tint: TINT.stone,
        draw: () =>
          `<path d="M100 62L148 44" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M100 62L148 44" stroke="#5a4636" stroke-width="6" stroke-linecap="round"/>
           <ellipse cx="62" cy="68" rx="48" ry="20" fill="#3c3f44" ${OL}/><ellipse cx="62" cy="64" rx="40" ry="14" fill="#55595f"/>
           <ellipse cx="62" cy="64" rx="30" ry="9" fill="#e8b02e" opacity=".55"/><g fill="#fff" opacity=".8"><circle cx="48" cy="62" r="2"/><circle cx="70" cy="66" r="1.6"/><circle cx="80" cy="60" r="1.2"/></g>
           <path d="M14 70Q20 94 62 94Q104 94 110 70" fill="#2a2c30" ${OL}/>`,
      },
      bollu: {
        tint: TINT.food,
        draw: () =>
          `<ellipse cx="80" cy="72" rx="52" ry="28" fill="#d8a058" ${OL}/><path d="M40 64Q80 40 120 64" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>
           <path d="M50 74Q80 58 110 74Q80 92 50 74Z" fill="#f4e2bc" ${OL}/>${sausage('M58 74Q80 66 102 74', '#c8402e', 12, '#ffb08a')}`,
      },
      fabada: {
        tint: TINT.food,
        draw: () => {
          const beans = [
            [48, 62],
            [60, 58],
            [72, 62],
            [100, 60],
            [112, 62],
            [56, 66],
            [92, 64],
            [118, 58],
            [66, 54],
            [108, 54],
          ]
            .map(
              ([x, y], i) =>
                `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.4" fill="#fbf4e2" transform="rotate(${((i * 37) % 60) - 30} ${x} ${y})" ${ol(1)}/>`,
            )
            .join('');
          return `${pot(`<ellipse cx="80" cy="60" rx="46" ry="9" fill="#e09a4a"/>${beans}${sausage('M78 58Q86 52 94 58', '#c8402e', 8, '#ffb08a')}<ellipse cx="62" cy="58" rx="7" ry="5" fill="#2e1a1a" ${ol(1)}/>`)}${steam(80, 40)}`;
        },
      },
      casadielles: {
        tint: TINT.food,
        draw: () =>
          `<ellipse cx="80" cy="90" rx="58" ry="14" fill="#fbf7ef" ${OL}/>${[
            [56, 72, -14],
            [104, 72, 14],
            [80, 58, 0],
          ]
            .map(([x, y, a]) =>
              rot(
                a,
                x,
                y,
                `<path d="M${x - 24} ${y}Q${x - 26} ${y - 14} ${x - 8} ${y - 14}H${x + 8}Q${x + 26} ${y - 14} ${x + 24} ${y}Q${x + 26} ${y + 14} ${x + 8} ${y + 14}H${x - 8}Q${x - 26} ${y + 14} ${x - 24} ${y}Z" fill="#e0a24e" ${OL}/>
                 <path d="M${x - 18} ${y - 4}q4 -3 8 0t8 0t8 0t8 0" stroke="#b5793a" stroke-width="1.6" fill="none"/>`,
              ),
            )
            .join('')}<g fill="#fff">${[
            [60, 66],
            [70, 52],
            [92, 54],
            [100, 68],
            [82, 62],
            [110, 74],
            [50, 76],
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`)
            .join('')}</g>`,
      },
      panchon: {
        tint: TINT.food,
        draw: () => {
          const r = rnd(11);
          return `<path d="M26 60H134Q130 102 80 104Q30 102 26 60Z" fill="#c4553a" ${OL}/><path d="M36 70H124" stroke="#f2c14e" stroke-width="3" stroke-dasharray="6 6"/>
            <path d="M30 60Q40 34 80 34Q120 34 130 60Z" fill="#e2b46a" ${OL}/>
            <g fill="#b5793a">${Array.from({ length: 26 }, () => `<circle cx="${f(44 + r() * 72)}" cy="${f(40 + r() * 18)}" r="${f(1 + r() * 1.6)}"/>`).join('')}</g>
            <g fill="#fff" opacity=".9">${Array.from({ length: 14 }, () => `<rect x="${f(44 + r() * 72)}" y="${f(38 + r() * 18)}" width="2" height="2"/>`).join('')}</g>`;
        },
      },
      escanda: {
        tint: TINT.gold,
        draw: () =>
          `${loaf(54, 24, '#b9783a', `<path d="M42 66l10 -8M62 64l10 -8M82 64l10 -8M102 66l10 -8" stroke="#7a4a20" stroke-width="3" stroke-linecap="round"/>`)}
           ${at(124, 44, 0.9, `<path d="M0 30V-14" stroke="#c99a3a" stroke-width="2.6"/><g fill="#d6b450" ${ol(1)}>${[-12, -5, 2, 9].map((y) => `<ellipse cx="-4" cy="${y}" rx="3" ry="6" transform="rotate(-30 -4 ${y})"/><ellipse cx="4" cy="${y}" rx="3" ry="6" transform="rotate(30 4 ${y})"/>`).join('')}</g>`)}`,
      },

      // ---- embutidos: six different shapes ----
      chorizo: {
        tint: TINT.pig,
        draw: () =>
          `${sausage('M24 46Q30 82 52 84Q66 82 62 60', '#c8402e', 16, '#ffb08a')}${sausage('M70 60Q66 86 90 86Q112 84 110 52', '#c8402e', 16, '#ffb08a')}
           ${sausage('M118 52Q124 80 138 88', '#b8382a', 14, '#ffb08a')}${tie(62, 60)}${tie(110, 52)}${tie(24, 46)}
           <g fill="#fff" opacity=".7"><circle cx="36" cy="70" r="1.4"/><circle cx="86" cy="78" r="1.6"/><circle cx="98" cy="70" r="1.2"/><circle cx="48" cy="78" r="1.2"/></g>`,
      },
      morcilla: {
        tint: TINT.stone,
        draw: () =>
          `${sausage('M30 70Q40 34 80 34Q120 34 130 70', '#3a1e22', 20, '#8a4a50')}${tie(30, 70)}${tie(130, 70)}
           <g fill="#c8a07a" opacity=".8"><circle cx="60" cy="42" r="1.6"/><circle cx="96" cy="40" r="1.4"/><circle cx="78" cy="36" r="1.2"/></g>`,
      },
      moscancia: {
        tint: TINT.food,
        draw: () =>
          `${pot(`<ellipse cx="80" cy="60" rx="46" ry="9" fill="#e09a4a"/>`, '#7a5a46')}${sausage('M46 58Q50 28 80 26Q110 28 114 58', '#2e1a1e', 14, '#7a3a40')}
           ${tie(80, 26)}${steam(80, 22)}`,
      },
      pantruque: {
        tint: TINT.gold,
        draw: () =>
          `${rot(
            -8,
            80,
            64,
            `<rect x="30" y="44" width="100" height="38" rx="19" fill="#e2a24a" ${OL}/><path d="M40 52Q80 44 120 52" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none" stroke-linecap="round"/>
             <g fill="#c4762a">${[
               [50, 66],
               [64, 60],
               [80, 70],
               [96, 62],
               [110, 70],
               [72, 76],
             ]
               .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`)
               .join('')}</g><g fill="#5e9e3a">${[
               [58, 72],
               [88, 56],
               [104, 76],
             ]
               .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`)
               .join('')}</g>
             <path d="M30 63h-6M130 63h6" stroke="#e8dcc2" stroke-width="3" stroke-linecap="round"/>`,
          )}`,
      },
      sabadiego: {
        tint: TINT.pig,
        draw: () =>
          `${sausage('M30 92Q20 40 64 34Q112 30 120 60Q124 84 96 86Q70 86 72 64Q74 50 92 52', '#a8302a', 8, '#f08a6a')}${tie(30, 92)}${tie(92, 52)}`,
      },
      chosco: {
        tint: TINT.pig,
        draw: () =>
          `<ellipse cx="80" cy="66" rx="40" ry="34" fill="#b8382a" ${OL}/><path d="M52 52Q62 38 80 36" stroke="#ffb08a" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
           <g stroke="#e8dcc2" stroke-width="2.2" fill="none"><path d="M42 58Q80 70 118 58M42 76Q80 88 118 76M64 34Q58 66 64 98M96 34Q102 66 96 98"/></g>
           ${tie(80, 32)}<g fill="#fff" opacity=".6"><circle cx="70" cy="72" r="1.6"/><circle cx="92" cy="54" r="1.4"/><circle cx="104" cy="86" r="1.6"/></g>`,
      },

      // ---- fiestas ----
      hoguera: {
        draw: (u) =>
          `${night(u)}<path d="M0 98Q80 88 160 98V120H0Z" fill="#2e4a2e"/>
           <defs><radialGradient id="${u}gl" cx=".5" cy=".7" r=".5"><stop offset="0" stop-color="#ffb43a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient></defs>
           <circle cx="80" cy="74" r="56" fill="url(#${u}gl)"/>
           <path class="ca-flame" d="M80 18Q98 44 106 60Q114 82 96 98H64Q46 82 54 60Q60 46 70 40Q72 52 78 54Q74 36 80 18Z" fill="#ff7a2a" ${OL}/>
           <path class="ca-flame" d="M80 46Q92 62 94 74Q96 90 84 96H76Q64 90 66 76Q68 66 74 62Q76 70 80 70Q78 58 80 46Z" fill="#ffd23f"/>
           <path d="M40 104L116 90M44 90L120 104" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M40 104L116 90M44 90L120 104" stroke="#8a5226" stroke-width="6" stroke-linecap="round"/>
           ${sparkle(46, 34, 4, '#ffd23f')}${sparkle(118, 28, 3, '#ffd23f')}${sparkle(128, 52, 2.6, '#ffb43a')}`,
      },
      xana: {
        draw: (u) =>
          `${night(u)}<circle cx="132" cy="22" r="11" fill="#fff6c8"/><circle cx="137" cy="19" r="9" fill="#2a3668"/>
           <path d="M0 100Q80 92 160 100V120H0Z" fill="#2e4a3e"/>
           <path d="M14 104V70Q14 62 22 62H50Q58 62 58 70V104Z" fill="#9aa4ae" ${OL}/><path d="M22 62V54H50V62" fill="#b9c2cc" ${OL}/><path d="M30 82h12" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
           <path d="M36 84Q38 96 34 106" stroke="#8fd6f6" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="36" cy="108" rx="16" ry="4" fill="#5fb3dd"/>
           ${at(
             96,
             60,
             1.15,
             `<path d="M-14 -4Q-26 30 -30 46H30Q26 30 14 -4Z" fill="#f2c94c" ${OL}/>
              <path d="M-16 46Q-14 22 -8 14H8Q14 22 16 46Z" fill="#7fd0c8" ${OL}/><path d="M-12 40Q0 44 12 40" stroke="#fff" stroke-width="1.6" fill="none"/>
              ${face(`<path d="M-14 -1Q-16 -17 0 -17Q16 -17 14 -1Q10 -12 0 -12Q-10 -12 -14 -1Z" fill="#f2c94c"/>`, '#f8dcc4')}
              <path d="M20 -2L30 -12" stroke="#d9dde2" stroke-width="5" stroke-linecap="round"/><path d="M22 -4l4 4M25 -7l4 4M28 -10l4 4" stroke="#9aa4ae" stroke-width="1.4"/>`,
           )}${sparkle(70, 30, 3.4)}${sparkle(122, 70, 3)}${sparkle(64, 88, 2.4)}`,
      },
      cuelebre: {
        draw: (u) =>
          `${meadow(u, '#a9cf86', '#86bb5c')}<path d="M44 66Q30 30 60 32Q54 46 66 56Z" fill="#9fd06a" ${OL}/><path d="M60 60Q66 24 96 30Q82 44 86 58Z" fill="#b8e07a" ${OL}/>
           <path d="M20 96Q30 70 58 80Q84 90 96 70Q106 54 122 56" stroke="${K}" stroke-width="22" fill="none" stroke-linecap="round"/>
           <path d="M20 96Q30 70 58 80Q84 90 96 70Q106 54 122 56" stroke="#4f9a4a" stroke-width="17.6" fill="none" stroke-linecap="round"/>
           <path d="M24 92Q34 76 58 84Q84 94 98 74" stroke="#d8ea8a" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="6 5"/>
           <path d="M14 98l-10 6 12 0Z" fill="#4f9a4a" ${THIN}/>
           <path d="M114 46Q122 34 138 40Q150 46 146 58Q140 68 124 66Q112 62 114 46Z" fill="#4f9a4a" ${OL}/>
           <path d="M120 40l-4 -10 8 6M132 38l2 -10 4 10" fill="#f2c14e" ${THIN}/><circle cx="134" cy="48" r="3" fill="#fff" ${ol(1)}/><circle cx="135" cy="48" r="1.5" fill="${K}"/>
           <path d="M134 60Q140 62 146 58" stroke="${K}" stroke-width="1.6" fill="none"/><circle cx="141" cy="54" r="1" fill="${K}"/><path d="M146 58q6 2 8 -2" stroke="#d9473b" stroke-width="1.6" fill="none"/>`,
      },
      'danza-prima': {
        draw: (u) => {
          const n = 7;
          const people = Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 + 0.2;
            return {
              x: 80 + Math.cos(a) * 48,
              y: 74 + Math.sin(a) * 18,
              back: Math.sin(a) < 0,
              c: ['#c8413a', '#2f6fb0', '#f2b134', '#5f9a3a'][i % 4],
            };
          }).sort((p, q) => p.y - q.y);
          const hands = Array.from({ length: n }, (_, i) => {
            const a1 = (i / n) * Math.PI * 2 + 0.2;
            const a2 = ((i + 1) / n) * Math.PI * 2 + 0.2;
            return `M${f(80 + Math.cos(a1) * 48)} ${f(74 + Math.sin(a1) * 18 - 18)}Q${f(80 + Math.cos((a1 + a2) / 2) * 50)} ${f(74 + Math.sin((a1 + a2) / 2) * 19 - 32)} ${f(80 + Math.cos(a2) * 48)} ${f(74 + Math.sin(a2) * 18 - 18)}`;
          }).join('');
          const body = (/** @type {{ x: number, y: number, back: boolean, c: string }} */ p) =>
            `<g transform="translate(${f(p.x)} ${f(p.y)}) scale(${f(0.8 + (p.y - 56) / 90)})"><path d="M-7 10L-5 -10H5L7 10Z" fill="${p.c}" ${THIN}/><path d="M-4 10v8M4 10v8" stroke="${K}" stroke-width="2.4" stroke-linecap="round"/>
              <circle cy="-16" r="6" fill="${p.back ? '#5a3420' : '#f4c9a3'}" ${THIN}/></g>`;
          return `${night(u)}<path d="M0 96Q80 86 160 96V120H0Z" fill="#2e4a2e"/>${at(80, 30, 0.42, '<path d="M-20 60Q0 0 20 60Z" fill="#ff7a2a"/><path d="M-10 60Q0 26 10 60Z" fill="#ffd23f"/>')}
            ${people
              .filter((p) => p.back)
              .map(body)
              .join('')}<path d="${hands}" stroke="#f4c9a3" stroke-width="2.6" fill="none" stroke-linecap="round"/>${people
              .filter((p) => !p.back)
              .map(body)
              .join('')}`;
        },
      },
      sauco: {
        tint: TINT.green,
        draw: () => {
          const r = rnd(5);
          const cluster = (/** @type {number} */ x, /** @type {number} */ y) =>
            `<g>${Array.from({ length: 18 }, () => {
              const a = r() * Math.PI * 2;
              const d = Math.sqrt(r()) * 18;
              return `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d * 0.6)}" r="3.2" fill="#fffbea" ${ol(0.9)}/>`;
            }).join('')}</g>`;
          return `<path d="M80 108V64M80 80L52 54M80 72L110 48" stroke="#6a8a3a" stroke-width="3" fill="none" stroke-linecap="round"/>
            ${leaf(80, 92, -160, '#5e9e3a', 1.2)}${leaf(80, 92, -20, '#5e9e3a', 1.2)}${cluster(52, 46)}${cluster(110, 40)}${cluster(80, 56)}`;
        },
      },
      trebol: {
        tint: TINT.green,
        draw: () =>
          `<path d="M80 70Q84 92 96 108" stroke="#4f8f3a" stroke-width="4" fill="none" stroke-linecap="round"/>
           ${[0, 120, 240]
             .map(
               (a) =>
                 `<g transform="translate(80 62) rotate(${a})"><path d="M0 0Q-26 -14 -16 -32Q-6 -42 0 -28Q6 -42 16 -32Q26 -14 0 0Z" fill="#5fae45" ${OL}/><path d="M0 -4V-24" stroke="#9fd06a" stroke-width="2"/></g>`,
             )
             .join('')}${sparkle(126, 30, 6, '#ffd25a')}`,
      },
      verbena: {
        tint: TINT.lilac,
        draw: () =>
          `${[
            [54, 104, -10],
            [80, 106, 0],
            [106, 104, 12],
          ]
            .map(([x, y, a]) =>
              rot(
                a,
                x,
                y,
                `<path d="M${x} ${y}V${y - 66}" stroke="#5e9e3a" stroke-width="2.6"/>${leaf(x, y - 20, -150, '#6faf45', 0.8)}${leaf(x, y - 28, -30, '#6faf45', 0.8)}
                 ${[0, 1, 2, 3, 4].map((k) => `<circle cx="${x + (k % 2 ? 4 : -4)}" cy="${y - 52 - k * 6}" r="4.4" fill="${k % 2 ? '#9a5ad0' : '#b47ae0'}" ${ol(1)}/>`).join('')}`,
              ),
            )
            .join('')}`,
      },
      fuente: {
        draw: (u) =>
          `${meadow(u)}<path d="M36 104V54Q36 44 46 44H114Q124 44 124 54V104Z" fill="#b9b2a4" ${OL}/>
           <path d="M44 60h18M76 52h22M92 70h22M48 86h14M100 92h14" stroke="#9a907f" stroke-width="2"/><path d="M60 44Q80 20 100 44Z" fill="#b9b2a4" ${OL}/>
           <path d="M76 70h8" stroke="${K}" stroke-width="4" stroke-linecap="round"/><path d="M80 72Q82 88 78 100" stroke="#8fd6f6" stroke-width="4" fill="none" stroke-linecap="round"/>
           <ellipse cx="80" cy="104" rx="26" ry="5" fill="#5fb3dd" ${THIN}/>
           ${branch(36, 54, -50, '#5e9e3a')}${branch(124, 54, 230, '#5e9e3a')}${branch(60, 36, -20, '#6faf45')}${branch(100, 36, 200, '#6faf45')}
           ${flowerHead(44, 40, 3.4, '#fffbea')}${flowerHead(116, 40, 3.4, '#fffbea')}${flowerHead(80, 24, 3, '#b47ae0', '#fff')}${flowerHead(30, 70, 2.8, '#fffbea')}${flowerHead(130, 70, 2.8, '#b47ae0', '#fff')}`,
      },
      mascara: {
        tint: TINT.lilac,
        draw: () =>
          `<path d="M24 50Q24 30 52 32Q72 34 80 44Q88 34 108 32Q136 30 136 50Q136 82 108 84Q90 84 80 70Q70 84 52 84Q24 82 24 50Z" fill="#e2558a" ${OL}/>
           <path d="M80 44V70" stroke="#ffd25a" stroke-width="3"/><path d="M24 50Q52 42 80 56Q108 42 136 50" stroke="#ffd25a" stroke-width="3" fill="none"/>
           <ellipse cx="52" cy="58" rx="12" ry="8" fill="${K}"/><ellipse cx="108" cy="58" rx="12" ry="8" fill="${K}"/>
           <path d="M30 38Q20 14 36 8Q36 24 44 32M120 32Q130 14 124 4Q140 14 132 38" fill="#3f8fc9" ${OL}/><path d="M60 32Q58 10 72 6Q66 22 72 34" fill="#f2b134" ${OL}/>
           <path d="M136 56L150 92" stroke="#7a5034" stroke-width="4" stroke-linecap="round"/>${sparkle(38, 96, 4, '#f2b134')}${sparkle(118, 100, 3.4, '#3f8fc9')}`,
      },
      fuegos: {
        draw: (u) => {
          const burst = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, /** @type {string} */ c) =>
            `<g transform="translate(${x} ${y})" stroke="${c}" stroke-width="2.4" stroke-linecap="round">${Array.from(
              { length: 12 },
              (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return `<path d="M${f(Math.cos(a) * r * 0.35)} ${f(Math.sin(a) * r * 0.35)}L${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}"/>`;
              },
            ).join('')}</g><circle cx="${x}" cy="${y}" r="3" fill="${c}"/>`;
          return `${night(u)}${burst(48, 40, 26, '#ffd23f')}${burst(112, 32, 22, '#f2648a')}${burst(92, 70, 16, '#7fd0f0')}
            <path d="M0 102Q40 94 80 100T160 98V120H0Z" fill="#26304a"/><path d="M20 104V90H34V104M120 104V86H140V104" fill="#3a4466"/>`;
        },
      },
      carroza: {
        draw: (u) =>
          `${meadow(u)}<path d="M24 86H136V70Q136 62 128 62H32Q24 62 24 70Z" fill="#2f6fb0" ${OL}/><path d="M24 74H136" stroke="#f2c14e" stroke-width="4"/>
           ${at(80, 64, 0.4, `<g transform="translate(-80 -104)">${granary(112, 4)}</g>`)}
           ${[34, 52, 108, 126].map((x, i) => flowerHead(x, 64, 4, i % 2 ? '#e2558a' : '#ffd25a', '#fff')).join('')}
           ${[46, 114].map((x) => `<circle cx="${x}" cy="92" r="11" fill="#7a5034" ${OL}/><circle cx="${x}" cy="92" r="4" fill="#c08a52" ${THIN}/><path d="M${x - 9} 92H${x + 9}M${x} 83V101" stroke="#c08a52" stroke-width="1.6"/>`).join('')}
           <path d="M136 72L152 66" ${OL}/>`,
      },
      colmena: {
        tint: TINT.gold,
        draw: () =>
          `<path d="M80 22Q118 22 120 64Q122 98 116 100H44Q38 98 40 64Q42 22 80 22Z" fill="#f2c14e" ${OL}/>
           <path d="M46 40Q80 34 114 40M42 54Q80 48 118 54M41 68Q80 62 119 68M42 82Q80 76 118 82" stroke="#c99a1c" stroke-width="2.6" fill="none"/>
           <path d="M70 100V88Q80 80 90 88V100Z" fill="#6a4a2c" ${THIN}/>${bee(30, 40)}${bee(134, 56)}${bee(118, 18)}
           <path d="M30 40q14 -14 26 -6M134 56q-6 -16 -18 -14" stroke="${K}" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/>${sparkle(56, 30, 4)}`,
      },
      espiga: {
        tint: TINT.gold,
        draw: () =>
          `${[
            [70, -12],
            [90, 10],
          ]
            .map(([x, a]) =>
              rot(
                a,
                x,
                100,
                `<path d="M${x} 104V40" stroke="#c99a3a" stroke-width="3"/><g fill="#e8be4a" ${ol(1.2)}>${[0, 1, 2, 3, 4, 5]
                  .map(
                    (k) =>
                      `<ellipse cx="${x - 6}" cy="${44 + k * 9}" rx="4.4" ry="8" transform="rotate(-28 ${x - 6} ${44 + k * 9})"/><ellipse cx="${x + 6}" cy="${44 + k * 9}" rx="4.4" ry="8" transform="rotate(28 ${x + 6} ${44 + k * 9})"/>`,
                  )
                  .join('')}<ellipse cx="${x}" cy="34" rx="4" ry="8"/></g><path d="M${x} 26V10" stroke="#c99a3a" stroke-width="1.4"/>`,
              ),
            )
            .join('')}${sparkle(124, 30, 6, '#fff')}`,
      },
      gaita: {
        tint: TINT.dairy,
        draw: () =>
          `<path d="M60 52L22 22" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M60 52L22 22" stroke="#7a4a26" stroke-width="5" stroke-linecap="round"/>
           <path d="M96 50L136 8" stroke="${K}" stroke-width="10" stroke-linecap="round"/><path d="M96 50L136 8" stroke="#a8652e" stroke-width="6" stroke-linecap="round"/>
           <path d="M126 18l8 -8M118 28l3 -3" stroke="#f2e6c8" stroke-width="4" stroke-linecap="round"/>
           <path d="M50 66Q44 40 78 38Q112 38 114 60Q116 86 84 90Q56 92 50 66Z" fill="#2f6fb0" ${OL}/><path d="M56 70Q60 50 80 46" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/>
           <path d="M54 62Q82 70 112 58" stroke="#f2c14e" stroke-width="3" fill="none"/>
           <path d="M74 88L66 114" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M74 88L66 114" stroke="#7a4a26" stroke-width="5" stroke-linecap="round"/>
           <g fill="${K}"><circle cx="72" cy="96" r="1.4"/><circle cx="70.4" cy="102" r="1.4"/><circle cx="68.8" cy="108" r="1.4"/></g>`,
      },

      // ---- games ----
      cascayu: {
        draw: () => {
          const S = 20;
          const cells = [
            [70, 98, 1],
            [70, 78, 2],
            [70, 58, 3],
            [60, 38, 4],
            [80, 38, 5],
            [70, 18, 6],
          ];
          const side = [
            [104, 98, 7],
            [124, 98, 8],
            [114, 78, 9],
          ];
          const sq = (/** @type {number[]} */ [x, y]) => `<rect x="${x - S / 2}" y="${y - S / 2}" width="${S}" height="${S}" fill="none"/>`;
          return `<rect width="160" height="120" rx="16" fill="#9a958c"/><g fill="#a8a39a">${[
            [20, 20],
            [140, 40],
            [30, 90],
            [146, 108],
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`)
            .join('')}</g>
            <g stroke="#fbfbf4" stroke-width="2.4" stroke-linejoin="round" opacity=".95">${[...cells, ...side].map(sq).join('')}</g>
            ${chalkNums(
              [...cells, ...side].map(([x, y, n]) => [x, y + 5, n]),
              'ca-chalk ca-chalk-s',
            )}
            ${at(30, 52, 1, `<ellipse rx="10" ry="6" fill="#8a8478" ${OL}/>`)}${at(28, 26, 1, `<rect x="-10" y="-3" width="20" height="6" rx="3" fill="#f2a6c8" ${THIN}/>`)}`;
        },
      },
      tiza: {
        tint: TINT.stone,
        draw: () =>
          `${[
            ['#fbfbf4', -20, 60],
            ['#f2a6c8', 10, 70],
            ['#9fd0f0', -6, 84],
            ['#ffe08a', 24, 52],
          ]
            .map(([c, a, y]) =>
              rot(Number(a), 80, Number(y), `<rect x="50" y="${Number(y) - 7}" width="60" height="14" rx="7" fill="${c}" ${OL}/>`),
            )
            .join('')}
           <path d="M22 104q12 -8 24 0t24 0" stroke="#fbfbf4" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      },
      piedra: {
        tint: TINT.stone,
        draw: () =>
          `<path d="M32 76Q28 56 58 50Q98 42 122 56Q138 68 124 82Q100 96 62 94Q34 92 32 76Z" fill="#9a938a" ${OL}/>
           <path d="M44 70Q52 58 76 56" stroke="#fff" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>
           <g fill="#7a746c"><circle cx="90" cy="76" r="2"/><circle cx="104" cy="66" r="1.6"/><circle cx="70" cy="82" r="1.4"/></g>`,
      },
      gatu: {
        tint: TINT.food,
        draw: () =>
          `<path d="M118 60Q140 52 140 30Q140 22 134 24" stroke="${K}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M118 60Q140 52 140 30Q140 22 134 24" stroke="#e8933a" stroke-width="4.6" fill="none" stroke-linecap="round"/>
           <path d="M44 70Q44 46 80 46Q116 46 118 70Q118 86 104 86H58Q44 86 44 70Z" fill="#e8933a" ${OL}/>
           <path d="M66 52v30M84 50v34M100 52v30" stroke="#c46a1e" stroke-width="3.4" stroke-linecap="round"/>
           ${[
             [52, 0],
             [70, 1],
             [94, 2],
             [110, 3],
           ]
             .map(
               ([x, i]) =>
                 `<path d="M${x - 5} 84V96" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M${x - 5} 84V96" stroke="#e8933a" stroke-width="3.6" stroke-linecap="round"/>
                  <path d="M${x - 14} 96Q${x - 6} 92 ${x + 4} 96L${x + 2} 104L${x - 2} 100L${x - 6} 106L${x - 10} 100L${x - 14} 104Z" fill="${['#7fbbe6', '#f2a6a0', '#b8d14a', '#c8b3e6'][i]}" ${THIN}/>`,
             )
             .join('')}
           <g transform="translate(46 46)"><path d="M-22 -6L-26 -26L-10 -18ZM-2 -20L6 -36L12 -16Z" fill="#e8933a" ${OL}/><circle cx="-6" cy="-4" r="17" fill="#e8933a" ${OL}/>
             <path d="M-18 -10Q-6 -18 6 -10" stroke="#c46a1e" stroke-width="3" fill="none" stroke-linecap="round"/>
             <path d="M-14 4Q-6 12 2 4" stroke="${K}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="-12" cy="-4" r="2.2" fill="${K}"/><circle cx="0" cy="-4" r="2.2" fill="${K}"/>
             <path d="M-6 0l-2 3h4z" fill="#d9475a"/><path d="M-22 2h-12M-22 6l-10 4M10 2h12M10 6l10 4" stroke="${K}" stroke-width="1.1"/></g>
           <path d="M14 20q6 -4 12 0M134 98l6 -4M140 106l6 0" stroke="${K}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".5"/>`,
      },
      perico: {
        draw: (u) =>
          `${meadow(u)}<g stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"><path d="M6 30q20 -6 40 0t40 0"/><path d="M14 52q16 -5 32 0t32 0"/><path d="M4 74q18 -5 36 0"/></g>
           ${leaf(30, 40, 20, '#c99a3a', 0.8)}${leaf(52, 64, -30, '#e08a3a', 0.7)}${leaf(18, 62, 60, '#6faf45', 0.6)}
           ${rot(
             24,
             100,
             60,
             `<path d="M90 70L92 44H112L116 70Z" fill="#5f8a3a" ${OL}/><path d="M94 70l-6 22M112 70l8 20" stroke="#5a3a22" stroke-width="5" stroke-linecap="round"/>
              <path d="M92 50L72 40M112 50L132 36" stroke="#5f8a3a" stroke-width="6" stroke-linecap="round"/><circle cx="70" cy="39" r="4" fill="#f4c9a3" ${THIN}/><circle cx="134" cy="35" r="4" fill="#f4c9a3" ${THIN}/>
              <path d="M96 52L114 64" stroke="#8a5226" stroke-width="3"/><rect x="108" y="58" width="14" height="12" rx="3" fill="#a8652e" ${THIN}/>
              ${at(102, 30, 1, face('<path d="M-14 -2Q-14 -14 0 -14Q14 -14 14 -2Z" fill="#7a4a26"/>', '#f4c9a3', false))}<ellipse cx="102" cy="40" rx="3" ry="3.4" fill="${K}"/>`,
           )}
           ${rot(-30, 46, 18, `<path d="M30 24Q46 4 62 24Z" fill="#5f8a3a" ${OL}/><rect x="26" y="22" width="40" height="5" rx="2.5" fill="#4a6a2a" ${THIN}/><path d="M58 18q10 -12 18 -10" stroke="#c8413a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`)}`,
      },
    };

    // ---------------- Feed targets (240 × 200): animated parts .ca-head / .ca-shake, the pile area is placed by index.html ----------------
    /** @type {Record<string, (u: string) => string>} */
    const TARGETS = {
      gochu: (u) =>
        `<rect width="240" height="200" rx="22" fill="#e6f1d6"/><path d="M0 150Q120 136 240 150V200H0Z" fill="#b7d68a"/>
         <g class="ca-shake"><g transform="translate(-6 34)">${pig(u)}</g>
         <g class="ca-head"><g transform="translate(-6 34)"><path d="M104 46Q108 32 124 34Q138 38 138 54Q138 70 122 72Q108 72 104 60Z" fill="#f4b9bd" ${OL}/>
           <ellipse cx="139" cy="58" rx="8" ry="9" fill="#ef9aa3" ${OL}/><ellipse cx="137" cy="56" rx="1.4" ry="2.2" fill="${K}"/><ellipse cx="141" cy="60" rx="1.4" ry="2.2" fill="${K}"/>
           <circle cx="122" cy="50" r="2.4" fill="${K}"/><circle cx="122.8" cy="49.2" r=".8" fill="#fff"/>
           <path d="M108 38Q116 22 130 30Q128 44 118 50Q110 48 108 38Z" fill="#2e2626" ${OL}/>
           <path class="ca-mouth" d="M122 66Q128 70 134 66" stroke="${K}" stroke-width="1.8" fill="none" stroke-linecap="round"/></g></g></g>
         <path d="M118 146H226L214 186H130Z" fill="#9a6a3a" ${OL}/><path d="M124 160H220" stroke="#7a4a26" stroke-width="2"/><rect x="112" y="140" width="120" height="10" rx="4" fill="#b77a3e" ${OL}/>`,
      vaca: (u) =>
        `<rect width="240" height="200" rx="22" fill="#e6f1d6"/><path d="M0 150Q120 136 240 150V200H0Z" fill="#b7d68a"/>
         <g class="ca-shake"><g transform="translate(-26 46)">${cow(u, { body: '#8e3b1c', head: '#7a3216', muzzle: '#e8c9a8', horns: 'short', s: 1, belly: '#b4552a' })}</g>
         <g class="ca-head"><g transform="translate(-26 46)"><g transform="translate(80 104) translate(-80 -104)">
           <path d="M120 34Q114 30 112 24M134 34Q140 30 142 24" stroke="#f3ead6" stroke-width="4.6" fill="none" stroke-linecap="round"/>
           <path d="M112 40Q114 30 127 30Q140 30 142 40L146 60Q146 72 134 72H124Q112 72 112 60Z" fill="#7a3216" ${OL}/>
           <path d="M112 38Q100 34 102 44Q106 46 112 44Z" fill="#7a3216" ${THIN}/><path d="M142 38Q154 34 152 44Q148 46 142 44Z" fill="#7a3216" ${THIN}/>
           <ellipse cx="129" cy="63" rx="13" ry="9" fill="#e8c9a8" ${OL}/><circle cx="124" cy="63" r="1.8" fill="${K}"/><circle cx="134" cy="63" r="1.8" fill="${K}"/>
           <circle cx="121" cy="46" r="2.2" fill="${K}"/><circle cx="137" cy="46" r="2.2" fill="${K}"/></g></g></g></g>
         <path d="M150 112H232V150H150Z" fill="#a8652e" ${OL}/><g stroke="#7a4520" stroke-width="2">${[160, 172, 184, 196, 208, 220].map((x) => `<path d="M${x} 112V150"/>`).join('')}</g>
         <path d="M146 112Q190 92 236 112Z" fill="#e8d07a" ${OL}/><path d="M156 108l6 -6M176 104l2 -8M196 102l-2 -8M216 106l-6 -6" stroke="#c9a53a" stroke-width="1.6"/>`,
      cesta: (u) =>
        `<rect width="240" height="200" rx="22" fill="#fbecd2"/><circle cx="120" cy="96" r="80" fill="#fff" opacity=".5"/><ellipse cx="120" cy="184" rx="80" ry="8" fill="#3a2a20" opacity=".1"/>
         <g class="ca-shake" transform="translate(-12 22) scale(1.65)">${basket(u, '')}</g>`,
      fardo: () =>
        `<rect width="240" height="200" rx="22" fill="#e2efcf"/><path d="M0 160Q120 150 240 160V200H0Z" fill="#b7d68a"/>
         <path d="M10 66L230 40" stroke="${K}" stroke-width="9" stroke-linecap="round"/><path d="M10 66L230 40" stroke="#a8652e" stroke-width="5" stroke-linecap="round"/>
         <g class="ca-shake"><path d="M40 112Q30 176 120 180Q210 176 200 112Q196 92 120 92Q44 92 40 112Z" fill="#d9e8f6" ${OL}/>
         <g fill="#3f8fc9" opacity=".55">${[
           [70, 130],
           [110, 150],
           [150, 128],
           [90, 168],
           [170, 160],
           [130, 112],
         ]
           .map(([x, y]) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" rx="2" transform="rotate(45 ${x} ${y})"/>`)
           .join('')}</g>
         <path d="M70 98Q90 62 120 58M170 98Q150 62 120 58" stroke="#d9e8f6" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M70 98Q90 62 120 58M170 98Q150 62 120 58" stroke="${K}" stroke-width="1.6" fill="none" opacity=".6"/>
         <circle cx="120" cy="58" r="9" fill="#c8413a" ${OL}/></g>`,
      bolsa: () =>
        `<rect width="240" height="200" rx="22" fill="#f6e6f0"/><circle cx="120" cy="100" r="80" fill="#fff" opacity=".5"/><ellipse cx="120" cy="186" rx="76" ry="8" fill="#3a2a20" opacity=".1"/>
         <g class="ca-shake" transform="translate(-36 6) scale(1.95)">${bag('#7a3a8a', '#f2c14e')}</g>`,
      tripa: () =>
        `<rect width="240" height="200" rx="22" fill="#fbe1e1"/><path d="M0 150H240V200H0Z" fill="#c9a27a"/><path d="M0 150H240" stroke="${K}" stroke-width="2" opacity=".3"/>
         <path d="M36 20H110L86 70H60Z" fill="#c9d3dc" ${OL}/><path d="M44 28H102" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
         <rect x="66" y="70" width="14" height="22" fill="#b9c2cc" ${OL}/>
         <g class="ca-shake"><path d="M73 92Q72 140 120 142Q180 144 196 110Q206 86 186 80" stroke="${K}" stroke-width="34" fill="none" stroke-linecap="round"/>
         <path d="M73 92Q72 140 120 142Q180 144 196 110Q206 86 186 80" stroke="#f3c4b4" stroke-width="29.6" fill="none" stroke-linecap="round"/>
         <path class="ca-fill" d="M73 92Q72 140 120 142Q180 144 196 110Q206 86 186 80" stroke="#c8402e" stroke-width="22" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
         <path d="M186 80l8 -10M186 80l-6 -10" stroke="#e8dcc2" stroke-width="3" stroke-linecap="round"/></g>`,
    };

    const art = (/** @type {string} */ key) => {
      if (!key) return null;
      if (key.startsWith('t-')) {
        const t = TARGETS[key.slice(2)];
        return t ? svgEl('0 0 240 200', t(uid()), `art-svg ca-target ca-target-${key.slice(2)}`) : null;
      }
      const a = ART[key];
      if (!a) return null;
      const u = uid();
      return svgEl('0 0 160 120', `${a.tint ? tile(a.tint) : ''}${a.draw(u)}`, 'art-svg ca-art');
    };

    // ---------------- The cachopo (cook task): 260 × 200, layers switched on by the renderer ----------------
    // .ca-ly[data-ly] = filete | jamon | queso | filete2 | harina | huevo | pan-rallado; .ca-pan = the pan (sarten); .is-fried on the svg = golden.
    const dish = (/** @type {string} */ name) => {
      if (name !== 'cachopo') return null;
      const slab = (/** @type {number} */ y, /** @type {number} */ h, /** @type {string} */ c, extra = '') =>
        `<path d="M44 ${y}Q40 ${y - h} 80 ${y - h - 2}H180Q220 ${y - h} 216 ${y}Q220 ${y + h} 180 ${y + h + 2}H80Q40 ${y + h} 44 ${y}Z" fill="${c}" ${OL}/>${extra}`;
      const inner = `<rect width="260" height="200" rx="22" fill="#fbecd2"/><circle cx="130" cy="96" r="88" fill="#fff" opacity=".5"/>
        <g class="ca-pan"><path d="M224 126L256 108" stroke="${K}" stroke-width="14" stroke-linecap="round"/><path d="M224 126L256 108" stroke="#5a4636" stroke-width="9" stroke-linecap="round"/>
          <path d="M20 128Q24 172 130 172Q236 172 240 128Z" fill="#2a2c30" ${OL}/><ellipse cx="130" cy="128" rx="110" ry="22" fill="#3c3f44" ${OL}/><ellipse cx="130" cy="126" rx="98" ry="16" fill="#e8b02e" opacity=".55"/>
          <g class="ca-oil" fill="#fff">${[
            [60, 122],
            [92, 130],
            [176, 124],
            [204, 130],
            [150, 134],
          ]
            .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4"/>`)
            .join('')}</g></g>
        <ellipse class="ca-plate" cx="130" cy="150" rx="112" ry="24" fill="#fbfbf8" ${OL}/><ellipse class="ca-plate" cx="130" cy="148" rx="86" ry="14" fill="#eef1f4"/>
        <path class="ca-ghost" d="M44 140Q40 131 80 129H180Q220 131 216 140Q220 149 180 151H80Q40 149 44 140Z" fill="none" stroke="#c8364a" stroke-width="2.6" stroke-dasharray="7 6" stroke-linecap="round"/>
        <g class="ca-stack">
          <g class="ca-ly" data-ly="filete">${slab(140, 9, '#c8364a', `<path d="M70 138Q130 130 196 138" stroke="#e86a7a" stroke-width="2.4" fill="none"/>`)}</g>
          <g class="ca-ly" data-ly="jamon"><path d="M56 128Q60 118 96 120Q130 112 170 120Q206 118 206 128Q200 136 170 134Q130 140 96 134Q60 138 56 128Z" fill="#ef8f9a" ${OL}/><path d="M80 126Q130 120 184 126" stroke="#fbd0d4" stroke-width="3" fill="none"/></g>
          <g class="ca-ly" data-ly="queso"><path d="M64 122L196 116L190 128L70 132Z" fill="#fbd65a" ${OL}/><g fill="#f2b42a"><circle cx="100" cy="124" r="2.6"/><circle cx="150" cy="122" r="2"/><circle cx="174" cy="121" r="2.4"/></g></g>
          <g class="ca-ly" data-ly="filete2">${slab(112, 9, '#c8364a', `<path d="M70 110Q130 102 196 110" stroke="#e86a7a" stroke-width="2.4" fill="none"/>`)}</g>
          <g class="ca-coat" data-ly="harina"><path d="M42 126Q36 96 80 94H180Q224 96 218 126Q222 152 180 154H80Q36 152 42 126Z" fill="#fbf7ef" opacity=".92" ${OL}/></g>
          <g class="ca-coat" data-ly="huevo"><path d="M40 126Q34 92 80 90H180Q226 92 220 126Q224 156 180 158H80Q34 156 40 126Z" fill="#f6cf3a" opacity=".85" ${OL}/><path d="M70 100Q130 92 190 100" stroke="#fff6c8" stroke-width="4" fill="none" stroke-linecap="round"/></g>
          <g class="ca-coat" data-ly="pan-rallado"><path class="ca-crumb" d="M38 126Q32 88 80 86H180Q228 88 222 126Q226 160 180 162H80Q32 160 38 126Z" fill="#e2a24a" ${OL}/>
            <g fill="#b5682a">${(() => {
              const r = rnd(3);
              return Array.from(
                { length: 60 },
                () => `<circle cx="${f(50 + r() * 160)}" cy="${f(94 + r() * 60)}" r="${f(1 + r() * 1.4)}"/>`,
              ).join('');
            })()}</g><path d="M70 96Q130 88 190 96" stroke="#fff" stroke-opacity=".35" stroke-width="5" fill="none" stroke-linecap="round"/></g>
        </g>
        <g class="ca-steam">${steam(100, 70)}${steam(166, 66)}</g>
        <g class="ca-shine">${sparkle(64, 52, 8, '#ffd23f')}${sparkle(206, 44, 6, '#ffd23f')}</g>
`;
      return svgEl('0 0 260 200', inner, 'ca-dish-svg');
    };

    // ---------------- Hopscotch board (cascayu task) ----------------
    // n squares in the classic pattern (1, 2, 3 single, 4|5 side by side, 6, 7|8, 9…) from the bottom up, and the goal («cielo») on top.
    const PATTERN = [[1], [2], [3], [4, 5], [6], [7, 8], [9]];
    const board = (/** @type {number} */ n) => {
      const S = 64;
      /** @type {number[][]} */
      const rows = [];
      let k = 1;
      for (const row of PATTERN) {
        if (k > n) break;
        const r = row.filter((m) => m <= n);
        rows.push(r);
        k = (r.at(-1) || k) + 1;
      }
      const PAD = 40; // room below square 1 for the stone at the start
      const H = rows.length * S + 70 + PAD;
      const W = 2 * S + 40;
      /** @type {{ x: number, y: number }[]} */
      const centers = [];
      const squares = rows
        .map((r, ri) => {
          const y = H - PAD - (ri + 1) * S;
          return r
            .map((m, ci) => {
              const x = r.length === 1 ? W / 2 - S / 2 : 20 + ci * S;
              centers[m - 1] = { x: x + S / 2, y: y + S / 2 };
              return `<g class="ca-sq" data-n="${m}"><rect class="ca-sq-bg" x="${x + 3}" y="${y + 3}" width="${S - 6}" height="${S - 6}" rx="6"/>
                <rect x="${x}" y="${y}" width="${S}" height="${S}" fill="none" class="ca-sq-line"/>
                <text x="${x + S / 2}" y="${y + S / 2 + 12}" text-anchor="middle" class="ca-chalk">${m}</text></g>`;
            })
            .join('');
        })
        .join('');
      const top = H - PAD - rows.length * S;
      const goal = { x: W / 2, y: top - 26 };
      const inner = `<rect width="${W}" height="${H}" rx="20" class="ca-ground"/>
        <g class="ca-grit">${(() => {
          const r = rnd(n + 3);
          return Array.from({ length: 26 }, () => `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(1 + r() * 2)}"/>`).join('');
        })()}</g>
        <path class="ca-sq-line ca-goal" d="M${W / 2 - S} ${top}A${S} ${S * 0.72} 0 0 1 ${W / 2 + S} ${top}Z"/>
        ${sparkle(W / 2, top - 22, 11, '#ffe08a')}
        ${squares}
        <g class="ca-stone"><ellipse cx="0" cy="3" rx="13" ry="5" fill="#000" opacity=".18"/><path d="M-12 0Q-12 -9 0 -9Q12 -9 12 0Q12 6 0 6Q-12 6 -12 0Z" fill="#8a847a" ${OL}/><path d="M-6 -4Q-2 -7 4 -6" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
      return { el: svgEl(`0 0 ${W} ${H}`, inner, 'ca-board-svg'), centers, goal, start: { x: W / 2, y: H - PAD / 2 }, size: [W, H] };
    };

    // ---------------- Label scenes (600 × 400) ----------------
    const leader = (/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2) =>
      `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${K}" stroke-width="2.6" stroke-dasharray="1 5.5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6.5" fill="#2f6fb0" stroke="#ffd23f" stroke-width="3"/>`;
    const sceneOf = (
      /** @type {string} */ u,
      /** @type {string} */ inner,
      /** @type {{ id: string, x: number, y: number, w: number, at: number[] }[]} */ spots,
    ) => {
      const lines = spots.map((s) => leader(s.x, s.y, s.at[0], s.at[1])).join('');
      const el = svgEl(
        '0 0 600 400',
        `<defs><clipPath id="${u}fr"><rect width="600" height="400" rx="18"/></clipPath></defs><g clip-path="url(#${u}fr)">${inner}</g>
         <rect x="1" y="1" width="598" height="398" rx="17" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>${lines}`,
        'scene-svg ca-scene',
      );
      return { el, box: /** @type {[number, number]} */ ([600, 400]), spots, cls: 'ca-scene' };
    };
    /** Draws a 160 × 120 sticker's inner drawing scaled into the scene (no tile). */
    const piece = (/** @type {string} */ key, /** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      `<g transform="translate(${x} ${y}) scale(${s}) translate(-80 -104)">${ART[key].draw(uid())}</g>`;

    /** @type {Record<string, () => ExamScene>} */
    const SCENES = {
      // The casería: house in the middle, panera, piteru, cuadra, güerta, maizal, llagar around it.
      caseria() {
        const u = uid();
        const inner = `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe1f3"/><stop offset="1" stop-color="#eef8f2"/></linearGradient></defs>
          <rect width="600" height="400" fill="url(#${u}s)"/>${sun(540, 50, 22)}${cloud(380, 50, 1.4)}
          <path d="M0 150L70 90L120 120L200 60L280 118L330 92L420 140L500 80L600 130V200H0Z" fill="#a8b4c0"/>
          <path d="M200 60L186 84L198 80L206 88L216 78ZM500 80L488 100L500 96L508 104L516 94Z" fill="#fff"/>
          <path d="M0 170Q150 140 300 160T600 150V400H0Z" fill="#9fc77a"/><path d="M0 240Q200 214 380 236T600 226V400H0Z" fill="#86bb5c"/>
          <path d="M260 400Q290 320 300 250" stroke="#d8c39a" stroke-width="26" fill="none" stroke-linecap="round"/>
          <g transform="translate(250 150)"><path d="M0 100V30H110V100Z" fill="#f2ead8" ${OL}/><path d="M-12 34L55 -6L122 34Z" fill="#c4553a" ${OL}/>
            <rect x="44" y="58" width="22" height="42" fill="#7a4a26" ${THIN}/><rect x="12" y="46" width="20" height="18" fill="#9fd0f0" ${THIN}/><rect x="78" y="46" width="20" height="18" fill="#9fd0f0" ${THIN}/>
            <path d="M-6 30H116" stroke="#8a5226" stroke-width="6"/><path d="M-6 30H116" stroke="${K}" stroke-width="1" opacity=".5"/></g>
          ${piece('panera', 110, 250, 1.2)}
          ${at(150, 340, 1, `<path d="M-40 0V-44H40V0Z" fill="#c08a52" ${OL}/><path d="M-48 -42L0 -70L48 -42Z" fill="#c4553a" ${OL}/><path d="M-10 0V-22Q0 -32 10 -22V0Z" fill="#5a3a22" ${THIN}/>`)}${at(204, 344, 1, hen)}${at(186, 362, 0.8, hen, true)}
          ${at(470, 250, 1, `<path d="M-60 0V-60H60V0Z" fill="#cfc6b6" ${OL}/><path d="M-70 -58L0 -92L70 -58Z" fill="#c4553a" ${OL}/><rect x="-20" y="-40" width="40" height="40" fill="#7a4a26" ${THIN}/><path d="M-20 -24H20" stroke="#5a3418" stroke-width="2"/>`)}
          ${at(406, 262, 0.75, '<g transform="translate(-80 -104)">' + cow(u, { body: '#8e3b1c', head: '#7a3216', muzzle: '#e8c9a8', horns: 'short' }) + '</g>')}
          <g transform="translate(340 300)"><path d="M0 80L30 0H150L180 80Z" fill="#8a5a36" ${OL}/>${[
            [40, 60],
            [80, 60],
            [120, 60],
            [150, 60],
            [56, 30],
            [92, 30],
            [128, 30],
          ]
            .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i < 4 ? 11 : 9}" fill="${i % 2 ? '#7fbf4f' : '#5e9e3a'}" ${OL}/>`)
            .join('')}</g>
          ${[40, 64, 88, 112].map((x, i) => at(x, 220 - (i % 2) * 6, 0.9, `<path d="M0 0V-70" stroke="#5e9e3a" stroke-width="3.4"/><path d="M0 -20Q-16 -26 -20 -40M0 -36Q14 -42 18 -56M0 -50Q-12 -58 -12 -70" stroke="#6faf45" stroke-width="3" fill="none" stroke-linecap="round"/><g transform="translate(4 -40) rotate(20)"><ellipse rx="5" ry="12" fill="#f2c94c" ${THIN}/></g>`)).join('')}
          ${at(540, 360, 1, `<path d="M-46 0V-50H46V0Z" fill="#e6d8c0" ${OL}/><path d="M-54 -48L0 -74L54 -48Z" fill="#a8652e" ${OL}/>`)}${barrel(522, 344, 0.62)}${barrel(556, 344, 0.62)}`;
        return sceneOf(u, inner, [
          { id: 'maizal', x: 80, y: 90, w: 124, at: [70, 168] },
          { id: 'panera', x: 100, y: 300, w: 124, at: [110, 232] },
          { id: 'piteru', x: 230, y: 380, w: 124, at: [150, 316] },
          { id: 'cuadra', x: 500, y: 130, w: 124, at: [470, 200] },
          { id: 'guerta', x: 430, y: 270, w: 124, at: [420, 330] },
          { id: 'llagar', x: 534, y: 380, w: 112, at: [540, 330] },
        ]);
      },
      // The gaita: bag (fuelle) under the arm, blowpipe (soplete) up to the mouth, chanter (puntero) down, drone (roncón) over the shoulder.
      gaita() {
        const u = uid();
        const inner = `<rect width="600" height="400" fill="#eaf2fb"/><g fill="#d6e4f4">${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 70 - 10}" y="0" width="34" height="400"/>`).join('')}</g>
          <path d="M260 196L170 96" stroke="${K}" stroke-width="18" stroke-linecap="round"/><path d="M260 196L170 96" stroke="#7a4a26" stroke-width="11" stroke-linecap="round"/><rect x="160" y="82" width="20" height="16" rx="4" fill="#f2e6c8" ${OL} transform="rotate(-48 170 90)"/>
          <path d="M360 180L470 50" stroke="${K}" stroke-width="22" stroke-linecap="round"/><path d="M360 180L470 50" stroke="#a8652e" stroke-width="15" stroke-linecap="round"/>
          <path d="M398 136l14 -16M432 96l14 -16" stroke="#f2e6c8" stroke-width="10" stroke-linecap="round"/><path d="M462 58l20 -22" stroke="#f2e6c8" stroke-width="16" stroke-linecap="round"/><path d="M462 58l20 -22" ${ol(1.6)}/>
          <path d="M210 230Q196 150 300 146Q410 144 414 214Q420 300 316 310Q222 316 210 230Z" fill="#2f6fb0" ${OL}/>
          <path d="M228 230Q236 178 300 166" stroke="#fff" stroke-opacity=".3" stroke-width="14" fill="none" stroke-linecap="round"/>
          <path d="M216 214Q310 240 410 200" stroke="#f2c14e" stroke-width="6" fill="none"/><path d="M220 248Q310 274 408 236" stroke="#f2c14e" stroke-width="3" fill="none" stroke-dasharray="8 6"/>
          <path d="M290 304L262 392" stroke="${K}" stroke-width="20" stroke-linecap="round"/><path d="M290 304L262 392" stroke="#7a4a26" stroke-width="13" stroke-linecap="round"/>
          <g fill="${K}">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${f(286 - i * 5.4)}" cy="${f(320 + i * 16)}" r="3"/>`).join('')}</g>
          <path d="M254 396l20 0" stroke="#f2e6c8" stroke-width="12" stroke-linecap="round"/>
          ${flowerHead(330, 268, 8, '#f2c14e', '#fff')}`;
        return sceneOf(u, inner, [
          { id: 'soplete', x: 110, y: 160, w: 130, at: [196, 124] },
          { id: 'roncon', x: 520, y: 140, w: 130, at: [420, 110] },
          { id: 'fuelle', x: 500, y: 290, w: 130, at: [380, 240] },
          { id: 'puntero', x: 120, y: 340, w: 130, at: [276, 352] },
        ]);
      },
    };
    const scene = (/** @type {string} */ name) => (SCENES[name] ? SCENES[name]() : null);

    // ---------------- Hub hero: the meadow, the hórreo goal and its keeper ----------------
    // Count based: the n-th part is painted once n stations are passed (2+ stars); the others are pale silhouettes (.ca-sk).
    const passedCount = () => {
      const unit = window.CA_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return (unit?.stations || []).filter((s) => (Number(st[s.id]?.stars) || 0) >= 2).length;
    };
    const keeper = `<path d="M-15 36L-11 8H11L15 36Z" fill="#2f9a5a" ${OL}/><path d="M-11 18H11M-12 26H12" stroke="#7fd09a" stroke-width="3"/>
      <path d="M-9 36v14M9 36v14" stroke="${K}" stroke-width="6" stroke-linecap="round"/><path d="M-9 36v12M9 36v12" stroke="#1f2a44" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M-11 12L-26 -6M11 12L26 -6" stroke="#2f9a5a" stroke-width="7" stroke-linecap="round"/><path d="M-11 12L-26 -6M11 12L26 -6" ${ol(1.2)} opacity=".6"/>
      <circle cx="-28" cy="-9" r="6.4" fill="#f2b134" ${OL}/><circle cx="28" cy="-9" r="6.4" fill="#f2b134" ${OL}/>
      ${face('<path d="M-14 -2Q-16 -17 0 -17Q16 -17 14 -2Q8 -10 0 -10Q-8 -10 -14 -2Z" fill="#6b3f22"/>')}`;
    const ball = `<circle r="8" fill="#fff" ${OL}/><path d="M0 -3l3 2 -1 3h-4l-1 -3z" fill="${K}"/><path d="M0 -3V-8M3 -1l5 -1M2 2l3 4M-2 2l-3 4M-3 -1l-5 -1" stroke="${K}" stroke-width="1"/>`;
    // [drawing], back to front; index = how many passed stations light it up (1-based).
    /** @type {((u: string) => string)[]} */
    const PARTS = [
      (u) => `<rect width="360" height="300" fill="url(#${u}sky)"/>${sun(300, 56, 20)}${cloud(90, 50, 1.1)}${cloud(220, 34, 0.8)}`,
      () => `<path d="M0 170L50 110L84 136L140 70L196 134L236 100L292 150L330 120L360 140V200H0Z" fill="#a8b4c0"/>
        <path d="M140 70L126 96L138 92L144 100L154 90ZM50 110L40 128L50 124L56 130ZM236 100L226 116L236 113L242 118Z" fill="#fff"/>`,
      () =>
        `${tree(40, 200, 1.1, '#4f8f3a', `<g fill="#d93b3b"><circle cx="-8" cy="-34" r="3"/><circle cx="6" cy="-40" r="3"/><circle cx="10" cy="-26" r="3"/></g>`)}${pine(318, 196, 1.2)}${pine(340, 202, 0.9)}`,
      (u) =>
        at(
          292,
          232,
          0.6,
          `<g transform="translate(-80 -104)">${cow(u, { body: '#8e3b1c', head: '#7a3216', muzzle: '#e8c9a8', horns: 'short' })}</g>`,
        ),
      (u) => at(64, 250, 0.5, `<g transform="translate(-86 -100)">${pig(u)}</g>`),
      // San Xuan: a bonfire in the front right corner
      () => `<g class="ca-fire">${at(322, 262, 0.62, `<path d="M-24 30Q-34 0 -12 -22Q-14 -4 0 -2Q-6 -24 6 -42Q34 -12 26 30Z" fill="#ff7a2a" ${OL}/><path d="M-12 30Q-16 8 0 -6Q14 10 12 30Z" fill="#ffd23f"/>`)}</g>
        <path d="M300 284L344 272M302 272L346 284" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M300 284L344 272M302 272L346 284" stroke="#8a5226" stroke-width="4" stroke-linecap="round"/>`,
      // The gaita station: fiesta bunting in the flag's blue and gold, and a few notes
      () => {
        const flags = Array.from({ length: 11 }, (_, i) => {
          const x = 14 + i * 30;
          const y = 104 + Math.sin((i / 10) * Math.PI) * 16;
          return `<path d="M${x} ${f(y)}L${x + 22} ${f(y + 1)}L${x + 11} ${f(y + 20)}Z" fill="${i % 2 ? '#ffc61e' : '#1f5fa8'}" ${THIN}/>`;
        }).join('');
        return `<path d="M6 102Q180 140 354 102" stroke="${K}" stroke-width="1.6" fill="none"/>${flags}
          <g fill="${K}"><text x="250" y="76" font-size="22" font-weight="900">♪</text><text x="96" y="84" font-size="18" font-weight="900">♫</text></g>`;
      },
      () =>
        `<g stroke="#fbfbf4" stroke-width="2" opacity=".9" fill="none">${[
          [124, 270],
          [124, 254],
          [116, 238],
          [132, 238],
        ]
          .map(([x, y]) => `<rect x="${x - 8}" y="${y - 8}" width="16" height="16"/>`)
          .join('')}</g>`,
    ];
    const hero = () => {
      const u = uid();
      const n = passedCount();
      const total = window.CA_CONTENT?.stations?.length || PARTS.length;
      const all = n >= total;
      // An unpassed part is an empty album slot: a flat silhouette (index.html: .ca-sk); the sky then stays the frame's cream.
      const parts = PARTS.map((draw, i) =>
        n > i
          ? `<g class="ca-part is-on" data-part="${i}">${draw(u)}</g>`
          : `<g class="ca-part ca-sk" data-part="${i}">${i === 0 ? '' : draw(u)}</g>`,
      );
      // The hórreo (always there): its four pillars are the goal posts, a net hangs between the front two.
      const horreo = `<g transform="translate(180 258)">
          <path d="M-58 0L-56 -40M58 0L56 -40" stroke="${K}" stroke-width="12" stroke-linecap="round"/><path d="M-58 0L-56 -40M58 0L56 -40" stroke="#d6cfc0" stroke-width="8" stroke-linecap="round"/>
          <g stroke="#fff" stroke-width="1.4" opacity=".85"><path d="M-50 -38V0M-36 -38V0M-22 -38V0M-8 -38V0M6 -38V0M20 -38V0M34 -38V0M48 -38V0M-52 -28H52M-52 -18H52M-52 -8H52"/></g>
          <rect x="-66" y="-48" width="132" height="10" rx="3" fill="#a9a194" ${OL}/>
          <rect x="-70" y="-86" width="140" height="40" fill="#a8652e" ${OL}/>
          <g stroke="#7a4520" stroke-width="2">${Array.from({ length: 16 }, (_, i) => `<path d="M${-62 + i * 8} -85V-47"/>`).join('')}</g>
          <rect x="-10" y="-80" width="20" height="30" fill="#7a4520" ${THIN}/>
          <path d="M-88 -82L-28 -122H28L88 -82Z" fill="#c4553a" ${OL}/><path d="M-70 -94H70M-50 -108H50" stroke="#9c3c26" stroke-width="2"/>
          <path d="M-28 -122H28" stroke="${K}" stroke-width="4" stroke-linecap="round"/></g>`;
      const inner = `<defs><clipPath id="${u}fr"><rect x="4" y="4" width="352" height="292" rx="30"/></clipPath>
          <linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe1f3"/><stop offset="1" stop-color="#eef8f2"/></linearGradient></defs>
        <rect x="4" y="4" width="352" height="292" rx="30" fill="#f4f1e2"/>
        <g clip-path="url(#${u}fr)">
          ${parts.slice(0, 2).join('')}
          <path d="M0 196Q90 176 180 190T360 186V300H0Z" fill="#a7cf7a"/><path d="M0 230Q120 214 240 228T360 222V300H0Z" fill="#8cc35e"/>
          ${parts.slice(2).join('')}
          ${horreo}
          <g class="ca-keeper">${at(180, 236, 0.92, keeper)}</g>${at(206, 282, 1, ball)}
          ${all ? `${sparkle(60, 40, 9, '#ffd23f')}${sparkle(150, 26, 7, '#ffd23f')}${sparkle(330, 100, 7, '#ffd23f')}` : ''}
          <rect x="0" y="280" width="360" height="20" fill="#2f6fb0"/><rect x="0" y="280" width="360" height="5" fill="#ffd23f"/>
        </g>
        <rect x="4" y="4" width="352" height="292" rx="30" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
      const el = svgEl('0 0 360 300', inner, 'hero-svg ca-hero');
      el.dataset.passed = String(n);
      return el;
    };

    const keys = () => Object.keys(ART);

    return {
      art,
      scene,
      hero,
      dish,
      board,
      keys,
      has: (/** @type {string} */ key) => !!key && (key in ART || (key.startsWith('t-') && key.slice(2) in TARGETS)),
    };
  })()
);
