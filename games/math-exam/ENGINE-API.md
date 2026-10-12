# math-exam engine API (contract between engine.js and index.html)

`games/math-exam/engine.js` — pure logic, no DOM. Plain script: assigns `globalThis.MathExam`
(works in browser via `<script src="engine.js">` and in Node via `require`/import side effect).
All user-facing strings: `es` = Spanish exactly as in a Spanish 3º Primaria exam, `ua` = short Ukrainian explanation.

## Numbers
- `fmt(n)` → string with thousands point: `4528 → "4.528"`, `1000 → "1.000"`, `987 → "987"`, `10000 → "10.000"`.
- `PLACES` → `[{ key:'UM', es:'unidades de millar', ua:'одиниці тисяч', value:1000 }, { key:'C', es:'centenas', ua:'сотні', value:100 }, { key:'D', es:'decenas', ua:'десятки', value:10 }, { key:'U', es:'unidades', ua:'одиниці', value:1 }]`
- `digits(n)` → `{ UM, C, D, U }` (numbers 0..9999).
- `roundTo(n, place)` → place `'D'|'C'|'UM'`; half rounds up ("el 5 sube").

## Tasks
`makeTask(topic, level, rng = Math.random)` → task object:
```
{
  id, topic, level, kind,
  es,              // prompt in Spanish, e.g. "¿Cuánto vale la cifra 5 en 4.528?"
  ua,              // short Ukrainian hint/explanation of the prompt
  answer,          // canonical answer: number | string | object (see kinds)
  choices?,        // for kind 'choice': array of { label, value } (3–4, shuffled, unique)
  data,            // kind-specific payload for rendering (see below)
}
```
`checkAnswer(task, value)` → `{ correct: boolean, error?: { code, es, ua } }` — friendly explanation on mistakes.

Topics and levels (`LEVELS[topic]` = array of `{ level, es, ua }` titles):

### `valor` (Taquilla)
1. place of a digit: "¿Qué cifra ocupa el lugar de las centenas en 4.528?" → kind `choice`
2. value of a digit: "¿Cuánto vale la cifra 5 en 4.528?" → kind `choice` (500 / 50 / 5 / 5.000)
3. build number from packs: data `{ target }`, kind `packs` — answer `{ UM, C, D, U }`; checkAnswer accepts any packs whose total equals target (non-canonical too, e.g. 14 C).
4. descomposición: "Descompón 4.528" → kind `decompose`, answer `{ UM:4, C:5, D:2, U:8 }`; also accepts additive form via `checkAnswer(task, [4000,500,20,8])`.
5. read packs → number: data `{ packs:{UM,C,D,U} }` (may be non-canonical, e.g. 3 UM 12 C 4 D 15 U), kind `number`.

### `columna` (Pase a la columna)
kind `column`, data:
```
{ op:'+'|'-', a, b, result,
  steps: [ // right to left: U, D, C, UM
    { place:'U', top, bottom, digit, carryOut }            // '+' : top+bottom+carryIn
    { place:'U', top, bottom, digit, borrowed:true|false,   // '-' : pedir prestado
      topAfter, lentFrom:'D'|null }                         //      topAfter = top+10 if borrowed
  ],
  marks: { // notebook marks for pedir prestado, by place
    crossed: { D:true, ... },          // top digit crossed out
    newTop:  { D:1, ... },             // value written above (one less, or 9 for a zero in a chain)
    smallOne:{ U:true, ... }           // little "1" written before the digit (3 → 13)
  } }
```
Levels: `+`: 1 no carry (3 digits), 2 one carry (4 digits), 3 several carries; `-`: 4 no borrow, 5 one borrow, 6 several borrows, 7 borrow across zero (e.g. 4.003 − 1.257). Results stay within 0..9999; no negative results.
`checkColumnStep(task, stepIndex, digit, carryOrBorrow?)` → `{ correct, error? }` — for step-by-step input.
`checkAnswer(task, number)` diagnoses whole-answer errors with codes:
- `forgot-carry` (sum done without carrying), `smaller-from-larger` (subtracted smaller digit from larger per column),
- `forgot-decrement` (borrowed but did not reduce the next digit), `misaligned`, `arith` (other slip).

### `redondeo` (¿A qué portería?)
kind `round`, data `{ n, place:'D'|'C'|'UM', low, high, mid }` — answer = rounded value (equals low or high).
Levels: 1 a la decena, 2 a la centena, 3 al millar, 4 mixed + exact midpoints (~25% midpoint cases), 5 no number line (same data, UI hides line).
Keep answers ≤ 9.999 (avoid rounding up to 10.000).
es example: "Redondea 4.538 a la centena más próxima."

### `estimacion` (Mercado de fichajes)
kind `estimate`, data `{ items:[{ name, price }], budget, place:'C'|'UM', rounded:[...], estimate, exact, fits }`
Two phases: answer `{ estimate, exact, fits }`; `checkAnswer(task, { phase:'estimate'|'exact'|'fits', value })`.
Level 3 = optional `problema`: short Spanish word problem (football context), kind `number`, e.g.
"En el estadio hay 3.457 aficionados. Llegan 1.268 más. ¿Cuántos aficionados hay ahora?"

## Exam
- `makeExam({ count = 12, weights })` → mixed array of tasks across topics/levels; `weights` = `{ topicKey: number }` to bias toward weak topics.
- `weakWeights(stats)` → weights from per-topic stats `{ [topic]: { right, total } }` (lower accuracy → higher weight, min weight > 0).

## Persistence (done in index.html, not engine)
`KF.gameData('math-exam')` / `KF.gameData('math-exam', data)` — store `{ topics: { [topic]: { right, total } }, levels: { [topic]: unlockedLevel } }`.
