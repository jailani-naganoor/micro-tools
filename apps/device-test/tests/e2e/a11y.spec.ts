import { test, expect, expectAccessible } from '@micro/ui/testing/fixtures';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });
    for (const path of ['/#mic', '/#webcam', '/#keyboard', '/#screen', '/#speaker', '/about/', '/privacy/', '/blog/', '/blog/dead-pixels-vs-stuck-pixels/']) {
      test(`no WCAG A/AA violations on ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await expectAccessible(page, `${colorScheme} ${path}`);
      });
    }

    test('running tests and error box are accessible', async ({ page }) => {
      await page.goto('/#mic');
      await page.getByRole('button', { name: 'Start microphone' }).click();
      await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
      await expectAccessible(page, 'mic running');
      await page.goto('/#webcam');
      await page.getByRole('button', { name: 'Start camera' }).click();
      await page.getByRole('button', { name: 'Take snapshot' }).click();
      await expect(page.locator('#cam-shot')).toBeVisible();
      await expectAccessible(page, 'webcam running');
      await page.goto('/#keyboard');
      await page.keyboard.press('KeyQ');
      await expectAccessible(page, 'keyboard pressed');
    });
  });
}
