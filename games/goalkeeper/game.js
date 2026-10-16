'use strict';
(() => {
  const slug = 'goalkeeper',
    $ = (id) => document.getElementById(id),
    rand = (n) => Math.floor(Math.random() * n),
    shuffle = (a) => a.sort(() => Math.random() - 0.5);
  const tiers = [
    ['starter', 'Starter', 0, 0],
    ['infinity', 'Infinity', 15, 6],
    ['freegel', 'Freegel', 30, 12],
    ['goldx', 'Gold X', 50, 18],
    ['fusion', 'Fusion', 80, 24],
    ['thibaut', 'Рукавиці Тібо', 120, 30],
  ];
  const colors = [
    ['#a9d93f', 'Лайм'],
    ['#ffc448', 'Жовтий'],
    ['#f28162', 'Кораловий'],
    ['#68b9e1', 'Блакитний'],
    ['#a68cdf', 'Фіолетовий'],
    ['#ffffff', 'Білий'],
  ];
  const cuts = [
    ['Flat', 'Рівна долоня — більше місця для м’яча.'],
    ['Negative', 'Шви всередині — щільніше сидять.'],
    ['Roll finger', 'Пальці округлі — м’яко обхоплюють м’яч.'],
  ];
  const words = [
    ['м’яч', 'ball'],
    ['рукавиці', 'gloves'],
    ['ворота', 'goal'],
    ['воротар', 'goalkeeper'],
    ['удар', 'shot'],
    ['пас', 'pass'],
    ['гравець', 'player'],
    ['команда', 'team'],
    ['поле', 'pitch'],
    ['суддя', 'referee'],
    ['кутовий', 'corner'],
    ['свисток', 'whistle'],
    ['сейв', 'save'],
    ['нападник', 'striker'],
    ['захисник', 'defender'],
    ['капітан', 'captain'],
    ['тренер', 'coach'],
    ['матч', 'match'],
    ['рахунок', 'score'],
    ['тайм', 'half'],
    ['сітка', 'net'],
    ['коліно', 'knee'],
    ['рука', 'hand'],
    ['нога', 'foot'],
  ];
  const calls = [
    ['М’яч летить до тебе. Ти виходиш ловити.', '¡Mía!', 'Keeper’s!'],
    ['Біля воріт небезпечно. Попроси вибити м’яч.', '¡Fuera!', 'Clear it!'],
    ['Партнер вільний і має час.', '¡Solo!', 'Time!'],
    ['Суперник підкрадається ззаду до партнера.', '¡Encima!', 'Man on!'],
    ['Команда має піднятися вище в поле.', '¡Arriba!', 'Push up!'],
  ];
  const callOptions = calls.map((c) => `${c[1]} / ${c[2]}`);
  const reads = {
    left: 'Він повернув голову й опорну ногу ліворуч — удар ліворуч!',
    right: 'Він повернув голову й опорну ногу праворуч — удар праворуч!',
    high: 'Він відкинувся назад і підсік м’яч — удар високо!',
    low: 'Він схилився над м’ячем, коліно зверху — удар низом!',
    chest: 'Він стояв прямо перед м’ячем — удар у груди!',
  };
  const arrows = { left: '←', right: '→', high: '↑', low: '↓', chest: '•' };
  let data = KF.gameData(slug);
  data = {
    saves: data.saves || 0,
    shots: data.shots || 0,
    cleanSheets: data.cleanSheets || 0,
    courtoisCard: data.courtoisCard || 0,
    matches: data.matches || 0,
    bestStreak: data.bestStreak || 0,
    level: ['rookie', 'academy', 'pro'].includes(data.level) ? data.level : 'rookie',
    gloves: {
      owned: data.gloves?.owned?.length ? data.gloves.owned : ['starter'],
      equipped: data.gloves?.equipped || 'starter',
      color: data.gloves?.color || colors[0][0],
      cut: data.gloves?.cut || 'Flat',
    },
  };
  let screen = 'start',
    phase = 'idle',
    topic = 'mix',
    pace = 'calm',
    attack = 0,
    saves = 0,
    goals = 0,
    rival = 0,
    streak = 0,
    results = [],
    target = '',
    answer = '',
    choices = [],
    selected = null,
    shotTimer,
    flightTimer,
    sceneTimers = [],
    passTimer,
    deadline,
    callIndex = 0,
    startCoins = 0,
    shopOrigin = 'start',
    lessonAuto = false;
  // Clean-sheet bonus grows with the level: on rookie the dashed line shows where the ball goes.
  const CLEAN_BONUS = { rookie: 1, academy: 3, pro: 5 };
  const save = () => KF.gameData(slug, data);
  const show = (name) => {
    screen = name;
    for (const s of ['start', 'lesson', 'match', 'end', 'shop']) $(s + '-screen').hidden = s !== name;
    window.scrollTo(0, 0);
  };
  const coachSvg = `<svg class="coach-art" viewBox="0 0 140 185" role="img" aria-label="Усміхнений високий воротар Тібо у формі номер один"><ellipse cx="70" cy="176" rx="53" ry="7" fill="#153d2c33"/><path d="M47 117 42 169 62 170 71 124 78 170 98 169 93 117" fill="#244c3e" stroke="#18372c" stroke-width="3"/><path d="M42 169 34 178 65 178 63 169 M78 169 77 178 107 178 98 169" fill="#213128"/><path d="M48 63 Q70 56 92 63 L99 126 Q70 134 41 126Z" fill="#e2a840" stroke="#174d37" stroke-width="3"/><path d="M52 68 88 68 M51 75 89 75" stroke="#ffdd79" stroke-width="3"/><text x="70" y="110" text-anchor="middle" font-size="37" font-weight="900" fill="#174d37">1</text><path d="M48 72 Q31 78 28 112 M92 72 Q109 80 112 112" fill="none" stroke="#e2a840" stroke-width="17" stroke-linecap="round"/><path d="M26 107 Q14 98 13 106 L16 119 27 130 36 122 36 108 Q32 102 28 109Z M114 107 Q126 98 127 106 L124 119 113 130 104 122 104 108 Q108 102 112 109Z" fill="var(--glove)" stroke="#174d37" stroke-width="3"/><path d="M21 113 31 122 M119 113 109 122" stroke="#fff" stroke-width="2"/><rect x="61" y="51" width="18" height="16" rx="6" fill="#b98260"/><ellipse cx="70" cy="32" rx="23" ry="27" fill="#b98260" stroke="#6b4938" stroke-width="2"/><path d="M47 32 Q43 8 64 6 Q90 0 93 25 Q81 22 74 15 Q64 28 47 32Z" fill="#362a28"/><path d="M54 35 60 35 M79 35 85 35" stroke="#342a28" stroke-width="2" stroke-linecap="round"/><path d="M62 45 Q70 52 78 45" fill="none" stroke="#704637" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  document.querySelectorAll('.coach-figure').forEach((el) => (el.innerHTML = coachSvg));
  $('sticker-img').onerror = () => $('sticker-card').classList.add('is-broken');
  $('sticker-img').src = KF.cardImg('thibaut-courtois', true);
  // Every pose is an explicit drawing, not a rotated version of an unrelated kick.
  // Screen-left and screen-right are mirrored for the player facing the goal.
  function shooterSvg(zone, demo = false) {
    const side = `<path d="M83 109 Q52 133 48 158 L24 164 M85 108 Q124 116 132 145 L110 162" fill="none" stroke="#263d39" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 164 12 169 M110 162 125 166" stroke="#172a28" stroke-width="13" stroke-linecap="round"/><path d="M62 53 Q88 63 102 77 L91 120 53 101Z" fill="#fff8e9" stroke="#1c3c32" stroke-width="4"/><path d="M65 62 Q42 67 29 84 M98 78 Q113 77 129 95" fill="none" stroke="#b5825e" stroke-width="12" stroke-linecap="round"/><circle cx="48" cy="39" r="23" fill="#b5825e" stroke="#5a3e2e" stroke-width="2"/><path d="M27 38 Q26 12 48 13 Q65 13 70 34 Q52 29 47 24 Q39 37 27 38Z" fill="#28342f"/><circle cx="32" cy="42" r="3.5" fill="#142b25"/><path d="M27 50 Q35 57 42 51" fill="none" stroke="#633d30" stroke-width="2"/>`;
    const poses = {
      left: `<g>${side}</g>`,
      right: `<g transform="translate(160 0) scale(-1 1)">${side}</g>`,
      high: `<path d="M84 110 47 150 33 166 M91 112 116 139 104 160" fill="none" stroke="#233c39" stroke-width="18" stroke-linecap="round"/><path d="M45 57 89 48 110 105 70 119Z" fill="#fff8e9" stroke="#1c3c32" stroke-width="4"/><path d="M48 66 24 24 M89 62 125 24" fill="none" stroke="#b5825e" stroke-width="13" stroke-linecap="round"/><circle cx="112" cy="35" r="23" fill="#b5825e" stroke="#5a3e2e" stroke-width="2"/><path d="M94 27 Q101 3 124 13 L135 29 Q113 28 105 22Z" fill="#28342f"/><circle cx="113" cy="38" r="3" fill="#142b25"/><path d="M83 132 Q108 133 115 151 L92 158" fill="none" stroke="#263d39" stroke-width="13" stroke-linecap="round"/>`,
      low: `<path d="M67 116 Q41 128 35 158 L19 165 M100 116 Q122 130 110 146 L91 164" fill="none" stroke="#263d39" stroke-width="18" stroke-linecap="round"/><path d="M40 66 Q75 48 116 76 L113 117 66 120Z" fill="#fff8e9" stroke="#1c3c32" stroke-width="4"/><path d="M48 83 25 118 M106 88 132 124" fill="none" stroke="#b5825e" stroke-width="12" stroke-linecap="round"/><circle cx="113" cy="91" r="23" fill="#b5825e" stroke="#5a3e2e" stroke-width="2"/><path d="M92 87 Q87 66 107 67 Q135 66 136 90 Q115 83 105 78Z" fill="#28342f"/><circle cx="121" cy="99" r="3" fill="#142b25"/><circle cx="110" cy="142" r="9" fill="#253e39"/>`,
      chest: `<path d="M65 115 53 151 39 166 M95 115 109 152 128 166" fill="none" stroke="#263d39" stroke-width="18" stroke-linecap="round"/><path d="M61 57 99 57 105 116 55 116Z" fill="#fff8e9" stroke="#1c3c32" stroke-width="4"/><path d="M59 68 34 98 M101 68 126 98" fill="none" stroke="#b5825e" stroke-width="12" stroke-linecap="round"/><circle cx="80" cy="34" r="23" fill="#b5825e" stroke="#5a3e2e" stroke-width="2"/><path d="M58 32 Q59 7 82 11 Q101 11 103 32 Q82 25 76 22Z" fill="#28342f"/><circle cx="73" cy="37" r="2.5" fill="#142b25"/><circle cx="87" cy="37" r="2.5" fill="#142b25"/><path d="M72 46 Q80 51 88 46" fill="none" stroke="#633d30" stroke-width="2"/>`,
    };
    return `<svg viewBox="0 0 160 185" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="80" cy="174" rx="65" ry="7" fill="#072d2355"/>${poses[zone]}<path d="M72 67 86 67" stroke="#e87758" stroke-width="4"/>${demo ? '<circle cx="90" cy="162" r="13" fill="white" stroke="#163b32" stroke-width="2"/><path d="M90 153 98 159 95 168 85 168 82 159Z" fill="#263b33"/>' : ''}</svg>`;
  }
  const poseLabels = [
    ['left', '← Ліворуч', '←'],
    ['right', '→ Праворуч', '→'],
    ['high', '↑ Високо', '↑'],
    ['low', '↓ Низом', '↓'],
    ['chest', '● У груди', 'Пробіл'],
  ];
  $('lesson-grid').innerHTML = poseLabels
    .map(([zone, label, key]) => `<div class="lesson-card">${shooterSvg(zone, true)}<strong>${label}</strong><kbd>${key}</kbd></div>`)
    .join('');
  const gloveSvg = (id) => {
    const cut = data.gloves.cut;
    const shape =
      cut === 'Roll finger'
        ? 'M16 74 9 52 3 37 Q0 27 7 27 Q14 27 17 37 L19 42 14 13 Q12 3 20 3 Q27 3 27 12 L28 32 28 8 Q28 -1 35 1 Q42 2 41 10 L40 32 42 13 Q44 4 50 6 Q57 8 54 17 L50 37 56 25 Q60 17 65 22 Q71 26 65 35 L55 57 52 74Z'
        : cut === 'Negative'
          ? 'M18 74 11 53 4 37 Q2 31 7 29 Q11 28 14 34 L19 44 16 12 Q16 6 21 6 Q25 6 26 12 L28 34 29 9 Q29 3 34 3 Q39 3 39 9 L40 33 43 13 Q44 7 49 8 Q54 9 52 15 L49 40 57 27 Q60 22 64 24 Q68 27 64 33 L54 57 52 74Z'
          : 'M16 74 9 52 3 37 Q1 30 6 29 Q11 27 14 33 L18 42 14 12 Q13 5 19 5 Q24 5 25 12 L27 33 27 7 Q27 1 33 1 Q39 1 39 8 L39 32 41 12 Q42 6 48 7 Q54 8 53 14 L50 37 56 25 Q59 19 64 22 Q69 25 65 32 L55 57 52 74Z';
    const marks = {
      starter: '',
      infinity: '<path class="accent" d="M16 62 H53 V71 H17Z"/><path class="seam" d="M19 65 H49"/>',
      freegel: '<path class="accent" d="M16 14 20 13 24 40 19 43Z M29 9 H37 L37 38 H29Z M43 15 50 16 47 41 40 38Z"/>',
      goldx: '<path class="gold" d="M19 43 Q34 35 51 43 L48 60 Q34 66 21 58Z"/><path class="seam" d="M25 49 44 49"/>',
      fusion: '<path class="light" d="M35 39 Q46 30 52 38 L50 57 43 69 35 69Z"/><path class="accent" d="M17 62 Q35 59 52 62 L51 71 H17Z"/>',
      thibaut:
        '<path class="gold" d="M17 60 Q34 65 53 59 L52 74 H18Z"/><path class="gold" d="M34 34 37 41 45 42 39 47 41 55 34 51 27 55 29 47 23 42 31 41Z"/><path class="seam" d="M18 14 21 34 M33 10 33 30 M47 15 44 34"/>',
    };
    return `<svg class="glove-art" viewBox="0 0 68 80" aria-hidden="true"><path class="base" d="${shape}"/><path class="seam" d="${cut === 'Negative' ? 'M22 52 Q34 47 47 52 M26 14 29 43 M40 14 39 43' : cut === 'Roll finger' ? 'M19 54 Q35 46 51 54 M22 15 25 37 M33 10 33 37 M47 16 45 38' : 'M18 55 Q34 48 51 55 M27 37 28 48 M40 36 39 47'}"/>${marks[id]}</svg>`;
  };
  function renderStats() {
    $('stats').innerHTML =
      `<div><strong>${data.matches}</strong><small>матчів</small></div><div><strong>${data.shots ? Math.round((data.saves / data.shots) * 100) : 0}%</strong><small>сейвів</small></div><div><strong>${data.cleanSheets}</strong><small>сухих матчів</small></div>`;
    document.documentElement.style.setProperty('--glove', data.gloves.color);
  }
  function renderSetup() {
    $('levels').innerHTML = [
      ['rookie', 'Новачок'],
      ['academy', 'Академія'],
      ['pro', 'Профі'],
    ]
      .map(([id, label]) => `<button class="chip" data-level="${id}" aria-pressed="${data.level === id}">${label}</button>`)
      .join('');
    $('level-hint').textContent =
      {
        rookie: 'Пунктир підкаже шлях м’яча. Часу більше.',
        academy: 'На перших двох ударах побачиш стрілку біля ноги.',
        pro: 'Лише поза нападника. М’яч летить швидше.',
      }[data.level] + ` Сухий матч: +${CLEAN_BONUS[data.level]} 🪙.`;
    $('topics').innerHTML = [
      ['mix', 'Мікс'],
      ['multiply', '×'],
      ['math', '+/−'],
      ['words', 'Слова EN'],
    ]
      .map(([id, label]) => `<button class="chip" data-topic="${id}" aria-pressed="${topic === id}">${label}</button>`)
      .join('');
    $('paces').innerHTML = [
      ['calm', 'Спокійно'],
      ['fast', 'Футзал: 4 секунди'],
    ]
      .map(([id, label]) => `<button class="chip" data-pace="${id}" aria-pressed="${pace === id}">${label}</button>`)
      .join('');
  }
  $('topics').onclick = (e) => {
    const b = e.target.closest('[data-topic]');
    if (b) {
      topic = b.dataset.topic;
      renderSetup();
    }
  };
  $('paces').onclick = (e) => {
    const b = e.target.closest('[data-pace]');
    if (b) {
      pace = b.dataset.pace;
      renderSetup();
    }
  };
  $('levels').onclick = (e) => {
    const b = e.target.closest('[data-level]');
    if (b) {
      data.level = b.dataset.level;
      save();
      renderSetup();
    }
  };
  function openLesson(auto = false) {
    lessonAuto = auto;
    show('lesson');
    $('lesson-close').textContent = auto ? 'На поле →' : 'Зрозуміло →';
    $('lesson-close').focus({ preventScroll: true });
  }
  function closeLesson(play = false) {
    const start = play && lessonAuto;
    lessonAuto = false;
    if (start) startMatch();
    else {
      show('start');
      $('lesson-btn').focus({ preventScroll: true });
    }
  }
  $('lesson-btn').onclick = () => openLesson();
  $('lesson-close').onclick = () => closeLesson(true);
  function renderShop() {
    renderStats();
    $('shop-list').innerHTML = tiers
      .map(([id, name, price, bonus]) => {
        const owned = data.gloves.owned.includes(id),
          equipped = id === data.gloves.equipped,
          afford = KF.get().coins >= price;
        return `<div class="item ${equipped ? 'equipped' : ''}" style="--swatch:${data.gloves.color}">${gloveSvg(id)}<div class="item-info"><strong>${name}</strong><small>+${bonus}% часу · ${price ? price + ' 🪙' : 'безкоштовно'}</small></div><button class="shop-action" data-tier="${id}" ${equipped || (!owned && !afford) ? 'disabled' : ''}>${equipped ? 'На руках' : owned ? 'Надіти' : afford ? 'Купити' : 'Не вистачає 🪙'}</button></div>`;
      })
      .join('');
    $('colors').innerHTML = colors
      .map(
        ([color, label]) =>
          `<button class="swatch" style="--swatch:${color}" data-color="${color}" aria-label="${label}" aria-pressed="${data.gloves.color === color}"></button>`,
      )
      .join('');
    $('cuts').innerHTML = cuts
      .map(([id]) => `<button class="chip" data-cut="${id}" aria-pressed="${data.gloves.cut === id}">${id}</button>`)
      .join('');
    $('cut-note').textContent = cuts.find((c) => c[0] === data.gloves.cut)[1];
  }
  $('shop-list').onclick = (e) => {
    const b = e.target.closest('[data-tier]');
    if (!b || b.disabled) return;
    const id = b.dataset.tier,
      tier = tiers.find((t) => t[0] === id);
    if (!data.gloves.owned.includes(id)) {
      if (!KF.spendCoins(tier[2])) return;
      data.gloves.owned.push(id);
      KFUI.toast('Нові рукавиці! 🧤');
    }
    data.gloves.equipped = id;
    save();
    renderShop();
  };
  $('colors').onclick = (e) => {
    const b = e.target.closest('[data-color]');
    if (b) {
      data.gloves.color = b.dataset.color;
      save();
      renderShop();
    }
  };
  $('cuts').onclick = (e) => {
    const b = e.target.closest('[data-cut]');
    if (b) {
      data.gloves.cut = b.dataset.cut;
      save();
      renderShop();
    }
  };
  document.querySelectorAll('[data-shop]').forEach(
    (b) =>
      (b.onclick = () => {
        shopOrigin = screen;
        show('shop');
        renderShop();
      }),
  );
  $('shop-back').onclick = () => {
    show(shopOrigin);
    renderStats();
  };
  function clearTimers() {
    clearTimeout(shotTimer);
    clearTimeout(flightTimer);
    sceneTimers.forEach(clearTimeout);
    sceneTimers = [];
    clearInterval(passTimer);
  }
  function dots() {
    $('dots').innerHTML = Array.from(
      { length: 6 },
      (_, i) =>
        `<span class="dot ${results[i] === 'save' ? 'save' : results[i] === 'miss' ? 'miss' : i === attack ? 'now' : ''}" title="Атака ${i + 1}" aria-label="Атака ${i + 1}: ${results[i] === 'save' ? 'сейв' : results[i] === 'miss' ? 'гол' : 'попереду'}"></span>`,
    ).join('');
    $('round-label').textContent = `АТАКА ${Math.min(attack + 1, 6)} / 6`;
    $('score-label').textContent = `НАШІ ${goals} : ${rival} СУПЕРНИК`;
    $('streak-label').textContent = `🧤 Серія ${streak}`;
  }
  function caption(main, sub) {
    $('caption').textContent = main;
    $('subcaption').textContent = sub;
  }
  function feedback(message, label, fn) {
    $('feedback').hidden = false;
    $('feedback').replaceChildren();
    const p = document.createElement('p'),
      b = document.createElement('button');
    p.textContent = message;
    b.type = 'button';
    b.className = 'btn btn-dark';
    b.textContent = label;
    b.onclick = fn;
    $('feedback').append(p, b);
    b.focus({ preventScroll: true });
  }
  function requestedStart() {
    if (data.matches === 0) openLesson(true);
    else startMatch();
  }
  function startMatch() {
    clearTimers();
    attack = 0;
    saves = 0;
    goals = 0;
    rival = 0;
    streak = 0;
    results = [];
    callIndex = rand(calls.length);
    startCoins = KF.get().coins;
    show('match');
    nextAttack();
  }
  function flyBall() {
    const zone = document.querySelector(`[data-zone="${target}"]`).getBoundingClientRect(),
      arena = $('shot-area').getBoundingClientRect();
    $('ball').style.setProperty('--ball-x', `${((zone.left + zone.width / 2 - arena.left) / arena.width) * 100}%`);
    $('ball').style.setProperty('--ball-y', `${arena.bottom - zone.top - zone.height / 2}px`);
    $('ball').classList.add('fly');
  }
  function dive(zone) {
    const b = document.querySelector(`[data-zone="${zone}"]`).getBoundingClientRect(),
      g = $('goal').getBoundingClientRect();
    $('keeper').style.setProperty('--dive-x', `${b.left + b.width / 2 - g.left - g.width / 2}px`);
    $('keeper').style.setProperty('--dive-y', `${b.top + b.height / 2 - g.top - g.height * 0.46}px`);
    $('keeper').style.setProperty('--dive-rotate', zone === 'left' ? '-32deg' : zone === 'right' ? '32deg' : '0deg');
    $('keeper').classList.toggle('block', zone === 'low');
    document.querySelector(`[data-zone="${zone}"]`).classList.add('active');
  }
  function nextAttack() {
    clearTimers();
    $('feedback').hidden = true;
    $('pass-area').hidden = true;
    $('shout-area').hidden = true;
    $('shot-area').hidden = false;
    if (attack === 6) {
      finish();
      return;
    }
    if (attack === 3 && phase !== 'after-call') {
      showCall();
      return;
    }
    phase = 'runup';
    selected = null;
    target = ['left', 'right', 'high', 'low', 'chest'][rand(5)];
    $('ball').style.transition = 'none';
    $('ball').classList.remove('fly');
    $('keeper').style.transition = 'none';
    $('keeper').style.removeProperty('--dive-x');
    $('keeper').style.removeProperty('--dive-y');
    $('keeper').style.removeProperty('--dive-rotate');
    $('keeper').classList.remove('block');
    $('shooter').innerHTML = shooterSvg('chest');
    $('shooter').className = 'shooter runup';
    $('cue').hidden = true;
    $('trajectory').setAttribute('hidden', '');
    document.querySelectorAll('.zone').forEach((b) => b.classList.remove('active'));
    caption('Нападник наближається…', 'Дивись на корпус і ногу');
    dots();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (phase === 'runup') {
          $('ball').style.removeProperty('transition');
          $('keeper').style.removeProperty('transition');
          $('shooter').classList.remove('runup');
        }
      }),
    );
    sceneTimers.push(setTimeout(beginTelegraph, 720));
  }
  function drawTrajectory() {
    const arena = $('shot-area').getBoundingClientRect(),
      ball = $('ball').getBoundingClientRect(),
      zone = document.querySelector(`[data-zone="${target}"]`).getBoundingClientRect(),
      svg = $('trajectory');
    svg.setAttribute('viewBox', `0 0 ${arena.width} ${arena.height}`);
    const x1 = ball.left + ball.width / 2 - arena.left,
      y1 = ball.top + ball.height / 2 - arena.top,
      x2 = zone.left + zone.width / 2 - arena.left,
      y2 = zone.top + zone.height / 2 - arena.top;
    const line = $('trajectory-line');
    for (const [name, value] of Object.entries({ x1, y1, x2, y2 })) line.setAttribute(name, value);
    $('trajectory-end').setAttribute('cx', x2);
    $('trajectory-end').setAttribute('cy', y2);
    svg.removeAttribute('hidden');
  }
  function beginTelegraph() {
    if (phase !== 'runup') return;
    phase = 'shot';
    $('shooter').innerHTML = shooterSvg(target);
    caption('Читай позу нападника!', 'Реагуй до того, як м’яч долетить');
    if (data.level === 'rookie') drawTrajectory();
    if (data.level === 'academy' && attack < 2) {
      $('cue').textContent = arrows[target];
      $('cue').style.left = `calc(50% + ${{ left: -60, right: 60, high: -48, low: -60, chest: -42 }[target]}px)`;
      $('cue').hidden = false;
      sceneTimers.push(setTimeout(() => ($('cue').hidden = true), 420));
    }
    const bonus = tiers.find((t) => t[0] === data.gloves.equipped)[3];
    const flight = (data.level === 'rookie' ? 1200 : data.level === 'pro' ? 820 : 1050) - attack * (data.level === 'pro' ? 45 : 30);
    const travel = flight * (1 + bonus / 100);
    $('ball').style.setProperty('--flight', `${travel}ms`);
    flightTimer = setTimeout(
      () => {
        if (phase !== 'shot') return;
        $('trajectory').setAttribute('hidden', '');
        $('cue').hidden = true;
        $('shooter').classList.add('kicked');
        flyBall();
        shotTimer = setTimeout(resolveShot, travel + 30);
      },
      data.level === 'rookie' ? 900 : data.level === 'pro' ? 440 : 640,
    );
  }
  function chooseSave(zone) {
    if (phase !== 'shot' || selected !== null) return;
    selected = zone;
    dive(zone);
  }
  function resolveShot() {
    if (phase !== 'shot') return;
    clearTimers();
    phase = 'shot-result';
    const good = selected === target;
    results.push(good ? 'save' : 'miss');
    data.shots++;
    if (good) {
      saves++;
      data.saves++;
      streak++;
      data.bestStreak = Math.max(data.bestStreak, streak);
      KFUI.toast('СЕЙВ! 🧤');
    } else {
      rival++;
      streak = 0;
    }
    save();
    dots();
    $('cue').hidden = true;
    $('trajectory').setAttribute('hidden', '');
    caption(good ? 'СЕЙВ! М’яч у рукавицях!' : 'Гол суперника. Нічого страшного!', '');
    feedback(
      `${reads[target]} ${good ? 'Чудовий сейв! Тепер віддай пас.' : 'Нічого, Тібо теж пропускає! Наступний відіб’єш.'}`,
      good ? 'Віддати пас →' : 'Далі →',
      () => (good ? startPass() : advance()),
    );
  }
  function makeQuestion() {
    const kind = topic === 'mix' ? ['multiply', 'math', 'words'][rand(3)] : topic;
    let correct, prompt, options;
    if (kind === 'multiply') {
      const a = 2 + rand(9),
        b = 2 + rand(9);
      correct = a * b;
      prompt = `${a} × ${b} = ?`;
      options = [correct + a, correct + b, correct - a, correct + 2, correct - 2, correct + b + 2].filter((n) => n > 0 && n !== correct);
    } else if (kind === 'math') {
      const a = 20 + rand(71),
        b = 10 + rand(40),
        plus = rand(2) === 0;
      correct = plus ? Math.min(100, a + b) : a - b;
      if (correct < 0 || correct > 100) {
        return makeQuestion();
      }
      prompt = `${a} ${plus ? '+' : '−'} ${b} = ?`;
      options = [correct + 10, correct - 10, correct + 1, correct - 1, correct + 2, correct - 2].filter((n) => n >= 0 && n <= 100);
    } else {
      const word = words[rand(words.length)];
      correct = word[1];
      prompt = `${word[0]} → ?`;
      options = shuffle(words.filter((w) => w[1] !== correct))
        .slice(0, 3)
        .map((w) => w[1]);
    }
    return { prompt, correct, options: shuffle([correct, ...shuffle([...new Set(options)]).slice(0, 3)]) };
  }
  function startPass() {
    phase = 'pass';
    $('feedback').hidden = true;
    $('shot-area').hidden = true;
    $('pass-area').hidden = false;
    const q = makeQuestion();
    answer = q.correct;
    choices = q.options;
    $('question').textContent = q.prompt;
    const positions = ['cierre', 'ala izquierda', 'ala derecha', 'pívot'];
    $('pass-choices').innerHTML = choices
      .map((c, i) => `<button class="choice" data-index="${i}"><b>${i + 1}</b><small>${positions[i]}</small>${c}</button>`)
      .join('');
    caption('Віддай пас гравцю з правильною відповіддю', '1–4 або натисни футболку');
    $('clock').hidden = pace !== 'fast';
    if (pace === 'fast') {
      deadline = performance.now() + 4000;
      tickClock();
      passTimer = setInterval(tickClock, 50);
    }
  }
  function tickClock() {
    if (phase !== 'pass') return;
    const left = Math.max(0, deadline - performance.now());
    $('seconds').textContent = Math.ceil(left / 1000);
    $('ring').style.setProperty('--clock', `${left / 40}%`);
    if (left === 0) resolvePass(-1);
  }
  function resolvePass(index) {
    if (phase !== 'pass') return;
    clearInterval(passTimer);
    phase = 'pass-result';
    const good = index >= 0 && choices[index] === answer;
    KF.answer(slug, good);
    if (good) goals++;
    $('pass-choices')
      .querySelectorAll('button')
      .forEach((b, i) => {
        b.disabled = true;
        if (choices[i] === answer) b.classList.add('correct');
        else if (i === index) b.classList.add('wrong');
      });
    dots();
    feedback(
      good
        ? 'Точний пас! Pívot забиває — ¡GOOOL! ⚽'
        : index === -1
          ? `Свисток! 4 секунди. Правильна відповідь: ${answer}.`
          : `Пас перехопили. Правильна відповідь: ${answer}. Наступного разу вийде!`,
      'Далі →',
      advance,
    );
  }
  function showCall() {
    phase = 'call';
    $('shot-area').hidden = true;
    $('pass-area').hidden = true;
    $('shout-area').hidden = false;
    $('feedback').hidden = true;
    const c = calls[callIndex];
    caption('¿Qué gritas? · Що крикнеш?', c[0]);
    const indices = shuffle([0, 1, 2, 3, 4]).slice(0, 4);
    if (!indices.includes(callIndex)) indices[rand(4)] = callIndex;
    choices = shuffle(indices).map((i) => callOptions[i]);
    answer = callOptions[callIndex];
    $('shout-choices').innerHTML = choices
      .map((text, i) => `<button class="choice" data-index="${i}"><b>${i + 1}</b>${text}</button>`)
      .join('');
  }
  function resolveCall(index) {
    if (phase !== 'call') return;
    phase = 'call-result';
    const good = choices[index] === answer;
    KF.answer(slug, good);
    $('shout-choices')
      .querySelectorAll('button')
      .forEach((b, i) => {
        b.disabled = true;
        if (choices[i] === answer) b.classList.add('correct');
        else if (i === index) b.classList.add('wrong');
      });
    feedback(good ? 'Так! Команда тебе почула. 📣' : `Можна крикнути: ${answer}. Спробуєш наступного разу!`, 'Продовжити →', () => {
      phase = 'after-call';
      nextAttack();
    });
  }
  function advance() {
    attack++;
    phase = 'idle';
    nextAttack();
  }
  function finish() {
    phase = 'end';
    data.matches++;
    const clean = saves === 6;
    if (clean) data.cleanSheets++;
    save();
    const first = clean && !data.courtoisCard;
    const res = KF.finishGame(slug, { score: saves, max: 6, bonus: CLEAN_BONUS[data.level] });
    let card = null;
    if (first) {
      card = KF.giveCard('thibaut-courtois');
      if (card) {
        data.courtoisCard = 1;
        save();
      }
    }
    show('end');
    $('end-title').textContent = clean ? 'Сухий матч! 🧤' : 'Матч завершено!';
    $('end-score').textContent = `${saves} / 6 сейвів`;
    $('end-text').textContent =
      `Наші ${goals} : ${rival} суперник. ${clean ? 'Жодного пропущеного!' : saves ? 'Класно стояв у воротах!' : 'Це тренування. Наступний матч буде твоїм!'}${res.bonus ? ` +${res.bonus} ${res.bonus === 1 ? 'монета' : res.bonus < 5 ? 'монети' : 'монет'} за сухий матч.` : ''}`;
    $('sticker').hidden = !card;
    $('end-tip').textContent = clean ? 'Тібо: «Оце так стіна! Пишаюся тобою.»' : 'Тібо: «Дивись на ноги суперника. Наступний м’яч твій!»';
    $('earned').textContent = `Зароблено ${KF.get().coins - startCoins} 🪙`;
    if (clean) KFUI.confetti();
    renderStats();
  }
  $('goal').onclick = (e) => {
    const b = e.target.closest('[data-zone]');
    if (b) chooseSave(b.dataset.zone);
  };
  $('pass-choices').onclick = (e) => {
    const b = e.target.closest('[data-index]');
    if (b) resolvePass(Number(b.dataset.index));
  };
  $('shout-choices').onclick = (e) => {
    const b = e.target.closest('[data-index]');
    if (b) resolveCall(Number(b.dataset.index));
  };
  $('start-btn').onclick = requestedStart;
  $('again').onclick = startMatch;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (screen === 'shop') {
        $('shop-back').click();
        e.preventDefault();
      } else if (screen === 'lesson') {
        closeLesson();
        e.preventDefault();
      } else if (screen === 'match') {
        if (confirm('Вийти з матчу? Цей матч не збережеться.')) {
          clearTimers();
          phase = 'idle';
          show('start');
          renderStats();
        }
        e.preventDefault();
      }
      return;
    }
    if (screen === 'match') {
      if (phase === 'shot') {
        const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'high', ArrowDown: 'low', ' ': 'chest' };
        if (map[e.key]) {
          e.preventDefault();
          chooseSave(map[e.key]);
          return;
        }
      }
      if ((phase === 'pass' || phase === 'call') && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        const i = Number(e.key) - 1;
        if (phase === 'pass') resolvePass(i);
        else resolveCall(i);
        return;
      }
      if (e.key === 'Enter' && !$('feedback').hidden) {
        e.preventDefault();
        $('feedback').querySelector('button').click();
        return;
      }
    }
    if (e.key === 'Enter' && screen === 'lesson') {
      e.preventDefault();
      closeLesson(true);
      return;
    }
    if (e.key === 'Enter' && screen === 'start' && document.activeElement === document.body) {
      e.preventDefault();
      requestedStart();
    }
    if (e.key === 'Enter' && screen === 'end' && document.activeElement === document.body) {
      e.preventDefault();
      startMatch();
    }
  });
  if (KF.TEST_MODE)
    Object.defineProperty(window, '__goalkeeper', { get: () => ({ screen, phase, target, answer, choices, attack, saves, pace }) });
  renderSetup();
  renderStats();
})();
