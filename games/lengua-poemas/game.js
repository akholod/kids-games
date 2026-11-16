// «La liga de las palabras»: all the game logic is the exam engine (shared/exam/); this unit brings its content, drawings, its
// own task types (the shirt press, the keeper's save, the substitution) and reuses «fix» from «Lenguas por el mundo».
'use strict';
KFExam.mount(window.LP_CONTENT, { art: window.LPArt, types: { fix: window.LE_TYPES.fix, ...window.LP_TYPES } });
