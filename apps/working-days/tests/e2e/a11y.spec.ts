import { test, expectAccessible } from '@micro/ui/testing/fixtures';

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });
    for (const path of [
      '/?mode=between&start=2026-12-01&end=2026-12-31&country=GB&region=SCT&off=2026-12-24',
      '/?mode=add&start=2026-12-18&days=10&country=US&hours=7.5',
      '/?mode=between&start=2026-10-19&end=2026-10-23&incs=0&country=CH&region=ZH',
      '/about/',
      '/privacy/',
      '/blog/',
      '/blog/how-to-add-business-days-to-a-date/',
      '/does-not-exist/',
    ]) {
      test(`no WCAG A/AA violations on ${path}`, async ({ page, guard }) => {
        if (path.startsWith('/does')) guard.allowErrors();
        await page.goto(path);
        await page.locator('html[data-theme]').waitFor();
        await page.waitForLoadState('networkidle');
        await expectAccessible(page, `${colorScheme} ${path}`);
      });
    }
  });
}
