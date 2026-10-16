# Football quiz — question bank format

`games/football-quiz/questions.js` — plain script: `window.QUIZ_QUESTIONS = [ ... ];`

```js
{
  id: 'wc-001',            // unique, prefix = category
  level: 1,                // 1 = «Фанат» (knows football well), 2 = «Експерт» (harder: years, records, details)
  lang: 'uk',              // 'uk' | 'es' | 'en' — language of q, options, fact
  category: 'wc',          // wc | clubs | players | rules
  q: 'Яка збірна виграла чемпіонат світу 2022 року?',
  options: ['Аргентина', 'Франція', 'Бразилія', 'Хорватія'], // exactly 4, one correct, no duplicates
  answer: 0,               // index of the correct option in `options` (UI shuffles)
  fact: 'Аргентина обіграла Францію у фіналі по пенальті.', // 1 short sentence, same language as q
  uk: null,                // for es/en: Ukrainian translation of q (+ options in brackets if they are words); null for uk
  es: null,                // for uk/en: Spanish version for the Spanish site (KF.lang === 'es'), null for es:
                           // { q: '…', options: ['…', '…', '…', '…'], fact: '…' } — options in the SAME order as `options`
                           // (so `answer` stays valid), 4 distinct, no Cyrillic. Translation only: same facts, years, answers.
  source: 'https://…',     // page that confirms the answer (fetched and checked)
}
```

Rules
- Audience: 8-year-old who loves football, plays futsal goalkeeper, Ukrainian native, Spanish school, learning English.
- Facts must be verified on the web; no invented facts. Prefer stable facts; anything that changes
  (current club, current champion) must be anchored to a year/season ("у сезоні 2024/25", "en 2024").
  Today is 2026-10-13; recent tournaments (e.g. World Cup 2026) only if verified from reliable sources.
- One unambiguous correct answer; distractors plausible but clearly wrong.
- Language mix across the bank: ~40% uk, ~30% es, ~30% en. Simple wording a kid understands.

Spanish site (`KF.lang === 'es'`)
- Every question is shown in Spanish: `lang: 'es'` questions as they are, uk/en ones through their `es` text.
  A uk/en question without `es` is dropped on the Spanish site. The `uk` hint button/key is off there.
- The `es` texts live in `.pi/quiz/es-translations.json` (`{ id: { q, options, fact } }`); `.pi/quiz/build_bank.py` merges them
  into `questions.js` — edit that file, not the generated one, and re-run `python3 -I .pi/quiz/build_bank.py`.
- Spelling: usual Spanish press forms («Bayern de Múnich», «Atlético de Madrid», «Países Bajos»); Ukrainian clubs/players in
  Latin transliteration as in the es questions («Dynamo Kyiv», «Shakhtar Donetsk»). Questions only meaningful to Ukrainians
  are phrased clearly («el club ucraniano …»).
- Check: `pnpm test:e2e football-quiz` (scripted rounds, also at `?lang=es`).
