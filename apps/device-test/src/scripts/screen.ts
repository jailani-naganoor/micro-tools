// Full-screen colours and test patterns for spotting dead, stuck and hot pixels, banding
// and backlight bleed.
import { isIPhone } from '../lib/device';

interface Pattern {
  name: string;
  background: string;
  /** Shown briefly when the pattern appears. */
  tip?: string;
}

const PATTERNS: Pattern[] = [
  { name: 'Black', background: '#000000' },
  { name: 'White', background: '#ffffff' },
  { name: 'Red', background: '#ff0000' },
  { name: 'Green', background: '#00ff00' },
  { name: 'Blue', background: '#0000ff' },
  { name: 'Cyan', background: '#00ffff' },
  { name: 'Magenta', background: '#ff00ff' },
  { name: 'Yellow', background: '#ffff00' },
  { name: 'Grey', background: '#808080' },
  {
    name: 'Grey gradient',
    background: 'linear-gradient(to right, #000000, #ffffff)',
    tip: 'Grey gradient: look for visible steps or stripes (banding) instead of a smooth blend.',
  },
  {
    name: 'Checkerboard',
    background: 'repeating-conic-gradient(#000000 0 25%, #ffffff 0 50%) 0 0 / 16px 16px',
    tip: 'Checkerboard: look for squares that are blurred, smeared or uneven, or areas that flicker.',
  },
  {
    name: 'Black for backlight bleed',
    background: '#000000',
    tip: 'Backlight bleed: dim the room lights and look for light glowing in from the edges or corners.',
  },
];

const HINT = 'Click or press → for the next pattern · ← back · Esc to exit';
const NO_FULLSCREEN = 'Full screen isn’t available here, so the test fills the browser window instead.';

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export function initScreen() {
  const startBtn = document.getElementById('screen-start') as HTMLButtonElement;
  const overlay = document.getElementById('screen-overlay') as FsElement;
  const hint = document.getElementById('screen-hint') as HTMLParagraphElement;
  const colourLabel = document.getElementById('screen-colour') as HTMLParagraphElement;
  const status = document.getElementById('screen-status') as HTMLParagraphElement;
  const fsNote = document.getElementById('screen-fs-note') as HTMLParagraphElement;
  const iosTip = document.getElementById('screen-ios-tip') as HTMLParagraphElement;
  const doc = document as FsDocument;
  let index = 0;
  let hintTimer = 0;
  let open = false;
  let fullscreenFailed = false;

  // iPhone browsers can't make a page element full screen. Suggest landscape or Add to Home
  // Screen, unless the site is already running from the home screen.
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  iosTip.hidden = !isIPhone(navigator.userAgent) || standalone;

  const fullscreenElement = () => doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

  function flashHint(text: string, ms = 3000) {
    hint.textContent = text;
    hint.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => (hint.hidden = true), ms);
  }

  function show(i: number) {
    index = i;
    const p = PATTERNS[i];
    overlay.style.background = p.background;
    // Paint the page behind any notch or browser bars in the same colour.
    document.documentElement.style.background = p.background.startsWith('#') ? p.background : '#808080';
    const label = `${p.name}, ${i + 1} of ${PATTERNS.length}`;
    overlay.setAttribute('aria-label', `Dead pixel test: ${label}`);
    colourLabel.textContent = p.tip ? `${label}. ${p.tip}` : label;
    if (p.tip) flashHint(p.tip, 4000);
    else if (i > 0) hint.hidden = true;
  }

  async function requestFullscreen(): Promise<boolean> {
    try {
      if (overlay.requestFullscreen && doc.fullscreenEnabled) {
        await overlay.requestFullscreen({ navigationUI: 'hide' });
        return true;
      }
      if (overlay.webkitRequestFullscreen && doc.webkitFullscreenEnabled) {
        await overlay.webkitRequestFullscreen();
        return !!fullscreenElement();
      }
    } catch {
      // Refused (no user gesture, blocked by policy, or not allowed on this device).
    }
    return false;
  }

  async function start() {
    open = true;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    show(0);
    flashHint(HINT);
    overlay.focus();
    const ok = await requestFullscreen();
    if (!open) return;
    fullscreenFailed = !ok;
    if (!ok) {
      // Fall back to the fixed overlay, which still covers the browser window, and say so.
      flashHint(`${NO_FULLSCREEN} ${HINT}`, 5000);
      fsNote.textContent = isIPhone(navigator.userAgent)
        ? `${NO_FULLSCREEN} See the iPhone tip above for a bigger view.`
        : NO_FULLSCREEN;
    } else {
      fsNote.textContent = '';
    }
  }

  function close(message = 'Dead pixel test closed.') {
    if (!open) return;
    open = false;
    clearTimeout(hintTimer);
    overlay.hidden = true;
    document.body.style.overflow = '';
    document.documentElement.style.background = '';
    status.textContent = fullscreenFailed ? `${message} ${NO_FULLSCREEN}` : message;
    // Leaving fullscreen resets focus once the exit completes, so restore it afterwards.
    const restoreFocus = () => requestAnimationFrame(() => startBtn.focus());
    if (fullscreenElement()) {
      const exit = doc.exitFullscreen ? doc.exitFullscreen() : doc.webkitExitFullscreen?.();
      void Promise.resolve(exit).then(restoreFocus, restoreFocus);
    } else restoreFocus();
  }

  function next() {
    if (index + 1 >= PATTERNS.length) close('Dead pixel test finished: all patterns shown.');
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
  const onFullscreenChange = () => {
    if (!fullscreenElement() && open && !fullscreenFailed) close();
  };
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}
