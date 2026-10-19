// Small device/browser checks, written as pure functions so they can be unit tested.

type Matches = (query: string) => boolean;

/**
 * True when the device looks touch-only: the main pointer is coarse, it can't hover, and no
 * fine pointer (mouse or trackpad) is attached. Phones and tablets without a keyboard case
 * match; laptops with touch screens don't, because they also have a trackpad.
 */
export function looksTouchOnly(matches: Matches): boolean {
  return matches('(pointer: coarse)') && matches('(hover: none)') && !matches('(any-pointer: fine)');
}

/** iPhone or iPod touch. iPhone browsers can't put a page element into full screen. */
export function isIPhone(userAgent: string): boolean {
  return /\b(iPhone|iPod)\b/.test(userAgent);
}

/** Recording file extension for a MediaRecorder MIME type. */
export function recordingExtension(mimeType: string): string {
  const type = mimeType.split(';')[0].trim().toLowerCase();
  if (type.endsWith('/ogg')) return 'ogg';
  if (type.endsWith('/mp4') || type.endsWith('/aac') || type.endsWith('/x-m4a')) return 'm4a';
  if (type.endsWith('/wav')) return 'wav';
  return 'webm';
}

/** Format a MediaTrackSettings value for display. */
export function formatSetting(value: unknown, unit = ''): string {
  if (value === undefined || value === null || value === '') return 'Not reported by this browser';
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  return `${value}${unit}`;
}

/** Audio latency is reported in seconds; show it in milliseconds. */
export function formatLatency(seconds: unknown): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 'Not reported by this browser';
  return `${Math.round(seconds * 1000 * 10) / 10} ms`;
}
