import { describe, expect, it } from 'vitest';
import {
  addCalendarDays,
  addMonths,
  formatISODate,
  isLeapYear,
  parseISODate,
  todayISO,
  weekday,
} from '../../src/lib/dates';
import {
  addWorkingDays,
  countingNote,
  countWorkingDays,
  estimateCalendarSpan,
  monthlyBreakdown,
  weekendFromPattern,
  workingHours,
  type HolidayLookup,
} from '../../src/lib/workingDays';
import { parseHours, stateFromUrl, stateToQuery } from '../../src/scripts/calculator';
import { loadCountry } from '../../src/lib/holidays';

const SAT_SUN = [6, 0];
const FRI_SAT = [5, 6];
const lookup = (map: Record<string, string>): HolidayLookup => (d) => (map[d] ? [map[d]] : undefined);

describe('dates', () => {
  it('parses valid dates and rejects invalid ones', () => {
    expect(parseISODate('1970-01-01')).toBe(0);
    expect(parseISODate('2024-02-29')).not.toBeNull();
    expect(parseISODate('2023-02-29')).toBeNull();
    expect(parseISODate('2024-13-01')).toBeNull();
    expect(parseISODate('2024-04-31')).toBeNull();
    expect(parseISODate('24-01-01')).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate('1899-12-31')).toBeNull();
    expect(parseISODate('2200-01-01')).toBeNull();
  });

  it('round-trips and computes weekdays', () => {
    const d = parseISODate('2026-10-18')!;
    expect(formatISODate(d)).toBe('2026-10-18');
    expect(weekday(d)).toBe(0); // Sunday
    expect(weekday(parseISODate('1970-01-01')!)).toBe(4); // Thursday
    expect(weekday(parseISODate('1969-12-31')!)).toBe(3); // negative epoch days
    expect(weekday(parseISODate('1900-01-01')!)).toBe(1); // Monday
  });

  it('handles leap years', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addCalendarDays('2023-02-28', 1)).toBe('2023-03-01');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2023-01-31', 1)).toBe('2023-02-28');
    expect(addMonths('2025-12-15', 1)).toBe('2026-01-15');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
  });

  it('todayISO uses local calendar components', () => {
    expect(todayISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(todayISO(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});

describe('countWorkingDays', () => {
  it('counts a plain week, excluding the end date by default', () => {
    // Mon 2026-10-19 to Mon 2026-10-26
    const r = countWorkingDays('2026-10-19', '2026-10-26', false, { weekendDays: SAT_SUN });
    expect(r).toMatchObject({ totalDays: 7, weekendDays: 2, workingDays: 5, reversed: false });
  });

  it('includes the end date when asked', () => {
    const r = countWorkingDays('2026-10-19', '2026-10-26', true, { weekendDays: SAT_SUN });
    expect(r).toMatchObject({ totalDays: 8, weekendDays: 2, workingDays: 6 });
  });

  it('same start and end date', () => {
    expect(countWorkingDays('2026-10-19', '2026-10-19', false, { weekendDays: SAT_SUN }).workingDays).toBe(0);
    expect(countWorkingDays('2026-10-19', '2026-10-19', true, { weekendDays: SAT_SUN }).workingDays).toBe(1);
    expect(countWorkingDays('2026-10-18', '2026-10-18', true, { weekendDays: SAT_SUN }).workingDays).toBe(0);
  });

  it('swaps reversed dates and flags them', () => {
    const r = countWorkingDays('2026-10-26', '2026-10-19', false, { weekendDays: SAT_SUN });
    expect(r).toMatchObject({ start: '2026-10-19', end: '2026-10-26', reversed: true, workingDays: 5 });
  });

  it('supports Friday–Saturday and Sunday-only weekends', () => {
    expect(countWorkingDays('2026-10-19', '2026-10-26', false, { weekendDays: FRI_SAT }).workingDays).toBe(5);
    expect(countWorkingDays('2026-10-19', '2026-10-26', false, { weekendDays: [0] }).workingDays).toBe(6);
    // Thu 22 – Sun 25 Oct: Fri 23 and Sat 24 are the weekend.
    const r = countWorkingDays('2026-10-22', '2026-10-25', true, { weekendDays: FRI_SAT });
    expect(r).toMatchObject({ totalDays: 4, weekendDays: 2, workingDays: 2 });
  });

  it('deducts holidays on weekdays and lists weekend holidays separately', () => {
    const holidays = lookup({ '2026-12-25': 'Christmas Day', '2026-12-26': 'Boxing Day' });
    // Fri 25 Dec 2026 is a weekday, Sat 26 Dec is a weekend.
    const r = countWorkingDays('2026-12-21', '2026-12-31', true, { weekendDays: SAT_SUN, holidays });
    expect(r.totalDays).toBe(11);
    expect(r.weekendDays).toBe(2);
    expect(r.holidays).toEqual([{ date: '2026-12-25', names: ['Christmas Day'] }]);
    expect(r.holidaysOnWeekend).toEqual([{ date: '2026-12-26', names: ['Boxing Day'] }]);
    expect(r.workingDays).toBe(8);
  });

  it('deducts custom days off but not when they fall on a weekend or holiday', () => {
    const r = countWorkingDays('2026-12-21', '2026-12-31', true, {
      weekendDays: SAT_SUN,
      holidays: lookup({ '2026-12-25': 'Christmas Day' }),
      daysOff: new Set(['2026-12-24', '2026-12-25', '2026-12-27']),
    });
    expect(r.daysOff).toEqual(['2026-12-24']);
    expect(r.workingDays).toBe(7);
  });

  it('counts multi-year ranges including leap days', () => {
    // 2024 is a leap year: 366 days, 262 weekdays.
    const y2024 = countWorkingDays('2024-01-01', '2024-12-31', true, { weekendDays: SAT_SUN });
    expect(y2024).toMatchObject({ totalDays: 366, workingDays: 262, weekendDays: 104 });
    // 2023: 365 days, 260 weekdays.
    expect(countWorkingDays('2023-01-01', '2023-12-31', true, { weekendDays: SAT_SUN }).workingDays).toBe(260);
    // 2000-01-01 .. 2099-12-31 = 36525 days; totals must add up.
    const century = countWorkingDays('2000-01-01', '2099-12-31', true, { weekendDays: SAT_SUN });
    expect(century.totalDays).toBe(36525);
    expect(century.workingDays + century.weekendDays).toBe(36525);
  });

  it('counts across a leap day', () => {
    // Thu 29 Feb 2024 is a weekday.
    const r = countWorkingDays('2024-02-28', '2024-03-01', true, { weekendDays: SAT_SUN });
    expect(r).toMatchObject({ totalDays: 3, workingDays: 3 });
  });

  it('is unaffected by daylight-saving transitions', () => {
    // US DST starts 8 Mar 2026, UK 29 Mar, EU ends 25 Oct. Ranges spanning them stay whole days.
    expect(countWorkingDays('2026-03-06', '2026-03-10', true, { weekendDays: SAT_SUN }).totalDays).toBe(5);
    expect(countWorkingDays('2026-03-27', '2026-03-31', true, { weekendDays: SAT_SUN }).workingDays).toBe(3);
    expect(countWorkingDays('2026-10-23', '2026-10-27', true, { weekendDays: SAT_SUN }).workingDays).toBe(3);
  });

  it('rejects invalid input', () => {
    expect(() => countWorkingDays('2026-02-30', '2026-03-01', false, { weekendDays: SAT_SUN })).toThrow();
    expect(() => countWorkingDays('2026-01-01', '2026-03-01', false, { weekendDays: [0, 1, 2, 3, 4, 5, 6] })).toThrow();
    expect(() => countWorkingDays('2026-01-01', '2026-03-01', false, { weekendDays: [7] })).toThrow();
  });
});

describe('include start / end date', () => {
  // Mon 19 Oct to Fri 23 Oct 2026
  const count = (incStart: boolean, incEnd: boolean) =>
    countWorkingDays('2026-10-19', '2026-10-23', incEnd, { weekendDays: SAT_SUN }, incStart);

  it('counts Mon to Fri as 5, 4, 4 or 3 days', () => {
    expect(count(true, true).workingDays).toBe(5);
    expect(count(true, false).workingDays).toBe(4);
    expect(count(false, true).workingDays).toBe(4);
    expect(count(false, false).workingDays).toBe(3);
    expect(count(false, false).totalDays).toBe(3);
    expect(count(false, true)).toMatchObject({ includeStart: false, includeEnd: true });
  });

  it('defaults to including the start date', () => {
    expect(countWorkingDays('2026-10-19', '2026-10-23', false, { weekendDays: SAT_SUN }).workingDays).toBe(4);
  });

  it('excluding the start date skips a holiday on it', () => {
    const holidays = lookup({ '2026-12-25': 'Christmas Day' });
    const r = countWorkingDays('2026-12-25', '2026-12-31', true, { weekendDays: SAT_SUN, holidays }, false);
    expect(r.holidays).toEqual([]);
    expect(r.workingDays).toBe(4); // Mon 28 – Thu 31
  });

  it('a single day only counts when both dates are included', () => {
    const one = (s: boolean, e: boolean) =>
      countWorkingDays('2026-10-19', '2026-10-19', e, { weekendDays: SAT_SUN }, s).workingDays;
    expect([one(true, true), one(true, false), one(false, true), one(false, false)]).toEqual([1, 0, 0, 0]);
    // Adjacent days with neither included: nothing in between.
    expect(countWorkingDays('2026-10-19', '2026-10-20', false, { weekendDays: SAT_SUN }, false).totalDays).toBe(0);
  });

  it('works with reversed dates', () => {
    const r = countWorkingDays('2026-10-23', '2026-10-19', true, { weekendDays: SAT_SUN }, false);
    expect(r).toMatchObject({ reversed: true, workingDays: 4 });
  });

  it('explains the counting in plain English', () => {
    expect(countingNote(true, true)).toContain('= 5 days');
    expect(countingNote(true, false)).toContain('4 days (Mon–Thu)');
    expect(countingNote(false, true)).toContain('4 days (Tue–Fri)');
    expect(countingNote(false, false)).toContain('3 days (Tue–Thu)');
  });
});

describe('working hours', () => {
  it('multiplies working days by hours per day', () => {
    expect(workingHours(20, 8)).toBe(160);
    expect(workingHours(21, 7.5)).toBe(157.5);
    expect(workingHours(3, 7.33)).toBe(21.99);
    expect(workingHours(0, 8)).toBe(0);
  });

  it('validates hours per day', () => {
    expect(parseHours('7.5')).toBe(7.5);
    expect(parseHours('24')).toBe(24);
    expect(parseHours('0')).toBeNull();
    expect(parseHours('-1')).toBeNull();
    expect(parseHours('25')).toBeNull();
    expect(parseHours('abc')).toBeNull();
    expect(parseHours('')).toBeNull();
    expect(parseHours(null)).toBeNull();
  });
});

describe('URL state', () => {
  const langs = ['en-GB'];
  it('reads and writes include-start and hours, keeping old links working', () => {
    const old = stateFromUrl('?mode=between&start=2026-10-19&end=2026-10-23&inc=1&country=none', '2026-10-19', langs);
    expect(old).toMatchObject({ includeStart: true, includeEnd: true, hours: 8 });
    expect(stateToQuery(old)).not.toMatch(/incs|hours/);

    const s = stateFromUrl('?mode=between&start=2026-10-19&end=2026-10-23&incs=0&hours=7.5&country=none', '2026-10-19', langs);
    expect(s).toMatchObject({ includeStart: false, includeEnd: false, hours: 7.5 });
    const q = stateToQuery(s);
    expect(q).toContain('incs=0');
    expect(q).toContain('hours=7.5');
  });

  it('ignores invalid hours', () => {
    expect(stateFromUrl('?hours=99', '2026-10-19', langs).hours).toBe(8);
    expect(stateFromUrl('?hours=0', '2026-10-19', langs).hours).toBe(8);
  });

  it('accepts every supported country code', async () => {
    const { COUNTRIES } = await import('../../src/lib/holidays');
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(40);
    for (const { code } of COUNTRIES) expect(stateFromUrl(`?country=${code}`, '2026-10-19', langs).country).toBe(code);
  });
});

describe('monthlyBreakdown', () => {
  it('splits a year into months that add up to the yearly total', () => {
    const months = monthlyBreakdown(2026, { weekendDays: SAT_SUN });
    expect(months).toHaveLength(12);
    expect(months.map((m) => m.totalDays)).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
    expect(months[0]).toMatchObject({ month: 1, workingDays: 22, weekendDays: 9 });
    const total = months.reduce((n, m) => n + m.workingDays, 0);
    expect(total).toBe(countWorkingDays('2026-01-01', '2026-12-31', true, { weekendDays: SAT_SUN }).workingDays);
    expect(total).toBe(261);
  });

  it('handles leap years, holidays and days off', () => {
    const months = monthlyBreakdown(2024, {
      weekendDays: SAT_SUN,
      holidays: lookup({ '2024-12-25': 'Christmas Day', '2024-12-28': 'Weekend holiday' }),
      daysOff: new Set(['2024-12-24']),
    });
    expect(months[1].totalDays).toBe(29);
    expect(months[11]).toMatchObject({ daysOff: 2, workingDays: 20 });
  });

  it('UK (England) 2026 has 253 working days', async () => {
    const c = await loadCountry('GB');
    const hols = new Set(c.getHolidays(2026, 'ENG').map((h) => h.date));
    const months = monthlyBreakdown(2026, { weekendDays: SAT_SUN, holidays: (d) => (hols.has(d) ? ['h'] : undefined) });
    expect(months.reduce((n, m) => n + m.workingDays, 0)).toBe(253);
    expect(months[11]).toMatchObject({ daysOff: 2, workingDays: 21 }); // 25 Dec and 28 Dec substitute
  });
});

describe('addWorkingDays', () => {
  it('adds over a weekend (start date not counted)', () => {
    // Fri 23 Oct 2026 + 1 = Mon 26 Oct
    const r = addWorkingDays('2026-10-23', 1, { weekendDays: SAT_SUN });
    expect(r).toMatchObject({ result: '2026-10-26', calendarDays: 3, weekendDays: 2 });
    expect(addWorkingDays('2026-10-19', 10, { weekendDays: SAT_SUN }).result).toBe('2026-11-02');
  });

  it('subtracts working days', () => {
    // Mon 26 Oct 2026 - 1 = Fri 23 Oct
    const r = addWorkingDays('2026-10-26', -1, { weekendDays: SAT_SUN });
    expect(r).toMatchObject({ result: '2026-10-23', calendarDays: -3, weekendDays: 2 });
  });

  it('returns the start date for zero days', () => {
    expect(addWorkingDays('2026-10-24', 0, { weekendDays: SAT_SUN }).result).toBe('2026-10-24');
  });

  it('starting on a weekend', () => {
    // Sat 24 Oct + 1 = Mon 26 Oct; Sat 24 Oct - 1 = Fri 23 Oct
    expect(addWorkingDays('2026-10-24', 1, { weekendDays: SAT_SUN }).result).toBe('2026-10-26');
    expect(addWorkingDays('2026-10-24', -1, { weekendDays: SAT_SUN }).result).toBe('2026-10-23');
  });

  it('skips holidays and days off, in both directions', () => {
    const rules = {
      weekendDays: SAT_SUN,
      holidays: lookup({ '2026-12-25': 'Christmas Day', '2026-12-28': 'Boxing Day (substitute day)' }),
      daysOff: new Set(['2026-12-29']),
    };
    // Thu 24 Dec + 1 → skip Fri 25 (hol), Sat, Sun, Mon 28 (hol), Tue 29 (off) → Wed 30
    const fwd = addWorkingDays('2026-12-24', 1, rules);
    expect(fwd.result).toBe('2026-12-30');
    expect(fwd.holidays.map((h) => h.date)).toEqual(['2026-12-25', '2026-12-28']);
    expect(fwd.daysOff).toEqual(['2026-12-29']);
    const back = addWorkingDays('2026-12-30', -1, rules);
    expect(back.result).toBe('2026-12-24');
    expect(back.holidays.map((h) => h.date)).toEqual(['2026-12-25', '2026-12-28']);
  });

  it('crosses year boundaries and leap days', () => {
    expect(addWorkingDays('2024-02-28', 1, { weekendDays: SAT_SUN }).result).toBe('2024-02-29');
    expect(addWorkingDays('2023-12-29', 1, { weekendDays: SAT_SUN }).result).toBe('2024-01-01');
    // 262 weekdays in 2024: from 31 Dec 2023 (Sun) + 262 = Tue 31 Dec 2024
    expect(addWorkingDays('2023-12-31', 262, { weekendDays: SAT_SUN }).result).toBe('2024-12-31');
  });

  it('is consistent with countWorkingDays', () => {
    const rules = { weekendDays: FRI_SAT, holidays: lookup({ '2026-05-27': 'Holiday' }) };
    const add = addWorkingDays('2026-05-01', 40, rules);
    const count = countWorkingDays('2026-05-01', add.result, true, rules);
    // Start excluded by add, end included by count. 1 May 2026 is a Friday (weekend here).
    expect(count.workingDays).toBe(40);
  });

  it('rejects invalid input', () => {
    expect(() => addWorkingDays('2026-10-19', 1.5, { weekendDays: SAT_SUN })).toThrow();
    expect(() => addWorkingDays('2026-10-19', 10_001, { weekendDays: SAT_SUN })).toThrow();
    expect(() => addWorkingDays('nope', 1, { weekendDays: SAT_SUN })).toThrow();
  });
});

describe('helpers', () => {
  it('weekendFromPattern', () => {
    expect(weekendFromPattern('sat-sun', [])).toEqual([6, 0]);
    expect(weekendFromPattern('custom', [3, 0, 3])).toEqual([0, 3]);
  });
  it('estimateCalendarSpan covers the actual span', () => {
    const r = addWorkingDays('2026-01-01', 500, { weekendDays: SAT_SUN });
    expect(estimateCalendarSpan(500, SAT_SUN)).toBeGreaterThan(r.calendarDays);
  });
});

describe('holiday data (date-holidays)', () => {
  it('UK England 2026 bank holidays', async () => {
    const c = await loadCountry('GB');
    const hols = c.getHolidays(2026, 'ENG');
    expect(hols.map((h) => h.date)).toEqual([
      '2026-01-01',
      '2026-04-03',
      '2026-04-06',
      '2026-05-04',
      '2026-05-25',
      '2026-08-31',
      '2026-12-25',
      '2026-12-26', // Boxing Day falls on a Saturday…
      '2026-12-28', // …so the substitute bank holiday is Monday
    ]);
  });

  it('US federal holidays include observed days', async () => {
    const c = await loadCountry('US');
    const dates = c.getHolidays(2026).map((h) => h.date);
    expect(dates).toContain('2026-07-03'); // Independence Day observed (4 July is a Saturday)
    expect(dates).toContain('2026-11-26'); // Thanksgiving
    expect(dates).not.toContain('2026-02-14'); // Valentine's Day is an observance, not a day off
  });

  it('lists regions and region-specific holidays', async () => {
    const c = await loadCountry('GB');
    expect(c.regions.map((r) => r.code)).toContain('SCT');
    const sct = c.getHolidays(2026, 'SCT').map((h) => h.date);
    expect(sct).toContain('2026-01-02'); // 2 January is a bank holiday in Scotland
    expect(c.getHolidays(2026, 'ENG').map((h) => h.date)).not.toContain('2026-01-02');
  });

  it('loads every supported country', async () => {
    const { COUNTRIES } = await import('../../src/lib/holidays');
    for (const { code } of COUNTRIES) {
      const c = await loadCountry(code);
      expect(c.getHolidays(2026).length, code).toBeGreaterThan(3);
    }
  });

  it('lunar-calendar holidays are correct (Singapore)', async () => {
    const c = await loadCountry('SG');
    const hols = c.getHolidays(2026);
    const cny = hols.filter((h) => h.name.includes('Chinese New Year')).map((h) => h.date);
    expect(cny).toEqual(['2026-02-17', '2026-02-18']);
    expect(hols.map((h) => h.date)).toContain('2026-03-21'); // Hari Raya Puasa
  });

  it('matches the full date-holidays package for every country and region', async () => {
    // The browser build uses per-country data files, UTC-only time zones and a trimmed
    // astronomy library. Compare against the unmodified package to prove nothing changed.
    const { default: Full } = await import('date-holidays');
    const { COUNTRIES } = await import('../../src/lib/holidays');
    let checked = 0;
    for (const { code } of COUNTRIES) {
      const c = await loadCountry(code);
      for (const region of ['', ...c.regions.map((r) => r.code)]) {
        for (const year of [1950, 2000, 2024, 2026, 2027, 2040, 2100]) {
          const full = (region ? new Full(code, region, { languages: ['en'] }) : new Full(code, { languages: ['en'] }))
            .getHolidays(year, 'en')
            .filter((h) => h.type === 'public' || h.type === 'bank')
            .map((h) => `${h.date.slice(0, 10)} ${h.name}`);
          const ours = c.getHolidays(year, region || undefined).map((h) => `${h.date} ${h.name}`).sort();
          expect(ours, `${code} ${region} ${year}`).toEqual([...new Set(full)].sort());
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(1000);
  }, 120_000);

  it('holiday dates are timezone independent', async () => {
    const c = await loadCountry('NZ');
    const dates = c.getHolidays(2026).map((h) => h.date);
    expect(dates[0]).toBe('2026-01-01');
    for (const d of dates) expect(d).toMatch(/^2026-\d{2}-\d{2}$/);
  });
});
