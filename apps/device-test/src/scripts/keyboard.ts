import { looksTouchOnly } from '../lib/device';
import { CHATTER_MS, KeyStats } from '../lib/key-stats';
import { codesFor, KEYS } from '../lib/keyboard-layout';

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
  const stats = new KeyStats();
  const held = document.getElementById('kb-held')!;
  const max = document.getElementById('kb-max')!;
  const chatterCount = document.getElementById('kb-chatter-count')!;
  const chatterMsg = document.getElementById('kb-chatter')!;
  const touchNote = document.getElementById('kb-touch') as HTMLDivElement;
  const testArea = document.getElementById('kb-test') as HTMLDivElement;
  const labels = new Map(KEYS.map((k) => [k.code, k.label]));

  // Phones and tablets without a keyboard get an explanation instead of a test that can never start.
  let waitingForKeyboard = looksTouchOnly((q) => window.matchMedia(q).matches);
  touchNote.hidden = !waitingForKeyboard;
  testArea.hidden = waitingForKeyboard;

  function revealTest() {
    waitingForKeyboard = false;
    touchNote.hidden = true;
    testArea.hidden = false;
  }

  function updateStats() {
    held.textContent = String(stats.current);
    max.textContent = String(stats.max);
    let total = 0;
    for (const n of stats.chatter.values()) total += n;
    chatterCount.textContent = String(total);
  }
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
    // On-screen keyboards report "Unidentified" (keyCode 229); only a real key press reveals the test.
    if (waitingForKeyboard) {
      if (e.key === 'Unidentified' || e.keyCode === 229 || e.key === 'Tab') return;
      revealTest();
    }
    const code = e.code || e.key;
    const hit = stats.keyDown(code, e.timeStamp, e.repeat);
    if (hit) {
      const name = labels.get(code) ?? code;
      chatterMsg.textContent = `Possible chatter: “${name}” registered again ${Math.round(hit.gap)} ms after it was released (under ${CHATTER_MS} ms).`;
    }
    updateStats();
    out.key.textContent = e.key === ' ' ? 'Space ( )' : e.key;
    out.code.textContent = e.code || '(none)';
    out.keyCode.textContent = String(e.keyCode);
    out.location.textContent = LOCATIONS[e.location] ?? String(e.location);
    mark(code, true);
    const browserShortcut = e.ctrlKey || e.metaKey || e.altKey || /^F(5|11|12)$/.test(e.key);
    if (e.key !== 'Tab' && !browserShortcut && !isControl(e.target)) e.preventDefault();
  });

  document.addEventListener('keyup', (e) => {
    if (!isActive() || waitingForKeyboard) return;
    const code = e.code || e.key;
    stats.keyUp(code, e.timeStamp);
    // macOS doesn't send keyup for keys released while ⌘ is held, so start the held count afresh.
    if (code.startsWith('Meta')) stats.releaseAll();
    updateStats();
    // Some keys (e.g. Print Screen on Windows) only send keyup.
    mark(code, false);
  });

  // Releasing keys while the window is unfocused never sends keyup: clear "down" state.
  window.addEventListener('blur', () => {
    board.querySelectorAll('.kb-key.down').forEach((el) => el.classList.remove('down'));
    stats.releaseAll();
    updateStats();
  });

  document.getElementById('kb-show')!.addEventListener('click', () => {
    revealTest();
    document.getElementById('kb-reset')!.focus();
  });

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
    stats.reset();
    chatterMsg.textContent = '';
    updateStats();
    updateCount();
  });
}
