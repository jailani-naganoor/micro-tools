import { test, expect, checkPageBasics, jsonLdTypes } from '@micro/ui/testing/fixtures';
import type { Page } from '@playwright/test';

const result = (page: Page) => page.locator('#result-main');
const stat = (page: Page, name: string) => page.locator(`[data-stat="${name}"]`);

test.describe('home page', () => {
  test('loads with SEO basics and structured data', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Working Days Calculator');
    await checkPageBasics(page);
    expect(await jsonLdTypes(page)).toEqual(['Organization', 'WebApplication', 'FAQPage']);
    await expect(result(page)).toHaveText(/working days?$/);
    // Ads are off: no ad markup or scripts at all.
    await expect(page.locator('.ad-slot, ins.adsbygoogle, meta[name="adsense-client"]')).toHaveCount(0);
  });

  test('does not change the URL until the user changes something', async ({ page }) => {
    await page.goto('/');
    await expect(result(page)).toHaveText(/working days?$/);
    expect(new URL(page.url()).search).toBe('');
  });

  test('defaults the country from the browser locale', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ locale: 'en-IN', baseURL });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('#country')).toHaveValue('IN');
    await ctx.close();
  });
});

test.describe('count working days between dates', () => {
  test('uses holidays, region, days off and the end-date toggle', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-12-01&end=2026-12-31&country=GB&region=SCT&weekend=sat-sun&off=2026-12-24');
    await expect(page.locator('#region')).toHaveValue('SCT');
    await expect(result(page)).toHaveText('19 working days');
    await expect(stat(page, 'total')).toHaveText('30');
    await expect(stat(page, 'weekend')).toHaveText('8');
    await expect(stat(page, 'holidays')).toHaveText('3');
    await expect(page.locator('#hol-list')).toContainText('Christmas Day');
    await expect(page.locator('#hol-list')).toContainText('Boxing Day (substitute day)');

    await page.getByLabel('Include the end date in the count').check();
    await expect(result(page)).toHaveText('20 working days');
    await expect(page).toHaveURL(/inc=1/);
  });

  test('unticking a holiday counts it as a working day and is saved in the URL', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-12-21&end=2026-12-31&inc=1&country=GB&region=ENG&weekend=sat-sun');
    await expect(result(page)).toHaveText('7 working days');
    await page.locator('input[data-holiday="2026-12-25"]').uncheck();
    await expect(result(page)).toHaveText('8 working days');
    await expect(page).toHaveURL(/skip=2026-12-25/);
    await expect(page.locator('input[data-holiday="2026-12-25"]')).toBeFocused();
    // Reloading the shared URL restores the same state.
    await page.reload();
    await expect(result(page)).toHaveText('8 working days');
    await expect(page.locator('input[data-holiday="2026-12-25"]')).not.toBeChecked();
  });

  test('custom days off can be added and removed', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-10-19&end=2026-10-26&country=none&weekend=sat-sun');
    await expect(result(page)).toHaveText('5 working days');
    await page.locator('summary', { hasText: 'Custom days off' }).click();
    await page.getByLabel('Day off date').fill('2026-10-21');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(result(page)).toHaveText('4 working days');
    await expect(page).toHaveURL(/off=2026-10-21/);
    await page.getByRole('button', { name: /Remove day off/ }).click();
    await expect(result(page)).toHaveText('5 working days');
    await expect(page).not.toHaveURL(/off=/);
  });

  test('weekend patterns and custom weekdays', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-10-19&end=2026-10-26&country=none');
    await expect(result(page)).toHaveText('5 working days');
    await page.locator('#weekend').selectOption('sun');
    await expect(result(page)).toHaveText('6 working days');
    await expect(page).toHaveURL(/weekend=sun/);
    // Ticking Wednesday as well makes a custom weekend.
    await page.locator('label.day-toggle', { hasText: 'Wed' }).click();
    await expect(page.locator('#weekend')).toHaveValue('custom');
    await expect(result(page)).toHaveText('5 working days');
    await expect(page).toHaveURL(/weekend=custom&weekdays=0,3/);
  });

  test('reversed dates are swapped with a note', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-10-26&end=2026-10-19&country=none');
    await expect(result(page)).toHaveText('5 working days');
    await expect(page.locator('#result-sub')).toContainText('dates were swapped');
  });

  test('shows region options for countries that have them', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-01-01&end=2026-02-01&country=US');
    await expect(page.locator('#region option')).not.toHaveCount(1);
    await expect(page.locator('#region')).toBeEnabled();
    await page.locator('#country').selectOption('SG');
    await expect(page.locator('#region')).toBeDisabled();
    await expect(page).toHaveURL(/country=SG/);
  });
});

test.describe('start date, working hours and counting note', () => {
  test('include start date toggle changes the count, note and URL', async ({ page }) => {
    // Mon 19 to Fri 23 Oct 2026
    await page.goto('/?mode=between&start=2026-10-19&end=2026-10-23&country=none');
    const note = page.locator('#result-note');
    await expect(result(page)).toHaveText('4 working days');
    await expect(page.getByLabel('Include the start date in the count')).toBeChecked();
    await expect(note).toContainText('Mon to Fri = 4 days (Mon–Thu)');

    await page.getByLabel('Include the end date in the count').check();
    await expect(result(page)).toHaveText('5 working days');
    await expect(note).toHaveText('Both dates are counted: Mon to Fri, both dates included = 5 days.');
    await expect(page.locator('#result-sub')).toContainText('including both dates');

    await page.getByLabel('Include the start date in the count').uncheck();
    await expect(result(page)).toHaveText('4 working days');
    await expect(note).toContainText('(Tue–Fri)');
    await expect(page).toHaveURL(/incs=0/);

    await page.getByLabel('Include the end date in the count').uncheck();
    await expect(result(page)).toHaveText('3 working days');
    await expect(note).toContainText('3 days (Tue–Thu)');

    await page.reload();
    await expect(result(page)).toHaveText('3 working days');
    await expect(page.getByLabel('Include the start date in the count')).not.toBeChecked();
  });

  test('working hours use hours per day, decimals allowed, stored in the URL', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-10-19&end=2026-10-26&country=none');
    await expect(stat(page, 'hours')).toHaveText('40');
    await page.getByLabel('Hours per working day').fill('7.5');
    await expect(stat(page, 'hours')).toHaveText('37.5');
    await expect(page.locator('#hours-per-day')).toHaveText('(7.5 h/day)');
    await expect(page).toHaveURL(/hours=7\.5/);
    await page.getByLabel('Hours per working day').fill('0');
    await expect(page.locator('#result-sub')).toContainText('hours in a working day');
    await page.getByLabel('Hours per working day').fill('8');
    await expect(stat(page, 'hours')).toHaveText('40');
    await expect(page).not.toHaveURL(/hours=/);
  });

  test('add mode shows hours and a note that the start date is not counted', async ({ page }) => {
    await page.goto('/?mode=add&start=2026-10-23&days=3&country=none&hours=6');
    await expect(result(page)).toHaveText(/28 Oct 2026/);
    await expect(stat(page, 'hours')).toHaveText('18');
    await expect(page.locator('#result-note')).toContainText('start date isn’t counted');
  });
});

test.describe('working days in a year', () => {
  test('monthly table follows country, region, weekend, hours and year', async ({ page }) => {
    const thisYear = new Date().getFullYear();
    await page.goto('/?mode=between&start=2026-12-01&end=2026-12-31&country=GB&region=ENG');
    const table = page.locator('#year');
    const total = page.locator('#year-total td');
    await expect(page.locator('#year-select option')).toHaveCount(5);
    await expect(page.locator('#year-select')).toHaveValue(String(thisYear));
    await expect(page.locator('#year-select option').first()).toHaveText(String(thisYear - 2));

    await page.locator('#year-select').selectOption('2026');
    await expect(table.getByRole('heading', { level: 2 })).toHaveText('Working days in 2026');
    await expect(page.locator('#year-body tr')).toHaveCount(12);
    await expect(total.nth(0)).toHaveText('365');
    await expect(total.nth(3)).toHaveText('253');
    await expect(total.nth(4)).toHaveText('2,024');
    // December: 31 days, 8 weekend days, Christmas Day and the Boxing Day substitute.
    await expect(page.locator('#year-body tr').nth(11).locator('td')).toHaveText(['31', '8', '2', '21', '168']);
    await expect(page.locator('#year-settings')).toContainText('United Kingdom (England)');

    // Scotland adds 2 January and St Andrew's Day (30 Nov 2026) but not Easter Monday.
    await page.locator('#region').selectOption('SCT');
    await expect(total.nth(3)).toHaveText('252');
    await page.locator('#weekend').selectOption('sun');
    await expect(total.nth(1)).toHaveText('52');
    await page.getByLabel('Hours per working day').fill('7.5');
    await expect(page.locator('#year-body tr').first().locator('td').nth(4)).not.toHaveText('–');
    await page.locator('#country').selectOption('none');
    await expect(total.nth(2)).toHaveText('0');
    await expect(total.nth(3)).toHaveText('313');
  });
});

test.describe('more countries', () => {
  for (const [code, name, region] of [
    ['NL', 'Netherlands', ''],
    ['CH', 'Switzerland', 'ZH'],
    ['MY', 'Malaysia', ''],
    ['PK', 'Pakistan', ''],
    ['KE', 'Kenya', ''],
  ]) {
    test(`${name} loads holidays`, async ({ page }) => {
      await page.goto(`/?mode=between&start=2026-01-01&end=2026-12-31&inc=1&country=${code}${region ? `&region=${region}` : ''}`);
      await expect(page.locator('#country')).toHaveValue(code);
      await expect(page.locator('#hol-list input[data-holiday]').first()).toBeVisible();
      await expect(result(page)).toHaveText(/working days$/);
    });
  }
});

test.describe('add or subtract working days', () => {
  test('adds working days over holidays', async ({ page }) => {
    await page.goto('/?mode=add&start=2026-12-18&days=10&country=GB&region=ENG&weekend=sat-sun');
    await expect(result(page)).toHaveText(/6 Jan 2027/);
    await expect(page.locator('#result-sub')).toContainText('10 working days after');
    await expect(stat(page, 'total')).toHaveText('19');
  });

  test('switching mode and subtracting updates the URL', async ({ page }) => {
    await page.goto('/?mode=between&start=2026-10-26&end=2026-11-26&country=none');
    await page.locator('label.mode-option', { hasText: 'Add or subtract days' }).click();
    await expect(page.locator('#days')).toBeVisible();
    await expect(page.locator('#end')).toBeHidden();
    await page.locator('#op').selectOption('subtract');
    await page.locator('#days').fill('1');
    await expect(result(page)).toHaveText(/23 Oct 2026/);
    await expect(page).toHaveURL(/mode=add/);
    await expect(page).toHaveURL(/op=subtract/);
    await expect(page).toHaveURL(/days=1/);
  });

  test('rejects invalid numbers with a clear message', async ({ page }) => {
    await page.goto('/?mode=add&start=2026-10-26&days=5&country=none');
    await page.locator('#days').fill('20000');
    await expect(page.locator('#result-sub')).toContainText('whole number of working days');
    await expect(page.getByRole('button', { name: 'Copy result' })).toBeDisabled();
  });
});

test('copy result puts a summary and share link on the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?mode=between&start=2026-10-19&end=2026-10-26&country=none');
  await expect(result(page)).toHaveText('5 working days');
  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect(page.locator('#copy-status')).toHaveText('Result copied');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('5 working days between');
  expect(text).toMatch(/\?mode=between&start=2026-10-19&end=2026-10-26/);
});

test('result is above the fold on mobile', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, baseURL, locale: 'en-GB' });
  const page = await ctx.newPage();
  await page.goto('/?mode=between&start=2026-10-19&end=2026-10-26&country=none');
  await expect(result(page)).toHaveText('5 working days');
  const box = await result(page).boundingBox();
  expect(box!.y + box!.height).toBeLessThan(844);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, 'no horizontal scroll').toBeLessThanOrEqual(390);
  await ctx.close();
});

test('theme toggle switches and remembers the theme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('keyboard users can reach and operate the calculator', async ({ page }) => {
  await page.goto('/?mode=between&start=2026-10-19&end=2026-10-26&country=none');
  await page.locator('input[name="mode"][value="between"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('input[name="mode"][value="add"]')).toBeChecked();
  await expect(page.locator('#days')).toBeVisible();
});
