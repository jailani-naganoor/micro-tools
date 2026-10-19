import { test, expect, useProductionHeaders } from '@micro/ui/testing/fixtures';

test('tests work under the production CSP and Permissions-Policy', async ({ page }) => {
  const headers = await useProductionHeaders(page, 'dist/_headers');
  expect(headers['Permissions-Policy']).toContain('camera=(self)');
  expect(headers['Permissions-Policy']).toContain('microphone=(self)');
  expect(headers['Content-Security-Policy']).toContain("connect-src 'self';");
  await page.goto('/#mic');
  await page.getByRole('button', { name: 'Start microphone' }).click();
  await expect(page.locator('#mic-info')).toBeVisible();
  await page.getByRole('tab', { name: 'Webcam test' }).click();
  await page.getByRole('button', { name: 'Start camera' }).click();
  await expect(page.locator('#cam-res')).toHaveText(/\d+ × \d+/);
  await page.getByRole('button', { name: 'Take snapshot' }).click();
  await expect(page.locator('#cam-shot')).toBeVisible();
  await page.getByRole('tab', { name: 'Dead pixel test' }).click();
  await page.getByRole('button', { name: 'Start dead pixel test' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#screen-overlay')).toBeHidden();
});
