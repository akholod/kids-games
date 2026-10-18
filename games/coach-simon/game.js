'use strict';
(() => {
  const slug = 'coach-simon';
  const { $, h } = KFG;
  const { ZONES, LEVELS, LANGS, ROUND } = SimonEngine;
  const ES = KF.lang === 'es';
  const T = KF.i18n({
    uk: {
      title: 'Тренер-Саймон — Keeper Fun Games',
      coins: 'Монети',
      back: '← До каталогу',
      eyebrow: 'Тренування воротаря',
      h1: 'Тренер-Саймон',
      lead: 'Ти — воротар, у воротах світяться вогники, а тренер свистить. Ліво й право — як у тебе.',
      'mode.aria': 'Режим гри',
      'mode.memory': 'Запам’ятай',
      'mode.memory.sub': 'Повтори вогники',
      'mode.commands': 'Тренер кричить',
      'mode.commands.sub': 'Лови м’яч за командою',
      level: 'Рівень',
      'lvl.rookie': 'Новачок',
      'lvl.academy': 'Академія',
      'lvl.pro': 'Профі',
      'hint.memory.rookie': '4 вогники в кутах, повільно.',
      'hint.memory.academy': 'Усі 9 вогників.',
      'hint.memory.pro': 'Усі 9 вогників, починаємо з трьох — і швидше!',
      'hint.commands.rookie': 'Кути й центр. Часу багато.',
      'hint.commands.academy': 'Усі 9 зон. М’яч летить швидше.',
      'hint.commands.pro': 'Хитрий тренер! Рухайся, лише коли чуєш «Simón dice» або «Simon says».',
      lang: 'Мова команд',
      start: 'На тренування →',
      'kbd.intro': 'Клавіші: 1–9 — зони воріт · Enter — почати · Esc — назад',
      'kbd.play': '1–9 або натисни вогник · Esc — вийти',
      'sound.aria': 'Без звуку',
      'sound.on': '🔊 Звук',
      'sound.off': '🔇 Тихо',
      'goal.aria': 'Ворота: 9 вогників',
      'dots.aria': 'Результати',
      'dot.ok': 'є',
      'dot.miss': 'мимо',
      'dot.next': 'попереду',
      'round.memory': ({ n, max }) => `Серія ${n} / ${max}`,
      'round.commands': ({ n, max }) => `Удар ${n} / ${max}`,
      'mem.watch': 'Дивись! 👀',
      'mem.go': 'Твоя черга! 🧤',
      'mem.done': 'Супер! Ще один вогник ✨',
      'mem.miss': 'Майже! Ось правильний вогник. Ще раз ту саму серію!',
      'mem.missEnd': 'Майже! Ось правильний вогник.',
      'mem.won': 'Усі 10! Неймовірно! 🏆',
      'cmd.ready': 'Увага…',
      'v.save': '¡Parada! Зловив! 🧤',
      'v.goal': 'Майже! М’яч полетів сюди ⚽',
      'v.late': 'Не встиг — наступний твій!',
      'v.held': 'Не повівся! 🧠',
      'v.fooled': 'Ой, тренер тебе підловив! 😄',
      'v.held.sub': ({ says }) => `Тренер не сказав «${says}» — і ти стояв. Молодець!`,
      'v.fooled.sub': ({ says }) => `Тренер не сказав «${says}» — треба було стояти.`,
      next: 'Наступний удар →',
      result: 'Результат →',
      voice: 'Голос недоступний — читай команду на екрані',
      'fin.title': 'Тренування завершено!',
      'fin.perfect': 'Ідеально! 🏆',
      'fin.mem.top': 'Усі 10 вогників! Пам’ять як у справжнього воротаря!',
      'fin.cmd.top': 'Усі 10 зловив! Ти — стіна!',
      'fin.good': 'Класне тренування! Спробуєш ще?',
      'fin.ok': 'Гарне тренування! Ще раз — і буде більше.',
      'fin.earned': ({ n }) => `Зароблено ${n} 🪙.`,
      'fin.bonus': ({ n }) => `Бонус за ідеальний раунд: +${n} 🪙!`,
      'fin.best': ({ n, max }) => `Твій рекорд: ${n} / ${max}.`,
      'fin.record': '🏅 Новий рекорд!',
      again: 'Ще раз ↻',
      change: 'Змінити режим',
      catalog: 'До каталогу',
    },
    es: {
      title: 'Simón dice — Keeper Fun Games',
      coins: 'Monedas',
      back: '← Al catálogo',
      eyebrow: 'Entreno de portero',
      h1: 'Simón dice',
      lead: 'Tú eres el portero: en la portería se encienden luces y el entrenador pita. Izquierda y derecha son las tuyas.',
      'mode.aria': 'Modo de juego',
      'mode.memory': 'Memoria',
      'mode.memory.sub': 'Repite las luces',
      'mode.commands': 'El entrenador grita',
      'mode.commands.sub': 'Para donde te diga',
      level: 'Nivel',
      'lvl.rookie': 'Novato',
      'lvl.academy': 'Academia',
      'lvl.pro': 'Pro',
      'hint.memory.rookie': '4 luces en las esquinas, despacio.',
      'hint.memory.academy': 'Las 9 luces.',
      'hint.memory.pro': 'Las 9 luces, empiezas con tres ¡y más rápido!',
      'hint.commands.rookie': 'Esquinas y centro. Tienes mucho tiempo.',
      'hint.commands.academy': 'Las 9 zonas. El balón va más rápido.',
      'hint.commands.pro': '¡Entrenador tramposo! Muévete solo si oyes «Simón dice» o «Simon says».',
      lang: 'Idioma de las órdenes',
      start: '¡A entrenar! →',
      'kbd.intro': 'Teclas: 1–9 zonas · Enter empezar · Esc volver',
      'kbd.play': '1–9 o toca una luz · Esc salir',
      'sound.aria': 'Sin sonido',
      'sound.on': '🔊 Sonido',
      'sound.off': '🔇 Silencio',
      'goal.aria': 'Portería: 9 luces',
      'dots.aria': 'Resultados',
      'dot.ok': 'bien',
      'dot.miss': 'fallo',
      'dot.next': 'pendiente',
      'round.memory': ({ n, max }) => `Serie ${n} / ${max}`,
      'round.commands': ({ n, max }) => `Tiro ${n} / ${max}`,
      'mem.watch': '¡Mira! 👀',
      'mem.go': '¡Tu turno! 🧤',
      'mem.done': '¡Genial! Una luz más ✨',
      'mem.miss': '¡Casi! Esta era la luz. ¡Otra vez la misma serie!',
      'mem.missEnd': '¡Casi! Esta era la luz.',
      'mem.won': '¡Las 10! ¡Increíble! 🏆',
      'cmd.ready': 'Atención…',
      'v.save': '¡Parada! 🧤',
      'v.goal': '¡Casi! El balón fue aquí ⚽',
      'v.late': '¡Uy, tarde! El próximo es tuyo.',
      'v.held': '¡No has picado! 🧠',
      'v.fooled': '¡Te ha pillado! 😄',
      'v.held.sub': ({ says }) => `No dijo «${says}» y te quedaste quieto. ¡Muy bien!`,
      'v.fooled.sub': ({ says }) => `No dijo «${says}»: había que quedarse quieto.`,
      next: 'Siguiente tiro →',
      result: 'Resultado →',
      voice: 'No hay voz: lee la orden en la pantalla',
      'fin.title': '¡Entreno terminado!',
      'fin.perfect': '¡Perfecto! 🏆',
      'fin.mem.top': '¡Las 10 luces! ¡Memoria de portero de verdad!',
      'fin.cmd.top': '¡Paraste los 10! ¡Eres un muro!',
      'fin.good': '¡Buen entreno! ¿Otra vez?',
      'fin.ok': '¡Buen entreno! Otra vez y saldrá mejor.',
      'fin.earned': ({ n }) => `Has ganado ${n} 🪙.`,
      'fin.bonus': ({ n }) => `Premio por ronda perfecta: +${n} 🪙.`,
      'fin.best': ({ n, max }) => `Tu récord: ${n} / ${max}.`,
      'fin.record': '🏅 ¡Nuevo récord!',
      again: 'Otra vez ↻',
      change: 'Cambiar modo',
      catalog: 'Al catálogo',
    },
  });
  document.title = T('title');
  T.apply();

  /** @typedef {'memory' | 'commands'} CSMode */
  /** @typedef {'intro' | 'play' | 'finish'} CSScreen */
  /** @typedef {'idle' | 'show' | 'input' | 'feedback' | 'done'} CSPhase */
  /** @typedef {{ mode: CSMode, level: SimonLevelId, lang: SimonLang, sound: boolean, perfect: Record<string, boolean>, best: Record<string, number> }} CSData */

  /** @type {CSMode[]} */
  const MODES = ['memory', 'commands'];
  /** @type {SimonLevelId[]} */
  const LEVEL_IDS = ['rookie', 'academy', 'pro'];
  // One colour and one note per light (C-major pentatonic, the bottom row lowest), so a sequence is easy to see and hear.
  const HUES = ['#ff6b7d', '#ffb02e', '#ffe14d', '#4dd4ff', '#c9f269', '#b38cff', '#ff7ac8', '#3ee8b5', '#6b95ff'];
  const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
  const noteOf = (/** @type {number} */ z) => NOTES[(2 - Math.floor(z / 3)) * 3 + (z % 3)];

  /** @type {any} */
  const saved = KF.gameData(slug);
  /** @type {CSData} */
  const data = {
    mode: MODES.includes(saved.mode) ? saved.mode : 'memory',
    level: LEVEL_IDS.includes(saved.level) ? saved.level : 'rookie',
    lang: LANGS.includes(saved.lang) ? saved.lang : ES ? 'en' : 'mix',
    sound: saved.sound !== false,
    perfect: { ...saved.perfect },
    best: { ...saved.best },
  };
  const store = () => KF.gameData(slug, data);

  /** @type {CSScreen} */
  let screen = 'intro';
  /** @type {CSPhase} */
  let phase = 'idle';
  /** @type {CSMode} */
  let mode = data.mode;
  /** @type {SimonLevelId} */
  let level = data.level;
  /** @type {SimonLang} */
  let lang = data.lang;
  /** @type {number[]} */
  let seq = [];
  let pos = 0,
    misses = 0,
    score = 0,
    index = 0,
    startCoins = 0,
    timeScale = 1,
    voiceNoted = false;
  /** @type {SimonCommand[]} */
  let cmds = [];
  /** @type {SimonCommand | null} */
  let cmd = null;
  /** @type {SimonVerdict[]} */
  let results = [];
  /** @type {ReturnType<typeof setTimeout>[]} */
  let timers = [];
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let pipTimer;

  const show = KFG.screens(['intro', 'play', 'finish'], { scroll: false, onShow: (name) => (screen = /** @type {CSScreen} */ (name)) });
  /** @param {number} n */
  const ms = (n) => Math.max(0, Math.round(n * timeScale));
  /** @param {number} delay @param {() => void} fn */
  const later = (delay, fn) => timers.push(setTimeout(fn, ms(delay)));
  const clearTimers = () => {
    for (const t of timers) clearTimeout(t);
    timers = [];
    clearInterval(pipTimer);
  };
  /** @param {Event} e @param {string} selector */
  const hit = (e, selector) => /** @type {HTMLElement | null} */ (e.target instanceof Element ? e.target.closest(selector) : null);
  /** @param {string} s */
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  // ---------- the coach ----------

  const COACH = `<svg viewBox="0 0 120 138" xmlns="http://www.w3.org/2000/svg"><path d="M14 138 Q16 100 60 95 Q104 100 106 138Z" fill="#1f6b48"/><path d="M44 97 60 120 76 97" fill="#f6f3e7"/><path d="M60 120 60 138" stroke="#0e3a28" stroke-width="3"/><path d="M24 116 34 138 M96 116 86 138" stroke="#c9f269" stroke-width="5"/><rect x="51" y="78" width="18" height="20" rx="7" fill="#c98f68"/><ellipse cx="34" cy="58" rx="5" ry="7" fill="#d9a07a"/><ellipse cx="86" cy="58" rx="5" ry="7" fill="#d9a07a"/><ellipse cx="60" cy="56" rx="26" ry="28" fill="#e2ac85"/><path d="M32 49 Q33 22 60 21 Q87 22 88 49Z" fill="#174d37"/><path d="M58 45 Q94 41 104 50 Q90 56 58 51Z" fill="#c9f269"/><circle cx="60" cy="24" r="3" fill="#c9f269"/><path d="M45 57 Q50 53 55 57 M65 57 Q70 53 75 57" fill="none" stroke="#3a2a24" stroke-width="2.5" stroke-linecap="round"/><circle cx="50" cy="62" r="3" fill="#1d2b26"/><circle cx="70" cy="62" r="3" fill="#1d2b26"/><path d="M50 71 Q60 82 70 71Z" fill="#7a3b2e"/><path d="M45 94 Q60 116 75 94" fill="none" stroke="#ffc448" stroke-width="2.5"/><g transform="rotate(-12 66 109)"><rect x="57" y="103" width="20" height="11" rx="5.5" fill="#dfe5e7" stroke="#53636a" stroke-width="1.6"/><rect x="73" y="101" width="8" height="6" rx="2" fill="#dfe5e7" stroke="#53636a" stroke-width="1.6"/><circle cx="63" cy="108.5" r="2.2" fill="#53636a"/></g></svg>`;
  for (const el of document.querySelectorAll('.coach-figure')) el.innerHTML = COACH;

  // ---------- sound (WebAudio tones; the context is made on the first start / tap, silent without WebAudio) ----------

  /** @type {AudioContext | null} */
  let ac = null;
  const unlockAudio = () => {
    if (!data.sound) return;
    try {
      if (!ac) {
        const Ctx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        if (!Ctx) return;
        ac = new Ctx();
      }
      if (ac.state === 'suspended') ac.resume().catch(() => {});
    } catch {
      ac = null;
    }
  };
  /** @param {number} freq @param {number} dur seconds @param {{ type?: OscillatorType, vol?: number, at?: number, to?: number, wobble?: number }} [o] */
  const tone = (freq, dur, { type = 'triangle', vol = 0.2, at = 0, to, wobble } = {}) => {
    if (!data.sound || !ac) return;
    try {
      const t = ac.currentTime + at;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
      if (wobble) {
        const lfo = ac.createOscillator();
        const depth = ac.createGain();
        lfo.frequency.value = 28;
        depth.gain.value = wobble;
        lfo.connect(depth).connect(osc.frequency);
        lfo.start(t);
        lfo.stop(t + dur + 0.05);
      }
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch {
      // no sound is fine
    }
  };
  const sfx = {
    /** @param {number} z */
    zone: (z) => tone(noteOf(z), 0.32),
    whistle: () => {
      tone(2350, 0.16, { type: 'sine', vol: 0.09, wobble: 90 });
      tone(2350, 0.28, { type: 'sine', vol: 0.09, wobble: 90, at: 0.2 });
    },
    yes: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.18, { at: i * 0.07, vol: 0.16 })),
    soft: () => tone(392, 0.36, { type: 'sine', to: 262, vol: 0.14 }),
    thump: () => tone(140, 0.18, { type: 'sine', to: 60, vol: 0.3 }),
  };

  // ---------- the goal ----------

  const zoneName = (/** @type {number} */ z) => (ES ? ZONES[z].es : ZONES[z].uk);
  $('goal').replaceChildren(
    ...ZONES.map((_, z) =>
      h(
        'button',
        { type: 'button', class: 'zone', 'data-zone': String(z), style: `--hue:${HUES[z]}`, 'aria-label': `${zoneName(z)} (${z + 1})` },
        h('span', { class: 'pod', 'aria-hidden': 'true' }),
        h('kbd', { 'aria-hidden': 'true', text: String(z + 1) }),
      ),
    ),
  );
  const zoneEls = /** @type {HTMLButtonElement[]} */ ([...$('goal').querySelectorAll('.zone')]);
  // Zones the level does not use this round stay off: disabled (no tap, no digit key, no Tab stop) and dimmed.
  /** @type {Set<number>} */
  let used = new Set(ZONES.map((_, z) => z));
  /** @param {boolean} on */
  const setZones = (on) => {
    for (const [z, b] of zoneEls.entries()) b.disabled = !on || !used.has(z);
  };
  const markUsed = () => {
    used = new Set(LEVELS[level][mode].zones);
    for (const [z, b] of zoneEls.entries()) b.classList.toggle('off', !used.has(z));
  };
  const clearMarks = () => {
    for (const b of zoneEls) {
      b.classList.remove('lit', 'hint', 'faded');
      b.removeAttribute('data-icon');
    }
  };
  /** @type {Map<number, ReturnType<typeof setTimeout>>} */
  const lightOff = new Map();
  /** @param {number} z @param {number} dur real ms (already scaled) */
  const light = (z, dur) => {
    clearTimeout(lightOff.get(z));
    zoneEls[z].classList.add('lit');
    lightOff.set(
      z,
      setTimeout(() => zoneEls[z].classList.remove('lit'), dur),
    );
  };
  /** @param {number} z @param {string} icon @param {boolean} [faded] */
  const mark = (z, icon, faded = false) => {
    zoneEls[z].dataset.icon = icon;
    zoneEls[z].classList.toggle('faded', faded);
  };

  // ---------- bubble, progress ----------

  /** @param {string} text @param {{ wait?: boolean, lang?: string }} [o] */
  const say = (text, { wait = false, lang: l } = {}) => {
    $('say').textContent = text;
    $('say').classList.toggle('long', text.length > 30);
    if (l) $('say').setAttribute('lang', l);
    else $('say').removeAttribute('lang');
    $('bubble').classList.toggle('wait', wait);
  };
  /** @param {number} total @param {number} on */
  const drawSteps = (total, on) =>
    $('steps').replaceChildren(...Array.from({ length: total }, (_, i) => h('i', { class: i < on ? 'on' : null })));
  function drawBar() {
    if (mode === 'memory') {
      const start = LEVELS[level].memory.start;
      $('round-label').textContent = T('round.memory', { n: seq.length, max: ROUND });
      // Lengths below the level's start count as done; the current length is "now".
      const done = Array.from({ length: Math.max(score, start - 1) }, () => true);
      KFG.dots($('dots'), done, seq.length - 1, {
        total: ROUND,
        base: 'cs-dot',
        cls: { ok: 'cs-ok', miss: 'cs-miss', now: 'cs-now' },
        attrs: (i) => ({ 'aria-label': `${i + 1}: ${T(i < done.length ? 'dot.ok' : 'dot.next')}` }),
      });
    } else {
      $('round-label').textContent = T('round.commands', { n: Math.min(index + 1, ROUND), max: ROUND });
      KFG.dots($('dots'), results, index, {
        total: ROUND,
        base: 'cs-dot',
        cls: { ok: 'cs-ok', miss: 'cs-miss', now: 'cs-now' },
        kind: (v) => (v ? (SimonEngine.isRight(v) ? 'ok' : 'miss') : undefined),
        attrs: (i, v) => ({ 'aria-label': `${i + 1}: ${T(v ? (SimonEngine.isRight(v) ? 'dot.ok' : 'dot.miss') : 'dot.next')}` }),
      });
    }
    $('dots').setAttribute('aria-label', T('dots.aria'));
  }

  // ---------- intro ----------

  function renderIntro() {
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-mode]')))
      b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-level]')))
      b.setAttribute('aria-pressed', String(b.dataset.level === level));
    for (const b of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-lang]')))
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    $('lang-group').hidden = mode !== 'commands';
    $('level-hint').textContent = T(`hint.${mode}.${level}`);
  }
  function renderSound() {
    $('mute').textContent = T(data.sound ? 'sound.on' : 'sound.off');
    $('mute').setAttribute('aria-pressed', String(!data.sound));
  }
  /** @param {HTMLElement} b */
  function choose(b) {
    if (b.dataset.mode) mode = /** @type {CSMode} */ (b.dataset.mode);
    if (b.dataset.level) level = /** @type {SimonLevelId} */ (b.dataset.level);
    if (b.dataset.lang) lang = /** @type {SimonLang} */ (b.dataset.lang);
    data.mode = mode;
    data.level = level;
    data.lang = lang;
    store();
    renderIntro();
  }
  $('intro').addEventListener('click', (e) => {
    const b = hit(e, '[data-mode],[data-level],[data-lang]');
    if (b) choose(b);
  });
  $('mute').addEventListener('click', () => {
    data.sound = !data.sound;
    store();
    if (data.sound) unlockAudio();
    else KFG.hush();
    renderSound();
  });

  // ---------- memory ----------

  function playSequence() {
    clearTimers();
    clearMarks();
    phase = 'show';
    pos = 0;
    setZones(false);
    say(T('mem.watch'), { wait: true });
    drawSteps(seq.length, 0);
    drawBar();
    const { on, gap } = SimonEngine.memoryTiming(level, seq.length);
    let t = 650;
    seq.forEach((z, i) => {
      later(t, () => {
        light(z, ms(on));
        sfx.zone(z);
        drawSteps(seq.length, i + 1);
      });
      t += on + gap;
    });
    later(t, () => {
      phase = 'input';
      setZones(true);
      say(T('mem.go'));
      drawSteps(seq.length, 0);
    });
  }
  /** @param {number} z */
  function tapMemory(z) {
    light(z, 240);
    sfx.zone(z);
    const r = SimonEngine.check(seq, pos, z);
    if (r === 'next') {
      pos++;
      drawSteps(seq.length, pos);
      return;
    }
    phase = 'feedback';
    setZones(false);
    if (r === 'done') {
      pos++;
      drawSteps(seq.length, pos);
      score = seq.length;
      misses = 0;
      KF.answer(slug, true, { coin: LEVELS[level].coin });
      drawBar();
      later(260, sfx.yes);
      if (seq.length >= ROUND) {
        say(T('mem.won'));
        later(1300, finish);
        return;
      }
      say(T('mem.done'));
      later(1000, () => {
        seq = SimonEngine.extend(seq, level);
        playSequence();
      });
      return;
    }
    // miss: no punishment — show the right light, then the same sequence once more (a second miss ends the round)
    KF.answer(slug, false);
    misses++;
    const right = seq[pos];
    later(260, () => {
      sfx.soft();
      zoneEls[right].classList.add('lit', 'hint');
    });
    if (misses >= 2) {
      say(T('mem.missEnd'));
      later(2100, finish);
    } else {
      say(T('mem.miss'));
      later(2100, playSequence);
    }
  }

  // ---------- commands ----------

  function nextShot() {
    clearTimers();
    clearMarks();
    $('feedback').replaceChildren();
    cmd = cmds[index];
    if (index > 0) $('voice-note').hidden = true;
    phase = 'show';
    setZones(false);
    drawBar();
    say(T('cmd.ready'), { wait: true });
    resetLane();
    sfx.whistle();
    later(700, launch);
  }
  function launch() {
    phase = 'input';
    setZones(true);
    const text = SimonEngine.spoken(cmd);
    say(text, { lang: cmd.lang });
    if (data.sound) KFG.say(text, cmd.lang);
    const ballMs = ms(LEVELS[level].commands.ballMs);
    runLane(ballMs);
    timers.push(setTimeout(() => resolveShot(null), ballMs));
  }
  function resetLane() {
    const lane = $('lane');
    lane.hidden = false;
    lane.classList.remove('go');
    lane.classList.toggle('static', KFG.reduced());
    $('pips').replaceChildren(...Array.from({ length: 5 }, () => h('i')));
  }
  /** @param {number} dur */
  function runLane(dur) {
    const lane = $('lane');
    if (KFG.reduced()) {
      // Reduced motion: five pips switch off one by one, nothing moves.
      const pips = [...$('pips').children];
      let left = pips.length;
      pipTimer = setInterval(() => {
        left--;
        pips[left]?.classList.add('off');
        if (left <= 0) clearInterval(pipTimer);
      }, dur / pips.length);
      return;
    }
    lane.style.setProperty('--ms', `${dur}ms`);
    void lane.getBoundingClientRect();
    lane.classList.add('go');
  }
  /** Freezes the ball where it is (a tap stops the shot). */
  function stopLane() {
    clearInterval(pipTimer);
    for (const el of $('lane').querySelectorAll('.lane-fill,.lane-run,.lane-ball'))
      for (const a of /** @type {HTMLElement} */ (el).getAnimations()) a.pause();
  }
  /** @param {number | null} zone */
  function resolveShot(zone) {
    if (phase !== 'input') return;
    clearTimers();
    stopLane();
    KFG.hush();
    phase = 'feedback';
    setZones(false);
    const v = SimonEngine.judge(cmd, zone);
    const ok = SimonEngine.isRight(v);
    results[index] = v;
    if (ok) score++;
    KF.answer(slug, ok, ok ? { coin: LEVELS[level].coin } : undefined);
    drawBar();
    const right = cmd.zone;
    if (v === 'save') {
      light(right, 900);
      mark(right, '🧤');
      sfx.yes();
    } else if (v === 'goal') {
      zoneEls[right].classList.add('hint');
      mark(right, '⚽');
      if (zone !== null) mark(zone, '🧤', true);
      sfx.thump();
    } else if (v === 'fooled') {
      mark(zone, '🧤', true);
      sfx.soft();
    } else sfx.yes();
    const says = SimonEngine.SAYS[cmd.lang];
    const title = v === 'goal' && zone === null ? T('v.late') : T(`v.${v}`);
    const sub = v === 'held' || v === 'fooled' ? T(`v.${v}.sub`, { says }) : '';
    // The zone in the other language: uk site → Ukrainian; es site → English for a Spanish command, Spanish for an English one.
    const other = ES ? (cmd.lang === 'es' ? 'en' : 'es') : 'uk';
    const content = h(
      'div',
      { class: `fb ${ok ? 'ok' : 'oops'}` },
      h('p', { class: 'fb-title', text: title }),
      sub && h('p', { class: 'fb-sub', text: sub }),
      h(
        'p',
        { class: 'fb-tr' },
        h('b', { lang: cmd.lang, text: cmd.words }),
        ' — ',
        h('span', { lang: other, text: lower(ZONES[right][other]) }),
      ),
    );
    const last = index === ROUND - 1;
    const btn = h('button', {
      type: 'button',
      class: 'btn btn-dark',
      text: T(last ? 'result' : 'next'),
      onclick: () => {
        index++;
        if (index >= ROUND) finish();
        else nextShot();
      },
    });
    KFG.feedback($('feedback'), content, btn, { scroll: true });
  }
  // A note once a session when the coach can't speak the commands (the text on screen is enough to play).
  function voiceCheck() {
    const need = lang === 'mix' ? ['es', 'en'] : [lang];
    const missing = data.sound && mode === 'commands' && need.some((l) => !KFG.canSay(l));
    $('voice-note').hidden = !missing || voiceNoted;
    if (missing) voiceNoted = true;
  }
  // The voice list loads late: hide the note once the voices are there.
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
    if ((lang === 'mix' ? ['es', 'en'] : [lang]).every((l) => KFG.canSay(l))) $('voice-note').hidden = true;
  });

  // ---------- round ----------

  function start() {
    unlockAudio();
    clearTimers();
    KFG.hush();
    score = 0;
    index = 0;
    misses = 0;
    results = [];
    cmd = null;
    startCoins = KF.get().coins;
    $('feedback').replaceChildren();
    $('voice-note').hidden = true;
    $('lane').hidden = true;
    $('steps').replaceChildren();
    clearMarks();
    markUsed();
    setZones(false);
    show('play');
    if (mode === 'memory') {
      seq = SimonEngine.firstSequence(level);
      playSequence();
    } else {
      seq = [];
      cmds = SimonEngine.makeCommands(level, lang);
      voiceCheck();
      nextShot();
    }
  }
  function finish() {
    clearTimers();
    KFG.hush();
    phase = 'done';
    const key = `${mode}:${level}`;
    const bonus = data.perfect[key] ? 0 : LEVELS[level].bonus;
    const res = KF.finishGame(slug, { score, max: ROUND, bonus });
    if (score === ROUND) data.perfect[key] = true;
    const prev = data.best[key] || 0;
    const record = score > prev;
    if (record) data.best[key] = score;
    store();
    show('finish');
    const perfect = score === ROUND;
    $('finish-art').textContent = perfect ? '🏆' : mode === 'memory' ? '🚦' : '🧤';
    $('finish-mode').textContent =
      `${T(`mode.${mode}`)} · ${T(`lvl.${level}`)}${mode === 'commands' ? ` · ${lang === 'mix' ? 'ES + EN' : lang.toUpperCase()}` : ''}`;
    $('finish-title').textContent = T(perfect ? 'fin.perfect' : 'fin.title');
    $('final-score').textContent = `${score} / ${ROUND}`;
    $('record').hidden = !(record && prev > 0);
    const earned = KF.get().coins - startCoins;
    $('final-message').textContent = [
      T(perfect ? `fin.${mode === 'memory' ? 'mem' : 'cmd'}.top` : score >= 6 ? 'fin.good' : 'fin.ok'),
      T('fin.earned', { n: earned }),
      res.bonus ? T('fin.bonus', { n: res.bonus }) : '',
      record && prev > 0 ? '' : T('fin.best', { n: Math.max(prev, score), max: ROUND }),
    ]
      .filter(Boolean)
      .join(' ');
    if (perfect || (record && prev > 0)) KFUI.confetti();
    $('again').focus({ preventScroll: true });
  }
  function toIntro() {
    clearTimers();
    KFG.hush();
    phase = 'idle';
    show('intro');
    renderIntro();
    /** @type {HTMLElement} */ (document.querySelector(`[data-mode="${mode}"]`)).focus({ preventScroll: true });
  }

  $('goal').addEventListener('click', (e) => {
    const b = hit(e, 'button.zone');
    if (!b || phase !== 'input') return;
    const z = Number(b.dataset.zone);
    unlockAudio();
    if (mode === 'memory') tapMemory(z);
    else {
      light(z, 260);
      resolveShot(z);
    }
  });
  $('start').addEventListener('click', start);
  $('again').addEventListener('click', start);
  $('change').addEventListener('click', toIntro);

  // ---------- keys ----------

  // Arrows move the choice inside a chip group on the intro; 1–9 = zones in play; Enter = start / next / again.
  /** @param {KeyboardEvent} e */
  function introKey(e) {
    const t = e.target instanceof HTMLElement ? e.target : null;
    const group = t?.closest('#modes,#levels,#langs');
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (group && step) {
      const items = /** @type {HTMLElement[]} */ ([...group.querySelectorAll('button')]);
      const next = items[(items.indexOf(t) + step + items.length) % items.length];
      choose(next);
      next.focus();
      return true;
    }
    if (e.key === 'Enter' && (!t || group || t === document.body || t === $('start'))) {
      start();
      return true;
    }
    return false;
  }
  KFG.keys({
    onKey: (e) => {
      if (screen === 'intro') return introKey(e);
      if (screen === 'play') {
        const z = SimonEngine.keyZone(e.key, e.code);
        if (z >= 0) {
          if (phase === 'input' && used.has(z)) zoneEls[z].click();
          return true;
        }
        // Enter = Next while the feedback is up; otherwise a focused zone keeps its own Enter.
        const next = /** @type {HTMLElement | null} */ ($('feedback').querySelector('button'));
        if (e.key === 'Enter' && next) {
          next.click();
          return true;
        }
      }
      return false;
    },
    ctrl: () => ({
      onKey: (e) => {
        if (screen !== 'finish' || e.key !== 'Enter') return false;
        start();
        return true;
      },
    }),
    // Esc: from the round back to the intro (nothing to lose), from the intro / finish to the catalog.
    onEscape: () => {
      if (screen === 'play') toIntro();
      else location.href = '../../';
      return true;
    },
  });

  if (KF.TEST_MODE) {
    const hook = {
      get screen() {
        return screen;
      },
      get mode() {
        return mode;
      },
      get level() {
        return level;
      },
      get lang() {
        return lang;
      },
      get phase() {
        return phase;
      },
      get seq() {
        return [...seq];
      },
      get pos() {
        return pos;
      },
      get cmd() {
        return cmd && { ...cmd };
      },
      get index() {
        return index;
      },
      get score() {
        return score;
      },
      get results() {
        return [...results];
      },
      get sound() {
        return data.sound;
      },
      get timeScale() {
        return timeScale;
      },
      set timeScale(v) {
        timeScale = Number(v) > 0 ? Number(v) : 1;
      },
    };
    Object.defineProperty(window, '__simon', { get: () => hook });
  }

  renderIntro();
  renderSound();
})();
