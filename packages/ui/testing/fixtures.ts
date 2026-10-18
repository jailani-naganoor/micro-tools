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
