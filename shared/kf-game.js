// Keeper Fun Games — shared game UI helpers (DOM only, no dependency on KF).
// Include after kf-ui.js, before the game's own scripts:  <script src="../../shared/kf-game.js"></script>
//   KFG.$(id)  KFG.h(tag, props, ...kids)   props: class / text / html / on<event> / attrs (null, false, undefined are skipped)
//   KFG.shuffle(arr)  KFG.pick(arr)  KFG.reduced()            (Math.random inside, so tests can seed it)
//   KFG.restart(el, cls)  KFG.shake(...els)                   (animation replay; shake does nothing with reduced motion)
//   const show = KFG.screens(['hub','play'], { scroll, idOf, onShow })   one screen visible, others hidden, scroll to top
//   KFG.dots(box, results, index, { total, cls, base, kind, attrs })    progress dots: true / false / not yet answered
//   KFG.feedback(box, content, ...buttons, { focus, scroll })           fill the feedback box, focus the first button
//   const off = KFG.keys({ ctrl, active, onEscape, onKey, ignoreMods, nativeButtons })   the one document keydown listener
//   KFG.confirm(dialog, { onYes, onNo, focus })                         ask in an existing <dialog>, Esc = no
//   KFG.say(text, lang, { rate })  KFG.canSay(lang, text?)  KFG.hush()  KFG.speaking()  KFG.preload(text, lang)
//        speech: a pre-recorded clip from shared/audio.js (window.KF_AUDIO, load it before this file) when `text` has one,
//        else a local voice (rate applies to it only); silent (false) without either
// @ts-check
'use strict';

(() => {
  /** @param {string} id */
  const $ = (id) => document.getElementById(id);

  /** @returns {boolean} true when the user asks for less motion */
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Builds an element. Props: class, text, html, on<event> handlers, anything else is an attribute (true → empty attribute).
   * Kids may be nested arrays; null, undefined and false are dropped.
   * @template {keyof HTMLElementTagNameMap} K
   * @param {K} tag
   * @param {Record<string, any>} [props]
   * @param {...KFGKid} kids
   * @returns {HTMLElementTagNameMap[K]}
   */
  const h = (tag, props = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(.../** @type {any[]} */ (kids).flat(Number.POSITIVE_INFINITY).filter((x) => x !== null && x !== undefined && x !== false));
    return el;
  };

  /**
   * Fisher-Yates copy.
   * @template T
   * @param {readonly T[]} arr
   * @returns {T[]}
   */
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /**
   * @template T
   * @param {readonly T[]} arr
   * @returns {T}
   */
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /**
   * Replays a CSS animation class: remove, force reflow, add.
   * @param {Element} el
   * @param {string} cls
   */
  const restart = (el, cls) => {
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
  };

  /**
   * Wrong-answer shake of every given element (missing ones are skipped); nothing with reduced motion.
   * @param {...(Element | null | undefined)} els
   */
  const shake = (...els) => {
    if (reduced()) return;
    for (const el of els) if (el) restart(el, 'shake');
  };

  /**
   * Screen switcher: show(id) un-hides that screen, hides the others and scrolls to the top.
   * scroll: 'auto' (instant, default), 'smooth' (instant when reduced motion) or false (stay).
   * idOf maps a screen name to its element id (default: the name itself); onShow(name) runs after the switch.
   * @param {string[]} ids
   * @param {{ scroll?: 'auto' | 'smooth' | false, idOf?: (name: string) => string, onShow?: (name: string) => void }} [opts]
   * @returns {(id: string) => void}
   */
  const screens = (ids, { scroll = 'auto', idOf = (s) => s, onShow } = {}) => {
    return (id) => {
      for (const s of ids) {
        const el = $(idOf(s));
        if (el) el.hidden = s !== id;
      }
      if (scroll) window.scrollTo({ top: 0, behavior: scroll === 'smooth' && !reduced() ? 'smooth' : 'auto' });
      onShow?.(id);
    };
  };

  /**
   * Progress dots, one per task: ok / miss when answered, "now" for the current index.
   * results[i] is true / false / undefined (holes are fine); total defaults to results.length.
   * kind(result) maps other result values to 'ok' | 'miss'; attrs(i, result) adds attributes (title, aria-label).
   * @param {Element} container
   * @param {ReadonlyArray<any>} results
   * @param {number} index current task index
   * @param {KFGDotsOptions} [opts]
   */
  const dots = (container, results, index, opts = {}) => {
    const {
      total = results.length,
      base = 'dot',
      cls = {},
      kind = (r) => (r === true ? 'ok' : r === false ? 'miss' : undefined),
      attrs,
    } = opts;
    const names = { ok: 'ok', miss: 'miss', now: 'now', ...cls };
    container.replaceChildren(
      ...Array.from({ length: total }, (_, i) => {
        const k = kind(results[i]);
        const state = k === 'ok' ? names.ok : k === 'miss' ? names.miss : i === index ? names.now : '';
        return h('span', { class: state ? `${base} ${state}` : base, ...attrs?.(i, results[i]) });
      }),
    );
  };

  /**
   * Fills the feedback box and moves the player to it: replaceChildren(content, ...buttons), focus the first button
   * (also one nested inside a wrapper), scroll the box into view. A trailing plain-object argument sets options:
   * focus (default true), scroll: true (default; smooth unless reduced motion) | 'animated' (only when motion is allowed) | false.
   * Falsy buttons are dropped.
   * @param {Element} container
   * @param {Node} content
   * @param {...(KFGFeedbackItem)} buttons
   */
  const feedback = (container, content, ...buttons) => {
    /** @type {{ focus?: boolean, scroll?: boolean | 'animated' }} */
    let opts = {};
    const last = buttons[buttons.length - 1];
    if (last && !(last instanceof Node)) opts = /** @type {any} */ (buttons.pop());
    const nodes = /** @type {Node[]} */ (buttons.filter((b) => b instanceof Node));
    container.replaceChildren(content, ...nodes);
    const { focus = true, scroll = true } = opts;
    if (focus) {
      for (const n of nodes) {
        const btn = n instanceof Element ? (n.matches('button') ? n : n.querySelector('button')) : null;
        if (btn instanceof HTMLElement) {
          btn.focus({ preventScroll: true });
          break;
        }
      }
    }
    if (scroll === 'animated') {
      if (!reduced()) container.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (scroll) {
      container.scrollIntoView(reduced() ? { block: 'nearest' } : { block: 'nearest', behavior: 'smooth' });
    }
  };

  const NATIVE_BUTTONS = 'button,[role=button],a';

  /**
   * One document keydown listener for a game. Order of checks:
   * 1. skipped while a <dialog open> exists (it handles Esc itself) and for keys with an ignored modifier;
   * 2. Escape → onEscape(e) only; a truthy result calls preventDefault;
   * 3. onKey(e) — game-wide keys, not gated by active(); truthy → handled (preventDefault);
   * 4. Enter/Space (without Ctrl/Meta) on a focused nativeButtons element keeps its own click;
   * 5. if active() (default true) and ctrl() returns { onKey }, onKey(e) truthy → preventDefault.
   * ignoreMods: modifiers that make the key skipped (default all of 'alt', 'ctrl', 'meta').
   * nativeButtons: selector for step 4 (default 'button,[role=button],a'), false to switch it off.
   * @param {KFGKeysOptions} opts
   * @returns {() => void} unsubscribe
   */
  const keys = ({ ctrl, active = () => true, onEscape, onKey, ignoreMods = ['alt', 'ctrl', 'meta'], nativeButtons = NATIVE_BUTTONS }) => {
    /** @param {KeyboardEvent} e */
    const listener = (e) => {
      if (document.querySelector('dialog[open]')) return;
      if (
        (e.altKey && ignoreMods.includes('alt')) ||
        (e.ctrlKey && ignoreMods.includes('ctrl')) ||
        (e.metaKey && ignoreMods.includes('meta'))
      )
        return;
      if (e.key === 'Escape') {
        if (onEscape?.(e)) e.preventDefault();
        return;
      }
      if (onKey?.(e)) {
        e.preventDefault();
        return;
      }
      // Enter/Space on a focused control keeps its own action (Tab users).
      const t = e.target instanceof Element ? e.target : null;
      if (nativeButtons && (e.key === 'Enter' || e.key === ' ') && !e.ctrlKey && !e.metaKey && t?.closest(nativeButtons)) return;
      if (!active()) return;
      const c = ctrl?.();
      if (c?.onKey(e)) e.preventDefault();
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  };

  /** @type {WeakMap<HTMLDialogElement, { onYes?: () => void, onNo?: () => void, answered: boolean }>} */
  const asking = new WeakMap();

  /**
   * Asks in an existing <dialog>: showModal, focus the "no" button (focus: 'yes' | 'no' | 'none').
   * Buttons are [data-yes] / [data-no], else the first / second button. Wired once per dialog; later calls only swap callbacks.
   * The dialog closes first, then onYes / onNo runs; any other close (Esc) counts as no.
   * @param {HTMLDialogElement} dialog
   * @param {{ onYes?: () => void, onNo?: () => void, focus?: 'yes' | 'no' | 'none' }} [opts]
   */
  const confirm = (dialog, { onYes, onNo, focus = 'no' } = {}) => {
    const btns = dialog.querySelectorAll('button');
    const yes = dialog.querySelector('[data-yes]') || btns[0];
    const no = dialog.querySelector('[data-no]') || btns[1];
    let st = asking.get(dialog);
    if (!st) {
      /** @type {{ onYes?: () => void, onNo?: () => void, answered: boolean }} */
      const s = { onYes, onNo, answered: false };
      st = s;
      asking.set(dialog, s);
      /** @param {'onYes' | 'onNo'} which */
      const answer = (which) => () => {
        s.answered = true;
        dialog.close();
        s[which]?.();
      };
      yes?.addEventListener('click', answer('onYes'));
      no?.addEventListener('click', answer('onNo'));
      // Closed by the browser (Esc), not by our buttons.
      dialog.addEventListener('close', () => {
        const byButton = s.answered;
        s.answered = false;
        if (!byButton) s.onNo?.();
      });
    }
    st.onYes = onYes;
    st.onNo = onNo;
    dialog.showModal();
    const target = focus === 'yes' ? yes : focus === 'no' ? no : null;
    if (target instanceof HTMLElement) target.focus();
  };

  // Speech. First choice: a pre-recorded clip (audio/<lang>/<slug>.mp3, listed in window.KF_AUDIO by shared/audio.js), played
  // through the Web Audio API (it works on iPad Safari once a gesture has unlocked the context). Fallback: Web Speech API,
  // a voice of the language, local (works offline) first: 'es' → es-ES before other Spanish, 'en' → en-GB, en-US, any English.
  // No clip and no voice = silent, so the text on screen must always be enough.
  // The voice list loads asynchronously: canSay() may be false right after page load ('voiceschanged' on speechSynthesis).
  const SCRIPT_SRC = document.currentScript instanceof HTMLScriptElement ? document.currentScript.src : '';
  const CLIP_BASE = SCRIPT_SRC ? new URL('../audio/', SCRIPT_SRC).href : '';

  /** Same rule as slug() in scripts/build-audio.mjs; surrounding punctuation ('¡Hola!') drops out with it.
   * @param {string} text */
  const slug = (text) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  /** @param {string} text @param {string} lang @returns {string | null} url of the clip, null without one */
  const clipUrl = (text, lang) => {
    const s = slug(text);
    return CLIP_BASE && s && window.KF_AUDIO?.[lang]?.includes(s) ? `${CLIP_BASE}${lang}/${s}.mp3` : null;
  };

  /** @type {AudioContext | null} */
  let actx = null;
  const audioCtx = () => {
    if (!actx) {
      const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (Ctor) actx = new Ctor();
    }
    return actx;
  };
  // The first gesture unlocks the context (iOS/Safari and autoplay policies); only on pages that have clips at all.
  const unlock = () => {
    if (!window.KF_AUDIO) return;
    // iOS 17+: play even with the silent switch on (Web Audio is 'ambient' there by default, like a ringtone)
    const session = /** @type {any} */ (navigator).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
    const c = audioCtx();
    if (c && c.state !== 'running') c.resume().catch(() => {});
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) document.addEventListener(ev, unlock, { capture: true, passive: true });

  /** @type {Map<string, Promise<AudioBuffer | null>>} */
  const buffers = new Map();
  /** Fetched and decoded once per url; a failure resolves null and is not cached, so a later call tries again.
   * @param {string} url @returns {Promise<AudioBuffer | null>} */
  const load = (url) => {
    let p = buffers.get(url);
    if (!p) {
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        // callback form: older Safari has no promise-returning decodeAudioData
        .then((data) => new Promise((ok, fail) => audioCtx()?.decodeAudioData(data, ok, fail) ?? fail(new Error('no audio'))))
        .catch(() => {
          buffers.delete(url);
          return null;
        });
      buffers.set(url, /** @type {Promise<AudioBuffer | null>} */ (p));
    }
    return /** @type {Promise<AudioBuffer | null>} */ (p);
  };

  /** Warms up: fetches and decodes the clip for `text`, if there is one.
   * @param {string} text @param {string} lang */
  const preload = (text, lang) => {
    const url = clipUrl(text, lang);
    if (url) void load(url);
  };

  /** @type {Record<string, string[]>} */
  const VOICE_PREF = { es: ['es-es', 'es'], en: ['en-gb', 'en-us', 'en'], uk: ['uk'] };
  /** @param {string} lang @returns {SpeechSynthesisVoice | null} */
  const voiceFor = (lang) => {
    const voices = window.speechSynthesis?.getVoices() || [];
    for (const pref of VOICE_PREF[lang] || [lang.toLowerCase()]) {
      const match = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(pref));
      const voice = match.find((v) => v.localService) || match[0];
      if (voice) return voice;
    }
    return null;
  };
  window.speechSynthesis?.getVoices(); // starts loading the list

  /** @param {string} text @param {string} lang @param {number} rate @returns {boolean} spoken */
  const speak = (text, lang, rate) => {
    const voice = voiceFor(lang);
    if (!voice) return false;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    speechSynthesis.speak(u);
    return true;
  };

  let seq = 0; // numbers the clip requests: a later say() or hush() makes an earlier, still loading one stale
  let activeId = 0; // the clip request that is loading or playing, 0 = none
  /** @type {AudioBufferSourceNode | null} */
  let source = null;

  const hush = () => {
    activeId = 0;
    const s = source;
    source = null;
    if (s) {
      s.onended = null;
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    window.speechSynthesis?.cancel();
  };

  /** Speaks `text`: the clip if there is one (true at once, the device voice takes over if the clip cannot be loaded),
   * else the device voice (false without one). opts.rate applies to the device voice only.
   * @param {string} text @param {string} lang @param {{ rate?: number }} [opts] @returns {boolean} will be spoken */
  const say = (text, lang, { rate = 0.95 } = {}) => {
    const url = clipUrl(text, lang);
    if (!url) return speak(text, lang, rate);
    hush();
    const id = ++seq;
    activeId = id;
    void load(url).then((buf) => {
      if (activeId !== id) return; // stopped or replaced meanwhile
      const c = audioCtx();
      if (!buf || !c) {
        activeId = 0;
        speak(text, lang, rate);
        return;
      }
      if (c.state === 'suspended') c.resume().catch(() => {});
      const s = c.createBufferSource();
      s.buffer = buf;
      s.connect(c.destination);
      s.onended = () => {
        if (source === s) {
          source = null;
          activeId = 0;
        }
      };
      source = s;
      s.start();
    });
    return true;
  };
  /** @param {string} lang @param {string} [text] a clip for `text` or a device voice for `lang` */
  const canSay = (lang, text) => (text !== undefined && clipUrl(text, lang) !== null) || voiceFor(lang) !== null;
  /** A clip is loading or playing, or the device voice is speaking. */
  const speaking = () => activeId !== 0 || Boolean(window.speechSynthesis?.speaking);

  /** @type {KFGAPI} */
  const api = {
    $,
    h,
    shuffle,
    pick,
    reduced,
    restart,
    shake,
    screens,
    dots,
    feedback,
    keys,
    confirm,
    say,
    canSay,
    hush,
    preload,
    speaking,
  };
  window.KFG = api;
})();
