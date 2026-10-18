// Build-time environment access. Static pages are rendered in Node, so we read
// process.env (populated from .env files by each app's astro.config.mjs).

function read(name: string): string {
  return (process.env[name] ?? '').trim();
}

function flag(name: string): boolean {
  return /^(1|true|yes)$/i.test(read(name));
}

function url(name: string, fallback: string): string {
  return (read(name) || fallback).replace(/\/+$/, '');
}

export interface Env {
  siteUrl: string;
  communityUrl: string;
  workingDaysUrl: string;
  deviceTestUrl: string;
  contactEmail: string;
  publisherName: string;
  showDrafts: boolean;
  adsEnabled: boolean;
  adsenseClient: string;
  adSlots: { result: string; content: string; sidebar: string };
  cfAnalyticsToken: string;
}

export function getEnv(defaultSiteUrl: string): Env {
  const adsenseClient = read('PUBLIC_ADSENSE_CLIENT');
  return {
    siteUrl: url('SITE_URL', defaultSiteUrl),
    communityUrl: url('COMMUNITY_URL', 'https://community.example.com'),
    workingDaysUrl: url('WORKING_DAYS_URL', 'https://working-days.example.com'),
    deviceTestUrl: url('DEVICE_TEST_URL', 'https://device-test.example.com'),
    contactEmail: read('CONTACT_EMAIL') || 'hello@example.com',
    publisherName: read('PUBLISHER_NAME') || 'Micro Tools',
    showDrafts: flag('SHOW_DRAFTS'),
    // Ads need both the flag and a publisher ID; otherwise nothing ad-related renders.
    adsEnabled: flag('PUBLIC_ADS_ENABLED') && adsenseClient !== '',
    adsenseClient,
    adSlots: {
      result: read('PUBLIC_ADSENSE_SLOT_RESULT'),
      content: read('PUBLIC_ADSENSE_SLOT_CONTENT'),
      sidebar: read('PUBLIC_ADSENSE_SLOT_SIDEBAR'),
    },
    cfAnalyticsToken: read('PUBLIC_CF_ANALYTICS_TOKEN'),
  };
}
