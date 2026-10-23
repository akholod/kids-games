// Drawings for «Conozco mi entorno»: task illustrations (`art`) as field-notebook cards, the label scenes and the hub hero —
// a pond under a glass dome that starts as pale silhouettes and comes alive in colour, one part per passed station.
// Plain SVG, our own drawings (never scans from the book); no text on rocks, layers or living things.
// window.CNArt = { art(key) → Element|null, scene(name) → ExamScene|null, hero() → Element, has(key) }
// @ts-check
'use strict';

window.CNArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `cn${++uidN}`;

    const svgEl = (/** @type {string} */ viewBox, inner = '', cls = 'art-svg') => {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('viewBox', viewBox);
      el.setAttribute('class', cls);
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('focusable', 'false');
      el.innerHTML = inner;
      return el;
    };
    /** Deterministic pseudo-random numbers (the same drawing every time). */
    const rnd = (/** @type {number} */ seed) => () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const f = (/** @type {number} */ n) => n.toFixed(1);

    // ---------------- Pieces (each drawn around its foot point, scaled with `s`) ----------------
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, /** @type {string} */ inner, flip = false) =>
      `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${inner}</g>`;

    const sun = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, cls = '') => {
      const rays = Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return `M${f(Math.cos(a) * r * 1.3)} ${f(Math.sin(a) * r * 1.3)}L${f(Math.cos(a) * r * 1.65)} ${f(Math.sin(a) * r * 1.65)}`;
      }).join('');
      return `<g transform="translate(${x} ${y})"><path class="${cls}" d="${rays}" stroke="#f6b73c" stroke-width="${f(r * 0.16)}" stroke-linecap="round"/>
        <circle r="${r}" fill="#ffd25a"/><circle r="${f(r * 0.72)}" cx="${f(-r * 0.12)}" cy="${f(-r * 0.12)}" fill="#ffe28a"/></g>`;
    };
    const cloud = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(x, y, s, '<path d="M-26 0Q-30 -12 -18 -14Q-14 -26 0 -22Q10 -30 20 -18Q32 -18 30 0Z" fill="#fff" fill-opacity=".92"/>');

    const frog = `<ellipse cx="-11" cy="-3" rx="8" ry="4" fill="#4b9532"/><ellipse cx="11" cy="-3" rx="8" ry="4" fill="#4b9532"/>
      <ellipse cy="-12" rx="15" ry="11" fill="#62b13f"/><ellipse cy="-9" rx="9" ry="6.5" fill="#d4ea9d"/>
      <circle cx="-7" cy="-22" r="5.6" fill="#62b13f"/><circle cx="7" cy="-22" r="5.6" fill="#62b13f"/>
      <circle cx="-7" cy="-22.6" r="3.3" fill="#fff"/><circle cx="7" cy="-22.6" r="3.3" fill="#fff"/>
      <circle cx="-6.4" cy="-22.2" r="1.8" fill="#1f2a22"/><circle cx="7.6" cy="-22.2" r="1.8" fill="#1f2a22"/>
      <path d="M-6 -15.5Q0 -12.5 6 -15.5" stroke="#2f5d22" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <ellipse cx="-6" cy="-1.6" rx="3.6" ry="2" fill="#4b9532"/><ellipse cx="6" cy="-1.6" rx="3.6" ry="2" fill="#4b9532"/>`;

    const dragonfly = `<g fill="#e6f6ff" fill-opacity=".85" stroke="#7fbde3" stroke-width=".9">
      <ellipse cx="-11" cy="-4" rx="13" ry="3.8" transform="rotate(-12 -11 -4)"/><ellipse cx="11" cy="-4" rx="13" ry="3.8" transform="rotate(12 11 -4)"/>
      <ellipse cx="-10" cy="3" rx="11" ry="3.4" transform="rotate(14 -10 3)"/><ellipse cx="10" cy="3" rx="11" ry="3.4" transform="rotate(-14 10 3)"/></g>
      <rect x="-1.7" y="0" width="3.4" height="27" rx="1.7" fill="#1f7fd0"/><path d="M-1.7 8H1.7M-1.7 14H1.7M-1.7 20H1.7" stroke="#0f4f86" stroke-width=".9"/>
      <ellipse cy="-1" rx="3.4" ry="4.8" fill="#1a63a8"/><circle cx="-2.2" cy="-7.2" r="2.6" fill="#38a8f0"/><circle cx="2.2" cy="-7.2" r="2.6" fill="#38a8f0"/>`;

    const reeds = (/** @type {number} */ h, /** @type {number} */ seed) => {
      const r = rnd(seed);
      let out = '';
      for (let i = 0; i < 7; i++) {
        const x = (i - 3) * 4 + (r() - 0.5) * 3;
        const top = h * (0.62 + r() * 0.38);
        const lean = (r() - 0.5) * 14;
        out += `<path d="M${f(x)} 0Q${f(x + lean * 0.3)} ${f(-top * 0.6)} ${f(x + lean)} ${f(-top)}" stroke="${i % 2 ? '#4f8f3a' : '#6aa847'}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
        if (i % 3 === 1) out += `<rect x="${f(x + lean - 2.8)}" y="${f(-top - 4)}" width="5.6" height="15" rx="2.8" fill="#8a5a33"/>`;
      }
      return out;
    };

    const grass = (/** @type {number} */ seed, color = '#5fa83d') => {
      const r = rnd(seed);
      let d = '';
      for (let i = 0; i < 6; i++) {
        const x = (i - 2.5) * 4;
        const top = 12 + r() * 10;
        const lean = (r() - 0.5) * 10;
        d += `M${f(x - 2)} 0Q${f(x + lean * 0.4)} ${f(-top * 0.5)} ${f(x + lean)} ${f(-top)}Q${f(x + lean * 0.2 + 1)} ${f(-top * 0.4)} ${f(x + 2)} 0Z`;
      }
      return `<path d="${d}" fill="${color}"/>`;
    };

    const rock = (/** @type {number} */ w, /** @type {number} */ h, fill = '#a3a9ab', shade = '#868d90') =>
      `<path d="M${-w / 2} 0Q${-w / 2} ${f(-h * 0.7)} ${f(-w * 0.18)} ${-h}Q${f(w * 0.16)} ${f(-h * 1.06)} ${f(w * 0.36)} ${f(-h * 0.68)}Q${w / 2} ${f(-h * 0.42)} ${w / 2} 0Z" fill="${fill}"/>
       <path d="M${f(w * 0.04)} 0Q${f(w * 0.3)} ${f(-h * 0.2)} ${f(w * 0.36)} ${f(-h * 0.68)}Q${w / 2} ${f(-h * 0.42)} ${w / 2} 0Z" fill="${shade}"/>
       <path d="M${f(-w * 0.3)} ${f(-h * 0.62)}Q${f(-w * 0.2)} ${f(-h * 0.9)} ${f(w * 0.02)} ${f(-h * 0.94)}" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none" stroke-linecap="round"/>`;

    const rabbit = `<ellipse cx="-15" cy="-15" rx="5" ry="5" fill="#fff"/><ellipse cy="-12" rx="15" ry="11" fill="#b49b80"/>
      <ellipse cx="9.5" cy="-37" rx="3.2" ry="10.5" fill="#a58b70" transform="rotate(12 9.5 -37)"/>
      <ellipse cx="14" cy="-38" rx="3.4" ry="11" fill="#b49b80" transform="rotate(-8 14 -38)"/><ellipse cx="14" cy="-38" rx="1.5" ry="7.5" fill="#e8b4b8" transform="rotate(-8 14 -38)"/>
      <circle cx="13" cy="-22" r="8.5" fill="#b49b80"/><circle cx="16" cy="-24" r="1.8" fill="#1f2a22"/><circle cx="21" cy="-20.5" r="1.4" fill="#d77a8a"/>
      <ellipse cx="-4" cy="-1.8" rx="8.5" ry="2.8" fill="#9d846a"/><ellipse cx="9" cy="-1.6" rx="4" ry="2" fill="#9d846a"/>`;

    const lynx = `<path d="M-23 -31Q-31 -33 -32 -25" stroke="#d8a865" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="-32" cy="-24" r="3.2" fill="#2b2420"/>
      <rect x="-20" y="-22" width="6" height="22" rx="3" fill="#c48f50"/><rect x="12" y="-22" width="6" height="22" rx="3" fill="#c48f50"/>
      <path d="M-24 -27Q-25 -38 -12 -38H14Q25 -37 25 -27V-23Q23 -18 14 -18H-16Q-24 -18 -24 -27Z" fill="#dcac6a"/>
      <rect x="-12" y="-21" width="6" height="21" rx="3" fill="#d8a865"/><rect x="19" y="-21" width="6" height="21" rx="3" fill="#d8a865"/>
      <g fill="#7a5530"><circle cx="-14" cy="-31" r="1.8"/><circle cx="-6" cy="-26" r="1.6"/><circle cx="2" cy="-32" r="1.8"/><circle cx="9" cy="-25" r="1.5"/><circle cx="-17" cy="-23" r="1.4"/><circle cx="15" cy="-31" r="1.5"/></g>
      <path d="M19 -47L21 -60L28 -49Z" fill="#c08a4a"/><path d="M28 -49L34 -60L36 -46Z" fill="#c08a4a"/>
      <path d="M21 -60V-66M34 -60V-66" stroke="#2b2420" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="28" cy="-40" r="10.5" fill="#dcac6a"/>
      <path d="M18 -38L16 -28L21 -32L24 -26L28 -31L32 -26L35 -32L39 -29L38 -38Z" fill="#f2e3c4"/>
      <circle cx="31" cy="-43" r="1.9" fill="#1f2a22"/><path d="M36.5 -38.5l2.5 -1.2v2.4z" fill="#6b4a3a"/>`;

    const toadstool = (dots = true) =>
      `<path d="M-5 0Q-6 -12 -4 -20H4Q6 -12 5 0Z" fill="#f7f1e3"/><path d="M-6 -12Q0 -9 6 -12L5 -9Q0 -7 -5 -9Z" fill="#e7dcc4"/>
       <path d="M-17 -18Q-16 -36 0 -37Q16 -36 17 -18Q0 -14 -17 -18Z" fill="#d8322a"/><path d="M-17 -18Q0 -14 17 -18Q0 -20 -17 -18Z" fill="#a5231d"/>
       ${dots ? '<g fill="#fff"><circle cx="-9" cy="-26" r="2.4"/><circle cx="0" cy="-32" r="2.2"/><circle cx="8" cy="-25" r="2.6"/><circle cx="-2" cy="-23" r="1.6"/><circle cx="12" cy="-31" r="1.5"/></g>' : ''}`;

    const cactus = `<path d="M-7 0V-70Q-7 -78 0 -78Q7 -78 7 -70V0Z" fill="#5c9e4a"/>
      <path d="M-7 -30H-17Q-24 -30 -24 -38V-52Q-24 -57 -20 -57Q-16 -57 -16 -52V-40H-7Z" fill="#5c9e4a"/>
      <path d="M7 -42H16V-62Q16 -67 20 -67Q24 -67 24 -62V-42Q24 -34 16 -34H7Z" fill="#4f8f3e"/>
      <path d="M-2 -72V-4M3 -72V-4" stroke="#3f7a32" stroke-width="1.2" stroke-linecap="round"/>`;

    const pine = (/** @type {string} */ c1, /** @type {string} */ c2) =>
      `<rect x="-2.5" y="-10" width="5" height="10" fill="#7a5130"/><path d="M0 -58L-16 -10H16Z" fill="${c1}"/><path d="M0 -58L16 -10H2Z" fill="${c2}"/>`;
    const leafy = (/** @type {string} */ c1, /** @type {string} */ c2) =>
      `<rect x="-3" y="-22" width="6" height="22" rx="2" fill="#80562f"/><circle cy="-36" r="18" fill="${c1}"/><circle cx="-11" cy="-28" r="12" fill="${c1}"/><circle cx="11" cy="-27" r="12" fill="${c2}"/><circle cx="5" cy="-44" r="10" fill="${c2}"/>`;

    const flower = (/** @type {string} */ c) =>
      `<path d="M0 0V-12" stroke="#4f8f3a" stroke-width="1.6"/><g fill="${c}"><circle cy="-16" r="3.4"/><circle cx="-3.6" cy="-12.6" r="3.4"/><circle cx="3.6" cy="-12.6" r="3.4"/><circle cx="-2.4" cy="-8.6" r="3"/><circle cx="2.4" cy="-8.6" r="3"/></g><circle cy="-12.4" r="2.4" fill="#ffd25a"/>`;

    const fish = (/** @type {string} */ c, /** @type {string} */ stripe) =>
      `<path d="M10 0L20 -7V7Z" fill="${c}"/><ellipse rx="13" ry="7.5" fill="${c}"/><path d="M-2 -7Q2 0 -2 7" stroke="${stripe}" stroke-width="3" fill="none"/><circle cx="-7" cy="-1.5" r="1.8" fill="#1f2a22"/>`;

    const seahorse = `<path d="M3 -20C13 -16 13 -4 7 4C1 12 4 22 10 22C16 22 16 14 10 13" stroke="#f2a93b" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="7" cy="-7" rx="8" ry="12" fill="#f2a93b"/><path d="M2 -14Q6 -10 3 -3M3 -6H8" stroke="#d98a24" stroke-width="1.2" fill="none"/>
      <ellipse cx="15" cy="-6" rx="3.5" ry="6" fill="#ffd27a"/>
      <circle cx="0" cy="-23" r="7" fill="#f2a93b"/><rect x="-14" y="-25" width="11" height="4.4" rx="2.2" fill="#f2a93b"/>
      <path d="M-1 -30l2 -5 2 5M3 -29l3 -4 1 5" fill="#d98a24"/><circle cx="-1" cy="-24" r="1.7" fill="#1f2a22"/>`;

    const squirrel = `<path d="M-6 -6C-26 -6 -30 -30 -20 -42C-12 -52 4 -48 -2 -36C-8 -26 -16 -22 -6 -14Z" fill="#c8673a"/>
      <path d="M-14 -40C-8 -46 0 -44 -3 -37" stroke="#e08a55" stroke-width="2" fill="none"/>
      <ellipse cx="4" cy="-12" rx="9" ry="11" fill="#cf7240"/><ellipse cx="6" cy="-10" rx="5" ry="7" fill="#f3d2ad"/>
      <circle cx="9" cy="-26" r="7" fill="#cf7240"/><path d="M5 -31L6 -38L10 -32Z" fill="#b85a2f"/><circle cx="11.5" cy="-27" r="1.4" fill="#1f2a22"/>
      <ellipse cx="14" cy="-15" rx="3.4" ry="3" fill="#8a5a2b"/><ellipse cx="2" cy="-1.5" rx="6" ry="2.2" fill="#b85a2f"/>`;

    const camel = `<path d="M34 -38Q40 -34 38 -26" stroke="#b9823f" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g stroke="#b9823f" stroke-width="6" stroke-linecap="round"><path d="M-12 -34L-11 -16L-13 -1M26 -34L28 -16L26 -1"/></g><g stroke="#cf9a58" stroke-width="6" stroke-linecap="round"><path d="M-20 -34L-22 -16L-20 -1M18 -34L20 -16L18 -1"/></g>
      <path d="M-30 -42Q-30 -56 -16 -56Q-10 -72 0 -58Q8 -72 18 -57Q34 -56 34 -42Q34 -30 22 -30H-20Q-30 -30 -30 -42Z" fill="#cf9a58"/>
      <path d="M-25 -44Q-38 -46 -42 -60" stroke="#cf9a58" stroke-width="10" fill="none" stroke-linecap="round"/>
      <ellipse cx="-47" cy="-63" rx="10" ry="6.4" fill="#cf9a58" transform="rotate(-14 -47 -63)"/><path d="M-44 -70l1 -4 3 4z" fill="#b9823f"/>
      <circle cx="-47" cy="-65" r="1.5" fill="#1f2a22"/><path d="M-28 -36Q0 -32 32 -38" stroke="#b9823f" stroke-width="1.4" fill="none" opacity=".6"/>`;

    const panda = `<ellipse cx="0" cy="-40" rx="34" ry="36" fill="#fbfaf4"/><ellipse cx="0" cy="-26" rx="24" ry="20" fill="#ecebe2"/>
      <ellipse cx="-24" cy="-8" rx="15" ry="11" fill="#22252a"/><ellipse cx="24" cy="-8" rx="15" ry="11" fill="#22252a"/>
      <ellipse cx="-26" cy="-7" rx="6" ry="5" fill="#4a4e55"/><ellipse cx="26" cy="-7" rx="6" ry="5" fill="#4a4e55"/>
      <path d="M-30 -66Q0 -54 30 -66L32 -54Q0 -44 -32 -54Z" fill="#22252a"/>
      <ellipse cx="24" cy="-42" rx="10" ry="18" fill="#22252a" transform="rotate(-14 24 -42)"/>
      <rect x="-36" y="-138" width="8" height="124" rx="4" fill="#79b84a" transform="rotate(14 -32 -76)"/>
      <path d="M-46 -128h8M-42 -100h8M-37 -72h8" stroke="#5a9637" stroke-width="2.4" transform="rotate(14 -32 -76)"/>
      <path d="M-26 -132Q-6 -140 0 -128Q-12 -124 -26 -132ZM-40 -120Q-58 -126 -64 -114Q-50 -110 -40 -120Z" fill="#8cc85a"/>
      <ellipse cx="-22" cy="-58" rx="10" ry="18" fill="#22252a" transform="rotate(30 -22 -58)"/>
      <circle cx="-21" cy="-104" r="9.5" fill="#22252a"/><circle cx="21" cy="-104" r="9.5" fill="#22252a"/>
      <circle cy="-84" r="27" fill="#fbfaf4"/>
      <ellipse cx="-10" cy="-86" rx="7" ry="9.5" fill="#22252a" transform="rotate(-28 -10 -86)"/><ellipse cx="10" cy="-86" rx="7" ry="9.5" fill="#22252a" transform="rotate(28 10 -86)"/>
      <circle cx="-9" cy="-88" r="2.6" fill="#fff"/><circle cx="9" cy="-88" r="2.6" fill="#fff"/>
      <ellipse cy="-76" rx="4.6" ry="3.2" fill="#22252a"/><path d="M-5 -70Q0 -66 5 -70" stroke="#22252a" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;

    const girl = `<rect x="-14" y="-50" width="28" height="24" rx="7" fill="#f2b134"/>
      <rect x="-7.5" y="-26" width="6" height="25" rx="2" fill="#3d5a8a"/><rect x="1.5" y="-26" width="6" height="25" rx="2" fill="#3d5a8a"/>
      <ellipse cx="-5" cy="-1" rx="5" ry="2.6" fill="#2a2f3a"/><ellipse cx="5" cy="-1" rx="5" ry="2.6" fill="#2a2f3a"/>
      <path d="M-11 -50Q0 -54 11 -50L13 -24H-13Z" fill="#e8573f"/>
      <path d="M-10 -48L-14 -30" stroke="#f1c6a0" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M10 -47L22 -58" stroke="#f1c6a0" stroke-width="4.2" stroke-linecap="round"/>
      <path d="M-6 -50V-30M6 -50V-30" stroke="#c98a1c" stroke-width="2.2"/>
      <ellipse cx="-12" cy="-64" rx="4" ry="9" fill="#6b3f22" transform="rotate(20 -12 -64)"/>
      <circle cy="-62" r="10.5" fill="#f4c9a3"/><path d="M-10.5 -63Q-10 -75 0 -75Q10 -75 10.5 -63Q4 -69 -10.5 -63Z" fill="#6b3f22"/>
      <circle cx="-3.5" cy="-61" r="1.4" fill="#1f2a22"/><circle cx="3.8" cy="-61" r="1.4" fill="#1f2a22"/><path d="M-3 -56.5Q0 -54.5 3 -56.5" stroke="#9a4a32" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;

    const cow = `<rect x="-14" y="-12" width="3.4" height="12" fill="#6e4a2c"/><rect x="9" y="-12" width="3.4" height="12" fill="#6e4a2c"/>
      <rect x="-16" y="-22" width="30" height="13" rx="6" fill="#a8703f"/><rect x="-8" y="-12" width="3.4" height="12" fill="#8a5a33"/><rect x="5" y="-12" width="3.4" height="12" fill="#8a5a33"/>
      <ellipse cx="-19" cy="-20" rx="6" ry="5" fill="#a8703f"/><ellipse cx="-22" cy="-18" rx="3.4" ry="2.8" fill="#e9c9a0"/><path d="M-21 -25l-3 -3M-16 -25l2 -3" stroke="#efe6d4" stroke-width="1.6" stroke-linecap="round"/>`;

    const sky = (/** @type {string} */ u, top = '#c6e6f6', bottom = '#eef8fb') =>
      `<defs><linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="276" height="176" fill="url(#${u}sky)"/>`;

    // ---------------- Field-notebook card around an illustration (inner area 0..276 × 0..176) ----------------
    const TAPES = ['#f2c94c', '#9ad1c4', '#f4a6a0', '#b7d98b'];
    const card = (/** @type {string} */ u, /** @type {string} */ inner, tilt = -2, tape = 0) => `
      <defs><filter id="${u}sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1d3a2a" flood-opacity=".22"/></filter>
      <clipPath id="${u}cl"><rect width="276" height="176" rx="10"/></clipPath></defs>
      <g transform="rotate(${tilt} 160 112)">
        <rect x="12" y="12" width="296" height="200" rx="16" fill="#fffdf6" filter="url(#${u}sh)"/>
        <g transform="translate(22 22)"><g clip-path="url(#${u}cl)">${inner}</g><rect width="276" height="176" rx="10" fill="none" stroke="#000" stroke-opacity=".1"/></g>
        <rect x="132" y="3" width="56" height="18" rx="2" fill="${TAPES[tape % TAPES.length]}" fill-opacity=".72" transform="rotate(-5 160 12)"/>
      </g>`;

    // A round microscope field on a dark background, with a small microscope in the corner.
    const microscope = (/** @type {string} */ u, /** @type {string} */ field, /** @type {string} */ inner) => `
      <defs><radialGradient id="${u}mf" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="${field}"/></radialGradient>
      <clipPath id="${u}mc"><circle cx="128" cy="88" r="76"/></clipPath></defs>
      <rect width="276" height="176" fill="#243038"/><circle cx="128" cy="88" r="82" fill="#3a4850"/>
      <circle cx="128" cy="88" r="76" fill="url(#${u}mf)"/><g clip-path="url(#${u}mc)">${inner}</g>
      <circle cx="128" cy="88" r="76" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="5"/>
      <g transform="translate(240 160)" fill="#c9d3d8"><rect x="-16" y="-4" width="32" height="5" rx="2"/><path d="M6 -4V-14Q14 -22 6 -30" stroke="#c9d3d8" stroke-width="4" fill="none"/>
      <rect x="-14" y="-20" width="20" height="3.5" rx="1.5"/><rect x="-6" y="-46" width="8" height="22" rx="3" transform="rotate(-20 -2 -35)"/><rect x="-4" y="-25" width="6" height="7" rx="1.5"/></g>`;

    /** @type {Record<string, (u: string) => string>} */
    const ART = {
      'eco-charca': (u) => `${sky(u)}
        <path d="M0 74Q20 58 40 70Q62 52 86 68Q106 54 128 68Q152 50 178 66Q202 54 224 68Q250 56 276 70V100H0Z" fill="#82ba78"/>
        <path d="M0 90Q70 80 140 88T276 86V176H0Z" fill="#a8d272"/>
        <ellipse cx="146" cy="130" rx="118" ry="38" fill="#7d9a4c"/><ellipse cx="146" cy="128" rx="112" ry="33" fill="#4e9fcf"/>
        <ellipse cx="138" cy="122" rx="92" ry="21" fill="#6cbade"/>
        <path d="M84 122h28M150 132h34M176 116h22" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
        ${at(206, 142, 1, rock(48, 26))}
        <path d="M86 140a18 6.5 0 1 0 1 0l9 4z" fill="#3f8f3a"/><path d="M170 146a13 5 0 1 0 1 0l6 3z" fill="#4a9a40"/>
        ${at(104, 142, 0.82, frog)}${at(46, 166, 0.95, frog, true)}
        ${at(24, 150, 1, reeds(70, 7))}${at(252, 134, 0.9, reeds(64, 11))}
        ${at(162, 58, 1.15, `<g transform="rotate(-70)">${dragonfly}</g>`)}`,

      cadena: (u) => `${sky(u, '#e3f2d9', '#f8fbef')}
        <path d="M0 136Q138 126 276 136V176H0Z" fill="#b9dc8a"/>
        <g fill="#fff" fill-opacity=".55"><ellipse cx="44" cy="140" rx="34" ry="8"/><ellipse cx="126" cy="140" rx="36" ry="8"/><ellipse cx="220" cy="142" rx="48" ry="9"/></g>
        ${at(44, 140, 2.4, `${grass(3)}${at(-9, 0, 0.8, grass(9, '#4f9a33'))}${at(9, 0, 0.75, grass(5, '#6cb648'))}`)}
        ${at(122, 140, 1.5, rabbit)}${at(214, 141, 1.25, lynx)}
        <g fill="none" stroke="#c8962a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M56 70Q82 44 106 68"/><path d="M96 66L106 68L105 58"/>
          <path d="M146 64Q174 38 200 60"/><path d="M190 58L200 60L199 50"/></g>`,

      'panda-bambu': (u) => `${sky(u, '#d8efd0', '#f3faee')}
        <g fill="#9fd06e">${[30, 62, 212, 246].map((x, i) => `<rect x="${x}" y="-4" width="9" height="184" rx="4" fill="${i % 2 ? '#8cc35c' : '#a6d677'}"/>`).join('')}</g>
        <g stroke="#6faa45" stroke-width="2.4">${[30, 62, 212, 246].map((x) => `<path d="M${x} 40h9M${x} 92h9M${x} 140h9"/>`).join('')}</g>
        <g fill="#7fbf4f"><path d="M39 38Q60 24 70 34Q54 44 39 38Z"/><path d="M30 90Q8 78 2 90Q18 98 30 90Z"/><path d="M212 54Q190 40 182 52Q198 62 212 54Z"/><path d="M255 110Q276 98 284 108Q268 118 255 110Z"/><path d="M71 130Q92 118 100 128Q84 138 71 130Z"/></g>
        <path d="M0 160Q138 150 276 160V176H0Z" fill="#8fbf62"/>
        ${at(140, 168, 1.12, panda)}`,

      'eco-desierto': (u) => `${sky(u, '#fbd99b', '#fff3d9')}${sun(214, 44, 20)}
        <path d="M0 108Q50 86 104 102Q160 80 214 100Q248 90 276 98V176H0Z" fill="#efc27c"/>
        <path d="M0 132Q70 104 150 124Q210 108 276 124V176H0Z" fill="#e7ae5f"/>
        <path d="M0 152Q90 130 170 150Q230 140 276 150V176H0Z" fill="#f4d08e"/>
        <path d="M40 150Q90 140 130 147" stroke="#e7b768" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${at(130, 124, 1.05, camel)}${at(36, 158, 0.85, cactus)}${at(240, 158, 1, rock(26, 12, '#c48d5a', '#a8743f'))}`,

      'eco-oceano': (
        u,
      ) => `<defs><linearGradient id="${u}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#47a9dc"/><stop offset="1" stop-color="#1a5f96"/></linearGradient></defs>
        <rect width="276" height="176" fill="url(#${u}sea)"/>
        <g fill="#fff" fill-opacity=".1"><path d="M40 0H70L40 176H10Z"/><path d="M120 0H140L130 176H96Z"/><path d="M210 0H236L250 176H214Z"/></g>
        <path d="M0 150Q70 138 140 148T276 146V176H0Z" fill="#e6cf95"/>
        <g fill="#f07a8a"><path d="M40 150V120M40 132L28 116M40 128L52 110M28 116V104M52 110L60 100" stroke="#f07a8a" stroke-width="6" stroke-linecap="round"/></g>
        <path d="M228 150Q214 122 236 116Q258 110 256 136Q254 150 244 150Z" fill="#f6a04d"/><path d="M232 128Q240 120 248 128M234 138Q242 130 250 138" stroke="#d9822e" stroke-width="2" fill="none"/>
        <path d="M86 152Q80 132 90 116Q98 102 90 88" stroke="#3f9a5a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M98 152Q104 136 98 122" stroke="#56b06a" stroke-width="4" fill="none" stroke-linecap="round"/>
        ${at(176, 92, 1.4, seahorse)}${at(60, 64, 1, fish('#ffb03a', '#fff'))}${at(232, 58, 0.8, fish('#6fd3ee', '#2d86b8'), true)}${at(118, 116, 0.7, fish('#ffd25a', '#f08a3a'))}
        <g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"><circle cx="196" cy="44" r="3"/><circle cx="202" cy="30" r="2.2"/><circle cx="194" cy="18" r="1.6"/></g>`,

      'eco-parque': (u) => `${sky(u, '#cbe8f6', '#f0f9fb')}${cloud(60, 34, 0.9)}
        <path d="M0 86H276V176H0Z" fill="#a9d474"/>
        ${at(36, 92, 1.05, leafy('#5ea94a', '#4b9340'))}${at(232, 92, 1.2, leafy('#6ab450', '#549d44'))}
        <path d="M0 84H276" stroke="#7a9a5a" stroke-width="1"/>
        <g stroke="#a7795a" stroke-width="2.4"><path d="M0 98H70M0 104H70"/></g><g fill="#a7795a">${[6, 22, 38, 54].map((x) => `<rect x="${x}" y="92" width="4" height="16" rx="1"/>`).join('')}</g>
        <path d="M150 176Q130 150 160 132Q190 116 176 98Q166 88 196 84" stroke="#ead7a4" stroke-width="22" fill="none" stroke-linecap="round"/>
        <path d="M150 176Q130 150 160 132Q190 116 176 98Q166 88 196 84" stroke="#f3e5bd" stroke-width="16" fill="none" stroke-linecap="round"/>
        <rect x="200" y="112" width="40" height="5" rx="2" fill="#a8703f"/><rect x="200" y="104" width="40" height="4" rx="2" fill="#a8703f"/><path d="M204 117v10M236 117v10" stroke="#6e4a2c" stroke-width="3"/>
        <path d="M110 98V44" stroke="#5c6970" stroke-width="3"/><path d="M104 46H116L113 36H107Z" fill="#5c6970"/><circle cx="110" cy="48" r="3.4" fill="#ffe28a"/>
        <ellipse cx="62" cy="150" rx="46" ry="14" fill="#8a5a33"/><ellipse cx="62" cy="148" rx="42" ry="11" fill="#9b6a3d"/>
        ${[
          [28, 152, '#e2453c'],
          [42, 146, '#ffd25a'],
          [56, 154, '#b06ad8'],
          [70, 146, '#e2453c'],
          [84, 152, '#ffd25a'],
          [98, 148, '#f48fb1'],
        ]
          .map(([x, y, c]) => at(Number(x), Number(y), 1, flower(String(c))))
          .join('')}
        ${at(244, 158, 1.2, squirrel)}`,

      excursion: (u) => `${sky(u, '#c6e6f6', '#eef8fb')}
        <path d="M0 70L40 40L70 58L110 30L150 60L190 44L230 62L276 46V96H0Z" fill="#a8b9c2"/>
        <path d="M0 78Q138 64 276 78V176H0Z" fill="#9fcf6a"/>
        ${[14, 40, 64, 196, 224, 252].map((x, i) => at(x, 92 + (i % 2) * 6, 0.62 + (i % 3) * 0.08, pine('#3f8a4a', '#2f6e3c'))).join('')}
        <ellipse cx="208" cy="126" rx="58" ry="16" fill="#4e9fcf"/><ellipse cx="204" cy="122" rx="46" ry="9" fill="#6cbade"/>
        <path d="M160 84Q170 98 164 106Q158 114 168 121H190Q176 112 179 104Q184 94 165 84Z" fill="#4e9fcf"/>
        <path d="M0 160Q60 148 96 156Q130 164 150 176H0Z" fill="#e9d6a4"/>
        ${at(98, 96, 0.58, leafy('#5ea94a', '#4b9340'))}${at(256, 160, 0.7, leafy('#5ea94a', '#4b9340'))}
        <g transform="translate(72 166)"><rect x="-26" y="-58" width="5" height="58" fill="#8a5a33"/><rect x="21" y="-58" width="5" height="58" fill="#8a5a33"/>
          <rect x="-34" y="-74" width="68" height="40" rx="5" fill="#b07a45"/><rect x="-29" y="-69" width="58" height="30" rx="3" fill="#d9ecc2"/>
          <path d="M-22 -48Q-10 -60 0 -52Q10 -44 22 -58" stroke="#4e9fcf" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="14" cy="-46" rx="8" ry="4" fill="#4e9fcf"/>
          <g fill="#3f8a4a"><circle cx="-18" cy="-60" r="3.4"/><circle cx="-8" cy="-63" r="3"/><circle cx="6" cy="-62" r="3.4"/><circle cx="-14" cy="-44" r="3"/></g>
          <path d="M-20 -42l4 -4 4 4" stroke="#e2453c" stroke-width="1.8" fill="none"/></g>
        <g transform="translate(36 166)"><rect x="-8" y="-20" width="16" height="20" rx="2" fill="#5c6970"/><rect x="-9.5" y="-23" width="19" height="4" rx="2" fill="#46525a"/></g>
        ${at(128, 168, 1.05, girl)}`,

      covadonga: (u) => `${sky(u, '#bfe2f4', '#eaf6fb')}${cloud(220, 30, 0.8)}
        <path d="M0 110L30 58L52 76L86 22L118 70L140 52L176 16L214 74L238 54L276 92V130H0Z" fill="#b9c1c6"/>
        <path d="M86 22L100 56L92 92L118 70ZM176 16L190 50L180 98L214 74ZM30 58L40 80L34 104L52 76Z" fill="#949da3"/>
        <path d="M86 22L76 38L84 36L90 42L96 34L100 40ZM176 16L164 34L172 32L178 40L186 30L190 36ZM30 58L24 70L32 68L36 72Z" fill="#fff"/>
        <path d="M0 112Q40 98 80 108Q140 92 200 106Q240 98 276 108V176H0Z" fill="#7fbf5a"/>
        <path d="M0 132Q138 118 276 132V176H0Z" fill="#94cc66"/>
        <ellipse cx="150" cy="140" rx="74" ry="17" fill="#3f8fbf"/><ellipse cx="146" cy="136" rx="58" ry="9" fill="#62acd6"/>
        <path d="M118 138l12 -8 12 8M162 140l10 -6 10 6" stroke="#9fd0ea" stroke-width="1.6" fill="none"/>
        ${at(36, 128, 0.6, pine('#3f8a4a', '#2f6e3c'))}${at(54, 132, 0.5, pine('#3f8a4a', '#2f6e3c'))}${at(250, 130, 0.62, pine('#3f8a4a', '#2f6e3c'))}
        ${at(64, 168, 0.95, cow)}${at(234, 166, 0.85, cow, true)}`,

      'rock-obsidiana': (u) =>
        specimen(
          u,
          '#e9edf2',
          `
        <path d="M62 128L86 70L128 50L180 58L214 94L204 132L160 148L100 146Z" fill="#17181e"/>
        <path d="M86 70L128 50L136 96L96 110Z" fill="#2f333d"/><path d="M128 50L180 58L170 98L136 96Z" fill="#23262e"/>
        <path d="M180 58L214 94L170 98Z" fill="#3a3f4b"/><path d="M96 110L136 96L160 148L100 146Z" fill="#101116"/>
        <path d="M136 96L170 98L204 132L160 148Z" fill="#1c1e25"/>
        <g fill="none" stroke="#5a6272" stroke-width="1.4"><path d="M100 128Q116 112 132 124"/><path d="M150 110Q168 104 182 116"/><path d="M106 84Q118 70 132 76"/></g>
        <path d="M96 78L120 62" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M144 66L164 64" stroke="#cfe3ff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <path d="M186 74L200 90" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/><circle cx="118" cy="104" r="2" fill="#fff" opacity=".7"/>`,
        ),

      'rock-arenisca': (u) =>
        specimen(
          u,
          '#f3ece2',
          `
        <clipPath id="${u}rk"><path d="M60 130Q56 88 90 74L170 64Q212 68 216 102L214 132Q210 148 180 150L92 152Q62 150 60 130Z"/></clipPath>
        <g clip-path="url(#${u}rk)"><rect x="40" y="50" width="200" height="110" fill="#d7774a"/>
          <path d="M40 92Q100 82 150 88T240 84V100Q190 102 150 104T40 108Z" fill="#e4915e"/>
          <path d="M40 118Q90 112 140 118T240 114V126Q190 128 140 130T40 132Z" fill="#c4653c"/>
          <path d="M40 74Q100 64 150 70T240 66V74Q190 78 150 80T40 82Z" fill="#b8583a" opacity=".7"/>
          <path d="M40 140Q100 134 150 140T240 138V160H40Z" fill="#b9573a"/>
          <g fill="#f3b88d">${dots(u, 70, 60, 216, 150, 1.2)}</g></g>
        <path d="M60 130Q56 88 90 74L170 64Q212 68 216 102L214 132Q210 148 180 150L92 152Q62 150 60 130Z" fill="none" stroke="#9a4a2e" stroke-opacity=".35" stroke-width="2"/>`,
        ),

      'rock-marmol': (u) =>
        specimen(
          u,
          '#e8eef0',
          `
        <path d="M66 124Q60 82 104 70Q150 58 192 72Q218 86 212 120Q206 148 160 150H104Q70 148 66 124Z" fill="#f8f7f3"/>
        <path d="M70 128Q100 146 160 146Q200 144 210 120Q206 148 160 152H104Q74 150 70 128Z" fill="#e2e0da"/>
        <g fill="none" stroke="#b8bcc4" stroke-linecap="round"><path d="M84 92Q110 100 120 120T150 144" stroke-width="1.8"/><path d="M120 120Q140 110 170 116T206 108" stroke-width="1.2"/>
          <path d="M140 70Q150 86 176 90" stroke-width="1.3"/><path d="M96 130Q104 124 112 132" stroke-width="1"/></g>
        <path d="M100 80Q130 70 164 74" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>`,
        ),

      'rock-granito': (u) =>
        specimen(
          u,
          '#efece6',
          `
        <clipPath id="${u}rk"><path d="M64 126Q58 84 98 70Q146 56 190 70Q220 84 214 118Q208 148 162 150H104Q68 148 64 126Z"/></clipPath>
        <g clip-path="url(#${u}rk)"><rect x="50" y="50" width="180" height="110" fill="#cfc9c4"/>
          <g fill="#e3a597">${flecks('p', 56, 56, 220, 156, 6, 46)}</g><g fill="#f7f6f2">${flecks('w', 56, 56, 220, 156, 4.6, 60)}</g>
          <g fill="#2b2b30">${flecks('b', 56, 56, 220, 156, 3.2, 90)}</g>
          <path d="M64 136Q120 154 214 126V160H50Z" fill="#000" fill-opacity=".1"/></g>
        <path d="M98 78Q130 66 166 70" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".7"/>`,
        ),

      'levadura-pan': (u) => `${sky(u, '#fbf1df', '#f6e6cb')}
        <g stroke="#ecd9b8" stroke-width="1.2">${[40, 80, 120].map((y) => `<path d="M0 ${y}H276"/>`).join('')}${[46, 92, 138, 184, 230].map((x) => `<path d="M${x} 0V120"/>`).join('')}</g>
        <path d="M14 130H262Q268 130 268 136V156Q268 162 262 162H14Q8 162 8 156V136Q8 130 14 130Z" fill="#c98a4e"/><path d="M8 150H268V156Q268 162 262 162H14Q8 162 8 156Z" fill="#a8703f"/>
        <path d="M24 140h60M120 146h80M210 138h40" stroke="#b67a40" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M36 132Q32 76 104 70Q176 76 172 132Z" fill="#d0904a"/><path d="M44 130Q42 86 104 80Q166 86 164 130Z" fill="#dba25c"/>
        <g stroke="#f3d79a" stroke-width="5" stroke-linecap="round" fill="none"><path d="M66 96Q78 88 88 100"/><path d="M96 88Q108 80 118 92"/><path d="M126 96Q138 88 148 100"/></g>
        <path d="M184 132L186 104Q188 98 196 98H232Q240 98 240 104L242 132Z" fill="#fbf4e2" stroke="#e5d6b4" stroke-width="1.5"/>
        <path d="M194 132V108H234V132Z" fill="#ead9a8"/><path d="M194 108L200 102H240L234 108Z" fill="#f3e6bf"/><path d="M234 108L240 102V126L234 132Z" fill="#d6c38c"/>
        <g fill="#e3d09c"><circle cx="252" cy="128" r="3.4"/><circle cx="246" cy="132" r="2.4"/><circle cx="258" cy="133" r="2"/></g>
        <g fill="#fff" opacity=".7"><circle cx="30" cy="140" r="1.4"/><circle cx="182" cy="144" r="1.2"/><circle cx="170" cy="138" r="1"/></g>`,

      'pan-moho': (u) => `${sky(u, '#eef3ea', '#e0e9dd')}
        <path d="M44 22H232Q244 22 244 34V160H32V34Q32 22 44 22Z" fill="#fff" fill-opacity=".35" stroke="#c9d6d3" stroke-width="2"/>
        <path d="M32 40H244" stroke="#9cb9c6" stroke-width="4"/><path d="M52 32L60 150" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>
        <path d="M76 150V78Q76 46 108 44Q124 30 140 30Q156 30 170 44Q202 46 202 78V150Z" fill="#c98a47"/>
        <path d="M86 146V80Q86 56 112 54Q126 42 140 42Q154 42 166 54Q192 56 192 80V146Z" fill="#f3dca4"/>
        <g fill="#7fae8a"><path d="M104 74Q112 62 126 70Q138 74 130 88Q118 96 108 90Q98 84 104 74Z"/><path d="M146 104Q156 94 170 102Q178 114 166 122Q150 126 146 116Z"/><path d="M98 124Q108 116 118 124Q120 134 108 136Q98 134 98 124Z"/></g>
        <g fill="#4f7a5c"><circle cx="116" cy="78" r="3.4"/><circle cx="122" cy="84" r="2.4"/><circle cx="160" cy="110" r="3.6"/><circle cx="166" cy="116" r="2"/><circle cx="106" cy="128" r="2.6"/></g>
        <g fill="#c7e2c9"><circle cx="110" cy="72" r="2"/><circle cx="128" cy="76" r="1.6"/><circle cx="152" cy="102" r="2"/><circle cx="172" cy="108" r="1.6"/></g>
        <g fill="#9fd0ea" opacity=".9"><path d="M214 66q4 6 0 9q-4 -3 0 -9Z"/><path d="M222 96q4 6 0 9q-4 -3 0 -9Z"/><path d="M50 112q4 6 0 9q-4 -3 0 -9Z"/><path d="M212 130q3.4 5 0 7.6q-3.4 -2.6 0 -7.6Z"/></g>`,

      'seta-roja': (
        u,
      ) => `<defs><radialGradient id="${u}fo" cx=".55" cy=".35" r=".8"><stop offset="0" stop-color="#7cb46a"/><stop offset="1" stop-color="#2f5d3c"/></radialGradient></defs>
        <rect width="276" height="176" fill="url(#${u}fo)"/>
        <g fill="#24492f" opacity=".6"><rect x="16" y="0" width="16" height="130"/><rect x="226" y="0" width="22" height="130"/></g>
        <path d="M0 136Q70 120 140 130T276 128V176H0Z" fill="#5b8f3e"/><path d="M0 150Q90 138 180 148T276 146V176H0Z" fill="#6ea24a"/>
        <g fill="#c98a3a"><path d="M40 154q10 -8 20 0q-10 6 -20 0Z" transform="rotate(-14 50 154)"/><path d="M206 160q10 -8 20 0q-10 6 -20 0Z" transform="rotate(10 216 160)"/></g>
        <g fill="#e0a840"><path d="M220 140q8 -7 16 0q-8 5 -16 0Z"/></g>
        ${at(142, 156, 3, toadstool())}${at(84, 154, 1.4, toadstool())}
        ${at(110, 160, 1, grass(21, '#4f8f33'))}${at(176, 160, 1, grass(13, '#4f8f33'))}`,

      algas: (
        u,
      ) => `<defs><linearGradient id="${u}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb6d9"/><stop offset="1" stop-color="#22709f"/></linearGradient></defs>
        <rect width="276" height="176" fill="url(#${u}sea)"/>
        <g fill="#fff" fill-opacity=".1"><path d="M60 0H84L66 176H36Z"/><path d="M180 0H200L214 176H184Z"/></g>
        <path d="M0 148Q70 136 140 146T276 144V176H0Z" fill="#dcc795"/>
        ${at(40, 152, 1, rock(54, 26, '#8d9aa0', '#6f7b82'))}${at(222, 150, 1, rock(64, 30, '#8d9aa0', '#6f7b82'))}
        <g fill="none" stroke-linecap="round">
          <path d="M70 150Q58 120 72 94Q84 70 72 30" stroke="#8a7a2f" stroke-width="7"/><path d="M84 150Q96 118 86 88Q78 62 90 38" stroke="#9f8f3a" stroke-width="6"/>
          <path d="M214 124Q204 100 214 80Q224 60 214 42" stroke="#8a7a2f" stroke-width="6"/></g>
        <g fill="#a59436"><ellipse cx="66" cy="96" rx="9" ry="4" transform="rotate(-30 66 96)"/><ellipse cx="80" cy="60" rx="9" ry="4" transform="rotate(30 80 60)"/><ellipse cx="94" cy="100" rx="8" ry="3.6" transform="rotate(30 94 100)"/><ellipse cx="208" cy="76" rx="8" ry="3.6" transform="rotate(-30 208 76)"/></g>
        <path d="M120 150Q112 136 124 128Q118 116 132 112Q144 116 140 128Q152 136 144 150Z" fill="#5fb86a"/><path d="M128 148Q130 132 132 118" stroke="#3f9a4a" stroke-width="1.6" fill="none"/>
        <g stroke="#c94a5a" stroke-width="3" stroke-linecap="round" fill="none"><path d="M170 150V128M170 136L160 122M170 132L180 116M160 122L156 112M180 116L186 108M180 116L176 106"/></g>
        <g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"><circle cx="100" cy="44" r="3"/><circle cx="104" cy="28" r="2.2"/><circle cx="190" cy="60" r="2.4"/></g>`,

      bacterias: (u) => {
        const r = rnd(42);
        let rods = '';
        for (let i = 0; i < 16; i++) {
          const x = 70 + (i % 4) * 38 + (r() - 0.5) * 22;
          const y = 32 + Math.floor(i / 4) * 34 + (r() - 0.5) * 18;
          const a = Math.round(r() * 180);
          const len = 18 + r() * 12;
          const c = i % 3 ? '#9b59b6' : '#b47ccc';
          rods += `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})">${i % 5 === 0 ? `<path d="M${f(len / 2)} 0q5 -4 9 0t9 0" stroke="#7d4596" stroke-width="1.2" fill="none"/>` : ''}<rect x="${f(-len / 2)}" y="-4.5" width="${f(len)}" height="9" rx="4.5" fill="${c}" stroke="#6f3f87" stroke-width="1.2"/><rect x="${f(-len / 2 + 3)}" y="-2.5" width="${f(len * 0.4)}" height="2" rx="1" fill="#fff" opacity=".35"/></g>`;
        }
        return microscope(u, '#f0e6f2', rods);
      },

      ameba: (u) =>
        microscope(
          u,
          '#e3efd8',
          `<g transform="translate(128 88) scale(.84) translate(-134 -86)"><path d="M96 80Q70 70 62 52Q58 40 70 44Q86 50 104 62Q114 46 134 50Q150 26 166 28Q176 32 164 48Q160 58 172 70Q198 82 206 108Q208 120 196 114Q182 106 170 110Q164 132 150 140Q136 146 132 132Q118 128 108 118Q92 128 80 124Q70 118 84 106Q90 96 96 80Z" fill="#c4dfa6" fill-opacity=".85" stroke="#7fa866" stroke-width="2"/>
           <path d="M108 82Q112 64 134 62Q156 56 160 74Q176 86 170 102Q160 120 142 122Q120 120 110 108Q100 96 108 82Z" fill="#d6eac0" fill-opacity=".7"/>
           <circle cx="140" cy="88" r="14" fill="#a3bb78" stroke="#6f8f4a" stroke-width="2"/><circle cx="143" cy="86" r="5" fill="#7d9a52"/>
           <g fill="#f4faea" stroke="#9cbf84" stroke-width="1.2"><circle cx="112" cy="96" r="6"/><circle cx="164" cy="98" r="4.6"/><circle cx="128" cy="66" r="4"/></g>
           <g fill="#6f8f4a">${dots(u, 100, 70, 176, 116, 1.2, 30)}</g></g>
           <g fill="#b8d49a" opacity=".6"><circle cx="64" cy="140" r="4"/><circle cx="196" cy="40" r="3"/><circle cx="74" cy="44" r="2.4"/></g>`,
        ),

      grifo: (u) => `${sky(u, '#e6f3f8', '#d7eaf1')}
        <g stroke="#c4dde8" stroke-width="1.6">${[30, 60, 90].map((y) => `<path d="M0 ${y}H276"/>`).join('')}${[40, 80, 120, 160, 200, 240].map((x) => `<path d="M${x} 0V110"/>`).join('')}</g>
        <path d="M20 110H256V122H20Z" fill="#fbfdfe"/><path d="M20 122H256V126H20Z" fill="#d9e6ec"/>
        <path d="M60 122H216Q210 168 138 170Q66 168 60 122Z" fill="#fff"/><path d="M76 126H200Q192 156 138 158Q84 156 76 126Z" fill="#e9f2f6"/>
        <ellipse cx="138" cy="146" rx="7" ry="3" fill="#b9c8cf"/>
        <defs><linearGradient id="${u}cr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9aa8b0"/><stop offset=".45" stop-color="#f4f8fa"/><stop offset="1" stop-color="#8896a0"/></linearGradient></defs>
        <rect x="128" y="76" width="20" height="36" rx="4" fill="url(#${u}cr)"/>
        <path d="M134 80Q134 56 160 56H174Q182 56 182 64V74H170V68H160Q148 68 148 80Z" fill="url(#${u}cr)"/>
        <rect x="120" y="58" width="36" height="9" rx="4.5" fill="url(#${u}cr)"/><circle cx="138" cy="62" r="5" fill="#4ea5d9"/>
        <path d="M176 84q5 8 0 12q-5 -4 0 -12Z" fill="#4ea5d9"/><path d="M176 102q4 6 0 9q-4 -3 0 -9Z" fill="#4ea5d9" opacity=".7"/>
        <rect x="216" y="80" width="26" height="32" rx="4" fill="#ffb03a"/><rect x="216" y="80" width="26" height="6" rx="3" fill="#f59a1c"/>
        <path d="M224 82L218 34" stroke="#3f8fc9" stroke-width="5" stroke-linecap="round"/><rect x="212" y="20" width="8" height="16" rx="3" fill="#fff" stroke="#b9c8cf" transform="rotate(-7 216 28)"/>
        <path d="M236 82L240 48" stroke="#e2453c" stroke-width="5" stroke-linecap="round"/>
        <g transform="rotate(-8 40 104)"><rect x="24" y="98" width="38" height="11" rx="5.5" fill="#fff" stroke="#c9d6dc"/><rect x="56" y="99.5" width="8" height="8" rx="2" fill="#3fae6a"/><path d="M28 98Q34 92 42 96" stroke="#3fae6a" stroke-width="3" fill="none" stroke-linecap="round"/></g>`,
    };

    /** Small round grains spread over a box (deterministic): sand, granite crystals, cell granules. */
    function dots(/** @type {string} */ seed, x0, y0, x1, y1, r = 1.4, n = 60) {
      let s = 7;
      for (const c of seed) s = (s * 31 + c.charCodeAt(0)) % 2147483647;
      const g = rnd(s || 1);
      let out = '';
      for (let i = 0; i < n; i++)
        out += `<circle cx="${f(x0 + g() * (x1 - x0))}" cy="${f(y0 + g() * (y1 - y0))}" r="${f(r * (0.6 + g() * 0.7))}"/>`;
      return out;
    }

    /** Small angular crystals (granite): quadrilaterals spread over a box, deterministic. */
    function flecks(/** @type {string} */ seed, x0, y0, x1, y1, size = 4, n = 40) {
      const g = rnd(seed.charCodeAt(0) * 977 + n);
      let out = '';
      for (let i = 0; i < n; i++) {
        const x = x0 + g() * (x1 - x0);
        const y = y0 + g() * (y1 - y0);
        const s = size * (0.5 + g() * 0.7);
        const pts = [0, 1, 2, 3].map((k) => {
          const a = (k / 4) * Math.PI * 2 + g() * 0.9;
          const r = s * (0.55 + g() * 0.5);
          return `${f(x + Math.cos(a) * r)},${f(y + Math.sin(a) * r * 0.8)}`;
        });
        out += `<polygon points="${pts.join(' ')}"/>`;
      }
      return out;
    }

    /** A rock on a soft spot of the notebook page (the rock drawings fill about 56..216 × 50..152). */
    function specimen(/** @type {string} */ u, /** @type {string} */ bg, /** @type {string} */ inner) {
      return `<rect width="276" height="176" fill="${bg}"/>
        <g stroke="#000" stroke-opacity=".05">${[22, 44, 66, 88, 110, 132, 154].map((y) => `<path d="M0 ${y}H276"/>`).join('')}${[23, 46, 69, 92, 115, 138, 161, 184, 207, 230, 253].map((x) => `<path d="M${x} 0V176"/>`).join('')}</g>
        <ellipse cx="138" cy="156" rx="86" ry="10" fill="#000" fill-opacity=".12"/>
        <g transform="translate(0 2)">${inner}</g>`;
    }

    const TILT = [-2, 1.5, -1, 2];
    const art = (/** @type {string} */ key) => {
      const draw = key && ART[key];
      if (!draw) return null;
      const u = uid();
      const n = Object.keys(ART).indexOf(key);
      return svgEl('0 0 320 224', card(u, draw(u), TILT[n % TILT.length], n), 'art-svg cn-card');
    };

    // ---------------- Label scenes ----------------
    // scene(name) → ExamScene: x/y = slot centre, w = slot width (viewBox units); `at` = where the slot's leader line points.
    const leader = (/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2) =>
      `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#24402f" stroke-width="2.6" stroke-dasharray="1 5.5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6" fill="#d9473b" stroke="#fff" stroke-width="2.5"/>`;
    const sceneOf = (
      /** @type {string} */ inner,
      /** @type {{ id: string, x: number, y: number, w: number, at: number[] }[]} */ spots,
      /** @type {string} */ cls,
    ) => {
      const lines = spots.map((s) => leader(s.x, s.y, s.at[0], s.at[1])).join('');
      const el = svgEl('0 0 600 400', `<rect width="600" height="400" rx="18" fill="#fffdf6"/>${inner}${lines}`, `scene-svg ${cls}`);
      return { el, box: /** @type {[number, number]} */ ([600, 400]), spots, cls };
    };
    // Clip the whole drawing to a rounded card.
    const framed = (/** @type {string} */ u, /** @type {string} */ inner) =>
      `<defs><clipPath id="${u}fr"><rect width="600" height="400" rx="18"/></clipPath></defs><g clip-path="url(#${u}fr)">${inner}</g>
       <rect x="1" y="1" width="598" height="398" rx="17" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
    const arrowHead = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ deg, /** @type {string} */ c) =>
      `<path d="M-9 -7L2 0L-9 7" transform="translate(${x} ${y}) rotate(${deg})" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

    /** @type {Record<string, () => ExamScene>} */
    const SCENES = {
      // A desert ecosystem (book p.12): living things, the physical setting and two relations drawn as dashed arrows.
      // Only the relaciones spot points at an arrow (snake → lizard); seres-vivos points at the vulture, away from both.
      componentes() {
        const u = uid();
        const snake = `<path d="M-40 0Q-30 -14 -16 -6Q-2 2 10 -8Q22 -18 32 -10" stroke="#7d9a3a" stroke-width="9" fill="none" stroke-linecap="round"/>
          <path d="M-40 0Q-30 -14 -16 -6Q-2 2 10 -8Q22 -18 32 -10" stroke="#a9c25a" stroke-width="3" stroke-dasharray="3 6" fill="none" stroke-linecap="round"/>
          <ellipse cx="36" cy="-12" rx="8" ry="5.6" fill="#7d9a3a"/><circle cx="38" cy="-14" r="1.6" fill="#1f2a22"/><path d="M44 -12l6 -1M44 -12l6 2" stroke="#d9473b" stroke-width="1.2"/>`;
        const lizard = `<path d="M-30 -2Q-16 -6 -6 -4" stroke="#c78a3a" stroke-width="4" fill="none" stroke-linecap="round"/>
          <ellipse cx="2" cy="-5" rx="12" ry="5" fill="#d99a48"/><ellipse cx="17" cy="-7" rx="6" ry="4" fill="#d99a48"/><circle cx="19" cy="-8.4" r="1.2" fill="#1f2a22"/>
          <path d="M-4 -2l-5 6M8 -2l4 6M-2 -8l-6 -5M8 -9l5 -5" stroke="#c78a3a" stroke-width="2.4" stroke-linecap="round"/><g fill="#a86a26"><circle cx="-2" cy="-6" r="1.2"/><circle cx="5" cy="-4" r="1.2"/></g>`;
        const vulture = `<path d="M0 0Q-22 -16 -58 -8Q-40 -4 -30 2Q-46 4 -54 12Q-28 10 -8 6Z" fill="#4a3f3a"/><path d="M0 0Q22 -16 58 -8Q40 -4 30 2Q46 4 54 12Q28 10 8 6Z" fill="#3f3530"/>
          <ellipse cx="0" cy="4" rx="9" ry="12" fill="#5a4c44"/><circle cx="0" cy="-10" r="5" fill="#e8b4a0"/><path d="M-2 -8l2 6 2 -6" fill="#c9a24a"/><path d="M-6 -4Q0 0 6 -4" stroke="#efe6d4" stroke-width="3" fill="none"/>`;
        const inner = `<defs><linearGradient id="${u}ds" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe1f1"/><stop offset="1" stop-color="#fbe6c0"/></linearGradient></defs>
          <rect width="600" height="400" fill="url(#${u}ds)"/>${sun(516, 70, 32)}${cloud(380, 66, 1.1)}
          <path d="M0 230L40 230L52 190H128L140 230H220L232 206H270L282 236H600V400H0Z" fill="#d9965f"/>
          <path d="M52 190H128L134 210H58Z" fill="#c47c46"/><path d="M232 206H270L274 216H236Z" fill="#c47c46"/>
          <path d="M0 252Q120 228 260 248Q420 226 600 250V400H0Z" fill="#efc785"/>
          <path d="M0 300Q160 274 320 300Q470 282 600 296V400H0Z" fill="#f5d596"/>
          <path d="M80 320Q140 310 190 318M360 330Q420 320 470 326" stroke="#e6b86c" stroke-width="3" fill="none" stroke-linecap="round"/>
          ${at(214, 338, 1, rock(96, 48, '#c9a27a', '#a8825c'))}${at(268, 346, 1, rock(48, 26, '#bf9670', '#9c7652'))}${at(560, 340, 1, rock(56, 28, '#c9a27a', '#a8825c'))}
          ${at(430, 344, 2.3, cactus)}${at(520, 352, 1.1, cactus)}
          ${at(210, 292, 1.3, lizard)}${at(96, 372, 1.25, snake)}
          ${at(196, 96, 1.2, vulture)}
          <g fill="none" stroke="#d9473b" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="9 8">
            <path d="M488 98Q470 130 456 162"/><path d="M164 356Q170 320 188 300"/></g>
          ${arrowHead(456, 162, 112, '#d9473b')}${arrowHead(188, 300, -52, '#d9473b')}`;
        return sceneOf(
          framed(u, inner),
          [
            { id: 'seres-vivos', x: 350, y: 124, w: 160, at: [214, 104] },
            { id: 'medio-fisico', x: 370, y: 364, w: 160, at: [244, 330] },
            { id: 'relaciones', x: 96, y: 250, w: 160, at: [170, 334] },
          ],
          'cn-scene',
        );
      },

      // From the mountains to the sea (book p.16): a mountain range, one big mountain, a plain with a river, a cliff and a beach.
      relieve() {
        const u = uid();
        const inner = `<defs><linearGradient id="${u}rs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe2f4"/><stop offset="1" stop-color="#eef8fb"/></linearGradient>
          <linearGradient id="${u}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb3dd"/><stop offset="1" stop-color="#2f7fc0"/></linearGradient></defs>
          <rect width="600" height="400" fill="url(#${u}rs)"/>${cloud(420, 54, 1.2)}${cloud(150, 40, 0.9)}
          <path d="M0 200L36 128L62 150L96 96L128 146L156 112L190 160L218 132L252 190L270 210H0Z" fill="#a9b6bd"/>
          <path d="M96 96L106 128L98 170L128 146ZM36 128L46 152L40 180L62 150ZM156 112L166 136L160 170L190 160ZM218 132L226 156L222 180L252 190Z" fill="#8797a0"/>
          <path d="M96 96L86 114L94 112L100 118L106 110L110 116ZM36 128L30 140L38 138L42 142ZM156 112L148 126L156 124L160 130L166 122Z" fill="#fff"/>
          <path d="M250 214L330 64L410 214Z" fill="#9aa7ae"/><path d="M330 64L350 122L338 214H410Z" fill="#7f8e97"/>
          <path d="M330 64L314 94L324 90L330 98L338 88L346 96Z" fill="#fff"/>
          <path d="M0 206Q120 192 250 204Q350 196 600 200V400H0Z" fill="#8cc35e"/>
          <path d="M0 250Q160 236 330 246Q420 240 600 246V400H0Z" fill="#a8d474"/>
          <g stroke="#93c463" stroke-width="2.2">${[262, 286, 312, 340, 368].map((y, i) => `<path d="M${30 + i * 6} ${y}H${300 - i * 10}"/>`).join('')}</g>
          <path d="M446 214L456 192Q520 184 600 188V216Z" fill="#7fbf5a"/>
          <path d="M452 212H600V306H470Q462 260 452 212Z" fill="#b4a08a"/><path d="M540 212H600V306H548Z" fill="#9c8872"/>
          <path d="M458 236H600M462 258H600M466 282H600" stroke="#8a7864" stroke-width="2.4"/>
          <path d="M600 298V400H392Q430 360 466 302Z" fill="url(#${u}sea)"/>
          <path d="M470 312q12 -6 24 0M512 306q12 -6 24 0M556 310q12 -6 24 0M470 352q12 -6 24 0M530 362q12 -6 24 0" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".75"/>
          <path d="M466 302L478 300M520 302L534 300" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          <path d="M290 400Q360 344 444 310L466 302Q430 360 392 400Z" fill="#f2dc9e"/><path d="M392 400Q430 360 466 302" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".85"/>
          <path d="M100 170Q120 204 96 222Q70 244 140 262Q220 282 230 320Q240 356 330 372Q370 380 400 396" stroke="#4e9fcf" stroke-width="12" fill="none" stroke-linecap="round"/>
          ${[50, 70, 360, 380, 400].map((x, i) => at(x, 236 + (i % 2) * 6, 0.55, pine('#3f8a4a', '#2f6e3c'))).join('')}
          <g fill="#c96f4a"><rect x="292" y="266" width="18" height="14"/><rect x="314" y="270" width="14" height="10"/></g><path d="M288 268L301 256L314 268M312 272L321 263L330 272" fill="#a8503a"/>`;
        return sceneOf(
          framed(u, inner),
          [
            { id: 'cordillera', x: 104, y: 50, w: 150, at: [96, 108] },
            { id: 'montana', x: 330, y: 30, w: 150, at: [330, 82] },
            { id: 'acantilado', x: 512, y: 120, w: 156, at: [520, 250] },
            { id: 'llanura', x: 100, y: 318, w: 150, at: [170, 288] },
            { id: 'playa', x: 262, y: 372, w: 130, at: [384, 366] },
          ],
          'cn-scene',
        );
      },
    };
    const scene = (/** @type {string} */ name) => (SCENES[name] ? SCENES[name]() : null);

    // ---------------- Hub hero: the pond under a glass dome ----------------
    // A passed station (its best round gave 2+ stars, KF.gameData(slug).st) paints its part; the others are flat silhouettes,
    // like the empty slots of the football-card album.
    const passedIds = () => {
      const unit = window.CN_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return new Set((unit?.stations || []).filter((s) => (Number(st[s.id]?.stars) || 0) >= 2).map((s) => s.id));
    };
    const DOME = 'M16 284V152C16 64 88 16 180 16S344 64 344 152V284Z';
    const butterfly = (/** @type {string} */ c, /** @type {string} */ body) =>
      `<path d="M0 0Q-10 -12 -12 -2Q-10 6 0 2Q10 6 12 -2Q10 -12 0 0Z" fill="${c}"/><path d="M0 -4V4" stroke="${body}" stroke-width="1.6"/>`;
    // Back to front: [station id, drawing]. The ecosistema station brings the sky and sun (far back) and the dragonfly (in front);
    // the meadow is always there, lush once the food chain (cadena: grass, rabbit, lynx) is passed.
    /** @type {[string, (on: (id: string) => boolean) => string][]} */
    const PARTS = [
      [
        'ecosistema',
        () => `<rect x="0" y="0" width="360" height="300" fill="url(#SKY)"/><g class="cn-sun">${sun(284, 76, 20, 'cn-rays')}</g>`,
      ],
      [
        'relieve',
        () => `<path d="M16 200L56 136L80 156L124 96L164 152L196 122L232 168L264 134L344 196V214H16Z" fill="#a9b6bd"/>
        <path d="M124 96L138 132L128 176L164 152ZM264 134L274 160L268 190L344 196ZM56 136L64 158L58 184L80 156Z" fill="#8797a0"/>
        <path d="M124 96L112 116L121 113L127 120L134 111L138 117ZM264 134L256 148L263 146L268 151L274 144Z" fill="#fff"/>`,
      ],
      [
        '',
        (on) => `<path d="M16 206Q96 190 180 200T344 198V290H16Z" fill="${on('cadena') ? '#a9d474' : '#ece6d2'}"/>
        <path d="M16 232Q120 220 220 232T344 228V290H16Z" fill="${on('cadena') ? '#98c964' : '#e6dfc8'}"/>`,
      ],
      [
        'filtro',
        () => `<path d="M252 182Q272 198 248 212Q226 226 240 240" stroke="#7cc4ea" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path class="cn-flow" d="M252 182Q272 198 248 212Q226 226 240 240" stroke="#fff" stroke-width="2.4" stroke-dasharray="4 12" fill="none" stroke-linecap="round" opacity=".85"/>`,
      ],
      [
        'tipos',
        () => `<ellipse cx="190" cy="252" rx="98" ry="26" fill="#7d9a4c"/><ellipse cx="190" cy="250" rx="92" ry="22" fill="#4e9fcf"/>
        <ellipse cx="184" cy="246" rx="72" ry="13" fill="#6cbade"/>
        <ellipse class="cn-ripple" cx="160" cy="250" rx="14" ry="3.4" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>
        <ellipse class="cn-ripple cn-ripple2" cx="226" cy="246" rx="12" ry="3" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/>
        <path d="M196 258a14 5 0 1 0 1 0l7 3z" fill="#3f8f3a"/>${at(210, 260, 0.62, frog)}
        ${at(106, 254, 0.82, reeds(54, 7))}${at(276, 248, 0.72, reeds(48, 11))}`,
      ],
      [
        'cadena',
        () => `${at(44, 236, 1, grass(3))}${at(96, 232, 0.9, grass(9, '#4f9a33'))}${at(160, 214, 0.8, grass(5, '#6cb648'))}${at(306, 214, 0.9, grass(13))}
        ${at(66, 240, 0.86, rabbit)}${at(146, 216, 0.66, lynx, true)}`,
      ],
      [
        'rocas',
        () => `${at(298, 280, 1, rock(64, 40, '#b9b2aa', '#958d85'))}<g fill="#5a5450">${dots('hero', 274, 248, 322, 278, 1.1, 18)}</g>
        ${at(252, 282, 1, rock(26, 14, '#a3a9ab', '#868d90'))}${at(50, 282, 1, rock(30, 15, '#a3a9ab', '#868d90'))}`,
      ],
      [
        'reinos',
        () => `${at(290, 246, 0.9, toadstool())}${at(312, 248, 0.62, toadstool())}${at(276, 250, 0.5, toadstool())}
        <path d="M152 262q4 -8 0 -14M160 264q-3 -7 1 -12" stroke="#3f9a5a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
      ],
      [
        'cuidado',
        () => `<g transform="translate(36 280)"><rect x="-13" y="-30" width="26" height="30" rx="3" fill="#2f9a7a"/><rect x="-15" y="-35" width="30" height="7" rx="3" fill="#24806a"/>
          <path d="M-6 -12l6 -9 6 9z" fill="none" stroke="#e8fff6" stroke-width="2" stroke-linejoin="round"/></g>
        ${at(70, 282, 0.9, flower('#e2453c'))}${at(80, 280, 0.8, flower('#ffd25a'))}${at(236, 284, 0.8, flower('#f48fb1'))}`,
      ],
      ['ecosistema', () => `<g class="cn-fly">${at(190, 190, 0.9, `<g transform="rotate(-76)">${dragonfly}</g>`)}</g>`],
    ];
    const hero = () => {
      const u = uid();
      const passed = passedIds();
      const on = (/** @type {string} */ id) => passed.has(id);
      const all = PARTS.every(([id]) => !id || on(id));
      const parts = PARTS.map(([id, draw]) => {
        const svg = draw(on).replace('url(#SKY)', `url(#${u}sky)`);
        if (!id) return svg;
        // An unpassed part is an empty album slot: a flat silhouette (index.html: .cn-sk), without the sky.
        return on(id)
          ? `<g class="cn-part is-on" data-part="${id}">${svg}</g>`
          : `<g class="cn-part cn-sk" data-part="${id}">${svg.replace(/<rect x="0" y="0" width="360"[^>]*>/, '')}</g>`;
      }).join('');
      const butterflies = all
        ? `<g class="cn-fly cn-fly2">${at(96, 150, 1, butterfly('#ffb03a', '#5a3a20'))}</g><g class="cn-fly">${at(252, 176, 0.8, butterfly('#b06ad8', '#4a2a5a'))}</g>`
        : '';
      const inner = `<defs><clipPath id="${u}dome"><path d="${DOME}"/></clipPath>
          <linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f4"/><stop offset="1" stop-color="#ecf7f1"/></linearGradient>
          <linearGradient id="${u}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c08a52"/><stop offset="1" stop-color="#8f5f33"/></linearGradient></defs>
        <path d="${DOME}" fill="#f6f1e1"/>
        <g clip-path="url(#${u}dome)">${parts}${butterflies}</g>
        <path d="${DOME}" fill="none" stroke="#9fb4ab" stroke-width="3"/>
        <path d="M44 150C44 92 86 50 140 38" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75"/>
        <path d="M56 186V166" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
        <rect x="4" y="278" width="352" height="20" rx="8" fill="url(#${u}wood)"/><rect x="4" y="278" width="352" height="5" rx="2.5" fill="#d9a46a"/>
        ${all ? '<rect x="150" y="283" width="60" height="11" rx="4" fill="#f2c94c" stroke="#c89a1c"/>' : ''}`;
      const el = svgEl('0 0 360 300', inner, 'hero-svg cn-hero');
      el.dataset.passed = String(passed.size);
      return el;
    };

    return {
      art,
      scene,
      hero,
      has: (/** @type {string} */ key) => !!key && key in ART,
    };
  })()
);
