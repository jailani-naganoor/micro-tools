import { daysInMonth, formatISODate, parseISODate, weekday, type ISODate } from './dates';

/** Returns the holiday names for a date, or undefined/empty if it is not a holiday. */
export type HolidayLookup = (date: ISODate) => readonly string[] | undefined;

export interface DayRules {
  /** Days of the week that are not worked, 0 = Sunday … 6 = Saturday. */
  weekendDays: readonly number[];
  holidays?: HolidayLookup;
  /** Extra non-working dates (company days off, leave). */
  daysOff?: ReadonlySet<ISODate>;
}

export interface HolidayHit {
  date: ISODate;
  names: readonly string[];
}

export interface CountResult {
  /** Earlier date of the range (after swapping reversed input). */
  start: ISODate;
  end: ISODate;
  reversed: boolean;
  includeStart: boolean;
  includeEnd: boolean;
  totalDays: number;
  weekendDays: number;
  /** Holidays that fell on a working weekday and were deducted. */
  holidays: HolidayHit[];
  /** Holidays that fell on a weekend day (already excluded as weekend). */
  holidaysOnWeekend: HolidayHit[];
  /** Custom days off that fell on a working weekday and were deducted. */
  daysOff: ISODate[];
  workingDays: number;
}

export interface AddResult {
  start: ISODate;
  result: ISODate;
  /** Signed number of working days requested. */
  days: number;
  /** Signed calendar distance from start to result. */
  calendarDays: number;
  weekendDays: number;
  holidays: HolidayHit[];
  holidaysOnWeekend: HolidayHit[];
  daysOff: ISODate[];
}

export const WEEKEND_PATTERNS = {
  'sat-sun': [6, 0],
  'fri-sat': [5, 6],
  sun: [0],
} as const satisfies Record<string, readonly number[]>;

export type WeekendPattern = keyof typeof WEEKEND_PATTERNS | 'custom';

/** Maximum number of working days accepted by addWorkingDays. */
export const MAX_ADD_DAYS = 10_000;

function requireDate(value: ISODate, label: string): number {
  const day = parseISODate(value);
  if (day === null) throw new RangeError(`${label} is not a valid date: ${value}`);
  return day;
}

function validateWeekend(weekendDays: readonly number[]): Set<number> {
  const set = new Set(weekendDays);
  for (const d of set) {
    if (!Number.isInteger(d) || d < 0 || d > 6) throw new RangeError(`Invalid weekday: ${d}`);
  }
  if (set.size >= 7) throw new RangeError('At least one day of the week must be a working day.');
  return set;
}

type DayKind =
  | { kind: 'weekend'; holiday?: HolidayHit }
  | { kind: 'holiday'; holiday: HolidayHit }
  | { kind: 'dayoff' }
  | { kind: 'working' };

function classify(epochDay: number, weekend: Set<number>, rules: DayRules): DayKind {
  const iso = formatISODate(epochDay);
  const names = rules.holidays?.(iso);
  const holiday = names && names.length > 0 ? { date: iso, names } : undefined;
  if (weekend.has(weekday(epochDay))) return { kind: 'weekend', holiday };
  if (holiday) return { kind: 'holiday', holiday };
  if (rules.daysOff?.has(iso)) return { kind: 'dayoff' };
  return { kind: 'working' };
}

/**
 * Count working days from `start` to `end`. The start date is included unless
 * `includeStart` is false; the end date only when `includeEnd` is true. Reversed
 * input is swapped. A single day (start = end) only counts when both are included.
 */
export function countWorkingDays(
  startISO: ISODate,
  endISO: ISODate,
  includeEnd: boolean,
  rules: DayRules,
  includeStart = true,
): CountResult {
  let start = requireDate(startISO, 'Start date');
  let end = requireDate(endISO, 'End date');
  const weekend = validateWeekend(rules.weekendDays);
  const reversed = end < start;
  if (reversed) [start, end] = [end, start];
  const first = includeStart ? start : start + 1;
  const last = includeEnd ? end : end - 1;

  const result: CountResult = {
    start: formatISODate(start),
    end: formatISODate(end),
    reversed,
    includeStart,
    includeEnd,
    totalDays: Math.max(0, last - first + 1),
    weekendDays: 0,
    holidays: [],
    holidaysOnWeekend: [],
    daysOff: [],
    workingDays: 0,
  };

  for (let day = first; day <= last; day++) {
    const c = classify(day, weekend, rules);
    if (c.kind === 'weekend') {
      result.weekendDays++;
      if (c.holiday) result.holidaysOnWeekend.push(c.holiday);
    } else if (c.kind === 'holiday') {
      result.holidays.push(c.holiday);
    } else if (c.kind === 'dayoff') {
      result.daysOff.push(formatISODate(day));
    } else {
      result.workingDays++;
    }
  }
  return result;
}

/**
 * Move `days` working days forward (positive) or backward (negative) from `start`.
 * The start date itself is never counted, matching how "due in N business days" is
 * normally read: 1 working day after Friday is Monday.
 */
export function addWorkingDays(startISO: ISODate, days: number, rules: DayRules): AddResult {
  const start = requireDate(startISO, 'Start date');
  if (!Number.isInteger(days) || Math.abs(days) > MAX_ADD_DAYS) {
    throw new RangeError(`Number of working days must be a whole number up to ${MAX_ADD_DAYS}.`);
  }
  const weekend = validateWeekend(rules.weekendDays);
  const step = days < 0 ? -1 : 1;
  const out: AddResult = {
    start: startISO,
    result: startISO,
    days,
    calendarDays: 0,
    weekendDays: 0,
    holidays: [],
    holidaysOnWeekend: [],
    daysOff: [],
  };

  let day = start;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    day += step;
    const c = classify(day, weekend, rules);
    if (c.kind === 'weekend') {
      out.weekendDays++;
      if (c.holiday) out.holidaysOnWeekend.push(c.holiday);
    } else if (c.kind === 'holiday') {
      out.holidays.push(c.holiday);
    } else if (c.kind === 'dayoff') {
      out.daysOff.push(formatISODate(day));
    } else {
      remaining--;
    }
  }
  if (step < 0) {
    out.holidays.reverse();
    out.holidaysOnWeekend.reverse();
    out.daysOff.reverse();
  }
  out.result = formatISODate(day);
  out.calendarDays = day - start;
  return out;
}

/** Rough calendar span for N working days, used to decide which holiday years to load. */
export function estimateCalendarSpan(days: number, weekendDays: readonly number[]): number {
  const perWeek = Math.max(1, 7 - new Set(weekendDays).size);
  return Math.ceil((Math.abs(days) * 7) / perWeek * 1.15) + 60;
}

export function weekendFromPattern(pattern: WeekendPattern, custom: readonly number[]): number[] {
  return pattern === 'custom' ? [...new Set(custom)].sort() : [...WEEKEND_PATTERNS[pattern]];
}

export interface MonthSummary {
  /** 1–12 */
  month: number;
  totalDays: number;
  weekendDays: number;
  /** Holidays and custom days off that fell on a working weekday. */
  daysOff: number;
  workingDays: number;
}

/** Working days in each month of a year (every day of each month counted). */
export function monthlyBreakdown(year: number, rules: DayRules): MonthSummary[] {
  const months: MonthSummary[] = [];
  for (let month = 1; month <= 12; month++) {
    const mm = String(month).padStart(2, '0');
    const r = countWorkingDays(`${year}-${mm}-01`, `${year}-${mm}-${daysInMonth(year, month)}`, true, rules);
    months.push({
      month,
      totalDays: r.totalDays,
      weekendDays: r.weekendDays,
      daysOff: r.holidays.length + r.daysOff.length,
      workingDays: r.workingDays,
    });
  }
  return months;
}

/** Plain-English explanation of how the start/end toggles affect a count. */
export function countingNote(includeStart: boolean, includeEnd: boolean): string {
  if (includeStart && includeEnd) return 'Both dates are counted: Mon to Fri, both dates included = 5 days.';
  if (includeStart) return 'The start date is counted, the end date isn’t: Mon to Fri = 4 days (Mon–Thu).';
  if (includeEnd) return 'The end date is counted, the start date isn’t: Mon to Fri = 4 days (Tue–Fri).';
  return 'Neither date is counted, only the days in between: Mon to Fri = 3 days (Tue–Thu).';
}

/** Working days × hours per day, rounded to 2 decimal places. */
export function workingHours(days: number, hoursPerDay: number): number {
  return Math.round(days * hoursPerDay * 100) / 100;
}
