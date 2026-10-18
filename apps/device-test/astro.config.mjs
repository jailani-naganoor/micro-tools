// @ts-check
import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflareHeaders from '@micro/ui/integrations/cloudflare-headers.ts';

// Load .env into process.env so build-time code (packages/ui/src/lib/env.ts) can read it.
// Variables already set in the environment (e.g. Cloudflare Pages settings) take precedence.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  site: (process.env.SITE_URL || 'https://device-test.example.com').replace(/\/+$/, ''),
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Inline the (small) stylesheet to avoid a render-blocking request.
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
  integrations: [
    cloudflareHeaders({
      permissionsPolicy: 'camera=(self), microphone=(self), fullscreen=(self), geolocation=(), payment=(), usb=(), browsing-topics=()',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Keep scripts as external files so the CSP can stay script-src 'self'.
    build: { assetsInlineLimit: 0 },
  },
});
