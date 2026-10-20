// «Dictado del míster» — Spanish spelling (ortografía) for 3.º de Primaria: the coach dictates (pre-recorded es-ES clips),
// the player writes. Every spelling rule is a station of the exam engine (shared/exam/); the final «Dictado del partido»
// is typed with the on-screen keyboard. Content is Spanish on both sites; the uk site gets Ukrainian prompts and rule tips.
//
// Word and sentence notation: [x] marks the tricky spot (the gap), [x:y,z] gives its own wrong choices instead of the
// rule's ALTS, [:h] = nothing goes here (the wrong choice is an h). Words that sound like another word (HOMOPHONES) are
// never dictated alone — only inside a sentence.
//
// Generated task types (types.js; key = word key, so one round never asks the same word twice):
//   gap    hear the word, pick the missing letter(s)          pick   hear the word, pick the right spelling
//   tiles  hear the word, build it from letter tiles          tilde  hear the word, tap the vowel with the tilde
//   cloze  hear a sentence, fill its gaps                     spot   read a sentence, find the mistake
//   write  hear the word, type it (only in the final: station rounds never take it)
// window.DC_CONTENT is a DCContent (types/dictado.d.ts).
'use strict';

window.DC_CONTENT = /** @type {DCContent} */ (
  (() => {
    const ES = KF.lang === 'es';

    // Sound-alikes in Spain Spanish (b = v, silent h, ll = y, diacritic tilde). Asturias tells s from z/c, so casa/caza
    // are not here.
    const HOMOPHONES = (
      'hola ola vaca baca tubo tuvo hecho echo hay ay ahí hasta asta bello vello botar votar bota vota botas votas ' +
      'haya halla aya vaya valla baya calló cayó callo cayo rayo rallo hierba hierva grabar gravar onda honda hora ora ' +
      'horas oras ojear hojear errar herrar uso huso sabia savia rebelar revelar barón varón bienes vienes basta vasta ' +
      'basto vasto cabo cavo grabe grave callado cayado pollo poyo rallar rayar deshecho desecho he e ha a abría habría ' +
      'vaso baso olla hoya malla maya arroyo arrollo hala ala hierro yerro gira jira mayo mallo el él tu tú mi mí si sí ' +
      'te té se sé de dé mas más'
    ).split(' ');

    /**
     * @typedef {{ id: string, title: string, icon: string, hue: string, tip: { es: string, uk: string },
     *   alts: Record<string, string[]>, words: string[], sentences: string[] }} RuleSrc
     */
    /** @type {RuleSrc[]} */
    const RULES = [
      {
        id: 'mayusculas',
        title: 'Mayúsculas y punto',
        icon: '🔠',
        hue: '#c2413b',
        tip: {
          es: 'Con mayúscula: al empezar y en los nombres de personas, ciudades y equipos. Los días y los meses, con minúscula.',
          uk: 'З великої: початок речення, імена людей, міст і команд. Дні й місяці в іспанській — з маленької: lunes, enero.',
        },
        alts: { '.': ['?', ','] }, // letters: the other case (see altsOf)
        words: [
          '[O]viedo',
          '[G]ijón',
          '[A]sturias',
          '[E]spaña',
          '[M]arta',
          '[P]ablo',
          '[L]ucía',
          '[S]porting',
          '[l]unes',
          '[s]ábado',
          '[e]nero',
          '[o]ctubre',
          '[c]olegio',
          '[e]quipo',
          '[p]ortero',
        ],
        sentences: [
          '[E]l Real Oviedo juega hoy en [G]ijón[.]',
          '[M]arta y [P]ablo van al colegio[.]',
          '[E]l [l]unes tenemos partido[.]',
          '[M]i amigo [H]ugo vive en [A]sturias.',
          '[E]n [e]nero hace frío en [O]viedo.',
          '[L]ucía es la portera del equipo[.]',
          '[E]l árbitro pita el final[.]',
        ],
      },
      {
        id: 'mp-mb',
        title: 'm antes de p y b',
        icon: '🥁',
        hue: '#d0702f',
        tip: {
          es: 'Antes de p y b se escribe m: campo, también.',
          uk: 'Перед p і b завжди пишемо m, а не n: campo, también.',
        },
        alts: { m: ['n'] },
        words: [
          'ca[m]po',
          'ta[m]bién',
          'ca[m]bio',
          'tie[m]po',
          'ca[m]peón',
          'co[m]pañero',
          'li[m]pio',
          'e[m]pate',
          'e[m]pezar',
          'so[m]brero',
          'i[m]portante',
          'sie[m]pre',
          'ta[m]bor',
          'ho[m]bro',
          'no[m]bre',
          'co[m]prar',
        ],
        sentences: [
          'El equipo e[m]pieza el partido a tie[m]po.',
          'Ta[m]bién juega mi co[m]pañero.',
          'El ca[m]po está li[m]pio.',
          'El ca[m]peón no quiere un e[m]pate.',
          'Tengo ha[m]bre después del partido.',
          'Mi no[m]bre está en la camiseta.',
          'Sie[m]pre llevo el ta[m]bor al ca[m]po.',
        ],
      },
      {
        id: 'r-rr',
        title: 'r y rr',
        icon: '🐸',
        hue: '#2e8a4e',
        tip: {
          es: 'Al principio de palabra, r: rana. Entre vocales, el sonido fuerte es rr: perro. Después de n, una r: Enrique.',
          uk: 'На початку слова — одна r, хоч звук сильний: rana. Між голосними сильний звук — rr: perro. Після n — одна r.',
        },
        alts: { r: ['rr'], rr: ['r'] },
        words: [
          '[r]ana',
          '[r]atón',
          '[r]ojo',
          '[r]ueda',
          '[r]ápido',
          'pe[rr]o',
          'to[rr]e',
          'ba[rr]o',
          'ca[rr]era',
          'a[rr]iba',
          'co[rr]er',
          'son[r]isa',
          'En[r]ique',
          'porte[r]ía',
          'ma[r]iposa',
        ],
        sentences: [
          'La [r]ana co[rr]e por el [r]ío.',
          'El pe[rr]o mira la porte[r]ía.',
          'La to[rr]e está a[rr]iba.',
          'El equipo [r]ojo ganó la ca[rr]era.',
          'En[r]ique tiene una gran son[r]isa.',
          'El balón [r]ueda muy [r]ápido.',
        ],
      },
      {
        id: 'c-qu',
        title: 'c y qu',
        icon: '🧀',
        hue: '#b0892a',
        tip: {
          es: 'El sonido /k/: ca, co, cu se escriben con c; que, qui, con qu (la u no suena).',
          uk: 'Звук «к»: ca, co, cu — через c; que, qui — через qu (u не читається).',
        },
        alts: { c: ['qu', 'k'], qu: ['c', 'k'] },
        words: [
          '[c]asa',
          '[c]ama',
          '[c]opa',
          '[c]amiseta',
          'es[c:k,q]uela',
          '[c:k,q]uaderno',
          '[qu]eso',
          '[qu]ince',
          'e[qu]ipo',
          'a[qu]í',
          'pe[qu]eño',
          'pa[qu]ete',
          'ra[qu]eta',
          'es[qu]ina',
          'bos[qu]e',
          'mos[qu]ito',
        ],
        sentences: [
          'El e[qu]ipo juega en el [c]ampo.',
          '[Qu]iero una ra[qu]eta nueva.',
          'La es[c]uela está a[qu]í.',
          'El balón pasó por la es[qu]ina.',
          'Mi hermano pe[qu]eño come [qu]eso.',
          'Hay un mos[qu]ito en el bos[qu]e.',
        ],
      },
      {
        id: 'c-z',
        title: 'c y z',
        icon: '🦊',
        hue: '#c25a2f',
        tip: {
          es: 'Za, zo, zu se escriben con z; ce, ci, con c. Si una palabra acaba en z, el plural lleva c: pez, peces.',
          uk: 'za, zo, zu — через z; ce, ci — через c. Слово на z у множині пишеться з c: pez → peces.',
        },
        alts: { c: ['z', 's'], z: ['c', 's'] },
        words: [
          '[c]ero',
          '[c]ena',
          '[c]ielo',
          '[c]ine',
          'do[c]e',
          'on[c]e',
          '[z]apato',
          '[z]orro',
          '[z]umo',
          '[z]urdo',
          'a[z]ul',
          'pla[z]a',
          'cabe[z]a',
          'pe[z]',
          'pe[c]es',
          'lu[z]',
          'lu[c]es',
          'lápi[z]',
          'nari[z]',
          'feli[z]',
        ],
        sentences: [
          'El [z]orro vio un pe[z] en el río.',
          'Hay lu[c]es en la pla[z]a.',
          'El portero lleva [z]apatos a[z]ules.',
          'Los pe[c]es nadan en el agua.',
          'El jugador [z]urdo marca de cabe[z]a.',
          'Somos on[c]e y estamos feli[c]es.',
          'Mi lápi[z] es a[z]ul.',
        ],
      },
      {
        id: 'g-gu',
        title: 'g, gu y gü',
        icon: '🐧',
        hue: '#1f6fb8',
        tip: {
          es: 'Ga, go, gu con g; gue, gui con gu (la u no suena). Si la u suena, lleva diéresis: pingüino.',
          uk: 'ga, go, gu — через g; gue, gui — через gu (u не читається). Якщо u читається — дві крапки: pingüino.',
        },
        alts: { g: ['gu', 'j'], gu: ['g'], gü: ['gu'] },
        words: [
          '[g]ato',
          '[g]ol',
          '[g]oma',
          '[g:j]usano',
          'ami[g]o',
          'domin[g]o',
          'la[g]o',
          '[gu]erra',
          '[gu]itarra',
          '[gu]ante',
          'man[gu]era',
          'ju[gu]ete',
          '[gu]isante',
          'á[gu]ila',
          'pin[gü]ino',
          'ci[gü]eña',
        ],
        sentences: [
          'El [g]ato mira el [gu]ante.',
          'Mi ami[g]o marca un [g]ol.',
          'El pin[gü]ino toca la [gu]itarra.',
          'El domin[g]o juego con mi ju[gu]ete.',
          'El portero se pone los [gu]antes.',
          'La ci[gü]eña vuela sobre el la[g]o.',
        ],
      },
      {
        id: 'signos',
        title: '¿? ¡! y la coma',
        icon: '❓',
        hue: '#7a4fc4',
        tip: {
          es: 'Las preguntas llevan ¿ al principio y ? al final; las exclamaciones, ¡ y !. En una lista, comas y una y antes del último.',
          uk: 'В іспанській знак питання й оклику ставлять і на початку: ¿…?, ¡…!. У переліку — коми, а перед останнім — y.',
        },
        alts: { '¿': ['¡', ''], '¡': ['¿', ''], '?': ['!', '.'], '!': ['?', '.'], ',': ['.', ''] },
        words: [
          '[¡]Golazo!',
          '[¡]Bravo!',
          '[¡]Corre!',
          '[¡]Vamos!',
          '[¡]Qué golazo!',
          '[¡]Qué bien!',
          '[¿]Quién?',
          '[¿]Dónde?',
          '[¿]Cuándo?',
          '[¿]Jugamos?',
          '[¿]Cómo te llamas?',
          '[¿]Cuántos goles?',
        ],
        sentences: [
          '[¿]Quién guarda los guantes[?]',
          '[¡]Qué buen gol[!]',
          'En mi mochila hay lápiz[,] goma y regla.',
          '[¿]Vamos al campo después de clase[?]',
          '[¡]Corre, Pablo, corre[!]',
          'Tengo balón[,] guantes y camiseta.',
          '[¿]Cuántos goles marcaste[?]',
        ],
      },
      {
        id: 'b-v',
        title: 'b y v',
        icon: '🐝',
        hue: '#3f8fc9',
        tip: {
          es: 'La b y la v suenan igual. Antes de l y r, b: blanco, brazo. Después de m, b: tambor. Las formas en -aba, con b: jugaba.',
          uk: 'b і v звучать однаково. Перед l і r — b (blanco, brazo), після m — b (tambor), -aba — з b (jugaba). Решту слів запам’ятовуємо.',
        },
        alts: { b: ['v'], v: ['b'] },
        words: [
          '[b]lanco',
          '[b]razo',
          'tam[b]or',
          'juga[b]a',
          'canta[b]a',
          'escri[b]ir',
          '[b]anquillo',
          '[b]ufanda',
          '[b]andera',
          '[b]arco',
          '[v]erde',
          '[v]entana',
          '[v]iento',
          'nue[v]e',
          '[v]estuario',
          '[v]ictoria',
        ],
        sentences: [
          'El [b]lanco y el [v]erde son mis colores.',
          'Mi equipo juga[b]a en el patio.',
          'El tam[b]or suena en la grada.',
          'Voy a escri[b]ir el resultado.',
          'Los jugadores entran al [v]estuario.',
          'La [b]andera se mueve con el [v]iento.',
          'El portero llevaba una [b]ufanda.',
        ],
      },
      {
        id: 'h',
        title: 'La h',
        icon: '🥚',
        hue: '#8a6a3a',
        tip: {
          es: 'La h no suena, pero se escribe. Las palabras que empiezan por hie- y hue- llevan h: hielo, huevo.',
          uk: 'h не читається, але пишеться. Слова на hie-, hue- завжди з h: hielo, huevo. Решту запам’ятовуємо.',
        },
        alts: { h: [''] },
        words: [
          '[h]oy',
          '[h]elado',
          '[h]ermano',
          '[h]ielo',
          '[h]uevo',
          '[h]ueso',
          '[h]uerto',
          '[h]umo',
          '[h]ormiga',
          '[h]ospital',
          'a[h]ora',
          '[h]ombre',
          '[h]ijo',
          '[:h]oreja',
          '[:h]uva',
        ],
        sentences: [
          '[H]oy [h]ace sol en Gijón.',
          'El [h]ielo está en el vaso.',
          'Hugo lleva un [h]uevo al [h]uerto.',
          'Mi [h]ermano come un [h]elado.',
          'La [h]ormiga lleva una [h]oja.',
          'A[h]ora es la [h]ora del partido.',
          'El portero se hizo daño en el [h]ombro.',
        ],
      },
      {
        id: 'g-j',
        title: 'g y j',
        icon: '🦒',
        hue: '#b07a1f',
        tip: {
          es: 'Delante de e, i, el mismo sonido se escribe a veces con g y a veces con j: gente, jirafa. ¡Hay que aprender las palabras!',
          uk: 'Перед e, i той самий звук пишеться то g, то j: gente, jirafa. Ці слова треба запам’ятати.',
        },
        alts: { g: ['j'], j: ['g'] },
        words: [
          '[g]ente',
          '[g]irar',
          '[g]igante',
          '[g]emelo',
          '[g]imnasio',
          'má[g]ico',
          'ma[g]ia',
          'co[g]er',
          'ele[g]ir',
          'con[g]elado',
          '[j]irafa',
          '[j]efe',
          '[j]ersey',
          'via[j]e',
          'tra[j]e',
        ],
        sentences: [
          'La [g]ente anima al equipo.',
          'El jugador [g]ira y chuta.',
          'La [j]irafa es un animal [g]igante.',
          'Mi entrenador lleva un [j]ersey azul.',
          'Vamos al [g]imnasio después de clase.',
          'Hacemos un via[j]e en autobús.',
          'Tengo que co[g]er el balón.',
        ],
      },
      {
        id: 'll-y',
        title: 'll y la y',
        icon: '🔑',
        hue: '#1f8fa8',
        tip: {
          es: 'La ll y la y suenan casi igual: hay que aprender cómo se escribe cada palabra: llave, playa.',
          uk: 'll і y звучать майже однаково: llave, playa. Як пишеться слово, треба запам’ятати.',
        },
        alts: { ll: ['y'], y: ['ll'] },
        words: [
          '[ll]ave',
          '[ll]uvia',
          '[ll]eno',
          '[ll]amar',
          'ca[ll]e',
          'si[ll]a',
          'caba[ll]o',
          'ga[ll]ina',
          'amari[ll]o',
          '[y]ogur',
          'a[y]er',
          'ma[y]or',
          'a[y]uda',
          'pla[y]a',
          'desa[y]uno',
          '[y]ema',
        ],
        sentences: [
          'La [ll]uvia moja el balón.',
          'A[y]er fui a la pla[y]a.',
          'La [ll]ave está en la mesa.',
          'El jugador a[y]uda a su amigo.',
          'El árbitro saca la tarjeta amari[ll]a.',
          'Mi hermano ma[y]or tiene un caba[ll]o.',
          'En el desa[y]uno tomo [y]ogur.',
        ],
      },
      {
        id: 'tilde',
        title: 'La tilde',
        icon: '✏️',
        hue: '#2f6fd0',
        tip: {
          es: 'La tilde (´) va sobre la vocal que suena más fuerte, pero no todas las palabras la llevan: balón, árbitro, pelota.',
          uk: 'Тильда (´) стоїть над наголошеною голосною, але не в усіх словах: balón, árbitro — так, pelota — ні.',
        },
        alts: {}, // a vowel: with ↔ without the tilde (see altsOf)
        words: [
          'bal[ó]n',
          'cami[ó]n',
          'tambi[é]n',
          'coraz[ó]n',
          'caf[é]',
          'sof[á]',
          '[á]rbitro',
          'p[ú]blico',
          's[á]bado',
          'm[ú]sica',
          'p[á]jaro',
          'r[á]pido',
          '[á]rbol',
          'f[á]cil',
          'l[á]piz',
          'f[ú]tbol',
          'pel[o]ta',
          'vent[a]na',
          'port[e]ro',
          'part[i]do',
        ],
        sentences: [
          'El [á]rbitro pita y el p[ú]blico canta.',
          'El bal[ó]n pasó junto al [á]rbol.',
          'El f[ú]tbol empieza el s[á]bado.',
          'El cami[ó]n va muy r[á]pido.',
          'Tambi[é]n me gusta la m[ú]sica.',
          'El p[á]jaro canta en el [á]rbol.',
          'Juego en el c[é]sped con mi pel[o]ta.',
        ],
      },
    ];

    /** @type {Record<string, string>} */
    const PLAIN = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
    /** @type {Record<string, string>} */
    const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
    /** @param {string} s */
    const plain = (s) => s.replace(/[áéíóú]/g, (c) => PLAIN[c]);
    /** @param {string} s */
    const slugOf = (s) =>
      plain(s.toLowerCase())
        .replace(/[^a-zñü]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Wrong choices for a gap: its own ([x:y,z]), the rule's, or the automatic ones (letter case, the tilde).
    /** @param {RuleSrc} r @param {string} right */
    const altsOf = (r, right) => {
      if (r.alts[right]) return r.alts[right];
      if (r.alts[right.toLowerCase()] && right !== right.toLowerCase())
        return r.alts[right.toLowerCase()].map((a) => a.charAt(0).toUpperCase() + a.slice(1));
      if (r.id === 'mayusculas' && /^\p{L}$/u.test(right))
        return [right === right.toUpperCase() ? right.toLowerCase() : right.toUpperCase()];
      if (r.id === 'tilde' && /^[aeiouáéíóú]$/.test(right)) return [PLAIN[right] || ACUTE[right]];
      throw new Error(`${r.id}: no wrong choices for «${right}»`);
    };

    // '[b]alón' → { text: 'balón', gaps: [{ at: 0, right: 'b', options: ['b', 'v'] }] }
    /** @param {RuleSrc} r @param {string} src */
    const parse = (r, src) => {
      let text = '';
      /** @type {{ at: number, right: string, options: string[] }[]} */
      const gaps = [];
      for (const m of src.matchAll(/([^[]*)(?:\[([^\]:]*)(?::([^\]]*))?\])?/g)) {
        text += m[1];
        if (m[2] === undefined && m[3] === undefined) continue;
        const right = m[2] || '';
        const options = [right, ...(m[3] !== undefined ? m[3].split(',') : altsOf(r, right))];
        gaps.push({ at: text.length, right, options: [...new Set(options)] });
        text += right;
      }
      return { text, gaps };
    };

    // Other common slips, for a third spelling choice when the rule gives only one wrong one.
    /** @type {[RegExp, string][]} */
    const SLIPS = [
      [/[áéíóú]/, '\u0000'], // the tilde dropped (handled below)
      [/b/, 'v'],
      [/v/, 'b'],
      [/ll/, 'y'],
      [/(?<=[aeiou])y(?=[aeiou])/, 'll'],
      [/^h/, ''],
      [/(?<=[aeiou])rr/, 'r'],
      [/c(?=[ei])/, 'z'],
      [/z/, 's'],
      [/qu/, 'k'],
      [/g(?=[ei])/, 'j'],
      [/m(?=[pb])/, 'n'],
      [/ñ/, 'n'],
    ];
    /** @param {string} w */
    const slips = (w) => SLIPS.map(([re, to]) => (to === '\u0000' ? plain(w) : w.replace(re, to))).filter((x) => x !== w);

    const Q = ES
      ? {
          gap: '¿Qué falta? Escucha la palabra.',
          pick: '¿Cuál está bien escrita?',
          tiles: 'Escribe lo que oyes',
          tilde: '¿Lleva tilde? ¿Dónde?',
          cloze: 'Completa el dictado',
          spot: 'Caza la falta: toca la palabra mal escrita',
          write: 'Escribe lo que oyes',
        }
      : {
          gap: 'Чого бракує? Послухай слово.',
          pick: 'Як написано правильно?',
          tiles: 'Напиши, що чуєш',
          tilde: 'Чи є тильда? Де?',
          cloze: 'Доповни диктант',
          spot: 'Знайди помилку: торкнись слова з помилкою',
          write: 'Напиши, що чуєш',
        };

    // ---------- tasks ----------

    /** @param {RuleSrc} r @returns {ExamTask[]} */
    const tasksOf = (r) => {
      const fact = ES ? r.tip.es : r.tip.uk;
      /** @type {ExamTask[]} */
      const out = [];
      for (const src of r.words) {
        const { text: word, gaps } = parse(r, src);
        const key = `${r.id}.${slugOf(word)}`;
        const g = gaps[0];
        const say = word;
        // The tilde rule is trained with its own task; the gap there would only repeat it.
        if (r.id !== 'tilde')
          out.push({
            type: 'gap',
            key,
            q: Q.gap,
            say,
            word,
            at: g.at,
            len: g.right.length,
            options: g.options,
            fact,
          });
        const wrong = g.options.slice(1).map((o) => word.slice(0, g.at) + o + word.slice(g.at + g.right.length));
        const picks = [...new Set([word, ...wrong, ...slips(word)])].slice(0, 3);
        if (picks.length >= 2) out.push({ type: 'pick', key, q: Q.pick, say, options: picks, fact });
        if (!/\s/.test(word) && word.length <= 10) {
          // An extra copy of a letter the word has is a trap too (también + n); a silent h gives none: then a spare vowel.
          const traps = [...new Set(g.options.slice(1).join('').split(''))];
          if (!traps.length) traps.push([...'aeiou'].find((v) => !word.includes(v)) || 'n');
          out.push({ type: 'tiles', key, q: Q.tiles, say, word, traps: traps.slice(0, 3), fact });
        }
        if (r.id === 'tilde') {
          const p = plain(word);
          out.push({ type: 'tilde', key, q: Q.tilde, say, word, plain: p, answer: p === word ? -1 : g.at, fact });
        }
        out.push({ type: 'write', key, q: Q.write, say, word, fact });
      }
      r.sentences.forEach((src, i) => {
        const { text, gaps } = parse(r, src);
        const key = `${r.id}.s${i + 1}`;
        /** @type {(string | DCGap)[]} */
        const parts = [];
        let pos = 0;
        for (const g of gaps) {
          parts.push(text.slice(pos, g.at), { right: g.right, options: g.options });
          pos = g.at + g.right.length;
        }
        parts.push(text.slice(pos));
        out.push({ type: 'cloze', key, q: Q.cloze, say: text, parts: parts.filter((p) => p !== ''), fact });
        // Caza la falta: the first letter gap gets its first wrong choice (punctuation mistakes are trained in cloze).
        const g = gaps.find((x) => /\p{L}/u.test(x.right + x.options[1]) && x.options[1] !== undefined);
        if (g) {
          const bad = text.slice(0, g.at) + g.options[1] + text.slice(g.at + g.right.length);
          const words = bad.split(' ');
          let wrong = 0;
          for (let n = 0, j = 0; j < words.length; j++) {
            if (g.at >= n && g.at <= n + words[j].length) {
              wrong = j;
              break;
            }
            n += words[j].length + 1;
          }
          const fix = text.split(' ')[wrong].replace(/[.,;:!?]+$/, '');
          out.push({ type: 'spot', key, q: Q.spot, words, wrong, fix, say: text, fact });
        }
      });
      return out;
    };

    const UK_STRINGS = {
      coins: 'Монети',
      back: '← До каталогу',
      stationsTitle: 'Тренування',
      examEyebrow: 'Фінальний диктант',
      examTitle: 'Dictado del partido',
      examStart: 'Почати диктант',
      examInfo: ({ n }) =>
        `${n} слів з усіх правил — пишеш сам на клавіатурі. Помилка — 🟨 жовта картка, але нічого страшного: це тренування!`,
      examBest: ({ grade, nota }) => `Найкращий диктант: ${grade} (${nota})`,
      cardsLabel: 'Картки',
      goalsLabel: 'Голи',
      review: 'Повторити',
      backBtn: 'Назад',
      start: 'Почати',
      quitTitle: 'Повернутися до тренувань?',
      quitText: 'Цей раунд не піде в рекорд.',
      quitYes: 'Вийти',
      quitNo: 'Писати далі',
      tallyPassed: ({ n, total }) => `🏁 ${n}/${total} правил`,
      tallyStars: ({ n, total }) => `⭐ ${n}/${total}`,
      best: ({ score, max }) => `Рекорд: ${score}/${max}`,
      notPlayed: 'Нове правило',
      passed: 'Пройдено!',
      introMeta: ({ n }) => `${n} завдань · близько 3 хвилин`,
      stars: ({ n }) => `${n} з 3 зірок`,
      praiseSoft: 'Молодець!',
      almost: 'Майже!',
      answerIs: ({ a }) => `Правильно: ${a}`,
      seeRight: 'Подивись, як правильно.',
      fix: ({ text }) => `Правильно так: ${text}`,
      next: 'Далі →',
      result: 'Результат →',
      restart: 'Почати знову ↺',
      yellow: 'Жовта картка!',
      yellowText: 'Нічого страшного. Пиши далі!',
      red: 'Червона картка!',
      redText: 'Кілька помилок, але диктант триває. Наприкінці побачиш, які правила повторити.',
      kChoice: ({ n }) => `Клавіші 1–${n}`,
      kTf: 'Клавіші V = правда, F = неправда',
      true: 'Правда',
      false: 'Неправда',
      kSort: ({ n }) => `Торкнись картки, потім її коробки. Клавіатура: ← → — картка, 1–${n} — коробка`,
      pickCard: 'Спочатку торкнись картки.',
      sortTry: 'Майже. Спробуй іншу коробку.',
      sortGoes: ({ item, bin }) => `«${item}» — у «${bin}».`,
      kOrder: 'Торкайся карток по черзі: спочатку 1, потім 2… Клавіатура: літери A–G, ⌫ — скасувати, Enter — перевірити',
      check: 'Перевірити ✓',
      undo: '↶ Скасувати',
      orderGreen: 'Зелені вже на місці. Розстав інші.',
      orderNeedAll: 'Розстав усі картки.',
      kPairs: ({ n, l }) => `Торкнись слова зліва, потім його пари справа. Клавіатура: 1–${n} і A–${l}`,
      pairNo: 'Ці два — не пара. Спробуй ще!',
      pairShown: 'Ось ця пара.',
      stationDone: 'Тренування завершено!',
      stationPassed: 'Правило пройдено!',
      stationMsg: ({ coins }) => `Монет за раунд: ${coins} 🪙.`,
      stationKeep: ({ need, n }) => `Щоб пройти правило, треба ${need} з ${n}. Ще раз — і вийде!`,
      stationGreat: 'Чудово пишеш! Спробуй наступне правило або фінальний диктант.',
      perfectBonus: ' І бонус за ідеальний раунд.',
      again: 'Ще раз',
      nextStation: 'Наступне правило →',
      toHub: 'До тренувань',
      examDone: 'Диктант завершено',
      nota: ({ n }) => `Оцінка: ${n}`,
      examMsgTop: '¡Sobresaliente! Ти пишеш, як справжній іспанець! ✍️',
      examMsgOk: 'Гарний диктант. Повтори помаранчеві правила і спробуй ще.',
      examMsgLow: 'Ще є що потренувати. Повтори помаранчеві правила — щоразу буде краще!',
      examCards: ({ y, r }) => `Картки: ${y} 🟨${r ? ' · 1 🟥' : ''}`,
      noCards: 'Без жодної картки!',
      byTopic: 'За правилами',
      review2: 'Повторити',
      loadError: 'Не вдалося завантажити завдання. Онови сторінку.',
      // own task types (types.js, art.js)
      play: '🔊 Послухати',
      slow: '🐢 Повільніше',
      noVoice: 'Звуку немає — подивись на слово',
      noLetter: 'нічого',
      noTilde: 'Без тильди',
      erase: '⌫ Стерти',
      fill: 'Спочатку заповни всі клітинки.',
      green: 'Зелені букви вже на місці. Допиши інші!',
      tryAgain: 'Ще не те. Спробуй ще раз!',
      kGap: ({ n }) => `Клавіші 1–${n}, пробіл — послухати ще`,
      kPick: ({ n }) => `Клавіші 1–${n}, пробіл — послухати ще`,
      kTiles: 'Набирай літери з клавіатури, ⌫ — стерти, Enter — перевірити, пробіл — послухати',
      kTilde: ({ n }) => `Клавіші 1–${n} — голосна, 0 — без тильди, пробіл — послухати`,
      kCloze: 'Торкнись пропуску, потім букви. Пробіл — послухати ще',
      kSpot: 'Торкнись слова з помилкою',
      kWrite: 'Пиши з клавіатури, ⌫ — стерти, Enter — перевірити, пробіл — послухати',
      spotFix: ({ w }) => `Правильно: ${w}`,
      look: '👀 Подивитися',
      kAccent: "´ або ' перед голосною — á, Shift — велика літера",
      kClozeKeys: ({ n }) => `1–${n} — варіант, ← → — інший пропуск, S — повільніше`,
      kSpotKeys: '← → — вибрати слово, Enter — це помилка',
      shift: 'Велика літера',
      accent: 'Тильда',
      dieresis: 'Дві крапки над u (ü)',
      boardRules: ({ n, total }) => `🧲 Правила: ${n}/${total}`,
      boardWords: ({ n, total }) => `✍️ Слова без помилки: ${n}/${total}`,
      boardNext: ({ rule }) => `Далі: ${rule}`,
      boardDone: 'Усі правила! Тепер — диктант 🏆',
    };

    const ES_STRINGS = {
      stationsTitle: 'Entrenamientos',
      examEyebrow: 'El dictado final',
      examTitle: 'Dictado del partido',
      examStart: 'Empezar el dictado',
      examInfo: ({ n }) =>
        `${n} palabras de todas las reglas: escribes tú con el teclado. Cada fallo es una 🟨 tarjeta amarilla. ¡Tranquilidad, es para practicar!`,
      examBest: ({ grade, nota }) => `Tu mejor dictado: ${grade} (${nota})`,
      quitTitle: '¿Volver a los entrenamientos?',
      quitNo: 'Seguir escribiendo',
      tallyPassed: ({ n, total }) => `🏁 ${n}/${total} reglas`,
      notPlayed: 'Regla nueva',
      stationDone: '¡Entrenamiento terminado!',
      stationPassed: '¡Regla superada!',
      stationKeep: ({ need, n }) => `Para superarla necesitas ${need} de ${n}. ¡Otra vez y lo consigues!`,
      stationGreat: '¡Escribes genial! Prueba otra regla o el dictado final.',
      nextStation: 'Siguiente regla →',
      toHub: 'A los entrenamientos',
      examDone: 'Fin del dictado',
      examMsgTop: '¡Sobresaliente! ¡Escribes como un campeón! ✍️',
      examMsgOk: 'Muy buen dictado. Repasa las reglas en naranja y vuelve a intentarlo.',
      examMsgLow: 'Aún hay reglas por entrenar. Repásalas: ¡cada vez saldrá mejor!',
      byTopic: 'Por reglas',
      play: '🔊 Escuchar',
      slow: '🐢 Más despacio',
      noVoice: 'No hay sonido: mira la palabra',
      noLetter: 'nada',
      noTilde: 'Sin tilde',
      erase: '⌫ Borrar',
      fill: 'Primero rellena todas las casillas.',
      green: 'Las letras verdes ya están bien. ¡Completa las demás!',
      tryAgain: 'Todavía no. ¡Prueba otra vez!',
      kGap: ({ n }) => `Teclas 1–${n}, espacio = escuchar otra vez`,
      kPick: ({ n }) => `Teclas 1–${n}, espacio = escuchar otra vez`,
      kTiles: 'Escribe con el teclado, ⌫ borra, Enter comprueba, espacio = escuchar',
      kTilde: ({ n }) => `Teclas 1–${n} = vocal, 0 = sin tilde, espacio = escuchar`,
      kCloze: 'Toca un hueco y luego la letra. Espacio = escuchar otra vez',
      kSpot: 'Toca la palabra mal escrita',
      kWrite: 'Escribe con el teclado, ⌫ borra, Enter comprueba, espacio = escuchar',
      spotFix: ({ w }) => `Se escribe: ${w}`,
      answerIs: ({ a }) => `La respuesta es: ${a}`,
      look: '👀 Mirar',
      kAccent: "´ o ' antes de la vocal = á, Mayús = mayúscula",
      kClozeKeys: ({ n }) => `1–${n} = opción, ← → = otro hueco, S = más despacio`,
      kSpotKeys: '← → para elegir palabra, Enter = esta es la falta',
      shift: 'Mayúscula',
      accent: 'Tilde',
      dieresis: 'Diéresis (ü)',
      boardRules: ({ n, total }) => `🧲 Reglas: ${n}/${total}`,
      boardWords: ({ n, total }) => `✍️ Palabras bien escritas: ${n}/${total}`,
      boardNext: ({ rule }) => `Siguiente: ${rule}`,
      boardDone: '¡Todas las reglas! Ahora, el dictado 🏆',
    };

    /** @type {DCRule[]} */
    const rules = RULES.map((r) => ({ id: r.id, title: r.title, icon: r.icon, hue: r.hue, tip: ES ? r.tip.es : r.tip.uk }));

    /** @type {DCContent} */
    const unit = {
      slug: 'dictado',
      lang: ES ? 'es' : 'uk',
      title: 'Dictado del míster',
      subject: ES ? 'Lengua' : 'Іспанська мова',
      unitLabel: ES ? 'Lengua · 12 reglas' : 'Іспанська · 12 правил',
      intro: ES
        ? 'El míster dicta y tú escribes. Entrena cada regla y después juega el Dictado del partido: ¡ahí escribes tú solo con el teclado!'
        : 'Тренер диктує іспанською, а ти пишеш. Тренуй кожне правило, а потім — «Dictado del partido»: там пишеш сам на клавіатурі!',
      stations: RULES.map((r) => ({ id: r.id, title: r.title, icon: r.icon, intro: ES ? r.tip.es : r.tip.uk, tasks: tasksOf(r) })),
      exam: { perStation: Object.fromEntries(RULES.map((r) => [r.id, 1])), redAfter: 3 },
      round: 8,
      hues: Object.fromEntries(RULES.map((r) => [r.id, r.hue])),
      sampling: {
        caps: { write: 0, cloze: 1, spot: 1, tiles: 2, pick: 2 },
        always: ['cloze', 'spot'],
        examCaps: { gap: 0, pick: 0, tiles: 0, tilde: 0, cloze: 0, spot: 0 },
      },
      strings: ES ? ES_STRINGS : UK_STRINGS,
      lists: {
        praise: ES
          ? ['¡Muy bien!', '¡Golazo!', '¡Perfecto!', '¡Eso es!', '¡Genial!']
          : ['Чудово!', 'Гол!', 'Супер!', 'Так тримати!', 'Ідеально!'],
        grades: [ES ? '¡Sigue practicando!' : 'Тренуйся далі!', 'Suficiente', 'Bien', 'Notable', 'Sobresaliente'],
      },
      testHook: '__dc',
      store: 'dictado-words',
      rules,
      homophones: HOMOPHONES,
    };
    return unit;
  })()
);
