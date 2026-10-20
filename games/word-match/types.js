// Renderers of the task types only «Команда слів» / «Equipo de palabras» has (generic ones live in shared/exam/types.js):
//   listen  hear the English word (🔊, Space = again), pick its picture of 4 (tap or 1–4); without a voice the word is shown
//   spell   build the English word from letter tiles (tap or type, ⌫ = back, Enter = check); one more try after a miss
// window.WM_TYPES = { listen, spell } → KFExam.mount(..., { types }). Pictures come from art.js (WMArt.pic / WMArt.art).
// @ts-check
'use strict';

window.WM_TYPES = (() => {
  const unit = window.WM_CONTENT;
  const say = (/** @type {string} */ text) => KFG.say(text, 'en', { rate: 0.85 });

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
      const voice = KFG.canSay('en', word.en);
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
    KFG.preload(word.en, 'en');
    if (drawClue()) {
      // Once, right after the task appears (not over another word still being spoken).
      setTimeout(() => {
        if (!answered() && playBtn.isConnected && !KFG.speaking()) play();
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
    const { h, T, shuffle, kbdHint } = ctx;
    const word = task.word;
    const target = [...word.en];
    KFG.preload(word.en, 'en'); // the word is spoken when the task is done
    const b = /** @type {ExamBuilderFactory} */ (KFExam.builder)(ctx, {
      target,
      tiles: shuffle([...target, ...distractors(target, shuffle)]),
      same: (a, c) => a.toLowerCase() === c.toLowerCase(),
      keyUnit: letterOf,
      classes: { slot: 'wm-slot', tile: 'wm-tile', slots: 'wm-slots', tiles: 'wm-tiles', erase: 'wm-erase', check: 'wm-check' },
      tileAttr: 'data-ch',
      slotsLang: 'en',
      tilesLang: 'en',
      strings: { fill: 'spellFill', green: 'spellGreen', again: 'spellAgain', erase: 'spellErase' },
      onDone: () => {
        box.classList.add('is-done');
        say(word.en);
      },
    });
    const pic = task.art ? ctx.art?.art(task.art) : null;
    const box = h(
      'div',
      { class: `wm-spell${pic ? '' : ' no-pic'}` },
      pic,
      h(
        'div',
        { class: 'wm-build' },
        b.slotsEl,
        b.hint,
        b.tilesEl,
        h('div', { class: 'wm-spell-actions' }, b.eraseBtn, b.checkBtn),
        kbdHint(T('kSpell')),
      ),
    );
    work.append(box);
    b.setKeys();
  };

  return { listen, spell };
})();
