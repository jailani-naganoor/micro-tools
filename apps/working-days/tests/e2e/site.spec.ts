import {
  test,
  expect,
  checkInternalLinks,
  checkPageBasics,
  checkPublishedPosts,
  jsonLdTypes,
  publishedPostIds,
} from '@micro/ui/testing/fixtures';

const BLOG_DIR = new URL('../../src/content/blog/', import.meta.url).pathname;

const INNER = ['/about/', '/contact/', '/privacy/', '/terms/', '/blog/'];

test('every internal link works', async ({ page, request }) => {
  const { pages, externals } = await checkInternalLinks(page, request, ['/', ...INNER]);
  expect(pages).toEqual(expect.arrayContaining(['/', ...INNER]));
  // Links to the sibling site and the community site come from env placeholders.
  expect(externals.some((u) => u.includes('device-test'))).toBe(true);
  expect(externals.some((u) => u.includes('community'))).toBe(true);
});

for (const path of INNER) {
  test(`${path} has SEO basics and breadcrumbs`, async ({ page }) => {
    await page.goto(path);
    await checkPageBasics(page);
    expect(await jsonLdTypes(page)).toEqual(['Organization', 'BreadcrumbList']);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  });
}

test('privacy policy describes the current state truthfully', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByText('This site does not show ads and does not use advertising or tracking cookies.')).toBeVisible();
  await expect(page.getByText('We do not run any analytics.', { exact: true })).toBeVisible();
});

test('every published post is listed, in the sitemap, indexable and links to the tool', async ({ page, request }) => {
  await checkPublishedPosts(page, request, await publishedPostIds(BLOG_DIR));
});

test('home page links to 2–3 guides that exist', async ({ page, request }) => {
  await page.goto('/');
  const guides = page.locator('section[aria-labelledby="guides-heading"] li a');
  const count = await guides.count();
  expect(count).toBeGreaterThanOrEqual(2);
  expect(count).toBeLessThanOrEqual(3);
  for (const href of await guides.evaluateAll((as) => as.map((a) => a.getAttribute('href')!))) {
    expect(href).toMatch(/^\/blog\/[a-z0-9-]+\/$/);
    expect((await request.get(href)).status(), href).toBe(200);
  }
});

test('404 page', async ({ page, guard }) => {
  guard.allowErrors(); // the browser logs the 404 response
  const res = await page.goto('/does-not-exist/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Page not found');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('robots.txt, sitemap.xml, manifest and ads.txt', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/', ...INNER]) expect(sitemap).toContain(`${p}</loc>`);
  const manifest = await (await request.get('/site.webmanifest')).json();
  expect(manifest.icons.length).toBeGreaterThan(1);
  const ads = await (await request.get('/ads.txt')).text();
  expect(ads.split('\n').filter((l) => l.trim() && !l.startsWith('#'))).toEqual([]);
});

test('cookie settings dialog opens and closes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Cookie settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Cookie settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('does not use cookies for advertising or tracking');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});
