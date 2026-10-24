// Site settings. This static file is the Ukrainian default; the Spanish Worker
// (wrangler env "es") answers this path itself with lang 'es' — see worker/index.js.
// Loaded in <head>: html[data-site] lets kf.css keep a Spanish page hidden until its scripts have replaced the Ukrainian
// default texts of the static HTML (kf.js sets html.kf-ready).
window.KF_SITE = { lang: 'uk' };
document.documentElement.dataset.site = 'uk';
