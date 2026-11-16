// What's new: one entry per piece of new content, shown once to every player in a dialog on the catalog
// (KF.news(); loaded on the catalog only, before kf.js). Add an entry whenever a game, a feature or a
// big content update is released to the kids; `date` = release day (YYYY-MM-DD; a future date waits).
// Entries older than KF.NEWS_DAYS are not shown any more and can be removed.
// Fields: id (unique, never reused), date, sites ('uk' | 'es'), icon (emoji), optional game (slug: the item
// opens it; hidden while that game is not listed on the site) or link (a catalog hash, e.g. '#creatures'),
// and { title, text } per site language (es: Spain Spanish, «tú», no Cyrillic).
window.KF_NEWS = [
  {
    id: 'lengua-poemas',
    date: '2026-11-16',
    sites: ['uk', 'es'],
    icon: '📝',
    game: 'lengua-poemas',
    uk: {
      title: 'Нова гра: La liga de las palabras',
      text: 'Готуйся до іспиту з Lengua: суфікси, B і V, займенники та скоромовки. Стань воротарем!',
    },
    es: {
      title: 'Nuevo juego: La liga de las palabras',
      text: 'Prepara el examen de Lengua: sufijos, b y v, pronombres y trabalenguas. ¡Haz grandes paradas!',
    },
  },
  {
    id: 'cultura-asturiana',
    date: '2026-11-08',
    sites: ['uk', 'es'],
    icon: '🐄',
    game: 'cultura-asturiana',
    uk: {
      title: 'Нова гра: Cultura asturiana',
      text: 'Нагодуй гочу, приготуй качопо, знайди слова — і будь готовий до іспиту.',
    },
    es: {
      title: 'Nuevo juego: Cultura asturiana',
      text: 'Dale de comer al gochu, cocina un cachopo, busca palabras… ¡y prepara el examen!',
    },
  },
  {
    id: 'creatures',
    date: '2026-11-08',
    sites: ['uk', 'es'],
    icon: '🐲',
    link: '#creatures',
    uk: {
      title: 'Нова колекція: істоти',
      text: '300 карток з двома сторонами. Купи пакунок за монети й переверни картку!',
    },
    es: {
      title: 'Nueva colección: criaturas',
      text: '300 cartas con dos caras. ¡Compra un sobre con monedas y dale la vuelta!',
    },
  },
];
