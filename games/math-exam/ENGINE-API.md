# math-exam engine API (contract between engine.js and index.html)

`games/math-exam/engine.js` — pure logic, no DOM. Plain script: assigns `globalThis.MathExam`
(works in browser via `<script src="engine.js">` and in Node via `require`/import side effect).
All user-facing strings: `es` = Spanish exactly as in a Spanish 3º Primaria exam, `ua` = short Ukrainian explanation.

## Numbers
- `fmt(n)` → like the textbook: no separator up to 4 digits, point from 5 digits: `4528 → "4528"`, `1000 → "1000"`, `987 → "987"`, `10000 → "10.000"`. All prompts/messages use it.
- `numberToWords(n)` → Spanish words for 0..9999: `2327 → "dos mil trescientos veintisiete"`, `1100 → "mil cien"`, `21 → "veintiuno"`.
- `PLACES` → `[{ key:'UM', es:'unidades de millar', ua:'одиниці тисяч', value:1000 }, { key:'C', es:'centenas', ua:'сотні', value:100 }, { key:'D', es:'decenas', ua:'десятки', value:10 }, { key:'U', es:'unidades', ua:'одиниці', value:1 }]`
- `digits(n)` → `{ UM, C, D, U }` (numbers 0..9999).
- `roundTo(n, place)` → place `'D'|'C'|'UM'`; half rounds up ("el 5 sube").

## Tasks
`makeTask(topic, level, rng = Math.random)` → task object:
```
{
  id, topic, level, kind,
  es,              // prompt in Spanish, e.g. "¿Cuánto vale la cifra 5 en 4528?"
  ua,              // short Ukrainian hint/explanation of the prompt
  answer,          // canonical answer: number | string | object (see kinds)
  choices?,        // for kind 'choice': array of { label, value } (3–4, shuffled, unique)
  data,            // kind-specific payload for rendering (see below)
}
```
`checkAnswer(task, value)` → `{ correct: boolean, error?: { code, es, ua } }` — friendly explanation on mistakes.

Topics and levels (`LEVELS[topic]` = array of `{ level, es, ua }` titles):

### `valor` (Taquilla)
9 levels (`LEVELS.valor`):
1. 'Lugar de la cifra': "¿Qué cifra ocupa el lugar de las centenas en 4528?" → kind `choice`
2. 'Valor de la cifra': "¿Cuánto vale la cifra 5 en 4528?" → kind `choice` (500 / 50 / 5 / 5000)
3. 'Mayor y menor valor': "¿En qué número tiene la cifra 7 el menor valor?" (or "mayor") → kind `choice`, 3 four-digit numbers (label = `fmt(n)`, value = n), each containing the digit exactly once at different places; data `{ digit, which:'mayor'|'menor' }`.
4. 'Forma el número': data `{ target }`, kind `packs` — answer `{ UM, C, D, U }`; checkAnswer accepts any packs whose total equals target (non-canonical too, e.g. 14 C).
5. 'Descomposición': "Descompón el número 4528 según el valor de sus cifras y la posición que ocupan." → kind `decompose`, answer `{ UM:4, C:5, D:2, U:8 }`; also accepts additive form via `checkAnswer(task, [4000,500,20,8])`.
6. 'Muro de descomposición': kind `number`, "Completa: 3519 = __ C + 1 D + 9 U" → answer = the missing number (35). data `{ sub:'muro', n, parts:[{ value:null|number, key:'UM'|'C'|'D'|'U' }, ...] }`; exactly one part has `value: null`. Forms: UM+C+D+U, C+D+U, D+U, UM+D+U, C+U (digits are never 0).
7. 'Lee los paquetes': data `{ packs:{UM,C,D,U} }` (may be non-canonical, e.g. 3 UM 12 C 4 D 15 U), kind `number`.
8. 'Se lee' (mixed ~50/50):
   - kind `choice`, "¿Cómo se lee 2327?", 3 choices `{ label: numberToWords(v), value: v }` (distractors: digit swaps / one digit changed), answer = the number; data `{ sub:'read', n, words }`.
   - kind `number`, "Escribe con cifras: dos mil trescientos veintisiete", answer = 2327; data `{ sub:'write', n, words }`.
9. 'Añade, quita y series': kind `number`, results stay in 1000..9999:
   - data `{ sub:'add'|'sub', n, place:'UM'|'C'|'D', k }`: "¿Qué número obtienes si añades 2 D a 3817?" / "…si quitas 1 UM a 3817?"
   - data `{ sub:'serie', terms:[t0..t3], step }` (step ±1, ±10, ±100, ±1000, ±5): "Continúa la serie: 7932, 7832, 7732, …" → answer `terms[3]`.

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
Levels 1–3 (every task has ≥1 carry/borrow; prompts "Coloca en torre y calcula: 2816 + 1193" / "Coloca en torre y resta: 4275 − 1159"; op `+`/`-` random ~50/50 per task; operands 4-digit 1000–9999, result ≤ 9999, never negative): 1 exactly one carry/borrow (no zero chains); 2 ≥2 carries/borrows (no zero chains); 3 `-` borrowing across ≥1 zero in the minuend (e.g. 4003 − 1257) or `+` with ≥2 carries where an addend or the sum contains a 0 digit.
`checkColumnStep(task, stepIndex, digit, carryOrBorrow?)` → `{ correct, error? }` — for step-by-step input.
`checkAnswer(task, number)` diagnoses whole-answer errors with codes:
- `forgot-carry` (sum done without carrying), `smaller-from-larger` (subtracted smaller digit from larger per column),
- `forgot-decrement` (borrowed but did not reduce the next digit), `misaligned`, `arith` (other slip).

### `redondeo` (¿A qué portería?)
kind `round`, data `{ n, place:'D'|'C'|'UM', low, high, mid, hideLine? }` — answer = rounded value (equals low or high).
Levels (2): 1 'Con la recta', 2 'Sin recta' (same data plus `hideLine: true` — UI hides the number line). Both levels mix places D/C/UM randomly (~equal) and ~20% exact midpoints. n is 4-digit (occasionally 3-digit for D/C).
Keep answers ≤ 9.999 (avoid rounding up to 10.000).
es examples: "Redondea 3479 a las decenas." / "… a las centenas." / "… a las unidades de millar." Wrong-direction error (code `direction`): "3479 está entre 3470 y 3480. Está más cerca de 3480." (midpoint: "Está justo en el medio: redondeamos hacia arriba, a {high}.").

### `problemas` (Problemas del club)
kind `problema`, data = same as a `column` task `{ op, a, b, result, steps, marks }`; answer = `result`. One operation per problem, football/club wording, always with a carry/borrow, 4-digit operands, result ≤ 9.999.
Levels: 1 'Juntar y quitar' (direct wording: "…Llegan 1268 más. ¿Cuántos aficionados hay ahora?"), 2 'Comparar y completar' (subtraction hidden in "¿cuántos más…?", "¿cuántos faltan…?", plus additions like "tenía … y le regalan …"; from the book: change unknown "…Los alumnos echan algunas más y ahora hay 3450. ¿Cuántas pilas echaron?" → `-`; "…hay 930 ranas más que patos. ¿Cuántas ranas viven?" → `+`; years "…se descubrió en 1796. En 1978 … ¿Cuántos años pasaron?" → `-`, a = later year 1900..2026, b = earlier year 1500..a−1, with borrow). Both levels mix `+` and `-`; `ua` is a neutral hint that does not reveal the operation.
- `checkOp(task, op)` → `{ correct, error? }` for the first step "¿Qué operación?" (`'+'` or `'-'`, `'−'` accepted); error code `wrong-op`.
- `checkAnswer(task, number)` → column diagnosis codes (`forgot-carry`, `smaller-from-larger`, `forgot-decrement`, `misaligned`, `arith`) plus `wrong-op` when the value is `a+b` for a `-` problem or `|a−b|` for a `+` problem.
- `checkColumnStep(task, stepIndex, digit, carryOrBorrow?)` works on `problema` tasks too (same data), for solving the column step by step.

## Exam
- `makeExam({ count = 12, weights })` → mixed array of tasks across topics/levels (kinds: choice, number, packs, decompose, column, round, problema, fix); `weights` = `{ topicKey: number }` to bias toward weak topics.
- `weakWeights(stats)` → weights from per-topic stats `{ [topic]: { right, total } }` (lower accuracy → higher weight, min weight > 0).

## Persistence (done in index.html, not engine)
`KF.gameData('math-exam')` / `KF.gameData('math-exam', data)` — store `{ topics: { [topic]: { right, total } }, levels: { [topic]: unlockedLevel } }`.
