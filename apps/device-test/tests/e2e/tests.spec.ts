import { test, expect, checkPageBasics, jsonLdTypes } from '@micro/ui/testing/fixtures';
import type { Page } from '@playwright/test';

/** Record every request so we can prove media never leaves the page. */
function trackUploads(page: Page) {
  const nonGet: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') nonGet.push(`${r.method()} ${r.url()}`);
  });
  return nonGet;
}

test.describe('home page and tabs', () => {
  test('loads with SEO basics and structured data', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Online Mic, Webcam, Speaker, Keyboard & Dead Pixel Test');
    await checkPageBasics(page);
    expect(await jsonLdTypes(page)).toEqual(['Organization', 'WebApplication', 'FAQPage']);
    await expect(page.getByRole('tab', { name: 'Mic test' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.ad-slot, ins.adsbygoogle')).toHaveCount(0);
  });

  test('clicking a tab updates the hash and shows its panel', async ({ page }) => {
    await page.goto('/');
    for (const [name, hash, heading] of [
      ['Webcam test', '#webcam', 'Webcam test'],
      ['Keyboard test', '#keyboard', 'Keyboard test'],
      ['Dead pixel test', '#screen', 'Dead pixel test'],
      ['Speaker test', '#speaker', 'Speaker test'],
      ['Mic test', '#mic', 'Microphone test'],
    ]) {
      await page.getByRole('tab', { name }).click();
      await expect(page).toHaveURL(new RegExp(`${hash}$`));
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      await expect(page.getByRole('tabpanel').getByRole('heading', { level: 2 })).toHaveText(heading);
    }
  });

  for (const [hash, tab] of [
    ['#mic', 'Mic test'],
    ['#webcam', 'Webcam test'],
    ['#keyboard', 'Keyboard test'],
    ['#screen', 'Dead pixel test'],
    ['#speaker', 'Speaker test'],
  ]) {
    test(`direct link ${hash} opens that tab without scrolling`, async ({ page }) => {
      await page.goto(`/${hash}`);
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }

  test('arrow keys move between tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Mic test' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Webcam test' })).toBeFocused();
    await expect(page).toHaveURL(/#webcam$/);
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Speaker test' })).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/#speaker$/);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Mic test' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Speaker test' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.getByRole('tab', { name: 'Mic test' })).toHaveAttribute('aria-selected', 'true');
  });

  test('changing the hash switches tabs', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => (location.hash = '#keyboard'));
    await expect(page.getByRole('tab', { name: 'Keyboard test' })).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('microphone test (fake device, permission granted)', () => {
  test('shows the level meter, devices and records locally', async ({ page }) => {
    const nonGet = trackUploads(page);
    await page.goto('/#mic');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(page.locator('#mic-status')).toContainText(/Listening|Sound detected/);
    await expect(page.locator('#mic-device option').first()).not.toHaveText(/Start the test/);
    await expect(page.locator('#mic-info')).toBeVisible();
    await expect(page.locator('#mic-status')).toHaveText('Sound detected — your microphone is working.', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Record 5 seconds' }).click();
    await expect(page.locator('#mic-record-status')).toContainText('Recording');
    await expect(page.locator('#mic-playback')).toBeVisible({ timeout: 10_000 });
    expect(await page.locator('#mic-playback').getAttribute('src')).toMatch(/^blob:/);

    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByRole('button', { name: 'Start microphone' })).toBeVisible();
    expect(nonGet, 'no uploads').toEqual([]);
  });

  test('leaving the tab releases the microphone', async ({ page }) => {
    await page.goto('/#mic');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await page.getByRole('tab', { name: 'Keyboard test' }).click();
    await page.getByRole('tab', { name: 'Mic test' }).click();
    await expect(page.getByRole('button', { name: 'Start microphone' })).toBeVisible();
  });
});

test.describe('webcam test (fake device, permission granted)', () => {
  test('previews, reports resolution and frame rate, mirrors and snapshots locally', async ({ page }) => {
    const nonGet = trackUploads(page);
    await page.goto('/#webcam');
    await page.getByRole('button', { name: 'Start camera' }).click();
    await expect(page.locator('#cam-res')).toHaveText(/^\d+ × \d+$/);
    await expect(page.locator('#cam-fps')).toHaveText(/\d+ fps/, { timeout: 5000 });
    await expect(page.locator('#cam-placeholder')).toBeHidden();

    await expect(page.locator('#cam-video')).toHaveClass(/mirrored/);
    await page.getByLabel('Mirror preview').uncheck();
    await expect(page.locator('#cam-video')).not.toHaveClass(/mirrored/);

    await page.getByRole('button', { name: 'Take snapshot' }).click();
    await expect(page.locator('#cam-shot')).toBeVisible();
    expect(await page.locator('#cam-shot-save').getAttribute('href')).toMatch(/^blob:/);
    await expect(page.locator('#cam-shot-save')).toHaveAttribute('download', 'webcam-snapshot.png');

    await page.locator('#cam-quality').selectOption('720');
    await expect(page.locator('#cam-res')).toHaveText(/^\d+ × \d+$/);
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.locator('#cam-res')).toHaveText('–');
    expect(nonGet, 'no uploads').toEqual([]);
  });
});

test.describe('error states', () => {
  test('unsupported browser', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'mediaDevices', { value: undefined });
    });
    await page.goto('/#mic');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(page.locator('#mic-problem')).toBeVisible();
    await expect(page.locator('#mic-problem')).toContainText('can’t access the microphone');
  });

  test('insecure context', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'isSecureContext', { value: false });
    });
    await page.goto('/#webcam');
    await page.getByRole('button', { name: 'Start camera' }).click();
    await expect(page.locator('#cam-problem')).toContainText('secure connection');
  });

  for (const [error, text] of [
    ['NotFoundError', 'No camera found'],
    ['NotReadableError', 'couldn’t be started'],
  ]) {
    test(`camera ${error} shows a friendly message`, async ({ page }) => {
      await page.addInitScript((name) => {
        navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('test', name));
      }, error);
      await page.goto('/#webcam');
      await page.getByRole('button', { name: 'Start camera' }).click();
      await expect(page.locator('#cam-problem')).toContainText(text);
      await expect(page.getByRole('button', { name: 'Start camera' })).toBeEnabled();
    });
  }
});

test.describe('keyboard test', () => {
  test('highlights keys, shows codes, counts and resets', async ({ page }) => {
    await page.goto('/#keyboard');
    await page.locator('#panel-keyboard').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('KeyA');
    await expect(page.locator('#kb-code')).toHaveText('KeyA');
    await expect(page.locator('#kb-key')).toHaveText('a');
    await expect(page.locator('#kb-keycode')).toHaveText('65');
    await expect(page.locator('.kb-key[data-code="KeyA"]')).toHaveClass(/tested/);

    await page.keyboard.down('ShiftRight');
    await expect(page.locator('.kb-key[data-code="ShiftRight"]')).toHaveClass(/down/);
    await expect(page.locator('#kb-location')).toHaveText('Right');
    await page.keyboard.up('ShiftRight');
    await expect(page.locator('.kb-key[data-code="ShiftRight"]')).not.toHaveClass(/down/);

    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => window.scrollY), 'Space/arrows do not scroll the page').toBe(0);
    await expect(page.locator('#kb-count')).toHaveText('4');

    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#kb-count')).toHaveText('0');
    await expect(page.locator('.kb-key.tested')).toHaveCount(0);
  });

  test('ISO layout shows the extra keys', async ({ page }) => {
    await page.goto('/#keyboard');
    await expect(page.locator('.kb-key[data-code="IntlBackslash"]')).toBeHidden();
    await page.getByText('ISO (UK/EU)').click();
    await expect(page.locator('.kb-key[data-code="IntlBackslash"]')).toBeVisible();
    await page.locator('#panel-keyboard').click({ position: { x: 5, y: 5 } });
    // Playwright has no key name for the ISO extra key, so dispatch the event directly.
    await page.evaluate(() => {
      for (const type of ['keydown', 'keyup']) {
        document.body.dispatchEvent(new KeyboardEvent(type, { code: 'IntlBackslash', key: '\\', bubbles: true }));
      }
    });
    await expect(page.locator('.kb-key[data-code="IntlBackslash"]')).toHaveClass(/tested/);
  });

  test('Tab is recorded but still moves focus (no keyboard trap)', async ({ page }) => {
    await page.goto('/#keyboard');
    await page.getByRole('button', { name: 'Reset' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Reset' })).not.toBeFocused();
    await expect(page.locator('.kb-key[data-code="Tab"]')).toHaveClass(/tested/);
  });
});

test.describe('dead pixel test', () => {
  test('cycles colours with click and arrow keys and exits with Esc', async ({ page }) => {
    await page.goto('/#screen');
    const start = page.getByRole('button', { name: 'Start dead pixel test' });
    await start.click();
    const overlay = page.locator('#screen-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await overlay.click();
    await expect(overlay).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.keyboard.press('ArrowRight');
    await expect(overlay).toHaveCSS('background-color', 'rgb(255, 0, 0)');
    await page.keyboard.press('ArrowLeft');
    await expect(overlay).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(start).toBeFocused();
  });

  test('finishes after the last colour', async ({ page }) => {
    await page.goto('/#screen');
    await page.getByRole('button', { name: 'Start dead pixel test' }).click();
    for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
    await expect(page.locator('#screen-overlay')).toBeHidden();
    await expect(page.locator('#screen-status')).toContainText('finished');
  });
});
