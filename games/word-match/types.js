// Renderers of the task types only «Команда слів» / «Equipo de palabras» has (generic ones live in shared/exam/types.js):
//   listen  hear the English word (🔊, Space = again), pick its picture of 4 (tap or 1–4); without a voice the word is shown
//   spell   build the English word from letter tiles (tap or type, ⌫ = back, Enter = check); one more try after a miss
// window.WM_TYPES = { listen, spell } → KFExam.mount(..., { types }). Pictures come from art.js (WMArt.pic / WMArt.art).
// @ts-check
'use strict';

window.WM_TYPES = (() => {
  const unit = window.WM_CONTENT;
  const say = (/** @type {string} */ text) => KFG.say(text, 'en', { rate: 0.85 });
  // Tiles and the erase button must not take the focus on a tap: Enter would then click them instead of «check».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();

  // ---------- listen ----------
  /** @type {ExamRenderer<WMListenTask>} */
  const listen = (task, work, ctx) => {
    const { h, T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    const W = /** @type {ExamArt | undefined} */ (ctx.art);
    const word = task.word;
    const opts = shuffle(task.options);
    const pics = opts.map((o) => W?.pic?.(o) || null);
    // No pictures (art.js missing): hear / read the word, pick its translation instead.
    if (pics.some((p) => !p)) {
      const nat = unit.natives[0];
      return ctx.fallback(
        { ...task, q: `${task.q}: ${word.en}` },
        work,
        opts.map((o) => ({ text: o[nat], ok: o === word })),
      );
    }

    const playBtn = h(
      'button',
      { type: 'button', class: 'wm-play', id: 'wm-play', onclick: () => play() },
      h('span', { class: 'ico', 'aria-hidden': 'true', text: '🔊' }),
      String(T('listenPlay')).replace(/^🔊\s*/, ''),
    );
    const wordCard = h(
      'div',
      { class: 'wm-word', id: 'wm-word' },
      h('b', { lang: 'en', text: word.en }),
      h('small', { text: T('listenNoVoice') }),
    );
    const clue = h('div', { class: 'wm-clue' });
    const keysHint = kbdHint('');
    const play = () => {
      if (!say(word.en)) return;
      KFG.restart(playBtn, 'is-on');
    };
    const drawClue = () => {
      const voice = KFG.canSay('en');
      clue.replaceChildren(voice ? playBtn : wordCard);
      keysHint.textContent = voice ? T('kListen', { n: opts.length }) : T('kChoice', { n: opts.length });
      return voice;
    };

    const buttons = opts.map((o, i) =>
      h(
        'button',
        { type: 'button', class: 'wm-opt', 'data-key': o.key, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        pics[i],
        h('span', { class: 'cap', lang: 'en', text: o.en }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = opts[i] === word;
      buttons.forEach((b, j) => {
        b.disabled = true;
        if (opts[j] === word) b.classList.add('right');
        else if (j === i) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      resolve(ok, { answer: word.en });
      if (!ok) say(word.en); // hear it again while the right picture lights up
    };

    work.append(h('div', { class: 'wm-listen' }, clue, h('div', { class: 'wm-opts' }, buttons), keysHint));
    if (drawClue()) {
      // Once, right after the task appears (not over another word still being spoken).
      setTimeout(() => {
        if (!answered() && playBtn.isConnected && !window.speechSynthesis?.speaking) play();
      }, 350);
    } else if (window.speechSynthesis && !speechSynthesis.getVoices().length) {
      // The voice list loads asynchronously: if an English voice turns up before the answer, switch to listening.
      speechSynthesis.addEventListener('voiceschanged', () => !answered() && wordCard.isConnected && drawClue(), { once: true });
    }

    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= buttons.length) {
        choose(n - 1);
        return true;
      }
      if (e.key === ' ') {
        if (playBtn.isConnected) play();
        return true;
      }
      return false;
    });
  };

  // ---------- spell ----------
  // Letters that are not in the word: one vowel and one consonant, so the extra tiles look like real choices.
  const VOWELS = 'aeiou';
  const CONSONANTS = 'bcdghklmnprstwy';
  /** @param {string[]} letters @param {(a: string[]) => string[]} shuffle */
  const distractors = (letters, shuffle) => {
    const has = new Set(letters.map((c) => c.toLowerCase()));
    const free = (/** @type {string} */ set) => shuffle([...set].filter((c) => !has.has(c)));
    return [free(VOWELS)[0], ...free(CONSONANTS)].filter(Boolean).slice(0, 2);
  };

  // A typed letter: e.key, or the physical key on a non-Latin layout (a Ukrainian keyboard gives «ф» for A).
  const letterOf = (/** @type {KeyboardEvent} */ e) => {
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) return e.key.toLowerCase();
    const m = /^Key([A-Z])$/.exec(e.code || '');
    return e.key.length === 1 && m ? m[1].toLowerCase() : null;
  };

  /** @type {ExamRenderer<WMSpellTask>} */
  const spell = (task, work, ctx) => {
    const { h, T, shuffle, shake, resolve, answered, setKeys, kbdHint } = ctx;
    const word = task.word;
    const target = [...word.en];
    const n = target.length;
    const letters = shuffle([...target, ...distractors(target, shuffle)]);
    /** @type {(number | null)[]} slot → index of the tile in it */
    const slots = Array(n).fill(null);
    /** @type {Set<number>} slots already checked right (locked) */
    const good = new Set();
    let tries = 0;
    const hint = ctx.hint();

    const slotEls = target.map((_, i) =>
      h('button', { type: 'button', class: 'wm-slot', 'data-i': String(i), onmousedown: keepFocus, onclick: () => takeFrom(i) }),
    );
    const tileEls = letters.map((ch, t) =>
      h('button', { type: 'button', class: 'wm-tile', 'data-ch': ch, onmousedown: keepFocus, onclick: () => put(t), text: ch }),
    );
    const eraseBtn = h(
      'button',
      { type: 'button', class: 'btn btn-light wm-erase', onmousedown: keepFocus, onclick: () => erase() },
      T('spellErase'),
    );
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark wm-check', onclick: () => check() }, T('check'));
    const slotsEl = h('div', { class: 'wm-slots', lang: 'en' }, slotEls);
    const tilesEl = h('div', { class: 'wm-tiles', lang: 'en' }, tileEls);
    const pic = task.art ? ctx.art?.art(task.art) : null;
    const box = h(
      'div',
      { class: `wm-spell${pic ? '' : ' no-pic'}` },
      pic,
      h(
        'div',
        { class: 'wm-build' },
        slotsEl,
        hint,
        tilesEl,
        h('div', { class: 'wm-spell-actions' }, eraseBtn, checkBtn),
        kbdHint(T('kSpell')),
      ),
    );

    const used = (/** @type {number} */ t) => slots.includes(t);
    const free = () => slots.indexOf(null);
    const draw = () => {
      const next = free();
      slotEls.forEach((el, i) => {
        const t = slots[i];
        el.textContent = t === null ? '' : letters[t];
        el.classList.toggle('filled', t !== null);
        el.classList.toggle('good', good.has(i));
        el.classList.toggle('next', i === next && !answered());
        el.disabled = t === null || good.has(i) || answered();
      });
      tileEls.forEach((el, t) => {
        el.disabled = used(t) || answered();
      });
      checkBtn.disabled = next >= 0;
      if (checkBtn.disabled && document.activeElement === checkBtn) checkBtn.blur(); // no focus ring on a dead button
      eraseBtn.disabled = !slots.some((t, i) => t !== null && !good.has(i));
    };

    const put = (/** @type {number} */ t) => {
      if (answered() || used(t)) return;
      const s = free();
      if (s < 0) return;
      slots[s] = t;
      hint.textContent = '';
      draw();
      if (free() < 0) checkBtn.focus({ preventScroll: true });
    };
    const typed = (/** @type {string} */ ch) => {
      const t = letters.findIndex((c, i) => c.toLowerCase() === ch && !used(i));
      if (t < 0 || free() < 0) shake(free() < 0 ? slotsEl : tilesEl);
      else put(t);
    };
    // Back one letter: the last one that is not locked green.
    const erase = () => {
      if (answered()) return;
      for (let i = n - 1; i >= 0; i--) {
        if (slots[i] !== null && !good.has(i)) {
          slots[i] = null;
          break;
        }
      }
      draw();
    };
    // A tapped letter goes back to the tiles, with the ones after it (slots fill left to right).
    const takeFrom = (/** @type {number} */ i) => {
      if (answered() || good.has(i)) return;
      for (let j = i; j < n; j++) if (!good.has(j)) slots[j] = null;
      draw();
    };
    const finish = () => {
      box.classList.add('is-done');
      draw();
      say(word.en);
    };
    const check = () => {
      if (answered()) return;
      if (free() >= 0) {
        hint.textContent = T('spellFill');
        shake(slotsEl);
        return;
      }
      tries++;
      const wrong = target.map((c, i) => i).filter((i) => letters[slots[i]].toLowerCase() !== target[i].toLowerCase());
      if (!wrong.length) {
        target.forEach((_, i) => good.add(i));
        hint.textContent = '';
        resolve(true, { soft: tries > 1 });
        finish();
        return;
      }
      if (tries >= 2) {
        // Show the word: the player's right letters stay green, the fixed ones are amber.
        for (const i of target.keys()) if (!wrong.includes(i)) good.add(i);
        hint.textContent = '';
        resolve(false, { answer: word.en });
        finish();
        wrong.forEach((i) => {
          slotEls[i].textContent = target[i];
          slotEls[i].classList.add('fixed');
        });
        return;
      }
      // One more try: right letters lock green, the others go back to the tiles.
      for (const i of target.keys()) if (!wrong.includes(i)) good.add(i);
      for (const i of wrong) slots[i] = null;
      hint.textContent = good.size ? T('spellGreen') : T('spellAgain');
      draw();
      for (const i of wrong) KFG.restart(slotEls[i], 'missed');
      shake(...wrong.map((i) => slotEls[i]));
    };

    draw();
    work.append(box);
    setKeys((e) => {
      if (e.key === 'Enter') {
        check();
        return true;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        erase();
        return true;
      }
      const ch = letterOf(e);
      if (ch) {
        typed(ch);
        return true;
      }
      return false;
    });
  };

  return { listen, spell };
})();
