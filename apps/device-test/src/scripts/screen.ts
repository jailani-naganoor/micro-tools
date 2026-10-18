// Full-screen solid colour cycling for spotting dead, stuck and hot pixels.

const COLOURS: [name: string, value: string][] = [
  ['Black', '#000000'],
  ['White', '#ffffff'],
  ['Red', '#ff0000'],
  ['Green', '#00ff00'],
  ['Blue', '#0000ff'],
  ['Cyan', '#00ffff'],
  ['Magenta', '#ff00ff'],
  ['Yellow', '#ffff00'],
  ['Grey', '#808080'],
];

export function initScreen() {
  const startBtn = document.getElementById('screen-start') as HTMLButtonElement;
  const overlay = document.getElementById('screen-overlay') as HTMLDivElement;
  const hint = document.getElementById('screen-hint') as HTMLParagraphElement;
  const colourLabel = document.getElementById('screen-colour') as HTMLParagraphElement;
  const status = document.getElementById('screen-status') as HTMLParagraphElement;
  let index = 0;
  let hintTimer = 0;
  let open = false;

  function show(i: number) {
    index = i;
    const [name, value] = COLOURS[i];
    overlay.style.backgroundColor = value;
    overlay.setAttribute('aria-label', `Dead pixel test: ${name} (${i + 1} of ${COLOURS.length})`);
    colourLabel.textContent = `${name}, ${i + 1} of ${COLOURS.length}`;
  }

  async function start() {
    open = true;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    show(0);
    hint.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => (hint.hidden = true), 3000);
    overlay.focus();
    if (overlay.requestFullscreen && document.fullscreenEnabled) {
      try {
        await overlay.requestFullscreen({ navigationUI: 'hide' });
      } catch {
        // Fullscreen refused (e.g. iPhone): the fixed overlay still covers the viewport.
      }
    }
  }

  function close(message = 'Dead pixel test closed.') {
    if (!open) return;
    open = false;
    clearTimeout(hintTimer);
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    status.textContent = message;
    startBtn.focus();
  }

  function next() {
    if (index + 1 >= COLOURS.length) close('Dead pixel test finished: all colours shown.');
    else show(index + 1);
  }

  function prev() {
    show(Math.max(0, index - 1));
  }

  startBtn.addEventListener('click', () => void start());
  overlay.addEventListener('click', next);
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') next();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') prev();
    else if (e.key !== 'Tab') return;
    // Tab stays inside the dialog (the overlay is its only focusable element).
    e.preventDefault();
    e.stopPropagation();
  });
  // Pressing Esc in fullscreen is handled by the browser, which just exits fullscreen.
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && open) close();
  });
}
