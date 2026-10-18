// Splits the date-holidays dataset into one small JSON file per supported
// country so the browser only downloads the country it needs.
// Re-run after upgrading date-holidays: npm run holidays -w @micro/working-days
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
// The JSON file is not in the package's "exports", so resolve it from the package root.
const pkgRoot = dirname(require.resolve('date-holidays/package.json'));
const data = JSON.parse(readFileSync(join(pkgRoot, 'data/holidays.json'), 'utf8'));
const codes = JSON.parse(readFileSync(join(here, '../src/data/countries.json'), 'utf8')).map(
  (c) => c.code,
);
const outDir = join(here, '../src/data/holidays');
mkdirSync(outDir, { recursive: true });

// Collect every `_name` key referenced by a country so we only ship those names.
function collectNameKeys(node, keys) {
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (k === '_name' && typeof v === 'string') keys.add(v);
    else collectNameKeys(v, keys);
  }
}

function collectRefs(node, refs = []) {
  if (!node || typeof node !== 'object') return refs;
  for (const [k, v] of Object.entries(node)) {
    if (k === '_days') refs.push(v);
    else collectRefs(v, refs);
  }
  return refs;
}

const zoneNames = new Set();
function collectZones(node) {
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (k === 'zones' && Array.isArray(v)) v.forEach((z) => zoneNames.add(z));
    else collectZones(v);
  }
}

for (const code of codes) {
  const country = data.holidays[code];
  if (!country) throw new Error(`date-holidays has no data for ${code}`);
  // Some states reuse another top-level entry's rules via `_days` (e.g. French
  // overseas departments), so include those entries' rules too.
  const holidays = { [code]: country };
  const pending = [country];
  while (pending.length) {
    const node = pending.pop();
    for (const ref of collectRefs(node)) {
      const [top] = [].concat(ref);
      if (holidays[top]) continue;
      const { days, _days } = data.holidays[top];
      holidays[top] = { days, ...(_days ? { _days } : {}) };
      pending.push(holidays[top]);
    }
  }
  const keys = new Set(['substitutes']);
  collectNameKeys(holidays, keys);
  const names = {};
  for (const key of keys) {
    const entry = data.names[key];
    if (!entry) continue;
    // Keep English and the country's own languages (fallbacks used by the parser).
    const langs = new Set(['en', ...(country.langs ?? [])]);
    names[key] = { name: Object.fromEntries(Object.entries(entry.name).filter(([l]) => langs.has(l))) };
  }
  collectZones(holidays);
  const subset = { version: data.version, license: data.license, holidays, names };
  writeFileSync(join(outDir, `${code}.json`), JSON.stringify(subset));
}
console.log(`Wrote ${codes.length} country files to ${outDir} (data version ${data.version})`);

// ---- Time zone data ----
// date-holidays-parser uses moment-timezone, whose default build ships every zone
// (~700 KB). We only use the calendar date of each holiday ("YYYY-MM-DD"), which does
// not depend on time zone offsets (verified against the full data for every country,
// region and many years), so the browser build registers each zone name as UTC.
// See src/lib/moment-tz.js and the alias in aliases.mjs.
writeFileSync(join(here, '../src/data/timezones.json'), JSON.stringify([...zoneNames].sort()));
console.log(`Wrote ${zoneNames.size} time zone names`);
