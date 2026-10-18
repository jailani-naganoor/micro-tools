import { test, expect, useProductionHeaders } from '@micro/ui/testing/fixtures';

test('calculator works under the production CSP and Permissions-Policy', async ({ page }) => {
  const headers = await useProductionHeaders(page, 'dist/_headers');
  expect(headers['Content-Security-Policy']).toContain("script-src 'self';");
  expect(headers['Permissions-Policy']).toContain('camera=()');
  await page.goto('/?mode=add&start=2026-12-18&days=10&country=GB&region=ENG');
  await expect(page.locator('#result-main')).toHaveText(/6 Jan 2027/);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.getByRole('button', { name: 'Cookie settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Cookie settings' })).toBeVisible();
});

test('the production CSP blocks injected inline scripts', async ({ page, guard }) => {
  guard.allowErrors(); // the browser logs the CSP violation
  await useProductionHeaders(page, 'dist/_headers');
  await page.goto('/');
  const ran = await page.evaluate(() => {
    const s = document.createElement('script');
    s.textContent = 'window.__inlineRan = true';
    document.head.append(s);
    return (window as unknown as { __inlineRan?: boolean }).__inlineRan === true;
  });
  expect(ran).toBe(false);
  expect(guard.errors.join('\n')).toContain('Content Security Policy');
});
