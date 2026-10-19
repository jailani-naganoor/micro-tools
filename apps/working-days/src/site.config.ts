import { getEnv } from '@micro/ui/lib/env';
import type { SiteConfig } from '@micro/ui/lib/types';

const env = getEnv('https://working-days.example.com');

export const site: SiteConfig = {
  id: 'working-days',
  name: 'Working Days Calculator',
  publisher: env.publisherName,
  description:
    'Free working days calculator: count business days between two dates or add business days to a date, with public holidays for 41 countries.',
  keyword: 'Working Days Calculator',
  themeColor: { light: '#ffffff', dark: '#101317' },
  sibling: {
    name: 'Mic, Webcam, Keyboard & Dead Pixel Test',
    url: env.deviceTestUrl,
    blurb: 'check your microphone, webcam, keyboard and screen in the browser.',
  },
  env,
};
