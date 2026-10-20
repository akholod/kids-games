// Renderers of «Dictado del míster» (generic ones live in shared/exam/types.js). Every task but `spot` is dictated: a big 🔊
// (auto-plays once, Space = again); without a clip and a device voice it turns into a visual dictation (👀 shows the text ~2 s).
//   gap    the word with a gap, pick what goes in it (tap or 1–n; «nada» = nothing goes there); the right text drops in
//   pick   2–3 spellings of the heard word (tap or 1–3)
//   tiles  build the word from magnetic letter tiles (tap or type; ´ or ' then a vowel = á; ⌫, Enter); one retry (KFExam.builder)
//   tilde  tap the vowel that takes the tilde (1–n) or «sin tilde» (0)
//   cloze  a dictated sentence (🔊 + 🐢 slow, S = slow) with 1–3 gaps: tap a gap (← →), pick its text (1–n);
//          a wrong pick shakes once, the second one shows the right text
//   spot   read the sentence, tap the misspelled word (← → + Enter); then it is corrected and the sentence is spoken
//   write  the final: type the word on the on-screen Spanish keyboard (´ ¨ accents, ⇧ capital, ¿ ? ¡ !) or a real one
// window.DC_TYPES → KFExam.mount(..., { types }) in game.js.
// @ts-check
'use strict';

window.DC_TYPES = (() => {
  const { h } = KFG;
  const SAY_MS = 350;
  const LOOK_MS = 2000;
  // Taps on these must not take the focus: Enter would then click them instead of «check».
  const keepFocus = (/** @type {MouseEvent} */ e) => e.preventDefault();
  const noIcon = (/** @type {string} */ s) => String(s).replace(/^\S+\s+/, '');

  // A sentence still being read aloud stops when the next task appears (a word may finish on its own).
  let longText = false;
  const fresh = () => {
    if (longText) KFG.hush();
    longText = false;
  };
  const say = (/** @type {string} */ text, slow = false) => {
    const on = KFG.say(text, 'es', slow ? { slow: true } : undefined);
    if (/\s/.test(text)) longText = on;
    return on;
  };

  // Once, right after the task appears; waits (a little) for the word of the last task to finish first.
  const autoplay = (/** @type {() => void} */ play, /** @type {() => boolean} */ alive) => {
    let waits = 0;
    const tick = () => {
      if (!alive()) return;
      if (KFG.speaking() && waits++ < 10) setTimeout(tick, 250);
      else if (!KFG.speaking()) play();
    };
    setTimeout(tick, SAY_MS);
  };

  /**
   * The coach's voice: a big 🔊 (and 🐢 for sentences), or — with no clip and no voice — 👀 that shows the text for a moment.
   * @param {ExamRendererCtx} ctx
   * @param {string} text
   * @param {{ slow?: boolean }} [o]
   */
  const voiceOf = (ctx, text, o = {}) => {
    const { T, answered } = ctx;
    const voice = KFG.canSay('es', text);
    KFG.preload(text, 'es');
    if (o.slow) KFG.preload(text, 'es', true);
    /** @type {HTMLElement} */
    let el;
    /** @type {() => void} */
    let play;
    /** @type {() => void} */
    let slow = () => {};
    if (voice) {
      const btn = h(
        'button',
        { type: 'button', class: 'dc-play', id: 'dc-play', onmousedown: keepFocus, onclick: () => play() },
        h('span', { class: 'dc-play-ico', 'aria-hidden': 'true', text: '🔊' }),
        h('span', { class: 'dc-play-txt', text: noIcon(T('play')) }),
      );
      play = () => {
        if (say(text)) KFG.restart(btn, 'is-on');
      };
      const slowBtn =
        o.slow &&
        h(
          'button',
          { type: 'button', class: 'dc-slow', id: 'dc-slow', onmousedown: keepFocus, onclick: () => slow() },
          h('span', { class: 'dc-play-ico', 'aria-hidden': 'true', text: '🐢' }),
          h('span', { class: 'dc-slow-txt', text: noIcon(T('slow')) }),
        );
      if (slowBtn)
        slow = () => {
          if (say(text, true)) KFG.restart(slowBtn, 'is-on');
        };
      el = h('div', { class: 'dc-voice' }, btn, slowBtn);
      autoplay(play, () => !answered() && btn.isConnected);
    } else {
      // A visual dictation: the text shows for a moment, then the player writes it from memory.
      const card = h('div', { class: 'dc-flash', lang: 'es', 'aria-live': 'polite' });
      const btn = h(
        'button',
        { type: 'button', class: 'dc-play dc-look', id: 'dc-look', onmousedown: keepFocus, onclick: () => play() },
        h('span', { class: 'dc-play-ico', 'aria-hidden': 'true', text: '👀' }),
        h('span', { class: 'dc-play-txt', text: noIcon(T('look')) }),
      );
      /** @type {ReturnType<typeof setTimeout> | undefined} */
      let timer;
      play = () => {
        card.textContent = text;
        card.classList.add('on');
        clearTimeout(timer);
        timer = setTimeout(() => {
          card.classList.remove('on');
          card.textContent = '';
        }, LOOK_MS);
      };
      el = h('div', { class: 'dc-voice no-voice' }, btn, card, h('small', { class: 'dc-novoice', text: T('noVoice') }));
      setTimeout(() => !answered() && btn.isConnected && play(), SAY_MS);
    }
    return {
      el,
      voice,
      play,
      /** The text once more after the answer (with a voice only: without one the right text is on screen). */
      again: () => voice && say(text),
      /** Space = again; with `slow`, S = slow (the physical key, any layout). */
      onKey: (/** @type {KeyboardEvent} */ e) => {
        if (e.key === ' ') {
          play();
          return true;
        }
        if (o.slow && voice && e.code === 'KeyS') {
          slow();
          return true;
        }
        return false;
      },
    };
  };

  /** Marks a choice: the right one lights up, a wrong pick is amber, the rest fade. */
  const mark = (/** @type {HTMLButtonElement[]} */ buttons, /** @type {number} */ right, /** @type {number} */ picked) => {
    buttons.forEach((b, j) => {
      b.disabled = true;
      b.classList.add(j === right ? 'right' : j === picked ? 'wrong' : 'dim');
    });
  };
  const digit = (/** @type {KeyboardEvent} */ e, /** @type {number} */ n) => {
    const d = Number(e.key);
    return e.key.length === 1 && d >= 1 && d <= n ? d : 0;
  };
  /** The task block: the voice on the left on wide screens, on top on phones. */
  const layout = (/** @type {string} */ cls, /** @type {HTMLElement | null} */ voice, /** @type {KFGKid[]} */ ...kids) =>
    h('div', { class: `dc-task ${cls}${voice ? '' : ' no-clue'}` }, voice, h('div', { class: 'dc-main' }, kids));

  // ---------- typing (tiles, write) ----------
  /** @type {Record<string, string>} */
  const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' };
  /** @type {Record<string, string>} */
  const DIAER = { u: 'ü', U: 'Ü' };
  const SPANISH = /^[a-zñáéíóúü]$/i;
  const PUNCT = '¿?¡!.,';
  /** @param {string} c @param {string} accent '´' | '¨' | '' */
  const compose = (c, accent) => (accent === '´' ? ACUTE[c] : accent === '¨' ? DIAER[c] : null) || c;

  /**
   * Turns key presses into Spanish characters: letters (incl. ñ, á, ü as the layout gives them; on a non-Latin layout the
   * physical key), ¿ ? ¡ ! . , — and an accent first: a dead key (Shift = ¨), ´ ¨, or ' and " on keyboards without them.
   * `onAccent` tells about a pending accent ('' = none).
   * @param {(accent: string) => void} [onAccent]
   */
  const typer = (onAccent) => {
    let accent = '';
    const set = (/** @type {string} */ a) => {
      accent = a;
      onAccent?.(a);
    };
    return {
      get accent() {
        return accent;
      },
      set,
      /** @returns {string | null} the character, or null (not ours, or an accent waiting for its vowel) */
      read: (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Dead') {
          set(e.shiftKey ? '¨' : '´');
          return null;
        }
        if (e.key === '´' || e.key === "'") {
          set(accent === '´' ? '' : '´');
          return null;
        }
        if (e.key === '¨' || e.key === '"') {
          set(accent === '¨' ? '' : '¨');
          return null;
        }
        let c = null;
        if (e.key.length === 1 && (SPANISH.test(e.key) || PUNCT.includes(e.key))) c = e.key;
        else if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
          // A Ukrainian layout gives «ф» for A: take the physical key (ñ sits where the Spanish layout has it).
          const m = /^Key([A-Z])$/.exec(e.code || '');
          const l = m ? m[1].toLowerCase() : e.code === 'Semicolon' ? 'ñ' : null;
          if (l) c = e.shiftKey ? l.toUpperCase() : l;
        }
        if (c === null) return null;
        const out = compose(c, accent);
        if (accent) set('');
        return out;
      },
    };
  };

  /** Slot sizes follow the word length (a 16-letter «¿Cómo te llamas?» still fits a phone). */
  const sizeSlots = (/** @type {ExamBuilder} */ b, /** @type {string[]} */ target) => {
    b.slotsEl.style.setProperty('--n', String(target.length));
    b.slotsEl.style.setProperty(
      '--wn',
      String(
        Math.max(
          ...target
            .join('')
            .split(' ')
            .map((w) => [...w].length),
        ),
      ),
    );
    b.slotsEl.classList.toggle('is-long', target.length > 10 && target.includes(' '));
    b.slotEls.forEach((s, i) => {
      if (target[i] === ' ') s.classList.add('is-space');
    });
  };

  // ---------- gap ----------
  /** @type {ExamRenderer<DCGapTask>} */
  const gap = (task, work, ctx) => {
    const { T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const w = task.word;
    const right = w.slice(task.at, task.at + task.len);
    const opts = shuffle(task.options);
    const voice = voiceOf(ctx, task.say);
    const slot = h('span', { class: `dc-gap${task.len ? '' : ' is-none'}`, id: 'dc-gap' });
    const word = h(
      'span',
      { class: 'dc-word', lang: 'es', style: `--len:${w.length + 1}` },
      w.slice(0, task.at),
      slot,
      w.slice(task.at + task.len),
    );
    const buttons = opts.map((o, i) =>
      h(
        'button',
        { type: 'button', class: `dc-opt dc-letter${o ? '' : ' is-none'}`, 'data-opt': o, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { lang: o ? 'es' : null, text: o || T('noLetter') }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = opts[i] === right;
      mark(buttons, opts.indexOf(right), i);
      // The right text drops into the gap either way: green when found, amber when shown; «nothing» closes it.
      slot.replaceChildren(right ? h('i', { text: right }) : '');
      slot.classList.add(ok ? 'ok' : 'fix');
      resolve(ok, { answer: w });
      voice.again();
    };
    const n = buttons.length;
    work.append(
      layout(
        'dc-gap-task',
        voice.el,
        h('div', { class: 'dc-wordbox' }, word),
        h('div', { class: 'dc-opts dc-letters' }, buttons),
        kbdHint(voice.voice ? T('kGap', { n }) : T('kChoice', { n })),
      ),
    );
    setKeys((e) => {
      const d = digit(e, n);
      if (d) {
        choose(d - 1);
        return true;
      }
      return voice.onKey(e);
    });
  };

  // ---------- pick ----------
  /** @type {ExamRenderer<DCPickTask>} */
  const pick = (task, work, ctx) => {
    const { T, shuffle, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const right = task.options[0];
    const opts = shuffle(task.options);
    const voice = voiceOf(ctx, task.say);
    const buttons = opts.map((o, i) =>
      h(
        'button',
        { type: 'button', class: 'dc-opt dc-spell', 'data-opt': o, onclick: () => choose(i) },
        h('kbd', { text: String(i + 1) }),
        h('span', { lang: 'es', text: o }),
      ),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = opts[i] === right;
      mark(buttons, opts.indexOf(right), i);
      resolve(ok, { answer: right });
      if (!ok) voice.again(); // hear it once more while the right spelling lights up
    };
    const n = buttons.length;
    work.append(
      layout(
        'dc-pick-task',
        voice.el,
        h('div', { class: 'dc-opts dc-spells' }, buttons),
        kbdHint(voice.voice ? T('kPick', { n }) : T('kChoice', { n })),
      ),
    );
    setKeys((e) => {
      const d = digit(e, n);
      if (d) {
        choose(d - 1);
        return true;
      }
      return voice.onKey(e);
    });
  };

  // ---------- tiles ----------
  /** @type {ExamRenderer<DCTilesTask>} */
  const tiles = (task, work, ctx) => {
    const { T, shuffle, kbdHint } = ctx;
    fresh();
    const target = [...task.word];
    const pool = shuffle([...target, ...task.traps]);
    const voice = voiceOf(ctx, task.say);
    const typed = typer();
    // Exact: a capital, an accent, ¿ or ¡ is the very thing trained.
    const b = /** @type {ExamBuilderFactory} */ (KFExam.builder)(ctx, {
      target,
      tiles: pool,
      answer: task.word,
      keyUnit: (e) => typed.read(e),
      shakeFull: true,
      classes: { slot: 'dc-slot', tile: 'dc-tile', slots: 'dc-slots', tiles: 'dc-tiles', erase: 'dc-erase', check: 'dc-check' },
      tileAttr: 'data-ch',
      tileContent: (u, t) => h('span', { class: `dc-mg c${t % 5}`, text: u }),
      slotsLang: 'es',
      tilesLang: 'es',
      strings: { fill: 'fill', green: 'green', again: 'tryAgain', erase: 'erase' },
      onDone: () => {
        box.classList.add('is-done');
        voice.again();
      },
    });
    sizeSlots(b, target);
    const box = layout(
      'dc-build dc-tiles-task',
      voice.el,
      b.slotsEl,
      b.hint,
      b.tilesEl,
      h('div', { class: 'dc-actions' }, b.eraseBtn, b.checkBtn),
      kbdHint(`${T('kTiles')} · ${T('kAccent')}`),
    );
    work.append(box);
    b.setKeys((e) => voice.onKey(e));
  };

  // ---------- tilde ----------
  /** @type {ExamRenderer<DCTildeTask>} */
  const tilde = (task, work, ctx) => {
    const { T, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    const letters = [...task.plain];
    const voice = voiceOf(ctx, task.say);
    /** @type {number[]} index in the word of vowel n */
    const vowels = [];
    /** @type {HTMLButtonElement[]} */
    const buttons = [];
    const boxes = letters.map((l, i) => {
      if (!/[aeiou]/.test(l)) return h('span', { class: 'dc-tl', text: l });
      vowels.push(i);
      const b = h(
        'button',
        { type: 'button', class: 'dc-tl dc-tv', 'data-i': String(i), 'aria-label': l, onclick: () => choose(i) },
        h('span', { class: 'dc-tch', text: l }),
        h('kbd', { text: String(vowels.length) }),
      );
      buttons.push(b);
      return b;
    });
    const none = h(
      'button',
      { type: 'button', class: 'dc-opt dc-notilde', id: 'dc-notilde', onclick: () => choose(-1) },
      h('kbd', { text: '0' }),
      h('span', { text: T('noTilde') }),
    );
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = i === task.answer;
      for (const b of [...buttons, none]) b.disabled = true;
      const picked = i < 0 ? none : buttons[vowels.indexOf(i)];
      if (task.answer < 0) none.classList.add('right');
      else {
        const rb = buttons[vowels.indexOf(task.answer)];
        rb.classList.add('right');
        /** @type {HTMLElement} */ (rb.querySelector('.dc-tch')).textContent = [...task.word][task.answer];
      }
      if (!ok) picked.classList.add('wrong');
      word.classList.add('is-done');
      resolve(ok, { answer: task.word });
      voice.again();
    };
    const word = h('div', { class: 'dc-tword', lang: 'es', style: `--n:${letters.length}` }, boxes);
    work.append(
      layout('dc-tilde-task', voice.el, h('div', { class: 'dc-wordbox' }, word), none, kbdHint(T('kTilde', { n: vowels.length }))),
    );
    setKeys((e) => {
      const d = digit(e, vowels.length);
      if (d) {
        choose(vowels[d - 1]);
        return true;
      }
      if (e.key === '0') {
        choose(-1);
        return true;
      }
      return voice.onKey(e);
    });
  };

  // ---------- cloze ----------
  /** @type {ExamRenderer<DCClozeTask>} */
  const cloze = (task, work, ctx) => {
    const { T, shuffle, shake, resolve, answered, setKeys, kbdHint, hint: mkHint } = ctx;
    fresh();
    const voice = voiceOf(ctx, task.say, { slow: true });
    /** @type {{ gap: DCGap, opts: string[], el: HTMLButtonElement, tries: number, done: '' | 'ok' | 'fix' }[]} */
    const gaps = [];
    // Words never break around a gap: «e[m]pieza» stays one piece on the line.
    /** @type {KFGKid[][]} */
    const words = [[]];
    for (const p of task.parts) {
      if (typeof p === 'string') {
        p.split(' ').forEach((s, i) => {
          if (i > 0) words.push([]);
          if (s) words[words.length - 1].push(s);
        });
      } else {
        const k = gaps.length;
        const el = h('button', {
          type: 'button',
          class: 'dc-cgap',
          'data-i': String(k),
          'aria-label': `${k + 1}`,
          onmousedown: keepFocus,
          onclick: () => select(k),
        });
        gaps.push({ gap: p, opts: shuffle(p.options), el, tries: 0, done: '' });
        words[words.length - 1].push(el);
      }
    }
    const sentence = h(
      'p',
      { class: 'dc-sentence', lang: 'es' },
      words.filter((w) => w.length).flatMap((w, i) => [i ? ' ' : null, h('span', { class: 'dc-sw' }, w)]),
    );
    const chooser = h('div', { class: 'dc-opts dc-chooser', id: 'dc-chooser' });
    const hint = mkHint();
    let active = 0;
    let misses = 0;
    /** @type {HTMLButtonElement[]} */
    let optEls = [];
    const open = () => gaps.map((g, i) => (g.done ? -1 : i)).filter((i) => i >= 0);
    const draw = () => {
      gaps.forEach((g, i) => {
        g.el.classList.toggle('on', i === active && !g.done && !answered());
        g.el.disabled = !!g.done || answered();
      });
      const g = gaps[active];
      optEls = g && !g.done && !answered() ? g.opts.map((o, i) => optBtn(o, i)) : [];
      chooser.replaceChildren(...optEls);
    };
    const optBtn = (/** @type {string} */ o, /** @type {number} */ i) =>
      h(
        'button',
        { type: 'button', class: `dc-opt dc-copt${o ? '' : ' is-none'}`, 'data-opt': o, onclick: () => choose(o) },
        h('kbd', { text: String(i + 1) }),
        h('span', { lang: o ? 'es' : null, text: o || T('noLetter') }),
      );
    const select = (/** @type {number} */ k) => {
      if (answered() || !gaps[k] || gaps[k].done) return;
      active = k;
      hint.textContent = '';
      draw();
    };
    const fill = (/** @type {(typeof gaps)[number]} */ g, /** @type {'ok' | 'fix'} */ how) => {
      g.done = how;
      g.el.classList.remove('on');
      g.el.classList.add(how, g.gap.right ? 'filled' : 'is-none');
      g.el.replaceChildren(h('i', { text: g.gap.right }));
    };
    const choose = (/** @type {string} */ o) => {
      const g = gaps[active];
      if (answered() || !g || g.done) return;
      if (o === g.gap.right) {
        fill(g, 'ok');
        hint.textContent = '';
      } else {
        g.tries++;
        misses++;
        if (g.tries >= 2) {
          fill(g, 'fix');
          hint.textContent = T('seeRight');
        } else {
          hint.textContent = T('tryAgain');
          KFG.restart(g.el, 'missed');
          shake(g.el);
        }
      }
      const rest = open();
      if (!rest.length) {
        const ok = gaps.every((x) => x.done === 'ok');
        draw();
        sentence.classList.add('is-done');
        // The sentence on the board shows the right text: the feedback needs no copy of it.
        resolve(ok, { soft: ok && misses > 0 });
        voice.again();
        return;
      }
      if (g.done) active = rest.find((i) => i > active) ?? rest[0];
      draw();
    };
    draw();
    work.append(
      layout(
        'dc-cloze-task',
        voice.el,
        h('div', { class: 'dc-wordbox dc-sentbox' }, sentence),
        hint,
        chooser,
        kbdHint(`${T('kCloze')} · ${T('kClozeKeys', { n: Math.max(...gaps.map((g) => g.opts.length)) })}`),
      ),
    );
    setKeys((e) => {
      const d = digit(e, optEls.length);
      if (d) {
        choose(gaps[active].opts[d - 1]);
        return true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const rest = open();
        if (rest.length) {
          const at = Math.max(0, rest.indexOf(active));
          select(rest[(at + (e.key === 'ArrowLeft' ? -1 : 1) + rest.length) % rest.length]);
        }
        return true;
      }
      return voice.onKey(e);
    });
  };

  // ---------- spot ----------
  /** @type {ExamRenderer<DCSpotTask>} */
  const spot = (task, work, ctx) => {
    const { T, resolve, answered, setKeys, kbdHint } = ctx;
    fresh();
    KFG.preload(task.say, 'es'); // spoken after the answer: before it, it is a reading task
    const chips = task.words.map((w, i) =>
      h('button', { type: 'button', class: 'dc-chip', 'data-i': String(i), onclick: () => choose(i) }, h('span', { text: w })),
    );
    const note = h('p', { class: 'dc-spot-note', role: 'status' });
    const choose = (/** @type {number} */ i) => {
      if (answered()) return;
      const ok = i === task.wrong;
      chips.forEach((c) => {
        c.disabled = true;
      });
      // The coach corrects it in red marker: the wrong spelling struck through, the right one written above.
      const bad = chips[task.wrong];
      const w = task.words[task.wrong];
      const tail = /[.,;:!?]+$/.exec(w)?.[0] || '';
      bad.classList.add('is-fixed', ok ? 'right' : 'missed');
      bad.replaceChildren(h('s', { text: w.slice(0, w.length - tail.length) }), tail, h('ins', { class: 'dc-fix', text: task.fix }));
      if (!ok) chips[i].classList.add('wrong');
      note.textContent = T('spotFix', { w: task.fix });
      resolve(ok); // the correction is on the board and in the note
      say(task.say);
    };
    work.append(
      layout(
        'dc-spot-task',
        null,
        h('div', { class: 'dc-wordbox dc-sentbox' }, h('p', { class: 'dc-sentence dc-spot', lang: 'es' }, chips)),
        note,
        kbdHint(`${T('kSpot')} · ${T('kSpotKeys')}`),
      ),
    );
    setKeys((e) => {
      const d = digit(e, Math.min(chips.length, 9));
      if (d) {
        choose(d - 1);
        return true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const at = chips.indexOf(/** @type {HTMLButtonElement} */ (document.activeElement));
        const next = at < 0 ? 0 : (at + (e.key === 'ArrowLeft' ? -1 : 1) + chips.length) % chips.length;
        chips[next].focus();
        return true;
      }
      return false;
    });
  };

  // ---------- write ----------
  const ROWS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
  /** @type {ExamRenderer<DCWriteTask>} */
  const write = (task, work, ctx) => {
    const { T, kbdHint, answered } = ctx;
    fresh();
    const target = [...task.word];
    const voice = voiceOf(ctx, task.say);
    let shift = false;
    const b = /** @type {ExamBuilderFactory} */ (KFExam.builder)(ctx, {
      target,
      answer: task.word,
      classes: { slot: 'dc-slot', tile: 'dc-key', slots: 'dc-slots', tiles: 'dc-kbd', erase: 'dc-erase', check: 'dc-check' },
      slotsLang: 'es',
      tilesLang: 'es',
      strings: { fill: 'fill', green: 'green', again: 'tryAgain', erase: 'erase' },
      onDone: () => {
        box.classList.add('is-done');
        voice.again();
      },
    });
    sizeSlots(b, target);
    const free = () => b.values().indexOf(null);
    // Spaces between words fill themselves (they are not what is trained).
    const settle = () => {
      while (free() >= 0 && target[free()] === ' ') b.put(' ');
      drawKeys();
    };
    const put = (/** @type {string} */ c) => {
      if (answered()) return;
      b.put(c);
      settle();
    };
    // Back one character; a space that filled itself goes with the letter before it.
    const erase = () => {
      if (answered()) return;
      const v = b.values();
      let last = v.length - 1;
      while (last >= 0 && (v[last] === null || b.slotEls[last].classList.contains('good'))) last--;
      b.erase();
      if (last >= 0 && target[last] === ' ') b.erase();
      drawKeys();
    };
    const typed = typer(() => drawKeys());

    // ---- the on-screen keyboard ----
    /** @type {{ el: HTMLButtonElement, k: string }[]} */
    const letterKeys = [];
    const key = (
      /** @type {string} */ k,
      /** @type {string} */ cls,
      /** @type {() => void} */ on,
      /** @type {KFGKid} */ label,
      aria = '',
    ) =>
      h(
        'button',
        { type: 'button', class: `dc-key ${cls}`, 'data-k': k, 'aria-label': aria || null, onmousedown: keepFocus, onclick: on },
        label,
      );
    const letter = (/** @type {string} */ k) => {
      const el = key(k, 'is-letter', () => tapLetter(k), k);
      letterKeys.push({ el, k });
      return el;
    };
    const tapLetter = (/** @type {string} */ k) => {
      const c = compose(shift ? k.toUpperCase() : k, typed.accent);
      shift = false;
      typed.set('');
      put(c);
    };
    const shiftKey = key(
      'shift',
      'is-fn dc-shift',
      () => {
        shift = !shift;
        drawKeys();
      },
      '⇧',
      T('shift'),
    );
    const acuteKey = key('´', 'is-fn dc-acc', () => typed.set(typed.accent === '´' ? '' : '´'), '´', T('accent'));
    const diaerKey = key('¨', 'is-fn dc-acc', () => typed.set(typed.accent === '¨' ? '' : '¨'), '¨', T('dieresis'));
    const eraseKey = key('⌫', 'is-fn dc-bksp', erase, '⌫', noIcon(T('erase')));
    const punct = [...'¿?¡!'].map((p) => key(p, 'is-punct', () => put(p), p));
    b.checkBtn.classList.add('dc-key', 'is-check');
    b.tilesEl.append(
      h('div', { class: 'dc-krow' }, [...ROWS[0]].map(letter)),
      h('div', { class: 'dc-krow' }, [...ROWS[1]].map(letter)),
      h('div', { class: 'dc-krow' }, shiftKey, [...ROWS[2]].map(letter), eraseKey),
      h('div', { class: 'dc-krow' }, acuteKey, diaerKey, punct, b.checkBtn),
    );
    function drawKeys() {
      const acc = typed.accent;
      const off = answered();
      for (const { el, k } of letterKeys) {
        const c = compose(shift ? k.toUpperCase() : k, acc);
        el.textContent = c;
        el.classList.toggle('is-accented', c !== (shift ? k.toUpperCase() : k));
        el.classList.toggle('is-dim', !!acc && c === (shift ? k.toUpperCase() : k));
        el.disabled = off;
      }
      shiftKey.setAttribute('aria-pressed', String(shift));
      acuteKey.setAttribute('aria-pressed', String(acc === '´'));
      diaerKey.setAttribute('aria-pressed', String(acc === '¨'));
      for (const el of [shiftKey, acuteKey, diaerKey, ...punct]) el.disabled = off;
      eraseKey.disabled = off || !b.values().some((u, i) => u !== null && !b.slotEls[i].classList.contains('good'));
    }
    // A tapped slot sends it and the ones after it back (the builder): refill the spaces there.
    b.slotsEl.addEventListener('click', () => settle());
    b.checkBtn.addEventListener('click', () => settle());
    drawKeys();

    const box = layout('dc-build dc-write-task', voice.el, b.slotsEl, b.hint, b.tilesEl, kbdHint(`${T('kWrite')} · ${T('kAccent')}`));
    work.append(box);
    ctx.setKeys((e) => {
      if (e.key === 'Enter') {
        b.check();
        drawKeys();
        return true;
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        erase();
        return true;
      }
      if (voice.onKey(e)) return true;
      if (e.key === 'Dead' || e.key.length === 1) {
        const before = typed.accent;
        let c = typed.read(e);
        if (c === null) return e.key === 'Dead' || typed.accent !== before;
        // The on-screen ⇧ counts for a typed letter too.
        if (shift && c.length === 1) c = c.toUpperCase();
        shift = false;
        put(c);
        return true;
      }
      return false;
    });
  };

  return { gap, pick, tiles, tilde, cloze, spot, write };
})();
