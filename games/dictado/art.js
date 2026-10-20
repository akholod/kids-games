// Drawings of «Dictado del míster»: the hub hero is the coach's tactics board — a green magnetic board with the 12 rules
// as magnets along one passing move towards the goal. A passed rule (its best round gave 2+ stars, KF.gameData(slug).st)
// is a coloured magnet with its icon, the passes between passed rules are drawn in marker, the next rule has the ball.
// Below the board: rules passed and words written right (DCStat ok ≥ 1 in KF.gameData(unit.store).w).
// window.DCArt = { art() → null (tasks have no pictures), hero() → the board }
// @ts-check
'use strict';

window.DCArt = /** @type {ExamArt} */ (
  (() => {
    const unit = window.DC_CONTENT;
    const { h } = KFG;
    const T = KF.i18n({ uk: unit.strings || {} });

    // The move: a zigzag from the own half to the goal on the right (viewBox 600 × 330), one spot per rule.
    /** @type {[number, number][]} */
    const SPOTS = [
      [62, 92],
      [74, 238],
      [150, 165],
      [204, 74],
      [232, 256],
      [298, 160],
      [358, 78],
      [384, 250],
      [446, 162],
      [492, 82],
      [512, 248],
      [536, 165],
    ];
    const GOAL = [590, 165];
    const esc = (/** @type {string} */ s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

    const passedIds = () => {
      const st = KF.gameData(unit.slug)?.st || {};
      return new Set(unit.rules.filter((r) => (Number(st[r.id]?.stars) || 0) >= 2).map((r) => r.id));
    };

    // Distinct words (station tasks with a word, not the sentences) and how many were written right at least once.
    const wordCount = () => {
      /** @type {Record<string, DCStat>} */
      const stats = KF.gameData(unit.store)?.w || {};
      const keys = new Set();
      for (const s of unit.stations) for (const t of s.tasks) if (t.key && 'word' in t) keys.add(t.key);
      const right = [...keys].filter((k) => (Number(stats[k]?.ok) || 0) >= 1).length;
      return { right, total: keys.size };
    };

    /** A pass from a to b, stopping short of the magnets; drawn in marker once both rules are passed. */
    const pass = (/** @type {number[]} */ a, /** @type {number[]} */ b, /** @type {boolean} */ done) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const x1 = a[0] + ux * 30;
      const y1 = a[1] + uy * 30;
      const x2 = b[0] - ux * 34;
      const y2 = b[1] - uy * 34;
      // A small arrow head at the end, like the coach draws it.
      const hx = x2 - ux * 12;
      const hy = y2 - uy * 12;
      const head = `M${(hx - uy * 7).toFixed(1)} ${(hy + ux * 7).toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${(hx + uy * 7).toFixed(1)} ${(hy - ux * 7).toFixed(1)}`;
      const line = `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
      return done ? `<g class="dc-pass done"><path d="${line}"/><path d="${head}"/></g>` : `<g class="dc-pass"><path d="${line}"/></g>`;
    };

    const cone = (/** @type {number} */ x, /** @type {number} */ y) =>
      `<g class="dc-cone" transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="15" ry="4.5"/><path d="M-10 0L-3 -26h6L10 0z"/><path class="band" d="M-6.6 -10h13.2l-1.4 -6h-10.4z"/></g>`;

    const boardSvg = (/** @type {Set<string>} */ passed, /** @type {DCRule | undefined} */ next) => {
      const rules = unit.rules;
      const passes = SPOTS.slice(1).map((p, i) => pass(SPOTS[i], p, passed.has(rules[i]?.id) && passed.has(rules[i + 1]?.id)));
      const allDone = rules.every((r) => passed.has(r.id));
      passes.push(pass(SPOTS[11], GOAL, allDone));
      const mags = rules.map((r, i) => {
        const [x, y] = SPOTS[i] || [0, 0];
        const state = passed.has(r.id) ? 'on' : r === next ? 'next' : 'off';
        const body =
          state === 'on'
            ? `<circle r="25" class="dc-mag-face" fill="${r.hue}"/><ellipse class="dc-mag-shine" cx="-8" cy="-10" rx="9" ry="5"/><text class="dc-mag-ico">${esc(r.icon)}</text>`
            : `${state === 'next' ? '<circle r="27" class="dc-halo"/>' : ''}<circle r="22" class="dc-mag-face"/><text class="dc-mag-num">${i + 1}</text>`;
        return `<g class="dc-mag ${state}" transform="translate(${x} ${y})">${body}</g>`;
      });
      const ballAt = next ? SPOTS[rules.indexOf(next)] : GOAL;
      const ball = `<text class="dc-ball" x="${ballAt[0] + (next ? 22 : -14)}" y="${ballAt[1] + (next ? 22 : 0)}">⚽</text>`;
      return `<svg class="dc-pitch" viewBox="0 0 600 330" role="presentation" focusable="false">
<g class="dc-lines"><rect x="18" y="16" width="564" height="298" rx="4"/><path d="M300 16V314"/><circle cx="300" cy="165" r="46"/>
<path d="M18 92h74v146H18M582 92h-74v146h74M18 132h28v66H18M582 132h-28v66h28"/><path class="dc-goal" d="M582 140h10v50h-10"/></g>
${cone(118, 312)}${cone(420, 26)}
${passes.join('')}${mags.join('')}${ball}</svg>`;
    };

    const hero = () => {
      const passed = passedIds();
      const next = unit.rules.find((r) => !passed.has(r.id));
      const words = wordCount();
      return h(
        'div',
        { class: 'dc-board' },
        h('div', { class: 'dc-board-face', html: boardSvg(passed, next) }),
        h(
          'div',
          { class: 'dc-tray' },
          h(
            'div',
            { class: 'dc-tray-stats' },
            h('span', { text: T('boardRules', { n: passed.size, total: unit.rules.length }) }),
            h('span', { text: T('boardWords', { n: words.right, total: words.total }) }),
          ),
          h('span', {
            class: `dc-tray-next${next ? '' : ' done'}`,
            text: next ? T('boardNext', { rule: next.title }) : T('boardDone'),
          }),
        ),
      );
    };

    return { art: () => null, hero };
  })()
);
