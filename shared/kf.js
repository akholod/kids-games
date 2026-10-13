// Keeper Fun Games — shared progress core (coins, sticker album, achievements).
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
  const PACK_SIZE = 3;

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
  const KEY = TEST_MODE ? TEST_KEY : REAL_KEY;
  const store = TEST_MODE ? sessionStorage : localStorage;

  // Catalog registry. status: 'ready' | 'beta' (visible only in test mode) | 'soon'
  const GAMES = [
    {
      slug: 'math-exam',
      title: 'Examen de mates',
      emoji: '📝',
      category: 'math',
      desc: 'Готуємось до іспиту: llevadas, redondeo, valor.',
      status: 'ready',
    },
    {
      slug: 'penalty-multiply',
      title: 'Пенальті-множення',
      emoji: '⚽',
      category: 'math',
      desc: 'Розв’яжи приклад і забий гол!',
      status: 'ready',
    },
    {
      slug: 'word-match',
      title: 'Слова UA–ES–EN',
      emoji: '🗣️',
      category: 'english',
      desc: 'М’яч, balón, ball — з’єднай переклади.',
      status: 'soon',
    },
    {
      slug: 'football-quiz',
      title: 'Футбольний квіз',
      emoji: '🏆',
      category: 'fun',
      desc: 'Прапори, клуби та зірки футболу.',
      status: 'soon',
    },
  ];

  const CATEGORIES = {
    math: { title: 'Математика', emoji: '🔢' },
    english: { title: 'Англійська', emoji: '🇬🇧' },
    fun: { title: 'Футбол-розваги', emoji: '🎉' },
  };

  // rarity: common | rare | legend
  const STICKERS = [
    { id: 'messi', name: 'Messi', flag: '🇦🇷', pos: 'FW', num: 10, color: '#75aadb', rarity: 'legend' },
    { id: 'ronaldo', name: 'Ronaldo', flag: '🇵🇹', pos: 'FW', num: 7, color: '#c8102e', rarity: 'legend' },
    { id: 'shevchenko', name: 'Shevchenko', flag: '🇺🇦', pos: 'FW', num: 7, color: '#ffd500', rarity: 'legend' },
    { id: 'yamal', name: 'Lamine Yamal', flag: '🇪🇸', pos: 'FW', num: 19, color: '#a50044', rarity: 'rare' },
    { id: 'mbappe', name: 'Mbappé', flag: '🇫🇷', pos: 'FW', num: 10, color: '#1d3f8f', rarity: 'rare' },
    { id: 'haaland', name: 'Haaland', flag: '🇳🇴', pos: 'FW', num: 9, color: '#6cabdd', rarity: 'rare' },
    { id: 'mudryk', name: 'Mudryk', flag: '🇺🇦', pos: 'FW', num: 10, color: '#034694', rarity: 'rare' },
    { id: 'vinicius', name: 'Vinícius Jr', flag: '🇧🇷', pos: 'FW', num: 7, color: '#febe10', rarity: 'rare' },
    { id: 'bellingham', name: 'Bellingham', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'MF', num: 5, color: '#ffffff', rarity: 'rare' },
    { id: 'pedri', name: 'Pedri', flag: '🇪🇸', pos: 'MF', num: 8, color: '#004d98', rarity: 'common' },
    { id: 'dovbyk', name: 'Dovbyk', flag: '🇺🇦', pos: 'FW', num: 11, color: '#8e1f2f', rarity: 'common' },
    { id: 'zinchenko', name: 'Zinchenko', flag: '🇺🇦', pos: 'DF', num: 17, color: '#ffd500', rarity: 'common' },
    { id: 'lunin', name: 'Lunin', flag: '🇺🇦', pos: 'GK', num: 13, color: '#0057b7', rarity: 'common' },
    { id: 'courtois', name: 'Courtois', flag: '🇧🇪', pos: 'GK', num: 1, color: '#e30613', rarity: 'common' },
    { id: 'terstegen', name: 'ter Stegen', flag: '🇩🇪', pos: 'GK', num: 1, color: '#a50044', rarity: 'common' },
    { id: 'kane', name: 'Kane', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'FW', num: 9, color: '#dc052d', rarity: 'common' },
    { id: 'salah', name: 'Salah', flag: '🇪🇬', pos: 'FW', num: 11, color: '#c8102e', rarity: 'common' },
    { id: 'lewandowski', name: 'Lewandowski', flag: '🇵🇱', pos: 'FW', num: 9, color: '#004d98', rarity: 'common' },
    { id: 'debruyne', name: 'De Bruyne', flag: '🇧🇪', pos: 'MF', num: 17, color: '#6cabdd', rarity: 'common' },
    { id: 'modric', name: 'Modrić', flag: '🇭🇷', pos: 'MF', num: 10, color: '#ffffff', rarity: 'common' },
    { id: 'rodri', name: 'Rodri', flag: '🇪🇸', pos: 'MF', num: 16, color: '#c60b1e', rarity: 'common' },
    { id: 'vandijk', name: 'van Dijk', flag: '🇳🇱', pos: 'DF', num: 4, color: '#f36c21', rarity: 'common' },
    { id: 'gavi', name: 'Gavi', flag: '🇪🇸', pos: 'MF', num: 6, color: '#a50044', rarity: 'common' },
    { id: 'sudakov', name: 'Sudakov', flag: '🇺🇦', pos: 'MF', num: 10, color: '#f37021', rarity: 'common' },
  ];

  const RARITY_WEIGHT = { common: 70, rare: 25, legend: 5 };

  const uniqueStickers = (s) => Object.keys(s.stickers).length;
  const totalCorrect = (s) => s.stats.correct;
  const playedGames = (s) => s.stats.games;

  const ACHIEVEMENTS = [
    { id: 'first-game', icon: '🎽', title: 'Перший матч', desc: 'Зіграй першу гру', check: (s) => playedGames(s) >= 1 },
    { id: 'goals-10', icon: '⚽', title: '10 голів', desc: 'Дай 10 правильних відповідей', check: (s) => totalCorrect(s) >= 10 },
    { id: 'goals-50', icon: '🥅', title: 'Бомбардир', desc: '50 правильних відповідей', check: (s) => totalCorrect(s) >= 50 },
    { id: 'goals-200', icon: '👟', title: 'Золота бутса', desc: '200 правильних відповідей', check: (s) => totalCorrect(s) >= 200 },
    { id: 'perfect', icon: '💯', title: 'Сухий матч', desc: 'Пройди гру без жодної помилки', check: (s) => s.stats.perfect >= 1 },
    { id: 'streak-5', icon: '🔥', title: 'Серія 5', desc: '5 правильних відповідей поспіль', check: (s) => s.stats.bestStreak >= 5 },
    { id: 'streak-15', icon: '⚡', title: 'Нестримний', desc: '15 правильних відповідей поспіль', check: (s) => s.stats.bestStreak >= 15 },
    { id: 'games-10', icon: '📅', title: 'Сезон', desc: 'Зіграй 10 ігор', check: (s) => playedGames(s) >= 10 },
    { id: 'days-3', icon: '🗓️', title: 'Тренування 3 дні', desc: 'Грай 3 дні поспіль', check: (s) => s.stats.dayStreak >= 3 },
    { id: 'first-pack', icon: '🎁', title: 'Перший пакунок', desc: 'Відкрий пакунок наліпок', check: (s) => s.stats.packs >= 1 },
    { id: 'album-10', icon: '📒', title: 'Колекціонер', desc: 'Збери 10 різних наліпок', check: (s) => uniqueStickers(s) >= 10 },
    { id: 'album-full', icon: '🏆', title: 'Повний альбом', desc: 'Збери всі наліпки', check: (s) => uniqueStickers(s) >= STICKERS.length },
    { id: 'legend', icon: '🌟', title: 'Легенда!', desc: 'Знайди легендарну наліпку', check: (s) => STICKERS.some((x) => x.rarity === 'legend' && s.stickers[x.id]) },
    { id: 'ukraine', icon: '🇺🇦', title: 'Збірна України', desc: 'Збери всіх українців', check: (s) => STICKERS.filter((x) => x.flag === '🇺🇦').every((x) => s.stickers[x.id]) },
  ];

  const fresh = () => ({
    v: 1,
    coins: 0,
    stickers: {}, // id -> count
    achievements: {}, // id -> timestamp
    games: {}, // slug -> { plays, best, max, lastPlayed }
    gameData: {}, // slug -> game-specific saved data (KF.gameData)
    stats: { correct: 0, wrong: 0, games: 0, perfect: 0, streak: 0, bestStreak: 0, packs: 0, dayStreak: 0, lastDay: '' },
  });

  const merge = (base, data) => {
    const s = { ...base, ...data };
    s.stats = { ...base.stats, ...(data.stats || {}) };
    return s;
  };

  const initial = () => {
    const s = fresh();
    if (TEST_MODE) s.coins = TEST_COINS;
    return s;
  };

  const load = () => {
    try {
      const raw = store.getItem(KEY);
      return raw ? merge(fresh(), JSON.parse(raw)) : initial();
    } catch {
      return initial();
    }
  };

  let state = load();
  const listeners = {};

  const emit = (type, payload) => {
    for (const fn of listeners[type] || []) fn(payload);
  };

  const save = () => {
    try {
      store.setItem(KEY, JSON.stringify(state));
    } catch {
      // storage full or disabled — progress lives only in memory
    }
    emit('change', state);
  };

  const checkAchievements = () => {
    for (const a of ACHIEVEMENTS) {
      if (state.achievements[a.id] || !a.check(state)) continue;
      state.achievements[a.id] = Date.now();
      emit('achievement', a);
    }
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

  const pickSticker = () => {
    const total = STICKERS.reduce((sum, x) => sum + RARITY_WEIGHT[x.rarity], 0);
    let r = Math.random() * total;
    for (const x of STICKERS) {
      r -= RARITY_WEIGHT[x.rarity];
      if (r < 0) return x;
    }
    return STICKERS[STICKERS.length - 1];
  };

  const KF = {
    GAMES,
    CATEGORIES,
    STICKERS,
    ACHIEVEMENTS,
    PACK_PRICE,
    PACK_SIZE,
    TEST_MODE,

    get: () => state,

    // 'ready' games for everyone, 'beta' only in test mode.
    isPlayable: (game) => game.status === 'ready' || (TEST_MODE && game.status === 'beta'),
    isListed: (game) => game.status !== 'beta' || TEST_MODE,

    on(type, fn) {
      (listeners[type] ||= []).push(fn);
      return () => {
        listeners[type] = listeners[type].filter((f) => f !== fn);
      };
    },

    // Call on every answer. Correct answer = +1 coin.
    answer(_slug, correct) {
      const st = state.stats;
      if (correct) {
        st.correct++;
        st.streak++;
        st.bestStreak = Math.max(st.bestStreak, st.streak);
        addCoins(1);
      } else {
        st.wrong++;
        st.streak = 0;
      }
      commit();
    },

    // Call at the end of a round. Perfect round = +5 bonus coins.
    finishGame(slug, { score = 0, max = 0 } = {}) {
      const st = state.stats;
      const g = (state.games[slug] ||= { plays: 0, best: 0, max, lastPlayed: 0 });
      g.plays++;
      g.best = Math.max(g.best, score);
      g.max = max;
      g.lastPlayed = Date.now();
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

    // Game-specific persistent data (plain JSON). Respects test mode.
    //   const d = KF.gameData('math-exam');  KF.gameData('math-exam', { ...d, x: 1 });
    gameData(slug, value) {
      if (value === undefined) return state.gameData[slug] || {};
      state.gameData[slug] = value;
      save();
      return value;
    },

    canBuyPack: () => state.coins >= PACK_PRICE,

    // Returns [{ ...sticker, isNew }] or null if not enough coins.
    openPack() {
      if (state.coins < PACK_PRICE) return null;
      addCoins(-PACK_PRICE);
      const got = [];
      for (let i = 0; i < PACK_SIZE; i++) {
        const x = pickSticker();
        const isNew = !state.stickers[x.id];
        state.stickers[x.id] = (state.stickers[x.id] || 0) + 1;
        got.push({ ...x, isNew });
      }
      state.stats.packs++;
      commit();
      return got;
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
    if (TEST_MODE || e.key !== KEY) return;
    state = load();
    emit('change', state);
  });

  window.KF = KF;
})();
