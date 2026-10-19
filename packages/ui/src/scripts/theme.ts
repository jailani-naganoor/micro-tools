const KEY = 'theme';

function apply(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

export function initThemeToggle() {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const saved = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };
  apply(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        // Choosing the system theme again clears the override.
        if (next === (media.matches ? 'dark' : 'light')) localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, next);
      } catch {
        // Storage blocked: the choice lasts for this page view only.
      }
    });
  }
  media.addEventListener('change', (e) => {
    if (!saved()) apply(e.matches ? 'dark' : 'light');
  });
}
