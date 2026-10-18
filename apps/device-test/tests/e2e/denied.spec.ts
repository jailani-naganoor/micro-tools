// Runs in the "media-denied" project: fake devices exist but the permission prompt is denied.
import { test, expect } from '@micro/ui/testing/fixtures';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
  });
});

test('microphone permission denied shows fix steps for each browser', async ({ page }) => {
  await page.goto('/#mic');
  await page.getByRole('button', { name: 'Start microphone' }).click();
  const box = page.locator('#mic-problem');
  await expect(box).toBeVisible();
  await expect(box).toHaveAttribute('role', 'alert');
  await expect(box).toContainText('Microphone access is blocked');
  for (const browser of ['Chrome', 'Microsoft Edge', 'Firefox', 'Safari on Mac', 'Safari on iPhone or iPad', 'Chrome on Android']) {
    await expect(box.locator('summary', { hasText: browser }).first()).toBeVisible();
  }
  await box.locator('summary', { hasText: 'Firefox' }).click();
  await expect(box).toContainText('Remove the Blocked permission');
  await expect(page.getByRole('button', { name: 'Start microphone' })).toBeEnabled();
});

test('camera permission denied shows fix steps', async ({ page }) => {
  await page.goto('/#webcam');
  await page.getByRole('button', { name: 'Start camera' }).click();
  await expect(page.locator('#cam-problem')).toContainText('Camera access is blocked');
  await expect(page.locator('#cam-problem [data-permission-help]')).toBeVisible();
  await expect(page.locator('#cam-status')).toHaveText('Camera not started.');
});

test('denied error box is accessible', async ({ page }) => {
  const { expectAccessible } = await import('@micro/ui/testing/fixtures');
  await page.goto('/#webcam');
  await page.getByRole('button', { name: 'Start camera' }).click();
  await expect(page.locator('#cam-problem')).toBeVisible();
  await page.locator('#cam-problem summary').first().click();
  await expectAccessible(page, 'denied');
});
