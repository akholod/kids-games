// @ts-nocheck
// Drawings for «El planeta donde vivimos»: illustrations (`art`), the world map, label scenes and the aerial view.
// Plain SVG, our own drawings. Needs maps.js (window.SP_MAPS) for the maps; everything else is self-contained.
// window.SPArt = { art(key) → Element|null, worldMap(opts), scene(name), aerial() }
'use strict';
window.SPArt = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  let uidN = 0;
  const uid = () => `sp${++uidN}`;

  const svgEl = (viewBox, inner = '', cls = 'art-svg') => {
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('viewBox', viewBox);
    el.setAttribute('class', cls);
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('focusable', 'false');
    el.innerHTML = inner;
    return el;
  };
  const node = (tag, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  };
  const MAPS = () => window.SP_MAPS || null;

  // Polaroid-style "photo" card around a scene (inner area 0..220 × 0..140).
  const photo = (u, scene, tilt = -3) => `
    <defs><filter id="${u}sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#12302040"/></filter>
    <clipPath id="${u}ph"><rect x="0" y="0" width="220" height="140" rx="4"/></clipPath></defs>
    <g transform="rotate(${tilt} 160 100)">
      <rect x="40" y="14" width="240" height="182" rx="8" fill="#fffdf7" filter="url(#${u}sh)"/>
      <g transform="translate(50 24)"><g clip-path="url(#${u}ph)">${scene}</g>
      <rect x="0" y="0" width="220" height="140" rx="4" fill="none" stroke="#0000001a"/></g>
    </g>`;

  // Small 4-point compass rose (north up) for map corners.
  const miniRose = (x, y, r, color = '#2c4a3e') => `
    <g transform="translate(${x} ${y})" class="mini-rose">
      <circle r="${r * 0.62}" fill="#fffdf5" stroke="${color}" stroke-width="${r * 0.06}"/>
      <path d="M0 ${-r}L${r * 0.2} 0L0 ${r}L${-r * 0.2} 0Z" fill="${color}"/>
      <path d="M${-r} 0L0 ${r * 0.2}L${r} 0L0 ${-r * 0.2}Z" fill="${color}" opacity=".55"/>
      <path d="M0 ${-r}L${r * 0.2} 0L${-r * 0.2} 0Z" fill="#d9473b"/>
      <text y="${-r - r * 0.18}" text-anchor="middle" font-size="${r * 0.62}" font-weight="900" fill="${color}">N</text>
    </g>`;

  // ---------------- World map ----------------
  // opts: { interactive, highlight: id } → { el, regions: Map(id → { el, kind, name, label }), showLabel(id, cls) }
  const worldMap = ({ interactive = false, highlight = null } = {}) => {
    const W = MAPS()?.world;
    if (!W) return null;
    const [, , w, h] = W.viewBox.split(/\s+/).map(Number);
    const el = svgEl(W.viewBox, '', `world-map${interactive ? ' is-interactive' : ''}`);
    const grat = [];
    for (let x = w / 12; x < w; x += w / 12) grat.push(`M${x.toFixed(1)} 0V${h}`);
    for (let y = h / 8; y < h; y += h / 8) grat.push(`M0 ${y.toFixed(1)}H${w}`);
    el.innerHTML = `<rect class="wm-sea" width="${w}" height="${h}" rx="12"/>`;
    const regions = new Map();
    const oceans = node('g', { class: 'wm-oceans' });
    const lands = node('g', { class: 'wm-lands' });
    const add = (group, kind, id, r) => {
      const p = node('path', { d: r.d, class: `wm-region wm-${kind}${highlight === id ? ' is-highlight' : ''}`, 'data-id': id });
      if (interactive) {
        p.setAttribute('tabindex', '0');
        p.setAttribute('role', 'button');
        p.setAttribute('aria-label', r.name);
      }
      group.append(p);
      regions.set(id, { el: p, kind, name: r.name, label: r.label });
    };
    for (const [id, r] of Object.entries(W.oceans)) add(oceans, 'ocean', id, r);
    for (const [id, r] of Object.entries(W.continents)) add(lands, 'land', id, r);
    const gratEl = node('path', { d: grat.join(''), class: 'wm-grat' });
    const equator = node('path', { d: `M0 ${((h * 84) / 174).toFixed(1)}H${w}`, class: 'wm-equator' });
    const labels = node('g', { class: 'wm-labels' });
    el.append(oceans, gratEl, equator, lands, labels);
    const showLabel = (id, cls = '') => {
      const r = regions.get(id);
      if (!r || labels.querySelector(`[data-for="${id}"]`)) return;
      const t = node('text', {
        x: r.label[0],
        y: r.label[1],
        class: `wm-label ${cls}`,
        'data-for': id,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      });
      t.textContent = r.name;
      labels.append(t);
    };
    return { el, regions, showLabel };
  };

  // ---------------- Spain maps ----------------
  const SP_DARK = ['madrid', 'cataluna', 'pais-vasco', 'valencia', 'canarias'];
  const SP_LIGHT = ['castilla-y-leon', 'castilla-la-mancha', 'aragon', 'extremadura'];
  const POLI = [
    '#f6c85f',
    '#9fd47c',
    '#f49e7c',
    '#87c5e8',
    '#d6a7e6',
    '#f7e17a',
    '#a6dcc8',
    '#f3b3c7',
    '#c9d97a',
    '#f0b56a',
    '#9bb8ef',
    '#e8c39e',
    '#b5e3a0',
    '#f5a3a3',
    '#c6b3f0',
    '#8fd3d0',
    '#efd08c',
  ];

  const spainBase = (u, { parchment = false } = {}) => {
    const S = MAPS()?.spain;
    if (!S) return null;
    const [ix, iy, iw, ih] = S.inset;
    const sea = parchment ? '#ecd9ac' : '#cfe7f5';
    const nb = Object.values(S.neighbors)
      .map((d) => `<path d="${d}"/>`)
      .join('');
    return {
      S,
      head: `<defs><clipPath id="${u}es"><path d="${S.outline}"/></clipPath></defs>
        <rect width="600" height="480" rx="14" fill="${sea}"/>
        <g fill="${parchment ? '#e2cc98' : '#ebe7dc'}" stroke="${parchment ? '#b89b62' : '#cfc9b8'}" stroke-width="1">${nb}</g>
        <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="6" fill="${sea}" stroke="${parchment ? '#8a6b37' : '#7d9aa8'}" stroke-width="1.5" stroke-dasharray="5 4"/>`,
      outline: (fill, stroke = '#2c4a3e', sw = 1.4) =>
        `<path d="${S.outline}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`,
      regions: (fillOf, stroke = '#ffffff', sw = 1.2) =>
        S.regions
          .map((r, i) => `<path d="${r.d}" fill="${fillOf(r, i)}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`)
          .join(''),
    };
  };

  const RANGES = [
    [
      [285, 96],
      [330, 104],
      [380, 112],
      [430, 118],
      [458, 124],
    ], // Pirineos
    [
      [92, 96],
      [140, 92],
      [190, 95],
      [245, 100],
    ], // Cantábrica
    [
      [255, 118],
      [290, 150],
      [318, 188],
      [338, 228],
    ], // Ibérico
    [
      [128, 228],
      [175, 214],
      [220, 202],
      [262, 192],
    ], // Central
    [
      [105, 318],
      [160, 312],
      [215, 308],
      [265, 304],
    ], // Sierra Morena
    [
      [175, 382],
      [235, 374],
      [290, 360],
      [325, 335],
    ], // Béticas
  ];
  const RIVERS = [
    'M238 100C262 116 290 132 320 152S385 196 418 214', // Ebro
    'M278 140C250 142 228 146 200 154S130 166 60 170', // Duero
    'M300 200C275 214 255 226 228 238S150 268 50 282', // Tajo
    'M262 282C230 286 200 290 165 298S110 318 104 372', // Guadiana
    'M305 318C278 326 252 334 220 344S160 366 128 400', // Guadalquivir
  ];
  const smooth = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');

  const SPAIN = {
    fisico(u, b) {
      const peaks = RANGES.flatMap((line) =>
        line.map(([x, y], i) => {
          const s = 8 + (i % 2) * 3;
          return `<path d="M${x - s} ${y + s * 0.55}L${x} ${y - s * 0.75}L${x + s} ${y + s * 0.55}Z" fill="#a8743f" stroke="#6e4720" stroke-width="1.2" stroke-linejoin="round"/>
          <path d="M${x - s * 0.33} ${y - s * 0.3}L${x} ${y - s * 0.75}L${x + s * 0.33} ${y - s * 0.3}Z" fill="#fff8ec"/>`;
        }),
      ).join('');
      const relief = RANGES.map(
        (
          line,
        ) => `<path d="${smooth(line)}" stroke="#d9b077" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".7"/>
        <path d="${smooth(line)}" stroke="#c48f55" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".8"/>`,
      ).join('');
      return `${b.head}${b.outline('#9fcd7d')}
        <g clip-path="url(#${u}es)"><path d="M0 0H600V480H0Z" fill="#cfe3a0" opacity=".55"/>${relief}
          <g fill="none" stroke="#2f86d6" stroke-width="3.2" stroke-linecap="round">${RIVERS.map((d) => `<path d="${d}"/>`).join('')}</g>${peaks}</g>
        ${b.outline('none')}${miniRose(548, 60, 26)}`;
    },
    politico(u, b) {
      const dots = b.S.cities
        .map((c) =>
          c.name === 'Madrid'
            ? `<path transform="translate(${c.x} ${c.y})" d="M0-9L2.6-2.8 9-2.8 3.8 1.2 5.6 7.6 0 3.8-5.6 7.6-3.8 1.2-9-2.8-2.6-2.8Z" fill="#d9473b" stroke="#fff" stroke-width="1.4"/>`
            : `<circle cx="${c.x}" cy="${c.y}" r="5.5" fill="#2c4a3e" stroke="#fff" stroke-width="2"/>`,
        )
        .join('');
      // Regions were simplified one by one: a white outline underneath hides the hairline seams between them.
      return `${b.head}${b.outline('#ffffff', 'none', 0)}${b.regions((r, i) => POLI[i % POLI.length])}${b.outline('none', '#2c4a3e', 1.6)}${dots}${miniRose(548, 60, 26)}`;
    },
    poblacion(u, b) {
      const fill = (r) => (SP_DARK.includes(r.id) ? '#8e2f2a' : SP_LIGHT.includes(r.id) ? '#fbe7c8' : '#ec9b6b');
      const key = `<g transform="translate(470 360)"><rect width="112" height="96" rx="10" fill="#fffdf5" stroke="#2c4a3e" stroke-width="1.2"/>
        <rect x="14" y="14" width="26" height="18" rx="3" fill="#8e2f2a"/><rect x="14" y="40" width="26" height="18" rx="3" fill="#ec9b6b"/><rect x="14" y="66" width="26" height="18" rx="3" fill="#fbe7c8" stroke="#d8c3a0"/>
        <g fill="#2c4a3e">${[0, 1, 2].map((row) => Array.from({ length: 3 - row }, (_, k) => `<g transform="translate(${54 + k * 16} ${23 + row * 26})"><circle cy="-4" r="3.6"/><path d="M-5.5 7Q-5.5 0 0 0Q5.5 0 5.5 7Z"/></g>`).join('')).join('')}</g></g>`;
      return `${b.head}${b.outline('#ffffff', 'none', 0)}${b.regions(fill, '#ffffff', 1.4)}${b.outline('none', '#5a2a1c', 1.4)}${key}${miniRose(548, 60, 26)}`;
    },
    historico(u, b) {
      const arrow = (d) =>
        `<path d="${d}" fill="none" stroke="#8b2c1f" stroke-width="3.2" stroke-dasharray="9 6" stroke-linecap="round" marker-end="url(#${u}ar)"/>`;
      const castle = (x, y) =>
        `<g transform="translate(${x} ${y})" fill="#6b4a22" stroke="#3f2a10" stroke-width="1"><path d="M-12 10V-6H-8V-2H-4V-6H0V-2H4V-6H8V-2H12V-6H12V10Z"/><rect x="-3" y="2" width="6" height="8" fill="#e9d3a3"/></g>`;
      const ship = (x, y) =>
        `<g transform="translate(${x} ${y})" stroke="#3f2a10" stroke-width="1.2"><path d="M-14 2H14L9 9H-9Z" fill="#6b4a22"/><path d="M0 2V-16" /><path d="M1-15L11-4H1Z" fill="#f4e6c4"/></g>`;
      return `<defs><marker id="${u}ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5 0 10Z" fill="#8b2c1f"/></marker>
          <filter id="${u}rough"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .15  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
        ${b.head}${b.outline('#f2e2b8', '#6b4a22', 2)}
        <rect width="600" height="480" rx="14" fill="#fff" filter="url(#${u}rough)" opacity=".9"/>
        ${arrow('M170 90C210 140 230 180 232 214')}${arrow('M330 120C300 170 270 200 246 216')}${arrow('M232 226C220 280 200 320 170 352')}
        <path d="M520 300C470 330 420 380 330 400S180 430 120 420" fill="none" stroke="#3f2a10" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round"/>
        ${castle(170, 80)}${castle(338, 112)}${castle(238, 222)}${castle(166, 362)}${ship(520, 296)}${ship(300, 410)}
        <g transform="translate(470 352)"><rect width="114" height="100" rx="6" fill="#f4e6c4" stroke="#6b4a22" stroke-width="2"/>
          <text x="57" y="22" text-anchor="middle" font-size="15" font-weight="800" font-family="Georgia,serif" fill="#3f2a10">Leyenda</text>
          ${castle(26, 46)}<path d="M44 46H98" stroke="#3f2a10" stroke-width="2" stroke-dasharray="2 4"/>
          <path d="M14 76H58" stroke="#8b2c1f" stroke-width="3" stroke-dasharray="7 4"/>${ship(84, 80)}</g>
        <g transform="translate(546 62)" stroke="#6b4a22" fill="#e9d3a3"><circle r="30" stroke-width="2"/><path d="M0-40L7 0 0 40-7 0Z M-40 0L0 7 40 0 0-7Z" fill="#6b4a22"/><circle r="5" fill="#f4e6c4"/></g>`;
    },
  };

  // ---------------- Globe helper (school globe on a stand) ----------------
  // Local frame: axis vertical; tilt = 23° to the right. Returns markup + a point mapper.
  const GLOBE_TILT = 23;
  const globeMarkup = (u, cx, cy, r, { stand = true, lines = true } = {}) => {
    const a = (GLOBE_TILT * Math.PI) / 180;
    const rot = ([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)];
    const R = r + 26;
    const nEnd = rot([0, -(r + 20)]);
    const sEnd = rot([0, r + 20]);
    const ringA = rot([0, -R]);
    const ringB = rot([0, R]);
    const ry = r * 0.24;
    const W = MAPS()?.world;
    const land = W
      ? `<svg x="${cx - r * 1.55}" y="${cy - r * 1.1}" width="${r * 3.1}" height="${r * 2.05}" viewBox="400 30 330 330" preserveAspectRatio="none">${Object.values(
          W.continents,
        )
          .map((c) => `<path d="${c.d}"/>`)
          .join('')}</svg>`
      : '';
    return {
      rot,
      markup: `<defs>
        <radialGradient id="${u}gs" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".45" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#0b2a3a" stop-opacity=".45"/></radialGradient>
        <clipPath id="${u}gc"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
        ${
          stand
            ? `<path d="M${cx - r * 0.75} ${cy + R + 34}Q${cx} ${cy + R + 12} ${cx + r * 0.75} ${cy + R + 34}Z" fill="#7a4e2a"/>
          <ellipse cx="${cx}" cy="${cy + R + 34}" rx="${r * 0.78}" ry="9" fill="#5e3a1d"/>
          <path d="M${cx} ${cy + R - 2}V${cy + R + 22}" stroke="#7a4e2a" stroke-width="9" stroke-linecap="round"/>
          <path d="M${ringA[0]} ${ringA[1]}A${R} ${R} 0 0 1 ${ringB[0]} ${ringB[1]}" fill="none" stroke="#c8a24a" stroke-width="7" stroke-linecap="round"/>`
            : ''
        }
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#3f8fc9"/>
        <g clip-path="url(#${u}gc)"><g transform="rotate(${GLOBE_TILT} ${cx} ${cy})" fill="#8cc36a" stroke="#5f9a45" stroke-width="1.5">${land}</g>
          ${
            lines
              ? `<g transform="rotate(${GLOBE_TILT} ${cx} ${cy})" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.2">
            <ellipse cx="${cx}" cy="${cy - r * 0.5}" rx="${r * 0.87}" ry="${ry * 0.87}"/><ellipse cx="${cx}" cy="${cy + r * 0.5}" rx="${r * 0.87}" ry="${ry * 0.87}"/>
            <ellipse cx="${cx}" cy="${cy}" rx="${r * 0.45}" ry="${r}"/></g>`
              : ''
          }
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${u}gs)"/></g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1d4f73" stroke-width="2"/>
        <line x1="${nEnd[0]}" y1="${nEnd[1]}" x2="${sEnd[0]}" y2="${sEnd[1]}" stroke="#2c3e48" stroke-width="4" stroke-linecap="round" stroke-dasharray="${lines ? '10 6' : 'none'}"/>
        <g transform="rotate(${GLOBE_TILT} ${cx} ${cy})" fill="none" stroke-linecap="round">
          <path d="M${cx - r} ${cy}A${r} ${ry} 0 0 0 ${cx + r} ${cy}" stroke="#ffd23f" stroke-width="4.5"/>
          <path d="M${cx - r} ${cy}A${r} ${ry} 0 0 1 ${cx + r} ${cy}" stroke="#ffd23f" stroke-width="2.5" stroke-dasharray="6 6" opacity=".55"/></g>
        <circle cx="${rot([0, -r])[0]}" cy="${rot([0, -r])[1]}" r="5.5" fill="#fff" stroke="#2c3e48" stroke-width="2"/>
        <circle cx="${rot([0, r])[0]}" cy="${rot([0, r])[1]}" r="5.5" fill="#fff" stroke="#2c3e48" stroke-width="2"/>`,
    };
  };

  // ---------------- Illustrations ----------------
  const ART = {
    layers(u) {
      return svgEl(
        '0 0 340 210',
        `<defs><radialGradient id="${u}atm"><stop offset=".72" stop-color="#bfe3ff" stop-opacity=".95"/><stop offset="1" stop-color="#bfe3ff" stop-opacity="0"/></radialGradient></defs>
        <circle cx="112" cy="106" r="96" fill="url(#${u}atm)"/>
        <g fill="#fff"><ellipse cx="54" cy="44" rx="18" ry="8"/><ellipse cx="66" cy="38" rx="12" ry="9"/><ellipse cx="176" cy="150" rx="16" ry="7"/></g>
        <circle cx="112" cy="106" r="68" fill="#3f8fc9" stroke="#1d4f73" stroke-width="2"/>
        <path d="M70 68C88 52 110 60 116 76S100 104 84 112 52 104 56 90 62 76 70 68Z M120 118C138 108 162 116 164 134S146 168 128 164 106 140 120 118Z" fill="#9c7a4f" stroke="#6b4f2c" stroke-width="2"/>
        <path d="M78 84L88 72 96 86Z M134 134L144 122 152 138Z" fill="#6b4f2c"/>
        <g font-size="17" font-weight="900" fill="#122b24">
          <path d="M184 34L218 34" stroke="#2c4a3e" stroke-width="2"/><circle cx="182" cy="36" r="4" fill="#2c4a3e"/><circle cx="228" cy="34" r="8" fill="#bfe3ff" stroke="#2c4a3e"/><text x="242" y="40">Atmósfera</text>
          <path d="M162 92L218 100" stroke="#2c4a3e" stroke-width="2"/><circle cx="162" cy="92" r="4" fill="#2c4a3e"/><circle cx="228" cy="100" r="8" fill="#3f8fc9" stroke="#2c4a3e"/><text x="242" y="106">Hidrosfera</text>
          <path d="M150 140L218 166" stroke="#2c4a3e" stroke-width="2"/><circle cx="150" cy="140" r="4" fill="#2c4a3e"/><circle cx="228" cy="166" r="8" fill="#9c7a4f" stroke="#2c4a3e"/><text x="242" y="172">Geosfera</text></g>`,
      );
    },
    'photo-wave'(u) {
      return svgEl(
        '0 0 320 210',
        photo(
          u,
          `<rect width="220" height="140" fill="#9fd3f2"/><circle cx="182" cy="28" r="14" fill="#fff6c9"/>
        <path d="M0 92C40 70 70 30 120 26S190 60 180 90C170 112 140 104 146 84 150 70 168 72 166 82 C150 60 110 50 84 76S40 120 0 120Z" fill="#1f6fae"/>
        <path d="M120 26C160 24 192 56 180 90 170 112 140 104 146 84" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
        <path d="M0 110C60 96 120 112 220 96V140H0Z" fill="#2d84c4"/><path d="M0 124C60 112 140 128 220 114V140H0Z" fill="#185f97"/>
        <g fill="#fff" opacity=".9"><circle cx="150" cy="78" r="4"/><circle cx="162" cy="96" r="3"/><circle cx="138" cy="92" r="3"/></g>`,
        ),
      );
    },
    'photo-rocks'(u) {
      return svgEl(
        '0 0 320 210',
        photo(
          u,
          `<rect width="220" height="140" fill="#cfe9f7"/><path d="M0 70L50 30 90 60 140 18 220 66V140H0Z" fill="#9aa7a0"/><path d="M140 18L160 34 150 38 132 30Z" fill="#fff"/>
        <path d="M0 96L220 84V140H0Z" fill="#a9b77c"/>
        <path d="M20 132L36 96 74 88 96 112 92 140H20Z" fill="#8a8a86" stroke="#5c5c58" stroke-width="2"/><path d="M36 96L58 108 74 88" fill="none" stroke="#5c5c58" stroke-width="2"/>
        <path d="M96 140L112 104 150 96 182 110 196 140Z" fill="#a19a90" stroke="#625b52" stroke-width="2"/><path d="M112 104L140 122 150 96M140 122L160 140" fill="none" stroke="#625b52" stroke-width="2"/>
        <path d="M176 140L188 120 210 118 220 128V140Z" fill="#7d7a74" stroke="#4d4b47" stroke-width="2"/>`,
          2,
        ),
      );
    },
    'photo-space'(u) {
      return svgEl(
        '0 0 320 210',
        `<defs><radialGradient id="${u}glow" cx="50%" cy="100%" r="80%"><stop offset=".62" stop-color="#7fd0ff"/><stop offset=".7" stop-color="#3d8fd8" stop-opacity=".7"/><stop offset=".86" stop-color="#3d8fd8" stop-opacity="0"/></radialGradient></defs>
        ${photo(
          u,
          `<rect width="220" height="140" fill="#07152b"/>
        ${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 47) % 220}" cy="${(i * 29) % 80}" r="${i % 3 ? 0.9 : 1.6}" fill="#fff" opacity=".85"/>`).join('')}
        <ellipse cx="110" cy="200" rx="170" ry="122" fill="url(#${u}glow)"/>
        <ellipse cx="110" cy="206" rx="150" ry="110" fill="#2a7cc4"/>
        <path d="M30 140C40 120 70 110 90 118S120 140 110 140Z M130 112C150 104 180 110 190 126L196 140H140Z" fill="#7bb85c"/>
        <path d="M70 108C90 100 120 104 128 112" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8" fill="none"/>`,
        )}`,
      );
    },
    'water-cycle'(u) {
      const up = (x) =>
        `<path d="M${x} 150C${x - 8} 136 ${x + 8} 124 ${x} 110S${x - 8} 92 ${x} 82" fill="none" stroke="#e8f6ff" stroke-width="3" stroke-dasharray="2 5" stroke-linecap="round"/><path d="M${x - 6} 88L${x} 76 ${x + 6} 88" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      return svgEl(
        '0 0 340 210',
        `<defs><linearGradient id="${u}sky" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f5"/><stop offset="1" stop-color="#dff2fb"/></linearGradient>
          <marker id="${u}mk" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5 0 10Z" fill="#1d4f73"/></marker></defs>
        <rect width="340" height="210" rx="16" fill="url(#${u}sky)"/>
        <g transform="translate(46 44)"><circle r="20" fill="#ffd23f"/><g stroke="#ffb627" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((d) => `<path transform="rotate(${d})" d="M0-28V-36"/>`).join('')}</g></g>
        <path d="M190 210L262 92 300 140 340 104V210Z" fill="#8a9f6e"/><path d="M262 92L278 118 268 114 256 124 248 116Z" fill="#fff"/>
        <path d="M226 210C232 186 250 176 262 160" fill="none" stroke="#3f8fc9" stroke-width="5" stroke-linecap="round"/>
        <path d="M0 160C40 152 80 166 120 156S180 160 236 170V210H0Z" fill="#3f8fc9"/><path d="M0 176C40 168 90 182 140 172S200 180 236 184V210H0Z" fill="#2a74ad"/>
        ${up(70)}${up(102)}${up(134)}
        <path d="M150 74C176 54 200 48 228 52" fill="none" stroke="#1d4f73" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#${u}mk)"/>
        <g fill="#fff" stroke="#b9cfdc" stroke-width="2"><path d="M232 66C220 66 214 54 224 46 226 34 244 30 250 40 258 28 280 34 278 46 292 48 290 66 278 66Z"/></g>
        <g stroke="#2a74ad" stroke-width="3" stroke-linecap="round">${[236, 248, 260, 272].map((x, i) => `<path d="M${x} ${76 + (i % 2) * 6}l-5 12M${x - 8} ${100 + (i % 2) * 6}l-5 12"/>`).join('')}</g>`,
      );
    },
    'rock-cuarzo'(u) {
      const crystal = (x, y, hgt, w, rot) =>
        `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M${-w} 0V${-hgt}L0 ${-hgt - w * 1.2}L${w} ${-hgt}V0Z" fill="#f4f1fb" stroke="#9c92b8" stroke-width="2" stroke-linejoin="round"/><path d="M0 ${-hgt - w * 1.2}V0" stroke="#c9c1de" stroke-width="2"/><path d="M${-w} ${-hgt}L0 ${-hgt + w * 0.5}L${w} ${-hgt}" fill="none" stroke="#c9c1de" stroke-width="2"/><path d="M${-w * 0.6} -8V${-hgt + 6}" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`;
      return svgEl(
        '0 0 240 170',
        `<ellipse cx="120" cy="150" rx="86" ry="12" fill="#12302022"/>
        <path d="M50 150C46 132 70 118 120 118S196 130 190 150Z" fill="#b8b0a3" stroke="#857c6f" stroke-width="2"/>
        ${crystal(84, 138, 44, 13, -24)}${crystal(150, 136, 50, 14, 20)}${crystal(118, 134, 74, 17, -3)}${crystal(102, 140, 34, 10, 8)}`,
      );
    },
    'rock-caliza'(u) {
      return svgEl(
        '0 0 240 170',
        `<ellipse cx="120" cy="150" rx="90" ry="12" fill="#12302022"/>
        <path d="M38 132C30 104 52 70 96 62S180 58 200 90 206 140 178 148 64 156 38 132Z" fill="#e8dcc0" stroke="#a8956c" stroke-width="2.5"/>
        <path d="M60 92C90 84 140 84 186 96M50 118C100 110 150 114 196 124" fill="none" stroke="#c9b68e" stroke-width="2"/>
        <g fill="#c4ae80">${[
          [78, 104, 3],
          [120, 98, 2.5],
          [150, 132, 3],
          [96, 134, 2],
          [170, 110, 2.5],
          [134, 76, 2],
          [64, 126, 2.4],
          [186, 132, 2],
        ]
          .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
          .join('')}</g>
        <g transform="translate(128 118)" fill="none" stroke="#9c845a" stroke-width="2"><path d="M0 0A4 4 0 1 1 4 4A8 8 0 1 1-8 2A12 12 0 1 1 10-10"/></g>`,
      );
    },
    'rock-obsidiana'(u) {
      return svgEl(
        '0 0 240 170',
        `<defs><linearGradient id="${u}ob" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b3f4a"/><stop offset=".5" stop-color="#11131a"/><stop offset="1" stop-color="#05060a"/></linearGradient></defs>
        <ellipse cx="120" cy="150" rx="84" ry="12" fill="#12302030"/>
        <path d="M44 140L60 82 104 50 160 58 198 96 190 144Z" fill="url(#${u}ob)" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
        <path d="M60 82L112 98 104 50M112 98L160 58M112 98L150 144M112 98L198 96" fill="none" stroke="#2c303b" stroke-width="2"/>
        <path d="M72 82C82 70 92 64 102 60" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7" fill="none"/>
        <path d="M150 72C162 76 172 84 180 94" stroke="#cfd8ff" stroke-width="3" stroke-linecap="round" opacity=".55" fill="none"/>
        <path d="M70 120C80 112 92 108 100 108" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".35" fill="none"/>`,
      );
    },
    'globe-vs-map'(u) {
      const g = globeMarkup(u, 78, 80, 52, { stand: true, lines: false });
      const W = MAPS()?.world;
      const flat = W
        ? `<svg x="178" y="44" width="148" height="72" viewBox="0 0 1000 483" preserveAspectRatio="none"><rect width="1000" height="483" fill="#3f8fc9"/><g fill="#8cc36a">${Object.values(
            W.continents,
          )
            .map((c) => `<path d="${c.d}"/>`)
            .join('')}</g></svg>`
        : '';
      return svgEl(
        '0 0 340 222',
        `${g.markup}
        <g><rect x="172" y="38" width="160" height="84" rx="6" fill="#fffdf5" stroke="#2c4a3e" stroke-width="2"/>${flat}</g>
        <path d="M150 80H164" stroke="#557066" stroke-width="3" stroke-linecap="round"/>
        <g font-size="15" font-weight="900" fill="#122b24" text-anchor="middle"><text x="78" y="216">Globo terráqueo</text><text x="252" y="150">Mapamundi</text></g>`,
      );
    },
    sunrise(u) {
      return svgEl(
        '0 0 340 190',
        `<defs><linearGradient id="${u}s" x2="0" y2="1"><stop offset="0" stop-color="#7cc4f0"/><stop offset=".75" stop-color="#ffe7a8"/></linearGradient></defs>
        <rect width="340" height="190" rx="16" fill="url(#${u}s)"/>
        <g transform="translate(264 140)"><g stroke="#ffb627" stroke-width="5" stroke-linecap="round">${[-80, -50, -20, 10, 40].map((d) => `<path transform="rotate(${d - 10})" d="M0-44V-58"/>`).join('')}</g><circle r="34" fill="#ffd23f"/></g>
        <path d="M0 140C60 120 110 132 160 124S260 128 340 136V190H0Z" fill="#7fb35c"/><path d="M0 160C80 150 180 162 340 152V190H0Z" fill="#5f9a45"/>
        <path d="M216 116C226 92 240 76 258 64" fill="none" stroke="#c45a19" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/><path d="M248 60L262 60 256 74" fill="none" stroke="#c45a19" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <g transform="translate(70 128)"><path d="M-14 0V-22L0-34 14-22V0Z" fill="#fffdf5" stroke="#2c4a3e" stroke-width="2"/><path d="M-18-20L0-37 18-20" fill="none" stroke="#d9473b" stroke-width="5" stroke-linecap="round"/></g>`,
      );
    },
    sunset(u) {
      return svgEl(
        '0 0 340 190',
        `<defs><linearGradient id="${u}s" x2="0" y2="1"><stop offset="0" stop-color="#4d3b8c"/><stop offset=".45" stop-color="#e2705c"/><stop offset=".8" stop-color="#ffc06b"/></linearGradient></defs>
        <rect width="340" height="190" rx="16" fill="url(#${u}s)"/>
        <g transform="translate(78 142)"><circle r="34" fill="#ffb03b"/></g>
        <path d="M0 140C60 128 110 136 160 128S260 132 340 124V190H0Z" fill="#3e5a39"/><path d="M0 158C80 150 180 164 340 150V190H0Z" fill="#2f4a2c"/>
        <path d="M130 66C116 80 106 96 100 108" fill="none" stroke="#fff3d6" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 8"/><path d="M92 104L100 116 110 104" fill="none" stroke="#fff3d6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <g fill="#fff" opacity=".8"><circle cx="250" cy="30" r="1.6"/><circle cx="290" cy="52" r="1.2"/><circle cx="210" cy="22" r="1"/></g>
        <g transform="translate(270 134)"><path d="M-14 0V-22L0-34 14-22V0Z" fill="#fde7c6" stroke="#2c2a3e" stroke-width="2"/><path d="M-18-20L0-37 18-20" fill="none" stroke="#7a2c2a" stroke-width="5" stroke-linecap="round"/><rect x="-5" y="-16" width="9" height="9" fill="#ffd23f"/></g>`,
      );
    },
    'polar-star'(u) {
      const big = [
        [255, 112],
        [250, 146],
        [205, 146],
        [208, 114],
        [176, 104],
        [148, 108],
        [118, 124],
      ];
      const small = [
        [268, 38],
        [240, 44],
        [216, 52],
        [196, 62],
        [170, 58],
        [166, 80],
        [192, 84],
      ];
      const star = ([x, y], r = 3.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff8d6"/>`;
      return svgEl(
        '0 0 340 210',
        `<defs><linearGradient id="${u}n" x2="0" y2="1"><stop offset="0" stop-color="#0b1a3a"/><stop offset="1" stop-color="#22386b"/></linearGradient>
          <radialGradient id="${u}pg"><stop offset="0" stop-color="#fff8d6"/><stop offset="1" stop-color="#fff8d6" stop-opacity="0"/></radialGradient></defs>
        <rect width="340" height="210" rx="16" fill="url(#${u}n)"/>
        ${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 61 + 13) % 340}" cy="${(i * 37 + 7) % 170}" r="${i % 4 ? 0.8 : 1.3}" fill="#fff" opacity=".6"/>`).join('')}
        <path d="M250 146L272 30" stroke="#ffd23f" stroke-width="2" stroke-dasharray="5 6" opacity=".9"/>
        <path d="${smooth(big)}L208 114" fill="none" stroke="#9fb7e8" stroke-width="1.5" opacity=".7"/>
        <path d="${smooth(small)}L196 62" fill="none" stroke="#9fb7e8" stroke-width="1.5" opacity=".7"/>
        ${big.map((p) => star(p)).join('')}${small
          .slice(1)
          .map((p) => star(p, 2.6))
          .join('')}
        <circle cx="268" cy="38" r="18" fill="url(#${u}pg)"/><path transform="translate(268 38)" d="M0-11L2.6-2.6 11 0 2.6 2.6 0 11-2.6 2.6-11 0-2.6-2.6Z" fill="#fff8d6"/>
        <g font-size="14" font-weight="800" fill="#cfe0ff"><text x="150" y="170">Osa Mayor</text><text x="104" y="40">Osa Menor</text></g>
        <path d="M0 190C60 178 120 186 170 180S280 184 340 176V210H0Z" fill="#0a1226"/>`,
      );
    },
    'moss-tree'(u) {
      return svgEl(
        '0 0 260 200',
        `<rect width="260" height="200" rx="16" fill="#e4f3d8"/>
        <g transform="translate(214 40)"><circle r="18" fill="#ffd23f"/><g stroke="#ffb627" stroke-width="4" stroke-linecap="round">${[0, 60, 120, 180, 240, 300].map((d) => `<path transform="rotate(${d})" d="M0-25V-32"/>`).join('')}</g></g>
        <path d="M0 176C80 170 180 180 260 172V200H0Z" fill="#9cc97a"/>
        <circle cx="120" cy="64" r="50" fill="#5f9a45"/><circle cx="88" cy="80" r="32" fill="#4f8a3a"/><circle cx="150" cy="84" r="30" fill="#6aa94f"/>
        <path d="M106 178C110 150 108 120 110 100H134C134 120 132 150 138 178Z" fill="#8a5a33"/>
        <path d="M110 108C106 130 110 160 104 178" fill="none" stroke="#6b4423" stroke-width="2"/>
        <g fill="#3c8a2e">${[
          [106, 112],
          [104, 126],
          [107, 140],
          [103, 154],
          [106, 168],
          [110, 120],
          [109, 150],
        ]
          .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${5 + (i % 3)}"/>`)
          .join('')}</g>
        <path d="M124 112V170" stroke="#a87a4e" stroke-width="2" opacity=".6"/>`,
      );
    },
    compass(u) {
      return svgEl(
        '0 0 220 200',
        `<defs><radialGradient id="${u}c" cx="40%" cy="35%"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#e9e2cc"/></radialGradient></defs>
        <circle cx="110" cy="100" r="86" fill="#c8a24a"/><circle cx="110" cy="100" r="76" fill="url(#${u}c)" stroke="#8a6d2c" stroke-width="2"/>
        <g stroke="#557066" stroke-linecap="round">${Array.from({ length: 24 }, (_, i) => `<path transform="rotate(${i * 15} 110 100)" d="M110 30V${i % 6 ? 38 : 44}" stroke-width="${i % 6 ? 1.5 : 3}"/>`).join('')}</g>
        <path d="M110 100L98 100 110 40 122 100Z" fill="#d9473b"/><path d="M110 100L98 100 110 160 122 100Z" fill="#dfe6ea" stroke="#9fb0b8"/>
        <circle cx="110" cy="100" r="7" fill="#2c4a3e"/><circle cx="110" cy="10" r="10" fill="none" stroke="#c8a24a" stroke-width="5"/>`,
      );
    },
    'arms-cross'(u) {
      const q = (x, y, t, fill = '#fffdf5') =>
        `<g transform="translate(${x} ${y})"><circle r="17" fill="${fill}" stroke="#2c4a3e" stroke-width="2"/><text y="7" text-anchor="middle" font-size="20" font-weight="900" fill="#122b24">${t}</text></g>`;
      return svgEl(
        '0 0 340 210',
        `<defs><linearGradient id="${u}s" x2="0" y2="1"><stop offset="0" stop-color="#9ad3f2"/><stop offset="1" stop-color="#e8f6fd"/></linearGradient></defs>
        <rect width="340" height="210" rx="16" fill="url(#${u}s)"/>
        <g transform="translate(306 112)"><circle r="20" fill="#ffd23f"/><g stroke="#ffb627" stroke-width="4" stroke-linecap="round">${[-90, -45, -135, 180, 0].map((d) => `<path transform="rotate(${d})" d="M0-27V-34"/>`).join('')}</g></g>
        <path d="M0 116C80 108 180 112 340 118V210H0Z" fill="#9cc97a"/><ellipse cx="170" cy="186" rx="70" ry="12" fill="#5f9a4566"/>
        <path d="M152 186L156 150H164L166 186Z M174 186L176 150H184L188 186Z" fill="#2c3e48"/>
        <path d="M144 96H196L190 152H150Z" fill="#d9473b"/><text x="170" y="136" text-anchor="middle" font-size="24" font-weight="900" fill="#fff">10</text>
        <path d="M144 100L64 104M196 100L276 104" stroke="#f1c79d" stroke-width="11" stroke-linecap="round"/>
        <path d="M144 98L128 102M196 98L212 102" stroke="#d9473b" stroke-width="13" stroke-linecap="round"/>
        <circle cx="170" cy="78" r="18" fill="#6b4423"/>
        ${q(282, 66, 'E', '#ffe7a8')}${q(54, 66, '?')}${q(170, 30, '?')}${q(118, 192, '?')}
        <path d="M118 174L132 160" stroke="#2c4a3e" stroke-width="2" stroke-dasharray="3 3"/><path d="M170 48V58" stroke="#2c4a3e" stroke-width="2" stroke-dasharray="3 3"/>`,
      );
    },
    'trash-island'(u) {
      return svgEl(
        '0 0 340 200',
        `<defs><linearGradient id="${u}w" x2="0" y2="1"><stop offset="0" stop-color="#5aa6d8"/><stop offset="1" stop-color="#1f5f93"/></linearGradient>
          <marker id="${u}m" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5 0 10Z" fill="#e8f6ff"/></marker></defs>
        <rect width="340" height="200" rx="16" fill="url(#${u}w)"/>
        <ellipse cx="170" cy="100" rx="130" ry="70" fill="none" stroke="#e8f6ff" stroke-width="3" stroke-dasharray="10 9" marker-end="url(#${u}m)" opacity=".8"/>
        <ellipse cx="170" cy="100" rx="86" ry="44" fill="#8ab3a8" opacity=".35"/>
        <g stroke="#2c3e48" stroke-width="1.5">
          <rect x="120" y="82" width="34" height="12" rx="5" fill="#9ee0f0" transform="rotate(-18 137 88)"/><rect x="152" y="80" width="6" height="8" fill="#d9473b" transform="rotate(-18 137 88)"/>
          <rect x="182" y="96" width="30" height="11" rx="5" fill="#c6f0c0" transform="rotate(24 197 101)"/>
          <path d="M150 108C160 98 176 100 180 112S160 128 150 118Z" fill="#f3f3f3" opacity=".9"/>
          <rect x="204" y="78" width="14" height="20" rx="3" fill="#d9d9d9"/><rect x="132" y="110" width="12" height="16" rx="2" fill="#ffd23f"/>
          <circle cx="226" cy="108" r="5" fill="#ff8a5c"/><circle cx="114" cy="104" r="4" fill="#5c9bff"/><circle cx="196" cy="122" r="4" fill="#fff"/></g>
        <g transform="translate(64 160)"><ellipse rx="22" ry="14" fill="#5f9a45" stroke="#2f5a25" stroke-width="2"/><path d="M-8-10L0-4 8-10M-14 0H14M-8 10L0 4 8 10" stroke="#2f5a25" stroke-width="1.5" fill="none"/><circle cx="26" cy="-4" r="8" fill="#7fb35c" stroke="#2f5a25" stroke-width="2"/><circle cx="28" cy="-6" r="1.6" fill="#122b24"/><path d="M24 0Q28-2 31 1" stroke="#122b24" stroke-width="1.4" fill="none"/></g>`,
      );
    },
    'clay-map'(u) {
      const cities = [
        [0, -30],
        [28, -10],
        [20, 24],
        [-16, 30],
        [-34, 2],
        [-6, -2],
        [6, -52],
      ];
      return svgEl(
        '0 0 240 210',
        `<defs><radialGradient id="${u}c" cx="40%" cy="35%"><stop offset="0" stop-color="#d9a774"/><stop offset="1" stop-color="#9c6838"/></radialGradient>
          <filter id="${u}t"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .18  0 0 0 0 .08  0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs>
        <ellipse cx="120" cy="196" rx="84" ry="9" fill="#12302026"/>
        <circle cx="120" cy="104" r="92" fill="url(#${u}c)" stroke="#7a4e24" stroke-width="3"/>
        <circle cx="120" cy="104" r="92" fill="#fff" filter="url(#${u}t)"/>
        <circle cx="120" cy="104" r="80" fill="none" stroke="#6b3f18" stroke-width="3"/><circle cx="120" cy="104" r="64" fill="none" stroke="#6b3f18" stroke-width="3"/>
        <path d="${Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2;
          return `M${(120 + Math.cos(a) * 68).toFixed(1)} ${(104 + Math.sin(a) * 68).toFixed(1)}L${(120 + Math.cos(a + 0.12) * 76).toFixed(1)} ${(104 + Math.sin(a + 0.12) * 76).toFixed(1)}`;
        }).join('')}" stroke="#7a4e24" stroke-width="2"/>
        ${cities.map(([x, y]) => `<circle cx="${120 + x}" cy="${104 + y}" r="7" fill="#c48f55" stroke="#6b3f18" stroke-width="2.5"/>`).join('')}
        <path d="M80 70H150M76 140H160M100 54V150" stroke="#7a4e2488" stroke-width="2"/>
        <path d="M170 46L180 60 174 66 186 80" fill="none" stroke="#5a3412" stroke-width="2"/>`,
      );
    },
    eclipse(u) {
      return svgEl(
        '0 0 340 170',
        `<rect width="340" height="170" rx="16" fill="#0b1a3a"/>
        ${Array.from({ length: 20 }, (_, i) => `<circle cx="${(i * 71 + 11) % 340}" cy="${(i * 43 + 9) % 170}" r="1" fill="#fff" opacity=".6"/>`).join('')}
        <path d="M180 64L292 76V96L180 106Z" fill="#000" opacity=".45"/>
        <g transform="translate(52 85)"><circle r="36" fill="#ffd23f"/><g stroke="#ffb627" stroke-width="4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((d) => `<path transform="rotate(${d})" d="M0-43V-52"/>`).join('')}</g></g>
        <circle cx="178" cy="85" r="24" fill="#3f8fc9"/><path d="M164 74C172 66 186 70 184 80S170 90 166 86Z M178 96C186 92 196 96 194 102L186 106Z" fill="#8cc36a"/>
        <defs><clipPath id="${u}m"><circle cx="290" cy="86" r="17"/></clipPath></defs>
        <circle cx="290" cy="86" r="17" fill="#e6e2d6"/><g clip-path="url(#${u}m)"><circle cx="276" cy="86" r="24" fill="#8b3a2a" opacity=".9"/></g>
        <circle cx="290" cy="86" r="17" fill="none" stroke="#fff" stroke-opacity=".5"/>`,
      );
    },
    ship(u) {
      const wave = (y, c) =>
        `<path d="M0 ${y}${Array.from({ length: 9 }, (_, i) => `Q${i * 40 + 20} ${y - 8} ${i * 40 + 40} ${y}`).join('')}V200H0Z" fill="${c}"/>`;
      const sail = (x, y, w, hh) =>
        `<path d="M${x - w / 2} ${y}Q${x} ${y + 6} ${x + w / 2} ${y}L${x + w / 2 - 3} ${y + hh}Q${x} ${y + hh + 8} ${x - w / 2 + 3} ${y + hh}Z" fill="#fffaf0" stroke="#8a6d4a" stroke-width="1.5"/><path d="M${x} ${y + 6}V${y + hh}M${x - w / 4} ${y + hh / 2 + 2}H${x + w / 4}" stroke="#c0392b" stroke-width="4"/>`;
      return svgEl(
        '0 0 340 210',
        `<rect width="340" height="210" rx="16" fill="#cfe9f7"/>
        <g transform="translate(290 46)"><circle r="26" fill="#3f8fc9" stroke="#1d4f73" stroke-width="2"/><ellipse rx="34" ry="12" fill="none" stroke="#d9473b" stroke-width="2.5" stroke-dasharray="5 4" transform="rotate(-18)"/></g>
        <path d="M118 46V150M168 32V150M214 56V150" stroke="#6b4423" stroke-width="4"/>
        ${sail(118, 58, 46, 38)}${sail(118, 102, 52, 34)}${sail(168, 42, 56, 44)}${sail(168, 94, 62, 44)}${sail(214, 66, 40, 50)}
        <path d="M74 140H252L232 176H96Z" fill="#8a5a33" stroke="#5e3a1d" stroke-width="2"/><path d="M80 148H246" stroke="#c48f55" stroke-width="3"/>
        <path d="M168 32L186 38 168 44Z" fill="#d9473b"/>
        ${wave(176, '#3f8fc9')}${wave(188, '#2a74ad')}`,
      );
    },
  };

  const art = (key) => {
    if (!key) return null;
    const u = uid();
    if (key.startsWith('world-highlight:')) {
      const m = worldMap({ highlight: key.split(':')[1] });
      if (!m) return null;
      m.el.classList.add('art-svg', 'art-world');
      return m.el;
    }
    if (key.startsWith('spain-')) {
      const kind = key.slice(6);
      const b = spainBase(u, { parchment: kind === 'historico' });
      if (!b || !SPAIN[kind]) return null;
      return svgEl('0 0 600 480', SPAIN[kind](u, b), 'art-svg art-spain');
    }
    const fn = ART[key];
    if (!fn) return null;
    try {
      return fn(u);
    } catch {
      return null;
    }
  };

  // ---------------- Label scenes ----------------
  // scene(name) → { el: svg, box: [w, h], spots: [{ id, x, y, w }] } — x/y = slot centre, w = slot width (all in viewBox units).
  const leader = (x1, y1, x2, y2) =>
    `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#2c4a3e" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6" fill="#d9473b" stroke="#fff" stroke-width="2.5"/>`;

  const SCENES = {
    globe() {
      const u = uid();
      const cx = 300;
      const cy = 200;
      const r = 118;
      const g = globeMarkup(u, cx, cy, r);
      const p = (x, y) => g.rot([x, y]).map((v) => Math.round(v));
      const spots = [
        { id: 'ecuador', x: 92, y: 140, w: 170, at: p(-r * 0.72, r * 0.17) },
        { id: 'eje', x: 92, y: 248, w: 170, at: p(0, r * 0.6) },
        { id: 'polo-sur', x: 92, y: 356, w: 170, at: p(0, r) },
        { id: 'polo-norte', x: 508, y: 64, w: 170, at: p(0, -r) },
        { id: 'hemisferio-norte', x: 508, y: 176, w: 170, at: p(r * 0.42, -r * 0.5) },
        { id: 'hemisferio-sur', x: 508, y: 290, w: 170, at: p(r * 0.48, r * 0.46) },
      ];
      const lines = spots.map((s) => leader(s.x, s.y, s.at[0], s.at[1])).join('');
      return { el: svgEl('0 0 600 400', `${g.markup}${lines}`, 'scene-svg'), box: [600, 400], spots };
    },
    'map-elements'() {
      const S = MAPS()?.spain;
      const spainMap = S
        ? `<svg x="170" y="92" width="200" height="168" viewBox="15 45 520 400"><path d="${S.outline}" fill="#b7dd96" stroke="#2c4a3e" stroke-width="3" stroke-linejoin="round"/>
          <g fill="#d9473b" stroke="#fff" stroke-width="4">${S.cities
            .slice(0, 4)
            .map((c) => `<circle cx="${c.x}" cy="${c.y}" r="10"/>`)
            .join('')}</g>
          <path d="M238 100C262 116 290 132 320 152S385 196 418 214M278 140C250 142 228 146 200 154S130 166 60 170" fill="none" stroke="#2f86d6" stroke-width="7" stroke-linecap="round"/></svg>`
        : '';
      const inner = `<rect x="140" y="22" width="320" height="356" rx="10" fill="#fffdf5" stroke="#2c4a3e" stroke-width="2.5"/>
        <rect x="140" y="22" width="320" height="356" rx="10" fill="#cfe7f5" opacity=".35"/>
        <rect x="168" y="38" width="264" height="40" rx="8" fill="#fff" stroke="#2c4a3e" stroke-width="2"/>
        <text x="300" y="65" text-anchor="middle" font-size="20" font-weight="900" fill="#122b24">Mapa de España</text>
        ${spainMap}
        ${miniRose(412, 150, 30)}
        <g transform="translate(168 300)"><path d="M0 0H120" stroke="#2c4a3e" stroke-width="2"/><rect x="0" y="-6" width="40" height="12" fill="#2c4a3e"/><rect x="40" y="-6" width="40" height="12" fill="#fff" stroke="#2c4a3e" stroke-width="2"/><rect x="80" y="-6" width="40" height="12" fill="#2c4a3e"/>
          <g font-size="14" font-weight="800" fill="#122b24" text-anchor="middle"><text x="0" y="26">0</text><text x="80" y="26">200</text><text x="122" y="26">km</text></g></g>
        <g transform="translate(318 282)"><rect width="122" height="82" rx="8" fill="#fff" stroke="#2c4a3e" stroke-width="2"/>
          <circle cx="20" cy="22" r="7" fill="#d9473b" stroke="#fff" stroke-width="2"/><path d="M38 22H104" stroke="#9aa89e" stroke-width="6" stroke-linecap="round"/>
          <path d="M10 44Q20 36 30 44" fill="none" stroke="#2f86d6" stroke-width="5" stroke-linecap="round"/><path d="M38 44H90" stroke="#9aa89e" stroke-width="6" stroke-linecap="round"/>
          <rect x="11" y="56" width="18" height="14" rx="3" fill="#b7dd96" stroke="#2c4a3e"/><path d="M38 63H98" stroke="#9aa89e" stroke-width="6" stroke-linecap="round"/></g>`;
      const spots = [
        { id: 'titulo', x: 72, y: 58, w: 130, at: [168, 58] },
        { id: 'escala', x: 72, y: 300, w: 130, at: [168, 300] },
        { id: 'rosa', x: 528, y: 150, w: 130, at: [444, 150] },
        { id: 'leyenda', x: 528, y: 322, w: 130, at: [440, 322] },
      ];
      const lines = spots.map((s) => leader(s.x, s.y, s.at[0], s.at[1])).join('');
      return { el: svgEl('0 0 600 400', inner + lines, 'scene-svg'), box: [600, 400], spots };
    },
    'compass-rose'() {
      const c = 200;
      const pt = (dx, dy, rr) => `M${c} ${c}L${c + dx * rr - dy * 22} ${c + dy * rr + dx * 22}L${c + dx * (rr + 1)} ${c + dy * (rr + 1)}Z`;
      const main = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
      ];
      const inner = `<circle cx="${c}" cy="${c}" r="150" fill="#fffdf5" stroke="#c8a24a" stroke-width="3"/>
        <circle cx="${c}" cy="${c}" r="112" fill="none" stroke="#c8a24a" stroke-width="1.5" stroke-dasharray="3 6"/>
        <g transform="rotate(45 ${c} ${c})">${main.map(([dx, dy]) => `<path d="${pt(dx, dy, 70)}" fill="#9fb7a6"/>`).join('')}</g>
        ${main.map(([dx, dy], i) => `<path d="M${c} ${c}L${c + dx * 120} ${c + dy * 120}L${c + dx * 22 - dy * 22} ${c + dy * 22 + dx * 22}Z" fill="${i === 0 ? '#d9473b' : '#2c4a3e'}"/><path d="M${c} ${c}L${c + dx * 120} ${c + dy * 120}L${c + dx * 22 + dy * 22} ${c + dy * 22 - dx * 22}Z" fill="${i === 0 ? '#a8322a' : '#557066'}"/>`).join('')}
        <circle cx="${c}" cy="${c}" r="14" fill="#c8a24a" stroke="#fffdf5" stroke-width="4"/>`;
      const spots = [
        { id: 'n', x: 200, y: 32, w: 76 },
        { id: 'e', x: 368, y: 200, w: 76 },
        { id: 's', x: 200, y: 368, w: 76 },
        { id: 'o', x: 32, y: 200, w: 76 },
      ];
      return { el: svgEl('0 0 400 400', inner, 'scene-svg'), box: [400, 400], spots };
    },
  };
  const scene = (name) => (SCENES[name] ? SCENES[name]() : null);

  // ---------------- Aerial view («Creo un mapa») ----------------
  // Zones are groups of shapes; band = road/river drawn as thick outlined strokes.
  const AERIAL = [
    {
      id: 'naturales',
      shapes: [
        'M0 0H232C214 40 240 84 206 120 176 150 120 140 82 166 52 182 22 170 0 180Z',
        'M472 300C502 280 560 284 600 298V400H452C438 368 448 322 472 300Z',
      ],
    },
    {
      id: 'cultivo',
      shapes: [
        'M10 266L98 262 92 332 8 336Z',
        'M8 346L90 342 84 400H4Z',
        'M128 262L232 258C218 300 204 328 192 346H122Z',
        'M472 236L594 226 598 288C560 280 502 284 476 298Z',
      ],
    },
    { id: 'rio', band: 34, shapes: ['M322 0C312 80 362 140 322 202S202 300 172 400'] },
    {
      id: 'caminos',
      band: 15,
      shapes: [
        'M0 238C150 246 250 236 300 230S470 210 600 202',
        'M446 206C452 150 464 90 470 0',
        'M118 244C110 300 100 350 94 400',
        'M462 100C510 98 540 100 600 96',
      ],
    },
    {
      id: 'construidas',
      shapes: ['M366 116L428 108 434 182 372 190Z', 'M490 112L570 106 576 172 498 180Z', 'M362 256L432 248 438 300 368 308Z'],
    },
    { id: 'puente', shapes: ['M290 215L348 209 352 243 294 249Z'] },
  ];
  const AERIAL_DECOR = `
    <g class="ae-decor" fill="none" stroke="#6d6a60" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M36 78L62 38 88 78M92 62L120 24 150 62M150 84L176 48 202 84"/>
      ${[
        [40, 120],
        [70, 140],
        [110, 116],
        [150, 112],
        [30, 156],
        [190, 30],
        [20, 30],
        [500, 330],
        [540, 316],
        [574, 334],
        [490, 372],
        [532, 362],
        [574, 378],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`)
        .join('')}
      <path d="M20 280L88 278M18 296L86 294M16 312L84 310M14 360L82 358M12 378L80 376M138 280L218 276M136 298L208 294M134 316L200 312M486 248L586 240M486 264L590 256M490 280L566 274"/>
      ${[
        [378, 124],
        [398, 120],
        [380, 150],
        [404, 146],
        [384, 170],
        [504, 120],
        [528, 118],
        [550, 116],
        [506, 146],
        [534, 144],
        [376, 262],
        [400, 260],
        [380, 284],
        [410, 280],
      ]
        .map(([x, y]) => `<rect x="${x}" y="${y}" width="16" height="13"/><path d="M${x} ${y}L${x + 8} ${y - 6} ${x + 16} ${y}"/>`)
        .join('')}
      <path d="M296 220L346 214M298 246L350 240" stroke-width="2.4"/>
    </g>`;

  const aerial = () => {
    const u = uid();
    const el = svgEl(
      '0 0 600 400',
      `<defs>
        <filter id="${u}paper"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .37  0 0 0 0 .3  0 0 0 .12 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
        ${['rojo', 'morado', 'marron', 'verde', 'amarillo', 'azul'].map((c) => `<pattern id="${u}h-${c}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" class="crayon-bg c-${c}"/><path d="M0 0V8" class="crayon-line c-${c}" stroke-width="3.5"/></pattern>`).join('')}
      </defs>
      <rect width="600" height="400" rx="12" fill="#e9eadf"/><rect width="600" height="400" rx="12" fill="#fff" filter="url(#${u}paper)"/>`,
      'aerial-svg',
    );
    const zones = new Map();
    for (const z of AERIAL) {
      const g = node('g', { class: `ae-zone${z.band ? ' is-band' : ''}`, 'data-zone': z.id, tabindex: '0', role: 'button' });
      for (const d of z.shapes) {
        if (z.band) {
          g.append(node('path', { d, class: 'ae-hit', 'stroke-width': z.band + 18 }));
          g.append(node('path', { d, class: 'ae-edge', 'stroke-width': z.band + 4 }));
          g.append(node('path', { d, class: 'ae-fill', 'stroke-width': z.band }));
        } else {
          g.append(node('path', { d, class: 'ae-fill ae-shape' }));
        }
      }
      el.append(g);
      zones.set(z.id, g);
    }
    el.insertAdjacentHTML('beforeend', AERIAL_DECOR);
    // Decorations must sit under bridge/roads visually but never catch taps.
    const paint = (id, color) => {
      const g = zones.get(id);
      if (!g) return;
      g.classList.add('is-painted');
      g.querySelectorAll('.ae-fill').forEach((p) => {
        // Inline style: the stylesheet colours unpainted zones and would win over attributes.
        if (g.classList.contains('is-band')) p.style.stroke = `url(#${u}h-${color})`;
        else p.style.fill = `url(#${u}h-${color})`;
      });
    };
    return { el, zones, paint };
  };

  // Decorative school globe for the hub.
  const hero = () => svgEl('0 0 300 330', globeMarkup(uid(), 150, 142, 100).markup, 'hero-svg');

  return {
    art,
    worldMap,
    scene,
    aerial,
    hero,
    has: (key) => !!key && (key in ART || key.startsWith('world-highlight:') || (key.startsWith('spain-') && key.slice(6) in SPAIN)),
  };
})();
