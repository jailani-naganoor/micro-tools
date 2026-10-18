import { addMonths, formatLongDate, MAX_YEAR, MIN_YEAR, parseISODate, todayISO, weekday, yearOf } from '../lib/dates';
import { COUNTRIES, COUNTRY_CODES, countryFromLocale, loadCountry, type Holiday } from '../lib/holidays';
import {
  addWorkingDays,
  countWorkingDays,
  estimateCalendarSpan,
  MAX_ADD_DAYS,
  WEEKEND_PATTERNS,
  type AddResult,
  type CountResult,
  type HolidayHit,
  type WeekendPattern,
} from '../lib/workingDays';
import { copyText } from './clipboard';

type Mode = 'between' | 'add';

interface State {
  mode: Mode;
  start: string;
  end: string;
  includeEnd: boolean;
  days: number;
  op: 'add' | 'subtract';
  country: string; // ISO code or "none"
  region: string;
  weekend: WeekendPattern;
  weekendDays: number[];
  skip: Set<string>; // holiday dates the user unticked
  off: Set<string>; // custom days off
}

const PATTERNS = Object.keys(WEEKEND_PATTERNS) as (keyof typeof WEEKEND_PATTERNS)[];
const WEEKEND_LABELS: Record<WeekendPattern, string> = {
  'sat-sun': 'Saturday–Sunday weekend',
  'fri-sat': 'Friday–Saturday weekend',
  sun: 'Sunday-only weekend',
  custom: 'custom weekend',
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function parseDateList(value: string | null): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => parseISODate(s) !== null),
  );
}

function sameDays(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}

function patternFor(days: number[]): WeekendPattern {
  return PATTERNS.find((p) => sameDays(WEEKEND_PATTERNS[p], days)) ?? 'custom';
}

/** Read state from the query string, falling back to sensible defaults. */
export function stateFromUrl(search: string, today: string, languages: readonly string[]): State {
  const q = new URLSearchParams(search);
  const start = parseISODate(q.get('start')) !== null ? q.get('start')! : today;
  const end = parseISODate(q.get('end')) !== null ? q.get('end')! : addMonths(start, 1);
  const daysRaw = Number(q.get('days'));
  const days = Number.isInteger(daysRaw) && daysRaw >= 0 && daysRaw <= MAX_ADD_DAYS && q.has('days') ? daysRaw : 10;
  const countryParam = (q.get('country') ?? '').toUpperCase();
  const country =
    countryParam === 'NONE' ? 'none' : COUNTRY_CODES.has(countryParam) ? countryParam : (countryFromLocale(languages) ?? 'US');

  let weekend = (q.get('weekend') ?? 'sat-sun') as WeekendPattern;
  let weekendDays: number[];
  if (weekend === 'custom') {
    weekendDays = [
      ...new Set(
        (q.get('weekdays') ?? '')
          .split(',')
          .filter((s) => /^[0-6]$/.test(s))
          .map(Number),
      ),
    ];
    if (weekendDays.length >= 7) weekendDays = [6, 0];
    weekend = patternFor(weekendDays);
  } else {
    if (!PATTERNS.includes(weekend as (typeof PATTERNS)[number])) weekend = 'sat-sun';
    weekendDays = [...WEEKEND_PATTERNS[weekend as keyof typeof WEEKEND_PATTERNS]];
  }

  return {
    mode: q.get('mode') === 'add' ? 'add' : 'between',
    start,
    end,
    includeEnd: q.get('inc') === '1',
    days,
    op: q.get('op') === 'subtract' ? 'subtract' : 'add',
    country,
    region: (q.get('region') ?? '').toUpperCase(),
    weekend,
    weekendDays,
    skip: parseDateList(q.get('skip')),
    off: parseDateList(q.get('off')),
  };
}

export function stateToQuery(s: State): string {
  const q = new URLSearchParams();
  q.set('mode', s.mode);
  q.set('start', s.start);
  if (s.mode === 'between') {
    q.set('end', s.end);
    if (s.includeEnd) q.set('inc', '1');
  } else {
    q.set('days', String(s.days));
    if (s.op === 'subtract') q.set('op', 'subtract');
  }
  q.set('country', s.country);
  if (s.region) q.set('region', s.region);
  q.set('weekend', s.weekend);
  if (s.weekend === 'custom') q.set('weekdays', [...s.weekendDays].sort().join(','));
  if (s.skip.size) q.set('skip', [...s.skip].sort().join(','));
  if (s.off.size) q.set('off', [...s.off].sort().join(','));
  return q.toString().replace(/%2C/g, ',');
}

function clampYear(y: number) {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, y));
}

export function initCalculator() {
  const form = $<HTMLFormElement>('calc');
  if (!form) return;
  const els = {
    start: $<HTMLInputElement>('start'),
    end: $<HTMLInputElement>('end'),
    inc: $<HTMLInputElement>('inc'),
    days: $<HTMLInputElement>('days'),
    op: $<HTMLSelectElement>('op'),
    country: $<HTMLSelectElement>('country'),
    region: $<HTMLSelectElement>('region'),
    weekend: $<HTMLSelectElement>('weekend'),
    offDate: $<HTMLInputElement>('off-date'),
    offAdd: $<HTMLButtonElement>('off-add'),
    offList: $<HTMLUListElement>('off-list'),
    offCount: $<HTMLSpanElement>('off-count'),
    main: $<HTMLParagraphElement>('result-main'),
    sub: $<HTMLParagraphElement>('result-sub'),
    copyResult: $<HTMLButtonElement>('copy-result'),
    copyLink: $<HTMLButtonElement>('copy-link'),
    copyStatus: $<HTMLSpanElement>('copy-status'),
    holList: $<HTMLUListElement>('hol-list'),
    holHeading: $<HTMLHeadingElement>('hol-heading'),
  };
  const modeInputs = form.querySelectorAll<HTMLInputElement>('input[name="mode"]');
  const dayInputs = form.querySelectorAll<HTMLInputElement>('input[name="wd"]');
  const hadQuery = location.search.length > 1;
  const state = stateFromUrl(location.search, todayISO(), navigator.languages ?? [navigator.language]);
  let summary = '';
  let runId = 0;
  let userChanged = hadQuery;

  // ---- state → form ----
  function writeForm() {
    for (const r of modeInputs) r.checked = r.value === state.mode;
    for (const el of form.querySelectorAll<HTMLElement>('[data-mode]')) el.hidden = el.dataset.mode !== state.mode;
    els.start.value = state.start;
    els.end.value = state.end;
    els.inc.checked = state.includeEnd;
    els.days.value = String(state.days);
    els.op.value = state.op;
    els.country.value = state.country;
    els.weekend.value = state.weekend;
    for (const d of dayInputs) d.checked = state.weekendDays.includes(Number(d.value));
    renderDaysOff();
  }

  function renderDaysOff() {
    els.offList.replaceChildren(
      ...[...state.off].sort().map((date) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn min-h-9 px-3 py-1 font-normal';
        btn.dataset.removeOff = date;
        btn.setAttribute('aria-label', `Remove day off ${formatLongDate(date)}`);
        btn.textContent = `${formatLongDate(date)} ✕`;
        li.append(btn);
        return li;
      }),
    );
    els.offCount.textContent = state.off.size ? `(${state.off.size})` : '';
  }

  async function updateRegions() {
    els.region.replaceChildren(new Option('Whole country', ''));
    if (state.country === 'none') {
      els.region.disabled = true;
      state.region = '';
      return;
    }
    const country = await loadCountry(state.country);
    for (const r of country.regions) els.region.add(new Option(r.name, r.code));
    els.region.disabled = country.regions.length === 0;
    if (!country.regions.some((r) => r.code === state.region)) state.region = '';
    els.region.value = state.region;
  }

  // ---- form → state ----
  function readForm() {
    state.mode = ([...modeInputs].find((r) => r.checked)?.value as Mode) ?? 'between';
    if (parseISODate(els.start.value) !== null) state.start = els.start.value;
    if (parseISODate(els.end.value) !== null) state.end = els.end.value;
    state.includeEnd = els.inc.checked;
    state.op = els.op.value === 'subtract' ? 'subtract' : 'add';
    state.region = els.region.value;
  }

  function setStatus(main: string, sub: string, ok: boolean) {
    els.main.textContent = main;
    els.sub.textContent = sub;
    els.copyResult.disabled = !ok;
    els.copyLink.disabled = !ok;
  }

  function shareUrl() {
    return `${location.origin}${location.pathname}?${stateToQuery(state)}`;
  }

  // ---- calculation ----
  async function calculate() {
    const id = ++runId;
    for (const el of form.querySelectorAll<HTMLElement>('[data-mode]')) el.hidden = el.dataset.mode !== state.mode;

    if (parseISODate(els.start.value) === null) return showError('Enter a valid start date between 1900 and 2199.');
    if (state.mode === 'between' && parseISODate(els.end.value) === null)
      return showError('Enter a valid end date between 1900 and 2199.');
    const daysValue = Number(els.days.value);
    if (state.mode === 'add') {
      if (els.days.value === '' || !Number.isInteger(daysValue) || daysValue < 0 || daysValue > MAX_ADD_DAYS)
        return showError(`Enter a whole number of working days from 0 to ${MAX_ADD_DAYS.toLocaleString()}.`);
      state.days = daysValue;
    }
    if (state.weekendDays.length >= 7) return showError('Leave at least one day of the week as a working day.');

    // Which years of holidays we need.
    const startDay = parseISODate(state.start)!;
    let fromYear: number;
    let toYear: number;
    if (state.mode === 'between') {
      const endDay = parseISODate(state.end)!;
      fromYear = yearOf(Math.min(startDay, endDay));
      toYear = yearOf(Math.max(startDay, endDay));
    } else {
      const span = estimateCalendarSpan(state.days, state.weekendDays);
      fromYear = yearOf(state.op === 'subtract' ? startDay - span : startDay);
      toYear = yearOf(state.op === 'subtract' ? startDay : startDay + span);
    }

    const all = new Map<string, string[]>();
    if (state.country !== 'none') {
      try {
        const country = await loadCountry(state.country);
        if (id !== runId) return;
        for (let y = clampYear(fromYear); y <= clampYear(toYear); y++) {
          for (const h of country.getHolidays(y, state.region || undefined)) {
            const names = all.get(h.date) ?? [];
            names.push(h.name);
            all.set(h.date, names);
          }
        }
      } catch {
        return showError('Holiday data could not be loaded. Check your connection and reload the page.');
      }
    }
    const active = (date: string) => (state.skip.has(date) ? undefined : all.get(date));
    const rules = { weekendDays: state.weekendDays, holidays: active, daysOff: state.off };

    try {
      if (state.mode === 'between') {
        renderCount(countWorkingDays(state.start, state.end, state.includeEnd, rules), all);
      } else {
        const signed = state.op === 'subtract' ? -state.days : state.days;
        const r = addWorkingDays(state.start, signed, rules);
        if (parseISODate(r.result) === null) return showError('The result is outside the supported years (1900–2199).');
        renderAdd(r, all);
      }
    } catch (e) {
      // Dates stepping past the supported range throw from formatISODate/parse helpers.
      showError(e instanceof Error ? e.message : 'Something went wrong with this calculation.');
    }
    if (userChanged) history.replaceState(null, '', `?${stateToQuery(state)}`);
  }

  function showError(message: string) {
    setStatus('–', message, false);
    setStats('–', '–', '–', '–');
    els.holList.replaceChildren();
  }

  function setStats(total: string | number, weekend: string | number, holidays: string | number, working: string | number) {
    const set = (k: string, v: string | number) => {
      form.querySelector(`[data-stat="${k}"]`)!.textContent = typeof v === 'number' ? v.toLocaleString() : v;
    };
    set('total', total);
    set('weekend', weekend);
    set('holidays', holidays);
    set('working', working);
  }

  function holidaysBetween(all: Map<string, string[]>, from: string, to: string): Holiday[] {
    const list: Holiday[] = [];
    for (const [date, names] of all) {
      if (date >= from && date <= to) for (const name of names) list.push({ date, name });
    }
    return list.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  }

  function renderHolidayList(list: Holiday[]) {
    const where = describeHolidays();
    if (state.country === 'none') {
      els.holList.replaceChildren(listNote('Public holidays are switched off. Choose a country to include them.'));
      return;
    }
    if (list.length === 0) {
      els.holList.replaceChildren(listNote(`No ${where} public holidays in this period.`));
      return;
    }
    const weekend = new Set(state.weekendDays);
    els.holList.replaceChildren(
      ...list.map((h, i) => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'flex min-h-9 cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-surface';
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'mt-0.5 size-5 shrink-0 accent-accent';
        box.checked = !state.skip.has(h.date);
        box.dataset.holiday = h.date;
        box.id = `hol-${i}`;
        const text = document.createElement('span');
        const onWeekend = weekend.has(weekday(parseISODate(h.date)!));
        const strong = document.createElement('span');
        strong.className = 'font-semibold';
        strong.textContent = formatLongDate(h.date);
        text.append(strong, ` — ${h.name}`);
        if (onWeekend) {
          const tag = document.createElement('span');
          tag.className = 'ml-1 text-xs text-muted';
          tag.textContent = '(on a weekend)';
          text.append(tag);
        }
        label.append(box, text);
        li.append(label);
        return li;
      }),
    );
  }

  function listNote(text: string) {
    const li = document.createElement('li');
    li.className = 'p-1 text-muted';
    li.textContent = text;
    return li;
  }

  function describeHolidays(): string {
    if (state.country === 'none') return 'no';
    const country = COUNTRIES.find((c) => c.code === state.country)?.name ?? state.country;
    const region = state.region ? els.region.selectedOptions[0]?.textContent : '';
    return region ? `${country} (${region})` : country;
  }

  function settingsLine(): string {
    const days = state.weekend === 'custom' ? ` (${[...state.weekendDays].sort().map((d) => DAY_NAMES[d]).join(', ') || 'none'})` : '';
    const hol = state.country === 'none' ? 'no public holidays' : `${describeHolidays()} public holidays`;
    return `${WEEKEND_LABELS[state.weekend]}${days}, ${hol}`;
  }

  function deducted(r: { holidays: HolidayHit[]; daysOff: string[] }) {
    return r.holidays.length + r.daysOff.length;
  }

  function renderCount(r: CountResult, all: Map<string, string[]>) {
    const n = r.workingDays;
    const main = `${n.toLocaleString()} working ${n === 1 ? 'day' : 'days'}`;
    const range = `${formatLongDate(r.start)} and ${formatLongDate(r.end)}`;
    const sub =
      `Between ${range}, ${r.includeEnd ? 'including' : 'not including'} the end date.` +
      (r.reversed ? ' The end date was before the start date, so the dates were swapped.' : '');
    setStatus(main, sub, true);
    setStats(r.totalDays, r.weekendDays, deducted(r), r.workingDays);
    const last = r.includeEnd ? r.end : formatDayBefore(r.end);
    renderHolidayList(r.totalDays > 0 ? holidaysBetween(all, r.start, last) : []);
    summary =
      `${main} between ${range} (end date ${r.includeEnd ? 'included' : 'not included'}). ` +
      `${r.totalDays.toLocaleString()} calendar days, ${r.weekendDays.toLocaleString()} weekend days, ` +
      `${deducted(r)} holidays/days off. Settings: ${settingsLine()}.`;
  }

  function renderAdd(r: AddResult, all: Map<string, string[]>) {
    const n = Math.abs(r.days);
    const main = formatLongDate(r.result);
    const dir = r.days < 0 ? 'before' : 'after';
    const sub =
      `${n.toLocaleString()} working ${n === 1 ? 'day' : 'days'} ${dir} ${formatLongDate(r.start)}` +
      ` (${Math.abs(r.calendarDays).toLocaleString()} calendar ${Math.abs(r.calendarDays) === 1 ? 'day' : 'days'}).`;
    setStatus(main, sub, true);
    setStats(Math.abs(r.calendarDays), r.weekendDays, deducted(r), n);
    const [from, to] = r.days < 0 ? [r.result, r.start] : [r.start, r.result];
    renderHolidayList(r.days === 0 ? [] : holidaysBetween(all, from, to).filter((h) => h.date !== r.start));
    summary = `${main}: ${sub} Settings: ${settingsLine()}.`;
  }

  function formatDayBefore(iso: string) {
    const d = parseISODate(iso)!;
    return new Date((d - 1) * 86_400_000).toISOString().slice(0, 10);
  }

  // ---- events ----
  function changed() {
    userChanged = true;
    readForm();
    void calculate();
  }

  form.addEventListener('submit', (e) => e.preventDefault());
  for (const r of modeInputs) r.addEventListener('change', changed);
  for (const el of [els.start, els.end, els.inc, els.op, els.region]) el.addEventListener('change', changed);
  els.days.addEventListener('input', changed);
  els.start.addEventListener('input', changed);
  els.end.addEventListener('input', changed);

  els.country.addEventListener('change', async () => {
    state.country = els.country.value;
    state.region = '';
    state.skip.clear();
    userChanged = true;
    try {
      await updateRegions();
    } catch {
      // calculate() reports the loading error
    }
    void calculate();
  });

  els.weekend.addEventListener('change', () => {
    const p = els.weekend.value as WeekendPattern;
    state.weekend = p;
    if (p !== 'custom') state.weekendDays = [...WEEKEND_PATTERNS[p]];
    for (const d of dayInputs) d.checked = state.weekendDays.includes(Number(d.value));
    userChanged = true;
    void calculate();
  });

  for (const d of dayInputs) {
    d.addEventListener('change', () => {
      state.weekendDays = [...dayInputs].filter((x) => x.checked).map((x) => Number(x.value));
      state.weekend = patternFor(state.weekendDays);
      els.weekend.value = state.weekend;
      userChanged = true;
      void calculate();
    });
  }

  els.holList.addEventListener('change', (e) => {
    const box = e.target as HTMLInputElement;
    const date = box.dataset.holiday;
    if (!date) return;
    if (box.checked) state.skip.delete(date);
    else state.skip.add(date);
    // Several holidays can share a date: keep their boxes in sync.
    for (const other of els.holList.querySelectorAll<HTMLInputElement>(`input[data-holiday="${date}"]`)) {
      other.checked = box.checked;
    }
    userChanged = true;
    void calculate().then(() => {
      // Re-rendering replaces the list; keep keyboard focus on the same holiday.
      els.holList.querySelector<HTMLInputElement>(`input[data-holiday="${date}"]`)?.focus();
    });
  });

  function addDayOff() {
    const v = els.offDate.value;
    if (parseISODate(v) === null) {
      els.offDate.focus();
      return;
    }
    state.off.add(v);
    els.offDate.value = '';
    renderDaysOff();
    userChanged = true;
    void calculate();
  }
  els.offAdd.addEventListener('click', addDayOff);
  els.offDate.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDayOff();
    }
  });
  els.offList.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-remove-off]');
    if (!btn) return;
    state.off.delete(btn.dataset.removeOff!);
    renderDaysOff();
    userChanged = true;
    void calculate();
    (els.offList.querySelector('button') ?? els.offDate).focus();
  });

  let statusTimer: number | undefined;
  async function copy(text: string, what: string) {
    const ok = await copyText(text);
    els.copyStatus.textContent = ok ? `${what} copied` : 'Copy failed — select and copy manually';
    clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => (els.copyStatus.textContent = ''), 4000);
  }
  els.copyResult.addEventListener('click', () => void copy(`${summary}\n${shareUrl()}`, 'Result'));
  els.copyLink.addEventListener('click', () => void copy(shareUrl(), 'Link'));

  // ---- start ----
  writeForm();
  document.querySelector('.js-loading')?.remove();
  void updateRegions()
    .catch(() => undefined)
    .then(() => calculate());
}
