// Stuck pixel fixer: a draggable box that flashes colours rapidly. It only starts after the
// user confirms a photosensitivity warning (twice when "reduce motion" is on), and one
// click/tap or Esc stops it.

const FLASH_COLOURS = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];
/** Pointer movement (px) below which a press counts as a tap/click, which stops the fixer. */
const TAP_SLOP = 6;

export function initFixer() {
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const openBtn = $<HTMLButtonElement>('fixer-open');
  const sizeSel = $<HTMLSelectElement>('fixer-size');
  const status = $<HTMLParagraphElement>('fixer-status');
  const dialog = $<HTMLDialogElement>('fixer-warning');
  const ok = $<HTMLInputElement>('fixer-ok');
  const okRm = $<HTMLInputElement>('fixer-ok-rm');
  const rmNote = $<HTMLParagraphElement>('fixer-rm-note');
  const rmLabel = $<HTMLLabelElement>('fixer-rm-label');
  const go = $<HTMLButtonElement>('fixer-go');
  const cancel = $<HTMLButtonElement>('fixer-cancel');
  const layer = $<HTMLDivElement>('fixer-layer');
  const box = $<HTMLDivElement>('fixer-box');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let raf = 0;
  let running = false;
  let x = 0;
  let y = 0;
  let size = 128;
  let drag: { id: number; startX: number; startY: number; boxX: number; boxY: number; onBox: boolean; moved: boolean } | null =
    null;

  function needsExtraConfirm() {
    return reducedMotion.matches;
  }

  function updateGo() {
    go.disabled = !ok.checked || (needsExtraConfirm() && !okRm.checked);
  }

  function openWarning() {
    ok.checked = false;
    okRm.checked = false;
    const extra = needsExtraConfirm();
    rmNote.hidden = !extra;
    rmLabel.hidden = !extra;
    updateGo();
    dialog.showModal();
    ok.focus();
  }

  function place(nx: number, ny: number) {
    x = Math.min(Math.max(0, nx), Math.max(0, window.innerWidth - size));
    y = Math.min(Math.max(0, ny), Math.max(0, window.innerHeight - size));
    box.style.transform = `translate(${x}px, ${y}px)`;
  }

  function start() {
    // Only reachable from the confirmed warning dialog.
    if (go.disabled) return;
    dialog.close();
    size = Number(sizeSel.value) || 128;
    box.style.width = box.style.height = `${size}px`;
    layer.hidden = false;
    place((window.innerWidth - size) / 2, (window.innerHeight - size) / 2);
    running = true;
    status.textContent = 'Stuck pixel fixer running.';
    let frame = 0;
    const tick = () => {
      box.style.backgroundColor = FLASH_COLOURS[frame++ % FLASH_COLOURS.length];
      raf = requestAnimationFrame(tick);
    };
    tick();
    layer.focus();
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    drag = null;
    layer.hidden = true;
    status.textContent = 'Stuck pixel fixer stopped. Check whether the pixel has changed.';
    openBtn.focus();
  }

  openBtn.addEventListener('click', openWarning);
  ok.addEventListener('change', updateGo);
  okRm.addEventListener('change', updateGo);
  go.addEventListener('click', start);
  cancel.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (!running) openBtn.focus();
  });

  layer.addEventListener('pointerdown', (e) => {
    const onBox = e.target === box;
    drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, boxX: x, boxY: y, onBox, moved: false };
    layer.setPointerCapture(e.pointerId);
  });
  layer.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    drag.moved = true;
    if (drag.onBox) place(drag.boxX + dx, drag.boxY + dy);
  });
  layer.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const tapped = !drag.moved;
    drag = null;
    if (tapped) stop();
  });
  layer.addEventListener('pointercancel', () => (drag = null));

  layer.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 50 : 10;
    if (e.key === 'Escape') stop();
    else if (e.key === 'ArrowLeft') place(x - step, y);
    else if (e.key === 'ArrowRight') place(x + step, y);
    else if (e.key === 'ArrowUp') place(x, y - step);
    else if (e.key === 'ArrowDown') place(x, y + step);
    else if (e.key !== 'Tab' && e.key !== 'Enter' && e.key !== ' ') return;
    else if (e.key !== 'Tab') stop();
    e.preventDefault();
    e.stopPropagation();
  });
  window.addEventListener('resize', () => running && place(x, y));
  window.addEventListener('pagehide', stop);
}
