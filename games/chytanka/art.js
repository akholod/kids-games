// Pictures for «Читанка-мандрівка»: a word's emoji on a flash card, and the hub hero — the traveller's passport:
// the map of Ukraine with the route through the 10 cities, a stamp on every passed city, the next one highlighted.
// window.CHArt = { art(key) → flash card for choice tasks, pic(key) → bare picture, hero() → passport }
// @ts-check
'use strict';

window.CHArt = /** @type {ExamArt} */ (
  (() => {
    const unit = window.CH_CONTENT;
    const map = window.CH_MAP;
    const { h } = KFG;
    const T = KF.i18n({ uk: unit.strings });

    const stationOf = (/** @type {string} */ key) => unit.route.find((st) => key.startsWith(`${st.id}.`));

    /** The bare picture of a word (its emoji), null without one. */
    const pic = (/** @type {string} */ key) => {
      const w = unit.words[key];
      return w?.pic ? h('span', { class: 'ch-pic', 'aria-hidden': 'true', text: w.pic }) : null;
    };

    /** Flash card of a word in its city's colour (choice, build, gap tasks). */
    const art = (/** @type {string} */ key) => {
      const p = pic(key);
      if (!p) return null;
      return h('div', { class: 'ch-card', style: `--hue:${stationOf(key)?.hue || '#2f6fd0'}` }, p);
    };

    // ---------- Passport ----------
    // Where each city's label sits next to its marker (viewBox units): Dnipro and Zaporizhzhia are close, so both go right.
    /** @type {Record<string, [number, number, 'start' | 'middle' | 'end']>} */
    const LABEL = {
      kyiv: [-30, 12, 'end'],
      chernihiv: [30, 10, 'start'],
      poltava: [-30, 30, 'end'],
      kharkiv: [0, -36, 'middle'],
      dnipro: [32, 0, 'start'],
      zaporizhzhia: [32, 30, 'start'],
      kherson: [10, 64, 'middle'],
      odesa: [-30, 30, 'end'],
      karpaty: [0, 66, 'middle'],
      lviv: [0, -38, 'middle'],
    };
    const esc = (/** @type {string} */ s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

    // A passed station = its best round gave 2+ stars (the engine's «Печатка є!» badge, KF.gameData(slug).st).
    const passedIds = () => {
      const st = KF.gameData(unit.slug)?.st || {};
      return new Set(unit.route.filter((s) => (Number(st[s.id]?.stars) || 0) >= 2).map((s) => s.id));
    };

    const mapSvg = (/** @type {Set<string>} */ passed, /** @type {CHStation | undefined} */ next) => {
      const pts = unit.route.map((s) => map.cities[s.city] || [0, 0]);
      // The way already travelled is solid, the rest is a dotted trail.
      const legs = pts.slice(1).map((p, i) => {
        const done = passed.has(unit.route[i].id) && passed.has(unit.route[i + 1].id);
        const a = pts[i];
        return `<line class="${done ? 'ch-leg done' : 'ch-leg'}" x1="${a[0]}" y1="${a[1]}" x2="${p[0]}" y2="${p[1]}"/>`;
      });
      const marks = unit.route.map((s, i) => {
        const [x, y] = pts[i];
        const [dx, dy, anchor] = LABEL[s.city] || [0, -36, 'middle'];
        const state = passed.has(s.id) ? 'stamp' : s === next ? 'next' : 'later';
        const mark =
          state === 'stamp'
            ? `<g transform="rotate(${i % 2 ? 10 : -12})"><circle r="40" fill="${s.hue}" class="ch-stamp"/><circle r="31" class="ch-stamp-ring"/><text class="ch-stamp-ico">${s.icon}</text></g>`
            : state === 'next'
              ? '<circle r="24" class="ch-halo"/><circle r="22" class="ch-next"/><circle r="9" class="ch-next-dot"/>'
              : '<circle r="11" class="ch-later"/>';
        return `<g class="ch-city ${state}" transform="translate(${x} ${y})">${mark}<text class="ch-label" x="${dx}" y="${dy}" text-anchor="${anchor}">${esc(s.cityName)}</text></g>`;
      });
      return `<svg class="ch-map" viewBox="${map.viewBox}" role="presentation" focusable="false">
<path class="ch-land" d="${map.outline}"/>${map.river ? `<path class="ch-river" d="${map.river}"/>` : ''}
${legs.join('')}${marks.join('')}</svg>`;
    };

    const hero = () => {
      const passed = passedIds();
      const next = unit.route.find((s) => !passed.has(s.id));
      /** @type {Record<string, CHStat>} */
      const stats = KF.gameData(unit.store)?.w || {};
      const keys = Object.keys(unit.words);
      const read = keys.filter((k) => (Number(stats[k]?.ok) || 0) >= 1).length;
      return h(
        'div',
        { class: 'ch-passport' },
        h('div', { class: 'ch-pp-head' }, h('span', { class: 'ch-pp-flag' }), h('b', { text: T('passportTitle') })),
        h('div', { class: 'ch-pp-page', html: mapSvg(passed, next) }),
        h(
          'div',
          { class: 'ch-pp-foot' },
          h(
            'div',
            { class: 'ch-pp-stats' },
            h('span', { text: T('passportStamps', { n: passed.size, total: unit.route.length }) }),
            h('span', { text: T('passportWords', { n: read, total: keys.length }) }),
          ),
          h('span', {
            class: `ch-pp-next${next ? '' : ' done'}`,
            text: next ? T('passportNext', { city: next.cityName }) : T('passportDone'),
          }),
        ),
      );
    };

    return { art, pic, hero };
  })()
);
