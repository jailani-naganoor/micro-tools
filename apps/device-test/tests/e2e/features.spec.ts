// Tests for the mic details, processing toggles and download, the speaker test, keyboard
// rollover/chatter, the phone keyboard message, screen patterns, full-screen fallback and
// the stuck pixel fixer.
import { devices, type Page } from '@playwright/test';
import { test, expect, expectAccessible } from '@micro/ui/testing/fixtures';

function trackUploads(page: Page) {
  const nonGet: string[] = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') nonGet.push(`${r.method()} ${r.url()}`);
  });
  return nonGet;
}

/** A device descriptor without defaultBrowserType, which can't be set inside a describe block. */
function emulate(name: string) {
  const d: Partial<(typeof devices)[string]> = { ...devices[name] };
  delete d.defaultBrowserType;
  return d;
}

const info = (page: Page, key: string) => page.locator(`#mic-info [data-info="${key}"]`);

test.describe('microphone details, processing and download', () => {
  test('shows what the browser reports, before and after starting', async ({ page }) => {
    await page.goto('/#mic');
    await expect(page.getByRole('heading', { name: 'Microphone details' })).toBeVisible();
    await expect(info(page, 'sampleRate')).toHaveText('–');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(info(page, 'label')).not.toHaveText('–');
    await expect(info(page, 'sampleRate')).toHaveText(/^\d+ Hz$|Not reported by this browser/);
    await expect(info(page, 'channelCount')).toHaveText(/^\d+$|Not reported by this browser/);
    for (const key of ['echoCancellation', 'noiseSuppression', 'autoGainControl']) {
      await expect(info(page, key)).toHaveText(/^(On|Off|Not reported by this browser)$/);
    }
    await expect(info(page, 'latency')).toHaveText(/ ms$|Not reported by this browser/);
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(info(page, 'label')).toHaveText('–');
  });

  test('noise suppression and echo cancellation toggles restart the stream', async ({ page }) => {
    await page.goto('/#mic');
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await expect(info(page, 'noiseSuppression')).toHaveText('On');
    await page.getByLabel('Noise suppression').uncheck();
    await expect(info(page, 'noiseSuppression')).toHaveText('Off');
    await expect(info(page, 'echoCancellation')).toHaveText('On');
    await page.getByLabel('Echo cancellation').uncheck();
    await expect(info(page, 'echoCancellation')).toHaveText('Off');
    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();
    await expect(page.locator('#mic-status')).toContainText(/Listening|Sound detected/);
  });

  test('downloads the recording straight from the browser', async ({ page }) => {
    const nonGet = trackUploads(page);
    await page.goto('/#mic');
    const download = page.getByRole('link', { name: 'Download recording' });
    await expect(download).toBeHidden();
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await page.getByRole('button', { name: 'Record 5 seconds' }).click();
    await expect(download).toBeVisible({ timeout: 10_000 });
    expect(await download.getAttribute('href')).toMatch(/^blob:/);
    await expect(download).toHaveAttribute('download', /^mic-recording\.(webm|ogg|m4a|wav)$/);
    const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
    expect(file.suggestedFilename()).toMatch(/^mic-recording\./);
    expect(nonGet, 'no uploads').toEqual([]);
  });
});

test.describe('speaker test', () => {
  test('plays generated sound on the left, right and both channels', async ({ page }) => {
    const nonGet = trackUploads(page);
    // Record which merger inputs (0 = left, 1 = right) the sound is routed to.
    await page.addInitScript(() => {
      const w = window as unknown as { __channels: number[][] };
      w.__channels = [];
      const connect = AudioNode.prototype.connect as (...args: unknown[]) => unknown;
      AudioNode.prototype.connect = function (this: AudioNode, ...args: unknown[]) {
        if (args[0] instanceof ChannelMergerNode) w.__channels.at(-1)!.push(args[2] as number);
        return connect.apply(this, args);
      } as typeof AudioNode.prototype.connect;
      const merger = BaseAudioContext.prototype.createChannelMerger;
      BaseAudioContext.prototype.createChannelMerger = function (this: BaseAudioContext, n?: number) {
        w.__channels.push([]);
        return merger.call(this, n);
      };
    });
    await page.goto('/#speaker');
    await expect(page.getByRole('heading', { name: 'Speaker test', level: 2 })).toBeVisible();
    await expect(page.getByText('turn your volume down')).toBeVisible();
    const status = page.locator('#speaker-status');
    await page.getByRole('button', { name: 'Play left' }).click();
    await expect(status).toContainText('left speaker only');
    await page.getByRole('button', { name: 'Play right' }).click();
    await expect(status).toContainText('right speaker only');
    await page.getByRole('button', { name: 'Play both' }).click();
    await expect(status).toHaveText(/Played on both speakers/, { timeout: 5000 });
    const channels = await page.evaluate(() => (window as unknown as { __channels: number[][] }).__channels);
    expect(channels).toEqual([[0], [1], [0, 1]]);
    expect(nonGet, 'no uploads').toEqual([]);
  });
});

test.describe('keyboard rollover and chatter', () => {
  test('counts the most keys held at once', async ({ page }) => {
    await page.goto('/#keyboard');
    await page.locator('#panel-keyboard').click({ position: { x: 5, y: 5 } });
    for (const k of ['KeyA', 'KeyS', 'KeyD', 'KeyF']) await page.keyboard.down(k);
    await expect(page.locator('#kb-held')).toHaveText('4');
    await expect(page.locator('#kb-max')).toHaveText('4');
    for (const k of ['KeyA', 'KeyS', 'KeyD', 'KeyF']) await page.keyboard.up(k);
    await expect(page.locator('#kb-held')).toHaveText('0');
    await expect(page.locator('#kb-max')).toHaveText('4');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#kb-max')).toHaveText('0');
  });

  test('flags a key that registers again within 30 ms of release, but not normal presses', async ({ page }) => {
    await page.goto('/#keyboard');
    const fire = (sequence: [string, number][]) =>
      page.evaluate(async (seq) => {
        for (const [type, wait] of seq) {
          if (wait) await new Promise((r) => setTimeout(r, wait));
          document.body.dispatchEvent(new KeyboardEvent(type, { code: 'KeyE', key: 'e', bubbles: true }));
        }
      }, sequence);
    // Normal typing: released, then pressed again 150 ms later.
    await fire([['keydown', 0], ['keyup', 0], ['keydown', 150], ['keyup', 0]]);
    await expect(page.locator('#kb-chatter-count')).toHaveText('0');
    // Held key auto-repeat is not chatter.
    await page.evaluate(() => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true }));
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', repeat: true, bubbles: true }));
      document.body.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', bubbles: true }));
    });
    await expect(page.locator('#kb-chatter-count')).toHaveText('0');
    // Chatter: pressed again immediately after release.
    await fire([['keydown', 200], ['keyup', 0], ['keydown', 0], ['keyup', 0]]);
    await expect(page.locator('#kb-chatter-count')).toHaveText('1');
    await expect(page.locator('#kb-chatter')).toContainText('Possible chatter: “E”');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#kb-chatter-count')).toHaveText('0');
    await expect(page.locator('#kb-chatter')).toHaveText('');
  });

  test('desktop shows the test, not the phone message', async ({ page }) => {
    await page.goto('/#keyboard');
    await expect(page.locator('#kb-test')).toBeVisible();
    await expect(page.locator('#kb-touch')).toBeHidden();
  });
});

test.describe('keyboard test on a touch-only phone', () => {
  test.use(emulate('Pixel 7'));

  test('explains that on-screen keyboards can’t be tested, with a way to continue', async ({ page }) => {
    await page.goto('/#keyboard');
    const note = page.locator('#kb-touch');
    await expect(note).toBeVisible();
    await expect(note).toContainText('This test is for physical keyboards');
    await expect(note).toContainText('on-screen keyboard');
    await expect(page.locator('#kb-test')).toBeHidden();
    await expectAccessible(page, 'phone keyboard message');
    await page.getByRole('button', { name: 'I have a keyboard connected' }).click();
    await expect(page.locator('#kb-test')).toBeVisible();
    await expect(note).toBeHidden();
  });

  test('a physical key press starts the test automatically', async ({ page }) => {
    await page.goto('/#keyboard');
    await expect(page.locator('#kb-touch')).toBeVisible();
    // On-screen keyboards send "Unidentified" keys: these don't start the test.
    await page.evaluate(() =>
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', keyCode: 229, bubbles: true })),
    );
    await expect(page.locator('#kb-test')).toBeHidden();
    await page.keyboard.press('KeyA');
    await expect(page.locator('#kb-test')).toBeVisible();
    await expect(page.locator('#kb-touch')).toBeHidden();
    await expect(page.locator('.kb-key[data-code="KeyA"]')).toHaveClass(/tested/);
  });
});

test.describe('dead pixel test patterns and full screen', () => {
  test('goes full screen, hides the cursor and shows gradient, checkerboard and backlight bleed screens', async ({ page }) => {
    await page.goto('/#screen');
    await page.getByRole('button', { name: 'Start dead pixel test' }).click();
    const overlay = page.locator('#screen-overlay');
    await expect(overlay).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('screen-overlay');
    await expect(overlay).toHaveCSS('cursor', 'none');
    await expect(page.locator('#screen-fs-note')).toHaveText('');
    for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowRight');
    await expect(overlay).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.locator('#screen-hint')).toContainText('banding');
    await page.keyboard.press('ArrowRight');
    await expect(overlay).toHaveCSS('background-image', /conic-gradient/);
    await expect(page.locator('#screen-hint')).toContainText('Checkerboard');
    await page.keyboard.press('ArrowRight');
    await expect(overlay).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(page.locator('#screen-hint')).toContainText('Backlight bleed');
    await expect(page.locator('#screen-colour')).toContainText('12 of 12');
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
  });

  test('says so when full screen is refused, and still fills the window', async ({ page }) => {
    await page.addInitScript(() => {
      Element.prototype.requestFullscreen = () => Promise.reject(new TypeError('Permissions check failed'));
    });
    await page.goto('/#screen');
    await page.getByRole('button', { name: 'Start dead pixel test' }).click();
    const overlay = page.locator('#screen-overlay');
    await expect(overlay).toBeVisible();
    await expect(page.locator('#screen-hint')).toContainText('Full screen isn’t available here');
    const box = await overlay.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box).toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden();
    await expect(page.locator('#screen-fs-note')).toContainText('Full screen isn’t available here');
    await expect(page.locator('#screen-ios-tip')).toBeHidden();
  });
});

test.describe('dead pixel test on iPhone', () => {
  test.use(emulate('iPhone 15'));

  test('shows a landscape / Add to Home Screen tip before starting', async ({ page }) => {
    await page.addInitScript(() => {
      // iPhone Safari has no element full-screen API.
      Object.defineProperty(Element.prototype, 'requestFullscreen', { value: undefined });
      Object.defineProperty(Document.prototype, 'fullscreenEnabled', { get: () => false });
    });
    await page.goto('/#screen');
    const tip = page.locator('#screen-ios-tip');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('landscape');
    await expect(tip).toContainText('Add to Home Screen');
    await page.getByRole('button', { name: 'Start dead pixel test' }).click();
    await expect(page.locator('#screen-hint')).toContainText('Full screen isn’t available here');
    await expect(page.locator('#screen-fs-note')).toContainText('iPhone tip');
  });
});

test.describe('stuck pixel fixer', () => {
  const layer = (page: Page) => page.locator('#fixer-layer');
  const openWarning = async (page: Page) => {
    await page.getByRole('button', { name: 'Start stuck pixel fixer…' }).click();
    const dialog = page.getByRole('dialog', { name: 'Photosensitivity warning' });
    await expect(dialog).toBeVisible();
    return dialog;
  };

  test('never starts by itself and needs the warning confirmed', async ({ page }) => {
    await page.goto('/#screen');
    await expect(page.getByRole('heading', { name: 'Stuck pixel fixer', exact: true })).toBeVisible();
    await expect(page.locator('#panel-screen')).toContainText('can’t revive it');
    await page.waitForTimeout(500);
    await expect(layer(page)).toBeHidden();

    const dialog = await openWarning(page);
    await expect(dialog).toContainText('photosensitive epilepsy');
    await expect(page.locator('#fixer-rm-label')).toBeHidden();
    const go = page.getByRole('button', { name: 'Start flashing box' });
    await expect(go).toBeDisabled();
    await expect(layer(page)).toBeHidden();
    await expectAccessible(page, 'fixer warning');

    // Cancel with Esc: nothing starts.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(layer(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Start stuck pixel fixer…' })).toBeFocused();

    await openWarning(page);
    await expect(page.getByLabel('I have read the warning')).not.toBeChecked();
    await page.getByLabel('I have read the warning').check();
    await expect(go).toBeEnabled();
    await go.click();
    await expect(layer(page)).toBeVisible();
    await expect(page.locator('#fixer-box')).toHaveCSS('width', '128px');
    const colours = new Set<string>();
    for (let i = 0; i < 6; i++) {
      colours.add(await page.locator('#fixer-box').evaluate((el) => el.style.backgroundColor));
      await page.waitForTimeout(20);
    }
    expect(colours.size, 'the box flashes').toBeGreaterThan(1);

    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
    await expect(page.locator('#fixer-status')).toContainText('stopped');
    await expect(page.getByRole('button', { name: 'Start stuck pixel fixer…' })).toBeFocused();
  });

  test('can be dragged, resized and stopped with one click', async ({ page }) => {
    await page.goto('/#screen');
    await page.locator('#fixer-size').selectOption('256');
    await openWarning(page);
    await page.getByLabel('I have read the warning').check();
    await page.getByRole('button', { name: 'Start flashing box' }).click();
    const box = page.locator('#fixer-box');
    await expect(box).toHaveCSS('width', '256px');
    const before = (await box.boundingBox())!;
    await page.mouse.move(before.x + 20, before.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + 80, before.y + 60, { steps: 5 });
    await page.mouse.up();
    await expect(layer(page)).toBeVisible(); // a drag doesn't stop it
    const after = (await box.boundingBox())!;
    expect(after.x - before.x).toBeCloseTo(60, 0);
    expect(after.y - before.y).toBeCloseTo(40, 0);
    await page.mouse.click(10, 10);
    await expect(layer(page)).toBeHidden();
  });

  test('stops with one tap on a touch screen', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ ...emulate('Pixel 7'), baseURL });
    const page = await ctx.newPage();
    await page.goto('/#screen');
    await page.getByRole('button', { name: 'Start stuck pixel fixer…' }).tap();
    await page.getByLabel('I have read the warning').tap();
    await page.getByRole('button', { name: 'Start flashing box' }).tap();
    await expect(layer(page)).toBeVisible();
    await page.locator('#fixer-box').tap();
    await expect(layer(page)).toBeHidden();
    await ctx.close();
  });

  test('asks for an extra confirmation when reduced motion is on', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#screen');
    await openWarning(page);
    await expect(page.locator('#fixer-rm-note')).toBeVisible();
    await expect(page.locator('#fixer-rm-note')).toContainText('reduce motion');
    const go = page.getByRole('button', { name: 'Start flashing box' });
    await page.getByLabel('I have read the warning').check();
    await expect(go).toBeDisabled();
    await page.getByLabel('even though reduce motion is on').check();
    await expect(go).toBeEnabled();
    await expectAccessible(page, 'fixer warning (reduced motion)');
    await go.click();
    await expect(layer(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(layer(page)).toBeHidden();
  });
});
