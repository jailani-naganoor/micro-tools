// Runs Lighthouse (mobile preset) against the built preview of each site and writes
// lighthouse-reports/summary.json plus one HTML report per page.
// Usage: npm run build && npm run lighthouse
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';

const SITES = [
  { dir: 'apps/working-days', port: 4501, pages: ['/', '/about/', '/blog/', '/blog/how-to-add-business-days-to-a-date/', '/privacy/'] },
  { dir: 'apps/device-test', port: 4502, pages: ['/', '/#keyboard', '/#speaker', '/#screen', '/about/', '/blog/microphone-not-working-windows-mac/', '/privacy/'] },
];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

mkdirSync('lighthouse-reports', { recursive: true });
const servers = SITES.map((s) =>
  spawn('npx', ['astro', 'preview', '--ignore-lock', '--port', String(s.port)], { cwd: s.dir, stdio: 'ignore' }),
);
await sleep(3000);

const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

const summary = [];
try {
  for (const site of SITES) {
    for (const path of site.pages) {
      const url = `http://localhost:${site.port}${path}`;
      const result = await lighthouse(url, {
        port: chrome.port,
        output: 'html',
        logLevel: 'error',
        onlyCategories: CATEGORIES,
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
        throttlingMethod: 'simulate',
      });
      const lhr = result.lhr;
      const row = {
        site: site.dir.split('/')[1],
        path,
        ...Object.fromEntries(CATEGORIES.map((c) => [c, Math.round(lhr.categories[c].score * 100)])),
        cls: lhr.audits['cumulative-layout-shift'].numericValue,
        lcp: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
        tbt: Math.round(lhr.audits['total-blocking-time'].numericValue),
        failing: Object.values(lhr.audits)
          .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable')
          .map((a) => `${a.id} (${a.score})`),
      };
      summary.push(row);
      const name = `${row.site}${path.replace(/[^a-z0-9]+/gi, '-')}`.replace(/-+$/, '');
      writeFileSync(`lighthouse-reports/${name}.html`, result.report);
      console.log(
        `${row.site.padEnd(13)} ${path.padEnd(11)} perf ${row.performance}  a11y ${row.accessibility}  bp ${row['best-practices']}  seo ${row.seo}  CLS ${row.cls.toFixed(3)}  LCP ${row.lcp}ms  TBT ${row.tbt}ms`,
      );
      if (row.failing.length) console.log(`  below 0.9: ${row.failing.join(', ')}`);
    }
  }
} finally {
  await chrome.kill();
  servers.forEach((s) => s.kill());
}
writeFileSync('lighthouse-reports/summary.json', JSON.stringify(summary, null, 2));
