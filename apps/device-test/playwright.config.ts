import { devices } from '@playwright/test';
import { sitePlaywrightConfig } from '@micro/ui/testing/playwright';

const desktop = devices['Desktop Chrome'];

export default sitePlaywrightConfig({
  port: 4402,
  projects: [
    {
      // Fake camera/microphone, permission granted.
      name: 'media-allowed',
      testIgnore: /denied\.spec\.ts/,
      use: {
        ...desktop,
        permissions: ['camera', 'microphone'],
        launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
      },
    },
    {
      // Fake devices exist but access is denied. Headless Chromium cannot produce a real
      // "blocked" answer (--deny-permission-prompts yields NotSupportedError and new headless
      // waits on the prompt), so denied.spec.ts makes getUserMedia reject with the
      // NotAllowedError browsers return when the user or system blocks access.
      name: 'media-denied',
      testMatch: /denied\.spec\.ts/,
      use: {
        ...desktop,
        launchOptions: { args: ['--use-fake-device-for-media-stream'] },
      },
    },
  ],
});
