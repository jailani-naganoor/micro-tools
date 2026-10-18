// Accessible tabs (WAI-ARIA tabs pattern) synced with the URL hash: #mic, #webcam,
// #keyboard, #screen. Panels have ids like "panel-mic", so the hash never scrolls the page.

const IDS = ['mic', 'webcam', 'keyboard', 'screen'] as const;
type TabId = (typeof IDS)[number];

function fromHash(hash: string): TabId | null {
  const id = hash.replace(/^#/, '') as TabId;
  return IDS.includes(id) ? id : null;
}

export function initTabs() {
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[role="tab"][data-tab]')];
  const listeners: ((id: TabId) => void)[] = [];
  let current: TabId = 'mic';

  function select(id: TabId, opts: { focus?: boolean; updateHash?: boolean } = {}) {
    current = id;
    for (const tab of tabs) {
      const on = tab.dataset.tab === id;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(`panel-${tab.dataset.tab}`)!.hidden = !on;
      if (on && opts.focus) tab.focus();
    }
    if (opts.updateHash && location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    listeners.forEach((fn) => fn(id));
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab.dataset.tab as TabId, { updateHash: true }));
    tab.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(tab);
      let next: number | null = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      e.stopPropagation();
      select(tabs[next].dataset.tab as TabId, { focus: true, updateHash: true });
    });
  }

  window.addEventListener('hashchange', () => {
    const id = fromHash(location.hash);
    if (id && id !== current) select(id);
  });

  const initial = fromHash(location.hash);
  if (initial) select(initial);

  return {
    current: () => current,
    onChange: (fn: (id: TabId) => void) => listeners.push(fn),
  };
}
