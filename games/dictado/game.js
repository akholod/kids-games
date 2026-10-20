// «Dictado del míster»: the exam engine (shared/exam/) runs the game. This file keeps per-word results
// (KF.gameData(unit.store)): misspelled words come back more often (sampling weights), well-known ones less often.
'use strict';
(() => {
  const unit = window.DC_CONTENT;
  /** @type {Record<string, DCStat>} */
  const stats = { ...(KF.gameData(unit.store).w || {}) };

  /** @param {ExamTask} task */
  const weight = (task) => {
    if (!task.key) return 1;
    const s = stats[task.key];
    if (!s) return 2; // a new word
    if (!s.run && s.miss) return 4; // misspelled last time
    return s.run >= 2 ? 0.6 : 1.5; // right twice in a row: still comes back, less often
  };

  /** @param {ExamSessionTask} task @param {boolean} correct */
  const onAnswer = (task, correct) => {
    if (!task.key) return;
    const s = (stats[task.key] ||= { ok: 0, miss: 0, run: 0 });
    if (correct) {
      s.ok++;
      s.run++;
    } else {
      s.miss++;
      s.run = 0;
    }
    KF.gameData(unit.store, { w: stats });
  };

  KFExam.mount(unit, { art: window.DCArt, types: window.DC_TYPES, weight, onAnswer });
})();
