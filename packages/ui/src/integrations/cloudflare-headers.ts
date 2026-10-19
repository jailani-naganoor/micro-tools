// Astro integration that writes dist/_headers (Cloudflare Pages) and, when an AdSense
// publisher ID is set, dist/ads.txt. Generating them at build time keeps the CSP in step
// with the PUBLIC_* flags: nothing external is allowed unless a flag turns it on.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { describeFlag, getEnv } from '../lib/env';

export interface HeadersOptions {
  /** Permissions-Policy value for this site. */
  permissionsPolicy: string;
}

const ADSENSE_SOURCES = {
  script: [
    'https://pagead2.googlesyndication.com',
    'https://*.googlesyndication.com',
    'https://*.adtrafficquality.google',
    'https://fundingchoicesmessages.google.com',
    'https://www.googletagservices.com',
  ],
  frame: [
    'https://googleads.g.doubleclick.net',
    'https://*.googlesyndication.com',
    'https://*.doubleclick.net',
    'https://www.google.com',
    'https://*.adtrafficquality.google',
    'https://fundingchoicesmessages.google.com',
  ],
  connect: [
    'https://*.googlesyndication.com',
    'https://*.doubleclick.net',
    'https://*.google.com',
    'https://*.adtrafficquality.google',
    'https://fundingchoicesmessages.google.com',
  ],
  img: ['https:'],
};

const CF_ANALYTICS = {
  script: ['https://static.cloudflareinsights.com'],
  connect: ['https://cloudflareinsights.com'],
};

export function buildCsp(opts: { ads: boolean; analytics: boolean }): string {
  const script = ["'self'"];
  const connect = ["'self'"];
  const frame: string[] = [];
  const img = ["'self'", 'data:', 'blob:'];
  if (opts.ads) {
    script.push(...ADSENSE_SOURCES.script);
    connect.push(...ADSENSE_SOURCES.connect);
    frame.push(...ADSENSE_SOURCES.frame);
    img.push(...ADSENSE_SOURCES.img);
  }
  if (opts.analytics) {
    script.push(...CF_ANALYTICS.script);
    connect.push(...CF_ANALYTICS.connect);
  }
  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    // Inline styles: Astro inlines the page stylesheet; AdSense also injects inline styles.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(' ')}`,
    "media-src 'self' blob: mediastream:",
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    `frame-src ${frame.length ? frame.join(' ') : "'none'"}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function headersFile(opts: { ads: boolean; analytics: boolean; permissionsPolicy: string }): string {
  const adsCsp = buildCsp({ ads: true, analytics: opts.analytics });
  return `# Generated at build time by packages/ui/src/integrations/cloudflare-headers.ts.
# Do not edit dist/_headers by hand; change the integration or the PUBLIC_* env flags.
#
# Current build: ads ${opts.ads ? 'ON' : 'OFF'}, Cloudflare Web Analytics ${opts.analytics ? 'ON' : 'OFF'}.
# With PUBLIC_ADS_ENABLED=true the CSP below automatically gains the AdSense sources:
#   ${adsCsp}
# AdSense loads scripts from changing Google domains; check the browser console for CSP
# errors after enabling ads and add any newly required sources in the integration.

/*
  Content-Security-Policy: ${buildCsp(opts)}
  Permissions-Policy: ${opts.permissionsPolicy}
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/*.png
  Cache-Control: public, max-age=86400
/*.svg
  Cache-Control: public, max-age=86400
/*.ico
  Cache-Control: public, max-age=86400
/head.js
  Cache-Control: public, max-age=3600

# Keep *.pages.dev preview and production aliases out of search results (duplicate content).
https://:project.pages.dev/*
  X-Robots-Tag: noindex
https://:version.:project.pages.dev/*
  X-Robots-Tag: noindex
`;
}

export default function cloudflareHeaders(options: HeadersOptions): AstroIntegration {
  return {
    name: 'micro-cloudflare-headers',
    hooks: {
      'astro:build:start': ({ logger }) => {
        // Say in the build log whether drafts are included, so a hosting dashboard variable
        // that didn't reach the build (or has an unexpected value) is easy to spot.
        const drafts = describeFlag('SHOW_DRAFTS');
        const where = process.env.CF_PAGES_BRANCH ? ` [Cloudflare Pages branch ${process.env.CF_PAGES_BRANCH}]` : '';
        const line = `${drafts.message} → blog drafts ${drafts.on ? 'included' : 'hidden'}${where}`;
        if (drafts.warn) logger.warn(line);
        else logger.info(line);
      },
      'astro:build:done': ({ dir, logger }) => {
        const env = getEnv('');
        const ads = env.adsEnabled;
        const analytics = env.cfAnalyticsToken !== '';
        const out = fileURLToPath(dir);
        writeFileSync(
          `${out}/_headers`,
          headersFile({ ads, analytics, permissionsPolicy: options.permissionsPolicy }),
        );
        const client = env.adsenseClient;
        if (client) {
          // AdSense publisher IDs look like ca-pub-123…; ads.txt uses the pub-123… part.
          const pub = client.replace(/^ca-/, '');
          writeFileSync(`${out}/ads.txt`, `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`);
        }
        logger.info(
          `wrote _headers (ads ${ads ? 'on' : 'off'}, analytics ${analytics ? 'on' : 'off'}, drafts ${env.showDrafts ? 'shown' : 'hidden'})`,
        );
      },
    },
  };
}
