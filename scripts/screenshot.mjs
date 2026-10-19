// Dev helper: screenshot a URL and print console errors / external requests.
// Usage: node scripts/screenshot.mjs <url> <out.png> [width] [height] [light|dark]
import { chromium } from '@playwright/test';
const [url, out, w = '1280', h = '900', scheme = 'light'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, colorScheme: scheme, locale: 'en-GB' });
const errors = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
p.on('request', (r) => { if (!r.url().startsWith('http://localhost')) errors.push('external: ' + r.url()); });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
await p.screenshot({ path: out, fullPage: process.env.FULL === '1' });
console.log(errors.join('\n') || 'no console errors');
await b.close();
