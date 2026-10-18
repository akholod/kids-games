// Pictures for «Команда слів» / «Equipo de palabras»: a word's emoji or a paint blob of its colour, and the hub hero —
// the word squad: one shirt per theme, filled up with the words already in the team.
// window.WMArt = { art(key) → flash card for choice tasks, pic(word) → bare picture, hero() → squad board }
// @ts-check
'use strict';

window.WMArt = /** @type {ExamArt} */ (
  (() => {
    const unit = window.WM_CONTENT;
    const { h } = KFG;
    const T = KF.i18n({ uk: unit.strings, es: unit.strings }); // the unit's strings are already in the site's language
    document.title = `${unit.title} — Keeper Fun Games`;

    const themeOf = (/** @type {string} */ key) => unit.themes.find((t) => key.startsWith(`${t.id}.`));

    // Near-white colours get an outline, or the blob vanishes on the white card.
    const light = (/** @type {string} */ hex) => {
      const n = Number.parseInt(hex.replace('#', ''), 16);
      if (Number.isNaN(n)) return false;
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b > 235;
    };

    /** The bare picture of a word (no frame): its emoji, or a paint blob of its colour. Null when it has neither. */
    const pic = (/** @type {WMWord | undefined} */ w) => {
      if (w?.color) {
        return h(
          'span',
          { class: 'wm-pic', 'aria-hidden': 'true' },
          h('i', { class: `wm-blob${light(w.color) ? ' light' : ''}`, style: `--c:${w.color}` }),
        );
      }
      if (w?.pic) return h('span', { class: 'wm-pic', 'aria-hidden': 'true', text: w.pic });
      return null;
    };

    /** Flash card of a word in its theme's colour (choice and spell tasks). */
    const art = (/** @type {string} */ key) => {
      const w = unit.words[key];
      const p = pic(w);
      if (!p) return null;
      return h('div', { class: 'wm-card', style: `--hue:${themeOf(key)?.hue || '#3f8fc9'}` }, p);
    };

    // The squad: 12 shirts (one per theme) in two rows like a team photo; a shirt fills from the bottom
    // with the share of its words already in the team, the count sits under it.
    const hero = () => {
      /** @type {Record<string, WMStat>} */
      const stats = KF.gameData(unit.store)?.w || {};
      const inTeam = (/** @type {WMWord} */ w) => (stats[w.key]?.team || 0) > 0;
      const total = unit.themes.reduce((n, t) => n + t.words.length, 0);
      let n = 0;
      const men = unit.themes.map((t) => {
        const got = t.words.filter(inTeam).length;
        n += got;
        const full = got === t.words.length;
        return h(
          'span',
          { class: `wm-man${full ? ' full' : ''}`, title: `${t.en}: ${got}/${t.words.length}` },
          h('span', { class: 'wm-kit', style: `--hue:${t.hue};--p:${Math.round((got / t.words.length) * 100)}%`, text: t.icon }),
          h('small', { text: `${got}/${t.words.length}` }),
        );
      });
      return h(
        'div',
        { class: 'wm-squad' },
        h('div', { class: 'wm-squad-head' }, h('b', { text: T('squadTitle') }), h('span', { text: T('squadCount', { n, total }) })),
        h('div', { class: 'wm-squad-bar' }, h('i', { style: `width:${(n / total) * 100}%` })),
        h('div', { class: 'wm-team' }, men),
      );
    };

    return { art, pic, hero };
  })()
);
