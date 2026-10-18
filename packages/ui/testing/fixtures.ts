// Shared Playwright fixtures. Every test automatically fails if the page logs a console
// error, throws, or makes a request to another origin (env flags are off in tests, so the
// sites must not contact any third party).
import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';

export interface Guard {
  errors: string[];
  external: string[];
  /** Call in tests that expect an error (e.g. visiting a 404 page). */
  allowErrors(): void;
}

export const test = base.extend<{ guard: Guard }>({
  guard: [
    async ({ page, baseURL }, use) => {
      const errors: string[] = [];
      const external: string[] = [];
      let allow = false;
      page.on('console', (m) => {
        if (m.type() === 'error') errors.push(m.text());
      });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('request', (r) => {
        const url = r.url();
        if (!url.startsWith(baseURL!) && !/^(data|blob):/.test(url)) external.push(url);
      });
      await use({ errors, external, allowErrors: () => (allow = true) });
      if (!allow) expect(errors, 'console errors').toEqual([]);
      expect(external, 'requests to other origins').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Crawl internal links from the given pages and check each returns 200. */
export async function checkInternalLinks(page: Page, request: APIRequestContext, startPaths: string[]) {
  const seen = new Set<string>();
  const queue = [...startPaths];
  const externals = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const res = await request.get(path);
    expect(res.status(), `GET ${path}`).toBe(200);
    if (!(res.headers()['content-type'] ?? '').includes('text/html')) continue;
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')!));
    for (const href of hrefs) {
      if (href.startsWith('mailto:')) continue;
      if (/^https?:\/\//.test(href)) {
        externals.add(href);
        continue;
      }
      const clean = href.split('#')[0];
      if (clean && clean.startsWith('/') && !seen.has(clean)) queue.push(clean);
    }
  }
  // External links are not fetched (tests run offline) but must be well-formed https URLs.
  for (const href of externals) expect(href, 'external link').toMatch(/^https:\/\/\S+$/);
  return { pages: [...seen], externals: [...externals] };
}

/** Assertions shared by every page: title/description lengths, canonical, one H1, OG image. */
export async function checkPageBasics(page: Page) {
  const title = await page.title();
  expect(title.length, `title "${title}"`).toBeGreaterThan(10);
  expect(title.length, `title "${title}"`).toBeLessThan(60);
  const description = await page.getAttribute('meta[name="description"]', 'content');
  expect(description?.length ?? 0, `description "${description}"`).toBeGreaterThan(50);
  expect(description?.length ?? 0, `description "${description}"`).toBeLessThan(155);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.png$/);
}

export async function jsonLdTypes(page: Page): Promise<string[]> {
  const blocks = await page.$$eval('script[type="application/ld+json"]', (els) => els.map((e) => e.textContent ?? ''));
  return blocks.map((b) => JSON.parse(b)['@type']);
}

/** Run axe-core against the page for WCAG 2.2 A/AA rules and fail on any violation. */
export async function expectAccessible(page: Page, context?: string) {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`,
  );
  expect(summary, `accessibility violations${context ? ` (${context})` : ''}`).toEqual([]);
}

/**
 * Apply the headers from the generated dist/_headers "/*" block to every response, so
 * tests run under the production CSP and Permissions-Policy (astro preview doesn't
 * serve _headers). CSP violations show up as console errors and fail the test.
 */
export async function useProductionHeaders(page: Page, headersFile: string) {
  const { readFileSync } = await import('node:fs');
  const lines = readFileSync(headersFile, 'utf8').split('\n');
  const start = lines.indexOf('/*');
  const headers: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith('  ')) break;
    const i = line.indexOf(':');
    headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  expect(headers['Content-Security-Policy']).toBeTruthy();
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), ...headers } });
  });
  return headers;
}
