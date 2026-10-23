// Drawings for «Lenguas por el mundo»: task illustrations (`art`) as travel postcards with a stamp, the label scenes
// (a note and a notice pinned to a corkboard) and the hub hero — an airport window: every passed station is a plane that
// has taken off, the others wait on the apron. Plain SVG, our own drawings (never scans from the book).
// window.LEArt = { art(key) → Element|null, scene(name) → ExamScene|null, hero() → Element, has(key) }
// @ts-check
'use strict';

window.LEArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `le${++uidN}`;
    const svgEl = (/** @type {string} */ viewBox, inner = '', cls = 'art-svg') => {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('viewBox', viewBox);
      el.setAttribute('class', cls);
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('focusable', 'false');
      el.innerHTML = inner;
      return el;
    };
    const esc = (/** @type {string} */ s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, /** @type {string} */ inner, flip = false) =>
      `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">${inner}</g>`;
    // Handwriting: a class (index.html), so a device without a handwriting font falls back to a rounded sans, not to a serif.
    const HAND = 'class="le-hand"';

    // ---------------- Pieces ----------------
    const sun = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r) =>
      `<circle cx="${x}" cy="${y}" r="${r * 1.5}" fill="#ffd97a" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffc94a"/>`;
    const cloud = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      at(x, y, s, '<path d="M-26 0Q-30 -12 -18 -14Q-14 -26 0 -22Q10 -30 20 -18Q32 -18 30 0Z" fill="#fff" fill-opacity=".9"/>');
    const acacia = (/** @type {string} */ c) =>
      `<path d="M-1 0L1 -22M0 -14L-8 -24M1 -16L9 -25" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="0" cy="-27" rx="22" ry="5.5" fill="${c}"/>`;
    const giraffe = `<g fill="#e3a94e"><rect x="-12" y="-26" width="3" height="26" rx="1.5"/><rect x="-4" y="-26" width="3" height="26" rx="1.5"/><rect x="6" y="-26" width="3" height="26" rx="1.5"/><rect x="12" y="-26" width="3" height="26" rx="1.5"/>
      <ellipse cx="1" cy="-30" rx="16" ry="8"/><path d="M10 -34L22 -62L28 -60L18 -32Z"/><ellipse cx="27" cy="-64" rx="7" ry="4" transform="rotate(-20 27 -64)"/></g>
      <path d="M22 -68v-5M26 -69v-5" stroke="#8a5a2b" stroke-width="1.6" stroke-linecap="round"/><g fill="#a8642a"><circle cx="-5" cy="-31" r="2.2"/><circle cx="4" cy="-28" r="2"/><circle cx="9" cy="-33" r="1.8"/><circle cx="17" cy="-46" r="1.6"/><circle cx="20" cy="-55" r="1.4"/></g>`;
    const savanna = (/** @type {string} */ u, dusk = false) =>
      `<defs><linearGradient id="${u}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dusk ? '#f6c48c' : '#ffe2a0'}"/><stop offset="1" stop-color="${dusk ? '#fde9cf' : '#fff6dc'}"/></linearGradient></defs>
       <rect width="276" height="176" fill="url(#${u}sk)"/>${sun(214, 52, 18)}
       <path d="M0 112Q70 104 140 110T276 106V176H0Z" fill="#e7c06a"/>${at(30, 112, 0.9, acacia('#b88a4a'))}${at(250, 110, 0.7, acacia('#b88a4a'))}
       <path d="M0 132Q80 122 160 130T276 126V176H0Z" fill="#dcae55"/>
       <g stroke="#c8963c" stroke-width="1.6" stroke-linecap="round">${[20, 46, 70, 196, 228, 258].map((x, i) => `<path d="M${x} ${150 + (i % 3) * 6}l-3 -8M${x + 3} ${150 + (i % 3) * 6}l1 -10M${x + 6} ${150 + (i % 3) * 6}l4 -8"/>`).join('')}</g>`;
    const trunk = `<path d="M-22 0Q-30 -2 -26 -20Q-20 -60 -18 -88Q-18 -96 0 -96Q18 -96 18 -88Q20 -60 26 -20Q30 -2 22 0Z" fill="#a58466"/>
      <path d="M4 -94Q18 -96 18 -88Q20 -60 26 -20Q30 -2 22 0H8Q16 -40 4 -94Z" fill="#8c6c50"/>
      <path d="M-10 -80Q-6 -50 -12 -18M6 -70Q10 -44 6 -14" stroke="#7f6047" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;

    // King Midas (bust, facing right) with a hand held out.
    const king = `<path d="M-38 70Q-40 20 -8 10Q24 6 34 30L40 70Z" fill="#b8323a"/><path d="M-8 12Q4 34 16 12" fill="#f3e4c4"/>
      <path d="M-30 34Q-34 60 -26 70M30 38Q32 56 30 70" stroke="#ffd25a" stroke-width="4" fill="none"/>
      <circle cx="0" cy="-12" r="22" fill="#f1c6a0"/><path d="M-20 -6Q-22 22 0 26Q22 22 20 -6Q12 6 0 6Q-12 6 -20 -6Z" fill="#e8e2d8"/>
      <path d="M-8 6Q0 10 8 6" stroke="#b07a6a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="-7" cy="-14" r="2.2" fill="#2a2420"/><circle cx="9" cy="-14" r="2.2" fill="#2a2420"/><path d="M-12 -20q4 -3 8 0M5 -20q4 -3 8 0" stroke="#9a8a7a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M-20 -30L-22 -50L-11 -40L0 -54L11 -40L22 -50L20 -30Z" fill="#ffc94a" stroke="#d99a1c" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="0" cy="-37" r="3" fill="#d9473b"/><circle cx="-13" cy="-35" r="2.2" fill="#3f8fc9"/><circle cx="13" cy="-35" r="2.2" fill="#3f8fc9"/>
      <path d="M28 34Q56 26 78 18" stroke="#b8323a" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="84" cy="16" r="8" fill="#f1c6a0"/>
      <path d="M90 12l8 -3M91 17l8 0" stroke="#f1c6a0" stroke-width="4" stroke-linecap="round"/>`;
    const sparkle = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s) =>
      `<path d="M${x} ${y - s}L${x + s * 0.25} ${y - s * 0.25}L${x + s} ${y}L${x + s * 0.25} ${y + s * 0.25}L${x} ${y + s}L${x - s * 0.25} ${y + s * 0.25}L${x - s} ${y}L${x - s * 0.25} ${y - s * 0.25}Z" fill="#fff6c8"/>`;

    // A kid in a goalkeeper jersey on the phone (facing right).
    const kid = `<path d="M-34 70Q-36 26 -4 20Q30 18 36 44L40 70Z" fill="#2f9a5a"/><path d="M-4 20Q4 30 14 20" fill="#24804a"/>
      <path d="M-18 40h40M-16 52h44" stroke="#5cc07f" stroke-width="5"/>
      <circle cx="2" cy="-6" r="22" fill="#f4c9a3"/><path d="M-20 -8Q-22 -32 2 -32Q26 -32 24 -10Q16 -22 2 -22Q-10 -22 -20 -8Z" fill="#6b3f22"/>
      <circle cx="10" cy="-6" r="2.4" fill="#1f2a22"/><path d="M8 6Q14 10 20 5" stroke="#9a4a32" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="-14" cy="-2" r="5" fill="#eab18e"/>
      <path d="M-24 40Q-30 10 -18 -8" stroke="#2f9a5a" stroke-width="13" fill="none" stroke-linecap="round"/>
      <rect x="-26" y="-30" width="13" height="26" rx="3" fill="#2b3a4a" transform="rotate(-16 -20 -17)"/><rect x="-24" y="-27" width="9" height="18" rx="1.5" fill="#7fc8f0" transform="rotate(-16 -20 -17)"/>
      <circle cx="-16" cy="-8" r="7.5" fill="#f2b134"/><path d="M-21 -12h10" stroke="#e0951c" stroke-width="2"/>`;

    // ---------------- Postcard frame (inner area 0..276 × 0..176) ----------------
    const card = (
      /** @type {string} */ u,
      /** @type {string} */ inner,
      /** @type {number} */ tilt,
      /** @type {string} */ stamp,
      /** @type {string} */ hue,
    ) => `
      <defs><filter id="${u}sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#2a2a40" flood-opacity=".2"/></filter>
      <clipPath id="${u}cl"><rect width="276" height="176" rx="8"/></clipPath></defs>
      <g transform="rotate(${tilt} 160 112)">
        <rect x="12" y="12" width="296" height="200" rx="12" fill="#fffdf8" filter="url(#${u}sh)"/>
        <g transform="translate(22 22)"><g clip-path="url(#${u}cl)">${inner}</g><rect width="276" height="176" rx="8" fill="none" stroke="#000" stroke-opacity=".1"/></g>
        <g transform="translate(256 6) rotate(6)">
          <rect x="-2" y="-2" width="48" height="58" rx="2" fill="#fffdf8" stroke="#d8cfbe" stroke-width="3" stroke-dasharray="0.1 5.4" stroke-linecap="round"/>
          <rect x="4" y="4" width="36" height="46" rx="2" fill="${hue}"/><text x="22" y="35" text-anchor="middle" font-size="22">${stamp}</text>
        </g>
        <g fill="none" stroke="#5a5a72" stroke-opacity=".55" stroke-width="1.6"><circle cx="248" cy="40" r="17"/><path d="M226 54q8 -5 16 0t16 0t16 0M224 62q8 -5 16 0t16 0t16 0"/></g>
      </g>`;

    /** @type {Record<string, { draw: (u: string) => string, stamp: string, hue: string }>} */
    const ART = {
      baobab: {
        stamp: '🌳',
        hue: '#b5652a',
        draw: (u) => {
          const flowers = [
            [-48, -112],
            [-20, -140],
            [18, -136],
            [52, -116],
            [-60, -92],
            [0, -118],
            [34, -98],
            [-30, -100],
            [62, -96],
          ]
            .map(
              ([x, y], i) =>
                `<g transform="translate(${x} ${y})"><circle r="5" fill="${i % 3 ? '#fff' : '#ffd6e6'}"/><circle r="5" cx="4" cy="3" fill="${i % 3 ? '#fff' : '#ffd6e6'}"/><circle r="2.2" cx="2" cy="1.5" fill="#f2b134"/></g>`,
            )
            .join('');
          return `${savanna(u)}${at(232, 150, 0.9, giraffe)}
            <g transform="translate(128 160)">${trunk}
              <path d="M-18 -86Q-34 -96 -44 -106M18 -86Q36 -96 44 -110M0 -96V-112" stroke="#8c6c50" stroke-width="7" stroke-linecap="round"/>
              <g fill="#4f9a3d"><circle cx="-56" cy="-104" r="22"/><circle cx="56" cy="-106" r="22"/><circle cx="-26" cy="-126" r="26"/><circle cx="26" cy="-126" r="26"/><circle cx="0" cy="-138" r="24"/></g>
              <g fill="#66b04a"><circle cx="-40" cy="-114" r="18"/><circle cx="42" cy="-118" r="18"/><circle cx="-8" cy="-130" r="20"/><circle cx="18" cy="-112" r="18"/><circle cx="-24" cy="-104" r="15"/></g>
              ${flowers}</g>`;
        },
      },
      'baobab-reves': {
        stamp: '🌳',
        hue: '#8c6c50',
        draw: (u) => `${savanna(u, true)}
            <g transform="translate(128 160)">${trunk}
              <g stroke="#8c6c50" stroke-linecap="round" fill="none">
                <path d="M-14 -90Q-26 -104 -24 -122M-24 -112Q-38 -114 -44 -126" stroke-width="6"/>
                <path d="M-2 -94Q-6 -114 2 -132M0 -118Q10 -124 12 -136" stroke-width="5.5"/>
                <path d="M12 -90Q24 -104 38 -110M30 -106Q34 -120 30 -130M38 -110Q48 -108 54 -118" stroke-width="5"/>
                <path d="M-24 -122l-4 -8M2 -132l-3 -7M54 -118l4 -6M-44 -126l-6 -4" stroke-width="3"/></g>
              <path d="M-36 2Q0 -8 36 2Z" fill="#b8874a"/></g>
            <g fill="#d8b48a"><circle cx="70" cy="160" r="2"/><circle cx="196" cy="162" r="2.4"/></g>`,
      },
      midas: {
        stamp: '👑',
        hue: '#c9a227',
        draw: (
          u,
        ) => `<defs><linearGradient id="${u}wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e7c8"/><stop offset="1" stop-color="#ecd6aa"/></linearGradient>
            <radialGradient id="${u}gd" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#ffcb3a"/><stop offset="1" stop-color="#c98a10"/></radialGradient></defs>
            <rect width="276" height="176" fill="url(#${u}wl)"/>
            <g fill="#e2c891"><rect x="10" y="0" width="22" height="176"/><rect x="244" y="0" width="22" height="176"/></g><g fill="#d4b77c"><rect x="6" y="0" width="30" height="10"/><rect x="240" y="0" width="30" height="10"/></g>
            <path d="M0 150H276V176H0Z" fill="#9a5a3a"/><path d="M150 132H262V150H150Z" fill="#7a4428"/><path d="M144 126H266V134H144Z" fill="#a8683f"/>
            ${at(84, 112, 1, king)}
            <circle cx="198" cy="112" r="15" fill="url(#${u}gd)"/><path d="M198 97q2 -8 8 -10" stroke="#c98a10" stroke-width="2.6" fill="none" stroke-linecap="round"/>
            <path d="M206 92q8 -4 12 2q-8 4 -12 -2Z" fill="#ffcb3a"/>
            <circle cx="236" cy="114" r="13" fill="#d9473b"/><path d="M236 101q2 -6 7 -8" stroke="#6a4a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M243 95q7 -3 10 2q-6 3 -10 -2Z" fill="#5fa83d"/>
            <ellipse cx="231" cy="109" rx="3.4" ry="2" fill="#fff" opacity=".5"/>
            ${sparkle(182, 96, 7)}${sparkle(214, 128, 5)}${sparkle(206, 84, 4)}${sparkle(186, 124, 3.4)}`,
      },
      telefono: {
        stamp: '📞',
        hue: '#d4752e',
        draw: (
          u,
        ) => `<defs><linearGradient id="${u}wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3f1fb"/><stop offset="1" stop-color="#cfe6f6"/></linearGradient></defs>
            <rect width="276" height="176" fill="url(#${u}wl)"/>
            <rect x="170" y="22" width="70" height="52" rx="4" fill="#fff" stroke="#b9cbd8" stroke-width="2"/><rect x="176" y="28" width="58" height="40" fill="#5fae5a"/>
            <circle cx="205" cy="48" r="12" fill="#fff"/><path d="M205 36l4 7l-4 5l-4 -5Z M197 50l5 -2l3 6l-6 2Z M213 50l-5 -2l-3 6l6 2Z" fill="#2b2b30"/>
            <path d="M0 150H276V176H0Z" fill="#b48a62"/><path d="M0 150H276" stroke="#9a7450" stroke-width="2"/>
            ${at(108, 106, 1.15, kid)}
            <g fill="none" stroke="#d4752e" stroke-width="3" stroke-linecap="round"><path d="M62 52q-8 10 0 20"/><path d="M52 44q-14 18 0 36"/></g>
            <g transform="translate(172 92)"><path d="M0 0H74Q84 0 84 10V30Q84 40 74 40H18L6 50L8 40H0Q-10 40 -10 30V10Q-10 0 0 0Z" fill="#fff" stroke="#b9cbd8" stroke-width="2"/>
              <g fill="#d4752e"><circle cx="20" cy="20" r="4"/><circle cx="37" cy="20" r="4"/><circle cx="54" cy="20" r="4"/></g></g>`,
      },
    };
    const TILT = [-2, 1.6, -1.2, 2];
    const art = (/** @type {string} */ key) => {
      const a = key && ART[key];
      if (!a) return null;
      const u = uid();
      const n = Object.keys(ART).indexOf(key);
      return svgEl('0 0 320 224', card(u, a.draw(u), TILT[n % TILT.length], a.stamp, a.hue), 'art-svg le-card');
    };

    // ---------------- Label scenes: paper pinned to a corkboard (600 × 400) ----------------
    const leader = (/** @type {number} */ x1, /** @type {number} */ y1, /** @type {number} */ x2, /** @type {number} */ y2) =>
      `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#3a2a1a" stroke-width="2.6" stroke-dasharray="1 5.5" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="6" fill="#d9473b" stroke="#fff" stroke-width="2.5"/>`;
    const cork = (/** @type {string} */ u) => {
      let dots = '';
      let s = 7;
      const r = () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
      for (let i = 0; i < 160; i++)
        dots += `<circle cx="${(r() * 600).toFixed(0)}" cy="${(r() * 400).toFixed(0)}" r="${(1 + r() * 1.8).toFixed(1)}" fill="${i % 2 ? '#a87a46' : '#e0b880'}"/>`;
      return `<defs><clipPath id="${u}fr"><rect width="600" height="400" rx="18"/></clipPath></defs>
        <g clip-path="url(#${u}fr)"><rect width="600" height="400" fill="#c99a62"/>${dots}</g>
        <rect x="3" y="3" width="594" height="394" rx="16" fill="none" stroke="#8a5a2b" stroke-width="6"/>`;
    };
    const pin = (/** @type {number} */ x, /** @type {number} */ y, /** @type {string} */ c) =>
      `<ellipse cx="${x + 3}" cy="${y + 6}" rx="9" ry="4" fill="#000" opacity=".2"/><circle cx="${x}" cy="${y}" r="10" fill="${c}"/><circle cx="${x - 3}" cy="${y - 3}" r="3.4" fill="#fff" opacity=".6"/>`;
    const sceneOf = (
      /** @type {string} */ inner,
      /** @type {{ id: string, x: number, y: number, w: number, at: number[] }[]} */ spots,
      /** @type {string} */ cls,
    ) => {
      const lines = spots.map((s) => leader(s.x, s.y, s.at[0], s.at[1])).join('');
      return { el: svgEl('0 0 600 400', inner + lines, `scene-svg ${cls}`), box: /** @type {[number, number]} */ ([600, 400]), spots, cls };
    };
    const lines = (/** @type {string[]} */ rows, /** @type {number} */ x, /** @type {number} */ y0, /** @type {number} */ dy, attrs = '') =>
      rows.map((t, i) => `<text x="${x}" y="${y0 + i * dy}" ${attrs}>${esc(t)}</text>`).join('');

    /** @type {Record<string, () => ExamScene>} */
    const SCENES = {
      // A handwritten note (book: «la nota»): who it is for, the message, the signature.
      nota() {
        const u = uid();
        const inner = `${cork(u)}
          <g transform="rotate(-2 300 205)">
            <path d="M176 34H434V380H190Q176 380 176 366Z" fill="#000" opacity=".16" transform="translate(5 7)"/>
            <path d="M176 34H434V380H190Q176 380 176 366Z" fill="#fff3a0"/><path d="M176 34H434V60H176Z" fill="#ffe97a"/>
            <g fill="#2b3a6a" ${HAND}>
              <text x="196" y="102" font-size="30" font-weight="700">Mamá:</text>
              ${lines(['Hoy tengo', 'entrenamiento.', 'Vuelvo a las siete.', '¡No te olvides de', 'mis guantes!'], 204, 146, 31, 'font-size="23"')}
              <text x="414" y="318" font-size="23" text-anchor="end">Un beso,</text>
              <text x="414" y="358" font-size="31" font-weight="700" text-anchor="end">Leo</text></g>
            ${pin(305, 46, '#d9473b')}</g>`;
        return sceneOf(
          inner,
          [
            { id: 'destinatario', x: 92, y: 98, w: 168, at: [186, 96] },
            { id: 'mensaje', x: 512, y: 196, w: 168, at: [418, 200] },
            { id: 'firma', x: 512, y: 334, w: 168, at: [424, 346] },
          ],
          'le-scene',
        );
      },
      // A notice (book: «el aviso»): the fact it tells, an apology, who is responsible.
      aviso() {
        const u = uid();
        const inner = `${cork(u)}
          <g transform="rotate(1.2 300 205)">
            <rect x="166" y="22" width="270" height="360" fill="#000" opacity=".16" transform="translate(5 7)"/>
            <rect x="166" y="22" width="270" height="360" fill="#fffefa"/>
            <text x="301" y="86" text-anchor="middle" font-size="40" font-weight="900" fill="#c2413b" letter-spacing="3" font-family="system-ui,sans-serif">AVISO</text>
            <path d="M226 98H376" stroke="#c2413b" stroke-width="4" stroke-linecap="round"/>
            <g fill="#26303a" font-family="system-ui,sans-serif" font-size="21" font-weight="600">
              ${lines(['El partido del sábado', 'se jugará en el', 'gimnasio por la lluvia.'], 186, 150, 30)}
              ${lines(['Disculpen las', 'molestias.'], 186, 258, 30)}
              <text x="418" y="348" text-anchor="end" font-style="italic">El entrenador</text></g>
            <path d="M330 362l20 -8" stroke="#26303a" stroke-width="1.6"/>
            ${pin(186, 38, '#3f8fc9')}${pin(416, 38, '#3f8fc9')}</g>`;
        return sceneOf(
          inner,
          [
            { id: 'hecho', x: 92, y: 168, w: 168, at: [180, 176] },
            { id: 'disculpa', x: 512, y: 250, w: 168, at: [336, 254] },
            { id: 'responsable', x: 92, y: 330, w: 168, at: [282, 343] },
          ],
          'le-scene',
        );
      },
    };
    const scene = (/** @type {string} */ name) => (SCENES[name] ? SCENES[name]() : null);

    // ---------------- Hub hero: the airport window ----------------
    // A passed station (its best round gave 2+ stars, KF.gameData(slug).st) is a plane in the sky; the others wait on the apron.
    const passedIds = () => {
      const unit = window.LE_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return new Set((unit?.stations || []).filter((s) => (Number(st[s.id]?.stars) || 0) >= 2).map((s) => s.id));
    };
    /** Side view, nose to the right, ~64 long; the station icon on the tail. */
    const plane = (/** @type {string} */ hue, /** @type {string} */ icon) =>
      `<path d="M-30 -2Q-30 -9 -22 -9H18Q30 -9 34 -2Q30 4 18 4H-22Q-30 4 -30 -2Z" fill="#fff"/>
       <path d="M-30 1H33Q30 4 18 4H-22Q-30 4 -30 1Z" fill="${hue}"/>
       <path d="M-30 -8L-34 -26H-24L-12 -9Z" fill="${hue}"/>
       <path d="M-2 0L-14 14H-6L10 0Z" fill="#c9d3da"/><path d="M-2 -6L-10 -14H-4L6 -6Z" fill="#dfe6ea"/>
       <path d="M24 -7Q30 -7 32 -3H24Z" fill="#3a5a72"/><g fill="#9fc3da">${[-16, -9, -2, 5, 12].map((x) => `<circle cx="${x}" cy="-4" r="1.6"/>`).join('')}</g>
       <text x="-26" y="-12" text-anchor="middle" font-size="9">${icon}</text>`;
    // Sky spots for flying planes (climbing to the upper right) and gates on the apron (two rows of four).
    const SKY = [
      [86, 178, -12],
      [190, 166, -14],
      [292, 182, -16],
      [130, 132, -12],
      [244, 124, -13],
      [80, 104, -10],
      [178, 96, -11],
      [286, 92, -12],
    ];
    const GATE = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [64 + (i % 4) * 78, i < 4 ? 232 : 266]);
    const hero = () => {
      const u = uid();
      const unit = window.LE_CONTENT;
      const stations = unit?.stations || [];
      const hues = unit?.hues || {};
      const passed = passedIds();
      const all = stations.length > 0 && stations.every((s) => passed.has(s.id));
      let air = '';
      let ground = '';
      stations.slice(0, 8).forEach((s, i) => {
        const hue = hues[s.id] || '#3f8fc9';
        if (passed.has(s.id)) {
          const [x, y, a] = SKY[i];
          air += `<g class="le-flying" data-station="${s.id}" style="--d:${(i * 0.37).toFixed(2)}s">
            <path class="le-trail" d="M${x - 34} ${y + 4}L${x - 110} ${y + 26}" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 7" opacity=".85"/>
            ${at(x, y, 0.82, `<g transform="rotate(${a})">${plane(hue, esc(s.icon))}</g>`)}</g>`;
        } else {
          const [x, y] = GATE[i];
          ground += `<g class="le-parked" data-station="${s.id}">${at(x, y - 4, 0.95, plane(hue, esc(s.icon)))}</g>`;
        }
      });
      const inner = `<defs><clipPath id="${u}win"><rect x="18" y="74" width="324" height="208" rx="14"/></clipPath>
          <linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd6f5"/><stop offset="1" stop-color="#e6f6fd"/></linearGradient></defs>
        <rect x="10" y="66" width="340" height="224" rx="20" fill="#cfd8de"/><rect x="10" y="66" width="340" height="224" rx="20" fill="none" stroke="#a9b7c0" stroke-width="2"/>
        <g clip-path="url(#${u}win)">
          <rect x="18" y="74" width="324" height="208" fill="url(#${u}sky)"/>${sun(312, 100, 12)}${cloud(132, 96, 0.8)}${cloud(232, 150, 0.6)}
          <path d="M18 200Q90 184 170 194T342 190V282H18Z" fill="#a9d48a"/>
          <rect x="318" y="150" width="12" height="46" fill="#e9eef1"/><path d="M311 138H337L333 152H315Z" fill="#5a7488"/><rect x="314" y="141" width="20" height="6" fill="#bfe6fb"/>
          <path d="M18 206H342V282H18Z" fill="#7d8890"/><path d="M18 255H342" stroke="#f2d04a" stroke-width="3" stroke-dasharray="14 10"/>
          ${ground}${air}
        </g>
        <path d="M126 74V282M234 74V282" stroke="#cfd8de" stroke-width="5"/>
        <path d="M30 86L80 86" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/>
        <rect x="24" y="8" width="312" height="50" rx="10" fill="#1d2b36"/><path d="M180 58V66" stroke="#55616b" stroke-width="4"/>
        <rect x="34" y="16" width="34" height="34" rx="6" fill="#ffd23f"/>
        <path d="M40 41L60 25M58 25h4v4M44 40l-3 -4M52 34l-6 -3" stroke="#1d2b36" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="78" y="35" font-size="21" font-weight="900" fill="#ffd23f" letter-spacing="1.5" font-family="system-ui,sans-serif">${all ? '¡BUEN VIAJE!' : 'SALIDAS'}</text>
        <text x="79" y="50" font-size="10" font-weight="700" fill="#c9d4dc" letter-spacing="1" font-family="system-ui,sans-serif">SAIR · EXIT · SORTIR</text>
        <text x="318" y="42" text-anchor="end" font-size="22" font-weight="900" fill="${all ? '#8ee07a' : '#ffd23f'}" font-family="system-ui,sans-serif">${all ? '✓' : '↗'}</text>`;
      const el = svgEl('0 0 360 300', inner, 'hero-svg le-hero');
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
