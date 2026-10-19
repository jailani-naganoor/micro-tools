import { getEnv } from '@micro/ui/lib/env';
import type { SiteConfig } from '@micro/ui/lib/types';

const env = getEnv('https://device-test.example.com');

export const site: SiteConfig = {
  id: 'device-test',
  name: 'Device Test',
  publisher: env.publisherName,
  description:
    'Free online mic, webcam, speaker, keyboard and dead pixel tests, plus a stuck pixel fixer. Runs in your browser: audio and video never leave your device.',
  keyword: 'Online Mic, Webcam, Speaker, Keyboard & Dead Pixel Test',
  themeColor: { light: '#ffffff', dark: '#101317' },
  sibling: {
    name: 'Working Days Calculator',
    url: env.workingDaysUrl,
    blurb: 'count business days between dates or add business days, with public holidays.',
  },
  env,
};
