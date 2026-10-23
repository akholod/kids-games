// Renderers of the task types only «Lenguas por el mundo» has. window.LE_TYPES = { fix, chat, tone } → KFExam.mount(..., { types }).
// Generic types (choice, tf, sort, order, pairs, label, fill, pick) live in shared/exam/types.js.
// @ts-check
'use strict';

window.LE_TYPES = (() => {
  // Texts of these three types: Spanish on both sites, like the engine's (exam units are taught in Spanish).
  const S = {
    fixHelp: 'Toca una palabra: mayúscula. Toca el hueco: punto.',
    check: 'Comprobar ✓',
    undo: '↶ Deshacer',
    fixMarked: ({ n }) => `Hay ${n} fallos marcados. ¡Corrígelos y comprueba otra vez!`,
    fixAlmost: '¡Casi! Fíjate en lo marcado.',
    fixSeeText: 'Mira el texto corregido.',
    kFix: 'Teclado: ← → para moverte, Espacio para cambiar, ⌫ para deshacer, Enter para comprobar',
    gapLabel: ({ w }) => `Punto después de «${w}»`,
    gapEnd: 'Punto final',
    textLabel: 'Texto para corregir',
    calling: 'Llamada',
    callEnd: ({ t }) => `📞 Fin de la llamada · ${t}`,
    better: 'Mejor así:',
    typing: 'Hablando…',
    kChat: ({ n }) => `Teclas 1–${n}`,
    chatSeeCall: 'Mira la llamada: ahí tienes las respuestas buenas.',
    listen: 'Escuchar otra vez',
    up: '↗ Sube',
    upTerm: 'ascendente',
    down: '↘ Baja',
    downTerm: 'descendente',
    upHint: 'la voz sube al final',
    downHint: 'la voz baja al final',
    noSound: 'Sin sonido: fíjate en el signo del final.',
    kTone: 'Teclas: R o Espacio para escuchar, 1 o ↑ sube, 2 o ↓ baja',
    toneUp: 'Sube: ascendente',
    toneDown: 'Baja: descendente',
  };
  const U = KF.i18n({ uk: S, es: S });
  const LETTER = /\p{L}/u;

  // ---------- fix: «Corrige el texto» ----------
  /** @typedef {{ lead: string, word: string, trail: string, cap: boolean, dot: boolean, letter: boolean, br: boolean }} LEFixToken */
  /** Splits the correct text into words: leading/trailing punctuation, the expected capital and full stop after each. */
  const tokenize = (/** @type {string} */ text) => {
    /** @type {LEFixToken[]} */
    const out = [];
    String(text)
      .split(/\n+/)
      .forEach((line, li) => {
        line
          .split(/\s+/)
          .filter(Boolean)
          .forEach((raw, wi) => {
            const m = raw.match(/^([¡¿«"“(—-]*)(.*?)([.,;:!?»"”)…]*)$/u) || ['', '', raw, ''];
            const word = m[2];
            const letter = LETTER.test(word.charAt(0));
            out.push({
              lead: m[1],
              word: word.toLowerCase(),
              trail: m[3].replace(/\./g, ''),
              cap: letter && word.charAt(0) !== word.charAt(0).toLowerCase(),
              dot: m[3].includes('.'),
              letter,
              br: li > 0 && wi === 0,
            });
          });
      });
    return out;
  };
  /** @type {ExamRenderer<LEFixTask>} */
  const fix = (task, work, ctx) => {
    const { h, shake, hint: mkHint, kbdHint, resolve, answered, setKeys } = ctx;
    const toks = tokenize(task.text);
    if (!toks.length) return ctx.fallback(task, work, [{ text: task.text, ok: true }]);
    const capOn = toks.map(() => false);
    const dotOn = toks.map(() => false);
    /** @type {{ kind: 'w' | 'g', i: number }[]} */
    const undoStack = [];
    let tries = 0;
    let done = false;
    const hint = mkHint();
    hint.textContent = U('fixHelp');

    /** @type {(HTMLButtonElement | null)[]} */
    const wordEls = [];
    /** @type {HTMLButtonElement[]} */
    const gapEls = [];
    const tokEls = toks.map((t, i) => {
      const wEl = t.letter
        ? h(
            'button',
            { type: 'button', class: 'le-w', 'data-i': String(i), 'aria-pressed': 'false', onclick: () => toggle('w', i) },
            h('span', { class: 'le-cap', text: t.word.charAt(0) }),
            t.word.slice(1),
          )
        : null;
      wordEls.push(wEl);
      const last = i === toks.length - 1;
      const gEl = h(
        'button',
        {
          type: 'button',
          class: `le-g${last ? ' le-g-end' : ''}`,
          'data-i': String(i),
          'aria-pressed': 'false',
          'aria-label': last ? U('gapEnd') : U('gapLabel', { w: t.word }),
          onclick: () => toggle('g', i),
        },
        h('span', { class: 'le-dot', 'aria-hidden': 'true' }),
      );
      gapEls.push(gEl);
      const tok = h(
        'span',
        { class: 'le-tok' },
        t.lead && h('span', { class: 'le-p', text: t.lead }),
        wEl || h('span', { class: 'le-plain', text: t.word }),
        t.trail && h('span', { class: 'le-p', text: t.trail }),
        gEl,
      );
      // A new paragraph starts on its own line.
      return t.br ? [h('span', { class: 'le-nl', 'aria-hidden': 'true' }), tok] : tok;
    });
    // Keyboard order: word, its gap, next word, …
    const order = /** @type {HTMLButtonElement[]} */ (tokEls.flatMap((_, i) => [wordEls[i], gapEls[i]]).filter(Boolean));
    let cur = 0;

    const draw = () => {
      toks.forEach((t, i) => {
        const w = wordEls[i];
        if (w) {
          w.setAttribute('aria-pressed', String(capOn[i]));
          /** @type {HTMLElement} */ (w.firstChild).textContent = capOn[i] ? t.word.charAt(0).toUpperCase() : t.word.charAt(0);
        }
        gapEls[i].setAttribute('aria-pressed', String(dotOn[i]));
      });
      undoBtn.disabled = done || !undoStack.length;
    };
    const toggle = (/** @type {'w' | 'g'} */ kind, /** @type {number} */ i, fromUndo = false) => {
      if (done || answered()) return;
      if (kind === 'w') capOn[i] = !capOn[i];
      else dotOn[i] = !dotOn[i];
      (kind === 'w' ? wordEls[i] : gapEls[i])?.classList.remove('is-wrong');
      if (!fromUndo) undoStack.push({ kind, i });
      const el = kind === 'w' ? wordEls[i] : gapEls[i];
      const k = order.indexOf(/** @type {HTMLButtonElement} */ (el));
      if (k >= 0) cur = k;
      draw();
    };
    const undo = () => {
      const last = undoStack.pop();
      if (last) toggle(last.kind, last.i, true);
      draw();
    };
    /** Wrong decisions: [kind, index]. */
    const wrongs = () => {
      /** @type {['w' | 'g', number][]} */
      const out = [];
      toks.forEach((t, i) => {
        if (t.letter && capOn[i] !== t.cap) out.push(['w', i]);
        if (dotOn[i] !== t.dot) out.push(['g', i]);
      });
      return out;
    };
    const elOf = (/** @type {'w' | 'g'} */ kind, /** @type {number} */ i) => (kind === 'w' ? wordEls[i] : gapEls[i]);
    // The end: every word and gap shows the correct text; what was wrong at the last check is marked.
    const finish = (/** @type {['w' | 'g', number][]} */ bad) => {
      done = true;
      toks.forEach((t, i) => {
        capOn[i] = t.cap;
        dotOn[i] = t.dot;
      });
      draw();
      for (const el of order) {
        el.disabled = true;
        el.classList.remove('is-wrong');
      }
      for (const [k, i] of bad) elOf(k, i)?.classList.add('is-fixed');
      root.classList.add('is-done');
      actions.remove();
      hint.textContent = '';
    };
    const check = () => {
      if (done || answered()) return;
      tries++;
      const bad = wrongs();
      if (!bad.length) {
        finish([]);
        resolve(true, { soft: tries > 1 });
      } else if (bad.length === 1 && tries === 1) {
        finish(bad);
        resolve(true, { soft: true, note: U('fixAlmost') });
      } else if (tries === 1) {
        for (const el of order) el.classList.remove('is-wrong');
        for (const [k, i] of bad) elOf(k, i)?.classList.add('is-wrong');
        shake(page);
        hint.textContent = U('fixMarked', { n: bad.length });
      } else {
        finish(bad);
        // The engine adds its own full stop after the answer.
        resolve(false, { answer: task.text.trim().replace(/\.$/, ''), note: U('fixSeeText') });
      }
    };

    const page = h('div', { class: 'le-fix-page', role: 'group', 'aria-label': U('textLabel'), lang: 'es' }, tokEls);
    const undoBtn = h('button', { type: 'button', class: 'btn btn-light le-fix-undo', disabled: true, onclick: () => undo() }, U('undo'));
    const checkBtn = h('button', { type: 'button', class: 'btn btn-dark le-fix-check', onclick: () => check() }, U('check'));
    const actions = h('div', { class: 'le-fix-actions' }, undoBtn, checkBtn);
    const root = h('div', { class: 'le-fix' }, page, h('div', { class: 'le-fix-side' }, hint, actions, kbdHint(U('kFix'))));
    // Enter on a focused word or gap checks (its own click would toggle it; Space keeps toggling).
    page.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        check();
      }
    });
    page.addEventListener('focusin', (e) => {
      const k = order.indexOf(/** @type {HTMLButtonElement} */ (e.target));
      if (k >= 0) cur = k;
    });
    const move = (/** @type {number} */ d) => {
      if (done) return;
      const inside = order.includes(/** @type {HTMLButtonElement} */ (document.activeElement));
      cur = inside ? Math.min(Math.max(cur + d, 0), order.length - 1) : d > 0 ? 0 : order.length - 1;
      order[cur].focus();
    };
    draw();
    work.append(root);
    setKeys((e) => {
      if (e.key === 'ArrowRight') {
        move(1);
        return true;
      }
      if (e.key === 'ArrowLeft') {
        move(-1);
        return true;
      }
      if (e.key === ' ') {
        const el = order[cur];
        if (el && !done) {
          el.focus();
          el.click();
        }
        return true;
      }
      if (e.key === 'Backspace') {
        undo();
        return true;
      }
      if (e.key === 'Enter') {
        check();
        return true;
      }
      return false;
    });
  };

  // ---------- chat: a phone call ----------
  // Stage directions in brackets («(Cuelgas sin decir nada.)») are actions, not words: they are drawn as such (italic, grey).
  const ACTION = /(\([^)]*\))/;
  const isAction = (/** @type {string} */ text) => /^\([^)]*\)$/.test(text.trim());
  const speech = (/** @type {KFGAPI['h']} */ h, /** @type {string} */ text) =>
    String(text)
      .split(ACTION)
      .filter(Boolean)
      .map((part) => (ACTION.test(part) ? h('i', { class: 'le-act', text: part }) : part));
  const mmss = (/** @type {number} */ s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /** @type {ExamRenderer<LEChatTask>} */
  const chat = (task, work, ctx) => {
    const { h, shuffle, shake, reduced, hint: mkHint, kbdHint, resolve, answered, setKeys } = ctx;
    const turns = task.turns || [];
    if (!turns.length) return ctx.fallback(task, work, [{ text: task.who, ok: true }]);
    let turn = -1;
    let wrong = 0;
    let busy = true;
    let secs = 0;
    /** @type {{ text: string, ok: boolean }[]} */
    let opts = [];
    const hint = mkHint();
    const timer = h('span', { class: 'le-timer', text: '00:00' });
    const bubbles = h('div', { class: 'le-bubbles', role: 'log', 'aria-live': 'polite', lang: 'es' });
    const replies = h('div', { class: 'le-replies', lang: 'es' });
    const phone = h(
      'div',
      { class: 'le-phone' },
      h(
        'div',
        { class: 'le-phone-top' },
        h('span', { class: 'le-ava', 'aria-hidden': 'true', text: task.icon || '🙂' }),
        h('span', { class: 'le-who' }, h('strong', { text: task.who }), h('span', { class: 'le-live' }, U('calling'), ' · ', timer)),
      ),
      bubbles,
    );
    const root = h(
      'div',
      { class: 'le-chat', 'data-turn': '0' },
      phone,
      h('div', { class: 'le-chat-side' }, replies, hint, kbdHint(U('kChat', { n: Math.max(...turns.map((t) => t.options.length)) }))),
    );
    const tick = setInterval(() => {
      if (!root.isConnected || root.classList.contains('is-over')) {
        clearInterval(tick);
        return;
      }
      timer.textContent = mmss(++secs);
    }, 1000);

    const bubble = (/** @type {string} */ cls, /** @type {KFGKid[]} */ ...kids) => {
      const b = h('div', { class: `le-b ${cls}` }, ...kids);
      bubbles.append(b);
      bubbles.scrollTop = bubbles.scrollHeight;
      return b;
    };
    const later = (/** @type {() => void} */ fn, /** @type {number} */ ms) => {
      if (reduced()) fn();
      else
        setTimeout(() => {
          if (root.isConnected) fn();
        }, ms);
    };

    const showReplies = () => {
      const t = turns[turn];
      opts = shuffle(t.options.map((text, i) => ({ text, ok: i === t.answer })));
      replies.replaceChildren(
        ...opts.map((o, k) =>
          h(
            'button',
            {
              type: 'button',
              class: `choice le-reply${isAction(o.text) ? ' is-action' : ''}`,
              'data-i': String(k),
              onclick: () => pick(k),
            },
            h('kbd', { text: String(k + 1) }),
            speech(h, o.text),
          ),
        ),
      );
      busy = false;
    };
    const nextTurn = () => {
      turn++;
      root.dataset.turn = String(turn);
      if (turn >= turns.length) return end();
      busy = true;
      replies.replaceChildren();
      const say = () => {
        bubble('le-them', speech(h, turns[turn].them));
        showReplies();
      };
      if (reduced()) say();
      else {
        const dots = bubble('le-them le-typing', h('span', { 'aria-label': U('typing') }, h('i'), h('i'), h('i')));
        setTimeout(() => {
          if (!root.isConnected) return;
          dots.remove();
          say();
        }, 650);
      }
    };
    const pick = (/** @type {number} */ k) => {
      if (busy || answered() || !opts[k]) return;
      busy = true;
      const btns = /** @type {HTMLButtonElement[]} */ ([...replies.children]);
      btns.forEach((b, j) => {
        b.disabled = true;
        if (opts[j].ok) b.classList.add('right');
        else if (j !== k) b.classList.add('dim');
      });
      const right = opts.find((o) => o.ok)?.text || '';
      const act = isAction(right) ? ' is-action' : '';
      if (opts[k].ok) {
        bubble(`le-me${act}`, speech(h, right));
        later(nextTurn, 700);
      } else {
        wrong++;
        btns[k].classList.add('wrong');
        shake(btns[k]);
        bubble('le-why', `💡 ${turns[turn].why || U('better')}`);
        bubble(`le-me le-me-fixed${act}`, speech(h, right));
        later(nextTurn, 1500);
      }
    };
    const end = () => {
      root.classList.add('is-over');
      replies.replaceChildren();
      bubble('le-sys', U('callEnd', { t: mmss(secs) }));
      const ok = wrong <= 1;
      resolve(ok, ok ? { soft: wrong === 1 } : { note: U('chatSeeCall') });
    };

    work.append(root);
    nextTurn();
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= opts.length && !busy) {
        pick(n - 1);
        return true;
      }
      return false;
    });
  };

  // ---------- tone: does the voice go up or down? ----------
  /** @type {ExamRenderer<LEToneTask>} */
  const tone = (task, work, ctx) => {
    const { h, hint: mkHint, kbdHint, resolve, answered, setKeys } = ctx;
    const sound = KFG.canSay('es', task.say);
    const hint = mkHint();
    let done = false;
    let poll = 0;
    const words = String(task.say).trim().split(/\s+/);
    const tail = words.pop() || '';
    const arrow = h('span', {
      class: 'le-tone-arrow',
      'aria-hidden': 'true',
      html: '<svg viewBox="0 0 120 34" preserveAspectRatio="none"><path class="le-arc" d="M4 30C40 30 80 26 112 6"/><path class="le-head" d="M100 4L113 5L108 17"/></svg>',
    });
    const say = h(
      'p',
      { class: 'le-tone-text', lang: 'es' },
      words.length ? `${words.join(' ')} ` : '',
      h('span', { class: 'le-tone-end' }, tail, arrow),
    );
    const box = h('div', { class: `le-tone-say${sound ? '' : ' is-shown'}` }, say);
    const play = h(
      'button',
      { type: 'button', class: 'le-tone-play', 'aria-label': U('listen'), title: U('listen'), onclick: () => listen() },
      h('span', { 'aria-hidden': 'true', text: '🔊' }),
    );
    const mk = (/** @type {boolean} */ up, /** @type {string} */ key) =>
      h(
        'button',
        { type: 'button', class: 'choice le-tone-ans', 'data-rising': String(up), onclick: () => choose(up) },
        h('kbd', { text: key }),
        h('b', { text: U(up ? 'up' : 'down') }),
        h('span', { class: 'le-term', lang: 'es', text: U(up ? 'upTerm' : 'downTerm') }),
        h('small', { text: U(up ? 'upHint' : 'downHint') }),
      );
    const upBtn = mk(true, '1');
    const downBtn = mk(false, '2');
    const root = h(
      'div',
      { class: `le-tone${sound ? '' : ' no-sound'}` },
      h('div', { class: 'le-tone-top' }, sound && play, box, !sound && h('p', { class: 'le-tone-note', text: U('noSound') })),
      h('div', { class: 'le-tone-answers' }, upBtn, downBtn),
      hint,
      kbdHint(U('kTone')),
    );

    const listen = () => {
      if (!sound) return;
      KFG.say(task.say, 'es');
      play.classList.add('is-playing');
      clearInterval(poll);
      let n = 0;
      // The clip loads first: give it a moment before reading «speaking» as «finished».
      poll = window.setInterval(() => {
        n++;
        if (!play.isConnected || (n > 3 && !KFG.speaking()) || n > 60) {
          play.classList.remove('is-playing');
          clearInterval(poll);
        }
      }, 200);
    };
    const choose = (/** @type {boolean} */ up) => {
      if (done || answered()) return;
      done = true;
      const ok = up === task.rising;
      upBtn.disabled = true;
      downBtn.disabled = true;
      (task.rising ? upBtn : downBtn).classList.add('right');
      if (!ok) (up ? upBtn : downBtn).classList.add('wrong');
      root.classList.add('is-done', task.rising ? 'is-rising' : 'is-falling');
      box.classList.add('is-shown');
      resolve(ok, { answer: U(task.rising ? 'toneUp' : 'toneDown') });
    };

    work.append(root);
    // Heard once when shown (the task appears after a tap, so the browser lets it play).
    if (sound)
      setTimeout(() => {
        if (root.isConnected && !done) listen();
      }, 250);
    setKeys((e) => {
      const k = e.key.toLowerCase();
      if (k === 'r' || k === ' ') {
        listen();
        return true;
      }
      if (k === '1' || e.key === 'ArrowUp') {
        choose(true);
        return true;
      }
      if (k === '2' || e.key === 'ArrowDown') {
        choose(false);
        return true;
      }
      return false;
    });
  };

  return { fix, chat, tone };
})();
