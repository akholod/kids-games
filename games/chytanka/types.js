// Renderers of the task types only «Читанка-мандрівка» has (generic ones live in shared/exam/types.js):
//   read   read the word (by syllables, or whole with a «По складах» toggle = Space), pick its picture of 4 (tap or 1–4)
//   hear   hear the word (🔊, Space = again), pick how it is written (1–4); without a voice: its picture instead
//   build  build the word from syllable tiles (tap or 1–9, ⌫ = back, Enter = check); one more try after a miss
//   gap    a lost letter: pick it of 2–3 (1–3), it drops into the word
//   story  read 1–2 sentences, answer the question (1–4); only then the text can be listened to
// The word is spoken after every answer. window.CH_TYPES → KFExam.mount(..., { types }); pictures: art.js (CHArt).
// @ts-check
'use strict';

window.CH_TYPES = (() => {
  const { h } = KFG;
  const say = (/** @type {string} */ text) => KFG.say(text, 'uk');
  const plain = (/** @type {string} */ s) => s.replace(/\u0301/g, '').toLowerCase();
  // Tiles and the erase button must not take the focus on a tap: Enter would then click them instead of «check».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();

  // A story text still being read aloud stops when the next task appears (a word may finish on its own).
  let longText = false;
  const fresh = () => {
    if (longText) KFG.hush();
    longText = false;
  };
  const sayLong = (/** @type {string} */ text) => {
    longText = say(text);
  };

  // Once, right after the task appears; waits (a little) for the word of the last task to finish first.
  const autoplay = (/** @type {() => void} */ play, /** @type {() => boolean} */ alive) => {
    let waits = 0;
    const tick = () => {
      if (!alive()) return;
      if (KFG.speaking() && waits++ < 10) setTimeout(tick, 250);
      else if (!KFG.speaking()) play();
    };
    setTimeout(tick, 350);
  };

  /**
   * The word the primer way: one span per syllable (arcs and alternating colours come with .is-split), the stress mark kept.
   * gapAt = index of a letter of word.word shown as an empty slot instead.
   * @param {CHWord} w
   * @param {{ split?: boolean, gapAt?: number }} [o]
   */
  const wordEl = (w, { split = true, gapAt = -1 } = {}) => {
    /** @type {HTMLSpanElement | null} */
    let slot = null;
    let at = 0;
    const syls = w.syl.map((s, si) => {
      /** @type {string[]} */
      const letters = [];
      for (const ch of s) {
        if (ch === '\u0301' && letters.length) letters[letters.length - 1] += ch;
        else letters.push(ch);
      }
      /** @type {(string | HTMLSpanElement)[]} */
      const kids = [];
      for (const l of letters) {
        if (at++ === gapAt) {
          slot = h('span', { class: 'ch-slot', id: 'ch-slot', 'data-letter': l });
          kids.push(slot);
        } else if (typeof kids[kids.length - 1] === 'string') kids[kids.length - 1] += l;
        else kids.push(l);
      }
      return h('span', { class: `ch-syl c${si % 2}` }, kids);
    });
    const letters = w.word.length;
    const el = h(
      'span',
      { class: `ch-word${split ? ' is-split' : ''}`, lang: 'uk', style: `--len:${letters};--gaps:${w.syl.length - 1}` },
      syls,
    );
    return { el, slot };
  };

  const picOf = (/** @type {CHWord} */ w) => h('span', { class: 'ch-pic', 'aria-hidden': 'true', text: w.pic || '❓' });
  const cardOf = (/** @type {ExamRendererCtx} */ ctx, /** @type {CHWord} */ w) =>
    ctx.art?.art(w.key) || h('div', { class: 'ch-card' }, picOf(w));

  /** Marks a choice: the right one lights up, a wrong pick is amber, the rest fade. */
  const mark = (/** @type {HTMLButtonElement[]} */ buttons, /** @type {number} */ right, /** @type {number} */ picked) => {
    buttons.forEach((b, j) => {
      b.disabled = true;
      b.classList.add(j === right ? 'right' : j === picked ? 'wrong' : 'dim');
    });
  };

  /** 1–n picks option n; returns the key handler part. */
  const digit = (/** @type {KeyboardEvent} */ e, /** @type {number} */ n) => {
    const d = Number(e.key);
    return e.key.length === 1 && d >= 1 && d <= n ? d : 0;
  };

  // ---------- read ----------
  /** @type {ExamRenderer<CHReadTask>} */
  const read = (task, work, ctx) => {
    const { T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const w = task.word;
    const opts = shuffle(task.options);
    const { el: wordBox } = wordEl(w, { split: task.split });
    const toggle =
      !task.split &&
      h('button', {
        type: 'button',
        class: 'btn btn-light ch-split',
        id: 'ch-split',
        'aria-pressed': 'false',
        onmousedown: keepFocus,
        onclick: () => flip(),
        text: T('readSplit'),
      });
    const flip = () => {
      if (!toggle) return;
      const on = wordBox.classList.toggle('is-split');
      toggle.setAttribute('aria-pressed', String(on));
      toggle.textContent = on ? T('readWhole') : T('readSplit');
    };
    const buttons = opts.map((o, i) =>
      h(
        'button',
        { type: 'button', class: 'ch-opt', 'data-key': o.key, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        picOf(o),
        h('span', { class: 'cap', lang: 'uk', text: o.word }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      mark(buttons, opts.indexOf(w), i);
      resolve(opts[i] === w, { answer: w.word });
      say(w.word);
    };
    work.append(
      h(
        'div',
        { class: 'ch-read' },
        h('div', { class: 'ch-reader' }, wordBox, toggle),
        h('div', { class: 'ch-opts' }, buttons),
        kbdHint(toggle ? T('kRead', { n: buttons.length }) : T('kChoice', { n: buttons.length })),
      ),
    );
    KFG.preload(w.word, 'uk');
    setKeys((e) => {
      const d = digit(e, buttons.length);
      if (d) {
        choose(d - 1);
        return true;
      }
      if (e.key === ' ' && toggle) {
        flip();
        return true;
      }
      return false;
    });
  };

  // ---------- hear ----------
  /** @type {ExamRenderer<CHHearTask>} */
  const hear = (task, work, ctx) => {
    const { T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const w = task.word;
    const opts = shuffle(task.options);
    const voice = KFG.canSay('uk', w.word);
    const playBtn = h(
      'button',
      { type: 'button', class: 'ch-play', id: 'ch-play', onclick: () => play() },
      h('span', { class: 'ico', 'aria-hidden': 'true', text: '🔊' }),
      String(T('hearPlay')).replace(/^🔊\s*/, ''),
    );
    // No clip and no device voice: the picture tells which word it is.
    const clue = voice ? playBtn : h('div', { class: 'ch-novoice' }, cardOf(ctx, w), h('small', { text: T('hearNoVoice') }));
    const play = () => {
      if (say(w.word)) KFG.restart(playBtn, 'is-on');
    };
    const buttons = opts.map((o, i) =>
      h(
        'button',
        { type: 'button', class: 'ch-wopt', 'data-word': o, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { lang: 'uk', text: o }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = opts[i] === w.word;
      mark(buttons, opts.indexOf(w.word), i);
      resolve(ok, { answer: w.word });
      if (!ok || !voice) say(w.word); // hear it once more while the right spelling lights up
    };
    work.append(
      h(
        'div',
        { class: `ch-hear${voice ? '' : ' no-voice'}` },
        h('div', { class: 'ch-clue' }, clue),
        h('div', { class: 'ch-words' }, buttons),
        kbdHint(voice ? T('kHear', { n: buttons.length }) : T('kChoice', { n: buttons.length })),
      ),
    );
    KFG.preload(w.word, 'uk');
    if (voice) autoplay(play, () => !answered() && playBtn.isConnected);
    setKeys((e) => {
      const d = digit(e, buttons.length);
      if (d) {
        choose(d - 1);
        return true;
      }
      if (e.key === ' ' && voice) {
        play();
        return true;
      }
      return false;
    });
  };

  // ---------- build ----------
  /** @type {ExamRenderer<CHBuildTask>} */
  const build = (task, work, ctx) => {
    const { h, T, shuffle, kbdHint } = ctx;
    fresh();
    const w = task.word;
    const tiles = shuffle([...w.syl, ...task.extra]);
    KFG.preload(w.word, 'uk');
    // Same letters = right (ма + ма́ reads as «мама» too); the slots then show the syllables with the right stress.
    const b = /** @type {ExamBuilderFactory} */ (KFExam.builder)(ctx, {
      target: w.syl,
      tiles,
      same: (a, c) => plain(a) === plain(c),
      answer: w.word,
      keyUnit: (e) => {
        const d = digit(e, Math.min(tiles.length, 9));
        return d ? d - 1 : null;
      },
      shakeFull: true,
      classes: { slot: 'ch-bslot', tile: 'ch-tile', slots: 'ch-bslots', tiles: 'ch-tiles', erase: 'ch-erase', check: 'ch-check' },
      tileAttr: 'data-syl',
      tileContent: (s, t) => [t < 9 && h('kbd', { text: String(t + 1) }), h('span', { lang: 'uk', text: s })],
      slotsLang: 'uk',
      strings: { fill: 'buildFill', green: 'buildGreen', again: 'buildAgain', erase: 'buildErase' },
      onDone: () => {
        box.classList.add('is-done');
        say(w.word);
      },
    });
    const box = h(
      'div',
      { class: 'ch-build' },
      cardOf(ctx, w),
      h(
        'div',
        { class: 'ch-build-col' },
        b.slotsEl,
        b.hint,
        b.tilesEl,
        h('div', { class: 'ch-build-actions' }, b.eraseBtn, b.checkBtn),
        kbdHint(T('kBuild', { n: Math.min(tiles.length, 9) })),
      ),
    );
    work.append(box);
    b.setKeys();
  };

  // ---------- gap ----------
  /** @type {ExamRenderer<CHGapTask>} */
  const gap = (task, work, ctx) => {
    const { T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const w = task.word;
    const right = task.options[0];
    const letters = shuffle(task.options);
    const { el: wordBox, slot } = wordEl(w, { gapAt: task.at });
    /** @type {Record<string, string>} */
    const NAMES = { '’': T('gapApos'), ь: T('gapSoft') };
    const buttons = letters.map((l, i) =>
      h(
        'button',
        { type: 'button', class: 'ch-letter', 'data-letter': l, 'aria-label': NAMES[l] || l, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { lang: 'uk', 'aria-hidden': 'true', text: l }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = letters[i] === right;
      mark(buttons, letters.indexOf(right), i);
      // The right letter drops into its place either way: green when found, amber when shown.
      if (slot) {
        slot.replaceChildren(h('i', { text: slot.dataset.letter || right }));
        slot.classList.add(ok ? 'ok' : 'fix');
      }
      resolve(ok, { answer: w.word });
      say(w.word);
    };
    work.append(
      h(
        'div',
        { class: 'ch-gap' },
        cardOf(ctx, w),
        h(
          'div',
          { class: 'ch-gap-col' },
          h('div', { class: 'ch-reader' }, wordBox),
          h('div', { class: 'ch-letters' }, buttons),
          kbdHint(T('kGap', { n: buttons.length })),
        ),
      ),
    );
    KFG.preload(w.word, 'uk');
    setKeys((e) => {
      const d = digit(e, buttons.length);
      if (d) {
        choose(d - 1);
        return true;
      }
      return false;
    });
  };

  // ---------- story ----------
  /** @type {ExamRenderer<CHStoryTask>} */
  const story = (task, work, ctx) => {
    const { T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const right = task.options[0];
    const opts = shuffle(task.options);
    // Only after the answer: he reads the text himself first.
    const listen = h(
      'button',
      { type: 'button', class: 'btn btn-light ch-listen', id: 'ch-listen', onclick: () => sayLong(task.text) },
      T('storyListen'),
    );
    const page = h('div', { class: 'ch-page' }, h('p', { class: 'ch-text', lang: 'uk', text: task.text }));
    const buttons = opts.map((o, i) =>
      h(
        'button',
        { type: 'button', class: 'ch-ans', 'data-answer': o, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { lang: 'uk', text: o }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      mark(buttons, opts.indexOf(right), i);
      page.append(listen);
      resolve(opts[i] === right, { answer: right });
    };
    work.append(
      h(
        'div',
        { class: 'ch-story' },
        page,
        h(
          'div',
          { class: 'ch-ask-col' },
          h('p', { class: 'ch-ask', lang: 'uk', text: task.ask }),
          h('div', { class: 'ch-answers' }, buttons),
          kbdHint(T('kStory', { n: buttons.length })),
        ),
      ),
    );
    KFG.preload(task.text, 'uk');
    setKeys((e) => {
      const d = digit(e, buttons.length);
      if (d) {
        choose(d - 1);
        return true;
      }
      return false;
    });
  };

  return { read, hear, build, gap, story };
})();
