// «Читанка-мандрівка»: the exam engine (shared/exam/) runs the game. This file keeps per-word results
// (KF.gameData(unit.store)): missed words come back more often (sampling weights), read ones less often.
'use strict';
(() => {
  const unit = window.CH_CONTENT;
  /** @type {Record<string, CHStat>} */
  const stats = { ...(KF.gameData(unit.store).w || {}) };

  /** @param {ExamTask} task */
  const weight = (task) => {
    if (!task.key) return 1;
    const s = stats[task.key];
    if (!s) return 2; // a new word
    if (!s.run && s.miss) return 4; // missed last time
    return s.run >= 2 ? 0.6 : 1.5; // read well twice in a row: still comes back, less often
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

  KFExam.mount(unit, { art: window.CHArt, types: window.CH_TYPES, weight, onAnswer });
})();
