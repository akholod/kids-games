// «Команда слів» / «Equipo de palabras»: the exam engine (shared/exam/) runs the game. This file adds the word squad:
// every answer updates that word's results (KF.gameData(unit.store)); missed words come back more often (sampling
// weights), and a word joins the squad after 2 right answers in a row — for good.
'use strict';
(() => {
  const unit = window.WM_CONTENT;
  const T = KF.i18n({ uk: unit.strings, es: unit.strings }); // the unit's strings are already in the site's language
  /** @type {Record<string, WMStat>} */
  const stats = { ...(KF.gameData(unit.store).w || {}) };

  /** @param {ExamTask} task */
  const weight = (task) => {
    if (!task.key) return 1;
    const s = stats[task.key];
    if (!s) return 2; // a new word
    if (!s.run && s.miss) return 4; // missed last time
    return s.team ? 0.6 : 1.5; // squad words still come back, less often
  };

  /** @param {ExamSessionTask} task @param {boolean} correct */
  const onAnswer = (task, correct) => {
    if (!task.key) return;
    const s = (stats[task.key] ||= { ok: 0, miss: 0, run: 0, team: 0 });
    if (correct) {
      s.ok++;
      s.run++;
      if (!s.team && s.run >= 2) {
        s.team = 1;
        KFUI.toast(T('squadNew', { w: unit.words[task.key]?.en || '' }));
      }
    } else {
      s.miss++;
      s.run = 0;
    }
    KF.gameData(unit.store, { w: stats });
  };

  KFExam.mount(unit, { art: window.WMArt, types: window.WM_TYPES, weight, onAnswer });
})();
