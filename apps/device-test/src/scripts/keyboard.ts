import { codesFor } from '../lib/keyboard-layout';

const LOCATIONS = ['Standard', 'Left', 'Right', 'Numpad'];

/**
 * Keyboard tester. Listens on the document while the keyboard tab is shown.
 * Default browser actions (scrolling, find-as-you-type…) are suppressed for test keys,
 * except Tab and anything typed into a control, so the page stays keyboard operable.
 */
export function initKeyboard(isActive: () => boolean) {
  const board = document.getElementById('kb-board') as HTMLDivElement;
  const count = document.getElementById('kb-count')!;
  const out = {
    key: document.getElementById('kb-key')!,
    code: document.getElementById('kb-code')!,
    keyCode: document.getElementById('kb-keycode')!,
    location: document.getElementById('kb-location')!,
  };
  const tested = new Set<string>();
  const layoutInputs = document.querySelectorAll<HTMLInputElement>('input[name="kb-layout"]');

  const keysFor = (code: string) => board.querySelectorAll<HTMLElement>(`.kb-key[data-code="${CSS.escape(code)}"]`);

  function updateCount() {
    const layout = board.dataset.layout as 'ansi' | 'iso';
    const onBoard = codesFor(layout);
    count.textContent = String([...tested].filter((c) => onBoard.has(c)).length);
  }

  function mark(code: string, down: boolean) {
    tested.add(code);
    for (const el of keysFor(code)) {
      el.classList.add('tested');
      el.classList.toggle('down', down);
    }
    updateCount();
  }

  function isControl(target: EventTarget | null) {
    return target instanceof HTMLElement && target.closest('input, select, textarea, button, a, summary, [role="tab"]');
  }

  document.addEventListener('keydown', (e) => {
    if (!isActive() || e.isComposing) return;
    const code = e.code || e.key;
    out.key.textContent = e.key === ' ' ? 'Space ( )' : e.key;
    out.code.textContent = e.code || '(none)';
    out.keyCode.textContent = String(e.keyCode);
    out.location.textContent = LOCATIONS[e.location] ?? String(e.location);
    mark(code, true);
    const browserShortcut = e.ctrlKey || e.metaKey || e.altKey || /^F(5|11|12)$/.test(e.key);
    if (e.key !== 'Tab' && !browserShortcut && !isControl(e.target)) e.preventDefault();
  });

  document.addEventListener('keyup', (e) => {
    if (!isActive()) return;
    const code = e.code || e.key;
    // Some keys (e.g. Print Screen on Windows) only send keyup.
    mark(code, false);
  });

  // Releasing keys while the window is unfocused never sends keyup: clear "down" state.
  window.addEventListener('blur', () => board.querySelectorAll('.kb-key.down').forEach((el) => el.classList.remove('down')));

  for (const input of layoutInputs) {
    input.addEventListener('change', () => {
      board.dataset.layout = input.value;
      updateCount();
    });
  }

  document.getElementById('kb-reset')!.addEventListener('click', () => {
    tested.clear();
    board.querySelectorAll('.kb-key').forEach((el) => el.classList.remove('tested', 'down'));
    Object.values(out).forEach((el) => (el.textContent = '–'));
    updateCount();
  });
}
