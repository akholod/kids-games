// Drawings for «La liga de las palabras» (Lengua 3.º, Tema 3): small task stickers (`art`, 160 × 120), the shirt press of the
// forge task (`press`), the goal with its keeper of the save task (`goal`), the substitution board of the substitute task
// (`subBoard`) and the hub hero — a stadium at night: every passed station lights one more part of it.
// Plain SVG, our own drawings (never scans from the book). No DOM at load time (the unit tests load this file in a vm).
// window.LPArt = { art(key), hero(), has(key), keys(), press(), goal(), subBoard() }
// @ts-check
'use strict';

window.LPArt = /** @type {ExamArt} */ (
  (() => {
    const NS = 'http://www.w3.org/2000/svg';
    let uidN = 0;
    const uid = () => `lp${++uidN}`;
    const svgEl = (/** @type {string} */ viewBox, inner = '', cls = 'art-svg') => {
      const el = document.createElementNS(NS, 'svg');
      el.setAttribute('viewBox', viewBox);
      el.setAttribute('class', cls);
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('focusable', 'false');
      el.innerHTML = inner;
      return el;
    };
    const at = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ s, /** @type {string} */ inner) =>
      `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;

    // One outline for every drawing: a deep navy, round joins.
    const K = '#1d2b36';
    const ol = (w = 2.2) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const OL = ol();
    const THIN = ol(1.4);
    const SHIRT = '#e0483e';
    const GOLD = '#ffd23f';

    // ---------------- Pieces ----------------
    /** A ball centred on 0,0 with radius r. */
    const ball = (r = 10) =>
      `<circle r="${r}" fill="#fff" ${OL}/><path d="M0 ${-r * 0.36}l${r * 0.34} ${r * 0.25} -${r * 0.13} ${r * 0.4}h-${r * 0.42}l-${r * 0.13} -${r * 0.4}z" fill="${K}"/>
       <path d="M0 ${-r * 0.36}V${-r}M${r * 0.34} ${-r * 0.11}L${r * 0.95} ${-r * 0.3}M${r * 0.21} ${r * 0.29}L${r * 0.55} ${r * 0.8}M${-r * 0.21} ${r * 0.29}L${-r * 0.55} ${r * 0.8}M${-r * 0.34} ${-r * 0.11}L${-r * 0.95} ${-r * 0.3}" stroke="${K}" stroke-width="1.2"/>`;
    /** A T-shirt (back) centred on x = 0, top at y = 0, ~ 120 wide. */
    const shirtShape = (fill = SHIRT, trim = '#fff') =>
      `<path d="M-30 4L-14 0Q0 8 14 0L30 4L56 22L46 40L32 32V92H-32V32L-46 40L-56 22Z" fill="${fill}" ${OL}/>
       <path d="M-14 0Q0 8 14 0" fill="none" stroke="${trim}" stroke-width="3"/>
       <path d="M-52 28L-43 34M52 28L43 34" stroke="${trim}" stroke-width="3" stroke-linecap="round"/>`;
    /** A soft sticker tile 160 × 120. */
    const tile = (/** @type {string} */ tint) =>
      `<rect width="160" height="120" rx="16" fill="${tint}"/><circle cx="80" cy="54" r="52" fill="#fff" opacity=".45"/>
       <ellipse cx="80" cy="104" rx="44" ry="6" fill="${K}" opacity=".1"/>`;
    const star = (/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, fill = GOLD) =>
      `<path d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="${fill}"/>`;

    // ---------------- Task stickers (160 × 120) ----------------
    /** @type {Record<string, () => string>} */
    const ART = {
      ball: () => `${tile('#e2efcf')}${at(80, 62, 1, ball(32))}`,
      shirt: () =>
        `${tile('#fbe1e1')}${at(80, 14, 0.95, shirtShape())}<text x="80" y="88" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">10</text>`,
      goal: () =>
        `${tile('#dcefff')}<g ${THIN}><path d="M26 98V30H134V98" fill="none" stroke-width="6"/></g>
         <g stroke="#9fb7c9" stroke-width="1" opacity=".9">${Array.from({ length: 9 }, (_, i) => `<path d="M${38 + i * 11} 33V98"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<path d="M29 ${42 + i * 10}H131"/>`).join('')}</g>
         <path d="M26 98V30H134V98" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>${at(108, 78, 1, ball(12))}`,
      whistle: () =>
        `${tile('#fbefc4')}<path d="M40 54H96A22 22 0 1 1 74 76H52A12 12 0 0 1 40 64Z" fill="#c9d4dc" ${OL}/><circle cx="96" cy="76" r="9" fill="#8a9aa6" ${THIN}/>
         <path d="M40 58H28" ${ol(4)}/><path d="M118 40l10 -8M122 54l12 -2M112 30l4 -12" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
      book: () =>
        `${tile('#e1edf8')}<path d="M80 34Q58 24 30 30V96Q58 90 80 100Q102 90 130 96V30Q102 24 80 34Z" fill="#fff" ${OL}/><path d="M80 34V100" ${OL}/>
         <g stroke="#9fb7c9" stroke-width="2.4" stroke-linecap="round"><path d="M40 44H70M40 54H70M40 64H70M40 74H64M90 44H120M90 54H120M90 64H120M90 74H114"/></g>`,
      poem: () =>
        `${tile('#ece3f5')}<rect x="42" y="24" width="76" height="80" rx="8" fill="#fff" ${OL}/>
         <g stroke="#8b6fc0" stroke-width="2.8" stroke-linecap="round"><path d="M54 40H96M54 52H86M54 68H100M54 80H82"/></g>
         <text x="108" y="56" font-size="22" font-weight="900" fill="#8b6fc0">♪</text>`,
      trophy: () =>
        `${tile('#fbefc4')}<path d="M54 26H106V44Q106 72 80 76Q54 72 54 44Z" fill="${GOLD}" ${OL}/><path d="M54 34H40Q38 52 56 56M106 34H120Q122 52 104 56" fill="none" ${OL}/>
         <path d="M74 76H86V88H74Z" fill="#e5a12a" ${THIN}/><rect x="60" y="88" width="40" height="12" rx="3" fill="#a8652e" ${OL}/>${star(80, 46, 8, '#fff')}`,
      scarf: () =>
        `${tile('#e2efcf')}<path d="M20 44Q80 26 140 44L136 64Q80 46 24 64Z" fill="${SHIRT}" ${OL}/>
         <g fill="#fff"><path d="M50 40l12 -3 2 19 -12 3zM98 37l12 3 -2 19 -12 -3z"/></g><path d="M24 64l-6 18M30 62l-4 18M136 64l6 18M130 62l4 18" ${ol(2.6)}/>`,
    };
    const art = (/** @type {string} */ key) => {
      const draw = ART[key];
      return draw ? svgEl('0 0 160 120', draw(), 'art-svg lp-art') : null;
    };

    // ---------------- forge: the shirt press ----------------
    // 320 × 230. types.js writes the word into the name of the shirt (text.lp-name: tspan.lp-name-stem + tspan.lp-name-suf, ~150 wide)
    // and presses the lid (.lp-lid) down on it (index.html).
    const press = () => {
      const u = uid();
      const inner = `<defs><linearGradient id="${u}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7b3bf"/><stop offset="1" stop-color="#77838f"/></linearGradient></defs>
        <rect x="2" y="2" width="316" height="226" rx="22" fill="#f6f1e4"/>
        <rect x="26" y="44" width="268" height="178" rx="14" fill="#3b4654" ${OL}/>
        <rect x="34" y="52" width="252" height="162" rx="9" fill="#4b5767"/>
        <g class="lp-shirt">${at(160, 52, 1.8, shirtShape())}
          <text x="160" y="196" text-anchor="middle" font-size="54" font-weight="900" fill="#fff" opacity=".95" font-family="system-ui,sans-serif">10</text>
          <text class="lp-name" x="160" y="118" text-anchor="middle" font-size="30"><tspan class="lp-name-stem"></tspan><tspan class="lp-name-suf"></tspan></text></g>
        <g class="lp-lid">
          <rect x="18" y="8" width="284" height="28" rx="10" fill="url(#${u}m)" ${OL}/>
          <rect x="24" y="30" width="272" height="6" rx="3" fill="#5b6675"/>
          <circle class="lp-heat" cx="280" cy="21" r="5" fill="#ffb3a8" ${THIN}/>
          <path d="M18 22H6" ${ol(5)}/><circle cx="6" cy="22" r="5" fill="${SHIRT}" ${THIN}/>
        </g>
        <g class="lp-steam" fill="none" stroke="#9aaeb8" stroke-width="3" stroke-linecap="round" opacity="0">
          <path d="M90 46q-6 -8 0 -16q6 -8 0 -16"/><path d="M160 46q-6 -8 0 -16q6 -8 0 -16"/><path d="M230 46q-6 -8 0 -16q6 -8 0 -16"/></g>`;
      return svgEl('0 0 320 230', inner, 'lp-press-svg');
    };

    // ---------------- save: the goal, its keeper and the ball ----------------
    // 320 × 200. The poses are classes of index.html: [data-pose] on .lp-goal (ready / save / goal); types.js animates the way there.
    const goal = () => {
      const u = uid();
      const crowd = Array.from({ length: 34 }, (_, i) => {
        const x = 8 + i * 9.4;
        const y = 14 + (i % 3) * 7;
        return `<circle cx="${x.toFixed(1)}" cy="${y}" r="3.6" fill="${['#8fb3d1', '#c7d6e2', '#e8a19a', '#f3d98a'][i % 4]}"/>`;
      }).join('');
      const net = `<g stroke="#ffffff" stroke-width="1" opacity=".55">${Array.from({ length: 15 }, (_, i) => `<path d="M${68 + i * 13} 46V150"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<path d="M58 ${56 + i * 13}H262"/>`).join('')}</g>`;
      const keeper = `<g class="lp-keeper">
          <path d="M-16 -12L-12 -46H12L16 -12Z" fill="#c9f269" ${OL}/><path d="M-12 -34H12M-13 -24H13" stroke="#8fc23a" stroke-width="3"/>
          <path d="M-8 -12V0M8 -12V0" stroke="${K}" stroke-width="7" stroke-linecap="round"/><path d="M-8 -12V-1M8 -12V-1" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/>
          <path d="M-12 -42L-30 -60M12 -42L30 -60" stroke="#c9f269" stroke-width="8" stroke-linecap="round"/><path d="M-12 -42L-30 -60M12 -42L30 -60" ${ol(1.2)} opacity=".5"/>
          <circle cx="-32" cy="-63" r="7.5" fill="#ff8a2a" ${OL}/><circle cx="32" cy="-63" r="7.5" fill="#ff8a2a" ${OL}/>
          <circle cx="0" cy="-58" r="11" fill="#f2c49b" ${OL}/><path d="M-11 -60Q-12 -71 0 -71Q12 -71 11 -60Q6 -66 0 -66Q-6 -66 -11 -60Z" fill="#6b3f22"/>
          <circle cx="-4" cy="-57" r="1.6" fill="${K}"/><circle cx="4" cy="-57" r="1.6" fill="${K}"/><path d="M-4 -52Q0 -49 4 -52" fill="none" ${THIN}/></g>`;
      const inner = `<defs><linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f5"/><stop offset="1" stop-color="#eef7f0"/></linearGradient>
          <clipPath id="${u}c"><rect x="2" y="2" width="316" height="196" rx="20"/></clipPath></defs>
        <g clip-path="url(#${u}c)">
          <rect width="320" height="200" fill="url(#${u}s)"/>
          <rect y="0" width="320" height="36" fill="#5d7a92"/>${crowd}
          <rect y="150" width="320" height="50" fill="#5fae5a"/><g fill="#55a150"><rect x="0" y="150" width="40" height="50"/><rect x="80" y="150" width="40" height="50"/><rect x="160" y="150" width="40" height="50"/><rect x="240" y="150" width="40" height="50"/></g>
          <g class="lp-net"><rect x="58" y="46" width="204" height="104" fill="#ffffff" opacity=".22"/>${net}</g>
          <path d="M0 150H320" stroke="#fff" stroke-width="3"/>
          <path d="M58 150V46H262V150" fill="none" stroke="${K}" stroke-width="10" stroke-linejoin="round"/><path d="M58 150V46H262V150" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
          <g transform="translate(160 150)">${keeper}</g>
          <g transform="translate(160 182)"><g class="lp-ball"><ellipse class="lp-ball-shadow" cx="0" cy="12" rx="12" ry="3" fill="${K}" opacity=".18"/>${ball(13)}</g></g>
        </g>
        <rect x="2" y="2" width="316" height="196" rx="20" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="2"/>`;
      return svgEl('0 0 320 200', inner, 'lp-goal-svg');
    };

    // ---------------- substitute: the substitution board ----------------
    // 300 × 170: two LED windows (OUT red, IN green); types.js writes the texts into text.lp-led-out / text.lp-led-in (~210 wide).
    const subBoard = () => {
      const u = uid();
      const inner = `<defs><pattern id="${u}d" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1" fill="#ffffff" opacity=".07"/></pattern></defs>
        <path d="M138 148H162V168H138Z" fill="#3b4654" ${OL}/>
        <rect x="4" y="4" width="292" height="146" rx="16" fill="#20262d" ${OL}/>
        <rect x="12" y="12" width="276" height="62" rx="9" fill="#0d1014"/><rect x="12" y="12" width="276" height="62" rx="9" fill="url(#${u}d)"/>
        <rect x="12" y="80" width="276" height="62" rx="9" fill="#0d1014"/><rect x="12" y="80" width="276" height="62" rx="9" fill="url(#${u}d)"/>
        <path d="M22 32H50L36 54Z" fill="#ff5a4a"/><path d="M22 122H50L36 100Z" fill="#6cff7a"/>
        <text class="lp-led lp-led-out" x="170" y="54" text-anchor="middle" font-size="28"></text>
        <text class="lp-led lp-led-in" x="170" y="122" text-anchor="middle" font-size="28"></text>`;
      return svgEl('0 0 300 170', inner, 'lp-board-svg');
    };

    // ---------------- Hub hero: the stadium at night ----------------
    // Count based: the n-th part lights up once n stations are passed (2+ stars); the others are dim silhouettes (.lp-sk).
    const passedCount = () => {
      const unit = window.LP_CONTENT;
      const st = (unit && KF.gameData(unit.slug)?.st) || {};
      return (unit?.stations || []).filter((s) => (Number(st[s.id]?.stars) || 0) >= 2).length;
    };
    const tower = (/** @type {number} */ x, /** @type {number} */ dir) =>
      `<path d="M${x} 150V58" stroke="${K}" stroke-width="7"/><path d="M${x} 150V58" stroke="#8a9aa6" stroke-width="4"/>
       <rect x="${x - 20}" y="34" width="40" height="26" rx="4" fill="#3b4654" ${THIN}/>
       <g fill="#fff6c8">${[0, 1, 2].map((c) => [0, 1].map((r) => `<circle cx="${x - 12 + c * 12}" cy="${41 + r * 12}" r="4.2"/>`).join('')).join('')}</g>
       <path class="lp-beam" d="M${x - 18} 60L${x + dir * 130} 250H${x + dir * 30}Z" fill="#fff6c8" opacity=".14"/>`;
    /** @type {(() => string)[]} */
    const PARTS = [
      () => tower(44, 1),
      () => tower(316, -1),
      // The crowd
      () =>
        Array.from({ length: 60 }, (_, i) => {
          const row = Math.floor(i / 20);
          const x = 40 + (i % 20) * 14.6 + (row % 2) * 7;
          const y = 128 + row * 14;
          return `<circle cx="${x.toFixed(1)}" cy="${y}" r="4.6" fill="${['#e0483e', '#ffd23f', '#ffffff', '#6cc3ff'][(i * 7) % 4]}"/>`;
        }).join(''),
      // The scoreboard
      () => `<rect x="140" y="62" width="80" height="42" rx="6" fill="#20262d" ${OL}/><path d="M172 104V116M188 104V116" stroke="${K}" stroke-width="4"/>
        <g fill="#ffd23f">${[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5, 6, 7].map((c) => ((r + c) % 3 ? `<circle cx="${150 + c * 8.6}" cy="${74 + r * 9}" r="2.4"/>` : '')).join('')).join('')}</g>`,
      // Bunting along the stand
      () =>
        `<path d="M26 120Q180 138 334 120" stroke="${K}" stroke-width="1.6" fill="none"/>${Array.from({ length: 13 }, (_, i) => {
          const x = 30 + i * 24;
          const y = 121 + Math.sin((i / 12) * Math.PI) * 8;
          return `<path d="M${x} ${y.toFixed(1)}L${x + 16} ${(y + 1).toFixed(1)}L${x + 8} ${(y + 14).toFixed(1)}Z" fill="${i % 2 ? GOLD : SHIRT}" ${ol(1)}/>`;
        }).join('')}`,
      // The goal at the far end
      () => `<g transform="translate(180 196)"><rect x="-44" y="-30" width="88" height="30" fill="#fff" opacity=".18"/>
        <g stroke="#fff" stroke-width="1" opacity=".5">${Array.from({ length: 8 }, (_, i) => `<path d="M${-38 + i * 11} -28V0"/>`).join('')}<path d="M-44 -20H44M-44 -10H44"/></g>
        <path d="M-44 0V-30H44V0" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></g>`,
      // Corner flags
      () => `<path d="M30 292V258" stroke="#fff" stroke-width="3"/><path d="M30 258L50 264L30 272Z" fill="${GOLD}" ${ol(1.2)}/>
        <path d="M330 292V258" stroke="#fff" stroke-width="3"/><path d="M330 258L310 264L330 272Z" fill="${GOLD}" ${ol(1.2)}/>`,
      // The cup on the centre spot, and fireworks
      () => `${at(180, 220, 0.62, `<path d="M-26 -50H26V-32Q26 -4 0 0Q-26 -4 -26 -32Z" fill="${GOLD}" ${OL}/><path d="M-26 -42H-38Q-40 -24 -22 -20M26 -42H38Q40 -24 22 -20" fill="none" ${OL}/><path d="M-6 0H6V12H-6Z" fill="#e5a12a" ${THIN}/><rect x="-20" y="12" width="40" height="12" rx="3" fill="#a8652e" ${OL}/>`)}
        <g class="lp-fw">${star(96, 40, 10)}${star(262, 30, 8, '#ffb3d9')}${star(212, 50, 6, '#9fe3ff')}${star(130, 24, 5, '#fff')}</g>`,
    ];
    const hero = () => {
      const u = uid();
      const n = passedCount();
      const total = window.LP_CONTENT?.stations?.length || PARTS.length;
      const parts = PARTS.map((draw, i) => `<g class="lp-part ${n > i ? 'is-on' : 'lp-sk'}" data-part="${i}">${draw()}</g>`);
      const inner = `<defs><clipPath id="${u}fr"><rect x="4" y="4" width="352" height="292" rx="30"/></clipPath>
          <linearGradient id="${u}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14233d"/><stop offset="1" stop-color="#2c4a7a"/></linearGradient>
          <linearGradient id="${u}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8a4f"/><stop offset="1" stop-color="#3fa35e"/></linearGradient></defs>
        <g clip-path="url(#${u}fr)">
          <rect width="360" height="300" fill="url(#${u}sky)"/>
          <g fill="#fff" opacity=".5"><circle cx="70" cy="22" r="1.4"/><circle cx="120" cy="40" r="1"/><circle cx="250" cy="18" r="1.3"/><circle cx="300" cy="44" r="1"/><circle cx="200" cy="30" r="1"/></g>
          <path d="M0 150L30 112H330L360 150V200H0Z" fill="#223552"/><path d="M30 112H330" stroke="#3b557c" stroke-width="3"/>
          ${parts.slice(0, 5).join('')}
          <path d="M-20 300L60 190H300L380 300Z" fill="url(#${u}p)"/>
          <g fill="#ffffff" opacity=".07"><path d="M60 190L38 220H322L300 190Z"/><path d="M16 250H344L362 276H-2Z"/></g>
          <g fill="none" stroke="#fff" stroke-width="2.4" opacity=".85"><path d="M60 190H300L380 300M60 190L-20 300"/><path d="M24 240H336"/><ellipse cx="180" cy="240" rx="56" ry="14"/></g>
          ${parts.slice(5).join('')}
          ${at(214, 266, 1, ball(9))}
        </g>
        <rect x="4" y="4" width="352" height="292" rx="30" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="2"/>`;
      const el = svgEl('0 0 360 300', inner, 'hero-svg lp-hero');
      el.dataset.passed = String(n);
      el.classList.toggle('is-all', n >= total);
      return el;
    };

    return {
      art,
      hero,
      press,
      goal,
      subBoard,
      keys: () => Object.keys(ART),
      has: (/** @type {string} */ key) => !!key && key in ART,
    };
  })()
);
