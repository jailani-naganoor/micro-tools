import { getEnv } from '@micro/ui/lib/env';
import type { SiteConfig } from '@micro/ui/lib/types';

const env = getEnv('https://device-test.example.com');

export const site: SiteConfig = {
  id: 'device-test',
  name: 'Device Test',
  publisher: env.publisherName,
  description:
    'Free online mic test, webcam test, keyboard test and dead pixel test. Runs in your browser — audio and video never leave your device.',
  keyword: 'Online Mic, Webcam, Keyboard & Dead Pixel Test',
  themeColor: { light: '#ffffff', dark: '#101317' },
  sibling: {
    name: 'Working Days Calculator',
    url: env.workingDaysUrl,
    blurb: 'count business days between dates or add business days, with public holidays.',
  },
  env,
};
