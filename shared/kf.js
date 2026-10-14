// Keeper Fun Games — shared progress core (coins, football cards, achievements).
// Storage: localStorage (same origin for all games => shared progress).
// Usage in a game:  <script src="../../shared/kf.js"></script>
//   KF.answer('penalty-multiply', true)          // per answer
//   KF.finishGame('penalty-multiply', { score: 4, max: 5 })  // end of round
//   KF.on('achievement', (a) => ...)  KF.on('coins', (delta) => ...)
// Test mode (for parents): open any page with ?parent — progress goes to a
// per-tab sandbox (sessionStorage) and never touches the real one.
// ?parent=off leaves test mode. Mode sticks across pages of the same tab.
'use strict';

(() => {
  const REAL_KEY = 'kf-progress-v1';
  const TEST_KEY = 'kf-progress-test';
  const TEST_FLAG = 'kf-test-mode';
  const TEST_COINS = 100;
  const PACK_PRICE = 10;
  const AVATARS = ['⚽', '🧤', '🥅', '🏆', '⭐', '🔥', '🦁', '🐯', '🦊', '🐼', '🚀', '⚡'];
  const PACK_SIZE = 3;
  const USER_KEY = 'kf-user';
  const slotKey = (id) => `kf-sync-u${id}`;
  const PUSH_DELAY = 1500;

  const detectTestMode = () => {
    try {
      const param = new URLSearchParams(location.search).get('parent');
      if (param === 'off' || param === '0') sessionStorage.removeItem(TEST_FLAG);
      else if (param !== null) sessionStorage.setItem(TEST_FLAG, '1');
      return sessionStorage.getItem(TEST_FLAG) === '1';
    } catch {
      return false;
    }
  };

  const TEST_MODE = detectTestMode();

  // Site language: 'uk' (main site) or 'es' (Spanish site), from shared/site.js.
  // ?lang=es / ?lang=uk overrides it for this tab (for testing), ?lang=off drops the override.
  const LANGS = ['uk', 'es'];
  const LANG_FLAG = 'kf-lang';
  const detectLang = () => {
    const site = LANGS.includes(window.KF_SITE?.lang) ? window.KF_SITE.lang : 'uk';
    try {
      const param = new URLSearchParams(location.search).get('lang');
      if (param === 'off') sessionStorage.removeItem(LANG_FLAG);
      else if (LANGS.includes(param)) sessionStorage.setItem(LANG_FLAG, param);
      const forced = sessionStorage.getItem(LANG_FLAG);
      return LANGS.includes(forced) ? forced : site;
    } catch {
      return site;
    }
  };
  const LANG = detectLang();
  if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = LANG;

  // T = i18n({ uk: {...}, es: {...} }); T('key', { n: 3 }) — missing keys fall back to uk, then to the key.
  // Values are strings with {var} placeholders or functions (vars) => string (plurals).
  // T.apply(root) fills [data-i18n] text and [data-i18n-placeholder|-aria-label|-title] attributes.
  const i18n = (dicts) => {
    const dict = { ...dicts.uk, ...dicts[LANG] };
    const T = (key, vars = {}) => {
      const v = dict[key];
      if (typeof v === 'function') return v(vars);
      if (typeof v !== 'string') return key;
      return v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    };
    T.has = (key) => key in dict;
    T.apply = (root = document) => {
      for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = T(el.dataset.i18n);
      for (const attr of ['placeholder', 'aria-label', 'title']) {
        for (const el of root.querySelectorAll(`[data-i18n-${attr}]`)) el.setAttribute(attr, T(el.getAttribute(`data-i18n-${attr}`)));
      }
    };
    return T;
  };
  const KEY = TEST_MODE ? TEST_KEY : REAL_KEY;
  const store = TEST_MODE ? sessionStorage : localStorage;

  // Texts of the core (catalog titles, achievements, card categories). Games have their own dictionaries.
  const T = i18n({
    uk: {
      'cat.math': 'Математика',
      'cat.english': 'Англійська',
      'cat.fun': 'Футбол-розваги',
      'card.common': 'Звичайна',
      'card.futsal': 'Футзал',
      'card.rare': 'Рідкісна',
      'card.legend': 'Легенда',
      'first-game.title': 'Перший матч',
      'first-game.desc': 'Зіграй першу гру',
      'goals-10.title': '10 голів',
      'goals-10.desc': 'Дай 10 правильних відповідей',
      'goals-50.title': 'Бомбардир',
      'goals-50.desc': '50 правильних відповідей',
      'goals-200.title': 'Золота бутса',
      'goals-200.desc': '200 правильних відповідей',
      'perfect.title': 'Сухий матч',
      'perfect.desc': 'Пройди гру без жодної помилки',
      'streak-5.title': 'Серія 5',
      'streak-5.desc': '5 правильних відповідей поспіль',
      'streak-15.title': 'Нестримний',
      'streak-15.desc': '15 правильних відповідей поспіль',
      'games-10.title': 'Сезон',
      'games-10.desc': 'Зіграй 10 ігор',
      'days-3.title': 'Тренування 3 дні',
      'days-3.desc': 'Грай 3 дні поспіль',
      'first-pack.title': 'Перший пакунок',
      'first-pack.desc': 'Відкрий пакунок карток',
      'album-10.title': 'Колекціонер',
      'album-10.desc': 'Збери 10 різних карток',
      'album-50.title': 'Великий колекціонер',
      'album-50.desc': 'Збери 50 різних карток',
      'album-full.title': 'Повний альбом',
      'album-full.desc': 'Збери всі картки',
      'legend.title': 'Легенда!',
      'legend.desc': 'Знайди легенду',
      'rare.title': 'Зірка',
      'rare.desc': 'Знайди рідкісну картку',
      'futsal.title': 'Футзаліст',
      'futsal.desc': 'Збери 5 футзалістів',
      'ukraine-5.title': 'Синьо-жовті',
      'ukraine-5.desc': 'Збери 5 українців',
      'ukraine.title': 'Збірна України',
      'ukraine.desc': 'Збери всіх українців',
      'keeper-wall.title': 'Стіна',
      'keeper-wall.desc': 'Зроби 25 сейвів у грі «Воротар»',
      'keeper-gloves.title': 'Нові рукавиці',
      'keeper-gloves.desc': 'Купи нові рукавиці у грі «Воротар»',
    },
    es: {
      'cat.math': 'Matemáticas',
      'cat.english': 'Inglés',
      'cat.fun': 'Fútbol y diversión',
      'card.common': 'Común',
      'card.futsal': 'Fútbol sala',
      'card.rare': 'Rara',
      'card.legend': 'Leyenda',
      'first-game.title': 'Primer partido',
      'first-game.desc': 'Juega tu primera partida',
      'goals-10.title': '10 goles',
      'goals-10.desc': 'Da 10 respuestas correctas',
      'goals-50.title': 'Goleador',
      'goals-50.desc': '50 respuestas correctas',
      'goals-200.title': 'Bota de Oro',
      'goals-200.desc': '200 respuestas correctas',
      'perfect.title': 'Portería a cero',
      'perfect.desc': 'Termina una partida sin ningún fallo',
      'streak-5.title': 'Racha de 5',
      'streak-5.desc': '5 respuestas correctas seguidas',
      'streak-15.title': 'Imparable',
      'streak-15.desc': '15 respuestas correctas seguidas',
      'games-10.title': 'Temporada',
      'games-10.desc': 'Juega 10 partidas',
      'days-3.title': 'Entrenamiento de 3 días',
      'days-3.desc': 'Juega 3 días seguidos',
      'first-pack.title': 'Primer sobre',
      'first-pack.desc': 'Abre un sobre de cartas',
      'album-10.title': 'Coleccionista',
      'album-10.desc': 'Consigue 10 cartas distintas',
      'album-50.title': 'Gran coleccionista',
      'album-50.desc': 'Consigue 50 cartas distintas',
      'album-full.title': 'Álbum completo',
      'album-full.desc': 'Consigue todas las cartas',
      'legend.title': '¡Leyenda!',
      'legend.desc': 'Encuentra una leyenda',
      'rare.title': 'Estrella',
      'rare.desc': 'Encuentra una carta rara',
      'futsal.title': 'Jugador de sala',
      'futsal.desc': 'Consigue 5 jugadores de fútbol sala',
      'ukraine-5.title': 'Azul y amarillo',
      'ukraine-5.desc': 'Consigue 5 ucranianos',
      'ukraine.title': 'Selección de Ucrania',
      'ukraine.desc': 'Consigue a todos los ucranianos',
      'keeper-wall.title': 'El muro',
      'keeper-wall.desc': 'Haz 25 paradas en el juego «Portero»',
      'keeper-gloves.title': 'Guantes nuevos',
      'keeper-gloves.desc': 'Compra guantes nuevos en el juego «Portero»',
    },
  });

  // Catalog registry. status: 'ready' | 'beta' (visible only in test mode) | 'soon'
  // sites: where the game is shown ('uk' = main site, 'es' = Spanish site). title/desc are the Ukrainian texts
  // (kept for compatibility); es: { title, desc } are the Spanish ones. KF.siteGames() resolves both.
  const GAMES = [
    {
      slug: 'goalkeeper',
      title: 'Воротар',
      emoji: '🧤',
      category: 'fun',
      desc: 'Відбивай удари і віддавай точний пас. Футзал 5×5!',
      status: 'ready',
      sites: ['uk'],
      es: { title: 'Portero', desc: 'Para los tiros y da un pase preciso. ¡Fútbol sala 5×5!' },
    },
    {
      slug: 'math-exam',
      title: 'Examen de mates',
      emoji: '📝',
      category: 'math',
      desc: 'Готуємось до іспиту: llevadas, redondeo, valor.',
      status: 'ready',
      sites: ['uk', 'es'],
      es: { title: 'Examen de mates', desc: 'Prepárate para el examen: llevadas, redondeo y valor posicional.' },
    },
    {
      slug: 'penalty-multiply',
      title: 'Пенальті-множення',
      emoji: '⚽',
      category: 'math',
      desc: 'Розв’яжи приклад і забий гол!',
      status: 'ready',
      sites: ['uk'],
      es: { title: 'Penaltis de multiplicar', desc: 'Resuelve la operación y ¡marca gol!' },
    },
    {
      slug: 'word-match',
      title: 'Слова UA–ES–EN',
      emoji: '🗣️',
      category: 'english',
      desc: 'М’яч, balón, ball — з’єднай переклади.',
      status: 'soon',
      sites: ['uk'],
      es: { title: 'Palabras ES–EN', desc: 'Balón, ball… ¡une las traducciones!' },
    },
    {
      slug: 'football-quiz',
      title: 'Футбольний квіз',
      emoji: '🏆',
      category: 'fun',
      desc: 'Чемпіонати, клуби, зірки й правила. Українською, español, English.',
      status: 'ready',
      sites: ['uk', 'es'],
      es: { title: 'Quiz de fútbol', desc: 'Campeonatos, clubes, estrellas y reglas. ¡A ver cuánto sabes!' },
    },
  ];

  const CATEGORIES = {
    math: { title: T('cat.math'), emoji: '🔢' },
    english: { title: T('cat.english'), emoji: '🇬🇧' },
    fun: { title: T('cat.fun'), emoji: '🎉' },
  };

  // Football cards. Manifest comes from shared/cards.js (window.KF_CARDS), loaded before kf.js;
  // without it the collection is simply empty. cat: common | futsal | rare | legend.
  const CARDS = Array.isArray(window.KF_CARDS) ? window.KF_CARDS : [];
  const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));
  // weight = chance (%) that a pack card is from this category; the card is then uniform within it.
  // sell = coins for selling one duplicate.
  const CARD_CATS = {
    common: { label: T('card.common'), weight: 75, sell: 2 },
    futsal: { label: T('card.futsal'), weight: 13, sell: 3 },
    rare: { label: T('card.rare'), weight: 10, sell: 5 },
    legend: { label: T('card.legend'), weight: 2, sell: 15 },
  };
  const catOf = (c) => (c && CARD_CATS[c.cat]) || CARD_CATS.common;

  const SCRIPT_SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '';
  const cardImg = (id, thumb) => {
    const rel = `../images/cards/${thumb ? 'thumb/' : ''}${id}.webp`;
    try {
      return SCRIPT_SRC ? new URL(rel, SCRIPT_SRC).href : rel.slice(1);
    } catch {
      return rel.slice(1);
    }
  };

  // Old emoji stickers -> cards (by player, first existing id wins). Others are refunded in coins.
  const STICKER_CARDS = {
    messi: ['lionel-messi'],
    ronaldo: ['cristiano-ronaldo'],
    yamal: ['lamine-yamal'],
    mbappe: ['kylian-mbappe'],
    haaland: ['erling-haaland'],
    vinicius: ['vinicius-junior', 'vinicius-jr', 'vinicius'],
    bellingham: ['jude-bellingham'],
    pedri: ['pedri'],
    courtois: ['thibaut-courtois'],
    'courtois-gold': ['thibaut-courtois'],
    terstegen: ['marc-andre-ter-stegen', 'ter-stegen'],
    kane: ['harry-kane'],
    salah: ['mohamed-salah'],
    lewandowski: ['robert-lewandowski'],
    debruyne: ['kevin-de-bruyne'],
    modric: ['luka-modric'],
    rodri: ['rodri'],
    vandijk: ['virgil-van-dijk'],
    gavi: ['gavi'],
  };
  const STICKER_REFUND = {
    messi: 10, ronaldo: 10, shevchenko: 10, 'courtois-gold': 10,
    yamal: 5, mbappe: 5, haaland: 5, mudryk: 5, vinicius: 5, bellingham: 5,
  };
  const REFUND_DEFAULT = 3;

  // Convert state.stickers once (idempotent: the key is deleted). Skipped while the manifest is missing.
  const migrateStickers = (s) => {
    const isMap = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
    if (!CARDS.length || !isMap(s.stickers)) return s;
    s.cards = { ...(isMap(s.cards) ? s.cards : {}) };
    let refund = 0;
    for (const [id, n] of Object.entries(s.stickers)) {
      const count = Number(n) || 0;
      const card = (STICKER_CARDS[id] || []).find((c) => CARD_BY_ID.has(c));
      if (card) s.cards[card] = (s.cards[card] || 0) + count;
      else refund += count * (STICKER_REFUND[id] || REFUND_DEFAULT);
    }
    s.coins = (s.coins || 0) + refund;
    delete s.stickers;
    return s;
  };

  const uniqueCards = (s) => Object.keys(s.cards).filter((id) => s.cards[id] > 0).length;
  const ownedOfCat = (s, cat) => CARDS.filter((c) => c.cat === cat && s.cards[c.id] > 0).length;
  const totalCorrect = (s) => s.stats.correct;
  const playedGames = (s) => s.stats.games;

  const ACHIEVEMENTS = [
    { id: 'first-game', icon: '🎽', title: T('first-game.title'), desc: T('first-game.desc'), check: (s) => playedGames(s) >= 1 },
    { id: 'goals-10', icon: '⚽', title: T('goals-10.title'), desc: T('goals-10.desc'), check: (s) => totalCorrect(s) >= 10 },
    { id: 'goals-50', icon: '🥅', title: T('goals-50.title'), desc: T('goals-50.desc'), check: (s) => totalCorrect(s) >= 50 },
    { id: 'goals-200', icon: '👟', title: T('goals-200.title'), desc: T('goals-200.desc'), check: (s) => totalCorrect(s) >= 200 },
    { id: 'perfect', icon: '💯', title: T('perfect.title'), desc: T('perfect.desc'), check: (s) => s.stats.perfect >= 1 },
    { id: 'streak-5', icon: '🔥', title: T('streak-5.title'), desc: T('streak-5.desc'), check: (s) => s.stats.bestStreak >= 5 },
    { id: 'streak-15', icon: '⚡', title: T('streak-15.title'), desc: T('streak-15.desc'), check: (s) => s.stats.bestStreak >= 15 },
    { id: 'games-10', icon: '📅', title: T('games-10.title'), desc: T('games-10.desc'), check: (s) => playedGames(s) >= 10 },
    { id: 'days-3', icon: '🗓️', title: T('days-3.title'), desc: T('days-3.desc'), check: (s) => s.stats.dayStreak >= 3 },
    { id: 'first-pack', icon: '🎁', title: T('first-pack.title'), desc: T('first-pack.desc'), check: (s) => s.stats.packs >= 1 },
    { id: 'album-10', icon: '📒', title: T('album-10.title'), desc: T('album-10.desc'), check: (s) => uniqueCards(s) >= 10 },
    { id: 'album-50', icon: '📚', title: T('album-50.title'), desc: T('album-50.desc'), check: (s) => uniqueCards(s) >= 50 },
    { id: 'album-full', icon: '🏆', title: T('album-full.title'), desc: T('album-full.desc'), check: (s) => CARDS.length > 0 && CARDS.every((c) => s.cards[c.id] > 0) },
    { id: 'legend', icon: '🌟', title: T('legend.title'), desc: T('legend.desc'), check: (s) => ownedOfCat(s, 'legend') >= 1 },
    { id: 'rare', icon: '💎', title: T('rare.title'), desc: T('rare.desc'), check: (s) => ownedOfCat(s, 'rare') >= 1 },
    { id: 'futsal', icon: '🥅', title: T('futsal.title'), desc: T('futsal.desc'), check: (s) => ownedOfCat(s, 'futsal') >= 5 },
    { id: 'ukraine-5', icon: '🟦', title: T('ukraine-5.title'), desc: T('ukraine-5.desc'), check: (s) => CARDS.filter((c) => c.ua && s.cards[c.id] > 0).length >= 5 },
    { id: 'ukraine', icon: '🇺🇦', title: T('ukraine.title'), desc: T('ukraine.desc'), check: (s) => CARDS.some((c) => c.ua) && CARDS.filter((c) => c.ua).every((c) => s.cards[c.id] > 0) },
    { id: 'keeper-wall', icon: '🧱', title: T('keeper-wall.title'), desc: T('keeper-wall.desc'), check: (s) => (s.gameData?.goalkeeper?.saves || 0) >= 25 },
    { id: 'keeper-gloves', icon: '🧤', title: T('keeper-gloves.title'), desc: T('keeper-gloves.desc'), check: (s) => (s.gameData?.goalkeeper?.gloves?.owned?.length || 0) >= 2 },
  ];

  const fresh = () => ({
    v: 1,
    coins: 0,
    cards: {}, // card id -> count
    achievements: {}, // id -> timestamp
    games: {}, // slug -> { plays, best, max, lastPlayed }
    gameData: {}, // slug -> game-specific saved data (KF.gameData)
    stats: { correct: 0, wrong: 0, games: 0, perfect: 0, streak: 0, bestStreak: 0, packs: 0, dayStreak: 0, lastDay: '' },
  });

  const merge = (base, data) => {
    const s = { ...base, ...data };
    s.stats = { ...base.stats, ...(data.stats || {}) };
    return migrateStickers(s);
  };

  const initial = () => {
    const s = fresh();
    if (TEST_MODE) s.coins = TEST_COINS;
    return s;
  };

  const readJSON = (key) => {
    try {
      const raw = store.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Logged-in user (never in test mode) and its sync slot { base, baseRev, dirty, outbox }.
  let user = TEST_MODE ? null : readJSON(USER_KEY);
  let sync = null;
  let authStatus = user ? 'pending' : 'guest';

  const load = () => {
    if (user) {
      const slot = readJSON(slotKey(user.id)) || {};
      sync = {
        base: merge(fresh(), slot.base || {}),
        baseRev: slot.baseRev || 0,
        dirty: !!slot.dirty,
        outbox: slot.outbox || [],
      };
      return merge(fresh(), slot.state || {});
    }
    sync = null;
    const data = readJSON(KEY);
    return data ? merge(fresh(), data) : initial();
  };

  let state = load();
  const listeners = {};

  const emit = (type, payload) => {
    for (const fn of listeners[type] || []) fn(payload);
  };

  const persist = () => {
    try {
      if (sync) store.setItem(slotKey(user.id), JSON.stringify({ state, ...sync }));
      else store.setItem(KEY, JSON.stringify(state));
    } catch {
      // storage full or disabled — progress lives only in memory
    }
  };

  const save = () => {
    if (sync) {
      sync.dirty = true;
      localVer++;
      if (authStatus !== 'expired') {
        setStatus('pending');
        schedulePush();
      }
    }
    persist();
    emit('change', state);
  };

  // Returns true if new achievements were added.
  const checkAchievements = () => {
    let added = false;
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id] || !a.check(state)) continue;
      state.achievements[a.id] = Date.now();
      added = true;
      emit('achievement', a);
    }
    return added;
  };

  const commit = () => {
    checkAchievements();
    save();
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const touchDay = () => {
    const day = today();
    const st = state.stats;
    if (st.lastDay === day) return;
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    st.dayStreak = st.lastDay === yesterday ? st.dayStreak + 1 : 1;
    st.lastDay = day;
  };

  const addCoins = (n) => {
    if (!n) return;
    state.coins = Math.max(0, state.coins + n);
    emit('coins', n);
  };

  const pickCard = () => {
    const byCat = {};
    for (const c of CARDS) (byCat[c.cat] ||= []).push(c);
    const cats = Object.keys(CARD_CATS).filter((k) => byCat[k]?.length);
    if (!cats.length) return null;
    let r = Math.random() * cats.reduce((sum, k) => sum + CARD_CATS[k].weight, 0);
    let cat = cats[cats.length - 1];
    for (const k of cats) {
      r -= CARD_CATS[k].weight;
      if (r < 0) {
        cat = k;
        break;
      }
    }
    const list = byCat[cat];
    return list[Math.floor(Math.random() * list.length)];
  };

  const addCard = (c) => {
    const isNew = !state.cards[c.id];
    state.cards[c.id] = (state.cards[c.id] || 0) + 1;
    return { ...c, isNew };
  };

  const sellOne = (c) => {
    if ((state.cards[c.id] || 0) < 2) return 0;
    state.cards[c.id]--;
    const gain = catOf(c).sell;
    addCoins(gain);
    return gain;
  };

  // ---- Server sync (logged-in users only; all network work is in the background) ----

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

  const uuid = () =>
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

  const isMaxPath = (p) =>
    (p[0] === 'stats' && p.length === 2 && p[1] === 'bestStreak') ||
    (p[0] === 'games' && p.length === 3 && ['best', 'max', 'lastPlayed'].includes(p[2]));

  // Three-way merge of two states that diverged from `base` (see BACKEND.md).
  const mergeVal = (b, l, s, path) => {
    if (typeof l === 'number' && typeof s === 'number') {
      return isMaxPath(path) ? Math.max(l, s) : s + (l - (typeof b === 'number' ? b : 0));
    }
    if (Array.isArray(l) && Array.isArray(s)) {
      const seen = new Set();
      return [...l, ...s].filter((x) => {
        const k = JSON.stringify(x);
        return seen.has(k) ? false : seen.add(k);
      });
    }
    if (isObj(l) && isObj(s)) {
      const bb = isObj(b) ? b : {};
      const out = {};
      for (const k of new Set([...Object.keys(l), ...Object.keys(s)])) {
        const inL = k in l;
        const inS = k in s;
        const sub = [...path, k];
        if (path.length === 0 && k === 'achievements') {
          // earliest timestamp wins, never lose one
          out[k] = { ...s[k], ...l[k] };
          for (const id of Object.keys(out[k])) {
            if (s[k]?.[id] && l[k]?.[id]) out[k][id] = Math.min(s[k][id], l[k][id]);
          }
        } else if (inL && inS) out[k] = mergeVal(bb[k], l[k], s[k], sub);
        else if (inL) {
          // gone on the server: drop only if local did not touch it
          if (!(k in bb && same(l[k], bb[k]))) out[k] = l[k];
        } else if (!(k in bb && same(s[k], bb[k]))) out[k] = s[k];
      }
      return out;
    }
    return same(l, b) ? s : l;
  };

  const merge3 = (base, local, server) => {
    const b = merge(fresh(), base || {});
    const l = merge(fresh(), local || {});
    const s = merge(fresh(), server || {});
    const out = mergeVal(b, l, s, []);
    // streaks belong together: take them from the side that played last
    const ld = l.stats.lastDay || '';
    const sd = s.stats.lastDay || '';
    const pick = ld > sd || (ld === sd && l.stats.streak >= s.stats.streak) ? l.stats : s.stats;
    for (const k of ['streak', 'dayStreak', 'lastDay']) out.stats[k] = pick[k];
    out.coins = Math.max(0, out.coins);
    // a card owned on any side is never lost (two devices may sell the same duplicate)
    for (const id of new Set([...Object.keys(b.cards), ...Object.keys(l.cards), ...Object.keys(s.cards)])) {
      if ((b.cards[id] >= 1 || l.cards[id] >= 1 || s.cards[id] >= 1) && !(out.cards[id] >= 1)) out.cards[id] = 1;
    }
    return out;
  };

  let pushTimer = 0;
  let retryTimer = 0;
  let failures = 0;
  let localVer = 0;
  let inflight = null;
  let syncing = null;
  let lastPull = 0;

  const setStatus = (status) => {
    if (status === authStatus) return;
    authStatus = status;
    emit('auth', { user, status });
  };

  const needsPush = () => !!sync && (sync.dirty || sync.outbox.length > 0);

  const api = async (method, path, body, keepalive) => {
    try {
      const res = await fetch(`/api${path}`, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        keepalive: keepalive || undefined,
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        // empty body (204) or not JSON
      }
      return { status: res.status, data: data || {} };
    } catch {
      return { status: 0, data: {} };
    }
  };

  // Network/auth failure: 401 => ask for the PIN again, otherwise retry later with backoff.
  const fail = (status) => {
    if (status === 401) {
      setStatus('expired');
      return;
    }
    failures++;
    setStatus('offline');
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => syncNow(), Math.min(300000, 5000 * 2 ** (failures - 1)));
  };

  // Take the server state (at `rev`) into the local copy, merging unsent local changes.
  const absorb = (remoteState, rev) => {
    const remote = merge(fresh(), remoteState || {});
    // Copies: `state` is mutated in place by games, `sync.base` must stay as the server had it.
    if (needsPush()) {
      state = clone(merge3(sync.base, state, remote));
      sync.dirty = true;
    } else {
      state = clone(remote);
    }
    sync.base = remote;
    sync.baseRev = rev;
    if (checkAchievements()) sync.dirty = true;
    localVer++;
    persist();
    emit('change', state);
  };

  const dropResults = (sent) => {
    const ids = new Set(sent.map((r) => r.id));
    sync.outbox = sync.outbox.filter((r) => !ids.has(r.id));
  };

  const doPush = async (keepalive) => {
    clearTimeout(pushTimer);
    const uid = user?.id;
    for (let i = 0; i < 4 && user?.id === uid && authStatus !== 'expired'; i++) {
      if (!needsPush()) break;
      const ver = localVer;
      const sent = clone(state);
      const results = sync.outbox.slice(0, 100);
      const r = await api('PUT', '/progress', { baseRev: sync.baseRev, state: sent, results }, keepalive && i === 0);
      if (user?.id !== uid) return false;
      if (r.status === 200) {
        failures = 0;
        dropResults(results);
        sync.base = sent;
        sync.baseRev = r.data.rev;
        sync.dirty = localVer !== ver;
        persist();
      } else if (r.status === 409) {
        dropResults(results);
        absorb(r.data.state, r.data.rev);
      } else {
        fail(r.status);
        return false;
      }
    }
    if (user && !needsPush()) {
      setStatus('synced');
      return true;
    }
    if (user && authStatus === 'pending') schedulePush();
    return false;
  };

  const flush = (keepalive) => {
    if (!user || !sync) return Promise.resolve(false);
    inflight ||= doPush(keepalive)
      .catch(() => false)
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };

  const schedulePush = () => {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => flush(), PUSH_DELAY);
  };

  const pull = async () => {
    const r = await api('GET', '/progress');
    if (!user) return;
    if (r.status !== 200) return fail(r.status);
    if (inflight) return; // a push started meanwhile; it will reconcile
    failures = 0;
    if (r.data.state && r.data.rev !== sync.baseRev) absorb(r.data.state, r.data.rev);
    lastPull = Date.now();
    setStatus(needsPush() ? 'pending' : 'synced');
  };

  // Pull, then push whatever is left. Safe to call any time.
  const syncNow = () => {
    syncing ||= (async () => {
      if (inflight) await inflight;
      if (!user) return;
      await pull();
      if (user && needsPush() && authStatus !== 'expired') await flush();
    })()
      .catch(() => {})
      .finally(() => {
        syncing = null;
      });
    return syncing;
  };

  const guestState = () => {
    const data = TEST_MODE ? null : readJSON(REAL_KEY);
    return data ? merge(fresh(), data) : fresh();
  };

  // Shared by login() and register(): the server session is already set.
  const startSession = async (u, hasGuestProgress) => {
    user = u;
    try {
      store.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // memory only
    }
    state = load();
    persist();
    failures = 0;
    authStatus = 'pending';
    emit('change', state);
    emit('auth', { user, status: authStatus });
    await syncNow();
    return { ok: true, user, hasGuestProgress };
  };

  const auth = {
    get user() {
      return user;
    },
    get status() {
      return authStatus;
    },

    async users() {
      if (TEST_MODE) return { ok: false, error: 'test_mode' };
      const r = await api('GET', '/users');
      return r.status === 200 ? { ok: true, users: r.data.users || [] } : { ok: false, error: r.data.error || 'network' };
    },

    async login(userId, pin) {
      if (TEST_MODE) return { ok: false, error: 'test_mode' };
      const hasGuestProgress = auth.hasGuestProgress();
      const r = await api('POST', '/login', { userId, pin });
      if (r.status !== 200) {
        const { error, attemptsLeft, retryAfter } = r.data;
        return { ok: false, error: error || 'network', attemptsLeft, retryAfter, hasGuestProgress };
      }
      return startSession(r.data.user, hasGuestProgress);
    },

    // Self-registration: creates the account and logs in.
    async register(name, pin, avatar) {
      if (TEST_MODE) return { ok: false, error: 'test_mode' };
      const hasGuestProgress = auth.hasGuestProgress();
      const r = await api('POST', '/register', { name, pin, avatar });
      if (r.status !== 201) {
        const { error, retryAfter } = r.data;
        return { ok: false, error: error || 'network', retryAfter, hasGuestProgress };
      }
      return startSession(r.data.user, hasGuestProgress);
    },

    // Guest state differs from a fresh one.
    hasGuestProgress: () => !TEST_MODE && !same(guestState(), fresh()),

    // Add the guest progress to the logged-in user and clear the guest copy.
    adoptGuest() {
      if (!user) return false;
      state = merge3(fresh(), guestState(), state);
      try {
        store.removeItem(REAL_KEY);
      } catch {
        // ignore
      }
      commit();
      return true;
    },

    // force: push once (max ~3 s), then log out even if changes could not be sent.
    async logout({ force = false } = {}) {
      if (!user) return { ok: true, lost: false };
      if (needsPush() && authStatus !== 'expired') {
        await (force ? Promise.race([flush(), new Promise((r) => setTimeout(r, 3000))]) : flush());
      }
      const lost = needsPush();
      if (lost && !force) return { ok: false };
      const id = user.id;
      await (force ? Promise.race([api('POST', '/logout', {}), new Promise((r) => setTimeout(r, 3000))]) : api('POST', '/logout', {}));
      clearTimeout(pushTimer);
      clearTimeout(retryTimer);
      try {
        store.removeItem(USER_KEY);
        if (force) store.removeItem(slotKey(id));
      } catch {
        // ignore
      }
      user = null;
      state = load();
      authStatus = 'guest';
      emit('change', state);
      emit('auth', { user, status: authStatus });
      return { ok: true, lost };
    },
  };

  const KF = {
    lang: LANG,
    i18n,
    GAMES,
    CATEGORIES,
    CARDS,
    CARD_CATS,
    ACHIEVEMENTS,
    PACK_PRICE,
    PACK_SIZE,
    TEST_MODE,
    AVATARS,
    auth,
    _merge3: merge3,

    get: () => state,

    // 'ready' games for everyone, 'beta' only in test mode.
    isPlayable: (game) => game.status === 'ready' || (TEST_MODE && game.status === 'beta'),
    isListed: (game) => game.status !== 'beta' || TEST_MODE,

    // Games of the current site (KF.lang) that are listed, with title/desc in the site language.
    siteGames: () =>
      GAMES.filter((g) => g.sites.includes(LANG) && (g.status !== 'beta' || TEST_MODE)).map((g) => ({
        ...g,
        title: g.es && LANG === 'es' ? g.es.title : g.title,
        desc: g.es && LANG === 'es' ? g.es.desc : g.desc,
      })),

    on(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
      return () => {
        listeners[type] = listeners[type].filter((f) => f !== fn);
      };
    },

    // Call on every answer. Correct answer = +1 coin, unless { coin: false }
    // (games with their own coin rule, e.g. the quiz: 1 coin per 5 correct).
    answer(_slug, correct, { coin = true } = {}) {
      const st = state.stats;
      if (correct) {
        st.correct++;
        st.streak++;
        st.bestStreak = Math.max(st.bestStreak, st.streak);
        if (coin) addCoins(1);
      } else {
        st.wrong++;
        st.streak = 0;
      }
      commit();
    },

    // Call at the end of a round. Perfect round = +5 bonus coins.
    finishGame(slug, { score = 0, max = 0 } = {}) {
      const st = state.stats;
      if (!state.games[slug]) state.games[slug] = { plays: 0, best: 0, max, lastPlayed: 0 };
      const g = state.games[slug];
      g.plays++;
      g.best = Math.max(g.best, score);
      g.max = max;
      g.lastPlayed = Date.now();
      if (sync) sync.outbox.push({ id: uuid(), slug, score, max, at: Date.now() });
      st.games++;
      touchDay();
      const perfect = max > 0 && score === max;
      if (perfect) {
        st.perfect++;
        addCoins(5);
      }
      commit();
      return { perfect, coins: state.coins };
    },

    addCoins(n) {
      addCoins(n);
      commit();
    },

    // Spend coins in a game shop. Returns false (and changes nothing) if not enough.
    spendCoins(n) {
      if (n <= 0 || state.coins < n) return false;
      addCoins(-n);
      commit();
      return true;
    },

    // Give a specific card (e.g. a game reward). Returns { ...card, isNew } or null for an unknown id.
    // Emits 'card' with the same object.
    giveCard(id) {
      const c = CARD_BY_ID.get(id);
      if (!c) return null;
      const got = addCard(c);
      emit('card', got);
      commit();
      return got;
    },

    cardImg,

    // Game-specific persistent data (plain JSON). Respects test mode.
    //   const d = KF.gameData('math-exam');  KF.gameData('math-exam', { ...d, x: 1 });
    gameData(slug, value) {
      if (value === undefined) return state.gameData[slug] || {};
      state.gameData[slug] = value;
      commit();
      return value;
    },

    canBuyPack: () => state.coins >= PACK_PRICE,

    // Returns [{ ...card, isNew }] (PACK_SIZE cards) or null if not enough coins / no cards.
    // Emits one 'pack' event with that array (no per-card 'card' events).
    openPack() {
      if (state.coins < PACK_PRICE || !CARDS.length) return null;
      addCoins(-PACK_PRICE);
      const got = [];
      for (let i = 0; i < PACK_SIZE; i++) got.push(addCard(pickCard()));
      state.stats.packs++;
      emit('pack', got);
      commit();
      return got;
    },

    // Total extra copies (count - 1 for every owned card).
    duplicates: () => Object.values(state.cards).reduce((sum, n) => sum + Math.max(0, n - 1), 0),

    // Sell ONE extra copy (never the last one). Returns coins gained (0 if no duplicate).
    sellDuplicate(id) {
      const c = CARD_BY_ID.get(id);
      const gain = c ? sellOne(c) : 0;
      if (gain) commit();
      return gain;
    },

    // Sell all extra copies. Returns total coins gained.
    sellAllDuplicates() {
      let total = 0;
      for (const c of CARDS) while ((state.cards[c.id] || 0) > 1) total += sellOne(c);
      if (total) commit();
      return total;
    },

    // Progress transfer between devices: short base64 code.
    exportCode: () => btoa(unescape(encodeURIComponent(JSON.stringify(state)))),

    importCode(code) {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
        if (!data || data.v !== 1) return false;
        state = merge(fresh(), data);
        commit();
        return true;
      } catch {
        return false;
      }
    },

    reset() {
      state = initial();
      save();
    },
  };

  // Sync between open tabs (real progress only; the test sandbox is per-tab).
  window.addEventListener('storage', (e) => {
    if (TEST_MODE) return;
    if (e.key === USER_KEY || e.key === null) {
      user = readJSON(USER_KEY);
      state = load();
      if (!user) authStatus = 'guest';
      else if (authStatus === 'guest') authStatus = 'pending';
      emit('change', state);
      emit('auth', { user, status: authStatus });
    } else if (e.key === (user ? slotKey(user.id) : KEY)) {
      state = load();
      emit('change', state);
    }
  });

  if (!TEST_MODE) {
    // Pull on load/focus/online, push when the page is hidden.
    const refresh = () => {
      if (Date.now() - lastPull > 3000) syncNow();
    };
    window.addEventListener('online', () => {
      failures = 0;
      syncNow();
    });
    window.addEventListener('focus', refresh);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          if (needsPush() && authStatus !== 'expired') flush(true);
        } else refresh();
      });
    }
    if (user) syncNow();
  }

  window.KF = KF;
})();
