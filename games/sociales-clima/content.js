// Ciencias Sociales 3.º (SM Matices, Asturias), Unidad 2 «El clima y la forma del paisaje» — exam unit «La vuelta al mundo en globo».
// Source: book pp. 28–43, transcribed in .pi/book-cs/unit2.md (the book is not in git). Plan: .pi/plan-sociales-clima.md.
// The sentences and the station notes are our own; only facts of the book. Plain data, no logic (a few small builders below):
// window.SC_CONTENT is an ExamUnit (types/exam.d.ts, engine in shared/exam/).
//
// Task types: choice (also `pics`), tf, sort, pairs, fill, pick, label (shared/exam/types.js); the unit's own (types.js here):
//   spainMap  { q, mode:'weather'|'climate', tokens:[{id,label,icon?,color?}], answer:{regionId: tokenId}, listen?, text?, fact? }
//   climograma{ q, temp[12], rain[12], place?, mode:'tapMonth'|'fillBar', answer (tapMonth) | missing (fillBar), table?, fact? }
//   spot      { q, scene, find:[element ids], fact? }
//
// CONTRACT WITH art.js / types.js (ids used here):
//   weather token ids ....... sol, nubes, lluvia, nieve, tormenta, niebla   (emoji icon given as fallback)
//   climate token ids ....... oceanico (#2b6cb0), mediterraneo-interior (#b8a41f), mediterraneo-litoral (#4a9d4a), subtropical (#d9534f)
//   spainMap regions used ... galicia, asturias, cantabria, pais-vasco, navarra, la-rioja, aragon, cataluna, castilla-y-leon, madrid,
//                             valencia, extremadura, andalucia (weather only), baleares, canarias
//   climate regions ......... only oceánico: galicia asturias cantabria pais-vasco · interior: castilla-y-leon madrid castilla-la-mancha
//                             extremadura · litoral: cataluna valencia murcia baleares · subtropical: canarias
//   spot scenes / element ids (all must exist in SCArt.spotScene(name).items; human = hecho por las personas):
//     valle   : montana, rio, bosque (natural) · pueblo, carretera, puente, cultivos, torre-electrica (human)
//     costa   : acantilado, playa, cabo, isla (natural) · puerto, faro, hotel, barcos (human)
//     llanura : arboles, rio (natural) · cultivos, granja, carretera (human)
//   label scenes (spots = ids below, text shown on the chips):
//     globo   : ecuador, cancer, capricornio, artico, antartico (lines) · fria, templada, calida (the three zones; fria/templada appear twice
//               on the globe: one spot each is enough)
//     relieve : montana, llanura, valle, meseta · acantilado, playa, cabo, golfo, isla  (the 9 spots of book p.37)
//   pics (art keys): taiga, tundra, bosque-mediterraneo, bosque-frondoso, selva, sabana, aurora, arcoiris, rayo, satelite, termometro,
//                    pluviometro, cabo, golfo, isla
//
// COVERAGE MATRIX (topic → tasks; station, task numbers in order of the file).
// tiempo — ¿Tiempo o clima?
//   tiempo = momento y lugar ........ 1 choice, 3 sort, 6 tf, 4 pairs · clima = muchos años (~30) ... 2 choice, 3 sort, 5 tf, 4 pairs
//   climatólogos / meteorólogos ..... 4 pairs · humedad ... 4 pairs, 11 choice
//   fenómenos por tipo .............. 7 sort (agua, eléctricos, luminosos, partículas), 8 pics aurora, 9 trueno
//   suaves / destructivos ........... 10 choice (huracán)
// parte — El hombre del tiempo
//   meteorólogos, satélites ......... 1, 2 pics, 5 choice · símbolos del mapa ... 3 tf, 4 choice (paraguas) · mapa del tiempo ... 6, 7, 8 spainMap weather
// factores — ¿De qué depende el clima?
//   altitud 1, 7 tf, 5 sort, 6 pairs · distancia al mar 2, 8 tf, 5, 6 · polos 3, 9, 5, 6 · relieve/viento 4 fill, 5, 6 · los cuatro 10 pick
// zonas — Zonas climáticas
//   líneas (ecuador, trópicos, círculos) .. 1 label, 7 pairs, 8 tf, 11 choice · zonas .. 2 label, 3, 4, 5, 6 choice, 10 sort · por qué ... 9 tf
// paisajes — Paisajes de cada zona
//   taiga / tundra 1, 2 pics, 5 sort, 6 pairs · frondoso 3 pics, 6 · mediterráneo 6, 7 tf (hoja perenne), 9 · selva / sabana 4 pics, 8 · adaptan 10 fill
// climograma — El climograma
//   leer mes más cálido / lluvioso 1, 2, 3 · completar barra 4, 5 · línea / barras 6, 7 · pasos 8 order · unidades 9 pairs · tf 10
// forma — La forma del paisaje
//   hecho por personas 1, 2, 3 spot · paisaje 4 · natural/humanizado 5 sort · costa/interior 6 sort, 11 choice · relieve 7, 8 label, 9 pics (golfo), 10 pairs · cabo/golfo 9, 12 tf
// espana — España: relieve y climas
//   mares, fronteras 1, 2 · Teide 3 · Meseta 4 · Ebro/Guadalquivir 5 · Pirineos 10 · climas en el mapa 6, 7 spainMap · características 8 pairs · vegetación 9 pairs
// Not asked on purpose: the drawn bars of p.35, «<800 mm = seco», the exact place of taiga/tundra, the unnamed ranges, Andalucía's climate.
'use strict';

window.SC_CONTENT = /** @type {ExamUnit} */ (
  (() => {
    const ZONES = [
      { id: 'fria', label: 'Zona fría', icon: '🧊' },
      { id: 'templada', label: 'Zona templada', icon: '🍃' },
      { id: 'calida', label: 'Zona cálida', icon: '☀️' },
    ];
    const MAP_Q = 'Escucha el parte del tiempo y pon cada símbolo en su comunidad.';
    const WEATHER = {
      sol: { id: 'sol', label: 'Sol', icon: '☀️' },
      nubes: { id: 'nubes', label: 'Nubes', icon: '☁️' },
      lluvia: { id: 'lluvia', label: 'Lluvia', icon: '🌧️' },
      nieve: { id: 'nieve', label: 'Nieve', icon: '❄️' },
      tormenta: { id: 'tormenta', label: 'Tormenta', icon: '⛈️' },
      niebla: { id: 'niebla', label: 'Niebla', icon: '🌫️' },
    };
    const CLIMATE = {
      oceanico: { id: 'oceanico', label: 'Oceánico', color: '#2b6cb0' },
      interior: { id: 'mediterraneo-interior', label: 'Mediterráneo de interior', color: '#b8a41f' },
      litoral: { id: 'mediterraneo-litoral', label: 'Mediterráneo litoral', color: '#4a9d4a' },
      subtropical: { id: 'subtropical', label: 'Subtropical', color: '#d9534f' },
    };
    const tokens = (/** @type {Record<string, any>} */ set, /** @type {string[]} */ keys) => keys.map((k) => set[k]);
    /** Weather forecast on the map: the text is also what the engine reads aloud. */
    const weatherMap = (
      /** @type {string} */ forecast,
      /** @type {string[]} */ keys,
      /** @type {Record<string, string>} */ answer,
      /** @type {string} */ fact,
    ) => ({ type: 'spainMap', q: MAP_Q, mode: 'weather', tokens: tokens(WEATHER, keys), answer, listen: forecast, text: forecast, fact });
    const climateMap = (/** @type {string[]} */ keys, /** @type {Record<string, string>} */ answer, /** @type {string} */ fact) => ({
      type: 'spainMap',
      q: 'Pon cada clima en su comunidad.',
      mode: 'climate',
      tokens: tokens(CLIMATE, keys),
      answer,
      fact,
    });
    /** Climograma: tapMonth (answer = month index) or fillBar (missing = month index of the bar to build). */
    const climo = (
      /** @type {string} */ q,
      /** @type {string} */ place,
      /** @type {number[]} */ temp,
      /** @type {number[]} */ rain,
      /** @type {Record<string, any>} */ extra,
    ) => ({ type: 'climograma', q, place, temp, rain, ...extra });
    const spot = (/** @type {string} */ scene, /** @type {string[]} */ find, /** @type {string} */ fact) => ({
      type: 'spot',
      q: 'Toca todo lo que han hecho las personas en este paisaje.',
      scene,
      find,
      fact,
    });

    // The book's table (p. 34): never the drawn bars of p. 35.
    const BOOK_T = [1, 3, 6, 9, 13, 17, 20, 18, 17, 11, 6, 3];
    const BOOK_R = [38, 45, 70, 65, 95, 89, 43, 80, 75, 78, 65, 61];
    // Own, realistic data (rain at most 210 mm, temperature 0–35 °C; the asked month is the unique extreme).
    const OVIEDO_T = [8, 8, 10, 11, 14, 17, 19, 19, 17, 14, 10, 8];
    const OVIEDO_R = [120, 105, 105, 105, 90, 60, 45, 60, 75, 120, 135, 150];
    const DESIERTO_T = [20, 22, 26, 30, 33, 35, 34, 34, 32, 28, 24, 21];
    const DESIERTO_R = [15, 0, 15, 0, 0, 0, 0, 0, 15, 15, 15, 15];
    const MONTE_T = [0, 1, 2, 4, 8, 11, 14, 13, 10, 6, 2, 0];
    const MONTE_R = [90, 75, 90, 105, 135, 90, 60, 60, 90, 105, 120, 105];

    /** @type {ExamStation[]} */
    const stations = [
      // ---------------- 1 ¿Tiempo o clima? ----------------
      {
        id: 'tiempo',
        title: '¿Tiempo o clima?',
        icon: '🌦️',
        intro:
          'El tiempo atmosférico es el estado de la atmósfera en un momento y un lugar. El clima es lo habitual en un lugar durante muchos años. Hay fenómenos de agua, eléctricos, luminosos y de partículas.',
        vocab: [
          ['el tiempo atmosférico', 'погода'],
          ['el clima', 'клімат'],
          ['la atmósfera', 'атмосфера'],
          ['el meteorólogo', 'метеоролог'],
          ['el climatólogo', 'кліматолог'],
          ['la humedad', 'вологість'],
          ['el rayo y el trueno', 'блискавка і грім'],
          ['el huracán', 'ураган'],
        ],
        text: {
          title: '¿Tiempo o clima?',
          paragraphs: [
            'El tiempo atmosférico es cómo está la atmósfera hoy, aquí: sol, lluvia o viento. El clima es cómo suele ser el tiempo en un lugar durante muchos años, unos treinta. Lo estudian los climatólogos.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'Esta mañana ha llovido en tu pueblo. Eso es el…',
            options: ['el tiempo atmosférico', 'el clima del pueblo', 'el paisaje del pueblo'],
            answer: 0,
            fact: 'El tiempo atmosférico es el estado de la atmósfera en un momento y un lugar.',
          },
          {
            type: 'choice',
            q: 'En un lugar, año tras año, los veranos son calurosos y los inviernos fríos. Eso es su…',
            options: ['clima', 'tiempo atmosférico', 'relieve'],
            answer: 0,
            fact: 'El clima es el estado habitual de la atmósfera durante muchos años.',
          },
          {
            type: 'sort',
            q: '¿Es tiempo atmosférico o es clima?',
            bins: [
              { id: 'tiempo', label: 'Tiempo (hoy)', icon: '🌤️' },
              { id: 'clima', label: 'Clima (muchos años)', icon: '📅' },
            ],
            items: [
              { text: 'Hoy hace sol y 25 grados', bin: 'tiempo' },
              { text: 'Esta tarde hay niebla', bin: 'tiempo' },
              { text: 'Mañana lloverá en Oviedo', bin: 'tiempo' },
              { text: 'En Asturias llueve mucho todo el año', bin: 'clima' },
              { text: 'En el desierto casi nunca llueve', bin: 'clima' },
              { text: 'En Siberia los inviernos son muy fríos', bin: 'clima' },
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada palabra con lo que significa.',
            pairs: [
              ['los meteorólogos', 'Dicen qué tiempo hará'],
              ['los climatólogos', 'Estudian el clima durante unos 30 años'],
              ['la humedad', 'Vapor de agua en el aire'],
              ['el tiempo atmosférico', 'La atmósfera en un momento y lugar'],
            ],
          },
          {
            type: 'tf',
            q: 'Para conocer el clima de un lugar se estudia el tiempo durante unos 30 años.',
            truth: true,
            fact: 'Los climatólogos estudian temperatura, humedad, lluvias y viento durante unos 30 años.',
          },
          {
            type: 'tf',
            q: 'El tiempo atmosférico es el estado habitual de la atmósfera durante muchos años.',
            truth: false,
            fix: 'El tiempo atmosférico es el estado de la atmósfera en un momento y lugar concretos. Lo habitual durante muchos años es el clima.',
          },
          {
            type: 'sort',
            q: '¿De qué tipo es cada fenómeno atmosférico?',
            bins: [
              { id: 'agua', label: 'Agua', icon: '💧' },
              { id: 'electrico', label: 'Eléctrico', icon: '⚡' },
              { id: 'luminoso', label: 'Luminoso', icon: '🌈' },
              { id: 'solidas', label: 'Partículas sólidas', icon: '🏜️' },
            ],
            items: [
              { text: 'la lluvia', bin: 'agua' },
              { text: 'la niebla', bin: 'agua' },
              { text: 'el granizo', bin: 'agua' },
              { text: 'el rayo', bin: 'electrico' },
              { text: 'el arcoíris', bin: 'luminoso' },
              { text: 'la aurora boreal', bin: 'luminoso' },
              { text: 'la tormenta de arena', bin: 'solidas' },
            ],
          },
          {
            type: 'choice',
            pics: true,
            q: 'La aurora boreal la produce el viento solar. ¿Cuál es?',
            options: ['aurora', 'arcoiris', 'rayo'],
            labels: ['La aurora boreal', 'El arcoíris', 'El rayo'],
            answer: 0,
            fact: 'La aurora boreal y el arcoíris son fenómenos luminosos.',
          },
          {
            type: 'choice',
            q: 'El rayo siempre va con un fuerte estruendo. ¿Cómo se llama ese ruido?',
            options: ['el trueno', 'la brisa', 'la niebla'],
            answer: 0,
            fact: 'Rayo y trueno son fenómenos de origen eléctrico.',
          },
          {
            type: 'choice',
            q: '¿Cuál de estos fenómenos puede ser muy destructivo?',
            options: ['un huracán', 'una brisa ligera', 'un arcoíris'],
            answer: 0,
            fact: 'Una brisa es suave; un huracán o un tornado destruyen mucho.',
          },
          {
            type: 'choice',
            q: 'La humedad es…',
            options: ['el vapor de agua del aire', 'la nieve de la montaña', 'el viento muy fuerte'],
            answer: 0,
            fact: 'La humedad produce nubes, niebla o rocío, y hace que sintamos más el frío o el calor.',
          },
        ],
      },

      // ---------------- 2 El hombre del tiempo ----------------
      {
        id: 'parte',
        title: 'El hombre del tiempo',
        icon: '📡',
        intro:
          'Los meteorólogos usan satélites y otros datos para predecir el tiempo. Nos lo explican en un mapa con símbolos de sol, nubes, lluvia o tormenta.',
        vocab: [
          ['el parte del tiempo', 'прогноз погоди'],
          ['el satélite', 'супутник'],
          ['predecir', 'передбачати'],
          ['el mapa del tiempo', 'карта погоди'],
          ['la nube', 'хмара'],
          ['la lluvia', 'дощ'],
          ['la tormenta', 'гроза'],
          ['la niebla', 'туман'],
        ],
        text: {
          title: 'El hombre del tiempo',
          paragraphs: [
            'Los meteorólogos miran los satélites y otros datos para predecir el tiempo de hoy y de los próximos días. Lo explican en un mapa con símbolos: sol, nubes, lluvia o tormenta.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: '¿Quiénes nos explican el tiempo que hará mañana?',
            options: ['los meteorólogos', 'los climatólogos', 'los cartógrafos'],
            answer: 0,
            fact: 'Los meteorólogos predicen el tiempo atmosférico; los climatólogos estudian el clima.',
          },
          {
            type: 'choice',
            pics: true,
            q: '¿Qué usan los meteorólogos desde el espacio para predecir el tiempo?',
            options: ['satelite', 'termometro', 'pluviometro'],
            labels: ['Un satélite', 'Un termómetro', 'Un pluviómetro'],
            answer: 0,
            fact: 'Los datos de los satélites ayudan a predecir el tiempo.',
          },
          {
            type: 'tf',
            q: 'En el mapa del tiempo, los símbolos nos dicen si hará frío o calor, o si va a llover o a hacer sol.',
            truth: true,
          },
          {
            type: 'choice',
            q: 'El mapa del tiempo muestra una nube con gotas de lluvia. ¿Qué te llevas al parque?',
            options: ['un paraguas', 'unas gafas de sol', 'un bañador'],
            answer: 0,
            fact: 'El parte del tiempo nos ayuda a ponernos la ropa adecuada.',
          },
          {
            type: 'choice',
            q: 'Con los datos de los satélites, los meteorólogos pueden…',
            options: ['predecir el tiempo', 'cambiar el clima', 'parar la lluvia'],
            answer: 0,
            fact: 'Predecir el tiempo es saber cómo estará la atmósfera dentro de unas horas o unos días.',
          },
          weatherMap(
            'Hoy llueve en Galicia y en Asturias. En Andalucía hace mucho sol. En Aragón hay nubes.',
            ['sol', 'nubes', 'lluvia'],
            { galicia: 'lluvia', asturias: 'lluvia', andalucia: 'sol', aragon: 'nubes' },
            'Galicia y Asturias: lluvia. Andalucía: sol. Aragón: nubes.',
          ),
          weatherMap(
            'Mañana hay tormenta en Cataluña. Nieva en Castilla y León. En Canarias hace sol y en Valencia hay niebla.',
            ['sol', 'nieve', 'tormenta', 'niebla'],
            { cataluna: 'tormenta', 'castilla-y-leon': 'nieve', canarias: 'sol', valencia: 'niebla' },
            'Cataluña: tormenta. Castilla y León: nieve. Canarias: sol. Valencia: niebla.',
          ),
          weatherMap(
            'Por la tarde hay tormenta en Navarra y La Rioja. En el País Vasco llueve. En Madrid y Extremadura hace sol. En Baleares hay nubes.',
            ['sol', 'nubes', 'lluvia', 'tormenta'],
            {
              navarra: 'tormenta',
              'la-rioja': 'tormenta',
              'pais-vasco': 'lluvia',
              madrid: 'sol',
              extremadura: 'sol',
              baleares: 'nubes',
            },
            'Navarra y La Rioja: tormenta. País Vasco: lluvia. Madrid y Extremadura: sol. Baleares: nubes.',
          ),
        ],
      },

      // ---------------- 3 ¿De qué depende el clima? ----------------
      {
        id: 'factores',
        title: '¿De qué depende el clima?',
        icon: '⛰️',
        intro: 'El clima depende de la altitud, del relieve, de la distancia al mar y de la distancia a los polos.',
        vocab: [
          ['la altitud', 'висота над рівнем моря'],
          ['el relieve', 'рельєф'],
          ['la distancia', 'відстань'],
          ['el mar', 'море'],
          ['el polo', 'полюс'],
          ['suave', 'м’який'],
          ['la barrera', 'перешкода'],
          ['el viento', 'вітер'],
        ],
        text: {
          title: '¿De qué depende el clima?',
          paragraphs: [
            'Cuatro cosas cambian el clima: la altitud, con más frío arriba; el relieve, que frena el viento; la cercanía al mar, que lo suaviza; y la cercanía a los polos, que enfría.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: 'En lo alto de una montaña, comparado con el valle, el clima es…',
            options: ['más frío', 'más caluroso', 'igual de templado'],
            answer: 0,
            fact: 'La altitud: en las montañas más altas hace más frío que en las zonas bajas.',
          },
          {
            type: 'choice',
            q: 'Un pueblo está junto al mar y otro lejos del mar. ¿Cuál tiene un clima más suave?',
            options: ['el pueblo junto al mar', 'el pueblo lejos del mar', 'los dos igual'],
            answer: 0,
            fact: 'Los lugares junto al mar tienen un clima más suave.',
          },
          {
            type: 'choice',
            q: 'Cuanto más cerca de los polos, el clima es…',
            options: ['más frío', 'más cálido', 'más lluvioso'],
            answer: 0,
            fact: 'Cuanto más cerca de los polos, hace más frío.',
          },
          {
            type: 'fill',
            q: 'Completa la frase.',
            text: 'Las montañas son barreras naturales para el ___.',
            answer: 'viento',
            extra: 'ma',
            fact: 'El relieve: las montañas frenan el viento.',
          },
          {
            type: 'sort',
            q: '¿Qué factor del clima es?',
            bins: [
              { id: 'altitud', label: 'Altitud', icon: '🏔️' },
              { id: 'relieve', label: 'Relieve', icon: '🧱' },
              { id: 'mar', label: 'Distancia al mar', icon: '🌊' },
              { id: 'polos', label: 'Distancia a los polos', icon: '🧊' },
            ],
            items: [
              { text: 'Las montañas más altas son más frías', bin: 'altitud' },
              { text: 'Arriba de un pico hace frío', bin: 'altitud' },
              { text: 'Una montaña detiene el viento', bin: 'relieve' },
              { text: 'Una cordillera frena el viento', bin: 'relieve' },
              { text: 'Una playa tiene un clima suave', bin: 'mar' },
              { text: 'Junto al mar el clima es suave', bin: 'mar' },
              { text: 'Cerca del polo norte hace frío', bin: 'polos' },
              { text: 'Cerca de los polos hace más frío', bin: 'polos' },
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada factor con lo que hace.',
            pairs: [
              ['la altitud', 'Más alto, más frío'],
              ['el relieve', 'Las montañas frenan el viento'],
              ['la distancia al mar', 'Junto al mar, clima suave'],
              ['la distancia a los polos', 'Más cerca, más frío'],
            ],
          },
          {
            type: 'tf',
            q: 'Cuanto más alta es una montaña, más calor hace.',
            truth: false,
            fix: 'Cuanto más alta es una montaña, más frío hace.',
          },
          {
            type: 'tf',
            q: 'Los lugares junto al mar tienen un clima más suave.',
            truth: true,
          },
          {
            type: 'choice',
            q: 'Hace más calor en el ecuador que en los polos porque el ecuador está…',
            options: ['más lejos de los polos', 'más cerca de los polos', 'más alto que los polos'],
            answer: 0,
            fact: 'Cuanto más lejos de los polos, hace menos frío.',
          },
          {
            type: 'pick',
            q: 'Toca los factores del clima.',
            text: 'El clima depende de la [altitud], del [relieve] y de la [distancia] al mar y a los polos. No depende del color de la casa.',
            fact: 'Altitud, relieve, distancia al mar y distancia a los polos.',
          },
        ],
      },

      // ---------------- 4 Zonas climáticas ----------------
      {
        id: 'zonas',
        title: 'Zonas climáticas',
        icon: '🌍',
        intro:
          'La Tierra tiene tres zonas climáticas: cálida, templada y fría. Las separan líneas imaginarias: el ecuador, los trópicos y los círculos polares.',
        vocab: [
          ['la zona climática', 'кліматична зона'],
          ['el ecuador', 'екватор'],
          ['el trópico', 'тропік'],
          ['el círculo polar', 'полярне коло'],
          ['cálido', 'теплий, жаркий'],
          ['templado', 'помірний'],
          ['frío', 'холодний'],
          ['redondo', 'круглий'],
        ],
        text: {
          title: 'Zonas climáticas',
          paragraphs: [
            'La Tierra es redonda y el sol la calienta de forma desigual, por eso hay tres zonas. Cálida: entre los trópicos. Templada: entre trópicos y círculos polares. Fría: dentro de los círculos polares.',
          ],
        },
        tasks: [
          {
            type: 'label',
            q: 'Pon cada nombre en su línea imaginaria.',
            scene: 'globo',
            labels: [
              { id: 'ecuador', text: 'Ecuador' },
              { id: 'cancer', text: 'Trópico de Cáncer' },
              { id: 'capricornio', text: 'Trópico de Capricornio' },
              { id: 'artico', text: 'Círculo polar ártico' },
              { id: 'antartico', text: 'Círculo polar antártico' },
            ],
            fact: 'De norte a sur: círculo polar ártico, trópico de Cáncer, ecuador, trópico de Capricornio y círculo polar antártico.',
          },
          {
            type: 'label',
            q: 'Pon cada zona climática en su sitio.',
            scene: 'globo',
            labels: [
              { id: 'fria', text: 'Zona fría' },
              { id: 'templada', text: 'Zona templada' },
              { id: 'calida', text: 'Zona cálida' },
            ],
          },
          {
            type: 'choice',
            q: '¿Cuántas zonas climáticas hay en la Tierra?',
            options: ['tres', 'dos', 'cuatro'],
            answer: 0,
            fact: 'Zona fría, zona templada y zona cálida.',
          },
          {
            type: 'choice',
            q: 'La zona de climas cálidos está entre…',
            options: ['el ecuador y los trópicos', 'los trópicos y los polos', 'los círculos polares y los polos'],
            answer: 0,
            fact: 'Se extiende desde el ecuador hasta el trópico de Cáncer y el de Capricornio.',
          },
          {
            type: 'choice',
            q: 'Dentro de los círculos polares está la zona…',
            options: ['fría', 'templada', 'cálida'],
            answer: 0,
            fact: 'La zona de climas fríos está dentro de los círculos polares.',
          },
          {
            type: 'choice',
            q: 'España está entre los trópicos y el círculo polar ártico. Está en la zona…',
            options: ['templada', 'fría', 'cálida'],
            answer: 0,
            fact: 'España está en la zona de climas templados.',
          },
          {
            type: 'pairs',
            q: 'Une cada línea imaginaria con su lugar.',
            pairs: [
              ['trópico de Cáncer', 'Al norte del ecuador'],
              ['trópico de Capricornio', 'Al sur del ecuador'],
              ['círculo polar ártico', 'Cerca del polo norte'],
              ['círculo polar antártico', 'Cerca del polo sur'],
            ],
          },
          {
            type: 'tf',
            q: 'El trópico de Capricornio está al norte del ecuador.',
            truth: false,
            fix: 'El trópico de Capricornio está al sur del ecuador. El de Cáncer está al norte.',
          },
          {
            type: 'tf',
            q: 'Hay zonas climáticas porque la Tierra es redonda y recibe los rayos del sol de forma desigual.',
            truth: true,
          },
          {
            type: 'sort',
            q: '¿En qué zona climática está cada lugar?',
            bins: ZONES,
            items: [
              { text: 'Entre el ecuador y el trópico de Cáncer', bin: 'calida' },
              { text: 'Entre el trópico de Capricornio y el ecuador', bin: 'calida' },
              { text: 'Dentro del círculo polar ártico', bin: 'fria' },
              { text: 'Dentro del círculo polar antártico', bin: 'fria' },
              { text: 'Entre el trópico de Cáncer y el círculo polar ártico', bin: 'templada' },
              { text: 'Entre el círculo polar antártico y el trópico de Capricornio', bin: 'templada' },
            ],
          },
          {
            type: 'choice',
            q: 'Los trópicos son líneas imaginarias paralelas al…',
            options: ['ecuador', 'polo sur', 'mar'],
            answer: 0,
            fact: 'El ecuador y los trópicos son líneas imaginarias que no se ven en la Tierra.',
          },
        ],
      },

      // ---------------- 5 Paisajes de cada zona ----------------
      {
        id: 'paisajes',
        title: 'Paisajes de cada zona',
        icon: '🌲',
        intro:
          'En la zona fría hay taiga y tundra. En la templada, bosque mediterráneo y bosque frondoso. En la cálida, selva y sabana. Los seres vivos se adaptan a su zona.',
        vocab: [
          ['la taiga', 'тайга'],
          ['la tundra', 'тундра'],
          ['el bosque mediterráneo', 'середземноморський ліс'],
          ['el bosque frondoso', 'листяний ліс'],
          ['la selva', 'джунглі'],
          ['la sabana', 'савана'],
          ['la conífera', 'хвойне дерево'],
          ['el musgo', 'мох'],
        ],
        text: {
          title: 'Paisajes de cada zona',
          paragraphs: [
            'En la zona fría hay taiga, con coníferas, y tundra, con arbustos y musgo. En la templada, bosque mediterráneo y bosque atlántico. En la cálida, selva si llueve mucho y sabana si llueve menos.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            pics: true,
            q: '¿Cuál es la taiga, el bosque de coníferas?',
            options: ['taiga', 'tundra', 'selva'],
            labels: ['La taiga', 'La tundra', 'La selva'],
            answer: 0,
            fact: 'La taiga tiene grandes bosques de coníferas.',
          },
          {
            type: 'choice',
            pics: true,
            q: '¿Cuál es el paisaje frío de arbustos y musgo?',
            options: ['tundra', 'taiga', 'sabana'],
            labels: ['La tundra', 'La taiga', 'La sabana'],
            answer: 0,
            fact: 'En la tundra solo crecen arbustos y musgo.',
          },
          {
            type: 'choice',
            pics: true,
            q: '¿Cuál es el bosque frondoso o atlántico, con hayas y castaños?',
            options: ['bosque-frondoso', 'bosque-mediterraneo', 'selva'],
            labels: ['Bosque frondoso', 'Bosque mediterráneo', 'Selva'],
            answer: 0,
            fact: 'El bosque frondoso crece donde llueve más.',
          },
          {
            type: 'choice',
            pics: true,
            q: 'En esta zona cálida llueve menos que en la selva. ¿Cuál es?',
            options: ['sabana', 'selva', 'taiga'],
            labels: ['La sabana', 'La selva', 'La taiga'],
            answer: 0,
            fact: 'Donde llueve menos en la zona cálida se extiende la sabana.',
          },
          {
            type: 'sort',
            q: '¿En qué zona climática está cada paisaje?',
            bins: ZONES,
            items: [
              { text: 'taiga', bin: 'fria' },
              { text: 'tundra', bin: 'fria' },
              { text: 'bosque mediterráneo', bin: 'templada' },
              { text: 'bosque frondoso', bin: 'templada' },
              { text: 'selva', bin: 'calida' },
              { text: 'sabana', bin: 'calida' },
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada paisaje con sus plantas.',
            pairs: [
              ['taiga', 'Coníferas'],
              ['tundra', 'Arbustos y musgo'],
              ['bosque mediterráneo', 'Pinos y encinas'],
              ['bosque frondoso', 'Hayas y castaños'],
            ],
          },
          {
            type: 'tf',
            q: 'Los árboles del bosque mediterráneo pierden las hojas en otoño.',
            truth: false,
            fix: 'Los del bosque mediterráneo siempre tienen hojas. Los del bosque frondoso o atlántico las pierden en otoño.',
          },
          {
            type: 'choice',
            q: '¿Dónde crece la selva?',
            options: ['en las zonas cálidas más lluviosas', 'cerca de los polos', 'en las zonas templadas más secas'],
            answer: 0,
            fact: 'La selva crece donde hace calor y llueve mucho.',
          },
          {
            type: 'choice',
            q: 'El bosque mediterráneo crece en las zonas templadas más…',
            options: ['secas', 'lluviosas', 'frías'],
            answer: 0,
            fact: 'El mediterráneo crece donde llueve menos; el frondoso, donde llueve más.',
          },
          {
            type: 'fill',
            q: 'Completa la frase.',
            text: 'Los seres vivos se ___ a la zona climática en la que viven.',
            answer: 'adaptan',
            extra: 'ol',
            fact: 'Las plantas y los animales se adaptan a su zona climática.',
          },
        ],
      },

      // ---------------- 6 El climograma ----------------
      {
        id: 'climograma',
        title: 'El climograma',
        icon: '📊',
        intro:
          'Un climograma es un gráfico del clima de un año: una línea para la temperatura en °C y barras para las precipitaciones en mm. Abajo van los meses.',
        vocab: [
          ['el climograma', 'кліматограма'],
          ['la temperatura', 'температура'],
          ['las precipitaciones', 'опади'],
          ['el grado centígrado', 'градус Цельсія'],
          ['el milímetro', 'міліметр'],
          ['la barra', 'стовпчик'],
          ['el eje', 'вісь'],
          ['el mes', 'місяць'],
        ],
        text: {
          title: 'El climograma',
          paragraphs: [
            'Un climograma junta en un gráfico un año de datos. La línea roja marca la temperatura en grados centígrados y las barras azules, la lluvia en milímetros. Abajo van los meses.',
          ],
        },
        tasks: [
          climo('Toca el mes en que hace más calor.', 'Un lugar del libro', BOOK_T, BOOK_R, {
            mode: 'tapMonth',
            answer: 6,
            fact: 'La línea más alta es la de julio: 20 °C.',
          }),
          climo('Este climograma es de un lugar de Asturias. Toca el mes en que llueve más.', 'Oviedo', OVIEDO_T, OVIEDO_R, {
            mode: 'tapMonth',
            answer: 11,
            fact: 'La barra más alta es la de diciembre.',
          }),
          climo('Este climograma es de un desierto. Toca el mes más caluroso.', 'Un desierto', DESIERTO_T, DESIERTO_R, {
            mode: 'tapMonth',
            answer: 5,
            fact: 'En junio se llega a los 35 °C, y casi no llueve en todo el año.',
          }),
          climo('Mira la tabla y construye la barra de lluvia que falta.', 'Un lugar del libro', BOOK_T, BOOK_R, {
            mode: 'fillBar',
            missing: 8,
            table: true,
            fact: 'En septiembre llovieron 75 mm.',
          }),
          climo('Mira la tabla y construye la barra de lluvia que falta.', 'Un pueblo de montaña', MONTE_T, MONTE_R, {
            mode: 'fillBar',
            missing: 7,
            table: true,
            fact: 'En agosto llovieron 60 mm.',
          }),
          {
            type: 'choice',
            q: 'En un climograma, la línea roja muestra…',
            options: ['la temperatura', 'la lluvia', 'el viento'],
            answer: 0,
            fact: 'La línea es la temperatura, en grados centígrados (°C).',
          },
          {
            type: 'choice',
            q: 'En un climograma, las barras azules muestran…',
            options: ['las precipitaciones', 'la temperatura', 'los meses'],
            answer: 0,
            fact: 'Las barras son la lluvia, en milímetros (mm).',
          },
          {
            type: 'order',
            q: 'Ordena los pasos para hacer un climograma.',
            items: [
              'Registra los datos en una tabla',
              'Dibuja el gráfico con sus ejes',
              'Punta la temperatura y une los puntos',
              'Dibuja las barras de lluvia',
            ],
            fact: 'Datos, gráfico, temperatura y por último la lluvia.',
          },
          {
            type: 'pairs',
            q: 'Une cada dato con su unidad.',
            pairs: [
              ['la temperatura', 'grados centígrados (°C)'],
              ['las precipitaciones', 'milímetros (mm)'],
              ['los meses', 'letras: E F M A M J J A S O N D'],
            ],
          },
          {
            type: 'tf',
            q: 'Un lugar con temperaturas siempre altas y casi sin lluvia, como el desierto del climograma, está en la zona cálida.',
            truth: true,
            fact: 'Mucho calor todo el año: es de la zona de climas cálidos.',
          },
        ],
      },

      // ---------------- 7 La forma del paisaje ----------------
      {
        id: 'forma',
        title: 'La forma del paisaje',
        icon: '🏞️',
        intro:
          'Un paisaje es lo que ves desde un lugar. Puede ser natural o humanizado, de costa o de interior. Su relieve tiene montañas, valles, playas, cabos…',
        vocab: [
          ['el paisaje', 'краєвид, ландшафт'],
          ['natural', 'природний'],
          ['humanizado', 'змінений людиною'],
          ['la costa', 'узбережжя'],
          ['el interior', 'внутрішні території'],
          ['la montaña', 'гора'],
          ['la llanura', 'рівнина'],
          ['el valle', 'долина'],
        ],
        text: {
          title: 'La forma del paisaje',
          paragraphs: [
            'Un paisaje es lo que ves desde un lugar. Puede ser natural o humanizado, de costa o de interior. Las formas del terreno forman el relieve: montañas, valles, playas, islas.',
          ],
        },
        tasks: [
          spot(
            'valle',
            ['pueblo', 'carretera', 'puente', 'cultivos', 'torre-electrica'],
            'Pueblo, carretera, puente, cultivos y torre eléctrica los hicieron las personas.',
          ),
          spot('costa', ['puerto', 'faro', 'hotel', 'barcos'], 'Puerto, faro, hotel y barcos son obra de las personas.'),
          spot('llanura', ['cultivos', 'granja', 'carretera'], 'Cultivos, granja y carretera los han hecho las personas.'),
          {
            type: 'choice',
            q: 'Un paisaje es…',
            options: ['el territorio que ves desde un lugar', 'solo lo que ves desde una ventana', 'un dibujo del clima'],
            answer: 0,
            fact: 'Un paisaje es el territorio que puedes ver desde un lugar determinado.',
          },
          {
            type: 'sort',
            q: '¿Es un elemento natural o hecho por las personas?',
            bins: [
              { id: 'natural', label: 'Natural', icon: '🌳' },
              { id: 'humano', label: 'Hecho por personas', icon: '🏗️' },
            ],
            items: [
              { text: 'un bosque', bin: 'natural' },
              { text: 'una montaña', bin: 'natural' },
              { text: 'un río', bin: 'natural' },
              { text: 'una carretera', bin: 'humano' },
              { text: 'un edificio', bin: 'humano' },
              { text: 'un campo de cultivo', bin: 'humano' },
            ],
          },
          {
            type: 'sort',
            q: '¿Es relieve de costa o de interior?',
            bins: [
              { id: 'costa', label: 'De costa', icon: '🏖️' },
              { id: 'interior', label: 'De interior', icon: '⛰️' },
            ],
            items: [
              { text: 'acantilado', bin: 'costa' },
              { text: 'playa', bin: 'costa' },
              { text: 'cabo', bin: 'costa' },
              { text: 'golfo', bin: 'costa' },
              { text: 'montaña', bin: 'interior' },
              { text: 'llanura', bin: 'interior' },
              { text: 'valle', bin: 'interior' },
              { text: 'meseta', bin: 'interior' },
            ],
          },
          {
            type: 'label',
            q: 'Pon cada nombre en su forma de relieve de interior.',
            scene: 'relieve',
            labels: [
              { id: 'montana', text: 'Montaña' },
              { id: 'llanura', text: 'Llanura' },
              { id: 'valle', text: 'Valle' },
              { id: 'meseta', text: 'Meseta' },
            ],
            fact: 'Valle: llanura entre montañas. Meseta: llanura elevada.',
          },
          {
            type: 'label',
            q: 'Pon cada nombre en su forma de relieve de costa.',
            scene: 'relieve',
            labels: [
              { id: 'acantilado', text: 'Acantilado' },
              { id: 'playa', text: 'Playa' },
              { id: 'cabo', text: 'Cabo' },
              { id: 'golfo', text: 'Golfo' },
              { id: 'isla', text: 'Isla' },
            ],
            fact: 'Cabo: tierra que entra en el mar. Golfo: mar que entra en la tierra.',
          },
          {
            type: 'choice',
            pics: true,
            q: 'El mar entra en la tierra. ¿Cuál es el golfo?',
            options: ['golfo', 'cabo', 'isla'],
            labels: ['Un golfo', 'Un cabo', 'Una isla'],
            answer: 0,
            fact: 'Un golfo es un entrante del mar en la tierra.',
          },
          {
            type: 'pairs',
            q: 'Une cada forma de relieve con su definición.',
            pairs: [
              ['la sierra', 'Muchas montañas juntas'],
              ['el valle', 'Llanura entre montañas'],
              ['la meseta', 'Llanura elevada'],
              ['la llanura', 'Terreno plano'],
            ],
          },
          {
            type: 'choice',
            q: 'Los paisajes de interior se encuentran…',
            options: ['lejos de la costa', 'junto al mar', 'dentro del mar'],
            answer: 0,
            fact: 'Los de interior están lejos de la costa; pueden ser llanos o montañosos.',
          },
          {
            type: 'tf',
            q: 'Un cabo es un entrante del mar en la tierra.',
            truth: false,
            fix: 'Un cabo es tierra que entra en el mar. El entrante del mar en la tierra es un golfo.',
          },
        ],
      },

      // ---------------- 8 España: relieve y climas ----------------
      {
        id: 'espana',
        title: 'España: relieve y climas',
        icon: '🇪🇸',
        intro:
          'España está en la zona templada. Tiene costa, montañas, una gran meseta y ríos. Sus cinco climas forman paisajes muy distintos.',
        vocab: [
          ['el Teide', 'вулкан Тейде'],
          ['los Pirineos', 'Піренеї'],
          ['la Meseta Central', 'Центральне плоскогір’я'],
          ['el río Ebro', 'річка Ебро'],
          ['el río Guadalquivir', 'річка Гвадалквівір'],
          ['oceánico', 'океанічний'],
          ['subtropical', 'субтропічний'],
          ['el alcornoque', 'коркове дерево'],
        ],
        text: {
          title: 'España: relieve y climas',
          paragraphs: [
            'España limita con el Atlántico, el Mediterráneo y el Cantábrico, y está en la zona templada. Tiene Pirineos, Meseta Central, Teide y cinco climas, como el oceánico y el subtropical.',
          ],
        },
        tasks: [
          {
            type: 'choice',
            q: '¿Qué mar baña el norte de España?',
            options: ['el Cantábrico', 'el Mediterráneo', 'el Atlántico'],
            answer: 0,
            fact: 'El Atlántico está al oeste, el Mediterráneo al este y el Cantábrico al norte.',
          },
          {
            type: 'choice',
            q: 'España tiene frontera con Francia al norte, con Portugal al oeste y con…',
            options: ['Marruecos al sur', 'Italia al este', 'Argelia al norte'],
            answer: 0,
            fact: 'Francia, Portugal y Marruecos son los países vecinos.',
          },
          {
            type: 'choice',
            q: 'La montaña más alta de España es el volcán…',
            options: ['Teide', 'Ebro', 'Guadalquivir'],
            answer: 0,
            fact: 'El Teide, en las islas Canarias, es la montaña más elevada de España.',
          },
          {
            type: 'choice',
            q: 'La Meseta Central es…',
            options: ['una gran llanura elevada', 'un valle entre montañas', 'un entrante del mar'],
            answer: 0,
            fact: 'Meseta: llanura elevada. La Meseta Central es muy extensa.',
          },
          {
            type: 'choice',
            q: 'Los ríos Guadalquivir y Ebro han excavado extensos…',
            options: ['valles', 'acantilados', 'volcanes'],
            answer: 0,
            fact: 'Hay un valle del Ebro y un valle del Guadalquivir.',
          },
          climateMap(
            ['oceanico', 'interior', 'subtropical'],
            { asturias: 'oceanico', galicia: 'oceanico', 'castilla-y-leon': 'mediterraneo-interior', canarias: 'subtropical' },
            'Norte: oceánico. Interior de la península: mediterráneo de interior. Canarias: subtropical.',
          ),
          climateMap(
            ['oceanico', 'interior', 'litoral', 'subtropical'],
            {
              cantabria: 'oceanico',
              extremadura: 'mediterraneo-interior',
              valencia: 'mediterraneo-litoral',
              baleares: 'mediterraneo-litoral',
              canarias: 'subtropical',
            },
            'Cantabria: oceánico. Extremadura: de interior. Valencia y Baleares: litoral. Canarias: subtropical.',
          ),
          {
            type: 'pairs',
            q: 'Une cada clima con cómo es.',
            pairs: [
              ['oceánico', 'Lluvias abundantes y temperaturas suaves'],
              ['de montaña', 'Mucha lluvia, frío en invierno y verano fresco'],
              ['mediterráneo de interior', 'Lluvias escasas, frío en invierno y calor en verano'],
              ['subtropical', 'Lluvias irregulares y temperaturas suaves'],
            ],
          },
          {
            type: 'pairs',
            q: 'Une cada clima con sus árboles.',
            pairs: [
              ['oceánico', 'Robles, hayas y castaños'],
              ['mediterráneo de interior', 'Encina y alcornoque'],
              ['mediterráneo litoral', 'Pino, palmera y palmito'],
              ['subtropical', 'Laurisilva, pino y drago'],
            ],
          },
          {
            type: 'choice',
            q: '¿Qué cadena de montañas separa España de Francia?',
            options: ['los Pirineos', 'la Meseta Central', 'el Teide'],
            answer: 0,
            fact: 'Los Pirineos están en el norte, en la frontera con Francia.',
          },
        ],
      },
    ];

    // Final exam: 15 tasks (2 per station, 1 of «El hombre del tiempo»); the 4th mistake (a storm) lands the balloon.
    const exam = {
      title: 'Vuelo final',
      icon: '🏆',
      perStation: { tiempo: 2, parte: 1, factores: 2, zonas: 2, paisajes: 2, climograma: 2, forma: 2, espana: 2 },
      redAfter: 4,
      sendOff: true,
      var: 2,
    };

    // Station tile colours (sky, sunset, balloon).
    const hues = {
      tiempo: '#3a8fb7',
      parte: '#5b7c99',
      factores: '#7a6bb5',
      zonas: '#2f8a6a',
      paisajes: '#5f9a3a',
      climograma: '#d4752e',
      forma: '#a8743f',
      espana: '#c2413b',
    };

    // Round sampling: the unit's own types always present (at most twice in a round, once in an exam draw).
    const sampling = {
      caps: { spainMap: 2, climograma: 2, spot: 2, label: 1, sort: 1, order: 1, pairs: 1, pick: 2, fill: 2 },
      examCaps: { spainMap: 1, climograma: 1, spot: 1, label: 1, sort: 1, order: 1, pairs: 1, pick: 1, fill: 1 },
      always: ['spainMap', 'climograma', 'spot'],
    };

    // Balloon theme: every default text a player can see that talks about football or cards is overridden.
    const strings = {
      scoreIcon: '🎈',
      examEyebrow: 'Vuelo final',
      examTitle: 'Vuelo final',
      goalsLabel: 'Aciertos',
      cardsLabel: 'Nubes',
      examInfo: ({ n }) => `${n} preguntas de toda la unidad, como en el cole. Cada fallo es una ☁️ nube. ¡Tranquilidad, es para practicar!`,
      examInfoOff: ({ n, red }) =>
        `${n} preguntas de toda la unidad. Cada fallo es una ☁️ nube y la ${red}.ª es una ⛈️ tormenta: el globo tiene que aterrizar y no hay monedas. ¡Con cuidado!`,
      yellow: '¡Una nube!',
      yellowText: 'No pasa nada. ¡Sigue volando!',
      yellowLeft: ({ n }) => `¡Cuidado! ${n === 1 ? 'Falta 1 fallo' : `Faltan ${n} fallos`} para la tormenta.`,
      red: '¡Tormenta!',
      redText: 'Hay tormenta, pero el vuelo sigue. Al final verás qué temas repasar.',
      redOff: 'El globo tiene que aterrizar.',
      varBtn: ({ n }) => `📡 Radar: esquivar la tormenta (${n} 🪙)`,
      varNeed: ({ n }) => `Necesitas ${n} 🪙`,
      varDone: 'Radar: ¡tormenta esquivada!',
      varDoneText: 'La ⛈️ se esquiva y el vuelo sigue. ¡Con cuidado: la próxima tormenta ya no se puede esquivar!',
      sentOffTitle: '¡Aterrizaje forzoso! ⛈️',
      sentOffText: ({ n }) =>
        `Con ${n} fallos la tormenta obliga al globo a aterrizar. Esta vez no hay monedas. Repasa las estaciones y vuelve a despegar.`,
      examCards: ({ y, r }) => `Nubes: ${y} ☁️${r ? ' · 1 ⛈️' : ''}`,
      noCards: '¡Cielo despejado, sin nubes!',
      examMsgOk: 'Muy buen vuelo. Repasa los temas en naranja y vuelve a intentarlo.',
    };

    return {
      slug: 'sociales-clima',
      lang: 'es',
      title: 'La vuelta al mundo en globo',
      subject: 'Ciencias Sociales · 3.º',
      unitLabel: 'Tema 2 · Prueba de Sociales',
      intro:
        'Viaja en globo por el mundo y aprende el tiempo, el clima y los paisajes en ocho estaciones. Cuando estés listo, haz el vuelo final: el examen.',
      stations,
      exam,
      hues,
      sampling,
      strings,
      // «¡Golazo!» of the default cheers is football: the balloon unit has its own.
      lists: { praise: ['¡Muy bien!', '¡Vuelo perfecto!', '¡Genial!', '¡Eso es!', '¡Perfecto!'] },
      testHook: '__sc',
      readFirst: false,
      round: 6,
      practiceCoin: 0.5,
    };
  })()
);
