// Runs before first paint: apply the saved or system colour theme, and keep
// *.pages.dev preview URLs out of search results (the _headers file does the same).
(function () {
  var root = document.documentElement;
  var theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch {
    // storage blocked
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', theme);
  if (/\.pages\.dev$/.test(location.hostname)) {
    var meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
  }
})();
