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
  expect(externals.some((u) => u.includes('working-days'))).toBe(true);
  expect(externals.some((u) => u.includes('community'))).toBe(true);
});

for (const path of INNER) {
  test(`${path} has SEO basics and breadcrumbs`, async ({ page }) => {
    await page.goto(path);
    await checkPageBasics(page);
    expect(await jsonLdTypes(page)).toEqual(['Organization', 'BreadcrumbList']);
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
  });
}

test('privacy policy states media never leaves the device', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByText('they are never uploaded, streamed or stored on any server')).toBeVisible();
  await expect(page.getByText('This site does not show ads and does not use advertising or tracking cookies.')).toBeVisible();
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
  guard.allowErrors();
  const res = await page.goto('/nope/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Page not found');
});

test('robots.txt, sitemap.xml and ads.txt', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const p of ['/', ...INNER]) expect(sitemap).toContain(`${p}</loc>`);
  expect((await request.get('/ads.txt')).status()).toBe(200);
});
