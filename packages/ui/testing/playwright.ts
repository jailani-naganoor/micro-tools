// Shared Playwright config: builds the app with ads/analytics off and serves the static
// output with `astro preview`. Uses the Chromium that matches @playwright/test.
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

export function sitePlaywrightConfig(opts: { port: number; projects?: PlaywrightTestConfig['projects'] }) {
  const baseURL = `http://localhost:${opts.port}`;
  return defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
    use: {
      baseURL,
      locale: 'en-GB',
      timezoneId: 'Europe/London',
      trace: 'retain-on-failure',
    },
    projects: opts.projects ?? [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
      command: `npm run build && npx astro preview --ignore-lock --port ${opts.port}`,
      url: baseURL,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        PUBLIC_ADS_ENABLED: 'false',
        PUBLIC_ADSENSE_CLIENT: '',
        PUBLIC_CF_ANALYTICS_TOKEN: '',
        SHOW_DRAFTS: 'false',
      },
    },
  });
}
