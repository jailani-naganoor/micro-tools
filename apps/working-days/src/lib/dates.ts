// Date-only helpers. Every calendar date is represented as an integer "epoch day"
// (days since 1970-01-01). Converting through Date.UTC keeps the arithmetic free of
// local time zones and daylight-saving changes.

export type ISODate = string; // YYYY-MM-DD

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2199;

/** Parse YYYY-MM-DD into an epoch day, or null if invalid or out of range. */
export function parseISODate(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = ISO_RE.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1) return null;
  if (day > daysInMonth(year, month)) return null;
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

export function formatISODate(epochDay: number): ISODate {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export function weekday(epochDay: number): number {
  // 1970-01-01 was a Thursday (4).
  return (((epochDay + 4) % 7) + 7) % 7;
}

export function yearOf(epochDay: number): number {
  return new Date(epochDay * MS_PER_DAY).getUTCFullYear();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/** The user's current local calendar date as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addCalendarDays(iso: ISODate, days: number): ISODate {
  const day = parseISODate(iso);
  if (day === null) throw new RangeError(`Invalid date: ${iso}`);
  return formatISODate(day + days);
}

/** Add calendar months, clamping to the last day of the month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: ISODate, months: number): ISODate {
  const m = ISO_RE.exec(iso);
  if (!m) throw new RangeError(`Invalid date: ${iso}`);
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const day = Math.min(Number(m[3]), daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Human-readable date, formatted in UTC so the calendar date never shifts. */
export function formatLongDate(iso: ISODate, locale?: string): string {
  const day = parseISODate(iso);
  if (day === null) return iso;
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(day * MS_PER_DAY));
}
