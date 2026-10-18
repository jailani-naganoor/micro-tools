import { test, expect, checkInternalLinks, checkPageBasics, jsonLdTypes } from '@micro/ui/testing/fixtures';

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

test('blog index hides draft posts', async ({ page }) => {
  await page.goto('/blog/');
  await expect(page.getByText('No articles have been published yet.')).toBeVisible();
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
