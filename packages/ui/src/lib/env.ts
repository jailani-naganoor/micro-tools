// Build-time environment access. Static pages are rendered in Node, so we read
// process.env (populated from .env files by each app's astro.config.mjs).

function read(name: string): string {
  return unquote(process.env[name] ?? '');
}

/**
 * Trim whitespace and one pair of surrounding quotes. Dashboards such as Cloudflare Pages
 * store a value typed as "true" (with the quotes) literally, unlike a .env file.
 */
export function unquote(value: string): string {
  const v = value.trim();
  return /^(["'])(.*)\1$/.test(v) ? v.slice(1, -1).trim() : v;
}

/** On/off flag: 1, true, yes or on (any case, optionally quoted) means on. */
export function parseFlag(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(unquote(value ?? ''));
}

function flag(name: string): boolean {
  return parseFlag(process.env[name]);
}

/**
 * One line for the build log saying what a flag was set to and how it was read, so a
 * hosting build log shows whether a dashboard variable reached the build.
 */
export function describeFlag(name: string): { on: boolean; message: string; warn: boolean } {
  const raw = process.env[name];
  const on = parseFlag(raw);
  if (raw === undefined) return { on, message: `${name} is not set: off`, warn: false };
  const known = on || /^(0|false|no|off|)$/i.test(unquote(raw));
  return {
    on,
    message: `${name}=${JSON.stringify(raw)}: ${on ? 'on' : 'off'}${known ? '' : ' (not recognised; use true or false)'}`,
    warn: !known,
  };
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
