// Physical keyboard layout (full size, ANSI and ISO). Keys are positioned in key units
// (1u = width of a letter key). `code` matches KeyboardEvent.code, which identifies the
// physical key regardless of the language layout.

export interface KeyDef {
  code: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Only shown for this layout. */
  layout?: 'ansi' | 'iso';
}

type Entry = [code: string, label: string, w?: number, h?: number, layout?: 'ansi' | 'iso'] | number;

function row(y: number, x0: number, entries: Entry[]): KeyDef[] {
  const keys: KeyDef[] = [];
  let x = x0;
  for (const e of entries) {
    if (typeof e === 'number') {
      x += e; // gap
      continue;
    }
    const [code, label, w = 1, h = 1, layout] = e;
    keys.push({ code, label, x, y, w, h, layout });
    // Layout-specific keys that overlap an alternative don't advance (handled by caller).
    x += w;
  }
  return keys;
}

const letters = (s: string): Entry[] => [...s].map((c) => [`Key${c}`, c]);
const F = (from: number, to: number): Entry[] =>
  Array.from({ length: to - from + 1 }, (_, i) => [`F${from + i}`, `F${from + i}`]);

const R = (n: number) => 1.25 + n; // y of main rows below the function row

export const KEYS: KeyDef[] = [
  // Function row
  ...row(0, 0, [['Escape', 'Esc'], 1, ...F(1, 4), 0.5, ...F(5, 8), 0.5, ...F(9, 12)]),
  ...row(0, 15.25, [
    ['PrintScreen', 'PrtSc'],
    ['ScrollLock', 'ScrLk'],
    ['Pause', 'Pause'],
  ]),

  // Number row
  ...row(R(0), 0, [
    ['Backquote', '`'],
    ...[...'1234567890'].map((d): Entry => [`Digit${d}`, d]),
    ['Minus', '-'],
    ['Equal', '='],
    ['Backspace', 'Backspace', 2],
  ]),
  // QWERTY row (ANSI backslash and ISO Enter top share the last 1.5u)
  ...row(R(1), 0, [['Tab', 'Tab', 1.5], ...letters('QWERTYUIOP'), ['BracketLeft', '['], ['BracketRight', ']']]),
  { code: 'Backslash', label: '\\', x: 13.5, y: R(1), w: 1.5, h: 1, layout: 'ansi' },
  { code: 'Enter', label: 'Enter', x: 13.5, y: R(1), w: 1.5, h: 1, layout: 'iso' },
  // Home row
  ...row(R(2), 0, [['CapsLock', 'Caps', 1.75], ...letters('ASDFGHJKL'), ['Semicolon', ';'], ['Quote', "'"]]),
  { code: 'Enter', label: 'Enter', x: 12.75, y: R(2), w: 2.25, h: 1, layout: 'ansi' },
  { code: 'Backslash', label: '#', x: 12.75, y: R(2), w: 1, h: 1, layout: 'iso' },
  { code: 'Enter', label: '', x: 13.75, y: R(2), w: 1.25, h: 1, layout: 'iso' },
  // Bottom letter row
  { code: 'ShiftLeft', label: 'Shift', x: 0, y: R(3), w: 2.25, h: 1, layout: 'ansi' },
  { code: 'ShiftLeft', label: 'Shift', x: 0, y: R(3), w: 1.25, h: 1, layout: 'iso' },
  { code: 'IntlBackslash', label: '\\', x: 1.25, y: R(3), w: 1, h: 1, layout: 'iso' },
  ...row(R(3), 2.25, [
    ...letters('ZXCVBNM'),
    ['Comma', ','],
    ['Period', '.'],
    ['Slash', '/'],
    ['ShiftRight', 'Shift', 2.75],
  ]),
  // Space row
  ...row(R(4), 0, [
    ['ControlLeft', 'Ctrl', 1.25],
    ['MetaLeft', 'Win/⌘', 1.25],
    ['AltLeft', 'Alt', 1.25],
    ['Space', 'Space', 6.25],
    ['AltRight', 'Alt', 1.25],
    ['MetaRight', 'Win/⌘', 1.25],
    ['ContextMenu', 'Menu', 1.25],
    ['ControlRight', 'Ctrl', 1.25],
  ]),

  // Navigation cluster
  ...row(R(0), 15.25, [
    ['Insert', 'Ins'],
    ['Home', 'Home'],
    ['PageUp', 'PgUp'],
  ]),
  ...row(R(1), 15.25, [
    ['Delete', 'Del'],
    ['End', 'End'],
    ['PageDown', 'PgDn'],
  ]),
  ...row(R(3), 16.25, [['ArrowUp', '↑']]),
  ...row(R(4), 15.25, [
    ['ArrowLeft', '←'],
    ['ArrowDown', '↓'],
    ['ArrowRight', '→'],
  ]),

  // Numeric keypad
  ...row(R(0), 18.5, [
    ['NumLock', 'Num'],
    ['NumpadDivide', '/'],
    ['NumpadMultiply', '*'],
    ['NumpadSubtract', '−'],
  ]),
  ...row(R(1), 18.5, [
    ['Numpad7', '7'],
    ['Numpad8', '8'],
    ['Numpad9', '9'],
    ['NumpadAdd', '+', 1, 2],
  ]),
  ...row(R(2), 18.5, [
    ['Numpad4', '4'],
    ['Numpad5', '5'],
    ['Numpad6', '6'],
  ]),
  ...row(R(3), 18.5, [
    ['Numpad1', '1'],
    ['Numpad2', '2'],
    ['Numpad3', '3'],
    ['NumpadEnter', 'Enter', 1, 2],
  ]),
  ...row(R(4), 18.5, [
    ['Numpad0', '0', 2],
    ['NumpadDecimal', '.'],
  ]),
];

export const KEYBOARD_WIDTH = 22.5;
export const KEYBOARD_HEIGHT = R(5);

/** Codes that exist on the given layout (for "tested" counts). */
export function codesFor(layout: 'ansi' | 'iso'): Set<string> {
  return new Set(KEYS.filter((k) => !k.layout || k.layout === layout).map((k) => k.code));
}
